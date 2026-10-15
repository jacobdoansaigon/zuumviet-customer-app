// AppFooter — chân trang chủ (anh Jacob 15/10/2026): logo + "ZuumViet" + slogan, một dòng Điều khoản · Chính sách bảo mật ·
// Phiên bản. Không còn hotline, email, website, tên / địa chỉ công ty, bản quyền, ghi chú.
import React from 'react';
import { View, Pressable, Linking, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, LogoMark } from '@/components/ui';
import { APP_FOOTER } from '@/constants/content';

const openUrl = (url: string) => Linking.openURL(url).catch(() => undefined);

export const AppFooter: React.FC = () => {
  // số build (versionCode, EAS tự tăng mỗi lần build) để biết máy đang chạy đúng bản APK nào — web không có thì bỏ
  const build = Application.nativeBuildVersion;
  const version = `${Constants.expoConfig?.version ?? '1.0.0'}${build ? ` (${build})` : ''}`;

  return (
    <View style={styles.root}>
      <View style={styles.divider} />

      <View style={styles.brandRow}>
        <LogoMark size={36} />
        <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
          <AppText size={16} weight="extraBold" color={Colors.primary}>
            ZuumViet
          </AppText>
          <AppText size={12} color={Colors.textSecondary} numberOfLines={1}>
            {APP_FOOTER.tagline}
          </AppText>
        </View>
      </View>

      <View style={styles.links}>
        <Pressable onPress={() => openUrl(APP_FOOTER.termsUrl)} hitSlop={6}>
          <AppText size={12} weight="semiBold" color={Colors.primary}>
            Điều khoản
          </AppText>
        </Pressable>
        <AppText size={12} color={Colors.gray400}>
          ·
        </AppText>
        <Pressable onPress={() => openUrl(APP_FOOTER.privacyUrl)} hitSlop={6}>
          <AppText size={12} weight="semiBold" color={Colors.primary}>
            Chính sách bảo mật
          </AppText>
        </Pressable>
        <AppText size={12} color={Colors.gray400}>
          ·
        </AppText>
        <AppText size={12} color={Colors.textMuted}>
          Phiên bản {version}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { marginTop: Spacing.xl, paddingBottom: Spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  links: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.base },
});

export default AppFooter;
