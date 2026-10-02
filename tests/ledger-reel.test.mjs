import test from 'node:test';
import assert from 'node:assert/strict';
import {reelRelease} from '../src/ledger-reel.js';
test('reels snap slow drags to the nearest row and bound flick momentum',()=>{
 assert.equal(reelRelease(-10,0,28),0);
 assert.equal(reelRelease(-20,0,28),1);
 assert.equal(reelRelease(20,0,28),-1);
 assert.equal(reelRelease(0,-100,28),4);
 assert.equal(reelRelease(0,100,28),-4);
});
