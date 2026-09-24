// ServiceCard — card trắng bo 12 đè lên header: lưới dịch vụ 4 cột (icon tím + label)
// Giao hàng / Xe máy / Xe hơi / Xe 6 chỗ / Vận tải / Thuê xe tải / Gọi tài xế / Gọi thợ
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons, type IconName } from '@/components/ui';
import { SERVICE_GROUPS, type ServiceKey } from '@/constants/mockBooking';

export type HomeServiceKey = ServiceKey;

export type HomeService = { key: HomeServiceKey; label: string; icon: IconName };

const HOME_ORDER: HomeServiceKey[] = ['delivery', 'bike', 'car', 'car6', 'transport', 'rental', 'driver', 'handyman'];

export const HOME_SERVICES: HomeService[] = HOME_ORDER.map((key) => ({
  key,
  label: SERVICE_GROUPS[key].title,
  icon: SERVICE_GROUPS[key].icon,
}));

interface ServiceCardProps {
  onSelect: (key: HomeServiceKey) => void;
  services?: HomeService[];
  /** số cột (mặc định 4) */
  columns?: number;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ onSelect, services = HOME_SERVICES, columns = 4 }) => (
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
          <Icon name={s.icon} size={34} color={Colors.primary} />
          {s.key === 'delivery' ? (
            <View style={styles.box}>
              <Icon name={Icons.box} size={14} color={Colors.primary} />
            </View>
          ) : null}
        </View>
        <AppText size={13} weight="semiBold" color={Colors.text} align="center" numberOfLines={1}>
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
  iconWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  box: {
    position: 'absolute',
    right: -2,
    top: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 1,
  },
});

export default ServiceCard;
