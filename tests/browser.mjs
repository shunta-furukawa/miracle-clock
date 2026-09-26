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
    async function checkMenuInsets(){
      const previous=page.viewportSize();
      for(const size of [{width:375,height:667},{width:393,height:852},{width:844,height:390}]){
        await page.setViewportSize(size);const top=size.width<size.height?59:0,left=top?0:44;
        const style=await page.addStyleTag({content:`:root{--menu-safe-top:${top}px;--menu-safe-left:${left}px;--menu-safe-right:${left}px}`});
        const boxes=await page.locator('.topbar>*').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
        for(const b of boxes)assert.ok(b.top>=top&&b.left>=left&&b.right<=size.width-left,`menu avoids status bar and notch: ${JSON.stringify(b)}`);
        await page.screenshot({path:`artifacts/${name}-menu-safe-${await page.locator('.records-page').count()?'diaries':'map'}-${size.width}.png`});
        await style.evaluate(e=>e.remove());
      }
      await page.setViewportSize(previous);
    }
    async function skipDialogue(){if(await page.locator('#chapter-begin').count())await page.locator('#chapter-begin').click();if(await page.locator('.opening-film').count()){await page.locator('.opening-skip').click();await page.locator('.story-dialog:not(.story-from-black)').waitFor();}if(await page.locator('.story-dialog').count())await page.locator('.story-skip').click();}
    async function enterLevel(id){await page.locator(`[data-stage="${[0,6,12,18,26,35][id]}"]`).click();if(id<4){await page.locator('#chapter-begin').waitFor();assert.match(await page.locator('.chapter-arrival h1').innerText(),/配送所/);if(id===0){const reveal=await page.locator('.chapter-arrival-art').evaluate(e=>{const animations=e.getAnimations();animations.forEach(a=>{a.pause();a.currentTime=0});const start={opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform};animations.forEach(a=>a.currentTime=7000);const end={opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform};return {start,end};});assert.notEqual(reveal.start.transform,reveal.end.transform,'chapter background slowly zooms out');assert.ok(Number(reveal.start.opacity)<Number(reveal.end.opacity),'chapter background reveals from light');assert.notEqual(await page.locator('.chapter-arrival h1').evaluate(e=>getComputedStyle(e).animationName),'none','chapter title animates in');}for(const viewport of [{width:390,height:844},{width:844,height:300}]){await page.setViewportSize(viewport);const b=await page.locator('#chapter-begin').boundingBox();assert.ok(b.y>=0&&b.y+b.height<=viewport.height,'chapter action stays visible');const cinema=await page.locator('.chapter-arrival').boundingBox();assert.equal(cinema.x,0);assert.equal(cinema.y,0);assert.ok(Math.abs(cinema.width-viewport.width)<1);assert.ok(Math.abs(cinema.height-viewport.height)<1);await page.screenshot({path:`artifacts/${name}-chapter-${id}-${viewport.width}.png`});}await page.setViewportSize({width:390,height:844});}await skipDialogue();}
    async function selectDiary(){await page.locator('[data-slot="0"]').click();await skipDialogue();}
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{if(!localStorage.getItem('miracle-clock.progress.v1'))localStorage.setItem('miracle-clock.progress.v1',JSON.stringify({0:true,1:true,2:true,3:true,4:true,5:true}));});
    await page.goto('http://127.0.0.1:4173');
    await page.getByRole('button',{name:/冒険を(はじめる|つづける)/}).waitFor();
    await page.screenshot({path:`artifacts/${name}-home-mobile.png`});
    const overflow=async()=>{
      const result=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,width:innerWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].map(el=>{const b=el.getBoundingClientRect();const s=getComputedStyle(el);return {tag:el.tagName,id:el.id,cls:el.getAttribute('class'),x:b.x,right:b.right,width:b.width,visibility:s.visibility,transform:s.transform};}).filter(b=>b.width&&(b.right>innerWidth+1||b.x< -1))}));
      if(result.overflow)console.log(name,'overflow diagnostic',JSON.stringify(result));
      return result.overflow;
    };
    assert.equal(await overflow(),false,'mobile home must fit');
    await page.getByRole('button',{name:/冒険を(はじめる|つづける)/}).click();
    await checkMenuInsets();await selectDiary();await checkMenuInsets();
    for(const size of [{width:375,height:667},{width:844,height:390}]){
      await page.setViewportSize(size);
      const buttons=await page.locator('.chapter').first().locator('.stage').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().toJSON()));
      assert.equal(buttons.length,6);assert.ok(buttons.every(b=>Math.abs(b.top-buttons[0].top)<1&&b.width>=38),'six compact stages remain in one row');
      assert.equal(await overflow(),false);await page.screenshot({path:`artifacts/${name}-compact-map-${size.width}.png`});
    }
    await page.locator('#preparations').click();assert.equal(await page.locator('.reward-card.earned').count(),6);assert.match(await page.locator('.preparation-count').innerText(),/6 \/ 6/);
    for(let reward=0;reward<6;reward++){
      await page.locator(`[data-reward="${reward}"]`).click();assert.equal(await page.locator('.reward-incoming image').getAttribute('href'),'assets/depot-rewards.webp');
      if(reward===0){for(const size of [{width:390,height:664},{width:844,height:300}]){await page.setViewportSize(size);const b=await page.locator('#reward-install').boundingBox();assert.ok(b.y>=0&&b.y+b.height<=size.height);await page.screenshot({path:`artifacts/${name}-equipment-${size.width}.png`});}}
      await page.locator('#reward-install').click();assert.equal(await page.locator('#reward-done').isVisible(),false,'continue waits for docking');await page.locator('.reward-scene.installed').waitFor();assert.match(await page.locator('.reward-caption').innerText(),/がついた/);await page.locator('#reward-done').click();
    }
    await page.screenshot({path:`artifacts/${name}-central-ready.png`});await page.locator('#back-map').click();await page.setViewportSize({width:390,height:844});
    await enterLevel(0);
    for(const size of [{width:844,height:390},{width:844,height:300},{width:568,height:320},{width:375,height:667}]){
      await page.setViewportSize(size);
      const fit=await page.locator('.start-modal').evaluate(el=>{const box=el.getBoundingClientRect(),button=el.querySelector('#open-shop').getBoundingClientRect();return {scroll:el.scrollHeight>el.clientHeight+1,top:box.top,bottom:box.bottom,buttonBottom:button.bottom};});
      assert.equal(fit.scroll,false,'short preflight summary fits without scrolling');assert.ok(fit.top>=0&&fit.bottom<=size.height&&fit.buttonBottom<=size.height);
      await page.screenshot({path:`artifacts/${name}-start-summary-${size.width}x${size.height}.png`});
    }
    await page.setViewportSize({width:390,height:844});
    assert.equal(await page.locator('#dispatch').count(),0,'only the central seal submits deliveries');
    await page.clock.install();
    await page.locator('#open-shop').click();
    // The shop day opens empty; the clock itself runs.
    assert.equal(await page.locator('.shop-person').count(),0,'shop opens empty');
    assert.match(await page.locator('#shop-note').innerText(),/開店/);
    const aimedText=()=>page.locator('#minute-hand').getAttribute('aria-valuetext');
    assert.equal(await aimedText(),'午前8時','the dial starts at the first flight after opening');
    await page.clock.runFor(700);
    assert.equal(await page.locator('.shop-person').count(),1);assert.equal(await page.locator('.day-ticket').count(),1,'each visitor pins one ticket');
    assert.match(await page.locator('.day-ticket').first().innerText(),/午前|午後/);
    assert.equal(await page.locator('.day-pin').count(),1,'waiting orders are pinned on the dial');
    await page.clock.runFor(6000);
    await page.evaluate(()=>window.firstCustomer=document.querySelector('.shop-person'));
    await page.clock.runFor(1500);
    assert.equal(await page.evaluate(()=>window.firstCustomer===document.querySelector('.shop-person')),true,'arrivals preserve existing customer nodes');
    assert.equal(await overflow(),false);
    await page.screenshot({path:`artifacts/${name}-day-opening.png`,animations:'disabled'});
    for(const hand of ['hour','minute'])assert.equal(await page.locator(`#${hand}-hand .hand-art image`).getAttribute('clip-path'),`url(#${hand}-art-crop)`,'atlas clipping must be explicit before glow filters');
    // One real lap of the finger turns the long hand once: the short hand follows by an hour.
    const b=await page.locator('#clock').boundingBox();
    const cx=b.x+b.width/2,cy=b.y+b.height/2,r=b.width*40/300,before=await aimedText();
    await page.mouse.move(cx,cy-r);await page.mouse.down();
    for(let i=1;i<=36;i++){const a=i*Math.PI/18;await page.mouse.move(cx+r*Math.sin(a),cy-r*Math.cos(a));}
    await page.mouse.up();
    assert.equal(before,'午前8時');assert.equal(await aimedText(),'午前9時','a full lap near the centre still turns only the long hand');
    // Stamp the earliest waiting order through the real seal.
    const stampEarliest=async target=>{await target.evaluate(()=>{hand=routePins(session)[0].target;renderDay();});await target.locator('#seal-button').click();};
    const waiting=await page.evaluate(()=>routePins(session)[0].orders.length);
    await stampEarliest(page);
    assert.equal(await page.locator('#delivered').innerText(),String(waiting));
    assert.ok(await page.locator('.shop-person.served').count()>0,'served customers celebrate in the line');assert.ok(await page.locator('.day-ticket.served').count()>0,'tickets get stamped');
    assert.match(await page.locator('#feedback').innerText(),/便で/);
    await page.screenshot({path:`artifacts/${name}-day-batch.png`});
    await page.locator('#plus').click();
    assert.notEqual(await aimedText(),null,'controls respond during the celebration');
    // A stamp on a time nobody asked for changes nothing but the combo.
    await page.evaluate(()=>{const taken=new Set(session.queue.map(o=>o.target));let t=nextSlot(session);while(taken.has(t))t+=session.level.step;hand=t;renderDay();});
    const delivered=await page.locator('#delivered').innerText();await page.locator('#seal-button').click();
    assert.equal(await page.locator('#delivered').innerText(),delivered);assert.match(await page.locator('#feedback').innerText(),/注文はない/);
    for(const size of [{width:375,height:667},{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:1024,height:768},{width:1180,height:820},{width:768,height:1024}]){
      await page.setViewportSize(size);
      for(const selector of ['#clock','#plus','#seal-button','.shop-floor','#tickets','#pause','#day-track']){
        const box=await page.locator(selector).boundingBox();assert.ok(box&&box.width>20&&box.height>10,selector+' has usable size');
        assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,selector+' fits '+JSON.stringify(size)+' '+JSON.stringify(box));
      }
      assert.equal(await overflow(),false);await page.screenshot({path:`artifacts/${name}-day-${size.width}x${size.height}.png`});
    }
    await page.setViewportSize({width:390,height:844});
    // Pausing freezes the day, the line and every deadline.
    await page.locator('#pause').click();const frozen=await page.evaluate(()=>[session.now,session.queue.length,session.missed]);await page.clock.runFor(20000);
    assert.deepEqual(await page.evaluate(()=>[session.now,session.queue.length,session.missed]),frozen,'pause freezes the day');await page.locator('#resume').click();
    // Leaving orders alone lets their time pass: they are counted, never a game over.
    await page.clock.runFor(30000);
    assert.doesNotMatch(await page.locator('#lost').innerText(),/取りこぼし 0$/,'unstamped orders are missed when their time comes');
    assert.equal(await page.evaluate(()=>session.status),'playing');
    async function finishCurrent(target=page){for(let i=0;i<600&&await target.evaluate(()=>session.status==='playing');i++){await target.clock.runFor(400);if(await target.evaluate(()=>session.status==='playing'&&session.queue.length>0))await stampEarliest(target);}await target.clock.runFor(1600);await target.locator('#result-main').waitFor();}
    await finishCurrent();
    assert.match(await page.locator('.rush-result').innerText(),/COMBO · 最大 \d+人まとめて/);
    assert.match(await page.locator('.day-result-main').innerText(),/お届け \d+人 \/ 来店 \d+人/);
    assert.equal(await page.locator('.chapter-ending').count(),0,'stage result precedes chapter ending');
    await page.locator((await page.locator('#retry-stage').count())?'#retry-stage':'#result-main').click();assert.equal(await page.locator('.shop-person').count(),0,'retry opens a fresh day');assert.equal(await page.locator('#delivered').innerText(),'0');
    await page.locator('#pause').click();await page.locator('#quit').click();
    // Later chapters mix notations of the same time: 24-hour and "in N hours" tickets.
    await page.locator('[data-stage="28"]').click();await skipDialogue();await page.locator('#open-shop').click();
    await page.clock.runFor(30000);
    const later=(await page.locator('.day-ticket').allInnerTexts()).join(' ');assert.match(later,/\d時/);
    await page.locator('#pause').click();await page.locator('#quit').click();
    await page.locator('[data-stage="35"]').click();await skipDialogue();await page.locator('#open-shop').click();
    await page.clock.runFor(12000);
    assert.match((await page.locator('.day-ticket').allInnerTexts()).join(' '),/後[\s\S]*受付/,'relative orders show their receipt time');
    await page.setViewportSize({width:568,height:320});await page.screenshot({path:`artifacts/${name}-day-relative.png`});
    await page.setViewportSize({width:390,height:844});
    // Drive chapter-final result routing through the real stamp button.
    await finishCurrent();assert.equal(await page.locator('.story-dialog').count(),0,'results appear before chapter ending');
    await page.locator('#retry-stage').click();assert.equal(await page.locator('.story-dialog').count(),0,'retry goes straight back to the stage');
    await finishCurrent();await page.locator('#result-main').click();await page.locator('.story-dialog').waitFor();
    await page.locator('.story-skip').click();await page.locator('#reward-install').waitFor();
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
    await diary.locator('.story-next').filter({hasText:'次へ'}).waitFor(); // wait for typewriter completion, including the opening crossfade
    assert.match(await diary.locator('.story-words').innerText(),/小さな配送機/);
    await diary.locator('.story-next').click();
    assert.equal(await diary.locator('.story-speaker').innerText(),'トトじい');
    assert.equal(await diary.locator('.story-right.speaking').count(),1);
    await diary.locator('.story-next').filter({hasText:'次へ'}).waitFor();
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
    // A fresh diary advances by stages; pausing never costs a customer.
    const beginner=await browser.newPage({viewport:{width:393,height:852},reducedMotion:'reduce'});
    beginner.on('pageerror',e=>errors.push(e.message));
    await beginner.addInitScript(()=>localStorage.setItem('miracle-clock.records.v2',JSON.stringify({version:2,revision:0,active:0,slots:[{cleared:[],stages:[],stars:{},endless:{best:0,total:0},introSeen:true},null,null]})));
    await beginner.clock.install();await beginner.goto('http://127.0.0.1:4173');await beginner.locator('#start').click();await beginner.locator('[data-slot="0"]').click();
    assert.equal(await beginner.locator('[data-stage="1"]').isDisabled(),true);assert.equal(await beginner.locator('#endless').isDisabled(),true);
    await beginner.locator('[data-stage="0"]').click();await beginner.locator('#chapter-begin').click();await beginner.locator('.story-skip').click();await beginner.locator('#open-shop').click();
    await beginner.clock.runFor(3000);await beginner.locator('#pause').click();await beginner.clock.runFor(120000);await beginner.locator('#resume').click();
    await finishCurrent(beginner);
    assert.equal(await beginner.locator('.star-result').getAttribute('data-stars'),'3','prompt stamping delivers everyone');
    await beginner.locator('#result-map').click();assert.equal(await beginner.locator('[data-stage="1"]').isEnabled(),true);assert.equal(await beginner.locator('[data-stage="2"]').isDisabled(),true);
    assert.match(await beginner.locator('[data-stage="0"]').innerText(),/★★★/);await beginner.screenshot({path:`artifacts/${name}-campaign-stars.png`});await beginner.close();
    assert.deepEqual(errors,[]);await browser.close();console.log(name+': chapter, rewards, day clock, batch stamping, controls, responsive layout and chapter routing PASS');
  }
}finally{server.kill();}
