// HandymanJobCarousel — "Việc cần làm" của Gọi thợ (anh Jacob 17/10/2026: lưới ô "quá xấu" → "làm 2 việc thôi, scroll ngang chọn
// thêm, mỗi việc có chi tiết thêm, mỗi việc là 1 card"):
// - dải thẻ trượt ngang, mỗi lần thấy 2 thẻ + mép thẻ kế (biết còn việc để vuốt); nút ‹ › lật 2 thẻ (web dùng chuột không vuốt
//   được), thanh tiến độ bên dưới;
// - mỗi thẻ là một việc như thẻ sản phẩm: icon riêng của việc, tên, thời gian làm khoảng, có cần leo trèo, mô tả / ghi chú vật tư
//   (catalog: description, materialsNote — admin sửa được), giá công / đơn vị, nút "Thêm" → "− n +";
// - dưới dải: "Đã chọn …" để khách vẫn thấy việc đã chọn khi thẻ đã trượt khuất.
// Thẻ là View chứa 2 vùng bấm anh em (thân thẻ / nút) — không lồng Pressable trong Pressable (web báo lỗi button lồng button).
import React, { useRef, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadow } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import type { CatalogJob } from '@/services/catalog';
import { formatVnd } from '@/services/bookingStore';

const GAP = 12;
/** mỗi thẻ hẹp lại chừng này để thẻ thứ 3 ló mép ra */
const PEEK = 18;
const TRACK_W = 56;
const UNIT: Record<string, string> = { lan: 'lần', cai: 'cái', bo: 'bộ', may: 'máy', m2: 'm²' };

/** icon từng việc theo mã catalog (MaterialCommunityIcons); việc mới chưa có trong bảng → icon theo loại thợ */
const JOB_ICON: Record<string, string> = {
  'thay-bong-den': 'lightbulb-on-outline',
  'lap-den-lon': 'ceiling-light-outline',
  'lap-den-tran-chum': 'chandelier',
  'thay-cong-tac': 'light-switch',
  'thay-o-cam': 'power-socket-eu',
  'lap-o-cam-moi': 'power-socket-eu',
  'thay-cb': 'electric-switch',
  'lap-quat-tran': 'ceiling-fan',
  'thay-quat-tran': 'fan',
  'lap-quat-hut': 'fan-chevron-up',
  'lap-may-nuoc-nong': 'water-boiler',
  'do-chap-dien': 'flash-alert-outline',
  'lap-chuong-cua': 'doorbell',
  'thay-voi-nuoc': 'faucet',
  'thay-voi-sen': 'shower-head',
  'sua-bo-xa-bon-cau': 'toilet',
  'thay-phao': 'water-pump',
  'thay-day-cap': 'pipe-valve',
  'sua-bon-cau-ri': 'water-alert',
  'thay-bon-cau': 'toilet',
  'thay-lavabo': 'countertop-outline',
  'thong-lavabo': 'pipe-wrench',
  'thong-bon-cau': 'toilet',
  'thong-san-toilet': 'pipe',
  'sua-ro-ri-ong': 'pipe-leak',
  'lap-may-loc-nuoc': 'water-check-outline',
  've-sinh-may-lanh': 'air-conditioner',
  've-sinh-may-lanh-lon': 'air-conditioner',
  've-sinh-may-lanh-tu-dung': 'air-filter',
  'bom-gas': 'gas-cylinder',
  'lap-may-lanh': 'air-conditioner',
  'thao-may-lanh': 'air-conditioner',
  'di-doi-may-lanh': 'air-conditioner',
  'sua-may-lanh': 'snowflake-melt',
  'lap-may-giat': 'washing-machine',
  've-sinh-may-giat': 'washing-machine',
  've-sinh-may-giat-thao-long': 'washing-machine',
  'sua-may-giat': 'washing-machine',
  'lap-may-nuoc-nong-dl': 'water-boiler',
  've-sinh-binh-nong-lanh': 'water-thermometer',
  'sua-tu-lanh': 'fridge-outline',
  'mo-khoa-tay-nam': 'lock-open-variant',
  'mo-khoa-cua-chinh': 'door-closed-lock',
  'mo-khoa-xe-may': 'motorbike',
  'sua-khoa-ket': 'lock-reset',
  'thay-loi-khoa': 'key-variant',
  'thay-o-khoa': 'lock',
  'lap-khoa-dien-tu': 'fingerprint',
  'lam-chia': 'key-plus',
};
const SERVICE_ICON: Record<string, string> = {
  'handyman-dien': 'flash',
  'handyman-nuoc': 'water',
  'handyman-dien-lanh': 'snowflake',
  'handyman-khoa': 'key-variant',
};

function jobIcon(job: CatalogJob, serviceCode: string): string {
  if (JOB_ICON[job.code]) return JOB_ICON[job.code]!;
  if (job.code.startsWith('khac')) return 'clipboard-text-search-outline';
  return SERVICE_ICON[serviceCode] ?? 'tools';
}

/** 20 → "~20 phút", 90 → "~1,5 giờ", 120 → "~2 giờ" */
function durationLabel(minutes: number): string {
  if (minutes < 60) return `~${minutes} phút`;
  return `~${(Math.round((minutes / 60) * 10) / 10).toString().replace('.', ',')} giờ`;
}

interface Props {
  jobs: CatalogJob[];
  serviceCode: string;
  qtyOf: (id: string) => number;
  onChange: (job: CatalogJob, qty: number) => void;
}

export const HandymanJobCarousel: React.FC<Props> = ({ jobs, serviceCode, qtyOf, onChange }) => {
  const scroller = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const cardW = width ? Math.floor((width - GAP) / 2 - PEEK) : 150;
  const step = cardW + GAP;
  const maxIndex = Math.max(0, jobs.length - 2);

  // chỉ đổi state khi sang thẻ khác → không vẽ lại cả sheet theo từng khung hình cuộn
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.min(maxIndex, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / step))));
  const go = (dir: 1 | -1) => {
    const next = Math.min(maxIndex, Math.max(0, index + dir * 2));
    scroller.current?.scrollTo({ x: next * step, animated: true });
    setIndex(next);
  };

  const selected = jobs.filter((j) => qtyOf(j.id) > 0);
  const thumbW = Math.max(14, Math.round(TRACK_W * Math.min(1, 2 / Math.max(1, jobs.length))));
  const thumbX = maxIndex ? Math.round(((TRACK_W - thumbW) * index) / maxIndex) : 0;

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <AppText size={15} weight="bold">
            Việc cần làm
          </AppText>
          <AppText size={12} color={Colors.textMuted}>
            {jobs.length} việc · giá công thợ, chưa gồm vật tư
          </AppText>
        </View>
        {jobs.length > 2 ? (
          <View style={styles.arrows}>
            <Pressable onPress={() => go(-1)} disabled={index === 0} style={[styles.arrow, index === 0 && styles.arrowOff]} accessibilityLabel="Việc trước">
              <Icon name={Icons.back} size={18} color={index === 0 ? Colors.gray400 : Colors.primary} />
            </Pressable>
            <Pressable onPress={() => go(1)} disabled={index >= maxIndex} style={[styles.arrow, index >= maxIndex && styles.arrowOff]} accessibilityLabel="Việc tiếp theo">
              <Icon name={Icons.chevronRight} size={18} color={index >= maxIndex ? Colors.gray400 : Colors.primary} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.bleed}
        contentContainerStyle={styles.track}
        snapToInterval={step}
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={32}
      >
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} width={cardW} qty={qtyOf(job.id)} icon={jobIcon(job, serviceCode)} onChange={(q) => onChange(job, q)} />
        ))}
      </ScrollView>

      {jobs.length > 2 ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressThumb, { width: thumbW, left: thumbX }]} />
        </View>
      ) : null}

      {selected.length ? (
        <View style={styles.picked}>
          <Icon name={Icons.checkCircle} size={16} color={Colors.primary} />
          <AppText size={13} color={Colors.primary} weight="semiBold" style={{ flex: 1, marginLeft: 6 }} numberOfLines={2}>
            Đã chọn {selected.length} việc: {selected.map((j) => `${j.name}${qtyOf(j.id) > 1 ? ` ×${qtyOf(j.id)}` : ''}`).join(', ')}
          </AppText>
        </View>
      ) : null}
    </View>
  );
};

interface CardProps {
  job: CatalogJob;
  width: number;
  qty: number;
  icon: string;
  onChange: (qty: number) => void;
}

const JobCard: React.FC<CardProps> = ({ job, width, qty, icon, onChange }) => {
  const on = qty > 0;
  return (
    <View style={[styles.card, { width }, on && styles.cardOn]}>
      <Pressable style={styles.cardBody} onPress={() => (on ? undefined : onChange(1))} accessibilityLabel={on ? `${job.name}, đã chọn ${qty}` : `Chọn ${job.name}`}>
        <View style={styles.cardTop}>
          <View style={[styles.iconWrap, on && styles.iconWrapOn]}>
            <Icon name={`mci:${icon}` as never} size={24} color={on ? Colors.white : Colors.primary} />
          </View>
          {on ? <Icon name={Icons.checkCircle} size={22} color={Colors.primary} /> : null}
        </View>
        <AppText size={14} weight="bold" numberOfLines={2} style={styles.name}>
          {job.name}
        </AppText>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Icon name={'mci:clock-outline' as never} size={13} color={Colors.textSecondary} />
            <AppText size={11} color={Colors.textSecondary} style={styles.metaText}>
              {durationLabel(job.durationMinutes)}
            </AppText>
          </View>
          {job.heightWork ? (
            <View style={styles.metaItem}>
              <Icon name={'mci:ladder' as never} size={13} color={Colors.textSecondary} />
              <AppText size={11} color={Colors.textSecondary} style={styles.metaText}>
                Leo trèo
              </AppText>
            </View>
          ) : null}
        </View>
        {job.description ? (
          <AppText size={12} color={Colors.text} numberOfLines={3} style={styles.note}>
            {job.description}
          </AppText>
        ) : null}
        {job.materialsNote ? (
          <View style={styles.materials}>
            <Icon name={'mci:package-variant-closed' as never} size={13} color={Colors.textMuted} style={{ marginTop: 1 }} />
            <AppText size={11} color={Colors.textMuted} numberOfLines={2} style={{ flex: 1, marginLeft: 4, lineHeight: 15 }}>
              {job.materialsNote}
            </AppText>
          </View>
        ) : null}
        <View style={{ flex: 1 }} />
        {job.price ? (
          <AppText size={16} weight="extraBold" color={Colors.primary} style={styles.price}>
            {formatVnd(job.price)}
            <AppText size={12} weight="medium" color={Colors.textMuted}>
              {' '}/{UNIT[job.unit] ?? job.unit}
            </AppText>
          </AppText>
        ) : (
          <AppText size={13} weight="bold" color={Colors.primary} style={styles.price}>
            Báo giá tại chỗ
          </AppText>
        )}
      </Pressable>

      {on ? (
        <View style={styles.stepper}>
          <Pressable onPress={() => onChange(qty - 1)} style={styles.stepBtn} hitSlop={6} accessibilityLabel={qty > 1 ? 'Bớt' : 'Bỏ việc này'}>
            <Icon name={(qty > 1 ? 'ion:remove' : 'ion:trash-outline') as never} size={16} color={Colors.primary} />
          </Pressable>
          <AppText size={15} weight="bold" color={Colors.white}>
            {qty}
          </AppText>
          <Pressable onPress={() => onChange(qty + 1)} style={styles.stepBtn} hitSlop={6} accessibilityLabel="Thêm">
            <Icon name={'ion:add' as never} size={16} color={Colors.primary} />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => onChange(1)} style={styles.addBtn} accessibilityLabel={`Thêm ${job.name}`}>
          <Icon name={'ion:add' as never} size={16} color={Colors.primary} />
          <AppText size={14} weight="bold" color={Colors.primary} style={{ marginLeft: 4 }}>
            Thêm
          </AppText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.sm },
  arrows: { flexDirection: 'row', gap: Spacing.sm, marginLeft: Spacing.sm },
  arrow: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  arrowOff: { borderColor: Colors.border },
  // dải thẻ tràn ra hết bề ngang sheet (thẻ trượt dưới lề), thẻ đầu vẫn thẳng lề nội dung
  bleed: { marginHorizontal: -Spacing.screen },
  track: { paddingHorizontal: Spacing.screen, paddingVertical: Spacing.xs, gap: GAP },
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    minHeight: 236,
    ...Shadow.sm,
  },
  cardOn: { borderWidth: 2, borderColor: Colors.primary, padding: Spacing.md - 1, backgroundColor: Colors.primaryBg },
  cardBody: { flex: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  iconWrap: { width: 44, height: 44, borderRadius: BorderRadius.lg, backgroundColor: Colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  iconWrapOn: { backgroundColor: Colors.primary },
  name: { marginTop: Spacing.sm, lineHeight: 19 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { marginLeft: 3 },
  note: { marginTop: 6, lineHeight: 16 },
  materials: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6 },
  price: { marginTop: Spacing.sm, marginBottom: Spacing.sm },
  addBtn: { height: 36, borderRadius: 999, borderWidth: 1.5, borderColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  stepper: { height: 36, borderRadius: 999, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { alignSelf: 'center', width: TRACK_W, height: 4, borderRadius: 2, backgroundColor: Colors.gray200, marginTop: Spacing.sm },
  progressThumb: { position: 'absolute', top: 0, height: 4, borderRadius: 2, backgroundColor: Colors.primary },
  picked: { flexDirection: 'row', alignItems: 'flex-start', marginTop: Spacing.sm },
});

export default HandymanJobCarousel;
