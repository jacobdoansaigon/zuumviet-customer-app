// communityStore — state mock Cộng đồng: đã tham gia hay chưa, danh sách thành viên
import { MOCK_COMMUNITY, type CommunityMember } from '@/constants/mock';
import { createStore } from './store';

export type CommunityState = {
  joined: boolean;
  members: CommunityMember[];
};

export const communityStore = createStore<CommunityState>({
  joined: false,
  members: MOCK_COMMUNITY.members,
});

export const communityActions = {
  join() {
    communityStore.set((s) => ({ ...s, joined: true }));
  },
  leave() {
    communityStore.set((s) => ({ ...s, joined: false }));
  },
  /** demo: xoá hết thành viên để xem empty state */
  clearMembers() {
    communityStore.set((s) => ({ ...s, members: [] }));
  },
  resetMembers() {
    communityStore.set((s) => ({ ...s, members: MOCK_COMMUNITY.members }));
  },
};

export function useCommunity() {
  return communityStore.use();
}

/** Kiểm tra mã giới thiệu (mock) */
export function isValidJoinCode(code: string) {
  return MOCK_COMMUNITY.validJoinCodes.includes(code);
}
