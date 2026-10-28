import { cookies } from "next/headers";
import { db } from "./db";
import { User } from "./types";

const SESSION_COOKIE_NAME = "music_room_session";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionVal = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionVal) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(sessionVal));
    if (!parsed.email) return null;
    const user = await db.getUser(parsed.email);
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin privileges required");
  }
  return user;
}
