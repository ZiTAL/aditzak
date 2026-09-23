import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import type { Analysis, Mood, Person, Tense } from '../packages/shared/src/index.ts';
import { defaultDatabasePath } from '../apps/api/src/database.js';

// Rule 78's clearly aligned indicative/consequence and potential tables.
// Subjunctive and imperative tables need a separate parser.
const pdf = process.argv[2];
if (!pdf) throw new Error('Erabilera: npm run audit:laguntzaile:semantika -- /bidea/Araua_0078.pdf');
const pages = execFileSync('pdftotext', ['-layout', pdf, '-'], {
  encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
}).split('\f');
const db = new DatabaseSync(defaultDatabasePath(), { readOnly: true });
const lookup = db.prepare('SELECT payload FROM analyses WHERE form=? AND variety=?');
const persons: Person[] = ['ni', 'hi', 'hura', 'gu', 'zu', 'zuek', 'haiek'];
const columns: { mood: Mood; tense: Tense }[] = [
  { mood: 'indicative', tense: 'present' }, // A-1
  { mood: 'indicative', tense: 'past' }, // B-1
  { mood: 'conditional', tense: 'hypothetical' }, // B-4
  { mood: 'probability', tense: 'present' }, // A-2
  { mood: 'probability', tense: 'past' }, // B-3
  { mood: 'consequence', tense: 'present' }, // B-2
];
const potentialColumns: { mood: Mood; tense: Tense }[] = [
  { mood: 'potential', tense: 'present' }, // A-4 or A-5
  { mood: 'potential', tense: 'past' }, // B-8
  { mood: 'potential', tense: 'hypothetical' }, // B-7
];
const subjunctiveColumns: { mood: Mood; tense: Tense }[] = [
  { mood: 'subjunctive', tense: 'present' }, // A-3
  { mood: 'subjunctive', tense: 'present' }, // A-4, ba-
  { mood: 'subjunctive', tense: 'present' }, // A-4, -la
  { mood: 'subjunctive', tense: 'past' }, // B-5
  { mood: 'subjunctive', tense: 'past' }, // B-5, -la
  { mood: 'subjunctive', tense: 'hypothetical' }, // B-5
  { mood: 'subjunctive', tense: 'hypothetical' }, // B-6, ba-
];
type Group = { page: number; lemma: string; type: Analysis['type']; fixed?: Person; nork?: Person; width: 3 | 6 | 7; series: 'indicative' | 'potential' | 'subjunctive' };
const groups: Group[] = [
  { page: 7, lemma: 'izan', type: 'nor', width: 3, series: 'indicative' },
  { page: 8, lemma: 'edin', type: 'nor', width: 3, series: 'potential' },
  ...persons.map((fixed, i): Group => ({ page: 10 + i, lemma: 'izan', type: 'nor-nori', fixed, width: 3, series: 'indicative' })),
  ...persons.map((fixed, i): Group => ({ page: 27 + i, lemma: 'ukan', type: 'nor-nork', fixed, width: 3, series: 'indicative' })),
  ...persons.map((nork, i): Group => ({ page: 44 + i, lemma: 'ukan', type: 'nor-nori-nork', nork, width: 6, series: 'indicative' })),
  ...persons.map((fixed, i): Group => ({ page: 18 + i, lemma: 'edin', type: 'nor-nori', fixed, width: 3, series: 'potential' })),
  ...persons.map((fixed, i): Group => ({ page: 18 + i, lemma: 'edin', type: 'nor-nori', fixed, width: 7, series: 'subjunctive' })),
  ...persons.map((fixed, i): Group => ({ page: 35 + i, lemma: 'ezan', type: 'nor-nork', fixed, width: 3, series: 'potential' })),
  ...persons.map((fixed, i): Group => ({ page: 35 + i, lemma: 'ezan', type: 'nor-nork', fixed, width: 7, series: 'subjunctive' })),
  ...persons.map((nork, i): Group => ({ page: 52 + i, lemma: 'ezan', type: 'nor-nori-nork', fixed: 'hura', nork, width: 3, series: 'potential' })),
  ...persons.map((nork, i): Group => ({ page: 52 + i, lemma: 'ezan', type: 'nor-nori-nork', fixed: 'hura', nork, width: 7, series: 'subjunctive' })),
  ...persons.slice(1).flatMap((nork, i): Group[] => i===2?[]:[{ page: 60 + i, lemma: 'ezan', type: 'nor-nori-nork', fixed: 'haiek', nork, width: 7, series: 'subjunctive' }]),
  ...persons.slice(1).map((nork, i): Group => ({ page: 60 + i, lemma: 'ezan', type: 'nor-nori-nork', fixed: 'haiek', nork, width: 3, series: 'potential' })),
];
const failures: string[] = [];
let checked = 0;
let cells = 0;
let blankCells = 0;
for (const group of groups) {
  const pageText = pages[group.page - 1];
  // The printed page number separates morpheme diagrams from whole-form tables.
  const footer = /[-–]\s*\d+\s*[-–]/.exec(pageText);
  if (!footer) { failures.push(`PDF ${group.page}: orrialde-oina falta da`); continue; }
  let table = pageText.slice(footer.index + footer[0].length);
  // Printed page 8 wraps zaitezkete across two physical lines and leaves
  // the HAIEK A-5 cell blank. Do not synthesize a source cell in the audit.
  if (group.page === 8) table = table.replace(
    /(\s+)zaitez-(\s{2,}zintezketen\s{2,}zintezkete)\n(\s+)kete(\s{2,}zitezkeen\s{2,}litezke)/,
    '$1zaitezkete$2\n$3------$4',
  );
  // Page 18 prints the NORI=GU row in four staggered fragments.
  if (group.page === 18 && group.series === 'subjunctive') table = table.replace(
    /[ \t]*- ahala[ \t]+nakizun[ \t]+banakizu[\s\S]*?nakizula[ \t]+nenkizun[^\n]*\n/,
    '\n  ------    ------    ------    ------    ------    ------    ------\n  nakizun    banakizu    nakizula    nenkizun    nenkizula    nenkizun    banenkizu\n',
  );
  const lines = table.split('\n');
  let section = -1;
  let row = 0;
  for (const raw of lines) {
    const line = raw.trim().replace(/^[+-]\s*ahala\s+/, '');
    if (group.series === 'indicative' && /^A-1\s+B-1\s+B-4(?:\s+A-1\s+B-1\s+B-4)?$/.test(line)) {
      section = 0; row = 0; continue;
    }
    if (group.series === 'indicative' && /^A-2\s+B-3\s+B-2(?:\s+A-2\s+B-3\s+B-2)?$/.test(line)) {
      if (section !== 0 || row !== 7) failures.push(`PDF ${group.page}: lehen sailak ${row} lerro ditu`);
      section = 1; row = 0; continue;
    }
    if (group.series === 'potential' && /^A-[45]\s+B-8\s+B-7$/.test(line)) {
      section = 0; row = 0; continue;
    }
    if (group.series === 'subjunctive' && /^A-3\s+A-[45]\s+B-5\s+B-5\s+B-6$/.test(line)) {
      section = 0; row = 0; continue;
    }
    if (section < 0 || row >= 7) continue;
    let values = line.split(/\s{2,}/).filter(Boolean);
    // A few PDF rows join two adjacent cells with a single space.
    if (values.length === group.width - 1) values = values.flatMap(v => v.includes(' ') ? v.split(' ') : [v]);
    if (values.length !== group.width || !values.every(v => /^(?:[a-zñü()]+(?:\/[a-zñü()]+)*|-{3,})$/.test(v))) continue;
    for (let col = 0; col < values.length; col++) {
      const cell = values[col];
      if (/^-+$/.test(cell)) { blankCells++; continue; }
      const { mood, tense } = group.series === 'potential' ? potentialColumns[col % 3] : group.series === 'subjunctive' ? subjunctiveColumns[col] : columns[section * 3 + col % 3];
      const expected = {
        lemma: group.lemma, kind: 'auxiliary', type: group.type, mood, tense,
        nor: group.type === 'nor' ? persons[row] : group.type === 'nor-nori-nork' ? (group.fixed ?? (col < 3 ? 'hura' : 'haiek')) : group.fixed,
        nori: group.type === 'nor-nori' || group.type === 'nor-nori-nork' ? persons[row] : null,
        nork: group.type === 'nor-nork' ? persons[row] : group.nork ?? null,
      };
      cells++;
      const forms = cell.split('/').flatMap(v => v.includes('(te)') ? [v.replace('(te)', ''), v.replace('(te)', 'te')] : [v]);
      for (const form of forms) {
        checked++;
        const analyses = (lookup.all(form, 'batua') as { payload: string }[]).map(r => JSON.parse(r.payload) as Analysis);
        if (!analyses.some(a => Object.entries(expected).every(([key, value]) => a[key as keyof Analysis] === value))) {
          failures.push(`PDF ${group.page}, ${group.series === 'potential' ? 'A-4/A-5/B-8/B-7' : group.series === 'subjunctive' ? 'A-3/A-4/B-5/B-6' : section === 0 ? 'A-1/B-1/B-4' : 'A-2/B-3/B-2'}, ${row + 1}. lerroa: ${form} -> ${JSON.stringify(expected)}`);
        }
      }
    }
    row++;
  }
  if (section !== (group.series === 'indicative' ? 1 : 0) || row !== 7)
    failures.push(`PDF ${group.page}: azken sailak ${row} lerro ditu`);
}
// Page 59 cannot be aligned mechanically: its B-7 forms spill into later
// physical rows. Transcribe only the 14 actually printed, readable cells.
// The final HAIEK/B-7 cell is absent from the PDF and is NOT counted.
const page59 = pages[58];
if (!page59.includes('diezazkiaket/diezazkinaket') || !page59.includes('niezazkiake/niezazkina-'))
  failures.push('PDF 59: eskuz irakurritako taularen aingurak ez dira aurkitu');
for (const [nori, row] of [
  ['hi', ['diezazkiaket/diezazkinaket', 'niezazkiakeen/niezazkinakeen', 'niezazkiake/niezazkinake']],
  ['hura', ['diezazkioket', 'niezazkiokeen', 'niezazkioke']],
  ['zu', ['diezazkizuket', 'niezazkizukeen', 'niezazkizuke']],
  ['zuek', ['diezazkizueket', 'niezazkizuekeen', 'niezazkizueke']],
  ['haiek', ['diezazkieket', 'niezazkiekeen']],
] as [Person,string[]][]) for(let col=0;col<row.length;col++) {
  cells++;
  for(const form of row[col].split('/')) {
    checked++;
    // The last syllable of niezazkinake is printed on the following line.
    if(form!=='niezazkinake' && !new RegExp(`(?<![a-z])${form}(?![a-z])`).test(page59))
      failures.push(`PDF 59: transkribatutako ${form} ez da aurkitu`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='ezan'&&a.kind==='auxiliary'&&a.type==='nor-nori-nork'&&
      a.nor==='haiek'&&a.nori===nori&&a.nork==='ni'&&a.mood==='potential'&&a.tense===potentialColumns[col].tense))
      failures.push(`PDF 59: ${form} ez du aurreikusitako analisia (${nori}, ${potentialColumns[col].tense})`);
  }
}
// Page 8 has seven subjunctive columns plus a separate imperative column;
// two -la cells are typeset across physical lines.
const page8=pages[7];
const page8Rows=[
  ['nadin','banadi','nadila','nendin','nendila','nendin','banendi'],
  ['hadin','bahadi','hadila','hendin','hendila','hendin','bahendi'],
  ['dadin','badadi','dadila','zedin','zedila','ledin','baledi'],
  ['gaitezen','bagaitez','gaitezela','gintezen','gintezela','gintezen','bagintez'],
  ['zaitezen','bazaitez','zaitezela','zintezen','zintezela','zintezen','bazintez'],
  ['zaitezten','bazaitezte','zaiteztela','zintezten','zinteztela','zintezten','bazintezte'],
  ['daitezen','badaitez','daitezela','zitezen','zitezela','litezen','balitez'],
];
if(!page8.includes('zaitezte-')||!page8.includes('daitezela')) failures.push('PDF 8: lerro hautsien aingurak falta dira');
for(let row=0;row<7;row++)for(let col=0;col<7;col++) {
  const form=page8Rows[row][col];cells++;checked++;
  if(form!=='zaiteztela'&&!new RegExp(`(?<![a-z])${form}(?![a-z])`).test(page8))
    failures.push(`PDF 8: transkribatutako ${form} ez da aurkitu`);
  const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma==='edin'&&a.kind==='auxiliary'&&a.type==='nor'&&a.nor===persons[row]&&
    a.nori===null&&a.nork===null&&a.mood==='subjunctive'&&a.tense===subjunctiveColumns[col].tense))
    failures.push(`PDF 8: ${form} ez du subjuntiboko analisia (${persons[row]}, ${subjunctiveColumns[col].tense})`);
}
for(const [form,nor] of [['hadi','hi'],['bedi','hura'],['zaitez','zu'],['zaitezte','zuek'],['bitez','haiek']] as [string,Person][]) {
  cells++;checked++;
  const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma==='edin'&&a.type==='nor'&&a.nor===nor&&a.mood==='imperative'&&a.tense==='present'))
    failures.push(`PDF 8: ${form} ez du aginterazko analisia (${nor})`);
}
// Pages 59 and 62 have staggered seven-column subjunctive rows. Preserve
// their printed nonblank cells explicitly; NI and GU recipient rows are dashes.
const manualSubjunctive = [
  {page:59,nork:'ni',rows:[
    ['hi',['diezazkiadan/diezazkinadan','badiezazkiat/badiezazkinat','diezazkiadala/diezazkinadala','niezazkian/niezazkinan','niezazkiala/niezazkinala','niezazkian/niezazkinan','baniezazkik/baniezazkin']],
    ['hura',['diezazkiodan','badiezazkiot','diezazkiodala','niezazkion','niezazkiola','niezazkion','baniezazkio']],
    ['zu',['diezazkizudan','badiezazkizut','diezazkizudala','niezazkizun','niezazkizula','niezazkizun','baniezazkizu']],
    ['zuek',['diezazkizuedan','badiezazkizuet','diezazkizuedala','niezazkizuen','niezazkizuela','niezazkizuen','baniezazkizue']],
    ['haiek',['diezazkiedan','badiezazkiet','diezazkiedala','niezazkien','niezazkiela','niezazkien','baniezazkie']],
  ]},
  {page:62,nork:'gu',rows:[
    ['hi',['diezazkiagun/diezazkinagun','badiezazkiagu/badiezazkinagu','diezazkiagula/diezazkinagula','geniezazkian/geniezazkinan','geniezazkiala/geniezazkinala','geniezazkian/geniezazkinan','bageniezazkik/bageniezazkin']],
    ['hura',['diezazkiogun','badiezazkiogu','diezazkiogula','geniezazkion','geniezazkiola','geniezazkion','bageniezazkio']],
    ['zu',['diezazkizugun','badiezazkizugu','diezazkizugula','geniezazkizun','geniezazkizula','geniezazkizun','bageniezazkizu']],
    ['zuek',['diezazkizuegun','badiezazkizuegu','diezazkizuegula','geniezazkizuen','geniezazkizuela','geniezazkizuen','bageniezazkizue']],
    ['haiek',['diezazkiegun','badiezazkiegu','diezazkiegula','geniezazkien','geniezazkiela','geniezazkien','bageniezazkie']],
  ]},
] as {page:number;nork:Person;rows:[Person,string[]][]}[];
for(const group of manualSubjunctive) {
  const source=pages[group.page-1];
  for(const [nori,row] of group.rows)for(let col=0;col<row.length;col++) {
    cells++;
    for(const form of row[col].split('/')) {
      checked++;
      // Two forms on page 59 are hyphen-wrapped across physical lines.
      if(!(group.page===59&&['badiezazkinat','baniezazkin'].includes(form))&&
        !new RegExp(`(?<![a-z])${form}(?![a-z])`).test(source))
        failures.push(`PDF ${group.page}: transkribatutako ${form} ez da aurkitu`);
      const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
      if(!analyses.some(a=>a.lemma==='ezan'&&a.kind==='auxiliary'&&a.type==='nor-nori-nork'&&a.nor==='haiek'&&
        a.nori===nori&&a.nork===group.nork&&a.mood==='subjunctive'&&a.tense===subjunctiveColumns[col].tense))
        failures.push(`PDF ${group.page}: ${form} ez du subjuntiboko analisia (${nori}, ${group.nork}, ${subjunctiveColumns[col].tense})`);
    }
  }
}
const imperativeGroups = [
  { page: 25, width: 7, sections: 1 },
  { page: 42, width: 7, sections: 1 },
  { page: 66, width: 5, sections: 2 },
] as const;
for(const group of imperativeGroups) {
  const pageText=pages[group.page-1];
  const footer=/[-–]\s*\d+\s*[-–]/.exec(pageText);
  if(!footer) {failures.push(`PDF ${group.page}: aginterako orrialde-oina falta da`);continue;}
  // Page 66's first C header lies *above* the printed page footer.
  let section=group.page===66?0:-1;
  let row=0;
  for(const raw of pageText.slice(footer.index+footer[0].length).split('\n')) {
    const line=raw.trim();
    if(new RegExp(`^C(?:\\s+C){${group.width-1}}$`).test(line)) {
      if(section>=0&&row!==7)failures.push(`PDF ${group.page}: ${section+1}. agintera-sailak ${row} lerro ditu`);
      section++;row=0;continue;
    }
    if(section<0||row>=7)continue;
    const values=line.split(/\s{2,}/).filter(Boolean);
    if(values.length!==group.width||!values.every(v=>/^(?:[a-zñü()/-]+)$/.test(v)))continue;
    for(let col=0;col<values.length;col++) {
      const cell=values[col];
      if(cell.startsWith('(')||/^-+$/.test(cell)){blankCells++;continue;}
      cells++;
      for(const form of cell.split('/')) {
        checked++;
        const expected=group.page===25?
          {lemma:'edin',type:'nor-nori',nor:persons[col],nori:persons[row],nork:null}:
          group.page===42?
          {lemma:'ezan',type:'nor-nork',nor:persons[col],nori:null,nork:persons[row]}:
          {lemma:'ezan',type:'nor-nori-nork',nor:section===0?'hura':'haiek',nori:persons[row],nork:(['hi','hura','zu','zuek','haiek'] as Person[])[col]};
        const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
        if(!analyses.some(a=>a.lemma===expected.lemma&&a.kind==='auxiliary'&&a.type===expected.type&&
          a.nor===expected.nor&&a.nori===expected.nori&&a.nork===expected.nork&&a.mood==='imperative'&&a.tense==='present'))
          failures.push(`PDF ${group.page}, agintera ${section+1}, ${row+1}. lerroa: ${form} -> ${JSON.stringify(expected)}`);
      }
    }
    row++;
  }
  if(section!==group.sections-1||row!==7)failures.push(`PDF ${group.page}: aginterako azken sailak ${row} lerro ditu`);
}
db.close();
console.log(JSON.stringify({
  source: 'Euskaltzaindia 78, adizki osoko taulak: indikatiboa, ahalerazkoa, subjuntiboa eta agintera',
  pages: new Set([...groups.map(g=>g.page),59,...imperativeGroups.map(g=>g.page)]).size,
  tables: groups.length+1+2+manualSubjunctive.length+imperativeGroups.reduce((n,g)=>n+g.sections,0),
  cells, checked, blankCells, failureCount: failures.length, failures,
  manualPages: [8,18,59,62], sourceOmissions: ['8. orrialdeko HAIEK A-5', '59. orrialdeko HAIEK/B-7'],
  caveat: 'NOR, NORI, NORK, lema, mota, modua eta aldia egiaztatzen ditu; tratamendua eta morfemak kanpo daude. Hautsitako gelaxka batzuk eskuz transkribatu dira.',
}, null, 2));
if (failures.length || checked < 2800) process.exitCode = 1;
