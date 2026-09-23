export type Person = 'ni' | 'hi' | 'hura' | 'gu' | 'zu' | 'zuek' | 'haiek';
export type Mood = 'indicative' | 'potential' | 'subjunctive' | 'imperative' | 'conditional' | 'consequence' | 'probability';
export type Tense = 'present' | 'past' | 'hypothetical';
export type Treatment = 'neutral' | 'toka' | 'noka' | 'hika';
export type Localized = Record<string, string>;
export interface Citation { sourceId: string; locator: string }
export interface Source { id: string; title: string; author: string; url: string; license: string; version: string; role: 'corpus' | 'reference' }
export interface Segment { text: string; role: string; explanation: Localized; start: number; end: number }
export interface Segmentation { status: 'reviewed' | 'partial'; segments: Segment[]; explanation: Localized; citations: Citation[] }
export interface Hypothesis { id: string; title: Localized; explanation: Localized; confidence: 'high' | 'medium' | 'disputed'; steps: string[]; citations: Citation[] }
export interface Analysis {
  id: string; form: string; lemma: string; kind: 'auxiliary' | 'synthetic'; variety: string;
  mood: Mood; tense: Tense; type: 'nor' | 'nor-nori' | 'nor-nork' | 'nor-nori-nork';
  nor: Person; nori: Person | null; nork: Person | null; treatment: Treatment;
  allocutive: boolean; affixes: string[]; rawTags: string[]; baseForm: string | null;
  origin: 'lexicon' | 'rule'; validation: 'imported' | 'reviewed';
  citations: Citation[]; segmentation: Segmentation | null; history: Hypothesis[];
}
export interface AnalyzeResponse { input: string; normalized: string; analyses: Analysis[]; suggestions: string[]; sources: Source[]; version: string }
export interface Coverage {
  version: string; forms: number; analyses: number; baseForms: number; lemmas: { lemma: string; forms: number; analyses: number }[];
  varieties: string[]; source: string; complete: boolean; reviewedSegmentations: number; historicalNotes: number;
  missingLemmas: string[]; limitations: Localized[];
}
