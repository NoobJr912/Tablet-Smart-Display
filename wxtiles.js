/* Weather tiles as individual widgets: UV index, Sunrise and sunset, Wind, Feels like, Humidity, Pressure.
   Each one is switched on or off in Settings > Widgets (all start switched off) and can be reordered there.
   They also stay in the weather menu. Tapping one opens the weather menu.
   Tiles that sit next to each other in the order are grouped two per row, each half the size of a normal widget.
   Add <script src="wxtiles.js"></script> AFTER weather.js. Uses the shared forecast request from weather.js. */
(()=>{try{
if(!window.wxTiles)return;
const style=document.createElement('style');
style.textContent=`
.wtgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2.4vmin;align-content:start}
.card.wtw{cursor:pointer;min-height:0;min-width:0;padding:clamp(10px,2.4cqw,14px) clamp(12px,3cqw,16px);border-radius:24px}
.card.wtw h2{font-size:12px;margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card.wtw .wt{background:none;box-shadow:none;border-radius:0;padding:0}
.card.wtw .wt>b{font-size:clamp(24px,17cqw,40px)}
.card.wtw .wt em{font-size:12px;margin-top:3px}
.card.wtw .uvh{gap:6px}
.card.wtw .uvh b{font-size:clamp(24px,17cqw,36px)}
.card.wtw .uvh span{font-size:12px}
.card.wtw .ubs{height:50px;margin-top:6px;gap:2px}
.card.wtw .ub u{border-radius:2px}
.card.wtw .ub s{font-size:9px;height:11px;margin-top:2px}
.card.wtw .wsun{max-height:52px}
.card.wtw .wsr{margin-top:2px}
.card.wtw .wsr i{font-size:11px}
.card.wtw .wsr b{font-size:clamp(13px,9cqw,17px)}
.card.wtw .wwd{gap:8px}
.card.wtw .wwd svg{width:52px;height:52px}
.card.wtw .wwd b{font-size:clamp(18px,12cqw,26px)!important}
.card.wtw .wwd em{margin-top:1px}
`;
document.head.appendChild(style);

/* id: [title shown on the card, name in Settings, tile kind] */
const KINDS={
  wxuv:['UV index','Weather: UV index','uv'],
  wxsun:['Sunrise and sunset','Weather: Sunrise and sunset','sun'],
  wxwind:['Wind','Weather: Wind','wind'],
  wxfeels:['Feels like','Weather: Feels like','feels'],
  wxhum:['Humidity','Weather: Humidity','humidity'],
  wxpres:['Pressure','Weather: Pressure','pressure']
};
const ids=Object.keys(KINDS);

function make(id){
  const [title,,kind]=KINDS[id];
  const el=document.createElement('div');el.className='card wtw';
  el.innerHTML='<h2></h2><div class="wtb"></div>';
  el.querySelector('h2').textContent=title;
  const b=el.querySelector('.wtb');
  let n=0;
  el.onclick=()=>{try{window.wxOpen&&window.wxOpen()}catch(e){}};
  el.load=()=>{
    if(!S.lat||!S.lon){b.innerHTML='<div class="sub" style="font-size:12px">Add your location in Settings.</div>';return}
    const my=++n;
    wxTiles.load(S.lat,S.lon).then(j=>{
      if(my!==n)return;
      /* the card already has the title as its heading, so drop the tile's own */
      b.innerHTML=wxTiles.html(kind,j).replace(/^<div class="wt"><span>.*?<\/span>/,'<div class="wt">');
    }).catch(()=>{if(my===n&&!b.querySelector('.wt'))b.innerHTML='<div class="sub" style="font-size:12px">Can’t reach the weather service.</div>'});
  };
  el.load();
  return el;
}

/* register with the main app: names, builders, position in the order list, off by default */
let pos=S.order.indexOf('weather')+1;
ids.forEach(id=>{
  NAMES[id]=KINDS[id][1];
  MAKE[id]=()=>make(id);
  if(!S.order.includes(id)){S.order.splice(pos||S.order.length,0,id);if(pos)pos++}
  if(S.on[id]===undefined)S.on[id]=0;
});
save();

/* after every layout, put each run of neighbouring tile widgets into one two-column group */
function group(){
  const box=document.getElementById('widgets');let run=null;
  [...box.children].forEach(k=>{
    if(k.classList&&k.classList.contains('wtw')){
      if(!run){run=document.createElement('div');run.className='wtgrid';box.insertBefore(run,k)}
      run.appendChild(k);
    }else run=null;
  });
}
const baseLayout=layout;
layout=function(){baseLayout.apply(this,arguments);group()};
layout();

/* refresh the tile widgets: when the forecast changes, a different place is shown on the widget, or Settings closes */
window.wxRefresh=()=>ids.forEach(id=>W[id]&&W[id].load&&W[id].load());
setInterval(window.wxRefresh,5*60*1000+2000);
const done=document.getElementById('close'),prev=done&&done.onclick;
if(done)done.onclick=function(){if(prev)prev.apply(this,arguments);window.wxRefresh()};
}catch(e){console.error(e);try{msg('Weather tiles error: '+e.message)}catch(x){}}
})();
