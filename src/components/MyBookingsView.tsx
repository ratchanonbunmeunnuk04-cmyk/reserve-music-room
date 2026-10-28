"use client";

import React, { useEffect, useState } from "react";
import { Activity, Calendar, CalendarPlus, ChevronDown, Clock, CheckCircle2, Eye, RefreshCw, Search, Upload, XCircle } from "lucide-react";
import { Booking, User } from "@/lib/types";

interface MyBookingsViewProps {
  user: User;
  onOpenSchedule: () => void;
}

const fmt = (iso: string) => new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

// ponytail: steps derived from status + slipUrl, no per-step timestamps in DB (slip/review time unknown)
function StatusTimeline({ booking }: { booking: Booking }) {
  const decided = booking.status !== "PENDING";
  const ok = booking.status === "CONFIRMED";
  const steps = [
    { icon: CalendarPlus, label: "สร้างการจอง", sub: fmt(booking.createdAt), done: true },
    { icon: Upload, label: "อัปโหลดสลิป", sub: booking.slipUrl ? "ได้รับสลิปแล้ว" : "รอการอัปโหลดสลิป", done: !!booking.slipUrl },
    { icon: Search, label: "แอดมินตรวจสอบสลิป", sub: decided ? "ตรวจสอบเรียบร้อย" : "กำลังรอแอดมินตรวจ", done: decided },
    {
      icon: decided && !ok ? XCircle : CheckCircle2,
      label: decided ? (ok ? "อนุมัติแล้ว" : "ปฏิเสธ/ยกเลิก") : "ผลการอนุมัติ",
      sub: decided ? fmt(booking.updatedAt) : "รอผล",
      done: decided,
    },
  ];
  const current = steps.findIndex((s) => !s.done);
  const lastDone = steps.reduce((acc, s, i) => (s.done ? i : acc), 0);
  const tone = decided && !ok ? "bg-red-500" : "bg-[#0070ea]";

  return (
    <div className="tl-in relative mt-4 pt-4 border-t border-slate-100">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-3">
        <span className="relative flex w-2 h-2">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping motion-reduce:animate-none" />
          <span className="relative w-2 h-2 rounded-full bg-emerald-500" />
        </span>
        อัปเดตสถานะแบบเรียลไทม์
      </div>
      <div className="relative">
        {/* track: from first dot center (12px) to last dot center (row h-14 → 44px from bottom) */}
        <div className="absolute left-[11px] top-3 bottom-11 w-0.5 bg-slate-200 rounded" />
        <div
          className={`tl-grow absolute left-[11px] top-3 w-0.5 rounded ${tone}`}
          style={{ height: `calc((100% - 56px) * ${lastDone / (steps.length - 1)})` }}
        />
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isCurrent = i === current;
          const dot = s.done ? `${i === 3 ? tone : "bg-[#0070ea]"} text-white` : isCurrent ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-400";
          return (
            <div key={i} className="tl-in relative flex gap-3 h-14" style={{ animationDelay: `${i * 120}ms` }}>
              <span className={`relative z-10 flex items-center justify-center w-6 h-6 rounded-full shrink-0 transition-colors duration-500 ${dot}`}>
                {isCurrent && <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping motion-reduce:animate-none" />}
                <Icon className="relative w-3.5 h-3.5" />
              </span>
              <div className="leading-tight">
                <p className={`text-xs font-bold ${s.done || isCurrent ? "text-slate-900" : "text-slate-400"}`}>{s.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MyBookingsView({ user, onOpenSchedule }: MyBookingsViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlip, setSelectedSlip] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const fetchBookings = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/bookings?mine=true");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/bookings?mine=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data) {
          setBookings(data.bookings || []);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [user]);

  // Real-time polling every 5s, only while a timeline is open
  useEffect(() => {
    if (!trackingId) return;
    const interval = setInterval(() => fetchBookings(true), 5000);
    return () => clearInterval(interval);
  }, [trackingId]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">ประวัติการจองห้องซ้อมของฉัน</h1>
          <p className="text-xs text-slate-500 mt-1">
            รายการจองทั้งหมดภายใต้บัญชี {user.email}
          </p>
        </div>
        <button
          onClick={() => fetchBookings()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#0070ea]" : ""}`} />
          <span>รีเฟรชข้อมูล</span>
        </button>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
          <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">คุณยังไม่มีรายการจองห้องซ้อม</h3>
          <p className="text-xs text-slate-500 mt-1">เลือกวันและเวลาที่สะดวกเพื่อเริ่มจองห้องซ้อมดนตรีสากล</p>
          <button
            onClick={onOpenSchedule}
            className="mt-5 px-6 py-2.5 rounded-xl bg-[#0070ea] hover:bg-[#005bb5] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            ไปที่หน้าตารางจอง
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const isConfirmed = booking.status === "CONFIRMED";
            const isPending = booking.status === "PENDING";

            return (
              <div
                key={booking.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-300 transition-colors"
              >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">{booking.date}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-[#0070ea] border border-blue-200">
                      {booking.startTime} - {booking.endTime} น.
                    </span>
                    <span className="text-xs text-slate-500">({booking.slotsCount * 30} นาที)</span>
                  </div>

                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>รหัสจอง: <strong className="text-slate-700 font-mono">{booking.id}</strong></span>
                    <span>ยอดสุทธิ: <strong className="text-slate-900">{booking.netAmount} บาท</strong></span>
                    {booking.discountAmount > 0 && (
                      <span className="text-[#0070ea] font-medium">ใช้ 10 แต้มลด 140.-</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-end md:self-center">
                  {/* Status Badge */}
                  <div>
                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" />
                        อนุมัติแล้ว
                      </span>
                    ) : isPending ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-4 h-4" />
                        รอแอดมินตรวจสลิป
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                        <XCircle className="w-4 h-4" />
                        ปฏิเสธ/ยกเลิก
                      </span>
                    )}
                  </div>

                  {/* View Slip Button */}
                  {booking.slipUrl && (
                    <button
                      onClick={() => setSelectedSlip(booking.slipUrl!)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shadow-sm transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูสลิป</span>
                    </button>
                  )}

                  {/* Track Status Button */}
                  <button
                    onClick={() => setTrackingId(trackingId === booking.id ? null : booking.id)}
                    aria-expanded={trackingId === booking.id}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium border shadow-sm transition-colors cursor-pointer ${
                      trackingId === booking.id
                        ? "bg-blue-50 text-[#0070ea] border-blue-200"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>ติดตามสถานะ</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${trackingId === booking.id ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>
              {trackingId === booking.id && <StatusTimeline booking={booking} />}
              </div>
            );
          })}
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
