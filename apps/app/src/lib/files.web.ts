import * as DocumentPicker from 'expo-document-picker';
import type { ExportFile } from '@trackr/core';

/** Web: pick CSV files through the browser file dialog. */
export async function pickCsvFiles(): Promise<{ name: string; text: string }[]> {
  const res = await DocumentPicker.getDocumentAsync({ type: ['.csv', 'text/csv'], multiple: true });
  if (res.canceled) return [];
  return Promise.all(res.assets.map(async a => ({
    name: a.name,
    text: a.file ? await a.file.text() : await (await fetch(a.uri)).text(),
  })));
}

/** Web: trigger a browser download. */
export async function saveCsv(file: ExportFile): Promise<boolean> {
  try {
    const url = URL.createObjectURL(new Blob([file.content], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
