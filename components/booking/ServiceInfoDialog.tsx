// ServiceInfoDialog — GH 1.2: "Siêu Tốc — Thông tin dịch vụ" (icon + tên + mô tả, các dòng giá, nút Hủy / Chọn).
// Các dòng giá sinh từ bảng giá + luật của catalog API (serviceInfoLines) — không viết tay giá.
// Thuê nhân công (tính theo block giờ): thêm "Thời gian làm việc" (Stepper số block, mỗi block = blockMinutes của
// catalog) và "Quy tắc làm việc". Mỗi đơn là 1 nhân công — cần nhiều người thì đặt nhiều đơn.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Dialog, Icon, Stepper } from '@/components/ui';
import { formatVnd } from '@/services/bookingStore';
import { serviceInfoLines, type ServiceOptionView } from '@/services/catalog';

interface Props {
  option: ServiceOptionView | null;
  /** số block đã chọn từ trước cho ĐÚNG hạng mục đang hiển thị */
  initialBlocks?: number;
  onClose: () => void;
  onSelect: (option: ServiceOptionView, blocks: number) => void;
}

const titleCase = (s: string) => s.replace(/(^|\s)(\p{L})/gu, (m) => m.toUpperCase());

function hoursLabel(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60} giờ`;
  return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
}

export const ServiceInfoDialog: React.FC<Props> = ({ option, initialBlocks = 1, onClose, onSelect }) => {
  const [blocks, setBlocks] = useState(initialBlocks);

  // Dialog dùng lại cho nhiều hạng mục — mỗi lần mở hạng mục khác phải nạp lại lựa chọn của đúng hạng mục đó
  useEffect(() => {
    if (option) setBlocks(initialBlocks);
  }, [option?.id, initialBlocks]);

  const blockFare = option ? option.service.pricing.baseFare || option.service.fromPrice : 0;

  return (
    <Dialog
      visible={!!option}
      onClose={onClose}
      actions={
        option
          ? [
              { label: 'Hủy', onPress: onClose, variant: 'secondary' },
              { label: option.paused ? 'Tạm ngưng' : 'Chọn', onPress: () => onSelect(option, blocks) },
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
              {option.description ? (
                <AppText size={13} color={Colors.textSecondary}>
                  {option.description}
                </AppText>
              ) : null}
            </View>
          </View>
          <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
            Thông tin dịch vụ
          </AppText>
          {serviceInfoLines(option.service).map((line, i) => (
            <AppText key={i} size={15} style={styles.line} color={line.startsWith('*') ? Colors.textSecondary : Colors.text}>
              {line}
            </AppText>
          ))}

          {option.blockMinutes ? (
            <>
              <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
                Thời gian làm việc
              </AppText>
              <View style={styles.blockRow}>
                <View style={{ flex: 1 }}>
                  <AppText size={15} weight="bold">
                    {blocks} block × {hoursLabel(option.blockMinutes)} = {hoursLabel(blocks * option.blockMinutes)}
                  </AppText>
                </View>
                <Stepper value={blocks} onChange={setBlocks} min={1} max={option.maxBlocks} />
              </View>
              <AppText size={13} color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
                Tạm tính cho 1 nhân công: ~{formatVnd(blockFare * blocks)}
              </AppText>
            </>
          ) : null}

          {option.workRules.length ? (
            <>
              <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
                Quy tắc làm việc
              </AppText>
              {option.workRules.map((line, i) => (
                <AppText key={i} size={14} style={styles.line} color={Colors.text}>
                  • {line}
                </AppText>
              ))}
            </>
          ) : null}
        </View>
      ) : null}
    </Dialog>
  );
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  section: { marginTop: Spacing.lg, marginBottom: Spacing.sm },
  line: { lineHeight: 24 },
  blockRow: { flexDirection: 'row', alignItems: 'center' },
});

export default ServiceInfoDialog;
