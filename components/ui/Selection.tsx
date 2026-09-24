// Radio / Checkbox / SwitchRow theo Figma
import React from 'react';
import { View, Pressable, StyleSheet, Switch, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, Icons, type IconName } from './Icon';

interface RadioProps {
  selected: boolean;
  onPress?: () => void;
  label?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  bold?: boolean;
}

export const Radio: React.FC<RadioProps> = ({ selected, onPress, label, size = 22, style, bold = true }) => (
  <Pressable onPress={onPress} style={[styles.row, style]} disabled={!onPress}>
    <View style={[styles.radio, { width: size, height: size, borderRadius: size / 2 }, selected && styles.radioOn]}>
      {selected ? <View style={[styles.radioDot, { width: size * 0.5, height: size * 0.5, borderRadius: size * 0.25 }]} /> : null}
    </View>
    {label ? (
      <AppText weight={bold ? 'bold' : 'regular'} size={16} style={styles.label}>
        {label}
      </AppText>
    ) : null}
  </Pressable>
);

interface CheckboxProps {
  checked: boolean;
  onPress?: () => void;
  label?: React.ReactNode;
  size?: number;
  style?: StyleProp<ViewStyle>;
  round?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onPress, label, size = 22, style, round }) => (
  <Pressable onPress={onPress} style={[styles.row, style]} disabled={!onPress}>
    <View style={[styles.check, { width: size, height: size, borderRadius: round ? size / 2 : 4 }, checked && styles.checkOn]}>
      {checked ? <Icon name={Icons.check} size={size * 0.75} color={Colors.white} /> : null}
    </View>
    {label ? (
      typeof label === 'string' ? (
        <AppText weight="bold" size={16} style={styles.label}>
          {label}
        </AppText>
      ) : (
        <View style={styles.label}>{label}</View>
      )
    ) : null}
  </Pressable>
);

interface SwitchRowProps {
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export const SwitchRow: React.FC<SwitchRowProps> = ({ label, sublabel, value, onValueChange, icon, style }) => (
  <View style={[styles.switchRow, style]}>
    {icon ? <Icon name={icon} size={22} color={Colors.primary} style={{ marginRight: Spacing.md }} /> : null}
    <View style={{ flex: 1 }}>
      <AppText weight="semiBold" size={15}>
        {label}
      </AppText>
      {sublabel ? (
        <AppText size={12} color={Colors.textSecondary} style={{ marginTop: 2 }}>
          {sublabel}
        </AppText>
      ) : null}
    </View>
    <AppSwitch value={value} onValueChange={onValueChange} />
  </View>
);

// react-native-web dùng activeThumbColor/activeTrackColor (mặc định xanh teal) → ép theo brand
const webSwitchProps =
  Platform.OS === 'web'
    ? ({ activeThumbColor: Colors.white, activeTrackColor: Colors.primaryLight } as Record<string, string>)
    : {};

export const AppSwitch: React.FC<{ value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean; onHeader?: boolean }> = ({
  value,
  onValueChange,
  disabled,
  onHeader,
}) => (
  <Switch
    value={value}
    onValueChange={onValueChange}
    disabled={disabled}
    trackColor={{ false: Colors.gray300, true: onHeader ? Colors.success : Colors.primaryLight }}
    thumbColor={Colors.white}
    ios_backgroundColor={Colors.gray300}
    {...(Platform.OS === 'web' && onHeader ? { ...webSwitchProps, activeTrackColor: Colors.success } : webSwitchProps)}
  />
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { marginLeft: Spacing.sm, flex: 1 },
  radio: { borderWidth: 2, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: Colors.primary },
  radioDot: { backgroundColor: Colors.primary },
  check: { borderWidth: 1.5, borderColor: Colors.gray300, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  checkOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
});

export default Radio;
