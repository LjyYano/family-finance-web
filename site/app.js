import {fetchAndDecrypt} from './crypto.js';
import {demoData} from './demo.js';
import {
  assetLabels, assetsAt, compactMoney, expenseLabels, getMonth, history, incomeLabels,
  kindLabels, money, orderedTransactions, shortMonth, sortedMonths, summarize, toYuan
} from './finance.js';

const root=document.querySelector('#root');
const state={data:null,mode:null,page:'overview',month:'',filter:'all',search:'',passphrase:'',visible:false,busy:false,error:'',mobileMenu:false};
const pages={overview:'财务总览',transactions:'收支明细',assets:'家庭资产',reports:'月度报告'};
const pageEmoji={overview:'📒',transactions:'🧾',assets:'🏠',reports:'🗓️'};
const subtitles={overview:'收入、支出与资产变化，一页掌握。',transactions:'家庭共同消费保留明细，个人消费仅统计月度合计。',assets:'总净资产、金融净资产与可动用资金。',reports:'每个月的收支和资产记录。'};
const icons={
  activity:'<path d="M2 12h4l3-8 5 16 3-8h5"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  eye:'<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="3"/>',
  chart:'<path d="M3 3v18h18"/><path d="m7 16 4-5 4 2 5-7"/>',
  receipt:'<path d="M4 3h16v18l-4-2-4 2-4-2-4 2V3Z"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  wallet:'<rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 10h18M7 3h11"/><circle cx="17" cy="15" r="1"/>',
  home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-7h6v7"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  up:'<path d="M7 17 17 7M8 7h9v9"/>',
  down:'<path d="m17 7-10 10M7 8v9h9"/>',
  arrows:'<path d="m7 7-4 4 4 4M3 11h18m-4-4 4 4-4 4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  chevron:'<path d="m6 9 6 6 6-6"/>',
  check:'<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  clock:'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  question:'<circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01"/>',
  trending:'<path d="m3 17 6-6 4 4 8-8M15 7h6v6"/>',
  credit:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  sparkle:'<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:'<path d="M5 5l14 14M19 5 5 19"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10H3V7Z"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>'
};
const ICON=(key,size=18)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]||icons.info}</svg>`;
const esc=(value)=>String(value??'').replace(/[&<>"']/g, (ch)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const palette=['#809c8a','#d0ae7a','#8eabc0','#b2a0c0','#c99487','#acb6a5','#d0bea1','#a9a9a5'];
const person=(member)=>member==='me'?'我':member==='spouse'?'老婆':'家庭';
const currentMonth=()=>getMonth(state.data,state.month);
const header=(label,detail='',action='')=>`<div class="section-title"><div><h2>${esc(label)}</h2>${detail?`<p>${esc(detail)}</p>`:''}</div>${action}</div>`;
const card=(content,more='')=>`<section class="panel ${more}">${content}</section>`;
const empty=(title,detail)=>`<div class="empty-state"><div class="empty-icon">${ICON('folder',22)}</div><strong>${esc(title)}</strong><p>${esc(detail)}</p></div>`;
const pill=(status)=>{
  const mapping={open:['进行中','neutral'],review:['待确认','warning'],closed:['已关账','success']};
  const [label,cls]=mapping[status]||mapping.open;
  return `<span class="pill ${cls}"><span class="pill-dot"></span>${label}</span>`;
};
const stat=(name,value,icon,description,accent=false)=>`<div class="stat-card ${accent?'stat-accent':''}"><div class="stat-header"><span>${esc(name)}</span><span class="stat-icon">${ICON(icon)}</span></div><strong>${esc(value)}</strong><span class="stat-detail">${esc(description)}</span></div>`;
const kpi=(name,value,muted=false)=>`<div class="kpi-row ${muted?'muted':''}"><span>${esc(name)}</span><strong>${esc(value)}</strong></div>`;
const actionLink=(target,text)=>`<button class="text-action" data-page="${target}" type="button">${esc(text)} ${ICON('arrow',15)}</button>`;
const tip='所有财务计算都在浏览器内完成';

function loginView(){
  return `<div class="login-wrap">
    <header class="login-top"><div class="brand-icon">家</div><span>家庭财务 <span class="login-separator">/</span> 私密空间</span></header>
    <div class="login-grid"><div class="login-card">
      <div class="login-emblem">🔐</div>
      <h1>家庭财务</h1>
      <p class="login-description">解锁家庭账本，查看收支、资产和每个月的变化。</p>
      <form id="unlock-form"><label for="passphrase">访问口令</label>
        <div class="password-line">${ICON('lock',17)}<input id="passphrase" type="${state.visible?'text':'password'}" value="${esc(state.passphrase)}" placeholder="输入你们共享的口令" autocomplete="off" required/>
        <button class="reveal-btn" data-action="reveal" type="button">${state.visible?'隐藏':'显示'}</button></div>
        ${state.error?`<div class="login-error" role="alert">${esc(state.error)}</div>`:''}
        <button class="primary-button unlock-btn" ${state.busy?'disabled':''} type="submit">${state.busy?'正在本地解密…':'解锁家庭财务'} ${ICON('arrow',16)}</button>
      </form>
      <div class="login-divider"><span>或</span></div>
      <button class="demo-button" type="button" data-action="demo">${ICON('eye',16)} 查看示例看板</button>
      <div class="login-footnote">${ICON('shield',15)}<span>数据仅在浏览器内解密。共享口令不会发送至服务器。</span></div>
    </div></div>
    <footer class="login-bottom">由 GitHub Pages 提供静态页面 · 数据加密存储</footer>
  </div>`;
}

function wrapper(content){
  const navIcons={overview:'chart',transactions:'receipt',assets:'wallet',reports:'file'};
  const nav=Object.entries(pages).map(([id,title])=>`<button class="side-nav-item ${state.page===id?'active':''}" type="button" data-page="${id}">${ICON(navIcons[id],19)}<span>${title}</span>${state.page===id?'<span class="nav-active-marker"></span>':''}</button>`).join('');
  const month=currentMonth();
  const monthOptions=sortedMonths(state.data).map(x=>`<option value="${esc(x.month)}" ${x.month===state.month?'selected':''}>${esc(x.month.slice(0,4))} 年 ${Number(x.month.slice(5))} 月</option>`).join('');
  return `<div class="app-shell">${state.mobileMenu?'<button class="mobile-overlay" aria-label="关闭菜单" data-action="close-menu"></button>':''}<aside class="sidebar ${state.mobileMenu?'side-open':''}"><div class="sidebar-brand"><div class="brand-icon">家</div><div><strong>家庭财务</strong><span>私人工作区</span></div></div><div class="side-label">私有页面</div><nav class="side-nav">${nav}</nav><div class="sidebar-spacer"></div><div class="sidebar-security">${ICON('shield',16)}<div><strong>已保护的账本</strong><p>${state.mode==='demo'?'仅供浏览的演示数据':'仅在你的设备上解密'}</p></div></div><div class="sidebar-profile"><span class="profile-avatar">家</span><div><strong>我们的家庭</strong><small>${state.mode==='demo'?'演示预览模式':'专属私密账本'}</small></div><button type="button" data-action="lock" title="锁定">${ICON('lock')}</button></div></aside>
  <div class="main-column"><header class="topbar"><div class="topbar-left"><button type="button" class="mobile-menu" data-action="menu" aria-label="展开菜单">${ICON('menu',21)}</button><span>家庭空间</span><span class="breadcrumb-slash">/</span><strong>${pages[state.page]}</strong></div><div class="topbar-right">${state.mode==='demo'?`<span class="demo-label">${ICON('sparkle',13)} 演示数据</span>`:''}<div class="month-picker">${ICON('calendar',16)}<select id="month-select" aria-label="选择报表月份">${monthOptions}</select>${ICON('chevron',15)}</div><button class="top-lock" type="button" data-action="lock" aria-label="锁定财务网站">${ICON('lock',17)}</button></div></header>
  <main class="main-content"><div class="page-head"><div><div class="page-icon" aria-hidden="true">${pageEmoji[state.page]}</div><h1>${pages[state.page]}</h1><p>${subtitles[state.page]}</p></div><div class="head-aside">${month?pill(month.status):''}<span class="update-subtext">${esc(state.month)} · 财务账本</span></div></div>
  ${state.mode==='demo'?`<div class="demo-banner">${ICON('sparkle',17)}<span>当前展示的是完全虚构的演示数据，不代表你的真实家庭资产或消费。</span><button type="button" data-action="lock">切换到真实账本 ${ICON('arrow',14)}</button></div>`:''}
  ${content}<footer class="footer"><span>Family Finance · 记录生活的长期价值</span><span>${ICON('shield',14)} ${state.mode==='demo'?'模拟数据':tip}</span></footer></main></div>
  <nav class="mobile-bottom-nav">${Object.entries(pages).map(([id,title])=>`<button type="button" data-page="${id}" class="${state.page===id?'active':''}">${ICON(navIcons[id],20)}<span>${title.replace('财务','')}</span></button>`).join('')}</nav></div>`;
}

// 无外部图表库的纯 SVG 走势图。每个点都附带原始数据 tooltip。
function wealthLineChart(points){
  const w=690,h=262,left=57,right=16,top=16,bottom=39,plotW=w-left-right,plotH=h-top-bottom;
  const values=points.flatMap(x=>[x.total,x.financial,x.available]).filter(x=>x!==null);
  if(!values.length)return empty('尚未建立资产快照','从第一次记录月末资产开始，自动形成财富趋势。');
  const ymax=Math.max(10,Math.ceil(Math.max(...values)/100)*100);
  const x=(i)=>left+(points.length===1?plotW/2:i*plotW/(points.length-1));
  const y=(v)=>top+plotH-(v/ymax)*plotH;
  const grids=[0,.25,.5,.75,1].map(r=>`<line x1="${left}" x2="${w-right}" y1="${y(ymax*r)}" y2="${y(ymax*r)}" stroke="#efefed" stroke-dasharray="3 5"/><text x="${left-13}" y="${y(ymax*r)+4}" text-anchor="end" fill="#9b9a96" font-size="12">${Math.round(ymax*r)}万</text>`).join('');
  const lines=[['total','#6f927c','总净资产'],['financial','#8ba4b9','金融净资产'],['available','#c5a56d','可动用资金']].map(([key,color,label])=>{
    let path='';let started=false;
    points.forEach((p,i)=>{const v=p[key];if(v===null){started=false;return;}path+=`${started?'L':'M'}${x(i).toFixed(2)},${y(v).toFixed(2)} `;started=true;});
    const circles=points.map((p,i)=>p[key]==null?'':`<circle cx="${x(i)}" cy="${y(p[key])}" r="3" fill="${color}"><title>${esc(p.month)} · ${label} ¥${p[key].toFixed(2)} 万</title></circle>`).join('');
    return `<path d="${path}" fill="none" stroke="${color}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>${circles}`;
  }).join('');
  const ticks=points.map((p,i)=>`<text x="${x(i)}" y="${h-15}" fill="#9b9a96" font-size="12" text-anchor="middle">${esc(shortMonth(p.month))}</text>`).join('');
  return `<div class="chart-box svg-chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="资产趋势线图">${grids}${lines}${ticks}</svg></div><div class="chart-legend"><span><i style="background:#6f927c"></i>总净资产</span><span><i style="background:#8ba4b9"></i>金融净资产</span><span><i style="background:#c5a56d"></i>可动用资金</span></div>`;
}
function spendBarChart(points){
  const available=points.some(p=>p.income!==null||p.expense!==null);
  if(!available)return empty('尚无月度收支记录','完成账单分类与个人消费汇总后，这里自动展示月度对比。');
  const maximum=Math.max(1,...points.flatMap(p=>[p.income,p.expense].filter(x=>x!==null)));
  return `<div class="css-bar-chart" role="img" aria-label="月度收入与消费柱状图">${points.map(p=>`<div class="bar-group"><div class="bar-pair"><span style="height:${p.income==null?0:Math.max(2,p.income/maximum*100)}%" class="bar-income" title="${esc(p.month)} 家庭收入 ${p.income===null?'暂无数据':`${p.income.toFixed(2)} 万元`}"></span><span style="height:${p.expense==null?0:Math.max(2,p.expense/maximum*100)}%" class="bar-expense" title="${esc(p.month)} 生活消费 ${p.expense===null?'暂无数据':`${p.expense.toFixed(2)} 万元`}"></span></div><small>${esc(shortMonth(p.month))}</small></div>`).join('')}</div><div class="chart-legend"><span><i style="background:#6f927c"></i>家庭收入</span><span><i style="background:#c5a56d"></i>生活消费</span></div>`;
}
function categoryBars(summary){
  if(!summary.categories.length)return empty('尚无共同消费记录','导入账单后这里将展示实际用途分类。');
  return `<div class="category-total"><span>共同生活消费</span><strong>${compactMoney(summary.familyExpenseFen)}</strong></div><div class="category-bars">${summary.categories.slice(0,7).map((c,i)=>`<div class="category-item"><div class="category-item-top"><span><i style="background:${palette[i%palette.length]}"></i>${esc(c.name)}</span><strong>${esc(money(c.amountFen))}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${summary.familyExpenseFen>0?Math.max(0,Math.min(100,c.amountFen/summary.familyExpenseFen*100)):0}%;background:${palette[i%palette.length]}"></div></div></div>`).join('')}</div>`;
}
function dataQuality(m,s){
  const sources=m?.importSources||[];
  const full=sources.filter(x=>x.status==='complete').length;
  const lines=[
    ['账单来源',sources.length?`${full} / ${sources.length} 个来源已完整覆盖`:'尚未导入任何账单',sources.length>0&&full===sources.length,'receipt'],
    ['个人消费汇总',s.personalComplete?'夫妻双方月度合计已记录':'尚未完成双方月度合计',s.personalComplete,'wallet'],
    ['资产快照',m?.assetSnapshots.length?`${m.assetSnapshots.length} 个账户已更新`:'本月尚未更新资产余额',!!m?.assetSnapshots.length,'home']
  ];
  return `<div class="quality-list">${lines.map(([name,detail,ok,ic])=>`<div class="quality-line"><span class="quality-icon">${ICON(ic,17)}</span><div><strong>${name}</strong><small>${detail}</small></div><span class="quality-mark ${ok?'okay':'pending'}">${ICON(ok?'check':'clock',17)}</span></div>`).join('')}</div>`;
}
function overview(){
  const data=state.data, m=currentMonth(),s=summarize(m),assets=assetsAt(data,state.month),h=history(data,state.month,6);
  const old=h.length>1?assetsAt(data,h.at(-2).month):null;
  const diff=assets&&old?assets.totalFen-old.totalFen:null;
  const latestValuation=assets?.items.map(a=>a.asOf).sort().at(-1);
  const usedOlderSnapshot=!!assets && !!m && m.assetSnapshots.length===0;
  const historyPoints=h.map(x=>{
    const a=assetsAt(data,x.month);
    return {month:x.month,total:a?toYuan(a.totalFen)/10000:null,financial:a?toYuan(a.financialFen)/10000:null,available:a?toYuan(a.availableFen)/10000:null};
  });
  const monthsSpend=h.map(x=>{
    const row=summarize(x);
    return {month:x.month,income:x.transactions.length>0?toYuan(row.incomeFen)/10000:null,expense:row.livingExpenseFen===null?null:toYuan(row.livingExpenseFen)/10000};
  });
  return `<div class="hero-card"><div class="hero-content"><div class="hero-label"><span class="hero-dot"></span>家庭总净资产 ${ICON('question',14)}</div><div class="hero-value">${esc(compactMoney(assets?.totalFen))}</div><div class="hero-hint">${assets?(usedOlderSnapshot?`沿用历史快照 · 最近估值 ${esc(latestValuation)}`:(diff===null?'最新可用资产快照':`<span class="delta ${diff>=0?'positive':'negative'}">${ICON('trending',15)} 较上月 ${diff>=0?'+':'−'}${esc(compactMoney(Math.abs(diff)))}</span>`)):'尚未建立资产快照，首次录入后即可查看'}</div></div><div class="hero-decor"><div class="hero-decor-ring ring-a"></div><div class="hero-decor-ring ring-b"></div><div class="hero-decor-glow"></div><div class="hero-decor-initial">F<span>·</span>F</div></div><div class="hero-bottom"><span>${ICON('shield',14)} ${state.mode==='demo'?'仅供展示的模拟数字':'仅在浏览器本地解密'}</span><button type="button" data-page="assets">查看资产详情 ${ICON('up',14)}</button></div></div>
  <div class="stats-grid two-stats">${stat('金融净资产',compactMoney(assets?.financialFen),'home','金融资产减去全部金融负债')}${stat('可动用资金',compactMoney(assets?.availableFen),'wallet','可用资产扣除近期到期债务',true)}</div>
  <div class="section-gap">${header('本月收支',m?.status==='closed'?'本月数据已核对完成':'当前月份未关账，仅反映已录入数据')}</div><div class="stats-grid three-stats">${stat('家庭收入',m?.transactions.length?compactMoney(s.incomeFen):'—','down','工资、租金及其他收入')}${stat('生活消费',compactMoney(s.livingExpenseFen),'credit',s.personalComplete?'包含夫妻个人消费合计':'个人消费汇总不完整')}${stat('生活结余',compactMoney(s.livingSurplusFen),'trending','不包含大额专项现金流')}</div>
  <div class="content-grid top-charts">${card(header('财富增长趋势','总净资产、金融净资产和可动用资金')+wealthLineChart(historyPoints),'chart-panel')}${card(header('共同消费分布','严格按家庭实际用途统计')+categoryBars(s)+actionLink('transactions','查看全部交易'),'breakdown-panel')}</div>
  <div class="content-grid bottom-charts">${card(header('每月收入与消费','过去几个月的收入和全部生活消费（万元）')+spendBarChart(monthsSpend),'chart-panel')}${card(header('本月数据状态','完整的数据，才能得到可信的报表',m?pill(m.status):'')+dataQuality(m,s)+actionLink('reports','查看关账报告'),'quality-panel')}</div>`;
}

function transactionTable(rows){
  if(!rows.length)return empty(state.search||state.filter!=='all'?'没有符合条件的交易':'当前月份尚无交易','通过 ChatGPT 上传并确认账单后，交易会显示在这里。');
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>交易内容</th><th>日期</th><th>类型 / 分类</th><th>付款人</th><th>金额</th></tr></thead><tbody>${rows.map(t=>{
    const inbound=['income','refund'].includes(t.kind);
    return `<tr><td class="td-main"><span class="transaction-icon ${inbound?'in':'out'}">${ICON(inbound?'down':t.kind==='transfer'?'arrows':'up',17)}</span><span>${esc(t.title)}<small>${esc(t.channel||'手工录入')}</small></span></td><td class="td-date">${esc(t.date)}</td><td><span class="table-tag">${esc(kindLabels[t.kind]||t.kind)}</span><small class="table-subcategory">${esc(t.kind==='income'?(incomeLabels[t.category]||t.category):(expenseLabels[t.category]||t.category))}</small></td><td>${esc(person(t.member))}</td><td class="td-amount ${inbound?'amount-in':''}">${inbound?'+':'−'}${esc(money(t.amountFen))}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function transactions(){
  const m=currentMonth(),s=summarize(m);
  const rows=orderedTransactions(m).filter(t=>{
    if(state.filter==='expense'&&!['daily','occasional','refund'].includes(t.kind))return false;
    if(state.filter==='income'&&t.kind!=='income')return false;
    if(state.filter==='project'&&!['project','insurance','investment','debt'].includes(t.kind))return false;
    const keyword=state.search.trim().toLowerCase();
    return !keyword || t.title.toLowerCase().includes(keyword) || t.category.toLowerCase().includes(keyword);
  });
  return `<div class="stats-grid three-stats transaction-stats">${stat('共同日常消费',m?.transactions.length?compactMoney(s.dailyFen):'—','receipt','不包含个人消费')}${stat('非经常性共同消费',m?.transactions.length?compactMoney(s.occasionalFen):'—','calendar','旅行、大额医疗等')}${stat('个人消费月汇总',compactMoney(s.personalFen),'wallet','只保存合计，不保存个人明细')}</div>
    ${card(`<div class="table-heading">${header('家庭交易记录',`当前筛选 ${rows.length} 笔记录`)}<div class="filter-row"><input id="search-input" class="search-input" aria-label="搜索交易" placeholder="搜索名称或分类" value="${esc(state.search)}"/><select id="kind-select" aria-label="筛选交易类型"><option value="all" ${state.filter==='all'?'selected':''}>全部类型</option><option value="expense" ${state.filter==='expense'?'selected':''}>共同消费</option><option value="income" ${state.filter==='income'?'selected':''}>家庭收入</option><option value="project" ${state.filter==='project'?'selected':''}>大额及资金变动</option></select></div></div>`+transactionTable(rows),'table-panel')}`;
}
function assetComposition(asset){
  if(!asset)return empty('暂无资产结构数据','按账户录入月末余额，即可自动计算资产分布。');
  let start=0;
  const segments=asset.byType.map((x,i)=>{
    const degree=asset.assetsFen===0?0:x.valueFen/asset.assetsFen*360;
    const str=`${palette[i%palette.length]} ${start}deg ${start+degree}deg`;
    start+=degree;return str;
  });
  return `<div class="asset-composition"><div class="donut-holder"><div class="css-donut" style="background:conic-gradient(${segments.join(',')||'#edf0eb 0 360deg'})"></div><div class="donut-center"><span>总资产</span><strong>${esc(compactMoney(asset.assetsFen))}</strong></div></div><div class="asset-legend">${asset.byType.map((x,i)=>`<div class="asset-legend-row"><span><i style="background:${palette[i%palette.length]}"></i>${esc(x.name)}</span><strong>${esc(compactMoney(x.valueFen))}</strong></div>`).join('')}</div></div>`;
}
function assetRows(asset){
  if(!asset)return empty('尚未记录任何资产账户','首次上传资产余额后，将在这里显示账户清单。');
  return `<div class="asset-list">${[...asset.items].sort((a,b)=>b.amountFen-a.amountFen).map(a=>`<div class="asset-item"><span class="asset-symbol ${a.type==='liability'?'liability':''}">${ICON('home',18)}</span><div class="asset-item-label"><strong>${esc(a.name)}</strong><small>${esc(assetLabels[a.type]||a.type)} · 估值 ${esc(a.asOf)}</small></div><strong class="${a.type==='liability'?'liability-color':''}">${a.type==='liability'?'−':''}${esc(money(a.amountFen))}</strong></div>`).join('')}</div>`;
}
function assets(){
  const a=assetsAt(state.data,state.month);
  return `<div class="asset-banner"><div><div class="eyebrow muted-eyebrow">资产与负债</div><h2>资产负债总览</h2><p>资产估值与交易现金流分开记录，避免重复计数。</p></div><div class="asset-banner-figure"><span>净资产</span><strong>${esc(compactMoney(a?.totalFen))}</strong></div></div>
    <div class="stats-grid three-stats">${stat('全部资产',compactMoney(a?.assetsFen),'home','金融、实物及其他资产')}${stat('全部负债',compactMoney(a?.liabilitiesFen),'credit','贷款和其他确定负债')}${stat('金融净资产',compactMoney(a?.financialFen),'wallet','金融资产扣除相关金融负债')}</div>
    <div class="content-grid asset-content">${card(header('资产配置','按最近一次可用快照估值')+assetComposition(a))}${card(header('资产与负债明细',a?`共 ${a.items.length} 个账户，保留估值日期`:'尚未建立资产快照')+assetRows(a))}</div>
    <div class="notice-line">${ICON('question',17)}<span>可动用资金只包含标记为「可用」的资产，并扣除已记录的近期到期债务。房产、保单现金价值不会自动计入可用资金。</span></div>`;
}
function reports(){
  const m=currentMonth(),s=summarize(m),a=assetsAt(state.data,state.month);
  const prev=sortedMonths(state.data).filter(x=>x.month<state.month).at(-1);
  const difference=prev?s.familyExpenseFen-summarize(prev).familyExpenseFen:null;
  return `<div class="report-header"><div class="eyebrow muted-eyebrow">月度回顾</div><h2>${esc(state.month.slice(0,4))} 年 ${Number(state.month.slice(5))} 月家庭月报</h2><p>从收支到资产，一份清晰可追溯的家庭月度记录。</p><div class="report-chips"><span>${ICON('calendar',14)} ${esc(state.month)}</span>${m?pill(m.status):''}<span>${state.mode==='demo'?'演示数据':'加密数据 · 本地查看'}</span></div></div>
    <div class="stats-grid three-stats">${stat('家庭总收入',m?.transactions.length?compactMoney(s.incomeFen):'—','down','实际到账收入')}${stat('全部生活消费',compactMoney(s.livingExpenseFen),'credit','共同消费 + 个人消费合计')}${stat('生活结余',compactMoney(s.livingSurplusFen),'trending','不包含投资转换或储蓄型保费')}</div>
    <div class="content-grid report-content">${card(header('本月消费构成','按已确认的统计口径拆分')+`<div class="report-rows">${kpi('共同日常消费',m?.transactions.length?money(s.dailyFen):'—')}${kpi('共同非经常消费',m?.transactions.length?money(s.occasionalFen):'—')}${kpi('个人消费 · 我',money(m?.personalExpensesFen.me))}${kpi('个人消费 · 老婆',money(m?.personalExpensesFen.spouse))}<div class="report-total">${kpi('全部生活消费',money(s.livingExpenseFen))}</div>${kpi('大额专项资金流出',m?.transactions.length?money(s.projectFen):'—',true)}${kpi('储蓄型保险保费',m?.transactions.length?money(s.insuranceFen):'—',true)}</div>`)}${card(header('月度观察','仅根据真实录入数据生成，不推测收益')+`<div class="insights-list"><div><div class="insight-icon">${ICON('activity')}</div><p>${s.personalComplete?'夫妻个人消费金额已计入全部生活消费。':'个人消费汇总尚未完成，因此无法计算准确的生活结余。'}</p></div><div><div class="insight-icon">${ICON('chart')}</div><p>${difference===null?'暂无上月共同消费数据可供比较。':`本月共同生活消费较上月${difference>0?'增加':difference<0?'减少':'持平'} ${esc(compactMoney(Math.abs(difference)))}。`}</p></div><div><div class="insight-icon">${ICON('home')}</div><p>${a?`已记录 ${a.items.length} 个资产负债账户；未更新的资产继续显示旧估值日期。`:'本月尚未建立可靠资产快照，因此不展示推测的净资产。'}</p></div></div>`)}</div>
    ${card(header('账单导入覆盖情况','每个渠道和账户分别核对，不假设固定账单数量')+sourceTable(m?.importSources||[]),'source-panel')}`;
}
function sourceTable(sources){
  if(!sources.length)return empty('暂无账单来源记录','上传账单时需记录成员、渠道、账户及实际覆盖区间。');
  return `<div class="table-scroll"><table class="data-table"><thead><tr><th>成员</th><th>支付渠道</th><th>账户</th><th>覆盖区间</th><th>状态</th></tr></thead><tbody>${sources.map(s=>`<tr><td>${esc(person(s.member))}</td><td>${esc(s.channel)}</td><td>${esc(s.account)}</td><td>${esc(s.from)} — ${esc(s.to)}</td><td><span class="pill ${s.status==='complete'?'success':'warning'}">${s.status==='complete'?'完整':'部分'}</span></td></tr>`).join('')}</tbody></table></div>`;
}
function render(){
  if(!state.data){root.innerHTML=loginView();return;}
  const views={overview,transactions,assets,reports};
  root.innerHTML=wrapper(views[state.page]());
}
function startSession(mode,data){
  state.mode=mode;state.data=data;state.month=sortedMonths(data).at(-1)?.month||'';
  state.page='overview';state.error='';state.passphrase='';state.filter='all';state.search='';state.mobileMenu=false;
  render();window.scrollTo(0,0);
}
function lock(){state.data=null;state.mode=null;state.passphrase='';state.error='';state.mobileMenu=false;render();window.scrollTo(0,0);}
root.addEventListener('submit',async (event)=>{
  if(event.target.id!=='unlock-form')return;
  event.preventDefault();
  if(state.busy)return;
  state.passphrase=document.querySelector('#passphrase').value;
  if(!state.passphrase)return;
  state.busy=true;state.error='';render();
  try{startSession('real',await fetchAndDecrypt(state.passphrase));}
  catch(err){state.error=err instanceof Error?err.message:'解密失败';}
  finally{state.busy=false;state.passphrase='';render();}
});
root.addEventListener('click',(event)=>{
  const el=event.target.closest('button');
  if(!el)return;
  if(el.dataset.page){state.page=el.dataset.page;state.mobileMenu=false;state.search='';state.filter='all';render();window.scrollTo({top:0,behavior:'smooth'});return;}
  switch(el.dataset.action){
    case 'demo':startSession('demo',demoData);break;
    case 'lock':lock();break;
    case 'reveal':state.passphrase=document.querySelector('#passphrase')?.value||state.passphrase;state.visible=!state.visible;render();document.querySelector('#passphrase')?.focus();break;
    case 'menu':state.mobileMenu=true;render();break;
    case 'close-menu':state.mobileMenu=false;render();break;
  }
});
root.addEventListener('change',(event)=>{
  if(event.target.id==='month-select'){state.month=event.target.value;state.search='';state.filter='all';render();}
  if(event.target.id==='kind-select'){state.filter=event.target.value;render();}
});
root.addEventListener('input',(event)=>{
  if(event.target.id==='passphrase'){state.passphrase=event.target.value;}
  if(event.target.id==='search-input'){
    state.search=event.target.value;
    const selection=event.target.selectionStart;
    render();
    const el=document.querySelector('#search-input');
    el?.focus();if(el?.setSelectionRange)el.setSelectionRange(selection,selection);
  }
});
render();