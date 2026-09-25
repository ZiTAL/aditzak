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
    const {analyses}=await analyze(form);assert.ok(analyses.some(a=>a.lemma==='ukan'&&a.nork==='hi'&&!a.allocutive&&a.treatment===gender));assert.ok(analyses.some(a=>a.lemma==='izan'&&a.allocutive&&a.nork===null&&a.treatment===gender));
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
test('normative auxiliary omissions and dukezu agreement are corrected',async()=>{
  const dukezu=(await analyze('dukezu')).analyses.find(a=>a.lemma==='ukan'&&a.mood==='probability');
  assert.equal(dukezu?.nork,'zu');
  const dukezue=(await analyze('dukezue')).analyses.find(a=>a.lemma==='ukan'&&a.mood==='probability');
  assert.equal(dukezue?.nork,'zuek');
  assert.ok((await analyze('zakizkigukete')).analyses.some(a=>a.lemma==='edin'&&a.nor==='zuek'&&a.nori==='gu'));
  assert.ok((await analyze('baditzat')).analyses.some(a=>a.lemma==='ezan'&&a.nor==='haiek'&&a.nork==='ni'));
  assert.ok((await analyze('didake')).analyses.some(a=>a.lemma==='ukan'&&a.nori==='ni'&&a.nork==='hura'&&a.treatment==='neutral'));
  assert.ok((await analyze('geniezaiekean')).analyses.some(a=>a.lemma==='ezan'&&a.treatment==='toka'&&a.allocutive));
  for(const form of ['lekizkigukek','liezazkidaketek','liezazkiguketek'])
    assert.ok((await analyze(form)).analyses.some(a=>a.treatment==='toka'&&a.allocutive),form);
});
test('rule 78 aligned tables retain all attested homograph readings',async()=>{
  for(const [form,mood,tense,nor,nori,nork] of [
    ['dukete','probability','present','hura',null,'haiek'],
    ['zaituzte','indicative','present','zuek',null,'haiek'],
    ['zintuzten','indicative','past','zuek',null,'haiek'],
    ['bazintuzte','conditional','hypothetical','zuek',null,'haiek'],
    ['zaituzkete','probability','present','zuek',null,'haiek'],
    ['zintuzketen','probability','past','zuek',null,'haiek'],
    ['zintuzkete','consequence','present','zuek',null,'haiek'],
    ['dizkieket','probability','present','haiek','haiek','ni'],
    ['diake','probability','present','hura','hi','hura'],
    ['dinake','probability','present','hura','hi','hura'],
    ['diakete','probability','present','hura','hi','haiek'],
  ] as const){
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='ukan'&&a.mood===mood&&a.tense===tense&&a.nor===nor&&a.nori===nori&&a.nork===nork&&a.citations.some(c=>c.sourceId==='euskaltzaindia78')),form);
  }
  const dukete=(await analyze('dukete')).analyses;
  assert.equal(dukete[0].nor,'hura');
  assert.equal(dukete[0].validation,'reviewed');
  assert.ok(dukete.some(a=>a.validation==='imported'));
});
test('rule 78 potential tables retain optional plural agreement',async()=>{
  for(const [form,tense] of [
    ['zaitzakete','present'],['zintzaketen','past'],['zintzakete','hypothetical'],
  ] as const){
    const analyses=(await analyze(form)).analyses;
    assert.ok(analyses.some(a=>a.lemma==='ezan'&&a.mood==='potential'&&a.tense===tense&&a.nor==='zuek'&&a.nork==='haiek'&&a.validation==='reviewed'),form);
    assert.ok(analyses.some(a=>a.lemma==='ezan'&&a.nor==='zu'&&a.nork==='haiek'),form);
  }
});
test('rule 78 subjunctive tables retain plural and homograph readings',async()=>{
  for(const [form,tense,nork] of [
    ['bazaitzate','present','hura'],
    ['zaitzaten','present','haiek'],
    ['bazaitzate','present','haiek'],
    ['bazaitzatete','present','haiek'],
    ['zaitzatela','present','haiek'],
    ['zintzaten','past','haiek'],
    ['zintzatela','past','haiek'],
    ['zintzaten','hypothetical','haiek'],
    ['bazintzate','hypothetical','haiek'],
  ] as const){
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='ezan'&&a.mood==='subjunctive'&&a.tense===tense&&
      a.nor==='zuek'&&a.nork===nork&&a.validation==='reviewed'&&a.citations.some(c=>c.sourceId==='euskaltzaindia78')),form+' '+tense+' '+nork);
  }
});
test('rule 14 rows preserve agreement across neutral, toka and noka',async()=>{
  for(const [form,lemma,nor,nori,nork,treatment] of [
    ['zitzaizkigun','izan','haiek','gu',null,'neutral'],
    ['zitzaizkiguan','izan','haiek','gu',null,'toka'],
    ['zitzaizkigunan','izan','haiek','gu',null,'noka'],
    ['didake','ukan','hura','ni','hura','neutral'],
    ['zidakek','ukan','hura','ni','hura','toka'],
    ['zidaken','ukan','hura','ni','hura','noka'],
    ['negien','egin','hura','haiek','ni','neutral'],
    ['negiean','egin','hura','haiek','ni','toka'],
    ['negienan','egin','hura','haiek','ni','noka'],
    ['genegien','egin','hura','haiek','gu','neutral'],
    ['genegiean','egin','hura','haiek','gu','toka'],
    ['genegienan','egin','hura','haiek','gu','noka'],
  ] as const){
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma===lemma&&a.nor===nor&&a.nori===nori&&a.nork===nork&&a.treatment===treatment),form);
  }
});
test('iro, io and missing synthetic hika keep exact roles and provenance',async()=>{
  const iro=(await analyze('ziroagu')).analyses.find(a=>a.lemma==='iro'&&a.treatment==='toka');
  assert.ok(iro);assert.equal(iro.kind,'auxiliary');assert.equal(iro.nork,'gu');assert.equal(iro.mood,'potential');
  const io=(await analyze('ziostazak')).analyses.find(a=>a.lemma==='io'&&a.treatment==='toka');
  assert.ok(io);assert.equal(io.nor,'haiek');assert.equal(io.nori,'ni');assert.equal(io.nork,'hura');
  assert.ok((await analyze('zion')).analyses.some(a=>a.lemma==='io'&&a.treatment==='noka'&&a.allocutive));
  for(const [form,lemma] of [['zeridak','jario'],['zaramakidak','eraman'],['zarabilkidak','erabili'],['nerizteke','iritzi'],['nerrake','erran'],['leroakek','eroan']])
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma===lemma),form);
  assert.equal((await analyze('zaramakidak')).analyses.find(a=>a.lemma==='eraman')?.validation,'generated');
});
test('irakatsi imperative follows the Academy paradigm and keeps gender distinct',async()=>{
  for(const [form,nor,nori,nork,treatment] of [
    ['irakatsak','hura',null,'hi','toka'],
    ['irakatsan','hura',null,'hi','noka'],
    ['irakastak','hura','ni','hi','toka'],
    ['irakaskuzu','hura','gu','zu','neutral'],
    ['irakatsiozue','hura','hura','zuek','neutral'],
    ['irakatsazkiguzu','haiek','gu','zu','neutral'],
  ] as const) {
    const analyses=(await analyze(form)).analyses;
    assert.ok(analyses.some(a=>a.lemma==='irakatsi'&&a.kind==='synthetic'&&a.mood==='imperative'&&a.type===(nori?'nor-nori-nork':'nor-nork')&&
      a.nor===nor&&a.nori===nori&&a.nork===nork&&a.treatment===treatment&&!a.allocutive&&a.validation==='reviewed'&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')),form);
  }
  const upstream=(await analyze('irakatsiguzu')).analyses;
  assert.ok(upstream.some(a=>a.lemma==='irakatsi'&&a.validation==='imported'));
  assert.ok(!upstream.some(a=>a.lemma==='erakutsi'));
});
test('jario NN4 and NN9 keep NOR/NORI and hi gender distinct',async()=>{
  for(const [form,nor,nori,mood,tense,treatment,validation] of [
    ['leriake','hura','hi','potential','hypothetical','toka','generated'],
    ['lerinake','hura','hi','potential','hypothetical','noka','generated'],
    ['lerizkizuke','haiek','zu','potential','hypothetical','neutral','generated'],
    ['lerizkizueke','haiek','zuek','potential','hypothetical','neutral','generated'],
    ['berit','hura','ni','imperative','present','neutral','reviewed'],
    ['berik','hura','hi','imperative','present','toka','reviewed'],
    ['berin','hura','hi','imperative','present','noka','reviewed'],
    ['berizkin','haiek','hi','imperative','present','noka','reviewed'],
    ['berizkizue','haiek','zuek','imperative','present','neutral','reviewed'],
  ] as const) {
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='jario'&&a.kind==='synthetic'&&
      a.type==='nor-nori'&&a.nor===nor&&a.nori===nori&&a.nork===null&&
      a.mood===mood&&a.tense===tense&&a.treatment===treatment&&!a.allocutive&&
      a.validation===validation&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')),form);
  }
});
test('eroan NN4 and NN9 keep missing NORK persons and singular/plural NOR',async()=>{
  for(const [form,nor,nork,mood,tense,treatment,validation] of [
    ['heroake','hura','hi','potential','hypothetical','hika','generated'],
    ['zeneroakete','hura','zuek','potential','hypothetical','neutral','generated'],
    ['heroazke','haiek','hi','potential','hypothetical','hika','generated'],
    ['zeneroazkete','haiek','zuek','potential','hypothetical','neutral','generated'],
    ['eroak','hura','hi','imperative','present','toka','reviewed'],
    ['eroan','hura','hi','imperative','present','noka','reviewed'],
    ['beroa','hura','hura','imperative','present','neutral','reviewed'],
    ['eroaitzak','haiek','hi','imperative','present','toka','reviewed'],
    ['eroaitzan','haiek','hi','imperative','present','noka','reviewed'],
    ['beroatzate','haiek','haiek','imperative','present','neutral','reviewed'],
  ] as const) {
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='eroan'&&a.kind==='synthetic'&&
      a.type==='nor-nork'&&a.nor===nor&&a.nori===null&&a.nork===nork&&
      a.mood===mood&&a.tense===tense&&a.treatment===treatment&&!a.allocutive&&
      a.validation===validation&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')&&
      (mood!=='imperative'||a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977'))),form);
  }
});
test('erakutsi imperative HI endings are source-reviewed toka/noka, not unspecified hika',async()=>{
  for(const [nor,recipients] of [
    ['hura',[['ni','erakusta'],['gu','erakusku'],['hura','erakutsio'],['haiek','erakutsie']]],
    ['haiek',[['ni','erakutsazkida'],['gu','erakutsazkigu'],['hura','erakutsazkio'],['haiek','erakutsazkie']]],
  ] as const) for(const [nori,stem] of recipients) for(const [suffix,treatment] of [['k','toka'],['n','noka']] as const) {
    const form=stem+suffix;
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='erakutsi'&&a.mood==='imperative'&&
      a.nor===nor&&a.nori===nori&&a.nork==='hi'&&a.treatment===treatment&&
      a.validation==='reviewed'&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')),form);
  }
  for(const [mood,tense] of [['consequence','present'],['potential','hypothetical']] as const)
    assert.ok((await analyze('herakuske')).analyses.some(a=>a.lemma==='erakutsi'&&a.mood===mood&&
      a.tense===tense&&a.nor==='hura'&&a.nork==='hi'&&a.treatment==='hika'&&a.validation==='generated'));
  for(const [form,treatment] of [['erakutsak','toka'],['erakutsan','noka']] as const)
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='erakutsi'&&a.mood==='imperative'&&
      a.nor==='hura'&&a.nori===null&&a.nork==='hi'&&a.treatment===treatment&&a.validation==='reviewed'));
  for(const [form,nork] of [['herakuskien','hi'],['zenerakuskiten','zuek']] as const)
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='erakutsi'&&a.mood==='indicative'&&
      a.tense==='past'&&a.nor==='haiek'&&a.nork===nork&&a.validation==='reviewed'));
  for(const [form,nor,nork] of [
    ['banerakutsa','hura','ni'],['balerakutsa','hura','hura'],
    ['bazenerakutsate','hura','zuek'],['banerakuski','haiek','ni'],
    ['bazenerakuskite','haiek','zuek'],['balerakuskite','haiek','haiek'],
  ] as const) assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='erakutsi'&&
    a.mood==='conditional'&&a.tense==='hypothetical'&&a.nor===nor&&a.nork===nork&&
    a.affixes.includes('ba<cnjsub>')&&a.validation==='generated'),form);
});
test('further official compact paradigms retain missing cells and exact hika gender',async()=>{
  for(const [form,lemma,mood,nor,nori,nork,treatment,validation] of [
    ['iraun','iraun','imperative','hura',null,'hi','noka','reviewed'],
    ['irudin','iruditu','imperative','hura',null,'hi','noka','reviewed'],
    ['emaitzan','eman','imperative','haiek',null,'hi','noka','reviewed'],
    ['bemazkinate','eman','imperative','haiek','hi','haiek','noka','reviewed'],
    ['utzazkidan','utzi','imperative','haiek','ni','hi','noka','reviewed'],
    ['igorzkiguk','igorri','imperative','haiek','gu','hi','toka','reviewed'],
    ['erosien','erosi','imperative','hura','haiek','hi','noka','reviewed'],
    ['ihardetsion','ihardetsi','imperative','hura','hura','hi','noka','reviewed'],
    ['banerra','erran','conditional','hura',null,'ni','neutral','generated'],
    ['herrake','erran','potential','hura',null,'hi','hika','generated'],
    ['erran','erran','imperative','hura',null,'hi','noka','reviewed'],
    ['esan','esan','imperative','hura',null,'hi','noka','reviewed'],
  ] as const) assert.ok((await analyze(form)).analyses.some(a=>a.lemma===lemma&&a.mood===mood&&
    a.nor===nor&&a.nori===nori&&a.nork===nork&&a.treatment===treatment&&a.validation===validation&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')),form);
});
test('iharduki missing present, N4 and imperative rows retain exact agreement',async()=>{
  for(const [form,nork,mood,treatment,validation] of [
    ['dihardukazue','zuek','indicative','neutral','reviewed'],
    ['hihardukake','hi','potential','hika','generated'],
    ['zenihardukake','zu','potential','neutral','generated'],
    ['zenihardukakete','zuek','potential','neutral','generated'],
    ['ihardukak','hi','imperative','toka','reviewed'],
    ['ihardukan','hi','imperative','noka','reviewed'],
    ['biharduka','hura','imperative','neutral','reviewed'],
    ['ihardukazu','zu','imperative','neutral','reviewed'],
    ['ihardukazue','zuek','imperative','neutral','reviewed'],
    ['bihardukate','haiek','imperative','neutral','reviewed'],
  ] as const) {
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='iharduki'&&a.type==='nor-nork'&&
      a.nor==='hura'&&a.nork===nork&&a.mood===mood&&a.treatment===treatment&&
      a.validation===validation&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')),form);
  }
});
test('erauntsi imperatives and eutsi daut- readings match printed NORI/NORK cells',async()=>{
  for(const [form,lemma,mood,nori,nork] of [
    ['berauntso','erauntsi','imperative','hura','hura'],
    ['berauntsote','erauntsi','imperative','hura','haiek'],
    ['berauntse','erauntsi','imperative','haiek','hura'],
    ['berauntsete','erauntsi','imperative','haiek','haiek'],
    ['dautso','eutsi','indicative','hura','hura'],
    ['dautsote','eutsi','indicative','hura','haiek'],
    ['dautse','eutsi','indicative','haiek','hura'],
    ['dautsete','eutsi','indicative','haiek','haiek'],
  ] as const) {
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma===lemma&&a.mood===mood&&a.nor==='hura'&&
      a.nori===nori&&a.nork===nork&&a.validation===(lemma==='eutsi'?'generated':'reviewed')&&
      a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')&&
      (lemma!=='eutsi'||a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977'))),form);
  }
  assert.ok((await analyze('deutso')).analyses.some(a=>a.lemma==='eutsi'&&a.validation==='reviewed'&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-sintetikoa1977')));
  assert.ok(!(await analyze('dautso')).analyses.some(a=>a.allocutive));
  assert.ok(!(await analyze('zautsok')).analyses.some(a=>a.baseForm==='dautso'));
});
test('eutsi imperative preserves both source tables and licensed i-less variants',async()=>{
  for(const [form,nori,nork,treatment,validation,source] of [
    ['eustan','ni','hi','noka','reviewed','euskaltzaindia-eab1979'],
    ['euskuk','gu','hi','toka','reviewed','euskaltzaindia-eab1979'],
    ['eutsien','haiek','hi','noka','reviewed','euskaltzaindia-eab1979'],
    ['beutse','haiek','hura','neutral','reviewed','euskaltzaindia-eab1979'],
    ['beutse','haiek','haiek','neutral','reviewed','euskaltzaindia-eab1979'],
    ['beutsete','haiek','haiek','neutral','reviewed','euskaltzaindia-sintetikoa1977'],
    ['eutsok','hura','hi','toka','reviewed','euskaltzaindia-eab1979'],
    ['eutsozu','hura','zu','neutral','generated','euskaltzaindia-eab1979'],
    ['eutsek','haiek','hi','toka','generated','euskaltzaindia-eab1979'],
  ] as const) {
    assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='eutsi'&&a.mood==='imperative'&&
      a.tense==='present'&&a.type==='nor-nori-nork'&&a.nor==='hura'&&a.nori===nori&&a.nork===nork&&
      a.treatment===treatment&&a.validation===validation&&a.citations.some(c=>c.sourceId===source)),form);
  }
});
test('early NOR-NORI paradigms retain exact recipient, gender and printed duplicates',async()=>{
  for(const [form,lemma,nor,nori,treatment,validation] of [
    ['natxekin','atxiki','ni','hi','noka','reviewed'],
    ['ninderraiake','jarraiki','ni','hi','toka','generated'],
    ['zenkizkiekete','ekin','zuek','haiek','neutral','generated'],
    ['zerizkinan','jario','haiek','hi','noka','reviewed'],
  ] as const) assert.ok((await analyze(form)).analyses.some(a=>a.lemma===lemma&&a.type==='nor-nori'&&
    a.nor===nor&&a.nori===nori&&a.nork===null&&a.treatment===treatment&&a.validation===validation&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')),form);
  const duplicated=(await analyze('zentxezkiokete')).analyses.filter(a=>a.lemma==='atxiki'&&
    a.type==='nor-nori'&&a.nor==='zuek'&&a.mood==='consequence');
  assert.ok(duplicated.some(a=>a.nori==='hura'));
  assert.ok(duplicated.some(a=>a.nori==='haiek'&&a.validation==='generated'&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')));
});
test('eduki official paradigms preserve hika, parenthesized variants and NN4 ambiguity',async()=>{
  for(const [form,mood,tense,nor,nork,treatment,validation] of [
    ['naukak','indicative','present','ni','hi','toka','reviewed'],
    ['nindukanan','indicative','past','ni','hi','noka','reviewed'],
    ['bazinduzkatete','conditional','hypothetical','zuek','haiek','neutral','reviewed'],
    ['euzkan','imperative','present','haiek','hi','noka','reviewed'],
  ] as const) assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='eduki'&&a.type==='nor-nork'&&
    a.mood===mood&&a.tense===tense&&a.nor===nor&&a.nork===nork&&a.treatment===treatment&&
    a.validation===validation&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')),form);
  const nn4=(await analyze('zinduzkate')).analyses.filter(a=>a.lemma==='eduki'&&a.type==='nor-nork'&&
    a.nor==='zuek'&&a.nork==='haiek'&&a.validation==='generated');
  assert.ok(nn4.some(a=>a.mood==='consequence'&&a.tense==='present'));
  assert.ok(nn4.some(a=>a.mood==='potential'&&a.tense==='hypothetical'));
});
test('ekarri NN1 and synthetic NN9 keep irregular noka and exclude analytic alternatives',async()=>{
  for(const [form,mood,nor,nork,treatment] of [
    ['nakarna','indicative','ni','hi','noka'],['dakartzak','indicative','haiek','hi','toka'],
    ['zakarztete','indicative','zuek','haiek','neutral'],['ekarna','imperative','hura','hi','noka'],
    ['bekartzate','imperative','haiek','haiek','neutral'],
  ] as const) assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='ekarri'&&a.type==='nor-nork'&&
    a.mood===mood&&a.nor===nor&&a.nork===nork&&a.treatment===treatment&&a.validation==='reviewed'&&
    a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')),form);
  for(const analytic of ['ekaritzak','ekaritzan','ekaritzazu','ekaritzazue'])
    assert.equal((await analyze(analytic)).analyses.filter(a=>a.lemma==='ekarri').length,0);
});
test('ekarri NNN pages distinguish printed singular NOR from rule-derived plural NOR',async()=>{
  for(const [form,mood,tense,nor,nori,nork,treatment,validation] of [
    ['dakarkinat','indicative','present','hura','hi','ni','noka','reviewed'],
    ['zekarkinaten','indicative','past','hura','hi','haiek','noka','reviewed'],
    ['bekarkizuete','imperative','present','hura','zuek','haiek','neutral','reviewed'],
    ['dakarzkinat','indicative','present','haiek','hi','ni','noka','generated'],
    ['zekarzkinaten','indicative','past','haiek','hi','haiek','noka','generated'],
    ['ekarzkiguzu','imperative','present','haiek','gu','zu','neutral','generated'],
  ] as const) assert.ok((await analyze(form)).analyses.some(a=>a.lemma==='ekarri'&&a.type==='nor-nori-nork'&&
    a.mood===mood&&a.tense===tense&&a.nor===nor&&a.nori===nori&&a.nork===nork&&
    a.treatment===treatment&&a.validation===validation&&a.citations.some(c=>c.sourceId==='euskaltzaindia-eab1979')),form);
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
  const meta=(await app.inject({url:'/api/v1/meta'})).json();assert.ok(meta.forms>412000);assert.ok(meta.analyses>664000);assert.equal(meta.lemmas.length,43);assert.equal(meta.complete,false);assert.equal(meta.reviewedSegmentations,6);
  const a=(await analyze('hatzait')).analyses[0];const byId=(await app.inject({url:'/api/v1/forms/'+a.id})).json<Analysis>();assert.equal(byId.id,a.id);
});
