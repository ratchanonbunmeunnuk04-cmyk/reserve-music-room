import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAvailableSlotsForDay } from "@/lib/schedule-rules";
import { TimeSlot } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Determine day of week
    const dateObj = new Date(dateStr + "T00:00:00");
    const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

    const standardSlots = getAvailableSlotsForDay(dayOfWeek);
    const user = await getCurrentUser();

    // Fetch active bookings for this date
    const bookings = await db.getBookings({ date: dateStr });

    const slots: TimeSlot[] = standardSlots.map((slot) => {
      // Find if this slot is covered by any active booking
      const matchingBooking = bookings.find((b) => b.slots.includes(slot.start));

      if (matchingBooking) {
        return {
          time: slot.start,
          endTime: slot.end,
          status: matchingBooking.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
          bookingId: matchingBooking.id,
          userName: matchingBooking.userName,
          isMyBooking: user ? matchingBooking.userId === user.id : false,
        };
      }

      return {
        time: slot.start,
        endTime: slot.end,
        status: "AVAILABLE",
      };
    });

    const isClosed = standardSlots.length === 0;

    return NextResponse.json({
      date: dateStr,
      dayOfWeek,
      isClosed,
      slots,
      dayName: getThaiDayName(dayOfWeek),
      operatingHours: isClosed
        ? "ปิดทำการ (เสาร์ - อาทิตย์)"
        : dayOfWeek === 1 || dayOfWeek === 3
        ? "19:30 - 21:30 น."
        : "17:00 - 21:30 น.",
      userPoints: user ? user.points : 0,
      currentUser: user,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getThaiDayName(day: number): string {
  const names = [
    "วันอาทิตย์ (Sunday)",
    "วันจันทร์ (Monday)",
    "วันอังคาร (Tuesday)",
    "วันพุธ (Wednesday)",
    "วันพฤหัสบดี (Thursday)",
    "วันศุกร์ (Friday)",
    "วันเสาร์ (Saturday)",
  ];
  return names[day] || "";
}
