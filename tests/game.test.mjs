import test from 'node:test';
import assert from 'node:assert/strict';
import {clockAngles,angleDelta,dragMinutes,matchesTime,normalizeTime,timeText} from '../src/time.js';
import {levels,makeOrder,createSession,tickSession,completeOrder} from '../src/levels.js';

test('half past has the short hand halfway between hour markers',()=>{assert.deepEqual(clockAngles(150),{hour:75,minute:180});});
test('minute hand full turn advances the hour; reversing crosses midnight',()=>{assert.equal(dragMinutes(150,360,'minute',5),210);assert.equal(dragMinutes(0,-30,'minute',5),1435);assert.equal(dragMinutes(720,30,'hour',60),780);});
test('drag wrap stays continuous at 12 o’clock in both directions',()=>{assert.equal(angleDelta(355,5),10);assert.equal(angleDelta(5,355),-10);});
test('AM/PM is enforced only when the lesson asks for it',()=>{assert.equal(matchesTime(180,900,false),true);assert.equal(matchesTime(180,900,true),false);assert.equal(matchesTime(0,720,false),true);});
test('all orders are on reachable minute increments, including advanced practice',()=>{for(const level of levels)for(let i=0;i<level.count;i++){const order=makeOrder(level,i);assert.equal(order.target%order.step,0);assert.ok(order.characterId>=1&&order.characterId<=5);assert.equal(order.orderId,i);}});
test('relative orders fix receipt time, cross noon and midnight correctly',()=>{const a=makeOrder(levels[5],2);assert.equal(a.base,1335);assert.equal(a.target,45);assert.equal(a.nextDay,true);assert.equal(timeText(a.target,'period'),'午前0時45分');const b=makeOrder(levels[5],1);assert.equal(b.target,780);});
test('practice never grows the queue or ends due to elapsed time',()=>{const s=createSession(levels[0],true);tickSession(s,10000);assert.equal(s.queue.length,1);assert.equal(s.status,'playing');for(let i=0;i<3;i++)completeOrder(s);assert.equal(s.status,'cleared');});
test('a full queue ends at capacity, with no sixth customer added',()=>{const s=createSession(levels[3]);tickSession(s,levels[3].interval*4);assert.equal(s.queue.length,5);tickSession(s,levels[3].interval);assert.equal(s.status,'over');assert.equal(s.queue.length,5);});
test('delivery completes once, with no extra order beyond the level goal',()=>{for(const l of levels){const s=createSession(l);for(let i=0;i<l.count;i++)completeOrder(s);assert.equal(s.status,'cleared');assert.equal(s.generated,l.count);assert.equal(s.queue.length,0);}});
test('5 minute lesson transitions to exact one minute values',()=>{assert.equal(makeOrder(levels[3],3).step,5);assert.equal(makeOrder(levels[3],4).step,1);assert.equal(makeOrder(levels[3],4).target,382);});
test('24 hour labels and minute normalization cover midnight',()=>{assert.equal(timeText(0,'24'),'0時');assert.equal(timeText(1260,'24'),'21時');assert.equal(normalizeTime(-1),1439);});
