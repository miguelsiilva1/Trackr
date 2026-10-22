import { Text, type TextProps } from 'react-native';

/** Text with the theme foreground color by default. */
export function Txt({ className = '', ...props }: TextProps & { className?: string }) {
  return <Text className={`text-fg ${className}`} {...props} />;
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return <Txt className="text-xs uppercase tracking-widest text-subtle font-semibold">{children}</Txt>;
}
