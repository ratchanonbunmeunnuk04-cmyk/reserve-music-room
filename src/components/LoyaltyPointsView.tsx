"use client";

import React, { useEffect, useState } from "react";
import { Award, Sparkles, Clock, Calendar } from "lucide-react";
import { Booking, User } from "@/lib/types";

interface LoyaltyPointsViewProps {
  user: User | null;
  onOpenSchedule: () => void;
  onOpenLogin: () => void;
}

export function LoyaltyPointsView({ user, onOpenSchedule, onOpenLogin }: LoyaltyPointsViewProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/bookings?mine=true");
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
    fetchHistory();
  }, [user]);

  if (!user) {
    return (
      <div className="py-20 text-center rounded-2xl bg-white border border-slate-200 shadow-sm p-8 max-w-lg mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-[#0070ea] flex items-center justify-center mx-auto mb-4">
          <Award className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">ระบบสะสมแต้มสมาชิก</h2>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          เข้าสู่ระบบด้วยบัญชี Google เพื่อเริ่มสะสมแต้ม ทุกการจอง 1 ชั่วโมงรับ 1 แต้ม ครบ 10 แต้มแลกซ้อมฟรี 1 ชั่วโมง
        </p>
        <button
          onClick={onOpenLogin}
          className="mt-6 px-6 py-2.5 rounded-xl bg-[#0070ea] hover:bg-[#005bb5] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          เข้าสู่ระบบเพื่อดูแต้มสะสม
        </button>
      </div>
    );
  }

  const currentPoints = user.points || 0;
  const progressPercent = Math.min(100, (currentPoints / 10) * 100);
  const remainingPoints = Math.max(0, 10 - currentPoints);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Loyalty Card (SF Royal Blue & White) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0070ea] to-[#005bb5] border border-blue-400 p-6 sm:p-10 shadow-xl text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold border border-white/30 backdrop-blur-sm">
              <Award className="w-4 h-4 text-white" />
              <span>บัตรสะสมแต้มสมาชิก (SU BAND Rewards)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {user.name}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-md">
              สะสมแต้มผ่านการจองและชำระเงินค่าซ้อมห้องดนตรีสากล (1 ชม. = 1 แต้ม)
            </p>
          </div>

          {/* Points Meter Box */}
          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white text-slate-900 border border-white/30 text-center min-w-[200px] shadow-lg">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">แต้มสะสมปัจจุบัน</div>
            <div className="text-4xl sm:text-5xl font-black text-[#0070ea] tracking-tight my-1">
              {currentPoints}
              <span className="text-lg font-bold text-slate-400 ml-1">/ 10</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">แต้มสะสม</div>
          </div>
        </div>

        {/* Progress Bar towards 10 Points */}
        <div className="mt-8 pt-6 border-t border-white/20 space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-blue-100">ความคืบหน้าสู่สิทธิ์ซ้อมฟรี 1 ชั่วโมง</span>
            <span className="text-white font-bold">{progressPercent.toFixed(0)}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-black/20 overflow-hidden border border-white/20 p-0.5">
            <div
              className="h-full rounded-full bg-white transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-blue-100">
              {remainingPoints === 0 ? (
                <span className="text-emerald-200 font-semibold flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  ยินดีด้วย! คุณสะสมครบ 10 แต้มแล้ว พร้อมแลกสิทธิ์ซ้อมฟรี 1 ชั่วโมง
                </span>
              ) : (
                <span>
                  จองซ้อมอีกเพียง <strong className="text-white font-bold">{remainingPoints} ชั่วโมง</strong> เพื่อแลกสิทธิ์ซ้อมฟรี
                </span>
              )}
            </span>
            <button
              onClick={onOpenSchedule}
              className="text-white hover:underline font-semibold text-xs cursor-pointer"
            >
              ไปหน้าจองห้อง
            </button>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-[#0070ea] flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-sm font-bold text-slate-900">1 ชั่วโมง = 1 แต้ม</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            จองและชำระเงินสำเร็จ 1 ชั่วโมงเต็มจะได้รับ 1 แต้ม (คิดเฉพาะชั่วโมงเต็ม เศษ 30 นาทีไม่ได้รับแต้ม)
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-[#0070ea] flex items-center justify-center font-bold text-sm">
            10
          </div>
          <h3 className="text-sm font-bold text-slate-900">ครบ 10 แต้ม แลกฟรี 1 ชม.</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            เมื่อสะสมครบ 10 แต้ม จะมีปุ่มให้เลือกใช้แต้มเป็นส่วนลด 140 บาท ในขั้นตอนสรุปยอดจองทันที
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-[#0070ea] flex items-center justify-center font-bold text-sm">
            0
          </div>
          <h3 className="text-sm font-bold text-slate-900">ชั่วโมงฟรีไม่คิดแต้มเพิ่ม</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            ชั่วโมงที่ได้รับสิทธิ์ซ้อมฟรีจากการแลกแต้ม จะไม่ได้รับแต้มสะสมเพิ่มตามกติกาสากล
          </p>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">ประวัติการสะสมและการใช้แต้ม</h3>

        {bookings.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-500 text-xs">
            ยังไม่มีประวัติการจองห้องซ้อม
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100 bg-white">
            {bookings.map((b) => (
              <div key={b.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{b.date}</span>
                    <span className="text-xs text-slate-600">
                      ({b.startTime} - {b.endTime} น.)
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    ยอดชำระ: {b.netAmount} บาท • สถานะ:{" "}
                    <span
                      className={`font-semibold ${
                        b.status === "CONFIRMED"
                          ? "text-emerald-600"
                          : b.status === "PENDING"
                          ? "text-amber-600"
                          : "text-slate-400"
                      }`}
                    >
                      {b.status === "CONFIRMED"
                        ? "อนุมัติแล้ว"
                        : b.status === "PENDING"
                        ? "รอตรวจสอบ"
                        : "ยกเลิก/ปฏิเสธ"}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {b.pointsUsed > 0 && (
                    <div className="text-xs font-bold text-red-600">-{b.pointsUsed} แต้ม (แลกฟรี)</div>
                  )}
                  {b.pointsEarned > 0 && (
                    <div className="text-xs font-bold text-[#0070ea]">
                      +{b.pointsEarned} แต้ม {b.status === "CONFIRMED" ? "ได้รับแล้ว" : "(รออนุมัติ)"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
