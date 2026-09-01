import type { BibleVerse } from '../types';

export type ScriptureCorpus = Record<string, string>;
export type ScriptureTranslation = { id: string; label: string; shortLabel: string; file: string; sourceFile: string; verseCount: number };

export const scriptureManifest: ScriptureTranslation[] = [
  { id: 'kjv', label: 'King James Version', shortLabel: 'KJV', file: 'kjv.json', sourceFile: 'kjv.docx', verseCount: 31102 },
  { id: 'akjv', label: 'American King James Version', shortLabel: 'AKJV', file: 'akjv.json', sourceFile: 'akjv.docx', verseCount: 31102 },
  { id: 'asv', label: 'American Standard Version', shortLabel: 'ASV', file: 'asv.json', sourceFile: 'asv.docx', verseCount: 31086 },
  { id: 'bib', label: 'Berean Interlinear Bible', shortLabel: 'BIB', file: 'bib.json', sourceFile: 'bib.docx', verseCount: 7834 },
  { id: 'blb', label: 'Berean Literal Bible', shortLabel: 'BLB', file: 'blb.json', sourceFile: 'blb.docx', verseCount: 7835 },
  { id: 'dbt', label: 'Darby Bible Translation', shortLabel: 'DBT', file: 'dbt.json', sourceFile: 'dbt.docx', verseCount: 31099 },
  { id: 'drb', label: 'Douay-Rheims Bible', shortLabel: 'DRB', file: 'drb.json', sourceFile: 'drb.docx', verseCount: 31093 },
  { id: 'erv', label: 'English Revised Version', shortLabel: 'ERV', file: 'erv.json', sourceFile: 'erv.docx', verseCount: 31086 },
  { id: 'jps', label: 'JPS Tanakh / Weymouth New Testament', shortLabel: 'JPS', file: 'jps.json', sourceFile: 'jps.docx', verseCount: 31064 },
  { id: 'slt', label: "Smith's Literal Translation", shortLabel: 'SLT', file: 'slt.json', sourceFile: 'slt.docx', verseCount: 31101 },
  { id: 'wbt', label: "Webster's Bible Translation", shortLabel: 'WBT', file: 'wbt.json', sourceFile: 'wbt.docx', verseCount: 31102 },
  { id: 'ylt', label: "Young's Literal Translation", shortLabel: 'YLT', file: 'ylt.json', sourceFile: 'ylt.docx', verseCount: 31102 },
  { id: 'geneva1560', label: 'Geneva Bible 1560', shortLabel: 'GEN', file: 'geneva1560.json', sourceFile: 'geneva_bible1560_reader.json', verseCount: 30940 }
];

const keyPattern = /^(.*) (\d+):(\d+)$/;
const speechRanges = [
  ['Matthew', 5, 7], ['Matthew', 10, 10], ['Matthew', 13, 13], ['Matthew', 18, 18], ['Matthew', 23, 25],
  ['Mark', 4, 4], ['Mark', 10, 10], ['Mark', 12, 13], ['Luke', 4, 4], ['Luke', 6, 6], ['Luke', 12, 12],
  ['John', 3, 4], ['John', 6, 6], ['John', 8, 10], ['John', 13, 17]
] as const;

export async function loadScripture(translation: ScriptureTranslation): Promise<ScriptureCorpus> {
  const response = await fetch(new URL(`scripture/${translation.file}`, document.baseURI));
  if (!response.ok) throw new Error(`Unable to load ${translation.label}`);
  return response.json() as Promise<ScriptureCorpus>;
}

export function getScriptureBooks(corpus: ScriptureCorpus): string[] {
  return Array.from(new Set(Object.keys(corpus).map((key) => key.match(keyPattern)?.[1]).filter((book): book is string => Boolean(book))));
}

export function parseBibleVerse(translationId: string, key: string, text: string): BibleVerse | null {
  const match = key.match(keyPattern);
  if (!match) return null;
  const book = match[1]; const chapter = Number(match[2]); const verse = Number(match[3]);
  const isRedLetter = speechRanges.some(([rangeBook, start, end]) => rangeBook === book && chapter >= start && chapter <= end);
  return { id: `${translationId}:${book}:${chapter}:${verse}`, book, chapter, verse, text: text.replace(/^#\s*/, ''), isRedLetter };
}

export function getBibleChapter(corpus: ScriptureCorpus, translationId: string, book: string, chapter: number): BibleVerse[] {
  return Object.entries(corpus).map(([key, text]) => parseBibleVerse(translationId, key, text)).filter((verse): verse is BibleVerse => verse !== null).filter((verse) => verse.book === book && verse.chapter === chapter).sort((a, b) => a.verse - b.verse);
}

export function searchBible(corpus: ScriptureCorpus, translationId: string, query: string): BibleVerse[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return Object.entries(corpus).map(([key, text]) => parseBibleVerse(translationId, key, text)).filter((verse): verse is BibleVerse => verse !== null).filter((verse) => `${verse.book} ${verse.chapter}:${verse.verse} ${verse.text}`.toLowerCase().includes(normalized)).slice(0, 80);
}

export function getChapterCount(corpus: ScriptureCorpus, book: string): number {
  return Math.max(...Object.keys(corpus).map((key) => parseBibleVerse('source', key, corpus[key])?.book === book ? Number(key.match(keyPattern)?.[2] ?? 0) : 0));
}

export function bibleAttribution(translation: ScriptureTranslation): string {
  return `${translation.label}, sourced locally from ${translation.sourceFile}. Scripture files are bundled for offline reading.`;
}
