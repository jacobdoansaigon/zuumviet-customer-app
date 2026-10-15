// PromoCard — thẻ khuyến mãi nhỏ (2 thẻ / hàng): ảnh 16:10 của chương trình (chưa có ảnh thì khối màu + icon theo dịch
// vụ, promoVisual) + nhãn ưu đãi vàng, chip dịch vụ (icon minh hoạ) trên ảnh, tiêu đề 2 dòng, HSD và "còn N ngày"
// khi sắp hết hạn.
import React from 'react';
import { View, Image, StyleSheet, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, ServiceIcon } from '@/components/ui';
import type { PromoItem } from '@/constants/content';
import { daysLeft, promoVisual } from './promoVisual';

/** còn ≤ số ngày này thì nhắc "còn N ngày" màu đỏ */
const SOON_DAYS = 7;

interface PromoCardProps {
  item: PromoItem;
  width: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const PromoCard: React.FC<PromoCardProps> = ({ item, width, onPress, style }) => {
  const { icon, colors, art } = promoVisual(item);
  const left = daysLeft(item.expiry);
  const soon = left !== null && left >= 0 && left <= SOON_DAYS;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { width }, pressed && { opacity: 0.92 }, style]} accessibilityRole="button" accessibilityLabel={item.title}>
      <View style={styles.imageWrap}>
        {item.image ? (
          <View style={styles.image}>
            <Image source={item.image} resizeMode="cover" style={styles.fill} />
          </View>
        ) : (
          <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.image, styles.center]}>
            <View style={styles.iconWrap}>
              <Icon name={icon} size={30} color={Colors.white} />
            </View>
          </LinearGradient>
        )}
        <View style={styles.badge}>
          <AppText size={14} weight="extraBold" color={Colors.primaryDark}>
            {item.discount}
          </AppText>
        </View>
        <View style={styles.chip}>
          {art ? <ServiceIcon name={art} size={18} /> : null}
          <AppText size={11} weight="bold" color={Colors.primary} numberOfLines={1} style={styles.chipText}>
            {item.tag}
          </AppText>
        </View>
      </View>
      <View style={styles.body}>
        <AppText size={13} weight="bold" color={Colors.text} numberOfLines={2} style={styles.title}>
          {item.title}
        </AppText>
        <AppText size={11} color={Colors.textMuted} numberOfLines={1} style={styles.expiry}>
          {/* sắp hết hạn thì bỏ năm cho vừa một dòng trên thẻ hẹp ("HSD 15/10 · hết hạn hôm nay") */}
          HSD {soon ? item.expiry.replace(/\/\d{4}$/, '') : item.expiry}
          {soon ? (
            <AppText size={11} weight="bold" color={Colors.error}>
              {left === 0 ? ' · hết hạn hôm nay' : ` · còn ${left} ngày`}
            </AppText>
          ) : null}
        </AppText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  imageWrap: { backgroundColor: Colors.primaryBg },
  image: { width: '100%', aspectRatio: 16 / 10, overflow: 'hidden' },
  // width/height rõ ràng: thiếu thì web lấy kích thước gốc của ảnh và tràn xuống phần chữ
  fill: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  center: { alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    left: Spacing.sm,
    top: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 3,
    ...Shadow.sm,
  },
  chip: {
    position: 'absolute',
    left: Spacing.sm,
    bottom: Spacing.sm,
    maxWidth: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 99,
    paddingLeft: 4,
    paddingRight: 9,
    paddingVertical: 2,
    ...Shadow.sm,
  },
  chipText: { marginLeft: 3, flexShrink: 1 },
  body: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  title: { lineHeight: 18, minHeight: 36 },
  expiry: { marginTop: 4 },
});

export default PromoCard;
