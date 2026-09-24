// StopList — lộ trình trên bottom sheet đặt hàng: người gửi/điểm đón → các điểm đến (X để xoá) → link thêm điểm (Figma GH 1.1)
// Nhãn theo loại dịch vụ (labels) — giao hàng / chở khách / gọi thợ (maxStops = 0: chỉ có 1 địa điểm)
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { AppText, Icon, Icons, StopMarker } from '@/components/ui';
import { DELIVERY_LABELS, type ServiceLabels } from '@/constants/mockBooking';
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
          <Pressable onPress={onRemove} hitSlop={10} style={{ marginLeft: 'auto', paddingLeft: Spacing.sm }} accessibilityLabel="Xoá điểm">
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
  labels?: ServiceLabels;
  /** số điểm đến tối đa; 0 = không có điểm đến (dịch vụ tận nơi) */
  maxStops?: number;
}

export const StopList: React.FC<StopListProps> = ({
  sender,
  receivers,
  onPressSender,
  onPressReceiver,
  onRemoveReceiver,
  onAddReceiver,
  labels = DELIVERY_LABELS,
  maxStops = 10,
}) => {
  const complete = receivers.map((r, index) => ({ r, index })).filter((x) => isReceiverComplete(x.r));
  const senderTitle = sender.name && sender.phone ? `${sender.name} - ${sender.phone}` : undefined;
  const canAdd = maxStops > 0 && complete.length < maxStops;
  return (
    <View style={styles.wrap}>
      <StopRow
        type="pickup"
        title={senderTitle}
        placeholder={labels.senderPlaceholder}
        status={labels.senderStatus}
        subtitle={sender.place?.address}
        connector={maxStops > 0}
        onPress={onPressSender}
      />
      {complete.map(({ r, index }, i) => (
        <StopRow
          key={r.id}
          type="dropoff"
          // Chở khách (1 điểm đến): hiện tên địa điểm; giao hàng: tên - SĐT người nhận
          title={maxStops === 1 ? r.place?.title || r.place?.address || labels.receiverStatus : r.name && r.phone ? `${r.name} - ${r.phone}` : r.place?.title || labels.receiverStatus}
          status={labels.receiverStatus}
          subtitle={r.place?.address}
          connector={canAdd || i < complete.length - 1}
          onPress={() => onPressReceiver(index)}
          onRemove={() => onRemoveReceiver(index)}
        />
      ))}
      {canAdd ? <StopRow type="dropoff" placeholder={complete.length ? labels.receiverAddPlaceholder : labels.receiverPlaceholder} onPress={onAddReceiver} /> : null}
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
