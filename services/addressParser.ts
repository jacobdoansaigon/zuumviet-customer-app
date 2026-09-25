// services/addressParser.ts — "Dán từ Zalo": tách tên/SĐT/địa chỉ/ghi chú từ đoạn văn khách dán vào (thường
// copy nguyên tin nhắn Zalo/Messenger, lẫn lộn cả 3-4 thứ trong cùng đoạn). Ưu tiên gọi LLM qua BE
// (addressParseApi — chính xác hơn nhiều với văn phong tự do, viết tắt, không dấu); nếu BE chưa có endpoint
// (404), chưa cấu hình LLM (503), hay mạng lỗi thì tự tách bằng heuristic (regex tiếng Việt) để tính năng vẫn
// dùng được ngay, không chặn người dùng — kết quả offline luôn được đánh dấu rõ để khách tự kiểm tra lại.
import { addressParseApi, type ParsedAddress } from './api';

export type ParseSource = 'llm' | 'local';

export interface ParseAddressResult {
  result: ParsedAddress;
  source: ParseSource;
}

const ADDRESS_KEYWORDS = [
  'đường', 'duong', 'phường', 'phuong', 'xã ', 'xa ', 'quận', 'quan ', 'huyện', 'huyen',
  'tỉnh', 'tinh ', 'ngõ', 'ngo ', 'hẻm', 'hem ', 'tp.', 'tp ', 'khu phố', 'kp.', 'ấp ', 'thôn', 'thon ',
];
const HONORIFIC_RE = /^(anh|chị|chi|cô|co|chú|chu|bác|bac|em|ms|mr|a\.|c\.)\s*[:\-]?\s*/i;

function extractPhone(text: string): { phone: string; raw: string } | null {
  const re = /(?:\+?84|0)(?:[\s.\-]?\d){9}/g;
  const matches = text.match(re);
  if (!matches || !matches.length) return null;
  const raw = matches[0]!;
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('84') && digits.length > 10) digits = '0' + digits.slice(2);
  else if (!digits.startsWith('0')) digits = '0' + digits;
  return { phone: digits, raw };
}

function scoreAddressLine(line: string): number {
  const lower = line.toLowerCase();
  let score = 0;
  if (ADDRESS_KEYWORDS.some((k) => lower.includes(k))) score += 5;
  if (/^\s*\d+/.test(line)) score += 2; // bắt đầu bằng số nhà
  score += Math.min(3, (line.match(/,/g) || []).length); // nhiều dấu phẩy ~ nhiều cấp địa chỉ
  return score;
}

function extractAddress(lines: string[], phoneRaw: string | null): { address: string; index: number } | null {
  let best: { address: string; index: number; score: number } | null = null;
  lines.forEach((line, i) => {
    const clean = (phoneRaw ? line.replace(phoneRaw, '') : line).trim();
    if (!clean) return;
    const score = scoreAddressLine(clean);
    if (score > 0 && (!best || score > best.score)) {
      best = { address: clean.replace(/^[-•*]\s*/, ''), index: i, score };
    }
  });
  return best;
}

function extractName(lines: string[], usedIndexes: Set<number>, phoneRaw: string | null): { name: string; index: number } | null {
  for (let i = 0; i < lines.length; i++) {
    if (usedIndexes.has(i)) continue;
    let line = lines[i]!.trim();
    if (phoneRaw) line = line.replace(phoneRaw, '').trim();
    if (!line) continue;

    const labelMatch = line.match(/(?:tên|ten|name)\s*[:\-]\s*(.+)/i);
    if (labelMatch) return { name: labelMatch[1]!.trim(), index: i };

    if (HONORIFIC_RE.test(line)) return { name: line.replace(HONORIFIC_RE, '').trim(), index: i };

    // Dòng ngắn, không giống địa chỉ, không phải toàn số → coi là tên
    if (line.length <= 40 && scoreAddressLine(line) === 0 && !/^\d+$/.test(line)) {
      return { name: line, index: i };
    }
  }
  return null;
}

/** Tách offline (không cần mạng) — dùng khi chưa gọi được BE/LLM. Kết quả chỉ mang tính tham khảo. */
export function parseZaloTextLocally(text: string): ParsedAddress {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const phoneInfo = extractPhone(text);
  const usedIndexes = new Set<number>();

  const addressInfo = extractAddress(lines, phoneInfo?.raw ?? null);
  if (addressInfo) usedIndexes.add(addressInfo.index);

  const nameInfo = extractName(lines, usedIndexes, phoneInfo?.raw ?? null);
  if (nameInfo) usedIndexes.add(nameInfo.index);

  if (phoneInfo) {
    lines.forEach((line, i) => {
      if (line.includes(phoneInfo.raw)) usedIndexes.add(i);
    });
  }

  const noteLines = lines.filter((_, i) => !usedIndexes.has(i));

  return {
    name: nameInfo?.name ?? '',
    phone: phoneInfo?.phone ?? '',
    address: addressInfo?.address ?? '',
    note: noteLines.join(' · ').trim(),
  };
}

/** Gọi LLM qua BE (services/api.ts#addressParseApi); BE lỗi/chưa triển khai → tự tách offline để tính năng luôn hoạt động. */
export async function parseZaloText(text: string): Promise<ParseAddressResult> {
  const trimmed = text.trim();
  if (!trimmed) return { result: { name: '', phone: '', address: '', note: '' }, source: 'local' };

  try {
    const result = await addressParseApi.parse(trimmed);
    return { result, source: 'llm' };
  } catch {
    return { result: parseZaloTextLocally(trimmed), source: 'local' };
  }
}
