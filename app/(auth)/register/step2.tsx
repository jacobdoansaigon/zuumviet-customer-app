// Đăng ký tài xế — Step 2: Chọn loại phương tiện
// Design: Figma [Driver] Sign In + Sign Up > 2.3 Lựa chọn phương tiện

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { StepIndicator } from '@/components/ui/StepIndicator';

type VehicleType = {
  id: string;
  icon: string;
  name: string;
  desc: string;
  types: string[];
};

const VEHICLE_TYPES: VehicleType[] = [
  {
    id: 'motorbike',
    icon: '🛵',
    name: 'Xe máy',
    desc: 'Giao hàng nhỏ, đồ ăn, tài liệu',
    types: ['Xe số', 'Xe ga', 'Xe côn'],
  },
  {
    id: 'car',
    icon: '🚗',
    name: 'Ô tô 4 bánh',
    desc: 'Giao hàng lớn, chở người',
    types: ['Sedan', 'SUV', 'MPV', 'Van'],
  },
  {
    id: 'truck',
    icon: '🚚',
    name: 'Xe tải',
    desc: 'Vận tải hàng hoá số lượng lớn',
    types: ['Tải nhỏ < 1 tấn', 'Tải vừa 1-3 tấn', 'Tải lớn > 3 tấn'],
  },
];

export default function RegisterStep2() {
  const params = useLocalSearchParams();
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedSubtype, setSelectedSubtype] = useState('');

  const vehicle = VEHICLE_TYPES.find((v) => v.id === selectedVehicle);
  const isValid = selectedVehicle && selectedSubtype;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StepIndicator total={4} current={2} />

      <Text style={styles.title}>Loại phương tiện</Text>
      <Text style={styles.subtitle}>Chọn loại phương tiện bạn sẽ sử dụng để giao hàng</Text>

      {/* Vehicle type cards */}
      <View style={styles.vehicleCards}>
        {VEHICLE_TYPES.map((v) => (
          <TouchableOpacity
            key={v.id}
            style={[
              styles.vehicleCard,
              selectedVehicle === v.id && styles.vehicleCardActive,
            ]}
            onPress={() => {
              setSelectedVehicle(v.id);
              setSelectedSubtype('');
            }}
          >
            <Text style={styles.vehicleIcon}>{v.icon}</Text>
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleName, selectedVehicle === v.id && styles.vehicleNameActive]}>
                {v.name}
              </Text>
              <Text style={styles.vehicleDesc}>{v.desc}</Text>
            </View>
            <View style={[styles.radio, selectedVehicle === v.id && styles.radioActive]}>
              {selectedVehicle === v.id && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Subtype selection */}
      {vehicle && (
        <View style={styles.subtypeSection}>
          <Text style={styles.subtypeTitle}>Loại {vehicle.name}</Text>
          <View style={styles.subtypeGrid}>
            {vehicle.types.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.subtypeChip, selectedSubtype === t && styles.subtypeChipActive]}
                onPress={() => setSelectedSubtype(t)}
              >
                <Text style={[styles.subtypeText, selectedSubtype === t && styles.subtypeTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <Button
        title="Tiếp theo →"
        onPress={() =>
          router.push({
            pathname: '/(auth)/register/step3',
            params: { ...params, vehicleType: selectedVehicle, vehicleSubtype: selectedSubtype },
          })
        }
        disabled={!isValid}
        variant={isValid ? 'primary' : 'secondary'}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.white,
    padding: Spacing['2xl'],
    gap: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  vehicleCards: { gap: Spacing.md },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  vehicleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
    ...Shadow.sm,
  },
  vehicleIcon: { fontSize: 32 },
  vehicleInfo: { flex: 1 },
  vehicleName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text,
  },
  vehicleNameActive: { color: Colors.primary },
  vehicleDesc: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  subtypeSection: { gap: Spacing.sm },
  subtypeTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text,
  },
  subtypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  subtypeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  subtypeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryBg,
  },
  subtypeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  subtypeTextActive: { color: Colors.primary },
});
