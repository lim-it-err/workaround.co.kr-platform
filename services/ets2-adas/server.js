'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const {performance}=require('node:perf_hooks');
const ADAS=require('./controller.js');
const {StuckMonitor}=require('./monitor.js');
const {RecoveryRunner}=require('./recovery.js');
const PORT=Number(process.env.POC_PORT||8765), TOKEN=crypto.randomBytes(24).toString('hex');
const python=process.env.POC_PYTHON||'C:\\Users\\user\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe';
let telemetry={connected:false},receivedAt=0,armed=false,armedAt=0,armToken=0,maneuver=null,pulse=0,pulseUntil=0,lastTick=performance.now(),pilotLease=0;
let pendingArm=false,queued=null,laneAssistAcknowledgedOff=false,lastReason='게임 연결 대기',eventId=0,events=[];
const startedAt=new Date().toISOString(), startedMono=performance.now();
const monitor=new StuckMonitor();monitor.enable();
let captureState={available:false,reason:'ETS2 화면 캡처 시작 중'},frameBuffer=null,frameId=0;
const runtimeDir=path.join(__dirname,'runtime');fs.mkdirSync(runtimeDir,{recursive:true});
const logEvent=(type,message)=>{
 const event={id:++eventId,time:new Date().toISOString(),type,message};events.unshift(event);events=events.slice(0,80);
 try{const file=path.join(runtimeDir,'events.ndjson');if(fs.existsSync(file)&&fs.statSync(file).size>1024*1024)fs.renameSync(file,path.join(runtimeDir,'events.previous.ndjson'));fs.appendFileSync(file,JSON.stringify(event)+'\n');}catch(e){console.error('Event log:',e.message);}
};
const recovery=new RecoveryRunner(__dirname,python,logEvent);
const capture=spawn(python,[path.join(__dirname,'capture.py')],{cwd:__dirname,windowsHide:true,stdio:['pipe','pipe','pipe']});
let captureBuffer='';
capture.stdout.on('data',chunk=>{
 captureBuffer+=chunk;let split;
 while((split=captureBuffer.indexOf('\n'))>=0){const line=captureBuffer.slice(0,split);captureBuffer=captureBuffer.slice(split+1);
  try{const value=JSON.parse(line);
   if(value.type==='stop'){monitor.disable('F8로 감시·복구 중단');recovery.cancel();stop('F8로 커스텀 제어 중단');}
   else if(value.type==='frame'){frameBuffer=Buffer.from(value.jpeg,'base64');captureState={available:true,at:value.at,receivedAt:Date.now(),width:value.width,height:value.height,pid:value.pid,id:++frameId};}
   else if(value.type==='status'){captureState=value;frameBuffer=null;}
  }catch(e){console.error('Capture data:',e.message);}
 }
 if(captureBuffer.length>4000000)captureBuffer='';
});
capture.on('error',e=>{captureState={available:false,reason:'캡처 실행 실패: '+e.message};});
capture.on('exit',()=>{captureState={available:false,reason:'캡처 프로그램 종료'};frameBuffer=null;});
capture.stderr.on('data',d=>console.error('Capture:',String(d)));
const bridge=spawn(python,[path.join(__dirname,'bridge.py')],{cwd:__dirname,windowsHide:true,stdio:['pipe','pipe','pipe']});
bridge.on('error',e=>{lastReason='연결 프로그램 실행 실패: '+e.message;logEvent('error',lastReason);});
bridge.on('exit',()=>{armed=false;telemetry={connected:false};lastReason='연결 프로그램 종료';});
bridge.stderr.on('data',d=>{console.error(String(d));lastReason='연결 프로그램 오류';});
let lineBuffer='';
bridge.stdout.on('data',chunk=>{
 lineBuffer+=chunk;
 let split;
 while((split=lineBuffer.indexOf('\n'))>=0) {
  const line=lineBuffer.slice(0,split);lineBuffer=lineBuffer.slice(split+1);
  try {const incoming=JSON.parse(line);telemetry=incoming;receivedAt=performance.now();} catch{}
 }
});
function connected(){return telemetry.connected&&performance.now()-receivedAt<400&&telemetry.channelsReady&&telemetry.inputReady;}
function healthy(){return connected()&&!telemetry.paused;}
function stop(reason){if(armed||maneuver||pendingArm)logEvent('stop',reason);armed=false;pendingArm=false;queued=null;maneuver=null;pulse=0;lastReason=reason;}
function press(bits){pulse=bits;pulseUntil=performance.now()+140;}
function action(body) {
 const name=body.action;
 if(name==='stop'){monitor.disable();recovery.cancel();stop('사용자 제어·감시 중단');return;}
 if(name==='monitorStart'){if(recovery.running)throw new Error('복구 실행 중입니다.');monitor.enable();logEvent('monitor','무기한 감시 시작 · 1km/h 미만 120초');return;}
 if(name==='monitorStop'){monitor.disable();recovery.cancel();logEvent('monitor','감시·복구 중단');return;}
 if(name==='shutdown'){setTimeout(shutdown,100);return;}
 if(name==='recoveryNow'){
  if(recovery.running)throw new Error('복구 실행 중입니다.');
  if(!connected()||Math.abs(telemetry.speedMps)*3.6>=1)throw new Error('게임 연결 후 1km/h 미만에서만 복구할 수 있습니다.');
  monitor.disable('수동 복구 검증 중');stop('수동 복구 요청');
  const request={schemaVersion:1,id:crypto.randomUUID(),reason:'manual-recovery',at:new Date().toISOString(),telemetry:{...telemetry},frameAvailable:!!frameBuffer};
  recovery.run(request).then(result=>{lastReason=result.reason;logEvent(result.ok?'recovered':'recovery-blocked',result.reason);});return;
 }
 if(recovery.running&&name!=='lease')throw new Error('이동·수리 중에는 주행 명령을 보낼 수 없습니다.');
 if(name==='lease'){pilotLease=performance.now();return;}
 if(name==='arm') {
  if(!connected())throw new Error('ETS2 프로필과 트럭을 먼저 불러오세요.');
  armToken=(crypto.randomBytes(4).readUInt32LE()||1);armed=healthy();pendingArm=!armed;maneuver=null;queued=null;pilotLease=performance.now();armedAt=pilotLease;
  lastReason=pendingArm?'게임으로 복귀하면 명령 준비 · 30초 안에 복귀하세요':'명령 준비 · 내장 차선 유지/ACC 사용';logEvent('arm',lastReason);return;
 }
 if((!armed&&!pendingArm)||!connected())throw new Error('게임 연결 후 명령 준비를 켜세요.');
 if(telemetry.paused) {
  if(!['cruise','plus','minus','laneToggle','laneChange'].includes(name))throw new Error('지원하지 않는 명령입니다.');
  if(name==='laneChange'&&(body.clearRoad!==true||body.laneAssistOff!==true))throw new Error('빈 직선 구간과 차선유지 보조 해제를 확인하세요.');
  queued={...body};pendingArm=true;armed=false;armedAt=performance.now();
  lastReason='명령 예약: 게임 복귀 시 실행 · 중단 버튼으로 취소';logEvent('queued',lastReason);return;
 }
 if(name==='cruise') {if(telemetry.cruiseMps===0&&(telemetry.speedMps<8.33||telemetry.speedMps>110/3.6))throw new Error('30~110km/h에서 ACC를 설정하세요.');press(1);}
 else if(name==='plus'){if(telemetry.cruiseMps<=0||telemetry.cruiseMps*3.6+5>110.1)throw new Error('ACC가 꺼져 있거나 110km/h 상한입니다.');press(4);}
 else if(name==='minus')press(8);
 else if(name==='laneToggle'){if(maneuver)throw new Error('차선 변경 중에는 보조 모드를 바꿀 수 없습니다.');press(16);laneAssistAcknowledgedOff=false;}
 else if(name==='laneChange') {
  if(maneuver)throw new Error('차선 변경이 진행 중입니다.');
  if(body.clearRoad!==true||body.laneAssistOff!==true)throw new Error('빈 직선 구간과 게임 내 차선유지 보조 해제를 먼저 확인하세요.');
  if(telemetry.inputBrake>.05)throw new Error('브레이크 입력 중입니다.');
  laneAssistAcknowledgedOff=true;
  maneuver=ADAS.beginLaneChange(telemetry,body.direction,{widthM:Number(body.widthM)||3.6,durationS:7});
  lastReason=(body.direction==='left'?'왼쪽':'오른쪽')+' 차선 변경 실험';logEvent('maneuver',lastReason);
 } else throw new Error('지원하지 않는 명령입니다.');
}
const timer=setInterval(()=>{
 const now=performance.now(),dt=(now-lastTick)/1000;lastTick=now;
 if(pendingArm && (!connected()||now-armedAt>30000))stop('준비 대기 만료 또는 연결 끊김');
 if(pendingArm && healthy()) {pendingArm=false;armed=true;armedAt=now;const next=queued;queued=null;lastReason='명령 준비';if(next){try{action(next);}catch(e){stop(e.message);}}}
 if(armed && !healthy())stop('게임 정지 또는 연결 지연');
 // Native stop is latched until a new explicit arm token. Allow two bridge frames after arming.
 if(armed && telemetry.stopLatched && now-armedAt>500)stop('F8·브레이크 또는 명령 만료로 중단');
 const fresh=now-receivedAt<400;
 if(monitor.tick(now,telemetry,fresh,captureState.pid||null)) {
  stop('2분 정체 · 커스텀 주행 제어 중단');
  logEvent('stuck','1km/h 미만 120초 · 이동·수리 요청');
  const request={schemaVersion:1,id:crypto.randomUUID(),reason:'low-speed-120s',at:new Date().toISOString(),telemetry:{...telemetry},frameAvailable:!!frameBuffer};
  fs.writeFile(path.join(runtimeDir,'last-recovery-request.json'),JSON.stringify(request,null,2),()=>{});
  recovery.run(request).then(result=>{monitor.result(performance.now(),result.ok,result.reason);logEvent(result.ok?'recovered':'recovery-blocked',result.reason);});
 }
 let steering=0,buttons=now<pulseUntil?pulse:0,lateralActive=false;
 if(armed&&maneuver) {
  const result=ADAS.laneChangeStep(telemetry,maneuver,dt);maneuver=result.memory;
  steering=result.steering;lateralActive=result.status==='changing';
  if(lateralActive)buttons|=maneuver.target>0?32:64;
  else {lastReason=result.status==='complete'?'차선 변경 완료 · 내장 차선유지 보조를 다시 켜세요':'경로 오차/시간 초과 · 직접 조향하세요';logEvent(result.status,lastReason);maneuver=null;}
 }
 const command={armToken,armed,steering,buttons:armed?buttons:0,lateralActive};
 if(bridge.stdin.writable && !bridge.stdin.destroyed)bridge.stdin.write(JSON.stringify(command)+'\n',()=>{});
},40);
bridge.stdin.on('error',()=>stop('연결 프로그램 연결 끊김'));
const files={'/':'index.html','/app.js':'app.js','/controller.js':'controller.js','/styles.css':'styles.css'};
function reply(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
 const allowedHost=req.headers.host;
 if(![`127.0.0.1:${PORT}`,`localhost:${PORT}`].includes(allowedHost))return reply(res,403,{error:'Loopback host only'});
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 if(req.method==='GET' && req.url==='/api/state')return reply(res,200,{telemetry,armed,pendingArm,maneuver,reason:lastReason,events,token:TOKEN,version:2,continuous:true,startedAt,uptimeSeconds:Math.floor((performance.now()-startedMono)/1000),monitor:monitor.state(performance.now()),capture:{...captureState,available:captureState.available&&Date.now()-captureState.receivedAt<3500},recovery:recovery.state()});
 if(req.method==='GET' && req.url.split('?')[0]==='/api/frame.jpg') {
  if(!frameBuffer||!captureState.available||Date.now()-captureState.receivedAt>3500)return reply(res,503,{error:'신선한 ETS2 화면 없음'});
  res.writeHead(200,{'Content-Type':'image/jpeg','Cache-Control':'no-store','Content-Length':frameBuffer.length});res.end(frameBuffer);return;
 }
 if(req.method==='POST' && req.url==='/api/action') {
  if(req.headers.origin!==`http://${allowedHost}`||req.headers['x-poc-token']!==TOKEN||!String(req.headers['content-type']).startsWith('application/json'))return reply(res,403,{error:'요청 출처 확인 실패'});
  let body='';
  try {for await(const part of req){body+=part;if(body.length>2048)throw new Error('요청이 너무 큽니다.');}action(JSON.parse(body));reply(res,200,{ok:true});}
  catch(e){reply(res,400,{error:e.message});}return;
 }
 if(req.method==='GET' && files[req.url]) {
  const filename=files[req.url],type=filename.endsWith('.js')?'text/javascript':filename.endsWith('.css')?'text/css':'text/html';
  res.writeHead(200,{'Content-Type':type+'; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});
  fs.createReadStream(path.join(__dirname,filename)).pipe(res);return;
 }
 reply(res,404,{error:'Not found'});
});
server.listen(PORT,'127.0.0.1',()=>{fs.writeFileSync(path.join(runtimeDir,'server.pid'),String(process.pid));console.log(`ETS2 PoC: http://127.0.0.1:${PORT}`);logEvent('start','무기한 로컬 감시 시작 · 브라우저를 닫아도 계속 실행');});
server.on('error',e=>{console.error(e.message);shutdown();});
let shuttingDown=false;
function shutdown(){if(shuttingDown)return;shuttingDown=true;clearInterval(timer);monitor.disable();recovery.cancel();stop('프로그램 종료');bridge.stdin.end();capture.stdin.end();server.close();setTimeout(()=>{bridge.kill();capture.kill();process.exit(0);},1200).unref();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
