import type { Mood, Person, Tense, Treatment } from '../packages/shared/src/index.js';

export type EsanNnnReading={page:number;printed:string;series:'NNN1'|'NNN2'|'NNN9';lemma:'io'|'esan';form:string;
  nor:Person;nori:Person;nork:Person;treatment:Treatment;mood:Mood;tense:Tense;evidence:'printed'|'stem-alternative'|'original1977'};
const printed:EsanNnnReading[]=[];
function add(page:number,printedPage:string,series:EsanNnnReading['series'],form:string,nori:Person,nork:Person,
  treatment:Treatment='neutral'){
  printed.push({page,printed:printedPage,series,lemma:series==='NNN9'?'esan':'io',form,nor:'hura',nori,nork,treatment,
    mood:series==='NNN9'?'imperative':'indicative',tense:series==='NNN2'?'past':'present',evidence:'printed'});
}
function pair(page:number,printedPage:string,series:EsanNnnReading['series'],toka:string,noka:string,nori:Person,nork:Person){
  add(page,printedPage,series,toka,nori,nork,'toka');add(page,printedPage,series,noka,nori,nork,'noka');
}
pair(378,'178','NNN1','diostak','diostan','ni','hi');for(const [nork,form] of
  [['hura','diost'],['zu','diostazu'],['zuek','diostazue'],['haiek','diostate']] as [Person,string][])add(378,'178','NNN1',form,'ni',nork);
pair(378,'178','NNN1','dioskuk','dioskun','gu','hi');for(const [nork,form] of
  [['hura','diosku'],['zu','dioskuzu'],['zuek','dioskuzue'],['haiek','dioskute']] as [Person,string][])add(378,'178','NNN1',form,'gu',nork);
for(const [nork,toka,noka] of [['ni','diosat','diosnat'],['hura','diosk','diosna'],['gu','diosagu','diosnagu'],
  ['haiek','diosate','diosnate']] as [Person,string,string][])pair(378,'178','NNN1',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['diotsut','diotsu','diotsugu','diotsute']],
  ['zuek',['diotsuet','diotsue','diotsuegu','diotsuete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(378,'178','NNN1',form,nori,['ni','hura','gu','haiek'][index] as Person));
for(const [nori,forms] of [['hura',['diotsot','diotsok','diotson','diotso','diotsogu','diotsozu','diotsozue','diotsote']],
  ['haiek',['diotset','diotsek','diotsen','diotse','diotsegu','diotsezu','diotsezue','diotsete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(378,'178','NNN1',form,nori,['ni','hi','hi','hura','gu','zu','zuek','haiek'][index] as Person,
    index===1?'toka':index===2?'noka':'neutral'));

for(const [nori,forms] of [['ni',['hiostan','ziostan','zeniostan','zeniostaten','ziostaten']],
  ['gu',['hioskun','zioskun','zenioskun','zenioskuten','zioskuten']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(380,'179','NNN2',form,nori,['hi','hura','zu','zuek','haiek'][index] as Person,index===0?'hika':'neutral'));
for(const [nork,toka,noka] of [['ni','niosan','niosnan'],['hura','ziosan','ziosnan'],['gu','geniosan','geniosnan'],
  ['haiek','ziosaten','ziosnaten']] as [Person,string,string][])pair(380,'179','NNN2',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['niotsun','ziotsun','geniotsun','ziotsuten']],
  ['zuek',['niotsuen','ziotsuen','geniotsuen','ziotsueten']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(380,'179','NNN2',form,nori,['ni','hura','gu','haiek'][index] as Person));
for(const [nori,forms] of [['hura',['niotson','hiotson','ziotson','geniotson','zeniotson','zeniotsoten','ziotsoten']],
  ['haiek',['niotsen','hiotsen','ziotsen','geniotsen','zeniotsen','zeniotseten','ziotseten']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(380,'179','NNN2',form,nori,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));

pair(382,'180','NNN9','esadak','esadan','ni','hi');for(const [nork,form] of
  [['hura','biost'],['zu','esadazu'],['zuek','esadazue'],['haiek','biostate']] as [Person,string][])add(382,'180','NNN9',form,'ni',nork);
pair(382,'180','NNN9','esaguk','esagun','gu','hi');for(const [nork,form] of
  [['hura','biosku'],['zu','esaiozu'],['zuek','esaiozue'],['haiek','biotsote']] as [Person,string][])add(382,'180','NNN9',form,'gu',nork);
pair(382,'180','NNN9','biosk','biosna','hi','hura');pair(382,'180','NNN9','biosate','biosnate','hi','haiek');
for(const [nori,forms] of [['zu',['biotsu','biotsute']],['zuek',['biotsue','biotsuete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(382,'180','NNN9',form,nori,index?'haiek':'hura'));
for(const [nori,forms] of [['hura',['esaiok','esaion','biotso','esaiozu','esaiozue','biotsote']],
  ['haiek',['esaiek','esaien','biotse','esaiezu','esaiezue','biotsete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(382,'180','NNN9',form,nori,['hi','hi','hura','zu','zuek','haiek'][index] as Person,
    index===0?'toka':index===1?'noka':'neutral'));

export const esanNnnPrinted=printed;
export const esanStemAlternatives=printed.filter(reading=>reading.lemma==='io'&&reading.nori==='hura')
  .map(reading=>({...reading,form:reading.form.replace('otso','otsa'),evidence:'stem-alternative' as const}));
export const esan1977Corrections:EsanNnnReading[]=[
  {page:41,printed:'824',series:'NNN9',lemma:'esan',form:'esaguzu',nor:'hura',nori:'gu',nork:'zu',treatment:'neutral',mood:'imperative',tense:'present',evidence:'original1977'},
  {page:41,printed:'824',series:'NNN9',lemma:'esan',form:'esaguzue',nor:'hura',nori:'gu',nork:'zuek',treatment:'neutral',mood:'imperative',tense:'present',evidence:'original1977'},
  {page:41,printed:'824',series:'NNN9',lemma:'esan',form:'bioskute',nor:'hura',nori:'gu',nork:'haiek',treatment:'neutral',mood:'imperative',tense:'present',evidence:'original1977'},
];
