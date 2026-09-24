// PromoGrid — lưới khuyến mãi trang chủ: 2 hàng × 2 thẻ nhìn thấy, cuộn ngang theo cột để xem thêm
import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Spacing } from '@/constants/theme';
import type { PromoItem } from '@/constants/mock';
import { PromoCard } from './PromoCard';

const GAP = Spacing.md;
const ROWS = 2;

interface PromoGridProps {
  items: PromoItem[];
  onPress: (item: PromoItem) => void;
  /** padding ngang của vùng nội dung cha (để lưới tràn mép khi cuộn) */
  inset?: number;
}

export const PromoGrid: React.FC<PromoGridProps> = ({ items, onPress, inset = Spacing.screen }) => {
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - inset * 2 - GAP) / 2);

  // Chia thành các cột, mỗi cột ROWS thẻ (xếp theo cột để 4 thẻ đầu hiện đủ trên màn)
  const columns = useMemo(() => {
    const out: PromoItem[][] = [];
    for (let i = 0; i < items.length; i += ROWS) out.push(items.slice(i, i + ROWS));
    return out;
  }, [items]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={cardWidth + GAP}
      snapToAlignment="start"
      decelerationRate="fast"
      style={{ marginHorizontal: -inset }}
      contentContainerStyle={[styles.content, { paddingHorizontal: inset, gap: GAP }]}
    >
      {columns.map((col, i) => (
        <View key={i} style={{ width: cardWidth, gap: GAP }}>
          {col.map((p) => (
            <PromoCard key={p.id} item={p} width={cardWidth} onPress={() => onPress(p)} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { paddingVertical: Spacing.xs },
});

export default PromoGrid;
