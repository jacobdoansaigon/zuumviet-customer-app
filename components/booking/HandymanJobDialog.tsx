// HandymanJobDialog — Gọi thợ: bấm MỘT loại thợ mở "Chi tiết công việc" TRƯỚC khi chọn (anh Jacob 2026-10-13), gọn lại
// 16/10/2026 ("nhiều chữ quá — cộng từng việc vào theo ô fill"):
//   1. việc cần làm: lưới ô 2 cột (tên + giá công); chạm ô = cộng việc → ô tô tím, có "− n +" ngay trong ô
//   2. ảnh hiện trạng (tối đa 5, chụp / thư viện) — tải lên kho lúc đặt đơn
//   3. điều kiện: chip bật / tắt kèm phụ phí (leo trèo, thợ mang thang, cần gấp) · tầng / vị trí · mô tả sự cố
//   Tạm tính + nút ở đáy cố định. Bấm "Xác nhận" khi chưa chọn việc (`requireJobs`) → mở sheet với dòng nhắc chọn ít nhất
//   1 việc; chọn xong "Tiếp tục" đi thẳng sang màn xác nhận.
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Image, ScrollView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, BottomSheet, Button, Icon, Icons, TextField } from '@/components/ui';
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
  /** mở từ nút "Xác nhận" khi chưa chọn việc → hiện dòng nhắc, nút là "Tiếp tục" */
  requireJobs?: boolean;
  onClose: () => void;
  onSelect: (option: ServiceOptionView, detail: HandymanJobDetail) => void;
}

const titleCase = (s: string) => s.replace(/(^|\s)(\p{L})/gu, (m) => m.toUpperCase());
/** "đ80.000" → "80k" cho ô việc (gọn) */
const shortVnd = (v: number) => (v >= 1000 && v % 1000 === 0 ? `${v / 1000}k` : formatVnd(v));

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

export const HandymanJobDialog: React.FC<Props> = ({ option, initial, requireJobs = false, onClose, onSelect }) => {
  const [d, setD] = useState<HandymanJobDetail>(initial);
  /** bấm nút khi chưa chọn việc → nhắc */
  const [nudge, setNudge] = useState(false);
  // Sheet dùng lại cho nhiều loại thợ — mỗi lần mở loại khác phải nạp lại đúng lựa chọn của loại đó
  useEffect(() => {
    if (option) {
      setD(initial);
      setNudge(false);
    }
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
  const base = p.baseFare || svc.fromPrice;
  const total = base + jobsTotal + (d.height ? p.heightFee : 0) + (d.ladder ? p.ladderFee : 0) + (d.urgent ? p.urgentFee : 0);
  const hasQuoteOnSite = d.jobs.some((j) => (jobs.find((x) => x.id === j.id)?.price ?? 1) === 0);
  const missingJobs = jobs.length > 0 && d.jobs.length === 0;
  const showHint = missingJobs && (requireJobs || nudge);

  const addPhotos = async (source: 'camera' | 'library') => {
    const uris = await pickPhotos(source, MAX_PHOTOS - d.photos.length);
    if (uris.length) setD((cur) => ({ ...cur, photos: [...cur.photos, ...uris.map((uri) => ({ uri }))].slice(0, MAX_PHOTOS) }));
  };
  const submit = () => {
    if (option.paused) return;
    if (missingJobs) {
      setNudge(true);
      return;
    }
    onSelect(option, d);
  };

  const conditions = [
    { key: 'height' as const, icon: 'mci:ladder', label: 'Leo trèo / trên cao', fee: p.heightFee },
    { key: 'ladder' as const, icon: 'mci:ladder', label: 'Thợ mang thang', fee: p.ladderFee },
    { key: 'urgent' as const, icon: 'ion:flash', label: 'Cần gấp', fee: p.urgentFee },
  ];

  const footer = (
    <View>
      <View style={styles.totalRow}>
        <View style={{ flex: 1 }}>
          <AppText size={13} weight="semiBold">
            Tạm tính
          </AppText>
          <AppText size={11} color={Colors.textSecondary} numberOfLines={1}>
            {hasQuoteOnSite ? 'Có việc báo giá tại chỗ — chốt với thợ' : `Gồm phí di chuyển & khảo sát ${formatVnd(base)}`}
          </AppText>
        </View>
        <AppText size={20} weight="extraBold" color={Colors.primary}>
          ~{formatVnd(total)}
        </AppText>
      </View>
      {nudge && missingJobs ? (
        <AppText size={12} weight="semiBold" color={Colors.error} align="center" style={{ marginBottom: 6 }}>
          Chọn ít nhất 1 việc ở trên để tiếp tục
        </AppText>
      ) : null}
      <Button title={option.paused ? 'Dịch vụ đang tạm ngưng' : requireJobs ? 'Tiếp tục' : 'Chọn'} disabled={option.paused} onPress={submit} />
    </View>
  );

  return (
    <BottomSheet visible={!!option} onClose={onClose} title={titleCase(option.name)} showClose scroll maxHeightRatio={0.92} contentStyle={styles.content} footer={footer}>
      {option.description ? (
        <AppText size={13} color={Colors.textSecondary}>
          {option.description}
        </AppText>
      ) : null}

      {showHint ? (
        <View style={styles.hint}>
          <Icon name={Icons.alert} size={18} color={Colors.error} />
          <AppText size={13} weight="semiBold" color={Colors.error} style={{ flex: 1, marginLeft: 6 }}>
            Vui lòng chọn ít nhất 1 việc để tiếp tục
          </AppText>
        </View>
      ) : null}

      {jobs.length ? (
        <>
          <View style={styles.sectionRow}>
            <AppText size={14} weight="bold">
              Việc cần làm
            </AppText>
            <AppText size={11} color={Colors.textMuted}>
              Giá công thợ, chưa gồm vật tư
            </AppText>
          </View>
          <View style={styles.grid}>
            {jobs.map((job) => {
              const qty = qtyOf(job.id);
              const on = qty > 0;
              const price = job.price ? `${shortVnd(job.price)}/${UNIT[job.unit] ?? job.unit}` : 'Báo giá tại chỗ';
              return (
                <Pressable
                  key={job.id}
                  style={[styles.tile, on && styles.tileOn, showHint && styles.tileNudge]}
                  onPress={() => (on ? undefined : setQty(job, 1))}
                  accessibilityLabel={on ? `${job.name}, đã chọn ${qty}` : `Chọn ${job.name}`}
                >
                  <AppText size={13} weight="bold" color={on ? Colors.white : Colors.text} numberOfLines={2} style={styles.tileName}>
                    {job.name}
                  </AppText>
                  <View style={styles.tileBottom}>
                    <AppText size={12} weight="semiBold" color={on ? Colors.white : Colors.primary} numberOfLines={1} style={{ flex: 1 }}>
                      {price}
                    </AppText>
                    {on ? (
                      <View style={styles.stepper}>
                        <Pressable onPress={() => setQty(job, qty - 1)} style={styles.stepBtn} hitSlop={6} accessibilityLabel="Bớt">
                          <Icon name={'ion:remove' as never} size={14} color={Colors.primary} />
                        </Pressable>
                        <AppText size={13} weight="bold" color={Colors.white} style={{ minWidth: 16, textAlign: 'center' }}>
                          {qty}
                        </AppText>
                        <Pressable onPress={() => setQty(job, qty + 1)} style={styles.stepBtn} hitSlop={6} accessibilityLabel="Thêm">
                          <Icon name={'ion:add' as never} size={14} color={Colors.primary} />
                        </Pressable>
                      </View>
                    ) : (
                      <View style={styles.addDot}>
                        <Icon name={'ion:add' as never} size={16} color={Colors.white} />
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : (
        <>
          <AppText size={14} weight="bold" style={styles.section}>
            Thông tin dịch vụ
          </AppText>
          {serviceInfoLines(svc).map((line, i) => (
            <AppText key={i} size={14} style={styles.line} color={line.startsWith('*') ? Colors.textSecondary : Colors.text}>
              {line}
            </AppText>
          ))}
        </>
      )}

      <View style={styles.sectionRow}>
        <AppText size={14} weight="bold">
          Ảnh hiện trạng
        </AppText>
        <AppText size={11} color={Colors.textMuted}>
          {d.photos.length}/{MAX_PHOTOS} · không bắt buộc
        </AppText>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
        {d.photos.length < MAX_PHOTOS ? (
          <>
            {Platform.OS !== 'web' ? (
              <Pressable style={styles.photoAdd} onPress={() => void addPhotos('camera')} accessibilityLabel="Chụp ảnh">
                <Icon name={Icons.camera} size={20} color={Colors.primary} />
              </Pressable>
            ) : null}
            <Pressable style={styles.photoAdd} onPress={() => void addPhotos('library')} accessibilityLabel="Chọn ảnh từ thư viện">
              <Icon name={Icons.image} size={20} color={Colors.primary} />
            </Pressable>
          </>
        ) : null}
        {d.photos.map((ph) => (
          <View key={ph.uri} style={styles.photo}>
            <Image source={{ uri: ph.uri }} style={styles.photoImg} />
            <Pressable style={styles.photoRemove} onPress={() => setD((cur) => ({ ...cur, photos: cur.photos.filter((x) => x.uri !== ph.uri) }))} hitSlop={6} accessibilityLabel="Bỏ ảnh">
              <Icon name={Icons.closeCircle} size={18} color={Colors.white} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <AppText size={14} weight="bold" style={styles.section}>
        Điều kiện
      </AppText>
      <View style={styles.chips}>
        {conditions.map((c) => {
          const on = d[c.key];
          return (
            <Pressable key={c.key} style={[styles.chip, on && styles.chipOn]} onPress={() => setD((cur) => ({ ...cur, [c.key]: !cur[c.key] }))} accessibilityLabel={`${c.label}${on ? ', đang bật' : ''}`}>
              <Icon name={c.icon as never} size={15} color={on ? Colors.white : Colors.primary} />
              <AppText size={12} weight="semiBold" color={on ? Colors.white : Colors.text} style={{ marginLeft: 4 }}>
                {c.label}
                {c.fee ? ` +${shortVnd(c.fee)}` : ''}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <TextField label="Tầng / vị trí" value={d.floor} onChangeText={(v) => setD((cur) => ({ ...cur, floor: v }))} placeholder="Vd: tầng 3, phòng ngủ" maxLength={100} containerStyle={styles.field} />
      <TextField
        label="Mô tả sự cố"
        value={d.issueNote}
        onChangeText={(v) => setD((cur) => ({ ...cur, issueNote: v }))}
        placeholder="Vd: đèn phòng khách chớp tắt"
        multiline
        numberOfLines={2}
        maxLength={500}
        containerStyle={styles.field}
      />
    </BottomSheet>
  );
};

const GAP = Spacing.sm;

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.md },
  section: { marginTop: Spacing.md, marginBottom: Spacing.xs },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: Spacing.md, marginBottom: Spacing.xs },
  line: { lineHeight: 22 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FDECEC',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: {
    width: `48.5%`,
    minHeight: 76,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'space-between',
  },
  tileOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tileNudge: { borderColor: Colors.error },
  tileName: { lineHeight: 17 },
  tileBottom: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  addDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  photos: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  photo: { width: 56, height: 56 },
  photoImg: { width: 56, height: 56, borderRadius: BorderRadius.md },
  photoRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: Colors.error, borderRadius: 10 },
  photoAdd: { width: 56, height: 56, borderRadius: BorderRadius.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryBg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  chipOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  field: { marginTop: Spacing.md },
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
});

export default HandymanJobDialog;
