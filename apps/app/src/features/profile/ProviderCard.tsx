import { ActivityIndicator, Pressable, Switch, View } from 'react-native';
import { ArrowDown, ArrowUp, Download, Link2, RefreshCw, Sparkles, Unlink, Upload, Zap } from 'lucide-react-native';
import {
  buildExport, formatAgo, pendingCount, type ConflictPolicy, type ExportFile, type ProviderDef, type SyncDirection,
} from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { pickCsvFiles } from '@/lib/files';
import { Button, ButtonText, Card, Segmented } from '@/components/Controls';
import { TypeBadge } from '@/components/TypeBadge';
import { Kicker, Txt } from '@/components/Txt';
import { ProviderMark } from './ProviderMark';

export function ProviderCard({ p, onConnect, onExport }: { p: ProviderDef; onConnect: () => void; onExport: (file: ExportFile) => void }) {
  const { t, lang, colors } = useApp();
  const conn = useTrackr(s => s.conns[p.id]);
  const items = useTrackr(s => s.items);
  const remoteCount = useTrackr(s => s.remote[p.id].length);
  const syncing = useTrackr(s => s.syncing.includes(p.id));
  const { disconnect, patchConn, runSync, importCsv, simulateRemote, notify } = useTrackr.getState();
  const official = p.api === 'official_gated';
  const pending = pendingCount(items, p, conn);

  const doImport = async () => {
    try {
      const files = await pickCsvFiles();
      if (files.length) importCsv(p.id, files);
    } catch {
      notify('csv_err');
    }
  };

  return (
    <Card className="gap-4">
      <View className="flex-row items-start gap-3">
        <ProviderMark p={p} />
        <View className="flex-1 gap-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Txt className="font-bold">{p.name}</Txt>
            {p.covers.map(c => <TypeBadge key={c} type={c} variant="surface" />)}
            {!official && <View className="px-2 py-0.5 rounded-full bg-surface2"><Txt className="text-xs text-muted">{t('sim_badge')}</Txt></View>}
          </View>
          <Txt className="text-xs text-subtle">{official ? t('cap_official') : t('cap_none')}</Txt>
        </View>
        {conn ? (
          <Button variant="secondary" onPress={() => disconnect(p.id)} className="h-9 px-3">
            <Unlink size={14} color={colors.muted} />
          </Button>
        ) : (
          <Button onPress={onConnect} className="h-9 px-3">
            <Link2 size={14} color={colors.invFg} />
            <ButtonText>{t('connect')}</ButtonText>
          </Button>
        )}
      </View>

      {conn && (
        <>
          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
            <Txt className="text-xs font-medium">@{conn.username}</Txt>
            <Txt className="text-xs text-subtle">{t('last_sync', { d: conn.lastSync ? formatAgo(conn.lastSync, lang) : t('never') })}</Txt>
            <Txt className={`text-xs ${pending ? 'text-movie font-medium' : 'text-game'}`}>{pending ? t('pending', { n: pending }) : t('up_to_date')}</Txt>
            <Txt className="text-xs text-subtle">{t('remote_count', { n: remoteCount })}</Txt>
          </View>

          <View className="flex-row flex-wrap gap-4">
            <View className="gap-1.5">
              <Kicker>{t('direction')}</Kicker>
              <Segmented<SyncDirection>
                value={conn.direction} onChange={direction => patchConn(p.id, { direction })}
                options={[
                  { id: 'two_way', label: t('dir_two') },
                  { id: 'pull', label: t('dir_pull'), icon: <ArrowDown size={14} color={colors.muted} /> },
                  { id: 'push', label: t('dir_push'), icon: <ArrowUp size={14} color={colors.muted} /> },
                ]}
              />
            </View>
            <View className="gap-1.5">
              <Kicker>{t('conflict')}</Kicker>
              <Segmented<ConflictPolicy>
                value={conn.conflict} onChange={conflict => patchConn(p.id, { conflict })}
                options={[{ id: 'newest', label: t('cf_newest') }, { id: 'trackr', label: t('cf_trackr') }, { id: 'remote', label: t('cf_remote') }]}
              />
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Zap size={15} color="#eab308" />
              <Txt className="text-sm">{t('auto_sync')}</Txt>
            </View>
            <Switch value={conn.auto} onValueChange={auto => patchConn(p.id, { auto })} trackColor={{ true: '#10b981', false: colors.surface2 }} thumbColor="#fff" />
          </View>

          <View className="flex-row flex-wrap gap-2">
            <Button variant="accent" onPress={() => runSync(p.id)} disabled={syncing}>
              {syncing ? <ActivityIndicator size="small" color="#09090b" /> : <RefreshCw size={15} color="#09090b" />}
              <ButtonText variant="accent">{syncing ? t('syncing') : t('sync_now')}</ButtonText>
            </Button>
            <Button variant="secondary" onPress={doImport}>
              <Upload size={15} color={colors.fg} />
              <ButtonText variant="secondary">{t('csv_import')}</ButtonText>
            </Button>
            {p.csv === 'letterboxd' ? (
              <>
                <Button variant="secondary" onPress={() => onExport(buildExport(items, p, 'watched'))}>
                  <Download size={15} color={colors.fg} />
                  <ButtonText variant="secondary">{t('export_watched')}</ButtonText>
                </Button>
                <Button variant="secondary" onPress={() => onExport(buildExport(items, p, 'watchlist'))}>
                  <Download size={15} color={colors.fg} />
                  <ButtonText variant="secondary">{t('export_watchlist')}</ButtonText>
                </Button>
              </>
            ) : (
              <Button variant="secondary" onPress={() => onExport(buildExport(items, p, 'watched'))}>
                <Download size={15} color={colors.fg} />
                <ButtonText variant="secondary">{t('csv_export')}</ButtonText>
              </Button>
            )}
            <Pressable onPress={() => simulateRemote(p.id)} className="h-10 px-3 flex-row items-center gap-1.5">
              <Sparkles size={14} color={colors.subtle} />
              <Txt className="text-xs text-subtle">{t('simulate_remote')}</Txt>
            </Pressable>
          </View>
          <Txt className="text-xs text-subtle">{p.csv === 'letterboxd' ? t('csv_hint_lb') : t('csv_hint_generic')}</Txt>
        </>
      )}
    </Card>
  );
}
