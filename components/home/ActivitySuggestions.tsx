// ActivitySuggestions — "Gợi ý cho bạn": hoạt động gần đây + gợi ý hành động theo khung giờ.
// Khung trắng cao đúng 3 hàng, cuộn dọc bên trong để xem thêm; bấm 1 hàng → mở màn đặt với điểm đón/điểm đến điền sẵn.
import React, { useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons, type IconName } from '@/components/ui';
import { SUGGESTED_ACTIONS, sortSuggestions, type ActionSuggestion } from '@/constants/mock';
import { SERVICE_GROUPS, toServiceKey } from '@/constants/mockBooking';

const ROW_H = 64;
const VISIBLE_ROWS = 3;

const TONE: Record<ActionSuggestion['badgeTone'], { bg: string; fg: string }> = {
  primary: { bg: Colors.primaryBg, fg: Colors.primary },
  success: { bg: Colors.successBg, fg: Colors.successDark },
  warning: { bg: Colors.warningBg, fg: '#8A5A00' },
};

interface ActivitySuggestionsProps {
  items?: ActionSuggestion[];
  onPress: (item: ActionSuggestion) => void;
  title?: string;
}

export const ActivitySuggestions: React.FC<ActivitySuggestionsProps> = ({ items = SUGGESTED_ACTIONS, onPress, title = 'Gợi ý cho bạn' }) => {
  const sorted = useMemo(() => sortSuggestions(items), [items]);
  if (!sorted.length) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <AppText size={15} weight="bold" color={Colors.text}>
          {title}
        </AppText>
        <AppText size={11} color={Colors.textMuted}>
          Theo hoạt động gần đây
        </AppText>
      </View>

      <ScrollView
        style={{ height: ROW_H * VISIBLE_ROWS }}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        contentContainerStyle={{ paddingBottom: 2 }}
      >
        {sorted.map((s, i) => {
          const group = SERVICE_GROUPS[toServiceKey(s.service)];
          const tone = TONE[s.badgeTone];
          return (
            <Pressable
              key={s.id}
              onPress={() => onPress(s)}
              style={({ pressed }) => [styles.row, i < sorted.length - 1 && styles.rowBorder, pressed && { backgroundColor: Colors.primaryBg }]}
              accessibilityRole="button"
              accessibilityLabel={s.title}
            >
              <View style={styles.iconWrap}>
                <Icon name={(s.icon as IconName) ?? group.icon} size={24} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <AppText size={14} weight="bold" color={Colors.text} numberOfLines={1} style={{ flexShrink: 1 }}>
                    {s.title}
                  </AppText>
                  <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                    <AppText size={10} weight="semiBold" color={tone.fg}>
                      {s.badge}
                    </AppText>
                  </View>
                </View>
                <AppText size={12} color={Colors.textSecondary} numberOfLines={1} style={{ marginTop: 2 }}>
                  {s.subtitle}
                </AppText>
              </View>
              <Icon name={Icons.chevronRight} size={18} color={Colors.gray400} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  row: { flexDirection: 'row', alignItems: 'center', height: ROW_H, paddingHorizontal: Spacing.base },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 1 },
});

export default ActivitySuggestions;
