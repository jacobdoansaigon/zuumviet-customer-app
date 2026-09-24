// EmptyState — minh hoạ + câu "Rất tiếc bạn chưa có ..." theo Figma
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, type IconName } from './Icon';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'mci:moped',
  title,
  description,
  actionLabel,
  onAction,
  compact,
}) => (
  <View style={[styles.wrap, compact && styles.compact]}>
    <View style={styles.illu}>
      <View style={styles.blob} />
      <View style={styles.phone}>
        <Icon name={icon} size={44} color={Colors.primary} />
      </View>
      <View style={[styles.dot, { left: 18, top: 30 }]} />
      <View style={[styles.dot, { right: 22, bottom: 26 }]} />
      <View style={[styles.dot, { right: 40, top: 22, width: 6, height: 6 }]} />
    </View>
    <AppText size={18} color={Colors.textSecondary} align="center" style={styles.title}>
      {title}
    </AppText>
    {description ? (
      <AppText size={14} color={Colors.textSecondary} align="center" style={styles.desc}>
        {description}
      </AppText>
    ) : null}
    {actionLabel && onAction ? (
      <Button title={actionLabel} onPress={onAction} fullWidth={false} style={styles.btn} size="md" />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['3xl'], paddingHorizontal: Spacing.xl },
  compact: { paddingVertical: Spacing.xl },
  illu: { width: 180, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg },
  blob: {
    position: 'absolute',
    width: 170,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E7DDF0',
    transform: [{ rotate: '-8deg' }],
  },
  phone: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primarySoft },
  title: { lineHeight: 26, maxWidth: 260 },
  desc: { marginTop: Spacing.sm, maxWidth: 280 },
  btn: { marginTop: Spacing.xl, paddingHorizontal: Spacing['2xl'] },
});

export default EmptyState;
