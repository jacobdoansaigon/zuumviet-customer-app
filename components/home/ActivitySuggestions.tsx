// ActivitySuggestions — "Gợi ý cho bạn": đặt lại các chuyến gần đây của CHÍNH khách (GET /v1/customer/orders
// scope=history, khác lộ trình / dịch vụ). Khung trắng cao tối đa 3 hàng, cuộn dọc bên trong; bấm 1 hàng → mở màn đặt
// với điểm đón/điểm đến thật của đơn cũ (param reorder). Chưa có chuyến nào → không hiện khung.
import React, { useMemo } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import { groupOfOrder, type OrderListItem } from '@/services/orders';
import { formatDayLabel, orderIcon } from '@/components/activity/orderUtils';
import type { ServiceKey } from '@/constants/booking';

const ROW_H = 64;
const MAX_VISIBLE_ROWS = 3;

export interface ReorderSuggestion {
  orderId: string;
  service: ServiceKey;
  title: string;
  subtitle: string;
  badge: string;
  order: OrderListItem;
}

/** Chuyến gần đây (hoàn tất), bỏ trùng lộ trình + dịch vụ, tối đa 6 gợi ý */
export function buildReorderSuggestions(history: OrderListItem[]): ReorderSuggestion[] {
  const seen = new Set<string>();
  const out: ReorderSuggestion[] = [];
  for (const o of history) {
    if (o.status !== 'completed') continue;
    const dest = o.stops[o.stops.length - 1]?.address ?? '';
    const key = `${o.service.id}|${o.pickupAddress}|${dest}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      orderId: o.id,
      service: groupOfOrder(o.service),
      title: `Đặt lại ${o.service.name}`,
      subtitle: dest ? `${o.pickupAddress} → ${dest}` : o.pickupAddress,
      badge: formatDayLabel(Date.parse(o.createdAt)),
      order: o,
    });
    if (out.length >= 6) break;
  }
  return out;
}

interface ActivitySuggestionsProps {
  items: ReorderSuggestion[];
  onPress: (item: ReorderSuggestion) => void;
  title?: string;
}

export const ActivitySuggestions: React.FC<ActivitySuggestionsProps> = ({ items, onPress, title = 'Gợi ý cho bạn' }) => {
  const visibleRows = useMemo(() => Math.min(MAX_VISIBLE_ROWS, items.length), [items.length]);
  if (!items.length) return null;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <AppText size={15} weight="bold" color={Colors.text}>
          {title}
        </AppText>
        <AppText size={11} color={Colors.textMuted}>
          Theo chuyến đi gần đây
        </AppText>
      </View>

      <ScrollView style={{ height: ROW_H * visibleRows }} nestedScrollEnabled showsVerticalScrollIndicator contentContainerStyle={{ paddingBottom: 2 }}>
        {items.map((s, i) => (
          <Pressable
            key={s.orderId}
            onPress={() => onPress(s)}
            style={({ pressed }) => [styles.row, i < items.length - 1 && styles.rowBorder, pressed && { backgroundColor: Colors.primaryBg }]}
            accessibilityRole="button"
            accessibilityLabel={s.title}
          >
            <View style={styles.iconWrap}>
              <Icon name={orderIcon(s.order)} size={24} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <AppText size={14} weight="bold" color={Colors.text} numberOfLines={1} style={{ flexShrink: 1 }}>
                  {s.title}
                </AppText>
                <View style={styles.badge}>
                  <AppText size={10} weight="semiBold" color={Colors.successDark}>
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
        ))}
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
  badge: { borderRadius: BorderRadius.sm, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: Colors.successBg },
});

export default ActivitySuggestions;
