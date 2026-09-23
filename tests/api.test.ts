import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../apps/api/src/app.js';
import type { Analysis, AnalyzeResponse } from '@aditzak/shared';
const app=createApp();
test.after(()=>app.close());
async function analyze(form:string){const response=await app.inject({url:'/api/v1/analyze?'+new URLSearchParams({form})});assert.equal(response.statusCode,200);return response.json<AnalyzeResponse>();}
test('hatzait exact requested grammatical analysis and segmentation',async()=>{
  const {normalized,analyses}=await analyze(' HATZAIT! ');assert.equal(normalized,'hatzait');assert.equal(analyses.length,1);
  const a=analyses[0];assert.equal(a.mood,'indicative');assert.equal(a.tense,'present');assert.equal(a.type,'nor-nori');assert.equal(a.nor,'hi');assert.equal(a.nori,'ni');assert.equal(a.nork,null);assert.equal(a.allocutive,false);
  assert.deepEqual(a.segmentation?.segments.map(s=>s.text),['ha','tzai','t']);assert.equal(a.segmentation?.status,'reviewed');
});
test('synthetic and four auxiliary agreement families',async()=>{
  for(const [form,lemma,type] of [['dator','etorri','nor'],['dut','ukan','nor-nork'],['zait','izan','nor-nori'],['didazue','ukan','nor-nori-nork'],['dakit','jakin','nor-nork'],['dezagun','ezan','nor-nork'],['dadin','edin','nor']]){
    const result=await analyze(form);assert.ok(result.analyses.some(a=>a.lemma===lemma&&a.type===type),form);
  }
});
test('nauk and naun preserve argument versus allocutive ambiguity and gender',async()=>{
  for(const [form,gender] of [['nauk','toka'],['naun','noka']]){
    const {analyses}=await analyze(form);assert.ok(analyses.some(a=>a.nork==='hi'&&!a.allocutive&&a.treatment===gender));assert.ok(analyses.some(a=>a.allocutive&&a.nork===null&&a.treatment===gender));
  }
});
test('subordination and nominalized chains preserve underlying form',async()=>{
  for(const [form,base,suffix] of [['datorrenean','dator','nean'],['naizela','naiz','la'],['dudala','dut','la'],['balitz','litz','ba']]){
    const {analyses}=await analyze(form);assert.ok(analyses.some(a=>a.baseForm===base&&a.affixes.some(f=>f.startsWith(suffix+'<'))),form);
  }
  const conditional=(await analyze('balitz')).analyses.find(a=>a.mood==='conditional');assert.ok(conditional);
  assert.deepEqual(conditional.segmentation?.segments.map(s=>s.text),['ba','litz']);
});
test('bait derived results cite an existing reference and have distinct ids',async()=>{
  for(const word of ['baitu','bainaiz','baikara','baitzara','baihaiz']){
    const r=await analyze(word);assert.ok(r.analyses.some(a=>a.origin==='rule'),word);
    for(const a of r.analyses)for(const c of a.citations)assert.ok(r.sources.some(s=>s.id===c.sourceId));
  }
});
test('past probability and conditional consequence are both available',async()=>{
  const r=await analyze('nintzatekeen');
  assert.ok(r.analyses.some(a=>a.mood==='probability'&&a.tense==='past'));
  const consequence=r.analyses.find(a=>a.mood==='consequence'&&a.tense==='past');
  assert.ok(consequence);assert.equal(consequence.origin,'rule');
  assert.ok(consequence.citations.some(c=>c.sourceId==='odriozola-baldintza'));
  const byId=(await app.inject({url:'/api/v1/forms/'+consequence.id})).json<Analysis>();assert.equal(byId.id,consequence.id);
  const bait=(await analyze('bainaiz')).analyses.find(a=>a.origin==='rule');assert.ok(bait);
  const byBait=(await app.inject({url:'/api/v1/forms/'+bait.id})).json<Analysis>();assert.equal(byBait.id,bait.id);
});
test('conditional premise differs from present consequence',async()=>{
  assert.ok((await analyze('balitz')).analyses.some(a=>a.mood==='conditional'));
  assert.ok((await analyze('nintzateke')).analyses.some(a=>a.mood==='consequence'));
});
test('all segmentation offsets reconstruct their surface and unknown history stays absent',async()=>{
  for(const form of ['hatzait','dut','du','haiz','naiz','didazue','dator','dakit','zarete']){
    for(const a of (await analyze(form)).analyses){
      if(a.segmentation){assert.equal(a.segmentation.segments.map(s=>s.text).join(''),a.form);for(const s of a.segmentation.segments)assert.equal(a.form.slice(s.start,s.end),s.text);}
      for(const h of a.history)assert.ok(h.citations.length&&h.confidence);
    }
  }
  assert.equal((await analyze('hatzait')).analyses[0].history.length,0);
  assert.ok((await analyze('dut')).analyses[0].history.length);
  assert.equal((await analyze('du')).analyses[0].history.length,0);
});
test('invalid inputs, unknown variety, unknown IDs and healthy API',async()=>{
  for(const form of ['etorri naiz','123','<script>','a'.repeat(81)])assert.equal((await app.inject({url:'/api/v1/analyze?'+new URLSearchParams({form})})).statusCode,400);
  assert.equal((await app.inject({url:'/api/v1/analyze'})).statusCode,400);
  assert.equal((await app.inject({url:'/api/v1/analyze?form=naiz&variety=unknown'})).statusCode,400);
  assert.equal((await app.inject({url:'/api/v1/forms/unknown'})).statusCode,404);
  assert.equal((await app.inject({url:'/health'})).statusCode,200);
});
test('typo suggestions and absence are not fabricated analyses',async()=>{
  const r=await analyze('hatzaot');assert.equal(r.analyses.length,0);assert.ok(r.suggestions.includes('hatzait'));
  const unknown=await analyze('qqqqqqqq');assert.deepEqual(unknown.analyses,[]);assert.deepEqual(unknown.suggestions,[]);
});
test('coverage counts and provenance remain explicit',async()=>{
  const meta=(await app.inject({url:'/api/v1/meta'})).json();assert.ok(meta.forms>400000);assert.ok(meta.analyses>650000);assert.equal(meta.lemmas.length,40);assert.equal(meta.complete,false);assert.equal(meta.reviewedSegmentations,6);
  const a=(await analyze('hatzait')).analyses[0];const byId=(await app.inject({url:'/api/v1/forms/'+a.id})).json<Analysis>();assert.equal(byId.id,a.id);
});
