// components/booking/ZaloPasteSheet.tsx — "Dán từ Zalo": khách dán nguyên đoạn tin nhắn (tên/SĐT/địa chỉ lẫn
// lộn), bấm "Phân tích" để tách ra (services/addressParser.ts, chạy trên máy). Luôn cho xem & sửa kết quả trước khi
// áp dụng vào form; địa chỉ tách được sẽ mở màn tìm địa điểm để khách chọn đúng địa điểm thật.
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { AppText, BottomSheet, Button, Icon, Icons, TextField } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { parseZaloText, type ParsedAddress } from '@/services/addressParser';

interface ZaloPasteSheetProps {
  visible: boolean;
  onClose: () => void;
  /** true (mặc định): có ô tên/SĐT trên form gọi tới (Thông tin người gửi/nhận). false: chỉ cần địa chỉ. */
  includeContact?: boolean;
  onApply: (result: ParsedAddress) => void;
}

const PLACEHOLDER = 'Ví dụ: Chị Lan 0909123456\n123 Nguyễn Trãi, P.7, Q.5\nGiao buổi chiều nhé';

export const ZaloPasteSheet: React.FC<ZaloPasteSheetProps> = ({ visible, onClose, includeContact = true, onApply }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ParsedAddress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setText('');
    setResult(null);
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const pasteFromClipboard = async () => {
    try {
      const clip = await Clipboard.getStringAsync();
      if (clip) {
        setText(clip);
        setError(null);
      } else {
        setError('Khay nhớ tạm đang trống');
      }
    } catch {
      setError('Không đọc được khay nhớ tạm trên thiết bị này — dán trực tiếp vào ô bên trên nhé');
    }
  };

  const analyze = () => {
    if (!text.trim()) return;
    setError(null);
    const parsed = parseZaloText(text);
    if (!parsed.address && !parsed.phone && !parsed.name) {
      setResult(null);
      setError('Không nhận diện được thông tin nào trong đoạn vừa dán, thử dán đầy đủ hơn nhé.');
    } else {
      setResult(parsed);
    }
  };

  const apply = () => {
    if (!result) return;
    onApply(result);
    close();
  };

  return (
    <BottomSheet visible={visible} onClose={close} title="Dán từ Zalo/Messenger" showClose scroll contentStyle={styles.content}>
      <View style={{ gap: Spacing.sm }}>
        <AppText size={13} color={Colors.textSecondary}>
          Dán nguyên đoạn tin nhắn gửi qua Zalo/Messenger (tên, số điện thoại, địa chỉ...), ứng dụng sẽ tự tách ra để bạn kiểm tra.
        </AppText>

        <TextField value={text} onChangeText={setText} placeholder={PLACEHOLDER} multiline numberOfLines={5} inputStyle={styles.textArea} />

        <Button title="Dán từ khay nhớ tạm" variant="outline" size="sm" iconLeft={Icons.paste} fullWidth={false} onPress={() => void pasteFromClipboard()} />

        {error ? (
          <AppText size={13} color={Colors.error}>
            {error}
          </AppText>
        ) : null}

        <Button title="Phân tích" onPress={analyze} disabled={!text.trim()} />

        {result ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHead}>
              <Icon name={Icons.sparkles} size={16} color={Colors.primary} />
              <AppText size={12} weight="semiBold" color={Colors.primary} style={{ marginLeft: 6, flex: 1 }}>
                Đã tách nhanh — kiểm tra lại trước khi dùng
              </AppText>
            </View>

            {includeContact ? (
              <>
                <TextField label="Tên" value={result.name} onChangeText={(t) => setResult({ ...result, name: t })} containerStyle={styles.field} />
                <TextField
                  label="Số điện thoại"
                  value={result.phone}
                  onChangeText={(t) => setResult({ ...result, phone: t })}
                  keyboardType="phone-pad"
                  containerStyle={styles.field}
                />
              </>
            ) : null}
            <TextField label="Địa chỉ" value={result.address} onChangeText={(t) => setResult({ ...result, address: t })} multiline containerStyle={styles.field} />
            {result.note ? (
              <TextField label="Ghi chú" value={result.note} onChangeText={(t) => setResult({ ...result, note: t })} multiline containerStyle={styles.field} />
            ) : null}

            <Button title="Áp dụng" onPress={apply} style={{ marginTop: Spacing.sm }} />
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.screen },
  textArea: { minHeight: 110, alignItems: 'flex-start', paddingVertical: Spacing.sm },
  resultCard: { marginTop: Spacing.sm, gap: Spacing.xs },
  resultHead: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  field: { marginTop: Spacing.xs },
});

export default ZaloPasteSheet;
