import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const { action } = body; // "approve" | "reject"

    if (action === "approve") {
      const booking = await db.approveBooking(id);
      return NextResponse.json({
        success: true,
        booking,
        message: "อนุมัติการจองเรียบร้อยแล้วและเพิ่มแต้มสะสมให้สมาชิกแล้ว",
      });
    } else if (action === "reject") {
      const booking = await db.rejectBooking(id);
      return NextResponse.json({
        success: true,
        booking,
        message: "ปฏิเสธการจองแล้วและคืนช่วงเวลาให้ระบบทันที",
      });
    }

    return NextResponse.json({ error: "การกระทำไม่ถูกต้อง (ต้องเป็น approve หรือ reject)" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}
