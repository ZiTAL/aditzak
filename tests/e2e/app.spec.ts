import { test, expect } from '@playwright/test';
test('requested example, morphology and source links',async({page},testInfo)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('.board-word')).toHaveText('hatzait');
  await expect(page.locator('.person.nor strong')).toHaveText('hi');await expect(page.locator('.person.nori strong')).toHaveText('niri');
  await expect(page.locator('.board-summary')).toContainText('Indikatiboa');
  await page.screenshot({path:testInfo.outputPath('gramatika.png'),fullPage:true});
  await page.getByRole('tab',{name:'Morfemak'}).click();await expect(page.locator('.segment-row')).toHaveText('hatzait');
  await expect(page.locator('.segment-list')).toContainText('NORI: niri');
  await page.getByRole('tab',{name:'Historia'}).click();await expect(page.locator('.not-yet')).toContainText('Ez da etimologiarik automatikoki asmatzen');
  expect(errors).toEqual([]);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('ambiguity, hika and all readings are selectable',async({page})=>{
  await page.goto('/?adizkia=nauk');await expect(page.locator('#analysis option')).toHaveCount(2);
  await expect(page.locator('.treatment')).toContainText('Toka');
  for(const i of ['0','1']){await page.locator('#analysis').selectOption(i);await expect(page.locator('.board-word')).toHaveText('nauk');}
});
test('search, history, suffix base, no match and validation',async({page})=>{
  await page.goto('/');await expect(page.locator('.board-word')).toHaveText('hatzait');
  const search=async(word:string)=>{await page.getByRole('textbox').fill(word);await page.getByRole('button',{name:'Deseraiki'}).click();};
  await search('dut');await expect(page.locator('.board-word')).toHaveText('dut');await page.getByRole('tab',{name:'Historia'}).click();await expect(page.locator('.history-note')).toContainText('*daduda');
  await search('datorrenean');await expect(page.locator('.affixes')).toContainText('denborazkoa');await expect(page.locator('.affixes')).toContainText('dator');
  await search('hatzaot');await expect(page.getByRole('button',{name:'hatzait',exact:true}).last()).toBeVisible();await expect(page.locator('.empty-state')).toBeVisible();
  await search('etorri naiz');await expect(page.getByRole('alert')).toContainText('Idatzi adizki bakarra');
});
test('past consequence and probability can both be selected',async({page})=>{
  await page.goto('/?adizkia=nintzatekeen');
  await expect(page.locator('#analysis')).toBeVisible();
  const options=await page.locator('#analysis option').allTextContents();
  expect(options.some(text=>text.includes('Supositiboa'))).toBeTruthy();
  expect(options.some(text=>text.includes('Baldintzaren ondorioa'))).toBeTruthy();
});
test('conditional prefix is segmented without linking a bound base',async({page})=>{
  await page.goto('/?adizkia=balitz');
  await page.getByRole('tab',{name:'Morfemak'}).click();
  await expect(page.locator('.segment-row')).toHaveText('balitz');
  await expect(page.locator('.affixes')).toContainText('Barne-oinarria');
  await expect(page.locator('.affixes button')).toHaveCount(0);
});
