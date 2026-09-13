const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),crypto=require('crypto');
const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-110-r1-assets';fs.mkdirSync(out,{recursive:true});
const base='http://127.0.0.1:4189/workaround.co.kr-platform/';
(async()=>{const browser=await chromium.launch({headless:true});const results=[];
for(const width of [375,1440])for(const theme of ['dark','light']){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});await context.addInitScript(t=>localStorage.setItem('workaround-theme',t),theme);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 const start=Date.now();
 for(const t of [1600,4800,8800]){await page.waitForTimeout(Math.max(0,t-(Date.now()-start)));await page.screenshot({path:path.join(out,`splash-${width}-${theme}-${t}.png`)});
 results.push({width,theme,t,errors,state:await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,phrase:document.querySelector('.flap-values')?.getAttribute('aria-label'),ticker:document.querySelector('.ticker-copy')?.textContent,clippedCells:[...document.querySelectorAll('.flap-cell')].filter(e=>{const p=e.parentElement.getBoundingClientRect(),r=e.getBoundingClientRect();return r.x<p.x-.1||r.right>p.right+.1}).length,smallTargets:[...document.querySelectorAll('button,a')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<40||r.width<40)}).map(e=>({text:e.textContent,rect:{w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}})),heading:document.querySelector('h1')?.textContent,symbols:document.querySelectorAll('.site-loop-symbol').length}))});
 }
 await page.locator('.splash-stage').waitFor({state:'detached'});results.push({width,theme,transitionMs:Date.now()-start});await page.screenshot({path:path.join(out,`junction-${width}-${theme}.png`)});
 await context.close();
}
const ctx=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();await page.goto(base);await page.screenshot({path:path.join(out,'reduced-375.png')});results.push({reduced:await page.evaluate(()=>({running:document.querySelectorAll('.flap-cell.run').length,phrase:document.querySelector('.flap-values').getAttribute('aria-label')}))});
await page.keyboard.press('Tab');results.push({firstTab:await page.locator(':focus').textContent()});await page.keyboard.press('Enter');await page.waitForTimeout(500);results.push({replay:await page.locator('.flap-values').getAttribute('aria-label')});
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));await browser.close();console.log(JSON.stringify(results.filter(x=>x.state?.smallTargets.length||x.state?.clippedCells||x.state?.overflow||x.reduced||x.transitionMs)));
})().catch(e=>{console.error(e);process.exit(1)});
