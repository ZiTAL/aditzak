<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Analysis, AnalyzeResponse, Coverage, Localized, Source } from '@aditzak/shared';
const {t,te,locale}=useI18n();
const input=ref('hatzait');
const result=ref<AnalyzeResponse|null>(null);
const meta=ref<Coverage|null>(null);
const selected=ref(0);
const tab=ref('grammar');
const pending=ref(false);
const error=ref('');
const active=computed(()=>result.value?.analyses[selected.value]);
let controller:AbortController|undefined;
const local=(value:Localized)=>value[locale.value]??value.eu??Object.values(value)[0]??'';
const number=(n:number)=>new Intl.NumberFormat('eu').format(n);
const lemma=(a:Analysis)=>te(`lemmaLabels.${a.lemma}`)?t(`lemmaLabels.${a.lemma}`):a.lemma;
const source=(id:string):Source|undefined=>result.value?.sources.find(s=>s.id===id);
const affix=(raw:string)=>{const key=raw.split('<')[0];return te(`affixLabels.${key}`)?t(`affixLabels.${key}`):raw;};
function summary(a:Analysis){return [lemma(a),t(a.mood),t(a.tense),a.type.toUpperCase(),t(`person.${a.nor}`),a.nori?t(`dative.${a.nori}`):'',a.nork?t(`ergative.${a.nork}`):'',a.treatment!=='neutral'?t(a.treatment):'',a.allocutive?t('allocutive'):'',...a.affixes.map(affix)].filter(Boolean).join(' · ');}
async function analyze(word?:string){
  if(word)input.value=word;
  controller?.abort();const request=new AbortController();controller=request;
  pending.value=true;error.value='';
  try{
    const response=await fetch(`/api/v1/analyze?${new URLSearchParams({form:input.value,variety:'batua'})}`,{signal:request.signal});
    const data=await response.json();
    if(!response.ok){result.value=null;error.value=te(data.error)?data.error:'server_error';return;}
    result.value=data;selected.value=0;tab.value='grammar';
    const url=new URL(location.href);url.searchParams.set('q',data.normalized);history.replaceState(null,'',url);
  }catch(e){if(!request.signal.aborted){result.value=null;error.value='network_error';}}
  finally{if(!request.signal.aborted)pending.value=false;}
}
onMounted(async()=>{
  const word=new URLSearchParams(location.search).get('q');if(word)input.value=word;
  void analyze();
  try{const response=await fetch('/api/v1/meta');if(response.ok)meta.value=await response.json();}catch{/* search still reports connection errors */}
});
</script>

<template>
  <div class="page-shell">
    <header class="topbar">
      <a class="brand" href="/" :aria-label="`${t('brand')} ${t('brandSuffix')}`"><span class="brand-mark" aria-hidden="true">a<span>·</span></span><span>{{ t('brand') }}<span class="brand-light"> / {{ t('brandSuffix') }}</span></span></a>
      <div class="top-meta"><span class="prototype">{{ t('prototype') }}</span><span class="language"><span aria-hidden="true">◉</span> {{ t('language') }}</span></div>
    </header>
    <main>
      <section class="hero" aria-labelledby="main-title">
        <p class="eyebrow">{{ t('eyebrow') }}</p>
        <h1 id="main-title">{{ t('title') }}</h1>
        <p class="intro">{{ t('intro') }}</p>
        <form class="search" @submit.prevent="analyze()">
          <label class="sr-only" for="verb">{{ t('label') }}</label>
          <span class="search-icon" aria-hidden="true">⌕</span>
          <input id="verb" v-model="input" :placeholder="t('placeholder')" autocomplete="off" autocapitalize="none" :spellcheck="false" maxlength="160" required :aria-invalid="Boolean(error)" :aria-describedby="error?'input-error':undefined">
          <button type="submit" :disabled="pending">{{ t(pending?'searching':'search') }} <span aria-hidden="true">↗</span></button>
        </form>
        <div class="examples"><span>{{ t('examples') }}</span><button v-for="word in ['hatzait','dator','nauk','didazue','datorrenean']" :key="word" @click="analyze(word)">{{ word }}</button></div>
        <p v-if="error" id="input-error" class="error" role="alert">{{ t(error) }}</p>
      </section>

      <section v-if="result" class="result-section" aria-labelledby="result-title" :aria-busy="pending">
        <div class="section-heading"><h2 id="result-title">{{ t('result') }}</h2><span>{{ t('analyses',{n:result.analyses.length}) }}</span></div>
        <div v-if="!active" class="empty-state" role="status"><h3>{{ t('empty') }}</h3><p>{{ result.normalized }}</p><p>{{ t('emptyHelp') }}</p><template v-if="result.suggestions.length"><h4>{{ t('suggestions') }}</h4><button v-for="word in result.suggestions" :key="word" class="suggestion" @click="analyze(word)">{{ word }}</button></template></div>
        <template v-else>
          <div v-if="result.analyses.length>1" class="ambiguity"><div><strong>{{ t('analyses',{n:result.analyses.length}) }}</strong><p>{{ t('ambiguous') }}</p></div><label class="sr-only" for="analysis">{{ t('choice') }}</label><select id="analysis" v-model="selected"><option v-for="(a,i) in result.analyses" :key="a.id" :value="i">{{ i+1 }}. {{ summary(a) }}</option></select></div>
          <article class="analysis-card">
            <div class="blackboard">
              <div class="board-top"><span>{{ t('language') }}</span><span>{{ t(active.kind) }}</span></div>
              <div class="board-word" aria-live="polite">{{ result.normalized }}</div>
              <div class="board-rule"></div>
              <p class="board-summary">{{ t(active.mood) }} <span>·</span> {{ t(active.tense) }}</p>
              <p class="board-type">{{ active.type.toUpperCase().replaceAll('-', ' – ') }}</p>
              <div class="chalk-parts" v-if="active.segmentation"><span v-for="(part,i) in active.segmentation.segments" :key="i" :class="`chalk-${part.role}`">{{ part.text }}<small>{{ t(`roles.${part.role}`) }}</small></span></div>
              <div v-else class="board-lemma">{{ t('lemma') }} <strong>{{ lemma(active) }}</strong></div>
              <div class="board-bottom"><span>{{ t(active.origin==='rule'?'rule':'imported') }}</span><span aria-hidden="true">↙ a</span></div>
            </div>
            <div class="analysis-detail">
              <div class="tabs" role="tablist" :aria-label="t('result')"><button v-for="name in ['grammar','morphemes','history']" :id="`tab-${name}`" :key="name" role="tab" :aria-selected="tab===name" aria-controls="analysis-panel" @click="tab=name">{{ t(name) }}</button></div>
              <div id="analysis-panel" role="tabpanel" :aria-labelledby="`tab-${tab}`" class="panel">
                <template v-if="tab==='grammar'">
                  <dl class="grammar-grid"><div><dt>{{ t('kind') }}</dt><dd>{{ t(active.kind) }}</dd></div><div><dt>{{ t('lemma') }}</dt><dd>{{ lemma(active) }}</dd></div><div><dt>{{ t('mood') }}</dt><dd>{{ t(active.mood) }}</dd></div><div><dt>{{ t('tense') }}</dt><dd>{{ t(active.tense) }}</dd></div></dl>
                  <div class="persons"><div v-for="role in (['nor','nori','nork'] as const)" :key="role" :class="['person',role,{inactive:!active[role]}]"><span>{{ t(role) }}</span><strong>{{ active[role]?t(`${role==='nor'?'person':role==='nori'?'dative':'ergative'}.${active[role]}`):t('none') }}</strong></div></div>
                  <p class="treatment"><span class="dot"></span>{{ t(active.treatment) }}<span v-if="active.allocutive" class="tag">{{ t('allocutive') }}</span></p>
                  <p v-if="active.validation==='generated'" class="muted small">{{ t('generatedWarning') }}</p>
                  <p v-if="active.allocutive" class="muted small">{{ t('allocutiveHelp') }}</p><p v-else-if="[active.nor,active.nori,active.nork].includes('hi')" class="muted small">{{ t('argumentHi') }}</p>
                </template>
                <template v-else-if="tab==='morphemes'">
                  <template v-if="active.segmentation"><span class="tag">{{ t(active.segmentation.status) }}</span><div class="segment-row"><span v-for="(s,i) in active.segmentation.segments" :key="i" :class="`segment-${s.role}`">{{ s.text }}</span></div><ol class="segment-list"><li v-for="(s,i) in active.segmentation.segments" :key="i"><strong>{{ s.text }}</strong><span>{{ local(s.explanation) }}</span></li></ol><p class="muted small">{{ local(active.segmentation.explanation) }}</p><p v-for="c in active.segmentation.citations" :key="c.sourceId" class="citation"><a :href="source(c.sourceId)?.url" target="_blank" rel="noopener noreferrer">{{ source(c.sourceId)?.title }}</a> — {{ c.locator }}</p></template>
                  <div v-else class="not-yet"><span aria-hidden="true">⤷</span><h3>{{ t('noSegments') }}</h3><p>{{ t('noSegmentsHelp') }}</p></div>
                </template>
                <template v-else>
                  <div v-if="!active.history.length" class="not-yet"><span aria-hidden="true">↶</span><h3>{{ t('noHistory') }}</h3><p>{{ t('noHistoryHelp') }}</p></div>
                  <section v-for="note in active.history" :key="note.id" class="history-note"><span class="tag">{{ t(note.confidence) }}</span><h3>{{ local(note.title) }}</h3><p>{{ local(note.explanation) }}</p><p class="history-steps">{{ note.steps.join(' → ') }}</p><p v-for="c in note.citations" :key="c.sourceId" class="citation"><a :href="source(c.sourceId)?.url" target="_blank" rel="noopener noreferrer">{{ source(c.sourceId)?.title }}</a> — {{ c.locator }}</p></section>
                </template>
                <div v-if="active.affixes.length" class="affixes"><h3>{{ t('affixes') }}</h3><span v-for="a in active.affixes" :key="a" class="tag">{{ affix(a) }}</span><p v-if="active.baseForm"><template v-if="active.affixes.includes('ba<cnjsub>') && ['conditional','subjunctive'].includes(active.mood)">{{ t('internalBase') }}: {{ active.baseForm }}</template><template v-else>{{ t('base') }}: <button class="inline-link" @click="analyze(active.baseForm!)">{{ active.baseForm }}</button></template></p></div>
              </div>
            </div>
          </article>
          <details class="disclosure"><summary>{{ t('sources') }}<span aria-hidden="true">＋</span></summary><div class="disclosure-body"><p v-for="c in active.citations" :key="c.sourceId+c.locator"><a :href="source(c.sourceId)?.url" target="_blank" rel="noopener noreferrer">{{ source(c.sourceId)?.title }}</a><br><span class="muted small">{{ c.locator }}</span></p><details><summary>{{ t('technical') }}</summary><p>{{ t('sourceTags') }}</p><code class="raw-tags">{{ active.rawTags.join(' · ') }}</code><p class="small">ID: {{ active.id }} · {{ result.version }}</p></details></div></details>
        </template>
      </section>

      <section v-if="meta" class="coverage-section" aria-labelledby="coverage-title"><div class="coverage-copy"><p class="eyebrow">{{ t('coverage') }}</p><h2 id="coverage-title">{{ t('coverageTitle') }}</h2><p>{{ t('coverageIntro') }}</p></div><div class="stats"><div><strong>{{ number(meta.forms) }}</strong><span>{{ t('forms') }}</span></div><div><strong>{{ number(meta.analyses) }}</strong><span>{{ t('readings') }}</span></div><div><strong>{{ meta.lemmas.length }}</strong><span>{{ t('lemmas') }}</span></div></div>
        <details class="disclosure coverage-disclosure"><summary>{{ t('coverage') }}<span aria-hidden="true">＋</span></summary><div class="disclosure-body"><ul><li v-for="(limit,i) in meta.limitations" :key="i">{{ local(limit) }}</li></ul><p>{{ t('baseForms') }}: {{ number(meta.baseForms) }}</p><p>{{ t('missing') }}: {{ meta.missingLemmas.join(', ') }}</p><h3>{{ t('allLemmas') }}</h3><div class="lemma-cloud"><span v-for="l in meta.lemmas" :key="l.lemma">{{ l.lemma }} <small>{{ number(l.forms) }}</small></span></div></div></details>
      </section>
    </main>
    <footer><div><strong>{{ t('footer') }}</strong><p>{{ t('independent') }}</p></div><span>{{ t('license') }}</span></footer>
  </div>
</template>
