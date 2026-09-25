import type { Mood, Person, Tense, Treatment } from '../packages/shared/src/index.js';
import type { NorNorkReading } from './nor-nork-paradigms.js';

const current:NorNorkReading[]=[];
function add(page:number,printed:string,series:NorNorkReading['series'],form:string,nor:Person,nork:Person,
  treatment:Treatment='neutral'){
  const interpretations=series==='NN1'?[{mood:'indicative',tense:'present'}] as const:
    series==='NN2'?[{mood:'indicative',tense:'past'}] as const:
    series==='NN3'?[{mood:'conditional',tense:'hypothetical'}] as const:
    series==='NN4'?[{mood:'consequence',tense:'present'},{mood:'potential',tense:'hypothetical'}] as const:
    [{mood:'imperative',tense:'present'}] as const;
  current.push({page,printed,heading:'EGIN',lemma:'egin',series,form,nor,nork,treatment,
    interpretations:[...interpretations]});
}
function fullPresent(nor:Person,forms:string[]){
  forms.forEach((form,index)=>add(292,'135','NN1',form,nor,['ni','hi','hi','hura','gu','zu','zuek','haiek'][index] as Person,
    index===1?'toka':index===2?'noka':'neutral'));
}
fullPresent('hura',['dagit','dagik','dagin','dagi','dagigu','dagizu','dagizue','dagite']);
fullPresent('haiek',['dagitzat','dagitzak','dagitzan','dagitza','dagitzagu','dagitzazu','dagitzazue','dagitzate']);
for(const [series,nor,forms] of [
  ['NN2','hura',['negien','hegien','zegien','genegien','zenegien','zenegiten','zegiten']],
  ['NN2','haiek',['negitzan','hegitzan','zegitzan','genegitzan','zenegitzan','zenegitzaten','zegitzaten']],
  ['NN3','hura',['banegi','bahegi','balegi','bagenegi','bazenegi','bazenegite','balegite']],
  ['NN3','haiek',['banegitza','bahegitza','balegitza','bagenegitza','bazenegitza','bazenegitzate','balegitzate']],
  ['NN4','hura',['negike','hegike','legike','genegike','zenegike','zenegikete','legikete']],
  ['NN4','haiek',['negitzake','hegitzake','legitzake','genegitzake','zenegitzake','zenegitzakete','legitzakete']],
] as [NorNorkReading['series'],Person,string[]][]) forms.forEach((form,index)=>
  add(series==='NN2'?292:294,series==='NN2'?'135':'136',series,form,nor,
    ['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));
for(const [nor,forms] of [
  ['hura',['egik','egin','begi','egizu','egizue','begite']],
  ['haiek',['egitzak','egitzan','begitza','egitzazu','egitzazue','begitza']],
] as [Person,string[]][]) forms.forEach((form,index)=>add(294,'136','NN9',form,nor,
  ['hi','hi','hura','zu','zuek','haiek'][index] as Person,index===0?'toka':index===1?'noka':'neutral'));

export const eginNorNorkReadings=current;

const original:NorNorkReading[]=[];
function originalAdd(form:string,nork:Person){
  original.push({page:46,printed:'829',heading:'EGIN',lemma:'egin',series:'NN4',form,nor:'haiek',nork,
    treatment:nork==='hi'?'hika':'neutral',interpretations:[{mood:'consequence',tense:'present'},
      {mood:'potential',tense:'hypothetical'}]});
}
['negizke','hegizke','legizke','genegizke','zenegizke','zenegizkete','legizkete'].forEach((form,index)=>
  originalAdd(form,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person));
original.push({page:46,printed:'829',heading:'EGIN',lemma:'egin',series:'NN9',form:'begitzate',nor:'haiek',nork:'haiek',
  treatment:'neutral',interpretations:[{mood:'imperative',tense:'present'}]});
export const egin1977Readings=original;

export type EginNnnReading={page:number;printed:string;series:'NNN1'|'NNN2'|'NNN3'|'NNN4'|'NNN7'|'NNN9';
  form:string;nor:Person;nori:Person;nork:Person;treatment:Treatment;
  interpretations:{mood:Mood;tense:Tense}[];evidence:'printed'|'ellipsis'|'plural-rule'};
const nnn:EginNnnReading[]=[];
function nnnAdd(page:number,printed:string,series:EginNnnReading['series'],form:string,nori:Person,nork:Person,
  treatment:Treatment='neutral',evidence:EginNnnReading['evidence']='printed'){
  const interpretations=series==='NNN1'?[{mood:'indicative',tense:'present'}] as const:
    series==='NNN2'?[{mood:'indicative',tense:'past'}] as const:
    series==='NNN3'?[{mood:'conditional',tense:'hypothetical'}] as const:
    series==='NNN4'?[{mood:'consequence',tense:'present'},{mood:'potential',tense:'hypothetical'}] as const:
    series==='NNN7'?[{mood:'subjunctive',tense:'present'}] as const:
    [{mood:'imperative',tense:'present'}] as const;
  nnn.push({page,printed,series,form,nor:'hura',nori,nork,treatment,interpretations:[...interpretations],evidence});
}
function nnnPair(page:number,printed:string,series:EginNnnReading['series'],toka:string,noka:string,nori:Person,
  nork:Person,evidence:EginNnnReading['evidence']='printed'){
  nnnAdd(page,printed,series,toka,nori,nork,'toka',evidence);nnnAdd(page,printed,series,noka,nori,nork,'noka',evidence);
}
function addPresent(){
  nnnPair(296,'137','NNN1','degidak','degidan','ni','hi');
  for(const [nork,form] of [['hura','degit'],['zu','degidazu'],['zuek','degidazue'],['haiek','degidate']] as [Person,string][])
    nnnAdd(296,'137','NNN1',form,'ni',nork);
  nnnPair(296,'137','NNN1','degiguk','degigun','gu','hi');
  for(const [nork,form] of [['hura','degigu'],['zu','degiguzu'],['zuek','degiguzue'],['haiek','degigute']] as [Person,string][])
    nnnAdd(296,'137','NNN1',form,'gu',nork);
  for(const [nork,toka,noka] of [['ni','degiat','deginat'],['hura','degik','degin'],['gu','degiagu','deginagu'],
    ['haiek','degiate','deginate']] as [Person,string,string][])nnnPair(296,'137','NNN1',toka,noka,'hi',nork);
  for(const [nori,forms] of [['zu',['degizut','degizu','degizugu','degizute']],
    ['zuek',['degizuet','degizue','degizuegu','degizuete']]] as [Person,string[]][])
    forms.forEach((form,index)=>nnnAdd(296,'137','NNN1',form,nori,['ni','hura','gu','haiek'][index] as Person));
  for(const [nori,forms] of [['hura',['degiot','degiok','degion','degio','degiogu','degiozu','degiozue','degiote']],
    ['haiek',['degiet','degiek','degien','degie','degiegu','degiezu','degiezue','degiete']]] as [Person,string[]][])
    forms.forEach((form,index)=>nnnAdd(296,'137','NNN1',form,nori,['ni','hi','hi','hura','gu','zu','zuek','haiek'][index] as Person,
      index===1?'toka':index===2?'noka':'neutral'));
}
addPresent();
for(const [nori,forms] of [['ni',['hegidan','zegidan','zenegidan','zenegidaten','zegidaten']],
  ['gu',['hegigun','zegigun','zenegigun','zenegiguten','zegiguten']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(298,'138','NNN2',form,nori,['hi','hura','zu','zuek','haiek'][index] as Person,index===0?'hika':'neutral'));
for(const [nork,toka,noka] of [['ni','negian','neginan'],['hura','zegian','zeginan'],['gu','genegian','geneginan'],
  ['haiek','zegiaten','zeginaten']] as [Person,string,string][])nnnPair(298,'138','NNN2',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['negizun','zegizun','genegizun','zegizuten']],
  ['zuek',['negizuen','zegizuen','genegizuen','zegizueten']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(298,'138','NNN2',form,nori,['ni','hura','gu','haiek'][index] as Person));
for(const [nori,forms] of [['hura',['negion','hegion','zegion','genegion','zenegion','zenegioten','zegioten']],
  ['haiek',['negien','hegien','zegien','genegien','zenegien','zenegieten','zegieten']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(298,'138','NNN2',form,nori,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));

for(const [nori,forms] of [['ni',['bahegit','balegit','bazenegit','bazenegidate','balegidate']],
  ['gu',['bahegigu','balegigu','bazenegigu','bazenegigute','balegigute']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(300,'139','NNN3',form,nori,['hi','hura','zu','zuek','haiek'][index] as Person,index===0?'hika':'neutral'));
for(const [nork,toka,noka] of [['ni','banegik','banegin'],['hura','balegik','balegin'],['gu','bagenegik','bagenegin'],
  ['haiek','balegiate','baleginate']] as [Person,string,string][])nnnPair(300,'139','NNN3',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['banegizu','balegizu','bagenegizu','balegizute']],
  ['zuek',['banegizue','balegizue','bagenegizue','balegizuete']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(300,'139','NNN3',form,nori,['ni','hura','gu','haiek'][index] as Person));
for(const [nori,forms] of [['hura',['banegio','bahegio','balegio','bagenegio','bazenegio','bazenegiote','balegiote']],
  ['haiek',['banegie','bahegie','balegie','bagenegie','bazenegie','bazenegiete','balegiete']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(300,'139','NNN3',form,nori,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));

for(const [nori,forms] of [['ni',['hegidake','legidake','zenegidake','zenegidakete','legidakete']],
  ['gu',['hegiguke','legiguke','zenegiguke','zenegigukete','legigukete']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(302,'140','NNN4',form,nori,['hi','hura','zu','zuek','haiek'][index] as Person,index===0?'hika':'neutral'));
for(const [nork,toka,noka] of [['ni','negiake','neginake'],['hura','legiake','leginake'],['gu','genegiake','geneginake'],
  ['haiek','legiakete','leginakete']] as [Person,string,string][])nnnPair(302,'140','NNN4',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['negizuke','legizuke','genegizuke','legizukete']],
  ['zuek',['negizueke','legizueke','genegizueke','legizuekete']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(302,'140','NNN4',form,nori,['ni','hura','gu','haiek'][index] as Person));
for(const [nori,forms] of [['hura',['negioke','hegioke','legioke','genegioke','zenegioke','zenegiokete','legiokete']],
  ['haiek',['negieke','hegieke','legieke','genegieke','zenegieke','zenegiekete','legiekete']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(302,'140','NNN4',form,nori,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));

nnnPair(304,'141','NNN7','degidaan','degidanan','ni','hi');
for(const [nork,form] of [['hura','degidan'],['zu','degidazun'],['zuek','degidazuen'],['haiek','degidaten']] as [Person,string][])
  nnnAdd(304,'141','NNN7',form,'ni',nork);
nnnPair(304,'141','NNN7','degiguan','degigunan','gu','hi');
for(const [nork,form] of [['hura','degigun'],['zu','degiguzun'],['zuek','degiguzuen'],['haiek','degiguten']] as [Person,string][])
  nnnAdd(304,'141','NNN7',form,'gu',nork);
for(const [nork,toka,noka] of [['ni','degiadan','deginadan'],['hura','degian','deginan'],['gu','degiagun','deginagun'],
  ['haiek','degiaten','deginaten']] as [Person,string,string][])nnnPair(304,'141','NNN7',toka,noka,'hi',nork,'ellipsis');
for(const [nori,forms] of [['zu',['degizudan','degizun','degizugun','degizuten']],
  ['zuek',['degizuedan','degizuen','degizuegun','degizueten']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(304,'141','NNN7',form,nori,['ni','hura','gu','haiek'][index] as Person,'neutral','ellipsis'));
for(const [nori,forms] of [['hura',['degiodan','degioan','degionan','degion','degiogun','degiozun','degiozuen','degioten']],
  ['haiek',['degiedan','degiean','degienan','degien','degiegun','degiezun','degiezuen','degieten']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(304,'141','NNN7',form,nori,['ni','hi','hi','hura','gu','zu','zuek','haiek'][index] as Person,
    index===1?'toka':index===2?'noka':'neutral','ellipsis'));

nnnPair(304,'141','NNN9','egidak','egidan','ni','hi');for(const [nork,form] of
  [['hura','begit'],['zu','egidazu'],['zuek','egidazue'],['haiek','begidate']] as [Person,string][])
  nnnAdd(304,'141','NNN9',form,'ni',nork);
nnnPair(304,'141','NNN9','egiguk','egigun','gu','hi');for(const [nork,form] of
  [['hura','begigu'],['zu','egiguzu'],['zuek','egiguzue'],['haiek','begigute']] as [Person,string][])
  nnnAdd(304,'141','NNN9',form,'gu',nork);
nnnPair(304,'141','NNN9','begik','begin','hi','hura');nnnPair(304,'141','NNN9','begiate','beginate','hi','haiek');
for(const [nori,forms] of [['zu',['begizu','begizute']],['zuek',['begizue','begizuete']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(304,'141','NNN9',form,nori,index?'haiek':'hura'));
for(const [nori,forms] of [['hura',['egiok','egion','begio','egiozu','egiozue','begiote']],
  ['haiek',['egiek','egien','begie','egiezu','egiezue','bebiete']]] as [Person,string[]][])
  forms.forEach((form,index)=>nnnAdd(304,'141','NNN9',form,nori,['hi','hi','hura','zu','zuek','haiek'][index] as Person,
    index===0?'toka':index===1?'noka':'neutral'));

function pluralize(form:string){return form==='bebiete'?'begizkiete':form.replace('gi','gizki');}
const plural=nnn.map(reading=>({...reading,form:pluralize(reading.form),nor:'haiek' as Person,evidence:'plural-rule' as const}));
export const eginNnnPrinted=nnn.filter(reading=>reading.evidence==='printed');
export const eginNnnEllipsis=nnn.filter(reading=>reading.evidence==='ellipsis');
export const eginNnnPlural=plural;

export const egin1977NnnReading:EginNnnReading={page:47,printed:'830',series:'NNN9',form:'begiete',nor:'hura',
  nori:'haiek',nork:'haiek',treatment:'neutral',interpretations:[{mood:'imperative',tense:'present'}],evidence:'printed'};
