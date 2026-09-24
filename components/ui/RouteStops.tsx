// RouteStops — danh sách điểm lấy/giao theo Figma: chấm tròn tím (lấy) / pin Z (giao), nối bằng đường đứt
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText } from './Text';
import { Icon, Icons } from './Icon';

export interface RouteStop {
  title: string;
  subtitle?: string;
  status?: string;
  statusTone?: 'default' | 'success' | 'warning' | 'danger' | 'primary';
  type?: 'pickup' | 'dropoff';
  onRemove?: () => void;
}

interface RouteStopsProps {
  stops: RouteStop[];
  compact?: boolean;
  titleSize?: number;
}

const toneColor = (t?: RouteStop['statusTone']) =>
  t === 'success' ? Colors.green : t === 'warning' ? Colors.warning : t === 'danger' ? Colors.error : t === 'primary' ? Colors.primary : Colors.textSecondary;

export const StopMarker: React.FC<{ type?: 'pickup' | 'dropoff'; size?: number }> = ({ type = 'pickup', size = 18 }) => {
  if (type === 'dropoff') return <Icon name={Icons.locationFilled} size={size + 2} color={Colors.primary} />;
  return (
    <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.ringDot, { width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2 }]} />
    </View>
  );
};

export const RouteStops: React.FC<RouteStopsProps> = ({ stops, compact, titleSize = 15 }) => (
  <View>
    {stops.map((s, i) => {
      const type = s.type ?? (i === 0 ? 'pickup' : 'dropoff');
      const last = i === stops.length - 1;
      return (
        <View key={i} style={styles.row}>
          <View style={styles.markerCol}>
            <StopMarker type={type} />
            {!last ? <View style={styles.connector} /> : null}
          </View>
          <View style={[styles.body, !last && { paddingBottom: compact ? Spacing.sm : Spacing.md }]}>
            <View style={styles.titleRow}>
              <AppText weight="semiBold" size={titleSize} color={Colors.text} style={{ flexShrink: 1 }} numberOfLines={compact ? 1 : 2}>
                {s.title}
              </AppText>
              {s.status ? (
                <AppText size={12} weight="medium" color={toneColor(s.statusTone)} style={{ marginLeft: Spacing.sm }}>
                  {s.status}
                </AppText>
              ) : null}
              {s.onRemove ? (
                <Pressable onPress={s.onRemove} hitSlop={8} style={{ marginLeft: 'auto' }}>
                  <Icon name={Icons.close} size={18} color={Colors.text} />
                </Pressable>
              ) : null}
            </View>
            {s.subtitle ? (
              <AppText size={12} color={Colors.textSecondary} numberOfLines={compact ? 1 : 2} style={{ marginTop: 2 }}>
                {s.subtitle}
              </AppText>
            ) : null}
          </View>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  markerCol: { width: 26, alignItems: 'center', paddingTop: 2 },
  connector: { flex: 1, width: 1, borderLeftWidth: 1.5, borderColor: Colors.gray300, borderStyle: 'dashed', marginVertical: 3 },
  body: { flex: 1, paddingLeft: Spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  ring: { borderWidth: 2.5, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
  ringDot: { backgroundColor: Colors.primary },
});

export default RouteStops;
