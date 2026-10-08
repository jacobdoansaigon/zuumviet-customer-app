// Hồ sơ — Figma HỒ SƠ tab (0-16311): header tím "Hồ sơ" + "..." ; dòng hồ sơ avatar 48 + tên bold 17
// + "Chỉnh sửa hồ sơ"; menu: Tài khoản (số dư ví) / Vị trí đã lưu / Chính sách ZuumViet / Đổi mật khẩu / Đăng xuất.
// "Tài xế yêu thích" đã ẩn (API chưa có). Hồ sơ từ GET /v1/customer/me (cache + làm mới khi mở tab).
// Toast teal "Cập nhật mật khẩu mới thành công".
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, ListRow, Dialog, BottomSheet, Toast, Icons } from '@/components/ui';
import { ProfileRow } from '@/components/profile';
import { displayName, formatPhone, logout, refreshProfile, useProfile } from '@/services/session';
import { formatMoney } from '@/constants/mock';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useSavedLocations } from '@/services/profileStore';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const TOAST_MESSAGES: Record<string, string> = {
  passcode: 'Cập nhật mật khẩu mới thành công',
  profile: 'Cập nhật hồ sơ thành công',
};

export default function AccountScreen() {
  useStatusBarStyle('light');
  const params = useLocalSearchParams<{ toast?: string }>();
  const customer = useProfile();
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const savedLocations = useSavedLocations();
  const walletBalance = useWalletBalance();

  useFocusEffect(
    useCallback(() => {
      void refreshProfile().catch(() => undefined);
    }, [])
  );

  useEffect(() => {
    const key = Array.isArray(params.toast) ? params.toast[0] : params.toast;
    if (key && TOAST_MESSAGES[key]) {
      setToast(TOAST_MESSAGES[key]);
      router.setParams({ toast: '' });
    }
  }, [params.toast]);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
    router.replace('/');
  };

  const name = displayName(customer);
  const phone = formatPhone(customer?.phone);
  const avatarUri = customer?.avatarUrl ?? null;

  return (
    <Screen
      header={
        <AppHeader
          title="Hồ sơ"
          variant="dark"
          left="none"
          right={{ icon: Icons.more, onPress: () => setMoreOpen(true), label: 'Thêm' }}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ProfileRow name={name} phone={phone} avatarUri={avatarUri} onEdit={() => router.push('/profile/edit')} />

        <View style={styles.menu}>
          <ListRow icon={Icons.wallet} label="Tài khoản" badgeLabel={formatMoney(walletBalance)} onPress={() => router.push('/wallet')} />
          <ListRow icon={Icons.bookmark} label="Vị trí đã lưu" badgeCount={savedLocations.length} onPress={() => router.push('/profile/saved-locations')} />
          <ListRow icon={Icons.shield} label="Chính sách ZuumViet" onPress={() => router.push('/profile/policies')} />
          <ListRow icon={Icons.lock} label="Đổi mật khẩu" onPress={() => router.push('/profile/change-passcode')} />
          <ListRow icon={Icons.logout} iconColor={Colors.error} label="Đăng xuất" chevron={false} onPress={() => setConfirmLogout(true)} divider={false} />
        </View>

        <AppText size={12} color={Colors.textDisabled} align="center" style={styles.version}>
          ZuumViet Customer · v1.0.0
        </AppText>
      </ScrollView>

      <BottomSheet visible={moreOpen} onClose={() => setMoreOpen(false)} title="Tuỳ chọn" showClose>
        <ListRow
          icon={Icons.edit}
          label="Chỉnh sửa hồ sơ"
          onPress={() => {
            setMoreOpen(false);
            router.push('/profile/edit');
          }}
          style={{ paddingHorizontal: 0 }}
        />
        <ListRow
          icon={Icons.lock}
          label="Đổi mật khẩu"
          onPress={() => {
            setMoreOpen(false);
            router.push('/profile/change-passcode');
          }}
          style={{ paddingHorizontal: 0 }}
        />
        <ListRow
          icon={Icons.logout}
          iconColor={Colors.error}
          label="Đăng xuất"
          chevron={false}
          divider={false}
          onPress={() => {
            setMoreOpen(false);
            setConfirmLogout(true);
          }}
          style={{ paddingHorizontal: 0 }}
        />
      </BottomSheet>

      <Dialog
        visible={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Đăng xuất"
        message="Bạn có chắc muốn đăng xuất khỏi ZuumViet?"
        actions={[
          { label: 'Huỷ', variant: 'secondary', onPress: () => setConfirmLogout(false) },
          { label: loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất', variant: 'danger', onPress: () => void handleLogout() },
        ]}
      />

      <Toast visible={!!toast} message={toast ?? ''} tone="success" onHide={hideToast} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: Spacing['2xl'] },
  menu: { marginTop: Spacing.sm },
  version: { marginTop: Spacing['2xl'] },
});
