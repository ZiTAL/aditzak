import type { Person, Treatment } from '../packages/shared/src/index.js';
import type { NorNorkReading } from './nor-nork-paradigms.js';

const readings:NorNorkReading[]=[];
const interpretations={NN1:[{mood:'indicative',tense:'present'}],NN2:[{mood:'indicative',tense:'past'}],
  NN3:[{mood:'conditional',tense:'hypothetical'}],
  NN4:[{mood:'consequence',tense:'present'},{mood:'potential',tense:'hypothetical'}],
  NN9:[{mood:'imperative',tense:'present'}]} as const;
function add(page:number,printed:string,series:NorNorkReading['series'],form:string,nor:Person,nork:Person,
  treatment:Treatment='neutral'){
  readings.push({page,printed,heading:'EZAGUTU',lemma:'ezagutu',series,form,nor,nork,treatment,
    interpretations:[...interpretations[series]]});
}
function pair(page:number,printed:string,series:NorNorkReading['series'],toka:string,noka:string,nor:Person){
  add(page,printed,series,toka,nor,'hi','toka');add(page,printed,series,noka,nor,'hi','noka');
}
function regular(page:number,printed:string,series:'NN1'|'NN2'|'NN3'|'NN4',nor:Person,stem:string,
  shape:'outer'|'middle'){
  if(series==='NN2'){
    if(shape==='outer'){pair(page,printed,series,stem+'an',stem+'nan',nor);for(const [nork,suffix] of
      [['hura','en'],['zu','zun'],['zuek','zuen'],['haiek','ten']] as [Person,string][])add(page,printed,series,stem+suffix,nor,nork);}
    else for(const [nork,suffix] of [['ni','dan'],['hura','en'],['gu','gun'],['haiek','ten']] as [Person,string][])
      add(page,printed,series,stem+suffix,nor,nork);
  }else{
    if(shape==='outer'){pair(page,printed,series,stem+'k',stem+'n',nor);for(const [nork,suffix] of
      [['hura',''],['zu',series==='NN4'?'zu':'zu'],['zuek',series==='NN4'?'zue':'zue'],['haiek','te']] as [Person,string][])
      add(page,printed,series,stem+suffix,nor,nork);}
    else for(const [nork,suffix] of [['ni','t'],['hura',''],['gu','gu'],['haiek','te']] as [Person,string][])
      add(page,printed,series,stem+suffix,nor,nork);
  }
}
function fullPresent(page:number,printed:string,series:'NN1',nor:Person,stem:string){
  add(page,printed,series,stem+'t',nor,'ni');pair(page,printed,series,stem+'k',stem+'n',nor);
  for(const [nork,suffix] of [['hura',''],['gu','gu'],['zu','zu'],['zuek','zue'],['haiek','te']] as [Person,string][])
    add(page,printed,series,stem+suffix,nor,nork);
}
function specialZuek(page:number,printed:string,series:'NN1'|'NN2'|'NN3'|'NN4',forms:string[]){
  forms.forEach((form,index)=>add(page,printed,series,form,'zuek',['ni','hura','gu','haiek','haiek'][index] as Person));
}

regular(284,'131','NN1','ni','nazagu','outer');regular(284,'131','NN1','gu','gazaguzki','outer');
regular(284,'131','NN1','hi','hazagu','middle');regular(284,'131','NN1','zu','zazaguzki','middle');
specialZuek(284,'131','NN1',['zazaguztet','zazaguzte','zazaguztegu','zazaguzte','zazaguztete']);
fullPresent(284,'131','NN1','hura','dazagu');fullPresent(284,'131','NN1','haiek','dazaguzki');

regular(286,'132','NN2','ni','nindezagu','outer');regular(286,'132','NN2','gu','gindezaguzki','outer');
regular(286,'132','NN2','hi','hindezagu','middle');regular(286,'132','NN2','zu','zindezaguzki','middle');
specialZuek(286,'132','NN2',['zindezaguztedan','zindezaguzten','zindezaguztegun','zindezaguzten','zindezaguzteten']);
for(const [nor,forms] of [['hura',['nezaguen','hezaguen','zezaguen','genezaguen','zenezaguen','zenezaguten','zezaguten']],
  ['haiek',['nezaguzkien','hezaguzkien','zezaguzkien','genezaguzkien','zenezaguzkien','zenezaguzkiten','zezaguzkiten']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(286,'132','NN2',form,nor,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));

regular(288,'133','NN3','ni','banindezagu','outer');regular(288,'133','NN3','gu','bagindezaguzki','outer');
regular(288,'133','NN3','hi','bahindezagu','middle');regular(288,'133','NN3','zu','bazindezaguzki','middle');
specialZuek(288,'133','NN3',['bazindezaguztet','bazindezaguzte','bazindezaguztegu','bazindezaguzte','bazindezaguztete']);
for(const [nor,forms] of [['hura',['banezagu','bahezagu','balezagu','bagenezagu','bazenezagu','bazenezagute','balezagute']],
  ['haiek',['banezaguzki','bahezaguzki','balezaguzki','bagenezaguzki','bazenezaguzki','bazenezaguzkite','balezaguzkite']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(288,'133','NN3',form,nor,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));

regular(290,'134','NN4','ni','nindezaguke','outer');regular(290,'134','NN4','gu','gindezaguzke','outer');
regular(290,'134','NN4','hi','hindezaguke','middle');regular(290,'134','NN4','zu','zindezaguzke','middle');
specialZuek(290,'134','NN4',['zindezaguzketet','zindezaguzkete','zindezaguzketegu','zindezaguzkete','zindezaguzketete']);
for(const [nor,forms] of [['hura',['nezaguke','hezaguke','lezaguke','genezaguke','zenezaguke','zenezagukete','lezagukete']],
  ['haiek',['nezaguzke','hezaguzke','lezaguzke','genezaguzke','zenezaguzke','zenezaguzkete','lezaguzkete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(290,'134','NN4',form,nor,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));
pair(290,'134','NN9','ezaguk','ezagun','hura');
for(const [nork,form] of [['hura','bezagu'],['zu','ezaguzu'],['zuek','ezaguzue'],['haiek','bezagute']] as [Person,string][])
  add(290,'134','NN9',form,'hura',nork);
add(290,'134','NN9','bezaguzki','haiek','hura');add(290,'134','NN9','bezaguzkite','haiek','haiek');

export const ezagutuReadings=readings;
export const ezagutuGlessReadings=readings.map(reading=>({...reading,form:reading.form.replace('zagu','zau')}));
