import { test, expect } from '@playwright/test';
test('requested example, morphology and source links',async({page},testInfo)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('.board-word')).toHaveText('hatzait');
  await expect(page).toHaveURL(/\?q=hatzait$/);
  await expect(page.locator('.person.nor strong')).toHaveText('hi');await expect(page.locator('.person.nori strong')).toHaveText('niri');
  await expect(page.locator('.board-summary')).toContainText('Indikatiboa');
  await page.screenshot({path:testInfo.outputPath('gramatika.png'),fullPage:true});
  await page.getByRole('tab',{name:'Morfemak'}).click();await expect(page.locator('.segment-row')).toHaveText('hatzait');
  await expect(page.locator('.segment-list')).toContainText('NORI: niri');
  await page.getByRole('tab',{name:'Historia'}).click();await expect(page.locator('.not-yet')).toContainText('Ez da etimologiarik automatikoki asmatzen');
  expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('ambiguity, hika and all readings are selectable',async({page})=>{
  await page.goto('/?q=nauk');await expect(page.locator('#analysis option')).toHaveCount(2);
  await expect(page.locator('.treatment')).toContainText('Toka');
  for(const i of ['0','1']){await page.locator('#analysis').selectOption(i);await expect(page.locator('.board-word')).toHaveText('nauk');}
});
test('search, history, suffix base, no match and validation',async({page})=>{
  await page.goto('/');await expect(page.locator('.board-word')).toHaveText('hatzait');
  const search=async(word:string)=>{await page.getByRole('textbox').fill(word);await page.getByRole('button',{name:'Deseraiki'}).click();};
  await search('dut');await expect(page.locator('.board-word')).toHaveText('dut');await expect(page).toHaveURL(/\?q=dut$/);await page.getByRole('tab',{name:'Historia'}).click();await expect(page.locator('.history-note')).toContainText('*daduda');
  await search('datorrenean');await expect(page.locator('.affixes')).toContainText('denborazkoa');await expect(page.locator('.affixes')).toContainText('dator');
  await search('hatzaot');await expect(page.getByRole('button',{name:'hatzait',exact:true}).last()).toBeVisible();await expect(page.locator('.empty-state')).toBeVisible();
  await search('etorri naiz');await expect(page.getByRole('alert')).toContainText('Idatzi adizki bakarra');
});
test('past consequence and probability can both be selected',async({page})=>{
  await page.goto('/?q=nintzatekeen');
  await expect(page.locator('#analysis')).toBeVisible();
  const options=await page.locator('#analysis option').allTextContents();
  expect(options.some(text=>text.includes('Supositiboa'))).toBeTruthy();
  expect(options.some(text=>text.includes('Baldintzaren ondorioa'))).toBeTruthy();
});
test('conditional prefix is segmented without linking a bound base',async({page})=>{
  await page.goto('/?q=balitz');
  await page.getByRole('tab',{name:'Morfemak'}).click();
  await expect(page.locator('.segment-row')).toHaveText('balitz');
  await expect(page.locator('.affixes')).toContainText('Barne-oinarria');
  await expect(page.locator('.affixes button')).toHaveCount(0);
});
test('generated hika is usable and clearly marked as unreviewed',async({page})=>{
  await page.goto('/?q=ziostazak');
  await expect(page.locator('.board-word')).toHaveText('ziostazak');
  await expect(page.locator('.grammar-grid')).toContainText('*io');
  await expect(page.locator('.treatment')).toContainText('Toka');
  await expect(page.locator('#analysis-panel')).toContainText('ez da banaka arautasunaren arabera egiaztatu');
});
test('new JARIO and EROAN imperative readings appear in the UI',async({page})=>{
  await page.goto('/?q=berizkin');
  await expect(page.locator('.board-summary')).toContainText('Agintera');
  await expect(page.locator('.person.nor strong')).toHaveText('haiek');
  await expect(page.locator('.person.nori strong')).toHaveText('hiri');
  await expect(page.locator('.treatment')).toContainText('Noka');
  await page.goto('/?q=eroaitzan');
  await expect(page.locator('.board-summary')).toContainText('Agintera');
  await expect(page.locator('.person.nor strong')).toHaveText('haiek');
  await expect(page.locator('.person.nork strong')).toHaveText('hik');
  await expect(page.locator('.treatment')).toContainText('Noka');
});
test('ERAKUTSI gender and conditional readings appear in the UI',async({page})=>{
  await page.goto('/?q=erakutsazkidan');
  await expect(page.locator('.board-summary')).toContainText('Agintera');
  await expect(page.locator('.person.nor strong')).toHaveText('haiek');
  await expect(page.locator('.person.nori strong')).toHaveText('niri');
  await expect(page.locator('.treatment')).toContainText('Noka');
  await page.goto('/?q=banerakutsa');
  await expect(page.locator('.board-summary')).toContainText('Baldintza');
  await expect(page.locator('.person.nork strong')).toHaveText('nik');
});
test('EMAN and ERRAN newly audited readings appear in the UI',async({page})=>{
  await page.goto('/?q=emaitzan');
  await expect(page.locator('.board-summary')).toContainText('Agintera');
  await expect(page.locator('.person.nor strong')).toHaveText('haiek');
  await expect(page.locator('.person.nork strong')).toHaveText('hik');
  await expect(page.locator('.treatment')).toContainText('Noka');
  await page.goto('/?q=banerra');
  const options=await page.locator('#analysis option').allTextContents();
  const conditional=options.findIndex(text=>text.includes('Baldintza'));
  expect(conditional).toBeGreaterThanOrEqual(0);
  await page.locator('#analysis').selectOption(String(conditional));
  await expect(page.locator('.board-summary')).toContainText('Baldintza');
  await expect(page.locator('.person.nork strong')).toHaveText('nik');
});
