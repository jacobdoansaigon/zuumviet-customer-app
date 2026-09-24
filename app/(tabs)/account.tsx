// Hồ sơ — Figma HỒ SƠ tab (0-16311): header tím "Hồ sơ" + "..." ; dòng hồ sơ avatar 48 + tên bold 17
// + "Chỉnh sửa hồ sơ"; menu: Tài khoản (badge đ24.000) / Tài xế yêu thích (24) / Vị trí đã lưu (2) /
// Chính sách ZuumViet / Đổi mật khẩu / Đăng xuất. Toast teal "Cập nhật mật khẩu mới thành công".
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, ListRow, Dialog, BottomSheet, Toast, Icons } from '@/components/ui';
import { ProfileRow } from '@/components/profile';
import { authApi, getStoredCustomer, getDisplayName, formatPhoneDisplay, type CustomerProfile } from '@/services/api';
import { formatMoney } from '@/constants/mock';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useSavedLocations, useFavoriteDrivers, countFavoriteDrivers, localAvatarStore } from '@/services/profileStore';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const TOAST_MESSAGES: Record<string, string> = {
  passcode: 'Cập nhật mật khẩu mới thành công',
  profile: 'Cập nhật hồ sơ thành công',
};

export default function AccountScreen() {
  useStatusBarStyle('light');
  const params = useLocalSearchParams<{ toast?: string }>();
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const hideToast = useCallback(() => setToast(null), []);

  const savedLocations = useSavedLocations();
  const favoriteDrivers = useFavoriteDrivers();
  const localAvatar = localAvatarStore.use();
  const walletBalance = useWalletBalance();

  useFocusEffect(
    useCallback(() => {
      getStoredCustomer().then(setCustomer);
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
    setConfirmLogout(false);
    await authApi.logout();
    router.replace('/');
  };

  const name = getDisplayName(customer);
  const phone = formatPhoneDisplay(customer?.phone, customer?.country_code || '84');
  const avatarUri = localAvatar ?? (typeof customer?.avatar_url === 'string' ? customer.avatar_url : null);

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
          <ListRow
            icon={Icons.heartOutline}
            label="Tài xế yêu thích"
            badgeCount={countFavoriteDrivers(favoriteDrivers)}
            onPress={() => router.push('/profile/favorite-drivers')}
          />
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
          { label: 'Đăng xuất', variant: 'danger', onPress: handleLogout },
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
