import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Star } from 'lucide-react-native';
import { mockRatingHistogram, type TrackrItem } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { Card } from '@/components/Controls';
import { StarRating } from '@/components/StarRating';
import { Kicker, Txt } from '@/components/Txt';

const BAR_H = 56;
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n));

/** Letterboxd-style spread of community ratings, half a star per bar. Hover or tap a bar for its count. */
export function RatingsCard({ item }: { item: TrackrItem }) {
  const { t } = useApp();
  const { buckets, total } = useMemo(() => mockRatingHistogram(item), [item]);
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...buckets, 1);
  const mine = item.myRating ? Math.round(item.myRating * 2) - 1 : -1;

  return (
    <Card className="gap-3">
      <View className="flex-row items-baseline justify-between pb-2 border-b border-line">
        <Kicker>{t('community')}</Kicker>
        <Txt className="text-xs text-subtle">
          {hover === null ? t('ratings_n', { n: compact(total) }) : `${(hover + 1) / 2}★ · ${compact(buckets[hover])}`}
        </Txt>
      </View>
      <View className="flex-row items-end gap-3">
        <Star size={11} color="#facc15" fill="#facc15" />
        <View className="flex-1 flex-row items-end gap-0.5" style={{ height: BAR_H }}>
          {buckets.map((n, i) => (
            <Pressable
              key={i} onHoverIn={() => setHover(i)} onHoverOut={() => setHover(null)} onPressIn={() => setHover(i)} onPressOut={() => setHover(null)}
              className="flex-1 h-full justify-end"
            >
              <View
                className={`rounded-t-sm ${i === mine ? 'bg-accent' : hover === i ? 'bg-muted' : 'bg-subtle/40'}`}
                style={{ height: Math.max(2, (n / max) * BAR_H) }}
              />
            </Pressable>
          ))}
        </View>
        <View className="items-center gap-1">
          <Txt className="text-3xl font-light text-muted">{item.rating.toFixed(1)}</Txt>
          <StarRating value={5} size={9} />
        </View>
      </View>
    </Card>
  );
}
