import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
// Immutable upstream version; no live-site scraping and no runtime network dependency.
export const revision = 'f2888cdc7dca17488fa343dd1d9a7da49283842c';
const directory = new URL('../data/vendor/apertium-eus/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const file of ['apertium-eus.eus.dix', 'COPYING', 'AUTHORS']) {
  const url = `https://raw.githubusercontent.com/apertium/apertium-eus/${revision}/${file}`;
  const path = new URL(file, directory);
  let buffer: Buffer;
  try { buffer = await readFile(path); }
  catch {
    // curl respects the host proxy/certificate configuration as well as containers.
    buffer = execFileSync('curl', ['--fail', '--silent', '--show-error', '--location', '--max-time', '90', url], { maxBuffer: 30 * 1024 * 1024 });
    await writeFile(path, buffer);
  }
  console.log(file, buffer.length, createHash('sha256').update(buffer).digest('hex'));
}
