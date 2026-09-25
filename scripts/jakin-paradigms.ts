import type { Analysis, Person, Treatment } from '../packages/shared/src/index.js';
import type { NorNorkReading } from './nor-nork-paradigms.js';

const readings:NorNorkReading[]=[];
function add(page:number,printed:string,series:NorNorkReading['series'],form:string,nor:Person,nork:Person,
  treatment:Treatment='neutral'){
  const interpretations=series==='NN1'?[{mood:'indicative',tense:'present'}] as const:
    series==='NN2'?[{mood:'indicative',tense:'past'}] as const:
    series==='NN3'?[{mood:'conditional',tense:'hypothetical'}] as const:
    series==='NN4'?[{mood:'consequence',tense:'present'},{mood:'potential',tense:'hypothetical'}] as const:
    [{mood:'imperative',tense:'present'}] as const;
  readings.push({page,printed,heading:'JAKIN',lemma:'jakin',series,form,nor,nork,treatment,
    interpretations:[...interpretations]});
}
function full(page:number,printed:string,series:NorNorkReading['series'],nor:Person,forms:string[]){
  forms.forEach((form,index)=>add(page,printed,series,form,nor,['ni','hi','hi','hura','gu','zu','zuek','haiek'][index] as Person,
    index===1?'toka':index===2?'noka':'neutral'));
}
full(310,'144','NN1','hura',['dakit','dakik','dakin','daki','dakigu','dakizu','dakizue','dakite']);
full(310,'144','NN1','haiek',['dakizkit','dakizkik','dakizkin','dakizki','dakizkigu','dakizkizu','dakizkizue','dakizkite']);
for(const [series,nor,forms] of [
  ['NN2','hura',['nekien','hekien','zekien','genekien','zenekien','zenekiten','zekiten']],
  ['NN2','haiek',['nekizkien','hekizkien','zekizkien','genekizkien','zenekizkien','zenekizkiten','zekizkiten']],
  ['NN3','hura',['baneki','baheki','baleki','bageneki','bazeneki','bazenekite','balekite']],
  ['NN3','haiek',['banekizki','bahekizki','balekizki','bagenekizki','bazenekizki','bazenekizkite','balekizkite']],
  ['NN4','hura',['nekike','hekike','lekike','genekike','zenekike','zenekikete','lekikete']],
  ['NN4','haiek',['nekizke','hekizke','lekizke','genekizke','zenekizke','zenekizkete','lekizkete']],
] as [NorNorkReading['series'],Person,string[]][])forms.forEach((form,index)=>add(series==='NN2'?310:312,
  series==='NN2'?'144':'145',series,form,nor,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));
for(const [nor,forms] of [['hura',['jakik','jakin','beki','jakizu','jakizue','bekite']],
  ['haiek',['jakitzak','jakitzan','bekizki','jakitzazu','jakitzazue','bekizkite']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(312,'145','NN9',form,nor,['hi','hi','hura','zu','zuek','haiek'][index] as Person,
    index===0?'toka':index===1?'noka':'neutral'));
export const jakinReadings=readings;

export const jakinDativeExamples:Pick<Analysis,'form'|'nor'|'nori'|'nork'>[]=[
  {form:'dekit',nor:'hura',nori:'ni',nork:'hura'},
  {form:'dekizu',nor:'hura',nori:'zu',nork:'hura'},
  {form:'dekio',nor:'hura',nori:'hura',nork:'hura'},
];
