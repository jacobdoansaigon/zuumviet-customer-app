// TripPreviewCard — đầu màn "Xác nhận" (anh Jacob 16/10/2026: bỏ bảng chi tiết giá, thay bằng "Bản đồ hành trình"):
// - bản đồ nhỏ (chỉ xem) vẽ đúng tuyến đường đón → các điểm đến (routePolyline của báo giá; chưa có báo giá thì tuyến
//   GET /routes/shape), chip "4,0 km · khoảng 12 phút" ở góc trên (góc dưới trái là nút bản quyền của bản đồ);
// - dòng dịch vụ đang chọn (icon minh hoạ lớn) + giờ dự kiến tới nơi (chở khách / giao hàng);
// - các điểm đón / điểm đến; gọi thợ / thuê nhân công (tận nơi): công việc đã chọn, điều kiện làm việc, ảnh hiện trạng.
// Giờ tới nơi = (giờ hẹn hoặc bây giờ) + ~5 phút tài xế tới đón + thời gian chạy theo Goong — luôn ghi "khoảng".
import React, { useMemo } from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons, RouteStops, ServiceIcon, type RouteStop, type ServiceIconName } from '@/components/ui';
import { decodePolyline } from '@/components/map/polyline';
import { SERVICE_GROUPS, SERVICE_PRESENTATION } from '@/constants/booking';
import { completeReceivers, type BookingState, type Quote } from '@/services/bookingStore';
import type { CatalogService } from '@/services/catalog';
import { routeModeOf } from '@/services/places';
import { VN_OFFSET_MS } from '@/services/vnTime';
import { BookingMap } from './BookingMap';
import type { MapStop } from './mapTypes';
import { useRouteShape } from './useRouteShape';

const MAP_H = 188;
/** lề canh tuyến trong khung bản đồ nhỏ (trên: chip quãng đường + ghim điểm đến cao ~36 px; dưới: nút bản quyền bản đồ) */
const FIT_MARGIN = { top: 64, right: 32, bottom: 36, left: 32 };
/** ước lượng thời gian tài xế tới đón khi chưa có tài xế (phút) */
const PICKUP_WAIT_MIN = 5;

const hhmm = (ms: number) => {
  const d = new Date(ms + VN_OFFSET_MS);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
};
const kmLabel = (m: number) => `${(m / 1000).toFixed(1).replace('.', ',')} km`;
const minutesLabel = (s: number) => {
  const m = Math.max(1, Math.round(s / 60));
  return m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60 ? `${m % 60} phút` : ''}`.trim() : `${m} phút`;
};

interface Props {
  state: BookingState;
  svc: CatalogService | null;
  quote: Quote | null;
}

export const TripPreviewCard: React.FC<Props> = ({ state, svc, quote }) => {
  const group = SERVICE_GROUPS[state.service];
  const labels = group.labels;
  const pickup = state.sender.place;
  const receivers = completeReceivers(state);
  const onSite = group.kind === 'onsite' || (svc?.rules.maxStops ?? group.maxStops) === 0;
  const opt = state.options;

  const mapStops = useMemo<MapStop[]>(() => {
    if (!pickup) return [];
    return [
      { id: 'pickup', lat: pickup.lat, lng: pickup.lng, type: onSite ? 'dropoff' : 'pickup', label: labels.mapPickupLabel },
      ...(onSite ? [] : receivers.map<MapStop>((r, i) => ({ id: `drop-${r.id}`, lat: r.place!.lat, lng: r.place!.lng, type: 'dropoff', label: `${labels.mapDropLabel} ${i + 1}` }))),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickup?.lat, pickup?.lng, onSite, receivers.map((r) => `${r.place?.lat},${r.place?.lng}`).join('|')]);

  // tuyến: của báo giá; chưa có báo giá thì hỏi tuyến theo đường (không nối thẳng)
  const quotedPath = useMemo(() => decodePolyline(quote?.routePolyline), [quote?.routePolyline]);
  const shape = useRouteShape(!onSite && quotedPath.length < 2 && mapStops.length > 1 ? mapStops : null, routeModeOf(svc?.vehicleType));
  const path = quotedPath.length >= 2 ? quotedPath : (shape?.path ?? null);
  const distance = quote?.distanceMeters ?? shape?.distanceMeters ?? 0;
  const duration = quote?.durationSeconds ?? shape?.durationSeconds ?? null;

  const fitPoints = path && path.length >= 2 ? path : mapStops;
  const fitKey = `trip:${fitPoints.length}:${fitPoints[0]?.lat ?? 0},${fitPoints[0]?.lng ?? 0}:${fitPoints[fitPoints.length - 1]?.lat ?? 0}`;

  const art: ServiceIconName = (svc ? SERVICE_PRESENTATION[svc.code]?.art : undefined) ?? group.art;
  const arrival = !onSite && duration ? (opt.scheduledAt ?? Date.now()) + PICKUP_WAIT_MIN * 60_000 + duration * 1000 : null;

  const stops: RouteStop[] = pickup
    ? [
        { title: pickup.title || pickup.address, subtitle: pickup.title && pickup.address !== pickup.title ? pickup.address : undefined, type: onSite ? 'dropoff' : 'pickup' },
        ...(onSite ? [] : receivers.map<RouteStop>((r) => ({ title: r.place!.title || r.place!.address, subtitle: r.place!.title && r.place!.address !== r.place!.title ? r.place!.address : undefined, type: 'dropoff' }))),
      ]
    : [];

  // gọi thợ: công việc đã chọn + điều kiện + ảnh
  const jobs = onSite && svc?.jobs.length ? opt.handymanJobs.map((j) => ({ ...j, job: svc.jobs.find((x) => x.id === j.id) })).filter((j) => j.job) : [];
  const conditions = onSite
    ? [opt.handymanHeight && 'Leo trèo / trên cao', opt.handymanLadder && 'Thợ mang thang', opt.handymanUrgent && 'Cần gấp', opt.handymanFloor.trim() && opt.handymanFloor.trim()].filter(Boolean) as string[]
    : [];

  return (
    <View style={styles.card}>
      <View style={styles.mapBox}>
        {mapStops.length ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <BookingMap
              stops={mapStops}
              routePath={path}
              showRoute={!onSite && !!path}
              showsUserLocation={false}
              bottomPadding={0}
              fitOverride={{ key: fitKey, points: fitPoints, margin: FIT_MARGIN }}
            />
          </View>
        ) : null}
        {!onSite && distance > 0 ? (
          <View style={styles.chip}>
            <Icon name={Icons.navigate} size={14} color={Colors.primary} />
            <AppText size={13} weight="bold" color={Colors.text} style={{ marginLeft: 6 }}>
              {kmLabel(distance)}
              {duration ? ` · khoảng ${minutesLabel(duration)}` : ''}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.serviceRow}>
        <ServiceIcon name={art} size={48} />
        <View style={{ flex: 1, marginLeft: Spacing.md }}>
          <AppText weight="bold" size={16} numberOfLines={1}>
            {svc?.name ?? group.title}
          </AppText>
          {svc?.shortDescription || SERVICE_PRESENTATION[svc?.code ?? '']?.description ? (
            <AppText size={13} color={Colors.textSecondary} numberOfLines={1}>
              {svc?.shortDescription?.trim() || SERVICE_PRESENTATION[svc?.code ?? '']?.description}
            </AppText>
          ) : null}
        </View>
        {arrival ? (
          <View style={styles.eta}>
            <AppText size={11} color={Colors.textSecondary}>
              {group.kind === 'delivery' ? 'Giao xong khoảng' : 'Tới nơi khoảng'}
            </AppText>
            <AppText size={17} weight="bold" color={Colors.primary}>
              {hhmm(arrival)}
            </AppText>
          </View>
        ) : onSite ? (
          <View style={styles.eta}>
            <AppText size={12} weight="semiBold" color={Colors.primary}>
              {labels.provider} đến tận nơi
            </AppText>
          </View>
        ) : null}
      </View>

      {stops.length ? (
        <View style={styles.stops}>
          <RouteStops stops={stops} compact titleSize={14} />
        </View>
      ) : null}

      {jobs.length ? (
        <View style={styles.section}>
          <AppText size={13} weight="bold" style={{ marginBottom: 4 }}>
            Công việc
          </AppText>
          {jobs.map((j) => (
            <View key={j.id} style={styles.jobRow}>
              <Icon name={Icons.checkCircle} size={16} color={Colors.primary} />
              <AppText size={14} style={{ flex: 1, marginLeft: 6 }} numberOfLines={1}>
                {j.job!.name}
                {j.qty > 1 ? ` ×${j.qty}` : ''}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
      {conditions.length ? (
        <View style={[styles.section, styles.chips]}>
          {conditions.map((c) => (
            <View key={c} style={styles.tag}>
              <AppText size={12} weight="semiBold" color={Colors.primary}>
                {c}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}
      {onSite && opt.handymanPhotos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
          {opt.handymanPhotos.map((p) => (
            <Image key={p.uri} source={{ uri: p.uri }} style={styles.photo} />
          ))}
        </ScrollView>
      ) : null}
      <View style={{ height: Spacing.md }} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.screen,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  mapBox: { height: MAP_H, backgroundColor: Colors.mapBg },
  chip: {
    position: 'absolute',
    left: Spacing.md,
    top: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...Shadow.md,
  },
  serviceRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  eta: { alignItems: 'flex-end', marginLeft: Spacing.sm },
  stops: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs },
  section: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  jobRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: Colors.primaryTint, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  photos: { gap: Spacing.sm, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },
  photo: { width: 64, height: 64, borderRadius: BorderRadius.md, backgroundColor: Colors.surfaceAlt },
});

export default TripPreviewCard;
