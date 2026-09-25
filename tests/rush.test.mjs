import test from 'node:test';
import assert from 'node:assert/strict';
import {stages,endlessLevel} from '../src/levels.js';
import {rushSession,rushGroups,rushStamp,rushTick,rushTimeout,rushInterval,rushMatches,rushStep,rushRemaining} from '../src/rush.js';
const full=level=>{const s=rushSession(level);rushTick(s,60);return s;};
test('reception starts empty, one visitor walks in, and ordering begins after arrival',()=>{
 const s=rushSession(stages[0]);assert.equal(s.queue.length,0);assert.equal(rushRemaining(s),10);
 rushStamp(s,180);assert.equal(s.mistakes,0);rushTick(s,.59);assert.equal(s.queue.length,0);
 rushTick(s,.01);assert.equal(s.queue.length,1);assert.equal(rushMatches(s,180).length,0);
 rushTick(s,.65);assert.equal(s.queue.length,1);assert.equal(rushMatches(s,180).length,1);
 rushTick(s,.2);assert.equal(s.queue.length,2);assert.ok(s.queue[1].arriving>0);
});
test('staggered arrival simulation is independent of tick size',()=>{
 const a=rushSession(stages[1]),b=rushSession(stages[1]);rushTick(a,12);for(let i=0;i<120;i++)rushTick(b,.1);
 assert.deepEqual(a.queue.map(o=>o.orderId),b.queue.map(o=>o.orderId));for(let i=0;i<a.queue.length;i++)assert.ok(Math.abs(a.queue[i].waited-b.queue[i].waited)<.0001);
});
test('opening still teaches 4 + 3 + 3 batches once everyone arrives',()=>{
 const s=full(stages[0]);assert.deepEqual(rushGroups(s).map(g=>[g.order.target,g.orders.length]),[[180,4],[360,3],[540,3]]);
 assert.equal(rushStamp(s,540).length,3);assert.equal(s.queue[0].target,180);
 assert.equal(rushStamp(s,180).length,4);assert.equal(s.combo,2);
 assert.equal(rushStamp(s,360).length,3);assert.equal(s.status,'cleared');assert.equal(s.maxBatch,4);assert.equal(s.maxCombo,3);assert.equal(s.points,1100);
});
test('an empty desk before closing does not clear or instantly spawn a batch',()=>{
 const s=rushSession(stages[0]);rushTick(s,1.3);rushStamp(s,180);assert.equal(s.queue.length,0);assert.equal(s.status,'playing');assert.equal(rushRemaining(s),9);rushTick(s,.2);assert.equal(s.queue.length,1);
});
test('wrong stamp breaks combo but preserves customers, lives and waiting time',()=>{
 const s=full(stages[0]);rushStamp(s,180);rushTick(s,12);const ids=s.queue.map(o=>o.orderId);
 rushStamp(s,0);assert.deepEqual(s.queue.map(o=>o.orderId),ids);assert.equal(s.combo,0);assert.equal(s.lives,3);assert.equal(s.queue[0].attended,12);assert.equal(s.mistakes,1);
});
test('all 36 stages finish only after delivering the promised number, with unique IDs',()=>{
 for(const level of stages){const s=rushSession(level);let steps=0;while(s.status==='playing'&&steps++<300){rushTick(s,.5);assert.equal(new Set(s.queue.map(o=>o.orderId)).size,s.queue.length);assert.ok(rushStep(s)>0);const o=s.queue.find(o=>o.arriving<=0);if(o)rushStamp(s,o.target);}assert.equal(s.status,'cleared');assert.equal(s.delivered,s.level.count);}
});
test('missed customer is replaced; clearing requires deliveries rather than departures',()=>{
 const s=full(stages[0]);rushTimeout(s);assert.equal(rushRemaining(s),1);while(s.queue.length)rushStamp(s,s.queue[0].target);assert.equal(s.status,'playing');assert.equal(s.delivered,9);
 rushTick(s,2);rushStamp(s,s.queue[0].target);assert.equal(s.status,'cleared');assert.equal(s.delivered,10);assert.equal(s.generated,11);
});
test('morning and afternoon stay distinct, relative orders keep calculated times',()=>{
 const s=full(stages[26]),first=s.queue[0],other=s.queue.find(o=>o.target===first.target+720);assert.ok(other);assert.ok(!rushMatches(s,first.target).includes(other));
 for(const o of full(stages[35]).queue)assert.equal(o.target,(o.base+o.duration)%1440);
});
test('three timeouts end game, assisted story has six hearts',()=>{
 for(const [input,lives] of [[stages[0],3],[stages[0],6],[endlessLevel,6]]){const s=rushSession(input,lives),expected=input.endless?3:lives;rushTick(s,10);assert.equal(s.lives,expected);for(let i=0;i<expected;i++)rushTimeout(s);assert.equal(s.status,'over');assert.equal(s.lives,0);}
});
test('endless arrives singly, ends at 24, and accelerates with deliveries',()=>{
 const s=rushSession(endlessLevel);rushTick(s,.6);assert.equal(s.queue.length,1);rushTick(s,60);assert.equal(s.queue.length,24);assert.equal(s.status,'over');
 const a=rushSession(endlessLevel);let n=0;while(a.delivered<30&&n++<200){rushTick(a,1);const o=a.queue.find(o=>o.arriving<=0);if(o)rushStamp(a,o.target);}const b={...a,delivered:0};assert.ok(rushInterval(a)<rushInterval(b));assert.equal(a.status,'playing');
});
