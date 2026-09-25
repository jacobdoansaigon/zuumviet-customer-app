// services/shareLink.ts — "Theo dõi chuyến xe" cho người thân: sinh link chia sẻ và mở hộp thoại chia sẻ
// của hệ điều hành (native) / trình duyệt (web), có dự phòng sao chép vào clipboard.
// Demo: link chỉ có dạng đúng (https://zuumviet.vn/track/...), chưa có trang web thật để mở link này.
import { Platform, Share } from 'react-native';

export type ShareResult = 'shared' | 'copied' | 'unavailable';

export function buildTrackingLink(kind: 'trip' | 'ticket' | 'carpool', id: string): string {
  return `https://zuumviet.vn/track/${kind}/${id}`;
}

interface ShareTrackingInput {
  title: string;
  message: string;
  url: string;
}

export async function shareTrackingLink({ title, message, url }: ShareTrackingInput): Promise<ShareResult> {
  const text = `${message}\n${url}`;
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? (navigator as unknown as { share?: (d: { title?: string; text?: string; url?: string }) => Promise<void> }) : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title, text: message, url });
        return 'shared';
      } catch {
        // Người dùng bấm huỷ hộp thoại chia sẻ — không tính là lỗi
        return 'shared';
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      return 'copied';
    } catch {
      return 'unavailable';
    }
  }
  try {
    await Share.share({ message: text, title, url });
    return 'shared';
  } catch {
    return 'unavailable';
  }
}
