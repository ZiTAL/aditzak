import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { Analysis, AnalyzeResponse, Coverage, Source } from '@aditzak/shared';
import { enrich, normalizeInput, baitCandidates, baitSurface, withBait, withConsequence, editDistance } from './linguistics.js';

export function defaultDatabasePath():string {
  if(process.env.DATABASE_PATH) return resolve(process.env.DATABASE_PATH);
  let dir=process.cwd();
  for(let i=0;i<8;i++) { const candidate=resolve(dir,'data/generated/aditzak.sqlite');if(existsSync(candidate))return candidate;dir=dirname(dir); }
  throw new Error('Datu-basea falta da. Exekutatu npm run data:fetch && npm run data:build');
}
export function openRepository(path=defaultDatabasePath()) {
  const db=new DatabaseSync(path,{readOnly:true});
  db.exec('PRAGMA foreign_keys=ON; PRAGMA query_only=ON;');
  const lookup=db.prepare('SELECT payload FROM analyses WHERE form=? AND variety=? ORDER BY base DESC,lemma,id');
  const sources=(db.prepare('SELECT payload FROM sources ORDER BY id').all() as {payload:string}[]).map(r=>JSON.parse(r.payload) as Source);
  const coverage=JSON.parse((db.prepare("SELECT value FROM metadata WHERE key='coverage'").get() as {value:string}).value) as Coverage;
  const commonForms=(db.prepare('SELECT DISTINCT form FROM analyses WHERE base=1 ORDER BY length(form),form').all() as {form:string}[]).map(r=>r.form);
  const exact=(form:string,variety:string):Analysis[]=>(lookup.all(form,variety) as {payload:string}[]).map(r=>JSON.parse(r.payload));
  return {
    coverage,sources,close:()=>db.close(),
    getById(id:string):Analysis|null {
      const row=db.prepare('SELECT payload FROM analyses WHERE id=?').get(id) as {payload:string}|undefined;
      if(row)return enrich(JSON.parse(row.payload));
      for(const suffix of ['-consequence','-bait'])if(id.endsWith(suffix)){
        const base=this.getById(id.slice(0,-suffix.length));if(!base)return null;
        const derived=suffix==='-consequence'?withConsequence(base):withBait(base,baitSurface(base.form));
        return derived?.id===id?enrich(derived):null;
      }
      return null;
    },
    analyze(input:string,variety='batua'):AnalyzeResponse {
      if(!coverage.varieties.includes(variety))throw new Error('unknown_variety');
      const normalized=normalizeInput(input);
      const analyses=exact(normalized,variety).flatMap(a=>{
        const consequence=withConsequence(a);return consequence?[enrich(a),enrich(consequence)]:[enrich(a)];
      });
      // Always check the rule, even if there is also an exact lexical analysis.
      for(const candidate of new Set(baitCandidates(normalized)))for(const base of exact(candidate,variety)) {
        const derived=withBait(base,normalized);if(derived&&!analyses.some(a=>a.id===derived.id))analyses.push(derived);
      }
      const suggestions=analyses.length?[]:commonForms.filter(f=>Math.abs(f.length-normalized.length)<=2)
        .map(form=>({form,score:editDistance(normalized,form)})).filter(x=>x.score<=Math.max(1,Math.min(3,Math.floor(normalized.length/3))))
        .sort((a,b)=>a.score-b.score||Number(b.form[0]===normalized[0])-Number(a.form[0]===normalized[0])||a.form.localeCompare(b.form,'eu')).slice(0,6).map(x=>x.form);
      return {input,normalized,analyses,suggestions,sources,version:coverage.version};
    },
  };
}
