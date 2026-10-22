import { LinearGradient } from 'expo-linear-gradient';
import type { ProviderDef } from '@trackr/core';
import { Txt } from '@/components/Txt';

export function ProviderMark({ p, size = 40 }: { p: ProviderDef; size?: number }) {
  return (
    <LinearGradient
      colors={p.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
    >
      <Txt className="font-black text-white" style={{ fontSize: size * 0.36 }}>{p.mono}</Txt>
    </LinearGradient>
  );
}
