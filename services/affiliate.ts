// services/affiliate.ts — Cộng đồng (giới thiệu nhiều tầng) của khách: GET /v1/customer/affiliate (mã của tôi, cấp,
// số F1/F2/F3, người giới thiệu, thưởng tạm tính / đã nhận, chính sách), thành viên theo tầng, thưởng theo đơn,
// xem trước + nhập mã người giới thiệu.
import { createStore } from '@/services/store';
import { api, onSessionChange, type ZuumResponse } from '@/services/zuum';

export type AffiliateSummary = ZuumResponse<'GET /v1/customer/affiliate'>;
/** Đã là thành viên (có mã, cấp, số liệu) */
export type AffiliateMember = Extract<AffiliateSummary, { code: string }>;
export type AffiliateMemberItem = ZuumResponse<'GET /v1/customer/affiliate/members'>['items'][number];
export type AffiliateEarning = ZuumResponse<'GET /v1/customer/affiliate/earnings'>['items'][number];
export type ReferrerPreview = ZuumResponse<'GET /v1/customer/affiliate/referrer-preview'>;

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

/** "1%" từ basis point */
export function bpsLabel(bps: number): string {
  const pct = bps / 100;
  return `${Number.isInteger(pct) ? pct : pct.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`;
}

export const EARNING_STATUS_LABEL: Record<AffiliateEarning['status'], string> = {
  accrued: 'Tạm tính',
  paid: 'Đã nhận',
  forfeited: 'Không đủ điều kiện',
};

onSessionChange((event) => {
  if (event !== 'login') store.set(null);
});
