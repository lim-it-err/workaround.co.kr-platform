const { chromium } = require('playwright');
const { createServer } = require('node:http');
const { readFile, stat } = require('node:fs/promises');
const { writeFileSync } = require('node:fs');
const { extname, join } = require('node:path');
const publicBase='/workaround.co.kr-platform/';
const distRoot=join(__dirname,'frontend/dist');
const out='/Users/imjeonghan/newProject/workaround.co.kr-platform/docs/reviews/UX-TKT-164-r1-assets';
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
 const server=createServer(serveStaticBuild);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}${publicBase}`;
 const browser=await chromium.launch({headless:true});const results=[];
 try{for(const width of [375,1440])for(const theme of ['dark','light']){
  const c=await browser.newContext({viewport:{width,height:width===375?812:900},timezoneId:'Asia/Seoul',reducedMotion:'reduce',acceptDownloads:true});const page=await c.newPage();const r={width,theme,errors:[],states:{}};results.push(r);page.on('pageerror',e=>r.errors.push(e.message));
  await page.addInitScript(({theme})=>{
   const d={id:'ux164-draft',title:'검수용 초안',slug:'ux164-draft',summary:'',bodyMarkdown:'',tags:[],status:'draft',slugLocked:false,createdAt:'2026-09-16T14:59:00Z',updatedAt:'2026-09-16T14:59:00Z',publishedAt:''};
   localStorage.setItem('workaround-blog-posts',JSON.stringify([d]));localStorage.setItem('workaround-blog-studio-post',d.id);localStorage.setItem('workaround-theme',theme);
  },{theme});
  await page.goto(base+'studio');const body=page.getByRole('textbox',{name:'본문',exact:true});await body.waitFor();
  const capture=async name=>{
   r.states[name]=await page.evaluate(()=>{
    const bar=document.querySelector('.writer-bar'),e=document.querySelector('.writer-save'),style=getComputedStyle(e);
    return {text:e.textContent,statusRect:e.getBoundingClientRect().toJSON(),statusClient:e.clientWidth,statusScroll:e.scrollWidth,color:style.color,ellipsis:style.textOverflow,minWidth:style.minWidth,bar:bar.getBoundingClientRect().toJSON(),buttons:[...bar.querySelectorAll('button')].map(b=>({name:b.getAttribute('aria-label')||b.textContent.trim(),rect:b.getBoundingClientRect().toJSON()})),overflow:['html','body','.page-scroller','.writing-room'].map(s=>({s,px:document.querySelector(s).scrollWidth-document.querySelector(s).clientWidth})),dialog:document.querySelector('dialog')?.innerText||null,body:document.querySelector('[aria-label="본문"]')?.value};
   });
   await page.screenshot({path:out+`/${width}-${theme}-${name}.png`});
  };
  await capture('initial');
  await body.fill('저장 상태를 확인하는 검수 전용 문장입니다.');await capture('saving');
  await page.waitForFunction(()=>document.querySelector('.writer-save').textContent.startsWith('저장됨'));await capture('saved');
  await page.evaluate(()=>{const native=Storage.prototype.setItem;window.restore=()=>Storage.prototype.setItem=native;Storage.prototype.setItem=function(k,v){if(k==='workaround-blog-posts')throw new DOMException('quota','QuotaExceededError');return native.call(this,k,v)}});
  await body.fill('저장에 실패해도 이 문장은 편집기에 남아 있어야 합니다.');await page.waitForFunction(()=>document.querySelector('.writer-save').textContent==='저장 실패');await capture('error');
  await page.getByRole('button',{name:'저장 안내와 백업',exact:true}).click();await capture('error-help');
  r.downloadCount=0;page.on('download',()=>r.downloadCount++);await page.getByRole('button',{name:'내 기록 백업',exact:true}).click();await page.getByText('저장 실패를 해결한 뒤 다시 시도해 주세요.',{exact:true}).waitFor();await capture('backup-blocked');r.blockedDownloadCount=r.downloadCount;
  await page.keyboard.press('Escape');r.focusAfterEscape=await page.evaluate(()=>document.activeElement?.getAttribute('aria-label'));
  await page.evaluate(()=>window.restore());await body.fill('저장 복구 확인.');await page.waitForFunction(()=>document.querySelector('.writer-save').textContent.startsWith('저장됨'));await capture('recovered');await page.getByRole('button',{name:'저장 안내와 백업',exact:true}).click();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'내 기록 백업',exact:true}).click();const download=await downloadPromise;r.backupFilename=download.suggestedFilename();r.backupError=await download.failure();await capture('backup-success');
  console.log(JSON.stringify({width,theme,statuses:Object.fromEntries(Object.entries(r.states).map(([k,v])=>[k,{text:v.text,width:v.statusClient,scroll:v.statusScroll,overflow:v.overflow}])),backupError:r.backupError}));await c.close();
 }}finally{writeFileSync(out+'/metrics.json',JSON.stringify(results,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
