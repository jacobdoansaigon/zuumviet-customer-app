// HomeHeader — header tím Home (Figma 3385-663): "Chào buổi tối, " regular + tên đậm 18 + avatar 32 phải
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Avatar } from '@/components/ui';

interface HomeHeaderProps {
  greeting: string;
  name: string;
  avatarUri?: string | null;
  onAvatarPress?: () => void;
  /** phần đệm dưới để card dịch vụ đè lên (Figma ~40) */
  overlap?: number;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ greeting, name, avatarUri, onAvatarPress, overlap = 40 }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + Spacing.md, paddingBottom: overlap + Spacing.lg }]}>
      <View style={styles.row}>
        <AppText size={18} color={Colors.white} numberOfLines={1} style={{ flex: 1 }}>
          {greeting},{' '}
          <AppText size={18} weight="bold" color={Colors.white}>
            {name}
          </AppText>
        </AppText>
        <Pressable onPress={onAvatarPress} hitSlop={8}>
          <Avatar uri={avatarUri} name={name} size={32} bordered />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.screen },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 40 },
});

export default HomeHeader;
