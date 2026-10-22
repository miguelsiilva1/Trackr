import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Check, ImagePlus, Link2, RotateCcw } from 'lucide-react-native';
import type { Artwork, TrackrItem } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { pickImage } from '@/lib/pickImage';
import { Sheet } from '@/components/Sheet';
import { Button, ButtonText, Segmented } from '@/components/Controls';
import { Txt } from '@/components/Txt';

type Slot = 'poster' | 'banner';

/** Pick a different poster or banner: provider alternatives, a photo from the device or any image URL. */
export function ArtworkSheet({ item, artwork, onChange, onClose }: {
  item: TrackrItem; artwork?: Artwork; onChange: (patch: Partial<TrackrItem>) => void; onClose: () => void;
}) {
  const { t, colors } = useApp();
  const { wide } = useBreakpoint();
  const [slot, setSlot] = useState<Slot>('poster');
  const [url, setUrl] = useState('');

  const poster = slot === 'poster';
  const original = poster ? item.coverUrl : item.backdropUrl;
  const current = (poster ? item.customCover : item.customBackdrop) || original;
  const options = [...new Set([original, ...(poster ? artwork?.posters ?? [] : artwork?.backdrops ?? [])].filter((u): u is string => !!u))];
  const set = (value: string | undefined) => onChange(poster ? { customCover: value } : { customBackdrop: value });
  const cols = poster ? (wide ? 5 : 3) : (wide ? 3 : 2);

  const fromDevice = async () => {
    const uri = await pickImage(poster ? [2, 3] : [16, 9]);
    if (uri) set(uri);
  };

  return (
    <Sheet onClose={onClose} wide title={<Txt className="text-lg font-bold">{t('art_title')}</Txt>}>
      <View className="p-5 gap-4">
        <Segmented<Slot> value={slot} onChange={setSlot} options={[{ id: 'poster', label: t('art_poster') }, { id: 'banner', label: t('art_banner') }]} />

        <View className="flex-row flex-wrap -m-1">
          {options.map(u => {
            const on = u === current;
            return (
              <View key={u} className="p-1" style={{ width: `${100 / cols}%` }}>
                <Pressable onPress={() => set(u === original ? undefined : u)} className={`rounded-xl overflow-hidden border-2 ${on ? 'border-accent' : 'border-transparent'}`}>
                  <Image source={u} contentFit="cover" style={{ width: '100%', aspectRatio: poster ? 2 / 3 : 16 / 9 }} />
                  {on && (
                    <View className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-accent items-center justify-center">
                      <Check size={14} color={colors.accentFg} strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
        {options.length <= 1 && <Txt className="text-xs text-subtle">{t('art_none', { s: item.type === 'game' ? 'RAWG' : 'TMDB' })}</Txt>}

        <View className="flex-row gap-2">
          <View className="flex-1 h-11 flex-row items-center rounded-xl bg-sunken border border-line px-3 gap-2">
            <Link2 size={16} color={colors.subtle} />
            <TextInput
              value={url} onChangeText={setUrl} placeholder={t('art_url')} placeholderTextColor={colors.subtle} autoCapitalize="none" autoCorrect={false}
              className="flex-1 text-sm text-fg h-full" style={{ outlineStyle: 'none' } as object}
            />
          </View>
          <Button onPress={() => { set(url.trim()); setUrl(''); }} disabled={!/^https?:\/\//.test(url.trim())} className="h-11">
            <ButtonText>{t('art_apply')}</ButtonText>
          </Button>
        </View>

        <View className="flex-row flex-wrap gap-2">
          <Button variant="secondary" onPress={() => void fromDevice()} className="h-10">
            <ImagePlus size={16} color={colors.fg} />
            <ButtonText variant="secondary">{t('art_device')}</ButtonText>
          </Button>
          <Button variant="ghost" onPress={() => set(undefined)} disabled={current === original} className="h-10">
            <RotateCcw size={16} color={colors.subtle} />
            <ButtonText variant="ghost">{t('art_reset')}</ButtonText>
          </Button>
        </View>
      </View>
    </Sheet>
  );
}
