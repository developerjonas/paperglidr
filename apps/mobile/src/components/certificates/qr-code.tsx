import QRCode from 'qrcode';
import { useMemo } from 'react';
import { View } from 'react-native';

/**
 * A QR code drawn with plain views (no canvas or SVG). Black on white with
 * a quiet zone, so any scanner reads it in light and dark mode.
 */
export function QrCode({ value, size = 160 }: { value: string; size?: number }) {
  const matrix = useMemo(() => {
    const { modules } = QRCode.create(value, { errorCorrectionLevel: 'M' });
    return Array.from({ length: modules.size }, (_, row) =>
      Array.from({ length: modules.size }, (_, col) => Boolean(modules.get(row, col))),
    );
  }, [value]);
  const quiet = 2;
  const cell = Math.floor(size / (matrix.length + quiet * 2));

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="QR code to verify this certificate"
      style={{ backgroundColor: '#fff', padding: cell * quiet, alignSelf: 'center' }}>
      {matrix.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((dark, c) => (
            <View key={c} style={{ width: cell, height: cell, backgroundColor: dark ? '#000' : '#fff' }} />
          ))}
        </View>
      ))}
    </View>
  );
}
