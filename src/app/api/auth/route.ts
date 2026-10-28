import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const SESSION_COOKIE = "music_room_session";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const settings = await db.getSettings();
    return NextResponse.json({
      user,
      settings: {
        clubName: settings.clubName,
        roomName: settings.roomName,
        hourlyRate: settings.hourlyRate,
        slotRate: settings.slotRate,
        promptPayNumber: settings.promptPayNumber,
        promptPayName: settings.promptPayName,
        bankName: settings.bankName,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, name, image, role } = body;
    const cookieStore = await cookies();

    if (action === "logout") {
      cookieStore.delete(SESSION_COOKIE);
      return NextResponse.json({ success: true, user: null });
    }

    if (action === "login" || action === "google-login") {
      if (!email || !name) {
        return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
      }

      // Check if user exists or create new
      let user = await db.getUser(email);
      if (!user) {
        user = await db.upsertUser({
          email,
          name,
          image,
          role: role || "USER",
          points: 0,
        });
      }

      // Set cookie session (7 days)
      cookieStore.set(
        SESSION_COOKIE,
        encodeURIComponent(JSON.stringify({ id: user.id, email: user.email })),
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        }
      );

      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
