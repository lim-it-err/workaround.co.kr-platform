'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawn}=require('node:child_process');

// Replaceable boundary: a local recovery adapter consumes one JSON request and
// returns NDJSON progress + a final moved/repaired receipt. No shell execution.
class RecoveryRunner {
 constructor(root,python,log){this.root=root;this.python=python;this.log=log;this.child=null;this.running=false;this.generation=0;this.cancelChild=null;}
 config(){try{return JSON.parse(fs.readFileSync(path.join(this.root,'recovery.config.json'),'utf8').replace(/^\uFEFF/,''));}catch{return {};}}
 state(){const c=this.config();return {running:this.running,configured:!!c.executable,manualOnly:!!c.manualOnly,adapter:c.name||null,reason:c.executable?(c.manualOnly?'견인 입력 검증 중 · 자동 복구 꺼짐':'로컬 복구 어댑터 설정됨'):'실제 견인·수리 메뉴 확인 후 어댑터 연결 필요'};}
 run(request){
  const config=this.config();
  if(config.manualOnly&&request.reason!=='manual-recovery')return Promise.resolve({ok:false,reason:'복구 입력 검증 중 · 자동 견인·수리는 아직 활성화하지 않았습니다.'});
  if(!config.executable)return Promise.resolve({ok:false,reason:'2분 정체 감지 완료 · 견인·수리 화면 미확인으로 자동 복구 대기'});
  if(this.running)return Promise.resolve({ok:false,reason:'이미 복구 중입니다.'});
  const executable=config.executable==='@python'?this.python:config.executable;
  if(!path.isAbsolute(executable)||!Array.isArray(config.args)||config.args.some(x=>typeof x!=='string'))return Promise.resolve({ok:false,reason:'복구 설정의 실행 경로·인수가 잘못되었습니다.'});
  this.running=true;const generation=++this.generation;
  return new Promise(resolve=>{
   let output='',receipt=null,finished=false,cancelReason=null,killTimer=null;
   const done=(ok,reason)=>{if(finished)return;finished=true;clearTimeout(timer);clearTimeout(killTimer);if(this.child===child){this.child=null;this.cancelChild=null;this.running=false;}resolve({ok,reason});};
   const child=spawn(executable,config.args,{cwd:this.root,windowsHide:true,shell:false,stdio:['pipe','pipe','pipe']});this.child=child;
   this.cancelChild=(reason)=>{if(finished||cancelReason)return;cancelReason=reason;child.stdin.write(JSON.stringify({action:'cancel'})+'\n',()=>{});killTimer=setTimeout(()=>child.kill(),1000);};
   const timer=setTimeout(()=>this.cancelChild?.('이동·수리 180초 시간 초과 · 확인 필요'),180000);
   child.on('error',e=>done(false,'복구 실행 실패: '+e.message));
   child.stdin.on('error',()=>{});child.stdin.write(JSON.stringify(request)+'\n');
   child.stderr.on('data',data=>this.log('recovery-error',String(data).slice(0,500)));
   child.stdout.on('data',data=>{
    output+=data;if(output.length>65536){this.cancelChild?.('복구 응답 크기 초과');return;}
    let i;while((i=output.indexOf('\n'))>=0){const line=output.slice(0,i);output=output.slice(i+1);
     try{const r=JSON.parse(line);if(r.type==='progress')this.log('recovery',String(r.message).slice(0,500));if(r.type==='result')receipt=r;}catch{}
    }
   });
   child.on('close',code=>{
    if(cancelReason)return done(false,cancelReason);
    if(generation!==this.generation)return done(false,'사용자 복구 중단');
    const valid=code===0&&receipt?.requestId===request.id&&receipt?.moved===true&&receipt?.repaired===true;
    done(valid,valid?'어댑터가 이동·수리 완료 보고 · 주행 재개는 직접 확인':receipt?.reason||'이동·수리 완료를 확인하지 못했습니다.');
   });
  });
 }
 cancel(){this.generation++;this.cancelChild?.('사용자 복구 중단');}
}
module.exports={RecoveryRunner};
