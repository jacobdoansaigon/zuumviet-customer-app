// Map tracking screen — Bản đồ tài xế
// Shows driver location + order route (pickup → delivery)
// Design: Figma [Driver] Flow đơn hàng — tracking screen

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLocation } from '@/hooks/useLocation';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';

type OrderRoute = {
  orderId: string;
  pickup: { latitude: number; longitude: number; address: string };
  delivery: { latitude: number; longitude: number; address: string };
};

// Mock active order route — replace with real order data
const MOCK_ROUTE: OrderRoute = {
  orderId: 'DH001235',
  pickup: {
    latitude: 10.7769,
    longitude: 106.7009,
    address: '123 Lê Văn Sỹ, Q.3, TP.HCM',
  },
  delivery: {
    latitude: 10.7743,
    longitude: 106.7030,
    address: '456 Nguyễn Huệ, Q.1, TP.HCM',
  },
};

type DeliveryStep = 'going_pickup' | 'at_pickup' | 'delivering' | 'completed';

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { location, loading, error } = useLocation(true); // live tracking
  const [step, setStep] = useState<DeliveryStep>('going_pickup');
  const [activeRoute] = useState<OrderRoute | null>(MOCK_ROUTE);

  const STEP_CONFIG: Record<DeliveryStep, { label: string; action: string; next: DeliveryStep | null }> = {
    going_pickup: {
      label: '🚗 Đang đến điểm lấy hàng',
      action: 'Đã đến lấy hàng',
      next: 'at_pickup',
    },
    at_pickup: {
      label: '📦 Đang lấy hàng',
      action: 'Đã lấy hàng xong — Bắt đầu giao',
      next: 'delivering',
    },
    delivering: {
      label: '🛵 Đang giao hàng',
      action: 'Đã giao hàng thành công',
      next: 'completed',
    },
    completed: {
      label: '✅ Giao hàng thành công',
      action: 'Về trang chủ',
      next: null,
    },
  };

  const currentStep = STEP_CONFIG[step];

  const handleNextStep = () => {
    if (currentStep.next) {
      setStep(currentStep.next);
    } else {
      router.replace('/(tabs)');
    }
  };

  const centerOnDriver = () => {
    if (location) {
      mapRef.current?.animateToRegion({
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Đang lấy vị trí...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorEmoji}>📍</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.retryText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const driverLocation = location ?? {
    latitude: 10.7769,
    longitude: 106.7009,
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          ...driverLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {/* Driver marker */}
        <Marker coordinate={driverLocation} title="Tôi" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.driverMarker}>
            <Text style={styles.driverMarkerEmoji}>🛵</Text>
          </View>
        </Marker>

        {activeRoute && (
          <>
            {/* Pickup marker */}
            <Marker
              coordinate={activeRoute.pickup}
              title="Lấy hàng"
              description={activeRoute.pickup.address}
            >
              <View style={[styles.routeMarker, { backgroundColor: Colors.success }]}>
                <Text style={styles.routeMarkerText}>P</Text>
              </View>
            </Marker>

            {/* Delivery marker */}
            <Marker
              coordinate={activeRoute.delivery}
              title="Giao hàng"
              description={activeRoute.delivery.address}
            >
              <View style={[styles.routeMarker, { backgroundColor: Colors.primary }]}>
                <Text style={styles.routeMarkerText}>D</Text>
              </View>
            </Marker>

            {/* Route polyline */}
            <Polyline
              coordinates={[driverLocation, activeRoute.pickup, activeRoute.delivery]}
              strokeColor={Colors.primary}
              strokeWidth={3}
              lineDashPattern={[8, 4]}
            />
          </>
        )}
      </MapView>

      {/* Back button */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.orderIdBadge}>
          <Text style={styles.orderIdText}>#{activeRoute?.orderId}</Text>
        </View>
      </SafeAreaView>

      {/* Center on me button */}
      <TouchableOpacity style={styles.centerBtn} onPress={centerOnDriver}>
        <Text style={styles.centerBtnEmoji}>🎯</Text>
      </TouchableOpacity>

      {/* Bottom panel */}
      <SafeAreaView style={styles.bottomPanel} edges={['bottom']}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {(['going_pickup', 'at_pickup', 'delivering', 'completed'] as DeliveryStep[]).map((s, i) => (
            <View key={s} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  s === step && styles.stepDotActive,
                  ['at_pickup', 'delivering', 'completed'].includes(step) &&
                    ['going_pickup'].includes(s) && styles.stepDotDone,
                  ['delivering', 'completed'].includes(step) &&
                    ['going_pickup', 'at_pickup'].includes(s) && styles.stepDotDone,
                  step === 'completed' && styles.stepDotDone,
                ]}
              />
              {i < 3 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>

        {/* Current status */}
        <Text style={styles.statusText}>{currentStep.label}</Text>

        {/* Route info */}
        {activeRoute && (
          <View style={styles.routeInfo}>
            <RouteInfoRow
              icon="🟢"
              address={activeRoute.pickup.address}
              label="Lấy tại"
            />
            <RouteInfoRow
              icon="🔵"
              address={activeRoute.delivery.address}
              label="Giao đến"
            />
          </View>
        )}

        {/* Action button */}
        <TouchableOpacity
          style={[
            styles.actionBtn,
            step === 'completed' && styles.actionBtnCompleted,
          ]}
          onPress={handleNextStep}
        >
          <Text style={styles.actionBtnText}>{currentStep.action}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function RouteInfoRow({ icon, label, address }: { icon: string; label: string; address: string }) {
  return (
    <View style={routeInfoStyles.row}>
      <Text style={routeInfoStyles.icon}>{icon}</Text>
      <View>
        <Text style={routeInfoStyles.label}>{label}</Text>
        <Text style={routeInfoStyles.address} numberOfLines={1}>{address}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
  },
  loadingText: { fontSize: Typography.fontSize.base, color: Colors.textSecondary },
  errorEmoji: { fontSize: 48 },
  errorText: { fontSize: Typography.fontSize.base, color: Colors.text, textAlign: 'center', paddingHorizontal: Spacing['2xl'] },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  retryText: { color: Colors.white, fontWeight: Typography.fontWeight.semiBold },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  backBtnText: { fontSize: 28, color: Colors.text, lineHeight: 32 },
  orderIdBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    ...Shadow.sm,
  },
  orderIdText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },

  // Center button
  centerBtn: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 280,
    width: 44,
    height: 44,
    backgroundColor: Colors.white,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  centerBtnEmoji: { fontSize: 22 },

  // Markers
  driverMarker: {
    width: 40,
    height: 40,
    backgroundColor: Colors.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    ...Shadow.md,
  },
  driverMarkerEmoji: { fontSize: 20 },
  routeMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  routeMarkerText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },

  // Bottom panel
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    gap: Spacing.md,
    ...Shadow.lg,
  },

  // Step indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 0,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.gray300,
  },
  stepDotActive: { backgroundColor: Colors.primary, width: 16, height: 16, borderRadius: 8 },
  stepDotDone: { backgroundColor: Colors.success },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.gray300 },

  statusText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
    textAlign: 'center',
  },

  routeInfo: { gap: Spacing.sm },

  actionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  actionBtnCompleted: { backgroundColor: Colors.success },
  actionBtnText: {
    color: Colors.white,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semiBold,
  },
});

const routeInfoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  icon: { fontSize: 16 },
  label: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  address: { fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.medium, color: Colors.text },
});
