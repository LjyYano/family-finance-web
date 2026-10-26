import assert from 'node:assert/strict';
import test from 'node:test';
import {assetsAt, summarize, compactMoney, history} from '../site/finance.js';
import {demoData} from '../site/demo.js';

function month(kind='daily'){
  return {schemaVersion:1,month:'2026-08',status:'open',transactions:[
    {id:'a',date:'2026-08-01',title:'家庭采购',kind,category:'food',amountFen:10000,member:'me',sourceIds:[]},
    {id:'b',date:'2026-08-02',title:'退款',kind:'refund',refundOf:kind,category:'food',amountFen:3000,member:'me',sourceIds:[]},
    {id:'c',date:'2026-08-03',title:'工资',kind:'income',category:'salary',amountFen:50000,member:'me',sourceIds:[]},
    {id:'d',date:'2026-08-04',title:'保险',kind:'insurance',category:'other',amountFen:500000,member:'me',sourceIds:[]}
  ],personalExpensesFen:{me:2000,spouse:3000},assetSnapshots:[],importSources:[]};
}
test('退款冲减生活消费，储蓄型保险不计入生活消费',()=>{
  const s=summarize(month());
  assert.equal(s.dailyFen,7000);
  assert.equal(s.familyExpenseFen,7000);
  assert.equal(s.insuranceFen,500000);
  assert.equal(s.livingExpenseFen,12000);
  assert.equal(s.livingSurplusFen,38000);
  assert.equal(s.categories[0].amountFen,7000);
});
test('个人消费不完整时，生活消费和结余不得伪装为零',()=>{
  const m=month();m.personalExpensesFen.spouse=null;
  const s=summarize(m);
  assert.equal(s.personalComplete,false);
  assert.equal(s.livingExpenseFen,null);
  assert.equal(s.livingSurplusFen,null);
});
test('退款对应专项支出时不冲减生活消费',()=>{
  const m=month('project');
  const s=summarize(m);
  assert.equal(s.projectFen,7000);
  assert.equal(s.familyExpenseFen,0);
});
test('资产抵扣负债，流动性从近期到期金额扣除',()=>{
  const data={schemaVersion:1,months:[{...month(),assetSnapshots:[
    {accountId:'cash',name:'储蓄',type:'cash',liquidity:'available',amountFen:5000000,asOf:'2026-08-31',currency:'CNY'},
    {accountId:'house',name:'房产',type:'property',liquidity:'illiquid',amountFen:10000000,asOf:'2026-08-31',currency:'CNY'},
    {accountId:'loan',name:'贷款',type:'liability',liquidity:'restricted',amountFen:3000000,dueWithin12mFen:500000,asOf:'2026-08-31',currency:'CNY'}
  ]}]};
  const a=assetsAt(data,'2026-08');
  assert.equal(a.totalFen,12000000);
  assert.equal(a.financialFen,2000000);
  assert.equal(a.availableFen,4500000);
});
test('空资产不是零净资产',()=>{
  assert.equal(assetsAt({schemaVersion:1,months:[month()]},'2026-08'),null);
  assert.equal(compactMoney(null),'—');
});
test('演示数据仅为模拟，报告具有多个自然月',()=>{
  assert.equal(demoData.months.length,6);
  assert.equal(history(demoData,'2026-10',3).length,3);
});
