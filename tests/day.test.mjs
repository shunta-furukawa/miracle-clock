import test from 'node:test';
import assert from 'node:assert/strict';
import {dayStages,dayEndless,dayLevel} from '../src/day.js';
import {stages} from '../src/levels.js';
import {routeSession,routeTick,routeStamp,routePins,routeStars,routeLabel,routePace,visitors} from '../src/route.js';

const seeded=(seed=7)=>()=>((seed=(seed*16807)%2147483647)-1)/2147483646;
function play(level,seed,every){
 const s=routeSession(level,{rng:seeded(seed)});let wait=every;
 while(s.status==='playing'&&s.activeTime<600){routeTick(s,.25);wait-=.25;if(wait<=0&&s.queue.length){routeStamp(s,routePins(s)[0].target);wait=every;}}
 return s;
}
test('36 stages keep their campaign identity and get a day of their own',()=>{
 assert.equal(dayStages.length,36);
 for(const [i,l] of dayStages.entries()){assert.equal(l.stageId,stages[i].stageId);assert.equal(l.stageTitle,stages[i].stageTitle);assert.ok(l.close>l.open);assert.equal(l.open%l.step,0);assert.equal((l.close-l.open)%l.step,0);}
 assert.deepEqual([0,6,12,18,21,24,30].map(i=>dayStages[i].step),[60,30,15,5,1,5,5]);
 assert.deepEqual(dayLevel(dayStages[3]),dayStages[3],'settings are stable when applied twice');
});
test('days grow longer and busier through each chapter',()=>{
 for(let c=0;c<6;c++){const list=dayStages.filter(l=>l.id===c);
  for(let n=1;n<6;n++){assert.ok(list[n].close-list[n].open>=list[n-1].close-list[n-1].open||list[n].step!==list[n-1].step);assert.ok(list[n].arrive[0]<list[n-1].arrive[0]);}}
});
test('morning and afternoon run through chapter one; relative and 24-hour orders come in later',()=>{
 const first=dayStages[0];assert.ok(first.open<720&&first.close>720,'the first day crosses noon');assert.deepEqual([...new Set(first.kinds)],['period']);
 assert.ok(dayStages[2].kinds.includes('relative'));assert.ok(dayStages[24].kinds.includes('24'));
 const last=dayStages[35];assert.ok(last.close>1440,'the last chapter works past midnight');assert.ok(last.kinds.filter(k=>k==='relative').length>=2);
});
test('prompt play three-stars every stage; slow play still clears half',()=>{
 for(const level of dayStages)for(const seed of [3,11]){
  const fast=play(level,seed,1);assert.equal(fast.status,'closed');assert.equal(routeStars(fast),3,`${level.stageId} fast`);
  const slow=play(level,seed,6);assert.ok(routeStars(slow)>=1,`${level.stageId} slow ${slow.delivered}/${visitors(slow)}`);
 }
});
test('the endless day never closes on the clock, speeds up, and ends after five lost customers',()=>{
 assert.equal(dayEndless.close,Infinity);
 const s=routeSession(dayEndless,{rng:seeded(5)});assert.equal(routePace(s),1);s.delivered=48;assert.ok(routePace(s)<1);s.delivered=0;
 while(s.status==='playing'&&s.activeTime<600)routeTick(s,.5);
 assert.equal(s.status,'closed');assert.ok(s.missed+s.gaveUp>=5,'five or more lost customers close the shop');
});
test('tomorrow is counted from the day an order was taken',()=>{
 assert.equal(routeLabel('period',1440+60,1380),'あした午前1時');assert.equal(routeLabel('period',2880+60,2880),'午前1時','an endless second day starts over');
});
