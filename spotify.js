/* Spotify now-playing widget. Load with <script src="spotify.js"></script> after the main script. */
(function(){
const API='https://api.spotify.com/v1',AUTH='https://accounts.spotify.com';
const SCOPE='user-read-playback-state user-modify-playback-state user-read-currently-playing';
if(!S.spId)S.spId='574816147a274f7782f4ccc65fb8419f';
const redirect=()=>location.origin+location.pathname;
const getT=()=>{try{return JSON.parse(localStorage.getItem('sp')||'null')}catch(e){return null}};
const setT=t=>{try{t?localStorage.setItem('sp',JSON.stringify(t)):localStorage.removeItem('sp')}catch(e){}};
const b64=b=>btoa(String.fromCharCode.apply(null,new Uint8Array(b))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
let authErr='';

/* login (PKCE, no server needed) */
async function startAuth(){
  if(!S.spId){msg('Add your Spotify client ID in Settings first.');return}
  try{
    const ver=b64(crypto.getRandomValues(new Uint8Array(48)));
    const ch=b64(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ver)));
    localStorage.setItem('sp_v',ver);
    location.href=AUTH+'/authorize?'+new URLSearchParams({response_type:'code',client_id:S.spId,scope:SCOPE,redirect_uri:redirect(),code_challenge_method:'S256',code_challenge:ch});
  }catch(e){msg('This browser cannot start Spotify login.')}
}
async function token(body){
  const r=await fetch(AUTH+'/api/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(Object.assign({client_id:S.spId},body)).toString()});
  const j=await r.json();
  if(!r.ok)throw new Error(j.error_description||j.error||'Login failed');
  const old=getT()||{};
  setT({a:j.access_token,r:j.refresh_token||old.r,x:Date.now()+(j.expires_in-60)*1000});
}
const ready=(async()=>{
  const q=new URLSearchParams(location.search);
  if(q.get('code')){
    try{await token({grant_type:'authorization_code',code:q.get('code'),redirect_uri:redirect(),code_verifier:localStorage.getItem('sp_v')||''})}
    catch(e){authErr=e.message}
    history.replaceState(null,'',location.pathname+location.hash);
  }else if(q.get('error')){authErr='Spotify login was cancelled.';history.replaceState(null,'',location.pathname+location.hash)}
})();
async function access(){
  let t=getT();if(!t)return null;
  if(Date.now()>t.x){
    if(!t.r){setT(null);return null}
    try{await token({grant_type:'refresh_token',refresh_token:t.r})}
    catch(e){if(/revoked|invalid/i.test(e.message)){setT(null);authErr='Spotify session expired. Connect again.'}throw e}
    t=getT();
  }
  return t&&t.a;
}
async function api(path,method,again){
  const a=await access();if(!a)throw new Error('auth');
  const r=await fetch(API+path,{method:method||'GET',headers:{Authorization:'Bearer '+a}});
  if(r.status===401&&!again){const t=getT();if(t){t.x=0;setT(t)}return api(path,method,true)}
  let j=null;if(r.status===200){try{j=await r.json()}catch(e){}}else if(r.status>=400){try{j=await r.json()}catch(e){}}
  return{status:r.status,j:j,retry:+r.headers.get('Retry-After')||0};
}

/* styles */
const css=document.createElement('style');
css.textContent=`
.spot h2{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spot .sp-main{display:flex;align-items:center;gap:clamp(10px,4cqw,18px)}
.spot .art{flex:none;width:clamp(76px,32cqw,170px);aspect-ratio:1;border-radius:clamp(12px,4cqw,20px);background:rgba(255,255,255,.1) center/cover no-repeat;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.spot .meta{flex:1;min-width:0}
.spot .tt{font-size:clamp(16px,6cqw,28px);font-weight:600;line-height:1.2;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.spot .ar{color:var(--mute);font-size:clamp(13px,4.4cqw,20px);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.spot .bw{padding:clamp(10px,3.4cqw,16px) 0 clamp(4px,1.4cqw,6px);cursor:pointer;touch-action:manipulation}
.spot .bar{height:clamp(4px,1.2cqw,6px);border-radius:9px;background:rgba(255,255,255,.2);overflow:hidden}
.spot .bar i{display:block;height:100%;background:#fff;transform-origin:0 50%;transform:scaleX(0);will-change:transform}
.spot .tm{display:flex;justify-content:space-between;font-size:clamp(11px,3.4cqw,14px);color:var(--faint);font-variant-numeric:tabular-nums}
.spot .ctl{display:flex;justify-content:center;align-items:center;gap:clamp(12px,5cqw,24px);margin-top:clamp(6px,2cqw,10px)}
.spot .ctl button{width:clamp(40px,12cqw,56px);height:clamp(40px,12cqw,56px);padding:0;display:grid;place-items:center;border-radius:50%}
.spot .ctl .pp{width:clamp(50px,15cqw,68px);height:clamp(50px,15cqw,68px);background:#f5f5f7;color:#000}
.spot .ctl svg{width:46%;height:46%}
.spot .sp-off .sub{font-size:clamp(13px,4.2cqw,18px)}
#spRedir{user-select:all;-webkit-user-select:all;word-break:break-all;color:var(--mute)}
`;
document.head.appendChild(css);

/* widget */
const IC={
 play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
 pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
 prev:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
 next:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5l11 7L4 19z"/></svg>'};
function spotifyWidget(){
  const el=document.createElement('div');el.className='card spot';
  el.innerHTML='<h2>Spotify</h2><div class="sp-off"><div class="sub"></div><div class="row"><button class="on sp-c">Connect Spotify</button></div></div><div class="sp-on" hidden><div class="sp-main"><div class="art"></div><div class="meta"><div class="tt"></div><div class="ar"></div></div></div><div class="bw"><div class="bar"><i></i></div></div><div class="tm"><span class="t1">0:00</span><span class="t2">0:00</span></div><div class="ctl"><button class="pv" aria-label="Previous">'+IC.prev+'</button><button class="pp" aria-label="Play or pause"></button><button class="nx" aria-label="Next">'+IC.next+'</button></div><div class="err"></div></div>';
  const q=s=>el.querySelector(s);
  const h2=q('h2'),off=q('.sp-off'),offMsg=q('.sp-off .sub'),btn=q('.sp-c'),on=q('.sp-on'),art=q('.art'),tt=q('.tt'),ar=q('.ar'),bw=q('.bw'),bar=q('.bar i'),t1=q('.t1'),t2=q('.t2'),pp=q('.pp'),eb=q('.err');
  let P=null,err='',cerr='',shown=null,hold=0,busy=false;
  const fmt=ms=>{const s=Math.max(0,Math.floor(ms/1000));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
  const cur=()=>P?Math.min(P.dur,P.prog+(P.playing?Date.now()-P.at:0)):0;
  const pick=im=>{if(!im||!im.length)return'';return(im[1]||im[0]).url};
  function render(){
    const con=!!getT();
    off.hidden=!!(con&&P);on.hidden=!(con&&P);btn.hidden=con;
    if(!con)offMsg.textContent=authErr||(S.spId?'Connect your Spotify account to show what’s playing.':'Add your Spotify client ID in Settings.');
    else if(!P)offMsg.textContent=cerr||err||'Nothing playing. Start Spotify on any device and it will show up here.';
    if(!(con&&P)){h2.textContent='Spotify';shown=null;return}
    if(shown!==P.id){
      shown=P.id;tt.textContent=P.name;ar.textContent=P.sub;t2.textContent=fmt(P.dur);
      art.style.backgroundImage=P.img?'url("'+P.img+'")':'none';
    }
    h2.textContent=P.dev?'Spotify · '+P.dev:'Spotify';
    pp.innerHTML=P.playing?IC.pause:IC.play;
    eb.textContent=cerr||err;
    prog();
  }
  function prog(){
    if(!P||on.hidden)return;
    const ms=cur();
    bar.style.transform='scaleX('+(P.dur?ms/P.dur:0)+')';
    t1.textContent=fmt(ms);
  }
  async function poll(){
    await ready;
    if(!getT()||busy){if(!getT())render();return}
    busy=true;
    try{
      const r=await api('/me/player?additional_types=episode');
      if(r.status===429){hold=Date.now()+Math.max(5,r.retry)*1000}
      else if(r.status===204||(r.status===200&&(!r.j||!r.j.item))){P=null;err=''}
      else if(r.status===200){
        const it=r.j.item;
        P={id:it.id||it.uri,playing:!!r.j.is_playing,prog:r.j.progress_ms||0,dur:it.duration_ms||0,at:Date.now(),name:it.name||'',
           sub:it.artists?it.artists.map(a=>a.name).join(', '):(it.show?it.show.name:''),
           img:pick(it.album?it.album.images:it.images),dev:r.j.device?r.j.device.name:''};
        err='';
      }else err='Spotify error '+r.status+'.';
    }catch(e){err=e.message==='auth'?'':'Can’t reach Spotify.'}
    busy=false;render();
  }
  async function cmd(path,method){
    let m='';
    try{
      const r=await api(path,method);
      if(r.status===403)m='Playback controls need Spotify Premium.';
      else if(r.status===404)m='No active Spotify device. Open Spotify on one first.';
      else if(r.status>=400)m='Spotify error '+r.status+'.';
    }catch(e){m='Can’t reach Spotify.'}
    if(m){cerr=m;render();setTimeout(()=>{cerr='';render()},5000)}
    setTimeout(poll,700);
  }
  pp.onclick=()=>{if(!P)return;P.prog=cur();P.at=Date.now();P.playing=!P.playing;render();cmd(P.playing?'/me/player/play':'/me/player/pause','PUT')};
  q('.pv').onclick=()=>cmd('/me/player/previous','POST');
  q('.nx').onclick=()=>cmd('/me/player/next','POST');
  bw.onclick=e=>{if(!P||!P.dur)return;const r=bw.getBoundingClientRect(),ms=Math.round(Math.min(1,Math.max(0,(e.clientX-r.left)/r.width))*P.dur);P.prog=ms;P.at=Date.now();prog();cmd('/me/player/seek?position_ms='+ms,'PUT')};
  btn.onclick=startAuth;
  el.refresh=()=>{P=null;render();poll()};
  let n=0,wasIdle=true;
  setInterval(()=>{
    if(document.hidden)return;
    const idle=document.body.classList.contains('idle');
    if(!idle)prog();
    n++;
    const wake=wasIdle&&!idle;wasIdle=idle;
    if(Date.now()<hold)return;
    if(wake||n%(idle?30:5)===0)poll();
  },1000);
  render();poll();
  return el;
}

/* register with the main app */
NAMES.spotify='Spotify';MAKE.spotify=spotifyWidget;
if(S.on.spotify===undefined)S.on.spotify=1;
if(!S.order.includes('spotify')){const i=S.order.indexOf('timer');S.order.splice(i<0?S.order.length:i+1,0,'spotify')}
save();layout();

/* settings section */
$('#dlg .foot').insertAdjacentHTML('beforebegin','<h3>Spotify</h3><small>Create an app at developer.spotify.com/dashboard, add the Redirect URI below to it exactly, then tap Connect. Showing what’s playing is free; the buttons need Premium.</small><label>Client ID <input type="text" id="spId" placeholder="Spotify client ID"></label><small>Redirect URI (tap to select)</small><small id="spRedir"></small><div class="row"><button id="spConn">Connect Spotify</button><button id="spOut">Disconnect</button></div>');
$('#gear').addEventListener('click',()=>{$('#spId').value=S.spId||'';$('#spRedir').textContent=redirect()});
$('#close').addEventListener('click',()=>{S.spId=$('#spId').value.trim();save()});
$('#spConn').onclick=()=>{S.spId=$('#spId').value.trim();save();startAuth()};
$('#spOut').onclick=()=>{setT(null);authErr='';if(W.spotify)W.spotify.refresh();msg('Spotify disconnected.');setTimeout(()=>msg(''),2500)};
})();
