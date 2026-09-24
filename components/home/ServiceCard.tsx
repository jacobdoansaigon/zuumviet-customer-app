// ServiceCard — card trắng bo 12 đè lên header: 3 dịch vụ icon tím 40 + label 14
// "Giao hàng" (scooter + hộp) / "Vận tải" (truck) / "Thuê xe tải" (van)
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons, type IconName } from '@/components/ui';

export type HomeServiceKey = 'delivery' | 'transport' | 'rental';

export type HomeService = { key: HomeServiceKey; label: string; icon: IconName };

export const HOME_SERVICES: HomeService[] = [
  { key: 'delivery', label: 'Giao hàng', icon: Icons.scooter },
  { key: 'transport', label: 'Vận tải', icon: Icons.truck },
  { key: 'rental', label: 'Thuê xe tải', icon: Icons.van },
];

interface ServiceCardProps {
  onSelect: (key: HomeServiceKey) => void;
  services?: HomeService[];
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ onSelect, services = HOME_SERVICES }) => (
  <View style={styles.card}>
    {services.map((s) => (
      <Pressable key={s.key} onPress={() => onSelect(s.key)} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
        <View style={styles.iconWrap}>
          <Icon name={s.icon} size={40} color={Colors.primary} />
          {s.key === 'delivery' ? (
            <View style={styles.box}>
              <Icon name={Icons.box} size={16} color={Colors.primary} />
            </View>
          ) : null}
        </View>
        <AppText size={14} weight="semiBold" color={Colors.text} align="center">
          {s.label}
        </AppText>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.sm,
    ...Shadow.md,
  },
  item: { flex: 1, alignItems: 'center', paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  pressed: { backgroundColor: Colors.primaryBg },
  iconWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  box: {
    position: 'absolute',
    right: -4,
    top: -2,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 1,
  },
});

export default ServiceCard;
