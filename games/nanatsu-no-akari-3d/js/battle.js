/* ===== 紡ぎバトル ===== */
let B=null,plan=[],busy=false,auto=false,amode='power',blines=[],active=null,picking=null,bover=null,bloot=null,bResolve=null;
/* 仲間の人数に合わせた敵の強さ（序章の敵は固定） */
const hpFactor=n=>0.2+0.2*n;
/* 章が進むほど 敵を 固く・痛く（第1章は そのまま） */
const lvRamp=d=>Math.max(0,Math.min(1,(d.lv-12)/12));
const dmgFactor=(d,n)=>d.fixed?1:(0.5+0.125*n)*(1+lvRamp(d)*0.5)*(n===1&&d.boss?0.8:1)*(d.hard||1)*(d.lv>=8&&n>1?1.35:1);
const scaledHP=(d,n)=>d.fixed?d.hp:Math.round(d.hp*hpFactor(n)*(1+lvRamp(d)*0.6)*(n===1&&d.boss?0.75:1)*(d.hpMul||1)*(d.lv>=8&&n>1?1.25:1));
const nSlots=n=>n===1?2:n;
function orderFor(n){return n===1?[['p',0],['e',0],['p',1],['e',1]]:n===2?[['p',0],['e',0],['p',1],['e',1]]:n===3?[['p',0],['p',1],['e',0],['p',2],['e',1]]:[['p',0],['p',1],['e',0],['p',2],['p',3],['e',1]];}
const NUM='①②③④';
const cmdOK=m=>!(m.t==='elem'&&G.lost.includes(m.e)&&!m.ember)&&!(m.req&&!G.flags[m.req]);
function intentsOf(b){const c=FOES[b.k].cycle;return c[b.turn%c.length];}
function simulate(st,plan,intents){
  const d=FOES[st.k];const ORDER=orderFor(st.ids.length);
  const s={hp:st.hp.slice(),ehp:st.ehp,angry:st.angry};
  const ev=[];let res=d.tailwind?{e:'風',left:99,p:60,between:[],tail:true}:null,guard=false,miss=false,slow=1,charging=false,broken=false;
  const fx=st.fx||{};const lenOf=e=>e==='火'&&fx.ember3?3:ELEM[e].len;
  const push=o=>{o.hp=s.hp.slice();o.ehp=s.ehp;o.angry=s.angry;ev.push(o);};
  const hitE=(v,ci)=>{v=Math.round(v*st.cm[ci]);s.ehp=Math.max(d.unkillable?1:0,s.ehp-v);return v;};
  const healAll=(v,ci)=>{const out=s.hp.map(()=>0);v=Math.round(v*st.cm[ci]);s.hp.forEach((h,i)=>{if(h>0){const n=Math.min(st.max[i],h+v);out[i]=n-h;s.hp[i]=n;}});return out;};
  const enr=d.boss&&!d.fixed&&(st.turn||0)>=12?1+0.3*(st.turn-11):1;
  const hitP=(idxs,base)=>{const out=s.hp.map(()=>0);const mul=(s.angry?1.35:1)*(guard?0.5:1)*slow*enr;slow=1;
    idxs.forEach(i=>{if(s.hp[i]>0){const v=Math.round(base*mul*st.dm[i]*(st.dmgF||1));s.hp[i]=Math.max(0,s.hp[i]-v);out[i]=v;}});return out;};
  for(const [k,i] of ORDER){
    if(s.ehp<=0||s.hp.every(h=>h<=0))break;
    if(k==='p'){
      const a=plan[i];if(!a)continue;
      const c=CHARS[st.ids[a.ci]];
      if(s.hp[a.ci]<=0){push({slot:i,type:'skip',text:c.name+'は うごけない'});continue;}
      const m=c.cmds[a.mi];
      if(m.t==='elem'){
        let tag=null,dmg=m.p,ph=null,clear=false;
        if(res&&res.left>0){
          if(res.e===m.e){
            dmg=(res.p+m.p)*1.8;const mods=[];
            if(res.between.includes('guard')){guard=true;mods.push('守り');}
            if(res.between.includes('atk')){dmg+=120;mods.push('連撃');}
            if(res.between.includes('heal')){ph=healAll(80,a.ci);mods.push('癒し');}
            const f=ELEM[m.e].fusion;if(f==='陽炎'&&fx.kag)dmg*=1.2;tag={kind:'fusion',base:f,name:(mods.length?mods.join('・')+'の':'')+f};
          }else{
            const r=REACT[pk(res.e,m.e)];
            if(r){tag={kind:'react',base:r,name:r};
              if(r==='炎嵐')dmg=(res.p+m.p)*1.5;
              if(r==='砂嵐'){dmg=(res.p+m.p)*1.2;slow=Math.min(slow,0.7);}
              if(r==='蒸気'){miss=true;clear=true;}
              if(r==='泥沼'){dmg=m.p*1.2;slow=0.5;}
              if(r==='凍結'){dmg=(res.p+m.p)*1.3;slow=Math.min(slow,0.6);}}
          }
        }
        push({slot:i,type:'party',ci:a.ci,cmd:m.n,dmg:hitE(dmg,a.ci),tag,ph});
        res=clear?(d.tailwind?{e:'風',left:99,p:60,between:[],tail:true}:null):(res&&res.tail&&m.e!=='風'?{e:m.e,left:lenOf(m.e),p:m.p,between:[]}:{e:m.e,left:d.tailwind&&m.e==='風'?99:lenOf(m.e),p:m.p,between:[],tail:d.tailwind&&m.e==='風'});
      }else{
        if(res&&res.tail){}else if(res){res.between.push(m.t);res.left--;if(res.left<=0){const nm=ELEM[res.e].res;res=null;push({slot:i,type:'note',text:nm+'が きえた'});}}
        if(m.t==='atk'){let dmg=m.p,tag=null;
          if(charging&&m.brk){dmg=m.p*3*(fx.brk&&fx.brk[a.ci]?1.3:1);broken=true;charging=false;tag={kind:'break',base:'崩し',name:'崩し'};}
          push({slot:i,type:'party',ci:a.ci,cmd:m.n,dmg:hitE(dmg,a.ci),tag});}
        else if(m.t==='guard'){guard=true;push({slot:i,type:'party',ci:a.ci,cmd:m.n,dmg:0,tag:null,guard:true});}
        else if(m.t==='heal'){push({slot:i,type:'party',ci:a.ci,cmd:m.n,dmg:0,tag:null,ph:healAll(m.p,a.ci)});}
        else if(m.t==='steal'){push({slot:i,type:'party',ci:a.ci,cmd:m.n,dmg:0,tag:null,steal:true});}
        else if(m.t==='link'){push({slot:i,type:'party',ci:a.ci,cmd:m.n,dmg:0,tag:{kind:'fusion',base:'繋ぐ',name:'繋ぐ'},link:true});}
        else if(m.t==='blind'){miss=true;push({slot:i,type:'party',ci:a.ci,cmd:m.n,dmg:0,tag:null,blind:true});}
      }
    }else{
      const it=intents[i];const base={eslot:i,type:'enemy',name:it.n};
      if(it.k==='charge'){charging=true;push(Object.assign(base,{text:'ちからを ためている！'}));continue;}
      if(it.k==='big'&&broken){push(Object.assign(base,{text:'崩されて '+it.n+'は ふはつ！',tag:{kind:'good',name:'不発'}}));continue;}
      if(miss&&it.k==='single'){miss=false;push(Object.assign(base,{text:'ねらいが はずれた！',tag:{kind:'good',name:'はずれ'}}));continue;}
      let half=false;if(miss&&it.k!=='charge'){miss=false;half=true;}
      let pd,extra='',tag=null;const all=s.hp.map((_,j)=>j);
      if(it.k==='single'){const al=s.hp.map((h,j)=>j).filter(j=>s.hp[j]>0);const t=al[((st.turn||0)*7+i*5+st.k.length*3)%al.length];pd=hitP([t],it.p);}
      else if(it.k==='all'||it.k==='big'){charging=false;pd=hitP(all,it.p*(half?0.5:1));if(half){extra=' （ねらいが それて 半減）';}}
      else if(it.k==='water'){pd=hitP(all,it.p);if(res&&res.e==='火'&&!fx.noWater){res=null;extra=' 残り火が きえた！';tag={kind:'bad',name:'火が消えた'};}}
      push(Object.assign(base,{pd,extra,tag}));
    }
    if(d.angry&&!s.angry&&s.ehp>0&&s.ehp<=st.emax/2){s.angry=true;push({type:'angry',text:(d.short||d.name)+'は いかりくるった！'});}
  }
  if(d.link){const alive=st.hp.map((h,i)=>i).filter(i=>st.hp[i]>0);const linked=new Set(plan.filter(a=>a&&CHARS[st.ids[a.ci]].cmds[a.mi].t==='link').map(a=>a.ci));if(alive.length&&alive.every(i=>linked.has(i))){s.ehp=0;push({type:'note',text:'<span class="hot">全員の 手が、ノアの 手に 重なった――</span>'});}}
  return {s,ev};
}
function permutations(arr){const r=[];const f=(a,rest)=>{if(!rest.length){r.push(a);return;}rest.forEach((x,i)=>f(a.concat([x]),rest.filter((_,j)=>j!==i)));};f([],arr);return r;}
function aiPlan(){
  const intents=intentsOf(B);const n=B.ids.length;
  const alive=B.ids.map((_,i)=>i).filter(i=>B.hp[i]>0);
  const dd=FOES[B.k];const opts=B.ids.map(id=>CHARS[id].cmds.map((m,mi)=>cmdOK(m)&&(!dd.link||m.t==='link')?mi:-1).filter(x=>x>=0));
  const low=B.hp.some((h,i)=>h>0&&h/B.max[i]<0.35);
  const w=(amode==='safe'?1.6:0.6)+(low?0.6:0);
  let best=null,bs=-1e9;
  const actors=n===1?(alive.length?[0,0]:[]):alive;
  for(const perm of permutations(actors)){
    const total=perm.reduce((a,ci)=>a*opts[ci].length,1);
    for(let n2=0;n2<total;n2++){
      let x=n2;const pl=perm.map(ci=>{const o=opts[ci];const mi=o[x%o.length];x=Math.floor(x/o.length);return {ci,mi};});
      while(pl.length<nSlots(n))pl.push(null);
      const {s,ev}=simulate(B,pl,intents);
      const dealt=B.ehp-s.ehp;const dhp=s.hp.reduce((a,b)=>a+b,0)-B.hp.reduce((a,b)=>a+b,0);
      const deaths=s.hp.filter((h,i)=>h<=0&&B.hp[i]>0).length;
      const flair=ev.filter(e=>e.tag&&(e.tag.kind==='fusion'||e.tag.kind==='break')).length*25;
      const sc=dealt+(s.ehp<=0?5000:0)+dhp*w-deaths*1500+flair;
      if(sc>bs){bs=sc;best={plan:pl,ev};}
    }
  }
  const tags=best.ev.filter(e=>e.tag).map(e=>e.tag);
  const f=tags.find(t=>t.kind==='fusion'),b=tags.find(t=>t.kind==='break'),r=tags.find(t=>t.kind==='react');
  let reason='守りを かためて けずります';
  if(f&&b)reason=f.name+'と 崩しを ねらいます';else if(f)reason=f.name+'を ねらいます';else if(b)reason='溜めに わりこんで 崩します';else if(r)reason=r.name+'を おこします';
  return {plan:best.plan,reason};
}
function startBattle(f,tut){
  return new Promise(resolve=>{
    const d=FOES[f.k];bResolve=resolve;if(d.dyn)d.dyn(d);
    mode='battle';if(menuOpen)toggleMenu(false);joy=null;
    const ids=activeParty();
    B={k:f.k,f,ids,fx:{ember3:partyOpt(ids,'残り火が3枠つづく'),kag:partyOpt(ids,'陽炎の威力 +20%'),noWater:partyOpt(ids,'水鉄砲で火が消えない'),brk:ids.map(id=>hasOpt(id,'崩しダメージ +30%'))},hp:ids.map(id=>Math.max(0,G.hp[id])),max:ids.map(maxHP),ehp:scaledHP(d,ids.length),emax:scaledHP(d,ids.length),dmgF:dmgFactor(d,ids.length),angry:false,turn:0,
       cm:ids.map(id=>lvMul()*(1+atkOf(id)/100)),dm:ids.map(id=>100/(100+defOf(id)))};
    {const gap=(d.fixed?0:d.lv-G.L)*(ids.length===1?0.3:1);if(gap>0){B.dmgF*=Math.min(3.5,1+0.12*gap);B.cm=B.cm.map(c=>c*Math.max(0.25,1-0.07*gap));}}
    if(B.hp.every(h=>h<=0))B.hp=B.max.slice();
    plan=Array(nSlots(ids.length)).fill(null);bover=null;bloot=null;picking=null;busy=false;auto=!!G.autoOn&&!tut;
    blines=[(d.short||d.name)+'が あらわれた！'];
    B.tut=tut?tut.slice():null;
    $('foe').innerHTML=SVG[d.svg];$('foe').classList.remove('gone');$('bgsvg').innerHTML=BG[d.bg];$('foeName').textContent=(d.short||d.name)+' Lv'+d.lv;
    $('fieldView').hidden=true;$('battleView').hidden=false;
    renderB();
    if(auto)setTimeout(autoStep,700);
  });
}
function endBattle(){
  if(!B||mode!=='battle'||!bover)return;
  B.ids.forEach((id,i)=>{G.hp[id]=bover==='win'?Math.max(1,B.hp[i]):B.hp[i];});
  mode='field';inv=1.5;
  const f=B.f;const r=bover;
  if(r==='win'){G.kills=G.kills||{};G.kills[f.k]=(G.kills[f.k]||0)+1;f.alive=false;f.respawn=30;if(FOES[f.k].boss)G.bossDown[f.k]=true;}
  B=null;save();
  $('battleView').hidden=true;$('fieldView').hidden=false;
  renderTop();renderMsg();resize();
  const res=bResolve;bResolve=null;res&&res(r);
}
function bsay(h){blines.push(h);if(blines.length>5)blines.shift();}
function renderB(){
  const d=FOES[B.k];const intents=intentsOf(B);const ORDER=orderFor(B.ids.length);
  $('ehpbar').style.width=(B.ehp/B.emax*100)+'%';$('angry').hidden=!B.angry;
  $('status').innerHTML=statusHTML(B.ids,B.hp,B.max);
  const any=plan.some(Boolean);const pv=any&&!bover?simulate(B,plan,intents):null;
  $('preview').textContent=pv?'よそう '+(B.ehp-pv.s.ehp)+'ダメージ':'';
  const tl=$('tl');tl.innerHTML='';tl.style.gridTemplateColumns='repeat('+ORDER.length+',minmax(0,1fr))';
  ORDER.forEach(([k,i],pos)=>{
    const el=document.createElement(k==='p'?'button':'div');el.className='cell';if(active===pos)el.classList.add('active');
    if(k==='p'){const a=plan[i];
      if(a){const c=CHARS[B.ids[a.ci]],m=c.cmds[a.mi];el.classList.add('filled');if(m.e)el.classList.add('e-'+m.e);
        el.innerHTML='<span class="no">'+NUM[i]+'</span><span>'+c.name+'</span><span class="cmd">'+m.n+'</span>'+(m.e?'<span class="res">'+ELEM[m.e].res+ELEM[m.e].len+'</span>':'');
        const e=pv&&pv.ev.find(x=>x.slot===i&&x.type==='party'&&x.tag);if(e)el.innerHTML+='<span class="tag '+e.tag.kind+'">'+e.tag.name+'</span>';}
      else el.innerHTML='<span class="no">'+NUM[i]+'</span><span class="res">あき</span>';
      el.onclick=()=>{if(busy||auto||bover)return;plan[i]=null;picking=null;renderB();};
    }else{const it=intents[i];el.classList.add('foecell');
      el.innerHTML='<span class="no">てき</span><span class="who">'+it.n+'</span><span class="res">'+it.d+'</span>';
      const e=pv&&pv.ev.find(x=>x.eslot===i&&x.tag);if(e)el.innerHTML+='<span class="tag '+e.tag.kind+'">'+e.tag.name+'</span>';}
    tl.appendChild(el);
  });
  $('bmsg').innerHTML=(B.tut?'<div class="tut">'+B.tut.join('<br>')+'</div>':'')+blines.map(l=>'<div>'+l+'</div>').join('');
  const m=$('bmenu');m.innerHTML='';const q=document.createElement('div');q.className='q';m.appendChild(q);
  const opt=(label,sub,fn,dis)=>{const b=document.createElement('button');b.className='opt';b.innerHTML=label+(sub?' <small>'+sub+'</small>':'');b.onclick=fn;if(dis)b.disabled=true;m.appendChild(b);};
  if(bover){
    if(bover==='win'){q.innerHTML=(d.short||d.name)+'を たおした！<br><span style="color:var(--muted);font-size:13px">'+B.winText.join('<br>')+'</span>'+(bloot?lootHTML(bloot):'');}
    else q.innerHTML='ぜんめつ してしまった…';
    if(auto&&!bloot)q.innerHTML+='<div style="color:var(--hot);font-size:13px;margin-top:4px">オート中：まもなく もどる</div>';
    if(auto&&bloot)q.innerHTML+='<div style="color:var(--hot);font-size:13px;margin-top:4px">手に入れた 装備を 確かめたら「フィールドへ もどる」を 押してね</div>';
    opt(bover==='win'?'フィールドへ もどる':'つづける','',()=>endBattle());
  }else if(busy){q.innerHTML='<span style="color:var(--muted)">……</span>';}
  else if(auto){q.innerHTML='オートで たたかっている<br><span style="color:var(--muted);font-size:13px">オートは 次の戦闘も つづく。もう一度押すと止まる</span>';}
  else{
    const next=plan.findIndex(p=>!p);const solo=B.ids.length===1;const alive=solo?(B.hp[0]>0?2:0):B.hp.filter(h=>h>0).length;const filled=plan.filter(Boolean).length;
    if(picking!==null){const c=CHARS[B.ids[picking]];q.textContent=c.name+' は どうする？';
      c.cmds.forEach((cm,mi)=>{if(cm.req&&!G.flags[cm.req])return;if(d.link&&cm.t!=='link')return;const ok=cmdOK(cm);opt('<span class="'+(cm.e?'e-'+cm.e+' ec':'')+'">'+cm.n+'</span>',ok?cm.d+(cm.p&&cm.t!=='heal'?' '+cm.p:''):'（'+cm.e+'が 消えていて 使えない）',()=>{if(!ok)return;plan[next]={ci:picking,mi};picking=null;renderB();},!ok);});
      opt('もどる','',()=>{picking=null;renderB();});}
    else if(filled<alive&&next>=0){q.textContent=NUM[next]+'ばんめに うごくのは？';
      B.ids.forEach((id,ci)=>{if(B.hp[ci]<=0||(!solo&&plan.some(p=>p&&p.ci===ci)))return;const c=CHARS[id];opt(c.name,c.job+'・得意'+c.elem,()=>{picking=ci;renderB();});});}
    else{q.textContent='この じゅんばんで いい？';opt('たたかう',$('preview').textContent,()=>run());opt('やりなおす','',()=>{plan=Array(nSlots(B.ids.length)).fill(null);renderB();});}
  }
  $('aiBtn').disabled=busy||auto||!!bover;$('clrBtn').disabled=busy||auto||!!bover;
  $('autoBtn').classList.toggle('on',auto);$('autoBtn').textContent=auto?'オート中':'オート';$('modeBtn').textContent=amode==='power'?'作戦:火力':'作戦:安全';
}
function pop(text,big){const p=document.createElement('div');p.className='pop'+(big?' big':'');p.textContent=text;$('scene').appendChild(p);setTimeout(()=>p.remove(),1000);}
async function run(){
  if(!B||busy||bover)return;busy=true;picking=null;B.tut=null;
  const d=FOES[B.k];const ORDER=orderFor(B.ids.length);const {s,ev}=simulate(B,plan,intentsOf(B));const fast=auto?0.55:1;
  for(const e of ev){
    active=e.slot!==undefined?ORDER.findIndex(o=>o[0]==='p'&&o[1]===e.slot):e.eslot!==undefined?ORDER.findIndex(o=>o[0]==='e'&&o[1]===e.eslot):null;
    B.hp=e.hp;B.ehp=e.ehp;B.angry=e.angry;let line='';
    if(e.steal){if(!B.stolen&&!d.fixed&&Math.random()<0.6){B.stolen=addLoot(d.boss?2:(d.lv>=G.L?1:0));e.stealText=' <span class="hot">'+B.stolen.rar.n+'「'+B.stolen.name+'」を 盗んだ！</span>';}else e.stealText=B.stolen?' もう 盗める ものは ない。':' ……失敗！';}
    if(e.type==='party'){const c=CHARS[B.ids[e.ci]];if(e.tag&&e.tag.base&&!G.dex.includes(e.tag.base))G.dex.push(e.tag.base);
      line=c.name+'の '+e.cmd+'！'+(e.tag?' <span class="hot">'+e.tag.name+'！</span>':'')+(e.dmg?' '+e.dmg+'の ダメージ':'')+(e.guard?' みんなの まもりが かたくなった':'')+(e.blind?' まものの 目に 粉が 入った！':'')+(e.ph?' みんなの HPが かいふくした':'')+(e.stealText||'');}
    else if(e.type==='enemy')line=(d.short||d.name)+'の '+e.name+'！ '+(e.text||('ダメージ'+(e.extra||'')));
    else line=e.text;
    bsay(line);renderB();
    if(e.type==='party'&&e.dmg){const f=$('foe');f.classList.remove('shake');void f.offsetWidth;f.classList.add('shake','flash');setTimeout(()=>f.classList.remove('flash'),120);pop(e.tag?e.tag.name+' '+e.dmg:String(e.dmg),!!e.tag);}
    if(e.pd)e.pd.forEach((v,i)=>{if(v){const el=$('st-'+i);if(el)el.classList.add('hit');}});
    await sleep((e.tag?950:700)*fast);
  }
  active=null;B.hp=s.hp;B.ehp=s.ehp;B.angry=s.angry;B.turn++;
  if(d.boss&&!d.fixed&&B.turn===12)bsay('<span class="hot">'+(d.short||d.name)+'は 激昂した！ 攻撃が ターンごとに 激しく なる！</span>');
  if(d.unkillable&&B.hp.some(h=>h>0)){
    if(d.loseTurn&&B.turn>=d.loseTurn){bsay('<span class="hot">'+(d.short||d.name)+'が 大渦を 呼んだ！ 船ごと すべてが 呑みこまれていく――</span>');B.hp=B.hp.map(()=>0);renderB();await sleep(1200);}
    else{B.ehp=B.emax;bsay('<span class="hot">'+(d.short||d.name)+'の 傷が みるみる ふさがっていく……！</span>');}
  }plan=Array(nSlots(B.ids.length)).fill(null);
  if(B.ehp<=0){
    bover='win';$('foe').classList.add('gone');
    const xp=Math.round(expFor(d.lv)*(partyOpt(B.ids,'経験値 +10%')?1.1:1));const gd=Math.round(goldFor(d)*(partyOpt(B.ids,'ゴールド +20%')?1.2:1));G.gold+=gd;B.winText=['経験値 '+xp+' と '+gd+'G を かくとく。'];
    B.ids.forEach((id,i)=>G.hp[id]=Math.min(maxHP(id),Math.max(1,B.hp[i])+Math.round(maxHP(id)*(hasOpt(id,'勝利時の回復 +10%')?0.2:0.1))));
    B.winText.push(...giveExp(xp));
    B.max=B.ids.map(maxHP);B.hp=B.ids.map(id=>G.hp[id]);
    const chance=d.boss?1:0.45;if(Math.random()<chance)bloot=addLoot(d.boss?2:(d.lv>=G.L+2?1:0));
    bsay('<span class="hot">'+(d.short||d.name)+'を やっつけた！</span>');save();
  }else if(B.hp.every(h=>h<=0)){bover='lose';bsay('ぜんめつ してしまった…');}
  busy=false;renderB();
  if(auto&&!bover)setTimeout(autoStep,350);
  if(auto&&bover&&!bloot){const myB=B;setTimeout(()=>{if(auto&&B===myB&&bover)endBattle();},2600);}
}
async function autoStep(){if(!auto||busy||bover)return;const r=aiPlan();plan=r.plan;bsay('<span class="hot">おまかせ：'+r.reason+'</span>');renderB();await sleep(700);if(!B||bover)return;if(!auto){renderB();return;}run();}
$('aiBtn').onclick=()=>{if(busy||auto||bover)return;const r=aiPlan();plan=r.plan;picking=null;bsay('<span class="hot">おまかせ：'+r.reason+'</span>');renderB();};
$('autoBtn').onclick=()=>{auto=!auto;G.autoOn=auto;save();picking=null;renderB();if(auto){if(bover&&!bloot){const myB=B;setTimeout(()=>{if(auto&&B===myB&&bover)endBattle();},800);}else autoStep();}};
$('modeBtn').onclick=()=>{amode=amode==='power'?'safe':'power';renderB();};
$('clrBtn').onclick=()=>{if(busy||auto)return;plan=Array(nSlots(B.ids.length)).fill(null);picking=null;renderB();};
