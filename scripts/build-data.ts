import { readFileSync, mkdirSync, writeFileSync, renameSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { parseDictionary, expandEntry, type Entry } from './dictionary.js';
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
};
const people: Record<string,Person> = { NI:'ni', HI:'hi', HU:'hura', GU:'gu', ZU:'zu', ZK:'zuek', HK:'haiek' };
const auxiliaries = new Set(['izan','ukan','edin','ezan']);
const insert = db.prepare('INSERT OR IGNORE INTO analyses VALUES (?,?,?,?,?,?,?)');
const lemmaInsert = db.prepare('INSERT OR IGNORE INTO lemmas VALUES (?,?)');
const skipped: Record<string,number> = {};
let attempted = 0;
function importEntry(entry: Entry, paradigm: string, lemma: string | null, prefix = '', extracted = false) {
  const bare = entry.right.split('+')[0];
  const tags = [...bare.matchAll(/<([^>]+)>/g)].map(m => m[1]);
  const verb = lemma ?? bare.replace(/<[^>]*>/g, '');
  const temporal = tags.find(tag => moods[tag]);
  const nor = people[tags.find(t => t.startsWith('NR_'))?.slice(3) ?? ''];
  if (!verb || !nor || !temporal || !tags.includes('vbsint')) {
    const key = tags.slice(0,2).join(':'); skipped[key] = (skipped[key] ?? 0) + 1; return;
  }
  const [mood, tense] = moods[temporal];
  const nori = people[tags.find(t => t.startsWith('NI_'))?.slice(3) ?? ''] ?? null;
  const nork = people[tags.find(t => t.startsWith('NK_'))?.slice(3) ?? ''] ?? null;
  const kind = auxiliaries.has(verb) ? 'auxiliary' : 'synthetic';
  lemmaInsert.run(verb, kind);
  const expanded = expandEntry(entry, dictionary);
  const plain = expanded.filter(e => !e.right.includes('+'));
  const baseForm = plain[0]?.left ?? null;
  for (const e of expanded) {
    const form = (prefix + e.left).normalize('NFC').toLowerCase();
    if (!/^[a-zñü]+$/.test(form)) { skipped['invalid-surface'] = (skipped['invalid-surface'] ?? 0) + 1; continue; }
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
    const payload: Analysis = {
      id: '', form, lemma: verb, kind, variety:'batua', mood, tense,
      type: nori ? (nork ? 'nor-nori-nork' : 'nor-nori') : (nork ? 'nor-nork' : 'nor'),
      nor, nori, nork, treatment, allocutive: tags.includes('TO') || tags.includes('NO'),
      affixes, rawTags: [...tags, ...suffixes], baseForm: affixes.length ? baseForm : form,
      origin: extracted ? 'rule' : 'lexicon', validation: 'imported',
      citations: [{ sourceId:'apertium', locator:`apertium-eus.eus.dix:${entry.line} (${paradigm}${entry.refs.length ? ' → '+entry.refs.join(', ') : ''}${extracted ? '; ba- gabe berreskuratutako indikatiboko oinarria' : ''})` }],
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
db.exec('COMMIT;');
const count = (sql: string) => Number((db.prepare(sql).get() as { n:number }).n);
const lemmas = db.prepare('SELECT lemma, count(DISTINCT form) AS forms, count(*) AS analyses FROM analyses GROUP BY lemma ORDER BY lemma').all() as Coverage['lemmas'];
const coverage: Coverage = {
  version:'0.1.0-apertium-f2888cdc', forms:count('SELECT count(DISTINCT form) AS n FROM analyses'),
  analyses:count('SELECT count(*) AS n FROM analyses'), baseForms:count('SELECT count(DISTINCT form) AS n FROM analyses WHERE base=1'),
  lemmas, varieties:['batua'], source:'apertium', complete:false,
  reviewedSegmentations:6, historicalNotes:2, missingLemmas:['atxeki','erion','io','irudi'],
  limitations:[
    {eu:'Apertiumeko 35 paradigma eta ba- saileko beste 5 lema. Ez da oraindik euskara batuko adizki guztien estaldura osoa egiaztatu. Erauntsi, eroan, iharduki, irakin eta jario lemen indikatiboko oinarriak ba- sailetik berreskuratu dira; haien gainerako sailen estaldura partziala da.'},
    {eu:'EHUko adizkitegiko atxeki, erion, io eta irudi lemak ez daude corpus honetan izen horiekin. Atxiki, jario, erran eta iruditu lemekiko baliokidetasuna egiaztatzeko dago; ez dira automatikoki parekatu.'},
    {eu:'Lexikoak forma literarioak eta arraroak ere baditu; banakako arautasun-auditoria amaitu gabe dago.'},
    {eu:'Morfema-zatiketa partziala da; analisi historikoa iturri zehatzak dituzten kasuetan soilik eskaintzen da.'},
    {eu:'Hitano batzuen generoa ez du iturriak esplizituki bereizten; kasu horietan «hika (zehaztu gabe)» agertzen da.'},
  ],
};
db.prepare('INSERT INTO metadata VALUES (?,?)').run('coverage',JSON.stringify(coverage));
db.prepare('INSERT INTO metadata VALUES (?,?)').run('sourceSha256',digest);
const integrity = db.prepare('PRAGMA integrity_check').get();
if (!integrity || Object.values(integrity)[0] !== 'ok' || db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('Invalid database');
db.exec('ANALYZE;'); db.close();
renameSync(temporary, new URL('aditzak.sqlite', output));
writeFileSync(new URL('coverage.json',output),JSON.stringify({ ...coverage, attempted, skipped },null,2)+'\n');
console.log(JSON.stringify({ forms:coverage.forms, analyses:coverage.analyses, lemmas:lemmas.length, skipped },null,2));
