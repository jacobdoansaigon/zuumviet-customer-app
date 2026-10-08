// services/upload.ts — tải ảnh lên kho file của API (ảnh đại diện, ảnh bằng chứng huỷ đơn).
// POST /v1/customer/files {purpose, contentType, size} → PUT đúng byte lên URL ký sẵn (đúng các header được ký)
// → POST /files/:id/complete (server kiểm tra nội dung) → trả fileId. Lỗi ở bước nào cũng ném ra — KHÔNG bao giờ
// trả id giả để màn hình "đi tiếp" khi ảnh chưa lên được.
import { api, ZuumApiError, type ZuumRoutes } from '@/services/zuum';

export type UploadPurpose = Extract<ZuumRoutes['POST /v1/customer/files']['body']['purpose'], 'avatar' | 'order_proof'>;

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function guessType(uri: string): string {
  const ext = uri.split('?')[0]!.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return '';
}

function normalizeType(t: string): string {
  const v = t.toLowerCase().split(';')[0]!.trim();
  return v === 'image/jpg' ? 'image/jpeg' : v;
}

/**
 * Tải 1 ảnh (uri cục bộ từ expo-image-picker: file://, content://, blob: trên web) và trả về fileId đã sẵn sàng.
 * `mimeType` lấy từ kết quả image-picker nếu có (chính xác hơn đoán theo đuôi file).
 */
export async function uploadFile(localUri: string, purpose: UploadPurpose, mimeType?: string | null): Promise<string> {
  let blob: Blob;
  try {
    const local = await fetch(localUri);
    blob = await local.blob();
  } catch {
    throw new ZuumApiError(0, 'file.read_failed', 'Không đọc được ảnh, vui lòng chọn lại');
  }
  const contentType = normalizeType(mimeType || blob.type || guessType(localUri));
  if (!(ALLOWED_TYPES as readonly string[]).includes(contentType)) {
    throw new ZuumApiError(0, 'file.invalid_type', 'Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP');
  }
  if (!blob.size) throw new ZuumApiError(0, 'file.read_failed', 'Không đọc được ảnh, vui lòng chọn lại');
  if (blob.size > MAX_BYTES) throw new ZuumApiError(0, 'file.too_large', 'Ảnh vượt quá 10 MB, vui lòng chọn ảnh nhỏ hơn');

  const target = await api('POST /v1/customer/files', { body: { purpose, contentType, size: blob.size } });
  let ok = false;
  try {
    // PUT thẳng lên kho (URL ký sẵn) — ngoại lệ duy nhất không đi qua api()
    const put = await fetch(target.url, { method: target.method, headers: target.headers, body: blob });
    ok = put.ok;
  } catch {
    ok = false;
  }
  if (!ok) throw new ZuumApiError(0, 'file.upload_failed', 'Tải ảnh lên không thành công, vui lòng thử lại');

  const done = await api('POST /v1/customer/files/:id/complete', { params: { id: target.fileId } });
  if (done.status !== 'ready') throw new ZuumApiError(422, 'file.rejected', 'Ảnh không hợp lệ, vui lòng chọn ảnh khác');
  return target.fileId;
}
