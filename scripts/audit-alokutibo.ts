import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { defaultDatabasePath } from '../apps/api/src/database.js';
import type { Analysis } from '../packages/shared/src/index.js';

// A reproducible, read-only audit. The Euskaltzaindia PDF is supplied by the
// operator; neither its text nor its tables are stored or redistributed here.
const pdf=process.argv[2];
if (!pdf) throw new Error('Erabilera: npm run audit:alokutibo -- /bidea/Araua_0014.pdf');
const text=execFileSync('pdftotext',['-layout',pdf,'-'],{encoding:'utf8',maxBuffer:10*1024*1024});
const db=new DatabaseSync(defaultDatabasePath(),{readOnly:true});
const lookup=db.prepare('SELECT payload FROM analyses WHERE form=? AND variety=?');
const pages=text.split('\f');
const pageLemma:Record<number,string>={
  3:'izan',4:'izan',5:'izan',6:'edin',7:'edin',8:'ukan',9:'ukan',10:'ukan',
  11:'ukan',12:'ukan',13:'ezan',14:'ezan',15:'ezan',16:'iro',
  19:'egon',20:'egon',21:'egon',22:'etorri',23:'etorri',24:'etorri',
  25:'ibili',26:'ibili',27:'ibili',28:'joan',29:'joan',30:'joan',31:'atxeki',
  32:'jarraiki',33:'ekin',34:'jario',35:'etzan',36:'eduki',37:'ekarri',38:'ekarri',
  39:'eraman',40:'eraman',41:'erabili',42:'erabili',43:'ezagutu',44:'egin',
  45:'egin',46:'egin',47:'ikusi',48:'jakin',49:'entzun',50:'erakutsi',51:'eroan',
  52:'jardun',53:'iharduki',54:'erauntsi',55:'eutsi',56:'iraun',57:'irudi',
  58:'iritzi',59:'io',60:'io',61:'erran',
};
const roles=['neutral','toka','noka'] as const;
// Euskaltzaindiaren Hiztegi Batuak atxeki → atxiki eta irudi/iruditu
// loturak ematen ditu; auditak lema kanonikoak erabiltzen ditu.
const lemmaAliases:Record<string,string>={atxeki:'atxiki',irudi:'iruditu'};
const missingSurface:Record<string,string[]>={};
const missingAnalysis:Record<string,string[]>={};
const incompatibleRows:string[]=[];
let checked=0;
for(let index=0;index<pages.length;index++){
  const page=index+1;
  const lemma=pageLemma[page];
  const rows=pages[index].split('\n').map(line=>line.trim().split(/\s{2,}/))
    .filter(cells=>cells.length===3 && cells.every(cell=>/^[a-zñü]+(?:,\s*[a-zñü]+)*,?$/.test(cell)));
  for(const row of rows) {
  const rowSignatures: Set<string>[]=[];
  for(let column=0;column<3;column++) {
  const signatures=new Set<string>();
  for(const form of row[column].split(/,\s*/).filter(Boolean)) {
    checked++;
    const analyses=(lookup.all(form,'batua') as {payload:string}[]).map(x=>JSON.parse(x.payload) as Analysis);
    if(!analyses.length)(missingSurface[lemma??`pdf-${page}`]??=[]).push(form);
    if(!lemma)continue;
    const role=roles[column];
    const matching=analyses.filter(a=>a.lemma===(lemmaAliases[lemma]??lemma) && a.treatment===role && a.allocutive===(column!==0));
    for(const a of matching) signatures.add(JSON.stringify([a.mood,a.tense,a.type,a.nor,a.nori,a.nork]));
    if(!matching.length)
      (missingAnalysis[lemma]??=[]).push(`${form} [${role}]`);
  }
  rowSignatures.push(signatures);
  }
  if(lemma && rowSignatures.every(s=>s.size) && ![...rowSignatures[0]].some(signature=>rowSignatures[1].has(signature)&&rowSignatures[2].has(signature)))
    incompatibleRows.push(`${lemma}: ${row.join(' | ')}`);
  }
}
const summarize=(record:Record<string,string[]>)=>Object.fromEntries(Object.entries(record).map(([lemma,forms])=>[lemma,{count:forms.length,examples:forms.slice(0,5)}]));
console.log(JSON.stringify({source:'Euskaltzaindia 14, PDFko hiru zutabeko errenkadak eta koma bidezko aldaerak',checked,
  missingSurfaceCount:Object.values(missingSurface).reduce((n,x)=>n+x.length,0),missingSurface:summarize(missingSurface),
  missingAnalysisCount:Object.values(missingAnalysis).reduce((n,x)=>n+x.length,0),missingAnalysis:summarize(missingAnalysis),
  incompatibleRowCount:incompatibleRows.length,incompatibleRows:incompatibleRows.slice(0,30),
  caveat:'PDF erauzketako hiru zutabeetan ez doazen lerroak eta testuinguruko erabilera ez dira audit honetan zenbatzen.'},null,2));
db.close();
if(checked<5000 || Object.keys(missingSurface).length || Object.keys(missingAnalysis).length || incompatibleRows.length)process.exitCode=1;
