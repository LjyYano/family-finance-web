// Zero-dependency SVG donut chart. Amounts come from summarized confirmed household transactions.
const fmtPoint=(degrees,radius)=>{
  const rad=(degrees-90)*Math.PI/180;
  return [110+radius*Math.cos(rad),110+radius*Math.sin(rad)].map(n=>n.toFixed(3)).join(' ');
};
export function donutPath(from,to){
  const outer=88,inner=56,sweep=to-from;
  if(sweep<=0)return '';
  if(sweep>=359.999999){
    const half=from+180;
    return [
      'M',fmtPoint(from,outer),
      'A',outer,outer,0,1,1,fmtPoint(half,outer),
      'A',outer,outer,0,1,1,fmtPoint(from,outer),
      'L',fmtPoint(from,inner),
      'A',inner,inner,0,1,0,fmtPoint(half,inner),
      'A',inner,inner,0,1,0,fmtPoint(from,inner),'Z'
    ].join(' ');
  }
  const large=sweep>180?1:0;
  return [
    'M',fmtPoint(from,outer),
    'A',outer,outer,0,large,1,fmtPoint(to,outer),
    'L',fmtPoint(to,inner),
    'A',inner,inner,0,large,0,fmtPoint(from,inner),'Z'
  ].join(' ');
}
const displayPercent=fraction=>{
  if(fraction>0 && fraction<0.001)return '<0.1%';
  return (fraction*100).toFixed(1)+'%';
};
export function renderPieChart(summary,{esc,money,palette}){
  const items=summary.categories.filter(category=>category.amountFen>0);
  const netTotal=summary.familyExpenseFen;
  const positiveTotal=items.reduce((sum,item)=>sum+item.amountFen,0);
  if(!positiveTotal)return '';
  let cursor=0;
  const slices=items.map((item,index)=>{
    const fraction=item.amountFen/positiveTotal;
    const end=cursor+360*fraction;
    const mid=(cursor+end)/2-90;
    const x=(8*Math.cos(mid*Math.PI/180)).toFixed(2);
    const y=(8*Math.sin(mid*Math.PI/180)).toFixed(2);
    const rate=displayPercent(fraction);
    const color=palette[index%palette.length];
    const shareAttrs=
      'data-pie-category="'+esc(item.key)+'" '+
      'data-pie-name="'+esc(item.name)+'" '+
      'data-pie-amount="'+esc(money(item.amountFen,2))+'" '+
      'data-pie-percent="'+esc(rate)+'"';
    const svg=
      '<path class="pie-slice" d="'+donutPath(cursor,end)+'" fill="'+color+'" '+
      shareAttrs+' tabindex="0" role="button" aria-label="'+esc(item.name+'：'+rate+'，'+money(item.amountFen,2)+'，点击查看明细')+'" '+
      'style="--slice-x:'+x+'px;--slice-y:'+y+'px">'+
      '<title>'+esc(item.name)+' · '+esc(rate)+' · '+esc(money(item.amountFen,2))+'</title></path>';
    const legend=
      '<button type="button" class="pie-legend-row" '+shareAttrs+'>'+
      '<span class="pie-legend-dot" style="background:'+color+'"></span>'+
      '<span class="pie-legend-name">'+esc(item.name)+'</span>'+
      '<span class="pie-legend-percent">'+esc(rate)+'</span>'+
      '<strong class="pie-legend-amount">'+esc(money(item.amountFen,2))+'</strong>'+
      '</button>';
    cursor=end;
    return {svg,legend};
  });
  const hasNegative=summary.categories.some(item=>item.amountFen<0);
  return '<div class="category-pie" data-pie-total="'+esc(money(netTotal,2))+'">'+
    '<div class="pie-figure">'+
      '<svg class="pie-svg" viewBox="0 0 220 220" role="img" aria-label="本月家庭共同消费分类占比">'+
      slices.map(item=>item.svg).join('')+
      '</svg>'+
      '<div class="pie-center" aria-hidden="true">'+
        '<span data-pie-center-name>共同消费</span>'+
        '<strong data-pie-center-amount>'+esc(money(netTotal,2))+'</strong>'+
        '<small data-pie-center-percent>分类占比</small>'+
      '</div>'+
    '</div>'+
    '<div class="pie-legend" aria-label="选择类别查看明细">'+slices.map(item=>item.legend).join('')+'</div>'+
    (hasNegative?'<p class="pie-refund-note">负数退款已计入净支出，未绘入比例。</p>':'')+
  '</div>';
}
