// useNotifications — push qua Expo Push (zv-notify gửi ExponentPushToken[...] lên exp.host).
// - Lấy Expo push token → GET /site/notifydevices/init (cần JWT) ngay khi có token và mỗi lần đăng nhập lại;
//   đăng xuất → /deinit để BE ngừng gửi về máy này.
// - Push từ zv-delivery tới khách: data.type = 'deliveryorder_accept' {driver_account_id, order_id}
//   | 'deliveryorder_update' {order_id, order_status, order_detail_id, order_detail_status, ...}.
//   Foreground: phát sự kiện cho màn theo dõi (useOrderPushRefresh) để poll ngay; bấm vào thông báo: mở màn theo dõi đơn.
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { addSessionListener, deviceApi, getStoredCustomer } from '@/services/api';

// Configure how notifications are displayed while app is foregrounded
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export type PushToken = string;

export type OrderPushData = {
  type: string;
  order_id?: number | string;
  order_status?: number | string;
  driver_account_id?: number | string;
  [key: string]: unknown;
};

type UseNotificationsOptions = {
  onTokenReady?: (token: PushToken) => void;
};

// ---------------------------------------------------------------- bus push đơn hàng (foreground)
const orderPushListeners = new Set<(data: OrderPushData) => void>();

export function subscribeOrderPush(listener: (data: OrderPushData) => void): () => void {
  orderPushListeners.add(listener);
  return () => {
    orderPushListeners.delete(listener);
  };
}

function emitOrderPush(data: OrderPushData) {
  orderPushListeners.forEach((l) => l(data));
}

/** Tick tăng mỗi khi có push về đơn `orderId` (null = mọi đơn) — màn theo dõi đưa vào deps của effect poll */
export function useOrderPushRefresh(orderId: string | null): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return subscribeOrderPush((data) => {
      if (orderId == null || String(data.order_id ?? '') === orderId) setTick((t) => t + 1);
    });
  }, [orderId]);
  return tick;
}

const isOrderPush = (data: Record<string, unknown>): data is OrderPushData =>
  typeof data.type === 'string' && data.type.startsWith('deliveryorder_');

// ---------------------------------------------------------------- đăng ký thiết bị với BE
let currentPushToken: PushToken | null = null;
let registeredFor: string | null = null; // `${accountId}:${token}` đã init thành công

/** Gửi token lên zv-notify nếu đã đăng nhập (idempotent theo tài khoản + token) */
export async function syncPushDevice(): Promise<void> {
  if (!currentPushToken) return;
  const customer = await getStoredCustomer();
  if (!customer?.id) return;
  const key = `${customer.id}:${currentPushToken}`;
  if (registeredFor === key) return;
  try {
    const { width, height } = Dimensions.get('window');
    await deviceApi.init(currentPushToken, {
      screen_width: Math.round(width),
      screen_height: Math.round(height),
      device_name: Device.modelName ?? '',
      device_brand: Device.brand ?? '',
      os: `${Platform.OS} ${Device.osVersion ?? ''}`.trim(),
    });
    registeredFor = key;
  } catch (e) {
    console.warn('[push] notifydevices/init failed', e);
  }
}

async function unregisterPushDevice(): Promise<void> {
  if (!currentPushToken) return;
  registeredFor = null;
  try {
    await deviceApi.deinit(currentPushToken);
  } catch {
    /* token hết hạn cũng không sao */
  }
}

export function useNotifications({ onTokenReady }: UseNotificationsOptions = {}) {
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    registerForPushNotifications().then((token) => {
      if (!token) return;
      currentPushToken = token;
      void syncPushDevice();
      if (onTokenReady) onTokenReady(token);
    });

    const unsubscribeSession = addSessionListener((event) => {
      if (event === 'login') void syncPushDevice();
      else void unregisterPushDevice();
    });

    // Notification received while app is open (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = (notification.request.content.data ?? {}) as Record<string, unknown>;
      if (isOrderPush(data)) emitOrderPush(data);
    });

    // Người dùng bấm vào thông báo (nền / đã tắt app)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = (response.notification.request.content.data ?? {}) as Record<string, unknown>;
      if (isOrderPush(data)) emitOrderPush(data);
      handleNotificationNavigation(data);
    });

    // App mở từ thông báo khi đang tắt hẳn
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        handleNotificationNavigation((response.notification.request.content.data ?? {}) as Record<string, unknown>);
      })
      .catch(() => undefined);

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
      unsubscribeSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// Điều hướng theo loại push
function handleNotificationNavigation(data: Record<string, unknown>) {
  const type = String(data.type ?? '');
  const orderId = data.order_id != null ? String(data.order_id) : '';
  if (type.startsWith('deliveryorder_') && orderId) {
    router.push({ pathname: '/booking/tracking', params: { orderId } });
    return;
  }
  switch (type) {
    case 'wallet':
      router.push('/wallet');
      break;
    case 'system':
      router.push('/account');
      break;
    default:
      router.push('/home');
  }
}

async function registerForPushNotifications(): Promise<PushToken | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices.');
    return null;
  }

  // Check & request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Thông báo bị tắt', 'Hãy bật thông báo trong Cài đặt để nhận cập nhật đơn hàng.', [{ text: 'OK' }]);
    return null;
  }

  // Android channel — zv-notify gửi channelId 'default'
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Đơn hàng',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#59267C',
      sound: 'default',
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (e) {
    // Thiếu projectId (chưa build EAS) hoặc không có Google Play Services → không có push, app vẫn chạy
    console.warn('[push] getExpoPushTokenAsync failed', e);
    return null;
  }
}
