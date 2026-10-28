/**
 * Helper to compute the active booking week (Monday to Sunday)
 * Rule:
 * - One week at a time (Mon - Sun).
 * - Next week unlocks only on Sunday at 12:00 PM (noon).
 */
export interface WeekDayItem {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // จันทร์, อังคาร, ...
  label: string; // 20 ต.ค.
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  isPast: boolean; // Before today
  isToday: boolean;
  isClosed: boolean; // Sat or Sun
}

export function getActiveWeekRange(now: Date = new Date()): {
  monday: Date;
  days: WeekDayItem[];
  isNextWeekUnlocked: boolean;
  weekLabel: string;
} {
  const currentDay = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const currentHour = now.getHours();

  // Determine Monday of the active booking week
  const targetMonday = new Date(now);
  targetMonday.setHours(0, 0, 0, 0);

  let isNextWeekUnlocked = false;

  if (currentDay === 0) {
    // Sunday
    if (currentHour >= 12) {
      // 12:00 PM or later -> shift to next week Monday (+1 day)
      targetMonday.setDate(now.getDate() + 1);
      isNextWeekUnlocked = true;
    } else {
      // Before noon -> still current week Monday (-6 days)
      targetMonday.setDate(now.getDate() - 6);
    }
  } else {
    // Monday (1) to Saturday (6) -> current week Monday
    targetMonday.setDate(now.getDate() - (currentDay - 1));
  }

  const todayStr = toLocalDateString(now);
  const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสฯ", "ศุกร์", "เสาร์"];
  const days: WeekDayItem[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(targetMonday);
    d.setDate(targetMonday.getDate() + i);

    const dateStr = toLocalDateString(d);
    const dayOfWeek = d.getDay();
    const isClosed = dayOfWeek === 0 || dayOfWeek === 6;
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;

    days.push({
      dateStr,
      dayName: dayNames[dayOfWeek],
      label: `${d.getDate()} ${getMonthName(d.getMonth())}`,
      dayOfWeek,
      isPast,
      isToday,
      isClosed,
    });
  }

  const firstDay = days[0];
  const lastDay = days[days.length - 1];
  const weekLabel = `${firstDay.label} - ${lastDay.label}`;

  return {
    monday: targetMonday,
    days,
    isNextWeekUnlocked,
    weekLabel,
  };
}

export function isDateInActiveWeek(dateStr: string, now: Date = new Date()): boolean {
  const { days } = getActiveWeekRange(now);
  return days.some((d) => d.dateStr === dateStr && !d.isPast && !d.isClosed);
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

function getMonthName(monthIndex: number): string {
  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
  return months[monthIndex] || "";
}
