export const expenseLabels={housing:'居住',food:'餐饮',childcare:'育儿',transport:'交通',health:'医疗健康',shopping:'购物',travel:'旅行娱乐',gifts:'人情往来',other:'其他'};
export const incomeLabels={salary:'工资',rent:'租金',interest:'利息',other:'其他收入'};
export const kindLabels={income:'家庭收入',daily:'共同日常消费',occasional:'非经常性消费',project:'大额专项',insurance:'储蓄型保费',investment:'投资资产转换',debt:'偿还贷款本金',transfer:'内部转账',deposit:'押金支付',prepayment:'预付房租',refund:'退款'};
export const assetLabels={cash:'现金及存款',investment:'金融投资',property:'房产',insurance:'保险现金价值',vehicle:'车辆',receivable:'应收及押金',other:'其他资产',liability:'负债'};
export const toYuan=(fen)=>fen/100;
export const money=(fen,digits=0)=>fen==null?'—':`¥${toYuan(fen).toLocaleString('zh-CN',{minimumFractionDigits:digits,maximumFractionDigits:digits})}`;
export const compactMoney=(fen)=>{
  if(fen==null)return '—';
  const val=toYuan(fen);
  return Math.abs(val)>=10000?`¥${(val/10000).toLocaleString('zh-CN',{maximumFractionDigits:2})}万`:money(fen);
};
export const shortMonth=(date)=>`${Number(date.slice(5))} 月`;
export const getMonth=(data,month)=>data.months.find(m=>m.month===month);
export const sortedMonths=(data)=>[...data.months].sort((a,b)=>a.month.localeCompare(b.month));
export const history=(data,selected,limit=6)=>{
  const result=sortedMonths(data).filter(m=>m.month<=selected);
  return limit==='all'?result:result.slice(-limit);
};
export function summarize(m){
  if(!m)return {incomeFen:0,dailyFen:0,occasionalFen:0,familyExpenseFen:0,personalFen:null,livingExpenseFen:null,livingSurplusFen:null,projectFen:0,insuranceFen:0,personalComplete:false,categories:[]};
  const sumType=(kind)=>m.transactions.filter(t=>t.kind===kind).reduce((v,t)=>v+t.amountFen,0);
  const refunds=(type)=>m.transactions.filter(t=>t.kind==='refund'&&t.refundOf===type).reduce((v,t)=>v+t.amountFen,0);
  const dailyFen=sumType('daily')-refunds('daily');
  const occasionalFen=sumType('occasional')-refunds('occasional');
  const category={};
  for(const t of m.transactions){
    if(['daily','occasional'].includes(t.kind))category[t.category]=(category[t.category]||0)+t.amountFen;
    if(t.kind==='refund'&&['daily','occasional'].includes(t.refundOf))category[t.category]=(category[t.category]||0)-t.amountFen;
  }
  const personalComplete=m.personalExpensesFen.me!==null&&m.personalExpensesFen.spouse!==null;
  const personalFen=personalComplete?m.personalExpensesFen.me+m.personalExpensesFen.spouse:null;
  const familyExpenseFen=dailyFen+occasionalFen;
  return {
    incomeFen:sumType('income'),dailyFen,occasionalFen,familyExpenseFen,personalFen,
    livingExpenseFen:personalFen==null?null:familyExpenseFen+personalFen,
    livingSurplusFen:personalFen==null?null:sumType('income')-familyExpenseFen-personalFen,
    projectFen:sumType('project')-refunds('project'),insuranceFen:sumType('insurance'),personalComplete,
    categories:Object.entries(category).filter(([,amountFen])=>amountFen!==0).map(([key,amountFen])=>({key,name:expenseLabels[key]||key,amountFen})).sort((a,b)=>b.amountFen-a.amountFen)
  };
}
export function assetsAt(data,month){
  const current=new Map();
  for(const m of sortedMonths(data)){
    if(m.month>month)break;
    for(const a of m.assetSnapshots)if(a.asOf<=`${month}-31`)current.set(a.accountId,a);
  }
  const items=[...current.values()];
  if(items.length===0)return null;
  const liabilitiesFen=items.filter(a=>a.type==='liability').reduce((v,a)=>v+a.amountFen,0);
  const assetsFen=items.filter(a=>a.type!=='liability').reduce((v,a)=>v+a.amountFen,0);
  const financialAssetsFen=items.filter(a=>['cash','investment'].includes(a.type)).reduce((v,a)=>v+a.amountFen,0);
  const availableGross=items.filter(a=>a.type!=='liability'&&a.liquidity==='available').reduce((v,a)=>v+a.amountFen,0);
  const upcomingDebt=items.filter(a=>a.type==='liability').reduce((v,a)=>v+(a.dueWithin12mFen||0),0);
  const byType=Object.entries(items.filter(a=>a.type!=='liability').reduce((acc,a)=>{acc[a.type]=(acc[a.type]||0)+a.amountFen;return acc;},{}))
    .map(([key,valueFen])=>({key,name:assetLabels[key]||key,valueFen})).sort((a,b)=>b.valueFen-a.valueFen);
  return {totalFen:assetsFen-liabilitiesFen,financialFen:financialAssetsFen-liabilitiesFen,
    availableFen:availableGross-upcomingDebt,assetsFen,liabilitiesFen,
    items,byType};
}
export const orderedTransactions=(m)=>[...(m?.transactions||[])].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
