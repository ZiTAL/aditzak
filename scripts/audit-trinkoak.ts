import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import type { Analysis, Mood, Person, Tense } from '../packages/shared/src/index.ts';
import { defaultDatabasePath } from '../apps/api/src/database.js';

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
    const imperativeForm=spec.imperative[row];checked++;
    if(!new RegExp(`(?<![a-z])${imperativeForm}(?![a-z])`).test(source))
      failures.push(`PDF ${spec.page}: ${imperativeForm} agintera ezin da aurkitu`);
    const imperativeAnalyses=(lookup.all(imperativeForm,'batua') as {payload:string}[]).map(r=>JSON.parse(r.payload) as Analysis);
    if(!imperativeAnalyses.some(a=>a.lemma===spec.lemma&&a.type==='nor-nori-nork'&&a.nor==='hura'&&
      a.nori===nori&&a.nork===nork&&a.mood==='imperative'&&a.tense==='present'))
      failures.push(`PDF ${spec.page}: ${imperativeForm} agintera -> NORI ${nori}, NORK ${nork}`);
  }
}
if(originalPdf) {
  const originalPages=execFileSync('pdftotext',['-layout',originalPdf,'-'],{
    encoding:'utf8',maxBuffer:20*1024*1024,
  }).split('\f');
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
}
db.close();
console.log(`${pageSpecs.length + 3 + norkPages.length + 2} paradigma-orri ofizial, ${checked} adizki-agerpen; 1977ko jatorrizkoan ${originalPdf?originalChecked+' agerpen eta EUTSI gatazka egiaztatuak':'ez da auditatu'}; ${failures.length} hutsune/desadostasun`);
if (failures.length) { for (const failure of failures.slice(0, 100)) console.error(failure); process.exitCode = 1; }
