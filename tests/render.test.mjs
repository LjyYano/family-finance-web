import assert from 'node:assert/strict';
import test from 'node:test';

// 无 DOM 环境验证页面模板可正常生成，不需要前端依赖。
test('解锁首页、演示四个页面均正常渲染',async()=>{
  const handlers={};
  const root={innerHTML:'',addEventListener:(event,fn)=>handlers[event]=fn};
  globalThis.document={querySelector:(selector)=>selector==='#root'?root:null};
  globalThis.window={scrollTo:()=>{}};
  await import('../site/app.js?render-test');
  assert.match(root.innerHTML,/解锁家庭财务/);
  handlers.click({target:{closest:()=>({dataset:{action:'demo'}})}});
  assert.match(root.innerHTML,/家庭总净资产/);
  assert.match(root.innerHTML,/演示数据/);
  for(const [page,title] of [['transactions','家庭交易记录'],['assets','资产负债总览'],['reports','本月消费构成'],['overview','净资产趋势']]){
    handlers.click({target:{closest:()=>({dataset:{page}})}});
    assert.ok(root.innerHTML.includes(title),`${page} 渲染失败`);
    if(['overview','reports'].includes(page)){
      assert.match(root.innerHTML,/class="category-pie"/);
      assert.match(root.innerHTML,/data-pie-percent="\d+\.\d%"/);
      assert.match(root.innerHTML,/class="pie-legend-row"/);
    }
  }
  handlers.click({target:{closest:()=>({dataset:{page:'overview'}})}});
  handlers.click({target:{closest:()=>({dataset:{pieCategory:'housing'}})}});
  assert.match(root.innerHTML,/class="category-detail-drawer"/);
  assert.match(root.innerHTML,/本月房屋租金/);
  assert.match(root.innerHTML,/本月共同消费的/);
  handlers.click({target:{closest:()=>({dataset:{action:'close-category'}})}});
  assert.doesNotMatch(root.innerHTML,/class="category-detail-drawer"/);
  handlers.click({target:{closest:()=>({dataset:{action:'lock'}})}});
  assert.match(root.innerHTML,/解锁家庭财务/);
  assert.doesNotMatch(root.innerHTML,/演示数据/);
});
