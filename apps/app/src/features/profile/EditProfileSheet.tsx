import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Camera, Trash2 } from 'lucide-react-native';
import { errMsg } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { useTrackr } from '@/store/useTrackr';
import { useAccount } from '@/store/useAccount';
import { pickImage } from '@/lib/pickImage';
import { Sheet } from '@/components/Sheet';
import { Avatar } from '@/components/Avatar';
import { Button, ButtonText } from '@/components/Controls';
import { Kicker, Txt } from '@/components/Txt';

const NAME_MAX = 40;
const BIO_MAX = 160;

/** Name, bio and profile photo. The name also updates the TRACKR account when signed in. */
export function EditProfileSheet({ onClose }: { onClose: () => void }) {
  const { t, colors } = useApp();
  const me = useTrackr(s => s.me);
  const setMe = useTrackr(s => s.setMe);
  const notify = useTrackr(s => s.notify);
  const updateDisplayName = useAccount(s => s.updateDisplayName);
  const [name, setName] = useState(me.name);
  const [bio, setBio] = useState(me.bio);

  const choosePhoto = async () => {
    const photo = await pickImage([1, 1]);
    if (photo) setMe({ photo });
  };

  const save = () => {
    const clean = name.trim();
    setMe({ name: clean, bio: bio.trim() });
    if (clean) updateDisplayName(clean).catch(e => notify('acc_cloud_err', { e: errMsg(e) }));
    onClose();
  };

  const input = 'rounded-xl bg-sunken border border-line px-3 text-sm text-fg';
  return (
    <Sheet onClose={onClose} title={<Txt className="text-lg font-bold">{t('edit_profile')}</Txt>}>
      <View className="p-5 gap-5">
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => void choosePhoto()}>
            <Avatar who="me" size={84} ring />
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-accent items-center justify-center border-2 border-surface">
              <Camera size={15} color={colors.accentFg} />
            </View>
          </Pressable>
          <View className="gap-2">
            <Pressable onPress={() => void choosePhoto()}><Txt className="text-sm font-semibold text-accent">{t('change_photo')}</Txt></Pressable>
            {me.photo && (
              <Pressable onPress={() => setMe({ photo: undefined })} className="flex-row items-center gap-1.5">
                <Trash2 size={13} color="#f43f5e" />
                <Txt className="text-sm text-rose-500">{t('remove_photo')}</Txt>
              </Pressable>
            )}
          </View>
        </View>

        <View className="gap-1.5">
          <Kicker>{t('name')}</Kicker>
          <TextInput
            value={name} onChangeText={setName} maxLength={NAME_MAX} placeholder={t('name_ph')} placeholderTextColor={colors.subtle}
            className={`h-11 ${input}`} style={{ outlineStyle: 'none' } as object}
          />
        </View>
        <View className="gap-1.5">
          <View className="flex-row justify-between">
            <Kicker>{t('bio')}</Kicker>
            <Txt className="text-xs text-subtle">{bio.length}/{BIO_MAX}</Txt>
          </View>
          <TextInput
            value={bio} onChangeText={setBio} maxLength={BIO_MAX} multiline placeholder={t('bio_ph')} placeholderTextColor={colors.subtle}
            className={`py-3 ${input}`} style={{ minHeight: 84, textAlignVertical: 'top', outlineStyle: 'none' } as object}
          />
        </View>
        <Button onPress={save} className="h-12"><ButtonText>{t('save')}</ButtonText></Button>
      </View>
    </Sheet>
  );
}
