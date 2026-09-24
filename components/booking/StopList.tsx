// StopList — lộ trình trên bottom sheet đặt hàng: người gửi → các người nhận (X để xoá) → link thêm điểm (Figma GH 1.1)
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Icon, Icons, StopMarker } from '@/components/ui';
import { isReceiverComplete, type Sender, type Receiver } from '@/services/bookingStore';

interface StopRowProps {
  type: 'pickup' | 'dropoff';
  title?: string;
  placeholder?: string;
  status?: string;
  subtitle?: string;
  connector?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}

const StopRow: React.FC<StopRowProps> = ({ type, title, placeholder, status, subtitle, connector, onPress, onRemove }) => (
  <Pressable onPress={onPress} style={styles.row} disabled={!onPress}>
    <View style={styles.markerCol}>
      <StopMarker type={type} size={18} />
      {connector ? <View style={styles.connector} /> : null}
    </View>
    <View style={[styles.body, connector && { paddingBottom: Spacing.md }]}>
      <View style={styles.titleRow}>
        {title ? (
          <AppText weight="bold" size={14} style={{ flexShrink: 1 }} numberOfLines={1}>
            {title}
          </AppText>
        ) : (
          <AppText weight="semiBold" size={15} color={Colors.primary}>
            {placeholder}
          </AppText>
        )}
        {title && status ? (
          <AppText size={12} color={Colors.textSecondary} style={{ marginLeft: Spacing.sm }}>
            {status}
          </AppText>
        ) : null}
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={10} style={{ marginLeft: 'auto', paddingLeft: Spacing.sm }} accessibilityLabel="Xoá điểm giao">
            <Icon name={Icons.close} size={18} color={Colors.text} />
          </Pressable>
        ) : null}
      </View>
      {subtitle ? (
        <AppText size={12} color={Colors.textSecondary} numberOfLines={2} style={{ marginTop: 2 }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  </Pressable>
);

interface StopListProps {
  sender: Sender;
  receivers: Receiver[];
  onPressSender: () => void;
  onPressReceiver: (index: number) => void;
  onRemoveReceiver: (index: number) => void;
  onAddReceiver: () => void;
}

export const StopList: React.FC<StopListProps> = ({ sender, receivers, onPressSender, onPressReceiver, onRemoveReceiver, onAddReceiver }) => {
  const complete = receivers.map((r, index) => ({ r, index })).filter((x) => isReceiverComplete(x.r));
  const senderTitle = sender.name && sender.phone ? `${sender.name} - ${sender.phone}` : undefined;
  return (
    <View style={styles.wrap}>
      <StopRow
        type="pickup"
        title={senderTitle}
        placeholder="Nhập thông tin người gửi"
        status="Đang lấy hàng"
        subtitle={sender.place?.address}
        connector
        onPress={onPressSender}
      />
      {complete.map(({ r, index }) => (
        <StopRow
          key={r.id}
          type="dropoff"
          title={`${r.name} - ${r.phone}`}
          status="Đang lấy hàng"
          subtitle={r.place?.address}
          connector
          onPress={() => onPressReceiver(index)}
          onRemove={() => onRemoveReceiver(index)}
        />
      ))}
      <StopRow type="dropoff" placeholder={complete.length ? '+ Thêm địa điểm gửi hàng' : 'Nhập điểm gửi hàng'} onPress={onAddReceiver} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.screen, paddingVertical: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'stretch', minHeight: 40 },
  markerCol: { width: 26, alignItems: 'center', paddingTop: 2 },
  connector: { flex: 1, width: 1, borderLeftWidth: 1.5, borderColor: Colors.gray300, borderStyle: 'dashed', marginVertical: 3 },
  body: { flex: 1, paddingLeft: Spacing.sm, paddingTop: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
});

export default StopList;
