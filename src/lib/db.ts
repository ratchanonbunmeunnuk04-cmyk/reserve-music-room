import { promises as fs } from "fs";
import path from "path";
import { Booking, ClubSettings, User } from "./types";

interface DatabaseSchema {
  settings: ClubSettings;
  users: User[];
  bookings: Booking[];
}

// ponytail: on Vercel serverless, filesystem is read-only except /tmp; fallback to seed in data/db.json
const isVercel = Boolean(process.env.VERCEL);
const DB_PATH = isVercel ? path.join("/tmp", "db.json") : path.join(process.cwd(), "data", "db.json");
const SEED_PATH = path.join(process.cwd(), "data", "db.json");

const DEFAULT_SETTINGS: ClubSettings = {
  clubName: "ชมรมดนตรีสากล มหาวิทยาลัยศิลปากร",
  universityName: "Silpakorn University",
  roomName: "ห้องซ้อมดนตรีสากล",
  hourlyRate: 140,
  slotRate: 70,
  promptPayNumber: "004999206966128",
  promptPayName: "นาย รัชชานนท์ บุญเหมือนนึก และ น.ส. อนัญญา ขวาเมือ",
  bankName: "ธนาคารกสิกรไทย (KBank) / พร้อมเพย์",
  adminEmails: ["admin@su.ac.th", "music.club@su.ac.th", "staff@su.ac.th"],
};

const DEFAULT_USERS: User[] = [
  {
    id: "demo-student-1",
    name: "ธนภัทร วงศ์เจริญ",
    email: "student@su.ac.th",
    role: "USER",
    points: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-admin-1",
    name: "อาจารย์ / แอดมินชมรมดนตรี",
    email: "admin@su.ac.th",
    role: "ADMIN",
    points: 12,
    createdAt: new Date().toISOString(),
  },
];

async function ensureDb(): Promise<DatabaseSchema> {
  const dir = path.dirname(DB_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}

  try {
    const data = await fs.readFile(DB_PATH, "utf-8");
    const parsed = JSON.parse(data) as DatabaseSchema;
    return parsed;
  } catch {
    // If on Vercel, try loading initial seed data from project repo
    let seedData: DatabaseSchema = {
      settings: DEFAULT_SETTINGS,
      users: DEFAULT_USERS,
      bookings: [],
    };

    if (isVercel) {
      try {
        const raw = await fs.readFile(SEED_PATH, "utf-8");
        seedData = JSON.parse(raw);
      } catch {}
    }

    try {
      await fs.writeFile(DB_PATH, JSON.stringify(seedData, null, 2), "utf-8");
    } catch {}
    return seedData;
  }
}

async function writeDb(data: DatabaseSchema): Promise<void> {
  const tempPath = `${DB_PATH}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
  await fs.rename(tempPath, DB_PATH);
}

/**
 * Automatically cleans up expired pending holds that haven't uploaded a slip
 */
function cleanupExpired(data: DatabaseSchema): boolean {
  const now = new Date();
  let changed = false;
  for (const b of data.bookings) {
    if (b.status === "PENDING" && !b.slipUrl) {
      const exp = new Date(b.expiresAt);
      if (exp < now) {
        b.status = "CANCELLED";
        changed = true;
      }
    }
  }
  return changed;
}

export const db = {
  async getSettings(): Promise<ClubSettings> {
    const data = await ensureDb();
    return data.settings;
  },

  async getUsers(): Promise<User[]> {
    const data = await ensureDb();
    return data.users;
  },

  async getUser(idOrEmail: string): Promise<User | null> {
    const data = await ensureDb();
    const user = data.users.find((u) => u.id === idOrEmail || u.email.toLowerCase() === idOrEmail.toLowerCase());
    return user || null;
  },

  async upsertUser(user: Partial<User> & { email: string; name: string }): Promise<User> {
    const data = await ensureDb();
    const existingIndex = data.users.findIndex((u) => u.email.toLowerCase() === user.email.toLowerCase());
    const isAdmin = data.settings.adminEmails.some((e) => e.toLowerCase() === user.email.toLowerCase());

    if (existingIndex >= 0) {
      data.users[existingIndex] = {
        ...data.users[existingIndex],
        ...user,
        role: isAdmin ? "ADMIN" : data.users[existingIndex].role || "USER",
      };
      await writeDb(data);
      return data.users[existingIndex];
    } else {
      const newUser: User = {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: user.name,
        email: user.email,
        image: user.image,
        role: isAdmin ? "ADMIN" : "USER",
        points: user.points ?? 0,
        createdAt: new Date().toISOString(),
      };
      data.users.push(newUser);
      await writeDb(data);
      return newUser;
    }
  },

  async updateUserPoints(userId: string, pointsDelta: number): Promise<number> {
    const data = await ensureDb();
    const user = data.users.find((u) => u.id === userId);
    if (!user) throw new Error("User not found");
    user.points = Math.max(0, (user.points || 0) + pointsDelta);
    await writeDb(data);
    return user.points;
  },

  async getBookings(options?: { date?: string; userId?: string; status?: string }): Promise<Booking[]> {
    const data = await ensureDb();
    if (cleanupExpired(data)) {
      await writeDb(data);
    }

    let result = [...data.bookings];
    if (options?.date) {
      result = result.filter((b) => b.date === options.date && b.status !== "CANCELLED" && b.status !== "REJECTED");
    }
    if (options?.userId) {
      result = result.filter((b) => b.userId === options.userId);
    }
    if (options?.status) {
      result = result.filter((b) => b.status === options.status);
    }

    // Sort newest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getBookingById(id: string): Promise<Booking | null> {
    const data = await ensureDb();
    if (cleanupExpired(data)) {
      await writeDb(data);
    }
    return data.bookings.find((b) => b.id === id) || null;
  },

  async createBooking(booking: Omit<Booking, "id" | "createdAt" | "updatedAt">): Promise<Booking> {
    const data = await ensureDb();
    if (cleanupExpired(data)) {
      await writeDb(data);
    }

    // Check conflict for same date & overlapping slots
    const conflict = data.bookings.some(
      (b) =>
        b.date === booking.date &&
        (b.status === "CONFIRMED" || b.status === "PENDING") &&
        b.slots.some((s) => booking.slots.includes(s))
    );

    if (conflict) {
      throw new Error("มีช่วงเวลาที่คุณเลือกถูกจองหรือกำลังทำรายการอยู่แล้ว กรุณาเลือกช่วงเวลาอื่น");
    }

    const newBooking: Booking = {
      ...booking,
      id: `bk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If points were used, deduct them immediately (will be restored if cancelled/rejected)
    if (newBooking.pointsUsed > 0) {
      const user = data.users.find((u) => u.id === newBooking.userId);
      if (user) {
        user.points = Math.max(0, (user.points || 0) - newBooking.pointsUsed);
      }
    }

    data.bookings.push(newBooking);
    await writeDb(data);
    return newBooking;
  },

  async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    const data = await ensureDb();
    const index = data.bookings.findIndex((b) => b.id === id);
    if (index === 0 && data.bookings.length === 0) throw new Error("Booking not found");
    if (index === -1) throw new Error("Booking not found");

    data.bookings[index] = {
      ...data.bookings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await writeDb(data);
    return data.bookings[index];
  },

  async approveBooking(id: string): Promise<Booking> {
    const data = await ensureDb();
    const booking = data.bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");
    if (booking.status === "CONFIRMED") return booking;

    booking.status = "CONFIRMED";
    booking.updatedAt = new Date().toISOString();

    // Award loyalty points to user
    if (booking.pointsEarned > 0) {
      const user = data.users.find((u) => u.id === booking.userId);
      if (user) {
        user.points = (user.points || 0) + booking.pointsEarned;
      }
    }

    await writeDb(data);
    return booking;
  },

  async rejectBooking(id: string): Promise<Booking> {
    const data = await ensureDb();
    const booking = data.bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found");

    booking.status = "REJECTED";
    booking.updatedAt = new Date().toISOString();

    // Refund points if used
    if (booking.pointsUsed > 0) {
      const user = data.users.find((u) => u.id === booking.userId);
      if (user) {
        user.points = (user.points || 0) + booking.pointsUsed;
      }
    }

    await writeDb(data);
    return booking;
  },

  async getAdminEmails(): Promise<string[]> {
    const data = await ensureDb();
    return data.settings.adminEmails || [];
  },

  async addAdminEmail(newEmail: string): Promise<string[]> {
    const data = await ensureDb();
    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("รูปแบบอีเมลไม่ถูกต้อง");
    }
    if (!data.settings.adminEmails) {
      data.settings.adminEmails = [];
    }
    if (data.settings.adminEmails.some((e) => e.toLowerCase() === cleanEmail)) {
      throw new Error("อีเมลนี้มีสิทธิ์แอดมินอยู่แล้ว");
    }
    data.settings.adminEmails.push(cleanEmail);

    // Update existing user role if already registered
    const user = data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (user) {
      user.role = "ADMIN";
    }

    await writeDb(data);
    return data.settings.adminEmails;
  },

  async removeAdminEmail(emailToRemove: string, currentAdminEmail: string): Promise<string[]> {
    const data = await ensureDb();
    const cleanEmail = emailToRemove.trim().toLowerCase();
    const cleanCurrent = currentAdminEmail.trim().toLowerCase();

    if (cleanEmail === cleanCurrent) {
      throw new Error("ไม่อนุญาตให้ลบสิทธิ์แอดมินของตนเอง");
    }
    if (!data.settings.adminEmails || data.settings.adminEmails.length <= 1) {
      throw new Error("ต้องมีแอดมินอย่างน้อย 1 คนในระบบเสมอ");
    }

    data.settings.adminEmails = data.settings.adminEmails.filter(
      (e) => e.toLowerCase() !== cleanEmail
    );

    // Update existing user role to USER
    const user = data.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (user) {
      user.role = "USER";
    }

    await writeDb(data);
    return data.settings.adminEmails;
  },
};

