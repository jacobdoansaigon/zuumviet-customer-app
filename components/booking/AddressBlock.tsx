// AddressBlock — khối "Địa chỉ / Thay đổi địa chỉ" + địa chỉ đậm với chấm tím (Figma GH 1.3 / GH 1.4.1)
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, StopMarker } from '@/components/ui';

interface Props {
  address?: string | null;
  placeholder?: string;
  label?: string;
  linkLabel?: string;
  onChange?: () => void;
  markerType?: 'pickup' | 'dropoff';
}

export const AddressBlock: React.FC<Props> = ({
  address,
  placeholder = 'Nhập địa điểm',
  label = 'Địa chỉ',
  linkLabel = 'Thay đổi địa chỉ',
  onChange,
  markerType = 'pickup',
}) => (
  <View style={styles.wrap}>
    <View style={styles.labelRow}>
      <AppText size={13} color={Colors.textSecondary}>
        {label}
      </AppText>
      {onChange ? (
        <Pressable onPress={onChange} hitSlop={8}>
          <AppText size={13} weight="semiBold" color={Colors.primary}>
            {linkLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
    <Pressable onPress={onChange} style={styles.addrRow} disabled={!onChange}>
      <View style={styles.marker}>
        <StopMarker type={markerType} size={16} />
      </View>
      <AppText weight={address ? 'bold' : 'regular'} size={16} color={address ? Colors.text : Colors.placeholder} style={{ flex: 1 }}>
        {address || placeholder}
      </AppText>
    </Pressable>
    <View style={styles.divider} />
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingTop: Spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  addrRow: { flexDirection: 'row', alignItems: 'flex-start' },
  marker: { width: 24, alignItems: 'center', paddingTop: 3, marginRight: Spacing.xs },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginTop: Spacing.base },
});

export default AddressBlock;
