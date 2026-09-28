import type { Person, Treatment } from '../packages/shared/src/index.js';
import type { NorNorkReading } from './nor-nork-paradigms.js';

const nn:NorNorkReading[]=[];
function nnAdd(page:number,printed:string,series:NorNorkReading['series'],form:string,nor:Person,nork:Person,
  treatment:Treatment='neutral'){
  const interpretations=series==='NN1'?[{mood:'indicative',tense:'present'}] as const:
    series==='NN2'?[{mood:'indicative',tense:'past'}] as const:
    series==='NN3'?[{mood:'conditional',tense:'hypothetical'}] as const:
    series==='NN4'?[{mood:'consequence',tense:'present'},{mood:'potential',tense:'hypothetical'}] as const:
    [{mood:'imperative',tense:'present'}] as const;
  nn.push({page,printed,heading:'ENTZUN',lemma:'entzun',series,form,nor,nork,treatment,
    interpretations:[...interpretations]});
}
function full(page:number,printed:string,series:NorNorkReading['series'],nor:Person,forms:string[]){
  forms.forEach((form,index)=>nnAdd(page,printed,series,form,nor,['ni','hi','hi','hura','gu','zu','zuek','haiek'][index] as Person,
    index===1?'toka':index===2?'noka':'neutral'));
}
full(314,'146','NN1','hura',['dantzut','dantzuk','dantzun','dantzu','dantzugu','dantzuzu','dantzuzue','dantzute']);
full(314,'146','NN1','haiek',['dantzuzkit','dantzuzkik','dantzuzkin','dantzuzki','dantzuzkigu','dantzuzkizu','dantzuzkizue','dantzuzkite']);
for(const [series,nor,forms] of [
  ['NN2','hura',['nentzuen','hentzuen','zentzuen','genentzuen','zenentzuen','zenentzuten','zentzuten']],
  ['NN2','haiek',['nentzuzkien','hentzuzkien','zentzuzkien','genentzuzkien','zenentzuzkien','zenentzuzkiten','zentzuzkiten']],
  ['NN3','hura',['banentzu','bahentzu','balentzu','bagenentzu','bazenentzu','bazenentzute','balentzute']],
  ['NN3','haiek',['banentzuzki','bahentzuzki','balentzuzki','bagenentzuzki','bazenentzuzki','bazenentzuzkite','balentzuzkite']],
  ['NN4','hura',['nentzuke','hentzuke','lentzuke','genentzuke','zenentzuke','zenentzukete','lentzukete']],
  ['NN4','haiek',['nentzuzke','hentzuzke','lentzuzke','genentzuzke','zenentzuzke','zenentzuzkete','lentzuzkete']],
] as [NorNorkReading['series'],Person,string[]][])forms.forEach((form,index)=>nnAdd(series==='NN2'?314:316,
  series==='NN2'?'146':'147',series,form,nor,['ni','hi','hura','gu','zu','zuek','haiek'][index] as Person,index===1?'hika':'neutral'));
for(const [nork,form,treatment] of [['hi','entzuk','toka'],['hi','entzun','noka'],['hura','bentzu','neutral'],
  ['zu','entzuzu','neutral'],['zuek','entzuzue','neutral'],['haiek','bentzute','neutral']] as [Person,string,Treatment][])
  nnAdd(316,'147','NN9',form,'hura',nork,treatment);
nnAdd(316,'147','NN9','bentzuzki','haiek','hura');nnAdd(316,'147','NN9','bentzuzkite','haiek','haiek');
export const entzunNorNorkReadings=nn;

export type EntzunNnnReading={page:number;printed:string;form:string;nor:Person;nori:Person;nork:Person;
  treatment:Treatment;derived:boolean};
const nnn:EntzunNnnReading[]=[];
function add(form:string,nori:Person,nork:Person,treatment:Treatment='neutral'){
  nnn.push({page:318,printed:'148',form,nor:'hura',nori,nork,treatment,derived:false});
}
function pair(toka:string,noka:string,nori:Person,nork:Person){add(toka,nori,nork,'toka');add(noka,nori,nork,'noka');}
pair('entzudak','entzudan','ni','hi');for(const [nork,form] of [['hura','bentzukit'],['zu','entzudazu'],['zuek','entzudazue'],['haiek','bentzukidate']] as [Person,string][])add(form,'ni',nork);
pair('entzuguk','entzugun','gu','hi');for(const [nork,form] of [['hura','bentzukigu'],['zu','entzuguzu'],['zuek','entzuguzue'],['haiek','bentzukigute']] as [Person,string][])add(form,'gu',nork);
pair('bentzukik','bentzukin','hi','hura');pair('bentzukiate','bentzukinate','hi','haiek');
for(const [nori,forms] of [['zu',['bentzukizu','bentzukizute']],['zuek',['bentzukizue','bentzukizuete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(form,nori,index?'haiek':'hura'));
for(const [nori,forms] of [['hura',['entzuiok','entzuion','bentzukio','entzuiozu','entzuiozue','bentzukiote']],
  ['haiek',['entzuiek','entzuien','bentzukie','entzuiezu','entzuiezue','bentzukiete']]] as [Person,string[]][])
  forms.forEach((form,index)=>add(form,nori,['hi','hi','hura','zu','zuek','haiek'][index] as Person,
    index===0?'toka':index===1?'noka':'neutral'));
function pluralize(form:string){return form.replace(/ntzuki|ntzui|ntzu/,'ntzuzki');}
export const entzunNnnPrinted=nnn;
export const entzunNnnDerived=nnn.map(reading=>({...reading,form:pluralize(reading.form),nor:'haiek' as Person,derived:true}));
