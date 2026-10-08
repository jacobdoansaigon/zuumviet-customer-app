// HandymanJobDialog — Gọi thợ: bấm vào MỘT loại thợ (hoặc icon ⓘ) mở "Chi tiết công việc" — mô tả sự cố và yêu cầu
// xử lý khẩn cấp — TRƯỚC khi chọn. Thông tin này gửi kèm ghi chú đơn cho thợ (API chưa có trường riêng / phụ phí
// khẩn cấp, chưa nhận ảnh hiện trạng khi đặt đơn → không thu ảnh, không cộng giá trên app).
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, BottomSheet, Button, Icons, SwitchRow, TextField } from '@/components/ui';
import { serviceInfoLines, type ServiceOptionView } from '@/services/catalog';

export interface HandymanJobDetail {
  issueNote: string;
  urgent: boolean;
}

interface Props {
  option: ServiceOptionView | null;
  /** lựa chọn đã lưu từ trước (nếu hạng mục này đang là hạng mục đang chọn) */
  initial: HandymanJobDetail;
  onClose: () => void;
  onSelect: (option: ServiceOptionView, detail: HandymanJobDetail) => void;
}

const titleCase = (s: string) => s.replace(/(^|\s)(\p{L})/gu, (m) => m.toUpperCase());

export const HandymanJobDialog: React.FC<Props> = ({ option, initial, onClose, onSelect }) => {
  const [issueNote, setIssueNote] = useState(initial.issueNote);
  const [urgent, setUrgent] = useState(initial.urgent);

  // Sheet dùng lại cho nhiều loại thợ — mỗi lần mở loại khác phải nạp lại đúng lựa chọn của loại đó
  useEffect(() => {
    if (option) {
      setIssueNote(initial.issueNote);
      setUrgent(initial.urgent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option?.id]);

  return (
    <BottomSheet visible={!!option} onClose={onClose} title={option ? titleCase(option.name) : undefined} showClose scroll contentStyle={styles.content}>
      {option ? (
        <View style={{ gap: Spacing.sm }}>
          {option.description ? (
            <AppText size={13} color={Colors.textSecondary}>
              {option.description}
            </AppText>
          ) : null}

          <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
            Thông tin dịch vụ
          </AppText>
          {serviceInfoLines(option.service).map((line, i) => (
            <AppText key={i} size={15} style={styles.line} color={line.startsWith('*') ? Colors.textSecondary : Colors.text}>
              {line}
            </AppText>
          ))}

          <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
            Chi tiết công việc
          </AppText>
          <TextField
            label="Mô tả sự cố"
            value={issueNote}
            onChangeText={setIssueNote}
            placeholder="Vd: bóng đèn phòng khách chớp tắt, quạt trần kêu to..."
            multiline
            numberOfLines={3}
          />

          <SwitchRow
            icon={Icons.alert}
            label="Cần xử lý khẩn cấp"
            sublabel="Gửi kèm yêu cầu cho thợ để ưu tiên đến sớm"
            value={urgent}
            onValueChange={setUrgent}
            style={{ marginTop: Spacing.sm }}
          />

          <Button title={option.paused ? 'Dịch vụ đang tạm ngưng' : 'Chọn'} disabled={option.paused} onPress={() => onSelect(option, { issueNote, urgent })} style={{ marginTop: Spacing.md }} />
        </View>
      ) : null}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xl },
  section: { marginTop: Spacing.sm },
  line: { lineHeight: 24 },
});

export default HandymanJobDialog;
