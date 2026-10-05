import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

// Positions it drifts between (percent of the frame), away from the player's controls.
const SPOTS = [
  { top: 12, left: 8 },
  { top: 18, left: 52 },
  { top: 42, left: 28 },
  { top: 55, left: 58 },
  { top: 30, left: 10 },
  { top: 64, left: 16 },
] as const;

/**
 * The viewer's name and email over a paid video, faint and moving every 8
 * seconds, so a recording shows whose account it came from. Touches pass
 * through to the player.
 */
export function Watermark({ text }: { text: string }) {
  const [spot, setSpot] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setSpot((i) => (i + 1 + Math.floor(Math.random() * (SPOTS.length - 1))) % SPOTS.length),
      8000,
    );
    return () => clearInterval(timer);
  }, []);
  const { top, left } = SPOTS[spot]!;
  return (
    <Text
      pointerEvents="none"
      accessible={false}
      numberOfLines={1}
      style={[styles.text, { top: `${top}%`, left: `${left}%` }]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    position: 'absolute',
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
