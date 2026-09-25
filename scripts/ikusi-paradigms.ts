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
  readings.push({page,printed,heading:'IKUSI',lemma:'ikusi',series,form,nor,nork,treatment,
    interpretations:[...interpretations]});
}
function current(page:number,printed:string,series:NorNorkReading['series'],nor:Person,forms:string[]){
  forms.forEach((form,index)=>add(page,printed,series,form,nor,['ni','hi','hi','hura','gu','zu','zuek','haiek'][index] as Person,
    index===1?'toka':index===2?'noka':'neutral'));
}
current(306,'142','NN1','hura',['dakusat','dakusak','dakusan','dakusa','dakusagu','dakusazu','dakusazue','dakusate']);
current(306,'142','NN1','haiek',['dakuskit','dakuskik','dakuskin','dakuski','dakuskigu','dakuskizu','dakuskizue','dakuskite']);
for(const [series,nor,forms] of [
  ['NN2','hura',['nekusan','hekusan','zekusan','genekusan','zenekusan','zenekusaten','zekusaten']],
  ['NN2','haiek',['nekuskien','hekuskien','zekuskien','genekuskien','zenekuskien','zenekuskiten','zekuskiten']],
  ['NN3','hura',['banekusa','bahekusa','balekusa','bagenekusa','bazenekusa','bazenekusate','balekusate']],
  ['NN3','haiek',['banekuski','bahekuski','balekuski','bagenekuski','bazenekuski','bazenekuskite','balekuskite']],
  ['NN4','hura',['nekuske','hekuske','lekuske','genekuske','zenekuske','zenekuskete','lekuskete']],
  ['NN4','haiek',['nekusazke','hekusazke','lekusazke','genekusazke','zenekusazke','zenekusazkete','lekusazkete']],
] as [NorNorkReading['series'],Person,string[]][])forms.forEach((form,index)=>add(series==='NN2'?306:308,
  series==='NN2'?'142':'143',series,form,nor,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));
for(const [nork,form,treatment] of [['hi','ikusak','toka'],['hi','ikusan','noka'],['hura','bekusa','neutral'],
  ['zu','ikusazu','neutral'],['zuek','ikusazue','neutral'],['haiek','bekusate','neutral']] as [Person,string,Treatment][])
  add(308,'143','NN9',form,'hura',nork,treatment);
add(308,'143','NN9','bekuski','haiek','hura');add(308,'143','NN9','bekuskite','haiek','haiek');
export const ikusiReadings=readings;

const shortForms=['dakust','dakusk','dakusna','dakus','dakusku','dakutsu','dakutsue','dakuste'];
export const ikusiShortReadings=readings.filter(reading=>reading.series==='NN1'&&reading.nor==='hura')
  .map((reading,index)=>({...reading,form:shortForms[index]}));

export const ikusiDativeExamples:Pick<Analysis,'form'|'nor'|'nori'|'nork'>[]=[
  {form:'dekust',nor:'hura',nori:'ni',nork:'ni'},
  {form:'dekutsut',nor:'hura',nori:'zu',nork:'ni'},
  {form:'dekuskigute',nor:'haiek',nori:'gu',nork:'haiek'},
];
