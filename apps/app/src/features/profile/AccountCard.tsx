import { useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { AlertCircle, Cloud, CloudOff, LogOut } from 'lucide-react-native';
import { errMsg, type StrKey } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useAccount } from '@/store/useAccount';
import { useTrackr } from '@/store/useTrackr';
import { Sheet } from '@/components/Sheet';
import { Button, ButtonText, Card } from '@/components/Controls';
import { Kicker, Txt } from '@/components/Txt';

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

function Field({ label, value, onChange, secure, hint, onSubmit }: {
  label: StrKey; value: string; onChange: (v: string) => void; secure?: boolean; hint?: string; onSubmit?: () => void;
}) {
  const { t, colors } = useApp();
  return (
    <View className="gap-1.5">
      <Kicker>{t(label)}</Kicker>
      <TextInput
        value={value} onChangeText={onChange} secureTextEntry={secure} autoCapitalize="none" autoCorrect={false}
        onSubmitEditing={onSubmit} placeholderTextColor={colors.subtle}
        className="h-11 px-3 rounded-xl bg-sunken border border-line text-sm text-fg" style={{ outlineStyle: 'none' } as object}
      />
      {hint ? <Txt className="text-xs text-subtle">{hint}</Txt> : null}
    </View>
  );
}

function AuthSheet({ onClose }: { onClose: () => void }) {
  const { t, colors } = useApp();
  const signIn = useAccount(s => s.signIn);
  const signUp = useAccount(s => s.signUp);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const signup = mode === 'signup';
  const valid = email.includes('@') && password.length >= 6 && (!signup || USERNAME_RE.test(username));

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (signup && (await signUp(email.trim(), password, username)) === 'confirm_email') {
        setMessage({ text: t('acc_check_email'), error: false });
        setMode('signin');
      } else {
        if (!signup) await signIn(email.trim(), password);
        onClose();
      }
    } catch (e) {
      setMessage({ text: errMsg(e), error: true });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={onClose} title={<Txt className="text-lg font-bold">{t(signup ? 'acc_signup' : 'acc_signin')}</Txt>}>
      <View className="p-5 gap-4">
        {signup && <Field label="acc_username" value={username} onChange={setUsername} hint={t('acc_username_rule')} />}
        <Field label="acc_email" value={email} onChange={setEmail} />
        <Field label="acc_password" value={password} onChange={setPassword} secure onSubmit={submit} />
        {message && (
          <View className="flex-row gap-2 rounded-xl bg-sunken border border-line p-3">
            <AlertCircle size={16} color={message.error ? '#f43f5e' : colors.media.game} />
            <Txt className="flex-1 text-xs text-muted leading-relaxed">{message.text}</Txt>
          </View>
        )}
        <Button onPress={submit} disabled={!valid || busy} className="h-12">
          {busy && <ActivityIndicator size="small" color={colors.invFg} />}
          <ButtonText>{t(signup ? 'acc_signup' : 'acc_signin')}</ButtonText>
        </Button>
        <Pressable onPress={() => { setMode(signup ? 'signin' : 'signup'); setMessage(null); }} className="self-center">
          <Txt className="text-sm text-muted">{t(signup ? 'acc_to_signin' : 'acc_to_signup')}</Txt>
        </Pressable>
      </View>
    </Sheet>
  );
}

/** TRACKR account: sign-in state and the entry point to the auth sheet. */
export function AccountCard() {
  const { t, colors } = useApp();
  const status = useAccount(s => s.status);
  const profile = useAccount(s => s.profile);
  const signOut = useAccount(s => s.signOut);
  const [open, setOpen] = useState(false);

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-2">
        {status === 'off' ? <CloudOff size={16} color={colors.muted} /> : <Cloud size={16} color={colors.fg} />}
        <Txt className="font-bold">{t('acc_title')}</Txt>
      </View>
      {status === 'off' && <Txt className="text-xs text-muted">{t('acc_off')}</Txt>}
      {status === 'loading' && <ActivityIndicator size="small" color={colors.muted} />}
      {status === 'signed_out' && (
        <>
          <Txt className="text-xs text-muted">{t('acc_signed_out')}</Txt>
          <Button onPress={() => setOpen(true)} className="h-9 self-start"><ButtonText>{t('acc_signin')}</ButtonText></Button>
        </>
      )}
      {status === 'signed_in' && profile && (
        <View className="flex-row items-center gap-2">
          <Txt className="flex-1 text-sm">{t('acc_as', { u: profile.username })}</Txt>
          <Button variant="secondary" onPress={() => signOut().catch(e => useTrackr.getState().notify('acc_cloud_err', { e: errMsg(e) }))} className="h-9 px-3">
            <LogOut size={14} color={colors.fg} />
            <ButtonText variant="secondary">{t('acc_signout')}</ButtonText>
          </Button>
        </View>
      )}
      {open && <AuthSheet onClose={() => setOpen(false)} />}
    </Card>
  );
}
