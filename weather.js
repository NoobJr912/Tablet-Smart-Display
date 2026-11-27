/* Weather detail view: tap the weather widget for hourly + 7-day forecast and other places.
   Add <script src="weather.js"></script> after the other scripts. Uses Open-Meteo (no key).
   v4: the bottom tiles are now shared functions (window.wxTiles) so wxtiles.js can show each one as its own widget. */
(()=>{
const css=`
.card.wx{cursor:pointer}
#wxo{position:fixed;inset:0;z-index:60;display:flex;justify-content:center;background:rgba(6,7,12,.93)}
#wxo[hidden]{display:none}
#wxo button{font-size:clamp(13px,2.2vmin,17px);white-space:nowrap;flex:none}
.wxi{width:min(900px,100%);height:100%;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:max(16px,env(safe-area-inset-top)) clamp(14px,3vw,28px) 32px}
.wxi::-webkit-scrollbar{display:none}
.wxh{display:flex;gap:8px;align-items:center}
.wxc{flex:1;min-width:0;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}
.wxc::-webkit-scrollbar{display:none}
.wxq{margin-top:12px}
.wxq input{width:100%;background:rgba(255,255,255,.09);border:0;border-radius:14px;padding:12px 16px;font-size:17px;outline:0;color:var(--ink)}
.wxq input::placeholder{color:var(--faint)}
.wxr button{display:block;width:100%;text-align:left;border-radius:12px;background:none;padding:12px 8px;border-bottom:1px solid var(--sep)}
.wxr small{color:var(--mute);margin-left:6px}
.wp{background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.05));box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 0 0 1px rgba(255,255,255,.1);border-radius:26px;padding:clamp(14px,2.4vw,22px);margin-top:14px}
.wp h3{font-size:14px;font-weight:600;color:var(--mute);margin-bottom:10px}
.wxm{text-align:center;padding:14px 0 6px}
.wxm .pl{font-size:clamp(20px,3.4vmin,28px);font-weight:500}
.wxm .t{display:flex;justify-content:center;align-items:center;gap:12px}
.wxm .t svg{width:clamp(64px,13vmin,110px);height:clamp(64px,13vmin,110px)}
.wxm .t b{font-size:clamp(64px,16vmin,130px);font-weight:200;letter-spacing:-.045em}
.wxm .d{color:var(--mute);font-size:clamp(15px,2.6vmin,21px)}
.wxm .row{justify-content:center}
.wxg{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px}
.wxg div{background:rgba(255,255,255,.06);border-radius:18px;padding:12px 14px}
.wxg span{display:block;color:var(--mute);font-size:13px}
.wxg b{display:block;font-size:clamp(18px,3vmin,24px);font-weight:400;margin-top:2px}
.wxhr{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none}
.wxhr::-webkit-scrollbar{display:none}
.wxe{flex:none;width:60px;text-align:center;font-size:15px}
.wxe svg{width:38px;height:38px;display:block;margin:4px auto}
.wxe i{display:block;font-style:normal;color:#64d2ff;font-size:12px;min-height:15px}
.wxe em{display:block;font-style:normal;color:var(--mute);font-size:13px}
.wxd{display:grid;grid-template-columns:62px 36px 42px 34px 1fr 34px;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--sep);font-size:clamp(15px,2.4vmin,19px)}
.wxd:last-child{border:0}
.wxd svg{width:32px;height:32px}
.wxd .r{color:#64d2ff;font-size:13px}
.wxd .lo{color:var(--mute);text-align:right}
.wxd .hi{text-align:right}
.wxd .bar{position:relative;height:6px;border-radius:3px;background:rgba(255,255,255,.14)}
.wxd .bar u{position:absolute;top:0;bottom:0;border-radius:3px;background:linear-gradient(90deg,#64d2ff,#ffd60a,#ff9f0a)}
#wxo .wxx{width:42px;height:42px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:50%}
.wxx svg{width:16px;height:16px}
.ins{font-size:clamp(16px,2.8vmin,22px);line-height:1.35;margin-top:10px}
.wtg{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;margin-top:14px}
.wtg2{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-top:12px}
.wt{background:linear-gradient(180deg,rgba(255,255,255,.12),rgba(255,255,255,.05));box-shadow:inset 0 1px 0 rgba(255,255,255,.3),inset 0 0 0 1px rgba(255,255,255,.1);border-radius:26px;padding:16px}
.wt>span{display:block;color:var(--mute);font-size:14px;font-weight:600;margin-bottom:8px}
.wt>b{display:block;font-size:clamp(24px,4vmin,34px);font-weight:300}
.wt em{display:block;color:var(--mute);font-style:normal;font-size:14px;margin-top:6px}
.wsun{width:100%;display:block}
.wsr{display:flex;justify-content:space-between;margin-top:4px}
.wsr i{display:block;font-style:normal;color:var(--mute);font-size:13px}
.wsr b{font-weight:400;font-size:clamp(17px,2.6vmin,21px)}
.wsr div:last-child{text-align:right}
.uvh{display:flex;align-items:baseline;gap:10px}
.uvh b{font-size:clamp(30px,5vmin,42px);font-weight:300}
.ubs{display:flex;gap:4px;align-items:flex-end;height:84px;margin-top:10px}
.ub{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;align-items:center}
.ub u{display:block;width:100%;border-radius:4px}
.ub s{display:block;height:14px;margin-top:4px;font-size:10px;text-decoration:none;color:var(--mute);white-space:nowrap}
.wwd{display:flex;align-items:center;gap:14px}
.wwd svg{width:96px;height:96px;flex:none}
@media (prefers-reduced-motion:no-preference){.wxb{animation:wxf .25s}@keyframes wxf{from{opacity:0}}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const o=document.createElement('div');o.id='wxo';o.hidden=true;
o.innerHTML='<div class="wxi"><div class="wxh"><div class="wxc"></div><button class="wxn">Add place</button><button class="wxx" aria-label="Close"><svg viewBox="0 0 16 16"><path d="M3 3l10 10M13 3L3 13" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg></button></div><div class="wxq" hidden><input type="search" placeholder="Search for a town or city" autocomplete="off"><div class="wxr"></div></div><div class="wxb"></div></div>';
document.body.appendChild(o);
const q=s=>o.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const locs=()=>S.wxLocs||(S.wxLocs=[]);
const same=(a,b)=>Math.abs(+a.lat-+b.lat)<.01&&Math.abs(+a.lon-+b.lon)<.01;
const isHome=l=>!!(S.lat&&S.lon&&same(l,{lat:S.lat,lon:S.lon}));
const wxt=c=>c==0?'Clear':c<3?'Partly cloudy':c<4?'Cloudy':c<50?'Fog':c<60?'Drizzle':c<70?'Rain':c<80?'Snow':c<90?'Showers':'Thunderstorm';
const f2=n=>String(n).padStart(2,'0');
const tm=t=>{const h=+t.slice(11,13);return S.h24?t.slice(11,16):((h%12||12)+':'+t.slice(14,16)+(h<12?' am':' pm'))};
const hr=t=>{const h=+t.slice(11,13);return S.h24?f2(h):((h%12||12)+(h<12?'am':'pm'))};
const dir=d=>['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];
let cur=0,cache={},tok=0,inflight={};

/* one shared forecast request per place, cached for 5 minutes, used by the menu and by the tile widgets */
const ckey=(lat,lon)=>(+lat)+','+(+lon);
const fresh=(lat,lon)=>{const c=cache[ckey(lat,lon)];return c&&Date.now()-c.at<3e5?c.j:null};
function getJ(lat,lon){
  const k=ckey(lat,lon),f=fresh(lat,lon);
  if(f)return Promise.resolve(f);
  if(inflight[k])return inflight[k];
  return inflight[k]=fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability,is_day,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&wind_speed_unit=mph&forecast_days=7&timezone=auto')
    .then(r=>r.json()).then(j=>{if(!j.current)throw 0;return j})
    .then(j=>{cache[k]={at:Date.now(),j};delete inflight[k];return j},e=>{delete inflight[k];throw e});
}

function chips(){
  const c=q('.wxc');c.innerHTML='';
  locs().forEach((l,i)=>{const b=document.createElement('button');b.textContent=l.name;if(i===cur)b.className='on';b.onclick=()=>{cur=i;draw()};c.appendChild(b)});
}
function draw(){
  chips();
  const L=locs(),b=q('.wxb');
  if(!L.length){b.innerHTML='<div class="wp"><div class="d" style="color:var(--mute)">No places yet. Use Add place to search, or set your location in Settings.</div></div>';q('.wxq').hidden=false;return}
  const l=L[cur],my=++tok,c=fresh(l.lat,l.lon);
  if(c){render(l,c);return}
  b.innerHTML='<div class="wp"><div class="d" style="color:var(--mute)">Loading forecast…</div></div>';
  getJ(l.lat,l.lon).then(j=>{if(my===tok)render(l,j)})
    .catch(()=>{if(my===tok)b.innerHTML='<div class="wp"><div class="d" style="color:var(--red)">Can’t reach the weather service. Check the connection and tap the place again.</div></div>'});
}
const lvl=u=>u<3?'Low':u<6?'Moderate':u<8?'High':u<11?'Very high':'Extreme';
const uvc=u=>u<3?'#30d158':u<6?'#ffd60a':u<8?'#ff9f0a':u<11?'#ff453a':'#bf5af2';
const mins=t=>+t.slice(11,13)*60+ +t.slice(14,16);
const idx=(c,h)=>Math.max(0,h.time.findIndex(t=>t>=c.time.slice(0,13)+':00'));
function insight(c,h,i0){
  const R=Math.round,n=Math.min(24,h.time.length-i0),P=k=>h.precipitation_probability[i0+k],T=k=>h.temperature_2m[i0+k];
  const kind=k=>{const w=h.weather_code[i0+k];return w>=95?'Thunderstorms':(w>=71&&w<=77)||w==85||w==86?'Snow':'Rain'};
  let s=-1;for(let k=0;k<n;k++)if(P(k)>=50){s=k;break}
  if(s===0){let e=-1;for(let k=1;k<n;k++)if(P(k)<30){e=k;break}
    return kind(0)+(e>0?' should ease around '+hr(h.time[i0+e])+'.':' is likely for the rest of the day.')}
  if(s>0)return kind(s)+' expected from '+hr(h.time[i0+s])+'.';
  if(c.wind_gusts_10m>=30)return 'Gusty today, with winds up to '+R(c.wind_gusts_10m)+' mph.';
  let mx=0,mn=0;for(let k=1;k<Math.min(n,12);k++){if(T(k)>T(mx))mx=k;if(T(k)<T(mn))mn=k}
  if(T(mx)-T(0)>=3)return 'Warming to '+R(T(mx))+'° around '+hr(h.time[i0+mx])+'.';
  if(T(0)-T(mn)>=3)return 'Cooling to '+R(T(mn))+'° around '+hr(h.time[i0+mn])+'.';
  return 'Dry for the next 24 hours'+(c.weather_code<3?', with '+(c.is_day?'plenty of sun':'clear skies')+'.':'.');
}
function sunTile(c,d){
  const a=mins(d.sunrise[0]),b=mins(d.sunset[0]),f=(mins(c.time)-a)/(b-a),up=f>=0&&f<=1,p=Math.min(1,Math.max(0,f)),g=Math.PI*p;
  const arc='M20 70A90 60 0 0 1 200 70';
  return '<div class="wt"><span>Sunrise and sunset</span><svg class="wsun" viewBox="0 0 220 80"><line x1="6" y1="70" x2="214" y2="70" stroke="rgba(255,255,255,.25)"/><path d="'+arc+'" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/>'
   +(up?'<path d="'+arc+'" fill="none" stroke="#ffd60a" stroke-width="3" stroke-linecap="round" pathLength="100" stroke-dasharray="'+p*100+' 100"/><circle cx="'+(110-90*Math.cos(g))+'" cy="'+(70-60*Math.sin(g))+'" r="8" fill="#ffd60a"/>':'')
   +'</svg><div class="wsr"><div><i>Sunrise</i><b>'+tm(d.sunrise[0])+'</b></div><div><i>Sunset</i><b>'+tm(d.sunset[0])+'</b></div></div><em>'+(up?'':'The sun is down. ')+Math.floor((b-a)/60)+'h '+f2((b-a)%60)+'m of daylight today</em></div>';
}
function uvTile(c,h,i0){
  const day=c.time.slice(0,10),R=Math.round;let bars='',pk=-1,pt='',n=0;
  for(let k=i0;k<h.time.length&&h.time[k].slice(0,10)===day;k++){
    const u=h.uv_index[k];if(!h.is_day[k]&&u<.5)continue;
    if(u>pk){pk=u;pt=hr(h.time[k])}
    bars+='<div class="ub"><u style="height:'+Math.max(4,Math.min(1,u/11)*56)+'px;background:'+uvc(u)+'"></u><s>'+(n++%2?'':hr(h.time[k]))+'</s></div>';
  }
  const u0=h.uv_index[i0]||0;
  return '<div class="wt"><span>UV index</span><div class="uvh"><b>'+R(u0)+'</b><span style="margin:0">'+lvl(u0)+'</span></div>'+(bars?'<div class="ubs">'+bars+'</div><em>Peak of '+R(pk)+' ('+lvl(pk).toLowerCase()+') at '+pt+'</em>':'<em>No more UV today</em>')+'</div>';
}
function windTile(c){
  const R=Math.round;
  return '<div class="wt"><span>Wind</span><div class="wwd"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="2"/><g font-size="11" fill="#fff" text-anchor="middle" style="font-family:var(--font)"><text x="50" y="17">N</text><text x="50" y="92">S</text><text x="12" y="54">W</text><text x="88" y="54">E</text></g><g transform="rotate('+(c.wind_direction_10m+180)+' 50 50)"><line x1="50" y1="66" x2="50" y2="34" stroke="#64d2ff" stroke-width="4" stroke-linecap="round"/><polygon points="50,26 42,40 58,40" fill="#64d2ff"/></g></svg><div><b style="font-size:clamp(24px,4vmin,34px);font-weight:300">'+R(c.wind_speed_10m)+' mph</b><em>From the '+dir(c.wind_direction_10m)+'</em><em>Gusts up to '+R(c.wind_gusts_10m)+' mph</em></div></div></div>';
}
function feelsTile(c){
  const df=c.apparent_temperature-c.temperature_2m;
  return '<div class="wt"><span>Feels like</span><b>'+Math.round(c.apparent_temperature)+'°</b><em>'+(df<=-2?'Colder than the air temperature':df>=2?'Warmer than the air temperature':'Close to the air temperature')+'</em></div>';
}
const humTile=c=>'<div class="wt"><span>Humidity</span><b>'+Math.round(c.relative_humidity_2m)+'%</b></div>';
const presTile=c=>'<div class="wt"><span>Pressure</span><b>'+Math.round(c.surface_pressure)+' hPa</b></div>';

/* used by wxtiles.js to show each tile as its own widget */
window.wxTiles={
  load:getJ,
  html:(kind,j)=>{
    const c=j.current,h=j.hourly,d=j.daily;
    return kind==='uv'?uvTile(c,h,idx(c,h)):kind==='sun'?sunTile(c,d):kind==='wind'?windTile(c):kind==='feels'?feelsTile(c):kind==='humidity'?humTile(c):presTile(c);
  }
};

function render(l,j){
  const c=j.current,d=j.daily,h=j.hourly,R=Math.round;
  const i0=idx(c,h);
  let hh='';
  for(let i=i0;i<i0+24&&i<h.time.length;i++)hh+='<div class="wxe">'+(i===i0?'Now':hr(h.time[i]))+wxIcon(h.weather_code[i],h.is_day[i])+'<i>'+(h.precipitation_probability[i]>=20?h.precipitation_probability[i]+'%':'')+'</i>'+R(h.temperature_2m[i])+'°</div>';
  const mn=Math.min(...d.temperature_2m_min),mx=Math.max(...d.temperature_2m_max),sp=Math.max(1,mx-mn);
  let dd='';
  d.time.forEach((s,i)=>{
    const lo=d.temperature_2m_min[i],hi=d.temperature_2m_max[i],p=d.precipitation_probability_max[i];
    dd+='<div class="wxd"><span>'+(i?new Date(s+'T12:00').toLocaleDateString([],{weekday:'short'}):'Today')+'</span>'+wxIcon(d.weather_code[i],1)+'<span class="r">'+(p>=20?p+'%':'')+'</span><span class="lo">'+R(lo)+'°</span><div class="bar"><u style="left:'+((lo-mn)/sp*100)+'%;width:'+Math.max(4,(hi-lo)/sp*100)+'%"></u></div><span class="hi">'+R(hi)+'°</span></div>';
  });
  const L=locs();
  let act='';
  if(!isHome(l))act+='<button class="wxw">Show on widget</button>';
  else act+='<div class="d" style="margin-top:4px">Shown on widget</div>';
  if(!isHome(l)&&L.length>1)act+='<button class="wxd2">Remove</button>';
  q('.wxb').innerHTML='<div class="wxm"><div class="pl">'+esc(l.name)+'</div><div class="t">'+wxIcon(c.weather_code,c.is_day)+'<b>'+R(c.temperature_2m)+'°</b></div><div class="d">'+wxt(c.weather_code)+' · High '+R(d.temperature_2m_max[0])+'°, low '+R(d.temperature_2m_min[0])+'°</div><div class="row">'+act+'</div></div>'
   +'<div class="wp ins">'+insight(c,h,i0)+'</div>'
   +'<div class="wp"><h3>Next 24 hours</h3><div class="wxhr">'+hh+'</div></div>'
   +'<div class="wp"><h3>7-day forecast</h3>'+dd+'</div>'
   +'<div class="wtg">'+uvTile(c,h,i0)+sunTile(c,d)+windTile(c)+'</div>'
   +'<div class="wtg2">'+feelsTile(c)+humTile(c)+presTile(c)+'</div>';
  const w=q('.wxw'),rm=q('.wxd2');
  if(w)w.onclick=()=>{S.lat=String(l.lat);S.lon=String(l.lon);S.wxName=l.name;save();W.weather&&W.weather.load&&W.weather.load();window.wxRefresh&&window.wxRefresh();draw()};
  if(rm)rm.onclick=()=>{L.splice(cur,1);cur=Math.max(0,L.findIndex(isHome));save();draw()};
}
function open(){
  const L=locs();
  if(S.lat&&S.lon&&!L.some(isHome))L.unshift({name:S.wxName||'Home',lat:+S.lat,lon:+S.lon});
  cur=Math.max(0,L.findIndex(isHome));
  q('.wxq').hidden=true;q('.wxq input').value='';q('.wxr').innerHTML='';
  o.hidden=false;q('.wxi').scrollTop=0;draw();
}
const close=()=>{o.hidden=true};
q('.wxx').onclick=close;
q('.wxn').onclick=()=>{const s=q('.wxq');s.hidden=!s.hidden;if(!s.hidden)s.querySelector('input').focus()};
let tmr;
q('.wxq input').oninput=e=>{
  clearTimeout(tmr);const v=e.target.value.trim(),r=q('.wxr');
  if(v.length<2){r.innerHTML='';return}
  tmr=setTimeout(()=>fetch('https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name='+encodeURIComponent(v))
    .then(x=>x.json()).then(j=>{
      r.innerHTML='';
      if(!j.results){r.innerHTML='<div class="d" style="color:var(--mute);padding:10px 8px">No places found.</div>';return}
      j.results.forEach(p=>{
        const b=document.createElement('button');b.innerHTML=esc(p.name)+'<small>'+esc([p.admin1,p.country].filter(Boolean).join(', '))+'</small>';
        b.onclick=()=>{const L=locs();let i=L.findIndex(x=>same(x,{lat:p.latitude,lon:p.longitude}));if(i<0){L.push({name:p.name,lat:+p.latitude.toFixed(3),lon:+p.longitude.toFixed(3)});i=L.length-1}cur=i;save();q('.wxq').hidden=true;q('.wxq input').value='';r.innerHTML='';draw()};
        r.appendChild(b);
      });
    }).catch(()=>{r.innerHTML='<div class="d" style="color:var(--red);padding:10px 8px">Search failed. Check the connection.</div>'}),350);
};
window.wxOpen=open;
document.addEventListener('click',e=>{
  const t=e.target;
  if(o.hidden&&t&&t.closest&&t.closest('.card.wx')){
    try{open()}catch(err){const m=document.getElementById('msg');if(m)m.textContent='Weather view error: '+err.message}
  }
},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!o.hidden)close()});
setInterval(()=>{if(!o.hidden&&typeof wake==='function')wake()},5000);
})();
