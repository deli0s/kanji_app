import fs from 'node:fs/promises';
const doc = JSON.parse(await fs.readFile('data/kanji.json', 'utf8'));
if (doc.count !== 2136 || doc.kanji.length !== 2136) throw new Error(`Kanji count mismatch: ${doc.kanji.length}`);
const ids = new Set();
const chars = new Set();
for (const k of doc.kanji) {
  if (ids.has(k.id)) throw new Error(`Duplicate ID: ${k.id}`);
  if (chars.has(k.char)) throw new Error(`Duplicate character: ${k.char}`);
  if (!/^k-[0-9a-f]+$/i.test(k.id)) throw new Error(`Invalid stable ID: ${k.id}`);
  if (k.char.length !== 1) throw new Error(`Invalid character: ${k.char}`);
  if (!Array.isArray(k.meanings) || !k.meanings.length) throw new Error(`Missing meaning: ${k.char}`);
  if (!Array.isArray(k.onyomi) || !Array.isArray(k.kunyomi)) throw new Error(`Missing readings arrays: ${k.char}`);
  if (!Number.isInteger(k.strokeCount) || k.strokeCount < 1) throw new Error(`Invalid stroke count: ${k.char}`);
  if (![1,2,3,4,5].includes(k.level)) throw new Error(`Invalid level: ${k.char}`);
  ids.add(k.id); chars.add(k.char);
}
console.log('Kanji audit passed: 2,136 unique records with stable character-keyed metadata.');
