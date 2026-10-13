// HandymanJobDialog — Gọi thợ (anh Jacob 2026-10-13): bấm MỘT loại thợ mở "Chi tiết công việc" TRƯỚC khi chọn:
//   1. hạng mục chọn sẵn (thay đèn, thay ổ cắm, lắp máy giặt…) với số lượng — giá công thợ theo catalog, chưa gồm vật tư
//   2. ảnh hiện trạng (tối đa 5, chụp / chọn từ thư viện) — tải lên kho lúc đặt đơn
//   3. cần leo trèo / làm trên cao? thợ mang thang theo? (phụ phí theo bảng giá) · tầng / vị trí · mô tả sự cố · khẩn cấp
// Thợ nhận được đơn đọc là hiểu việc. Tổng tiền ước tính cập nhật ngay trong sheet.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Image, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, BottomSheet, Button, Icon, Icons, SwitchRow, TextField } from '@/components/ui';
import { serviceInfoLines, type ServiceOptionView, type CatalogJob } from '@/services/catalog';
import { formatVnd } from '@/services/bookingStore';

export interface HandymanJobDetail {
  jobs: { id: string; qty: number }[];
  photos: { uri: string; fileId?: string }[];
  height: boolean;
  ladder: boolean;
  floor: string;
  issueNote: string;
  urgent: boolean;
}

export const EMPTY_JOB_DETAIL: HandymanJobDetail = { jobs: [], photos: [], height: false, ladder: false, floor: '', issueNote: '', urgent: false };
const MAX_PHOTOS = 5;
const MAX_JOBS = 10;
const UNIT: Record<string, string> = { lan: 'lần', cai: 'cái', bo: 'bộ', may: 'máy', m2: 'm²' };

interface Props {
  option: ServiceOptionView | null;
  initial: HandymanJobDetail;
  onClose: () => void;
  onSelect: (option: ServiceOptionView, detail: HandymanJobDetail) => void;
}

const titleCase = (s: string) => s.replace(/(^|\s)(\p{L})/gu, (m) => m.toUpperCase());

async function pickPhotos(source: 'camera' | 'library', remaining: number): Promise<string[]> {
  try {
    if (source === 'camera') {
      if (Platform.OS === 'web') return [];
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') return [];
      const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
      return res.canceled ? [] : res.assets.slice(0, remaining).map((a) => a.uri);
    }
    if (Platform.OS !== 'web') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') return [];
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: remaining });
    return res.canceled ? [] : res.assets.slice(0, remaining).map((a) => a.uri);
  } catch {
    return [];
  }
}

export const HandymanJobDialog: React.FC<Props> = ({ option, initial, onClose, onSelect }) => {
  const [d, setD] = useState<HandymanJobDetail>(initial);
  // Sheet dùng lại cho nhiều loại thợ — mỗi lần mở loại khác phải nạp lại đúng lựa chọn của loại đó
  useEffect(() => {
    if (option) setD(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option?.id]);

  if (!option) return <BottomSheet visible={false} onClose={onClose} />;
  const svc = option.service;
  const jobs: CatalogJob[] = svc.jobs;
  const qtyOf = (id: string) => d.jobs.find((j) => j.id === id)?.qty ?? 0;
  const setQty = (job: CatalogJob, qty: number) =>
    setD((cur) => {
      const others = cur.jobs.filter((j) => j.id !== job.id);
      const next = qty > 0 ? [...others, { id: job.id, qty: Math.min(20, qty) }] : others;
      // việc thường phải leo trèo → gợi ý bật làm trên cao (khách tắt được)
      const height = qty > 0 && job.heightWork && !cur.jobs.some((j) => j.id === job.id) ? true : cur.height;
      return { ...cur, jobs: next.slice(0, MAX_JOBS), height };
    });
  const jobsTotal = d.jobs.reduce((sum, j) => sum + (jobs.find((x) => x.id === j.id)?.price ?? 0) * j.qty, 0);
  const p = svc.pricing;
  const total = (p.baseFare || svc.fromPrice) + jobsTotal + (d.height ? p.heightFee : 0) + (d.ladder ? p.ladderFee : 0) + (d.urgent ? p.urgentFee : 0);
  const hasQuoteOnSite = d.jobs.some((j) => (jobs.find((x) => x.id === j.id)?.price ?? 1) === 0);
  const canSelect = !option.paused && (jobs.length === 0 || d.jobs.length > 0);

  const addPhotos = async (source: 'camera' | 'library') => {
    const uris = await pickPhotos(source, MAX_PHOTOS - d.photos.length);
    if (uris.length) setD((cur) => ({ ...cur, photos: [...cur.photos, ...uris.map((uri) => ({ uri }))].slice(0, MAX_PHOTOS) }));
  };

  return (
    <BottomSheet visible={!!option} onClose={onClose} title={titleCase(option.name)} showClose scroll maxHeightRatio={0.92} contentStyle={styles.content}>
      <View style={{ gap: Spacing.sm }}>
        {option.description ? (
          <AppText size={13} color={Colors.textSecondary}>
            {option.description}
          </AppText>
        ) : null}

        {jobs.length ? (
          <>
            <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
              Chọn việc cần làm
            </AppText>
            <AppText size={12} color={Colors.textSecondary}>
              Giá là công thợ, chưa gồm vật tư. Việc "báo giá tại chỗ": thợ xem rồi chốt giá với bạn trước khi làm.
            </AppText>
            <View style={styles.jobs}>
              {jobs.map((job) => {
                const qty = qtyOf(job.id);
                const on = qty > 0;
                return (
                  <View key={job.id} style={[styles.job, on && styles.jobOn]}>
                    <Pressable style={{ flex: 1 }} onPress={() => setQty(job, on ? 0 : 1)} accessibilityLabel={`${job.name}${on ? ', đã chọn' : ''}`}>
                      <AppText size={14} weight={on ? 'bold' : 'medium'} color={on ? Colors.primary : Colors.text}>
                        {job.name}
                      </AppText>
                      <AppText size={12} color={Colors.textSecondary}>
                        {job.price ? `${formatVnd(job.price)}/${UNIT[job.unit] ?? job.unit}` : 'Báo giá tại chỗ'}
                        {job.materialsNote ? ` · ${job.materialsNote}` : ''}
                      </AppText>
                    </Pressable>
                    {on ? (
                      <View style={styles.stepper}>
                        <Pressable onPress={() => setQty(job, qty - 1)} style={styles.stepBtn} hitSlop={6} accessibilityLabel="Bớt">
                          <Icon name={'ion:remove' as never} size={16} color={Colors.primary} />
                        </Pressable>
                        <AppText size={14} weight="bold" style={{ minWidth: 20, textAlign: 'center' }}>
                          {qty}
                        </AppText>
                        <Pressable onPress={() => setQty(job, qty + 1)} style={styles.stepBtn} hitSlop={6} accessibilityLabel="Thêm">
                          <Icon name={'ion:add' as never} size={16} color={Colors.primary} />
                        </Pressable>
                      </View>
                    ) : (
                      <Icon name={'ion:add-circle-outline' as never} size={22} color={Colors.gray400} />
                    )}
                  </View>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
              Thông tin dịch vụ
            </AppText>
            {serviceInfoLines(svc).map((line, i) => (
              <AppText key={i} size={15} style={styles.line} color={line.startsWith('*') ? Colors.textSecondary : Colors.text}>
                {line}
              </AppText>
            ))}
          </>
        )}

        <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
          Ảnh hiện trạng ({d.photos.length}/{MAX_PHOTOS})
        </AppText>
        <AppText size={12} color={Colors.textSecondary}>
          Chụp chỗ hỏng, thiết bị, vị trí lắp — thợ xem trước, mang đúng đồ nghề.
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
          {d.photos.map((ph) => (
            <View key={ph.uri} style={styles.photo}>
              <Image source={{ uri: ph.uri }} style={styles.photoImg} />
              <Pressable style={styles.photoRemove} onPress={() => setD((cur) => ({ ...cur, photos: cur.photos.filter((x) => x.uri !== ph.uri) }))} hitSlop={6} accessibilityLabel="Bỏ ảnh">
                <Icon name={Icons.closeCircle} size={20} color={Colors.white} />
              </Pressable>
            </View>
          ))}
          {d.photos.length < MAX_PHOTOS ? (
            <>
              {Platform.OS !== 'web' ? (
                <Pressable style={styles.photoAdd} onPress={() => void addPhotos('camera')} accessibilityLabel="Chụp ảnh">
                  <Icon name={Icons.camera} size={22} color={Colors.primary} />
                  <AppText size={11} color={Colors.primary}>
                    Chụp
                  </AppText>
                </Pressable>
              ) : null}
              <Pressable style={styles.photoAdd} onPress={() => void addPhotos('library')} accessibilityLabel="Chọn ảnh">
                <Icon name={Icons.image} size={22} color={Colors.primary} />
                <AppText size={11} color={Colors.primary}>
                  Thư viện
                </AppText>
              </Pressable>
            </>
          ) : null}
        </ScrollView>

        <AppText size={13} weight="semiBold" color={Colors.primary} style={styles.section}>
          Điều kiện làm việc
        </AppText>
        <SwitchRow
          icon={'mci:ladder' as never}
          label="Cần leo trèo / làm trên cao"
          sublabel={p.heightFee ? `Trần cao, bồn nước, mái… · phụ phí ${formatVnd(p.heightFee)}` : 'Trần cao, bồn nước, mái…'}
          value={d.height}
          onValueChange={(v) => setD((cur) => ({ ...cur, height: v }))}
        />
        <SwitchRow
          icon={'mci:ladder' as never}
          label="Thợ mang thang theo"
          sublabel={p.ladderFee ? `Nhà không có thang · phụ phí ${formatVnd(p.ladderFee)}` : 'Nhà không có thang'}
          value={d.ladder}
          onValueChange={(v) => setD((cur) => ({ ...cur, ladder: v }))}
        />
        <TextField label="Tầng / vị trí" value={d.floor} onChangeText={(v) => setD((cur) => ({ ...cur, floor: v }))} placeholder="Vd: tầng 3, không thang máy, phòng ngủ" maxLength={100} />
        <TextField
          label="Mô tả sự cố"
          value={d.issueNote}
          onChangeText={(v) => setD((cur) => ({ ...cur, issueNote: v }))}
          placeholder="Vd: bóng đèn phòng khách chớp tắt, quạt trần kêu to..."
          multiline
          numberOfLines={3}
          maxLength={500}
        />
        <SwitchRow
          icon={Icons.alert}
          label="Cần gấp"
          sublabel={p.urgentFee ? `Ưu tiên thợ đến sớm nhất · phụ phí ${formatVnd(p.urgentFee)}` : 'Ưu tiên thợ đến sớm nhất'}
          value={d.urgent}
          onValueChange={(v) => setD((cur) => ({ ...cur, urgent: v }))}
        />

        <View style={styles.totalRow}>
          <View style={{ flex: 1 }}>
            <AppText size={13} color={Colors.textSecondary}>
              Tạm tính (phí di chuyển & khảo sát {formatVnd(p.baseFare || svc.fromPrice)} + công thợ)
            </AppText>
            {hasQuoteOnSite ? (
              <AppText size={12} color={Colors.textSecondary}>
                Có việc báo giá tại chỗ — tiền công phần đó chốt với thợ
              </AppText>
            ) : null}
          </View>
          <AppText size={18} weight="extraBold" color={Colors.primary}>
            ~{formatVnd(total)}
          </AppText>
        </View>
        <Button title={option.paused ? 'Dịch vụ đang tạm ngưng' : jobs.length && !d.jobs.length ? 'Chọn ít nhất một việc' : 'Chọn'} disabled={!canSelect} onPress={() => onSelect(option, d)} />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.xl },
  section: { marginTop: Spacing.sm },
  line: { lineHeight: 24 },
  jobs: { gap: Spacing.sm },
  job: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  jobOn: { borderColor: Colors.primary, backgroundColor: Colors.primaryTint },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  photos: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  photo: { width: 76, height: 76 },
  photoImg: { width: 76, height: 76, borderRadius: BorderRadius.md },
  photoRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.error, borderRadius: 12 },
  photoAdd: { width: 76, height: 76, borderRadius: BorderRadius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: Colors.primaryBg },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
});

export default HandymanJobDialog;
