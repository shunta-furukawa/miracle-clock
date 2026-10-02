import test from 'node:test';
import assert from 'node:assert/strict';
import {journeyEpisodes,journeyQuestion,journeyClockLabel,journeyEnding} from '../src/journey-mail.js';
import {postStages,postStories,postCorrect,postTarget,postMs} from '../src/post.js';
import {mailEpisodes,mailEpisodeIds,mailQuestion} from '../src/story-mail.js';
import {freshRecord,freshRecords,normalizeRecords} from '../src/save.js';
test('remaining 24 days preserve learning constraints, flight chronology and distinct answers',()=>{
 assert.equal(journeyEpisodes.length,24);assert.equal(mailEpisodes.length,36);
 for(const [n,ep] of journeyEpisodes.entries()){
  const id=n+12,cfg=postStages[id].cfg;let previous=ep.earliest;
  for(let i=0;i<3;i++){
   const r=ep.requests[i],q=journeyQuestion(id,i),receipt=journeyQuestion(id,i+3);
   assert.ok(r.received>=previous&&r.received<ep.returnMinute,ep.id);previous=r.received;
   assert.equal(q.mode,cfg.mode);
   if(cfg.pool)assert.ok(cfg.pool.includes(r.m),`${id}: ${r.m}`);
   if(cfg.hours)assert.ok(cfg.hours.includes(r.h));
   if(cfg.only!==undefined)assert.equal(r.p,!!cfg.only);
   if(cfg.dur){assert.ok(cfg.dur.includes(r.d));assert.ok(cfg.nows.includes(r.now%60));assert.equal(r.received,r.now+r.d);}
   assert.ok(postCorrect(q,postTarget(q,q.start),q.p,cfg));
   assert.equal(postCorrect(q,postMs(postTarget(q,q.start)+1),q.p,cfg),false);
   if(cfg.period)assert.equal(postCorrect(q,postTarget(q,q.start),!q.p,cfg),false);
   assert.equal(receipt.t,r.received);assert.equal(receipt.options.filter(o=>o.key===receipt.answer).length,1);assert.equal(new Set(receipt.options.map(o=>o.key)).size,3);
   assert.deepEqual(mailQuestion(id,i),q);
  }
 }
});
test('midnight, final rewards and all 108 saved letters retain their identity',()=>{
 assert.match(journeyClockLabel(1440),/翌日 午前0時/);assert.match(journeyClockLabel(1530),/翌日 午前1時30分/);
 for(let c=2;c<6;c++)assert.deepEqual(new Set(journeyEpisodes.slice((c-2)*6,(c-1)*6).flatMap(e=>e.gifts.map(g=>g.id))),new Set(postStories[c].map(r=>r[4])));
 const records=freshRecords();records.slots[0]={...freshRecord(),episodes:[...mailEpisodeIds,...mailEpisodeIds,'unknown']};
 assert.deepEqual(normalizeRecords(JSON.parse(JSON.stringify(records))).slots[0].episodes,mailEpisodeIds);assert.equal(new Set(mailEpisodeIds).size,36);
 assert.match(journeyEnding(5).lines[0].text,/仕分け機.*通信塔.*開所看板/);
 assert.throws(()=>journeyQuestion(36,0),RangeError);assert.throws(()=>journeyQuestion(12,6),RangeError);
});
