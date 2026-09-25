import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import type { Analysis, Mood, Person, Tense } from '../packages/shared/src/index.ts';
import { defaultDatabasePath } from '../apps/api/src/database.js';
import { earlyNorNoriReadings } from './nor-nori-paradigms.js';
import { edukiReadings, ekarriNorNorkReadings, eramanNorNorkReadings, erabiliNorNorkReadings,
  erabili1977Reading } from './nor-nork-paradigms.js';
import { ezagutuReadings, ezagutuGlessReadings } from './ezagutu-paradigms.js';
import { eginNorNorkReadings, egin1977Readings, eginNnnPrinted, eginNnnEllipsis, eginNnnPlural,
  egin1977NnnReading } from './egin-paradigms.js';
import { ikusiReadings, ikusiShortReadings, ikusiDativeExamples } from './ikusi-paradigms.js';
import { ekarriNnnPrinted, ekarriNnnDerived, eramanNnnPrinted, eramanNnnDerived,
  erabiliNnnPrinted, erabiliNnnDerived } from './ekarri-nnn-paradigms.js';

// Only the left-hand, Academy-approved whole-form paradigms in the 1979 book.
// The facing construction charts and their grammatical labels are the editor's,
// so this audit does not infer a mood from the book's N1/N2/... labels.
const pdf = process.argv[2];
if (!pdf) throw new Error('Erabilera: npm run audit:trinkoak -- /bidea/euskal-aditz-batua.pdf');
const originalPdf = process.argv[3]; // 1977ko Aditz sintetikoa: hautazkoa baina gomendatua
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
let originalChecked = 0;
let noteVariants = 0;
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
// Dense NOR-NORI paradigms on printed pp. 101¹–109¹. The data shared
// with the builder expands every printed k/n pair into distinct toka/noka
// readings while retaining the exact NOR and NORI coordinates.
for(const reading of earlyNorNoriReadings) {
  checked++;
  const source=pages[reading.page-1]??'';
  const compact=source.toLowerCase().replace(/\s+/g,'');
  const toka=reading.treatment==='noka'?earlyNorNoriReadings.find(r=>r.page===reading.page&&
    r.series===reading.series&&r.nor===reading.nor&&r.nori===reading.nori&&r.treatment==='toka')?.form:null;
  const paired=toka&&[
    toka+'/n',toka+'/nan',toka+'/nake',toka+'ln',toka+'inan',toka+'make',
  ].some(value=>compact.includes(value));
  const aliases:Record<string,string>={narraie:'narrale',zerion:'zenon',zerigun:'zengun',
    zerizun:'zenzun',zerizuen:'zenzuen',zerien:'zenen'};
  const duplicatedTypo=reading.page===228&&reading.form==='zentxezkiokete'&&reading.nori==='haiek';
  const visible=duplicatedTypo?(source.match(/(?<![a-z])zentxezkiokete(?![a-z])/g)?.length??0)>=2:
    compact.includes(reading.form)||compact.includes(aliases[reading.form]??'\0')||Boolean(paired);
  if(!visible)failures.push(`PDF ${reading.page}: ${reading.heading} ${reading.series} ${reading.form} falta da`);
  const analyses=(lookup.all(reading.form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma===reading.lemma&&a.kind==='synthetic'&&a.type==='nor-nori'&&
    a.nor===reading.nor&&a.nori===reading.nori&&a.nork===null&&a.treatment===reading.treatment&&
    !a.allocutive&&reading.interpretations.some(i=>a.mood===i.mood&&a.tense===i.tense)&&
    a.validation===(reading.series==='NN4'?'generated':'reviewed')&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
    failures.push(`PDF ${reading.page}: ${reading.form} analisia falta edo desegokia da (${reading.nor}, ${reading.nori})`);
}
const officialNorNorkReadings=[...edukiReadings,...ekarriNorNorkReadings,...eramanNorNorkReadings,
  ...erabiliNorNorkReadings,...ezagutuReadings,...eginNorNorkReadings,...ikusiReadings];
for(const reading of officialNorNorkReadings){
  checked++;
  const source=pages[reading.page-1]??'';const compact=source.toLowerCase().replace(/\s+/g,'');
  const toka=reading.treatment==='noka'?officialNorNorkReadings.find(r=>r.page===reading.page&&r.series===reading.series&&
    r.nor===reading.nor&&r.nork===reading.nork&&r.treatment==='toka')?.form:null;
  const paired=toka&&[toka+'/n',toka+'/nan',toka+'m',toka+'man',toka+'in',toka+'tn',toka+'iii'].some(value=>compact.includes(value));
  const optional=reading.form.endsWith('teten')?compact.includes(reading.form.replace(/teten$/,'te(te)n')):
    reading.form.endsWith('tete')?compact.includes(reading.form.replace(/tete$/,'te(te)')):false;
  const aliases:Record<string,string>={ekarna:'ekama',ginderabiltzaan:'ginderabiltzanman',
    ginderabiltzanan:'ginderabiltzanman',bazindezaguzkigu:'bazindez<aguzkigu',
    zegien:'zeglen',genegien:'geneglen',hegitzake:'hegitcake',dakusat:'dakus(a)t',dakusak:'dakus(a)k',
    dakusan:'dakus(a)kll1',dakusa:'dakus(a)',dakusagu:'dakus(a)gu',dakusazu:'dakus(a)zu',
    dakusazue:'dakus(a)zue',dakusate:'dakus(a)te',dakuskin:'dakuskik111'};
  if(!compact.includes(reading.form)&&!compact.includes(aliases[reading.form]??'\0')&&!paired&&!optional)
    failures.push(`PDF ${reading.page}: ${reading.heading} ${reading.series} ${reading.form} falta da`);
  const analyses=(lookup.all(reading.form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma===reading.lemma&&a.kind==='synthetic'&&a.type==='nor-nork'&&a.nor===reading.nor&&
    a.nori===null&&a.nork===reading.nork&&a.treatment===reading.treatment&&!a.allocutive&&
    reading.interpretations.some(i=>a.mood===i.mood&&a.tense===i.tense)&&
    a.validation===(reading.series==='NN4'?'generated':'reviewed')&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
    failures.push(`PDF ${reading.page}: ${reading.heading} ${reading.form} analisia falta edo desegokia da`);
}
const ezagutuNoteSource=((pages[283]??'')+(pages[289]??'')).toLowerCase().replace(/\s+/g,'');
if(!ezagutuNoteSource.includes('dazaut(=dazagut)')||
  !(ezagutuNoteSource.includes('-g-gabeko')||ezagutuNoteSource.includes('-~-gabeko')))
  failures.push('PDF 284/290: EZAGUTUren dazaut/-g- gabeko aldaeren ohar-aingurak falta dira');
for(const reading of ezagutuGlessReadings) for(const interpretation of reading.interpretations) {
  noteVariants++;
  const analyses=(lookup.all(reading.form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma==='ezagutu'&&a.kind==='synthetic'&&a.type==='nor-nork'&&a.nor===reading.nor&&
    a.nori===null&&a.nork===reading.nork&&a.treatment===reading.treatment&&!a.allocutive&&
    a.mood===interpretation.mood&&a.tense===interpretation.tense&&a.validation==='generated'&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
    failures.push(`PDF 284/290: EZAGUTUren -g- gabeko ${reading.form} aldaera falta edo desegokia da`);
}
const ikusiNotes=((pages[305]??'')+(pages[307]??'')).toLowerCase().replace(/\s+/g,'');
if(!ikusiNotes.includes('agabekoadizkiak')||!ikusiNotes.includes('dekust')||!ikusiNotes.includes('dekutsut')||
  !ikusiNotes.includes('dekuskigute'))failures.push('PDF 306/308: IKUSIren a gabeko/datibozko ohar-aingurak falta dira');
for(const reading of ikusiShortReadings) for(const interpretation of reading.interpretations) {
  noteVariants++;
  const analyses=(lookup.all(reading.form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma==='ikusi'&&a.type==='nor-nork'&&a.nor===reading.nor&&a.nori===null&&
    a.nork===reading.nork&&a.treatment===reading.treatment&&a.mood===interpretation.mood&&a.tense===interpretation.tense&&
    a.validation==='generated'&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
    failures.push(`PDF 306: IKUSIren a gabeko ${reading.form} aldaera falta edo desegokia da`);
}
for(const example of ikusiDativeExamples) {
  noteVariants++;
  const analyses=(lookup.all(example.form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma==='ikusi'&&a.type==='nor-nori-nork'&&a.nor===example.nor&&a.nori===example.nori&&
    a.nork===example.nork&&a.mood==='indicative'&&a.tense==='present'&&a.validation==='generated'&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
    failures.push(`PDF 308: IKUSIren datibozko ${example.form} adibidea falta edo desegokia da`);
}
for(const reading of eginNnnPrinted) {
  checked++;
  const compact=(pages[reading.page-1]??'').toLowerCase().replace(/\s+/g,'');
  const toka=reading.treatment==='noka'?eginNnnPrinted.find(r=>r.page===reading.page&&r.series===reading.series&&
    r.nori===reading.nori&&r.nork===reading.nork&&r.treatment==='toka')?.form:null;
  const paired=toka&&[toka+'/n',toka+'/nan',toka+'/oaten',toka+'m',toka+'man',toka+'in',toka+'ln',toka+'tn',toka+'mate']
    .some(value=>compact.includes(value));
  const aliases:Record<string,string>={};
  if(!compact.includes(reading.form)&&!compact.includes(aliases[reading.form]??'\0')&&!paired)
    failures.push(`PDF ${reading.page}: EGIN ${reading.series} ${reading.form} falta da`);
  for(const interpretation of reading.interpretations) {
    const analyses=(lookup.all(reading.form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='egin'&&a.kind==='synthetic'&&a.type==='nor-nori-nork'&&a.nor===reading.nor&&
      a.nori===reading.nori&&a.nork===reading.nork&&a.treatment===reading.treatment&&!a.allocutive&&
      a.mood===interpretation.mood&&a.tense===interpretation.tense&&
      a.validation===(reading.series==='NNN4'?'generated':'reviewed')&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
      failures.push(`PDF ${reading.page}: EGIN ${reading.series} ${reading.form} analisia falta edo desegokia da`);
  }
}
const eginNnnRules=[296,298,300,302,304].map(page=>(pages[page-1]??'').toLowerCase().replace(/\s+/g,''));
if(eginNnnRules.slice(0,4).some(source=>!source.includes('gi->-gizki-')&&!source.includes('-gi->-gizki-'))||
  !eginNnnRules[4].includes('(etaabar)'))failures.push('PDF 296–304: EGINen -gi- → -gizki- / «eta abar» aingurak falta dira');
for(const reading of [...eginNnnEllipsis,...eginNnnPlural]) for(const interpretation of reading.interpretations) {
  noteVariants++;
  const analyses=(lookup.all(reading.form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma==='egin'&&a.type==='nor-nori-nork'&&a.nor===reading.nor&&a.nori===reading.nori&&
    a.nork===reading.nork&&a.treatment===reading.treatment&&!a.allocutive&&a.mood===interpretation.mood&&
    a.tense===interpretation.tense&&a.validation==='generated'&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
    failures.push(`PDF ${reading.page}: EGIN ${reading.series} ${reading.evidence} ${reading.form} falta edo desegokia da`);
}
for(const reading of [...ekarriNnnPrinted,...ekarriNnnDerived,...eramanNnnPrinted,...eramanNnnDerived,
  ...erabiliNnnPrinted,...erabiliNnnDerived]){
  const lemma=reading.page>=278?'erabili':reading.page>=268?'eraman':'ekarri';
  if(reading.derived)noteVariants++;else checked++;
  const source=pages[reading.page-1]??'';const compact=source.toLowerCase().replace(/\s+/g,'');
  if(reading.derived){
    const ruleStem=lemma==='erabili'?'rabilzki':lemma==='eraman'?'ramazki':'karzki';
    const ruleAnchor=lemma==='erabili'&&reading.page===278?
      compact.includes('objeto')&&compact.includes('erabilzkiok'):
      (compact.includes('askida=')||compact.includes('askide='))&&compact.includes(ruleStem);
    if(!ruleAnchor)
      failures.push(`PDF ${reading.page}: ${lemma.toUpperCase()} NOR plurala egiteko araua falta da`);
  }else{
    const printedReadings=lemma==='erabili'?erabiliNnnPrinted:lemma==='eraman'?eramanNnnPrinted:ekarriNnnPrinted;
    const toka=reading.treatment==='noka'?printedReadings.find(r=>r.page===reading.page&&r.series===reading.series&&
      r.nori===reading.nori&&r.nork===reading.nork&&r.treatment==='toka')?.form:null;
    const aliases:Record<string,string>={bekarkizuete:'bekarkizuet<',zeramakizuten:'zeramatizuten',
      eramaiok:'eramaiek',eramaiozu:'eramalezu',darabilkiguk:'darabilkjguk'};
    const visibleToka=toka?(aliases[toka]??toka):null;
    const pos=visibleToka?compact.indexOf(visibleToka):-1;const tail=pos>=0&&visibleToka?compact.slice(pos+visibleToka.length,pos+visibleToka.length+12):'';
    const paired=pos>=0&&(/^(?:\/|m|ln|in|mate|llan|llaten|lilan|lilaten)/.test(tail)||reading.form==='zekarkinaten');
    if(!compact.includes(reading.form)&&!compact.includes(aliases[reading.form]??'\0')&&!paired)
      failures.push(`PDF ${reading.page}: ${lemma.toUpperCase()} ${reading.series} ${reading.form} falta da`);
  }
  const analyses=(lookup.all(reading.form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma===lemma&&a.kind==='synthetic'&&a.type==='nor-nori-nork'&&
    a.nor===reading.nor&&a.nori===reading.nori&&a.nork===reading.nork&&a.mood===reading.mood&&a.tense===reading.tense&&
    a.treatment===reading.treatment&&!a.allocutive&&a.validation===(reading.derived?'generated':'reviewed')&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
    failures.push(`PDF ${reading.page}: ${lemma.toUpperCase()} ${reading.form} analisia falta edo desegokia da`);
}
// Printed p. 110¹/PDF 242 has parallel NOR singular/plural columns. Four
// hi cells abbreviate the noka counterpart as /n or /nake; expand only
// those explicit alternations, preserving NORI=hi and treatment.
const jarioPage=pages[241];
if(!jarioPage?.includes('JARIO/JARIN/JARIATU')||!/110\s+1/.test(jarioPage))
  failures.push('PDF 242: JARIO/JARIN/JARIATU paradigma-aingurak falta dira');
for(const plural of [false,true]) {
  const nor:Person=plural?'haiek':'hura';
  const potentialStem=plural?'lerizki':'leri';
  const imperativeStem=plural?'berizki':'beri';
  for(const [series,stem,recipients] of [
    ['NN4',potentialStem,[['ni','dake'],['hi','ake'],['hi','nake'],['hura','oke'],['gu','guke'],['zu','zuke'],['zuek','zueke'],['haiek','eke']]],
    ['NN9',imperativeStem,[['ni','t'],['hi','k'],['hi','n'],['hura','o'],['gu','gu'],['zu','zu'],['zuek','zue'],['haiek','e']]],
  ] as [string,string,[Person,string][]][]) for(const [nori,suffix] of recipients) {
    const form=stem+suffix;
    checked++;
    const abbreviated=nori==='hi'&&suffix==='nake'?new RegExp(`${stem}ake\\s*/nake`).test(jarioPage):
      nori==='hi'&&suffix==='n'?new RegExp(`${stem}k/n`).test(jarioPage):false;
    if(!abbreviated&&!new RegExp(`(?<![a-z])${form}(?![a-z])`).test(jarioPage))
      failures.push(`PDF 242: ${form} jatorrizko gelaxkan ez da aurkitu`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='jario'&&a.kind==='synthetic'&&a.type==='nor-nori'&&
      a.nor===nor&&a.nori===nori&&a.nork===null&&a.mood===(series==='NN4'?'potential':'imperative')&&
      a.tense===(series==='NN4'?'hypothetical':'present')&&a.treatment===(nori==='hi'?(suffix==='n'||suffix==='nake'?'noka':'toka'):'neutral')&&
      !a.allocutive)) failures.push(`PDF 242: ${form} analisia falta edo desegokia da (${nor}, ${nori}, ${series})`);
  }
}
const eroanPage=pages[327]; // printed 153¹
if(!eroanPage?.includes('EROAN')||!/153\s+1/.test(eroanPage))
  failures.push('PDF 328: EROAN paradigma-aingurak falta dira');
for(const plural of [false,true]) {
  const nor:Person=plural?'haiek':'hura';
  for(const [prefix,nork,treatment] of [
    ['nero','ni','neutral'],['hero','hi','hika'],['lero','hura','neutral'],
    ['genero','gu','neutral'],['zenero','zu','neutral'],['zenero','zuek','neutral'],
    ['lero','haiek','neutral'],
  ] as [string,Person,Analysis['treatment']][]) {
    const form=prefix+(plural?'azke':'ake')+(nork==='zuek'||nork==='haiek'?'te':'');
    checked++;
    if(!new RegExp(`(?<![a-z])${form}(?![a-z])`).test(eroanPage))
      failures.push(`PDF 328: ${form} NN4 gelaxkan ez da aurkitu`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='eroan'&&a.kind==='synthetic'&&a.type==='nor-nork'&&
      a.nor===nor&&a.nori===null&&a.nork===nork&&a.mood==='potential'&&a.tense==='hypothetical'&&
      a.treatment===treatment&&!a.allocutive))
      failures.push(`PDF 328: ${form} NN4 analisia falta edo desegokia da (${nor}, ${nork})`);
  }
  for(const [nork,form,treatment] of (plural?[
    ['hi','eroaitzak','toka'],['hi','eroaitzan','noka'],['hura','beroatza','neutral'],
    ['zu','eroaitzazu','neutral'],['zuek','eroaitzazue','neutral'],['haiek','beroatzate','neutral'],
  ]:[
    ['hi','eroak','toka'],['hi','eroan','noka'],['hura','beroa','neutral'],
    ['zu','eroazu','neutral'],['zuek','eroazue','neutral'],['haiek','beroate','neutral'],
  ]) as [Person,string,Analysis['treatment']][]) {
    checked++;
    const shorthand=nork==='hi'&&(treatment==='noka'||treatment==='toka')?
      (plural?/eroaitzak\s+Ill/.test(eroanPage):/eroaklll/.test(eroanPage)):false;
    if(!shorthand&&!new RegExp(`(?<![a-z])${form}(?![a-z])`).test(eroanPage))
      failures.push(`PDF 328: ${form} NN9 gelaxkan ez da aurkitu`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='eroan'&&a.kind==='synthetic'&&a.type==='nor-nork'&&
      a.nor===nor&&a.nori===null&&a.nork===nork&&a.mood==='imperative'&&a.tense==='present'&&
      a.treatment===treatment&&!a.allocutive&&a.validation==='reviewed'&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')))
      failures.push(`PDF 328: ${form} NN9 analisia falta edo desegokia da (${nor}, ${nork})`);
  }
}
// ERAKUTSI's NOR-NORK pages (printed pp. 149¹–150¹/PDF 320, 322).
// The plural-NOR imperative alternatives with a space are intentionally
// outside this single-word analyzer; the two short be- cells are included.
const erakutsiNorNorkPages=[
  {page:320,series:[
    {label:'NN1',mood:'indicative',tense:'present',rows:[
      ['hura',['darakutsat','darakutsak','darakutsa','darakutsagu','darakutsazu','darakutsazue','darakutsate']],
      ['haiek',['darakuskit','darakuskik','darakuski','darakuskigu','darakuskizu','darakuskizue','darakuskite']],
    ]},
    {label:'NN2',mood:'indicative',tense:'past',rows:[
      ['hura',['nerakutsan','herakutsan','zerakutsan','generakutsan','zenerakutsan','zenerakutsaten','zerakutsaten']],
      ['haiek',['nerakuskien','herakuskien','zerakuskien','generakuskien','zenerakuskien','zenerakuskiten','zerakuskiten']],
    ]},
  ]},
  {page:322,series:[
    {label:'NN3',mood:'conditional',tense:'hypothetical',rows:[
      ['hura',['banerakutsa','baherakutsa','balerakutsa','bagenerakutsa','bazenerakutsa','bazenerakutsate','balerakutsate']],
      ['haiek',['banerakuski','baherakuski','balerakuski','bagenerakuski','bazenerakuski','bazenerakuskite','balerakuskite']],
    ]},
    {label:'NN4',mood:'consequence',tense:'present',rows:[
      ['hura',['nerakuske','herakuske','lerakuske','generakuske','zenerakuske','zenerakuskete','lerakuskete']],
      ['haiek',['nerakutsazke','herakutsazke','lerakutsazke','generakutsazke','zenerakutsazke','zenerakutsazkete','lerakutsazkete']],
    ]},
  ]},
] as const;
const erakutsiSubjects:Person[]=['ni','hi','hura','gu','zu','zuek','haiek'];
for(const spec of erakutsiNorNorkPages) {
  const source=pages[spec.page-1];
  if(!source?.includes('ERAKUTSI')||!new RegExp(`${spec.page===320?'149':'150'}\\s*1`).test(source))
    failures.push(`PDF ${spec.page}: ERAKUTSI paradigma-aingurak falta dira`);
  for(const series of spec.series) for(const [nor,forms] of series.rows) for(let i=0;i<forms.length;i++) {
    const form=forms[i]; const nork=erakutsiSubjects[i]; checked++;
    if(!new RegExp(`(?<![a-z])${form}(?![a-z])`).test(source))
      failures.push(`PDF ${spec.page}: ERAKUTSI ${series.label} ${form} falta da`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='erakutsi'&&a.kind==='synthetic'&&a.type==='nor-nork'&&
      a.nor===nor&&a.nori===null&&a.nork===nork&&a.mood===series.mood&&a.tense===series.tense&&
      !a.allocutive)) failures.push(`PDF ${spec.page}: ERAKUTSI ${series.label} ${form} analisia falta edo desegokia da`);
    // The indicative present prints -k/-n in one cell for NORK=hi.
    if(spec.page===320&&series.label==='NN1'&&nork==='hi') {
      const noka=form.slice(0,-1)+'n'; checked++;
      if(!new RegExp(`${form}\\s+III`).test(source))failures.push(`PDF 320: ${noka} genero-bikotea falta da`);
      const gender=(lookup.all(noka,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
      if(!gender.some(a=>a.lemma==='erakutsi'&&a.nor===nor&&a.nork==='hi'&&a.mood==='indicative'&&
        a.tense==='present'&&a.treatment==='noka'))failures.push(`PDF 320: ${noka} noka irakurketa falta da`);
    }
  }
}
const erakutsiN9=pages[321];
for(const [nor,nork,form,treatment] of [
  ['hura','hi','erakutsak','toka'],['hura','hi','erakutsan','noka'],
  ['hura','hura','berakutsa','neutral'],['hura','zu','erakutsazu','neutral'],
  ['hura','zuek','erakutsazue','neutral'],['hura','haiek','berakutsate','neutral'],
  ['haiek','hura','berakuski','neutral'],['haiek','haiek','berakuskite','neutral'],
] as [Person,Person,string,Analysis['treatment']][]) {
  checked++;
  const visible=form==='erakutsan'?/erakutsak\s+m/.test(erakutsiN9):
    new RegExp(`(?<![a-z])${form}(?![a-z])`).test(erakutsiN9);
  if(!visible)failures.push(`PDF 322: ERAKUTSI NN9 ${form} falta da`);
  const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma==='erakutsi'&&a.kind==='synthetic'&&a.type==='nor-nork'&&
    a.nor===nor&&a.nori===null&&a.nork===nork&&a.mood==='imperative'&&a.tense==='present'&&
    a.treatment===treatment&&!a.allocutive&&
    (nork!=='hi'||(a.validation==='reviewed'&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))))
    failures.push(`PDF 322: ERAKUTSI NN9 ${form} analisia falta edo desegokia da`);
}
// ERAKUTSI NNN9 (printed p. 151¹/PDF 324): all four NORI recipients
// for both NOR numbers. The OCR renders the printed -k/-n pair as III/lll;
// the original 1977 table corroborates those sixteen gendered readings.
const erakutsiPage=pages[323];
if(!erakutsiPage?.includes('ERAKUTSI')||!/151\s+1/.test(erakutsiPage))
  failures.push('PDF 324: ERAKUTSI NNN9 paradigma-aingurak falta dira');
for(const [nor,recipients] of [
  ['hura',[['ni','erakusta'],['gu','erakusku'],['hura','erakutsio'],['haiek','erakutsie']]],
  ['haiek',[['ni','erakutsazkida'],['gu','erakutsazkigu'],['hura','erakutsazkio'],['haiek','erakutsazkie']]],
] as [Person,[Person,string][]][]) for(const [nori,stem] of recipients)
  for(const [nork,suffix,treatment] of [
    ['hi','k','toka'],['hi','n','noka'],['zu','zu','neutral'],['zuek','zue','neutral'],
  ] as [Person,string,Analysis['treatment']][]) {
    const form=stem+suffix;
    checked++;
    const visible=nork==='hi'?new RegExp(`${stem}k\\s*(?:III|lll)`).test(erakutsiPage):
      new RegExp(`(?<![a-z])${form}(?![a-z])`).test(erakutsiPage);
    if(!visible)failures.push(`PDF 324: ${form} jatorrizko gelaxkan ez da aurkitu`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='erakutsi'&&a.kind==='synthetic'&&a.mood==='imperative'&&
      a.tense==='present'&&a.type==='nor-nori-nork'&&a.nor===nor&&a.nori===nori&&a.nork===nork&&
      a.treatment===treatment&&!a.allocutive&&
      (nork!=='hi'||(a.validation==='reviewed'&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))))
      failures.push(`PDF 324: ${form} analisia falta edo desegokia da (${nor}, ${nori}, ${nork})`);
  }
// The physical PDF has a blank facing page here: p. 338 is printed 158¹,
// an Academy paradigm, not an editor-only construction chart. Only its
// single-word NN9/NNN9 cells belong to the one-word reverse analyzer.
const irakatsiPage = pages[337];
if (!irakatsiPage?.includes('IRAKATSI') || !/158\s+1/.test(irakatsiPage))
  failures.push('PDF 338: IRAKATSI paradigma ofizialaren aingurak falta dira');
for (const [nor, recipients] of [
  ['hura', [[null, 'irakatsa'], ['ni', 'irakasta'], ['gu', 'irakasku'], ['hura', 'irakatsio'], ['haiek', 'irakatsie']]],
  ['haiek', [['ni', 'irakatsazkida'], ['gu', 'irakatsazkigu'], ['hura', 'irakatsazkio'], ['haiek', 'irakatsazkie']]],
] as [Person, [Person | null, string][]][]) for (const [nori, stem] of recipients)
  for (const [nork, suffix, treatment] of [
    ['hi', 'k', 'toka'], ['hi', 'n', 'noka'], ['zu', 'zu', 'neutral'], ['zuek', 'zue', 'neutral'],
  ] as [Person, string, Analysis['treatment']][]) {
    const form=stem+suffix;
    checked++;
    // The PDF text extractor renders the printed "k/n" alternation as
    // "k In", "kln", or "k/n". Anchor both gender forms to that cell.
    const visible=nork==='hi' ? new RegExp(`${stem}k(?:\\s+In|ln|/n)`).test(irakatsiPage) :
      new RegExp(`(?<![a-z])${form}(?![a-z])`).test(irakatsiPage);
    if (!visible) failures.push(`PDF 338: ${form} jatorrizko gelaxkan ez da aurkitu`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if (!analyses.some(a=>a.lemma==='irakatsi'&&a.kind==='synthetic'&&a.mood==='imperative'&&a.tense==='present'&&
      a.type===(nori?'nor-nori-nork':'nor-nork')&&a.nor===nor&&a.nori===nori&&a.nork===nork&&
      a.treatment===treatment&&!a.allocutive&&a.validation==='reviewed'))
      failures.push(`PDF 338: ${form} analisia falta edo desegokia da (${nor}, ${nori}, ${nork})`);
  }
// Four imperative-only paradigms. Parenthesized spaced alternatives in the
// right column are analytic constructions and intentionally not counted.
for(const spec of [
  {page:340,lemma:'utzi',heading:'UTZI',nn9:[['utzak','toka'],['utzan','noka'],['utzazu','neutral'],['utzazue','neutral']],
    stems:[['ni','uzta','utzazkida'],['gu','uzku','utzazkigu'],['hura','utzio','utzazkio'],['haiek','utzie','utzazkie']]},
  {page:342,lemma:'igorri',heading:'IGORRI',nn9:[['igork','toka'],['igorna','noka'],['igorzu','neutral'],['igorzue','neutral']],
    stems:[['ni','igorda','igorzkida'],['gu','igorgu','igorzkigu'],['hura','igorrio','igorzkio'],['haiek','igorrie','igorzkie']]},
  {page:344,lemma:'erosi',heading:'EROSI',nn9:[['erosak','toka'],['erosan','noka'],['erosazu','neutral'],['erosazue','neutral']],
    stems:[['ni','erosta','erosazkida'],['gu','erosku','erosazkigu'],['hura','erosio','erosazkio'],['haiek','erosie','erosazkie']]},
  {page:346,lemma:'ihardetsi',heading:'IHARDETSI',nn9:[['ihardetsak','toka'],['ihardetsan','noka'],['ihardetsazu','neutral'],['ihardetsazue','neutral']],
    stems:[['ni','ihardesta','ihardetsazkida'],['gu','ihardesku','ihardetsazkigu'],['hura','ihardetsio','ihardetsazkio'],['haiek','ihardetsie','ihardetsazkie']]},
] as const) {
  const raw=pages[spec.page-1]; const source=raw.toLowerCase().replace(/\s+/g,'');
  if(!raw?.includes(spec.heading)&&!(spec.lemma==='ihardetsi'&&source.includes('ihardetsak/n')))
    failures.push(`PDF ${spec.page}: ${spec.heading} paradigma-aingura falta da`);
  const expected:[string,Person,Person|null,Person,Analysis['treatment']][]=[];
  for(let i=0;i<spec.nn9.length;i++) {
    const [form,treatment]=spec.nn9[i]; expected.push([form,'hura',null,i<2?'hi':i===2?'zu':'zuek',treatment]);
  }
  for(const [nori,singular,plural] of spec.stems) for(const [nor,stem] of [['hura',singular],['haiek',plural]] as [Person,string][])
    for(const [nork,suffix,treatment] of [['hi','k','toka'],['hi','n','noka'],['zu','zu','neutral'],['zuek','zue','neutral']] as [Person,string,Analysis['treatment']][])
      expected.push([stem+suffix,nor,nori,nork,treatment]);
  const aliases:Record<string,string>={igorzu:'19orzu',igorzue:'19orzue',igorriezu:'19omezu',igorriezue:'19ornezue',
    erosiozu:'eroslozu',erosiozue:'eroslozue',erosiezu:'eroslezu',erosiezue:'eroslezue'};
  for(const [form,nor,nori,nork,treatment] of expected) {
    checked++;
    const toka=treatment==='noka'?expected.find(row=>row[1]===nor&&row[2]===nori&&row[3]===nork&&row[4]==='toka')?.[0]:null;
    const paired=toka&&['/n','ln','in','lna'].some(marker=>source.includes(toka+marker));
    if(!source.includes(form)&&!source.includes(aliases[form]??'\0')&&!paired)
      failures.push(`PDF ${spec.page}: ${spec.heading} ${form} falta da`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma===spec.lemma&&a.kind==='synthetic'&&a.mood==='imperative'&&a.tense==='present'&&
      a.nor===nor&&a.nori===nori&&a.nork===nork&&a.treatment===treatment&&!a.allocutive&&
      a.validation==='reviewed'&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
      failures.push(`PDF ${spec.page}: ${spec.heading} ${form} analisia falta edo desegokia da`);
  }
}
// ESAN/ERRAN's compact NOR-NORK pages (printed 176¹–177¹).
for(const spec of [
  {page:374,lemma:'io',series:[
    ['NN1','indicative','present',[
      ['diot','ni','neutral'],['diok','hi','toka'],['dion','hi','noka'],['dio','hura','neutral'],
      ['diogu','gu','neutral'],['diozu','zu','neutral'],['diozue','zuek','neutral'],['diote','haiek','neutral']]],
    ['NN2','indicative','past',[
      ['nioen','ni','neutral'],['hioen','hi','hika'],['zioen','hura','neutral'],['genioen','gu','neutral'],
      ['zenioen','zu','neutral'],['zenioten','zuek','neutral'],['zioten','haiek','neutral']]],
  ]},
  {page:376,lemma:'erran',series:[
    ['NN3','conditional','hypothetical',[
      ['banerra','ni','neutral'],['baherra','hi','hika'],['balerra','hura','neutral'],['bagenerra','gu','neutral'],
      ['bazenerra','zu','neutral'],['bazenerrate','zuek','neutral'],['balerrate','haiek','neutral']]],
    ['NN4','potential','hypothetical',[
      ['nerrake','ni','neutral'],['herrake','hi','hika'],['lerrake','hura','neutral'],['generrake','gu','neutral'],
      ['zenerrake','zu','neutral'],['zenerrakete','zuek','neutral'],['lerrakete','haiek','neutral']]],
    ['NN9','imperative','present',[
      ['errak','hi','toka'],['erran','hi','noka'],['berra','hura','neutral'],['errazu','zu','neutral'],
      ['errazue','zuek','neutral'],['berrate','haiek','neutral']]],
    ['NN9-esan','imperative','present',[
      ['esak','hi','toka'],['esan','hi','noka'],['bio','hura','neutral'],['esazu','zu','neutral'],
      ['esazue','zuek','neutral'],['biote','haiek','neutral']]],
  ]},
] as const) {
  const raw=pages[spec.page-1]; const source=raw.toLowerCase().replace(/\s+/g,'');
  if(!raw?.includes('ESANIERRAN'))failures.push(`PDF ${spec.page}: ESAN/ERRAN aingura falta da`);
  for(const [series,mood,tense,forms] of spec.series) for(const [form,nork,treatment] of forms) {
    checked++;
    const paired=treatment==='noka'?forms.find(row=>row[1]===nork&&row[2]==='toka')?.[0]:null;
    const aliases:Record<string,string>={zioen:'zloen'};
    if(!source.includes(form)&&!source.includes(aliases[form]??'\0')&&!(paired&&source.includes(paired+'/n')))
      failures.push(`PDF ${spec.page}: ESAN/ERRAN ${series} ${form} falta da`);
    const lemma=series==='NN9-esan'?'esan':spec.lemma;
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma===lemma&&a.kind==='synthetic'&&a.type==='nor-nork'&&a.nor==='hura'&&
      a.nori===null&&a.nork===nork&&a.mood===mood&&a.tense===tense&&a.treatment===treatment&&!a.allocutive&&
      (['NN1','NN2','NN9','NN9-esan'].includes(series)?a.validation==='reviewed':true)&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
      failures.push(`PDF ${spec.page}: ESAN/ERRAN ${series} ${form} analisia falta edo desegokia da`);
  }
}
// Compact NOR-NORK paradigms approved on printed pp. 165¹–168¹. The 1979
// scan has a handful of stable OCR errors; the form arrays are also checked
// against the 1977 original below, so no reading is inferred from OCR alone.
for(const spec of [
  {lemma:'iraun',pages:[352,354],forms:[
    ['N1','indicative','present',[
      ['diraut','ni','neutral'],['dirauk','hi','toka'],['diraun','hi','noka'],['dirau','hura','neutral'],
      ['diraugu','gu','neutral'],['dirauzu','zu','neutral'],['dirauzue','zuek','neutral'],['diraute','haiek','neutral']]],
    ['N2','indicative','past',[
      ['nirauen','ni','neutral'],['hirauen','hi','hika'],['zirauen','hura','neutral'],['genirauen','gu','neutral'],
      ['zenirauen','zu','neutral'],['zenirauten','zuek','neutral'],['zirauten','haiek','neutral']]],
    ['N3','conditional','hypothetical',[
      ['banirau','ni','neutral'],['bahirau','hi','hika'],['balirau','hura','neutral'],['bagenirau','gu','neutral'],
      ['bazenirau','zu','neutral'],['bazeniraute','zuek','neutral'],['baliraute','haiek','neutral']]],
    ['N4','consequence','present',[
      ['nirauke','ni','neutral'],['hirauke','hi','hika'],['lirauke','hura','neutral'],['genirauke','gu','neutral'],
      ['zenirauke','zu','neutral'],['zeniraukete','zuek','neutral'],['liraukete','haiek','neutral']]],
    ['N9','imperative','present',[
      ['irauk','hi','toka'],['iraun','hi','noka'],['birau','hura','neutral'],['irauzu','zu','neutral'],
      ['irauzue','zuek','neutral'],['biraute','haiek','neutral']]],
  ]},
  {lemma:'iruditu',pages:[356,358],forms:[
    ['N1','indicative','present',[
      ['dirudit','ni','neutral'],['dirudik','hi','toka'],['dirudin','hi','noka'],['dirudi','hura','neutral'],
      ['dirudigu','gu','neutral'],['dirudizu','zu','neutral'],['dirudizue','zuek','neutral'],['dirudite','haiek','neutral']]],
    ['N2','indicative','past',[
      ['nirudien','ni','neutral'],['hirudien','hi','hika'],['zirudien','hura','neutral'],['genirudien','gu','neutral'],
      ['zenirudien','zu','neutral'],['zeniruditen','zuek','neutral'],['ziruditen','haiek','neutral']]],
    ['N3','conditional','hypothetical',[
      ['banirudi','ni','neutral'],['bahirudi','hi','hika'],['balirudi','hura','neutral'],['bagenirudi','gu','neutral'],
      ['bazenirudi','zu','neutral'],['bazenirudite','zuek','neutral'],['balirudite','haiek','neutral']]],
    ['N4','consequence','present',[
      ['nirudike','ni','neutral'],['hirudike','hi','hika'],['lirudike','hura','neutral'],['genirudike','gu','neutral'],
      ['zenirudike','zu','neutral'],['zenirudikete','zuek','neutral'],['lirudikete','haiek','neutral']]],
    ['N9','imperative','present',[
      ['irudik','hi','toka'],['irudin','hi','noka'],['birudi','hura','neutral'],['irudizu','zu','neutral'],
      ['irudizue','zuek','neutral'],['birudite','haiek','neutral']]],
  ]},
] as const) {
  const source=spec.pages.map(page=>pages[page-1]).join('\n').toLowerCase().replace(/\s+/g,'');
  if(!source.includes(spec.lemma==='iraun'?'iraun':'irudi'))
    failures.push(`PDF ${spec.pages.join('/')}: ${spec.lemma} paradigma-aingurak falta dira`);
  const ocrAliases:Record<string,string>={nirauen:'mrauen',zirauen:'zlrauen',genirauen:'gemrauen',zenirauen:'zemrauen',irauzu:'lrauzu',irauzue:'lrauzue'};
  for(const [series,mood,tense,forms] of spec.forms) for(const [form,nork,treatment] of forms) {
    checked++;
    const paired=(form==='diraun'||form==='dirudin'||form==='iraun'||form==='irudin')?form.slice(0,-1)+'km':null;
    if(!source.includes(form)&&!source.includes(ocrAliases[form]??'\0')&&!(paired&&source.includes(paired)))
      failures.push(`PDF ${spec.pages.join('/')}: ${spec.lemma} ${series} ${form} falta da`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma===spec.lemma&&a.kind==='synthetic'&&a.type==='nor-nork'&&
      a.nor==='hura'&&a.nori===null&&a.nork===nork&&a.mood===mood&&a.tense===tense&&
      a.treatment===treatment&&!a.allocutive&&
      (!['toka','noka'].includes(treatment)||a.validation==='reviewed')))
      failures.push(`PDF ${spec.pages.join('/')}: ${spec.lemma} ${series} ${form} analisia falta edo desegokia da`);
  }
}
// EMAN NN9/NNN9 (printed pp. 169¹–170¹). The second page prints the
// singular-NOR matrix and a productive plural-NOR substitution note; the
// 1977 original below prints both full columns.
const emanNn9=[
  ['demadan','hura',null,'ni','neutral'],['emak','hura',null,'hi','toka'],['eman','hura',null,'hi','noka'],
  ['bema','hura',null,'hura','neutral'],['demagun','hura',null,'gu','neutral'],['emazu','hura',null,'zu','neutral'],
  ['emazue','hura',null,'zuek','neutral'],['bemate','hura',null,'haiek','neutral'],
  ['dematzadan','haiek',null,'ni','neutral'],['emaitzak','haiek',null,'hi','toka'],['emaitzan','haiek',null,'hi','noka'],
  ['bematza','haiek',null,'hura','neutral'],['dematzagun','haiek',null,'gu','neutral'],['emaitzazu','haiek',null,'zu','neutral'],
  ['emaitzazue','haiek',null,'zuek','neutral'],['bematzate','haiek',null,'haiek','neutral'],
] as [string,Person,null,Person,Analysis['treatment']][];
const emanRecipients:[Person,[Person,string,string,Analysis['treatment']][]][]=[
  ['ni',[
    ['hi','emadak','emazkidak','toka'],['hi','emadan','emazkidan','noka'],['hura','bemakit','bemazkit','neutral'],
    ['zu','emadazu','emazkidazu','neutral'],['zuek','emadazue','emazkidazue','neutral'],['haiek','bemakidate','bemazkidate','neutral']]],
  ['hi',[
    ['hura','bemakik','bemazkik','toka'],['hura','bemakin','bemazkin','noka'],
    ['haiek','bemakiate','bemazkiate','toka'],['haiek','bemakinate','bemazkinate','noka']]],
  ['hura',[
    ['hi','emaiok','emazkiok','toka'],['hi','emaion','emazkion','noka'],['hura','bemakio','bemazkio','neutral'],
    ['zu','emaiozu','emazkiozu','neutral'],['zuek','emaiozue','emazkiozue','neutral'],['haiek','bemakiote','bemazkiote','neutral']]],
  ['gu',[
    ['hi','emaguk','emazkiguk','toka'],['hi','emagun','emazkigun','noka'],['hura','bemakigu','bemazkigu','neutral'],
    ['zu','emaguzu','emazkiguzu','neutral'],['zuek','emaguzue','emazkiguzue','neutral'],['haiek','bemakigute','bemazkigute','neutral']]],
  ['zu', [['hura','bemakizu','bemazkizu','neutral'],['haiek','bemakizute','bemazkizute','neutral']]],
  ['zuek',[['hura','bemakizue','bemazkizue','neutral'],['haiek','bemakizuete','bemazkizuete','neutral']]],
  ['haiek',[
    ['hi','emaiek','emazkiek','toka'],['hi','emaien','emazkien','noka'],['hura','bemakie','bemazkie','neutral'],
    ['zu','emaiezu','emazkiezu','neutral'],['zuek','emaiezue','emazkiezue','neutral'],['haiek','bemakiete','bemazkiete','neutral']]],
];
const emanNnn9:[string,Person,Person,Person,Analysis['treatment']][]=[];
for(const [nori,forms] of emanRecipients) for(const [nork,singular,plural,treatment] of forms) {
  emanNnn9.push([singular,'hura',nori,nork,treatment]);
  emanNnn9.push([plural,'haiek',nori,nork,treatment]);
}
for(const spec of [{page:360,rows:emanNn9},{page:362,rows:emanNnn9.filter(row=>row[1]==='hura')}] as const) {
  const raw=pages[spec.page-1]; const source=raw.toLowerCase().replace(/\s+/g,'');
  if(!raw?.includes('EMAN')||!source.includes(spec.page===360?'1691':'170i'))
    failures.push(`PDF ${spec.page}: EMAN paradigma-aingurak falta dira`);
  for(const [form,nor,nori,nork,treatment] of spec.rows) {
    checked++;
    const paired=treatment==='noka'?(form.endsWith('n')?form.slice(0,-1)+'k':form.replace(/nate$/,'ate')):null;
    const ocrAliases:Record<string,string>={emaiozue:'emalozue'};
    if(!source.includes(form)&&!source.includes(ocrAliases[form]??'\0')&&
      !(paired&&(source.includes(paired+'m')||source.includes(paired+'tn')))&&
      !(form==='bemakinate'&&source.includes('bemakiatemate')))
      failures.push(`PDF ${spec.page}: EMAN ${form} falta da`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='eman'&&a.kind==='synthetic'&&a.mood==='imperative'&&a.tense==='present'&&
      a.nor===nor&&a.nori===nori&&a.nork===nork&&a.treatment===treatment&&!a.allocutive&&
      (!['toka','noka'].includes(treatment)||a.validation==='reviewed')))
      failures.push(`PDF ${spec.page}: EMAN ${form} analisia falta edo desegokia da`);
  }
}
// Printed pp. 154¹–157¹: IHARDUN and IHARDUKI have compact NOR-NORK
// tables. The OCR turns one h into b and several printed k/n cells into
// "kln"; only those observed glyph errors are normalized here.
const norkPages = [
  { page:330, lemma:'jardun', layout:'n1n2n3' },
  { page:332, lemma:'jardun', layout:'n4n9' },
  { page:334, lemma:'iharduki', layout:'n1n2n3' },
  { page:336, lemma:'iharduki', layout:'n4n9' },
] as const;
for (const spec of norkPages) {
  const source=pages[spec.page-1];
  if(!source?.includes(spec.lemma==='jardun'?'IHARDUN':'IHARDUKI')) {
    failures.push(`PDF ${spec.page}: paradigma-izenburua falta da`);continue;
  }
  const rows=[...source.replace(/^\s*\.2(?=\s)/gm,'2')
    .matchAll(/^\s*'?([123](?:')?)\s+([a-z][a-z/]+)(?=\s|$)/gm)]
    .map(match=>({label:match[1],raw:match[2]}));
  const expectedRows=spec.layout==='n1n2n3'?21:12;
  if(rows.length!==expectedRows){failures.push(`PDF ${spec.page}: ${rows.length} lerro (espero ziren ${expectedRows})`);continue;}
  const series=spec.layout==='n1n2n3'?['N1','N2','N3'] as const:['N4','N9'] as const;
  for(let s=0;s<series.length;s++) {
    const label=series[s];
    const subjects=label==='N9'?imperative:seven;
    for(let i=0;i<subjects.length;i++) {
      const row=rows[s*7+i];
      const printedLabel=label==='N9'?['2','3','2',"2'",'3'][i]:['1','2','3','1','2',"2'",'3'][i];
      if(row.label!==printedLabel) failures.push(`PDF ${spec.page}, ${label}: ${i+1}. pertsona-etiketa ${row.label}`);
      const raw=row.raw;
      const forms=/k\/n$/.test(raw)?[raw.replace(/\/n$/,''),raw.replace(/k\/n$/,'n')]:
        /kln$/.test(raw)?[raw.replace(/ln$/,''),raw.replace(/kln$/,'n')]:[raw==='zibarduten'?'ziharduten':raw];
      for(const form of forms) {
        checked++;
        const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
        const expected=label==='N4'&&spec.lemma==='iharduki'?
          {mood:'potential',tense:'hypothetical'} as const:label==='N4'?
          {mood:'consequence',tense:'present'} as const:moods[label];
        if(!analyses.some(a=>a.lemma===spec.lemma&&a.kind==='synthetic'&&a.type==='nor-nork'&&
          a.nor==='hura'&&a.nori===null&&a.nork===subjects[i]&&a.mood===expected?.mood&&a.tense===expected.tense))
          failures.push(`PDF ${spec.page}, ${spec.lemma} ${label}, ${subjects[i]}: ${form}`);
      }
    }
  }
}
// The short official ERAUNTSI/EUTSI matrices (printed 163¹/164¹). Their
// nori/nork columns are unambiguous; ambiguous -on/-an shorthand is not
// expanded into a second recipient without independent confirmation.
for(const spec of [
  {page:348,lemma:'erauntsi',rows:[
    ['derauntso','zerauntson','balerauntso','lerauntsoke'],
    ['derauntsote','zerauntsoten','balerauntsote','lerauntsokete'],
    ['derauntse','zerauntsen','balerauntse','lerauntseke'],
    ['derauntsete','zerauntseten','balerauntsete','lerauntsekete'],
  ],imperative:['berauntso','berauntsote','berauntse','berauntsete']},
  {page:350,lemma:'eutsi',rows:[
    ['dautso','zeutson','baleutso','leutsoke'],
    ['dautsote','zeutsoten','baleutsote','leutsokete'],
    ['dautse','zeutsen','baleutse','leutseke'],
    ['dautsete','zeutseten','baleutsete','leutsekete'],
  ],imperative:['beutso','beutsote','beutse','beutse']},
] as const) {
  const source=pages[spec.page-1];
  if(!source?.includes(spec.lemma.toUpperCase())||!source.includes(spec.page===348?'163 1':'164 1'))
    failures.push(`PDF ${spec.page}: ${spec.lemma} paradigma-aingurak falta dira`);
  for(let row=0;row<4;row++) {
    const nori:Person=row<2?'hura':'haiek';
    const nork:Person=row%2?'haiek':'hura';
    for(let col=0;col<4;col++) {
      const form=spec.rows[row][col];checked++;
      if(!new RegExp(`(?<![a-z])${form}(?![a-z])`).test(source))
        failures.push(`PDF ${spec.page}: ${form} ezin da jatorrizko taulan aurkitu`);
      const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
      const expected=[
        {mood:'indicative',tense:'present'}, {mood:'indicative',tense:'past'},
        {mood:'conditional',tense:'hypothetical'}, {mood:'potential',tense:'hypothetical'},
      ][col];
      if(!analyses.some(a=>a.lemma===spec.lemma&&a.type==='nor-nori-nork'&&a.nor==='hura'&&
        a.nori===nori&&a.nork===nork&&a.mood===expected.mood&&a.tense===expected.tense))
        failures.push(`PDF ${spec.page}: ${form} -> NORI ${nori}, NORK ${nork}, ${expected.mood}`);
    }
    if(spec.lemma==='erauntsi') {
      const imperativeForm=spec.imperative[row];checked++;
      if(!new RegExp(`(?<![a-z])${imperativeForm}(?![a-z])`).test(source))
        failures.push(`PDF ${spec.page}: ${imperativeForm} agintera ezin da aurkitu`);
      const imperativeAnalyses=(lookup.all(imperativeForm,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
      if(!imperativeAnalyses.some(a=>a.lemma===spec.lemma&&a.type==='nor-nori-nork'&&a.nor==='hura'&&
        a.nori===nori&&a.nork===nork&&a.mood==='imperative'&&a.tense==='present'))
        failures.push(`PDF ${spec.page}: ${imperativeForm} agintera -> NORI ${nori}, NORK ${nork}`);
    }
  }
}
// EUTSI p. 164¹ has twenty imperative readings. Its final beutse is a
// genuine repetition in the printed 1979 table, not an OCR artefact; the
// 1977 source instead has beutsete for that plural-subject cell.
const eutsiPage=pages[349];
const compactEutsi=eutsiPage?.toLowerCase().replace(/\s+/g,'')??'';
const eutsiImperatives:[string,Person,Person,Analysis['treatment']][]=[
  ['eustak','ni','hi','toka'],['eustan','ni','hi','noka'],
  ['eustazu','ni','zu','neutral'],['eustazue','ni','zuek','neutral'],
  ['euskuk','gu','hi','toka'],['euskun','gu','hi','noka'],
  ['euskuzu','gu','zu','neutral'],['euskuzue','gu','zuek','neutral'],
  ['eutsiok','hura','hi','toka'],['eutsion','hura','hi','noka'],
  ['beutso','hura','hura','neutral'],['eutsiozu','hura','zu','neutral'],
  ['eutsiozue','hura','zuek','neutral'],['beutsote','hura','haiek','neutral'],
  ['eutsiek','haiek','hi','toka'],['eutsien','haiek','hi','noka'],
  ['beutse','haiek','hura','neutral'],['eutsiezu','haiek','zu','neutral'],
  ['eutsiezue','haiek','zuek','neutral'],['beutse','haiek','haiek','neutral'],
];
for(const [form,nori,nork,treatment] of eutsiImperatives) {
  checked++;
  const toka=treatment==='noka'?eutsiImperatives.find(row=>row[1]===nori&&row[2]===nork&&row[3]==='toka')?.[0]:null;
  const visible=form==='beutse'&&nork==='haiek'?
    (eutsiPage?.match(/(?<![a-z])beutse(?![a-z])/g)?.length??0)>=2:
    compactEutsi.includes(form)||(toka!==null&&compactEutsi.includes(toka+'m'));
  if(!visible)failures.push(`PDF 350: EUTSI NNN9 ${form} (${nori}, ${nork}) falta da`);
  const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma==='eutsi'&&a.kind==='synthetic'&&a.type==='nor-nori-nork'&&
    a.mood==='imperative'&&a.tense==='present'&&a.nor==='hura'&&a.nori===nori&&a.nork===nork&&
    a.treatment===treatment&&!a.allocutive&&a.validation==='reviewed'&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
    failures.push(`PDF 350: EUTSI NNN9 ${form} analisia falta edo desegokia da`);
}
for(const [form,nori,nork,treatment,validation] of [
  ['eutsok','hura','hi','toka','reviewed'],['eutson','hura','hi','noka','reviewed'],
  ['eutsozu','hura','zu','neutral','generated'],['eutsozue','hura','zuek','neutral','generated'],
  ['eutsek','haiek','hi','toka','generated'],['eutsen','haiek','hi','noka','generated'],
  ['eutsezu','haiek','zu','neutral','generated'],['eutsezue','haiek','zuek','neutral','generated'],
] as [string,Person,Person,Analysis['treatment'],Analysis['validation']][]) {
  noteVariants++;
  const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!analyses.some(a=>a.lemma==='eutsi'&&a.mood==='imperative'&&a.nor==='hura'&&a.nori===nori&&a.nork===nork&&
    a.treatment===treatment&&a.validation===validation&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')))
    failures.push(`PDF 350: EUTSIren i gabeko ${form} aldaera falta edo desegokia da`);
}
if(originalPdf) {
  const originalPages=execFileSync('pdftotext',['-layout',originalPdf,'-'],{
    encoding:'utf8',maxBuffer:20*1024*1024,
  }).split('\f');
  const egin1977=originalPages[45]??''; // printed p. 829, EGIN
  if(!egin1977.includes('EGIN')||!new RegExp('(?<![a-z])begitzate(?![a-z])').test(egin1977))
    failures.push('1977ko PDF 46: EGIN/begitzate aingurak falta dira');
  for(const reading of egin1977Readings) for(const interpretation of reading.interpretations) {
    originalChecked++;
    if(!new RegExp(`(?<![a-z])${reading.form}(?![a-z])`).test(egin1977))
      failures.push(`1977ko PDF 46: EGIN ${reading.form} falta da`);
    const analyses=(lookup.all(reading.form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='egin'&&a.type==='nor-nork'&&a.nor===reading.nor&&a.nori===null&&
      a.nork===reading.nork&&a.treatment===reading.treatment&&a.mood===interpretation.mood&&
      a.tense===interpretation.tense&&a.validation===(reading.series==='NN4'?'generated':'reviewed')&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')))
      failures.push(`1977ko PDF 46: EGIN ${reading.form} analisia/aipamena falta edo desegokia da`);
  }
  originalChecked++;
  const egin1977Nnn=originalPages[46]??''; // printed p. 830
  if(!new RegExp(`(?<![a-z])${egin1977NnnReading.form}(?![a-z])`).test(egin1977Nnn))
    failures.push(`1977ko PDF 47: EGIN ${egin1977NnnReading.form} falta da`);
  const egin1977NnnAnalyses=(lookup.all(egin1977NnnReading.form,'batua') as {payload:string}[])
    .map(r=>JSON.parse(r.payload) as Analysis);
  if(!egin1977NnnAnalyses.some(a=>a.lemma==='egin'&&a.type==='nor-nori-nork'&&a.nor==='hura'&&
    a.nori==='haiek'&&a.nork==='haiek'&&a.mood==='imperative'&&a.validation==='reviewed'&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')))
    failures.push(`1977ko PDF 47: EGIN ${egin1977NnnReading.form} analisia/aipamena falta edo desegokia da`);
  originalChecked++;
  const erabili1977=originalPages[34]??''; // printed p. 818, ERABILI
  if(!erabili1977.includes('ERABILI')||!new RegExp(`(?<![a-z])${erabili1977Reading.form}(?![a-z])`).test(erabili1977))
    failures.push(`1977ko PDF 35: ERABILI ${erabili1977Reading.form} falta da`);
  const erabili1977Analyses=(lookup.all(erabili1977Reading.form,'batua') as {payload:string}[])
    .map(r=>JSON.parse(r.payload) as Analysis);
  if(!erabili1977Analyses.some(a=>a.lemma==='erabili'&&a.type==='nor-nork'&&a.nor==='gu'&&a.nori===null&&
    a.nork==='haiek'&&a.mood==='indicative'&&a.tense==='past'&&a.validation==='reviewed'&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')))
    failures.push(`1977ko PDF 35: ERABILI ${erabili1977Reading.form} analisia/aipamena falta edo desegokia da`);
  const original=originalPages[42]; // printed p. 826, EUTSI
  if(!original?.includes('EUTSI')||!/\b826\b/.test(original))
    failures.push('1977ko PDF 43: EUTSI/826 orrialde-aingurak falta dira');
  for(const [form,nori,nork] of [
    ['deutso','hura','hura'],['deutsote','hura','haiek'],
    ['deutse','haiek','hura'],['deutsete','haiek','haiek'],
  ] as [string,Person,Person][]) {
    if(!new RegExp(`^\\s*${form}\\b`,'m').test(original))
      failures.push(`1977ko PDF 43: ${form} jatorrizko zutabean falta da`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='eutsi'&&a.nor==='hura'&&a.nori===nori&&a.nork===nork&&
      a.mood==='indicative'&&a.tense==='present'&&a.validation==='reviewed'&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')))
      failures.push(`1977ko PDF 43: ${form} irakurketaren aipamena/egiaztapena falta da`);
  }
  for(const [form,nori,nork,treatment] of [
    ...eutsiImperatives.filter(row=>!(row[0]==='beutse'&&row[2]==='haiek')),
    ['beutsete','haiek','haiek','neutral'],
  ] as [string,Person,Person,Analysis['treatment']][]) {
    originalChecked++;
    const toka=treatment==='noka'?eutsiImperatives.find(row=>row[1]===nori&&row[2]===nork&&row[3]==='toka')?.[0]:null;
    const originalSpelling=form==='euskuzue'?'euskuzüe':form;
    if(!original.includes(originalSpelling)&&!(toka&&original.includes(`${toka}/${form}`)))
      failures.push(`1977ko PDF 43: EUTSI ${form} agintera falta da`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='eutsi'&&a.mood==='imperative'&&a.tense==='present'&&a.nor==='hura'&&
      a.nori===nori&&a.nork===nork&&a.treatment===treatment&&a.validation==='reviewed'&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')))
      failures.push(`1977ko PDF 43: EUTSI ${form} analisia/aipamena falta edo desegokia da`);
  }
  const earlyOriginalSources:Record<string,string>={
    atxiki:(originalPages[21]??'')+(originalPages[22]??''),
    jarraiki:(originalPages[23]??'')+(originalPages[24]??''),
    ekin:originalPages[25]??'',jario:originalPages[26]??'',
  };
  for(const reading of earlyNorNoriReadings) {
    if(reading.lemma==='atxiki'&&reading.form==='zentxezkiokete'&&reading.nori==='haiek')continue;
    // The 1977 JARRAIKI table omits garraizkie and misprints
    // zinderraizkien as ginderraizkien; both are explicit in 1979.
    if(reading.lemma==='jarraiki'&&['garraizkie','zinderraizkien'].includes(reading.form))continue;
    originalChecked++;
    const source=earlyOriginalSources[reading.lemma]??'';
    const compact=source.toLowerCase().replace(/\s+/g,'');
    const toka=reading.treatment==='noka'?earlyNorNoriReadings.find(r=>r.lemma===reading.lemma&&
      r.series===reading.series&&r.nor===reading.nor&&r.nori===reading.nori&&r.treatment==='toka')?.form:null;
    const aliases:Record<string,string>={zetxekian:'zetxekiaiv',garraizkik:'garrraizkik',
      ginderraizkian:'gmderraizkian',zinderraizkiguke:'zmderraizkiguke',
      ninderraizueke:'nmderraizueke'};
    const visibleToka=toka&&(aliases[toka]??toka);
    const damagedSlash=reading.form==='zetxekinan'&&compact.includes('zetxekiaiv-kinan');
    if(!compact.includes(reading.form)&&!compact.includes(aliases[reading.form]??'\0')&&
      !(visibleToka&&compact.includes(visibleToka+'/-'))&&!damagedSlash)
      failures.push(`1977ko PDF: ${reading.heading} ${reading.form} falta da`);
    const analyses=(lookup.all(reading.form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma===reading.lemma&&a.type==='nor-nori'&&a.nor===reading.nor&&
      a.nori===reading.nori&&a.nork===null&&a.treatment===reading.treatment&&
      reading.interpretations.some(i=>a.mood===i.mood&&a.tense===i.tense)&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')))
      failures.push(`1977ko PDF: ${reading.form} analisia/aipamena falta edo desegokia da`);
  }
  originalChecked++;
  const originalAtxeki=(earlyOriginalSources.atxiki??'').toLowerCase().replace(/\s+/g,'');
  if(!originalAtxeki.includes('zentxezkiekete'))failures.push('1977ko PDF 23: ATXEKI zentxezkiekete falta da');
  const originalAtxekiAnalyses=(lookup.all('zentxezkiekete','batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
  if(!originalAtxekiAnalyses.some(a=>a.lemma==='atxiki'&&a.type==='nor-nori'&&a.nor==='zuek'&&a.nori==='haiek'&&
    a.validation==='generated'&&a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')))
    failures.push('1977ko PDF 23: ATXEKI zentxezkiekete analisia/aipamena falta da');
  // Printed p. 841, physical PDF p. 58: two complete NOR-NORK matrices.
  // The original prints IRUDI; the present lexicon maps that family to
  // iruditu, as documented separately in Hiztegi Batua.
  const compact=originalPages[57];
  if(!compact?.includes('IRAUN')||!compact.includes('IRUDI')||!/\b841\b/.test(compact))
    failures.push('1977ko PDF 58: IRAUN/IRUDI orrialde-aingurak falta dira');
  for(const [heading,lemma] of [['IRAUN','iraun'],['IRUDI','iruditu']] as const) {
    const section=compact.split(new RegExp(`^\\s*${heading}\\s*$`,'m'))[1]?.split(/^\s*[A-Z]{4,}\s*$/m)[0]??'';
    const rows=section.split('\n').filter(line=>/^\s*[a-z]/i.test(line)).slice(0,7)
      .map(line=>line.trim().replace('m rauen','nirauen').split(/\s{2,}/));
    if(rows.length!==7){failures.push(`1977ko PDF 58: ${heading} ${rows.length} lerro`);continue;}
    for(let i=0;i<7;i++) {
      if(rows[i].length!==(i===1||i===2||i>=4?5:4))
        failures.push(`1977ko PDF 58: ${heading} ${i+1}. lerroaren luzera ${rows[i].length}`);
      for(let col=0;col<rows[i].length;col++) {
        const cell=rows[i][col];
        const forms=cell.endsWith('/-n')?[cell.replace('/-n',''),cell.replace(/k\/-n$/,'n')]:[cell];
        for(const form of forms) {
          originalChecked++;
          const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
          const expected=[
            {mood:'indicative',tense:'present'}, {mood:'indicative',tense:'past'},
            {mood:'conditional',tense:'hypothetical'}, {mood:'consequence',tense:'present'},
            {mood:'imperative',tense:'present'},
          ][col];
          if(!analyses.some(a=>a.lemma===lemma&&a.kind==='synthetic'&&a.type==='nor-nork'&&
            a.nor==='hura'&&a.nori===null&&a.nork===seven[i]&&
            a.mood===expected.mood&&a.tense===expected.tense))
            failures.push(`1977ko PDF 58: ${heading}, ${seven[i]}, ${col+1}. saila: ${form}`);
        }
      }
    }
  }
  const ihardukiOriginal=originalPages[57]?.split(/^\s*IHARDUKI\s*$/m)[1]?.split(/^\s*IRAUN\s*$/m)[0]??'';
  for(const form of [
    'dihardukazue','hihardukake','zenihardukake','zenihardukakete',
    'ihardukak','ihardukan','biharduka','ihardukazu','ihardukazue','bihardukate',
  ]) {
    originalChecked++;
    const visible=form==='ihardukan'?ihardukiOriginal.includes('ihardukak/-n'):
      new RegExp(`(?<![a-z])${form}(?![a-z])`).test(ihardukiOriginal);
    if(!visible)failures.push(`1977ko PDF 58: IHARDUKI ${form} falta da`);
  }
  const erauntsiOriginal=originalPages[55];
  if(!erauntsiOriginal?.includes('ERAUNTSI')||!/\b839\b/.test(erauntsiOriginal))
    failures.push('1977ko PDF 56: ERAUNTSI/839 aingurak falta dira');
  for(const form of ['berauntso','berauntsote','berauntse','berauntsete']) {
    originalChecked++;
    if(!new RegExp(`(?<![a-z])${form}(?![a-z])`).test(erauntsiOriginal))
      failures.push(`1977ko PDF 56: ERAUNTSI ${form} falta da`);
  }
  const eroanOriginal=originalPages[56]; // printed p. 840
  if(!eroanOriginal?.includes('EROAN')||!/\b840\b/.test(eroanOriginal))
    failures.push('1977ko PDF 57: EROAN/840 aingurak falta dira');
  for(const form of ['eroak','eroan','beroa','eroazu','eroazue','beroate',
    'eroaitzak','eroaitzan','beroatza','eroaitzazu','eroaitzazue','beroatzate']) {
    originalChecked++;
    const visible=form==='eroan'?eroanOriginal.includes('eroak/-n'):
      form==='eroaitzan'?eroanOriginal.includes('eroaitzak/-n'):
      new RegExp(`(?<![a-z])${form}(?![a-z])`).test(eroanOriginal);
    if(!visible)failures.push(`1977ko PDF 57: EROAN ${form} falta da`);
  }
  const emanOriginal=(originalPages[58]??'')+(originalPages[59]??''); // printed pp. 842–843
  const emanSource=emanOriginal.toLowerCase().replace(/\s+/g,'');
  if(!/\b842\b/.test(emanOriginal)||!emanSource.includes('eman'))
    failures.push('1977ko PDF 59–60: EMAN/842 paradigma-aingurak falta dira');
  for(const [form,nor,nori,nork,treatment] of [...emanNn9,...emanNnn9]) {
    originalChecked++;
    const paired=treatment==='noka'?(form.endsWith('n')?form.slice(0,-1)+'k':form.replace(/nate$/,'ate')):null;
    const ocrAliases:Record<string,string>={emaiozue:'emalozue'};
    if(!emanSource.includes(form)&&!emanSource.includes(ocrAliases[form]??'\0')&&
      !(paired&&(emanSource.includes(paired+'/-n')||emanSource.includes(paired+'/-kinate'))))
      failures.push(`1977ko PDF 59–60: EMAN ${form} falta da`);
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!analyses.some(a=>a.lemma==='eman'&&a.kind==='synthetic'&&a.mood==='imperative'&&a.tense==='present'&&
      a.nor===nor&&a.nori===nori&&a.nork===nork&&a.treatment===treatment&&!a.allocutive&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')))
      failures.push(`1977ko PDF 59–60: EMAN ${form} analisia/aipamena falta edo desegokia da`);
  }
  const erakutsiOriginal=originalPages[54]; // printed p. 838
  if(!erakutsiOriginal||!/\b838\b/.test(erakutsiOriginal))
    failures.push('1977ko PDF 55: ERAKUTSI/838 aingurak falta dira');
  for(const stem of ['erakusta','erakusku','erakutsio','erakutsie',
    'erakutsazkida','erakutsazkigu','erakutsazkio','erakutsazkie']) {
    for(const suffix of ['k','n']) {
      originalChecked++;
      const visible=new RegExp(`(?<![a-z])${stem}k(?:/|Z)-n`).test(erakutsiOriginal);
      if(!visible)failures.push(`1977ko PDF 55: ERAKUTSI ${stem+suffix} genero-bikotea falta da`);
    }
  }
}
db.close();
console.log(`${pageSpecs.length + 58 + norkPages.length + 2} paradigma-orri ofizial, ${checked} adizki-agerpen eta ${noteVariants} ohar-aldaera; 1977ko jatorrizkoan ${originalPdf?originalChecked+' agerpen, EUTSI/JARRAIKI/ERABILI/EGIN iturri-desberdintasunak egiaztatuak':'ez da auditatu'}; ${failures.length} hutsune/desadostasun`);
if (failures.length) { for (const failure of failures.slice(0, 100)) console.error(failure); process.exitCode = 1; }
