import { useEffect, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Activity, Eye, EyeOff, Key, Languages, Monitor, Moon, Pencil, Plus, RefreshCw, Settings, Sun } from 'lucide-react-native';
import {
  PROVIDERS, formatAgo, providerById, type ApiKeys, type ExportFile, type LangPref, type ProviderDef, type ThemePref,
} from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { useAccount } from '@/store/useAccount';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Screen } from '@/components/Screen';
import { Button, ButtonText, Card, Segmented } from '@/components/Controls';
import { Avatar } from '@/components/Avatar';
import { Kicker, Txt } from '@/components/Txt';
import { ProviderCard } from './ProviderCard';
import { LoginSheet } from './LoginSheet';
import { ExportSheet } from './ExportSheet';
import { AccountCard } from './AccountCard';
import { EditProfileSheet } from './EditProfileSheet';

function PreferencesCard() {
  const { t, colors } = useApp();
  const prefs = useTrackr(s => s.prefs);
  const setPrefs = useTrackr(s => s.setPrefs);
  return (
    <Card className="gap-4">
      <View className="flex-row items-center gap-2"><Settings size={16} color={colors.fg} /><Txt className="font-bold">{t('prefs')}</Txt></View>
      <View className="gap-1.5">
        <Kicker>{t('language')}</Kicker>
        <Segmented<LangPref>
          value={prefs.lang} onChange={lang => setPrefs({ lang })}
          options={[{ id: 'system', label: t('opt_system'), icon: <Languages size={14} color={colors.muted} /> }, { id: 'pt', label: 'PT' }, { id: 'en', label: 'EN' }]}
        />
      </View>
      <View className="gap-1.5">
        <Kicker>{t('theme')}</Kicker>
        <Segmented<ThemePref>
          value={prefs.theme} onChange={theme => setPrefs({ theme })}
          options={[
            { id: 'system', label: t('opt_system'), icon: <Monitor size={14} color={colors.muted} /> },
            { id: 'dark', label: t('th_dark'), icon: <Moon size={14} color={colors.muted} /> },
            { id: 'light', label: t('th_light'), icon: <Sun size={14} color={colors.muted} /> },
          ]}
        />
      </View>
    </Card>
  );
}

function ApiKeysCard() {
  const { t, colors } = useApp();
  const keys = useTrackr(s => s.keys);
  const saveKeys = useTrackr(s => s.saveKeys);
  const [draft, setDraft] = useState<ApiKeys>(keys);
  const [show, setShow] = useState(false);
  useEffect(() => setDraft(keys), [keys]);

  const fields = [['tmdb', 'TMDB API Key (v3)', 'text-movie'], ['rawg', 'RAWG API Key', 'text-game']] as const;
  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-2"><Key size={16} color={colors.fg} /><Txt className="font-bold">{t('api_title')}</Txt></View>
      <Txt className="text-xs text-muted">{t('api_body')}</Txt>
      {fields.map(([id, label, cls]) => (
        <View key={id} className="gap-1">
          <Txt className={`text-xs font-semibold uppercase tracking-widest ${cls}`}>{label}</Txt>
          <TextInput
            value={draft[id]} onChangeText={v => setDraft({ ...draft, [id]: v.trim() })} secureTextEntry={!show}
            autoCapitalize="none" autoCorrect={false} placeholder={t('paste_key')} placeholderTextColor={colors.subtle}
            className="h-10 px-3 rounded-xl bg-sunken border border-line text-sm text-fg" style={{ outlineStyle: 'none' } as object}
          />
        </View>
      ))}
      <View className="flex-row items-center gap-2">
        <Pressable onPress={() => setShow(s => !s)} className="flex-row items-center gap-1.5 mr-auto">
          {show ? <EyeOff size={14} color={colors.muted} /> : <Eye size={14} color={colors.muted} />}
          <Txt className="text-xs text-muted">{show ? t('hide_keys') : t('show_keys')}</Txt>
        </Pressable>
        <Button variant="secondary" onPress={() => saveKeys({ tmdb: '', rawg: '' })} className="h-9 px-3"><ButtonText variant="secondary">{t('clear')}</ButtonText></Button>
        <Button onPress={() => saveKeys(draft)} className="h-9 px-4"><ButtonText>{t('save')}</ButtonText></Button>
      </View>
    </Card>
  );
}

function SyncLogCard() {
  const { t, lang, colors } = useApp();
  const log = useTrackr(s => s.syncLog);
  return (
    <Card>
      <View className="flex-row items-center gap-2 mb-3"><Activity size={16} color={colors.fg} /><Txt className="font-bold">{t('log_title')}</Txt></View>
      {log.length ? (
        <View className="gap-2.5">
          {log.slice(0, 8).map(r => (
            <View key={`${r.provider}-${r.at}`}>
              <Txt className="text-xs font-medium">
                {t('sync_result', { p: providerById(r.provider)?.name ?? r.provider, a: r.pulled.length, u: r.updated.length, b: r.pushed.length, c: r.conflicts.length })}
              </Txt>
              <Txt className="text-xs text-subtle">{formatAgo(r.at, lang)}{r.conflicts.length ? ` · ⚠ ${r.conflicts.join(', ')}` : ''}</Txt>
            </View>
          ))}
        </View>
      ) : <Txt className="text-sm text-subtle">{t('log_empty')}</Txt>}
    </Card>
  );
}

export function ProfileScreen() {
  const { t, colors } = useApp();
  const { wide } = useBreakpoint();
  const [loginFor, setLoginFor] = useState<ProviderDef | null>(null);
  const [exporting, setExporting] = useState<{ p: ProviderDef; file: ExportFile } | null>(null);
  const [editing, setEditing] = useState(false);
  const me = useTrackr(s => s.me);
  const username = useAccount(s => s.profile?.username);

  return (
    <Screen>
      <Card className="mb-6 flex-row items-center gap-4 rounded-3xl p-5">
        <Pressable onPress={() => setEditing(true)}><Avatar who="me" size={wide ? 80 : 64} ring /></Pressable>
        <View className="flex-1">
          <Kicker>{username ? `@${username}` : t('profile_kicker')}</Kicker>
          <Txt className={`${wide ? 'text-3xl' : 'text-2xl'} font-black tracking-tight`} numberOfLines={1}>{me.name || t('you')}</Txt>
          <Txt className="text-sm text-muted" numberOfLines={2}>{me.bio || t('profile_tagline')}</Txt>
        </View>
        <Button variant="secondary" onPress={() => setEditing(true)} className="h-9 px-3">
          <Pencil size={14} color={colors.fg} />
          {wide && <ButtonText variant="secondary">{t('edit_profile')}</ButtonText>}
        </Button>
      </Card>

      <View className={`gap-6 ${wide ? 'flex-row items-start' : ''}`}>
        <View className="gap-4" style={{ flex: wide ? 2 : undefined }}>
          <View className="gap-1">
            <View className="flex-row items-center gap-2"><RefreshCw size={18} color={colors.media.game} /><Txt className="text-lg font-bold">{t('sync_title')}</Txt></View>
            <Txt className="text-sm text-muted">{t('sync_body')}</Txt>
          </View>
          {PROVIDERS.map(p => (
            <ProviderCard key={p.id} p={p} onConnect={() => setLoginFor(p)} onExport={file => setExporting({ p, file })} />
          ))}
          <View className="rounded-2xl border border-dashed border-strong p-4 flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl bg-surface2 items-center justify-center"><Plus size={18} color={colors.subtle} /></View>
            <View className="flex-1">
              <Txt className="font-semibold text-sm">{t('more_soon')}</Txt>
              <Txt className="text-xs text-subtle">{t('more_soon_body')}</Txt>
            </View>
          </View>
        </View>

        <View className="gap-4" style={{ flex: wide ? 1 : undefined }}>
          <AccountCard />
          <PreferencesCard />
          <ApiKeysCard />
          <SyncLogCard />
        </View>
      </View>

      {loginFor && <LoginSheet p={loginFor} onClose={() => setLoginFor(null)} />}
      {editing && <EditProfileSheet onClose={() => setEditing(false)} />}
      {exporting && <ExportSheet p={exporting.p} file={exporting.file} onClose={() => setExporting(null)} />}
    </Screen>
  );
}
