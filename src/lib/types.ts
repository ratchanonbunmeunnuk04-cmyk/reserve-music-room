export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: Role;
  points: number;
  createdAt: string;
}

export type BookingStatus = "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELLED";

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  slots: string[]; // ["17:00", "17:30"]
  slotsCount: number; // 2 slots = 1 hour
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  pointsUsed: number; // 0 or 10
  pointsEarned: number; // 1 pt per full paid hour
  status: BookingStatus;
  slipUrl?: string | null;
  expiresAt: string; // ISO date string (15 mins hold)
  createdAt: string;
  updatedAt: string;
}

export interface ClubSettings {
  clubName: string;
  universityName: string;
  roomName: string;
  hourlyRate: number;
  slotRate: number;
  promptPayNumber: string;
  promptPayName: string;
  bankName: string;
  adminEmails: string[];
}

export interface TimeSlot {
  time: string; // e.g. "17:00"
  endTime: string; // e.g. "17:30"
  status: "AVAILABLE" | "PENDING" | "CONFIRMED" | "CLOSED";
  bookingId?: string;
  userName?: string;
  isMyBooking?: boolean;
}
