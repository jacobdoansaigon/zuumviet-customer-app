// services/affiliate.ts — Cộng đồng (giới thiệu nhiều tầng) của khách: GET /v1/customer/affiliate (mã của tôi, cấp,
// số F1/F2/F3, người giới thiệu, tổng thưởng đã nhận + lần nhận gần nhất, các cấp), thành viên theo tầng, thưởng cộng
// đồng đã nhận theo TUẦN (GET /affiliate/earnings), xem trước + nhập mã người giới thiệu.
// App KHÔNG hiển thị tỷ lệ thưởng, điều kiện nhận, thưởng tạm tính hay ước tính thu nhập — chỉ số tiền đã nhận.
import { createStore } from '@/services/store';
import { api, onSessionChange, type ZuumResponse } from '@/services/zuum';

export type AffiliateSummary = ZuumResponse<'GET /v1/customer/affiliate'>;
/** Đã là thành viên (có mã, cấp, số liệu) */
export type AffiliateMember = Extract<AffiliateSummary, { code: string }>;
export type AffiliateMemberItem = ZuumResponse<'GET /v1/customer/affiliate/members'>['items'][number];
/** Một tuần đã nhận thưởng: { period '2026-W42', label 'Tuần 42/2026 (12/10–18/10)', amount, paidAt } */
export type AffiliateEarning = ZuumResponse<'GET /v1/customer/affiliate/earnings'>['items'][number];
export type ReferrerPreview = ZuumResponse<'GET /v1/customer/affiliate/referrer-preview'>;

/** Câu trung tính về thưởng cộng đồng (KHÔNG nêu tỷ lệ / điều kiện) — màn Thưởng cộng đồng, Ví, Ví thưởng */
export const COMMUNITY_REWARD_NOTE = 'Thưởng cộng đồng được cộng vào Ví thưởng mỗi sáng thứ Hai.';

export function isMember(a: AffiliateSummary | null): a is AffiliateMember {
  return !!a && 'code' in a;
}

const store = createStore<AffiliateSummary | null>(null);

export function useAffiliate(): AffiliateSummary | null {
  return store.use();
}

export async function loadAffiliate(): Promise<AffiliateSummary> {
  const a = await api('GET /v1/customer/affiliate');
  store.set(a);
  return a;
}

export function listMembers(depth: 1 | 2 | 3, page = 1, pageSize = 20) {
  return api('GET /v1/customer/affiliate/members', { query: { depth, page, pageSize } });
}

export function listEarnings(page = 1, pageSize = 20) {
  return api('GET /v1/customer/affiliate/earnings', { query: { page, pageSize } });
}

export function previewReferrer(code: string): Promise<ReferrerPreview> {
  return api('GET /v1/customer/affiliate/referrer-preview', { query: { code: code.trim().toUpperCase() } });
}

export async function setReferrer(code: string): Promise<AffiliateSummary> {
  const a = await api('POST /v1/customer/affiliate/referrer', { body: { code: code.trim().toUpperCase() } });
  store.set(a);
  return a;
}

/** Tổng thành viên 3 tầng */
export function totalMembers(a: AffiliateMember): number {
  return a.counts.f1 + a.counts.f2 + a.counts.f3;
}

onSessionChange((event) => {
  if (event !== 'login') store.set(null);
});
