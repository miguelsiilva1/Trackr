import { Pressable, View } from 'react-native';
import { Txt } from './Txt';

/** Rounded filter chip. `activeClass` overrides the default inverted look (e.g. category accents). */
export function Pill({ active, onPress, children, activeClass, activeTextClass }: {
  active: boolean; onPress: () => void; children: React.ReactNode; activeClass?: string; activeTextClass?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-1.5 px-4 py-2 rounded-full border active:scale-95 ${
        active ? `${activeClass ?? 'bg-inv'} border-transparent` : 'bg-surface border-line'}`}
    >
      {typeof children === 'string'
        ? <Txt className={`text-sm font-medium ${active ? activeTextClass ?? 'text-inv-fg' : 'text-muted'}`}>{children}</Txt>
        : children}
    </Pressable>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { id: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <View className="flex-row flex-wrap self-start p-1 rounded-xl bg-sunken border border-line gap-1">
      {options.map(o => {
        const on = value === o.id;
        return (
          <Pressable key={o.id} onPress={() => onChange(o.id)} className={`h-8 px-3 rounded-lg flex-row items-center gap-1.5 ${on ? 'bg-surface2' : ''}`}>
            {o.icon}
            <Txt className={`text-xs font-medium ${on ? 'text-fg' : 'text-muted'}`}>{o.label}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Button({ onPress, children, variant = 'primary', disabled, className = '' }: {
  onPress: () => void; children: React.ReactNode; variant?: 'primary' | 'secondary' | 'accent' | 'ghost'; disabled?: boolean; className?: string;
}) {
  const box = variant === 'primary' ? 'bg-accent' : variant === 'accent' ? 'bg-emerald-500' : variant === 'secondary' ? 'bg-surface2' : '';
  return (
    <Pressable
      onPress={onPress} disabled={disabled}
      className={`h-10 px-4 rounded-xl flex-row items-center justify-center gap-1.5 active:scale-95 ${box} ${disabled ? 'opacity-50' : ''} ${className}`}
    >
      {children}
    </Pressable>
  );
}

/** Text styled for use inside <Button>, matching its variant. */
export function ButtonText({ children, variant = 'primary' }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'accent' | 'ghost' }) {
  const cls = variant === 'primary' ? 'text-accent-fg font-semibold' : variant === 'accent' ? 'text-zinc-950 font-semibold' : variant === 'ghost' ? 'text-subtle' : 'text-fg';
  return <Txt className={`text-sm ${cls}`}>{children}</Txt>;
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <View className={`rounded-2xl bg-surface border border-line p-4 ${className}`}>{children}</View>;
}
