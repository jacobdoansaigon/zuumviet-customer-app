// services/vnTime.ts — ngày giờ theo GIỜ VIỆT NAM (UTC+7) bất kể múi giờ của máy (lịch hẹn, ngày đi xe đường dài).
export const VN_OFFSET_MS = 7 * 3600 * 1000;

/** "YYYY-MM-DD" theo giờ VN của thời điểm `ms` */
export function vnDateKey(ms: number = Date.now()): string {
  return new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Ngày (giờ VN) + "HH:mm" → epoch ms */
export function vnDateTime(dateKey: string, time: string): number {
  return Date.parse(`${dateKey}T${time}:00+07:00`);
}
