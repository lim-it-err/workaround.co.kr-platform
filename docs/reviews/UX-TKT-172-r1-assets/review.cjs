const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { writeFileSync } = require('node:fs');
const { extname, join } = require('node:path');
const publicBase='/workaround.co.kr-platform/';
const distRoot=join(__dirname,'frontend/dist');
const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-172-r1-assets';
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
  let content=await readFile(filePath);if(extname(filePath)==='.js' && request.headers.referer?.includes('arrived-settlement=1'))content=Buffer.from(content.toString().replace('status:"boarding"','status:"arrived"'));response.end(content)
}




(async()=>{
 const server=createServer(serveStaticBuild);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}${publicBase}`;const browser=await chromium.launch({headless:true});const results=[];
 try{for(const width of [375,1440])for(const theme of ['dark','light']){
 const c=await browser.newContext({viewport:{width,height:width===375?812:900},timezoneId:'Asia/Seoul',locale:'ko-KR',reducedMotion:'reduce'});const page=await c.newPage();const r={width,theme,errors:[],api:[]};results.push(r);page.on('pageerror',e=>r.errors.push(e.message));page.on('request',q=>{if(new URL(q.url()).pathname.startsWith('/api'))r.api.push(new URL(q.url()).pathname)});await c.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort());await page.clock.setFixedTime(new Date('2026-10-05T02:30:00+09:00'));await page.addInitScript(t=>localStorage.setItem('workaround-theme',t),theme);
 await page.goto(base+'voyage');await page.getByRole('heading',{name:'중부유럽 순환선',exact:true}).waitFor();await page.screenshot({path:out+`/${width}-${theme}-original-start.png`});r.original={settlementCount:await page.locator('.route-settlement').count(),status:await page.locator('.voyage-route-map').innerText().then(t=>t.slice(0,240)),gauge:await page.locator('.route-gauge--spend').innerText()};await page.locator('.page-scroller').evaluate(e=>e.scrollTop=e.scrollHeight);await page.screenshot({path:out+`/${width}-${theme}-original-end.png`});
 await page.goto(base+'voyage?arrived-settlement=1');await page.getByRole('heading',{name:'여행 목록',exact:true}).waitFor();await page.getByRole('button',{name:/중부유럽 순환선/}).click();await page.locator('.route-settlement').waitFor();await page.screenshot({path:out+`/${width}-${theme}-arrived-start.png`});
 r.arrived=await page.locator('.route-settlement').evaluate(e=>{const rect=e.getBoundingClientRect();const scroller=document.querySelector('.page-scroller');const font=(sel)=>{const x=e.querySelector(sel),s=getComputedStyle(x);return{size:s.fontSize,color:s.color,weight:s.fontWeight}};const amounts=[...e.querySelectorAll('dd,td')].map(x=>x.textContent);return{top:rect.top,height:rect.height,scrollerClient:scroller.clientHeight,text:e.innerText,amounts,fonts:{total:font('strong'),rows:font('td'),excluded:font('li')},tables:[...e.querySelectorAll('table')].map(t=>({name:t.querySelector('caption').innerText,rows:t.querySelectorAll('tbody tr').length,bg:getComputedStyle(t).backgroundColor})),overflow:document.documentElement.scrollWidth-innerWidth};});
 await page.locator('.route-settlement').scrollIntoViewIfNeeded();await page.locator('.route-settlement').screenshot({path:out+`/${width}-${theme}-settlement.png`});await page.locator('.route-settlement__total').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/${width}-${theme}-total-viewport.png`});await page.locator('.route-settlement__excluded').scrollIntoViewIfNeeded();await page.screenshot({path:out+`/${width}-${theme}-excluded-viewport.png`});
 console.log(JSON.stringify({width,theme,original:r.original,arrived:r.arrived,errors:r.errors,api:r.api}));await c.close();
 }}finally{writeFileSync(out+'/metrics.json',JSON.stringify(results,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
