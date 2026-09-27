const {chromium} = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const base = process.env.STUDIO_TEST_URL || 'http://127.0.0.1:4188/workaround.co.kr-platform/';
const out = path.join(__dirname,'evidence');
const report={url:base,checkedAt:new Date().toISOString(),cases:[],errors:[]};
async function metrics(page) {
 return page.evaluate(()=>{
  const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight};};
  const visible=e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
  const scope=document.querySelector('dialog[open]')||document.querySelector('.writing-room');
  const buttons=[...scope.querySelectorAll('button')].filter(visible).map(e=>({text:e.getAttribute('aria-label')||e.textContent.trim(),...box(e)}));
  return {viewport:{width:innerWidth,height:innerHeight},theme:document.querySelector('[data-theme]')?.getAttribute('data-theme'),
   documentOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   scroller:box(document.querySelector('.page-scroller')),writer:box(document.querySelector('.writer-page')),
   body:box(document.querySelector('.writer-body')),title:box(document.querySelector('.writer-title')),
   titleText:document.querySelector('.writer-title').value,
   tableScroll:document.querySelector('.writer-table-editor-scroll')?box(document.querySelector('.writer-table-editor-scroll')):null,
   tableInputs:[...document.querySelectorAll('.writer-table-editor input')].map(e=>({label:e.getAttribute('aria-label'),...box(e)})),
   active:document.activeElement?.getAttribute('aria-label')||document.activeElement?.textContent?.trim()?.slice(0,50),
   primary:scope.querySelectorAll('.primary-button').length,buttons,smallTargets:buttons.filter(b=>b.width<40||b.height<40)};
 });
}
async function setup(browser,width,theme){
 const context=await browser.newContext({viewport:{width,height:width===375?812:900},colorScheme:theme});
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
 await page.addInitScript(({theme})=>{
  if(sessionStorage.getItem('ux105-seeded'))return;
  const post={id:'ux105-synthetic',title:'길 위에서 기록을 이어 쓰는 작은 방법',slug:'ux105-synthetic',summary:'검수용 가상 기록',bodyMarkdown:'오늘의 기록\n\n이 문장은 UX 검수용 가상 본문입니다.\n\n사진과 표를 넣은 뒤 다음 문단을 이어 씁니다.',tags:[],status:'draft',slugLocked:false,createdAt:'2026-09-01T00:00:00.000Z',updatedAt:'2026-09-01T00:00:00.000Z',publishedAt:'',tables:[]};
  localStorage.setItem('workaround-blog-posts',JSON.stringify([post]));
  localStorage.setItem('workaround-blog-studio-post',post.id);
  localStorage.setItem('workaround-theme',theme);
  localStorage.setItem('workaround-blog-studio-view','edit');
  sessionStorage.setItem('ux105-seeded','1');
 },{theme});
 await page.goto(base+'studio');
 await page.getByRole('textbox',{name:'본문',exact:true}).waitFor();
 return {context,page};
}
async function photoFixture(page){
 const data=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=192;c.height=128;
  const ctx=c.getContext('2d');const data=ctx.createImageData(c.width,c.height);
  for(let i=0;i<data.data.length;i+=4){let n=i/4;data.data[i]=(n*17)%256;data.data[i+1]=(n*53+Math.floor(n/192)*11)%256;data.data[i+2]=(n*97)%256;data.data[i+3]=255;}
  ctx.putImageData(data,0,0);return c.toDataURL('image/png').split(',')[1];
 });
 return {name:'검수용-가상사진.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')};
}
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true}); report.browser=browser.version();
 try {
 for(const width of [375,1440]) for(const theme of ['dark','light']) {
  const {context,page}=await setup(browser,width,theme);
  const stem=`${width}-${theme}`; const item={width,theme};report.cases.push(item);
  item.baseline=await metrics(page);await page.screenshot({path:path.join(out,`${stem}-baseline.png`)});
  const body=page.getByRole('textbox',{name:'본문',exact:true});
  await body.evaluate(e=>{e.focus();e.setSelectionRange(e.value.length,e.value.length);e.scrollTop=e.scrollHeight;});
  if(width===375)await page.getByRole('button',{name:'글 도구',exact:true}).click();
  item.tools=await metrics(page);await page.screenshot({path:path.join(out,`${stem}-tools.png`)});
  const toolScope=width===375?page.getByRole('dialog'):page.getByRole('complementary',{name:'글 도구'});
  await toolScope.getByRole('button',{name:width===375?'표 만들기':'표',exact:true}).click();
  const sheet=page.getByRole('dialog');
  await sheet.getByRole('textbox',{name:'표 이름',exact:true}).fill('검수용 일정');
  await sheet.getByRole('textbox',{name:'열 1 제목',exact:true}).fill('항목');
  await sheet.getByRole('textbox',{name:'열 2 제목',exact:true}).fill('내용');
  await sheet.getByRole('textbox',{name:'1행 1열',exact:true}).fill('첫 기록');
  await sheet.getByRole('textbox',{name:'1행 2열',exact:true}).fill('가상 메모');
  item.tableTwoColumns=await metrics(page);await page.screenshot({path:path.join(out,`${stem}-table-2cols.png`)});
  await sheet.getByRole('button',{name:'열 추가',exact:true}).click();
  item.tableThreeColumns=await metrics(page);await page.screenshot({path:path.join(out,`${stem}-table-3cols.png`)});
  await sheet.getByRole('button',{name:'열 삭제',exact:true}).click();
  await sheet.getByRole('button',{name:'표 삽입',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.writer-save').textContent.startsWith('저장됨'));
  item.insertedTable={body:await body.inputValue(),metrics:await metrics(page)};
  await page.screenshot({path:path.join(out,`${stem}-table-inserted.png`)});
  await body.evaluate(e=>{e.focus();e.setSelectionRange(e.value.length,e.value.length);e.scrollTop=e.scrollHeight;});
  if(width===375)await page.getByRole('button',{name:'글 도구',exact:true}).click();
  const photoScope=width===375?page.getByRole('dialog'):page.getByRole('complementary',{name:'글 도구'});
  const fixture=await photoFixture(page);
  const chooserPromise=page.waitForEvent('filechooser');
  await photoScope.getByRole('button',{name:width===375?'사진 첨부':'사진',exact:true}).click();
  await (await chooserPromise).setFiles(fixture);
  await page.getByText('사진을 본문에 첨부했습니다.',{exact:true}).waitFor();
  await page.waitForFunction(()=>document.querySelector('.writer-save').textContent.startsWith('저장됨'));
  item.photo={fixtureBytes:fixture.buffer.length,bodyCharacters:(await body.inputValue()).length,metrics:await metrics(page)};
  await page.screenshot({path:path.join(out,`${stem}-photo-inserted.png`)});
  await body.evaluate(e=>{e.focus();e.setSelectionRange(e.value.length,e.value.length);e.scrollTop=e.scrollHeight;});await body.press('Enter');await body.press('Enter');await body.pressSequentially('검수용 다음 문단입니다.');
  await page.waitForFunction(()=>document.querySelector('.writer-save').textContent.startsWith('저장됨'));item.continueWriting=await metrics(page);await page.screenshot({path:path.join(out,`${stem}-after-photo-writing.png`)});
  await page.getByRole('button',{name:'미리보기',exact:true}).click();
  item.preview={tables:await page.locator('.writer-preview table').count(),images:await page.locator('.writer-preview img').count(),metrics:await metrics(page)};
  await page.screenshot({path:path.join(out,`${stem}-preview.png`)});
  await page.reload();await page.locator('.writer-preview table').waitFor({state:'attached'});if(await page.getByRole('button',{name:'미리보기',exact:true}).count())await page.getByRole('button',{name:'미리보기',exact:true}).click();await page.locator('.writer-preview table').waitFor();
  item.restore={tables:await page.locator('.writer-preview table').count(),images:await page.locator('.writer-preview img').count()};
  if(width===375){
   await page.getByRole('button',{name:'편집',exact:true}).click();
   await page.getByRole('button',{name:'글 도구',exact:true}).click();
   await page.keyboard.press('Escape');
   item.escapeFocus=await page.evaluate(()=>document.activeElement?.getAttribute('aria-label'));
  }
  await context.close();
  await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
  console.log('Captured',stem,'targets <40:',item.baseline.smallTargets.map(b=>`${b.text} ${b.width.toFixed(1)}x${b.height.toFixed(1)}`).join(', '));
 }
 } finally {await browser.close();await fs.writeFile(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');}
 console.log('Done',report.cases.length,'cases; page errors',report.errors.length);
})().catch(e=>{console.error(e);process.exitCode=1});
