const {chromium}=require('playwright');const fs=require('node:fs/promises');const path=require('node:path');
const base='http://127.0.0.1:4188/workaround.co.kr-platform/';const out=path.join(__dirname,'evidence');
(async()=>{const browser=await chromium.launch({headless:true});const result=[];
try{for(const width of [375,1440]){
 const context=await browser.newContext({viewport:{width,height:width===375?812:900}});const page=await context.newPage();
 await page.addInitScript(()=>{const p={id:'ux105-focus',title:'검수용 가상 초안',slug:'ux105-focus',summary:'가상 문장',bodyMarkdown:'키보드 조작 검수용 본문',tags:[],tables:[],status:'draft',updatedAt:'2026-09-01T00:00:00Z'};localStorage.setItem('workaround-blog-posts',JSON.stringify([p]));localStorage.setItem('workaround-blog-studio-post',p.id);});
 await page.goto(base+'studio');await page.getByRole('textbox',{name:'본문',exact:true}).waitFor();
 if(width===375){await page.getByRole('button',{name:'글 도구',exact:true}).click();await page.getByRole('button',{name:'표 만들기',exact:true}).click();}
 else await page.getByRole('complementary',{name:'글 도구'}).getByRole('button',{name:'표',exact:true}).click();
 const sheet=page.getByRole('dialog');const buttons=sheet.locator('button');await buttons.last().focus();await page.keyboard.press('Tab');
 const wrapForward=await page.evaluate(()=>document.activeElement?.getAttribute('aria-label'));
 await page.keyboard.press('Shift+Tab');const wrapBack=await page.evaluate(()=>document.activeElement?.textContent.trim());
 await page.keyboard.press('Escape');const escape=await page.evaluate(()=>({label:document.activeElement?.getAttribute('aria-label'),text:document.activeElement?.textContent.trim(),dialogOpen:!!document.querySelector('dialog[open]')}));
 await page.goto(base+'mockups/writing-studio.html');await page.getByRole('textbox',{name:'제목',exact:true}).fill('길 위에서 기록을 이어 쓰는 작은 방법');
 const mockupTitle=await page.getByRole('textbox',{name:'제목',exact:true}).evaluate(e=>({tag:e.tagName,width:e.clientWidth,scrollWidth:e.scrollWidth,height:e.clientHeight,scrollHeight:e.scrollHeight}));
 await page.screenshot({path:path.join(out,`${width}-mockup-title.png`)});result.push({width,wrapForward,wrapBack,escape,mockupTitle});await context.close();
}await fs.writeFile(path.join(out,'focus-mockup.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
