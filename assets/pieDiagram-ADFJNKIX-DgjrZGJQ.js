import{t as e}from"./ordinal-DUFd1juy.js";import{t}from"./arc-B8AHd8-H.js";import{Gn as n,Jt as r,Kn as i,Mn as a,P as o,Pn as s,Pt as c,Sn as l,Yt as u,dn as d,gn as f,jn as p,jt as m,k as h,mn as g,vn as _,xn as v,yn as y}from"./index-CVL7bqYx.js";import"./chunk-FPAJGGOC-UDtoYC1C.js";import"./chunk-O7ZBX7Z2-B1Rfld96.js";import"./chunk-S6J4BHB3-B6jivXI6.js";import"./chunk-LBM3YZW2-4AXWgmbU.js";import"./chunk-76Q3JFCE-Eu5_jV79.js";import"./chunk-T53DSG4Q-DpaCAXnF.js";import"./chunk-LHMN2FUI-Ci2mMsgR.js";import"./chunk-FWNWRKHM-iG3bU1y8.js";import{t as b}from"./chunk-4BX2VUAB--_iymYna.js";import{t as x}from"./mermaid-parser.core-BtDJ7Q6E.js";function S(e,t){return t<e?-1:t>e?1:t>=e?0:NaN}function C(e){return e}function w(){var e=C,t=S,n=null,i=u(0),a=u(r),o=u(0);function s(s){var l,u=(s=c(s)).length,d,f,p=0,m=Array(u),h=Array(u),g=+i.apply(this,arguments),_=Math.min(r,Math.max(-r,a.apply(this,arguments)-g)),v,y=Math.min(Math.abs(_)/u,o.apply(this,arguments)),b=y*(_<0?-1:1),x;for(l=0;l<u;++l)(x=h[m[l]=l]=+e(s[l],l,s))>0&&(p+=x);for(t==null?n!=null&&m.sort(function(e,t){return n(s[e],s[t])}):m.sort(function(e,n){return t(h[e],h[n])}),l=0,f=p?(_-u*b)/p:0;l<u;++l,g=v)d=m[l],x=h[d],v=g+(x>0?x*f:0)+b,h[d]={data:s[d],index:l,value:x,startAngle:g,endAngle:v,padAngle:y};return h}return s.value=function(t){return arguments.length?(e=typeof t==`function`?t:u(+t),s):e},s.sortValues=function(e){return arguments.length?(t=e,n=null,s):t},s.sort=function(e){return arguments.length?(n=e,t=null,s):n},s.startAngle=function(e){return arguments.length?(i=typeof e==`function`?e:u(+e),s):i},s.endAngle=function(e){return arguments.length?(a=typeof e==`function`?e:u(+e),s):a},s.padAngle=function(e){return arguments.length?(o=typeof e==`function`?e:u(+e),s):o},s}var T=f.pie,E={sections:new Map,showData:!1,config:T},D=E.sections,O=E.showData,k=structuredClone(T),A={getConfig:n(()=>structuredClone(k),`getConfig`),clear:n(()=>{D=new Map,O=E.showData,d()},`clear`),setDiagramTitle:s,getDiagramTitle:l,setAccTitle:a,getAccTitle:y,setAccDescription:p,getAccDescription:_,addSection:n(({label:e,value:t})=>{if(t<0)throw Error(`"${e}" has invalid value: ${t}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);D.has(e)||(D.set(e,t),i.debug(`added new section: ${e}, with value: ${t}`))},`addSection`),getSections:n(()=>D,`getSections`),setShowData:n(e=>{O=e},`setShowData`),getShowData:n(()=>O,`getShowData`)},j=n((e,t)=>{b(e,t),t.setShowData(e.showData),e.sections.map(t.addSection)},`populateDb`),M={parse:n(async e=>{let t=await x(`pie`,e);i.debug(t),j(t,A)},`parse`)},N=n(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,`getStyles`),P=n(e=>{let t=[...e.values()].reduce((e,t)=>e+t,0),n=[...e.entries()].map(([e,t])=>({label:e,value:t})).filter(e=>e.value/t*100>=1).sort((e,t)=>t.value-e.value);return w().value(e=>e.value)(n)},`createPieArcs`),F={parser:M,db:A,renderer:{draw:n((n,r,a,s)=>{i.debug(`rendering pie chart
`+n);let c=s.db,l=v(),u=h(c.getConfig(),l.pie),d=m(r),f=d.append(`g`);f.attr(`transform`,`translate(225,225)`);let{themeVariables:p}=l,[_]=o(p.pieOuterStrokeWidth);_??=2;let y=u.textPosition,b=t().innerRadius(0).outerRadius(185),x=t().innerRadius(185*y).outerRadius(185*y);f.append(`circle`).attr(`cx`,0).attr(`cy`,0).attr(`r`,185+_/2).attr(`class`,`pieOuterCircle`);let S=c.getSections(),C=P(S),w=[p.pie1,p.pie2,p.pie3,p.pie4,p.pie5,p.pie6,p.pie7,p.pie8,p.pie9,p.pie10,p.pie11,p.pie12],T=0;S.forEach(e=>{T+=e});let E=C.filter(e=>(e.data.value/T*100).toFixed(0)!==`0`),D=e(w);f.selectAll(`mySlices`).data(E).enter().append(`path`).attr(`d`,b).attr(`fill`,e=>D(e.data.label)).attr(`class`,`pieCircle`),f.selectAll(`mySlices`).data(E).enter().append(`text`).text(e=>(e.data.value/T*100).toFixed(0)+`%`).attr(`transform`,e=>`translate(`+x.centroid(e)+`)`).style(`text-anchor`,`middle`).attr(`class`,`slice`),f.append(`text`).text(c.getDiagramTitle()).attr(`x`,0).attr(`y`,-400/2).attr(`class`,`pieTitleText`);let O=[...S.entries()].map(([e,t])=>({label:e,value:t})),k=f.selectAll(`.legend`).data(O).enter().append(`g`).attr(`class`,`legend`).attr(`transform`,(e,t)=>{let n=22*O.length/2;return`translate(216,`+(t*22-n)+`)`});k.append(`rect`).attr(`width`,18).attr(`height`,18).style(`fill`,e=>D(e.label)).style(`stroke`,e=>D(e.label)),k.append(`text`).attr(`x`,22).attr(`y`,14).text(e=>c.getShowData()?`${e.label} [${e.value}]`:e.label);let A=512+Math.max(...k.selectAll(`text`).nodes().map(e=>e?.getBoundingClientRect().width??0));d.attr(`viewBox`,`0 0 ${A} 450`),g(d,450,A,u.useMaxWidth)},`draw`)},styles:N};export{F as diagram};