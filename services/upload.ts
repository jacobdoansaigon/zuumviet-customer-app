// services/upload.ts — tải ảnh lên kho file của API (ảnh đại diện, ảnh gọi thợ, ảnh bằng chứng huỷ đơn).
// POST /v1/customer/files {purpose, contentType, size} → PUT đúng byte lên URL ký sẵn (đúng các header được ký: content-type +
// độ dài) → POST /files/:id/complete (server kiểm tra nội dung) → trả fileId. Lỗi ở bước nào cũng ném ra — KHÔNG bao giờ
// trả id giả để màn hình "đi tiếp" khi ảnh chưa lên được.
//
// Trên điện thoại PHẢI gửi bằng expo-file-system (File.upload, như app Đối tác): fetch(blob) của React Native trên Android
// không gửi đúng byte / độ dài như link đã ký → kho từ chối, ảnh không bao giờ lên (lỗi anh Jacob gặp 16/10/2026: chỉ có
// bước xin link, không có bước complete). Web vẫn dùng fetch(blob).
import { Platform } from 'react-native';
import { File, UploadType } from 'expo-file-system';
import { api, ZuumApiError, type ZuumRoutes } from '@/services/zuum';

export type UploadPurpose = Extract<ZuumRoutes['POST /v1/customer/files']['body']['purpose'], 'avatar' | 'order_proof' | 'order_photo'>;

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/** Định dạng thật theo vài byte đầu (server cũng kiểm như vậy — không tin đuôi file / mimeType của picker) */
function sniff(head: Uint8Array): string | null {
  const b = (i: number) => head[i] ?? -1;
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return 'image/jpeg';
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return 'image/png';
  if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50) return 'image/webp';
  return null;
}

function normalizeType(t: string | null | undefined): string {
  const v = (t ?? '').toLowerCase().split(';')[0]!.trim();
  return v === 'image/jpg' ? 'image/jpeg' : v;
}

const readError = () => new ZuumApiError(0, 'file.read_failed', 'Không đọc được ảnh, vui lòng chọn lại');

type Source = { size: number; contentType: string; put: (url: string, method: string, headers: Record<string, string>) => Promise<number> };

async function nativeSource(uri: string, mimeType?: string | null): Promise<Source> {
  const file = new File(uri);
  if (!file.exists) throw readError();
  const handle = file.open();
  let head: Uint8Array;
  try {
    head = handle.readBytes(16);
  } finally {
    handle.close();
  }
  const contentType = sniff(head) ?? normalizeType(mimeType || file.type);
  return {
    size: file.size,
    contentType,
    put: async (url, method, headers) => {
      const res = await file.upload(url, { httpMethod: method === 'POST' ? 'POST' : 'PUT', uploadType: UploadType.BINARY_CONTENT, headers, mimeType: contentType });
      return res.status;
    },
  };
}

async function webSource(uri: string, mimeType?: string | null): Promise<Source> {
  const blob = await (await fetch(uri)).blob();
  const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const contentType = sniff(head) ?? normalizeType(mimeType || blob.type);
  return {
    size: blob.size,
    contentType,
    put: async (url, method, headers) => {
      // PUT thẳng lên kho (URL ký sẵn) — ngoại lệ duy nhất không đi qua api()
      const res = await fetch(url, { method, headers, body: blob });
      return res.status;
    },
  };
}

/**
 * Tải 1 ảnh (uri cục bộ từ expo-image-picker: file:// trên điện thoại, blob: trên web) và trả về fileId đã sẵn sàng.
 * `mimeType` của picker chỉ dùng khi không nhận ra định dạng từ byte đầu.
 */
export async function uploadFile(localUri: string, purpose: UploadPurpose, mimeType?: string | null): Promise<string> {
  let source: Source;
  try {
    source = Platform.OS === 'web' ? await webSource(localUri, mimeType) : await nativeSource(localUri, mimeType);
  } catch (e) {
    if (e instanceof ZuumApiError) throw e;
    throw readError();
  }
  if (!(ALLOWED_TYPES as readonly string[]).includes(source.contentType)) {
    throw new ZuumApiError(0, 'file.invalid_type', 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP');
  }
  if (!source.size) throw readError();
  if (source.size > MAX_BYTES) throw new ZuumApiError(0, 'file.too_large', 'Ảnh vượt quá 10 MB, vui lòng chọn ảnh nhỏ hơn');

  const target = await api('POST /v1/customer/files', { body: { purpose, contentType: source.contentType, size: source.size } });
  let status = 0;
  try {
    status = await source.put(target.url, target.method, target.headers);
  } catch {
    status = 0;
  }
  if (status < 200 || status >= 300) {
    throw new ZuumApiError(0, 'file.upload_failed', status ? `Tải ảnh lên không thành công (mã ${status}), vui lòng thử lại` : 'Tải ảnh lên không thành công, kiểm tra mạng và thử lại');
  }

  const done = await api('POST /v1/customer/files/:id/complete', { params: { id: target.fileId } });
  if (done.status !== 'ready') throw new ZuumApiError(422, 'file.rejected', 'Ảnh không hợp lệ, vui lòng chọn ảnh khác');
  return target.fileId;
}
