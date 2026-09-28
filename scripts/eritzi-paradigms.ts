import type { Mood, Person, Tense, Treatment } from '../packages/shared/src/index.js';

export type EritziReading={page:number;printed:string;series:'NNN1'|'NNN2'|'NNN3'|'NNN4'|'NNN9';form:string;
  nor:Person;nori:Person;nork:Person;treatment:Treatment;interpretations:{mood:Mood;tense:Tense}[];derived:boolean};
const printed:EritziReading[]=[];
function add(page:number,printedPage:string,series:EritziReading['series'],form:string,nori:Person,nork:Person,
  treatment:Treatment='neutral'){
  const interpretations=series==='NNN1'?[{mood:'indicative',tense:'present'}] as const:
    series==='NNN2'?[{mood:'indicative',tense:'past'}] as const:
    series==='NNN3'?[{mood:'conditional',tense:'hypothetical'}] as const:
    series==='NNN4'?[{mood:'consequence',tense:'present'},{mood:'potential',tense:'hypothetical'}] as const:
    [{mood:'imperative',tense:'present'}] as const;
  printed.push({page,printed:printedPage,series,form,nor:'hura',nori,nork,treatment,
    interpretations:[...interpretations],derived:false});
}
function pair(page:number,printedPage:string,series:EritziReading['series'],toka:string,noka:string,nori:Person,nork:Person){
  add(page,printedPage,series,toka,nori,nork,'toka');add(page,printedPage,series,noka,nori,nork,'noka');
}

pair(364,'171','NNN1','deriztak','deriztan','ni','hi');for(const [nork,form] of
  [['hura','derizt'],['zu','deriztazu'],['zuek','deriztazue'],['haiek','deriztate']] as [Person,string][])add(364,'171','NNN1',form,'ni',nork);
pair(364,'171','NNN1','derizkuk','derizkun','gu','hi');for(const [nork,form] of
  [['hura','derizku'],['zu','derizkuzu'],['zuek','derizkuzue'],['haiek','derizkute']] as [Person,string][])add(364,'171','NNN1',form,'gu',nork);
for(const [nork,toka,noka] of [['ni','derizat','deriznat'],['hura','derizk','derizna'],['gu','derizagu','deriznagu'],
  ['haiek','derizate','deriznate']] as [Person,string,string][])pair(364,'171','NNN1',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['deritzut','deritzu','deritzugu','deritzute']],
  ['zuek',['deritzuet','deritzue','deritzuegu','deritzuete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(364,'171','NNN1',form,nori,['ni','hura','gu','haiek'][index] as Person));
for(const [nori,forms] of [['hura',['deritzot','deritzok','deritzon','deritzo','deritzogu','deritzozu','deritzozue','deritzote']],
  ['haiek',['deritzet','deritzek','deritzen','deritze','deritzegu','deritzezu','deritzezue','deritzete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(364,'171','NNN1',form,nori,['ni','hi','hi','hura','gu','zu','zuek','haiek'][index] as Person,
    index===1?'toka':index===2?'noka':'neutral'));

for(const [nori,forms] of [['ni',['heriztan','zeriztan','zeneriztan','zeneriztaten','zeriztaten']],
  ['gu',['herizkun','zerizkun','zenerizkun','zenerizkuten','zerizkuten']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(366,'172','NNN2',form,nori,['hi','hura','zu','zuek','haiek'][index] as Person,index===0?'hika':'neutral'));
for(const [nork,toka,noka] of [['ni','nerizan','neriznan'],['hura','zerizan','zeriznan'],['gu','generizan','generiznan'],
  ['haiek','zerizaten','zeriznaten']] as [Person,string,string][])pair(366,'172','NNN2',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['neritzun','zeritzun','generitzun','zeritzuten']],
  ['zuek',['neritzuen','zeritzuen','generitzuen','zeritzueten']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(366,'172','NNN2',form,nori,['ni','hura','gu','haiek'][index] as Person));
for(const [nori,forms] of [['hura',['neritzon','heritzon','zeritzon','generitzon','zeneritzon','zeneritzoten','zeritzoten']],
  ['haiek',['neritzen','heritzen','zeritzen','generitzen','zeneritzen','zeneritzeten','zeritzeten']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(366,'172','NNN2',form,nori,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));

for(const [nori,forms] of [['ni',['baherizt','balerizt','bazenerizt','bazeneriztate','baleriztate']],
  ['gu',['baherizku','balerizku','bazenerizku','bazenerizkute','balerizkute']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(368,'173','NNN3',form,nori,['hi','hura','zu','zuek','haiek'][index] as Person,index===0?'hika':'neutral'));
for(const [nork,toka,noka] of [['ni','banerizk','banerizna'],['hura','balerizk','balerizna'],['gu','bagenerizk','bagenerizna'],
  ['haiek','balerizate','baleriznate']] as [Person,string,string][])pair(368,'173','NNN3',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['baneritzu','baleritzu','bageneritzu','baleritzute']],
  ['zuek',['baneritzue','baleritzue','bageneritzue','baleritzuete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(368,'173','NNN3',form,nori,['ni','hura','gu','haiek'][index] as Person));
for(const [nori,forms] of [['hura',['baneritzo','baheritzo','baleritzo','bageneritzo','bazeneritzo','bazeneritzote','baleritzote']],
  ['haiek',['baneritze','baheritze','baleritze','bageneritze','bazeneritze','bazeneritzete','baleritzete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(368,'173','NNN3',form,nori,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));

for(const [nori,forms] of [['ni',['heriztake','leriztake','zeneriztake','zeneriztakete','leriztakete']],
  ['gu',['herizkuke','lerizkuke','zenerizkuke','zenerizkukete','lerizkukete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(370,'174','NNN4',form,nori,['hi','hura','zu','zuek','haiek'][index] as Person,index===0?'hika':'neutral'));
for(const [nork,toka,noka] of [['ni','nerizake','neriznake'],['hura','lerizake','leriznake'],['gu','generizake','generiznake'],
  ['haiek','lerizakete','leriznakete']] as [Person,string,string][])pair(370,'174','NNN4',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['neritzuke','leritzuke','generitzuke','leritzukete']],
  ['zuek',['neritzueke','leritzueke','generitzueke','leritzuekete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(370,'174','NNN4',form,nori,['ni','hura','gu','haiek'][index] as Person));
for(const [nori,forms] of [['hura',['neritzoke','heritzoke','leritzoke','generitzoke','zeneritzoke','zeneritzokete','leritzokete']],
  ['haiek',['neritzeke','heritzeke','leritzeke','generitzeke','zeneritzeke','zeneritzekete','leritzekete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(370,'174','NNN4',form,nori,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));

for(const [nori,forms] of [['ni',['berizt','beriztate']],['gu',['berizku','berizkute']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(372,'175','NNN9',form,nori,index?'haiek':'hura'));
pair(372,'175','NNN9','berizk','berizna','hi','hura');pair(372,'175','NNN9','berizate','beriznate','hi','haiek');
for(const [nori,forms] of [['zu',['beritzu','beritzute']],['zuek',['beritzue','beritzuete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(372,'175','NNN9',form,nori,index?'haiek':'hura'));
for(const [nori,forms] of [['hura',['eritziok','eritzion','beritzo','eritziozu','eritziozue','beritzote']],
  ['haiek',['eritziek','eritzien','beritze','eritziezu','eritziezue','beritzete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(372,'175','NNN9',form,nori,['hi','hi','hura','zu','zuek','haiek'][index] as Person,
    index===0?'toka':index===1?'noka':'neutral'));

function alternative(form:string,nori:Person){
  if(nori==='hura')return form.replace('itzo','itza');
  return form.replace('itze','izte');
}
export const eritziPrinted=printed;
export const eritziAlternatives=printed.filter(reading=>(reading.nori==='hura'||reading.nori==='haiek')&&
  (reading.series!=='NNN9'||reading.form.startsWith('beritzo')||reading.form.startsWith('beritze')))
  .map(reading=>({...reading,form:alternative(reading.form,reading.nori),derived:true}));
