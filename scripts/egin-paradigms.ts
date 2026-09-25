import type { Person, Treatment } from '../packages/shared/src/index.js';
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
