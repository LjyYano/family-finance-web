import assert from 'node:assert/strict';
import test from 'node:test';
import {donutPath,renderPieChart} from '../site/pie.js';
import {money} from '../site/finance.js';

const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const palette=['#809c8a','#d0ae7a','#8eabc0'];
const render=summary=>renderPieChart(summary,{esc,money,palette});

test('圆环按实际支出金额展示百分比和对应分类',()=>{
  const html=render({
    familyExpenseFen:10000,
    categories:[
      {key:'housing',name:'居住',amountFen:6000},
      {key:'food',name:'餐饮',amountFen:4000}
    ]
  });
  assert.match(html,/data-pie-category="housing"/);
  assert.match(html,/data-pie-percent="60.0%"/);
  assert.match(html,/data-pie-percent="40.0%"/);
  assert.match(html,/¥100.00/);
  assert.match(html,/aria-label="居住：60.0%，¥60.00，点击查看明细"/);
  assert.equal((html.match(/class="pie-slice"/g)||[]).length,2);
});

test('只有一个消费类别时可以绘制完整圆环',()=>{
  const path=donutPath(0,360);
  assert.equal((path.match(/A 88 88/g)||[]).length,2);
  assert.equal((path.match(/A 56 56/g)||[]).length,2);
  assert.doesNotMatch(path,/NaN|Infinity/);
  const html=render({familyExpenseFen:780000,categories:[{key:'housing',name:'居住',amountFen:780000}]});
  assert.match(html,/data-pie-percent="100.0%"/);
});

test('存在负金额退款时总计保留净额，图示占比只计算正金额分类',()=>{
  const html=render({
    familyExpenseFen:8000,
    categories:[
      {key:'food',name:'餐饮',amountFen:10000},
      {key:'other',name:'其他',amountFen:-2000}
    ]
  });
  assert.match(html,/data-pie-percent="100.0%"/);
  assert.match(html,/data-pie-total="¥80.00"/);
  assert.match(html,/负数退款已计入净支出/);
  assert.equal((html.match(/class="pie-slice"/g)||[]).length,1);
});

test('空数据不生成百分比或 SVG',()=>{
  assert.equal(render({familyExpenseFen:0,categories:[]}), '');
});

test('类别名称进行 HTML 转义',()=>{
  const html=render({familyExpenseFen:100,categories:[{key:'x',name:'<script>',amountFen:100}]});
  assert.doesNotMatch(html,/<script>/);
  assert.match(html,/&lt;script&gt;/);
});