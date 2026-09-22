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
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
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
    await page.locator('[data-level="0"]').click();
    await page.getByRole('button',{name:/トトじいと練習/}).click();
    await page.waitForTimeout(600);
    await page.screenshot({path:`artifacts/${name}-game-mobile.png`,animations:'disabled'});
    assert.equal(await page.locator('.customer').evaluate(el=>getComputedStyle(el).opacity),'1','customer must remain visible after entering');
    assert.equal(await overflow(),false,'mobile gameplay must fit');
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
    await setTime(5);await page.locator('#dispatch').click();await page.locator('#score').filter({hasText:'2 / 3'}).waitFor();
    await setTime(9);await page.locator('#dispatch').click();await page.getByRole('heading',{name:'時計と、なかよくなれたね！'}).waitFor();
    await page.getByRole('button',{name:'お店をひらく',exact:true}).click();
    await page.getByRole('button',{name:'一時停止'}).click();
    const queue=await page.locator('#queue-count').innerText();
    assert.equal(await page.getByRole('dialog').isVisible(),true);
    assert.equal(await page.locator('#queue-count').innerText(),queue);
    await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await page.locator('[data-level="4"]').click();await page.getByRole('button',{name:/トトじいと練習/}).click();
    await setTime(9,30,1);await page.locator('#dispatch').click();
    await page.getByRole('status').filter({hasText:'午前'}).waitFor();
    assert.equal(await page.locator('#score').innerText(),'0 / 3 便','wrong period must not dispatch');
    await page.locator('[data-period="0"]').click();await page.locator('#dispatch').click();await page.locator('#score').filter({hasText:'1 / 3'}).waitFor();
    await page.getByRole('button',{name:'一時停止'}).click();await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await page.locator('[data-level="5"]').click();await page.getByRole('button',{name:/トトじいと練習/}).click();
    await page.screenshot({path:`artifacts/${name}-relative-mobile.png`});
    await setTime(10,15,0);await page.locator('#dispatch').click();await page.locator('#score').filter({hasText:'1 / 3'}).waitFor();
    await setTime(1,0,1);await page.locator('#dispatch').click();await page.locator('#score').filter({hasText:'2 / 3'}).waitFor();
    assert.equal(await page.locator('.tomorrow').innerText(),'翌日のお届け');
    await setTime(0,45,0);await page.locator('#dispatch').click();await page.getByRole('heading',{name:'時計と、なかよくなれたね！'}).waitFor();
    await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await page.locator('[data-level="0"]').click();await page.getByRole('button',{name:/お店をひらく/}).click();
    for(const [index,hour] of [3,5,9,12,2].entries()) {await setTime(hour);await page.locator('#dispatch').click();if(index<4)await page.locator('#score').filter({hasText:`${index+1} / 5`}).waitFor();}
    await page.getByRole('heading',{name:'みんなの荷物が届いたよ！'}).waitFor();
    await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    assert.equal(await page.locator('[data-level="0"] .stamp').innerText(),'配達ずみ');
    await page.reload();await page.locator('#start').click();assert.equal(await page.locator('[data-level="0"] .stamp').innerText(),'配達ずみ');
    await page.locator('[data-level="2"]').click();await page.getByRole('button',{name:/トトじいと練習/}).click();
    await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:`artifacts/${name}-game-desktop.png`});
    assert.equal(await overflow(),false,'desktop must fit');
    // Reproduce iPhone Safari with browser bars visible, safe areas, rotation,
    // and the largest order (relative time plus AM/PM), not just horizontal overflow.
    await page.getByRole('button',{name:'一時停止'}).click();
    await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await page.locator('[data-level="5"]').click();
    await page.getByRole('button',{name:/トトじいと練習/}).click();
    for(const size of [{width:844,height:390},{width:844,height:300},{width:667,height:320},{width:568,height:320},{width:375,height:667},{width:390,height:664}]) {
      await page.setViewportSize(size);
      // Desktop WebKit does not expose iPhone notch insets; inject equivalent CSS inputs.
      const inset=await page.addStyleTag({content:'.game{--safe-left:44px;--safe-right:44px;--safe-bottom:21px}'});
      const boxes=await page.evaluate(()=>{
        const selectors=['#clock','#order','#period-toggle','.hand-controls','#dispatch','.clock-tools','.queue-area','.clock-housing'];
        return selectors.map(selector=>{const b=document.querySelector(selector).getBoundingClientRect();return {selector,x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};});
      });
      // The brass housing and the dial inside it must stay circular, not oval.
      for(const selector of ['.clock-housing','#clock']) {
        const b=boxes.find(box=>box.selector===selector);
        assert.ok(Math.abs(b.width-b.height)<=1,`${name} ${size.width}x${size.height}: ${selector} must be square, got ${b.width}x${b.height}`);
      }
      assert.equal(await overflow(),false,`horizontal fit ${size.width}x${size.height}`);
      for(const b of boxes) assert.ok(b.x>=0&&b.y>=0&&b.right<=size.width+1&&b.bottom<=size.height+1,`${name} ${size.width}x${size.height}: ${JSON.stringify(b)} outside viewport`);
      if(size.width>size.height) {
        const clock=boxes.find(b=>b.selector==='#clock'), order=boxes.find(b=>b.selector==='#order');
        assert.ok(clock.right<=order.x,'clock and order must not overlap');
      }
      await page.screenshot({path:`artifacts/${name}-fit-${size.width}x${size.height}.png`});
      await inset.evaluate(el=>el.remove());
    }
    await page.setViewportSize({width:844,height:300});
    await setTime(10,15,0);await page.locator('#dispatch').click();
    await page.locator('#score').filter({hasText:'1 / 3'}).waitFor();
    await page.getByRole('button',{name:'一時停止'}).click();
    await page.getByRole('button',{name:'配送所えらびにもどる',exact:true}).click();
    await page.setViewportSize({width:844,height:390});
    await page.clock.install();
    await page.locator('[data-level="0"]').click();await page.getByRole('button',{name:/お店をひらく/}).click();
    await page.clock.fastForward(36000);await page.clock.fastForward(26000);
    assert.equal(await page.locator('.customer').count(),2);
    assert.equal(await page.locator('.customer.active').getAttribute('data-mood'),'tired');
    assert.deepEqual(await page.locator('.customer').evaluateAll(nodes=>nodes.map(n=>n.dataset.region)),['0','0']);
    assert.equal(await page.locator('.customer .resident-new').count(),1,'second customer is a generated forest resident');
    assert.match(await page.locator('.resident-new').evaluate(el=>getComputedStyle(el).backgroundImage),/residents-waiting/,'waiting resident uses its sleepy expression');
    await page.clock.runFor(700);
    await page.screenshot({path:`artifacts/${name}-waiting-queue.png`,animations:'disabled'});
    assert.equal(await page.locator('.customer').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).opacity==='1')),true,'all waiting residents remain visible');
    await page.locator('#elements').click();
    assert.equal(await page.locator('.element-legend>div').count(),12);
    await page.clock.fastForward(120000);assert.equal(await page.locator('.customer').count(),2,'element guide pauses arrivals');
    await page.locator('#elements-close').click();
    await page.emulateMedia({reducedMotion:'reduce'});
    await setTime(3);await page.locator('#seal-button').click();
    await page.clock.runFor(1000);
    await page.locator('#score').filter({hasText:'1 / 5'}).waitFor();
    assert.deepEqual(errors,[],'no runtime errors');
    await page.waitForFunction(()=>[...document.images].every(img=>img.complete&&img.naturalWidth>0));
    const images=await page.locator('img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0));assert.equal(images,true,'all image elements loaded');
    await browser.close();console.log(`${name}: drag, delivery, pause, AM/PM, relative time, clearing, save, responsive layout PASS`);
  }
} finally {server.kill();}
