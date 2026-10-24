const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { writeFileSync } = require('node:fs');
const { extname, join } = require('node:path');
const publicBase='/workaround.co.kr-platform/';
const distRoot=join(__dirname,'frontend/dist');
const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-170-r1-assets';
async function serveStaticBuild(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1')
  const decodedPath = decodeURIComponent(url.pathname)
  const relativePath = decodedPath.startsWith(publicBase)
    ? decodedPath.slice(publicBase.length)
    : decodedPath.replace(/^\/+/, '')
  let filePath = join(distRoot, relativePath || 'index.html')
  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, 'index.html')
  } catch {
    filePath = join(distRoot, 'index.html')
  }
  const contentTypes = {
    '.css': 'text/css',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
  }
  response.writeHead(200, { 'content-type': contentTypes[extname(filePath)] || 'application/octet-stream' })
  response.end(await readFile(filePath))
}


(async()=>{
const server=createServer(serveStaticBuild);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}${publicBase}`;const browser=await chromium.launch({headless:true});const results=[];
try{for(const width of [375,1440])for(const theme of ['dark','light']){
const c=await browser.newContext({viewport:{width,height:width===375?812:900},timezoneId:'Asia/Seoul',reducedMotion:'reduce'});const page=await c.newPage();const r={width,theme,errors:[]};results.push(r);page.on('pageerror',e=>r.errors.push(e.message));await page.addInitScript(t=>localStorage.setItem('workaround-theme',t),theme);await page.goto(base+'pantry');await page.locator('.pantry-page').waitFor();
const shot=async(name,fullPage=false)=>page.screenshot({path:out+`/ux-${width}-${theme}-${name}.png`,fullPage});
const read=()=>page.evaluate(()=>({title:document.querySelector('.pantry-hero h1').textContent,alternatives:[...document.querySelectorAll('.pantry-alternative')].map(e=>({text:e.innerText,title:e.querySelector('strong').textContent,rect:e.getBoundingClientRect().toJSON()})),pairing:document.querySelector('.pantry-pairing').textContent,filters:[...document.querySelectorAll('.pantry-chip')].map(e=>({text:e.textContent,pressed:e.getAttribute('aria-pressed')})),overflow:['html','body','.page-scroller','.pantry-page'].map(s=>{const e=document.querySelector(s);return[s,e?.scrollWidth-e?.clientWidth]}),controls:[...document.querySelectorAll('.pantry-page button,.pantry-page summary,.pantry-shopping label')].filter(e=>e.getBoundingClientRect().height).map(e=>({text:e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))}));
r.initial=await read();await shot('first');r.rotations=[r.initial];for(let i=0;i<3;i++){await page.getByRole('button',{name:'다른 상 보기',exact:true}).click();r.rotations.push(await read())}await shot('third-alternative');
await page.reload();await page.locator('.pantry-page').waitFor();r.refreshStable=(await read()).title===r.initial.title;
await page.locator('.pantry-detail>summary').click();await page.locator('.pantry-dish-row>summary').first().click();await shot('recipe',true);r.expanded=await read();
const shop=page.locator('.pantry-shopping label').first();r.shoppingItem=await shop.innerText();await shop.click();await page.reload();await page.locator('.pantry-detail>summary').click();r.shoppingRestored=await page.locator('.pantry-shopping label').first().locator('input').isChecked();
r.eatenTitle=(await read()).title;await page.getByRole('button',{name:'오늘 먹었음',exact:true}).click();r.stampDisabled=await page.getByRole('button',{name:'오늘 기록됨',exact:true}).isDisabled();await shot('stamp');r.savedHistory=await page.evaluate(()=>JSON.parse(localStorage.getItem('pantry:history')));await page.reload();await page.locator('.pantry-page').waitFor();r.afterStamp=await read();
// Reset only synthetic data for deterministic filter and non-alcohol flows.
await page.evaluate(()=>{localStorage.removeItem('pantry:history');localStorage.removeItem('pantry:shopping')});await page.reload();await page.locator('.pantry-page').waitFor();
await page.getByRole('button',{name:'10분',exact:true}).click();r.quick=await read();await shot('quick');
await page.getByRole('button',{name:'손님',exact:true}).click();r.guest=[await read()];await shot('guest');await page.getByRole('button',{name:'다른 상 보기',exact:true}).click();r.guest.push(await read());await shot('guest-next');
await page.getByRole('button',{name:'무알코올',exact:true}).click();r.nonAlcohol=await read();await shot('nonalcohol');r.nonAlcoholCycle=[];
for(let i=0;i<15;i++){const x=await read();r.nonAlcoholCycle.push(x);if(x.title==='비 오는 날 전 한 판'){await shot('nonalcohol-rain');break;}await page.getByRole('button',{name:'다른 상 보기',exact:true}).click();}
await page.locator('.pantry-alternative').last().click();r.afterAlternative=await read();await shot('alternative-clears-filter');
await c.close();console.log(JSON.stringify({width,theme,stable:r.refreshStable,shopping:r.shoppingRestored,stamp:r.stampDisabled,rain:r.nonAlcoholCycle.at(-1).title,reset:r.afterAlternative.filters}));
}}
finally{writeFileSync(out+'/metrics.json',JSON.stringify(results,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});