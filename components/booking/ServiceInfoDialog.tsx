// ServiceInfoDialog — GH 1.2: "Siêu Tốc — Thông tin dịch vụ" (icon + tên + mô tả, các dòng giá, nút Hủy / Chọn)
// Thuê nhân công (option.blockHours có giá trị): thêm "Thời gian làm việc" (chọn số block bằng Stepper,
// mỗi block = option.blockHours giờ, tối đa option.maxBlocks), "Số lượng nhân công" (option.maxWorkers,
// giảm giá mỗi người thêm từ người thứ 2) và "Quy tắc làm việc" (option.workRules).
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Dialog, Icon, Stepper } from '@/components/ui';
import { formatVnd } from '@/services/bookingStore';
import { EXTRA_PRICES, type ServiceOptionDef } from '@/constants/mockBooking';

interface Props {
  option: ServiceOptionDef | null;
  /** số block đã chọn từ trước cho ĐÚNG hạng mục đang hiển thị (nếu đây là hạng mục đang được chọn) */
  initialBlocks?: number;
  /** số nhân công đã chọn từ trước cho ĐÚNG hạng mục đang hiển thị */
  initialWorkers?: number;
  onClose: () => void;
  onSelect: (option: ServiceOptionDef, blocks: number, workers: number) => void;
}

const titleCase = (s: string) => s.replace(/(^|\s)(\p{L})/gu, (m) => m.toUpperCase());

export const ServiceInfoDialog: React.FC<Props> = ({ option, initialBlocks = 1, initialWorkers = 1, onClose, onSelect }) => {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [workers, setWorkers] = useState(initialWorkers);

  // Dialog dùng lại cho nhiều hạng mục — mỗi lần mở hạng mục khác (hoặc mở lại) phải nạp lại lựa chọn của đúng hạng mục đó
  useEffect(() => {
    if (option) {
      setBlocks(initialBlocks);
      setWorkers(initialWorkers);
    }
  }, [option?.id, initialBlocks, initialWorkers]);

  const perWorkerTotal = option ? option.basePrice * blocks : 0;
  const discountedExtra = Math.round(perWorkerTotal * (1 - EXTRA_PRICES.laborGroupDiscountPercent / 100));
  const totalPrice = perWorkerTotal + discountedExtra * Math.max(0, workers - 1);

  return (
    <Dialog
      visible={!!option}
      onClose={onClose}
      actions={
        option
          ? [
              { label: 'Hủy', onPress: onClose, variant: 'secondary' },
              { label: 'Chọn', onPress: () => onSelect(option, blocks, workers) },
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

          {option.blockHours ? (
            <>
              <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
                Thời gian làm việc
              </AppText>
              <View style={styles.blockRow}>
                <View style={{ flex: 1 }}>
                  <AppText size={15} weight="bold">
                    {blocks} block × {option.blockHours} giờ = {blocks * option.blockHours} giờ
                  </AppText>
                </View>
                <Stepper value={blocks} onChange={setBlocks} min={1} max={option.maxBlocks ?? 3} />
              </View>
            </>
          ) : null}

          {option.maxWorkers ? (
            <>
              <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
                Số lượng nhân công
              </AppText>
              <View style={styles.blockRow}>
                <View style={{ flex: 1 }}>
                  <AppText size={15} weight="bold">
                    {workers} người
                  </AppText>
                  {workers > 1 ? (
                    <AppText size={13} color={Colors.textSecondary} style={{ marginTop: 2 }}>
                      Giảm {EXTRA_PRICES.laborGroupDiscountPercent}%/người từ người thứ 2
                    </AppText>
                  ) : null}
                </View>
                <Stepper value={workers} onChange={setWorkers} min={1} max={option.maxWorkers} />
              </View>
            </>
          ) : null}

          {option.blockHours ? (
            <AppText size={13} color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
              Tạm tính: {formatVnd(totalPrice)}
            </AppText>
          ) : null}

          {option.workRules?.length ? (
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
