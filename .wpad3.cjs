const { chromium } = require('playwright');
const OUT = '/private/tmp/claude-501/-Users-park-Desktop-project/34f5e2ad-fe8f-402d-ab24-7bb62a6a49cf/scratchpad';
(async () => {
  const b = await chromium.launch();
  for (const [vp, w, h] of [['desktop',1280,900],['mobile',390,844]]) {
    const ctx = await b.newContext({ viewport:{width:w,height:h}, deviceScaleFactor:2 });
    const p = await ctx.newPage();
    await p.goto('https://wp-blog.platformholder.site/n8n-hands-on-tutorial/', { waitUntil:'networkidle' });
    await p.waitForTimeout(5000);
    const r = await p.evaluate(() => [...document.querySelectorAll('.wpblog-ad')].map(a => {
      const ins = a.querySelector('ins');
      const prev = a.previousElementSibling, next = a.nextElementSibling;
      return { slot: ins.getAttribute('data-ad-slot'), status: ins.getAttribute('data-ad-status'),
        insInlineStyle: ins.getAttribute('style'),
        divH: Math.round(a.getBoundingClientRect().height), insH: Math.round(ins.getBoundingClientRect().height),
        gapPrevToNext: prev && next ? Math.round(next.getBoundingClientRect().top - prev.getBoundingClientRect().bottom) : null };
    }));
    console.log(vp, JSON.stringify(r));
    if (vp === 'desktop') {
      await p.evaluate(() => document.querySelector('.wpblog-ad').scrollIntoView({ block:'center' }));
      await p.waitForTimeout(400);
      await p.screenshot({ path: `${OUT}/ad-collapsed.png` });
    }
    await ctx.close();
  }
  await b.close();
})();
