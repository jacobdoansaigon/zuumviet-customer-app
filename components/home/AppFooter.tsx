// AppFooter — chân trang chủ: logo + slogan, liên kết (Điều khoản · Bảo mật · Hỗ trợ), thông tin công ty, bản quyền + phiên bản
import React from 'react';
import { View, Pressable, Linking, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Icon, Icons, LogoMark } from '@/components/ui';
import { APP_FOOTER } from '@/constants/mock';

interface AppFooterProps {
  /** dòng ghi chú nhỏ dưới cùng (vd: dữ liệu demo) */
  note?: string;
}

const openUrl = (url: string) => Linking.openURL(url).catch(() => undefined);

export const AppFooter: React.FC<AppFooterProps> = ({ note }) => {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  const year = new Date().getFullYear();

  return (
    <View style={styles.root}>
      <View style={styles.divider} />

      <View style={styles.brandRow}>
        <LogoMark size={36} />
        <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
          <AppText size={16} weight="extraBold" color={Colors.primary}>
            zuumviet
          </AppText>
          <AppText size={12} color={Colors.textSecondary} numberOfLines={2} style={{ lineHeight: 16 }}>
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
        <Pressable onPress={() => openUrl(APP_FOOTER.website)} hitSlop={6}>
          <AppText size={12} weight="semiBold" color={Colors.primary}>
            zuumviet.vn
          </AppText>
        </Pressable>
      </View>

      <View style={styles.contactRow}>
        <Pressable onPress={() => openUrl(`tel:${APP_FOOTER.hotlineTel}`)} style={styles.contact} hitSlop={6}>
          <Icon name={Icons.headset} size={14} color={Colors.textSecondary} />
          <AppText size={12} color={Colors.textSecondary} style={{ marginLeft: 4 }}>
            Hỗ trợ {APP_FOOTER.hotline}
          </AppText>
        </Pressable>
        <Pressable onPress={() => openUrl(`mailto:${APP_FOOTER.email}`)} style={styles.contact} hitSlop={6}>
          <Icon name="ion:mail-outline" size={14} color={Colors.textSecondary} />
          <AppText size={12} color={Colors.textSecondary} style={{ marginLeft: 4 }}>
            {APP_FOOTER.email}
          </AppText>
        </Pressable>
      </View>

      <AppText size={11} color={Colors.textMuted} style={styles.company}>
        {APP_FOOTER.company} · {APP_FOOTER.address}
      </AppText>
      <AppText size={11} color={Colors.textMuted} align="center" style={styles.copy}>
        © {year} ZuumViet · Phiên bản {version}
      </AppText>
      {note ? (
        <AppText size={10} color={Colors.textDisabled} align="center" style={{ marginTop: 2 }}>
          {note}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { marginTop: Spacing.xl, paddingBottom: Spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginBottom: Spacing.lg },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  links: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.base },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.base, marginTop: Spacing.sm },
  contact: { flexDirection: 'row', alignItems: 'center' },
  company: { marginTop: Spacing.md, lineHeight: 16 },
  copy: { marginTop: Spacing.sm },
});

export default AppFooter;
