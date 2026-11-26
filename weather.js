Weather
 · JS
/* Weather detail view: tap the weather widget for hourly + 7-day forecast and other places.
   Add <script src="weather.js"></script> after the other scripts. Uses Open-Meteo (no key). */
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
@media (prefers-reduced-motion:no-preference){.wxb{animation:wxf .25s}@keyframes wxf{from{opacity:0}}}
`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
const o=document.createElement('div');o.id='wxo';o.hidden=true;
o.innerHTML='<div class="wxi"><div class="wxh"><div class="wxc"></div><button class="wxn">Add place</button><button class="wxx on">Done</button></div><div class="wxq" hidden><input type="search" placeholder="Search for a town or city" autocomplete="off"><div class="wxr"></div></div><div class="wxb"></div></div>';
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
let cur=0,cache={},tok=0;
 
function chips(){
  const c=q('.wxc');c.innerHTML='';
  locs().forEach((l,i)=>{const b=document.createElement('button');b.textContent=l.name;if(i===cur)b.className='on';b.onclick=()=>{cur=i;draw()};c.appendChild(b)});
}
function draw(){
  chips();
  const L=locs(),b=q('.wxb');
  if(!L.length){b.innerHTML='<div class="wp"><div class="d" style="color:var(--mute)">No places yet. Use Add place to search, or set your location in Settings.</div></div>';q('.wxq').hidden=false;return}
  const l=L[cur],key=l.lat+','+l.lon,my=++tok,c=cache[key];
  if(c&&Date.now()-c.at<6e5){render(l,c.j);return}
  b.innerHTML='<div class="wp"><div class="d" style="color:var(--mute)">Loading forecast…</div></div>';
  fetch('https://api.open-meteo.com/v1/forecast?latitude='+l.lat+'&longitude='+l.lon+'&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure&hourly=temperature_2m,weather_code,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&wind_speed_unit=mph&forecast_days=7&timezone=auto')
    .then(r=>r.json()).then(j=>{if(!j.current)throw 0;cache[key]={at:Date.now(),j};if(my===tok)render(l,j)})
    .catch(()=>{if(my===tok)b.innerHTML='<div class="wp"><div class="d" style="color:var(--red)">Can’t reach the weather service. Check the connection and tap the place again.</div></div>'});
}
function render(l,j){
  const c=j.current,d=j.daily,h=j.hourly,R=Math.round;
  const i0=Math.max(0,h.time.findIndex(t=>t>=c.time.slice(0,13)+':00'));
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
   +'<div class="wp"><h3>Next 24 hours</h3><div class="wxhr">'+hh+'</div></div>'
   +'<div class="wp"><h3>7-day forecast</h3>'+dd+'</div>'
   +'<div class="wp"><div class="wxg"><div><span>Feels like</span><b>'+R(c.apparent_temperature)+'°</b></div><div><span>Wind</span><b>'+R(c.wind_speed_10m)+' mph '+dir(c.wind_direction_10m)+'</b></div><div><span>Gusts</span><b>'+R(c.wind_gusts_10m)+' mph</b></div><div><span>Humidity</span><b>'+R(c.relative_humidity_2m)+'%</b></div><div><span>Pressure</span><b>'+R(c.surface_pressure)+' hPa</b></div><div><span>UV index today</span><b>'+R(d.uv_index_max[0])+'</b></div><div><span>Sunrise</span><b>'+tm(d.sunrise[0])+'</b></div><div><span>Sunset</span><b>'+tm(d.sunset[0])+'</b></div></div></div>';
  const w=q('.wxw'),rm=q('.wxd2');
  if(w)w.onclick=()=>{S.lat=String(l.lat);S.lon=String(l.lon);S.wxName=l.name;save();W.weather&&W.weather.load&&W.weather.load();draw()};
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
document.addEventListener('click',e=>{if(!document.body.classList.contains('idle')&&e.target.closest('.card.wx')&&o.hidden)open()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!o.hidden)close()});
setInterval(()=>{if(!o.hidden&&typeof wake==='function')wake()},5000);
})();
 
