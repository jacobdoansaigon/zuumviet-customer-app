// HandymanJobDialog — Gọi thợ: bấm vào MỘT loại thợ (hoặc icon ⓘ) mở "Chi tiết công việc" — mô tả sự
// cố, ảnh hiện trạng, mức độ khẩn cấp — TRƯỚC khi chọn, cùng kiểu tương tác với Thuê nhân công
// (ServiceInfoDialog). Trước đây 3 trường này nằm ở màn "Thông tin liên hệ" — giống hệt màn nhập địa
// chỉ/tên/SĐT của mọi dịch vụ khác nên khách không để ý ra có gì khác, nay tách hẳn thành bước riêng.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, BottomSheet, Button, Icons, SwitchRow, TextField } from '@/components/ui';
import { EXTRA_PRICES, type ServiceOptionDef } from '@/constants/mockBooking';
import { PhotoAttachRow } from './PhotoAttachRow';

export interface HandymanJobDetail {
  issueNote: string;
  photos: string[];
  urgent: boolean;
}

interface Props {
  option: ServiceOptionDef | null;
  /** lựa chọn đã lưu từ trước (nếu hạng mục này đang là hạng mục đang chọn) */
  initial: HandymanJobDetail;
  onClose: () => void;
  onSelect: (option: ServiceOptionDef, detail: HandymanJobDetail) => void;
}

const titleCase = (s: string) => s.replace(/(^|\s)(\p{L})/gu, (m) => m.toUpperCase());

export const HandymanJobDialog: React.FC<Props> = ({ option, initial, onClose, onSelect }) => {
  const [issueNote, setIssueNote] = useState(initial.issueNote);
  const [photos, setPhotos] = useState(initial.photos);
  const [urgent, setUrgent] = useState(initial.urgent);

  // Sheet dùng lại cho nhiều loại thợ — mỗi lần mở loại khác phải nạp lại đúng lựa chọn của loại đó
  useEffect(() => {
    if (option) {
      setIssueNote(initial.issueNote);
      setPhotos(initial.photos);
      setUrgent(initial.urgent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option?.id]);

  return (
    <BottomSheet visible={!!option} onClose={onClose} title={option ? titleCase(option.name) : undefined} showClose scroll contentStyle={styles.content}>
      {option ? (
        <View style={{ gap: Spacing.sm }}>
          <AppText size={13} color={Colors.textSecondary}>
            {option.description}
          </AppText>

          <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
            Thông tin dịch vụ
          </AppText>
          {option.infoLines.map((line, i) => (
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

          <AppText weight="bold" size={14} style={{ marginTop: Spacing.md, marginBottom: Spacing.xs }}>
            Ảnh hiện trạng (nếu có)
          </AppText>
          <PhotoAttachRow photos={photos} onChange={setPhotos} />

          <SwitchRow
            icon={Icons.alert}
            label="Xử lý khẩn cấp"
            sublabel={`đ${EXTRA_PRICES.urgentCallout.toLocaleString('vi-VN')} · ưu tiên điều thợ ngay, kể cả ngoài giờ`}
            value={urgent}
            onValueChange={setUrgent}
            style={{ marginTop: Spacing.sm }}
          />

          <Button title="Chọn" onPress={() => onSelect(option, { issueNote, photos, urgent })} style={{ marginTop: Spacing.md }} />
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
