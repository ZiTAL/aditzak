import type { Mood, Person, Tense, Treatment } from '../packages/shared/src/index.js';

export type NorNoriReading={
  page:number; printed:string; heading:string; lemma:string; series:'NN1'|'NN2'|'NN4'|'NN9';
  form:string; nor:Person; nori:Person; treatment:Treatment;
  interpretations:{mood:Mood;tense:Tense}[];
};

const readings:NorNoriReading[]=[];
const interpretations={
  NN1:[{mood:'indicative',tense:'present'}],
  NN2:[{mood:'indicative',tense:'past'}],
  NN4:[{mood:'consequence',tense:'present'},{mood:'potential',tense:'hypothetical'}],
  NN9:[{mood:'imperative',tense:'present'}],
} as const;

function add(page:number,printed:string,heading:string,lemma:string,series:NorNoriReading['series'],
  form:string,nor:Person,nori:Person,treatment:Treatment='neutral') {
  readings.push({page,printed,heading,lemma,series,form,nor,nori,treatment,
    interpretations:[...interpretations[series]]});
}
function pair(page:number,printed:string,heading:string,lemma:string,series:NorNoriReading['series'],
  toka:string,noka:string,nor:Person,nori:Person) {
  add(page,printed,heading,lemma,series,toka,nor,nori,'toka');
  add(page,printed,heading,lemma,series,noka,nor,nori,'noka');
}

type Shape='outer'|'middle'|'plural-you'|'full';
function addSeries(page:number,printed:string,heading:string,lemma:string,series:'NN1'|'NN2'|'NN4',
  blocks:[Person,string,Shape][]) {
  for(const [nor,stem,shape] of blocks) {
    if(series==='NN1') {
      if(shape==='outer') { pair(page,printed,heading,lemma,series,stem+'k',stem+'n',nor,'hi'); for(const [nori,s] of [['hura','o'],['zu','zu'],['zuek','zue'],['haiek','e']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori); }
      if(shape==='middle') for(const [nori,s] of [['ni','t'],['hura','o'],['gu','gu'],['haiek','e']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori);
      if(shape==='plural-you') for(const [nori,s] of [['ni','date'],['hura','ote'],['gu','gute'],['haiek','ete']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori);
      if(shape==='full') { add(page,printed,heading,lemma,series,stem+'t',nor,'ni');pair(page,printed,heading,lemma,series,stem+'k',stem+'n',nor,'hi');for(const [nori,s] of [['hura','o'],['gu','gu'],['zu','zu'],['zuek','zue'],['haiek','e']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori); }
    } else if(series==='NN2') {
      if(shape==='outer') { pair(page,printed,heading,lemma,series,stem+'an',stem+'nan',nor,'hi'); for(const [nori,s] of [['hura','on'],['zu','zun'],['zuek','zuen'],['haiek','en']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori); }
      if(shape==='middle') for(const [nori,s] of [['ni','dan'],['hura','on'],['gu','gun'],['haiek','en']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori);
      if(shape==='plural-you') for(const [nori,s] of [['ni','daten'],['hura','oten'],['gu','guten'],['haiek','eten']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori);
      if(shape==='full') { add(page,printed,heading,lemma,series,stem+'dan',nor,'ni');pair(page,printed,heading,lemma,series,stem+'an',stem+'nan',nor,'hi');for(const [nori,s] of [['hura','on'],['gu','gun'],['zu','zun'],['zuek','zuen'],['haiek','en']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori); }
    } else {
      if(shape==='outer') { pair(page,printed,heading,lemma,series,stem+'ake',stem+'nake',nor,'hi'); for(const [nori,s] of [['hura','oke'],['zu','zuke'],['zuek','zueke'],['haiek','eke']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori); }
      if(shape==='middle') for(const [nori,s] of [['ni','dake'],['hura','oke'],['gu','guke'],['haiek','eke']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori);
      if(shape==='plural-you') for(const [nori,s] of [['ni','dakete'],['hura','okete'],['gu','gukete'],['haiek','ekete']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori);
      if(shape==='full') { add(page,printed,heading,lemma,series,stem+'dake',nor,'ni');pair(page,printed,heading,lemma,series,stem+'ake',stem+'nake',nor,'hi');for(const [nori,s] of [['hura','oke'],['gu','guke'],['zu','zuke'],['zuek','zueke'],['haiek','eke']] as [Person,string][])add(page,printed,heading,lemma,series,stem+s,nor,nori); }
    }
  }
}
function addImperative(page:number,printed:string,heading:string,lemma:string,stems:[Person,string][]) {
  for(const [nor,stem] of stems) {
    add(page,printed,heading,lemma,'NN9',stem+'t',nor,'ni');
    pair(page,printed,heading,lemma,'NN9',stem+'k',stem+'n',nor,'hi');
    for(const [nori,s] of [['hura','o'],['gu','gu'],['zu','zu'],['zuek','zue'],['haiek','e']] as [Person,string][])
      add(page,printed,heading,lemma,'NN9',stem+s,nor,nori);
  }
}

for(const spec of [
  {lemma:'atxiki',heading:'ATXEKI (ETXEKI)',printed:['101','102','103'],pages:[224,226,228],
    stems:[['natxeki','gatxezki','hatxeki','zatxezki','zatxezki','datxeki','datxezki'],
      ['nentxeki','gentxezki','hentxeki','zentxezki','zentxezki','zetxeki','zetxezki'],
      ['nentxeki','gentxezki','hentxeki','zentxezki','zentxezki','letxeki','letxezki']],
    imperative:[['hura','betxeki'],['haiek','betxezki']]},
  {lemma:'jarraiki',heading:'JARRAIKI (JARRAITU)',printed:['104','105','106'],pages:[230,232,234],
    stems:[['narrai','garraizki','harrai','zarraizki','zarraizki','darrai','darraizki'],
      ['ninderrai','ginderraizki','hinderrai','zinderraizki','zinderraizki','zerrai','zerraizki'],
      ['ninderrai','ginderraizki','hinderrai','zinderraizki','zinderraizki','lerrai','lerraizki']],
    imperative:[['hura','berrai'],['haiek','berraizki']]},
] as const) {
  const shapes:Shape[]=['outer','outer','middle','middle','plural-you','full','full'];
  addSeries(spec.pages[0],spec.printed[0],spec.heading,spec.lemma,'NN1',spec.stems[0].map((stem,i)=>[['ni','gu','hi','zu','zuek','hura','haiek'][i] as Person,stem,shapes[i]]));
  addSeries(spec.pages[1],spec.printed[1],spec.heading,spec.lemma,'NN2',spec.stems[1].map((stem,i)=>[['ni','gu','hi','zu','zuek','hura','haiek'][i] as Person,stem,shapes[i]]));
  addSeries(spec.pages[2],spec.printed[2],spec.heading,spec.lemma,'NN4',spec.stems[2].map((stem,i)=>[['ni','gu','hi','zu','zuek','hura','haiek'][i] as Person,stem,shapes[i]]));
  addImperative(spec.pages[2],spec.printed[2],spec.heading,spec.lemma,spec.imperative as unknown as [Person,string][]);
}
// The 1979 ATXEKI page repeats -okiote in the final zuek/haiek NN4 cell.
// Keep that printed reading; the 1977 source separately supports -iekete.
const atxekiTypo=readings.findIndex(r=>r.page===228&&r.form==='zentxezkiekete'&&r.nor==='zuek'&&r.nori==='haiek');
if(atxekiTypo>=0)readings[atxekiTypo]={...readings[atxekiTypo],form:'zentxezkiokete'};

for(const [page,printed,series,mood,tense,columns] of [
  [236,'107','NN1','indicative','present',[
    ['hura',['nakio','hakio','dakio','gakizkio','zakizkio','zakizkiote','dakizkio']],
    ['haiek',['nakie','hakie','dakie','gakizkie','zakizkie','zakizkiete','dakizkie']]]],
  [236,'107','NN2','indicative','past',[
    ['hura',['nenkion','henkion','zekion','genkizkion','zenkizkion','zenkizkioten','zekizkion']],
    ['haiek',['nenkien','henkien','zekien','genkizkien','zenkizkien','zenkizkieten','zekizkien']]]],
  [238,'108','NN4','consequence','present',[
    ['hura',['nenkioke','henkioke','lekioke','genkizkioke','zenkizkioke','zenkizkiokete','lekizkioke']],
    ['haiek',['nenkieke','henkieke','lekieke','genkizkieke','zenkizkieke','zenkizkiekete','lekizkieke']]]],
] as [number,string,NorNoriReading['series'],Mood,Tense,[Person,string[]][]][]) for(const [nori,forms] of columns)
  forms.forEach((form,i)=>readings.push({page,printed,heading:'EKIN',lemma:'ekin',series,form,
    nor:['ni','hi','hura','gu','zu','zuek','haiek'][i] as Person,nori,treatment:'neutral',
    interpretations:series==='NN4'?[{mood,tense},{mood:'potential',tense:'hypothetical'}]:[{mood,tense}]}));
for(const [nori,forms] of [
  ['hura',['hakio','bekio','zakizkio','zakizkiote','bekizkio']],
  ['haiek',['hakie','bekie','zakizkie','zakizkiete','bekizkie']],
] as [Person,string[]][]) forms.forEach((form,i)=>add(238,'108','EKIN','ekin','NN9',form,
  ['hi','hura','zu','zuek','haiek'][i] as Person,nori));

for(const [series,mood,tense,columns] of [
  ['NN1','indicative','present',[
    ['hura',['darit','darik','darin','dario','darigu','darizu','darizue','darie']],
    ['haiek',['darizkit','darizkik','darizkin','darizkio','darizkigu','darizkizu','darizkizue','darizkie']]]],
  ['NN2','indicative','past',[
    ['hura',['zeridan','zerian','zerinan','zerion','zerigun','zerizun','zerizuen','zerien']],
    ['haiek',['zerizkidan','zerizkian','zerizkinan','zerizkion','zerizkigun','zerizkizun','zerizkizuen','zerizkien']]]],
] as [NorNoriReading['series'],Mood,Tense,[Person,string[]][]][]) for(const [nor,forms] of columns)
  forms.forEach((form,i)=>readings.push({page:240,printed:'109',heading:'JARIO/JARIN/JARIATU',lemma:'jario',series,
    form,nor,nori:['ni','hi','hi','hura','gu','zu','zuek','haiek'][i] as Person,
    treatment:i===1?'toka':i===2?'noka':'neutral',interpretations:[{mood,tense}]}));

export const earlyNorNoriReadings=readings;
