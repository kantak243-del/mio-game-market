/* ===== 起動 ===== */
load();
function hasSave(){return !!G.savedAt;}
function renderTitle(){
  const t=$('titleMenu');t.innerHTML='';
  const add=(label,sub,fn)=>{const b=document.createElement('button');b.className='opt';b.innerHTML=label+(sub?' <small>'+sub+'</small>':'');b.onclick=fn;t.appendChild(b);};
  if(hasSave())add('つづきから','記録 '+G.savedAt,()=>startGame(false));
  add('はじめから',hasSave()?'（今の記録は 消える）':'',()=>{if(!hasSave()){startGame(true);return;}
    t.innerHTML='<div style="font-size:14px;margin:4px 0 8px">今の 記録を 消して、はじめから 遊ぶ？</div>';
    const y=document.createElement('button');y.className='opt';y.textContent='はい、はじめから';y.onclick=async()=>{await eraseSave();applySave(null);startGame(true);};t.appendChild(y);
    const n=document.createElement('button');n.className='opt';n.textContent='いいえ';n.onclick=()=>renderTitle();t.appendChild(n);});
  add('あそびかた','',()=>showHowTo());
  const n=document.createElement('div');n.className='dim';n.style.cssText='font-size:11px;margin-top:6px;line-height:1.5';
  n.textContent=({cloud:'記録は アカウントに 保存されます',local:'記録は この端末に 保存されます',none:'この画面では 自動の記録が できません。ゲーム中の セーブ画面で「ふっかつのじゅもん」を 控えてください'})[storeMode()];t.appendChild(n);
  const lk=document.createElement('button');lk.className='opt';lk.style.cssText='font-size:12px;color:var(--muted);padding-left:18px';lk.textContent='（予備）ふっかつのじゅもんで 再開';lk.onclick=()=>showCodeInput();t.appendChild(lk);
}
function showHowTo(){
  const t=$('titleMenu');t.innerHTML='<div style="font-size:13px;line-height:1.7;text-align:left">'+
  '<b>いどう</b>：十字キー、または 画面を なぞる<br><b>しらべる</b>：人と 話す・調べる（ぶつかっても 話せる）<br><b>メニュー</b>：そうび・なかま・どうぐ・セーブ・ひこうてい<br>'+
  '<b>戦闘「紡ぎバトル」</b>：行動の 順番を 並べて 戦う。<br>・属性の 技は「残り」を 置く。同じ 属性で つなぐと 融合（火＋火＝陽炎）、ちがう 属性は 反応（火＋水＝蒸気）<br>・敵の「ためる」の 直後に 斬る系で 崩すと 大技を 止められる<br>・名前の 色：赤＝格上、白＝同格、灰＝格下（触れるだけで 倒せる）<br>・「おまかせ」「オート」も 使える<br>'+
  '<b>記録</b>：自動で セーブされる。寄り道も 含めて 約 8〜10時間。クエストは メニューで 確認できる。</div>';
  const back=document.createElement('button');back.className='opt';back.textContent='もどる';back.onclick=()=>renderTitle();t.appendChild(back);
}
function showCodeInput(){
  const t=$('titleMenu');t.innerHTML='<div style="font-size:14px;margin-bottom:6px">ふっかつのじゅもんを 貼りつけてね</div><textarea id="codeIn" style="width:100%;height:110px;font:12px monospace;background:#111;color:#FFF;border:1px solid #FFF6;border-radius:6px;padding:6px"></textarea><div id="codeErr" style="color:var(--dead);font-size:13px;min-height:18px"></div>';
  const go=document.createElement('button');go.className='opt';go.textContent='これで はじめる';t.appendChild(go);
  const back=document.createElement('button');back.className='opt';back.textContent='もどる';t.appendChild(back);
  $('codeIn').oninput=()=>{$('codeErr').textContent='';};
  back.onclick=()=>renderTitle();
  go.onclick=async()=>{const v=$('codeIn').value.trim();if(!v){$('codeErr').textContent='じゅもんを 貼りつけてから 押してね';return;}
    try{const obj=await readCode(v);if(!obj||!obj.party)throw 0;applySave(obj);save();startGame(false);}catch(e){$('codeErr').textContent='じゅもんが ちがうみたい。全部 コピーできているか 確かめてね';}};
}
function startGame(fresh){
  $('titleView').hidden=true;$('topbar').hidden=false;$('fieldView').hidden=false;
  M=getMap(G.map);safe={x:G.px,y:G.py};insideTrig=new Set(currentTrigs().map(t=>t.key));
  resize();renderTop();renderMsg();
  if(fresh||!G.flags.opening){G.flags.opening=true;runScript(STORY.opening());}
  else toast(M.d.title||'');
}
let last=performance.now();
function loop(t){const dt=Math.min(.05,(t-last)/1000);last=t;if(M){update(dt);if(mode==='field')draw();}requestAnimationFrame(loop);}
(async()=>{
  $('titleMenu').innerHTML='<div class="dim" style="padding:8px">記録を よみこみ中……</div>';
  await Promise.race([initCloud(),sleep(6000)]);
  const c=await cloudLoad();const l=localLoad();
  const pickNewer=(a,b)=>!a?b:!b?a:((a.savedTs||0)>=(b.savedTs||0)?a:b);
  applySave(pickNewer(c,l));
  renderTitle();
})();
requestAnimationFrame(loop);
