// BookingMap (web) — react-native-maps không chạy trên web → vẽ nền bản đồ giả (Colors.mapBg + đường phố)
// và chiếu toạ độ các điểm vào khung để vẫn thấy lộ trình khi demo trên trình duyệt.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText } from '@/components/ui';
import { MapMarkerView, MARKER_SIZE } from './MapMarkerView';
import type { BookingMapProps, MapStop } from './mapTypes';

const STREET = '#FFFFFF';
const STREET_EDGE = '#E4DDEC';
const BLOCK = '#ECE7F2';

type Pt = MapStop & { x: number; y: number };

function project(stops: MapStop[], w: number, h: number, bottomPad: number): Pt[] {
  if (!stops.length || w <= 0 || h <= 0) return [];
  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);
  const MIN = 0.012;
  if (maxLat - minLat < MIN) {
    const c = (maxLat + minLat) / 2;
    minLat = c - MIN / 2;
    maxLat = c + MIN / 2;
  }
  if (maxLng - minLng < MIN) {
    const c = (maxLng + minLng) / 2;
    minLng = c - MIN / 2;
    maxLng = c + MIN / 2;
  }
  const padX = 56;
  const top = 110;
  const usableH = Math.max(120, h - bottomPad - top - 40);
  return stops.map((s) => ({
    ...s,
    x: padX + ((s.lng - minLng) / (maxLng - minLng)) * (w - padX * 2),
    y: top + ((maxLat - s.lat) / (maxLat - minLat)) * usableH,
  }));
}

function routeDots(pts: Pt[]): { x: number; y: number; k: string }[] {
  const line = pts.filter((p) => p.type !== 'driver');
  const dots: { x: number; y: number; k: string }[] = [];
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i]!;
    const b = line[i + 1]!;
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(2, Math.floor(d / 12));
    for (let j = 1; j < n; j++) {
      const t = j / n;
      dots.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, k: `${i}-${j}` });
    }
  }
  return dots;
}

export const BookingMap: React.FC<BookingMapProps> = ({ stops, showRoute = true, bottomPadding = 0, style }) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });
  const pts = useMemo(() => project(stops, size.w, size.h, bottomPadding), [stops, size.w, size.h, bottomPadding]);
  const dots = useMemo(() => (showRoute ? routeDots(pts) : []), [pts, showRoute]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.bg, style]} onLayout={onLayout}>
      {/* khối nhà */}
      <View style={[styles.block, { top: '6%', left: '8%', width: '26%', height: '14%' }]} />
      <View style={[styles.block, { top: '30%', left: '62%', width: '30%', height: '18%' }]} />
      <View style={[styles.block, { top: '58%', left: '10%', width: '34%', height: '16%' }]} />
      {/* đường phố */}
      <View style={[styles.street, { top: '22%', left: 0, right: 0, height: 14 }]} />
      <View style={[styles.street, { top: '52%', left: 0, right: 0, height: 22 }]} />
      <View style={[styles.street, { top: '80%', left: 0, right: 0, height: 12 }]} />
      <View style={[styles.street, { left: '30%', top: 0, bottom: 0, width: 14 }]} />
      <View style={[styles.street, { left: '66%', top: 0, bottom: 0, width: 20 }]} />
      <View style={[styles.street, styles.diagonal]} />
      {/* lộ trình */}
      {dots.map((d) => (
        <View key={d.k} style={[styles.dot, { left: d.x - 3, top: d.y - 3 }]} />
      ))}
      {pts.map((p) => (
        <View key={p.id} style={{ position: 'absolute', left: p.x - MARKER_SIZE / 2, top: p.type === 'dropoff' ? p.y - MARKER_SIZE : p.y - MARKER_SIZE / 2 }}>
          <MapMarkerView type={p.type} />
        </View>
      ))}
      <View style={[styles.note, { bottom: bottomPadding + Spacing.sm }]}>
        <AppText size={11} color={Colors.textMuted}>
          Bản đồ tương tác hiển thị trên ứng dụng di động
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bg: { backgroundColor: Colors.mapBg, overflow: 'hidden' },
  block: { position: 'absolute', backgroundColor: BLOCK, borderRadius: 6 },
  street: { position: 'absolute', backgroundColor: STREET, borderColor: STREET_EDGE, borderWidth: 1 },
  diagonal: { top: '38%', left: '-15%', width: '130%', height: 10, transform: [{ rotate: '-22deg' }] },
  dot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, opacity: 0.85 },
  note: { position: 'absolute', left: Spacing.screen, backgroundColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
});

export default BookingMap;
