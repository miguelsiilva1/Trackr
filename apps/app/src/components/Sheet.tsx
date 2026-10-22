import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { vars } from 'nativewind';
import { X } from 'lucide-react-native';
import { useApp } from '@/providers/AppProviders';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { cssVars } from '@/theme/tokens';
import { Txt } from './Txt';

/**
 * Bottom sheet on phones, centered dialog on wide screens.
 * RN Modal renders in a new root, so the theme variables are re-applied here.
 */
export function Sheet({ visible = true, onClose, title, children, wide = false, scroll = true }: {
  visible?: boolean; onClose: () => void; title?: React.ReactNode; children: React.ReactNode; wide?: boolean; scroll?: boolean;
}) {
  const { theme, colors, t } = useApp();
  const { wide: wideScreen } = useBreakpoint();
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;

  return (
    <Modal visible={visible} transparent animationType={wideScreen ? 'fade' : 'slide'} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[{ flex: 1 }, vars(cssVars(theme))]}>
        <Pressable onPress={onClose} className={`flex-1 bg-black/70 ${wideScreen ? 'items-center justify-center p-6' : 'justify-end'}`}>
          <Pressable
            onPress={e => e.stopPropagation()}
            className={`bg-surface border border-line overflow-hidden ${wideScreen ? 'rounded-3xl w-full' : 'rounded-t-3xl'}`}
            style={{ maxHeight: '92%', maxWidth: wideScreen ? (wide ? 768 : 576) : undefined, paddingBottom: wideScreen ? 0 : insets.bottom }}
          >
            {!wideScreen && <View className="items-center pt-2 pb-1"><View className="w-10 h-1 rounded-full bg-surface2" /></View>}
            {title !== undefined && (
              <View className="flex-row items-center justify-between gap-3 px-5 pt-4 pb-2">
                <View className="flex-1">{typeof title === 'string' ? <Txt className="text-lg font-bold">{title}</Txt> : title}</View>
                <Pressable onPress={onClose} accessibilityLabel={t('close')} className="w-8 h-8 rounded-full bg-surface2 items-center justify-center">
                  <X size={16} color={colors.fg} />
                </Pressable>
              </View>
            )}
            <Body keyboardShouldPersistTaps="handled">{children}</Body>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
