import test from 'node:test';
import assert from 'node:assert/strict';
import {harborEpisodes,harborQuestion} from '../src/harbor-mail.js';
import {mailEpisode,mailEpisodeIds,mailTimeLabel} from '../src/story-mail.js';
import {postStages,postStories,postCorrect,postTarget} from '../src/post.js';
import {freshRecords,freshRecord,normalizeRecords} from '../src/save.js';
test('harbor promises match the existing minute and half-hour learning progression',()=>{
 for(const [n,ep] of harborEpisodes.entries()){
  const stage=n+6,cfg=postStages[stage].cfg;let previous=ep.earliest;
  assert.equal(mailEpisode(stage),ep);
  for(let i=0;i<3;i++){
   const r=ep.requests[i],q=harborQuestion(stage,i),read=harborQuestion(stage,i+3);
   assert.ok(r.received>=previous&&r.received<ep.returnMinute);previous=r.received;
   assert.ok(cfg.pool.includes(r.m));if(cfg.hours)assert.ok(cfg.hours.includes(r.h));
   assert.ok(postCorrect(q,postTarget(q,q.start),false,cfg));assert.equal(postCorrect(q,r.h*60+(r.m===0?30:0),false,cfg),false);
   if(n>0)assert.equal(postCorrect(q,(r.h+1)*60+r.m,false,cfg),false);
   assert.equal(read.options.filter(o=>o.key===read.answer).length,1);assert.equal(new Set(read.options.map(o=>o.key)).size,3);
   assert.equal(read.t,r.received);assert.match(mailTimeLabel(stage,r),/午前/);
  }
 }
});
test('harbor gifts and story progress survive normalization beside forest records',()=>{
 assert.deepEqual(new Set(harborEpisodes.flatMap(e=>e.gifts.map(g=>g.id))),new Set(postStories[1].map(r=>r[4])));
 const records=freshRecords();records.slots[0]={...freshRecord(),episodes:[...mailEpisodeIds,'unknown']};
 assert.deepEqual(normalizeRecords(JSON.parse(JSON.stringify(records))).slots[0].episodes,mailEpisodeIds);
 assert.equal(mailEpisode(12),null);assert.equal(mailEpisode(undefined),null);
});
