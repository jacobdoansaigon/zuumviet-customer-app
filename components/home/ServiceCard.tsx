// ServiceCard — card trắng bo 12 đè lên header: lưới dịch vụ 3 cột × 3 hàng (icon minh hoạ ServiceIcon, không ô nền + label)
// Hàng 1: Xe máy / Xe hơi / Xe đường dài — Hàng 2: Giao hàng / Vận tải / Chuyển nhà — Hàng 3: Tài xế lái thay / Gọi thợ / Thuê nhân công
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, ServiceIcon, type ServiceIconName } from '@/components/ui';
import { SERVICE_GROUPS, type ServiceKey } from '@/constants/booking';

export type HomeServiceKey = ServiceKey;

export type HomeService = { key: HomeServiceKey; label: string; art: ServiceIconName };

const HOME_ORDER: HomeServiceKey[] = ['bike', 'car', 'intercity', 'delivery', 'transport', 'rental', 'driver', 'handyman', 'labor'];

export const HOME_SERVICES: HomeService[] = HOME_ORDER.map((key) => ({
  key,
  label: SERVICE_GROUPS[key].title,
  art: SERVICE_GROUPS[key].art,
}));

interface ServiceCardProps {
  onSelect: (key: HomeServiceKey) => void;
  services?: HomeService[];
  /** số cột (mặc định 3) */
  columns?: number;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ onSelect, services = HOME_SERVICES, columns = 3 }) => (
  <View style={styles.card}>
    {services.map((s) => (
      <Pressable
        key={s.key}
        onPress={() => onSelect(s.key)}
        style={({ pressed }) => [styles.item, { width: `${100 / columns}%` }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={s.label}
      >
        <View style={styles.iconWrap}>
          <ServiceIcon name={s.art} size={44} />
        </View>
        <AppText size={14} weight="semiBold" color={Colors.text} align="center" numberOfLines={1}>
          {s.label}
        </AppText>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    ...Shadow.md,
  },
  item: { alignItems: 'center', paddingVertical: Spacing.sm, paddingHorizontal: 2, borderRadius: BorderRadius.md },
  pressed: { backgroundColor: Colors.primaryBg },
  iconWrap: { width: 52, height: 46, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
});

export default ServiceCard;
