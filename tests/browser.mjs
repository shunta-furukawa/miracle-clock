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
    // Stages are calm clock puzzles: a customer's parcel tag to set, then a reply's time to read.
    async function finishPost(target=page){for(let k=0;k<12&&!(await target.locator('#result-main').count());k++){if(!(await target.evaluate(()=>post.answered)))await target.evaluate(()=>{if(post.q.read)document.querySelector(`.post-envelope[data-key="${post.q.answer}"]`).click();else{post.t=postTarget(post.q,post.t);if(post.cfg.period)post.pm=post.q.p;postDraw();document.querySelector('#seal-button').click();}});const qi=await target.evaluate(()=>post.qi);await target.locator('#post-go').click();if(qi<5)await target.waitForFunction(i=>post.qi===i+1&&!post.answered,qi);else await target.locator('#result-main').waitFor();}await target.locator('#result-main').waitFor();}
    await page.locator('#open-shop').click();
    assert.equal(await page.locator('.post-order').count(),1,'a customer brings a parcel tag');assert.match(await page.locator('.post-order .ticket-time').textContent(),/^\d+時ごろ$/,'the first stage asks for the short hand only');
    assert.equal(await page.locator('.gem-art').count(),12);assert.equal(await page.locator('#minute-hand').isVisible(),false,'the long hand waits until the short hand is known');
    const want=await page.evaluate(()=>post.q.h),dial=await page.locator('#clock').boundingBox();
    {const cx=dial.x+dial.width/2,cy=dial.y+dial.height/2,r=dial.width*50/300,a=(want*30+15)*Math.PI/180;await page.mouse.move(cx+r*Math.sin(a+1),cy-r*Math.cos(a+1));await page.mouse.down();for(let i=10;i>=0;i--)await page.mouse.move(cx+r*Math.sin(a+i/10),cy-r*Math.cos(a+i/10));await page.mouse.up();}
    assert.equal(await page.evaluate(()=>postHourOf(post.t)),want,'dragging near the centre moves the short hand into a gem room');
    assert.match(await page.locator('#post-readout').innerText(),new RegExp(`${want}のへや`));
    await page.locator('#seal-button').click();await page.locator('#post-sheet h2.ok').waitFor();assert.match(await page.locator('.post-steps').innerText(),/時の針は/,'Toto reads the hands one by one');
    await page.screenshot({path:`artifacts/${name}-post-sent.png`,animations:'disabled'});
    await page.locator('#post-go').click();await page.waitForFunction(()=>post.qi===1&&!post.answered);
    assert.equal(await page.locator('.post-envelope').count(),3,'the reply comes with three envelopes');
    const wrongKey=await page.evaluate(()=>post.q.options.find(o=>o.key!==post.q.answer).key);await page.locator(`.post-envelope[data-key="${wrongKey}"]`).click();
    await page.locator('#post-sheet h2.ng').waitFor();await page.locator('#post-go').click();assert.equal(await page.locator(`.post-envelope[data-key="${wrongKey}"]`).isDisabled(),true);
    for(const size of [{width:375,height:667},{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:1024,height:768},{width:768,height:1024}]){
      await page.setViewportSize(size);
      for(const selector of ['#clock','#post-rail','.post-talk','.post-floor','#pause','#post-hint']){
        const box=await page.locator(selector).boundingBox();assert.ok(box&&box.width>20&&box.height>10,selector+' has usable size');
        assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,selector+' fits '+JSON.stringify(size)+' '+JSON.stringify(box));
      }
      assert.equal(await overflow(),false);await page.screenshot({path:`artifacts/${name}-post-${size.width}x${size.height}.png`});
    }
    await page.setViewportSize({width:390,height:844});
    await page.locator(`.post-envelope[data-key="${await page.evaluate(()=>post.q.answer)}"]`).click();await page.locator('.post-gift').waitFor();assert.match(await page.locator('.post-letter').innerText(),/より/,'the letter opens with a gift');
    await page.locator('#pause').click();await page.locator('#resume').click();
    await finishPost();assert.equal(await page.locator('.star-result').getAttribute('data-stars'),'2','one wrong envelope costs a star');
    assert.match(await page.locator('.day-result-main').innerText(),/3通のおへんじ/);
    await page.locator('#retry-stage').click();assert.equal(await page.evaluate(()=>post.qi),0,'retry opens a fresh day');
    await page.locator('#pause').click();await page.locator('#quit').click();
    // Later chapters: the 午前/午後 window and "in N minutes" orders.
    await page.locator('[data-stage="28"]').click();await skipDialogue();await page.locator('#open-shop').click();
    assert.match(await page.locator('.post-order .ticket-time').textContent(),/^\d+時/);assert.equal(await page.locator('.post-ampm button').count(),2);assert.equal(await page.locator('#post-plate').isVisible(),true);
    await page.locator('#pause').click();await page.locator('#quit').click();
    await page.locator('[data-stage="33"]').click();await skipDialogue();await page.locator('#open-shop').click();
    assert.match(await page.locator('.post-order .ticket-time').textContent(),/いまから/);assert.equal(await page.evaluate(()=>document.querySelector('#ghost-hands').classList.contains('show')),true,'dashed hands mark now');
    await page.setViewportSize({width:568,height:320});await page.screenshot({path:`artifacts/${name}-post-relative.png`});await page.setViewportSize({width:390,height:844});
    await page.locator('#pause').click();await page.locator('#quit').click();
    // Drive chapter-final result routing through the puzzle.
    await page.locator('[data-stage="35"]').click();await skipDialogue();await page.locator('#open-shop').click();
    await finishPost();assert.equal(await page.locator('.story-dialog').count(),0,'results appear before chapter ending');
    await page.locator('#retry-stage').click();assert.equal(await page.locator('.story-dialog').count(),0,'retry goes straight back to the stage');
    await finishPost();await page.locator('#result-main').click();await page.locator('.story-dialog').waitFor();
    await page.locator('.story-skip').click();await page.locator('#reward-install').waitFor();await page.locator('#reward-install').click();await page.locator('#reward-done').waitFor();await page.locator('#reward-done').click();
    // The endless central post keeps the day clock: "now" runs by itself.
    await page.locator('#back-map').click();await page.locator('#endless').click();await skipDialogue();
    assert.equal(await page.locator('#dispatch').count(),0,'only the central seal submits deliveries');
    await page.clock.install();
    await page.locator('#open-shop').click();
    // The shop day opens empty; the clock itself runs.
    assert.equal(await page.locator('.shop-person').count(),0,'shop opens empty');
    assert.match(await page.locator('#shop-note').innerText(),/開店/);
    const aimedText=()=>page.locator('#minute-hand').getAttribute('aria-valuetext');
    assert.equal(await page.evaluate(()=>aimed()===Math.floor(session.now)+1),true,'the long hand rests on the first minute after now');assert.match(await aimedText(),/^6時\d+分$/);
    await page.clock.runFor(700);
    assert.equal(await page.locator('.shop-person').count(),1);assert.equal(await page.locator('.day-ticket').count(),1,'each visitor pins one ticket');
    assert.match(await page.locator('.day-ticket').first().innerText(),/^\d+時(\d+分)?\n/,'tickets read one plain way');assert.match(await page.locator('.order-bubble').first().innerText(),/時|分/,'the customer says it their own way');
    assert.equal(await page.locator('.day-pin').count(),await page.evaluate(()=>routePins(session).filter(p=>p.target>=aimed()&&p.target<aimed()+60).length),'only orders within an hour of the long hand are pinned');
    await page.evaluate(()=>{hand=routePins(session)[0].target-5;renderDay();});assert.equal(await page.locator('.day-pin').count(),1,'orders within the next sixty minutes are pinned at the long hand position');
    await page.evaluate(()=>{hand=nextMinute();renderDay();});
    await page.clock.runFor(6000);
    await page.evaluate(()=>window.firstCustomer=document.querySelector('.shop-person'));
    await page.clock.runFor(1500);
    assert.equal(await page.evaluate(()=>window.firstCustomer===document.querySelector('.shop-person')),true,'arrivals preserve existing customer nodes');
    assert.equal(await overflow(),false);
    await page.screenshot({path:`artifacts/${name}-day-opening.png`,animations:'disabled'});
    for(const hand of ['hour','minute'])assert.equal(await page.locator(`#${hand}-hand .hand-art image`).getAttribute('clip-path'),`url(#${hand}-art-crop)`,'atlas clipping must be explicit before glow filters');
    // One real lap of the finger turns the long hand once: the short hand follows by an hour.
    const b=await page.locator('#clock').boundingBox();
    const cx=b.x+b.width/2,cy=b.y+b.height/2,r=b.width*40/300,beforeMinute=await page.evaluate(()=>{hand=Math.floor(session.now)+40;renderDay();return aimed();});
    await page.mouse.move(cx,cy-r);await page.mouse.down();
    for(let i=1;i<=36;i++){const a=i*Math.PI/18;await page.mouse.move(cx+r*Math.sin(a),cy-r*Math.cos(a));}
    await page.mouse.up();
    assert.equal(await page.evaluate(()=>aimed()),beforeMinute+60,'a full lap near the centre turns only the long hand, exactly one hour');
    // Stamp the earliest waiting order through the real seal.
    const stampEarliest=async target=>{await target.evaluate(()=>{hand=routePins(session)[0].target;renderDay();});await target.locator('#seal-button').click();};
    const waiting=await page.evaluate(()=>routePins(session)[0].orders.length);
    await stampEarliest(page);
    assert.equal(await page.locator('#delivered').innerText(),String(waiting));
    assert.ok(await page.locator('.shop-person.served').count()>0,'served customers celebrate in the line');assert.ok(await page.locator('.day-ticket.served').count()>0,'tickets get stamped');
    assert.match(await page.locator('#feedback').innerText(),/便で/);
    await page.screenshot({path:`artifacts/${name}-day-batch.png`});
    await page.locator('#minute-hand').focus();await page.keyboard.press('ArrowRight');
    assert.notEqual(await aimedText(),null,'controls respond during the celebration');
    // The one-minute plane comes back, then a stamp on a time nobody asked for changes nothing but the combo.
    await page.clock.runFor(600);
    await page.evaluate(()=>{const taken=new Set(session.queue.map(o=>o.target));let t=Math.floor(session.now)+1;while(taken.has(t))t++;hand=t;renderDay();});
    const delivered=await page.locator('#delivered').innerText();await page.locator('#seal-button').click();
    assert.equal(await page.locator('#delivered').innerText(),delivered);assert.match(await page.locator('#feedback').innerText(),/注文がなかった/);
    // Holding the seal sweeps a wedge ahead of the long hand; everything inside goes on one flight and the plane is away that long.
    await page.clock.runFor(600);
    for(let i=0;i<40&&!(await page.evaluate(()=>session.queue.length>0&&routeBusy(session)===0));i++)await page.clock.runFor(300);
    const sweepFrom=await page.evaluate(()=>{const t=routePins(session).at(-1).target;hand=Math.max(Math.floor(session.now)+1,t-3);renderDay();return hand;});
    const seal=await page.locator('#seal-button').boundingBox();await page.mouse.move(seal.x+seal.width/2,seal.y+seal.height/2);await page.mouse.down();
    await page.clock.runFor(1200);assert.equal(await page.locator('#sweep.show').count(),1,'a wedge grows while the seal is held');
    const span=await page.evaluate(()=>hold.span);assert.ok(span>=8,'the wedge covers several minutes');
    const caught=await page.evaluate(()=>session.queue.filter(o=>o.target>=hold.start&&o.target<=hold.start+hold.span).length);
    const deliveredBefore=Number(await page.locator('#delivered').innerText());await page.mouse.up();
    assert.equal(Number(await page.locator('#delivered').innerText()),deliveredBefore+caught);assert.ok(caught>=1);
    assert.match(await page.locator('#seal-button').innerText(),/あと\d+分/,'the seal rests while the plane is away');assert.equal(await page.locator('#plane-back').isVisible(),true);
    await page.evaluate(f=>{hand=f;},sweepFrom);await page.clock.runFor(Math.ceil(span*(await page.evaluate(()=>session.level.hourSeconds))/60*1000)+400);for(let i=0;i<10&&/あと/.test(await page.locator('#seal-button').innerText());i++)await page.clock.runFor(500);
    assert.match(await page.locator('#seal-button').innerText(),/長押し/,'the plane returns after the swept minutes');
    for(const size of [{width:375,height:667},{width:390,height:844},{width:844,height:390},{width:568,height:320},{width:1024,height:768},{width:1180,height:820},{width:768,height:1024}]){
      await page.setViewportSize(size);
      for(const selector of ['#clock','#seal-button','.shop-floor','#tickets','#pause','#day-track']){
        const box=await page.locator(selector).boundingBox();assert.ok(box&&box.width>20&&box.height>10,selector+' has usable size');
        assert.ok(box.x>=-1&&box.y>=-1&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,selector+' fits '+JSON.stringify(size)+' '+JSON.stringify(box));
      }
      assert.equal(await overflow(),false);await page.screenshot({path:`artifacts/${name}-day-${size.width}x${size.height}.png`});
    }
    await page.setViewportSize({width:390,height:844});
    // Pausing freezes the day, the line and every deadline.
    await page.locator('#pause').click();const frozen=await page.evaluate(()=>[session.now,session.queue.length,session.missed]);await page.clock.runFor(20000);
    assert.deepEqual(await page.evaluate(()=>[session.now,session.queue.length,session.missed]),frozen,'pause freezes the day');await page.locator('#resume').click();
    // Leaving orders alone lets their time pass: they are counted as missed.
    await page.clock.runFor(8000);
    assert.doesNotMatch(await page.locator('#lost').innerText(),/取りこぼし 0$/,'unstamped orders are missed when their time comes');
    await page.locator('#pause').click();await page.locator('#quit').click();await page.locator('#result-main').waitFor();
    assert.match(await page.locator('.rush-result').innerText(),/COMBO · 最大 \d+人まとめて/);
    assert.match(await page.locator('.day-result-main').innerText(),/お届け \d+人 \/ 来店 \d+人/);
    await page.locator('#result-main').click();assert.equal(await page.locator('.shop-person').count(),0,'retry opens a fresh day');assert.equal(await page.locator('#delivered').innerText(),'0');
    await page.locator('#pause').click();await page.locator('#quit').click();await page.locator('#result-map').click();
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
    // A fresh diary advances by stages.
    const beginner=await browser.newPage({viewport:{width:393,height:852},reducedMotion:'reduce'});
    beginner.on('pageerror',e=>errors.push(e.message));
    await beginner.addInitScript(()=>localStorage.setItem('miracle-clock.records.v2',JSON.stringify({version:2,revision:0,active:0,slots:[{cleared:[],stages:[],stars:{},endless:{best:0,total:0},introSeen:true},null,null]})));
    await beginner.goto('http://127.0.0.1:4173');await beginner.locator('#start').click();await beginner.locator('[data-slot="0"]').click();
    assert.equal(await beginner.locator('[data-stage="1"]').isDisabled(),true);assert.equal(await beginner.locator('#endless').isDisabled(),true);
    await beginner.locator('[data-stage="0"]').click();await beginner.locator('#chapter-begin').click();await beginner.locator('.story-skip').click();await beginner.locator('#open-shop').click();
    await beginner.locator('#pause').click();await beginner.locator('#resume').click();
    await finishPost(beginner);
    assert.equal(await beginner.locator('.star-result').getAttribute('data-stars'),'3','first-try answers earn three stars');
    await beginner.locator('#result-map').click();assert.equal(await beginner.locator('[data-stage="1"]').isEnabled(),true);assert.equal(await beginner.locator('[data-stage="2"]').isDisabled(),true);
    assert.match(await beginner.locator('[data-stage="0"]').innerText(),/★★★/);await beginner.screenshot({path:`artifacts/${name}-campaign-stars.png`});await beginner.close();
    assert.deepEqual(errors,[]);await browser.close();console.log(name+': chapter, rewards, depot puzzle, endless day clock, batch stamping, controls, responsive layout and chapter routing PASS');
  }
}finally{server.kill();}
