// Tham gia cộng đồng — Figma Hệ thống OTP 0.2..0.6: header + icon QR, "Nhập mã giới thiệu" bold, 6 ô,
// link "Tôi không có mã giới thiệu ?", nút "Tiếp tục"; lỗi toast đỏ "Mã giới thiệu không hợp lệ...";
// thành công: card avatar "Nguyễn Văn A" / "MS: 298-595-3904" / "Thành viên: 576/1728" + "Đồng ý".
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, Button, CodeInput, Dialog, Avatar, Toast, Icons } from '@/components/ui';
import { communityActions, isValidJoinCode } from '@/services/communityStore';
import { MOCK_COMMUNITY } from '@/constants/mock';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

export default function CommunityJoinScreen() {
  useStatusBarStyle('dark');
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tone: 'error' | 'success' | 'info' } | null>(null);
  const hideToast = useCallback(() => setToast(null), []);
  const [success, setSuccess] = useState(false);
  const [noCode, setNoCode] = useState(false);

  const leader = MOCK_COMMUNITY.leader;

  const submit = () => {
    if (code.length !== 6) return;
    if (!isValidJoinCode(code)) {
      setInvalid(true);
      setToast({ msg: 'Mã giới thiệu không hợp lệ. Vui lòng kiểm tra lại mã 6 số từ người giới thiệu.', tone: 'error' });
      return;
    }
    setSuccess(true);
  };

  const confirmJoin = () => {
    communityActions.join();
    setSuccess(false);
    router.replace('/community');
  };

  return (
    <Screen
      header={
        <AppHeader
          title="Tham gia cộng đồng"
          variant="light"
          left="back"
          right={{ icon: Icons.qr, onPress: () => setToast({ msg: 'Quét mã QR (ZuumScan) sẽ sớm ra mắt', tone: 'info' }), label: 'Quét QR' }}
        />
      }
      footer={<Button title="Tiếp tục" flat onPress={submit} disabled={code.length !== 6} />}
      footerPadded={false}
    >
      <View style={styles.body}>
        <AppText weight="bold" size={20} color={Colors.text} align="center">
          Nhập mã giới thiệu
        </AppText>
        <AppText size={14} color={Colors.textSecondary} align="center" style={styles.sub}>
          Nhập mã 6 số do người giới thiệu cung cấp để kết nối vào cộng đồng của họ
        </AppText>

        <View style={styles.codes}>
          <CodeInput
            value={code}
            onChangeText={(v) => {
              setCode(v);
              if (invalid) setInvalid(false);
            }}
            length={6}
            autoFocus
            error={invalid}
          />
        </View>

        <Pressable onPress={() => setNoCode(true)} hitSlop={8} style={styles.link}>
          <AppText size={14} color={Colors.textSecondary} align="center">
            Tôi không có mã giới thiệu ?
          </AppText>
        </Pressable>

        <AppText size={11} color={Colors.textDisabled} align="center" style={{ marginTop: Spacing['2xl'] }}>
          Demo: mã hợp lệ {MOCK_COMMUNITY.validJoinCodes.join(' hoặc ')}
        </AppText>
      </View>

      {/* Thành công (OTP 0.5) */}
      <Dialog visible={success} onClose={() => setSuccess(false)} dismissable={false} actions={[{ label: 'Đồng ý', onPress: confirmJoin }]} actionsRow={false}>
        <View style={styles.successCard}>
          <Avatar name={leader.name} size={72} />
          <AppText weight="bold" size={20} color={Colors.text} align="center" style={{ marginTop: Spacing.md }}>
            {leader.name}
          </AppText>
          <AppText size={14} color={Colors.textSecondary} align="center" style={{ marginTop: 4 }}>
            {leader.code}
          </AppText>
          <AppText size={14} color={Colors.textSecondary} align="center" style={{ marginTop: 2 }}>
            Thành viên:{' '}
            <AppText size={14} weight="bold" color={Colors.text}>
              {leader.members}/{leader.memberCapacity}
            </AppText>
          </AppText>
          <AppText size={13} color={Colors.textSecondary} align="center" style={{ marginTop: Spacing.md, lineHeight: 19 }}>
            Bạn sẽ trở thành thành viên trong cộng đồng của {leader.name}.
          </AppText>
        </View>
      </Dialog>

      <Dialog
        visible={noCode}
        onClose={() => setNoCode(false)}
        title="Không có mã giới thiệu?"
        message="Hãy nhờ người dùng ZuumViet gửi mã giới thiệu 6 số hoặc mã QR của họ. Không có mã, bạn vẫn có thể sử dụng đầy đủ dịch vụ ZuumViet."
        actions={[{ label: 'Đã hiểu', onPress: () => setNoCode(false) }]}
      />

      <Toast visible={!!toast} message={toast?.msg ?? ''} tone={toast?.tone ?? 'error'} onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: Spacing.screen, paddingTop: Spacing['2xl'] },
  sub: { marginTop: Spacing.sm, lineHeight: 21 },
  codes: { marginTop: Spacing['2xl'] },
  link: { marginTop: Spacing.xl, alignSelf: 'center', paddingVertical: Spacing.xs },
  successCard: { alignItems: 'center', paddingVertical: Spacing.sm },
});
