// NewsCard — thẻ tin tức dọc (Figma Home 3385-663): ảnh 16:9 bo 8, tiêu đề bold 16, mô tả 13 xám 2 dòng
import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Image } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon } from '@/components/ui';
import type { NewsItem } from '@/constants/mock';

interface NewsCardProps {
  item: NewsItem;
  onPress?: () => void;
}

export const NewsCard: React.FC<NewsCardProps> = ({ item, onPress }) => {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}>
      <View style={styles.imageWrap}>
        {!failed ? (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" onError={() => setFailed(true)} />
        ) : (
          <View style={[styles.image, styles.fallback]}>
            <Icon name="ion:newspaper-outline" size={36} color={Colors.primarySoft} />
          </View>
        )}
      </View>
      <AppText weight="bold" size={16} color={Colors.text} numberOfLines={2} style={styles.title}>
        {item.title}
      </AppText>
      <AppText size={13} color={Colors.textSecondary} numberOfLines={2} style={styles.excerpt}>
        {item.excerpt}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: Spacing.lg },
  imageWrap: { borderRadius: BorderRadius.md, overflow: 'hidden', backgroundColor: Colors.primaryBg },
  image: { width: '100%', aspectRatio: 16 / 9 },
  fallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryBg },
  title: { marginTop: Spacing.md, lineHeight: 22 },
  excerpt: { marginTop: Spacing.xs, lineHeight: 18 },
});

export default NewsCard;
