// Icon — wrapper thống nhất cho bộ icon (Ionicons / MaterialCommunityIcons / Feather)
import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

type IonName = React.ComponentProps<typeof Ionicons>['name'];
type MciName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type FeatherName = React.ComponentProps<typeof Feather>['name'];

/** Glyph tự vẽ của ZuumViet (không có trong bộ icon chuẩn) */
type ZvName = 'delivery-bike';

export type IconName =
  | `ion:${IonName}`
  | `mci:${MciName}`
  | `feather:${FeatherName}`
  | `zv:${ZvName}`;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: React.ComponentProps<typeof Ionicons>['style'];
}

/** Xe máy giao hàng: moped + thùng hàng gắn phía sau (trên yên sau) */
const DeliveryBike: React.FC<{ size: number; color: string; style?: IconProps['style'] }> = ({ size, color, style }) => {
  const border = Math.max(1, Math.round(size * 0.045));
  const lid = Math.max(1, Math.round(size * 0.04));
  const boxH = size * 0.34;
  return (
    <View style={[{ width: size, height: size }, style as unknown as StyleProp<ViewStyle>]}>
      <MaterialCommunityIcons name="moped" size={size} color={color} />
      {/* thùng hàng đặt trên yên sau (phía trái glyph moped) */}
      <View
        style={[
          zvStyles.box,
          {
            left: size * 0.01,
            top: size * 0.12,
            width: size * 0.42,
            height: boxH,
            borderRadius: size * 0.06,
            borderWidth: border,
            backgroundColor: color,
          },
        ]}
      >
        <View style={[zvStyles.lid, { top: boxH * 0.3, height: lid }]} />
      </View>
    </View>
  );
};

const zvStyles = StyleSheet.create({
  box: { position: 'absolute', borderColor: Colors.white, overflow: 'hidden' },
  lid: { position: 'absolute', left: 0, right: 0, backgroundColor: Colors.white, opacity: 0.9 },
});

export const Icon: React.FC<IconProps> = ({ name, size = 22, color = Colors.text, style }) => {
  const idx = name.indexOf(':');
  const set = name.slice(0, idx);
  const glyph = name.slice(idx + 1);
  if (set === 'zv') {
    return <DeliveryBike size={size} color={color} style={style} />;
  }
  if (set === 'mci') {
    return <MaterialCommunityIcons name={glyph as MciName} size={size} color={color} style={style} />;
  }
  if (set === 'feather') {
    return <Feather name={glyph as FeatherName} size={size} color={color} style={style} />;
  }
  return <Ionicons name={glyph as IonName} size={size} color={color} style={style} />;
};

/** Tên icon dùng lại nhiều nơi (theo Figma UI Core > Icons) */
export const Icons = {
  back: 'ion:chevron-back' as IconName,
  backArrow: 'ion:arrow-back' as IconName,
  close: 'ion:close' as IconName,
  more: 'ion:ellipsis-horizontal' as IconName,
  chevronRight: 'ion:chevron-forward' as IconName,
  chevronDown: 'ion:chevron-down' as IconName,
  info: 'ion:information-circle' as IconName,
  infoOutline: 'ion:information-circle-outline' as IconName,
  phone: 'ion:call-outline' as IconName,
  chat: 'ion:chatbubble-ellipses-outline' as IconName,
  camera: 'ion:camera' as IconName,
  image: 'ion:image-outline' as IconName,
  search: 'ion:search' as IconName,
  bell: 'ion:notifications-outline' as IconName,
  trash: 'ion:trash-outline' as IconName,
  edit: 'ion:create-outline' as IconName,
  check: 'ion:checkmark' as IconName,
  checkCircle: 'ion:checkmark-circle' as IconName,
  closeCircle: 'ion:close-circle' as IconName,
  alert: 'ion:alert-circle' as IconName,
  star: 'ion:star' as IconName,
  starOutline: 'ion:star-outline' as IconName,
  heart: 'ion:heart' as IconName,
  heartOutline: 'ion:heart-outline' as IconName,
  block: 'mci:cancel' as IconName,
  home: 'ion:home-outline' as IconName,
  homeFilled: 'ion:home' as IconName,
  activity: 'ion:shuffle-outline' as IconName,
  community: 'mci:graph-outline' as IconName,
  inbox: 'ion:file-tray-outline' as IconName,
  profile: 'ion:person-outline' as IconName,
  profileFilled: 'ion:person' as IconName,
  wallet: 'ion:wallet-outline' as IconName,
  walletFilled: 'ion:wallet' as IconName,
  cash: 'ion:cash-outline' as IconName,
  ticket: 'ion:ticket-outline' as IconName,
  calendar: 'ion:calendar-outline' as IconName,
  clock: 'ion:time-outline' as IconName,
  note: 'ion:document-text-outline' as IconName,
  location: 'ion:location-outline' as IconName,
  locationFilled: 'ion:location' as IconName,
  map: 'ion:map-outline' as IconName,
  paste: 'ion:clipboard-outline' as IconName,
  sparkles: 'ion:sparkles-outline' as IconName,
  navigate: 'ion:navigate' as IconName,
  locate: 'ion:locate' as IconName,
  bookmark: 'ion:bookmark-outline' as IconName,
  bookmarkFilled: 'ion:bookmark' as IconName,
  homeAddr: 'ion:home-outline' as IconName,
  office: 'ion:business-outline' as IconName,
  contacts: 'ion:book-outline' as IconName,
  lock: 'ion:lock-closed-outline' as IconName,
  shield: 'ion:shield-checkmark-outline' as IconName,
  headset: 'ion:headset-outline' as IconName,
  doc: 'ion:document-outline' as IconName,
  car: 'ion:car-outline' as IconName,
  scooter: 'mci:moped' as IconName,
  deliveryBike: 'zv:delivery-bike' as IconName,
  truck: 'mci:truck-outline' as IconName,
  van: 'mci:van-utility' as IconName,
  box: 'mci:package-variant-closed' as IconName,
  handHold: 'mci:hand-back-right-outline' as IconName,
  thumbUp: 'mci:thumb-up-outline' as IconName,
  network: 'mci:graph-outline' as IconName,
  chart: 'mci:chart-bar' as IconName,
  qr: 'ion:qr-code-outline' as IconName,
  addPerson: 'ion:person-add-outline' as IconName,
  share: 'ion:share-social-outline' as IconName,
  filter: 'ion:funnel-outline' as IconName,
  menu: 'ion:menu' as IconName,
  plusCircle: 'ion:add-circle' as IconName,
  minusCircle: 'ion:remove-circle' as IconName,
  refresh: 'ion:refresh' as IconName,
  swap: 'ion:swap-horizontal' as IconName,
  flash: 'ion:flash-outline' as IconName,
  flashOff: 'ion:flash-off-outline' as IconName,
  logout: 'ion:log-out-outline' as IconName,
  arrowRight: 'ion:arrow-forward' as IconName,
  arrowLeft: 'ion:arrow-back' as IconName,
  caretDown: 'ion:caret-down' as IconName,
  moon: 'ion:moon' as IconName,
  eye: 'ion:eye-outline' as IconName,
  eyeOff: 'ion:eye-off-outline' as IconName,
  motorbike: 'mci:motorbike' as IconName,
  carSeat: 'mci:car-estate' as IconName,
  carSide: 'mci:car-side' as IconName,
  vanPassenger: 'mci:van-passenger' as IconName,
  hardHat: 'mci:account-hard-hat' as IconName,
  luxuryCar: 'mci:car-limousine' as IconName,
  steering: 'mci:steering' as IconName,
  tools: 'mci:tools' as IconName,
};

export default Icon;
