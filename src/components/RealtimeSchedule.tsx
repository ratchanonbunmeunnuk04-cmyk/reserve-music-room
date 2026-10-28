"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Lock,
  RefreshCw,
  ChevronRight,
  Music,
  AlertCircle,
} from "lucide-react";
import { TimeSlot, User } from "@/lib/types";
import { getActiveWeekRange, WeekDayItem } from "@/lib/week";

interface RealtimeScheduleProps {
  user: User | null;
  onOpenBookingModal: (date: string, selectedSlots: string[]) => void;
  onOpenLogin: () => void;
}

export function RealtimeSchedule({ user, onOpenBookingModal, onOpenLogin }: RealtimeScheduleProps) {
  // Weekly date tabs (Monday - Sunday, no crossing weeks)
  const [datesList, setDatesList] = useState<WeekDayItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [activeWeekInfo, setActiveWeekInfo] = useState<{ weekLabel: string; isNextWeekUnlocked: boolean }>({
    weekLabel: "",
    isNextWeekUnlocked: false,
  });
  const [scheduleData, setScheduleData] = useState<{
    slots: TimeSlot[];
    isClosed: boolean;
    operatingHours: string;
    dayName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize dates strictly for the active booking week
  useEffect(() => {
    const { days, isNextWeekUnlocked, weekLabel } = getActiveWeekRange();
    setDatesList(days);
    setActiveWeekInfo({ weekLabel, isNextWeekUnlocked });

    // Select first bookable day in the active week (not past and not closed)
    const firstAvailable = days.find((item) => !item.isPast && !item.isClosed) || days[0];
    setSelectedDate(firstAvailable.dateStr);
  }, []);

  // Fetch schedule whenever date changes or refreshed
  const fetchSchedule = async (date: string, isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const res = await fetch(`/api/schedule?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setScheduleData(data);
        // Clear selection if slots changed or become unavailable
        setSelectedSlots((prev) =>
          prev.filter((slotTime) => {
            const found = data.slots.find((s: TimeSlot) => s.time === slotTime);
            return found && found.status === "AVAILABLE";
          })
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      setSelectedSlots([]);
      setErrorMessage(null);
      fetchSchedule(selectedDate);
    }
  }, [selectedDate]);

  // Real-time polling every 8 seconds
  useEffect(() => {
    if (!selectedDate) return;
    const interval = setInterval(() => {
      fetchSchedule(selectedDate);
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Slot click handler with contiguous selection enforcement
  const toggleSlot = (time: string, status: string) => {
    if (status !== "AVAILABLE") return;
    setErrorMessage(null);

    if (selectedSlots.includes(time)) {
      // Remove slot
      setSelectedSlots(selectedSlots.filter((t) => t !== time));
    } else {
      const newSlots = [...selectedSlots, time].sort();
      // Check if contiguous
      if (scheduleData?.slots) {
        const allTimes = scheduleData.slots.map((s) => s.time);
        const indices = newSlots.map((t) => allTimes.indexOf(t));
        let isContiguous = true;
        for (let i = 1; i < indices.length; i++) {
          if (indices[i] !== indices[i - 1] + 1) {
            isContiguous = false;
            break;
          }
        }

        if (!isContiguous && selectedSlots.length > 0) {
          // Reset to just the newly clicked slot if non-contiguous
          setSelectedSlots([time]);
          return;
        }
      }
      setSelectedSlots(newSlots);
    }
  };

  const handleProceed = () => {
    if (selectedSlots.length === 0) return;
    if (!user) {
      onOpenLogin();
      return;
    }
    onOpenBookingModal(selectedDate, selectedSlots);
  };

  return (
    <div className="space-y-5">
      {/* Date Navigation Tabs (Weekly, No Crossing Weeks) */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <CalendarIcon className="w-3.5 h-3.5 text-[#0070ea]" />
            <span>สัปดาห์: <strong className="text-slate-900">{activeWeekInfo.weekLabel}</strong></span>
            {activeWeekInfo.isNextWeekUnlocked && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                เปิดจองสัปดาห์ใหม่แล้ว
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">จองได้เฉพาะสัปดาห์ปัจจุบัน (เปิดรอบใหม่ทุกวันอาทิตย์ 12:00 น.)</span>
            <button
              onClick={() => fetchSchedule(selectedDate, true)}
              title="รีเฟรชตาราง"
              aria-label="รีเฟรชตาราง"
              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0070ea]" : ""}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {datesList.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            const isDisabled = item.isPast || item.isClosed;

            return (
              <button
                key={item.dateStr}
                onClick={() => {
                  if (!isDisabled) setSelectedDate(item.dateStr);
                }}
                disabled={isDisabled}
                className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[85px] sm:min-w-[95px] py-2 px-2.5 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-[#0070ea] text-white font-bold border-[#0070ea] shadow-md shadow-blue-500/20 cursor-pointer"
                    : item.isPast
                    ? "bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
                    : item.isClosed
                    ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                    : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50 shadow-sm cursor-pointer"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`text-[10px] ${isSelected ? "text-blue-100 font-extrabold" : "text-slate-500"}`}>
                    {item.dayName}
                  </span>
                  {item.isToday && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-[#0070ea]"}`}>
                      วันนี้
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold mt-0.5">{item.label}</span>
                {item.isPast ? (
                  <span className="text-[9px] font-medium text-slate-400">ผ่านมาแล้ว</span>
                ) : item.isClosed ? (
                  <span className="text-[9px] font-medium text-slate-400">ปิด</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Operating Schedule Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <Clock className="w-3.5 h-3.5 text-[#0070ea] flex-shrink-0" />
          <span>{scheduleData?.isClosed ? "ปิดทำการ" : `เวลาเปิด: ${scheduleData?.operatingHours}`}</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3.5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#0070ea]"></span>ว่าง</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>รอตรวจ</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>จองแล้ว</span>
        </div>
      </div>

      {/* Time Slot Grid */}
      {scheduleData?.isClosed ? (
        <div className="py-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0070ea] flex items-center justify-center mx-auto mb-2 border border-blue-100">
            <Lock className="w-4 h-4 text-[#0070ea]" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800">ห้องซ้อมปิดทำการในวันหยุดสุดสัปดาห์</h3>
          <p className="text-xs text-slate-500 mt-0.5">กรุณาเลือกวันจันทร์ - ศุกร์</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {scheduleData?.slots.map((slot) => {
              const isSelected = selectedSlots.includes(slot.time);
              const isAvailable = slot.status === "AVAILABLE";
              const isPending = slot.status === "PENDING";

              return (
                <div
                  key={slot.time}
                  onClick={() => toggleSlot(slot.time, slot.status)}
                  className={`relative p-3 rounded-xl border transition-all select-none ${
                    isSelected
                      ? "bg-blue-50/80 border-[#0070ea] ring-1 ring-[#0070ea] shadow-sm cursor-pointer"
                      : isAvailable
                      ? "bg-white border-slate-200 hover:border-[#0070ea] hover:bg-blue-50/30 shadow-sm cursor-pointer"
                      : isPending
                      ? "bg-amber-50/70 border-amber-200 cursor-not-allowed opacity-90"
                      : "bg-slate-50 border-slate-200 cursor-not-allowed opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock
                        className={`w-3.5 h-3.5 ${
                          isSelected
                            ? "text-[#0070ea]"
                            : isAvailable
                            ? "text-slate-400"
                            : isPending
                            ? "text-amber-500"
                            : "text-slate-400"
                        }`}
                      />
                      <span className={`text-sm sm:text-base font-bold tracking-tight ${
                        isSelected ? "text-[#0070ea]" : isAvailable ? "text-slate-800" : isPending ? "text-amber-900" : "text-slate-400"
                      }`}>
                        {slot.time} - {slot.endTime} น.
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0070ea] text-white shadow-sm">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          เลือกแล้ว
                        </span>
                      ) : isAvailable ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0070ea] border border-blue-200">
                          ว่าง • 70.-
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          <Lock className="w-2.5 h-2.5" />
                          รอตรวจ
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          จองแล้ว
                        </span>
                      )}
                    </div>
                  </div>

                  {slot.isMyBooking && (
                    <div className="mt-1 text-[10px] text-[#0070ea] font-medium">
                      การจองของคุณ
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Sticky Bottom Selection Summary Bar */}
      {selectedSlots.length > 0 && (
        <div className="sticky bottom-18 md:bottom-4 z-30 p-3 sm:p-4 rounded-2xl bg-white/95 border border-blue-200 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0070ea] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md shadow-blue-500/20">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
                  {selectedDate} • {selectedSlots.length} ช่วงเวลา ({selectedSlots.length * 30} นาที)
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>
                    {selectedSlots[0]} -{" "}
                    {
                      scheduleData?.slots.find((s) => s.time === selectedSlots[selectedSlots.length - 1])
                        ?.endTime
                    }{" "}
                    น.
                  </span>
                  <span className="text-[#0070ea] font-extrabold">
                    {selectedSlots.length * 70} บาท
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setSelectedSlots([])}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleProceed}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0070ea] hover:bg-[#005bb5] text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <span>จองและไปหน้าชำระเงิน</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMonthName(monthIndex: number): string {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return months[monthIndex] || "";
}
