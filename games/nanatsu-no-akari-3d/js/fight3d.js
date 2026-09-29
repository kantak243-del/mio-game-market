/* ===== 融合アクションバトル =====
   雑魚：フィールドで そのまま 戦う（近くの まものも 加勢する）
   ボス：専用の 戦闘場へ 移って 戦う
   台本つきの 特別戦（負けイベント・最後の「繋ぐ」）だけは 従来の 紡ぎバトルを 使う */
let FT=null,FRES=null;
const FCOST=100,FGMAX=300;
const _engStartBattle=startBattle,_engInteract=interact,_engUpdate=update;
const fdist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const fclamp=(v,a,b)=>v<a?a:v>b?b:v;
const ECOL={'火':'#FF7A4D','水':'#62B2FF','土':'#D9A65E','風':'#55E0B4','光':'#FFF1A8','氷':'#BDEBFF','闇':'#B08CFF'};

startBattle=function(f,tut){const d=FOES[f.k];if(d.link)return _engStartBattle(f,tut);return fightStart(f,tut);};
interact=function(){if(FRES){closeResult();return;}if(FT){fAttack();return;}return _engInteract();};
update=function(dt){
  if(FRES){perf+=dt;if(FRES.auto){FRES.auto-=dt;if(FRES.auto<=0)closeResult();}return;}
  if(FT){fightFrame(dt);return;}
  _engUpdate(dt);
  if(typeof keepScan==='function')keepScan(dt);
};

/* ---------- 戦闘場（ボス） ---------- */
const ARENA={cave:[':','#',1],field:['.','T',0,','],sea:['=','~'],beach:['=','~'],deck:[':','#'],bamboo:['.','V'],pond:['.','~',0,','],highland:['a','^'],peak:['a','^'],
  city:['p','I'],archive:[':','#',1],forest:['.','T',0,'%'],heart:[':','#',1],snow:['S','T'],swamp:['%','T']};
function makeArena(d){
  const a=ARENA[d.bg]||ARENA.field,W=13,H=17,t=[];
  for(let y=0;y<H;y++){const r=[];for(let x=0;x<W;x++){
    const edge=x===0||y===0||x===W-1||y===H-1;
    r.push(edge?a[1]:(a[3]&&((x*7+y*13)%11===0)&&y>1&&y<H-2?a[3]:a[0]));}t.push(r);}
  return{name:'arena_'+(d.bg||'field'),d:{title:d.short||d.name,dim:!!a[2]},t,W,H,npcs:[],foes:[]};
}

/* ---------- 開始 ---------- */
function fightStart(f,tut){
  return new Promise(resolve=>{
    const d0=FOES[f.k];if(d0.dyn)d0.dyn(d0);
    if(menuOpen)toggleMenu(false);joy=null;
    const ids=activeParty(),n=ids.length,boss=!!d0.boss;
    let arena=null;
    const list=[f];
    const useArena=boss||f.scripted||f.x==null;
    if(useArena){arena={M,px:G.px,py:G.py,dir:G.dir};M=makeArena(d0);G.px=M.W/2;G.py=M.H-3.2;G.dir=3;}
    if(!useArena)M.foes.forEach(o=>{if(o!==f&&o.alive&&(!o.show||o.show())&&!FOES[o.k].boss&&list.length<3&&Math.hypot(o.x-G.px,o.y-G.py)<3.2)list.push(o);});
    FT={resolve,ids,boss,arena,time:0,gauge:boss?100:50,menu:false,lock:null,slowT:0,guardT:0,blind:0,stolen:null,over:null,
        texts:[],parts:[],proj:[],beams:[],log:[],uiT:0,auto:!!G.autoOn,ai:{cd:0}};
    const allDead=ids.every(id=>G.hp[id]<=0);
    FT.party=ids.map((id,i)=>{const c=CHARS[id];const cm=lvMul()*(1+atkOf(id)/100);
      const cmds=c.cmds.map((m,mi)=>({m,mi})).filter(o=>o.m.t!=='link'&&o.m.t!=='atk'&&cmdOK(o.m));
      const atk=c.cmds.find(m=>m.t==='atk');
      const caster=!atk||c.job==='魔導士'||c.job==='神官';
      const u={id,c,i,x:G.px,y:G.py,r:.3,hp:allDead?maxHP(id):Math.max(0,G.hp[id]),max:maxHP(id),cm,dm:100/(100+defOf(id)),dir:G.dir,
        atk,cmds,caster,elems:cmds.filter(o=>o.m.t==='elem'),heal:cmds.find(o=>o.m.t==='heal'),
        atkCd:.6+i*.3,skillCd:2+i*1.2,castT:0,cast:null,iT:0,hurtT:0,dodgeT:0,dx:0,dy:0,dodgeCd:0,dsx:0,dsy:0,dStart:-9,combo:0,comboT:0,atkT:0,swing:0,buf:0,rolls:{}};
      if(i>0){const off=[[-.9,.8],[.9,.8],[0,1.5]][i-1]||[0,1];const px=G.px+off[0],py=G.py+off[1];if(!solidAt(px,py)){u.x=px;u.y=py;}}
      return u;});
    FT.foes=list.map((fo,k)=>{const d=FOES[fo.k];let dmgF=dmgFactor(d,n),cmMul=1;
      const gap=(d.fixed?0:d.lv-G.L)*(n===1?0.3:1);if(gap>0){dmgF*=Math.min(3.5,1+0.12*gap);cmMul=Math.max(.25,1-.07*gap);}
      const hp=Math.round(scaledHP(d,n)*(d.boss?1.9:1));
      const e={f:fo,d,k:fo.k,x:useArena?M.W/2+(k-(list.length-1)/2)*2:fo.x,y:useArena?4.5:fo.y,unkill:!!d.unkillable,healCd:0,r:d.boss?.72:.38,hp,max:hp,dmgF,cmMul,seq:d.cycle.flat(),si:0,
        state:'chase',st:0,atkCd:1.2+k*.7+Math.random()*.6,it:null,ax:0,ay:0,rad:1,ux:0,uy:1,res:null,frozen:0,stun:0,slow:0,miss:false,angry:false,
        flash:0,dead:false,rolls:{},bob:Math.random()*6,scale:d.boss?2.3:1};
      return e;});
    FT.lock=FT.foes[0];FT.loseAt=d0.unkillable?(d0.loseTurn||3)*12:0;FT.scriptLose=!!d0.unkillable;
    const first=!G.flags.actTut;G.flags.actTut=true;
    flog((boss?'<span class="hot">'+(d0.short||d0.name)+'</span>が 立ちはだかった！':(FT.foes.length>1?'まものの 群れが おそってきた！':(d0.short||d0.name)+'が おそってきた！')));
    if(f.scripted&&tut&&tut.length)tut.forEach(l=>flog('<span style="color:#9FD8FF">'+l+'</span>'));
    if(first)flog('<span style="color:#9FD8FF">タップ／攻撃：斬る　フリック／回避：よける　赤い円が 閉じる直前に よけると「見切り」<br>タクトが たまったら コマンド：時間が止まり、仲間の技を 指示できる。同じ属性を 重ねると 融合、ちがう属性は 反応</span>');
    fightUI(true);if(boss)toast('BOSS　'+(d0.short||d0.name));
  });
}

/* ---------- ログ ---------- */
function flog(h){if(!FT)return;FT.log.push(h);if(FT.log.length>3)FT.log.shift();$('fmsg').innerHTML=FT.log.map(l=>'<div>'+l+'</div>').join('');}
function ftext(x,y,t,col,size=14,life=.9){FT.texts.push({x,y,t,col,size,life,max:life});}
function fburst(x,y,col,n=10,sp=3,size=3){for(let i=0;i<n;i++){const a=Math.random()*6.283,v=sp*(.3+Math.random());FT.parts.push({x,y,h:.6,vx:Math.cos(a)*v,vy:Math.sin(a)*v,vh:1+Math.random()*2,life:.5+Math.random()*.3,max:.8,col,size});}}
function addG(v){FT.gauge=fclamp(FT.gauge+v,0,FGMAX);}
function dexAdd(base){if(base&&!G.dex.includes(base))G.dex.push(base);}

/* ---------- 共通処理 ---------- */
function fmove(u,dx,dy){const r=Math.min(.3,u.r*.7);const bl=(x,y)=>solidAt(x-r,y-r+.2)||solidAt(x+r,y-r+.2)||solidAt(x-r,y+r)||solidAt(x+r,y+r);
  const nx=u.x+dx,ny=u.y+dy;if(!bl(nx,u.y))u.x=nx;if(!bl(u.x,ny))u.y=ny;}
function fTarget(){if(FT.lock&&!FT.lock.dead)return FT.lock;const L=FT.party[0];let b=null,bd=1e9;for(const e of FT.foes)if(!e.dead){const d=fdist(e,L);if(d<bd){bd=d;b=e;}}FT.lock=b;return b;}
function nearestFoe(u){let b=null,bd=1e9;for(const e of FT.foes)if(!e.dead){const d=fdist(e,u);if(d<bd){bd=d;b=e;}}return b;}
function fdamage(e,v,col='#fff',size=14){if(e.dead)return;v=Math.max(1,Math.round(v));e.hp-=v;
  if(e.unkill){if(e.hp<e.max*.2){e.hp=e.max;ftext(e.x,e.y-.9,'再生','#8FE0B0',16,1.2);if(e.healCd<=FT.time){e.healCd=FT.time+5;flog('<span class="hot">'+(e.d.short||e.d.name)+'の 傷が みるみる ふさがっていく……！</span>');}}}e.flash=.12;ftext(e.x+(Math.random()-.5)*.4,e.y,v,col,size);
  if(e.d.angry&&!e.angry&&e.hp>0&&e.hp<=e.max/2){e.angry=true;flog('<span style="color:var(--dead)">'+(e.d.short||e.d.name)+'は いかりくるった！</span>');}
  if(e.hp<=0)fkill(e);}
function fkill(e){e.dead=true;e.hp=0;fburst(e.x,e.y,'#FFE6A8',e.d.boss?40:16,e.d.boss?6:4,4);addG(12);if(FT.lock===e)FT.lock=null;
  flog((e.d.short||e.d.name)+'を たおした！');if(FT.foes.every(o=>o.dead))setTimeout(()=>fightEnd('win'),450);}
function fhurt(u,v){u.hp=Math.max(0,u.hp-Math.round(v));u.hurtT=.3;u.iT=.45;ftext(u.x,u.y,Math.round(v),'#FF5B5B',13);
  if(u.hp<=0){u.castT=0;ftext(u.x,u.y-.4,'たおれた','#9AA6BF',12,1.1);flog(u.c.name+'が たおれた！');}
  if(FT.party.every(p=>p.hp<=0))setTimeout(()=>fightEnd('lose'),900);}

/* ---------- 属性：融合と反応 ---------- */
function applyElem(e,m,u,fromMenu){
  if(e.dead)return;const E=m.e;let v=m.p*u.cm*e.cmMul*(fromMenu?1.0:.7);let tag=null;
  if(e.res&&e.res.t>0){
    if(e.res.e===E){const f=ELEM[E].fusion;tag={kind:'fusion',name:f};v*=2.2;
      if(f==='陽炎'&&partyOpt(FT.ids,'陽炎の威力 +20%'))v*=1.2;
      if(f==='岩壁'){FT.guardT=6;flog('岩壁が みんなを 守る！');}
      if(f==='疾風')addG(40);
      if(f==='閃光')e.stun=2;
      if(f==='氷華')e.frozen=2.5;
      if(f==='深淵')v*=1.2;
      if(f==='渦潮')e.slow=4;
    }else{const r=REACT[pk(e.res.e,E)];
      if(r){tag={kind:'react',name:r};
        if(r==='蒸気'){e.miss=true;v*=1.1;}
        if(r==='炎嵐'){v*=1.8;FT.foes.forEach(o=>{if(o!==e&&!o.dead&&fdist(o,e)<2.2)fdamage(o,v*.4,'#FFB070',13);});}
        if(r==='泥沼'){e.slow=5;v*=1.2;}
        if(r==='砂嵐'){e.slow=3;v*=1.3;}
        if(r==='凍結'){e.frozen=2.5;v*=1.3;}
        if(r==='霧散'){v*=1.3;}
        if(r==='明滅'){e.stun=2;v*=1.3;}
      }}
  }
  const len=E==='火'&&partyOpt(FT.ids,'残り火が3枠つづく')?3:ELEM[E].len;
  e.res=tag&&tag.name==='蒸気'?null:{e:E,t:2.5+len*1.6};
  if(e.state==='windup'&&(e.frozen>0||e.stun>0))e.state='chase';
  fburst(e.x,e.y,ECOL[E]||'#fff',tag?26:12,tag?5:3,tag?4:3);
  if(tag){dexAdd(tag.name);ftext(e.x,e.y-.6,tag.name+'！',tag.kind==='fusion'?'#FFD34D':'#9FD8FF',19,1.2);flog('<span class="hot">'+u.c.name+'の '+m.n+'！ '+tag.name+'！</span>');FT.shake=.25;}
  else ftext(e.x,e.y-.6,ELEM[E].res,ECOL[E]||'#fff',12);
  fdamage(e,v,tag?'#FFE08A':(ECOL[E]||'#fff'),tag?19:15);
}

/* ---------- レオン（操作キャラ） ---------- */
function fAttack(){
  if(!FT||FT.menu||FT.over)return;const L=FT.party[0];if(L.hp<=0)return;
  if(L.atkCd>0||L.dodgeT>0){L.buf=.18;return;}
  const tg=fTarget();
  if(tg&&fdist(tg,L)<3.2){const a=Math.atan2(tg.y-L.y,tg.x-L.x);L.face=a;L.dir=faceDir(Math.cos(a),Math.sin(a));
    const gap=fdist(tg,L)-tg.r-L.r;if(gap>.45){const s=Math.min(gap-.35,1.1);fmove(L,Math.cos(a)*s,Math.sin(a)*s);}}
  if(L.comboT<=0)L.combo=0;
  const c=L.combo,fin=c===2;L.atkT=.13;L.atkCd=fin?.3:.17;L.comboT=.75;L.combo=(c+1)%3;L.swing=c;
  const face=L.face??[Math.PI/2,Math.PI,0,-Math.PI/2][G.dir];L.face=face;
  const m=L.atk,p=m?m.p:80;let hit=0;
  for(const e of FT.foes){if(e.dead)continue;
    const dx=e.x-L.x,dy=e.y-L.y,dd=Math.hypot(dx,dy);if(dd>L.r+.85+e.r)continue;
    let da=Math.abs(Math.atan2(dy,dx)-face);if(da>Math.PI)da=6.283-da;if(da>1.3&&dd>e.r+L.r+.1)continue;
    let v=p*L.cm*e.cmMul*(fin?.8:.45);if(e.frozen>0)v*=1.5;if(e.stun>0)v*=1.3;
    if(e.state==='charge'&&m&&m.brk){v*=3*(hasOpt(L.id,'崩しダメージ +30%')?1.3:1);e.state='stagger';e.st=2.2;dexAdd('崩し');addG(20);FT.shake=.3;
      ftext(e.x,e.y-.6,'崩し！','#F5A623',19,1.1);flog('<span class="hot">溜めに わりこんで 崩した！</span>');}
    addG(fin?9:5);hit++;fburst(e.x,e.y,'#FFF6D0',5,2.5,2);
    fdamage(e,v,e.frozen>0?'#BFF0FF':'#fff',fin?16:13);
  }
  if(fin&&hit)FT.shake=Math.max(FT.shake||0,.1);
}
function fDodge(dx,dy){
  if(!FT||FT.menu||FT.over)return;const L=FT.party[0];if(L.hp<=0||L.dodgeCd>0)return;
  const m=Math.hypot(dx,dy);if(m<.01){const f=L.face??[Math.PI/2,Math.PI,0,-Math.PI/2][G.dir];dx=-Math.cos(f);dy=-Math.sin(f);}else{dx/=m;dy/=m;}
  L.dx=dx;L.dy=dy;L.dodgeT=.2;L.iT=.32;L.dodgeCd=.42;L.dsx=L.x;L.dsy=L.y;L.dStart=FT.time;
}
function mikiri(){
  const L=FT.party[0];addG(40);FT.slowT=1.1;dexAdd('見切り');
  ftext(L.x,L.y-.6,'見切り！','#FFD34D',18,1.1);fburst(L.x,L.y,'#FFD34D',16,4,3);
  // 仲間が 追撃（刻の共鳴）
  const tg=fTarget();if(!tg)return;let j=false;
  FT.party.forEach((u,i)=>{if(i===0||u.hp<=0)return;u.atkCd=0;u.skillCd=Math.min(u.skillCd,.2);j=true;});
  if(j){ftext(L.x,L.y-1.1,'刻の共鳴','#FFD34D',14,1.1);dexAdd('刻の共鳴');}
}

/* ---------- 仲間AI ---------- */
function dangerFor(u){for(const e of FT.foes)if(!e.dead&&e.state==='windup'){if(Math.hypot(u.x-e.ax,u.y-e.ay)<e.rad+u.r+.1){if(e.rolls[u.id]===undefined)e.rolls[u.id]=Math.random();return{e,roll:e.rolls[u.id]};}}return null;}
function allyAI(u,dt){
  u.atkCd-=dt;u.skillCd-=dt;
  if(u.dodgeT>0)return;
  const dz=dangerFor(u);
  if(dz){if(dz.roll<.55&&dz.e.st<.3){let dx=u.x-dz.e.ax,dy=u.y-dz.e.ay;if(Math.hypot(dx,dy)<.05){dx=-dz.e.uy;dy=dz.e.ux;}const l=Math.hypot(dx,dy);u.dx=dx/l;u.dy=dy/l;u.dodgeT=.2;u.iT=.3;u.castT=0;return;}
    if(dz.roll<.8){const dx=u.x-dz.e.ax,dy=u.y-dz.e.ay,l=Math.hypot(dx,dy)||1;fmove(u,dx/l*3.4*dt,dy/l*3.4*dt);return;}}
  if(u.castT>0){u.castT-=dt;if(u.castT<=0)releaseCast(u);return;}
  const tg=fTarget();if(!tg)return;
  // 回復
  if(u.heal&&u.skillCd<=0&&FT.party.some(p=>p.hp>0&&p.hp<p.max*.5)){u.cast={o:u.heal,tg:null};u.castT=.4;u.skillCd=5.5;return;}
  // 属性技：融合・反応を ねらう
  if(u.elems.length&&u.skillCd<=0){
    let pick=null;const res=tg.res&&tg.res.t>0?tg.res.e:null;
    if(res){pick=u.elems.find(o=>o.m.e===res)||u.elems.find(o=>REACT[pk(res,o.m.e)]);}
    if(!pick&&Math.random()<.6)pick=u.elems[Math.floor(Math.random()*u.elems.length)];
    if(pick){u.cast={o:pick,tg};u.castT=.35;u.skillCd=3+Math.random()*1.5;u.face=Math.atan2(tg.y-u.y,tg.x-u.x);return;}
    u.skillCd=1.5;
  }
  // 位置取りと 通常攻撃
  const d=fdist(tg,u),a=Math.atan2(tg.y-u.y,tg.x-u.x);u.face=a;
  let mx=0,my=0;
  if(u.caster){const want=2.8;if(d<want-.6){mx=-Math.cos(a);my=-Math.sin(a);}else if(d>want+.8){mx=Math.cos(a);my=Math.sin(a);}
    if(u.atkCd<=0&&d<4.5){u.atkCd=1.05;FT.proj.push({x:u.x,y:u.y,tg,u,kind:'bolt',col:ECOL[u.c.elem]||'#fff',life:2});}}
  else{if(d-tg.r-u.r>.55){mx=Math.cos(a);my=Math.sin(a);}
    else if(u.atkCd<=0){u.atkCd=.75;u.atkT=.13;u.swing=0;const p=u.atk?u.atk.p:80;let v=p*u.cm*tg.cmMul*.55;if(tg.frozen>0)v*=1.5;
      if(tg.state==='charge'&&u.atk&&u.atk.brk){v*=3;tg.state='stagger';tg.st=2;dexAdd('崩し');ftext(tg.x,tg.y-.6,'崩し！','#F5A623',17,1.1);flog('<span class="hot">'+u.c.name+'が 溜めを 崩した！</span>');}
      addG(2);fdamage(tg,v,'#fff',12);}}
  if(mx||my){fmove(u,mx*4.6*dt,my*4.6*dt);u.dir=faceDir(mx,my);}
  // レオンから 離れすぎない
  const L=FT.party[0];if(fdist(u,L)>6){const b=Math.atan2(L.y-u.y,L.x-u.x);fmove(u,Math.cos(b)*3.6*dt,Math.sin(b)*3.6*dt);}
}
function releaseCast(u){
  const c=u.cast;u.cast=null;if(!c)return;
  if(c.o.m.t==='heal'){const v=c.o.m.p*u.cm*.7;FT.party.forEach(p=>{if(p.hp>0){const h=Math.min(p.max-p.hp,Math.round(v));p.hp+=h;ftext(p.x,p.y,'+'+h,'#5BE08A',12);}});flog(u.c.name+'の '+c.o.m.n+'！ みんなの HPが かいふく');return;}
  if(!c.tg||c.tg.dead)return;
  FT.proj.push({x:u.x,y:u.y,tg:c.tg,u,kind:'elem',m:c.o.m,col:ECOL[c.o.m.e]||'#fff',life:2});
}

/* ---------- 敵AI ---------- */
function foeTarget(e){let b=null,bd=1e9;for(const u of FT.party){if(u.hp<=0)continue;let d=fdist(u,e);if(u.i===0)d-=.5;if(d<bd){bd=d;b=u;}}return b;}
function foeAI(e,dt){
  const d=e.d;e.flash-=dt;e.bob+=dt*5;
  if(e.res){e.res.t-=dt;if(e.res.t<=0)e.res=null;}
  if(e.slow>0)e.slow-=dt;
  if(e.frozen>0){e.frozen-=dt;return;}
  if(e.stun>0){e.stun-=dt;return;}
  if(e.state==='stagger'){e.st-=dt;if(e.st<=0){e.state='chase';e.atkCd=.8;}return;}
  const t=foeTarget(e);if(!t)return;
  const dx=t.x-e.x,dy=t.y-e.y,dd=Math.hypot(dx,dy)||1,sp=(d.boss?1.7:2.4)*(e.slow>0?.5:1)*(e.angry?1.2:1);
  if(e.state==='chase'){
    e.atkCd-=dt;
    if(dd>e.r+t.r+.35)fmove(e,dx/dd*sp*dt,dy/dd*sp*dt);
    const it=e.seq[e.si%e.seq.length];
    const reach=it.k==='single'?e.r+1.1:(d.boss?2.2:1.6);
    if(e.atkCd<=0&&(dd<reach||it.k==='charge')){
      e.si++;e.it=it;
      if(it.k==='charge'){e.state='charge';e.st=1.9;ftext(e.x,e.y-.8,'ためている！','#F5A623',13,1.2);flog((d.short||d.name)+'は ちからを ためている！ <span class="dim">斬って 崩せ</span>');return;}
      e.rolls={};e.state='windup';e.st=(it.k==='big'?1.25:.8)+(d.boss?.2:0);e.ux=dx/dd;e.uy=dy/dd;
      if(it.k==='single'){e.ax=t.x;e.ay=t.y;e.rad=.85;}
      else{e.ax=e.x;e.ay=e.y;e.rad=(it.k==='big'?2.4:1.9)+(d.boss?.6:0);}
    }
  }else if(e.state==='charge'){e.st-=dt;if(e.st<=0){const nx=e.seq[e.si%e.seq.length];
      e.state='windup';e.it=nx&&nx.k!=='charge'?nx:{k:'big',n:'大技',p:120};if(nx&&nx.k!=='charge')e.si++;
      e.st=1.1;e.ax=e.x;e.ay=e.y;e.rad=2.6+(d.boss?.6:0);}}
  else if(e.state==='windup'){
    e.st-=dt;
    if(e.st<=0){foeStrike(e);e.state='recover';e.st=d.boss?.6:.45;e.atkCd=(d.boss?.8:1.1)+Math.random()*.6;}
  }else{e.st-=dt;if(e.st<=0)e.state='chase';}
}
function foeStrike(e){
  const it=e.it,d=e.d,L=FT.party[0];
  if(e.miss||FT.blind>0){if(e.miss)e.miss=false;else FT.blind--;ftext(e.x,e.y-.6,'はずれ！','#5BE08A',14);flog((d.short||d.name)+'の '+it.n+'！ ……ねらいが はずれた！');return;}
  const enr=d.boss&&FT.time>90?1.3:1;
  const base=it.p*e.dmgF*(e.angry?1.35:1)*(FT.guardT>0?.5:1)*enr*.9;
  let hitAny=false;
  for(const u of FT.party){if(u.hp<=0)continue;const inA=Math.hypot(u.x-e.ax,u.y-e.ay)<e.rad+u.r;
    if(u===L){if(L.iT>0&&FT.time-L.dStart<.45&&Math.hypot(L.dsx-e.ax,L.dsy-e.ay)<e.rad+L.r+.2){mikiri();continue;}}
    if(inA&&u.iT<=0){fhurt(u,base*u.dm);hitAny=true;}}
  if(it.k==='water'){FT.foes.forEach(o=>{});if(!partyOpt(FT.ids,'水鉄砲で火が消えない'))FT.foes.forEach(o=>{if(o.res&&o.res.e==='火'){o.res=null;}});}
  if(d.boss||it.k==='big'){FT.shake=.25;fburst(e.ax,e.ay,'#C9B38A',16,4,3);}
  if(hitAny)flog((d.short||d.name)+'の '+it.n+'！');
}

/* ---------- オート（レオン） ---------- */
function leaderAuto(dt){
  const L=FT.party[0],ai=FT.ai;ai.cd-=dt;
  const dz=dangerFor(L);
  if(dz){const when=dz.roll<.6?.2:dz.roll<.8?.5:-1;
    if(dz.e.st<when&&L.dodgeCd<=0&&L.dodgeT<=0){let dx=L.x-dz.e.ax,dy=L.y-dz.e.ay;if(Math.hypot(dx,dy)<.05){dx=-dz.e.uy;dy=dz.e.ux;}fDodge(dx,dy);return[0,0];}}
  const tg=fTarget();
  if(FT.gauge>=FCOST&&ai.cd<=0&&tg){const c=autoCmd(tg);if(c){ai.cd=.6;runCmd(c,true);}}
  if(!tg)return[0,0];
  if(dz&&dz.roll<.8){const dx=L.x-dz.e.ax,dy=L.y-dz.e.ay,d=Math.hypot(dx,dy)||1;return[dx/d,dy/d];}
  const dx=tg.x-L.x,dy=tg.y-L.y,d=Math.hypot(dx,dy)||1;
  if(d-tg.r-L.r>.5)return[dx/d,dy/d];
  if(L.atkCd<=0&&L.dodgeT<=0)fAttack();
  return[0,0];
}
function autoCmd(tg){
  const list=cmdList();const ok=list.filter(o=>o.ok);
  if(FT.party.some(p=>p.hp>0&&p.hp<p.max*.35)){const h=ok.find(o=>o.m.t==='heal');if(h)return h;}
  const res=tg.res&&tg.res.t>0?tg.res.e:null;
  if(res){const f=ok.find(o=>o.m.t==='elem'&&o.m.e===res);if(f)return f;const r=ok.find(o=>o.m.t==='elem'&&REACT[pk(res,o.m.e)]);if(r)return r;}
  if(FT.gauge>=FGMAX){const e=ok.filter(o=>o.m.t==='elem');if(e.length)return e[Math.floor(Math.random()*e.length)];}
  return null;
}

/* ---------- コマンド ---------- */
function cmdList(){
  const tg=fTarget();const out=[];
  FT.party.forEach(u=>u.cmds.forEach(o=>{const m=o.m;let hint=m.d||'',hot=false;
    if(m.t==='elem'&&tg&&tg.res&&tg.res.t>0){if(tg.res.e===m.e){hint='→ 融合「'+ELEM[m.e].fusion+'」';hot=true;}else{const r=REACT[pk(tg.res.e,m.e)];if(r){hint='→ 反応「'+r+'」';hot=true;}}}
    if(m.t==='heal'&&FT.party.some(p=>p.hp>0&&p.hp<p.max*.4))hot=true;
    out.push({u,m,hint,hot,ok:u.hp>0&&FT.gauge>=FCOST&&(m.t==='heal'||m.t==='guard'||!!tg)});}));
  return out;
}
function runCmd(c,auto){
  if(!FT||FT.gauge<FCOST||c.u.hp<=0)return;const m=c.m,u=c.u,tg=fTarget();
  if(m.t!=='heal'&&m.t!=='guard'&&!tg)return;
  FT.gauge-=FCOST;if(auto)ftext(FT.party[0].x,FT.party[0].y-.9,'AUTO '+m.n,'#9FD8FF',12);
  if(m.t==='elem'){FT.beams.push({a:u,b:tg,col:ECOL[m.e]||'#fff',life:.35});applyElem(tg,m,u,true);}
  else if(m.t==='heal'){const v=m.p*u.cm*.9;FT.party.forEach(p=>{if(p.hp>0){const h=Math.min(p.max-p.hp,Math.round(v));p.hp+=h;ftext(p.x,p.y,'+'+h,'#5BE08A',13);}});flog(u.c.name+'の '+m.n+'！ みんなの HPが かいふく');}
  else if(m.t==='guard'){FT.guardT=6;flog(u.c.name+'の '+m.n+'！ みんなの まもりが かたくなった');ftext(u.x,u.y-.6,'守り','#9FD8FF',14);}
  else if(m.t==='blind'){FT.blind=2;flog(u.c.name+'の '+m.n+'！ まものの 目に 粉が 入った！');ftext(tg.x,tg.y-.6,'目つぶし','#fff',13);}
  else if(m.t==='steal'){const d=tg.d;if(!FT.stolen&&!d.fixed&&Math.random()<.6){FT.stolen=addLoot(d.boss?2:(d.lv>=G.L?1:0));flog('<span class="hot">'+FT.stolen.rar.n+'「'+FT.stolen.name+'」を 盗んだ！</span>');}else flog(u.c.name+'の '+m.n+'！ '+(FT.stolen?'もう 盗める ものは ない。':'……失敗！'));}
  if(FT.menu){if(FT.gauge<FCOST)fMenu(false);else renderCmdPanel();}
}

/* ---------- 毎フレーム ---------- */
function fightFrame(rdt){
  perf+=rdt;if(toastT){toastT.t-=rdt;if(toastT.t<=0)toastT=null;}if(inv>0)inv-=rdt;
  if(FT.over)return;
  let ts=1;if(FT.menu)ts=.03;else if(FT.slowT>0){ts=.3;FT.slowT-=rdt;}
  const dt=rdt*ts*1.25;FT.time+=dt;if(FT.guardT>0)FT.guardT-=dt;
  const L=FT.party[0];
  for(const u of FT.party){u.iT-=dt;u.hurtT-=dt;u.atkT-=dt;if(u.dodgeT>0){u.dodgeT-=dt;fmove(u,u.dx*(u===L?12:9)*dt,u.dy*(u===L?12:9)*dt);}}
  // 操作
  if(L.hp>0){
    let ix=0,iy=0;if(joy&&joy.moved){ix=joy.dx;iy=joy.dy;}if(pad){ix=pad.dx;iy=pad.dy;}
    if(keys.ArrowLeft||keys.a)ix=-1;if(keys.ArrowRight||keys.d)ix=1;if(keys.ArrowUp||keys.w)iy=-1;if(keys.ArrowDown||keys.s)iy=1;
    let im=Math.hypot(ix,iy);if(im>1){ix/=im;iy/=im;im=1;}
    if(FT.auto&&im<.2&&!FT.menu){const a=leaderAuto(dt);ix=a[0];iy=a[1];im=Math.hypot(ix,iy);}
    L.atkCd-=dt;L.comboT-=dt;L.dodgeCd-=dt;L.buf-=dt;
    if(L.dodgeT<=0&&im>.2){const sp=(L.atkCd>0?3:5.4)*dt;fmove(L,ix*sp,iy*sp);if(L.atkT<=0){L.face=Math.atan2(iy,ix);L.dir=faceDir(ix,iy);}}
    if(L.buf>0&&L.atkCd<=0&&L.dodgeT<=0){L.buf=0;fAttack();}
  }
  for(const u of FT.party)if(u!==L&&u.hp>0)allyAI(u,dt);
  for(const e of FT.foes)if(!e.dead)foeAI(e,dt);
  // 重なりを ほどく
  const bodies=[...FT.foes.filter(e=>!e.dead),...FT.party.filter(u=>u.hp>0)];
  for(let i=0;i<bodies.length;i++)for(let j=i+1;j<bodies.length;j++){const a=bodies[i],b=bodies[j];if(a.dodgeT>0||b.dodgeT>0)continue;
    const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.01,m=a.r+b.r;if(d<m){const o=(m-d)/2;fmove(a,-dx/d*o,-dy/d*o);fmove(b,dx/d*o,dy/d*o);}}
  // 飛び道具
  for(const p of [...FT.proj]){p.life-=dt;const t=p.tg;if(t.dead||p.life<=0){FT.proj.splice(FT.proj.indexOf(p),1);continue;}
    const dx=t.x-p.x,dy=t.y-p.y,d=Math.hypot(dx,dy);
    if(d<t.r+.1){FT.proj.splice(FT.proj.indexOf(p),1);
      if(p.kind==='elem')applyElem(t,p.m,p.u,false);else{const v=(p.u.atk?p.u.atk.p:70)*p.u.cm*t.cmMul*.4;addG(2);fdamage(t,v,p.col,12);}continue;}
    p.x+=dx/d*15*dt;p.y+=dy/d*15*dt;
    FT.parts.push({x:p.x,y:p.y,h:.7,vx:0,vy:0,vh:0,life:.2,max:.2,col:p.col,size:3});}
  // 演出
  for(const q of FT.parts){q.life-=rdt;q.x+=q.vx*rdt;q.y+=q.vy*rdt;q.h=Math.max(0,q.h+q.vh*rdt);q.vh-=6*rdt;q.vx*=.92;q.vy*=.92;}
  FT.parts=FT.parts.filter(q=>q.life>0);
  for(const t of FT.texts){t.life-=rdt;}FT.texts=FT.texts.filter(t=>t.life>0);
  for(const b of FT.beams)b.life-=rdt;FT.beams=FT.beams.filter(b=>b.life>0);
  FT.shake=Math.max(0,(FT.shake||0)-rdt);
  if(FT.loseAt){
    if(!FT.warned&&FT.time>FT.loseAt-6){FT.warned=true;flog('<span class="hot">'+(FT.foes[0].d.bg==='deck'?'海が 大きく うねり始めた……！':'あたりの 空気が 重く 震え始めた……！')+'</span>');}
    if(!FT.vortex&&FT.time>FT.loseAt){FT.vortex=true;const e=FT.foes[0];flog('<span class="hot">'+(e.d.short||e.d.name)+'が 大渦を 呼んだ！ すべてが 呑みこまれていく――</span>');FT.shake=1.2;
      FT.party.forEach(u=>{u.hp=0;});fburst(M.W/2,M.H/2,'#62B2FF',60,7,4);setTimeout(()=>fightEnd('lose'),1400);}
  }
  G.px=L.x;G.py=L.y;G.dir=L.dir;
  FT.uiT-=rdt;if(FT.uiT<=0){FT.uiT=.2;fightHUD();}
}

/* ---------- 終了 ---------- */
function fightEnd(r){
  if(!FT||FT.over)return;FT.over=r;fMenu(false);
  const ids=FT.ids,lines=[];let loot=FT.stolen?null:null;
  if(r==='win'){
    let xp=0,gd=0;G.kills=G.kills||{};
    FT.foes.forEach(e=>{const d=e.d;xp+=Math.round(expFor(d.lv)*(partyOpt(ids,'経験値 +10%')?1.1:1));gd+=Math.round(goldFor(d)*(partyOpt(ids,'ゴールド +20%')?1.2:1));
      G.kills[e.k]=(G.kills[e.k]||0)+1;e.f.alive=false;e.f.respawn=30;if(d.boss)G.bossDown[e.k]=true;});
    G.gold+=gd;lines.push('経験値 '+xp+' と '+gd+'G を かくとく。');
    FT.party.forEach(u=>{G.hp[u.id]=Math.min(maxHP(u.id),Math.max(1,u.hp)+Math.round(maxHP(u.id)*(hasOpt(u.id,'勝利時の回復 +10%')?0.2:0.1)));});
    lines.push(...giveExp(xp));
    const top=FT.foes[0].d;const chance=top.boss?1:Math.min(.8,.45+.15*(FT.foes.length-1));
    if(Math.random()<chance)loot=addLoot(top.boss?2:(top.lv>=G.L+2?1:0));
    if(FT.stolen&&!loot)loot=FT.stolen;
  }else{FT.party.forEach(u=>{G.hp[u.id]=u.hp;});FT.foes.forEach(e=>{if(!e.dead){e.f.x=e.f.hx;e.f.y=e.f.hy;}});}
  const d0=FT.foes[0].d;
  if(!FT.boss)FT.foes.forEach(e=>{if(!e.dead&&r==='win'){e.f.x=e.x;e.f.y=e.y;}});
  if(FT.arena){M=FT.arena.M;G.px=FT.arena.px;G.py=FT.arena.py;G.dir=FT.arena.dir;}
  const resolve=FT.resolve,auto=FT.auto,scriptLose=FT.scriptLose;
  FT=null;inv=1.5;fightUI(false);save();renderTop();
  FRES={resolve,r,auto:auto&&!loot?2.2:0};
  const box=$('fres');
  box.innerHTML=(r==='win'?'<div class="hot">'+(d0.short||d0.name)+'を たおした！</div><div class="dim" style="font-size:13px">'+lines.join('<br>')+'</div>'+(loot?lootHTML(loot):'')
    :(scriptLose?'<div style="color:#62B2FF">大渦に 呑みこまれた――</div>':'<div style="color:var(--dead)">ぜんめつ してしまった…</div>'))+'<button class="bigbtn" id="fresBtn" style="width:100%;margin-top:8px">'+(r==='win'?'つづける':'……')+'</button>';
  box.hidden=false;$('fresBtn').onclick=closeResult;
}
function closeResult(){if(!FRES)return;const {resolve,r}=FRES;FRES=null;$('fres').hidden=true;renderMsg();resolve(r);}

/* ---------- 画面 ---------- */
const fctrl=document.createElement('div');fctrl.id='fightBtns';fctrl.hidden=true;
fctrl.innerHTML='<button class="bigbtn" id="fAtk">攻撃</button><button class="bigbtn" id="fDodge">回避</button><button class="bigbtn" id="fCmd">コマンド<small></small></button><button class="bigbtn" id="fAuto">オート</button>';
document.querySelector('#ctrl .ctrlbtns').after(fctrl);
const fpanel=document.createElement('div');fpanel.id='fcmd';fpanel.className='win';fpanel.hidden=true;$('ctrl').after(fpanel);
const fres=document.createElement('div');fres.id='fres';fres.className='win';fres.hidden=true;fbox.appendChild(fres);
$('fAtk').onclick=()=>fAttack();
$('fDodge').onclick=()=>{if(!FT)return;let ix=0,iy=0;if(pad){ix=pad.dx;iy=pad.dy;}if(keys.ArrowLeft||keys.a)ix=-1;if(keys.ArrowRight||keys.d)ix=1;if(keys.ArrowUp||keys.w)iy=-1;if(keys.ArrowDown||keys.s)iy=1;fDodge(ix,iy);};
$('fCmd').onclick=()=>fMenu(!(FT&&FT.menu));
$('fAuto').onclick=()=>{if(!FT)return;FT.auto=!FT.auto;G.autoOn=FT.auto;fightHUD();};
function fightUI(on){
  $('fightBtns').hidden=!on;document.querySelector('#ctrl .ctrlbtns').hidden=on;
  if(!on){fpanel.hidden=true;$('ctrl').hidden=false;}
  if(on)fightHUD();
}
function fMenu(on){
  if(!FT)return;if(on&&(FT.gauge<FCOST||FT.over))return;
  FT.menu=on;fpanel.hidden=!on;$('ctrl').hidden=on;if(on)renderCmdPanel();fightHUD();
}
function renderCmdPanel(){
  const tg=fTarget();const st=[];if(tg){if(tg.res&&tg.res.t>0)st.push('<span style="color:'+(ECOL[tg.res.e]||'#fff')+'">'+ELEM[tg.res.e].res+'</span>');if(tg.state==='charge')st.push('<span style="color:var(--low)">ため中</span>');if(tg.frozen>0)st.push('凍結');}
  let h='<div class="fch"><span>時間停止中　ねらい：'+(tg?(tg.d.short||tg.d.name):'なし')+'</span><span>'+st.join('・')+'</span></div><div class="fcl">';
  cmdList().forEach((c,i)=>{h+='<button class="opt fcb'+(c.hot?' on':'')+'" data-i="'+i+'"'+(c.ok?'':' disabled')+'><span><span class="dim" style="font-size:12px">'+c.u.c.name+'</span> <span class="'+(c.m.e?'e-'+c.m.e+' ec':'')+'">'+c.m.n+'</span></span><small>'+c.hint+'</small></button>';});
  h+='</div><div class="fch"><span>タクト '+Math.floor(FT.gauge/FCOST)+'本（続けて 指示できる）</span><button class="opt" id="fBack" style="width:auto;padding-left:18px">もどる</button></div>';
  fpanel.innerHTML=h;
  const list=cmdList();fpanel.querySelectorAll('.fcb').forEach(b=>b.onclick=()=>runCmd(list[+b.dataset.i]));
  $('fBack').onclick=()=>fMenu(false);
}
function fightHUD(){
  if(!FT)return;
  $('status').innerHTML=statusHTML(FT.ids,FT.party.map(u=>u.hp),FT.party.map(u=>u.max));
  const n=Math.floor(FT.gauge/FCOST);const b=$('fCmd');b.classList.toggle('ready',n>0);b.querySelector('small').textContent=' '+'◆'.repeat(n)+'◇'.repeat(3-n);
  $('fAuto').textContent=FT.auto?'オート中':'オート';$('fAuto').classList.toggle('on',FT.auto);
}
// フリックで 回避（画面）
let fflick=null;
fbox.addEventListener('pointerdown',e=>{if(FT)fflick={x:e.clientX,y:e.clientY,t:performance.now()};},true);
fbox.addEventListener('pointerup',e=>{if(!FT||!fflick)return;const dx=e.clientX-fflick.x,dy=e.clientY-fflick.y;if(performance.now()-fflick.t<240&&Math.hypot(dx,dy)>32)fDodge(dx,dy);fflick=null;},true);
// 敵を タップで ねらい替え
fbox.addEventListener('pointerdown',e=>{if(!FT)return;const r=gl3.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;
  for(const f of FT.foes){if(f.dead)continue;const p=proj3(f.x,.6*f.scale,f.y);if(Math.hypot(p.x-mx,p.y-my)<28*f.scale){FT.lock=f;if(FT.menu)renderCmdPanel();return;}}},true);
window.addEventListener('keydown',e=>{
  if(FRES&&(e.key==='Enter'||e.key===' '||e.key==='z')){e.preventDefault();e.stopImmediatePropagation();closeResult();return;}
  if(!FT)return;const k=e.key.toLowerCase();
  if(FT.menu){const n='123456789'.indexOf(k);if(n>=0){const l=cmdList();if(l[n]&&l[n].ok)runCmd(l[n]);}if(k==='escape'||k==='c'||k==='l')fMenu(false);e.stopImmediatePropagation();return;}
  if(k==='x'||k==='k'){fDodge((keys.ArrowRight||keys.d?1:0)-(keys.ArrowLeft||keys.a?1:0),(keys.ArrowDown||keys.s?1:0)-(keys.ArrowUp||keys.w?1:0));e.stopImmediatePropagation();}
  if(k==='c'||k==='l'){fMenu(true);e.stopImmediatePropagation();}
  if(k==='o'){FT.auto=!FT.auto;G.autoOn=FT.auto;fightHUD();}
},true);

/* ---------- 3Dへの 重ね描き ---------- */
function fightOverlay(o,font){
  if(!FT)return;const w=F3.w,h=F3.h;
  // 敵の 頭上
  for(const e of FT.foes){if(e.dead)continue;const p=proj3(e.x,1.25*e.scale+.2,e.y);if(!p.ok)continue;
    if(!e.d.boss){o.fillStyle='#10141C';o.fillRect(p.x-18,p.y,36,5);o.fillStyle='#C9A3FF';o.fillRect(p.x-18,p.y,36*Math.max(0,e.hp/e.max),5);}
    if(e.res&&e.res.t>0){o.font='13px '+font;o.textAlign='center';o.lineWidth=3;o.strokeStyle='#000';const s=ELEM[e.res.e].res;o.strokeText(s,p.x,p.y-6);o.fillStyle=ECOL[e.res.e]||'#fff';o.fillText(s,p.x,p.y-6);}
    if(e.state==='charge'){o.strokeStyle='#F5A623';o.lineWidth=2;o.beginPath();o.arc(p.x,p.y+20,14+Math.sin(perf*12)*3,0,7);o.stroke();}
    if(e.state==='stagger'||e.stun>0){o.fillStyle='#FFD34D';for(let i=0;i<3;i++){const a=perf*5+i*2.09;o.fillRect(p.x+Math.cos(a)*14-2.5,p.y-18+Math.sin(a)*4-2.5,5,5);}}
    if(e===FT.lock){o.fillStyle='#FFD34D';o.beginPath();o.moveTo(p.x-6,p.y-30);o.lineTo(p.x+6,p.y-30);o.lineTo(p.x,p.y-22);o.fill();}
  }
  // 斬撃
  const L=FT.party[0];
  for(const u of FT.party){if(u.atkT>0&&u.hp>0){const f=u.face??0,k=1-u.atkT/.13,dir=u.swing===1?-1:1,span=1.9,st=f-dir*span/2;
    o.strokeStyle=u===L&&u.swing===2?'rgba(255,230,150,.9)':'rgba(255,255,255,.75)';o.lineWidth=u===L&&u.swing===2?5:3;o.lineCap='round';o.beginPath();
    for(let i=0;i<=8;i++){const a=st+dir*span*k*i/8;const p=proj3(u.x+Math.cos(a)*.9,.45,u.y+Math.sin(a)*.9);i?o.lineTo(p.x,p.y):o.moveTo(p.x,p.y);}o.stroke();}}
  for(const b of FT.beams){const a=proj3(b.a.x,.8,b.a.y),c=proj3(b.b.x,.6,b.b.y);o.globalAlpha=b.life/.35;o.strokeStyle=b.col;o.lineWidth=4;o.beginPath();o.moveTo(a.x,a.y);o.lineTo(c.x,c.y);o.stroke();}
  o.globalAlpha=1;
  for(const p of FT.proj){const q=proj3(p.x,.7,p.y);o.fillStyle=p.col;o.beginPath();o.arc(q.x,q.y,5,0,7);o.fill();}
  for(const q of FT.parts){const p=proj3(q.x,q.h,q.y);o.globalAlpha=Math.max(0,q.life/q.max);o.fillStyle=q.col;o.fillRect(p.x-q.size/2,p.y-q.size/2,q.size,q.size);}
  o.globalAlpha=1;o.textAlign='center';
  for(const t of FT.texts){const up=(1-t.life/t.max)*26;const p=proj3(t.x,1.3,t.y);o.globalAlpha=Math.min(1,t.life/t.max*2);o.font=t.size+'px '+font;
    o.lineWidth=3.5;o.strokeStyle='#10141C';o.strokeText(t.t,p.x,p.y-up);o.fillStyle=t.col;o.fillText(t.t,p.x,p.y-up);}
  o.globalAlpha=1;
  const boss=FT.foes.find(e=>e.d.boss&&!e.dead);
  if(boss){const bw=Math.min(300,w-40),bx=(w-bw)/2;o.fillStyle='rgba(0,0,0,.8)';o.fillRect(bx,8,bw,26);o.strokeStyle='#fff';o.lineWidth=2;o.strokeRect(bx,8,bw,26);
    o.fillStyle='#3A1F2F';o.fillRect(bx+8,23,bw-16,6);o.fillStyle=boss.angry?'#FF5A4F':'#C9A3FF';o.fillRect(bx+8,23,(bw-16)*Math.max(0,boss.hp/boss.max),6);
    o.font='11px '+font;o.fillStyle='#fff';o.textAlign='left';o.fillText((boss.d.short||boss.d.name)+' Lv'+boss.d.lv,bx+8,20);}
  // タクト
  const gy=boss?40:8;o.fillStyle='rgba(0,0,0,.7)';o.fillRect(8,gy,128,20);o.font='11px '+font;o.fillStyle='#FFD34D';o.textAlign='left';o.fillText('タクト',13,gy+14);
  for(let i=0;i<3;i++){const v=fclamp((FT.gauge-i*FCOST)/FCOST,0,1);o.fillStyle='#333';o.fillRect(52+i*27,gy+6,24,8);o.fillStyle='#FFD34D';o.fillRect(52+i*27,gy+6,24*v,8);}
  if(FT.guardT>0){o.fillStyle='#9FD8FF';o.fillText('守り',142,gy+14);}
  // 仲間の 頭上の HP
  for(const u of FT.party){if(u.hp<=0)continue;const p=proj3(u.x,1.35,u.y);if(!p.ok)continue;const r=u.hp/u.max;
    o.fillStyle='#10141C';o.fillRect(p.x-14,p.y,28,4);o.fillStyle=r<.35?'#F5A623':'#5BE08A';o.fillRect(p.x-14,p.y,28*r,4);}
  // 画面下：パーティの HP とレベル
  const n=FT.party.length,pad=6,ph=38,py=h-ph-pad,cw=(w-pad*2-(n-1)*4)/n;
  FT.party.forEach((u,i)=>{const x=pad+i*(cw+4),r=u.hp/u.max,dead=u.hp<=0;
    o.fillStyle='rgba(0,0,0,.78)';o.fillRect(x,py,cw,ph);o.strokeStyle=dead?'#E0413A':r<.35?'#F5A623':'#FFFFFF';o.lineWidth=2;o.strokeRect(x+1,py+1,cw-2,ph-2);
    o.font='12px '+font;o.textAlign='left';o.fillStyle=dead?'#E0413A':'#FFFFFF';o.fillText(u.c.name,x+6,py+15);
    o.textAlign='right';o.fillStyle='#FFD34D';o.font='11px '+font;o.fillText('Lv'+G.L,x+cw-6,py+15);
    o.fillStyle='#222';o.fillRect(x+6,py+21,cw-12,6);o.fillStyle=dead?'#E0413A':r<.35?'#F5A623':'#5BE08A';o.fillRect(x+6,py+21,(cw-12)*Math.max(0,r),6);
    o.font='10px '+font;o.fillStyle=dead?'#E0413A':'#DDD';o.fillText(dead?'たおれた':Math.ceil(u.hp)+'/'+u.max,x+cw-6,py+36);});
  if(FT.menu){o.fillStyle='rgba(30,50,110,.3)';o.fillRect(0,0,w,h);o.font='13px '+font;o.fillStyle='#FFD34D';o.textAlign='center';o.fillText('― 時間停止中 ―',w/2,py-8);}
  else if(FT.slowT>0){o.strokeStyle='rgba(255,211,77,'+Math.min(.6,FT.slowT*.6)+')';o.lineWidth=10;o.strokeRect(5,5,w-10,h-10);}
}
