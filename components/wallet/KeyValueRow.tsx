// KeyValueRow — "Trạng thái ..... Thành công" (label xám 15, value 15 phải)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui';

interface KeyValueRowProps {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}

export const KeyValueRow: React.FC<KeyValueRowProps> = ({ label, value, valueColor = Colors.text, bold }) => (
  <View style={styles.row}>
    <AppText size={15} color={Colors.textSecondary} style={styles.label}>
      {label}
    </AppText>
    <AppText size={15} weight={bold ? 'bold' : 'medium'} color={valueColor} align="right" style={styles.value} numberOfLines={2}>
      {value}
    </AppText>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm },
  label: { flex: 1, marginRight: Spacing.md },
  value: { flex: 1.4 },
});

export default KeyValueRow;
