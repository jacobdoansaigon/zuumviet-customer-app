// Welcome — Figma [Customer] "Login" (0-6704): logo tím, minh hoạ, headline "Hãy cùng zuumviet",
// CTA "Đăng nhập bằng số điện thoại", footer điều khoản. Tự chuyển /home nếu đã có phiên đăng nhập.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Button, Logo, Icon } from '@/components/ui';
import { getStoredCustomer } from '@/services/api';

export default function WelcomeScreen() {
  const [checking, setChecking] = useState(true);
  const { width } = useWindowDimensions();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const c = await getStoredCustomer();
        if (!alive) return;
        if (c) {
          router.replace('/home');
          return;
        }
      } catch {
        /* không có phiên → hiện welcome */
      }
      if (alive) setChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (checking) {
    // Splash (Figma "Flash"): nền tím, logo trắng
    return (
      <View style={styles.splash}>
        <StatusBar style="light" />
        <Logo tone="white" size={84} />
      </View>
    );
  }

  const illuW = Math.min(width - Spacing.screen * 2, 340);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.logoWrap}>
        <Logo size={56} />
      </View>

      {/* Minh hoạ thành phố + xe (placeholder vẽ bằng View, chưa có asset) */}
      <View style={[styles.illustration, { width: illuW, height: illuW * 0.62 }]}>
        <View style={styles.sky} />
        <View style={[styles.building, { left: '8%', height: '55%', width: '14%' }]} />
        <View style={[styles.building, { left: '26%', height: '72%', width: '18%', backgroundColor: '#C69DE2' }]} />
        <View style={[styles.building, { left: '48%', height: '48%', width: '12%' }]} />
        <View style={[styles.building, { left: '64%', height: '80%', width: '20%', backgroundColor: '#AF76D5' }]} />
        <View style={styles.road} />
        <View style={styles.car}>
          <Icon name="mci:car-side" size={44} color={Colors.secondary} />
        </View>
        <View style={styles.rider}>
          <Icon name="mci:moped" size={38} color={Colors.primary} />
        </View>
        <View style={[styles.person, { left: '12%' }]}>
          <Icon name="ion:person" size={26} color={Colors.primaryDark} />
        </View>
        <View style={[styles.person, { right: '10%' }]}>
          <Icon name="ion:person" size={26} color={Colors.success} />
        </View>
      </View>

      <View style={styles.textBlock}>
        <AppText weight="extraBold" size={30} color={Colors.primary} align="center" style={styles.headline}>
          Hãy cùng zuumviet
        </AppText>
        <AppText size={15} color={Colors.textSecondary} align="center" style={styles.sub}>
          Dịch vụ chất lượng, di chuyển an toàn, cước phí tốt và nhiều ưu đãi
        </AppText>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.bottom}>
        <Button title="Đăng nhập bằng số điện thoại" onPress={() => router.push('/(auth)/login')} />
        <View style={styles.terms}>
          <AppText size={12} color={Colors.textSecondary} align="center">
            Khi Đăng nhập hoặc Đăng ký, Tôi đã đồng ý với{' '}
          </AppText>
          <View style={styles.termsLinks}>
            <Pressable onPress={() => router.push('/profile/policies?open=terms')} hitSlop={6}>
              <AppText size={12} weight="bold" color={Colors.primary}>
                Điều khoản dịch vụ
              </AppText>
            </Pressable>
            <AppText size={12} color={Colors.textSecondary}>
              {' '}
              /{' '}
            </AppText>
            <Pressable onPress={() => router.push('/profile/policies?open=privacy')} hitSlop={6}>
              <AppText size={12} weight="bold" color={Colors.primary}>
                Chính sách bảo mật
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: Colors.white, paddingHorizontal: Spacing.screen },
  logoWrap: { alignItems: 'center', marginTop: Spacing.xl },
  illustration: {
    alignSelf: 'center',
    marginTop: Spacing['2xl'],
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#F3EEF8',
  },
  sky: { position: 'absolute', top: 0, left: 0, right: 0, height: '70%', backgroundColor: '#F9F6FA' },
  building: {
    position: 'absolute',
    bottom: '26%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#DEC3F0',
  },
  road: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '26%', backgroundColor: '#E7DDF0' },
  car: { position: 'absolute', bottom: '12%', right: '22%' },
  rider: { position: 'absolute', bottom: '14%', left: '30%' },
  person: { position: 'absolute', bottom: '16%' },
  textBlock: { marginTop: Spacing['2xl'], paddingHorizontal: Spacing.base },
  headline: { lineHeight: 38 },
  sub: { marginTop: Spacing.md, lineHeight: 22 },
  bottom: { paddingBottom: Spacing.base },
  terms: { marginTop: Spacing.base, alignItems: 'center' },
  termsLinks: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
});
