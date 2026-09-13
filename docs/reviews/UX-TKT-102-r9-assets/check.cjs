const {chromium}=require('playwright');
const fs=require('fs'), path=require('path');
const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-102-r9-assets';
const base='http://127.0.0.1:4189/workaround.co.kr-platform/mockups/';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true}); const results=[];
 for(const width of [375,390,1440]) for(const colorScheme of ['dark','light']){
  const context=await browser.newContext({viewport:{width,height:900},colorScheme});const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const file of ['splash','loop-symbol','index']){
   await page.goto(base+file+'.html');
   if(file==='splash')await page.evaluate(()=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=0}));
   await page.screenshot({path:path.join(out,`${file}-${width}-${colorScheme}.png`),fullPage:true});
   const metrics=await page.evaluate(()=>({overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),scripts:document.scripts.length,smallLinks:[...document.querySelectorAll('a')].filter(a=>{const r=a.getBoundingClientRect();return r.height<40||r.width<40}).map(a=>a.textContent),banner:document.querySelectorAll('.mockup-banner').length,
   glyphMismatch:[...document.querySelectorAll('.flap-cell')].filter(c=>{const halves=c.querySelectorAll(':scope > .flap-half b');return Math.abs(halves[0].getBoundingClientRect().y-halves[1].getBoundingClientRect().y)>.1}).length,
   symbolSizes:[...document.querySelectorAll('.loop')].map(s=>({width:s.getBoundingClientRect().width,height:s.getBoundingClientRect().height})),cells:document.querySelectorAll('.flap-cell').length}));
   results.push({width,colorScheme,file,...metrics,errors});
   if(file==='splash'&&colorScheme==='dark'){
    for(const t of [3300,4400,7200,8100,10050]){
     await page.evaluate(t=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=t}),t);
     await page.screenshot({path:path.join(out,`splash-${width}-${t}ms.png`)});
     results.push({width,t,animation:await page.evaluate(()=>({ticker:[...document.querySelectorAll('.ticker span')].filter(e=>+getComputedStyle(e).opacity>0).map(e=>e.textContent),firstTop:getComputedStyle(document.querySelector('.second .top-flip')).transform,lastTop:getComputedStyle(document.querySelector('.flap-cell:last-child .second .top-flip')).transform,hinge:getComputedStyle(document.querySelector('.flap-cell'),'::after').height,progress:getComputedStyle(document.querySelector('.progress'),'::after').transform}))});
    }
   }
  }
  await context.close();
 }
 const ctx=await browser.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'}); const page=await ctx.newPage();await page.goto(base+'splash.html');await page.screenshot({path:path.join(out,'splash-375-reduced.png')});
 results.push({reducedMotion:await page.evaluate(()=>({animations:document.getAnimations().length,changeDisplay:getComputedStyle(document.querySelector('.change')).display,ticker:getComputedStyle(document.querySelector('.ticker span')).opacity}))});
 await page.goto(base+'index.html'); const links=await page.locator('a').evaluateAll(aa=>aa.map(a=>({href:a.href,label:a.textContent})));
 for(const link of links){await page.goto(base+'index.html');await page.locator(`a[href="${link.href.split('/').pop()}"]`).click();results.push({link:link.label,status:(await page.title()),url:page.url()});}
 await page.goto(base+'loop-symbol.html');await page.keyboard.press('Tab');const focused=await page.locator(':focus').textContent();await page.keyboard.press('Enter');results.push({keyboard:{focused,url:page.url()}});
 // 実時間による10秒シーケンス確認。フリーズ検査とは別。
 await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(base+'splash.html');const start=Date.now();
 for(const t of [0,4400,8100,10100]){await page.waitForTimeout(Math.max(0,t-(Date.now()-start)));results.push({realtime:Date.now()-start,values:await page.evaluate(()=>({ticker:[...document.querySelectorAll('.ticker span')].filter(x=>+getComputedStyle(x).opacity>0).map(x=>x.textContent),second:getComputedStyle(document.querySelector('.second')).visibility,third:getComputedStyle(document.querySelector('.third')).visibility,progress:getComputedStyle(document.querySelector('.progress'),'::after').transform}))});}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));await browser.close();console.log(JSON.stringify({screens:results.filter(x=>x.file).length,overflow:results.filter(x=>x.overflow),smallLinks:results.filter(x=>x.smallLinks?.length),glyphMismatch:results.filter(x=>x.glyphMismatch),errors:results.filter(x=>x.errors?.length),out}));
})().catch(e=>{console.error(e);process.exit(1)});
