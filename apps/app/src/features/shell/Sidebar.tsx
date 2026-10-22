import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import { ChevronLeft, ChevronRight, Keyboard, Moon, Plus, RefreshCw, Sun } from 'lucide-react-native';
import { MEDIA_TYPES, type StrKey } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { Logo } from '@/components/Logo';
import { Kicker, Txt } from '@/components/Txt';
import { MediaIcon } from '@/components/MediaIcon';
import { ApiChip } from './ApiChip';
import { NAV } from './nav';

type NavEntry = (typeof NAV)[number];

function SideButton({ entry, index, collapsed, isFocused, ref: _ref, ...props }: TabTriggerSlotProps & { entry: NavEntry; index: number; collapsed: boolean }) {
  const { t, colors } = useApp();
  const synced = useTrackr(s => Object.keys(s.conns).length > 0);
  const Icon = entry.icon;
  return (
    <Pressable
      {...props}
      className={`h-11 rounded-xl flex-row items-center gap-3 ${collapsed ? 'justify-center' : 'px-3'} ${isFocused ? 'bg-surface2' : ''}`}
    >
      <Icon size={19} color={isFocused ? colors.media.game : colors.muted} />
      {!collapsed && (
        <>
          <Txt className={`flex-1 text-sm font-medium ${isFocused ? 'text-fg' : 'text-muted'}`}>{t(entry.label)}</Txt>
          {entry.name === 'profile' && synced && <RefreshCw size={13} color={colors.media.game} />}
          <Txt className="text-xs text-subtle">{index + 1}</Txt>
        </>
      )}
    </Pressable>
  );
}

export function Sidebar({ onAdd }: { onAdd: () => void }) {
  const { t, theme, lang, colors } = useApp();
  const items = useTrackr(s => s.items);
  const setPrefs = useTrackr(s => s.setPrefs);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <View className="h-full border-r border-line bg-app" style={{ width: collapsed ? 80 : 256 }}>
      <View className={`h-20 justify-center ${collapsed ? 'items-center' : 'px-5'}`}><Logo compact={collapsed} /></View>

      <View className="px-3 gap-1">
        {NAV.map((n, i) => (
          <TabTrigger key={n.name} name={n.name} asChild>
            <SideButton entry={n} index={i} collapsed={collapsed} />
          </TabTrigger>
        ))}
        <Pressable onPress={onAdd} className={`h-11 mt-3 rounded-xl flex-row items-center gap-3 bg-inv active:scale-95 ${collapsed ? 'justify-center' : 'px-3'}`}>
          <Plus size={19} color={colors.invFg} />
          {!collapsed && <><Txt className="flex-1 text-sm font-semibold text-inv-fg">{t('track_item')}</Txt><Txt className="text-xs text-inv-fg opacity-60">N</Txt></>}
        </Pressable>
      </View>

      {!collapsed && (
        <View className="mx-3 mt-6 p-4 rounded-2xl bg-surface border border-line gap-2.5">
          <Kicker>{t('by_cat')}</Kicker>
          {MEDIA_TYPES.map(ty => (
            <View key={ty} className="flex-row items-center gap-2">
              <MediaIcon type={ty} size={15} color={colors.media[ty]} />
              <Txt className="flex-1 text-sm text-muted">{t(`types_${ty}` as StrKey)}</Txt>
              <Txt className="text-sm font-semibold">{items.filter(i => i.type === ty).length}</Txt>
            </View>
          ))}
        </View>
      )}

      <View className="mt-auto p-3 gap-2">
        {!collapsed && Platform.OS === 'web' && (
          <View className="px-3 py-2 gap-1">
            <View className="flex-row items-center gap-1.5"><Keyboard size={13} color={colors.muted} /><Txt className="text-xs text-muted font-medium">{t('shortcuts')}</Txt></View>
            <Txt className="text-xs text-subtle">N {t('sc_add')} · , {t('sc_profile')} · 1–4</Txt>
          </View>
        )}
        <View className={`items-center gap-2 ${collapsed ? '' : 'flex-row'}`}>
          <ApiChip full={!collapsed} />
          <Pressable onPress={() => setPrefs({ theme: theme === 'dark' ? 'light' : 'dark' })} accessibilityLabel={t('theme')} className="p-2 rounded-full">
            {theme === 'dark' ? <Sun size={17} color={colors.muted} /> : <Moon size={17} color={colors.muted} />}
          </Pressable>
          <Pressable onPress={() => setPrefs({ lang: lang === 'pt' ? 'en' : 'pt' })} accessibilityLabel={t('language')} className="p-2 rounded-full">
            <Txt className="text-xs font-bold text-muted">{lang === 'pt' ? 'EN' : 'PT'}</Txt>
          </Pressable>
          <Pressable onPress={() => setCollapsed(c => !c)} accessibilityLabel={t('collapse')} className={`p-2 rounded-full ${collapsed ? '' : 'ml-auto'}`}>
            {collapsed ? <ChevronRight size={17} color={colors.muted} /> : <ChevronLeft size={17} color={colors.muted} />}
          </Pressable>
        </View>
      </View>
    </View>
  );
}
