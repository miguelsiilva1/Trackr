import { useRef, useState } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import { Txt } from '@/components/Txt';

/** −/+ buttons plus a draggable bar (no native slider needed on any platform). */
export function ProgressControl({ value, total, color, onChange }: { value: number; total: number; color: string; onChange: (v: number) => void }) {
  const [width, setWidth] = useState(1);
  const widthRef = useRef(1);
  widthRef.current = width;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const fromX = (x: number) => Math.round(Math.max(0, Math.min(1, x / widthRef.current)) * total);
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: e => onChangeRef.current(fromX(e.nativeEvent.locationX)),
    onPanResponderMove: e => onChangeRef.current(fromX(e.nativeEvent.locationX)),
  })).current;

  const pct = total ? (value / total) * 100 : 0;
  return (
    <View className="flex-row items-center gap-2">
      <Pressable onPress={() => onChange(Math.max(0, value - 1))} className="w-9 h-9 rounded-lg bg-surface2 items-center justify-center active:scale-90">
        <Txt className="font-bold">−</Txt>
      </Pressable>
      <View
        className="flex-1 h-8 justify-center" onLayout={e => setWidth(e.nativeEvent.layout.width)}
        {...responder.panHandlers}
      >
        <View className="h-2 rounded-full bg-surface2 overflow-hidden" pointerEvents="none">
          <View className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
        </View>
        <View pointerEvents="none" className="absolute w-5 h-5 rounded-full border-2 border-white" style={{ left: `${pct}%`, marginLeft: -10, backgroundColor: color }} />
      </View>
      <Pressable onPress={() => onChange(Math.min(total, value + 1))} className="w-9 h-9 rounded-lg bg-surface2 items-center justify-center active:scale-90">
        <Txt className="font-bold">+</Txt>
      </Pressable>
    </View>
  );
}
