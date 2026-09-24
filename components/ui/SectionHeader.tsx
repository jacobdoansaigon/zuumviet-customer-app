// SectionHeader — tiêu đề mục + link phải ("Tin tức — Tất cả")
import React from 'react';
import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText } from './Text';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionLabel, onAction, style, size = 15 }) => (
  <View style={[styles.row, style]}>
    <AppText weight="bold" size={size}>
      {title}
    </AppText>
    {actionLabel ? (
      <Pressable onPress={onAction} hitSlop={8}>
        <AppText weight="semiBold" size={14} color={Colors.primary}>
          {actionLabel}
        </AppText>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
});

export default SectionHeader;
