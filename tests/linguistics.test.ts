import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInput, editDistance, baitCandidates } from '../apps/api/src/linguistics.js';
import { parseDictionary, expandEntry } from '../scripts/dictionary.js';
test('normalizes one word, punctuation and case',()=>{
  for(const word of ['HATZAIT','  hatzait  ','Hatzait?!… '])assert.equal(normalizeInput(word),'hatzait');
  for(const word of ['',' ','etorri naiz','na1z',"na'iz",'<script>','na\niz','a'.repeat(81)])assert.throws(()=>normalizeInput(word),/invalid_form/);
});
test('edit distance handles insertions, deletion and empty strings',()=>{
  assert.equal(editDistance('hatzaot','hatzait'),1);assert.equal(editDistance('','abc'),3);assert.equal(editDistance('naiz','naiz'),0);
});
test('bait phonological inversion',()=>{
  for(const [word,base] of [['baitu','du'],['baikara','gara'],['bainaiz','naiz'],['baitzara','zara'],['baihaiz','haiz']])assert.ok(baitCandidates(word).includes(base));
});
test('DIX comments, disabled entries, alternatives and provenance',()=>{
  const xml='<pardef n="tail"><e><p><l>t</l><r/></p></e><e r="RL"><p><l>dala</l><r><j/>la<s n="cnjsub"/></r></p></e></pardef>\n<pardef n="verb">\n<!--<e><p><l>BAD</l><r/></p></e>-->\n<e i="yes"><p><l>BAD</l><r/></p></e>\n<e><p><l>hatzai</l><r><s n="vbsint"/></r></p><par n="tail"/></e></pardef>';
  const d=parseDictionary(xml);const entries=d.paradigms.get('verb')!;assert.equal(entries.length,1);assert.equal(entries[0].line,5);
  assert.deepEqual(expandEntry(entries[0],d).map(e=>[e.left,e.right]),[['hatzait','<vbsint>'],['hatzaidala','<vbsint>+la<cnjsub>']]);
});
test('missing and cyclic continuation references fail explicitly',()=>{
  const d=parseDictionary('<pardef n="loop"><e><p><l>x</l><r/></p><par n="loop"/></e></pardef>');
  assert.throws(()=>expandEntry(d.paradigms.get('loop')![0],d),/Cyclic/);
  assert.throws(()=>expandEntry({left:'',right:'',refs:['missing'],attrs:'',line:1},d),/Missing/);
});
