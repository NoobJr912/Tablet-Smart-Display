/* Weather tiles as individual widgets: UV index, Sunrise and sunset, Wind, Feels like, Humidity, Pressure.
   Each one is switched on or off in Settings > Widgets (all start switched off) and can be reordered there.
   They also stay in the weather menu. Tapping one opens the weather menu.
   Add <script src="wxtiles.js"></script> AFTER weather.js. Uses the shared forecast request from weather.js. */
(()=>{try{
if(!window.wxTiles){msg('Weather tiles: weather.js is out of date. Use weather.js?v=4 and hard refresh.');return}
const style=document.createElement('style');
style.textContent=`
.card.wtw{cursor:pointer}
.card.wtw .wt{background:none;box-shadow:none;border-radius:0;padding:0}
.card.wtw .wt>b{font-size:clamp(34px,min(15cqw,9vmin),90px)}
.card.wtw .wt em{font-size:clamp(12px,min(4.6cqw,2.4vmin),22px)}
.card.wtw .wsun{max-height:24vmin}
.card.wtw .wsr b{font-size:clamp(17px,min(7cqw,3vmin),30px)}
.card.wtw .ubs{height:clamp(84px,16vmin,160px)}
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
    if(!S.lat||!S.lon){b.innerHTML='<div class="sub">Add your location in Settings.</div>';return}
    const my=++n;
    wxTiles.load(S.lat,S.lon).then(j=>{
      if(my!==n)return;
      /* the card already has the title as its heading, so drop the tile's own */
      b.innerHTML=wxTiles.html(kind,j).replace(/^<div class="wt"><span>.*?<\/span>/,'<div class="wt">');
    }).catch(()=>{if(my===n&&!b.querySelector('.wt'))b.innerHTML='<div class="sub">Can’t reach the weather service.</div>'});
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
layout();

/* refresh the tile widgets: when the forecast changes, a different place is shown on the widget, or Settings closes */
window.wxRefresh=()=>ids.forEach(id=>W[id]&&W[id].load&&W[id].load());
setInterval(window.wxRefresh,5*60*1000+2000);
const done=document.getElementById('close'),prev=done&&done.onclick;
if(done)done.onclick=function(){if(prev)prev.apply(this,arguments);window.wxRefresh()};
}catch(e){msg('Weather tiles error: '+e.message)}
})();
