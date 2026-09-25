import type { Mood, Person, Tense, Treatment } from '../packages/shared/src/index.js';

export type EkarriNnnReading={page:number;printed:string;series:'NNN1'|'NNN2'|'NNN9';form:string;
  nor:Person;nori:Person;nork:Person;treatment:Treatment;mood:Mood;tense:Tense;derived:boolean};
const printed:EkarriNnnReading[]=[];
function add(page:number,printedPage:string,series:EkarriNnnReading['series'],form:string,nori:Person,nork:Person,
  treatment:Treatment='neutral'){
  printed.push({page,printed:printedPage,series,form,nor:'hura',nori,nork,treatment,
    mood:series==='NNN1'?'indicative':series==='NNN2'?'indicative':'imperative',
    tense:series==='NNN2'?'past':'present',derived:false});
}
function pair(page:number,printedPage:string,series:EkarriNnnReading['series'],toka:string,noka:string,nori:Person,nork:Person){
  add(page,printedPage,series,toka,nori,nork,'toka');add(page,printedPage,series,noka,nori,nork,'noka');
}

pair(258,'118','NNN1','dakarkidak','dakarkidan','ni','hi');
for(const [nork,form] of [['hura','dakarkit'],['zu','dakarkidazu'],['zuek','dakarkidazue'],['haiek','dakarkidate']] as [Person,string][])add(258,'118','NNN1',form,'ni',nork);
pair(258,'118','NNN1','dakarkiguk','dakarkigun','gu','hi');
for(const [nork,form] of [['hura','dakarkigu'],['zu','dakarkiguzu'],['zuek','dakarkiguzue'],['haiek','dakarkigute']] as [Person,string][])add(258,'118','NNN1',form,'gu',nork);
for(const [nork,toka,noka] of [['ni','dakarkiat','dakarkinat'],['hura','dakarkik','dakarkin'],['gu','dakarkiagu','dakarkinagu'],['haiek','dakarkiate','dakarkinate']] as [Person,string,string][])
  pair(258,'118','NNN1',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['dakarkizut','dakarkizu','dakarkigu','dakarkizute']],['zuek',['dakarkizuet','dakarkizue','dakarkizuegu','dakarkizuete']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(258,'118','NNN1',form,nori,['ni','hura','gu','haiek'][i] as Person));
for(const [nori,forms] of [['hura',['dakarkiot','dakarkiok','dakarkion','dakarkio','dakarkiogu','dakarkiozu','dakarkiozue','dakarkiote']],
  ['haiek',['dakarkiet','dakarkiek','dakarkien','dakarkie','dakarkiegu','dakarkiezu','dakarkiezue','dakarkiete']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(258,'118','NNN1',form,nori,['ni','hi','hi','hura','gu','zu','zuek','haiek'][i] as Person,i===1?'toka':i===2?'noka':'neutral'));

for(const [nori,forms] of [['ni',['hekarkidan','zekarkidan','zenekarkidan','zenekarkidaten','zekarkidaten']],
  ['gu',['hekarkigun','zekarkigun','zenekarkigun','zenekarkiguten','zekarkiguten']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(260,'119','NNN2',form,nori,['hi','hura','zu','zuek','haiek'][i] as Person,i===0?'hika':'neutral'));
for(const [nork,toka,noka] of [['ni','nekarkian','nekarkinan'],['hura','zekarkian','zekarkinan'],['gu','genekarkian','genekarkinan'],['haiek','zekarkiaten','zekarkinaten']] as [Person,string,string][])
  pair(260,'119','NNN2',toka,noka,'hi',nork);
for(const [nori,forms] of [['zu',['nekarkizun','zekarkizun','genekarkizun','zekarkizuten']],['zuek',['nekarkizuen','zekarkizuen','genekarkizuen','zekarkizueten']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(260,'119','NNN2',form,nori,['ni','hura','gu','haiek'][i] as Person));
for(const [nori,forms] of [['hura',['nekarkion','hekarkion','zekarkion','genekarkion','zenekarkion','zenekarkioten','zekarkioten']],
  ['haiek',['nekarkien','hekarkien','zekarkien','genekarkien','zenekarkien','zenekarkieten','zekarkieten']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(260,'119','NNN2',form,nori,['ni','hi','hura','gu','zu','zuek','haiek'][i] as Person,i===1?'hika':'neutral'));

pair(262,'120','NNN9','ekardak','ekardan','ni','hi');for(const [nork,form] of [['hura','bekarkit'],['zu','ekardazu'],['zuek','ekardazue'],['haiek','bekarkidate']] as [Person,string][])add(262,'120','NNN9',form,'ni',nork);
pair(262,'120','NNN9','ekarguk','ekargun','gu','hi');for(const [nork,form] of [['hura','bekarkigu'],['zu','ekarguzu'],['zuek','ekarguzue'],['haiek','bekarkigute']] as [Person,string][])add(262,'120','NNN9',form,'gu',nork);
pair(262,'120','NNN9','bekarkik','bekarkin','hi','hura');pair(262,'120','NNN9','bekarkiate','bekarkinate','hi','haiek');
for(const [nori,forms] of [['zu',['bekarkizu','bekarkizute']],['zuek',['bekarkizue','bekarkizuete']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(262,'120','NNN9',form,nori,i?'haiek':'hura'));
for(const [nori,forms] of [['hura',['ekarriok','ekarrion','bekarkio','ekarriozu','ekarriozue','bekarkiote']],
  ['haiek',['ekarriek','ekarrien','bekarkie','ekarriezu','ekarriezue','bekarkiete']]] as [Person,string[]][])
  forms.forEach((form,i)=>add(262,'120','NNN9',form,nori,['hi','hi','hura','zu','zuek','haiek'][i] as Person,i===0?'toka':i===1?'noka':'neutral'));

function pluralize(form:string){return form.includes('karki')?form.replace('karki','karzki'):
  form.includes('karri')?form.replace('karri','karzki'):form.replace('kar','karzki');}
const derived=printed.map(r=>({...r,form:pluralize(r.form),nor:'haiek' as Person,derived:true}));
export const ekarriNnnPrinted=printed;
export const ekarriNnnDerived=derived;
