import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
await mkdir('artifacts',{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:'inherit'});
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4173')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]].filter(([n])=>!process.env.TEST_BROWSER||process.env.TEST_BROWSER===n)){
  const browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.TEST_CHROMIUM_PATH?{executablePath:process.env.TEST_CHROMIUM_PATH}: {})});const page=await browser.newPage({viewport:{width:390,height:664},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(!localStorage.getItem('miracle-clock.records.v2'))localStorage.setItem('miracle-clock.records.v2',JSON.stringify({version:2,revision:0,active:0,slots:[{cleared:[],stages:[],stars:{},endless:{best:0,total:0},introSeen:true},null,null]}));});
  await page.goto('http://127.0.0.1:4173');await page.locator('.sound').click();
  await page.locator('[data-audio="music"]').check();await page.locator('[data-audio="sound"]').check();
  await page.waitForFunction(()=>soundtrack.track?.key==='title'&&soundtrack.context.state==='running');
  await page.locator('[data-audio="musicVolume"]').fill('25');
  await page.screenshot({path:`artifacts/${name}-audio-settings.png`});await page.locator('#audio-done').click();
  // Decode every shipped recording in both engines; verify assets contain a real signal.
  const decoded=await page.evaluate(async()=>{const result=[];for(const file of [...Object.values(MUSIC).map(x=>x.file),...EFFECTS.map(x=>x+'.mp3')]){const b=await soundtrack.buffer(file);const samples=b.getChannelData(0);let peak=0;for(let i=0;i<samples.length;i+=10)peak=Math.max(peak,Math.abs(samples[i]));result.push({file,duration:b.duration,peak});}return result;});
  assert.equal(decoded.length,27);assert.ok(decoded.every(x=>x.duration>0&&x.peak>.0001),'all recordings decode with non-silent samples');
  await page.locator('#start').click();await page.locator('[data-slot="0"]').click();await page.locator('[data-stage="0"]').click();await page.locator('#chapter-begin').click();await page.waitForFunction(()=>soundtrack.track?.key==='forest');await page.evaluate(()=>window.chapterSource=soundtrack.track.source);await page.locator('.story-skip').click();await page.locator('#open-shop').click();assert.equal(await page.evaluate(()=>soundtrack.track.source===window.chapterSource),true,'chapter music continues through conversation and opening');await page.locator('#pause').click();await page.locator('#quit').click();assert.equal(await page.evaluate(()=>soundtrack.track.source===window.chapterSource),true,'chapter music continues on map');await page.locator('[data-stage="0"]').click();await page.locator('#chapter-begin').click();await page.locator('.story-skip').click();await page.locator('#open-shop').click();
  await page.waitForFunction(()=>soundtrack.track?.key==='forest');await page.waitForFunction(()=>document.querySelector('.day-pin'));
  await page.locator('[data-move="60"]').click();assert.equal(await page.evaluate(()=>soundtrack.lastEffect.has('dial-hour')),true,'hour controls use the new tactile sample');
  const aimEarliest=()=>page.evaluate(()=>{hand=routePins(session)[0].target;renderDay();});
  await aimEarliest();await page.locator('#seal-button').click();assert.equal(await page.evaluate(()=>soundtrack.lastEffect.has('assemble')),true,'reduced motion plays the original pop immediately on imprint');assert.equal(await page.evaluate(()=>document.body.classList.contains('stamping')),false);
  await page.waitForFunction(()=>soundtrack.lastEffect.has('merge'),null,{timeout:2000});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>soundtrack.lastEffect.delete('assemble'));
  await page.waitForFunction(()=>session.queue.length>0);await aimEarliest();
  await page.locator('#seal-button').click();await page.waitForFunction(()=>soundtrack.lastEffect.has('assemble'));
  assert.equal(await page.locator('#plus').isEnabled(),true,'pop and dispatch do not block controls');

  await page.locator('#pause').click();await page.locator('.sound').click();await page.locator('[data-audio="music"]').uncheck();
  assert.equal(await page.evaluate(()=>soundtrack.track),null);
  await page.locator('#audio-done').click();assert.equal(await page.locator('#resume').isVisible(),true);
  await page.reload();await page.locator('.sound').click();assert.equal(await page.locator('[data-audio="music"]').isChecked(),false);assert.equal(await page.locator('[data-audio="sound"]').isChecked(),true);assert.equal(await page.locator('[data-audio="musicVolume"]').inputValue(),'25');
  assert.deepEqual(errors,[]);await browser.close();console.log(`${name}: audio decode, gesture playback, scene switching, independent settings and persistence PASS`);
 }
}finally{server.kill();}
