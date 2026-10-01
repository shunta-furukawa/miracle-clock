import test from 'node:test';
import assert from 'node:assert/strict';
import {mailEpisodes} from '../src/story-mail.js';
import {customers,residents} from '../src/levels.js';
test('every authored reply resolves to the recipient portrait and original sender',()=>{
 for(const [i,ep] of mailEpisodes.entries())for(const t of ep.requests){
  assert.ok([customers[t.to].name,...residents[t.to]].includes(t.recipient),`${ep.id}: ${t.recipient}`);
  assert.ok(t.variant===-1||residents[Math.floor(i/6)][t.variant]);
  assert.ok(t.letter&&t.what&&t.outcome);
 }
});
