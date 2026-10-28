import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isDateInActiveWeek } from "@/lib/week";
import {
  calculateBookingFinances,
  HOLD_EXPIRATION_MINUTES,
  validateSlotSelection,
} from "@/lib/schedule-rules";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดูรายการจอง" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filterUserOnly = searchParams.get("mine") === "true";

    // If admin and not mine only, return all bookings; else return user's bookings
    const bookings =
      user.role === "ADMIN" && !filterUserOnly
        ? await db.getBookings()
        : await db.getBookings({ userId: user.id });

    return NextResponse.json({ bookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำการจอง" }, { status: 401 });
    }

    const body = await req.json();
    const { date, selectedSlots, usePoints } = body;

    // Validate that the date is within the currently open active week
    if (!isDateInActiveWeek(date)) {
      return NextResponse.json(
        { error: "สามารถจองได้เฉพาะวันในสัปดาห์ที่เปิดให้จองเท่านั้น (สัปดาห์ใหม่จะเปิดให้จองทุกวันอาทิตย์ เวลา 12:00 น.)" },
        { status: 400 }
      );
    }

    // Validate slots
    const validation = validateSlotSelection(date, selectedSlots);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Refresh latest user points from DB
    const freshUser = await db.getUser(user.id);
    const userPoints = freshUser?.points || 0;

    // Calculate finances
    const finances = calculateBookingFinances(
      validation.slotsCount!,
      Boolean(usePoints),
      userPoints
    );

    // Expiration date for 15-minute hold
    const expiresAt = new Date(Date.now() + HOLD_EXPIRATION_MINUTES * 60 * 1000).toISOString();

    const booking = await db.createBooking({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      date,
      startTime: validation.startTime!,
      endTime: validation.endTime!,
      slots: validation.slots!,
      slotsCount: validation.slotsCount!,
      totalAmount: finances.totalAmount,
      discountAmount: finances.discountAmount,
      netAmount: finances.netAmount,
      pointsUsed: finances.pointsUsed,
      pointsEarned: finances.pointsEarned,
      status: "PENDING",
      slipUrl: null,
      expiresAt,
    });

    const settings = await db.getSettings();

    return NextResponse.json({
      success: true,
      booking,
      paymentInfo: {
        promptPayNumber: settings.promptPayNumber,
        promptPayName: settings.promptPayName,
        bankName: settings.bankName,
        netAmount: booking.netAmount,
        expiresAt: booking.expiresAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
