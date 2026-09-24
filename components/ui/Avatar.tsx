// Avatar — ảnh tròn hoặc chữ cái đầu trên nền lavender (Figma User Avatar)
import React from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, Icons } from './Icon';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  onPress?: () => void;
  /** hiện huy hiệu camera góc dưới phải (màn chỉnh sửa hồ sơ) */
  editable?: boolean;
  bordered?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({ uri, name, size = 44, onPress, editable, bordered }) => {
  const initial = (name ?? '').trim().charAt(0).toUpperCase();
  const body = (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image source={{ uri }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }, bordered && styles.bordered]} />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }, bordered && styles.bordered]}>
          {initial ? (
            <AppText weight="bold" size={size * 0.42} color={Colors.primary}>
              {initial}
            </AppText>
          ) : (
            <Icon name={Icons.profileFilled} size={size * 0.55} color={Colors.secondary} />
          )}
        </View>
      )}
      {editable ? (
        <View style={[styles.camBadge, { width: size * 0.34, height: size * 0.34, borderRadius: size * 0.17 }]}>
          <Icon name={Icons.camera} size={size * 0.18} color={Colors.white} />
        </View>
      ) : null}
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{body}</Pressable>;
  return body;
};

const styles = StyleSheet.create({
  img: { backgroundColor: Colors.gray200 },
  fallback: { backgroundColor: '#EFE7F5', alignItems: 'center', justifyContent: 'center' },
  bordered: { borderWidth: 2, borderColor: Colors.white },
  camBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
});

export default Avatar;
