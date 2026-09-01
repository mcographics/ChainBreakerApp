import fs from 'node:fs/promises';
import path from 'node:path';
import mammoth from 'mammoth';

const root = process.cwd();
const sourceDir = path.join(root, 'scripture');
const outputDir = path.join(root, 'public', 'scripture');
const bookNames = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
  '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
  'Ecclesiastes', 'Psalm', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
  'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude', 'Revelation'
];
const chapterPattern = new RegExp(`^(${bookNames.map((name) => name.replaceAll(' ', '\\s+')).join('|')})\\s+(\\d+)$`);
const verseStart = /^(\d{1,3})\s+(.+)$/;

const translations = [
  ['kjv', 'King James Version', 'KJV', 'kjv.docx'],
  ['akjv', 'American King James Version', 'AKJV', 'akjv.docx'],
  ['asv', 'American Standard Version', 'ASV', 'asv.docx'],
  ['bib', 'Berean Interlinear Bible', 'BIB', 'bib.docx'],
  ['blb', 'Berean Literal Bible', 'BLB', 'blb.docx'],
  ['dbt', 'Darby Bible Translation', 'DBT', 'dbt.docx'],
  ['drb', 'Douay-Rheims Bible', 'DRB', 'drb.docx'],
  ['erv', 'English Revised Version', 'ERV', 'erv.docx'],
  ['jps', 'JPS Tanakh / Weymouth New Testament', 'JPS', 'jps.docx'],
  ['slt', "Smith's Literal Translation", 'SLT', 'slt.docx'],
  ['wbt', "Webster's Bible Translation", 'WBT', 'wbt.docx'],
  ['ylt', "Young's Literal Translation", 'YLT', 'ylt.docx'],
  ['geneva1560', 'Geneva Bible 1560', 'GEN', 'geneva_bible1560_reader.json']
];
const requestedIds = new Set(process.argv.slice(2));
const selectedTranslations = requestedIds.size ? translations.filter(([id]) => requestedIds.has(id)) : translations;

function clean(value) {
  return value.replaceAll('\u202f', ' ').replaceAll('\u00a0', ' ').replace(/\s+/g, ' ').trim();
}

function addVerse(result, book, chapter, verse, text) {
  if (!book || !chapter || !verse || !text) return;
  result[`${book} ${chapter}:${verse}`] = text.replace(/^#\s*/, '').trim();
}

function parseDocxText(rawText) {
  const result = {};
  let currentBook = '';
  let currentChapter = 0;
  for (const originalLine of rawText.split(/\r?\n/)) {
    const line = clean(originalLine);
    if (!line) continue;
    const chapter = line.match(chapterPattern);
    if (chapter) {
      currentBook = chapter[1] === 'Psalm' ? 'Psalms' : chapter[1];
      currentChapter = Number(chapter[2]);
      continue;
    }
    const firstVerse = line.match(verseStart);
    if (!firstVerse || !currentBook || !currentChapter) continue;
    const matches = [...line.matchAll(/(?:^|\s)(\d{1,3})\s+/g)];
    let accepted = matches.filter((match, index) => index === 0 || Number(match[1]) > Number(matches[index - 1][1]));
    if (!accepted.length) accepted = [firstVerse];
    for (let index = 0; index < accepted.length; index += 1) {
      const match = accepted[index];
      const start = match.index + match[0].length - (match[0].startsWith(' ') ? 0 : 0);
      const end = index + 1 < accepted.length ? accepted[index + 1].index : line.length;
      const text = line.slice(start, end).trim();
      addVerse(result, currentBook, currentChapter, Number(match[1]), text);
    }
  }
  return result;
}

function parseGeneva(json) {
  const result = {};
  for (const [book, bookData] of Object.entries(json)) {
    for (const [chapter, chapterData] of Object.entries(bookData.chapters ?? {})) {
      for (const verse of chapterData.verses ?? []) addVerse(result, book, Number(chapter), verse.num, verse.text);
    }
  }
  return result;
}

async function readSource(file) {
  if (file.endsWith('.json')) return parseGeneva(JSON.parse(await fs.readFile(path.join(sourceDir, file), 'utf8')));
  const extracted = await mammoth.extractRawText({ path: path.join(sourceDir, file) });
  return parseDocxText(extracted.value);
}

await fs.mkdir(outputDir, { recursive: true });
const manifestPath = path.join(outputDir, 'manifest.json');
let manifest = [];
try { manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')).translations ?? []; } catch { manifest = []; }
for (const [id, label, shortLabel, sourceFile] of selectedTranslations) {
  const verses = await readSource(sourceFile);
  const outputFile = `${id}.json`;
  await fs.writeFile(path.join(outputDir, outputFile), `${JSON.stringify(verses)}\n`, 'utf8');
  manifest = manifest.filter((item) => item.id !== id);
  manifest.push({ id, label, shortLabel, file: outputFile, sourceFile, verseCount: Object.keys(verses).length });
  console.log(`${shortLabel}: ${Object.keys(verses).length} verses from ${sourceFile}`);
}
await fs.writeFile(manifestPath, `${JSON.stringify({ version: 1, translations: manifest.sort((a, b) => translations.findIndex(([id]) => id === a.id) - translations.findIndex(([id]) => id === b.id)) }, null, 2)}\n`, 'utf8');
