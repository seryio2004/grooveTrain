'use strict';
// Beat figures and their scalable SVG notation.
const FIGS=[
{id:'two',name:'Dos corcheas',n:2,notes:[0,.5],beams:1},
{id:'sixteen',name:'Cuatro semicorcheas',n:4,notes:[0,.25,.5,.75],beams:2},
{id:'trip',name:'Tresillo de corcheas',n:3,notes:[0,1/3,2/3],beams:1,tuplet:3},
{id:'quint',name:'Quintillo',n:5,notes:[0,.2,.4,.6,.8],beams:2,tuplet:5},
{id:'sext',name:'Seisillo',n:6,notes:[0,1/6,2/6,3/6,4/6,5/6],beams:2,tuplet:6},
{id:'quarter',name:'Negra',n:1,notes:[0],beams:0},
{id:'splitA',name:'Dos semicorcheas y corchea',n:3,notes:[0,.25,.5],beams:1,extraBeam:'first'},
{id:'splitB',name:'Corchea y dos semicorcheas',n:3,notes:[0,.5,.75],beams:1,extraBeam:'last'},
{id:'rest',name:'Silencio de corchea y corchea',n:1,notes:[.5],beams:0,rest:true},
{id:'sync',name:'Corchea y silencio',n:1,notes:[0],beams:0,restRight:true}
];

function svgFig(fig){
const xs=fig.notes.length===1?[fig.rest?105:75] : fig.notes.map((_,i)=>22+i*(134/(fig.notes.length-1)));
const staffY=88,stemTop=35;let s=`<svg viewBox="0 0 180 124" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">`;
if(fig.tuplet)s+=`<text x="90" y="23" fill="currentColor" font-size="21" font-weight="850" text-anchor="middle" font-family="Arial, sans-serif">${fig.tuplet}</text>`;
xs.forEach((x,i)=>{s+=`<ellipse cx="${x}" cy="${staffY}" rx="10.1" ry="6.7" transform="rotate(-20 ${x} ${staffY})" fill="currentColor"/><path d="M${x+8} ${staffY-2}V${stemTop}" stroke="currentColor" stroke-width="3.2" stroke-linecap="square"/>`;});
if(xs.length>1){const x1=xs[0]+8,x2=xs[xs.length-1]+8;s+=`<path d="M${x1} ${stemTop}H${x2}" stroke="currentColor" stroke-width="6"/>`;if(fig.beams>1)s+=`<path d="M${x1} ${stemTop+11}H${x2}" stroke="currentColor" stroke-width="5.3"/>`;if(fig.extraBeam==='first')s+=`<path d="M${xs[0]+8} ${stemTop+11}H${xs[1]+8}" stroke="currentColor" stroke-width="5.3"/>`;if(fig.extraBeam==='last')s+=`<path d="M${xs[1]+8} ${stemTop+11}H${xs[2]+8}" stroke="currentColor" stroke-width="5.3"/>`;
}else if(!fig.rest && !fig.restRight){s+=`<path d="M83 ${stemTop+1}q20 7 2 24" stroke="currentColor" fill="none" stroke-width="3.5"/>`;}else{s+=`<path d="M${xs[0]+8} 40q21 6 4 23" stroke="currentColor" fill="none" stroke-width="3.7"/>`;}
if(fig.rest || fig.restRight){const rx=fig.rest?48:128;s+=`<path d="M${rx-7} 52q13 -18 12 0q-1 11 -14 19q6 -11 2 -14M${rx+3} 48L${rx-1} 67" stroke="currentColor" fill="none" stroke-width="3.7" stroke-linecap="round"/>`}
s+=`</svg>`;return s;
}

window.GrooveFigures = { FIGS, svgFig };
