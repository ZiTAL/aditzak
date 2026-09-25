import { readFileSync, mkdirSync, writeFileSync, renameSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { parseDictionary, expandEntry, type Entry } from './dictionary.js';
import { allocutiveCandidates } from './allocutive.js';
import { earlyNorNoriReadings } from './nor-nori-paradigms.js';
import { edukiReadings, ekarriNorNorkReadings } from './nor-nork-paradigms.js';
import { ekarriNnnPrinted, ekarriNnnDerived, eramanNnnPrinted, eramanNnnDerived } from './ekarri-nnn-paradigms.js';
import type { Analysis, Coverage, Mood, Tense, Person, Source, Treatment } from '../packages/shared/src/index.js';

const root = new URL('../', import.meta.url);
const vendor = new URL('data/vendor/apertium-eus/apertium-eus.eus.dix', root);
if (!existsSync(vendor)) throw new Error('Lehenik exekutatu: npm run data:fetch');
const xml = readFileSync(vendor, 'utf8');
const digest = createHash('sha256').update(xml).digest('hex');
if (digest !== '5c4350f368c26079352f6acbb28b048ea4abc66bbe1d6498eba40cd3ad6c3903') throw new Error('Corpus checksum mismatch');
console.log('Apertium DIX irakurtzen…');
const dictionary = parseDictionary(xml);
const output = new URL('data/generated/', root);
mkdirSync(output, { recursive: true });
const temporary = new URL('aditzak.build.sqlite', output);
// Only this disposable builder-owned path is replaced; the serving DB is untouched until success.
if (existsSync(temporary)) rmSync(temporary);
const db = new DatabaseSync(fileURLToPath(temporary));
db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=OFF;
  CREATE TABLE varieties (id TEXT PRIMARY KEY, label TEXT NOT NULL) STRICT;
  INSERT INTO varieties VALUES ('batua','Euskara batua');
  CREATE TABLE sources (id TEXT PRIMARY KEY, payload TEXT NOT NULL CHECK(json_valid(payload))) STRICT;
  CREATE TABLE lemmas (id TEXT PRIMARY KEY, kind TEXT NOT NULL) STRICT;
  CREATE TABLE analyses (id TEXT PRIMARY KEY, form TEXT NOT NULL, lemma TEXT NOT NULL REFERENCES lemmas(id),
    variety TEXT NOT NULL REFERENCES varieties(id), base INTEGER NOT NULL CHECK(base IN (0,1)),
    source TEXT NOT NULL REFERENCES sources(id), payload TEXT NOT NULL CHECK(json_valid(payload))) STRICT;
  CREATE INDEX by_form ON analyses(form,variety);
  CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
  PRAGMA user_version=1; BEGIN;`);
const sources = JSON.parse(readFileSync(new URL('data/sources.json', root), 'utf8')) as Source[];
for (const source of sources) db.prepare('INSERT INTO sources VALUES (?,?)').run(source.id, JSON.stringify(source));
const moods: Record<string, [Mood,Tense]> = {
  pri: ['indicative','present'], pii: ['indicative','past'],
  potpr: ['potential','present'], potps: ['potential','past'], poth: ['potential','hypothetical'],
  prs: ['subjunctive','present'], pis: ['subjunctive','past'], hs: ['subjunctive','hypothetical'],
  imp: ['imperative','present'], onpr: ['consequence','present'],
  prob1: ['probability','present'], prob2: ['probability','past'], bald: ['conditional','hypothetical'], prs2: ['subjunctive','present'],
  // *iro is encoded as ADL rather than vbsint in Apertium. Euskaltzaindia's
  // 14th rule lists these three finite series under the standardized hika tables.
  A5: ['potential','present'], B8: ['potential','past'], B7: ['potential','hypothetical'],
};
const people: Record<string,Person> = { NI:'ni', HI:'hi', HU:'hura', GU:'gu', ZU:'zu', ZK:'zuek', HK:'haiek' };
const auxiliaries = new Set(['izan','ukan','edin','ezan','iro']);
const erakutsiImperativeStems = new Set([
  'erakutsa',
  'erakusta','erakusku','erakutsio','erakutsie',
  'erakutsazkida','erakutsazkigu','erakutsazkio','erakutsazkie',
]);
const reviewedImperativeGender = new Map<string,Treatment>([
  ...[
    'dirauk','dirudik','irauk','irudik','emak','emadak','emaguk','emaiok','emaiek',
    'emazkidak','emazkiguk','emazkiok','emazkiek','bemakik','bemakiate',
    'bemazkik','bemazkiate',
  ].map(form=>[form,'toka'] as [string,Treatment]),
  ...[
    'diraun','dirudin','iraun','irudin','emadan','emagun','emaion','emaien',
    'emazkidan','emazkigun','emazkion','emazkien','bemakin','bemakinate',
    'bemazkin','bemazkinate',
  ].map(form=>[form,'noka'] as [string,Treatment]),
]);
const insert = db.prepare('INSERT OR IGNORE INTO analyses VALUES (?,?,?,?,?,?,?)');
const lemmaInsert = db.prepare('INSERT OR IGNORE INTO lemmas VALUES (?,?)');
const skipped: Record<string,number> = {};
let attempted = 0;
function importEntry(entry: Entry, paradigm: string, lemma: string | null, prefix = '', extracted = false) {
  const bare = entry.right.split('+')[0];
  const tags = [...bare.matchAll(/<([^>]+)>/g)].map(m => m[1]);
  // Apertium groups the dio-/nio- finite series under erran. Rule 14 treats
  // *io and erran as separate synthetic paradigms; retain erran imperatives.
  const correctedIzan=lemma==='ukan' && (tags.includes('TO') || tags.includes('NO')) &&
    !tags.some(t=>t.startsWith('NI_') || t.startsWith('NK_'));
  // A single irakatsi imperative is stored under erakutsi's upstream paradigm.
  const correctedIrakatsi=lemma==='erakutsi' && entry.left==='irakatsiguzu' && tags.includes('imp');
  const verb = correctedIrakatsi ? 'irakatsi' : correctedIzan ? 'izan' : lemma === 'erran' && (tags.includes('pri') || tags.includes('pii')) ? 'io' : lemma ?? bare.replace(/<[^>]*>/g, '');
  const temporal = tags.find(tag => moods[tag]);
  const nor = people[tags.find(t => t.startsWith('NR_'))?.slice(3) ?? ''];
  if (!verb || !nor || !temporal || !(tags.includes('vbsint') || (verb === 'iro' && tags.includes('ADL')))) {
    const key = tags.slice(0,2).join(':'); skipped[key] = (skipped[key] ?? 0) + 1; return;
  }
  const [mood, tense] = moods[temporal];
  const nori = people[tags.find(t => t.startsWith('NI_'))?.slice(3) ?? ''] ?? null;
  let nork = people[tags.find(t => t.startsWith('NK_'))?.slice(3) ?? ''] ?? null;
  const correctedDukezu=verb==='ukan' && entry.left==='dukezu' && nork==='zuek';
  if(correctedDukezu)nork='zu'; // rule 78: dukezu / dukezue
  const kind = auxiliaries.has(verb) ? 'auxiliary' : 'synthetic';
  lemmaInsert.run(verb, kind);
  const expanded = expandEntry(entry, dictionary);
  const plain = expanded.filter(e => !e.right.includes('+'));
  const baseForm = plain[0]?.left ?? null;
  for (const e of expanded) {
    const form = (prefix + e.left).normalize('NFC').toLowerCase();
    if (!/^[a-zñü]+$/.test(form)) { skipped['invalid-surface'] = (skipped['invalid-surface'] ?? 0) + 1; continue; }
    // Two upstream hika rows have agreement tags that contradict the
    // neutral/toka/noka row in Euskaltzaindia's 14th rule.
    const correctedNor=verb==='izan' && (form.startsWith('zitzaizkiguan') || form.startsWith('zitzaizkigunan'));
    const correctedNork=verb==='ukan' && (form.startsWith('zidakek') || form.startsWith('zidaken'));
    const actualNor=correctedNor?'haiek':nor;
    const actualNork=correctedNork?'hura':nork;
    const suffixes = e.right.split('+').slice(1);
    const affixes = [...(prefix ? ['ba<cnjsub>'] : []), ...suffixes];
    let treatment: Treatment = tags.includes('TO') ? 'toka' : tags.includes('NO') ? 'noka' : 'neutral';
    // The source encodes gender in the continuation when HI is an argument.
    if (treatment === 'neutral' && (nori === 'hi' || nork === 'hi')) {
      const peers=dictionary.paradigms.get(paradigm)??[];
      // LAT_19 is also used for past -n. Only a matched -k/-n pair proves gender.
      if (entry.refs.includes('LAT_19') && peers.some(p=>p.left===entry.left&&p.right===entry.right&&p.refs.includes('LAT_20'))) treatment = 'noka';
      else if (entry.refs.includes('LAT_20')) treatment = 'toka';
      else treatment = 'hika'; // never infer an unencoded gender from an arbitrary final letter
    }
    // The continuation lexicon leaves these two standardized noka forms
    // untagged; the 14th rule explicitly places them in the noka column.
    const standardizedNoka=verb === 'ezan' && ['liezazkidaketen','liezazkiguketen'].includes(form);
    if (standardizedNoka) treatment='noka';
    const standardizedToka=verb === 'ezan' && form==='geniezaiekean';
    if (standardizedToka)treatment='toka';
    // The 1979 Academy NN9 table and the 1977 original give explicit k/n
    // alternatives for these imperative stems. Upstream only tags HI,
    // leaving both readings as unspecified hika.
    const reviewedErakutsiGender=verb==='erakutsi'&&mood==='imperative'&&actualNork==='hi'&&
      affixes.length===0&&erakutsiImperativeStems.has(form.slice(0,-1))&&
      (form.endsWith('k')||form.endsWith('n'));
    if(reviewedErakutsiGender)treatment=form.endsWith('k')?'toka':'noka';
    const compactImperativeGender=(actualNork==='hi'||nori==='hi')&&affixes.length===0&&
      reviewedImperativeGender.get(form);
    if(compactImperativeGender)treatment=compactImperativeGender;
    const reviewedEmanImperative=verb==='eman'&&mood==='imperative'&&affixes.length===0;
    const payload: Analysis = {
      id: '', form, lemma: verb, kind, variety:'batua', mood, tense,
      type: nori ? (actualNork ? 'nor-nori-nork' : 'nor-nori') : (actualNork ? 'nor-nork' : 'nor'),
      nor:actualNor, nori, nork:actualNork, treatment, allocutive: tags.includes('TO') || tags.includes('NO') || standardizedNoka || standardizedToka,
      affixes, rawTags: [...tags, ...suffixes], baseForm: affixes.length ? baseForm : form,
      origin: extracted ? 'rule' : 'lexicon', validation: reviewedErakutsiGender||compactImperativeGender||reviewedEmanImperative?'reviewed':'imported',
      citations: [{ sourceId:'apertium', locator:`apertium-eus.eus.dix:${entry.line} (${paradigm}${entry.refs.length ? ' → '+entry.refs.join(', ') : ''}${extracted ? '; ba- gabe berreskuratutako indikatiboko oinarria' : ''})` },
        ...(standardizedNoka?[{sourceId:'euskaltzaindia14',locator:'14. araua, *ezan-en NOR-NORI-NORK alokutiboak; noka zutabea'}]:[]),
        ...(standardizedToka?[{sourceId:'euskaltzaindia14',locator:'14. araua, *ezan-en NOR-NORI-NORK alokutiboak; toka zutabea'}]:[]),
        ...(reviewedErakutsiGender?[{sourceId:'euskaltzaindia-eab1979',locator:nori===null?
          '150¹. or. (PDF 322), ERAKUTSI NN9, k/n alternantzia':'151¹. or. (PDF 324), ERAKUTSI NNN9, k/n alternantzia'},
          {sourceId:'euskaltzaindia-sintetikoa1977',locator:nori===null?
            '837. or., ERAKUTSIren NOR-NORK agintera, -k/-n bikotea':
            '838. or., ERAKUTSIren NOR-NORI-NORK agintera, -k/-n bikoteak'}]:[]),
        ...(compactImperativeGender&&verb!=='eman'?[{sourceId:'euskaltzaindia-eab1979',locator:
          `${verb==='iraun'?(mood==='imperative'?'166':'165'):(mood==='imperative'?'168':'167')}¹. or. (PDF ${verb==='iraun'?(mood==='imperative'?'354':'352'):(mood==='imperative'?'358':'356')}), ${verb.toUpperCase()} ${mood==='imperative'?'NN9':'NN1'}, k/n alternantzia`},
          {sourceId:'euskaltzaindia-sintetikoa1977',locator:'841. or., IRAUN/IRUDI aginterako -k/-n bikotea'}]:[]),
        ...(reviewedEmanImperative?[{sourceId:'euskaltzaindia-eab1979',locator:
          `${nori===null?'169':'170'}¹. or. (PDF ${nori===null?'360':'362'}), EMAN agintera`},
          {sourceId:'euskaltzaindia-sintetikoa1977',locator:'842–843. or., EMAN agintera'}]:[]),
        ...(correctedIzan?[{sourceId:'euskaltzaindia14',locator:'14. araua, izan-en NOR bakarreko alokutiboak; *edun etiketaren zuzenketa'}]:[]),
        ...(correctedNor?[{sourceId:'euskaltzaindia14',locator:'14. araua, izan-en NOR-NORI: zitzaizkigun / zitzaizkiguan / zitzaizkigunan'}]:[]),
        ...(correctedNork?[{sourceId:'euskaltzaindia14',locator:'14. araua, *edun-en NOR-NORI-NORK: didake / zidakek / zidaken'}]:[]),
        ...(correctedDukezu?[{sourceId:'euskaltzaindia78',locator:'78. araua, *edun NOR-NORK (nor: hura): dukezu/dukezue'}]:[])],
      segmentation:null, history:[],
    };
    const key = JSON.stringify([form,verb,tags,affixes,treatment]);
    payload.id = createHash('sha256').update(key).digest('hex').slice(0,24);
    insert.run(payload.id,form,verb,'batua',affixes.length ? 0 : 1,'apertium',JSON.stringify(payload));
    attempted++;
  }
}
for (const [name,entries] of dictionary.paradigms) {
  if (!name.endsWith('__vbsint')) continue;
  const lemma = name.replace('__vbsint','');
  for (const entry of entries) importEntry(entry,name,lemma);
  console.log(lemma, entries.length, 'sarrera');
}
for (const entry of dictionary.paradigms.get('BABALD') ?? []) importEntry(entry,'BABALD',null,'ba');
// These five lemmas have no standalone upstream paradigm. Their real indicative
// bases are recoverable under ba-. Never strip ba- from hypothetical/subjunctive entries.
for (const entry of dictionary.paradigms.get('BABALD') ?? []) {
  const verb=entry.right.split('<')[0];
  if (['erauntsi','eroan','iharduki','irakin','jario'].includes(verb) && /<(pri|pii)>/.test(entry.right)) importEntry(entry,'BABALD',null,'',true);
}
for (const [name, entries] of dictionary.paradigms) {
  if (!name.startsWith('LAT_')) continue;
  for (const entry of entries) {
    if (entry.right.startsWith('iro<ADL>')) importEntry(entry, name, 'iro');
  }
}
function insertGeneratedBase(form:string,lemma:string,kind:'auxiliary'|'synthetic',mood:Mood,tense:Tense,
  nor:Person,nori:Person|null,nork:Person|null,rulePage:number,sourceLocator:string|null=null,validation:Analysis['validation']='generated') {
  lemmaInsert.run(lemma,kind);
  const analysis:Analysis={id:createHash('sha256').update(JSON.stringify(['generated-base',form,lemma,mood,tense,nor,nori,nork])).digest('hex').slice(0,24),
    form,lemma,kind,variety:'batua',mood,tense,type:nori?(nork?'nor-nori-nork':'nor-nori'):(nork?'nor-nork':'nor'),
    nor,nori,nork,treatment:'neutral',allocutive:false,affixes:[],rawTags:['generated-base',lemma,mood,tense],
    baseForm:form,origin:'rule',validation,segmentation:null,history:[],
    citations:[...(sourceLocator?[{sourceId:'wiktionary-eu-verb',locator:sourceLocator}]:[]),
      {sourceId:'euskaltzaindia14',locator:`${rulePage}. or., ${lemma} paradigma; oinarrizko forma`}]};
  insert.run(analysis.id,form,lemma,'batua',1,sourceLocator?'wiktionary-eu-verb':'euskaltzaindia14',JSON.stringify(analysis));
}
// The first nine NOR-NORI synthetic pages (ATXEKI, JARRAIKI, EKIN and
// JARIO) share a dense agreement layout. Attach the official evidence to
// every reading and fill any source cell absent upstream. NN4's grammatical
// label is editorial, so its two lexicon-compatible interpretations remain
// generated even though the printed form and agreement are source-checked.
const updateOfficialNorNori=db.prepare('UPDATE analyses SET payload=?,source=? WHERE id=?');
for(const reading of earlyNorNoriReadings) for(const interpretation of reading.interpretations) {
  const rows=db.prepare('SELECT id,payload FROM analyses WHERE form=? AND lemma=? AND base=1')
    .all(reading.form,reading.lemma) as {id:string;payload:string}[];
  const row=rows.find(r=>{const a=JSON.parse(r.payload) as Analysis;return a.type==='nor-nori'&&
    a.nor===reading.nor&&a.nori===reading.nori&&a.nork===null&&
    a.mood===interpretation.mood&&a.tense===interpretation.tense;});
  const citation={sourceId:'euskaltzaindia-eab1979',locator:`${reading.printed}¹. or. (PDF ${reading.page}), ${reading.heading} ${reading.series}`};
  const originalLocator={atxiki:'805–806. or., ATXEKI/ETXEKI',jarraiki:'807–808. or., JARRAIKI/JARRAITU',
    ekin:'809. or., EKIN',jario:'810. or., JARIO/JARI(N)/JARIATU'}[reading.lemma];
  const printedAtxekiDuplicate=reading.lemma==='atxiki'&&reading.form==='zentxezkiokete'&&reading.nori==='haiek';
  const originalJarraikiDefect=reading.lemma==='jarraiki'&&['garraizkie','zinderraizkien'].includes(reading.form);
  const originalCitation=originalLocator&&!printedAtxekiDuplicate&&!originalJarraikiDefect?
    [{sourceId:'euskaltzaindia-sintetikoa1977',locator:originalLocator}]:[];
  const validation:Analysis['validation']=reading.series==='NN4'?'generated':'reviewed';
  if(row) {
    const analysis=JSON.parse(row.payload) as Analysis;
    Object.assign(analysis,{treatment:reading.treatment,allocutive:false,validation});
    analysis.rawTags=[...new Set([...analysis.rawTags,'eab1979',reading.series])];
    analysis.citations.push(citation,...originalCitation);
    if(reading.lemma==='atxiki')analysis.citations.push({sourceId:'euskaltzaindia-hb-atxiki',locator:'atxeki: ikus atxiki'});
    updateOfficialNorNori.run(JSON.stringify(analysis),'euskaltzaindia-eab1979',row.id);
  } else {
    const analysis:Analysis={
      id:createHash('sha256').update(JSON.stringify(['eab1979-nor-nori',reading.form,reading.lemma,
        interpretation.mood,interpretation.tense,reading.nor,reading.nori])).digest('hex').slice(0,24),
      form:reading.form,lemma:reading.lemma,kind:'synthetic',variety:'batua',mood:interpretation.mood,
      tense:interpretation.tense,type:'nor-nori',nor:reading.nor,nori:reading.nori,nork:null,
      treatment:reading.treatment,allocutive:false,affixes:[],rawTags:['eab1979',reading.series],
      baseForm:reading.form,origin:'rule',validation,segmentation:null,history:[],
      citations:[citation,...originalCitation,...(reading.lemma==='atxiki'?[{sourceId:'euskaltzaindia-hb-atxiki',locator:'atxeki: ikus atxiki'}]:[])],
    };
    lemmaInsert.run(reading.lemma,'synthetic');
    insert.run(analysis.id,analysis.form,analysis.lemma,'batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
  }
}
// The original 1977 table has zentxezkiekete in the ATXEKI zuek/haiek
// cell; the 1979 book replaced it with a duplicated zentxezkiokete. Keep
// the original reading alongside the later printed one.
for(const row of db.prepare('SELECT id,payload FROM analyses WHERE form=? AND lemma=? AND base=1')
  .all('zentxezkiekete','atxiki') as {id:string;payload:string}[]) {
  const analysis=JSON.parse(row.payload) as Analysis;
  if(analysis.type!=='nor-nori'||analysis.nor!=='zuek'||analysis.nori!=='haiek'||
    ![['consequence','present'],['potential','hypothetical']].some(([mood,tense])=>analysis.mood===mood&&analysis.tense===tense))continue;
  analysis.validation='generated';
  analysis.citations.push({sourceId:'euskaltzaindia-sintetikoa1977',locator:'806. or., ATXEKI/ETXEKI: zentxezkiekete'});
  updateOfficialNorNori.run(JSON.stringify(analysis),'euskaltzaindia-sintetikoa1977',row.id);
}
// EDUKI pp. 113¹–116¹: retain both values of the parenthesized -te(te)
// cells and expand each explicit k/n cell. As elsewhere, NN4 verifies the
// surface/agreement but leaves its two imported mood readings generated.
for(const reading of [...edukiReadings,...ekarriNorNorkReadings]) for(const interpretation of reading.interpretations) {
  const rows=db.prepare('SELECT id,payload FROM analyses WHERE form=? AND lemma=? AND base=1')
    .all(reading.form,reading.lemma) as {id:string;payload:string}[];
  const row=rows.find(r=>{const a=JSON.parse(r.payload) as Analysis;return a.type==='nor-nork'&&
    a.nor===reading.nor&&a.nori===null&&a.nork===reading.nork&&a.mood===interpretation.mood&&a.tense===interpretation.tense;});
  const citation={sourceId:'euskaltzaindia-eab1979',locator:`${reading.printed}¹. or. (PDF ${reading.page}), ${reading.heading} ${reading.series}`};
  const validation:Analysis['validation']=reading.series==='NN4'?'generated':'reviewed';
  if(row){
    const analysis=JSON.parse(row.payload) as Analysis;
    Object.assign(analysis,{treatment:reading.treatment,allocutive:false,validation});
    analysis.rawTags=[...new Set([...analysis.rawTags,'eab1979',reading.series])];analysis.citations.push(citation);
    updateOfficialNorNori.run(JSON.stringify(analysis),'euskaltzaindia-eab1979',row.id);
  }else{
    const analysis:Analysis={id:createHash('sha256').update(JSON.stringify(['eab1979-nor-nork',reading.form,reading.lemma,
      interpretation.mood,interpretation.tense,reading.nor,reading.nork])).digest('hex').slice(0,24),
      form:reading.form,lemma:reading.lemma,kind:'synthetic',variety:'batua',mood:interpretation.mood,tense:interpretation.tense,
      type:'nor-nork',nor:reading.nor,nori:null,nork:reading.nork,treatment:reading.treatment,allocutive:false,
      affixes:[],rawTags:['eab1979',reading.series],baseForm:reading.form,origin:'rule',validation,
      citations:[citation],segmentation:null,history:[]};
    lemmaInsert.run(reading.lemma,'synthetic');
    insert.run(analysis.id,analysis.form,reading.lemma,'batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
  }
}
// EKARRI pp. 118¹–120¹ print the singular-NOR NNN paradigms and give
// deterministic karki→karzki / kar→karzki instructions for plural NOR.
// Keep the 116 table readings reviewed and the 116 rule-expanded readings
// generated, even though both retain the same official source locator.
for(const reading of [...ekarriNnnPrinted,...ekarriNnnDerived,...eramanNnnPrinted,...eramanNnnDerived]) {
  const lemma=reading.page>=268?'eraman':'ekarri';
  const rows=db.prepare('SELECT id,payload FROM analyses WHERE form=? AND lemma=? AND base=1')
    .all(reading.form,lemma) as {id:string;payload:string}[];
  const row=rows.find(r=>{const a=JSON.parse(r.payload) as Analysis;return a.type==='nor-nori-nork'&&
    a.nor===reading.nor&&a.nori===reading.nori&&a.nork===reading.nork&&a.mood===reading.mood&&a.tense===reading.tense;});
  const citation={sourceId:'euskaltzaindia-eab1979',locator:reading.derived?
    `${reading.printed}¹. or. (PDF ${reading.page}), ${lemma.toUpperCase()} ${reading.series}: NOR plurala egiteko erro-aldaketa`:
    `${reading.printed}¹. or. (PDF ${reading.page}), ${lemma.toUpperCase()} ${reading.series}`};
  const validation:Analysis['validation']=reading.derived?'generated':'reviewed';
  if(row){
    const analysis=JSON.parse(row.payload) as Analysis;
    Object.assign(analysis,{treatment:reading.treatment,allocutive:false,validation});
    analysis.rawTags=[...new Set([...analysis.rawTags,'eab1979',reading.series,reading.derived?'plural-rule':'printed'])];
    analysis.citations.push(citation);updateOfficialNorNori.run(JSON.stringify(analysis),'euskaltzaindia-eab1979',row.id);
  }else{
    const analysis:Analysis={id:createHash('sha256').update(JSON.stringify(['eab1979-nnn',reading.form,lemma,
      reading.mood,reading.tense,reading.nor,reading.nori,reading.nork])).digest('hex').slice(0,24),
      form:reading.form,lemma,kind:'synthetic',variety:'batua',mood:reading.mood,tense:reading.tense,
      type:'nor-nori-nork',nor:reading.nor,nori:reading.nori,nork:reading.nork,treatment:reading.treatment,
      allocutive:false,affixes:[],rawTags:['eab1979',reading.series,reading.derived?'plural-rule':'printed'],
      baseForm:reading.form,origin:'rule',validation,citations:[citation],segmentation:null,history:[]};
    lemmaInsert.run(lemma,'synthetic');insert.run(analysis.id,analysis.form,lemma,'batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
  }
}
// The 1979 Academy book prints only IRAKATSI's imperative (p. 158¹/PDF 338).
// Generate its one-word cells from the four NORI stems and three NORK endings;
// the spaced plural NOR-NORK alternatives are outside this single-word app.
// This does not license or invent any non-imperative irakatsi series.
for (const [nor, recipients] of [
  ['hura', [[null, 'irakatsa'], ['ni', 'irakasta'], ['gu', 'irakasku'], ['hura', 'irakatsio'], ['haiek', 'irakatsie']]],
  ['haiek', [['ni', 'irakatsazkida'], ['gu', 'irakatsazkigu'], ['hura', 'irakatsazkio'], ['haiek', 'irakatsazkie']]],
] as [Person, [Person | null, string][]][]) for (const [nori, stem] of recipients)
  for (const [nork, suffix, treatment] of [
    ['hi', 'k', 'toka'], ['hi', 'n', 'noka'], ['zu', 'zu', 'neutral'], ['zuek', 'zue', 'neutral'],
  ] as [Person, string, Treatment][]) {
    const form=stem+suffix;
    lemmaInsert.run('irakatsi','synthetic');
    const analysis:Analysis={
      id:createHash('sha256').update(JSON.stringify(['eab1979-irakatsi',form,nor,nori,nork])).digest('hex').slice(0,24),
      form,lemma:'irakatsi',kind:'synthetic',variety:'batua',mood:'imperative',tense:'present',
      type:nori?'nor-nori-nork':'nor-nork',nor,nori,nork,treatment,allocutive:false,
      affixes:[],rawTags:['eab1979','NN9/NNN9'],baseForm:form,origin:'rule',validation:'reviewed',
      citations:[{sourceId:'euskaltzaindia-eab1979',locator:'158¹. or. (PDF 338), IRAKATSI NN9/NNN9'}],
      segmentation:null,history:[],
    };
    insert.run(analysis.id,form,'irakatsi','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
  }
// JARIO/JARIN/JARIATU's printed NN4/NN9 tables (p. 110¹/PDF 242)
// contain recipient rows missing from the upstream lexicon. The NN4 mood
// follows its existing potential/hypothetical reading; the Academy table
// independently confirms the surface and agreement, not that mood label.
for(const plural of [false,true]) {
  const nor:Person=plural?'haiek':'hura';
  const potentialStem=plural?'lerizki':'leri';
  const imperativeStem=plural?'berizki':'beri';
  for(const [nori,suffix,treatment] of [
    ['hi','ake','toka'],['hi','nake','noka'],['zu','zuke','neutral'],['zuek','zueke','neutral'],
  ] as [Person,string,Treatment][]) {
    const form=potentialStem+suffix;
    const analysis:Analysis={
      id:createHash('sha256').update(JSON.stringify(['eab1979-jario-nn4',form,nor,nori])).digest('hex').slice(0,24),
      form,lemma:'jario',kind:'synthetic',variety:'batua',mood:'potential',tense:'hypothetical',type:'nor-nori',
      nor,nori,nork:null,treatment,allocutive:false,affixes:[],rawTags:['eab1979','NN4'],baseForm:form,
      origin:'rule',validation:'generated',segmentation:null,history:[],
      citations:[{sourceId:'euskaltzaindia-eab1979',locator:'110¹. or. (PDF 242), JARIO/JARIN/JARIATU NN4'}],
    };
    lemmaInsert.run('jario','synthetic');
    insert.run(analysis.id,form,'jario','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
  }
  for(const [nori,suffix,treatment] of [
    ['ni','t','neutral'],['hi','k','toka'],['hi','n','noka'],['hura','o','neutral'],
    ['gu','gu','neutral'],['zu','zu','neutral'],['zuek','zue','neutral'],['haiek','e','neutral'],
  ] as [Person,string,Treatment][]) {
    const form=imperativeStem+suffix;
    const analysis:Analysis={
      id:createHash('sha256').update(JSON.stringify(['eab1979-jario-nn9',form,nor,nori])).digest('hex').slice(0,24),
      form,lemma:'jario',kind:'synthetic',variety:'batua',mood:'imperative',tense:'present',type:'nor-nori',
      nor,nori,nork:null,treatment,allocutive:false,affixes:[],rawTags:['eab1979','NN9'],baseForm:form,
      origin:'rule',validation:'reviewed',segmentation:null,history:[],
      citations:[{sourceId:'euskaltzaindia-eab1979',locator:'110¹. or. (PDF 242), JARIO/JARIN/JARIATU NN9'}],
    };
    lemmaInsert.run('jario','synthetic');
    insert.run(analysis.id,form,'jario','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
  }
}
// EROAN NN4/NN9 (printed p. 153¹/PDF 328) has no upstream imperative
// and omits the hi/zu/zuek NN4 subjects. The 1977 original (p. 840) also
// prints the imperative, including both hi endings and plural-NOR variants.
for(const plural of [false,true]) {
  const nor:Person=plural?'haiek':'hura';
  const n4Stem=plural?'azke':'ake';
  for(const [prefix,nork,treatment] of [
    ['hero','hi','hika'],['zenero','zu','neutral'],['zenero','zuek','neutral'],
  ] as [string,Person,Treatment][]) {
    const form=prefix+n4Stem+(nork==='zuek'?'te':'');
    const analysis:Analysis={
      id:createHash('sha256').update(JSON.stringify(['eab1979-eroan-nn4',form,nor,nork])).digest('hex').slice(0,24),
      form,lemma:'eroan',kind:'synthetic',variety:'batua',mood:'potential',tense:'hypothetical',type:'nor-nork',
      nor,nori:null,nork,treatment,allocutive:false,affixes:[],rawTags:['eab1979','NN4'],baseForm:form,
      origin:'rule',validation:'generated',segmentation:null,history:[],
      citations:[{sourceId:'euskaltzaindia-eab1979',locator:'153¹. or. (PDF 328), EROAN NN4'}],
    };
    lemmaInsert.run('eroan','synthetic');
    insert.run(analysis.id,form,'eroan','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
  }
  for(const [nork,form,treatment] of (plural?[
    ['hi','eroaitzak','toka'],['hi','eroaitzan','noka'],['hura','beroatza','neutral'],
    ['zu','eroaitzazu','neutral'],['zuek','eroaitzazue','neutral'],['haiek','beroatzate','neutral'],
  ]:[
    ['hi','eroak','toka'],['hi','eroan','noka'],['hura','beroa','neutral'],
    ['zu','eroazu','neutral'],['zuek','eroazue','neutral'],['haiek','beroate','neutral'],
  ]) as [Person,string,Treatment][]) {
    const analysis:Analysis={
      id:createHash('sha256').update(JSON.stringify(['eab1979-eroan-nn9',form,nor,nork])).digest('hex').slice(0,24),
      form,lemma:'eroan',kind:'synthetic',variety:'batua',mood:'imperative',tense:'present',type:'nor-nork',
      nor,nori:null,nork,treatment,allocutive:false,affixes:[],rawTags:['eab1979','NN9'],baseForm:form,
      origin:'rule',validation:'reviewed',segmentation:null,history:[],
      citations:[{sourceId:'euskaltzaindia-eab1979',locator:'153¹. or. (PDF 328), EROAN NN9'},
        {sourceId:'euskaltzaindia-sintetikoa1977',locator:'840. or., EROAN agintera'}],
    };
    lemmaInsert.run('eroan','synthetic');
    insert.run(analysis.id,form,'eroan','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
  }
}
// EMAN's official NN9 page prints five one-word alternatives absent from
// upstream. Internal typographic spacing marks morphemes, not word breaks.
for(const [form,nor,nork,treatment] of [
  ['eman','hura','hi','noka'],
  ['emaitzak','haiek','hi','toka'],['emaitzan','haiek','hi','noka'],
  ['emaitzazu','haiek','zu','neutral'],['emaitzazue','haiek','zuek','neutral'],
] as [string,Person,Person,Treatment][]) {
  const analysis:Analysis={
    id:createHash('sha256').update(JSON.stringify(['eab1979-eman-nn9',form,nor,nork])).digest('hex').slice(0,24),
    form,lemma:'eman',kind:'synthetic',variety:'batua',mood:'imperative',tense:'present',type:'nor-nork',
    nor,nori:null,nork,treatment,allocutive:false,affixes:[],rawTags:['eab1979','NN9'],baseForm:form,
    origin:'rule',validation:'reviewed',segmentation:null,history:[],
    citations:[{sourceId:'euskaltzaindia-eab1979',locator:'169¹. or. (PDF 360), EMAN NN9'},
      {sourceId:'euskaltzaindia-sintetikoa1977',locator:'842. or., EMAN NOR-NORK agintera'}],
  };
  lemmaInsert.run('eman','synthetic');
  insert.run(analysis.id,form,'eman','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
}
// Four compact imperative-only paradigms follow the same printed agreement
// layout. Upgrade exactly their one-word cells; parenthesized analytic
// alternatives such as "utz itzazu" remain outside this one-word analyzer.
const imperativePageSpecs=[
  {lemma:'utzi',page:340,printed:'159',nn9:[['utzak','toka'],['utzan','noka'],['utzazu','neutral'],['utzazue','neutral']],
    stems:[['ni','uzta','utzazkida'],['gu','uzku','utzazkigu'],['hura','utzio','utzazkio'],['haiek','utzie','utzazkie']]},
  {lemma:'igorri',page:342,printed:'160',nn9:[['igork','toka'],['igorna','noka'],['igorzu','neutral'],['igorzue','neutral']],
    stems:[['ni','igorda','igorzkida'],['gu','igorgu','igorzkigu'],['hura','igorrio','igorzkio'],['haiek','igorrie','igorzkie']]},
  {lemma:'erosi',page:344,printed:'161',nn9:[['erosak','toka'],['erosan','noka'],['erosazu','neutral'],['erosazue','neutral']],
    stems:[['ni','erosta','erosazkida'],['gu','erosku','erosazkigu'],['hura','erosio','erosazkio'],['haiek','erosie','erosazkie']]},
  {lemma:'ihardetsi',page:346,printed:'162',nn9:[['ihardetsak','toka'],['ihardetsan','noka'],['ihardetsazu','neutral'],['ihardetsazue','neutral']],
    stems:[['ni','ihardesta','ihardetsazkida'],['gu','ihardesku','ihardetsazkigu'],['hura','ihardetsio','ihardetsazkio'],['haiek','ihardetsie','ihardetsazkie']]},
] as const;
const reviewedImperative=db.prepare('UPDATE analyses SET payload=?,source=? WHERE id=?');
for(const spec of imperativePageSpecs) {
  const expected:[string,Person,Person|null,Person, Treatment][]=[];
  for(let i=0;i<spec.nn9.length;i++) {
    const [form,treatment]=spec.nn9[i];
    expected.push([form,'hura',null,i<2?'hi':i===2?'zu':'zuek',treatment]);
  }
  for(const [nori,singular,plural] of spec.stems) for(const [nor,stem] of [['hura',singular],['haiek',plural]] as [Person,string][])
    for(const [nork,suffix,treatment] of [['hi','k','toka'],['hi','n','noka'],['zu','zu','neutral'],['zuek','zue','neutral']] as [Person,string,Treatment][])
      expected.push([stem+suffix,nor,nori,nork,treatment]);
  for(const [form,nor,nori,nork,treatment] of expected) {
    const row=db.prepare('SELECT id,payload FROM analyses WHERE form=? AND lemma=? AND base=1').get(form,spec.lemma) as {id:string;payload:string}|undefined;
    if(!row)throw new Error(`1979ko ${spec.lemma.toUpperCase()} agintera falta da: ${form}`);
    const analysis=JSON.parse(row.payload) as Analysis;
    Object.assign(analysis,{mood:'imperative' as Mood,tense:'present' as Tense,type:nori?'nor-nori-nork':'nor-nork',
      nor,nori,nork,treatment,allocutive:false,validation:'reviewed' as const});
    analysis.citations.push({sourceId:'euskaltzaindia-eab1979',locator:`${spec.printed}¹. or. (PDF ${spec.page}), ${spec.lemma.toUpperCase()} NN9/NNN9`},
      {sourceId:'euskaltzaindia-sintetikoa1977',locator:`${spec.printed==='159'?'835':spec.printed==='160'?'835–836':spec.printed==='161'?'836': '836. or.'}, ${spec.lemma.toUpperCase()} agintera`});
    reviewedImperative.run(JSON.stringify(analysis),'euskaltzaindia-eab1979',row.id);
  }
}
// ESAN/ERRAN pp. 176¹–177¹: the present/past io series, erran's
// conditional/potential rows and the two accepted imperative columns.
for(const [form,tense,nork,treatment] of [
  ['diot','present','ni','neutral'],['diok','present','hi','toka'],['dion','present','hi','noka'],
  ['dio','present','hura','neutral'],['diogu','present','gu','neutral'],['diozu','present','zu','neutral'],
  ['diozue','present','zuek','neutral'],['diote','present','haiek','neutral'],
  ['nioen','past','ni','neutral'],['hioen','past','hi','hika'],['zioen','past','hura','neutral'],
  ['genioen','past','gu','neutral'],['zenioen','past','zu','neutral'],['zenioten','past','zuek','neutral'],['zioten','past','haiek','neutral'],
] as [string,Tense,Person,Treatment][]) {
  const row=db.prepare('SELECT id,payload FROM analyses WHERE form=? AND lemma=? AND base=1').get(form,'io') as {id:string;payload:string}|undefined;
  if(!row)throw new Error(`1979ko ESAN/ERRAN io saila falta da: ${form}`);
  const analysis=JSON.parse(row.payload) as Analysis;
  Object.assign(analysis,{mood:'indicative' as Mood,tense,nor:'hura' as Person,nori:null,nork,treatment,allocutive:false,validation:'reviewed' as const});
  analysis.type='nor-nork';
  analysis.citations.push({sourceId:'euskaltzaindia-eab1979',locator:'176¹. or. (PDF 374), ESAN/ERRAN NN1/NN2'});
  reviewedImperative.run(JSON.stringify(analysis),'euskaltzaindia-eab1979',row.id);
}
for(const [form,nork,treatment] of [
  ['banerra','ni','neutral'],['baherra','hi','hika'],['balerra','hura','neutral'],['bagenerra','gu','neutral'],
  ['bazenerra','zu','neutral'],['bazenerrate','zuek','neutral'],['balerrate','haiek','neutral'],
] as [string,Person,Treatment][]) {
  const analysis:Analysis={
    id:createHash('sha256').update(JSON.stringify(['eab1979-erran-nn3',form,nork])).digest('hex').slice(0,24),
    form,lemma:'erran',kind:'synthetic',variety:'batua',mood:'conditional',tense:'hypothetical',type:'nor-nork',
    nor:'hura',nori:null,nork,treatment,allocutive:false,affixes:['ba<cnjsub>'],rawTags:['eab1979','NN3'],
    baseForm:form.slice(2),origin:'rule',validation:'generated',segmentation:null,history:[],
    citations:[{sourceId:'euskaltzaindia-eab1979',locator:'177¹. or. (PDF 376), ESAN/ERRAN NN3; forma eta pertsona'},
      {sourceId:'euskaltzaindia-sintetikoa1977',locator:'824. or., ESAN/ERRAN baldin-saila'}],
  };
  lemmaInsert.run('erran','synthetic');
  insert.run(analysis.id,form,'erran','batua',0,'euskaltzaindia-eab1979',JSON.stringify(analysis));
}
for(const [form,nork,treatment] of [
  ['nerrake','ni','neutral'],['herrake','hi','hika'],['lerrake','hura','neutral'],['generrake','gu','neutral'],
  ['zenerrake','zu','neutral'],['zenerrakete','zuek','neutral'],['lerrakete','haiek','neutral'],
] as [string,Person,Treatment][]) {
  const rows=db.prepare('SELECT id,payload FROM analyses WHERE form=? AND lemma=? AND base=1').all(form,'erran') as {id:string;payload:string}[];
  const row=rows.find(r=>{const a=JSON.parse(r.payload) as Analysis;return a.mood==='potential'&&a.tense==='hypothetical'&&a.nork===nork;});
  if(row) {
    const analysis=JSON.parse(row.payload) as Analysis;
    Object.assign(analysis,{nor:'hura' as Person,nori:null,treatment,allocutive:false});
    analysis.citations.push({sourceId:'euskaltzaindia-eab1979',locator:'177¹. or. (PDF 376), ESAN/ERRAN NN4; forma eta pertsona'});
    reviewedImperative.run(JSON.stringify(analysis),'euskaltzaindia-eab1979',row.id);
  } else {
    const analysis:Analysis={
      id:createHash('sha256').update(JSON.stringify(['eab1979-erran-nn4',form,nork])).digest('hex').slice(0,24),
      form,lemma:'erran',kind:'synthetic',variety:'batua',mood:'potential',tense:'hypothetical',type:'nor-nork',
      nor:'hura',nori:null,nork,treatment,allocutive:false,affixes:[],rawTags:['eab1979','NN4'],baseForm:form,
      origin:'rule',validation:'generated',segmentation:null,history:[],
      citations:[{sourceId:'euskaltzaindia-eab1979',locator:'177¹. or. (PDF 376), ESAN/ERRAN NN4; forma eta pertsona'},
        {sourceId:'euskaltzaindia-sintetikoa1977',locator:'824. or., ESAN/ERRAN NN4'}],
    };
    lemmaInsert.run('erran','synthetic');
    insert.run(analysis.id,form,'erran','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
  }
}
for(const [lemma,forms] of [
  ['erran',[['errak','hi','toka'],['erran','hi','noka'],['berra','hura','neutral'],['errazu','zu','neutral'],['errazue','zuek','neutral'],['berrate','haiek','neutral']]],
  ['esan',[['esak','hi','toka'],['esan','hi','noka'],['bio','hura','neutral'],['esazu','zu','neutral'],['esazue','zuek','neutral'],['biote','haiek','neutral']]],
] as [string,[string,Person,Treatment][]][]) for(const [form,nork,treatment] of forms) {
  const row=db.prepare('SELECT id,payload FROM analyses WHERE form=? AND lemma=? AND base=1').get(form,lemma) as {id:string;payload:string}|undefined;
  if(!row)throw new Error(`1979ko ${lemma.toUpperCase()} agintera falta da: ${form}`);
  const analysis=JSON.parse(row.payload) as Analysis;
  Object.assign(analysis,{mood:'imperative' as Mood,tense:'present' as Tense,type:'nor-nork',nor:'hura' as Person,
    nori:null,nork,treatment,allocutive:false,validation:'reviewed' as const});
  analysis.citations.push({sourceId:'euskaltzaindia-eab1979',locator:'177¹. or. (PDF 376), ESAN/ERRAN NN9'},
    {sourceId:'euskaltzaindia-sintetikoa1977',locator:'824. or., ESAN/ERRAN agintera'});
  reviewedImperative.run(JSON.stringify(analysis),'euskaltzaindia-eab1979',row.id);
}
// ERAKUTSI NN2 and NN3 (printed pp. 149¹–150¹/PDF 320–322) expose two
// missing past cells and almost the entire conditional premise. The source
// lexicon already gives baherakutsa its conditional reading; do not add a
// duplicate. The NN3 mood comes from that neighboring reading and the
// editor's label, so the added conditional readings remain generated.
for(const [form,nork,treatment] of [
  ['herakuskien','hi','hika'],['zenerakuskiten','zuek','neutral'],
] as [string,Person,Treatment][]) {
  const analysis:Analysis={
    id:createHash('sha256').update(JSON.stringify(['eab1979-erakutsi-nn2',form,nork])).digest('hex').slice(0,24),
    form,lemma:'erakutsi',kind:'synthetic',variety:'batua',mood:'indicative',tense:'past',type:'nor-nork',
    nor:'haiek',nori:null,nork,treatment,allocutive:false,affixes:[],rawTags:['eab1979','NN2'],
    baseForm:form,origin:'rule',validation:'reviewed',segmentation:null,history:[],
    citations:[{sourceId:'euskaltzaindia-eab1979',locator:'149¹. or. (PDF 320), ERAKUTSI NN2'},
      {sourceId:'euskaltzaindia-sintetikoa1977',locator:'838. or., ERAKUTSI lehenaldia'}],
  };
  lemmaInsert.run('erakutsi','synthetic');
  insert.run(analysis.id,form,'erakutsi','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
}
for(const [nor,forms] of [
  ['hura',['banerakutsa','baherakutsa','balerakutsa','bagenerakutsa','bazenerakutsa','bazenerakutsate','balerakutsate']],
  ['haiek',['banerakuski','baherakuski','balerakuski','bagenerakuski','bazenerakuski','bazenerakuskite','balerakuskite']],
] as [Person,string[]][]) for(let i=0;i<forms.length;i++) {
  const form=forms[i];
  const nork:Person=['ni','hi','hura','gu','zu','zuek','haiek'][i] as Person;
  const existingRows=db.prepare('SELECT payload FROM analyses WHERE form=? AND lemma=?').all(form,'erakutsi') as {payload:string}[];
  if(existingRows.some(r=>{const a=JSON.parse(r.payload) as Analysis;
    return a.mood==='conditional'&&a.tense==='hypothetical'&&a.nor===nor&&a.nori===null&&a.nork===nork;}))continue;
  const analysis:Analysis={
    id:createHash('sha256').update(JSON.stringify(['eab1979-erakutsi-nn3',form,nor,nork])).digest('hex').slice(0,24),
    form,lemma:'erakutsi',kind:'synthetic',variety:'batua',mood:'conditional',tense:'hypothetical',type:'nor-nork',
    nor,nori:null,nork,treatment:nork==='hi'?'hika':'neutral',allocutive:false,affixes:['ba<cnjsub>'],
    rawTags:['eab1979','NN3'],baseForm:form.slice(2),origin:'rule',validation:'generated',segmentation:null,history:[],
    citations:[{sourceId:'euskaltzaindia-eab1979',locator:'150¹. or. (PDF 322), ERAKUTSI NN3; forma eta pertsona'},
      {sourceId:'euskaltzaindia-sintetikoa1977',locator:'837–838. or., ERAKUTSI baldin-saileko adizkiak'}],
  };
  lemmaInsert.run('erakutsi','synthetic');
  insert.run(analysis.id,form,'erakutsi','batua',0,'euskaltzaindia-eab1979',JSON.stringify(analysis));
}
// ERAKUTSI NN4 has a singular-NOR HI row absent upstream. The neighboring
// upstream rows carry both consequence and potential readings; retain that
// ambiguity, while marking both as inferred interpretations of an attested
// surface/agreement cell (printed p. 150¹/PDF 322; original p. 837).
for(const [mood,tense] of [['consequence','present'],['potential','hypothetical']] as [Mood,Tense][]) {
  const form='herakuske';
  const analysis:Analysis={
    id:createHash('sha256').update(JSON.stringify(['eab1979-erakutsi-nn4',form,mood,tense])).digest('hex').slice(0,24),
    form,lemma:'erakutsi',kind:'synthetic',variety:'batua',mood,tense,type:'nor-nork',
    nor:'hura',nori:null,nork:'hi',treatment:'hika',allocutive:false,affixes:[],rawTags:['eab1979','NN4'],
    baseForm:form,origin:'rule',validation:'generated',segmentation:null,history:[],
    citations:[{sourceId:'euskaltzaindia-eab1979',locator:'150¹. or. (PDF 322), ERAKUTSI NN4; forma eta pertsona'},
      {sourceId:'euskaltzaindia-sintetikoa1977',locator:'837. or., ERAKUTSI herakuske'}],
  };
  lemmaInsert.run('erakutsi','synthetic');
  insert.run(analysis.id,form,'erakutsi','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
}
// IHARDUKI is another compact paradigm in the same book. Upstream omits its
// entire imperative, one present agreement and three N4 forms. The N4 mood
// follows the source lexicon's existing potential/hypothetical reading; the
// 1979 page itself verifies the form and agreement, not that interpretation.
for(const [form,nork,mood,tense,treatment,page,series,validation] of [
  ['dihardukazue','zuek','indicative','present','neutral',334,'NN1','reviewed'],
  ['hihardukake','hi','potential','hypothetical','hika',336,'NN4','generated'],
  ['zenihardukake','zu','potential','hypothetical','neutral',336,'NN4','generated'],
  ['zenihardukakete','zuek','potential','hypothetical','neutral',336,'NN4','generated'],
  ['ihardukak','hi','imperative','present','toka',336,'NN9','reviewed'],
  ['ihardukan','hi','imperative','present','noka',336,'NN9','reviewed'],
  ['biharduka','hura','imperative','present','neutral',336,'NN9','reviewed'],
  ['ihardukazu','zu','imperative','present','neutral',336,'NN9','reviewed'],
  ['ihardukazue','zuek','imperative','present','neutral',336,'NN9','reviewed'],
  ['bihardukate','haiek','imperative','present','neutral',336,'NN9','reviewed'],
] as [string,Person,Mood,Tense,Treatment,number,string,Analysis['validation']][]) {
  const analysis:Analysis={
    id:createHash('sha256').update(JSON.stringify(['eab1979-iharduki',form,nork,mood,tense])).digest('hex').slice(0,24),
    form,lemma:'iharduki',kind:'synthetic',variety:'batua',mood,tense,type:'nor-nork',
    nor:'hura',nori:null,nork,treatment,allocutive:false,affixes:[],
    rawTags:['eab1979',series],baseForm:form,origin:'rule',validation,
    citations:[{sourceId:'euskaltzaindia-eab1979',locator:`${page===334?'156':'157'}¹. or. (PDF ${page}), IHARDUKI ${series}`}],
    segmentation:null,history:[],
  };
  insert.run(analysis.id,form,'iharduki','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
}
// Printed pp. 163¹ and 164¹ preserve these otherwise absent ERAUNTSI
// imperatives and EUTSI indicative daut- alternatives. The 1977 original
// instead prints deut-, so daut- remains disputed and cannot seed hika.
for(const [lemma,mood,page,prefixes] of [
  ['erauntsi','imperative',348,['berauntso','berauntse']],
  ['eutsi','indicative',350,['dautso','dautse']],
] as ['erauntsi'|'eutsi',Mood,number,string[]][]) for(let recipient=0;recipient<2;recipient++)
  for(const [nork,suffix] of [['hura',''],['haiek','te']] as [Person,string][]) {
    const form=prefixes[recipient]+suffix;
    const nori:Person=recipient===0?'hura':'haiek';
    const analysis:Analysis={
      id:createHash('sha256').update(JSON.stringify(['eab1979-compact',form,lemma,nori,nork])).digest('hex').slice(0,24),
      form,lemma,kind:'synthetic',variety:'batua',mood,tense:'present',type:'nor-nori-nork',
      nor:'hura',nori,nork,treatment:'neutral',allocutive:false,affixes:[],
      rawTags:[lemma==='eutsi'?'eab1979-daut-disputed':'eab1979',mood==='imperative'?'NNN9':'NNN1'],baseForm:form,
      origin:'rule',validation:lemma==='eutsi'?'generated':'reviewed',
      citations:[{sourceId:'euskaltzaindia-eab1979',locator:`${page===348?'163':'164'}¹. or. (PDF ${page}), ${lemma.toUpperCase()} NNN${mood==='imperative'?'9':'1'}`},
        ...(lemma==='eutsi'?[{sourceId:'euskaltzaindia-sintetikoa1977',locator:'826. or., EUTSI: deutso/deutsote/deutse/deutsete; 1979ko daut- sailarekin desadostasuna'}]:[])],
      segmentation:null,history:[],
    };
    insert.run(analysis.id,form,lemma,'batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
  }
// EUTSI's full imperative occupies the lower half of p. 164¹. The 1979
// table accidentally repeats beutse for both third-person subjects, whereas
// the 1977 source prints beutsete in the plural-subject cell. Preserve both
// source readings instead of silently choosing one of them.
const eutsiImperatives=[
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
] as [string,Person,Person,Treatment][];
for(const [form,nori,nork,treatment] of eutsiImperatives) {
  const rows=db.prepare('SELECT id,payload FROM analyses WHERE form=? AND lemma=? AND base=1').all(form,'eutsi') as {id:string;payload:string}[];
  const row=rows.find(r=>{const a=JSON.parse(r.payload) as Analysis;
    return a.mood==='imperative'&&a.nor==='hura'&&a.nori===nori&&a.nork===nork;});
  if(!row)throw new Error(`1979ko EUTSI agintera falta da: ${form} (${nori}, ${nork})`);
  const analysis=JSON.parse(row.payload) as Analysis;
  Object.assign(analysis,{type:'nor-nori-nork' as const,tense:'present' as Tense,treatment,
    allocutive:false,validation:'reviewed' as const});
  analysis.citations.push({sourceId:'euskaltzaindia-eab1979',locator:'164¹. or. (PDF 350), EUTSI NNN9'});
  if(!(form==='beutse'&&nork==='haiek'))
    analysis.citations.push({sourceId:'euskaltzaindia-sintetikoa1977',locator:'826. or., EUTSI agintera'});
  reviewedImperative.run(JSON.stringify(analysis),'euskaltzaindia-eab1979',row.id);
}
const beutsete:Analysis={
  id:createHash('sha256').update(JSON.stringify(['euskaltzaindia-sintetikoa1977','beutsete','eutsi','haiek','haiek'])).digest('hex').slice(0,24),
  form:'beutsete',lemma:'eutsi',kind:'synthetic',variety:'batua',mood:'imperative',tense:'present',
  type:'nor-nori-nork',nor:'hura',nori:'haiek',nork:'haiek',treatment:'neutral',allocutive:false,
  affixes:[],rawTags:['aditz-sintetikoa1977','NNN9'],baseForm:'beutsete',origin:'rule',validation:'reviewed',
  citations:[{sourceId:'euskaltzaindia-sintetikoa1977',locator:'826. or., EUTSI agintera: beutsete'}],
  segmentation:null,history:[],
};
insert.run(beutsete.id,beutsete.form,beutsete.lemma,'batua',1,'euskaltzaindia-sintetikoa1977',JSON.stringify(beutsete));
// Both editions explicitly license the i-less eutsok/eutson pair and "eta
// abar" licenses the same alternation in the remaining hari/haiei cells.
// Keep the explicitly printed pair reviewed and mark the extrapolated six as
// generated so the API exposes the evidence boundary.
for(const [form,nori,nork,treatment,validation] of [
  ['eutsok','hura','hi','toka','reviewed'],['eutson','hura','hi','noka','reviewed'],
  ['eutsozu','hura','zu','neutral','generated'],['eutsozue','hura','zuek','neutral','generated'],
  ['eutsek','haiek','hi','toka','generated'],['eutsen','haiek','hi','noka','generated'],
  ['eutsezu','haiek','zu','neutral','generated'],['eutsezue','haiek','zuek','neutral','generated'],
] as [string,Person,Person,Treatment,Analysis['validation']][]) {
  const analysis:Analysis={
    id:createHash('sha256').update(JSON.stringify(['eab1979-eutsi-i-less',form,nori,nork])).digest('hex').slice(0,24),
    form,lemma:'eutsi',kind:'synthetic',variety:'batua',mood:'imperative',tense:'present',type:'nor-nori-nork',
    nor:'hura',nori,nork,treatment,allocutive:false,affixes:[],rawTags:['eab1979','NNN9','i-less'],
    baseForm:form,origin:'rule',validation,segmentation:null,history:[],
    citations:[{sourceId:'euskaltzaindia-eab1979',locator:'164¹. or. (PDF 350), EUTSI oharra: eutsiok = eutsok; eta abar'},
      {sourceId:'euskaltzaindia-sintetikoa1977',locator:'826. or., EUTSI oharra: i-dun formen aldamenean i-gabeak ere ontzat'}],
  };
  insert.run(analysis.id,form,'eutsi','batua',1,'euskaltzaindia-eab1979',JSON.stringify(analysis));
}
// The 1977 original unequivocally prints the deut- EUTSI quartet. Upgrade
// the matching lexicon readings without suppressing the 1979 daut- dispute.
const reviewedDeut=db.prepare('UPDATE analyses SET payload=?, source=? WHERE id=?');
for(const [form,nori,nork] of [
  ['deutso','hura','hura'],['deutsote','hura','haiek'],
  ['deutse','haiek','hura'],['deutsete','haiek','haiek'],
] as [string,Person,Person][]) {
  const rows=db.prepare('SELECT id,payload FROM analyses WHERE form=? AND lemma=? AND base=1').all(form,'eutsi') as {id:string;payload:string}[];
  const row=rows.find(r=>{const a=JSON.parse(r.payload) as Analysis;
    return a.mood==='indicative'&&a.tense==='present'&&a.nor==='hura'&&a.nori===nori&&a.nork===nork;});
  if(!row)throw new Error(`1977ko EUTSI oinarria falta da: ${form}`);
  const analysis=JSON.parse(row.payload) as Analysis;
  analysis.validation='reviewed';
  analysis.citations.push({sourceId:'euskaltzaindia-sintetikoa1977',locator:'826. or., EUTSI: orainaldiko deut- saila'});
  reviewedDeut.run(JSON.stringify(analysis),'euskaltzaindia-sintetikoa1977',row.id);
}
// The Apertium ADL entries are continuation stems and often lack the free
// finite form (e.g. dirot, niroen). Reconstruct the small *iro paradigm from
// its licensed stem/affix specification, then audit it against rule 14.
for (const [tense, forms] of [
  ['present',[['dirot','ni'],['diro','hura'],['dirogu','gu'],['dirote','haiek']]],
  ['past',[['niroen','ni'],['ziroen','hura'],['geniroen','gu'],['ziroten','haiek']]],
  ['hypothetical',[['niro','ni'],['liro','hura'],['geniro','gu'],['lirote','haiek']]],
] as [Tense,[string,Person][]][]) for (const [form,nork] of forms) {
  insertGeneratedBase(form,'iro','auxiliary','potential',tense,'hura',null,nork,62,'Module:eu-verb, -iro- paradigma: iro erroa eta NOR-NORK pertsona-markak');
}
// The licensed eu-verb module distinguishes the io stem from erran. Apertium
// has only the singular NOR-NORK subset; complete the plural NOR and the
// NOR-NORI-NORK matrix by regular stem/person composition.
for(const [nork,present,past] of [
  ['ni','diodaz','niozen'],['hura','dioz','ziozen'],
  ['gu','dioguz','geniozen'],['haiek','diotez','ziotezen'],
] as [Person,string,string][]) {
  insertGeneratedBase(present,'io','synthetic','indicative','present','haiek',null,nork,105,'Module:eu-verb, esan / nor-nork: io erroa eta NOR plurala');
  insertGeneratedBase(past,'io','synthetic','indicative','past','haiek',null,nork,105,'Module:eu-verb, esan / nor-nork: io erroa eta NOR plurala');
}
const ioDativeBases:[Person,[Person,string][]][]=[
  ['ni',[['hura','diost'],['haiek','diostate']]],
  ['hura',[['ni','diotsot'],['ni','diotsat'],['hura','diotso'],['hura','diotsa'],
    ['gu','diotsogu'],['gu','diotsagu'],['haiek','diotsote'],['haiek','diotsate']]],
  ['gu',[['hura','diosku'],['haiek','dioskute']]],
  ['haiek',[['ni','diotset'],['hura','diotse'],['gu','diotsegu'],['haiek','diotsete']]],
];
for(const [nori,stems] of ioDativeBases) for(const [nork,present] of stems) {
  const plural=nori==='ni' && present==='diost' ? present+'az' : nori==='hura' || nori==='haiek' ?
    (nork==='ni' ? present.replace(/t$/,'daz') : present+'z') : present+'z';
  const pastPrefix=nork==='ni'?'n':nork==='gu'?'gen':'z';
  const pastStem=present.slice(1);
  const past= pastPrefix+(nork==='ni'?pastStem.replace(/t$/,'n'):
    nork==='gu'?pastStem.replace(/gu$/,'n'):
    nori==='ni'&&nork==='hura'?pastStem+'an':pastStem+'n');
  for(const [form,tense,nor] of [
    [present,'present','hura'],[plural,'present','haiek'],
    [past,'past','hura'],[past.replace(/n$/,'zen'),'past','haiek'],
  ] as [string,Tense,Person][]) {
    insertGeneratedBase(form,'io','synthetic','indicative',tense,nor,nori,nork,106,'Module:eu-verb, esan / nor-nori-nork: iots erroa eta pertsona-markak');
  }
}
// Remaining finite bases in rule 14 that the Apertium lexicon omits. These
// are composed by compact paradigm patterns and individually cross-checked
// by the read-only audit; the PDF itself is never bundled.
for (const [form,nori,tense] of [
  ['ginderrazkion','hura','past'],['ginderrazkien','haiek','past'],
  ['ginderrazkioke','hura','hypothetical'],
] as [string,Person,Tense][]) insertGeneratedBase(form,'jarraiki','synthetic',tense==='past'?'indicative':'potential',tense,'gu',nori,null,78);
for (const plural of [false,true]) for(const [nori,ending] of [
  ['ni','dake'],['hura','oke'],['gu','guke'],['haiek','eke'],
] as [Person,string][]) insertGeneratedBase('leri'+(plural?'zki':'')+ending,'jario','synthetic','potential','hypothetical',plural?'haiek':'hura',nori,null,80);
for (const [prefix,nork,suffix] of [
  ['neroa','ni',''],['leroa','hura',''],['generoa','gu',''],['leroa','haiek','te'],
] as [string,Person,string][]) for(const [nor,plural] of [['hura',''],['haiek','z']] as [Person,string][]) {
  const stem=plural?prefix.replace(/oa$/,'oa')+'z':prefix;
  insertGeneratedBase(stem+'ke'+suffix,'eroan','synthetic','potential','hypothetical',nor,null,nork,97);
}
for(const [prefix,nork,suffix] of [
  ['nihardukake','ni',''],['lihardukake','hura',''],['genihardukake','gu',''],['lihardukake','haiek','te'],
] as [string,Person,string][]) insertGeneratedBase(prefix+suffix,'iharduki','synthetic','potential','hypothetical','hura',null,nork,99);
for(const [nori,stem] of [['hura','lerauntso'],['haiek','lerauntse']] as [Person,string][]) for(const [nork,suffix] of [['hura',''],['haiek','te']] as [Person,string][]) {
  insertGeneratedBase(stem+'ke'+suffix,'erauntsi','synthetic','potential','hypothetical','hura',nori,nork,100);
}
for(const [prefix,nork,suffix] of [
  ['nerrake','ni',''],['lerrake','hura',''],['generrake','gu',''],['lerrake','haiek','te'],
] as [string,Person,string][]) insertGeneratedBase(prefix+suffix,'erran','synthetic','potential','hypothetical','hura',null,nork,107);
insertGeneratedBase('dakarzkiote','ekarri','synthetic','indicative','present','haiek','hura','haiek',84);
for(const [form,nori,nork,tense,mood] of [
  ['neritzan','hura','ni','past','indicative'],
  ['generitzan','hura','gu','past','indicative'],
  ['zeritzaten','hura','haiek','past','indicative'],
  ['nerizten','haiek','ni','past','indicative'],
  ['zerizten','haiek','hura','past','indicative'],
  ['generizten','haiek','gu','past','indicative'],
  ['zerizteten','haiek','haiek','past','indicative'],
  ['nerizteke','haiek','ni','hypothetical','potential'],
  ['lerizteke','haiek','hura','hypothetical','potential'],
  ['generizteke','haiek','gu','hypothetical','potential'],
  ['leriztekete','haiek','haiek','hypothetical','potential'],
] as [string,Person,Person,Tense,Mood][]) insertGeneratedBase(form,'iritzi','synthetic',mood,tense,'hura',nori,nork,104);
// Rule 14 also gives negien/genegien a NOR-NORI-NORK reading with NORI=haiek.
// The imported lexicon carries only the equally spelled NOR-NORK reading.
for(const [form,nork] of [['negien','ni'],['genegien','gu']] as [string,Person][])
  insertGeneratedBase(form,'egin','synthetic','indicative','past','hura','haiek',nork,90,null,'reviewed');
// A few non-allocutive auxiliary cells in rule 78 are absent upstream.
// Copy their nearest attested cell's grammatical series, then set the exact
// agreement features certified by the printed paradigm.
for(const [form,model,nor,nori,nork,treatment] of [
  ['didake','didakete','hura','ni','hura','neutral'],
  ['dukezue','dukezu','hura',null,'zuek','neutral'],
  ['zakizkigukete','zakizkiokete','zuek','gu',null,'neutral'],
  ['bazaitzatet','bazaitzat','zuek',null,'ni','neutral'],
  ['bazaitzategu','bazaitzagu','zuek',null,'gu','neutral'],
  ['baditzat','bazaitzat','haiek',null,'ni','neutral'],
  ['baditzak','bazaitzat','haiek',null,'hi','toka'],
  ['baditzan','bazaitzat','haiek',null,'hi','noka'],
  ['baditza','bazaitzat','haiek',null,'hura','neutral'],
  ['baditzagu','bazaitzat','haiek',null,'gu','neutral'],
  ['baditzazu','bazaitzat','haiek',null,'zu','neutral'],
  ['baditzazue','bazaitzat','haiek',null,'zuek','neutral'],
  ['baditzate','bazaitzat','haiek',null,'haiek','neutral'],
] as [string,string,Person,Person|null,Person|null,Treatment][]) {
  const row=db.prepare('SELECT payload FROM analyses WHERE form=? ORDER BY base DESC LIMIT 1').get(model) as {payload:string}|undefined;
  if(!row)throw new Error(`78. arauko oinarria falta da: ${model}`);
  const source=JSON.parse(row.payload) as Analysis;
  const affixes=form.startsWith('ba')?['ba<cnjsub>']:[];
  const analysis:Analysis={...source,id:createHash('sha256').update(JSON.stringify(['rule78',form,nor,nori,nork,treatment])).digest('hex').slice(0,24),
    form,nor,nori,nork,treatment,allocutive:false,affixes,baseForm:affixes.length?form.slice(2):form,
    rawTags:[...source.rawTags,'normative:78'],origin:'rule',validation:'reviewed',segmentation:null,history:[],
    citations:[...source.citations,{sourceId:'euskaltzaindia78',locator:'78. araua, *edun/*edin/*ezan-en taula bateratuak; pertsona-gelaxka'}]};
  insert.run(analysis.id,form,analysis.lemma,'batua',affixes.length?0:1,'euskaltzaindia78',JSON.stringify(analysis));
}
// Rule 78's aligned tables also certify these readings of *existing* surface
// forms. Keep the upstream analysis when it may be a homograph; add the
// independently attested reading instead of silently rewriting its tags.
for(const [form,nor,nori,nork,page,treatment] of [
  ['dukete','hura',null,'haiek',29,'neutral'],
  ['zaituzte','zuek',null,'haiek',32,'neutral'],
  ['zintuzten','zuek',null,'haiek',32,'neutral'],
  ['bazintuzte','zuek',null,'haiek',32,'neutral'],
  ['zaituzkete','zuek',null,'haiek',32,'neutral'],
  ['zintuzketen','zuek',null,'haiek',32,'neutral'],
  ['zintuzkete','zuek',null,'haiek',32,'neutral'],
  ['dizkieket','haiek','haiek','ni',44,'neutral'],
  ['diake','hura','hi','hura',46,'hika'],
  ['dinake','hura','hi','hura',46,'hika'],
  ['diakete','hura','hi','haiek',50,'hika'],
] as [string,Person,Person|null,Person|null,number,Treatment][]) {
  const row=db.prepare('SELECT payload,base FROM analyses WHERE form=? AND lemma=? ORDER BY base DESC LIMIT 1').get(form,'ukan') as {payload:string;base:number}|undefined;
  if(!row)throw new Error(`78. arauko homografoaren oinarria falta da: ${form}`);
  const source=JSON.parse(row.payload) as Analysis;
  const analysis:Analysis={...source,
    id:createHash('sha256').update(JSON.stringify(['rule78-reading',form,nor,nori,nork,treatment])).digest('hex').slice(0,24),
    nor,nori,nork,treatment,allocutive:false,rawTags:['normative:78'],origin:'rule',validation:'reviewed',
    segmentation:null,history:[],
    citations:[{sourceId:'euskaltzaindia78',locator:`78. araua, PDFko ${page}. orrialdea; *edun-en pertsona-taula`}],
  };
  analysis.type=nori?'nor-nori-nork':'nor-nork';
  insert.run(analysis.id,form,'ukan','batua',row.base,'euskaltzaindia78',JSON.stringify(analysis));
}
// In the *ezan NOR-NORK potential table, the optional -(te) of the HAIEK
// subject yields three additional homographs with NOR=ZUEK (PDF page 40).
for(const form of ['zaitzakete','zintzaketen','zintzakete']) {
  const row=db.prepare('SELECT payload FROM analyses WHERE form=? AND lemma=? AND base=1 LIMIT 1').get(form,'ezan') as {payload:string}|undefined;
  if(!row)throw new Error(`78. arauko *ezan homografoaren oinarria falta da: ${form}`);
  const source=JSON.parse(row.payload) as Analysis;
  const analysis:Analysis={...source,
    id:createHash('sha256').update(JSON.stringify(['rule78-ezan-potential',form,'zuek','haiek'])).digest('hex').slice(0,24),
    nor:'zuek',nori:null,nork:'haiek',treatment:'neutral',allocutive:false,
    affixes:[],baseForm:form,rawTags:['normative:78'],origin:'rule',validation:'reviewed',segmentation:null,history:[],
    citations:[{sourceId:'euskaltzaindia78',locator:'78. araua, PDFko 40. orrialdea; *ezan NOR-NORK, NOR=ZUEK, NORK=HAIEK'}],
  };
  insert.run(analysis.id,form,'ezan','batua',1,'euskaltzaindia78',JSON.stringify(analysis));
}
// Page 40 also gives the NOR=ZUEK subjunctive rows, including -(te)
// alternatives. Several share a surface with the singular NOR row.
for(const [form,model,tense,nork] of [
  ['bazaitzate','bazaitzate','present','hura'],
  ['zaitzaten','zaitzaten','present','haiek'],
  ['bazaitzate','bazaitzate','present','haiek'],
  ['bazaitzatete','bazintzatete','present','haiek'],
  ['zaitzatela','zaitzatela','present','haiek'],
  ['zintzaten','zintzaten','past','haiek'],
  ['zintzatela','zintzatela','past','haiek'],
  ['zintzaten','zintzaten','hypothetical','haiek'],
  ['bazintzate','bazintzate','hypothetical','haiek'],
] as [string,string,Tense,Person][]) {
  const row=db.prepare('SELECT payload FROM analyses WHERE form=? AND lemma=? LIMIT 1').get(model,'ezan') as {payload:string}|undefined;
  if(!row)throw new Error(`78. arauko *ezan subjuntiboaren oinarria falta da: ${model}`);
  const source=JSON.parse(row.payload) as Analysis;
  const analysis:Analysis={...source,
    id:createHash('sha256').update(JSON.stringify(['rule78-ezan-subjunctive',form,tense,'zuek',nork])).digest('hex').slice(0,24),
    form,mood:'subjunctive',tense,nor:'zuek',nori:null,nork,treatment:'neutral',allocutive:false,
    baseForm:form===model?source.baseForm:form.slice(2),rawTags:['normative:78'],origin:'rule',validation:'reviewed',
    segmentation:null,history:[],
    citations:[{sourceId:'euskaltzaindia78',locator:'78. araua, PDFko 40. orrialdea; *ezan NOR-NORK, NOR=ZUEK'}],
  };
  insert.run(analysis.id,form,'ezan','batua',0,'euskaltzaindia78',JSON.stringify(analysis));
}
// Three isolated toka omissions in the licensed corpus: retain the source
// analysis of their neutral base, and cite the Academy's hika table.
for(const [form,base] of [
  ['lekizkigukek','lekizkiguke'],
  ['liezazkidaketek','liezazkidakete'],
  ['liezazkiguketek','liezazkigukete'],
] as [string,string][]) {
  const row=db.prepare('SELECT payload FROM analyses WHERE form=? AND base=1 LIMIT 1').get(base) as {payload:string}|undefined;
  if(!row)throw new Error(`Hikako oinarria falta da: ${base}`);
  const source=JSON.parse(row.payload) as Analysis;
  const analysis:Analysis={...source,id:createHash('sha256').update(JSON.stringify(['normative-toka',form,source.id])).digest('hex').slice(0,24),
    form,baseForm:base,treatment:'toka',allocutive:true,origin:'rule',validation:'reviewed',
    rawTags:[...source.rawTags,'normative:toka'],segmentation:null,history:[],
    citations:[...source.citations,{sourceId:'euskaltzaindia14',locator:'14. araua, *edin/*ezan-en hikako NOR-NORI(-NORK) saila'}]};
  insert.run(analysis.id,form,analysis.lemma,'batua',1,'euskaltzaindia14',JSON.stringify(analysis));
}
const baseAnalyses=(db.prepare('SELECT payload FROM analyses WHERE base=1').all() as {payload:string}[]).map(row=>JSON.parse(row.payload) as Analysis);
const signature=(a:Analysis)=>JSON.stringify([a.form,a.lemma,a.mood,a.tense,a.nor,a.nori,a.nork,a.treatment,a.allocutive]);
const existing=new Set(baseAnalyses.map(signature));
let generatedAllocutives=0;
for(const base of baseAnalyses) for(const candidate of allocutiveCandidates(base)) {
  const derived:Analysis={...base,id:createHash('sha256').update(JSON.stringify(['allocutive',base.id,candidate])).digest('hex').slice(0,24),
    form:candidate.form,treatment:candidate.treatment,allocutive:true,origin:'rule',validation:'generated',
    baseForm:base.form,rawTags:[...base.rawTags,`allocutive:${candidate.treatment}`],segmentation:null,history:[],
    citations:[...base.citations,{sourceId:'wiktionary-eu-verb',locator:'Module:eu-verb, m_all_from_bare / switch_hi_ending; TypeScript egokitzapena'}]};
  const key=signature(derived);
  if(existing.has(key))continue;
  insert.run(derived.id,derived.form,derived.lemma,'batua',1,'wiktionary-eu-verb',JSON.stringify(derived));
  existing.add(key);generatedAllocutives++;
}
db.exec('COMMIT;');
const count = (sql: string) => Number((db.prepare(sql).get() as { n:number }).n);
const lemmas = db.prepare('SELECT lemma, count(DISTINCT form) AS forms, count(*) AS analyses FROM analyses GROUP BY lemma ORDER BY lemma').all() as Coverage['lemmas'];
const coverage: Coverage = {
  version:'0.1.0-apertium-f2888cdc-hika14-eab1979', forms:count('SELECT count(DISTINCT form) AS n FROM analyses'),
  analyses:count('SELECT count(*) AS n FROM analyses'), baseForms:count('SELECT count(DISTINCT form) AS n FROM analyses WHERE base=1'),
  lemmas, varieties:['batua'], source:'apertium+wiktionary+euskaltzaindia', complete:false,
  reviewedSegmentations:6, historicalNotes:2, missingLemmas:[],
  limitations:[
    {eu:'Apertiumeko 35 paradigma, ba- saileko beste 5 lema, *iro/*io osagarriak eta *irakatsi*ren agintera. 14. arauko hikako taulak, 78. arauko laguntzaile-gelaxkak eta 1979ko Euskal Aditz Batuaren 63 paradigma-orri auditatu dira; horrek ez du euskara batuko inbentario eta analisi guztien estaldura osoa frogatzen. Liburuko gainerako paradigma trinkoen auditoria amaitu gabe dago.'},
    {eu:'Atxeki → atxiki, irudi/iruditu eta erion → jario loturak Hiztegi Batuaren arabera ebatzi dira; erion bizkaierazko forma urria da, eta ez da euskara batuko lema bereizi gisa inportatu. *io aparteko lema gisa dago.'},
    {eu:'Arau bidez sortutako hitano-formak «sortua» gisa markatzen dira; banakako arautasun-ziurtagiria ez da. 14. arauaren PDFa emanda, audit:alokutibo komandoak hiru zutabeko formak alderatzen ditu.'},
    {eu:'Lexikoak forma literarioak eta arraroak ere baditu; banakako arautasun-auditoria amaitu gabe dago.'},
    {eu:'Morfema-zatiketa partziala da; analisi historikoa iturri zehatzak dituzten kasuetan soilik eskaintzen da.'},
    {eu:'Hitano batzuen generoa ez du iturriak esplizituki bereizten; kasu horietan «hika (zehaztu gabe)» agertzen da.'},
    {eu:'EUTSIren deut- saileko lau orainaldiko irakurketa 1977ko Aditz sintetikoa zerrendarekin berrikusi dira. 1979ko Euskal Aditz Batuak daut- ematen du; lau aldaera horiek gatazkatsu/«sortua» gisa agertzen dira eta ez dute alokutiborik sortzen.'},
    {eu:'1977ko JARRAIKI taulak garraizkie lerroa omitzen du eta zinderraizkien gelaxkan ginderraizkien inprimatzen du; 1979ko taulak bi formak zuzen eta esplizituki ematen ditu.'},
  ],
};
db.prepare('INSERT INTO metadata VALUES (?,?)').run('coverage',JSON.stringify(coverage));
db.prepare('INSERT INTO metadata VALUES (?,?)').run('sourceSha256',digest);
const integrity = db.prepare('PRAGMA integrity_check').get();
if (!integrity || Object.values(integrity)[0] !== 'ok' || db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Invalid database');
db.exec('ANALYZE;'); db.close();
renameSync(temporary, new URL('aditzak.sqlite', output));
writeFileSync(new URL('coverage.json',output),JSON.stringify({ ...coverage, attempted, generatedAllocutives, skipped },null,2)+'\n');
console.log(JSON.stringify({ forms:coverage.forms, analyses:coverage.analyses, lemmas:lemmas.length, skipped },null,2));
