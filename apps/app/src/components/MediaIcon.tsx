import { Film, Gamepad2, Tv } from 'lucide-react-native';
import type { MediaType } from '@trackr/core';

const ICONS = { movie: Film, series: Tv, game: Gamepad2 } as const;

export function MediaIcon({ type, size = 14, color }: { type: MediaType; size?: number; color: string }) {
  const Icon = ICONS[type];
  return <Icon size={size} color={color} />;
}
