import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data', 'kanji.json');
const JOYO_URL = 'https://raw.githubusercontent.com/jkindrix/japanese-language-data/main/data/core/kanji-joyo.json';
const WORDS_URL = 'https://raw.githubusercontent.com/jkindrix/japanese-language-data/main/data/core/words.json';
const JLPT_URL = 'https://raw.githubusercontent.com/jkindrix/japanese-language-data/main/data/enrichment/jlpt-classifications.json';

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'kanji-kori-build/1.0' } });
  if (!r.ok) throw new Error(`Failed to download ${url}: HTTP ${r.status}`);
  return r.json();
}

const joyo = await getJson(JOYO_URL);
const wordsDoc = await getJson(WORDS_URL);
const jlptDoc = await getJson(JLPT_URL);

if (!Array.isArray(joyo.kanji) || joyo.kanji.length !== 2136) {
  throw new Error(`Expected exactly 2,136 Jōyō kanji, got ${joyo.kanji?.length ?? 0}`);
}

const words = wordsDoc.words || wordsDoc.entries || (Array.isArray(wordsDoc) ? wordsDoc : []);
const classifications = jlptDoc.classifications || [];
const jlptMap = new Map(
  classifications
    .filter(x => x.kind === 'kanji' && /^N[1-5]$/.test(x.level))
    .map(x => [x.text, x.level])
);

function levelFor(k, index) {
  const jlpt = jlptMap.get(k.character) || k.jlpt_waller;
  if (/^N[1-5]$/.test(jlpt || '')) return Number(jlpt[1]);
  const grade = k.grade;
  if (grade === 1) return 5;
  if (grade === 2) return 4;
  if (grade === 3) return 3;
  if (grade === 4 || grade === 5) return 2;
  if (grade === 6 || grade === 8) return 1;
  return index < 103 ? 5 : index < 284 ? 4 : index < 654 ? 3 : index < 1024 ? 2 : 1;
}

function textOfMeaning(sense) {
  if (!sense) return '';
  if (typeof sense === 'string') return sense;
  const g = sense.glosses ?? sense.gloss ?? sense.translations;
  if (Array.isArray(g)) return g.map(x => typeof x === 'string' ? x : x.text || x.gloss || x.value || '').filter(Boolean);
  return [];
}

function wordText(w) {
  const ws = w.kanji || w.writings || w.variants || [];
  return ws.map(x => typeof x === 'string' ? x : x.text || x.written || '').filter(Boolean);
}
function wordReading(w) {
  const ks = w.kana || w.readings || w.pronunciations || [];
  const x = ks[0];
  return typeof x === 'string' ? x : x?.text || x?.pronounced || '';
}
function wordMeanings(w) {
  const senses = w.senses || w.meanings || [];
  const out = [];
  for (const s of senses) {
    const m = textOfMeaning(s);
    if (Array.isArray(m)) out.push(...m);
    else if (m) out.push(m);
  }
  return [...new Set(out)].slice(0, 3);
}

const byKanji = new Map([...joyo.kanji].map(k => [k.character, []]));
for (const w of words) {
  const written = wordText(w);
  if (!written.length) continue;
  const reading = wordReading(w);
  const meanings = wordMeanings(w);
  if (!meanings.length) continue;
  const charsInWord = [...new Set(written.join('').split(''))];
  for (const char of charsInWord) {
    const bucket = byKanji.get(char);
    if (!bucket || bucket.length >= 6) continue;
    const word = written.find(x => x.includes(char));
    const id = String(w.id ?? w.seq ?? word);
    if (bucket.some(x => x.id === id)) continue;
    bucket.push({ id, word, reading, meaning: meanings[0] });
  }
}

const kanji = joyo.kanji.map((k, index) => ({
  id: `k-${k.unicode || k.character.codePointAt(0).toString(16)}`,
  char: k.character,
  meanings: (k.meanings?.es?.length ? k.meanings.es : k.meanings?.en || []).slice(0, 8),
  meaningsEn: (k.meanings?.en || []).slice(0, 8),
  onyomi: (k.readings?.on || []).map(x => x.replace(/\./g, '')),
  kunyomi: (k.readings?.kun || []).map(x => x.replace(/\./g, '')),
  level: levelFor(k, index),
  jlpt: jlptMap.get(k.character) || k.jlpt_waller || null,
  grade: k.grade ?? null,
  strokes: [],
  strokeCount: k.stroke_count,
  components: k.radical_components || [],
  radical: k.radical?.classical ?? null,
  frequency: k.frequency ?? null,
  vocabulary: byKanji.get(k.character) || [],
  available: true
}));

const ids = new Set();
const chars = new Set();
for (const k of kanji) {
  if (ids.has(k.id)) throw new Error(`Duplicate kanji id: ${k.id}`);
  if (chars.has(k.char)) throw new Error(`Duplicate kanji character: ${k.char}`);
  if (!k.char || !k.strokeCount || !k.meanings.length || !k.onyomi.length && !k.kunyomi.length) {
    throw new Error(`Incomplete authoritative record: ${JSON.stringify(k)}`);
  }
  ids.add(k.id); chars.add(k.char);
}

await fs.writeFile(OUT, JSON.stringify({
  version: 1,
  count: kanji.length,
  source: {
    kanji: JOYO_URL,
    vocabulary: WORDS_URL,
    jlpt: JLPT_URL
  },
  license: 'CC-BY-SA 4.0 / EDRDG-derived data',
  kanji
}, null, 0));

console.log(`Generated ${kanji.length} verified Jōyō kanji records.`);
