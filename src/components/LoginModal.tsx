"use client";

import React, { useState } from "react";
import { X, Shield, User as UserIcon, Mail } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (data: { email: string; name: string; role?: "USER" | "ADMIN" }) => void;
}

export function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) return;
    setIsSubmitting(true);
    onLogin({
      email: customEmail,
      name: customName,
      role: customEmail.toLowerCase().includes("admin") ? "ADMIN" : "USER",
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl text-slate-900">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#0070ea] flex items-center justify-center mb-3">
            <UserIcon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">เข้าสู่ระบบจองห้องซ้อม</h2>
          <p className="text-xs text-slate-500 mt-1">
            ชมรมดนตรีสากล มหาวิทยาลัยศิลปากร (SU BAND)
          </p>
        </div>

        {/* Demo Fast Login Options */}
        <div className="space-y-3 mb-6">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            เลือกบัญชีเพื่อทดสอบระบบทันที (Quick Switcher)
          </div>

          {/* Student Option */}
          <button
            onClick={() =>
              onLogin({
                email: "student@su.ac.th",
                name: "กวินท์ พงษ์ไพศาล",
                role: "USER",
              })
            }
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0070ea] hover:bg-blue-50/30 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#0070ea] flex items-center justify-center font-bold text-sm">
                S
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-[#0070ea] transition-colors">
                  กวินท์ พงษ์ไพศาล (นักศึกษา)
                </div>
                <div className="text-xs text-slate-500">student@su.ac.th • สะสม 8 แต้ม</div>
              </div>
            </div>
            <span className="text-xs text-slate-700 font-medium px-2 py-1 rounded-md bg-white border border-slate-200 shadow-sm">
              เข้าใช้งาน
            </span>
          </button>

          {/* Admin Option */}
          <button
            onClick={() =>
              onLogin({
                email: "admin@su.ac.th",
                name: "กิตติศักดิ์ ชูเกียรติ (ประธานชมรม)",
                role: "ADMIN",
              })
            }
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#0070ea] hover:bg-blue-50/30 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#0070ea] flex items-center justify-center font-bold text-sm">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-800 group-hover:text-[#0070ea] transition-colors">
                  ประธานชมรม / ผู้ดูแลระบบ
                </div>
                <div className="text-xs text-slate-500">admin@su.ac.th • สิทธิ์ตรวจสลิปและอนุมัติ</div>
              </div>
            </div>
            <span className="text-xs text-[#0070ea] font-medium px-2 py-1 rounded-md bg-blue-50 border border-blue-200">
              โหมด Admin
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-400">หรือ เข้าสู่ระบบด้วยอีเมลของคุณ</span>
          </div>
        </div>

        {/* Custom Google Email Form */}
        <form onSubmit={handleCustomLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อ-นามสกุล / ชื่อวง</label>
            <input
              type="text"
              required
              placeholder="เช่น วง The Silpakorn"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0070ea] focus:ring-1 focus:ring-[#0070ea] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Google / Silpakorn Email (@su.ac.th หรือ Gmail)
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="yourname@su.ac.th หรือ gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0070ea] focus:ring-1 focus:ring-[#0070ea] transition-colors"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-[#0070ea] hover:bg-[#005bb5] text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
          >
            เข้าสู่ระบบและเริ่มใช้งาน
          </button>
        </form>
      </div>
    </div>
  );
}
