/**
 * ONE-TIME data build for the original-language word-study feature.
 *
 * Inputs (downloaded into ./raw):
 *   - hebrew.js / greek.js   OpenScriptures Strong's dictionaries (CC-BY-SA)
 *   - Strongs.csv            MetaV dictionary (used only for PartOfSpeech)
 *   - StrongsIndex.csv       MetaV: WordID -> Strong's id(s)
 *   - MainIndex.csv          MetaV: every KJV word (1769 Cambridge, public domain)
 *
 * Outputs (written into ../../public/strongs):
 *   - hebrew.json            { "H7225": {w,x,p,s,d,k,pos}, ... }
 *   - greek.json             { "G3056": {w,x,p,s,d,k,pos}, ... }
 *   - kjv/<bookId>.json      { "<chap>": { "<verse>": [ [word,punc,italic,[strongs]], ... ] } }
 *
 * Field keys are short to keep the bundle small:
 *   w original word   x transliteration   p pronunciation
 *   s short def       d derivation        k KJV renderings   pos part of speech
 */
const fs = require('fs');
const path = require('path');

const RAW = path.join(__dirname, 'raw');
const OUT = path.join(__dirname, '..', '..', 'public', 'strongs');
const OUT_KJV = path.join(OUT, 'kjv');
fs.mkdirSync(OUT_KJV, { recursive: true });

// All MetaV CSV fields are quoted and separated by `","`, so we can split on
// that delimiter after stripping the outer quotes. (No field contains `","`.)
function splitCsvLine(line) {
  if (!line) return null;
  const trimmed = line.replace(/\r$/, '');
  if (trimmed.length < 2) return null;
  return trimmed.slice(1, -1).split('","');
}

// ---- 1. OpenScriptures dictionaries ------------------------------------
function loadOSDict(file) {
  const raw = fs.readFileSync(path.join(RAW, file), 'utf8');
  const json = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1);
  return JSON.parse(json);
}
const H = loadOSDict('hebrew.js');
const G = loadOSDict('greek.js');

// ---- 2. MetaV part-of-speech map ---------------------------------------
const posMap = new Map(); // StrongsID -> PartOfSpeech
{
  const lines = fs.readFileSync(path.join(RAW, 'Strongs.csv'), 'utf8').split('\n');
  for (let i = 1; i < lines.length; i++) {
    const f = splitCsvLine(lines[i]);
    if (!f) continue;
    const id = f[0];
    const pos = (f[5] || '').trim();
    if (id) posMap.set(id, pos);
  }
}

function cleanDerivation(d) {
  return (d || '').replace(/^[\s;]+|[\s;]+$/g, '').trim();
}
function buildDict(src, prefix) {
  const out = {};
  for (const id in src) {
    const e = src[id];
    out[id] = {
      w: e.lemma || '',
      x: e.xlit || e.translit || '',
      p: e.pron || '',                 // Greek has none -> ''
      s: (e.strongs_def || '').trim(),
      d: cleanDerivation(e.derivation),
      k: (e.kjv_def || '').trim(),
      pos: posMap.get(id) || '',
    };
  }
  return out;
}
const hebrewDict = buildDict(H, 'H');
const greekDict = buildDict(G, 'G');
fs.writeFileSync(path.join(OUT, 'hebrew.json'), JSON.stringify(hebrewDict));
fs.writeFileSync(path.join(OUT, 'greek.json'), JSON.stringify(greekDict));

// ---- 3. WordID -> Strong's id(s) ---------------------------------------
const wordStrongs = new Map(); // WordID -> [ids]
{
  const lines = fs.readFileSync(path.join(RAW, 'StrongsIndex.csv'), 'utf8').split('\n');
  for (let i = 1; i < lines.length; i++) {
    const f = splitCsvLine(lines[i]);
    if (!f) continue;
    const wid = f[0];
    const sid = (f[1] || '').trim();
    if (!wid || !sid) continue;
    let arr = wordStrongs.get(wid);
    if (!arr) { arr = []; wordStrongs.set(wid, arr); }
    arr.push(sid);
  }
}

// ---- 4. MainIndex -> per-book tagged tokens ----------------------------
const books = {}; // bookId -> { chap -> { verse -> [tokens] } }
{
  const data = fs.readFileSync(path.join(RAW, 'MainIndex.csv'), 'utf8');
  let start = data.indexOf('\n') + 1; // skip header
  let pos = start;
  const n = data.length;
  while (pos < n) {
    let nl = data.indexOf('\n', pos);
    if (nl === -1) nl = n;
    const line = data.slice(pos, nl);
    pos = nl + 1;
    const f = splitCsvLine(line);
    if (!f) continue;
    const bookId = f[0], chap = f[1], verse = f[5], wordId = f[7];
    // Prettify word-internal straight apostrophe to curly to match kjv.json typography.
    const bare = (f[8] || '').replace(/'/g, '\u2019');
    const cParen = f[11] === '-1', oParen = f[12] === '-1';
    const word = (oParen ? '(' : '') + bare;
    const punc = (f[9] || '') + (cParen ? ')' : ''), italic = f[10] === '-1' ? 1 : 0;
    const strongs = wordStrongs.get(wordId) || [];
    const book = books[bookId] || (books[bookId] = {});
    const ch = book[chap] || (book[chap] = {});
    const vs = ch[verse] || (ch[verse] = []);
    vs.push([word, punc, italic, strongs]);
  }
}

// Trim empty trailing fields per token to shrink the JSON.
function trimToken(t) {
  const [w, p, it, s] = t;
  if (s && s.length) return [w, p, it, s];
  if (it) return [w, p, it];
  if (p) return [w, p];
  return [w];
}

let totalWords = 0;
for (const bookId in books) {
  const book = books[bookId];
  for (const chap in book) {
    for (const verse in book[chap]) {
      const arr = book[chap][verse];
      totalWords += arr.length;
      book[chap][verse] = arr.map(trimToken);
    }
  }
  fs.writeFileSync(path.join(OUT_KJV, bookId + '.json'), JSON.stringify(book));
}

// ---- 5. Report + sanity check ------------------------------------------
function reconstruct(bookId, chap, verse) {
  const arr = books[bookId][chap][verse];
  return arr.map(t => t[0] + (t[1] || '')).join(' ')
    .replace(/\s+([,.;:!?])/g, '$1'); // tidy spaces before punctuation
}
console.log('Hebrew dict entries:', Object.keys(hebrewDict).length);
console.log('Greek dict entries :', Object.keys(greekDict).length);
console.log('Books written      :', Object.keys(books).length);
console.log('Total KJV words    :', totalWords);
console.log('\nGenesis 1:1 reconstructed:\n  ' + reconstruct('1', '1', '1'));
console.log('\nGenesis 1:1 tokens (first 5):');
console.log('  ' + JSON.stringify(books['1']['1']['1'].slice(0, 5)));
console.log('\nJohn 1:1 reconstructed:\n  ' + reconstruct('43', '1', '1'));
console.log('\nJohn 1:1 tokens (first 6):');
console.log('  ' + JSON.stringify(books['43']['1']['1'].slice(0, 6)));
