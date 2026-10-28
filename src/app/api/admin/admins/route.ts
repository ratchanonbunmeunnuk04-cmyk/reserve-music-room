import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();
    const emails = await db.getAdminEmails();
    return NextResponse.json({ emails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "กรุณาระบุอีเมลแอดมิน" }, { status: 400 });
    }

    const updatedEmails = await db.addAdminEmail(email);
    return NextResponse.json({
      success: true,
      emails: updatedEmails,
      message: `เพิ่มสิทธิ์แอดมินให้ ${email} เรียบร้อยแล้ว`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentAdmin = await requireAdmin();
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "กรุณาระบุอีเมลที่ต้องการลบ" }, { status: 400 });
    }

    const updatedEmails = await db.removeAdminEmail(email, currentAdmin.email);
    return NextResponse.json({
      success: true,
      emails: updatedEmails,
      message: `ลบสิทธิ์แอดมินของ ${email} เรียบร้อยแล้ว`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
