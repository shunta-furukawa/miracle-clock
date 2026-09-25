import test from 'node:test';
import assert from 'node:assert/strict';
import {stages,endlessLevel} from '../src/levels.js';
import {rushSession,rushGroups,rushStamp,rushTick,rushTimeout,rushInterval,rushMatches,rushStep} from '../src/rush.js';
test('opening teaches 4 + 3 + 3 batch deliveries and preserves dial freedom',()=>{
 const s=rushSession(stages[0]);assert.equal(s.queue.length,10);
 assert.deepEqual(rushGroups(s).map(g=>[g.order.target,g.orders.length]),[[180,4],[360,3],[540,3]]);
 assert.equal(rushStamp(s,540).length,3);assert.equal(s.queue[0].target,180);assert.equal(s.combo,1);
 assert.equal(rushStamp(s,180).length,4);assert.equal(s.combo,2);
 assert.equal(rushStamp(s,360).length,3);assert.equal(s.status,'cleared');assert.equal(s.maxBatch,4);assert.equal(s.maxCombo,3);assert.equal(s.points,1100);
});
test('wrong stamp breaks combo but does not remove customers, lives, or reset timers',()=>{
 const s=rushSession(stages[0]);rushStamp(s,180);rushTick(s,12);const ids=s.queue.map(o=>o.orderId);
 rushStamp(s,0);assert.deepEqual(s.queue.map(o=>o.orderId),ids);assert.equal(s.combo,0);assert.equal(s.lives,3);assert.equal(s.queue[0].attended,12);assert.equal(s.mistakes,1);
});
test('15 and 20 customers arrive in waves; an empty desk opens next wave immediately',()=>{
 for(const [id,total] of [[1,15],[2,20]]){
 const s=rushSession(stages[id]);assert.equal(s.queue.length,9);assert.equal(s.level.count,total);
 rushTick(s,rushInterval(s));assert.equal(s.generated,12);
 while(s.status==='playing'){assert.ok(s.queue.length>0);rushStamp(s,s.queue[0].target);}
 assert.equal(s.delivered,total);assert.equal(s.generated,total);assert.equal(s.queue.length,0);
 }
});
test('all 36 stages clear with unique order IDs and exactly the promised number of customers',()=>{
 for(const level of stages){const s=rushSession(level);let stamps=0;while(s.status==='playing'&&stamps++<100){assert.equal(new Set(s.queue.map(o=>o.orderId)).size,s.queue.length);assert.ok(rushStep(s)>0);rushTick(s,.2);rushStamp(s,s.queue.at(-1).target);}assert.equal(s.status,'cleared');assert.equal(s.delivered,s.level.count);}
});
test('morning and afternoon remain distinct; relative orders keep exact calculated times',()=>{
 const s=rushSession(stages[26]);const first=s.queue[0],other=s.queue.find(o=>o.target===first.target+720);assert.ok(other);
 assert.ok(!rushMatches(s,first.target).includes(other));
 const relative=rushSession(stages[35]);for(const o of relative.queue)assert.equal(o.target,(o.base+o.duration)%1440);
});
test('three timeouts end game, assisted story has six hearts; timeout breaks combo',()=>{
 for(const [input,lives] of [[stages[0],3],[stages[0],6],[endlessLevel,6]]){const s=rushSession(input,lives),expected=input.endless?3:lives;assert.equal(s.lives,expected);rushStamp(s,s.queue[0].target);rushTimeout(s);assert.equal(s.combo,0);for(let i=1;i<expected;i++)rushTimeout(s);assert.equal(s.status,'over');assert.equal(s.lives,0);}
});
test('endless opens with ten, fills at 24, accelerates, and cannot ignore arrivals forever',()=>{
 const s=rushSession(endlessLevel);assert.equal(s.queue.length,10);rushTick(s,30);assert.equal(s.queue.length,24);assert.equal(s.status,'over');
 const active=rushSession(endlessLevel),initial=rushInterval(active);for(let i=0;i<40;i++)rushStamp(active,active.queue[0].target);assert.ok(rushInterval(active)<initial);assert.equal(active.status,'playing');
});
