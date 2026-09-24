// Chính sách ZuumViet — Figma Chính sách ZuumViet (1174-43381): header tím; menu icon tím + label 16 + chevron:
// "Hỗ trợ" / "Điều khoản dịch vụ" / "Chính sách bảo mật" / "Lái xe cùng ZuumViet". Nội dung mở trong BottomSheet.
// Param ?open=terms|privacy|support|drive → tự mở mục tương ứng (link từ màn Welcome).
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Linking, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, AppHeader, Screen, ListRow, BottomSheet, Button, Icons } from '@/components/ui';
import { MOCK_POLICIES, type PolicyItem } from '@/constants/mock';
import { useStatusBarStyle } from '@/hooks/useStatusBarStyle';

const SUPPORT_PHONE = '19006868';

export default function PoliciesScreen() {
  useStatusBarStyle('light');
  const { open } = useLocalSearchParams<{ open?: string }>();
  const [active, setActive] = useState<PolicyItem | null>(null);

  useEffect(() => {
    const key = Array.isArray(open) ? open[0] : open;
    if (key) {
      const found = MOCK_POLICIES.find((p) => p.id === key);
      if (found) setActive(found);
    }
  }, [open]);

  const callSupport = async () => {
    try {
      const url = `tel:${SUPPORT_PHONE}`;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.location.href = url;
        return;
      }
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch {
      /* thiết bị không hỗ trợ gọi */
    }
  };

  return (
    <Screen header={<AppHeader title="Chính sách ZuumViet" variant="dark" left="back" />}>
      <View style={styles.menu}>
        {MOCK_POLICIES.map((p, i) => (
          <ListRow key={p.id} icon={p.icon} label={p.label} onPress={() => setActive(p)} divider={i < MOCK_POLICIES.length - 1} />
        ))}
      </View>
      <AppText size={12} color={Colors.textDisabled} align="center" style={styles.note}>
        Phiên bản chính sách: 01/10/2026
      </AppText>

      <BottomSheet visible={!!active} onClose={() => setActive(null)} title={active?.label} showClose scroll maxHeightRatio={0.85}>
        {active?.paragraphs.map((t, i) => (
          <AppText key={i} size={15} color={Colors.gray800} style={styles.paragraph}>
            {t}
          </AppText>
        ))}
        {active?.id === 'support' ? (
          <Button title="Gọi tổng đài 1900 6868" variant="teal" iconLeft={Icons.phone} onPress={callSupport} style={{ marginTop: Spacing.lg }} />
        ) : null}
        <View style={{ height: Spacing.lg }} />
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  menu: { marginTop: Spacing.sm },
  note: { marginTop: Spacing['2xl'] },
  paragraph: { lineHeight: 22, marginTop: Spacing.md },
});
