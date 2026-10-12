// PickupPin — ghim điểm đón bằng logo ZuumViet (ghim định vị chứa chữ Z), đứng yên giữa phần bản đồ nhìn thấy khi khách
// kéo bản đồ chọn điểm đón. Mũi nhọn của logo (đáy ảnh) chính là toạ độ được chọn → đặt `top` = tâm khung − PICKUP_PIN_HEIGHT.
// Có chấm bóng dưới mũi nhọn để thấy rõ điểm chạm đất; khi đang kéo/xác định địa chỉ, ghim nhấc nhẹ lên.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LogoMark } from '@/components/ui';

export const PICKUP_PIN_WIDTH = 28;
/** cao ảnh logo (tỉ lệ 1212 × 1004) + phần nhấc lên tối đa */
export const PICKUP_PIN_HEIGHT = Math.round(PICKUP_PIN_WIDTH * (1212 / 1004)) + 6;

export const PickupPin: React.FC<{ lifted?: boolean }> = ({ lifted }) => (
  <View style={styles.wrap} pointerEvents="none">
    <View style={[styles.logo, lifted && styles.logoLifted]}>
      <LogoMark size={PICKUP_PIN_WIDTH} />
    </View>
    <View style={[styles.shadow, lifted && styles.shadowLifted]} />
  </View>
);

const styles = StyleSheet.create({
  wrap: { width: PICKUP_PIN_WIDTH + 16, height: PICKUP_PIN_HEIGHT, alignItems: 'center', justifyContent: 'flex-end' },
  logo: { marginBottom: 1 },
  logoLifted: { marginBottom: 7 },
  // chấm bóng ngay dưới mũi nhọn — neo chính xác vào toạ độ
  shadow: { position: 'absolute', bottom: -3, width: 8, height: 6, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.28)' },
  shadowLifted: { width: 12, height: 8, borderRadius: 6, bottom: -4, backgroundColor: 'rgba(0,0,0,0.18)' },
});

export default PickupPin;
