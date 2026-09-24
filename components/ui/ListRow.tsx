// ListRow — dòng menu theo Figma (icon tím + label + value/badge + chevron)
import React from 'react';
import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, Icons, type IconName } from './Icon';
import { CountBadge, Badge } from './Badge';

interface ListRowProps {
  icon?: IconName;
  iconColor?: string;
  label: string;
  sublabel?: string;
  value?: string;
  valueBold?: boolean;
  badgeCount?: number;
  badgeLabel?: string;
  onPress?: () => void;
  chevron?: boolean;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  divider?: boolean;
  compact?: boolean;
}

export const ListRow: React.FC<ListRowProps> = ({
  icon,
  iconColor = Colors.primary,
  label,
  sublabel,
  value,
  valueBold,
  badgeCount,
  badgeLabel,
  onPress,
  chevron = true,
  right,
  style,
  divider = true,
  compact,
}) => {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [pressed && onPress && styles.pressed]}>
      <View style={[styles.row, compact && styles.rowCompact, divider && styles.divider, style]}>
        {icon ? <Icon name={icon} size={22} color={iconColor} style={styles.icon} /> : null}
        <View style={styles.texts}>
          <AppText size={15} weight="medium" color={Colors.text}>
            {label}
          </AppText>
          {sublabel ? (
            <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
              {sublabel}
            </AppText>
          ) : null}
        </View>
        {right}
        {value ? (
          <AppText weight={valueBold ? 'bold' : 'regular'} size={valueBold ? 17 : 14} color={Colors.text} style={styles.value}>
            {value}
          </AppText>
        ) : null}
        {badgeLabel ? <Badge label={badgeLabel} size="sm" style={styles.value} /> : null}
        {badgeCount != null ? <CountBadge count={badgeCount} style={styles.value} /> : null}
        {chevron && onPress ? <Icon name={Icons.chevronRight} size={18} color={Colors.textSecondary} /> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.screen,
  },
  rowCompact: { minHeight: 48, paddingVertical: Spacing.sm },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  pressed: { backgroundColor: Colors.primaryBg },
  icon: { marginRight: Spacing.md, width: 26, textAlign: 'center' },
  texts: { flex: 1 },
  value: { marginRight: Spacing.sm },
});

export default ListRow;
