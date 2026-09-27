'use strict';
// Pure monotonic-time state machine. No wall-clock jumps or browser lease.
class StuckMonitor {
 constructor({thresholdMs=120000, speedKmh=1, cooldownMs=300000}={}) {
  this.thresholdMs=thresholdMs; this.speedKmh=speedKmh; this.cooldownMs=cooldownMs;
  this.enabled=false; this.phase='off'; this.elapsedMs=0; this.lastAt=null;
  this.lastSession=null; this.cooldownUntil=0; this.attempts=0; this.reason='감시 꺼짐';
 }
 enable() {this.enabled=true;this.phase='waiting';this.elapsedMs=0;this.lastAt=null;this.reason='주행 데이터 대기';}
 disable(reason='사용자 중단') {this.enabled=false;this.phase='off';this.elapsedMs=0;this.lastAt=null;this.reason=reason;}
 tick(now, t, fresh, session) {
  if(!this.enabled)return false;
  if(this.phase==='recovering'||this.phase==='blocked')return false;
  const dt=this.lastAt===null?0:now-this.lastAt;this.lastAt=now;
  const sessionChanged=this.lastSession!==null&&session!==this.lastSession;
  this.lastSession=session;
  const valid=fresh&&t.connected&&t.channelsReady&&!t.paused&&Number.isFinite(t.speedMps);
  if(!valid||sessionChanged||dt<0||dt>2000) {
   this.elapsedMs=0;this.phase='waiting';this.reason=t.paused?'메뉴·일시정지 · 타이머 초기화':'신선한 주행 데이터 대기';return false;
  }
  if(now<this.cooldownUntil){this.elapsedMs=0;this.phase='cooldown';this.reason='복구 후 5분 재시도 대기';return false;}
  const low=Math.abs(t.speedMps)*3.6<this.speedKmh;
  if(!low){this.elapsedMs=0;this.phase='driving';this.reason='주행 중 · 종료 시간 없음';return false;}
  // The first valid low-speed observation starts a new continuous interval.
  this.elapsedMs=this.phase==='counting'?this.elapsedMs+dt:0;
  this.phase='counting';this.reason='저속 지속 시간 측정';
  if(this.elapsedMs>=this.thresholdMs){this.elapsedMs=this.thresholdMs;this.phase='recovering';this.reason='2분 정체 · 복구 요청';this.attempts++;return true;}
  return false;
 }
 result(now, ok, reason) {
  if(!this.enabled)return;
  this.elapsedMs=0;this.lastAt=null;
  if(ok){this.phase='cooldown';this.cooldownUntil=now+this.cooldownMs;this.reason=reason||'이동·수리 완료';}
  else {this.phase='blocked';this.reason=reason||'복구 확인 필요';}
 }
 state(now) {return {enabled:this.enabled,phase:this.phase,reason:this.reason,lowSpeedSeconds:Math.floor(this.elapsedMs/1000),thresholdSeconds:this.thresholdMs/1000,speedThresholdKmh:this.speedKmh,attempts:this.attempts,cooldownSeconds:Math.max(0,Math.ceil((this.cooldownUntil-now)/1000))};}
}
module.exports={StuckMonitor};
