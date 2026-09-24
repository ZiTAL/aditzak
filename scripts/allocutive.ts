import type { Analysis } from '../packages/shared/src/index.js';

/**
 * Hikako alokutiboen sorkuntza, adizki neutro batetik.
 * Adapted to TypeScript from Wiktionary Module:eu-verb (revision 91771505,
 * CC BY-SA 4.0). See NOTICE.md. This produces candidates, not a normative
 * certification: only base forms without second-person arguments are used.
 */
const syntheticLemmas = new Set([
  'egon','etorri','ibili','joan','atxiki','jarraiki','ekin','jario','etzan',
  'eduki','ekarri','eraman','erabili','ezagutu','egin','ikusi','jakin',
  'entzun','erakutsi','eroan','jardun','iharduki','erauntsi','eutsi',
  'iraun','iruditu','iritzi','io','erran',
]);
const noEan = new Set(['egin','iruditu','iraun','ikusi','jakin','erakutsi','entzun','jardun','ezagutu','iritzi','iro']);
const zaZe = new Set(['ibili','egon','etorri','jarraiki','atxiki','jario','egin','erakutsi','ikusi','ezagutu','eraman','eduki','etzan','erabili','ekarri','entzun','jakin','ekin','eroan']);

function noka(word: string): string | null {
  const pairs: [RegExp,string][] = [
    [/at$/,'nat'],[/agu$/,'nagu'],[/agun$/,'nagun'],[/ate$/,'nate'],[/aten$/,'naten'],
    [/akete$/,'nakete'],[/agula$/,'nagula'],[/atela$/,'natela'],
    [/([aeiou])k$/,'$1n'],[/k$/,'na'],[/rran$/,'rnan'],[/an$/,'nan'],
    [/ake$/,'nake'],[/akeen$/,'nakeen'],[/ala$/,'nala'],[/aket$/,'naket'],
    [/akegu$/,'nakegu'],[/aketen$/,'naketen'],
  ];
  for (const [pattern,replacement] of pairs) if (pattern.test(word)) return word.replace(pattern,replacement);
  return null;
}

function toka(form: string, a: Analysis): string[] {
  const tense = a.tense;
  const family = a.type;
  const lemma = a.lemma;
  if (lemma === 'egin' && form === 'zegien') return ['zegian'];
  if ((lemma === 'eraman' || lemma === 'erabili') && a.type === 'nor-nori-nork' && a.mood === 'indicative' && a.tense === 'present' &&
      ['daramakit','daramazkit','darabilkit','darabilzkit'].includes(form)) {
    const canonical='z'+form.slice(1).replace(/it$/,'idak');
    return [canonical,canonical.replace(/^za/,'ze')];
  }
  if (lemma === 'ikusi' && a.mood === 'indicative' && tense === 'present' && family === 'nor-nork' && !/^dakusa|^dakuski/.test(form)) return [];
  let word = form;
  if (lemma === 'io' && tense === 'present' && /z$/.test(word)) word += 'ak';
  else if (lemma === 'io' && tense === 'past' && /zen$/.test(word)) word = word.replace(/zen$/,'zaan');
  else if (lemma === 'io' && tense === 'past' && family === 'nor-nork' && /oen$/.test(word)) word = word.replace(/oen$/,'oan');
  else if (/ke$/.test(word)) word += 'k';
  else if (/ket$/.test(word)) word = word.replace(/ket$/,'keat');
  else if (/kegu$/.test(word)) word = word.replace(/kegu$/,'keagu');
  else if (/keen$/.test(word)) word = word.replace(/keen$/,'kean');
  else if (tense === 'past' && /n$/.test(word) && family === 'nor') {
    if (/z[ea]n$/.test(word)) word = word.replace(/z[ea]n$/,'zaan');
    else if (/oan$/.test(word)) word = word.replace(/an$/,'aan');
    else if (/oen$/.test(word)) word = word.replace(/oen$/,'oan');
    else word = word.replace(/n$/,'an');
  } else if (tense === 'past' && /n$/.test(word) && family === 'nor-nori') {
    if (/dan$/.test(word)) word = word.replace(/dan$/,'daan');
    else if (/gu$/.test(word)) word = word.replace(/gu$/,'guan');
    else word = word.replace(/n$/,'an');
  } else if (tense === 'past' && /n$/.test(word)) {
    if (/t[sz]?en$/.test(word) || (/ien$/.test(word) && family === 'nor-nori-nork')) word = word.replace(/en$/,'ean');
    else if (/[aeo]n$/.test(word)) word = noEan.has(lemma) && /en$/.test(word) ? word.replace(/en$/,'an') : word.replace(/([aeo])n$/,'$1an');
    else word = word.replace(/([gk])un/,'$1uan');
  } else if (family === 'nor' || family === 'nor-nori') {
    if (/t$/.test(word)) word = word.replace(/t$/,'dak');
    else if (/r$/.test(word)) word += 'rek';
    else if (/l$/.test(word)) word += 'ek';
    else if (/z$/.test(word)) word += 'ak';
    else word += 'k';
  } else if (/gu$/.test(word)) {
    if (family === 'nor-nori-nork' && (tense !== 'present' || ['egin','ekarri'].includes(lemma))) {
      word = /i[eo]gu$/.test(word) ? word.replace(/i([eo])gu$/,'i$1agu') : word + 'k';
    } else if (/[aeio]gu$/.test(word)) word = word.replace(/gu$/,'agu');
    else if (/rgu$/.test(word)) word = word.replace(/gu$/,'reagu');
    else if (noEan.has(lemma)) word = word.replace(/gu$/,'agu');
    else word = word.replace(/gu$/,'eagu');
  } else if (/[aeiou]$/.test(word)) word += 'k';
  else if (/t$/.test(word)) {
    if (family === 'nor-nori-nork' && (tense !== 'present' || ['egin','ekarri'].includes(lemma))) {
      if (/i[eo]t$/.test(word)) word = word.replace(/i([eo])t$/,'i$1at');
      else if (/it$/.test(word)) word = word.replace(/t$/,'dak');
      else word += 'ak';
    } else if (/[aeiou]t$/.test(word)) word = word.replace(/t$/,'at');
    else if (/rt$/.test(word)) word = word.replace(/t$/,'reat');
    else if (/[sz]t$/.test(word)) word += 'ak';
    else word = word.replace(/t$/,'eat');
  } else if (/r$/.test(word)) word += 'rek';
  else word += 'ek';
  word = word.replace(/^d/,'z');
  return /^za/.test(word) && zaZe.has(lemma) ? [word,word.replace(/^za/,'ze')] : [word];
}

export function allocutiveCandidates(a: Analysis): {form:string;treatment:'toka'|'noka'}[] {
  // The 1977 and 1979 Academy publications disagree on the EUTSI daut-
  // present. Do not propagate an unresolved base into unattested hika forms.
  if (a.rawTags.includes('eab1979-daut-disputed')) return [];
  if (!(a.kind === 'synthetic' && syntheticLemmas.has(a.lemma) || a.kind === 'auxiliary' && a.lemma === 'iro') || a.allocutive || a.treatment !== 'neutral' || a.affixes.length) return [];
  if ([a.nor,a.nori,a.nork].some(p=>p === 'hi' || p === 'zu' || p === 'zuek')) return [];
  const standardizedSeries=a.lemma==='iro'
    ? a.mood==='potential' && ['present','past','hypothetical'].includes(a.tense)
    : a.mood==='indicative' && ['present','past'].includes(a.tense) || a.mood==='potential' &&
      (a.tense==='hypothetical' || ['egon','etorri'].includes(a.lemma) && ['present','past'].includes(a.tense));
  if(!standardizedSeries)return [];
  const result: {form:string;treatment:'toka'|'noka'}[] = [];
  for (const form of toka(a.form,a)) {
    if (/^[a-zñü]+$/.test(form)) result.push({form,treatment:'toka'});
    const feminine=noka(form);
    if (feminine && /^[a-zñü]+$/.test(feminine)) result.push({form:feminine,treatment:'noka'});
  }
  return result;
}
