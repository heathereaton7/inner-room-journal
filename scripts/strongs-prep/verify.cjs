const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const kjv = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/kjv.json'), 'utf8'));
let mismatches = 0, checked = 0, taggedWords = 0, totalWords = 0;
const norm = s => s.replace(/\s+/g, ' ').trim();
for (let b = 0; b < 66; b++) {
  const tok = JSON.parse(fs.readFileSync(path.join(ROOT, `public/strongs/kjv/${b + 1}.json`), 'utf8'));
  const chapters = kjv[b].chapters;
  for (let c = 0; c < chapters.length; c++) {
    const verses = chapters[c];
    const tokCh = tok[c + 1] || {};
    for (let v = 0; v < verses.length; v++) {
      checked++;
      const t = tokCh[v + 1];
      if (!t) { mismatches++; if (mismatches <= 8) console.log('MISSING', kjv[b].name, (c + 1) + ':' + (v + 1)); continue; }
      for (const tk of t) { totalWords++; if (tk[3] && tk[3].length) taggedWords++; }
      const recon = t.map(x => x[0] + (x[1] || '')).join(' ');
      if (norm(recon) !== norm(verses[v])) {
        mismatches++;
        if (mismatches <= 6) {
          console.log('DIFF', kjv[b].name, (c + 1) + ':' + (v + 1));
          console.log('  kjv :', norm(verses[v]).slice(0, 100));
          console.log('  meta:', norm(recon).slice(0, 100));
        }
      }
    }
  }
}
console.log('\nVerses checked:', checked, ' mismatches:', mismatches);
console.log('Words:', totalWords, ' tagged with Strong\'s:', taggedWords, `(${(taggedWords / totalWords * 100).toFixed(1)}%)`);
