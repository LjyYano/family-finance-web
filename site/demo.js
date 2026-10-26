// 全部为明确虚构的 UI 演示数据，绝非真实家庭账本。
const monthStrings=['2026-05','2026-06','2026-07','2026-08','2026-09','2026-10'];
function generate(month,index){
  const date=(day)=>`${month}-${String(day).padStart(2,'0')}`;
  const tx=(id,day,title,amount,kind,category,member='me')=>({id:`demo-${month}-${id}`,date:date(day),title,amountFen:Math.round(amount*100),kind,category,member,channel:'演示渠道',sourceIds:[]});
  const w=(value)=>Math.round(value*10000*100);
  const a=(accountId,name,type,amountFen,liquidity,dueWithin12mFen)=>({accountId,name,type,amountFen,liquidity,asOf:date(28),currency:'CNY',...(dueWithin12mFen===undefined?{}:{dueWithin12mFen})});
  return {schemaVersion:1,month,status:index===5?'open':'closed',
    personalExpensesFen:{me:(2300+index*170)*100,spouse:(1600+index*110)*100},
    transactions:[
      tx('salary-a',5,'工资到账 · 成员 A',52000+index*900,'income','salary'),
      tx('salary-b',10,'工资到账 · 成员 B',42000,'income','salary','spouse'),
      tx('rent',12,'房屋租金收入',6300,'income','rent'),
      tx('rentpay',2,'本月房屋租金',7600,'daily','housing'),
      tx('grocery',8,'超市家庭采购',2600+index*140,'daily','food','spouse'),
      tx('child',13,'家庭育儿用品',2200+index*210,'daily','childcare'),
      tx('utility',15,'水电与网络',560+index*10,'daily','housing'),
      tx('dinner',18,'家庭聚餐',960+index*55,'daily','food'),
      tx('transport',20,'家庭出行',350+index*20,'daily','transport','spouse'),
      tx('shopping',23,'家庭日用品',780+index*30,'daily','shopping'),
      tx('health',25,'家庭药品',220,'daily','health'),
      ...(index===2?[tx('trip',26,'周末家庭旅行',4800,'occasional','travel')]:[]),
      ...(index===4?[tx('gift',26,'家庭礼金',1200,'occasional','gifts')]:[]),
      ...(index===5?[tx('premium',27,'储蓄型保费（演示）',18000,'insurance','other')]:[])
    ],
    assetSnapshots:[
      a('cash-a','银行存款 · A','cash',w(86+index*3),'available'),
      a('cash-b','银行存款 · B','cash',w(32+index*2),'available'),
      a('fund','基金与股票','investment',w(47+index*1.8),'available'),
      a('house','自有住房','property',w(310),'illiquid'),
      a('insurance','保险现金价值','insurance',w(28+index*.5),'illiquid'),
      a('deposit','租房押金','receivable',w(1.5),'restricted'),
      a('loan','剩余贷款','liability',w(62-index*.6),'restricted',w(7))
    ],
    importSources:['me','spouse'].flatMap(member=>['支付宝','微信'].map(channel=>({member,channel,account:member==='me'?'演示账户 A':'演示账户 B',from:date(1),to:date(index===5?26:28),status:index===5?'partial':'complete'})))
  };
}
export const demoData={schemaVersion:1,months:monthStrings.map(generate)};
