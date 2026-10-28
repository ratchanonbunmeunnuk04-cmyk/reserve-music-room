import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบจองห้องซ้อมดนตรี | ชมรมดนตรีสากล มหาวิทยาลัยศิลปากร (SU BAND)",
  description: "ระบบจองห้องซ้อมดนตรี ชมรมดนตรีสากล มหาวิทยาลัยศิลปากร (SU BAND) พร้อมตาราง Real-time ระบบสะสมแต้ม 10 ชม. ฟรี 1 ชม. และชำระเงินผ่าน QR Code พร้อมเพย์",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-slate-900">{children}</body>
    </html>
  );
}
