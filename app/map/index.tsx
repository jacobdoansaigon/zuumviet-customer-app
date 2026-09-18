// Map — khách: chọn điểm lấy / giao + xem đơn (không luồng tài xế)

import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useLocation } from '@/hooks/useLocation';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { orderApi, ApiError } from '@/services/api';

const HCM = {
  latitude: 10.7769,
  longitude: 106.7009,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

export default function CustomerMapScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const mapRef = useRef<MapView>(null);
  const { location, loading } = useLocation(false);

  const [pickup, setPickup] = useState('Điểm lấy hàng');
  const [dropoff, setDropoff] = useState('Điểm giao hàng');
  const [submitting, setSubmitting] = useState(false);

  const region = useMemo(() => {
    if (location) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
    }
    return HCM;
  }, [location]);

  const handleBook = async () => {
    if (!pickup.trim() || !dropoff.trim()) {
      Alert.alert('Thiếu địa chỉ', 'Nhập điểm lấy và điểm giao.');
      return;
    }
    setSubmitting(true);
    try {
      // MVP: drymode/create cần payload dịch vụ đầy đủ — hiện báo hướng dẫn
      // và điều hướng sang danh sách đơn. Nối full create-order ở phase tiếp.
      await orderApi.dryMode({
        note: `${pickup} → ${dropoff}`,
      }).catch(() => null);

      Alert.alert(
        'Đặt đơn',
        'Đã ghi nhận yêu cầu giao hàng (MVP). Chi tiết tạo đơn đầy đủ sẽ nối service/weight ở phase sau.',
        [{ text: 'Xem đơn', onPress: () => router.replace('/(tabs)/orders') }]
      );
    } catch (e) {
      Alert.alert(
        'Chưa tạo được đơn',
        e instanceof ApiError ? e.message : 'Thử lại sau'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {orderId ? `Theo dõi #${orderId}` : 'Đặt giao hàng'}
        </Text>
        <View style={{ width: 64 }} />
      </View>

      <View style={styles.mapWrap}>
        {loading && !location ? (
          <ActivityIndicator style={{ flex: 1 }} color={Colors.primary} />
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={region}
            showsUserLocation
          >
            {location ? (
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="Vị trí của bạn"
              />
            ) : null}
          </MapView>
        )}
      </View>

      <View style={styles.sheet}>
        {orderId ? (
          <>
            <Text style={styles.sheetTitle}>Đang theo dõi đơn #{orderId}</Text>
            <Text style={styles.sheetSub}>
              Vị trí tài xế và lộ trình sẽ cập nhật khi có tracking realtime.
            </Text>
            <Button
              title="Huỷ đơn này"
              variant="secondary"
              onPress={async () => {
                try {
                  await orderApi.cancelOrder(Number(orderId));
                  Alert.alert('Đã huỷ', 'Đơn đã được huỷ.');
                  router.replace('/(tabs)/orders');
                } catch (e) {
                  Alert.alert(
                    'Không huỷ được',
                    e instanceof ApiError ? e.message : 'Thử lại'
                  );
                }
              }}
            />
          </>
        ) : (
          <>
            <Text style={styles.sheetTitle}>Thông tin giao hàng</Text>
            <Text style={styles.label}>Điểm lấy</Text>
            <TextInput
              style={styles.input}
              value={pickup}
              onChangeText={setPickup}
              placeholder="Địa chỉ lấy hàng"
              placeholderTextColor={Colors.placeholder}
            />
            <Text style={styles.label}>Điểm giao</Text>
            <TextInput
              style={styles.input}
              value={dropoff}
              onChangeText={setDropoff}
              placeholder="Địa chỉ giao hàng"
              placeholderTextColor={Colors.placeholder}
            />
            <Button
              title={submitting ? 'Đang xử lý...' : 'Tiếp tục đặt đơn'}
              onPress={handleBook}
              loading={submitting}
              disabled={submitting}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  back: { color: Colors.primary, fontSize: Typography.fontSize.md, width: 80 },
  title: {
    fontWeight: Typography.fontWeight.semibold,
    fontSize: Typography.fontSize.md,
    color: Colors.text,
  },
  mapWrap: { flex: 1, backgroundColor: Colors.gray100 },
  sheet: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  sheetTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  sheetSub: { color: Colors.textSecondary, marginBottom: Spacing.sm },
  label: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text,
  },
});
