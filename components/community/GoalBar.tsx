// GoalBar — thanh mục tiêu doanh thu (Figma Tiền thưởng 1.2.1): track tím từ đầu tới marker pill "100k",
// phần còn lại đỏ; nhãn 2 đầu "Chi tiêu" / "Mục tiêu" + số mục tiêu bold tím.
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText } from '@/components/ui';
import { formatShortVnd, formatVnd } from '@/constants/mock';

interface GoalBarProps {
  current: number;
  target: number;
}

export const GoalBar: React.FC<GoalBarProps> = ({ current, target }) => {
  const ratio = target > 0 ? Math.min(1, Math.max(0, current / target)) : 0;
  const pct = Math.max(6, Math.round(ratio * 100));
  const done = current >= target;
  return (
    <View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
        <View style={[styles.rest, { width: `${100 - pct}%`, backgroundColor: done ? Colors.primary : Colors.error }]} />
        <View style={[styles.markerWrap, { left: `${pct}%` }]}>
          <View style={styles.marker}>
            <AppText weight="bold" size={11} color={Colors.white}>
              {formatShortVnd(current)}
            </AppText>
          </View>
          <View style={styles.markerTip} />
        </View>
      </View>
      <View style={styles.labels}>
        <AppText size={13} color={Colors.textSecondary}>
          Chi tiêu
        </AppText>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText size={13} color={Colors.textSecondary}>
            Mục tiêu
          </AppText>
          <AppText weight="bold" size={16} color={Colors.primary}>
            {formatVnd(target)}
          </AppText>
        </View>
      </View>
      <AppText size={13} weight="semiBold" color={done ? Colors.success : Colors.error} style={styles.status}>
        {done ? 'Hoàn thành mục tiêu Doanh thu' : 'Bạn chưa hoàn thành mục tiêu Doanh thu'}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'visible', marginTop: Spacing['2xl'] },
  fill: { height: 8, backgroundColor: Colors.primary, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
  rest: { height: 8, borderTopRightRadius: 4, borderBottomRightRadius: 4, opacity: 0.85 },
  markerWrap: { position: 'absolute', top: -34, alignItems: 'center', transform: [{ translateX: -22 }] },
  marker: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    height: 24,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary,
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.sm },
  status: { marginTop: Spacing.md },
});

export default GoalBar;
