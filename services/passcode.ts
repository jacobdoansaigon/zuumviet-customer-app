// services/passcode.ts — luật passcode GIỐNG server (zuumviet-platform packages/shared/src/auth.ts passcodeWeakness):
// đúng 6 chữ số, không 6 số giống nhau, không phải dãy liên tiếp tăng/giảm. Kiểm ngay trên app để báo lỗi sớm.
export const PASSCODE_LENGTH = 6;

/** null = hợp lệ; ngược lại là câu báo lỗi tiếng Việt */
export function passcodeWeakness(passcode: string): string | null {
  if (!/^\d{6}$/.test(passcode)) return 'Passcode gồm đúng 6 chữ số';
  if (/^(\d)\1{5}$/.test(passcode)) return 'Passcode không được gồm 6 số giống nhau';
  const digits = passcode.split('').map(Number);
  const steps = digits.slice(1).map((d, i) => d - digits[i]!);
  if (steps.every((s) => s === 1) || steps.every((s) => s === -1)) return 'Passcode không được là dãy số liên tiếp';
  return null;
}

/** Kiểm định dạng SĐT Việt Nam người dùng gõ (server chuẩn hoá lại; ở đây chỉ để bật/tắt nút) */
export function looksLikeVnPhone(input: string): boolean {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length >= 11) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.length === 9;
}
