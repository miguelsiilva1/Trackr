import * as ImagePicker from 'expo-image-picker';

/** Opens the photo library; resolves a data URI (kept in the store, so it survives restarts) or null when cancelled. */
export async function pickImage(aspect: [number, number]): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect, quality: 0.6, base64: true });
  if (res.canceled) return null;
  const a = res.assets[0];
  return a.base64 ? `data:${a.mimeType ?? 'image/jpeg'};base64,${a.base64}` : a.uri;
}
