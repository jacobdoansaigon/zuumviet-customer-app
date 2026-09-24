// ServiceInfoDialog — GH 1.2: "Siêu Tốc — Thông tin dịch vụ" (icon + tên + mô tả, các dòng giá, nút Hủy / Chọn)
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Dialog, Icon } from '@/components/ui';
import type { ServiceOptionDef } from '@/constants/mockBooking';

interface Props {
  option: ServiceOptionDef | null;
  onClose: () => void;
  onSelect: (option: ServiceOptionDef) => void;
}

const titleCase = (s: string) => s.replace(/(^|\s)(\p{L})/gu, (m) => m.toUpperCase());

export const ServiceInfoDialog: React.FC<Props> = ({ option, onClose, onSelect }) => (
  <Dialog
    visible={!!option}
    onClose={onClose}
    actions={
      option
        ? [
            { label: 'Hủy', onPress: onClose, variant: 'secondary' },
            { label: 'Chọn', onPress: () => onSelect(option) },
          ]
        : []
    }
  >
    {option ? (
      <View>
        <View style={styles.head}>
          <View style={styles.iconWrap}>
            <Icon name={option.icon} size={30} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText weight="bold" size={18}>
              {titleCase(option.name)}
            </AppText>
            <AppText size={13} color={Colors.textSecondary}>
              {option.description}
            </AppText>
          </View>
        </View>
        <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
          Thông tin dịch vụ
        </AppText>
        {option.infoLines.map((line, i) => (
          <AppText key={i} size={15} style={styles.line} color={line.startsWith('*') ? Colors.textSecondary : Colors.text}>
            {line}
          </AppText>
        ))}
      </View>
    ) : null}
  </Dialog>
);

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  section: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  line: { lineHeight: 24 },
});

export default ServiceInfoDialog;
