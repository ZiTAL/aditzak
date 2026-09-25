import type { Mood, Person, Tense, Treatment } from '../packages/shared/src/index.js';

export type NorNorkReading={page:number;printed:string;heading:string;lemma:string;series:'NN1'|'NN2'|'NN3'|'NN4'|'NN9';
  form:string;nor:Person;nork:Person;treatment:Treatment;interpretations:{mood:Mood;tense:Tense}[]};
const readings:NorNorkReading[]=[];
const interpretations={NN1:[{mood:'indicative',tense:'present'}],NN2:[{mood:'indicative',tense:'past'}],
  NN3:[{mood:'conditional',tense:'hypothetical'}],
  NN4:[{mood:'consequence',tense:'present'},{mood:'potential',tense:'hypothetical'}],
  NN9:[{mood:'imperative',tense:'present'}]} as const;
function add(page:number,printed:string,series:NorNorkReading['series'],form:string,nor:Person,nork:Person,treatment:Treatment='neutral'){
  readings.push({page,printed,heading:'EDUKI',lemma:'eduki',series,form,nor,nork,treatment,interpretations:[...interpretations[series]]});
}
function pair(page:number,printed:string,series:NorNorkReading['series'],toka:string,noka:string,nor:Person){add(page,printed,series,toka,nor,'hi','toka');add(page,printed,series,noka,nor,'hi','noka');}
function standard(page:number,printed:string,series:'NN1'|'NN2'|'NN3'|'NN4',nor:Person,stem:string,shape:'outer'|'middle'|'full'){
  if(series==='NN1'||series==='NN3'){
    if(shape==='outer'){pair(page,printed,series,stem+'k',stem+'n',nor);for(const [nork,s] of [['hura',''],['zu','zu'],['zuek','zue'],['haiek','te']] as [Person,string][])add(page,printed,series,stem+s,nor,nork);}
    if(shape==='middle')for(const [nork,s] of [['ni','t'],['hura',''],['gu','gu'],['haiek','te']] as [Person,string][])add(page,printed,series,stem+s,nor,nork);
    if(shape==='full'){add(page,printed,series,stem+'t',nor,'ni');pair(page,printed,series,stem+'k',stem+'n',nor);for(const [nork,s] of [['hura',''],['gu','gu'],['zu','zu'],['zuek','zue'],['haiek','te']] as [Person,string][])add(page,printed,series,stem+s,nor,nork);}
  }else if(series==='NN2'){
    if(shape==='outer'){pair(page,printed,series,stem+'an',stem+'nan',nor);for(const [nork,s] of [['hura','n'],['zu','zun'],['zuek','zuen'],['haiek','ten']] as [Person,string][])add(page,printed,series,stem+s,nor,nork);}
    if(shape==='middle')for(const [nork,s] of [['ni','dan'],['hura','n'],['gu','gun'],['haiek','ten']] as [Person,string][])add(page,printed,series,stem+s,nor,nork);
  }else{
    if(shape==='outer'){pair(page,printed,series,stem+'k',stem+'n',nor);for(const [nork,s] of [['hura',''],['zu','zu'],['zuek','zue'],['haiek','te']] as [Person,string][])add(page,printed,series,stem+s,nor,nork);}
    if(shape==='middle')for(const [nork,s] of [['ni','t'],['hura',''],['gu','gu'],['haiek','te']] as [Person,string][])add(page,printed,series,stem+s,nor,nork);
  }
}
standard(248,'113','NN1','ni','nauka','outer');standard(248,'113','NN1','gu','gauzka','outer');
standard(248,'113','NN1','hi','hauka','middle');standard(248,'113','NN1','zu','zauzka','middle');
for(const [nork,form] of [['ni','zauzkatet'],['hura','zauzkate'],['gu','zauzkategu'],['haiek','zauzkate'],['haiek','zauzkatete']] as [Person,string][])add(248,'113','NN1',form,'zuek',nork);
standard(248,'113','NN1','hura','dauka','full');standard(248,'113','NN1','haiek','dauzka','full');

standard(250,'114','NN2','ni','ninduka','outer');standard(250,'114','NN2','gu','ginduzka','outer');
standard(250,'114','NN2','hi','hinduka','middle');standard(250,'114','NN2','zu','zinduzka','middle');
for(const [nork,form] of [['ni','zinduzkatedan'],['hura','zinduzkaten'],['gu','zinduzkategun'],['haiek','zinduzkaten'],['haiek','zinduzkateten']] as [Person,string][])add(250,'114','NN2',form,'zuek',nork);
for(const [nor,forms] of [['hura',['neukan','heukan','zeukan','geneukan','zeneukan','zeneukaten','zeukaten']],['haiek',['neuzkan','heuzkan','zeuzkan','geneuzkan','zeneuzkan','zeneuzkaten','zeuzkaten']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(250,'114','NN2',form,nor,['ni','hi','hura','gu','zu','zuek','haiek'][i] as Person,i===1?'hika':'neutral'));

standard(252,'115','NN3','ni','baninduka','outer');standard(252,'115','NN3','gu','baginduzka','outer');
standard(252,'115','NN3','hi','bahinduka','middle');standard(252,'115','NN3','zu','bazinduzka','middle');
for(const [nork,form] of [['ni','bazinduzkatet'],['hura','bazinduzkate'],['gu','bazinduzkategu'],['haiek','bazinduzkate'],['haiek','bazinduzkatete']] as [Person,string][])add(252,'115','NN3',form,'zuek',nork);
for(const [nor,forms] of [['hura',['baneuka','baheuka','baleuka','bageneuka','bazeneuka','bazeneukate','baleukate']],['haiek',['baneuzka','baheuzka','baleuzka','bageneuzka','bazeneuzka','bazeneuzkate','baleuzkate']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(252,'115','NN3',form,nor,['ni','hi','hura','gu','zu','zuek','haiek'][i] as Person,i===1?'hika':'neutral'));

standard(254,'116','NN4','ni','nindukake','outer');standard(254,'116','NN4','gu','ginduzkake','outer');
standard(254,'116','NN4','hi','hindukake','middle');standard(254,'116','NN4','zu','zinduzkake','middle');
for(const [nork,form] of [['ni','zinduzkatet'],['hura','zinduzkate'],['gu','zinduzkategu'],['haiek','zinduzkate'],['haiek','zinduzkatete']] as [Person,string][])add(254,'116','NN4',form,'zuek',nork);
for(const [nor,forms] of [['hura',['neukake','heukake','leukake','geneukake','zeneukake','zeneukakete','leukakete']],['haiek',['neuzkake','heuzkake','leuzkake','geneuzkake','zeneuzkake','zeneuzkakete','leuzkakete']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(254,'116','NN4',form,nor,['ni','hi','hura','gu','zu','zuek','haiek'][i] as Person,i===1?'hika':'neutral'));
for(const [nor,forms] of [['hura',['eukak','eukan','beuka','eukazu','eukazue','beukate']],['haiek',['euzkak','euzkan','beuzka','euzkazu','euzkazue','beuzkate']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(254,'116','NN9',form,nor,['hi','hi','hura','zu','zuek','haiek'][i] as Person,i===0?'toka':i===1?'noka':'neutral'));

export const edukiReadings=readings;

const ekarri:NorNorkReading[]=[];
function ekarriAdd(series:'NN1'|'NN9',form:string,nor:Person,nork:Person,treatment:Treatment='neutral'){
  ekarri.push({page:256,printed:'117',heading:'EKARRI',lemma:'ekarri',series,form,nor,nork,treatment,
    interpretations:[...interpretations[series]]});
}
function ekarriPair(series:'NN1'|'NN9',toka:string,noka:string,nor:Person){ekarriAdd(series,toka,nor,'hi','toka');ekarriAdd(series,noka,nor,'hi','noka');}
ekarriPair('NN1','nakark','nakarna','ni');for(const [nork,form] of [['hura','nakar'],['zu','nakarzu'],['zuek','nakarzue'],['haiek','nakarte']] as [Person,string][])ekarriAdd('NN1',form,'ni',nork);
ekarriPair('NN1','gakartzak','gakartzan','gu');for(const [nork,form] of [['hura','gakartza'],['zu','gakartzazu'],['zuek','gakartzazue'],['haiek','gakartzate']] as [Person,string][])ekarriAdd('NN1',form,'gu',nork);
for(const [nor,forms] of [['hi',['hakart','hakar','hakargu','hakarte']],['zu',['zakartzat','zakartza','zakartzagu','zakartzate']]] as [Person,string[]][])
  forms.forEach((form,i)=>ekarriAdd('NN1',form,nor,['ni','hura','gu','haiek'][i] as Person));
for(const [nork,form] of [['ni','zakarztet'],['hura','zakarzte'],['gu','zakarztegu'],['haiek','zakarzte'],['haiek','zakarztete']] as [Person,string][])ekarriAdd('NN1',form,'zuek',nork);
for(const [nor,forms,noka] of [
  ['hura',['dakart','dakark','dakar','dakargu','dakarzu','dakarzue','dakarte'],'dakarna'],
  ['haiek',['dakartzat','dakartzak','dakartza','dakartzagu','dakartzazu','dakartzazue','dakartzate'],'dakartzan'],
] as [Person,string[],string][]) {
  ekarriAdd('NN1',forms[0],nor,'ni');ekarriPair('NN1',forms[1],noka,nor);
  forms.slice(2).forEach((form,i)=>ekarriAdd('NN1',form,nor,['hura','gu','zu','zuek','haiek'][i] as Person));
}
ekarriPair('NN9','ekark','ekarna','hura');for(const [nork,form] of [['hura','bekar'],['zu','ekarzu'],['zuek','ekarzue'],['haiek','bekarte']] as [Person,string][])ekarriAdd('NN9',form,'hura',nork);
ekarriAdd('NN9','bekartza','haiek','hura');ekarriAdd('NN9','bekartzate','haiek','haiek');
export const ekarriNorNorkReadings=ekarri;

function eramanNnForm(form:string,series:'NN1'|'NN9'){
  if(series==='NN9')return form==='ekarna'?'eraman':form.replace('bekar','berama').replace('ekar','erama');
  return form.replace('nakarna','naraman').replace('nakar','narama').replace('gakartza','garamatza')
    .replace('hakar','harama').replace('zakarz','zaramaz').replace('zakartza','zaramatza')
    .replace('dakarna','daraman').replace('dakartza','daramatza').replace('dakar','darama');
}
const eraman:NorNorkReading[]=ekarri.map(r=>{
  if(r.series!=='NN1'&&r.series!=='NN9')throw new Error(`Ustekabeko EKARRI saila: ${r.series}`);
  return {...r,page:r.series==='NN1'?264:266,printed:r.series==='NN1'?'121':'122',
    heading:'ERAMAN',lemma:'eraman',form:eramanNnForm(r.form,r.series)};
});
function eramanAdd(form:string,nor:Person,nork:Person,treatment:Treatment='neutral'){
  eraman.push({page:266,printed:'122',heading:'ERAMAN',lemma:'eraman',series:'NN2',form,nor,nork,treatment,
    interpretations:[{mood:'indicative',tense:'past'}]});
}
function eramanPastPair(toka:string,noka:string,nor:Person){eramanAdd(toka,nor,'hi','toka');eramanAdd(noka,nor,'hi','noka');}
eramanPastPair('ninderamaan','ninderamanan','ni');for(const [nork,form] of [['hura','ninderaman'],['zu','ninderamazun'],['zuek','ninderamazuen'],['haiek','ninderamaten']] as [Person,string][])eramanAdd(form,'ni',nork);
eramanPastPair('ginderamatzaan','ginderamatzanan','gu');for(const [nork,form] of [['hura','ginderamatzan'],['zu','ginderamatzazun'],['zuek','ginderamatzazuen'],['haiek','ginderamatzaten']] as [Person,string][])eramanAdd(form,'gu',nork);
for(const [nor,forms] of [['hi',['hinderamadan','hinderaman','hinderamagun','hinderamaten']],['zu',['zinderamatzadan','zinderamatzan','zinderamatzagun','zinderamatzaten']]] as [Person,string[]][])
  forms.forEach((form,i)=>eramanAdd(form,nor,['ni','hura','gu','haiek'][i] as Person));
for(const [nork,form] of [['ni','zinderamaztedan'],['hura','zinderamazten'],['gu','zinderamaztegun'],['haiek','zinderamazten'],['haiek','zinderamazteten']] as [Person,string][])eramanAdd(form,'zuek',nork);
for(const [nor,forms] of [['hura',['neraman','heraman','zeraman','generaman','zeneraman','zeneramaten','zeramaten']],
  ['haiek',['neramatzan','heramatzan','zeramatzan','generamatzan','zeneramatzan','zeneramatzaten','zeramatzaten']]] as [Person,string[]][])
  forms.forEach((form,i)=>eramanAdd(form,nor,['ni','hi','hura','gu','zu','zuek','haiek'][i] as Person,i===1?'hika':'neutral'));
for(const [form,nork,treatment] of [['eramaitzak','hi','toka'],['eramaitzan','hi','noka'],['eramaitzazu','zu','neutral'],['eramaitzazue','zuek','neutral']] as [string,Person,Treatment][])
  eraman.push({page:266,printed:'122',heading:'ERAMAN',lemma:'eraman',series:'NN9',form,nor:'haiek',nork,treatment,
    interpretations:[{mood:'imperative',tense:'present'}]});
export const eramanNorNorkReadings=eraman;
