"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Clock,
  Upload,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Booking, User } from "@/lib/types";

interface BookingPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  selectedSlots: string[];
  user: User;
  onBookingSuccess: () => void;
}

export function BookingPaymentModal({
  isOpen,
  onClose,
  date,
  selectedSlots,
  user,
  onBookingSuccess,
}: BookingPaymentModalProps) {
  const [step, setStep] = useState<"SUMMARY" | "PAYMENT" | "SUCCESS">("SUMMARY");
  const [usePoints, setUsePoints] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment Slip state
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // 15-minute countdown timer
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  const slotsCount = selectedSlots.length;
  const totalAmount = slotsCount * 70;
  const canUsePoints = user.points >= 10 && slotsCount >= 2;
  const discountAmount = usePoints && canUsePoints ? 140 : 0;
  const netAmount = Math.max(0, totalAmount - discountAmount);
  const pointsEarned = Math.floor(Math.max(0, slotsCount - (usePoints ? 2 : 0)) / 2);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setStep("SUMMARY");
      setUsePoints(false);
      setCreatedBooking(null);
      setSlipFile(null);
      setSlipPreview(null);
      setErrorMessage(null);
      setTimeLeft(15 * 60);
    }
  }, [isOpen]);

  // Countdown timer when on PAYMENT step
  useEffect(() => {
    if (step !== "PAYMENT" || !createdBooking) return;

    const interval = setInterval(() => {
      const exp = new Date(createdBooking.expiresAt).getTime();
      const now = Date.now();
      const remainingSeconds = Math.max(0, Math.floor((exp - now) / 1000));
      setTimeLeft(remainingSeconds);

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        setErrorMessage("หมดเวลาทำรายการ (15 นาที) สล็อตเวลาถูกปล่อยว่างแล้ว");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [step, createdBooking]);

  if (!isOpen) return null;

  // Format mm:ss
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Step 1: Create booking and acquire 15m hold
  const handleProceedToPayment = async () => {
    setIsCreating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          selectedSlots,
          usePoints,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เกิดข้อผิดพลาดในการจอง");
      }

      setCreatedBooking(data.booking);
      setStep("PAYMENT");
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Cancel Booking and release hold immediately
  const handleCancelBooking = async () => {
    if (!createdBooking) {
      onClose();
      return;
    }

    setIsCancelling(true);
    try {
      await fetch(`/api/bookings/${createdBooking.id}`, {
        method: "DELETE",
      });
      onBookingSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      onClose();
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Slip File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 2: Upload slip and finalize
  const handleSubmitSlip = async () => {
    if (!slipPreview || !createdBooking) {
      setErrorMessage("กรุณาเลือกไฟล์รูปภาพสลิปการโอนเงินก่อนยืนยัน");
      return;
    }

    setIsUploadingSlip(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/bookings/${createdBooking.id}/slip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slipUrl: slipPreview }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "อัปโหลดสลิปไม่สำเร็จ");
      }

      setStep("SUCCESS");
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const copyToClipboard = (text: string, type: "amount" | "ref") => {
    navigator.clipboard.writeText(text);
    if (type === "amount") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] sm:max-h-[86vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm flex-shrink-0">
              <img src="/su-band-logo.png" alt="SU BAND" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {step === "SUMMARY" && "สรุปรายการจองห้องซ้อมดนตรี"}
                {step === "PAYMENT" && "ชำระเงินผ่าน Thai QR Payment"}
                {step === "SUCCESS" && "จองห้องซ้อมสำเร็จ"}
              </h2>
              <p className="text-[11px] text-slate-500">ชมรมดนตรีสากล มหาวิทยาลัยศิลปากร (SU BAND)</p>
            </div>
          </div>

          <button
            onClick={step === "PAYMENT" ? handleCancelBooking : onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* STEP 1: SUMMARY & REDEMPTION */}
          {step === "SUMMARY" && (
            <div className="space-y-4">
              {/* Booking Details Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">วันที่จอง</span>
                  <span className="font-semibold text-slate-900">{date}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">ช่วงเวลา</span>
                  <span className="font-bold text-[#0070ea]">
                    {selectedSlots[0]} - {getSlotEndTime(selectedSlots[selectedSlots.length - 1])} น.
                  </span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">ความยาวรวม</span>
                  <span className="text-slate-700 font-medium">
                    {slotsCount} ช่วงเวลา ({slotsCount * 30} นาที / {(slotsCount * 0.5).toFixed(1)} ชม.)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ผู้จอง</span>
                  <span className="text-slate-700 font-medium truncate max-w-[220px]">
                    {user.name} ({user.email})
                  </span>
                </div>
              </div>

              {/* Loyalty Points Redemption Box */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0070ea] flex items-center justify-center">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">ระบบสะสมแต้มสมาชิก</div>
                      <div className="text-[11px] text-slate-500">
                        คุณมี: <strong className="text-[#0070ea]">{user.points} แต้ม</strong>
                      </div>
                    </div>
                  </div>

                  {canUsePoints ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => setUsePoints(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0070ea]"></div>
                    </label>
                  ) : (
                    <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-white border border-slate-200 shadow-sm">
                      {user.points < 10 ? `ขาดอีก ${10 - user.points} แต้ม` : "ต้องจองอย่างน้อย 1 ชม."}
                    </span>
                  )}
                </div>

                {canUsePoints && (
                  <div className="text-[11px] text-blue-900 bg-blue-100/70 p-2 rounded-lg border border-blue-200">
                    {usePoints ? (
                      <div className="flex items-center gap-1.5 font-medium">
                        <Sparkles className="w-3.5 h-3.5 text-[#0070ea] flex-shrink-0" />
                        <span>ใช้ 10 แต้ม เพื่อรับสิทธิ์ซ้อมฟรี 1 ชั่วโมง (-140 บาท)</span>
                      </div>
                    ) : (
                      <span>เปิดสวิตช์เพื่อแลก 10 แต้มเป็นส่วนลด 1 ชั่วโมง (-140 บาท)</span>
                    )}
                  </div>
                )}

                <div className="text-[11px] text-slate-600">
                  แต้มที่จะได้รับหลังซ้อม:{" "}
                  <span className="text-[#0070ea] font-bold">+{pointsEarned} แต้ม</span>
                  <span className="text-slate-400 ml-1">(1 ชม. เต็ม = 1 แต้ม)</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>ค่าบริการ ({slotsCount} ช่วง × 70.-)</span>
                  <span>{totalAmount} บาท</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-[#0070ea] font-semibold">
                    <span>ส่วนลดใช้แต้มสะสม 10 แต้ม</span>
                    <span>- {discountAmount} บาท</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                  <span>ยอดชำระสุทธิ</span>
                  <span className="text-lg font-black text-[#0070ea]">{netAmount} บาท</span>
                </div>
              </div>

              {/* Cancellation Policy Note */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 text-[11px]">กฎการยกเลิก/มัดจำ:</div>
                <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-slate-500">
                  <li>แจ้งล่วงหน้าอย่างน้อย 24 ชม. ได้รับมัดจำคืนเต็มจำนวน</li>
                  <li>น้อยกว่า 24 ชม. หักมัดจำ 50% | กระชั้นชิด/ไม่มาตามนัดริบมัดจำ</li>
                  <li>คิววันจันทร์ ดำเนินการจอง/ยกเลิกในวันอาทิตย์ก่อนเวลาซ้อมอย่างน้อย 24 ชม.</li>
                </ul>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROMPTPAY QR & SLIP UPLOAD */}
          {step === "PAYMENT" && createdBooking && (
            <div className="space-y-4">
              {/* 15-Minute Countdown Lock Header */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-center gap-2 text-xs text-blue-900 font-medium">
                  <Clock className="w-3.5 h-3.5 animate-spin text-[#0070ea]" />
                  <span>ล็อคสล็อตเวลาให้คุณ:</span>
                </div>
                <div className="font-mono text-sm font-extrabold text-[#0070ea] bg-white px-2.5 py-0.5 rounded-lg border border-blue-200 shadow-sm">
                  {formatTimer(timeLeft)}
                </div>
              </div>

              {/* Exact Amount Tag */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500">ยอดเงินที่ต้องโอนสุทธิ</div>
                  <div className="text-lg font-black text-[#0070ea]">{createdBooking.netAmount} บาท</div>
                </div>
                <button
                  onClick={() => copyToClipboard(String(createdBooking.netAmount), "amount")}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-xs text-slate-700 border border-slate-200 shadow-sm transition-colors cursor-pointer"
                >
                  {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAmount ? "คัดลอกแล้ว" : "คัดลอกยอด"}</span>
                </button>
              </div>

              {/* Real Thai QR Payment Image */}
              <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="w-full max-w-[230px] sm:max-w-[270px] overflow-hidden rounded-lg">
                  <img
                    src="/thai-qr.png"
                    alt="Thai QR Payment PromptPay"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>

              {/* Account Details */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div>
                  ชื่อบัญชี: <strong className="text-slate-900">นาย รัชชานนท์ บุญเหมือนนึก และ น.ส. อนัญญา ขวาเมือ</strong>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>ธนาคารกสิกรไทย (KBank) บัญชี xxx-x-x1450-x</span>
                  <button
                    onClick={() => copyToClipboard("004999206966128", "ref")}
                    className="text-[#0070ea] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRef ? "คัดลอกแล้ว" : "คัดลอกเลขอ้างอิง"}</span>
                  </button>
                </div>
              </div>

              {/* Slip Uploader */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-800">
                  แนบสลิปหลักฐานการโอนเงิน (Slip Upload)
                </label>

                {slipPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-blue-300 bg-slate-50 p-2 text-center">
                    <img
                      src={slipPreview}
                      alt="Slip Preview"
                      className="max-h-36 mx-auto rounded-lg object-contain"
                    />
                    <button
                      onClick={() => {
                        setSlipFile(null);
                        setSlipPreview(null);
                      }}
                      className="mt-1 text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      เปลี่ยนรูปสลิป
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-4 px-3 border-2 border-dashed border-slate-300 hover:border-[#0070ea] rounded-xl bg-slate-50 hover:bg-blue-50/30 cursor-pointer transition-colors group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#0070ea] transition-colors mb-1" />
                    <span className="text-xs font-medium text-slate-700">คลิกเพื่ออัปโหลดรูปสลิป</span>
                    <span className="text-[10px] text-slate-400">รองรับรูปถ่าย / สลิปโอนเงิน (JPG, PNG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === "SUCCESS" && (
            <div className="text-center py-5 space-y-3">
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 text-[#0070ea] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <h2 className="text-lg font-bold text-slate-900 tracking-tight">ส่งหลักฐานการจองเรียบร้อยแล้ว</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                สล็อตเวลาถูกบันทึกในสถานะ <strong className="text-[#0070ea]">รอการตรวจสอบ</strong> เรียบร้อยแล้ว
                แอดมินชมรมจะทำการตรวจสลิปและกดยืนยันการจองให้คุณ
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-xs mx-auto">
                เมื่อแอดมินอนุมัติสำเร็จ คุณจะได้รับแต้มสะสม <strong className="text-[#0070ea]">+{createdBooking?.pointsEarned || 0} แต้ม</strong> เข้าบัญชีโดยอัตโนมัติ
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer with prominent Cancel & Action Buttons */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-shrink-0">
          {step === "SUMMARY" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleProceedToPayment}
                disabled={isCreating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0070ea] hover:bg-[#005bb5] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isCreating ? "กำลังล็อคเวลา..." : "ล็อคสล็อตและไปหน้าชำระเงิน"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {step === "PAYMENT" && (
            <>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-300 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isCancelling ? "กำลังปล่อยสล็อต..." : "ยกเลิกการจองและปล่อยสล็อต"}</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitSlip}
                disabled={isUploadingSlip || !slipPreview || timeLeft <= 0}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0070ea] hover:bg-[#005bb5] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isUploadingSlip ? "กำลังส่งหลักฐาน..." : "ยืนยันและส่งสลิป"}</span>
                <Check className="w-4 h-4" />
              </button>
            </>
          )}

          {step === "SUCCESS" && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onBookingSuccess();
              }}
              className="w-full py-2.5 rounded-xl bg-[#0070ea] hover:bg-[#005bb5] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              ปิดหน้านี้และกลับสู่ตาราง
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getSlotEndTime(startTime: string): string {
  const map: Record<string, string> = {
    "17:00": "17:30",
    "17:30": "18:00",
    "18:00": "18:30",
    "18:30": "19:00",
    "19:00": "19:30",
    "19:30": "20:00",
    "20:00": "20:30",
    "20:30": "21:00",
    "21:00": "21:30",
  };
  return map[startTime] || "";
}
