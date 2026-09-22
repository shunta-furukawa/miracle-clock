import test from 'node:test';
import assert from 'node:assert/strict';
import {clockAngles,angleDelta,dragMinutes,freeMinutes,settleDelta,matchesTime,normalizeTime,timeText} from '../src/time.js';
import {levels,makeOrder,createSession,tickSession,completeOrder,stages,endlessLevel,stageUnlocked,endlessUnlocked,rateRun,betterRecord,starGoal,arrivalInterval} from '../src/levels.js';

test('half past has the short hand halfway between hour markers',()=>{assert.deepEqual(clockAngles(150),{hour:75,minute:180});});
test('minute hand full turn advances the hour; reversing crosses midnight',()=>{assert.equal(dragMinutes(150,360,'minute',5),210);assert.equal(dragMinutes(0,-30,'minute',5),1435);assert.equal(dragMinutes(720,30,'hour',60),780);});
test('hands follow the finger unsnapped, then settle the short way to the snapped time',()=>{assert.equal(freeMinutes(180,7,'hour'),194);assert.equal(freeMinutes(1435,60,'minute'),5);assert.equal(dragMinutes(180,7,'hour',60),180);assert.equal(settleDelta(194,180),-14);assert.equal(settleDelta(1437,0),3);assert.equal(settleDelta(2,1435),-7);});
test('drag wrap stays continuous at 12 o’clock in both directions',()=>{assert.equal(angleDelta(355,5),10);assert.equal(angleDelta(5,355),-10);});
test('AM/PM is enforced only when the lesson asks for it',()=>{assert.equal(matchesTime(180,900,false),true);assert.equal(matchesTime(180,900,true),false);assert.equal(matchesTime(0,720,false),true);});
test('all orders are on reachable minute increments, across all 36 stages',()=>{for(const level of stages)for(let i=0;i<level.count;i++){const order=makeOrder(level,i);assert.equal(order.target%order.step,0);assert.ok(order.characterId>=1&&order.characterId<=6);assert.equal(order.orderId,i);}});
test('relative orders fix receipt time, cross noon and midnight correctly',()=>{const a=makeOrder(levels[5],2);assert.equal(a.base,1335);assert.equal(a.target,45);assert.equal(a.nextDay,true);assert.equal(timeText(a.target,'period'),'午前0時45分');const b=makeOrder(levels[5],1);assert.equal(b.target,780);});
test('first stage teaches without queue pressure while still recording active time',()=>{const s=createSession(stages[0]);tickSession(s,10000);assert.equal(s.queue.length,1);assert.equal(s.status,'playing');for(let i=0;i<3;i++)completeOrder(s);assert.equal(s.status,'cleared');});
test('a full queue ends at capacity, with no sixth customer added',()=>{const s=createSession(levels[3]);tickSession(s,levels[3].interval*4);assert.equal(s.queue.length,5);tickSession(s,levels[3].interval);assert.equal(s.status,'over');assert.equal(s.queue.length,5);});
test('delivery completes once, with no extra order beyond the level goal',()=>{for(const l of levels){const s=createSession(l);for(let i=0;i<l.count;i++)completeOrder(s);assert.equal(s.status,'cleared');assert.equal(s.generated,l.count);assert.equal(s.queue.length,0);}});
test('5 minute lesson transitions to exact one minute values',()=>{assert.equal(makeOrder(levels[3],3).step,5);assert.equal(makeOrder(levels[3],4).step,1);assert.equal(makeOrder(levels[3],4).target,382);});
test('24 hour labels and minute normalization cover midnight',()=>{assert.equal(timeText(0,'24'),'0時');assert.equal(timeText(1260,'24'),'21時');assert.equal(normalizeTime(-1),1439);});

test('each local depot serves its own guide and three resident variants',()=>{
 for(const level of levels) {
  const orders=Array.from({length:8},(_,i)=>makeOrder(level,i));
  assert.equal(orders[0].variant,-1);
  assert.deepEqual(new Set(orders.slice(1).map(o=>o.variant)),new Set([0,1,2]));
  assert.equal(new Set(orders.map(o=>o.name)).size,4);
  for(const o of orders){assert.equal(o.region,level.id);assert.notEqual(o.destination,level.place);assert.ok(o.origin.endsWith('配送所'));}
 }
 const central=Array.from({length:24},(_,i)=>makeOrder(endlessLevel,i));
 assert.equal(new Set(central.map(o=>o.region)).size,6);
 assert.equal(new Set(central.map(o=>o.origin)).size,1);
});
test('waiting moods track the actual queue',async()=>{
 const {customerMood}=await import('../src/levels.js');
 const s=createSession(levels[0]);tickSession(s,35);
 assert.equal(s.queue.length,2);assert.equal(customerMood(s.queue[0]),'waiting');
 assert.equal(customerMood(s.queue[1]),'calm');tickSession(s,25);
 assert.equal(customerMood(s.queue[0]),'tired');
 completeOrder(s);assert.equal(s.queue[0].orderId,1);assert.equal(s.queue[0].waited,25);
});
test('clock preserves Mine elemental identities, with 12 using the zero theme',async()=>{
 const {elements,elementalNumbers}=await import('../src/elements.js');
 assert.deepEqual(elements.slice(0,10).map(e=>e.name),['原石','水鉱石','日光石','火鉱石','森鉱石','樹脂石','氷鉱石','月影石','星鉱石','蒸気結晶']);
 assert.equal(elements.length,12);assert.match(elementalNumbers(),/12：原石/);assert.equal((elementalNumbers().match(/class="element-gem"/g)||[]).length,12);
});


test('six chapters have six progressive stages, all targets stay reachable',()=>{assert.equal(stages.length,36);for(let c=0;c<6;c++){const list=stages.filter(s=>s.id===c);assert.deepEqual(list.map(s=>s.number),[1,2,3,4,5,6]);assert.deepEqual(list.map(s=>s.count),[3,4,5,6,7,8]);for(const l of list){const s=createSession(l);for(let i=0;i<l.count;i++){const o=s.queue[0];assert.equal(o.target%o.step,0);completeOrder(s);}assert.equal(s.status,'cleared');}}});
test('one-star clears unlock the next stage, all chapters unlock central endless',()=>{const r={stages:[]};assert.ok(stageUnlocked(r,0));assert.equal(stageUnlocked(r,1),false);r.stages=[0];assert.ok(stageUnlocked(r,1));assert.equal(endlessUnlocked(r),false);r.stages=stages.map(s=>s.stageId);assert.ok(endlessUnlocked(r));});
test('stars use both time and mistakes; best records never regress',()=>{const l=stages[0],g=starGoal(l);const a=rateRun(l,{activeTime:g.time,mistakes:0}),b=rateRun(l,{activeTime:g.time,mistakes:1}),c=rateRun(l,{activeTime:g.twoTime+1,mistakes:0});assert.equal(a.stars,3);assert.equal(b.stars,2);assert.equal(c.stars,1);assert.equal(rateRun(l,{activeTime:1,mistakes:3}).stars,1);assert.equal(betterRecord(a,b),a);assert.equal(betterRecord(b,a),a);assert.equal(betterRecord(a,{...a,time:a.time+1}),a);});
test('central endless covers all 24 customers and all six question families without a finish',()=>{const s=createSession(endlessLevel),people=new Set(),types=new Set();for(let i=0;i<144;i++){const o=s.queue[0];people.add(o.name);types.add(o.questionChapter);assert.equal(o.origin,'空の中央配送所');assert.equal(o.target%o.step,0);completeOrder(s);}assert.equal(people.size,24);assert.equal(types.size,6);assert.equal(s.status,'playing');assert.equal(s.delivered,144);assert.ok(arrivalInterval(s)<36);tickSession(s,arrivalInterval(s)*4);assert.equal(s.status,'over');assert.equal(s.queue.length,5);});
