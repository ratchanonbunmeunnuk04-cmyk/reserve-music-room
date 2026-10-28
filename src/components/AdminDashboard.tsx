"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  RefreshCw,
  AlertCircle,
  UserPlus,
  Trash2,
  Users,
  Mail,
  Shield,
} from "lucide-react";
import { Booking, User } from "@/lib/types";

interface AdminDashboardProps {
  user: User;
  onRefreshSchedule: () => void;
}

export function AdminDashboard({ user, onRefreshSchedule }: AdminDashboardProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<"slips" | "admins">("slips");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/admins");
      if (res.ok) {
        const data = await res.json();
        setAdminEmails(data.emails || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchAdmins();
  }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ดำเนินการไม่สำเร็จ");
      }

      setMessage({
        type: "success",
        text: action === "approve" ? "อนุมัติการจองและเพิ่มแต้มสะสมสำเร็จแล้ว" : "ปฏิเสธการจองและคืนช่วงเวลาแล้ว",
      });

      fetchBookings();
      onRefreshSchedule();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    setIsAddingAdmin(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newAdminEmail.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เพิ่มแอดมินไม่สำเร็จ");
      }

      setMessage({ type: "success", text: data.message });
      setNewAdminEmail("");
      fetchAdmins();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`คุณต้องการลบสิทธิ์แอดมินของ "${email}" ใช่หรือไม่?`)) return;
    setMessage(null);

    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ลบแอดมินไม่สำเร็จ");
      }

      setMessage({ type: "success", text: data.message });
      fetchAdmins();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "PENDING" && b.slipUrl);
  const otherBookings = bookings.filter((b) => !(b.status === "PENDING" && b.slipUrl));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0070ea] text-xs font-semibold border border-blue-200 mb-2">
              <ShieldCheck className="w-4 h-4 text-[#0070ea]" />
              <span>Admin Control Panel • สิทธิ์ผู้ดูแลระบบ</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ระบบจัดการสำหรับผู้ดูแลชมรม</h1>
            <p className="text-xs text-slate-500 mt-1">
              ชมรมดนตรีสากล มหาวิทยาลัยศิลปากร (SU BAND)
            </p>
          </div>

          <button
            onClick={() => {
              fetchBookings();
              fetchAdmins();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0070ea]" : ""}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        </div>

        {/* Admin Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setActiveAdminTab("slips")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeAdminTab === "slips"
                ? "bg-[#0070ea] text-white shadow-sm"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>ตรวจสอบสลิป & คิวจอง</span>
            {pendingBookings.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeAdminTab === "slips" ? "bg-white text-[#0070ea]" : "bg-amber-100 text-amber-800"
              }`}>
                {pendingBookings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab("admins")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeAdminTab === "admins"
                ? "bg-[#0070ea] text-white shadow-sm"
                : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>จัดการรายชื่อแอดมิน</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              activeAdminTab === "admins" ? "bg-white text-[#0070ea]" : "bg-blue-100 text-[#0070ea]"
            }`}>
              {adminEmails.length}
            </span>
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* TAB 1: SLIPS & BOOKINGS QUEUE */}
      {activeAdminTab === "slips" && (
        <div className="space-y-6">
          {/* PENDING APPROVAL QUEUE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0070ea]" />
                <span>รายการที่รอตรวจสอบสลิป ({pendingBookings.length})</span>
              </h2>
              <span className="text-xs text-slate-500">กดอนุมัติเพื่อเพิ่มแต้มให้สมาชิกอัตโนมัติ</span>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="py-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800">ไม่มีรายการสลิปค้างตรวจสอบ</h3>
                <p className="text-xs text-slate-500 mt-0.5">ทุกรายการได้รับการตรวจสอบเรียบร้อยแล้ว</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-white border border-blue-200 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{b.userName}</span>
                        <span className="text-xs text-slate-500">({b.userEmail})</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                        <span className="font-semibold text-[#0070ea]">
                          {b.date} • {b.startTime} - {b.endTime} น.
                        </span>
                        <span className="text-slate-600">
                          ยอดที่ต้องโอน: <strong className="text-slate-900 text-sm">{b.netAmount} บาท</strong>
                        </span>
                        {b.pointsUsed > 0 && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0070ea] font-medium border border-blue-200">
                            ใช้สิทธิ์ฟรี 10 แต้ม
                          </span>
                        )}
                        <span className="text-emerald-600 font-medium">
                          แต้มที่จะได้รับ: +{b.pointsEarned} แต้ม
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                      {/* View Slip Thumbnail */}
                      {b.slipUrl && (
                        <button
                          onClick={() => setSelectedSlip(b.slipUrl!)}
                          className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 hover:border-[#0070ea] transition-colors group flex-shrink-0 cursor-pointer shadow-sm"
                        >
                          <img
                            src={b.slipUrl}
                            alt="Slip Thumbnail"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        </button>
                      )}

                      {/* Approve / Reject Actions */}
                      <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                        <button
                          onClick={() => handleAction(b.id, "reject")}
                          disabled={processingId === b.id}
                          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-300 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                        >
                          ปฏิเสธ
                        </button>
                        <button
                          onClick={() => handleAction(b.id, "approve")}
                          disabled={processingId === b.id}
                          className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#0070ea] hover:bg-[#005bb5] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {processingId === b.id ? "กำลังดำเนินการ..." : "อนุมัติการจอง"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ALL BOOKINGS LOG */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h2 className="text-base font-bold text-slate-900">ประวัติรายการจองทั้งหมด ({otherBookings.length})</h2>

            <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 bg-white">
              {otherBookings.map((b) => (
                <div key={b.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {b.userName} • {b.date} ({b.startTime} - {b.endTime} น.)
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      รหัส: {b.id} • ยอดชำระ: {b.netAmount} บาท
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`font-semibold px-2.5 py-1 rounded-full ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : b.status === "REJECTED"
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {b.status === "CONFIRMED"
                        ? "อนุมัติแล้ว"
                        : b.status === "REJECTED"
                        ? "ปฏิเสธ"
                        : b.status}
                    </span>

                    {b.slipUrl && (
                      <button
                        onClick={() => setSelectedSlip(b.slipUrl!)}
                        className="text-[#0070ea] hover:underline font-medium cursor-pointer"
                      >
                        ดูสลิป
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADMIN MANAGEMENT */}
      {activeAdminTab === "admins" && (
        <div className="space-y-6">
          {/* Add Admin Form Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-[#0070ea] flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">เพิ่มผู้ดูแลระบบ (Admin)</h2>
                <p className="text-xs text-slate-500">
                  ระบุอีเมลที่ใช้ล็อกอิน (Google Account / @su.ac.th) เพื่อมอบสิทธิ์แอดมิน
                </p>
              </div>
            </div>

            <form onSubmit={handleAddAdmin} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  placeholder="เช่น example@su.ac.th หรือ user@gmail.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0070ea] focus:ring-1 focus:ring-[#0070ea] transition-colors"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>

              <button
                type="submit"
                disabled={isAddingAdmin}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#0070ea] hover:bg-[#005bb5] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isAddingAdmin ? "กำลังเพิ่ม..." : "เพิ่มเป็นแอดมิน"}</span>
              </button>
            </form>
          </div>

          {/* Current Admins List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#0070ea]" />
                <span>รายชื่อผู้ดูแลระบบปัจจุบัน ({adminEmails.length} ท่าน)</span>
              </h2>
              <span className="text-xs text-slate-500">ผู้มีสิทธิ์อนุมัติสลิปและจัดการระบบ</span>
            </div>

            <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 bg-white">
              {adminEmails.map((email) => {
                const isCurrent = email.toLowerCase() === user.email.toLowerCase();

                return (
                  <div key={email} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-[#0070ea] flex items-center justify-center font-bold text-xs">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                          <span>{email}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                              คุณ (บัญชีที่ใช้อยู่)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">สิทธิ์ Admin เต็มรูปแบบ</div>
                      </div>
                    </div>

                    <div>
                      {!isCurrent ? (
                        <button
                          onClick={() => handleRemoveAdmin(email)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-300 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ลบสิทธิ์</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">ไม่สามารถลบตัวเองได้</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* Slip Zoom Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-lg w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl text-center">
            <button
              onClick={() => setSelectedSlip(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 mb-3">หลักฐานสลิปการโอนเงิน</h3>
            <div className="max-h-[75vh] overflow-y-auto rounded-xl bg-slate-50 p-2 border border-slate-200">
              <img
                src={selectedSlip}
                alt="Slip Full Preview"
                className="max-h-[70vh] mx-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
