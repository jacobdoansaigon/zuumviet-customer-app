// TripCodeBar — thanh xám "Mã chuyến xe | 716-207-6172" (nền #8C8C8C, chữ trắng 13)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui';

export const TripCodeBar: React.FC<{ code: string }> = ({ code }) => (
  <View style={styles.bar}>
    <AppText size={13} color={Colors.white}>
      Mã chuyến xe
    </AppText>
    <AppText size={13} weight="bold" color={Colors.white}>
      {code}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray500,
    paddingHorizontal: Spacing.screen,
    height: 36,
  },
});

export default TripCodeBar;
