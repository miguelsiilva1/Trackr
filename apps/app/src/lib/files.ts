import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import type { ExportFile } from '@trackr/core';

/** Native: pick one or more CSV files and read them as text. Web version lives in files.web.ts. */
export async function pickCsvFiles(): Promise<{ name: string; text: string }[]> {
  const res = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/plain'], multiple: true, copyToCacheDirectory: true,
  });
  if (res.canceled) return [];
  return Promise.all(res.assets.map(async a => ({ name: a.name, text: await new File(a.uri).text() })));
}

/** Native: write the CSV to the cache and open the system share sheet. */
export async function saveCsv(file: ExportFile): Promise<boolean> {
  const out = new File(Paths.cache, file.filename);
  if (out.exists) out.delete();
  out.create();
  await out.write(file.content);
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(out.uri, { mimeType: 'text/csv', dialogTitle: file.filename, UTI: 'public.comma-separated-values-text' });
  return true;
}
