// Business rules for Silpakorn International Music Club room reservation
export const MON_WED_SLOTS = [
  { start: "19:30", end: "20:00" },
  { start: "20:00", end: "20:30" },
  { start: "20:30", end: "21:00" },
  { start: "21:00", end: "21:30" },
];

export const TUE_THU_FRI_SLOTS = [
  { start: "17:00", end: "17:30" },
  { start: "17:30", end: "18:00" },
  { start: "18:00", end: "18:30" },
  { start: "18:30", end: "19:00" },
  { start: "19:00", end: "19:30" },
  { start: "19:30", end: "20:00" },
  { start: "20:00", end: "20:30" },
  { start: "20:30", end: "21:00" },
  { start: "21:00", end: "21:30" },
];

export const SLOT_PRICE = 70; // THB per 30 mins
export const HOURLY_PRICE = 140; // THB per 1 hr (2 slots)
export const POINTS_PER_HOUR = 1;
export const POINTS_FOR_FREE_HOUR = 10;
export const FREE_HOUR_DISCOUNT = 140; // THB
export const HOLD_EXPIRATION_MINUTES = 15;

/**
 * Returns configured slots for a given day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getAvailableSlotsForDay(dayOfWeek: number) {
  // 1 = Monday, 3 = Wednesday
  if (dayOfWeek === 1 || dayOfWeek === 3) {
    return MON_WED_SLOTS;
  }
  // 2 = Tuesday, 4 = Thursday, 5 = Friday
  if (dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 5) {
    return TUE_THU_FRI_SLOTS;
  }
  // 0 = Sunday, 6 = Saturday -> Closed
  return [];
}

/**
 * Calculates total, discount, net amount, and points earned
 */
export function calculateBookingFinances(slotsCount: number, usePoints: boolean, userCurrentPoints: number) {
  const totalAmount = slotsCount * SLOT_PRICE;
  const canRedeem = usePoints && userCurrentPoints >= POINTS_FOR_FREE_HOUR && slotsCount >= 2;
  const discountAmount = canRedeem ? FREE_HOUR_DISCOUNT : 0;
  const netAmount = Math.max(0, totalAmount - discountAmount);
  const pointsUsed = canRedeem ? POINTS_FOR_FREE_HOUR : 0;

  // Paid slots: deduct 2 free slots if redeemed
  const paidSlots = canRedeem ? Math.max(0, slotsCount - 2) : slotsCount;
  // 2 slots (1 full hour) = 1 point. Fractional 1 slot = 0 points.
  const pointsEarned = Math.floor(paidSlots / 2);

  return {
    totalAmount,
    discountAmount,
    netAmount,
    pointsUsed,
    pointsEarned,
  };
}

/**
 * Validates whether selected slots are valid and contiguous
 */
export function validateSlotSelection(dateStr: string, selectedSlots: string[]) {
  if (!selectedSlots || selectedSlots.length === 0) {
    return { valid: false, error: "กรุณาเลือกเวลาจองอย่างน้อย 1 ช่วงเวลา (30 นาที)" };
  }

  const dateObj = new Date(dateStr + "T00:00:00");
  const dayOfWeek = dateObj.getDay();
  const allowedSlots = getAvailableSlotsForDay(dayOfWeek);

  if (allowedSlots.length === 0) {
    return { valid: false, error: "ห้องซ้อมปิดทำการในวันเสาร์และวันอาทิตย์" };
  }

  // Check if every slot is in allowedSlots
  const allowedTimes = allowedSlots.map((s) => s.start);
  for (const slot of selectedSlots) {
    if (!allowedTimes.includes(slot)) {
      return { valid: false, error: `เวลา ${slot} ไม่อยู่ในช่วงเวลาที่เปิดให้บริการ` };
    }
  }

  // Sort slots by time
  const sorted = [...selectedSlots].sort();
  // Check contiguity: find indices in allowedTimes
  const indices = sorted.map((t) => allowedTimes.indexOf(t));
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] !== indices[i - 1] + 1) {
      return { valid: false, error: "ช่วงเวลาที่เลือกต้องเป็นเวลาที่ต่อเนื่องกัน" };
    }
  }

  const startTime = sorted[0];
  const lastIndex = allowedTimes.indexOf(sorted[sorted.length - 1]);
  const endTime = allowedSlots[lastIndex].end;

  return {
    valid: true,
    startTime,
    endTime,
    slots: sorted,
    slotsCount: sorted.length,
  };
}
