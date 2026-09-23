import type { Analysis, Segmentation, Segment, Hypothesis, Person } from '@aditzak/shared';

const eu = (text: string) => ({ eu: text });
const source = [{ sourceId:'ehu-inflection', locator:'§1.2.2, pertsona-markak eta paradigmak' }];
export function normalizeInput(input: string): string {
  const normalized = input.normalize('NFC').trim().toLocaleLowerCase('eu').replace(/[.!?,;:…]+$/u, '').trimEnd();
  if (!normalized || normalized.length > 80 || !/^[a-zñü]+$/u.test(normalized)) throw new Error('invalid_form');
  return normalized;
}
function segments(parts: [string,string,string][]): Segment[] {
  let offset=0;
  return parts.map(([text,role,explanation]) => {
    const start=offset; offset+=text.length;
    return {text,role,explanation:eu(explanation),start,end:offset};
  });
}
export function segment(a: Analysis): Segmentation | null {
  if (a.affixes.includes('ba<cnjsub>') && a.form.startsWith('ba') && a.form.length>2) {
    return {status:'partial',segments:segments([
      ['ba','affix','Baldintzari lotutako ba- aurrizkia.'],
      [a.form.slice(2),'stem','Gainerako adizki-oinarria; haren barruko markak ez dira hemen zehazten.'],
    ]),explanation:eu('ba- aurrizkia eta haren ondoko oinarria bereizten dituen zatiketa partziala. Oinarria ez da nahitaez bere kabuz erabil daitekeen adizkia.'),
    citations:[...a.citations,{sourceId:'odriozola-baldintza',locator:'0. sarrera: ba- aurrizkia eta baldintza-adizkiak'}]};
  }
  if (a.affixes.length) return null; // affix realization must not be guessed from spelling
  const exact: Record<string,[string,string,string][]> = {
    hatzait:[['ha','nor','NOR: hi, bigarren pertsona singularra.'],['tzai','root','NOR–NORI saileko oinarria.'],['t','nori','NORI: niri, lehen pertsona singularra.']],
    naiz:[['n','nor','NOR: ni.'],['aiz','root','Izan aditzaren orainaldiko oinarria.']],
    haiz:[['h','nor','NOR: hi.'],['aiz','root','Izan aditzaren orainaldiko oinarria.']],
    dut:[['d','tense','Orainaldiko hirugarren pertsonaren hasierako marka.'],['u','root','*Edun paradigmaren oinarria.'],['t','nork','NORK: nik.']],
    du:[['d','tense','Orainaldiko hirugarren pertsonaren hasierako marka.'],['u','root','*Edun paradigmaren oinarria; NORK=hark ez da atzizki bereizi batez agertzen.']],
    didazue:[['d','tense','NOR: hura, orainaldian.'],['i','root','NOR–NORI–NORK saileko oinarria.'],['da','nori','NORI: niri. -t markaren -da- aldaera, beste morfema baten aurrean.'],['zue','nork','NORK: zuek.']],
  };
  if (exact[a.form] && a.kind==='auxiliary' && a.mood==='indicative' && a.tense==='present' && !a.allocutive) {
    return {status:'reviewed',segments:segments(exact[a.form]), explanation:eu(a.form==='hatzait' ? 'Zatiketa pedagogikoa: ha-tzai-t. Euskaltzaindiaren 78. arauaren eskemak HA-TZA-I-T bereizten du; EHUren azalpenean h-atzai-t ere erabiltzen da. Zatiketa-maila desberdinak dira, ez hiru etimologia frogatu.' : 'Gaur egungo funtzio gramatikalen zatiketa pedagogikoa. Zero-markak eta alomorfia kontuan hartu behar dira.'),citations:[...source,{sourceId:'euskaltzaindia78',locator:'Paradigma-taulak eta aurkezpeneko 4. oharra'}]};
  }
  if (a.mood!=='indicative' || a.tense!=='present' || a.allocutive) return null;
  const parts:[string,string,string][]=[];
  let left=a.form;
  const norPrefixes:Partial<Record<Person,string>> = {ni:'n',hi:'h',gu:'g',zu:'z',zuek:'z'};
  const pre = norPrefixes[a.nor];
  if (pre && left.startsWith(pre)) {parts.push([pre,'nor',`NOR: ${a.nor}.`]);left=left.slice(pre.length);}
  else if (left.startsWith('d')) {parts.push(['d','tense','Hirugarren pertsona eta orainaldia bereizten dituen hasiera.']);left=left.slice(1);}
  let ending=''; let role=''; let person:Person|null=null;
  if (a.nork && a.nork!=='hura') { person=a.nork; role='nork'; }
  else if (a.nori) { person=a.nori; role='nori'; }
  const ends:Partial<Record<Person,string>> = {ni:'t',gu:'gu',zu:'zu',zuek:'zue',haiek:role==='nork'?'te':'e',hura:'o'};
  const expected=person?ends[person]:null;
  if (expected && left.endsWith(expected) && left.length>expected.length) {ending=expected;left=left.slice(0,-expected.length);}
  if (!parts.length && !ending) return null;
  parts.push([left,'stem','Aditz-oinarria eta oraindik xehe bereizi gabeko barne-markak. Ez da zatitu gabeko segmentu osoa erro historikotzat hartzen.']);
  if (ending) parts.push([ending,role,`${role.toUpperCase()}: ${person}.`]);
  return {status:'partial',segments:segments(parts),explanation:eu('Zatiketa partziala: kanpoko komunztadura-markak bereizita. Oinarriaren barruko morfemak banaka egiaztatzeko daude.'),citations:source};
}
export function historicalNotes(a: Analysis): Hypothesis[] {
  const notes:Hypothesis[]=[];
  if ([a.nor,a.nori,a.nork].some(p=>p==='zu'||p==='zuek')) notes.push({
    id:'zu-plural',title:eu('Zu-ren plural historikoa'),
    explanation:eu('Zu lehen plurala zen; gero tratamendu adeitsuko singular bihurtu zen. Zuek forma plural bereizi gisa garatu zen. Horrek azaltzen du zu-rekin aditz-markek pluralaren antzeko jokabidea izatea. Ohar hau pertsona-sistemari dagokio, ez adizki osoaren berreraikuntza zehatzari.'),
    confidence:'high',steps:['zu (plurala)','zu (singular adeitsua) / zuek (plurala)'],
    citations:[{sourceId:'ehu-inflection',locator:'§1.2.2.1, The persons'}],
  });
  if (a.lemma==='ukan' && a.form==='dut') notes.push({
    id:'edun-reconstruction',title:eu('*Edun: barne-berreraikuntza'),
    explanation:eu('Hualdek dut/det/dot eta du/dau alderatuta *daut berreraiki daitekeela azaltzen du. Dudala eta beste aldaera batzuk konparatuz *dauda eta, urrats sakonago batean, *daduda proposatzen dira. Izartxoak berreraikuntza adierazten du; urrats guztiek ez dute froga-maila bera.'),
    confidence:'medium',steps:['*daduda','*dauda','*daut','dut'],citations:[{sourceId:'hualde2021',locator:'§5, 32. or.; Gómez & Sainz (1995) lanaren eztabaida'}],
  });
  return notes;
}
export function enrich(a: Analysis): Analysis {return {...a,segmentation:segment(a),history:historicalNotes(a)};}

/** A past probability form can also be the consequence of an unreal condition. */
export function withConsequence(a: Analysis): Analysis|null {
  if (a.kind!=='auxiliary' || !a.rawTags.includes('prob2')) return null;
  return {...a,id:`${a.id}-consequence`,mood:'consequence',origin:'rule',
    citations:[...a.citations,{sourceId:'odriozola-baldintza',locator:'0. sarrera: nintzatekeen, iraganeko ondorioa eta suposizioa'}]};
}

/** Restricted, one-step bait- rule. Only attested base analyses are eligible. */
export function baitCandidates(form:string): string[] {
  if (form.startsWith('baitz')) return ['z'+form.slice(5)];
  if (form.startsWith('bait')) return ['d'+form.slice(4),'t'+form.slice(4),form.slice(4)];
  if (form.startsWith('baik')) return ['g'+form.slice(4),'k'+form.slice(4)];
  if (form.startsWith('bain')) return ['n'+form.slice(4)];
  if (form.startsWith('bail')) return ['l'+form.slice(4)];
  if (form.startsWith('baih')) return ['h'+form.slice(4)];
  return [];
}
export function withBait(a:Analysis, form:string):Analysis|null {
  if(a.affixes.length || a.allocutive || a.mood!=='indicative') return null;
  const base=a.form;
  const surface=baitSurface(base);
  if(surface!==form) return null;
  return {...a,id:`${a.id}-bait`,form,baseForm:base,affixes:['bait<causal-relative>'],origin:'rule',segmentation:null,history:[],citations:[...a.citations,{sourceId:'euskaltzaindia-bait',locator:'2. araua: baitu, baikara, bainaiz'}]};
}
export function baitSurface(base:string):string {
  return base.startsWith('d')?'bait'+base.slice(1):base.startsWith('z')?'baitz'+base.slice(1):base.startsWith('g')?'baik'+base.slice(1):base.startsWith('n')?'bain'+base.slice(1):base.startsWith('l')?'bail'+base.slice(1):base.startsWith('h')?'baih'+base.slice(1):'bait'+base;
}
export function editDistance(a:string,b:string):number {
  let prev=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){const row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=row;}
  return prev[b.length];
}
