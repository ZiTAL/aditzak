/** Compiler for the finite-verb subset of the pinned Apertium DIX.
 * XML comments/disabled entries never become linguistic data. Unsupported
 * constructs fail explicitly, rather than silently producing invented forms. */
export interface Entry { left: string; right: string; refs: string[]; line: number; attrs: string }
export interface Dictionary { paradigms: Map<string, Entry[]> }
function side(xml: string): string {
  return xml.replace(/<s n="([^"]+)"\s*\/>/g, '<$1>')
    .replace(/<j\s*\/>/g, '+').replace(/<b\s*\/>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&apos;/g, "'").replace(/&quot;/g, '"');
}
export function parseDictionary(source: string): Dictionary {
  // Preserve newlines so citations keep pointing at original upstream lines.
  const xml = source.replace(/<!--[\s\S]*?-->/g, text => text.replace(/[^\n]/g, ' '));
  const newlines = [...xml.matchAll(/\n/g)].map(m => m.index!);
  const lineAt = (offset: number) => {
    let lo = 0, hi = newlines.length;
    while (lo < hi) { const mid = (lo + hi) >>> 1; if (newlines[mid] < offset) lo = mid + 1; else hi = mid; }
    return lo + 1;
  };
  const paradigms = new Map<string, Entry[]>();
  for (const match of xml.matchAll(/<pardef n="([^"]+)">([\s\S]*?)<\/pardef>/g)) {
    const entries: Entry[] = [];
    for (const e of match[2].matchAll(/<e\b([^>]*)>([\s\S]*?)<\/e>/g)) {
      if (/\bi="yes"/.test(e[1])) continue;
      const pair = e[2].match(/<p>([\s\S]*?)<\/p>/);
      if (!pair) continue;
      const l = pair[1].match(/<l>([\s\S]*?)<\/l>/)?.[1] ?? '';
      const r = pair[1].match(/<r>([\s\S]*?)<\/r>/)?.[1] ?? '';
      const offset = (match.index ?? 0) + match[0].indexOf(match[2]) + (e.index ?? 0);
      entries.push({ left: side(l), right: side(r), refs: [...e[2].matchAll(/<par n="([^"]+)"\s*\/>/g)].map(m => m[1]), line: lineAt(offset), attrs: e[1] });
    }
    paradigms.set(match[1], entries);
  }
  return { paradigms };
}
export function expandEntry(entry: Entry, dictionary: Dictionary, seen: string[] = []): Entry[] {
  let expanded = [{ ...entry, refs: [] as string[] }];
  for (const ref of entry.refs) {
    if (seen.includes(ref)) throw new Error(`Cyclic paradigm: ${ref}`);
    const children = dictionary.paradigms.get(ref);
    if (!children) throw new Error(`Missing paradigm: ${ref}`);
    const tails = children.flatMap(child => expandEntry(child, dictionary, [...seen, ref]));
    expanded = expanded.flatMap(base => tails.map(tail => ({ ...base, left: base.left + tail.left, right: base.right + tail.right })));
  }
  return expanded;
}
