import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {chromium,webkit} from 'playwright';
await mkdir('artifacts',{recursive:true});
const server=spawn(process.execPath,['scripts/serve.mjs'],{stdio:'inherit'});
try {
  for(let i=0;i<50;i++){try{const r=await fetch('http://127.0.0.1:4173');if(r.ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]) {
    const browser=await engine.launch({headless:true});
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:4173');
    await page.getByRole('button',{name:/空の配送屋さんへ/}).waitFor();
    await page.screenshot({path:`artifacts/${name}-home-mobile.png`});
    const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
    assert.equal(await overflow(),false,'mobile home must fit');
    await page.getByRole('button',{name:/空の配送屋さんへ/}).click();
    await page.locator('[data-level="0"]').click();
    await page.getByRole('button',{name:/トトじいと練習/}).click();
    await page.screenshot({path:`artifacts/${name}-game-mobile.png`});
    assert.equal(await overflow(),false,'mobile gameplay must fit');
    // Real pointer drag at overlapping hands must select the short hand in lesson one.
    const b=await page.locator('#clock').boundingBox();
    const cx=b.x+b.width/2,cy=b.y+b.height/2,r=b.width*65/300;
    await page.mouse.move(cx,cy-r);await page.mouse.down();
    for(let i=1;i<=18;i++){const a=i*Math.PI/36;await page.mouse.move(cx+r*Math.sin(a),cy-r*Math.cos(a));}
    await page.mouse.up();
    assert.equal(await page.locator('#hour-hand').getAttribute('aria-valuenow'),'3','dragging overlapping short hand reaches 3');
    await page.getByRole('button',{name:/この時刻に届ける/}).click();
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
    await page.getByRole('button',{name:'島えらびにもどる',exact:true}).click();
    await page.locator('[data-level="4"]').click();await page.getByRole('button',{name:/トトじいと練習/}).click();
    await setTime(9,30,1);await page.locator('#dispatch').click();
    await page.getByRole('status').filter({hasText:'午前'}).waitFor();
    assert.equal(await page.locator('#score').innerText(),'0 / 3 便','wrong period must not dispatch');
    await page.locator('[data-period="0"]').click();await page.locator('#dispatch').click();await page.locator('#score').filter({hasText:'1 / 3'}).waitFor();
    await page.getByRole('button',{name:'一時停止'}).click();await page.getByRole('button',{name:'島えらびにもどる',exact:true}).click();
    await page.locator('[data-level="5"]').click();await page.getByRole('button',{name:/トトじいと練習/}).click();
    await page.screenshot({path:`artifacts/${name}-relative-mobile.png`});
    await setTime(10,15,0);await page.locator('#dispatch').click();await page.locator('#score').filter({hasText:'1 / 3'}).waitFor();
    await setTime(1,0,1);await page.locator('#dispatch').click();await page.locator('#score').filter({hasText:'2 / 3'}).waitFor();
    assert.equal(await page.locator('.tomorrow').innerText(),'翌日のお届け');
    await setTime(0,45,0);await page.locator('#dispatch').click();await page.getByRole('heading',{name:'時計と、なかよくなれたね！'}).waitFor();
    await page.getByRole('button',{name:'島えらびにもどる',exact:true}).click();
    await page.locator('[data-level="0"]').click();await page.getByRole('button',{name:/お店をひらく/}).click();
    for(const [index,hour] of [3,5,9,12,2].entries()) {await setTime(hour);await page.locator('#dispatch').click();if(index<4)await page.locator('#score').filter({hasText:`${index+1} / 5`}).waitFor();}
    await page.getByRole('heading',{name:'みんなの荷物が届いたよ！'}).waitFor();
    await page.getByRole('button',{name:'島えらびにもどる',exact:true}).click();
    assert.equal(await page.locator('[data-level="0"] .stamp').innerText(),'配達ずみ');
    await page.reload();await page.locator('#start').click();assert.equal(await page.locator('[data-level="0"] .stamp').innerText(),'配達ずみ');
    await page.locator('[data-level="2"]').click();await page.getByRole('button',{name:/トトじいと練習/}).click();
    await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:`artifacts/${name}-game-desktop.png`});
    assert.equal(await overflow(),false,'desktop must fit');
    for(const size of [{width:375,height:667},{width:844,height:390}]){await page.setViewportSize(size);assert.equal(await overflow(),false,`layout fits ${size.width}`);}
    assert.deepEqual(errors,[],'no runtime errors');
    const images=await page.locator('img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0));assert.equal(images,true,'all image elements loaded');
    await browser.close();console.log(`${name}: drag, delivery, pause, AM/PM, relative time, clearing, save, responsive layout PASS`);
  }
} finally {server.kill();}
