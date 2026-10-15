// VehicleTopIcon — xe nhìn từ trên xuống cho icon tài xế trên bản đồ (màn đang tìm): đầu xe hướng LÊN (bắc), bên ngoài
// xoay theo hướng chạy (heading) để xe nằm dọc làn đường như Grab. Màu thương hiệu: thân tím, kính tím nhạt, đèn vàng;
// viền trắng để nổi trên nền bản đồ. Vẽ bằng react-native-svg (không qua XML) vì vị trí cập nhật vài lần mỗi giây.
import React from 'react';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

export type VehicleTopKind = 'moto' | 'moto-box' | 'car' | 'van' | 'truck' | 'bus';

const I = '#59267C';
const I_DARK = '#461E63';
const I_LIGHT = '#7E37AF';
const D = '#2B113D';
const S = '#DEC3F0';
const Y = '#F0B341';
const R = '#D24847';
const W = '#FFFFFF';

/** kích thước gốc (viewBox) theo loại xe — rộng × dài */
export const VEHICLE_TOP_BOX: Record<VehicleTopKind, [number, number]> = {
  moto: [20, 40],
  'moto-box': [20, 42],
  car: [26, 50],
  van: [28, 58],
  truck: [30, 66],
  bus: [30, 80],
};

/** chiều dài hiển thị (px) trên bản đồ theo loại xe */
export const VEHICLE_TOP_LENGTH: Record<VehicleTopKind, number> = {
  moto: 32,
  'moto-box': 34,
  car: 38,
  van: 42,
  truck: 46,
  bus: 54,
};

const Moto: React.FC<{ box: boolean }> = ({ box }) => (
  <>
    {/* bánh trước / sau */}
    <Rect x={8.4} y={1.5} width={3.2} height={8} rx={1.6} fill={D} stroke={W} strokeWidth={1} />
    <Rect x={8.4} y={box ? 32.5 : 30.5} width={3.2} height={8} rx={1.6} fill={D} stroke={W} strokeWidth={1} />
    {/* thân xe */}
    <Rect x={6.3} y={7} width={7.4} height={box ? 27 : 25} rx={3.7} fill={I} stroke={W} strokeWidth={1.2} />
    {box ? <Rect x={3.8} y={27} width={12.4} height={11} rx={1.8} fill={I_DARK} stroke={W} strokeWidth={1.1} /> : null}
    {box ? <Rect x={3.8} y={31.6} width={12.4} height={1.6} fill={Y} /> : null}
    {/* tay lái + đèn */}
    <Rect x={3.6} y={10.4} width={12.8} height={1.6} rx={0.8} fill={D} />
    <Circle cx={3.6} cy={11.2} r={1.1} fill={D} />
    <Circle cx={16.4} cy={11.2} r={1.1} fill={D} />
    <Circle cx={10} cy={7.2} r={1.6} fill={Y} />
    {/* người lái: vai (áo tím) + mũ bảo hiểm */}
    <Ellipse cx={10} cy={19} rx={7.6} ry={5} fill={I_LIGHT} stroke={W} strokeWidth={1.1} />
    <Circle cx={10} cy={17.4} r={4.4} fill={I} stroke={W} strokeWidth={1} />
    <Path d="M7.6 15.6 Q10 13.6 12.4 15.6" stroke={S} strokeWidth={1.3} strokeLinecap="round" fill="none" />
  </>
);

const Car: React.FC = () => (
  <>
    {/* gương chiếu hậu */}
    <Rect x={0.6} y={15} width={4} height={2.6} rx={1.3} fill={I} stroke={W} strokeWidth={0.8} />
    <Rect x={21.4} y={15} width={4} height={2.6} rx={1.3} fill={I} stroke={W} strokeWidth={0.8} />
    <Rect x={2.5} y={1.5} width={21} height={47} rx={8.5} fill={I} stroke={W} strokeWidth={1.4} />
    {/* kính trước, nóc, kính sau */}
    <Path d="M6 15.5 Q13 12 20 15.5 L18.6 21.5 Q13 20 7.4 21.5 Z" fill={S} />
    <Rect x={7.2} y={22.5} width={11.6} height={13} rx={2.6} fill={I_DARK} />
    <Path d="M7.4 37 Q13 38.2 18.6 37 L19.6 41.5 Q13 43.2 6.4 41.5 Z" fill={S} />
    {/* đèn pha / đèn hậu */}
    <Rect x={5} y={3.2} width={4.4} height={2} rx={1} fill={Y} />
    <Rect x={16.6} y={3.2} width={4.4} height={2} rx={1} fill={Y} />
    <Rect x={5} y={45} width={4} height={1.8} rx={0.9} fill={R} />
    <Rect x={17} y={45} width={4} height={1.8} rx={0.9} fill={R} />
  </>
);

const Van: React.FC = () => (
  <>
    <Rect x={0.8} y={13} width={4} height={2.6} rx={1.3} fill={I} stroke={W} strokeWidth={0.8} />
    <Rect x={23.2} y={13} width={4} height={2.6} rx={1.3} fill={I} stroke={W} strokeWidth={0.8} />
    <Rect x={2.6} y={1.5} width={22.8} height={55} rx={6} fill={I} stroke={W} strokeWidth={1.4} />
    <Path d="M6 11 Q14 8.5 22 11 L21 16.5 Q14 15.2 7 16.5 Z" fill={S} />
    <Rect x={6.4} y={18} width={15.2} height={33} rx={2.4} fill={I_DARK} />
    <Rect x={6.4} y={33} width={15.2} height={1.6} fill={Y} />
    <Rect x={5.4} y={3} width={4.4} height={2} rx={1} fill={Y} />
    <Rect x={18.2} y={3} width={4.4} height={2} rx={1} fill={Y} />
    <Rect x={5.4} y={53} width={4} height={1.8} rx={0.9} fill={R} />
    <Rect x={18.6} y={53} width={4} height={1.8} rx={0.9} fill={R} />
  </>
);

const Truck: React.FC = () => (
  <>
    {/* thùng hàng (phía sau) */}
    <Rect x={2} y={17} width={26} height={47.5} rx={2.4} fill={S} stroke={W} strokeWidth={1.4} />
    <Rect x={3.6} y={18.6} width={22.8} height={44.3} rx={1.6} fill="none" stroke={I} strokeWidth={1.4} />
    <Rect x={3.6} y={38} width={22.8} height={2} fill={Y} />
    {/* cabin */}
    <Rect x={0.8} y={9} width={3.6} height={2.6} rx={1.3} fill={I} stroke={W} strokeWidth={0.8} />
    <Rect x={25.6} y={9} width={3.6} height={2.6} rx={1.3} fill={I} stroke={W} strokeWidth={0.8} />
    <Rect x={3.5} y={1.5} width={23} height={15} rx={4.5} fill={I} stroke={W} strokeWidth={1.4} />
    <Path d="M6.6 6.5 Q15 4.5 23.4 6.5 L22.6 10.5 Q15 9.5 7.4 10.5 Z" fill={S} />
    <Rect x={6} y={2.8} width={4.2} height={1.8} rx={0.9} fill={Y} />
    <Rect x={19.8} y={2.8} width={4.2} height={1.8} rx={0.9} fill={Y} />
  </>
);

const Bus: React.FC = () => (
  <>
    <Rect x={0.6} y={8} width={3.6} height={2.6} rx={1.3} fill={I} stroke={W} strokeWidth={0.8} />
    <Rect x={25.8} y={8} width={3.6} height={2.6} rx={1.3} fill={I} stroke={W} strokeWidth={0.8} />
    <Rect x={2.5} y={1.5} width={25} height={77} rx={5} fill={I} stroke={W} strokeWidth={1.4} />
    <Path d="M5.5 6 Q15 4 24.5 6 L24 11.5 Q15 10.5 6 11.5 Z" fill={S} />
    <Rect x={6} y={14} width={18} height={60} rx={2.4} fill={I_DARK} />
    <Rect x={6} y={30} width={18} height={1.8} fill={Y} />
    <Rect x={9} y={50} width={12} height={8} rx={1.2} fill={S} opacity={0.55} />
    <Rect x={5} y={2.8} width={4.4} height={1.8} rx={0.9} fill={Y} />
    <Rect x={20.6} y={2.8} width={4.4} height={1.8} rx={0.9} fill={Y} />
    <Rect x={5} y={76} width={4} height={1.6} rx={0.8} fill={R} />
    <Rect x={21} y={76} width={4} height={1.6} rx={0.8} fill={R} />
  </>
);

interface Props {
  kind: VehicleTopKind;
  /** chiều dài hiển thị (px); mặc định theo loại xe */
  length?: number;
}

export const VehicleTopIcon: React.FC<Props> = React.memo(({ kind, length = VEHICLE_TOP_LENGTH[kind] }) => {
  const [w, h] = VEHICLE_TOP_BOX[kind];
  return (
    <Svg width={(length * w) / h} height={length} viewBox={`0 0 ${w} ${h}`}>
      {kind === 'moto' || kind === 'moto-box' ? <Moto box={kind === 'moto-box'} /> : null}
      {kind === 'car' ? <Car /> : null}
      {kind === 'van' ? <Van /> : null}
      {kind === 'truck' ? <Truck /> : null}
      {kind === 'bus' ? <Bus /> : null}
    </Svg>
  );
});
VehicleTopIcon.displayName = 'VehicleTopIcon';

export default VehicleTopIcon;
