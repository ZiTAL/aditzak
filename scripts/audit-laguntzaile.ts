import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { defaultDatabasePath } from '../apps/api/src/database.js';

// Read-only check of the unsplit, multi-column form cells in rule 78.
// Morpheme diagrams are deliberately excluded; the PDF remains external.
const pdf=process.argv[2];
if(!pdf)throw new Error('Erabilera: npm run audit:laguntzaile -- /bidea/Araua_0078.pdf');
const text=execFileSync('pdftotext',['-layout',pdf,'-'],{encoding:'utf8',maxBuffer:10*1024*1024});
const db=new DatabaseSync(defaultDatabasePath(),{readOnly:true});
const exists=db.prepare('SELECT 1 FROM analyses WHERE form=? AND variety=? LIMIT 1');
// Column labels and isolated pieces in the PDF's morpheme diagrams, not
// standalone adizki. Keep this exclusion list explicit and auditable.
const nonForms=new Set(['nor','nori','nork','la','kete','te','zki','li','ze','le','be','it','int','zte','en','de','di','nat','kin','ke','bi']);
let checked=0;
let excluded=0;
const missing:string[]=[];
for(const page of text.split('\f')) for(const line of page.split('\n')){
  const cells=line.trim().split(/\s{2,}/);
  if(cells.length<2)continue;
  const forms=cells.filter(cell=>/^[a-zñü]{2,}(?:\/[a-zñü]{2,})*$/.test(cell)).flatMap(cell=>cell.split('/'));
  if(forms.length<2)continue;
  for(const form of forms){if(nonForms.has(form)){excluded++;continue;}checked++;if(!exists.get(form,'batua'))missing.push(form);}
}
db.close();
console.log(JSON.stringify({source:'Euskaltzaindia 78, 2+ zutabeko gelaxka soilak (>=2 hizki)',checked,excluded,
  missingCount:missing.length,missing:[...new Set(missing)],
  caveat:'Ez ditu lerro bakarrekoak, parentesi bidezko aukerak edo analisi gramatikalaren zuzentasuna egiaztatzen. Pieza morfologikoak eta zutabe-izenak kanpo uzten ditu.'},null,2));
if(checked<2700 || missing.length)process.exitCode=1;
