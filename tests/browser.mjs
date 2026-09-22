import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
await mkdir('artifacts',{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:'inherit'});
try {
  for(let i=0;i<50;i++){try{const r=await fetch('http://127.0.0.1:4173');if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.TEST_BROWSER||process.env.TEST_BROWSER===name)) {
    const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--enable-unsafe-swiftshader'],...(process.env.TEST_CHROMIUM_PATH?{executablePath:process.env.TEST_CHROMIUM_PATH}: {})}: {})});
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    async function skipDialogue(){if(await page.locator('.opening-film').count()){await page.locator('.opening-skip').click();await page.locator('.story-dialog:not(.story-from-black)').waitFor();}if(await page.locator('.story-dialog').count())await page.locator('.story-skip').click();}
    async function enterLevel(id){await page.locator(`[data-stage="${[0,6,12,18,26,35][id]}"]`).click();await skipDialogue();}
    async function selectDiary(){await page.locator('[data-slot="0"]').click();await skipDialogue();}
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{if(!localStorage.getItem('miracle-clock.progress.v1'))localStorage.setItem('miracle-clock.progress.v1',JSON.stringify({0:true,1:true,2:true,3:true,4:true,5:true}));});
    await page.goto('http://127.0.0.1:4173');
    await page.getByRole('button',{name:/空の配送屋さんへ/}).waitFor();
    await page.screenshot({path:`artifacts/${name}-home-mobile.png`});
    const overflow=async()=>{
      const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,width:innerWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].map(el=>{const b=el.getBoundingClientRect();const s=getComputedStyle(el);return {tag:el.tagName,id:el.id,cls:el.getAttribute('class'),x:b.x,right:b.right,width:b.width,visibility:s.visibility,transform:s.transform};}).filter(b=>b.width&&(b.right>innerWidth+1||b.x< -1))}));
      if(result.overflow)console.log(name,'overflow diagnostic',JSON.stringify(result));
      return result.overflow;
    };
    assert.equal(await overflow(),false,'mobile home must fit');
    await page.getByRole('button',{name:/空の配送屋さんへ/}).click();
    await selectDiary();
    await enterLevel(0);
    assert.equal(await page.locator('#dispatch').count(),0,'only the central seal submits deliveries');
    await page.locator('#open-shop').click();
    await page.waitForTimeout(600);
    await page.screenshot({path:`artifacts/${name}-game-mobile.png`,animations:'disabled'});
    assert.equal(await page.locator('.customer').first().evaluate(el=>getComputedStyle(el).opacity),'1','customer must remain visible after entering');
    assert.equal(await overflow(),false,'mobile gameplay must fit');
    assert.equal(await page.locator('.customer').count(),3,'all customers are present at opening');
    for(const hand of ['hour','minute'])assert.equal(await page.locator(`#${hand}-hand .hand-art image`).getAttribute('clip-path'),`url(#${hand}-art-crop)`,'atlas clipping must be explicit before glow filters');
    await page.locator('[data-select=minute]').click();
    assert.equal(await page.locator('#minute-hand').getAttribute('class'),'selected-hand');
    await page.locator('[data-select=hour]').click();
    assert.equal(await page.locator('#hour-hand').getAttribute('class'),'selected-hand');
    // Real pointer drag at overlapping hands must select the short hand in lesson one.
    const b=await page.locator('#clock').boundingBox();
    const cx=b.x+b.width/2,cy=b.y+b.height/2,r=b.width*65/300;
    const handAngle=()=>page.evaluate(()=>Number(document.querySelector('#hour-hand').getAttribute('transform').match(/rotate\(([^ ]+)/)[1]));
    await page.mouse.move(cx,cy-r);await page.mouse.down();
    for(let i=1;i<=18;i++){const a=i*Math.PI/36;await page.mouse.move(cx+r*Math.sin(a),cy-r*Math.cos(a));
      // While the finger is down the hand follows it instead of jumping between hour marks.
      if(i===5){const shown=await handAngle();assert.ok(Math.abs(shown-25)<3,`hand follows finger mid-drag, got ${shown}`);assert.equal(await page.locator('#hour-hand').getAttribute('aria-valuenow'),'1','snapped value is announced mid-drag');}
    }
    await page.mouse.up();
    assert.equal(await page.locator('#hour-hand').getAttribute('aria-valuenow'),'3','dragging overlapping short hand reaches 3');
    // On release the hand glides to the snapped mark rather than staying under the finger.
    await page.waitForFunction(()=>document.querySelector('#hour-hand').getAttribute('transform')==='rotate(90 150 150)',null,{timeout:2000});
    await page.locator('#seal-button').click();
    await page.waitForFunction(()=>document.body.classList.contains('stamping'));
    await page.screenshot({path:`artifacts/${name}-stamp.png`});
    await page.waitForFunction(()=>document.body.classList.contains('flying'));
    await page.waitForTimeout(500);
    await page.screenshot({path:`artifacts/${name}-flight.png`});
    console.log(name,'flight renderer:',await page.locator('#flight-viewport').getAttribute('data-renderer')||'painted fallback');
    await page.locator('#score').filter({hasText:'1 / 3'}).waitFor();
    async function setTime(hours,minutes=0,period){
      const currentMinute=Number(await page.locator('#minute-hand').getAttribute('aria-valuenow'));
      await page.locator('[data-select="minute"]').click();
      for(let n=0;n<(minutes-currentMinute+60)%60/5;n++)await page.locator('#plus').click();
      const currentHour=Number(await page.locator('#hour-hand').getAttribute('aria-valuenow'))%12;
      await page.locator('[data-select="hour"]').click();
      for(let n=0;n<(hours-currentHour+12)%12;n++)await page.locator('#plus').click();
      if(period!==undefined)await page.locator(`[data-period="${period}"]`).click();
    }
    await setTime(6);await page.locator('#seal-button').click();await page.locator('#score').filter({hasText:'2 / 3'}).waitFor();
    await setTime(9);await page.locator('#seal-button').click();await page.getByRole('heading',{name:'みんなの荷物が届いたよ！'}).waitFor();
    assert.equal(await page.locator('.star-result').count(),1);await page.locator('#retry-stage').click();
    await page.getByRole('button',{name:'一時停止'}).click();
    const queue=await page.locator('#queue-count').innerText();
    assert.equal(await page.getByRole('dialog').isVisible(),true);
    for(const [width,height] of [[393,852],[852,393],[568,320]]){
      await page.setViewportSize({width,height});
      const fit=await page.locator('.modal').evaluate(el=>{const b=el.getBoundingClientRect();return b.x>=0&&b.y>=0&&b.right<=innerWidth&&b.bottom<=innerHeight&&el.scrollWidth<=el.clientWidth&&[...el.querySelectorAll('.dialog-actions button')].every(button=>{const r=button.getBoundingClientRect();return r.x>=b.x&&r.right<=b.right&&r.bottom<=b.bottom;});});
      assert.equal(fit,true,`${name}: Mine-style pause actions fit ${width}x${height}`);
      await page.screenshot({path:`artifacts/${name}-pause-${width}x${height}.png`});
    }
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.locator('#queue-count').innerText(),queue);
    await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await enterLevel(4);await page.locator('#open-shop').click();
    await setTime(3,30,1);await page.locator('#seal-button').click();
    await page.getByRole('status').filter({hasText:'午前'}).waitFor();
    assert.equal(await page.locator('#score').innerText(),'0 / 5 便','wrong period must not dispatch');
    await page.locator('[data-period="0"]').click();await page.locator('#seal-button').click();await page.locator('#score').filter({hasText:'1 / 5'}).waitFor();
    await page.getByRole('button',{name:'一時停止'}).click();await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await enterLevel(5);await page.locator('#open-shop').click();
    await page.screenshot({path:`artifacts/${name}-relative-mobile.png`});
    await setTime(10,15,0);await page.locator('#seal-button').click();await page.locator('#score').filter({hasText:'1 / 8'}).waitFor();
    await setTime(1,0,1);await page.locator('#seal-button').click();await page.locator('#score').filter({hasText:'2 / 8'}).waitFor();
    assert.equal(await page.locator('.tomorrow').innerText(),'翌日のお届け');
    await setTime(0,45,0);await page.locator('#seal-button').click();await page.locator('#score').filter({hasText:'3 / 8'}).waitFor();await page.getByRole('button',{name:'一時停止'}).click();
    await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await enterLevel(0);await page.locator('#open-shop').click();
    for(const [index,hour] of [3,6,9].entries()) {await setTime(hour);await page.locator('#seal-button').click();if(index<2)await page.locator('#score').filter({hasText:`${index+1} / 3`}).waitFor();}
    await page.getByRole('heading',{name:'みんなの荷物が届いたよ！'}).waitFor();
    await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    assert.equal(await page.locator('.chapter').first().locator('.stamp').innerText(),'配達ずみ');
    await page.reload();await page.locator('#start').click();await selectDiary();assert.equal(await page.locator('.chapter').first().locator('.stamp').innerText(),'配達ずみ');
    await enterLevel(2);await page.locator('#open-shop').click();
    await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:`artifacts/${name}-game-desktop.png`});
    assert.equal(await overflow(),false,'desktop must fit');
    // Reproduce iPhone Safari with browser bars visible, safe areas, rotation,
    // and the largest order (relative time plus AM/PM), not just horizontal overflow.
    await page.getByRole('button',{name:'一時停止'}).click();
    await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await enterLevel(5);
    await page.locator('#open-shop').click();
    await page.locator('#seal-button').click();
    assert.ok((await page.locator('#feedback').innerText()).includes('まだ刻印'));
    assert.equal(await page.locator('#clock image.gem-art').count(),12,'all hour stones are image assets');
    for(const size of [{width:393,height:852},{width:852,height:393},{width:844,height:390},{width:844,height:300},{width:667,height:320},{width:568,height:320},{width:375,height:667},{width:390,height:664}]) {
      await page.setViewportSize(size);
      // Desktop WebKit does not expose iPhone notch insets; inject equivalent CSS inputs.
      const inset=await page.addStyleTag({content:'.game{--safe-left:44px;--safe-right:44px;--safe-bottom:21px}'+(size.width===393?'.game{--safe-bottom:34px}.game-top{padding-top:59px}':'')});
      for(const advice of ['seal-button','hint']) {
      await page.locator(`#${advice}`).click();
      const boxes=await page.evaluate(()=>{
        const selectors=['#clock','#order','#period-toggle','.hand-controls','#seal-button','.clock-tools','.queue-area','.clock-housing','#feedback'];
        return selectors.map(selector=>{const b=document.querySelector(selector).getBoundingClientRect();return {selector,x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};});
      });
      const seal=boxes.find(b=>b.selector==='#seal-button');
      assert.ok(seal.width>=44&&seal.height>=44,'central stamp must retain a 44px touch target');
      const message=boxes.find(b=>b.selector==='#feedback');
      for(const box of boxes.filter(b=>b!==message)){
        const overlaps=message.x<box.right&&message.right>box.x&&message.y<box.bottom&&message.bottom>box.y;
        assert.equal(overlaps,false,`${name} ${size.width}x${size.height}: feedback must not cover ${box.selector}`);
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),false,'game must fit vertically with advice visible');
      assert.ok((await page.locator('#feedback').innerText()).length>0);
      // The brass housing and the dial inside it must stay circular, not oval.
      for(const selector of ['.clock-housing','#clock']) {
        const b=boxes.find(box=>box.selector===selector);
        assert.ok(b.width>=120,`${name}: dial must remain visible and usable`);
        assert.ok(Math.abs(b.width-b.height)<=1,`${name} ${size.width}x${size.height}: ${selector} must be square, got ${b.width}x${b.height}`);
      }
      assert.equal(await overflow(),false,`horizontal fit ${size.width}x${size.height}`);
      for(const b of boxes) assert.ok(b.x>=0&&b.y>=0&&b.right<=size.width+1&&b.bottom<=size.height+1,`${name} ${size.width}x${size.height}: ${JSON.stringify(b)} outside viewport`);
      if(size.width>size.height) {
        const clock=boxes.find(b=>b.selector==='#clock'), order=boxes.find(b=>b.selector==='#order');
        assert.ok(clock.right<=order.x,'clock and order must not overlap');
      }
      await page.screenshot({path:`artifacts/${name}-fit-${size.width}x${size.height}-${advice}.png`,animations:'disabled'});
      }
      await inset.evaluate(el=>el.remove());
    }
    await page.setViewportSize({width:844,height:300});
    await setTime(10,15,0);await page.locator('#seal-button').click();
    await page.locator('#score').filter({hasText:'1 / 8'}).waitFor();
    await page.getByRole('button',{name:'一時停止'}).click();
    await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await page.setViewportSize({width:844,height:390});
    await page.clock.install();
    await page.locator('[data-stage="2"]').click();await page.locator('#open-shop').click();
    await page.clock.fastForward(52000);await page.clock.fastForward(26000);
    assert.equal(await page.locator('.customer').count(),5);
    assert.equal(await page.locator('.customer.active').getAttribute('data-mood'),'tired');
    assert.deepEqual(await page.locator('.customer').evaluateAll(nodes=>nodes.map(n=>n.dataset.region)),['0','0','0','0','0']);
    assert.equal(await page.locator('.customer .resident-new').count(),4,'the guide and four generated forest residents wait from opening');
    assert.match(await page.locator('.resident-new').first().evaluate(el=>getComputedStyle(el).backgroundImage),/residents-waiting/,'waiting resident uses its sleepy expression');
    await page.clock.runFor(700);
    await page.screenshot({path:`artifacts/${name}-waiting-queue.png`,animations:'disabled'});
    assert.equal(await page.locator('.customer').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).opacity==='1')),true,'all waiting residents remain visible');
    await page.locator('#elements').click();
    assert.equal(await page.locator('.element-legend>div').count(),12);
    await page.clock.fastForward(120000);assert.equal(await page.locator('.customer').count(),5,'element guide preserves the batch');
    await page.locator('#elements-close').click();
    await page.emulateMedia({reducedMotion:'reduce'});
    await setTime(7);await page.locator('#seal-button').click();
    await page.clock.runFor(1000);
    await page.locator('#score').filter({hasText:'1 / 5'}).waitFor();
    assert.deepEqual(errors,[],'no runtime errors');
    await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0));
    const images=await page.locator('img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0));assert.equal(images,true,'all image elements loaded');
    // Three isolated diaries, legacy migration, dialogue layout and deliberate deletion.
    const diary=await browser.newPage({viewport:{width:393,height:852},isMobile:true,hasTouch:true});
    diary.on('pageerror',e=>errors.push(e.message));
    await diary.addInitScript(()=>{if(!localStorage.getItem('miracle-clock.progress.v1'))localStorage.setItem('miracle-clock.progress.v1','{"0":true,"2":true}');});
    await diary.goto('http://127.0.0.1:4173');await diary.locator('#start').click();
    assert.equal(await diary.locator('[data-slot]').count(),3);
    assert.match(await diary.locator('[data-slot="0"]').innerText(),/12 \/ 36/);
    await diary.screenshot({path:`artifacts/${name}-diaries-mobile.png`});
    await diary.locator('[data-slot="1"]').click();
    await diary.locator('.opening-pause').click();
    assert.equal(await diary.locator('.opening-film.is-paused').count(),1);
    for(const [width,height] of [[393,852],[852,393],[568,320]]){
      await diary.setViewportSize({width,height});
      await diary.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      assert.equal(await diary.locator('.opening-top,.opening-caption,.opening-progress').evaluateAll(es=>es.every(e=>{const b=e.getBoundingClientRect();return b.x>=0&&b.y>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1;})),true,'prologue controls and captions fit');
      await diary.screenshot({path:`artifacts/${name}-prologue-${width}x${height}.png`});
    }
    await diary.locator('.opening-skip').click();
    await diary.locator('.story-dialog:not(.story-from-black)').waitFor();
    assert.equal(await diary.locator('.story-dialog').isVisible(),true);
    if(await diary.locator('.story-dialog.is-typing').count())await diary.locator('.story-next').click(); // reveal the first line
    assert.match(await diary.locator('.story-words').innerText(),/小さな配送機/);
    await diary.locator('.story-next').click();
    assert.equal(await diary.locator('.story-speaker').innerText(),'トトじい');
    assert.equal(await diary.locator('.story-right.speaking').count(),1);
    if(await diary.locator('.story-dialog.is-typing').count())await diary.locator('.story-next').click();
    for(const [width,height] of [[393,852],[852,393],[568,320]]){
      await diary.setViewportSize({width,height});
      await diary.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const fits=await diary.evaluate(()=>['.story-header','.story-box','.story-next','.story-skip','.story-words','.story-left','.story-right'].every(sel=>{const b=document.querySelector(sel).getBoundingClientRect();return b.width>0&&b.height>0&&b.x>=0&&b.y>=0&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1;}));
      assert.equal(fits,true,`${name}: conversation fits ${width}x${height}`);
      await diary.screenshot({path:`artifacts/${name}-conversation-${width}x${height}.png`,animations:'disabled'});
    }
    await diary.locator('.story-skip').click();
    assert.equal(await diary.locator('.stamp').count(),0,'new diary must not inherit another diary clears');
    await diary.locator('#records').click();await diary.locator('[data-delete-slot="1"]').click();await diary.locator('#delete-cancel').click();
    assert.equal(await diary.locator('[data-delete-slot="1"]').count(),1,'cancel retains diary');
    await diary.locator('[data-slot="2"]').click();await diary.locator('.opening-skip').click();await diary.locator('.story-skip').click();await diary.locator('#records').click();
    await diary.locator('[data-delete-slot="1"]').click();await diary.locator('#delete-confirm').click();
    assert.equal(await diary.locator('[data-delete-slot="1"]').count(),0);
    assert.equal(await diary.locator('[data-delete-slot="0"]').count(),1);
    assert.equal(await diary.locator('[data-delete-slot="2"]').count(),1);
    await diary.reload();await diary.locator('#start').click();await diary.locator('[data-slot="0"]').click();
    assert.equal(await diary.locator('.story-dialog').count(),0,'migrated diary already knows the introduction');
    assert.equal(await diary.locator('.stamp').count(),2,'legacy progress survives slot changes, deletion and reload');
    await diary.locator('#replay-story').click();await diary.locator('.opening-skip').click();await diary.locator('.story-skip').click();
    assert.equal(await diary.locator('.stamp').count(),2,'replay retains diary progress');
    const stored=await diary.evaluate(()=>JSON.parse(localStorage.getItem('miracle-clock.records.v2')));
    assert.deepEqual(stored.slots[0].cleared,[0,2]);assert.equal(stored.slots[1],null);assert.equal(stored.slots[2].introSeen,true);
    await diary.close();
    const unavailable=await browser.newPage();
    await unavailable.addInitScript(()=>{Storage.prototype.setItem=function(){throw new Error('quota');};});
    await unavailable.goto('http://127.0.0.1:4173');await unavailable.locator('#start').click();await unavailable.locator('[data-slot="0"]').click();await unavailable.locator('.opening-skip').click();await unavailable.locator('.story-skip').click();
    assert.match(await unavailable.locator('.save-warning').innerText(),/保存できません/);
    await unavailable.close();
    // A fresh diary advances by stages; pauses and flight animations do not spoil stars.
    const beginner=await browser.newPage({viewport:{width:393,height:852},reducedMotion:'reduce'});
    beginner.on('pageerror',e=>errors.push(e.message));
    await beginner.addInitScript(()=>localStorage.setItem('miracle-clock.records.v2',JSON.stringify({version:2,revision:0,active:0,slots:[{cleared:[],stages:[],stars:{},endless:{best:0,total:0},introSeen:true},null,null]})));
    await beginner.clock.install();await beginner.goto('http://127.0.0.1:4173');await beginner.locator('#start').click();await beginner.locator('[data-slot="0"]').click();
    assert.equal(await beginner.locator('[data-stage="1"]').isDisabled(),true);assert.equal(await beginner.locator('#endless').isDisabled(),true);
    await beginner.locator('[data-stage="0"]').click();await beginner.locator('.story-skip').click();await beginner.locator('#open-shop').click();
    await beginner.locator('#pause').click();await beginner.clock.runFor(120000);await beginner.locator('#resume').click();
    for(let i=0;i<3;i++){for(let n=0;n<3;n++)await beginner.locator('#plus').click();await beginner.locator('#seal-button').click();await beginner.clock.runFor(1000);}
    assert.equal(await beginner.locator('.star-result').getAttribute('data-stars'),'3','pause and flight time are excluded');
    await beginner.locator('#result-map').click();assert.equal(await beginner.locator('[data-stage="1"]').isEnabled(),true);assert.equal(await beginner.locator('[data-stage="2"]').isDisabled(),true);
    assert.match(await beginner.locator('[data-stage="0"]').innerText(),/★★★/);await beginner.screenshot({path:`artifacts/${name}-campaign-stars.png`});await beginner.close();
    // Central special stage is endless and saves every completed delivery.
    await page.getByRole('button',{name:'一時停止'}).click();await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await page.locator('#endless').click();await skipDialogue();await page.locator('#open-shop').click();
    assert.match(await page.locator('.stage-heading').innerText(),/特別ステージ/);
    await setTime(3);await page.locator('#seal-button').click();await page.clock.runFor(1000);
    assert.match(await page.locator('#score').innerText(),/1 便/);
    await page.getByRole('button',{name:'一時停止'}).click();await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    assert.equal(await page.getByRole('heading',{name:'おつかれさま、中央便！'}).isVisible(),true);
    const best=await page.evaluate(()=>JSON.parse(localStorage.getItem('miracle-clock.records.v2')).slots[0].endless.best);assert.equal(best,1);
    assert.deepEqual(errors,[],'no runtime errors including story and records');
    await browser.close();console.log(`${name}: drag, delivery, pause, AM/PM, relative time, clearing, save, responsive layout PASS`);
  }
} finally {server.kill();}
