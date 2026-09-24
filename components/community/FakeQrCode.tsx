// FakeQrCode — mã QR minh hoạ vẽ bằng View (deterministic theo chuỗi) — chưa có thư viện QR thật.
// TODO: thay bằng react-native-qrcode-svg khi được phép cài thêm dependency.
import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '@/constants/theme';

interface FakeQrCodeProps {
  value: string;
  size?: number;
  cells?: number;
}

function hash(str: string, seed: number) {
  let h = 2166136261 ^ seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const FakeQrCode: React.FC<FakeQrCodeProps> = ({ value, size = 200, cells = 25 }) => {
  const cell = size / cells;
  const grid = useMemo(() => {
    const rows: boolean[][] = [];
    for (let r = 0; r < cells; r++) {
      const row: boolean[] = [];
      for (let c = 0; c < cells; c++) {
        const inFinder =
          (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);
        if (inFinder) {
          const rr = r < 7 ? r : r - (cells - 7);
          const cc = c < 7 ? c : c - (cells - 7);
          const ring = rr === 0 || rr === 6 || cc === 0 || cc === 6;
          const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4;
          row.push(ring || core);
        } else {
          row.push(hash(value, r * cells + c) % 100 < 46);
        }
      }
      rows.push(row);
    }
    return rows;
  }, [value, cells]);

  return (
    <View style={[styles.wrap, { width: size + 16, height: size + 16 }]}>
      <View style={{ width: size, height: size }}>
        {grid.map((row, r) => (
          <View key={r} style={{ flexDirection: 'row', height: cell }}>
            {row.map((on, c) => (
              <View key={c} style={{ width: cell, height: cell, backgroundColor: on ? Colors.primaryDark : 'transparent' }} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    padding: 8,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});

export default FakeQrCode;
