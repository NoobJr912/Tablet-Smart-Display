/* newtab.js: adds a Search widget and a Bookmarks widget to the smart display.
   Load it last in index.html:  <script src="newtab.js"></script> */
(function(){
/* open an address in the whole tab, even when this page sits inside the new-tab frame */
const nav=u=>{
  if(window.top!==window){
    try{window.top.postMessage({sdNav:u},'*')}catch(e){}
    try{window.top.location.href=u}catch(e){}
  }else location.href=u;
};
const ENG={google:['Google','https://www.google.com/search?q='],ddg:['DuckDuckGo','https://duckduckgo.com/?q='],bing:['Bing','https://www.bing.com/search?q='],brave:['Brave','https://search.brave.com/search?q='],ecosia:['Ecosia','https://www.ecosia.org/search?q=']};
if(!ENG[S.engine])S.engine='google';
if(typeof S.bm!=='string')S.bm='';
if(S.stay===undefined)S.stay=1;

/* styles, matching the existing glass cards */
const st=document.createElement('style');
st.textContent=`
.card.srch{grid-column:1/-1;min-height:0;padding:clamp(10px,2.2vmin,18px) clamp(16px,3vmin,28px);display:flex;align-items:center;gap:clamp(10px,2vmin,16px)}
.srch svg{flex:none;width:clamp(18px,3vmin,26px);height:clamp(18px,3vmin,26px);opacity:.6}
.srch input{flex:1;min-width:0;background:none;border:0;outline:0;font-size:clamp(17px,3.2vmin,28px);color:var(--ink);user-select:text;-webkit-user-select:text}
.srch input::placeholder{color:var(--faint)}
.card.bm{grid-column:1/-1;min-height:0}
.bmg{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(76px,16cqw,110px),1fr));gap:clamp(8px,2cqw,16px)}
.bmg a{display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--ink);text-decoration:none;min-width:0;-webkit-tap-highlight-color:transparent}
.bmg .ic{width:clamp(48px,9cqw,68px);aspect-ratio:1;border-radius:22%;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.1);display:grid;place-items:center;overflow:hidden;font-weight:600;font-size:clamp(18px,3.4cqw,26px);transition:transform .15s}
.bmg a:active .ic{transform:scale(.93)}
.bmg img{width:56%;height:56%}
.bmg .n{font-size:clamp(11px,2cqw,14px);color:var(--mute);max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
`;
document.head.appendChild(st);

/* search widget */
function searchWidget(){
  const el=document.createElement('div');el.className='card srch';
  el.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search">';
  const inp=el.querySelector('input');
  el.sync=()=>{inp.placeholder='Search '+ENG[S.engine][0]+' or enter an address'};
  const go=v=>{
    v=v.trim();if(!v)return;
    if(/^https?:\/\//i.test(v))nav(v);
    else if(!/\s/.test(v)&&/^[^\s\/]+\.[a-z]{2,}(:\d+)?([\/?#]\S*)?$/i.test(v))nav('https://'+v);
    else nav(ENG[S.engine][1]+encodeURIComponent(v));
  };
  inp.onkeydown=e=>{if(e.key==='Enter')go(inp.value);if(e.key==='Escape')inp.value=''};
  el.sync();
  return el;
}

/* bookmarks widget */
const parse=txt=>txt.split('\n').map(l=>{
  l=l.trim();if(!l)return null;
  let n='',u=l;const i=l.lastIndexOf('|');
  if(i>-1){n=l.slice(0,i).trim();u=l.slice(i+1).trim()}
  if(!/^[a-z][a-z0-9+.-]*:/i.test(u))u='https://'+u;
  try{const o=new URL(u);if(!/^https?:$/.test(o.protocol))return null;
    return{n:n||o.hostname.replace(/^www\./,''),u:o.href,h:o.hostname}}catch(e){return null}
}).filter(Boolean);
function bookmarksWidget(){
  const el=document.createElement('div');el.className='card bm';
  el.innerHTML='<h2>Bookmarks</h2><div class="bmg"></div>';
  const g=el.querySelector('.bmg');
  el.draw=()=>{
    g.innerHTML='';
    const list=parse(S.bm);
    if(!list.length){g.style.display='block';g.innerHTML='<div class="sub">Add bookmarks in Settings.</div>';return}
    g.style.display='';
    list.forEach(b=>{
      const a=document.createElement('a');a.href=b.u;a.target='_top';
      const ic=document.createElement('div');ic.className='ic';
      const letter=()=>{ic.textContent=(b.n[0]||'?').toUpperCase()};
      const im=new Image();im.alt='';
      const srcs=['https://www.google.com/s2/favicons?sz=64&domain='+encodeURIComponent(b.h),'https://icons.duckduckgo.com/ip3/'+b.h+'.ico','https://'+b.h+'/favicon.ico'];let k=0;
      im.onerror=()=>{if(++k<srcs.length)im.src=srcs[k];else{im.remove();letter()}};
      im.src=srcs[0];
      a.onclick=e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button)return;e.preventDefault();nav(b.u)};
      ic.appendChild(im);
      const n=document.createElement('span');n.className='n';n.textContent=b.n;
      a.append(ic,n);g.appendChild(a);
    });
  };
  el.draw();
  return el;
}

/* register with the existing widget system, search and bookmarks on top by default */
NAMES.search='Search';NAMES.bookmarks='Bookmarks';
MAKE.search=searchWidget;MAKE.bookmarks=bookmarksWidget;
['bookmarks','search'].forEach(id=>{if(!S.order.includes(id)){S.order.unshift(id);S.on[id]=1}});
save();layout();

/* settings */
const foot=document.querySelector('#dlg .foot');
foot.insertAdjacentHTML('beforebegin',`
<h3>Search and bookmarks</h3>
<label>Search engine <select id="engine">${Object.entries(ENG).map(([k,v])=>`<option value="${k}">${v[0]}</option>`).join('')}</select></label>
<label>Stay on the full display (never fall back to the clock) <input type="checkbox" id="stay"></label>
<small>Bookmarks: one per line as <b>Name | address</b>. The name is optional.</small>
<textarea id="bm" style="height:120px" spellcheck="false" placeholder="Gmail | mail.google.com&#10;github.com"></textarea>
<label>Import a bookmarks file <input type="file" id="bmfile" accept=".html,.htm"></label>
<small id="bmnote">In your browser, export bookmarks as an HTML file, then choose it here. Bookmarks-bar items are imported when found; edit the list afterwards.</small>`);
const $b=s=>document.querySelector(s);
$b('#gear').addEventListener('click',()=>{$b('#engine').value=S.engine;$b('#stay').checked=!!S.stay;$b('#bm').value=S.bm});
$b('#bmfile').onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  const doc=new DOMParser().parseFromString(await f.text(),'text/html');
  const bar=doc.querySelector('h3[personal_toolbar_folder]');
  let links=bar&&bar.nextElementSibling?[...bar.nextElementSibling.querySelectorAll('a[href]')]:[];
  const where=links.length?'from your bookmarks bar':'(all bookmarks, no bar folder found)';
  if(!links.length)links=[...doc.querySelectorAll('a[href]')];
  const have=new Set(parse($b('#bm').value).map(b=>b.u));
  const add=parse(links.map(a=>(a.textContent.replace(/[|\n]/g,' ').trim()||'')+' | '+a.getAttribute('href')).join('\n')).filter(b=>!have.has(b.u));
  const v=$b('#bm').value.trim();
  $b('#bm').value=(v?v+'\n':'')+add.map(b=>b.n+' | '+b.u).join('\n');
  $b('#bmnote').textContent='Imported '+add.length+' bookmarks '+where+'. Delete any you don’t want, then press Done.';
  e.target.value='';
};
$b('#close').addEventListener('click',()=>{
  S.engine=$b('#engine').value;S.stay=$b('#stay').checked?1:0;S.bm=$b('#bm').value;
  save();W.search&&W.search.sync();W.bookmarks&&W.bookmarks.draw();
  if(S.stay)wake();
});

/* optionally keep the full display up, and focus the search box so you can type straight away */
const _set=setActive;
setActive=function(a){if(!a&&S.stay)return;_set(a)};
if(S.stay){wake();const i=W.search&&W.search.querySelector('input');if(i)i.focus()}

/* settings button: round icon, bottom right */
const gear=document.querySelector('#gear');
gear.innerHTML='<svg viewBox="0 0 24 24" width="55%" height="55%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>';
gear.setAttribute('aria-label','Settings');gear.title='Settings';
const gs=document.createElement('style');
gs.textContent=`#gear{top:auto;right:max(2.5vmin,env(safe-area-inset-right));bottom:max(2.5vmin,env(safe-area-inset-bottom));width:clamp(40px,6vmin,54px);height:clamp(40px,6vmin,54px);padding:0;display:grid;place-items:center;border-radius:50%;background:rgba(255,255,255,.12);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);color:var(--mute);z-index:5}
body:not(.idle) main{padding-top:max(4vmin,env(safe-area-inset-top));padding-bottom:max(9vmin,60px)}`;
document.head.appendChild(gs);

/* if Notion fetches fail (for example the network is not ready when a new tab opens), retry, and refresh when the tab is shown again */
const BAD=/failed to fetch|load failed|network/i;
async function heal(k){
  for(let n=0;n<5;n++){
    await new Promise(r=>setTimeout(r,2500*(n+1)));
    const w=W[k];if(!w||!w.load)return;
    const e=w.querySelector('.err');
    if(!e||!BAD.test(e.textContent))return;
    await w.load();
  }
}
['tasks','homework'].forEach(heal);
const refresh=()=>['tasks','homework'].forEach(k=>{if(W[k]&&W[k].load)W[k].load().then(()=>heal(k))});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});
addEventListener('online',refresh);
})();
