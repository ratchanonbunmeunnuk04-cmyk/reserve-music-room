"use client";

import React from "react";
import { Award, LogIn, LogOut } from "lucide-react";
import { User } from "@/lib/types";

interface NavbarProps {
  user: User | null;
  activeTab: "schedule" | "points" | "my-bookings" | "admin";
  onTabChange: (tab: "schedule" | "points" | "my-bookings" | "admin") => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export function Navbar({ user, activeTab, onTabChange, onOpenLogin, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange("schedule")}>
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0 bg-white">
            <img
              src="/su-band-logo.png"
              alt="SU BAND Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">SU BAND</span>
            <p className="text-xs text-slate-500 hidden sm:block">ชมรมดนตรีสากล มหาวิทยาลัยศิลปากร</p>
          </div>
        </div>

        {/* User / Auth Action */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Points Badge (Desktop) */}
              <div
                onClick={() => onTabChange("points")}
                className="cursor-pointer hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors"
              >
                <Award className="w-4 h-4 text-[#0070ea]" />
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-800">{user.points} แต้ม</div>
                  <div className="text-[10px] text-slate-500">
                    {user.points >= 10 ? "พร้อมแลกฟรี 1 ชม." : `อีก ${10 - user.points} แต้มได้ฟรี`}
                  </div>
                </div>
              </div>

              {/* Points Badge (Mobile) */}
              <button
                onClick={() => onTabChange("points")}
                className="sm:hidden flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-200 text-[#0070ea] text-xs font-bold"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{user.points} pt</span>
              </button>

              {/* Profile Pill */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-semibold text-slate-800">{user.name}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[130px]">{user.email}</div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0070ea] text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0070ea] hover:bg-[#005bb5] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>เข้าสู่ระบบ Google</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
