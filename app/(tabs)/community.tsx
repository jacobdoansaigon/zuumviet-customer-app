// Community screen — Cộng đồng
// Design: Figma [Driver] Cộng đồng

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '@/constants/theme';

type Post = {
  id: string;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  tag?: string;
};

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: 'ZuumViet Official',
    avatar: '🏢',
    content: 'Thông báo: Chương trình thưởng tháng 9 đã bắt đầu! Hoàn thành 50 đơn trong tháng để nhận thưởng 500.000đ.',
    likes: 234,
    comments: 45,
    time: '2 giờ trước',
    tag: 'Thông báo',
  },
  {
    id: '2',
    author: 'Nguyễn Văn B',
    avatar: '🧑',
    content: 'Khu vực quận 1-3 đang đông đơn lắm anh em ơi, cứ lao vào là có đơn ngay 💪',
    likes: 89,
    comments: 23,
    time: '3 giờ trước',
    tag: 'Chia sẻ',
  },
  {
    id: '3',
    author: 'Trần Thị C',
    avatar: '👩',
    content: 'Hỏi anh em: có ai biết chỗ đỗ xe gần chợ Bến Thành không? Bị phạt mấy lần rồi 😅',
    likes: 12,
    comments: 67,
    time: '5 giờ trước',
    tag: 'Hỏi đáp',
  },
];

const TAG_COLOR: Record<string, string> = {
  'Thông báo': Colors.primary,
  'Chia sẻ': Colors.success,
  'Hỏi đáp': Colors.warning,
};

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cộng đồng</Text>
        <TouchableOpacity style={styles.writeBtn}>
          <Text style={styles.writeBtnText}>✏️ Viết bài</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Category filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {['Tất cả', 'Thông báo', 'Chia sẻ', 'Hỏi đáp', 'Kết bạn'].map((cat) => (
            <TouchableOpacity key={cat} style={[styles.filterBtn, cat === 'Tất cả' && styles.filterBtnActive]}>
              <Text style={[styles.filterLabel, cat === 'Tất cả' && styles.filterLabelActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Posts */}
        {MOCK_POSTS.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9}>
      {/* Author */}
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{post.avatar}</Text>
        </View>
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author}</Text>
          <Text style={styles.postTime}>{post.time}</Text>
        </View>
        {post.tag && (
          <View style={[styles.tag, { backgroundColor: (TAG_COLOR[post.tag] ?? Colors.gray500) + '20' }]}>
            <Text style={[styles.tagText, { color: TAG_COLOR[post.tag] ?? Colors.gray500 }]}>
              {post.tag}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action}>
          <Text>❤️</Text>
          <Text style={styles.actionCount}>{post.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Text>💬</Text>
          <Text style={styles.actionCount}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Text>↗️</Text>
          <Text style={styles.actionCount}>Chia sẻ</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text,
  },
  writeBtn: {
    backgroundColor: Colors.primaryBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  writeBtnText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary,
    fontWeight: Typography.fontWeight.medium,
  },

  filters: {
    paddingBottom: Spacing.sm,
  },
  filterBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    backgroundColor: Colors.gray100,
  },
  filterBtnActive: {
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  filterLabelActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeight.bold,
  },

  content: {
    padding: Spacing['2xl'],
    gap: Spacing.md,
    paddingBottom: Spacing['3xl'],
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.base,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  authorInfo: { flex: 1 },
  authorName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text,
  },
  postTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semiBold,
  },

  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
