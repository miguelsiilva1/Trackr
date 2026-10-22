import { useState } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';
import { AlertCircle, Link2, User } from 'lucide-react-native';
import type { ProviderDef } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { Sheet } from '@/components/Sheet';
import { Button, ButtonText } from '@/components/Controls';
import { Kicker, Txt } from '@/components/Txt';
import { ProviderMark } from './ProviderMark';

const SIMULATED_LOGIN_MS = 900;

/** Simulated OAuth / account link. In production this opens the TRACKR backend OAuth URL (expo-auth-session). */
export function LoginSheet({ p, onClose }: { p: ProviderDef; onClose: () => void }) {
  const { t, colors } = useApp();
  const connect = useTrackr(s => s.connect);
  const [user, setUser] = useState('');
  const [busy, setBusy] = useState(false);
  const official = p.api === 'official_gated';

  const submit = () => {
    if (!user.trim() || busy) return;
    setBusy(true);
    setTimeout(() => {
      connect(p.id, user.trim().replace(/^@/, ''));
      onClose();
    }, SIMULATED_LOGIN_MS);
  };

  return (
    <Sheet onClose={onClose} title={<View className="flex-row items-center gap-3"><ProviderMark p={p} size={32} /><Txt className="text-lg font-bold">{t('login_title', { p: p.name })}</Txt></View>}>
      <View className="p-5 gap-5">
        <View className="gap-1.5">
          <Kicker>{t('login_user', { p: p.name })}</Kicker>
          <View className="h-11 flex-row items-center rounded-xl bg-sunken border border-line px-3 gap-2">
            <User size={16} color={colors.subtle} />
            <TextInput
              autoFocus autoCapitalize="none" autoCorrect={false} value={user} onChangeText={setUser} onSubmitEditing={submit}
              placeholder="@username" placeholderTextColor={colors.subtle} className="flex-1 text-sm text-fg h-full" style={{ outlineStyle: 'none' } as object}
            />
          </View>
        </View>
        <View className="flex-row gap-2 rounded-xl bg-sunken border border-line p-3">
          <AlertCircle size={16} color={colors.media.movie} />
          <Txt className="flex-1 text-xs text-muted leading-relaxed">{official ? t('login_note_oauth') : t('login_note_none', { p: p.name })}</Txt>
        </View>
        <Button onPress={submit} disabled={!user.trim() || busy} className="h-12">
          {busy ? <ActivityIndicator size="small" color={colors.invFg} /> : <Link2 size={18} color={colors.invFg} />}
          <ButtonText>{official ? t('login_cta', { p: p.name }) : t('login_sim_cta')}</ButtonText>
        </Button>
      </View>
    </Sheet>
  );
}
