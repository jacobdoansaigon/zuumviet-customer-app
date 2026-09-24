// Định dạng tiền / ngày cho màn Ví
const pad = (n: number) => String(n).padStart(2, '0');

/** 24000 → "24.000" (không dấu âm) */
export function formatVnd(n: number) {
  return String(Math.abs(Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 24000 → "24.000đ" ; -50000 → "-50.000đ" ; có dấu + khi signed */
export function formatVndSigned(n: number, opts: { plus?: boolean } = {}) {
  const sign = n < 0 ? '-' : opts.plus && n > 0 ? '+' : '';
  return `${sign}${formatVnd(n)}đ`;
}

/** "10/04/2020 15:00" */
export function formatDateTime(ms: number, sep = ' ') {
  const d = new Date(ms);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}${sep}${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Chuỗi người nhập ("50.000", "50,000", "50000đ") → số */
export function parseAmountInput(text: string): number {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}
