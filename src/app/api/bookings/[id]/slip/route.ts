import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนอัปโหลดสลิป" }, { status: 401 });
    }

    const { id } = await params;
    const booking = await db.getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "ไม่พบข้อมูลการจอง" }, { status: 404 });
    }

    if (booking.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ไขรายการจองนี้" }, { status: 403 });
    }

    const body = await req.json();
    const { slipUrl } = body;

    if (!slipUrl) {
      return NextResponse.json({ error: "กรุณาแนบรูปภาพสลิปการโอนเงิน" }, { status: 400 });
    }

    const updated = await db.updateBooking(id, {
      slipUrl,
      status: "PENDING",
    });

    return NextResponse.json({
      success: true,
      booking: updated,
      message: "อัปโหลดสลิปเรียบร้อยแล้ว รอผู้ดูแลระบบตรวจสอบและอนุมัติ",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
