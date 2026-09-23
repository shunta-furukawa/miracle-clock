import assert from 'node:assert/strict';
import test from 'node:test';
import {earnedRewards,preparationStep,chapterDeliveries,shopReputation} from '../src/depot.js';
import {stageStory} from '../src/stories.js';
import {stages} from '../src/levels.js';
test('opening gifts require all six deliveries and are derived without duplicating save state',()=>{
 const record={stages:[0,1,2,3,4]};assert.deepEqual(earnedRewards(record),[]);assert.equal(chapterDeliveries(record,0),5);
 record.stages.push(5);assert.deepEqual(earnedRewards(record),[0]);assert.equal(preparationStep(record),1);
 record.stages.push(5);assert.deepEqual(earnedRewards(record),[0]);assert.equal(chapterDeliveries(record,0),6);
 assert.equal(preparationStep({stages:Array.from({length:36},(_,i)=>i)}),6);assert.equal(preparationStep({stages:[6,7,8,9,10,11]}),0);
 assert.equal(shopReputation(6),'島のみんなの配送所');
});
test('every delivery has its own conversation about the growing depot',()=>{
 const stories=stages.map(stageStory);assert.equal(stories.length,36);assert.ok(stories.every(s=>s.lines.length>=2&&s.lines.every(l=>l.text&&l.who)));
 assert.equal(new Set(stories.map(s=>s.lines[0].text)).size,36);
});
