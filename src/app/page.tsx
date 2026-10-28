"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { RealtimeSchedule } from "@/components/RealtimeSchedule";
import { BookingPaymentModal } from "@/components/BookingPaymentModal";
import { LoyaltyPointsView } from "@/components/LoyaltyPointsView";
import { MyBookingsView } from "@/components/MyBookingsView";
import { AdminDashboard } from "@/components/AdminDashboard";
import { LoginModal } from "@/components/LoginModal";
import { User } from "@/lib/types";
import { Music, MapPin, Mail, Phone, Clock, Award, Shield, Calendar, ShieldCheck, User as UserIcon } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<"schedule" | "points" | "my-bookings" | "admin">("schedule");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [bookingModalData, setBookingModalData] = useState<{
    isOpen: boolean;
    date: string;
    selectedSlots: string[];
  }>({
    isOpen: false,
    date: "",
    selectedSlots: [],
  });

  // Fetch current session user on mount
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogin = async (loginData: { email: string; name: string; role?: "USER" | "ADMIN" }) => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          ...loginData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setIsLoginModalOpen(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      setUser(null);
      if (activeTab === "admin" || activeTab === "my-bookings") {
        setActiveTab("schedule");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenBookingModal = (date: string, selectedSlots: string[]) => {
    setBookingModalData({
      isOpen: true,
      date,
      selectedSlots,
    });
  };

  const handleCloseBookingModal = () => {
    setBookingModalData((prev) => ({ ...prev, isOpen: false }));
  };

  const handleBookingSuccess = () => {
    fetchSession();
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col selection:bg-[#0070ea] selection:text-white">
      {/* Top Navbar */}
      <Navbar
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6 pb-24 md:pb-6 space-y-5">
        {/* Navigation Tabs (Desktop view) */}
        <div className="hidden md:flex items-center justify-start overflow-x-auto pb-1 scrollbar-none">
          <nav className="inline-flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => setActiveTab("schedule")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "schedule"
                  ? "bg-[#0070ea] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>ตารางจองห้อง</span>
            </button>

            <button
              onClick={() => setActiveTab("points")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "points"
                  ? "bg-[#0070ea] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>สะสมแต้ม</span>
              {user && (
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                    activeTab === "points"
                      ? "bg-white text-[#0070ea]"
                      : "bg-blue-100 text-[#0070ea]"
                  }`}
                >
                  {user.points} pt
                </span>
              )}
            </button>

            {user && (
              <button
                onClick={() => setActiveTab("my-bookings")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "my-bookings"
                    ? "bg-[#0070ea] text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>การจองของฉัน</span>
              </button>
            )}

            {user?.role === "ADMIN" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "admin"
                    ? "bg-[#0070ea] text-white shadow-sm"
                    : "text-[#0070ea] hover:bg-blue-50"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>จัดการสลิป (Admin)</span>
              </button>
            )}
          </nav>
        </div>

        {activeTab === "schedule" && (
          <RealtimeSchedule
            user={user}
            onOpenBookingModal={handleOpenBookingModal}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}

        {activeTab === "points" && (
          <LoyaltyPointsView
            user={user}
            onOpenSchedule={() => setActiveTab("schedule")}
            onOpenLogin={() => setIsLoginModalOpen(true)}
          />
        )}

        {activeTab === "my-bookings" && user && (
          <MyBookingsView
            user={user}
            onOpenSchedule={() => setActiveTab("schedule")}
          />
        )}

        {activeTab === "admin" && user?.role === "ADMIN" && (
          <AdminDashboard
            user={user}
            onRefreshSchedule={() => {
              /* Trigger schedule refresh */
            }}
          />
        )}
      </main>

      {/* Booking Checkout Modal */}
      {user && (
        <BookingPaymentModal
          isOpen={bookingModalData.isOpen}
          onClose={handleCloseBookingModal}
          date={bookingModalData.date}
          selectedSlots={bookingModalData.selectedSlots}
          user={user}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* Footer (White & Blue Theme) */}
      <footer className="border-t border-slate-200 bg-white mt-16 py-10 pb-28 md:pb-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-200">
            {/* Club Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Music className="w-5 h-5 text-[#0070ea]" />
                <span>ชมรมดนตรีสากล มหาวิทยาลัยศิลปากร</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                ห้องซ้อมดนตรีมาตรฐาน พร้อมเครื่องเสียงและแอมป์คุณภาพ สำหรับนักศึกษาและสมาชิกชมรม (SU BAND)
              </p>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#0070ea]" />
                  <span>อาคารกิจกรรมนักศึกษา มหาวิทยาลัยศิลปากร</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#0070ea]" />
                  <span>จ./พ. 19:30-21:30 | อ./พฤ./ศ. 17:00-21:30 น.</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">บริการและระบบ</h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li>
                  <button onClick={() => setActiveTab("schedule")} className="hover:text-[#0070ea] transition-colors cursor-pointer">
                    ตารางการจองห้องซ้อม Real-time
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab("points")} className="hover:text-[#0070ea] transition-colors cursor-pointer">
                    ระบบสะสมแต้ม 10 ชม. ซ้อมฟรี 1 ชม.
                  </button>
                </li>
                <li>
                  <span className="text-slate-600">อัตราค่าบริการ 140 บาท / ชั่วโมง (70.- / 30 นาที)</span>
                </li>
                <li>
                  <span className="text-slate-600">ชำระเงินผ่านพร้อมเพย์ QR Code อัตโนมัติ</span>
                </li>
              </ul>
            </div>

            {/* Rules Summary */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">กฎและเงื่อนไขการจองห้องซ้อม</h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>กรณียกเลิกการจองกรุณาแจ้งล่วงหน้าอย่างน้อย 24 ชม. ได้รับมัดจำคืนเต็มจำนวน</li>
                <li>กรณียกเลิกการจองน้อยกว่า 24 ชม. หักมัดจำ 50%</li>
                <li>กรณียกเลิกการจองกระชั้นชิด/ไม่มาตามนัดริบมัดจำ</li>
                <li>สำหรับคิววันจันทร์ ให้ดำเนินการจอง/ยกเลิกได้ภายในช่วงบ่าย/เย็นของวันอาทิตย์เท่านั้น (โดยต้องดำเนินการให้เสร็จสิ้นก่อนเวลาซ้อมอย่างน้อย 24 ชม.)</li>
                <li>หากผู้จองไม่ปฏิบัติตามเงื่อนไขที่กำหนด ทางชมรมขอสงวนสิทธิ์หัก/ริบมัดจำตามกฎ</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© 2026 Silpakorn University International Music Club. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg md:hidden">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === "schedule" ? "text-[#0070ea]" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === "schedule" ? "bg-blue-50" : ""}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <span className="mt-0.5">ตารางจอง</span>
        </button>

        <button
          onClick={() => setActiveTab("points")}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
            activeTab === "points" ? "text-[#0070ea]" : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === "points" ? "bg-blue-50" : ""}`}>
            <Award className="w-5 h-5" />
          </div>
          <span className="mt-0.5">สะสมแต้ม</span>
          {user && (
            <span className="absolute top-1 right-2 px-1.5 py-0.2 bg-[#0070ea] text-white text-[9px] rounded-full font-bold">
              {user.points}
            </span>
          )}
        </button>

        {user ? (
          <button
            onClick={() => setActiveTab("my-bookings")}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === "my-bookings" ? "text-[#0070ea]" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === "my-bookings" ? "bg-blue-50" : ""}`}>
              <UserIcon className="w-5 h-5" />
            </div>
            <span className="mt-0.5">การจองฉัน</span>
          </button>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-[#0070ea] transition-colors cursor-pointer"
          >
            <div className="p-1 rounded-lg">
              <UserIcon className="w-5 h-5" />
            </div>
            <span className="mt-0.5">เข้าสู่ระบบ</span>
          </button>
        )}

        {user?.role === "ADMIN" && (
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-[10px] font-semibold transition-colors cursor-pointer ${
              activeTab === "admin" ? "text-[#0070ea]" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <div className={`p-1 rounded-lg ${activeTab === "admin" ? "bg-blue-50" : ""}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="mt-0.5">แอดมิน</span>
          </button>
        )}
      </nav>
    </div>
  );
}
