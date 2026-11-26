/* Tweaks: widget size, fixed page with scrolling widgets, list text/date fixes.
   Load with <script src="tweaks.js"></script> after the main script. */
(function(){
const box=$('#widgets');

/* ---------- widget size ---------- */
if(typeof S.wsize!=='number'||!(S.wsize>=60&&S.wsize<=150))S.wsize=100;
function applySize(){
  box.style.zoom=S.wsize===100?'':S.wsize/100;
  window.dispatchEvent(new Event('resize'));
}
$('#order').insertAdjacentHTML('afterend','<label>Widget size <span><input type="range" id="wsize" min="60" max="150" step="5" style="width:150px"> <span id="wsv" style="color:var(--mute);display:inline-block;min-width:3.2em;text-align:right">100%</span></span></label>');
const sl=$('#wsize'),lab=$('#wsv');
sl.oninput=()=>{S.wsize=+sl.value;lab.textContent=S.wsize+'%';save();applySize()};
$('#gear').addEventListener('click',()=>{sl.value=S.wsize;lab.textContent=S.wsize+'%'});

/* ---------- styles ---------- */
const css=document.createElement('style');
css.textContent=`
/* the page never scrolls; only the widget area does */
html,body{overflow:hidden!important}
body:not(.idle) main{height:100dvh!important;min-height:0!important}
#wscroll{flex:1 1 auto;min-height:0;overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none}
#wscroll::-webkit-scrollbar{display:none}
body.idle #wscroll{flex:none;height:0;overflow:hidden}
body:not(.idle) #widgets{flex:none!important;height:auto!important;overflow:visible!important;padding-bottom:6vmin!important}
#widgets>.shr{transform:scale(var(--sh,1));transform-origin:50% 100%;opacity:var(--so,1)}

/* homework and tasks: same text scale as the other widgets, columns that cannot overlap */
.list li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:0 clamp(8px,1.8vmin,16px);align-items:center;font-size:clamp(13px,min(4.4cqw,2.3vmin),22px)}
.list li .t{min-width:0;overflow-wrap:anywhere}
.list li .due{grid-column:3;justify-self:end;background:rgba(255,255,255,.14);border-radius:999px;padding:.3em .8em;font-size:clamp(11px,min(3.6cqw,1.9vmin),16px);font-weight:500;color:var(--ink);white-space:nowrap}
.list li .due.today{background:rgba(255,159,10,.25);color:#ffb340}
.list li .due.late{background:rgba(255,69,58,.25);color:#ff6961}
.list li.d .due{opacity:.5}
@container (max-width:300px){.list li .due{grid-column:2;grid-row:2;justify-self:start;margin-top:4px}}
.list .add input,.list .add select{font-size:clamp(13px,min(4.2cqw,2.2vmin),20px)}
.list .sub{font-size:clamp(12px,min(4.2cqw,2.2vmin),18px)}
.list .dueHint{flex:none;margin-top:1vmin}
`;
document.head.appendChild(css);

/* ---------- fixed page, scrolling widgets, top card shrinks ---------- */
const ws=document.createElement('div');ws.id='wscroll';
box.parentNode.insertBefore(ws,box);ws.appendChild(box);
let raf=0;
function shrink(){
  raf=0;
  if(document.body.classList.contains('idle'))return;
  const top=ws.getBoundingClientRect().top;
  const out=[...box.children].map(k=>{
    const r=k.getBoundingClientRect(),sh=+k.dataset.sh||1,full=r.height/sh;
    const above=top-(r.bottom-full);
    const p=full>0?Math.min(1,Math.max(0,above/Math.min(full*.6,260))):0;
    return[k,p];
  });
  out.forEach(([k,p])=>{
    if(p<=0.01){if(k.classList.contains('shr')){k.classList.remove('shr');k.dataset.sh='1';k.style.removeProperty('--sh');k.style.removeProperty('--so')}return}
    const sh=1-.12*p;
    k.classList.add('shr');k.dataset.sh=sh;
    k.style.setProperty('--sh',sh);k.style.setProperty('--so',1-.55*p);
  });
}
const req=()=>{if(!raf)raf=requestAnimationFrame(shrink)};
ws.addEventListener('scroll',req,{passive:true});
window.addEventListener('resize',req);
new ResizeObserver(req).observe(box);
new MutationObserver(req).observe(document.body,{attributes:true,attributeFilter:['class']});
applySize();req();

/* ---------- homework: hint if no due dates are found, orange for today ---------- */
function polish(c){
  const lists=c.querySelector('.lists');if(!lists)return;
  lists.querySelectorAll('.due').forEach(d=>d.classList.toggle('today',d.textContent==='Today'&&!d.classList.contains('late')));
  let hint=c.querySelector('.dueHint');
  const need=S.token&&S.proxy&&lists.querySelectorAll('li').length>0&&!lists.querySelector('.due');
  if(need&&!hint){
    hint=document.createElement('div');hint.className='sub dueHint';
    hint.textContent='No due dates found. In Settings, set “Due date property” to the exact name of a Date property in your homework database.';
    c.insertBefore(hint,c.querySelector('.err'));
  }else if(!need&&hint)hint.remove();
}
let watched=null;
function attach(){
  const c=W.homework;
  if(!c||c===watched)return;
  watched=c;
  new MutationObserver(()=>polish(c)).observe(c.querySelector('.lists'),{childList:true});
  polish(c);
}
attach();setInterval(attach,2000);
})();
