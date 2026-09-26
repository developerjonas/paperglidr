import { SymbolView, type SymbolViewProps } from 'expo-symbols';

type Names = Extract<SymbolViewProps['name'], { ios?: unknown }>;

/** A native icon: SF Symbols on iOS, Material Symbols on Android and web. */
export function Icon({
  ios,
  android,
  size = 18,
  color,
}: {
  ios: NonNullable<Names['ios']>;
  android: NonNullable<Names['android']>;
  size?: number;
  color: string;
}) {
  return (
    <SymbolView
      name={{ ios, android, web: android }}
      size={size}
      tintColor={color}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
    />
  );
}
