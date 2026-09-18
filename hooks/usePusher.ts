// usePusher — real-time order notifications via Pusher
// Connects to Pusher channel and listens for new order events
import { useEffect, useRef, useCallback } from 'react';
import Pusher, { Channel } from 'pusher-js';

const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY ?? '';
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER ?? 'mt1';

export type IncomingOrder = {
  orderId: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance: string;
  fee: string;
  estimatedTime: string; // "15 phút"
  customerName: string;
  note?: string;
};

type UsePusherOptions = {
  driverId: string;
  onNewOrder: (order: IncomingOrder) => void;
  onOrderCancelled: (orderId: string) => void;
};

export function usePusher({ driverId, onNewOrder, onOrderCancelled }: UsePusherOptions) {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);

  const disconnect = useCallback(() => {
    channelRef.current?.unbind_all();
    pusherRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (!PUSHER_KEY || !driverId) return;

    // Initialize Pusher
    pusherRef.current = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });

    // Subscribe to driver's private channel
    const channelName = `driver-${driverId}`;
    channelRef.current = pusherRef.current.subscribe(channelName);

    // Listen for new order event
    channelRef.current.bind('new-order', (data: IncomingOrder) => {
      onNewOrder(data);
    });

    // Listen for order cancelled event
    channelRef.current.bind('order-cancelled', ({ orderId }: { orderId: string }) => {
      onOrderCancelled(orderId);
    });

    return () => {
      disconnect();
    };
  }, [driverId, onNewOrder, onOrderCancelled, disconnect]);

  return { disconnect };
}
