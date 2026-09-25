// app/booking/scan-driver.tsx — "Chọn tài xế trực tiếp": mở camera quét mã QR tài xế đưa để đặt chuyến ngay,
// bỏ qua bước tìm/ghép tài xế (đặt thẳng, chuyển sang màn theo dõi ở trạng thái "đã nhận").
// Web: camera không hỗ trợ quét mã (chỉ xem trước) → luôn có ô nhập mã thủ công để demo/QA.
import React, { useRef, useState } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Button, Icon, Icons, TextField } from '@/components/ui';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { SERVICE_GROUPS, resolveScannedDriver } from '@/constants/mockBooking';
import { RoundIconButton } from '@/components/booking';
import { useBooking, submitBookingWithDriver } from '@/services/bookingStore';

const FRAME = 230;

export default function ScanDriverScreen() {
  const state = useBooking();
  const labels = SERVICE_GROUPS[state.service].labels;
  const providerLower = labels.provider.toLowerCase();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [booking, setBooking] = useState(false);
  const handledRef = useRef(false);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/booking/confirm'));

  const bookWithCode = (raw: string) => {
    const code = raw.trim();
    if (!code || booking) return;
    setBooking(true);
    const driver = resolveScannedDriver(code);
    const res = submitBookingWithDriver(driver);
    router.replace({ pathname: '/booking/tracking', params: { orderId: res.orderId, from: 'booking' } });
  };

  const onBarcodeScanned = (result: BarcodeScanningResult) => {
    if (handledRef.current) return;
    handledRef.current = true;
    bookWithCode(result.data);
  };

  const isWeb = Platform.OS === 'web';
  const canScan = !isWeb && !!permission?.granted;

  return (
    <View style={styles.root}>
      {canScan ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcodeScanned}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.fallback]}>
          <Icon name="mci:qrcode-scan" size={64} color={Colors.primarySoft} />
          <AppText size={13} color={Colors.textMuted} align="center" style={{ marginTop: Spacing.md, paddingHorizontal: Spacing['2xl'] }}>
            {isWeb ? 'Camera quét mã QR hiển thị trên ứng dụng di động.' : 'Ứng dụng cần quyền camera để quét mã QR tài xế.'}
          </AppText>
          {!isWeb && permission && !permission.granted ? (
            <Button title="Cấp quyền camera" onPress={requestPermission} style={{ marginTop: Spacing.lg }} />
          ) : null}
        </View>
      )}

      {/* khung ngắm QR + lớp phủ mờ xung quanh */}
      {canScan ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={styles.overlayFill} />
          <View style={styles.overlayMidRow}>
            <View style={styles.overlaySide} />
            <View style={styles.frame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.overlaySide} />
          </View>
          <View style={styles.overlayFill} />
        </View>
      ) : null}

      <RoundIconButton icon={Icons.close} onPress={goBack} style={[styles.close, { top: insets.top + Spacing.md }]} accessibilityLabel="Đóng" />

      <View style={[styles.panel, { paddingBottom: insets.bottom + Spacing.md }]}>
        <AppText weight="bold" size={17} color={Colors.white}>
          Quét mã QR {providerLower}
        </AppText>
        <AppText size={13} color="rgba(255,255,255,0.85)" style={{ marginTop: 4, lineHeight: 18 }}>
          Đưa mã QR trên thẻ hoặc áo của {providerLower} vào khung hình để đặt chuyến ngay, không cần chờ ghép.
        </AppText>

        <View style={styles.manualRow}>
          <TextField
            value={manualCode}
            onChangeText={setManualCode}
            placeholder={`Không quét được? Nhập mã ${providerLower}`}
            containerStyle={{ flex: 1 }}
            autoCapitalize="characters"
          />
          <Button title="Xác nhận" onPress={() => bookWithCode(manualCode)} disabled={!manualCode.trim() || booking} loading={booking} size="sm" style={{ marginLeft: Spacing.sm }} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#141018' },
  close: { position: 'absolute', left: Spacing.screen },
  overlayFill: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  overlayMidRow: { flexDirection: 'row', height: FRAME },
  overlaySide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  frame: { width: FRAME, height: FRAME },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: Colors.white },
  cornerTL: { left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { left: 0, bottom: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { right: 0, bottom: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 8 },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,16,24,0.92)',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.screen,
    paddingTop: Spacing.lg,
    ...Shadow.lg,
  },
  manualRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg },
});
