// useNotifications — push (Expo Push) + đăng ký thiết bị với API.
// - PUT /v1/customer/devices/:deviceId {platform, appVersion, osVersion, model, pushToken, pushEnabled} sau khi đăng nhập,
//   khi mở app (đã đăng nhập) và mỗi khi Expo đổi token. Không có token (giả lập, web, từ chối quyền) vẫn đăng ký
//   với pushToken null để server biết máy này. Đăng xuất: services/session.ts gỡ thiết bị.
// - Kênh Android server dùng: "orders" (đơn hàng) và "default" — tạo sẵn khi mở app.
// - data của push: { type: 'order'|'wallet'|'system'|'campaign'|…, notificationId, orderId?, bookingId?, tripId? }.
//   Đang mở app: gợi ý màn theo dõi tải lại; bấm thông báo: đánh dấu đã đọc + mở đúng màn.
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router, type Href } from 'expo-router';
import { api, getDeviceId, hasSession, onSessionChange } from '@/services/zuum';
import { emitOrderHint, onOrderHint } from '@/services/realtime';
import { getProfile } from '@/services/session';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/** Payload `data` của push do API gửi */
export interface PushData {
  type: string;
  notificationId: string | null;
  orderId: string | null;
  bookingId: string | null;
  tripId: string | null;
}

function readPushData(raw: unknown): PushData | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.type !== 'string') return null;
  const s = (v: unknown) => (typeof v === 'string' && v ? v : null);
  return { type: d.type, notificationId: s(d.notificationId), orderId: s(d.orderId), bookingId: s(d.bookingId), tripId: s(d.tripId) };
}

/** Tick tăng mỗi khi có push về đơn `orderId` lúc app đang mở — đưa vào deps của effect tải lại đơn */
export function useOrderPushRefresh(orderId: string | null): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!orderId) return;
    return onOrderHint((id) => {
      if (id === orderId) setTick((t) => t + 1);
    });
  }, [orderId]);
  return tick;
}

// ---------------------------------------------------------------- đăng ký thiết bị
let pushToken: string | null = null;
let pushEnabled = false;
let registeredKey: string | null = null;

const APP_VERSION = String(Constants.expoConfig?.version ?? '1.0.0');
const PLATFORM: 'ios' | 'android' | 'web' = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

/** Gửi thông tin thiết bị + push token lên API (bỏ qua nếu chưa đăng nhập hoặc đã gửi đúng nội dung này) */
export async function syncDevice(): Promise<void> {
  if (!(await hasSession())) return;
  const profile = await getProfile();
  const deviceId = await getDeviceId();
  const key = `${profile?.id ?? ''}|${pushToken ?? ''}|${pushEnabled ? 1 : 0}`;
  if (registeredKey === key) return;
  try {
    await api('PUT /v1/customer/devices/:deviceId', {
      params: { deviceId },
      body: {
        platform: PLATFORM,
        appVersion: APP_VERSION,
        osVersion: Device.osVersion ? `${Platform.OS} ${Device.osVersion}` : Platform.OS,
        model: [Device.brand, Device.modelName].filter(Boolean).join(' ') || undefined,
        pushToken,
        pushEnabled: !!pushToken && pushEnabled,
      },
    });
    registeredKey = key;
  } catch (e) {
    console.warn('[push] đăng ký thiết bị lỗi', e);
  }
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('orders', {
    name: 'Đơn hàng',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#59267C',
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Thông báo chung',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#59267C',
    sound: 'default',
  });
}

async function obtainPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  pushEnabled = status === 'granted';
  if (!pushEnabled) return null;
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return token.data;
  } catch (e) {
    // thiếu projectId (chưa build EAS) / không có Google Play Services → app vẫn chạy, chỉ không nhận push
    console.warn('[push] không lấy được Expo push token', e);
    return null;
  }
}

// ---------------------------------------------------------------- bấm thông báo
async function markRead(notificationId: string | null) {
  if (!notificationId) return;
  try {
    await api('POST /v1/customer/notifications/:id/read', { params: { id: notificationId } });
  } catch {
    /* không quan trọng */
  }
}

function hrefFor(data: PushData): Href {
  if (data.orderId) return { pathname: '/booking/tracking', params: { orderId: data.orderId } };
  if (data.bookingId) return { pathname: '/booking/intercity/ticket/[orderId]', params: { orderId: data.bookingId } };
  if (data.tripId) return '/booking/intercity/tickets';
  if (data.type === 'wallet') return '/wallet';
  if (data.notificationId) return { pathname: '/inbox/[id]', params: { id: data.notificationId } };
  return '/inbox';
}

async function handleOpen(raw: unknown) {
  const data = readPushData(raw);
  if (!data) return;
  if (!(await hasSession())) return;
  void markRead(data.notificationId);
  router.push(hrefFor(data));
}

export function useNotifications() {
  useEffect(() => {
    let alive = true;
    void ensureAndroidChannels().catch(() => undefined);

    void obtainPushToken().then((token) => {
      if (!alive) return;
      pushToken = token;
      void syncDevice();
    });

    // Expo đổi token (hiếm) → cập nhật lên server
    const tokenSub = Platform.OS === 'web' ? null : Notifications.addPushTokenListener(() => {
      void obtainPushToken().then((token) => {
        pushToken = token;
        void syncDevice();
      });
    });

    const offSession = onSessionChange((event) => {
      if (event === 'login') void syncDevice();
      else registeredKey = null;
    });

    const receivedSub =
      Platform.OS === 'web'
        ? null
        : Notifications.addNotificationReceivedListener((n) => {
            const data = readPushData(n.request.content.data);
            if (data?.orderId) emitOrderHint(data.orderId);
          });

    const responseSub =
      Platform.OS === 'web'
        ? null
        : Notifications.addNotificationResponseReceivedListener((response) => {
            void handleOpen(response.notification.request.content.data);
          });

    // mở app từ thông báo khi app đang tắt hẳn
    if (Platform.OS !== 'web') {
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) void handleOpen(response.notification.request.content.data);
        })
        .catch(() => undefined);
    }

    return () => {
      alive = false;
      tokenSub?.remove();
      offSession();
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, []);
}
