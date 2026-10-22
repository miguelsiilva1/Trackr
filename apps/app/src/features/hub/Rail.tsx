import { useRef, useState } from 'react';
import { Pressable, ScrollView, View, type ScrollViewInstance } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useApp } from '@/providers/AppProviders';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Txt } from '@/components/Txt';

const GAP = 14;

/** A titled horizontal row of cards. Desktop gets arrow buttons, since mouse wheels don't scroll sideways. */
export function Rail({ title, count, expanded, onToggle, children }: {
  title: string; count: number; expanded?: boolean; onToggle?: () => void; children: React.ReactNode;
}) {
  const { t, colors } = useApp();
  const { wide } = useBreakpoint();
  const ref = useRef<ScrollViewInstance>(null);
  const [x, setX] = useState(0);
  const [viewport, setViewport] = useState(0);
  const [content, setContent] = useState(0);
  const scrollBy = (dir: 1 | -1) => ref.current?.scrollTo({ x: Math.max(0, x + dir * viewport * 0.8), animated: true });

  const arrow = (dir: 1 | -1, enabled: boolean) => (
    <Pressable
      onPress={() => scrollBy(dir)} disabled={!enabled}
      className={`w-8 h-8 rounded-full items-center justify-center bg-surface border border-line ${enabled ? '' : 'opacity-30'}`}
    >
      {dir === 1 ? <ChevronRight size={16} color={colors.fg} /> : <ChevronLeft size={16} color={colors.fg} />}
    </Pressable>
  );

  return (
    <View className="mb-9">
      <View className="flex-row items-center mb-3.5 gap-3">
        <Pressable onPress={onToggle} disabled={!onToggle} className="flex-row items-center gap-2">
          <Txt className={`${wide ? 'text-xl' : 'text-lg'} font-bold`}>{title}</Txt>
          <Txt className="text-sm text-subtle">{count}</Txt>
          {onToggle && <ChevronRight size={18} color={colors.muted} style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }} />}
        </Pressable>
        <View className="flex-1" />
        {onToggle && (
          <Pressable onPress={onToggle}><Txt className="text-sm text-accent font-semibold">{expanded ? t('show_less') : t('see_all')}</Txt></Pressable>
        )}
        {wide && !expanded && content > viewport && (
          <View className="flex-row gap-1.5">{arrow(-1, x > 4)}{arrow(1, x + viewport < content - 4)}</View>
        )}
      </View>
      {expanded ? (
        <View className="flex-row flex-wrap" style={{ gap: GAP }}>{children}</View>
      ) : (
        <ScrollView
          ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: GAP }}
          onScroll={e => setX(e.nativeEvent.contentOffset.x)} scrollEventThrottle={32}
          onLayout={e => setViewport(e.nativeEvent.layout.width)} onContentSizeChange={w => setContent(w)}
        >
          {children}
        </ScrollView>
      )}
    </View>
  );
}
