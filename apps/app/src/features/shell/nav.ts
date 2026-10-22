import { Flame, House, User, Users } from 'lucide-react-native';
import type { StrKey } from '@trackr/core';

export const NAV = [
  { name: 'hub', href: '/', label: 'nav_hub', icon: House },
  { name: 'match', href: '/match', label: 'nav_match', icon: Flame },
  { name: 'feed', href: '/feed', label: 'nav_feed', icon: Users },
  { name: 'profile', href: '/profile', label: 'nav_profile', icon: User },
] as const satisfies readonly { name: string; href: string; label: StrKey; icon: unknown }[];
