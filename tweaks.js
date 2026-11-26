/* Widget size setting + clearer homework due dates. Load with <script src="tweaks.js"></script> after the main script. */
(function(){
const box=$('#widgets');

/* widget size */
if(typeof S.wsize!=='number'||!(S.wsize>=60&&S.wsize<=150))S.wsize=100;
function applySize(){
  box.style.zoom=S.wsize===100?'':S.wsize/100;
  window.dispatchEvent(new Event('resize'));
}
applySize();
$('#order').insertAdjacentHTML('afterend','<label>Widget size <span><input type="range" id="wsize" min="60" max="150" step="5" style="width:150px"> <span id="wsv" style="color:var(--mute);display:inline-block;min-width:3.2em;text-align:right">100%</span></span></label>');
const sl=$('#wsize'),lab=$('#wsv');
sl.oninput=()=>{S.wsize=+sl.value;lab.textContent=S.wsize+'%';save();applySize()};
$('#gear').addEventListener('click',()=>{sl.value=S.wsize;lab.textContent=S.wsize+'%'});

/* homework due dates: clearer pill, orange for today, and a hint if no dates are found */
const css=document.createElement('style');
css.textContent=`
.list li .due{background:rgba(255,255,255,.14);border-radius:999px;padding:.35em .9em;font-size:max(12px,2.1vmin);font-weight:500;color:var(--ink);white-space:nowrap}
.list li .due.today{background:rgba(255,159,10,.25);color:#ffb340}
.list li .due.late{background:rgba(255,69,58,.25);color:#ff6961}
.list li.d .due{opacity:.5}
.list .dueHint{flex:none;margin-top:1vmin;font-size:max(12px,2vmin)}
`;
document.head.appendChild(css);

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
