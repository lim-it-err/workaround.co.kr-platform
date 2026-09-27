const test=require('node:test');
const assert=require('node:assert/strict');
const {StuckMonitor}=require('../monitor.js');
const {RecoveryRunner}=require('../recovery.js');
const fs=require('node:fs');const path=require('node:path');
const still={connected:true,channelsReady:true,paused:false,speedMps:0};
function step(m,start,end,telemetry=still,session=123){let fired=0;for(let at=start;at<=end;at+=1000)fired+=m.tick(at,telemetry,true,session)?1:0;return fired;}
test('120 continuous seconds produces exactly one recovery request without browser activity',()=>{
 const m=new StuckMonitor();m.enable();assert.equal(step(m,0,119000),0);assert.equal(m.tick(120000,still,true,123),true);assert.equal(step(m,121000,300000),0);assert.equal(m.attempts,1);
});
test('pause and loss of telemetry reset the full interval',()=>{
 for(const patch of [{paused:true},{connected:false},{speedMps:NaN},{channelsReady:false}]){
  const m=new StuckMonitor();m.enable();step(m,0,119000);m.tick(120000,{...still,...patch},true,123);assert.equal(step(m,121000,240000),0);assert.equal(m.tick(241000,still,true,123),true);
 }
});
test('movement in either direction resets the low speed interval',()=>{
 for(const speedMps of [1/3.6,3,-3]){const m=new StuckMonitor();m.enable();step(m,0,119000);m.tick(120000,{...still,speedMps},true,123);assert.equal(step(m,121000,240000),0);assert.equal(m.tick(241000,still,true,123),true);}
});
test('process stalls, stale data, changed game process cannot count as 2 minutes',()=>{
 const m=new StuckMonitor();m.enable();step(m,0,119000);assert.equal(m.tick(300000,still,true,123),false);assert.equal(m.elapsedMs,0);
 step(m,301000,400000);m.tick(401000,still,false,123);assert.equal(m.elapsedMs,0);
 step(m,402000,501000);m.tick(502000,still,true,456);assert.equal(m.elapsedMs,0);
});
test('failed recovery stays blocked; stop cancels monitoring; success enforces cooldown',()=>{
 const m=new StuckMonitor();m.enable();step(m,0,120000);m.result(120000,false,'not calibrated');assert.equal(step(m,121000,500000),0);assert.equal(m.phase,'blocked');
 m.disable();assert.equal(step(m,501000,700000),0);m.enable();step(m,701000,821000);m.result(821000,true);assert.equal(step(m,822000,1120000),0);assert.equal(m.phase,'cooldown');assert.equal(step(m,1121000,1240000),0);assert.equal(m.tick(1241000,still,true,123),true);
});
test('missing recovery adapter reports incomplete, never pretends a repair happened',async()=>{
 const runner=new RecoveryRunner(path.resolve(__dirname,'missing-adapter'),'unused',()=>{});const result=await runner.run({id:'x'});assert.equal(result.ok,false);assert.equal(runner.running,false);
});
test('adapter must report matching request, move AND repair and clean exit',async()=>{
 const root=path.resolve(__dirname,'../.build/recovery-test');fs.mkdirSync(root,{recursive:true});
 for(const mode of ['ok','wrong-id','no-repair','exit-error']){
  const script=`const rl=require('node:readline').createInterface({input:process.stdin});rl.once('line',line=>{const r=JSON.parse(line);console.log(JSON.stringify({type:'result',requestId:${mode==='wrong-id'?"'other'":'r.id'},moved:true,repaired:${mode==='no-repair'?'false':'true'}}));rl.close();process.stdin.destroy();process.exitCode=${mode==='exit-error'?1:0};});`;
  fs.writeFileSync(path.join(root,'recovery.config.json'),JSON.stringify({executable:process.execPath,args:['-e',script]}));
  const runner=new RecoveryRunner(root,'unused',()=>{});const result=await runner.run({id:'test-'+mode});assert.equal(result.ok,mode==='ok');assert.equal(runner.running,false);
 }
});
test('calibration adapter cannot be triggered by the unattended monitor',async()=>{
 const root=path.resolve(__dirname,'../.build/manual-recovery-test');fs.mkdirSync(root,{recursive:true});
 fs.writeFileSync(path.join(root,'recovery.config.json'),JSON.stringify({manualOnly:true,executable:process.execPath,args:['-e','process.exit(88)']}));
 const runner=new RecoveryRunner(root,'unused',()=>{});
 const result=await runner.run({id:'automatic',reason:'low-speed-120s'});
 assert.equal(result.ok,false);assert.equal(runner.running,false);assert.match(result.reason,/자동/);
});
test('cancellation reaches the adapter so it can release input before exiting',async()=>{
 const root=path.resolve(__dirname,'../.build/cancel-recovery-test');fs.mkdirSync(root,{recursive:true});
 const script=`const rl=require('node:readline').createInterface({input:process.stdin});let request;rl.on('line',line=>{const v=JSON.parse(line);if(!request){request=v;console.log(JSON.stringify({type:'progress',message:'ready'}));}else if(v.action==='cancel'){console.log(JSON.stringify({type:'progress',message:'released'}));rl.close();process.stdin.destroy();}});`;
 fs.writeFileSync(path.join(root,'recovery.config.json'),JSON.stringify({executable:process.execPath,args:['-e',script]}));
 const messages=[];let signal;const ready=new Promise(resolve=>signal=resolve);
 const runner=new RecoveryRunner(root,'unused',(_type,message)=>{messages.push(message);if(message==='ready')signal();});
 const result=runner.run({id:'cancel-me'});await ready;runner.cancel();
 assert.deepEqual(await result,{ok:false,reason:'사용자 복구 중단'});assert.ok(messages.includes('released'));assert.equal(runner.running,false);
});
