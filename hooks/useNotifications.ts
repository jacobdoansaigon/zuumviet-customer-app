// useNotifications — FCM push notification setup
// Registers device token, handles incoming notifications + deep links
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import { router } from 'expo-router';

// Configure how notifications are displayed while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushToken = string;

type UseNotificationsOptions = {
  onTokenReady?: (token: PushToken) => void;
};

export function useNotifications({ onTokenReady }: UseNotificationsOptions = {}) {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token && onTokenReady) onTokenReady(token);
    });

    // Notification received while app is open (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notification received]', notification);
        // Pusher handles real-time orders; this is for other push types
      }
    );

    // User tapped a notification (background/killed)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string>;
        handleNotificationNavigation(data);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}

// Navigate based on notification type
function handleNotificationNavigation(data: Record<string, string>) {
  const { type, orderId } = data;
  switch (type) {
    case 'new_order':
      router.push('/(tabs)'); // home handles new order
      break;
    case 'order_status':
      router.push('/(tabs)/orders');
      break;
    case 'wallet':
      router.push('/(tabs)/wallet');
      break;
    case 'system':
      router.push('/(tabs)/community');
      break;
    default:
      router.push('/(tabs)');
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
    Alert.alert(
      'Thông báo bị tắt',
      'Hãy bật thông báo trong Cài đặt để nhận đơn hàng mới.',
      [{ text: 'OK' }]
    );
    return null;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Đơn hàng mới',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6B35D4',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('system', {
      name: 'Thông báo hệ thống',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Get Expo push token (use projectId from app config in production)
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}
