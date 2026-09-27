const {chromium}=require('playwright');const fs=require('node:fs/promises');const path=require('node:path');
const out=path.join(__dirname,'evidence');const base=process.env.MOCKUP_BASE||'http://127.0.0.1:4189/workaround.co.kr-platform/mockups/';
(async()=>{await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true});const report={at:new Date().toISOString(),browser:browser.version(),cases:[]};try{
for(const width of [375,390,1440])for(const theme of ['dark','light']){
 const context=await browser.newContext({viewport:{width,height:900},colorScheme:theme});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'home.html');await page.locator('.network').waitFor();
 const result=await page.evaluate(()=>{
 const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
 const svg=document.querySelector('.network'),sr=rect(svg);
 const labels=[...svg.querySelectorAll('text')].map(e=>({text:e.textContent.trim(),...rect(e),font:parseFloat(getComputedStyle(e).fontSize)*e.getScreenCTM().a}));
 const overlaps=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){let a=labels[i],b=labels[j];if(Math.min(a.right,b.right)-Math.max(a.x,b.x)>1 && Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y)>1)overlaps.push([a.text,b.text]);}
 const outside=labels.filter(a=>a.x<sr.x-.5||a.right>sr.right+.5||a.y<sr.y-.5||a.bottom>sr.bottom+.5);
 const links=[...document.querySelectorAll('a')].map(e=>({text:e.textContent.trim(),href:e.getAttribute('href'),...rect(e)}));
 const branches=[...document.querySelectorAll('.branch')].map(e=>({route:e.dataset.route,stops:e.querySelectorAll('.stop').length,length:e.querySelector('.branch-track').getTotalLength(),color:getComputedStyle(e.querySelector('.branch-track')).stroke}));
 return {width:innerWidth,overflow:document.documentElement.scrollWidth-innerWidth,svg:sr,labels,overlaps,outside,links,smallTargets:links.filter(e=>e.w<40||e.h<40),branches,transfers:document.querySelectorAll('.transfer').length,loop:{stroke:getComputedStyle(document.querySelector('.loop')).stroke,width:getComputedStyle(document.querySelector('.loop')).strokeWidth},layout:getComputedStyle(document.querySelector('.layout')).gridTemplateColumns};
 });
 result.theme=theme;result.errors=errors;report.cases.push(result);
 await page.screenshot({path:path.join(out,`home-${width}-${theme}.png`),fullPage:true});await page.locator('.map-hero').screenshot({path:path.join(out,`map-${width}-${theme}.png`)});
 console.log(JSON.stringify({width,theme,overlaps:result.overlaps,outside:result.outside.map(l=>l.text),minFont:Math.min(...result.labels.map(l=>l.font)),smallTargets:result.smallTargets.map(l=>l.text),overflow:result.overflow}));
 await context.close();
}
await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
