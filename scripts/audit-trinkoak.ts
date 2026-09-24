import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import type { Analysis, Mood, Person, Tense } from '../packages/shared/src/index.ts';
import { defaultDatabasePath } from '../apps/api/src/database.js';

// Only the left-hand, Academy-approved whole-form paradigms in the 1979 book.
// The facing construction charts and their grammatical labels are the editor's,
// so this audit does not infer a mood from the book's N1/N2/... labels.
const pdf = process.argv[2];
if (!pdf) throw new Error('Erabilera: npm run audit:trinkoak -- /bidea/euskal-aditz-batua.pdf');
const pages = execFileSync('pdftotext', ['-layout', pdf, '-'], {
  encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
}).split('\f');
const db = new DatabaseSync(defaultDatabasePath(), { readOnly: true });
const lookup = db.prepare('SELECT payload FROM analyses WHERE form=? AND variety=?');
const seven: Person[] = ['ni', 'hi', 'hura', 'gu', 'zu', 'zuek', 'haiek'];
const imperative: Person[] = ['hi', 'hura', 'zu', 'zuek', 'haiek'];
type Series = 'N1' | 'N2' | 'N3' | 'N4' | "N4'" | 'N5' | 'N7' | 'N9' | 'N10';
type Page = { number: number; lemma: string; layout: 'n1n2' | 'n1n2parallel' | 'n3n4' | 'n4n9' | 'n5n7n9' | 'n5' | 'n7n9' | 'n10' };
const pageSpecs: Page[] = [
  { number: 118, lemma: 'egon', layout: 'n1n2' },
  { number: 120, lemma: 'egon', layout: 'n3n4' },
  { number: 122, lemma: 'egon', layout: 'n5' },
  { number: 124, lemma: 'egon', layout: 'n7n9' },
  { number: 126, lemma: 'egon', layout: 'n10' },
  { number: 146, lemma: 'joan', layout: 'n1n2' },
  { number: 148, lemma: 'joan', layout: 'n3n4' },
  { number: 150, lemma: 'joan', layout: 'n5n7n9' },
  { number: 152, lemma: 'joan', layout: 'n10' },
  { number: 172, lemma: 'etorri', layout: 'n1n2' },
  { number: 174, lemma: 'etorri', layout: 'n3n4' },
  { number: 176, lemma: 'etorri', layout: 'n5n7n9' },
  { number: 178, lemma: 'etorri', layout: 'n10' },
  { number: 198, lemma: 'ibili', layout: 'n1n2' },
  { number: 200, lemma: 'ibili', layout: 'n3n4' },
  { number: 202, lemma: 'ibili', layout: 'n5n7n9' },
  { number: 204, lemma: 'ibili', layout: 'n10' },
  { number: 244, lemma: 'etzan', layout: 'n1n2parallel' },
  { number: 246, lemma: 'etzan', layout: 'n4n9' },
];
type Row = { label: string; first: string; second: string | null };
const failures: string[] = [];
let checked = 0;
const moods: Partial<Record<Series, { mood: Mood; tense: Tense }>> = {
  N1: { mood: 'indicative', tense: 'present' },
  N2: { mood: 'indicative', tense: 'past' },
  N3: { mood: 'conditional', tense: 'hypothetical' },
  N4: { mood: 'consequence', tense: 'present' },
  N5: { mood: 'potential', tense: 'present' },
  N9: { mood: 'imperative', tense: 'present' },
  // N10 has an indicative reading in the imported lexicon. N4' and N7
  // also have multiple interpretations; their mood is deliberately not fixed.
};
function audit(page: Page, series: Series, form: string, nor: Person) {
  // One OCR glyph on PDF p. 172 reads nentorrcn for nentorren.
  if (page.number === 172 && form === 'nentorrcn') form = 'nentorren';
  checked++;
  const analyses = (lookup.all(form, 'batua') as { payload: string }[])
    .map(row => JSON.parse(row.payload) as Analysis);
  const expected = moods[series];
  if (!analyses.some(a => a.lemma === page.lemma && a.kind === 'synthetic' &&
    a.type === 'nor' && a.nor === nor && a.nori === null && a.nork === null &&
    a.treatment === 'neutral' && (!expected || (a.mood === expected.mood && a.tense === expected.tense)))) {
    failures.push(`PDF ${page.number}, ${page.lemma} ${series}, ${nor}: ${form}`);
  }
}
function auditRows(page: Page, rows: Row[], series: Series, start: number, count: number, column: 'first' | 'second' = 'first') {
  const people = series === 'N9' ? imperative : seven;
  if (count !== people.length) throw new Error(`Barne-errorea: ${series} luzera`);
  for (let i = 0; i < count; i++) {
    const row = rows[start + i];
    if (!row) { failures.push(`PDF ${page.number}: ${series} ${i + 1}. lerroa falta da`); continue; }
    // N9 is often the second column alongside N7, so its row labels do not
    // correspond to the left-hand N7 subject row.
    if (column === 'first' && row.label !== ['1', '2', '3', '1', '2', "2'", '3'][i] &&
      !(series === 'N9' && row.label === ['2', '3', '2', "2'", '3'][i]))
      failures.push(`PDF ${page.number}: ${series} ${i + 1}. pertsona-etiketa: ${row.label}`);
    const form = row[column];
    if (!form) { failures.push(`PDF ${page.number}: ${series} ${i + 1}. adizkia falta da`); continue; }
    audit(page, series, form, people[i]);
  }
}
for (const page of pageSpecs) {
  const source = pages[page.number - 1];
  if (!source) { failures.push(`PDF ${page.number}: orrialdea falta da`); continue; }
  const rows: Row[] = [...source.matchAll(/^\s*'?([123](?:')?)\s+([a-z]{2,})([^\n]*)/gm)]
    .map(match => ({
      label: match[1], first: match[2],
      second: /\b[123](?:')?\s+([a-z]{2,})/.exec(match[3])?.[1] ?? null,
    }));
  const expectedRows = { n1n2: 14, n1n2parallel: 7, n3n4: 14, n4n9: 12, n5n7n9: 19, n5: 7, n7n9: 12, n10: 7 }[page.layout];
  // ETORRI p. 176 sets N7 and N9 in parallel columns, giving 14 physical rows.
  const parallel = page.number === 176;
  if (rows.length !== (parallel ? 14 : expectedRows)) {
    failures.push(`PDF ${page.number}: ${rows.length} lerro (espero ziren ${parallel ? 14 : expectedRows})`);
    continue;
  }
  if (page.layout === 'n1n2') {
    auditRows(page, rows, 'N1', 0, 7);
    auditRows(page, rows, 'N2', 7, 7);
  } else if (page.layout === 'n1n2parallel') {
    auditRows(page, rows, 'N1', 0, 7);
    auditRows(page, rows, 'N2', 0, 7, 'second');
  } else if (page.layout === 'n3n4') {
    auditRows(page, rows, 'N3', 0, 7);
    auditRows(page, rows, 'N4', 7, 7);
    auditRows(page, rows, "N4'", 7, 7, 'second');
  } else if (page.layout === 'n10') {
    auditRows(page, rows, 'N10', 0, 7);
  } else if (page.layout === 'n4n9') {
    auditRows(page, rows, 'N4', 0, 7);
    auditRows(page, rows, 'N9', 7, 5);
  } else {
    const offset = page.layout === 'n5n7n9' ? 7 : 0;
    if (offset) auditRows(page, rows, 'N5', 0, 7);
    if (page.layout !== 'n5') {
      auditRows(page, rows, 'N7', offset, 7);
      if (parallel) {
        // The first N7 row has no N9 counterpart; the next five do.
        for (let i = 0; i < 5; i++) {
          const form = rows[offset + i + 1]?.second;
          if (!form) failures.push(`PDF ${page.number}: N9 ${i + 1}. adizkia falta da`);
          else audit(page, 'N9', form, imperative[i]);
        }
      } else auditRows(page, rows, 'N9', offset + 7, 5);
    }
  }
}
db.close();
console.log(`${pageSpecs.length} paradigma-orri ofizial, ${checked} adizki-agerpen, ${failures.length} hutsune/desadostasun`);
if (failures.length) { for (const failure of failures.slice(0, 100)) console.error(failure); process.exitCode = 1; }
