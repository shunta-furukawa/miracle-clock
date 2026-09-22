import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
let server=spawn(process.execPath,['scripts/serve.mjs']);
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://localhost:4173')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.TEST_BROWSER||process.env.TEST_BROWSER===name)){
 const browser=await engine.launch({...(name==='chromium'&&process.env.TEST_CHROMIUM_PATH?{executablePath:process.env.TEST_CHROMIUM_PATH,args:['--enable-unsafe-swiftshader']}: {})});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:4173');await page.waitForFunction(()=>navigator.serviceWorker.controller);
 await page.locator('#offline-status').filter({hasText:'オフラインでも'}).waitFor();
 const manifest=await page.evaluate(async()=>await(await fetch('manifest.webmanifest')).json());assert.equal(manifest.display,'standalone');
 await page.locator('#install-app').click();await page.locator('dialog[open]').waitFor();await page.getByRole('button',{name:'とじる',exact:true}).click();
 for(const viewport of [{width:390,height:844},{width:375,height:667},{width:844,height:390},{width:568,height:320}]){
 await page.setViewportSize(viewport);await page.screenshot({path:`artifacts/${name}-pwa-title-${viewport.width}.png`});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1||document.documentElement.scrollWidth>innerWidth+1),false,'title fits viewport');
 const a=await page.locator('#start').boundingBox();assert.ok(a.y>=0&&a.y+a.height<=viewport.height);
 }
 // Stop the origin: this also tests WebKit without its offline-emulation navigation bug.
 await new Promise(resolve=>{server.once('exit',resolve);server.kill();});
 await page.reload();await page.locator('#start').waitFor();
 assert.equal(await page.evaluate(()=>getComputedStyle(document.body).touchAction),'manipulation');
 await page.locator('#start').click();await page.locator('[data-slot="0"]').click();await page.locator('.opening-skip').click();await page.locator('.story-skip').click();
 await page.locator('[data-stage="0"]').click();await page.locator('.story-skip').click();await page.locator('#open-shop').click();
 assert.equal(await page.locator('.gem-art').count(),12);await page.locator('#plus').click();await page.locator('#plus').click();await page.locator('#plus').click();await page.locator('#seal-button').click();await page.locator('#score').filter({hasText:'1 / 3'}).waitFor();
 assert.deepEqual(errors,[]);console.log(name+': install help, home layout, offline reload and delivery PASS');await browser.close();server=spawn(process.execPath,['scripts/serve.mjs']);await new Promise(r=>setTimeout(r,300));
 }
}finally{server.kill();}
