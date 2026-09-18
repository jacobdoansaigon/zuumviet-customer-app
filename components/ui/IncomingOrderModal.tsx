// IncomingOrderModal — modal nhận đơn hàng mới (real-time)
// Hiển thị khi có đơn mới từ Pusher, đếm ngược 30s để tự reject

import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import type { IncomingOrder } from '@/hooks/usePusher';

const ACCEPT_TIMEOUT = 30; // seconds to respond

type Props = {
  order: IncomingOrder | null;
  visible: boolean;
  onAccept: (order: IncomingOrder) => void;
  onReject: (order: IncomingOrder) => void;
};

export function IncomingOrderModal({ order, visible, onAccept, onReject }: Props) {
  const [countdown, setCountdown] = useState(ACCEPT_TIMEOUT);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset and start countdown when new order comes in
  useEffect(() => {
    if (visible && order) {
      setCountdown(ACCEPT_TIMEOUT);

      // Vibrate to alert driver
      Vibration.vibrate(Platform.OS === 'android' ? [0, 400, 200, 400] : [400, 200, 400]);

      // Animate progress bar
      progressAnim.setValue(1);
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: ACCEPT_TIMEOUT * 1000,
        useNativeDriver: false,
      }).start();

      // Countdown timer
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            onReject(order);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      Vibration.cancel();
    };
  }, [visible, order]);

  if (!order) return null;

  const handleAccept = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    Vibration.cancel();
    onAccept(order);
  };

  const handleReject = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    Vibration.cancel();
    onReject(order);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📦 Đơn hàng mới!</Text>
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{countdown}s</Text>
            </View>
          </View>

          {/* Countdown progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: countdown > 10 ? Colors.primary : Colors.error,
                },
              ]}
            />
          </View>

          {/* Order details */}
          <View style={styles.orderDetails}>
            <DetailRow icon="💰" label="Phí vận chuyển" value={order.fee} highlight />
            <DetailRow icon="📍" label="Khoảng cách" value={order.distance} />
            <DetailRow icon="⏱️" label="Thời gian dự kiến" value={order.estimatedTime} />
            <DetailRow icon="👤" label="Khách hàng" value={order.customerName} />
          </View>

          {/* Route */}
          <View style={styles.route}>
            <RouteRow icon="🟢" label="Lấy tại" address={order.pickupAddress} />
            <View style={styles.routeDivider} />
            <RouteRow icon="🔵" label="Giao đến" address={order.deliveryAddress} />
          </View>

          {/* Note */}
          {order.note && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>📝 {order.note}</Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={handleReject}>
              <Text style={styles.rejectText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={handleAccept}>
              <Text style={styles.acceptText}>✓ Nhận đơn</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DetailRow({ icon, label, value, highlight }: {
  icon: string; label: string; value: string; highlight?: boolean;
}) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.icon}>{icon}</Text>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={[detailStyles.value, highlight && detailStyles.valueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

function RouteRow({ icon, label, address }: { icon: string; label: string; address: string }) {
  return (
    <View style={routeStyles.row}>
      <Text style={routeStyles.icon}>{icon}</Text>
      <View>
        <Text style={routeStyles.label}>{label}</Text>
        <Text style={routeStyles.address}>{address}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    gap: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  countdownBadge: {
    backgroundColor: Colors.error + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  countdownText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.error,
  },

  progressTrack: {
    height: 4,
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },

  orderDetails: {
    backgroundColor: Colors.gray100,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },

  route: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  routeDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 30,
  },

  noteBox: {
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  noteText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text,
  },

  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  rejectBtn: {
    flex: 1,
    height: 54,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    color: Colors.error,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
  acceptBtn: {
    flex: 2,
    height: 54,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
});

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: { fontSize: 16, width: 24 },
  label: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
  },
  valueHighlight: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.lg,
  },
});

const routeStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  icon: { fontSize: 14, marginTop: 2 },
  label: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  address: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text,
  },
});
