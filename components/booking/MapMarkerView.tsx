// MapMarkerView — hình marker dùng chung cho bản đồ native & web: điểm lấy (vòng tím), điểm giao (pin Z), tài xế
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Shadow } from '@/constants/theme';
import { Icon, Icons, StopMarker, AppText } from '@/components/ui';
import type { MapStopType } from './mapTypes';

export const MARKER_SIZE = 36;

export const MapMarkerView: React.FC<{ type: MapStopType }> = ({ type }) => {
  if (type === 'driver') {
    return (
      <View style={styles.driver}>
        <Icon name={Icons.scooter} size={20} color={Colors.primary} />
      </View>
    );
  }
  if (type === 'dropoff') {
    return (
      <View style={styles.pinWrap}>
        <Icon name={Icons.locationFilled} size={MARKER_SIZE} color={Colors.primary} />
        <View style={styles.pinLabel}>
          <AppText weight="black" size={10} color={Colors.primary}>
            Z
          </AppText>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.pickup}>
      <StopMarker type="pickup" size={20} />
    </View>
  );
};

const styles = StyleSheet.create({
  driver: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
    ...Shadow.md,
  },
  pinWrap: { width: MARKER_SIZE, height: MARKER_SIZE, alignItems: 'center', justifyContent: 'flex-start' },
  pinLabel: {
    position: 'absolute',
    top: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickup: { width: MARKER_SIZE, height: MARKER_SIZE, alignItems: 'center', justifyContent: 'center' },
});

export default MapMarkerView;
