import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, Download, Share2 } from 'lucide-react-native';
import type { ExportFile, ProviderDef } from '@trackr/core';
import { useApp } from '@/providers/AppProviders';
import { saveCsv } from '@/lib/files';
import { Sheet } from '@/components/Sheet';
import { Button, ButtonText } from '@/components/Controls';
import { Txt } from '@/components/Txt';

export function ExportSheet({ p, file, onClose }: { p: ProviderDef; file: ExportFile; onClose: () => void }) {
  const { t, colors } = useApp();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(file.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Sheet onClose={onClose} title={t('export_title', { p: p.name })}>
      <View className="p-5 pt-2 gap-3">
        <Txt className="text-xs text-muted">{p.csv === 'letterboxd' ? t('export_hint_lb') : t('export_hint_generic')}</Txt>
        <Txt className="text-xs text-subtle" style={{ fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>{file.filename}</Txt>
        <ScrollView horizontal className="rounded-xl bg-sunken border border-line" style={{ maxHeight: 260 }}>
          <Txt className="p-3 text-xs" style={{ fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) }}>{file.content}</Txt>
        </ScrollView>
        <View className="flex-row gap-2">
          <Button variant="secondary" onPress={copy}>
            {copied ? <Check size={15} color={colors.fg} /> : <Copy size={15} color={colors.fg} />}
            <ButtonText variant="secondary">{copied ? t('copied') : t('copy')}</ButtonText>
          </Button>
          <Button onPress={() => saveCsv(file)} className="flex-1">
            {Platform.OS === 'web' ? <Download size={15} color={colors.accentFg} /> : <Share2 size={15} color={colors.accentFg} />}
            <ButtonText>{Platform.OS === 'web' ? t('download') : t('share')}</ButtonText>
          </Button>
        </View>
      </View>
    </Sheet>
  );
}
