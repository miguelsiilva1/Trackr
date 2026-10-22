import { Activity, Heart, LayoutGrid, User } from 'lucide-react-native';
import type { StrKey } from '@trackr/core';

export const NAV = [
  { name: 'hub', href: '/', label: 'nav_hub', short: 'nav_hub_short', icon: LayoutGrid },
  { name: 'match', href: '/match', label: 'nav_match', short: 'nav_match_short', icon: Heart },
  { name: 'feed', href: '/feed', label: 'nav_feed', short: 'nav_feed_short', icon: Activity },
  { name: 'profile', href: '/profile', label: 'nav_profile', short: 'nav_profile_short', icon: User },
] as const satisfies readonly { name: string; href: string; label: StrKey; short: StrKey; icon: unknown }[];
