// SeatPicker — sơ đồ ghế / giường vẽ như xe thật (anh Jacob 2026-10-12): khung xe, tài xế + cửa lên ở đầu xe, lối đi giữa
// các dãy, giường nằm hình giường (gối ở đầu), ghế ngồi hình ghế (tựa đầu), hàng cuối ít ghế thì canh giữa (hàng cuối xe).
// Dữ liệu vẫn là seats của GET /v1/public/intercity/trips/:id (id, row, col, deck, taken); `kind` = 'bed' | 'seat' do màn chọn.
import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { AppText, Icon, Icons } from '@/components/ui';
import type { IntercitySeat } from '@/services/intercity';

type SeatDef = Pick<IntercitySeat, 'id' | 'row' | 'col' | 'taken'>;

interface SeatPickerProps {
  seats: SeatDef[];
  selected: string[];
  onToggle: (seat: SeatDef) => void;
  max?: number;
  /** giường nằm hay ghế ngồi (quyết định hình vẽ và lối đi) */
  kind?: 'seat' | 'bed';
  /** nhãn tầng hiện trong khung xe (xe 2 tầng) */
  deckLabel?: string | null;
}

/** sau cột nào thì có lối đi: giường 3 dãy → 2 lối đi; ghế 4 → 2+2; ghế 3 → 1+2; 2 dãy → 1+1 */
function aislesAfter(maxCol: number, kind: 'seat' | 'bed'): number[] {
  if (maxCol <= 1) return [];
  if (kind === 'bed' && maxCol === 3) return [1, 2];
  if (maxCol === 5) return [2];
  return [Math.floor(maxCol / 2)];
}

export const SeatPicker: React.FC<SeatPickerProps> = ({ seats, selected, onToggle, max = 6, kind = 'seat', deckLabel }) => {
  const rows = Array.from(new Set(seats.map((s) => s.row)));
  const maxCol = seats.reduce((m, s) => Math.max(m, s.col), 1);
  const aisles = aislesAfter(maxCol, kind);
  const bed = kind === 'bed';

  return (
    <View>
      <View style={styles.bus}>
        {/* đầu xe: tài xế bên trái, cửa lên bên phải */}
        <View style={styles.front}>
          <View style={styles.driver}>
            <Icon name={Icons.steering} size={18} color={Colors.textSecondary} />
            <AppText size={10} color={Colors.textSecondary} style={{ marginLeft: 4 }}>
              Tài xế
            </AppText>
          </View>
          {deckLabel ? (
            <AppText size={11} weight="semiBold" color={Colors.textSecondary}>
              {deckLabel}
            </AppText>
          ) : null}
          <View style={styles.door}>
            <AppText size={10} color={Colors.textSecondary} style={{ marginRight: 4 }}>
              Cửa lên
            </AppText>
            <Icon name={'mci:door-open' as never} size={18} color={Colors.textSecondary} />
          </View>
        </View>

        {rows.map((row, rowIndex) => {
          const rowSeats = seats.filter((s) => s.row === row).sort((a, b) => a.col - b.col);
          const lastRow = rowIndex === rows.length - 1;
          // hàng cuối ít chỗ hơn (giường đôi / ghế cuối xe) → canh giữa như hàng ghế sau cùng
          const short = lastRow && rowSeats.length < maxCol;
          const cells: React.ReactNode[] = [];
          for (let col = 1; col <= maxCol; col++) {
            const s = rowSeats.find((x) => x.col === col);
            if (s) {
              const isSelected = selected.includes(s.id);
              const disabled = s.taken || (!isSelected && selected.length >= max);
              cells.push(
                <Pressable
                  key={s.id}
                  onPress={() => onToggle(s)}
                  disabled={s.taken}
                  style={[bed ? styles.bed : styles.seat, isSelected && styles.selected, s.taken && styles.taken, disabled && !s.taken && styles.dim]}
                  accessibilityLabel={`${bed ? 'Giường' : 'Ghế'} ${s.id}${s.taken ? ', đã có khách' : isSelected ? ', đang chọn' : ''}`}
                >
                  {/* gối (giường) / tựa đầu (ghế) */}
                  <View style={[bed ? styles.pillow : styles.headrest, isSelected && styles.partSelected, s.taken && styles.partTaken]} />
                  {s.taken ? (
                    <Icon name={Icons.check} size={14} color={Colors.gray400} />
                  ) : (
                    <AppText size={12} weight="bold" color={isSelected ? Colors.white : Colors.text}>
                      {s.id}
                    </AppText>
                  )}
                </Pressable>,
              );
            } else if (!short) {
              cells.push(<View key={`empty-${row}-${col}`} style={bed ? styles.bedGap : styles.seatGap} />);
            }
            if (!short && aisles.includes(col) && col < maxCol) cells.push(<View key={`aisle-${row}-${col}`} style={styles.aisle} />);
          }
          return (
            <View key={row} style={[styles.row, short && styles.rowCentered]}>
              {cells}
            </View>
          );
        })}
        <View style={styles.rear}>
          <AppText size={10} color={Colors.textMuted}>
            Cuối xe
          </AppText>
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotFree]} />
          <AppText size={12} color={Colors.textSecondary}>
            Còn trống
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotSelected]} />
          <AppText size={12} color={Colors.textSecondary}>
            Đang chọn
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, styles.dotTaken]} />
          <AppText size={12} color={Colors.textSecondary}>
            Đã có khách
          </AppText>
        </View>
      </View>
    </View>
  );
};

const SEAT_W = 40;
const SEAT_H = 40;
const BED_W = 38;
const BED_H = 62;
const base = {
  borderWidth: 1.5,
  borderColor: Colors.border,
  backgroundColor: Colors.white,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const styles = StyleSheet.create({
  bus: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: Colors.gray300,
    borderRadius: 26,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: 6,
  },
  front: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md, paddingBottom: 6, marginBottom: 4, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.gray300 },
  driver: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.gray300, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: Colors.white },
  door: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  rowCentered: { justifyContent: 'center' },
  aisle: { width: 18 },
  seat: { ...base, width: SEAT_W, height: SEAT_H, borderRadius: 8, borderTopLeftRadius: 12, borderTopRightRadius: 12, paddingTop: 6 },
  bed: { ...base, width: BED_W, height: BED_H, borderRadius: 10, paddingTop: 12 },
  seatGap: { width: SEAT_W, height: SEAT_H },
  bedGap: { width: BED_W, height: BED_H },
  headrest: { position: 'absolute', top: 3, width: 20, height: 4, borderRadius: 2, backgroundColor: Colors.gray300 },
  pillow: { position: 'absolute', top: 4, width: 22, height: 7, borderRadius: 3, backgroundColor: Colors.gray300 },
  selected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  taken: { backgroundColor: Colors.gray100, borderColor: Colors.gray300 },
  partSelected: { backgroundColor: 'rgba(255,255,255,0.6)' },
  partTaken: { backgroundColor: Colors.gray300 },
  dim: { opacity: 0.4 },
  rear: { alignItems: 'center', marginTop: 4 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, marginTop: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 12, height: 12, borderRadius: 3 },
  dotFree: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border },
  dotSelected: { backgroundColor: Colors.primary },
  dotTaken: { backgroundColor: Colors.gray100, borderWidth: 1.5, borderColor: Colors.gray300 },
});

export default SeatPicker;
