/* ===== 本体：状態・マップ・描画・移動・会話・イベント ===== */
const $=id=>document.getElementById(id);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SAVE_KEY='nanatsu-v1';
let G=null;
function defaultG(){return {gold:0,feast:0,map:'town',px:9.5,py:8.5,dir:0,L:1,exp:0,hp:{},party:['leon'],follow:null,lost:[],flags:{},items:[],equip:{},nextId:1,dex:[],bread:0,bossDown:{},dg:null,autoOn:false,savedAt:null,chests:{}};}
const needExp=L=>Math.round(8*Math.pow(L,2.2)+20);
const gainExp=E=>Math.round(6*Math.pow(E,1.55)+10);
const lvMul=()=>0.6+0.05*G.L;

/* 装備 */
function newItem(o){const it=Object.assign({atk:0,def:0,hpb:0,opts:[],wtype:null},o,{id:G.nextId++});G.items.push(it);return it;}
function ensureMember(id){
  if(!G.equip[id]){G.equip[id]={};(STARTER[id]||[]).forEach(o=>{const it=newItem(Object.assign({},o,{rar:RAR[o.ri]}));G.equip[id][o.type]=it.id;});}
  if(G.hp[id]==null)G.hp[id]=maxHP(id);
}
const itemById=id=>G.items.find(it=>it.id===id)||null;
const eqOf=id=>{const e=G.equip[id]||{};return SLOTS.map(s=>itemById(e[s])).filter(Boolean);};
const sumStat=(id,k)=>eqOf(id).reduce((a,it)=>a+(it[k]||0),0);
const atkOf=id=>sumStat(id,'atk'),defOf=id=>sumStat(id,'def');
function whoWears(itemId){for(const id of Object.keys(G.equip))for(const s of SLOTS)if(G.equip[id][s]===itemId)return id;return null;}
function maxHP(id){return Math.round(CHARS[id].base*lvMul()*(1+sumStat(id,'hpb')/100));}
function fullHeal(){G.party.forEach(id=>G.hp[id]=maxHP(id));}
const pick=a=>a[Math.floor(Math.random()*a.length)];
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const LOOT_OPTS=['残り火が3枠つづく','陽炎の威力 +20%','崩しダメージ +30%','水鉄砲で火が消えない','勝利時の回復 +10%','経験値 +10%','ゴールド +20%'];
function addLoot(tier){
  const W0=[[40,32,18,8,2],[20,34,28,14,4],[0,0,60,30,10]][tier];
  let r=Math.random()*100,ri=0;for(;ri<4;ri++){if(r<W0[ri])break;r-=W0[ri];}
  const type=pick(['weapon','weapon','armor','armor','acc']);
  const o={type,rar:RAR[ri],opts:[]};const lb=Math.round(G.L*0.9*(1+ri*0.15));
  if(type==='weapon'){o.wtype=CHARS[pick(G.party)].wtype;o.name=pick(NAMES[o.wtype]);o.atk=rnd(6+ri*6,11+ri*7)+lb;}
  else if(type==='armor'){o.name=pick(NAMES.armor);o.def=rnd(6+ri*5,10+ri*6)+Math.round(lb*.8);}
  else o.name=pick(NAMES.acc);
  const pool=['atk','hp',...LOOT_OPTS];
  const n=type==='acc'?ri+1:ri;
  for(let i=0;i<n&&pool.length;i++){const k=pool.splice(Math.floor(Math.random()*pool.length),1)[0];
    if(k==='atk'){const v=rnd(3+ri*2,6+ri*3)+Math.round(G.L*.3);o.atk=(o.atk||0)+v;o.opts.push('攻撃力 +'+v);}
    else if(k==='hp'){const v=rnd(4+ri*2,7+ri*3);o.hpb=v;o.opts.push('最大HP +'+v+'%');}
    else o.opts.push(k);}
  return newItem(o);
}
const hasOpt=(id,t)=>eqOf(id).some(it=>(it.opts||[]).includes(t));
const partyOpt=(ids,t)=>ids.some(id=>hasOpt(id,t));
function wtOwner(w){const id=Object.keys(CHARS).find(k=>CHARS[k].wtype===w);return CHARS[id].name;}
function itemKind(it){return it.type==='weapon'?WT_JP[it.wtype]+'（'+wtOwner(it.wtype)+'用）':SLOT_JP[it.type];}
function itemStats(it){const a=[];if(it.atk)a.push('攻撃+'+it.atk);if(it.def)a.push('守備+'+it.def);if(it.hpb)a.push('HP+'+it.hpb+'%');return a.join(' ');}
function lootHTML(it){return '<div class="loot" style="--rc:var('+it.rar.c+')"><div class="r">'+it.rar.n+'・'+itemKind(it)+'</div>'+it.name+'　<small style="color:var(--muted)">'+itemStats(it)+'</small>'+(it.opts.length?'<ul>'+it.opts.map(o=>'<li>'+o+'</li>').join('')+'</ul>':'')+'</div>';}

/* セーブ */
/* 記録：アカウント側（db）に保存し、端末のブラウザにも控えを残す */
let cloud=null,cloudBusy=false,cloudPending=null,cloudLast=null;
async function initCloud(){
  try{
    if(!window.claude||!window.claude.use)return;
    const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);
    if(!db||!user)return;
    const id=await user.id();if(!id)return;
    cloud={ref:db.doc('data/users/'+id+'/save')};
  }catch(e){cloud=null;}
}
async function cloudLoad(){
  if(!cloud)return null;
  for(let i=0;i<2;i++){try{const snap=await cloud.ref.get();if(snap.exists){const d=snap.data();cloudLast=d.json;return JSON.parse(d.json);}return null;}catch(e){if(e&&e.code==='unavailable'){await sleep(800);continue;}return null;}}
  return null;
}
function localLoad(){try{const s=localStorage.getItem(SAVE_KEY);return s?JSON.parse(s):null;}catch(e){return null;}}
async function flushCloud(){
  cloudBusy=true;
  while(cloudPending&&cloud){
    const s=cloudPending;cloudPending=null;
    if(s===cloudLast)continue;
    try{await cloud.ref.set({json:s,at:Date.now()});cloudLast=s;}
    catch(e){if(e&&(e.code==='invalid_argument'||e.code==='revoked'||e.code==='not_granted')){cloud=null;break;}cloudPending=cloudPending||s;await sleep(1500+Math.random()*1000);}
  }
  cloudBusy=false;
}
function localOK(){try{localStorage.setItem('_probe','1');localStorage.removeItem('_probe');return true;}catch(e){return false;}}
function storeMode(){return cloud?'cloud':localOK()?'local':'none';}
/* ふっかつのじゅもん：記録を文字列にする（どの画面でも使える控え） */
async function makeCode(){
  const s=JSON.stringify(G);
  if(window.CompressionStream){const buf=await new Response(new Blob([s]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer();let bin='';new Uint8Array(buf).forEach(b=>bin+=String.fromCharCode(b));return 'Z'+btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  return 'J'+btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
async function readCode(code){
  code=(code||'').replace(/\s/g,'');const kind=code[0];let b=code.slice(1).replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';
  const bin=atob(b);
  if(kind==='Z'){const u=Uint8Array.from(bin,c=>c.charCodeAt(0));return JSON.parse(await new Response(new Blob([u]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text());}
  return JSON.parse(decodeURIComponent(escape(bin)));
}
function copyText(el,btn){const t=el.value;const done=()=>{btn.textContent='コピーした！';};try{navigator.clipboard.writeText(t).then(done,()=>{el.select();btn.textContent='選択したので コピーしてね';});}catch(e){el.select();btn.textContent='選択したので コピーしてね';}}
function applySave(obj){G=defaultG();if(obj)Object.assign(G,obj);(G.items||[]).forEach(it=>{it.opts=(it.opts||[]).map(o=>o.replace('（まだ効果なし）','').replace('会心率 +10%','勝利時の回復 +10%'));});G.party.forEach(ensureMember);if(G.flags.sailIntro&&!G.flags.earthMig){G.flags.earthMig=true;if(!G.flags.earthDone&&!G.lost.includes('土')){G.lost.push('土');G.flags.earthNote=true;}}}
function load(){applySave(null);}
function save(){
  const d=new Date();G.savedAt=(d.getMonth()+1)+'/'+d.getDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');G.savedTs=Date.now();
  const s=JSON.stringify(G);let ok=false;
  try{localStorage.setItem(SAVE_KEY,s);ok=true;}catch(e){}
  if(cloud){cloudPending=s;ok=true;if(!cloudBusy)flushCloud();}
  return ok;
}
async function eraseSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}if(cloud){try{await cloud.ref.delete();}catch(e){}}cloudLast=null;}
function expFor(E){const diff=E-G.L;const m=diff<0?Math.max(.3,1+.25*diff):Math.min(2,1+.2*diff);return Math.round(gainExp(E)*m);}
function giveExp(e){
  const out=[];G.exp+=e;
  while(G.exp>=needExp(G.L)){G.exp-=needExp(G.L);const before={};G.party.forEach(id=>before[id]=maxHP(id));G.L++;G.party.forEach(id=>{G.hp[id]=Math.min(maxHP(id),G.hp[id]+(maxHP(id)-before[id]));});out.push('<span class="hot">レベルが '+G.L+' に あがった！</span>');}
  return out;
}

/* ===== マップ ===== */
const WORLD={};let M=null;
function getMap(name){
  if(WORLD[name])return WORLD[name];
  const d=MAPS[name];const t=d.build?d.build():d.rows.map(r=>r.split(''));
  const m={name,d,t,W:t[0].length,H:t.length,npcs:d.npcs?d.npcs():[],foes:[]};
  let fid=0;
  (d.foes||[]).forEach(([k,x,y])=>m.foes.push({id:name+fid++,k,hx:x+.5,hy:y+.5,x:x+.5,y:y+.5,vx:0,vy:0,t:Math.random()*2,alive:!(FOES[k].boss&&G.bossDown[k]),respawn:0}));
  (d.special||[]).forEach(s=>m.foes.push({id:name+fid++,k:s.k,hx:s.x+.5,hy:s.y+.5,x:s.x+.5,y:s.y+.5,vx:0,vy:0,t:0,alive:!G.bossDown[s.k],respawn:0,show:s.show}));
  if(name==='ruins'){
    if(!G.dg)G.dg={lit:[],g1:false,g2:false,boss:false,intro:false};
    G.dg.lit.forEach(k=>{const [x,y]=k.split(',').map(Number);t[y][x]='O';});
    if(G.dg.g1)t[14][7]=':';if(G.dg.g2)t[6][7]=':';if(G.dg.boss)t[3][7]='Y';
  }
  if(name==='waterway'&&G.flags.bridge){t[3][9]=':';t[6][9]='B';}
  if(name==='seacave'&&G.flags.seaDone)t[2][8]='N';
  if(name==='roofs')applyRoof(m);
  if(name==='haguruma'&&G.flags.hagurumaDoor){for(let y=0;y<t.length;y++)for(let x=0;x<t[0].length;x++){if(t[y][x]==='q')t[y][x]='Q';if(t[y][x]==='K')t[y][x]=':';}t[5][8]=':';}
  if(name==='hakusetsu'&&G.flags.fallMelt)t[4][9]='S';
  if(name==='dochi'&&G.flags.earthDone)t[5][8]='Q';
  if(name==='roots')[[10,17],[10,14],[10,11],[10,8]].forEach(([x,y])=>{if(G.flags['obs_'+x+'_'+y])t[y][x]=':';});
  if(name==='archive'&&G.flags.archDoor){for(let y=0;y<t.length;y++)for(let x=0;x<t[0].length;x++){if(t[y][x]==='q')t[y][x]='Q';if(t[y][x]==='K')t[y][x]=':';}t[9][8]=':';}
  if(name==='tenpu')[[9,21],[10,12]].forEach(([x,y])=>{if(G.flags['pil_'+x+'_'+y]){t[y][x]='a';t[y-1][x]='B';t[y-2][x]='B';}});
  if(name==='hakurei'&&G.flags.hkMelt)t[8][11]='S';
  if(name==='yamajinja'&&G.flags.mizuLog){t[6][9]='B';t[7][9]='B';}
  refreshWater(m);
  WORLD[name]=m;return m;
}
function setTile(x,y,c){M.t[y][x]=c;}
function gearDoorCheck(){if(!M.t.some(r=>r.includes('q'))){const g=M.d.gateAt||[8,9];M.t[g[1]][g[0]]=':';G.flags[M.name==='archive'?'archDoor':M.name+'Door']=true;save();setTimeout(()=>toast('ゴゴゴ……奥の 扉が 開いた！'),600);}}
function applyRoof(m){const st=G.flags.roofState;const b1=st===0,b2=st===1;[14,15].forEach(y=>m.t[y][4]=b1?'+':'*');[6,7].forEach(y=>m.t[y][13]=b2?'+':'*');}
const tileAt=(x,y)=>{const tx=Math.floor(x),ty=Math.floor(y);if(tx<0||ty<0||tx>=M.W||ty>=M.H)return '#';return M.t[ty][tx];};
const solidAt=(x,y)=>{const c=tileAt(x,y);if(c==='潮')return !G.flags.swampNight;return SOLID.has(c);};
const visibleNpcs=()=>M.npcs.filter(n=>!n.show||n.show());
let trail=[];
function refreshWater(m){
  if(m.name!=='field'&&m.name!=='port')return;
  const dry=G.lost.includes('水');
  for(let y=0;y<m.H;y++)for(let x=0;x<m.W;x++){const c=m.t[y][x];if(dry&&c==='~')m.t[y][x]='v';else if(!dry&&c==='v')m.t[y][x]='~';}
}
function activeParty(){const a=(G.active&&G.active.length?G.active:G.party).filter(id=>G.party.includes(id));return (a.length?a:G.party).slice(0,4);}
function changeMap(name,x,y,dir){
  if(name==='seacave'&&!G.flags.seaDone)delete WORLD.seacave;
  G.map=name;M=getMap(name);G.px=x;G.py=y;if(dir!==undefined)G.dir=dir;
  flame=0;trail=[];inv=1;safe={x,y};insideTrig=new Set(currentTrigs().map(t=>t.key));
  toast(M.d.title||'');renderMsg();save();
}

/* ===== 描画 ===== */
const cv=$('map'),ctx=cv.getContext('2d');
const shade=document.createElement('canvas'),sctx=shade.getContext('2d');
let TS=36,VW=11,VH=13,DPR=1;
function resize(){
  const w=cv.parentElement.clientWidth||360;DPR=Math.min(2,window.devicePixelRatio||1);
  TS=Math.floor(w/11);VW=w/TS;const h=Math.round(TS*VH);
  cv.width=Math.round(w*DPR);cv.height=Math.round(h*DPR);cv.style.height=h+'px';
  shade.width=cv.width;shade.height=cv.height;
  ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=false;
}
window.addEventListener('resize',resize);
const FONT=()=>getComputedStyle(document.body).fontFamily;
function floorCol(x,y){return (x+y)%2?'#8C7B68':'#857461';}
function drawTile(t,sx,sy,x,y,time){
  const s=TS;const R=(c,a,b,w,h)=>{ctx.fillStyle=c;ctx.fillRect(sx+s*a,sy+s*b,s*w,s*h);};
  const indoor=':#k>ZhjtexbwoOu12XYEK<qQrnN蔦岩滝影'.includes(t)||(t==='~'&&M.d.dim)||(t==='B'&&M.d.dim);
  if(t==='#'){ctx.fillStyle='#4A4038';ctx.fillRect(sx,sy,s+1,s+1);ctx.fillStyle='#3A322B';ctx.fillRect(sx,sy+s*.48,s+1,2);ctx.fillRect(sx+((y%2)?s*.3:s*.7),sy,2,s*.48);ctx.fillRect(sx+((y%2)?s*.7:s*.3),sy+s*.5,2,s*.5);return;}
  if(indoor){
    ctx.fillStyle=floorCol(x,y);ctx.fillRect(sx,sy,s+1,s+1);
    switch(t){
      case 'k':R('#8E2C3E',0,0,1.02,1.02);R('#C9A227',.08,0,.06,1.02);R('#C9A227',.86,0,.06,1.02);break;
      case 'Z':R('#8E2C3E',.15,.05,.7,.9);R('#C9A227',.1,0,.8,.15);R('#C9A227',.1,.8,.8,.12);break;
      case 'h':case 'j':R('#6E655B',.05,.1,.9,.85);R('#2B2522',.2,.35,.6,.5);
        if(t==='j'){const f=Math.sin(time*12+x)*s*.04;ctx.fillStyle='#FF7A2F';ctx.beginPath();ctx.moveTo(sx+s*.28,sy+s*.85);ctx.lineTo(sx+s*.5,sy+s*.4+f);ctx.lineTo(sx+s*.72,sy+s*.85);ctx.fill();ctx.fillStyle='#FFD34D';ctx.beginPath();ctx.moveTo(sx+s*.4,sy+s*.85);ctx.lineTo(sx+s*.5,sy+s*.58-f);ctx.lineTo(sx+s*.6,sy+s*.85);ctx.fill();}
        else{R('#5A5047',.3,.72,.4,.1);}break;
      case 't':R('#8B5A2B',.05,.25,.9,.55);R('#6B4222',.1,.75,.1,.2);R('#6B4222',.8,.75,.1,.2);break;
      case 'e':R('#6B4222',.05,.05,.9,.9);R('#E8EEF5',.12,.1,.76,.3);R('#3D6FB6',.12,.4,.76,.5);break;
      case 'b':R('#6B4222',.05,.05,.9,.9);R('#C8553D',.12,.15,.15,.3);R('#3D6FB6',.3,.15,.12,.3);R('#5C9A4C',.45,.15,.15,.3);R('#C9A227',.65,.15,.2,.3);R('#8E2C3E',.12,.55,.2,.3);R('#3D6FB6',.4,.55,.2,.3);R('#5C9A4C',.65,.55,.2,.3);break;
      case 'x':ctx.fillStyle='#8B5A2B';ctx.beginPath();ctx.ellipse(sx+s*.5,sy+s*.55,s*.35,s*.4,0,0,7);ctx.fill();R('#5A3820',.15,.35,.7,.06);R('#5A3820',.15,.7,.7,.06);break;
      case '>':case '<':R('#3A322B',.1,.1,.8,.8);R('#6E655B',.15,.2,.7,.12);R('#5E5549',.2,.42,.6,.12);R('#4E463C',.25,.64,.5,.12);break;
      case '蔦':R('#2E5A2E',0,0,1.02,1.02);ctx.strokeStyle='#5FA35A';ctx.lineWidth=3;ctx.beginPath();for(let i=0;i<4;i++){ctx.moveTo(sx+s*(.1+i*.25),sy);ctx.quadraticCurveTo(sx+s*(.25+i*.25),sy+s*.5,sx+s*(.1+i*.25),sy+s);}ctx.stroke();break;
      case '岩':ctx.fillStyle='#7A7068';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.55,s*.46,0,7);ctx.fill();R('#9A9088',.3,.3,.2,.1);R('#5A5048',.55,.6,.2,.06);break;
      case '滝':{R('#3F7FA8',0,0,1.02,1.02);ctx.strokeStyle='#BFE3F7';ctx.lineWidth=2;const o=(time*40)%(s*.5);for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(sx+s*(.2+i*.3),sy+o);ctx.lineTo(sx+s*(.2+i*.3),sy+o+s*.3);ctx.stroke();}break;}
      case '影':{ctx.fillStyle='rgba(40,20,60,.95)';ctx.fillRect(sx,sy,s+1,s+1);ctx.fillStyle='rgba(176,140,255,.35)';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.5,s*(.25+.05*Math.sin(time*3)),0,7);ctx.fill();break;}
      case 'K':if(M.d.gears){ctx.save();ctx.translate(sx+s*.5,sy+s*.5);ctx.fillStyle='#2A2520';ctx.beginPath();ctx.arc(0,0,s*.46,0,7);ctx.fill();ctx.fillStyle='#C9A227';for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.fillRect(-s*.07,-s*.46,s*.14,s*.16);}ctx.beginPath();ctx.arc(0,0,s*.32,0,7);ctx.fill();ctx.fillStyle='#5A4A2A';ctx.beginPath();ctx.arc(0,0,s*.1,0,7);ctx.fill();ctx.restore();break;}
        R('#2A2520',.04,.1,.92,.88);R('#C9BEA8',.08,.12,.84,.7);R('#E6DCC6',.08,.12,.84,.12);R('#8E8370',.08,.72,.84,.2);
        R('#6E6456',.46,.3,.06,.3);R('#6E6456',.22,.44,.56,.06);break;
      case 'w':{ctx.fillStyle='#4F8FC0';ctx.beginPath();ctx.ellipse(sx+s*.5,sy+s*.55,s*.42,s*.3,0,0,7);ctx.fill();const dp=(time*1.5+x*.7+y*.3)%1;ctx.strokeStyle='rgba(191,227,247,'+(1-dp)+')';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(sx+s*.5,sy+s*.55,s*.1+s*.3*dp,s*.07+s*.2*dp,0,0,7);ctx.stroke();break;}
      case 'o':case 'O':case 'u':R('#3B3B3B',.42,.45,.16,.45);R('#3B3B3B',.28,.85,.44,.08);ctx.fillStyle=t==='u'?'#3F6E9E':'#5A5A5A';ctx.beginPath();ctx.ellipse(sx+s*.5,sy+s*.42,s*.3,s*.12,0,0,7);ctx.fill();
        if(t==='u'){ctx.fillStyle='#8EC5F0';ctx.beginPath();ctx.ellipse(sx+s*.5,sy+s*.4,s*.2,s*.06,0,0,7);ctx.fill();}
        if(t==='O'){const f=Math.sin(time*12+x*3)*s*.04;ctx.fillStyle='#FF7A2F';ctx.beginPath();ctx.moveTo(sx+s*.3,sy+s*.4);ctx.lineTo(sx+s*.5,sy+s*.02+f);ctx.lineTo(sx+s*.7,sy+s*.4);ctx.fill();ctx.fillStyle='#FFD34D';ctx.beginPath();ctx.moveTo(sx+s*.4,sy+s*.4);ctx.lineTo(sx+s*.5,sy+s*.16-f);ctx.lineTo(sx+s*.6,sy+s*.4);ctx.fill();}break;
      case '1':case '2':ctx.fillStyle='#2B2B2B';ctx.fillRect(sx,sy,s+1,s+1);for(let i=0;i<4;i++)R('#9AA3AD',.1+i*.25,0,.08,1);R('#9AA3AD',0,.2,1,.06);break;
      case 'X':case 'Y':R('#B8AFA3',.1,.35,.8,.55);R('#6E655B',.1,.35,.8,.08);ctx.fillStyle='#3B3B3B';ctx.beginPath();ctx.ellipse(sx+s*.5,sy+s*.35,s*.32,s*.12,0,0,7);ctx.fill();
        if(t==='Y'){const f=Math.sin(time*10)*s*.05;ctx.fillStyle='#FF7A2F';ctx.beginPath();ctx.moveTo(sx+s*.22,sy+s*.35);ctx.lineTo(sx+s*.5,sy-s*.2+f);ctx.lineTo(sx+s*.78,sy+s*.35);ctx.fill();ctx.fillStyle='#FFD34D';ctx.beginPath();ctx.moveTo(sx+s*.36,sy+s*.35);ctx.lineTo(sx+s*.5,sy+s*.02-f);ctx.lineTo(sx+s*.64,sy+s*.35);ctx.fill();}break;
      case 'q':if(M.d.gears){ctx.strokeStyle='#8FE0B0';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.5,s*.36,0,7);ctx.stroke();ctx.fillStyle='#1A1E22';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.5,s*.3,0,7);ctx.fill();break;}
        R('#0E0C0A',0,.08,1.02,.84);ctx.strokeStyle='#5A4E42';ctx.lineWidth=s*.05;ctx.beginPath();
        ctx.moveTo(sx,sy+s*.1);[[.2,.22],[.35,.12],[.55,.25],[.72,.1],[1,.18]].forEach(([a,b])=>ctx.lineTo(sx+s*a,sy+s*b));
        ctx.moveTo(sx,sy+s*.88);[[.25,.78],[.45,.9],[.65,.8],[.85,.92],[1,.84]].forEach(([a,b])=>ctx.lineTo(sx+s*a,sy+s*b));ctx.stroke();break;
      case 'Q':if(M.d.gears){ctx.fillStyle='#C9A227';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.5,s*.36,0,7);ctx.fill();ctx.fillStyle='#5A4A2A';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.5,s*.1,0,7);ctx.fill();break;}
        R('#8A7F70',0,.05,1.02,.9);R('#6E655B',.1,.4,.8,.05);break;
      case 'r':{ctx.strokeStyle='#E0A08E';ctx.lineWidth=s*.09;ctx.lineCap='round';ctx.beginPath();
        [[.5,.9,.5,.35],[.5,.6,.25,.3],[.5,.55,.78,.22],[.3,.42,.18,.2],[.7,.35,.85,.45]].forEach(([a,b,c,d])=>{ctx.moveTo(sx+s*a,sy+s*b);ctx.lineTo(sx+s*c,sy+s*d);});ctx.stroke();
        ctx.fillStyle='#F2C2B2';[[.5,.35],[.25,.3],[.78,.22],[.18,.2],[.85,.45]].forEach(([a,b])=>{ctx.beginPath();ctx.arc(sx+s*a,sy+s*b,s*.07,0,7);ctx.fill();});break;}
      case 'n':case 'N':R('#B8AFA3',.1,.35,.8,.55);R('#6E655B',.1,.35,.8,.08);ctx.fillStyle=t==='N'?'#4FA3D9':'#3B3B3B';ctx.beginPath();ctx.ellipse(sx+s*.5,sy+s*.35,s*.32,s*.12,0,0,7);ctx.fill();
        if(t==='N'){const f=(time*1.2)%1;ctx.strokeStyle='rgba(191,227,247,'+(1-f)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(sx+s*.5,sy+s*.35,s*.1+s*.25*f,s*.04+s*.1*f,0,0,7);ctx.stroke();}break;
      case 'E':R('#C9B99A',.1,.1,.8,.8);R('#A8987A',.1,.3,.8,.05);R('#A8987A',.1,.5,.8,.05);R('#A8987A',.1,.7,.8,.05);break;
      case '~':ctx.fillStyle='#2F5E86';ctx.fillRect(sx,sy,s+1,s+1);{ctx.strokeStyle='#6FA8D8';ctx.lineWidth=2;const o=Math.sin(time*2+x)*s*.08;ctx.beginPath();ctx.moveTo(sx+s*.15,sy+s*.4+o);ctx.lineTo(sx+s*.45,sy+s*.4+o);ctx.moveTo(sx+s*.55,sy+s*.7-o);ctx.lineTo(sx+s*.85,sy+s*.7-o);ctx.stroke();}break;
      case 'B':ctx.fillStyle='#2F5E86';ctx.fillRect(sx,sy,s+1,s+1);R('#9A8F80',.05,.05,.9,.9);break;
    }
    return;
  }
  const TC={'v':'#D8C49A','.':'#7CC26B',',':'#7CC26B','%':'#5F8A58','=':'#D9C08A','~':'#4FA3D9','B':'#B9895A','T':'#6FB45E','H':'#E8D9B5','R':'#C8553D','d':'#7A5230','D':'#6B4222','F':'#7CC26B','W':'#D9C08A','C':'#7CC26B','L':'#D9C08A','s':'#D9C08A','弁':'#8A8F99','鏡':'#7CC26B','碑':'#7CC26B','鐘':'#5F8A58','潮':'#3F7FA8','f':'#8A6A48','S':'#EEF3F7','凍':'#BFE3F7','p':'#8A8F99','M':'#5A5F68','@':'#8A8F99','*':'#BFE3F7','+':'#BFE3F7','^':'#7A7F88','z':'#1E1A22','I':'#9A9FA8','a':'#A3A88F','U':'#7CC26B','l':'#4FA3D9','y':'#E6D3A3','P':'#7CC26B','J':'#3F4A5C','g':'#A0703F','m':'#A0703F','V':'#6FA35A'};
  ctx.fillStyle=TC[t]||'#7CC26B';
  if(t==='.'&&((x+y)%2===0))ctx.fillStyle='#78BD66';
  if(t==='T'&&(M.name==='hakusetsu'||M.name==='hakurei'))ctx.fillStyle='#EEF3F7';
  if(t==='L'||t==='s'||t==='W'){const u=tileAt(x-1,y);ctx.fillStyle=(u==='='||u==='W'||u==='s')?'#D9C08A':'#7CC26B';}
  ctx.fillRect(sx,sy,s+1,s+1);
  switch(t){
    case ',':{const cols=['#FF9EC7','#FFF','#FFE066'];for(let i=0;i<3;i++)R(cols[(x+y+i)%3],.2+.3*i,.3+.2*((i+x)%2),.12,.12);break;}
    case '%':R('#4E7548',.2,.6,.25,.12);R('#4E7548',.6,.25,.2,.1);break;
    case 'v':if((x*7+y*3)%5===0){R('#F4F1EA',.3,.4,.12,.08);}if((x*3+y*5)%7===0){R('#E07A5F',.6,.6,.1,.1);}R('#C9B38A',.1,.8,.3,.04);break;
    case '~':{ctx.strokeStyle='#BFE3F7';ctx.lineWidth=2;const o=Math.sin(time*2+x)*s*.08;ctx.beginPath();ctx.moveTo(sx+s*.15,sy+s*.4+o);ctx.lineTo(sx+s*.45,sy+s*.4+o);ctx.moveTo(sx+s*.55,sy+s*.7-o);ctx.lineTo(sx+s*.85,sy+s*.7-o);ctx.stroke();break;}
    case 'B':for(let i=0;i<4;i++)R('#8E6A42',0,i*.25+.2,1.02,.05);break;
    case 'T':R('#6B4A2B',.42,.6,.16,.35);ctx.fillStyle='#2F7D3A';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.45,s*.42,0,7);ctx.fill();ctx.fillStyle='#3E9A4A';ctx.beginPath();ctx.arc(sx+s*.4,sy+s*.35,s*.18,0,7);ctx.fill();break;
    case 'H':R('#CDB98E',0,.92,1.02,.08);if((x+y)%2===0){R('#6B4A2B',.28,.23,.44,.39);R(M.d.night?'#FFD27A':'#7EC8E3',.32,.27,.36,.31);}break;
    case 'R':for(let i=0;i<3;i++)R('#A8432F',0,i*.33+.28,1.02,.05);break;
    case 'd':R('#E8D9B5',0,0,.15,1);R('#E8D9B5',.85,0,.16,1);R('#F2C230',.65,.5,.08,.08);break;
    case 'D':R('#4A4038',0,0,1.02,1.02);R('#6B4222',.08,.1,.84,.9);R('#4A2E16',.48,.1,.04,.9);R('#C9A227',.38,.55,.06,.06);R('#C9A227',.56,.55,.06,.06);break;
    case 'F':R('#A07A4A',0,.4,1.02,.1);R('#A07A4A',0,.65,1.02,.1);R('#A07A4A',.1,.25,.12,.6);R('#A07A4A',.6,.25,.12,.6);break;
    case 'W':ctx.fillStyle='#8D8D8D';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.55,s*.45,0,7);ctx.fill();ctx.fillStyle='#4FA3D9';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.55,s*.32,0,7);ctx.fill();break;
    case 'C':ctx.fillStyle='#7D6B5A';ctx.beginPath();ctx.ellipse(sx+s*.5,sy+s*.6,s*.55,s*.45,0,Math.PI,0);ctx.fill();R('#7D6B5A',-.05,.6,1.1,.3);ctx.fillStyle='#1E1A16';ctx.beginPath();ctx.ellipse(sx+s*.5,sy+s*.72,s*.25,s*.3,0,Math.PI,0);ctx.fill();R('#1E1A16',.25,.72,.5,.18);break;
    case 'L':R('#3B3B3B',.44,.3,.12,.65);R('#3B3B3B',.3,.9,.4,.08);R('#2B2B2B',.3,.12,.4,.2);
      if(fireOn()){const f=Math.sin(time*9+x)*s*.03;R('#FFD34D',.36,.14+f/s,.28,.16);}else R('#555',.36,.14,.28,.16);break;
    case 'l':R('#7A5230',.3,-.02,.4,1.04);R('#5A3A1C',.3,.3,.4,.05);ctx.fillStyle='rgba(79,163,217,.55)';ctx.fillRect(sx,sy+s*.45,s+1,s*.55);break;
    case 'U':{R('#8B5A2B',.4,.3,.2,.7);R('#6B4222',.3,.85,.4,.15);const a=G.lost.includes('風')?0.3:time*2;ctx.strokeStyle='#F4F1EA';ctx.lineWidth=s*.12;ctx.beginPath();for(let i=0;i<4;i++){const q=a+i*Math.PI/2;ctx.moveTo(sx+s*.5,sy+s*.3);ctx.lineTo(sx+s*.5+Math.cos(q)*s*.5,sy+s*.3+Math.sin(q)*s*.5);}ctx.stroke();ctx.fillStyle='#C8553D';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.3,s*.08,0,7);ctx.fill();break;}
    case '^':R('#6A6F78',0,.6,1.02,.42);R('#8A8F99',.1,.1,.4,.3);R('#5A5F68',.55,.35,.35,.2);break;
    case 'z':R('#0E0C12',0,.15,1.02,.85);R('#3A3F48',0,0,1.02,.15);break;
    case 'I':R('#A3A88F',0,0,1.02,1.02);R('#6A6F78',.3,.05,.4,.9);R('#8A8F99',.34,.05,.12,.9);R('#4A4F58',.26,.85,.48,.12);break;
    case 'a':if((x*5+y*3)%7===0)R('#8E9478',.3,.4,.15,.08);break;
    case 'p':R('#7A7F89',0,0,1.02,.04);R('#7A7F89',0,0,.04,1.02);if((x+y)%3===0){R('#B5BAC4',.12,.12,.06,.06);R('#B5BAC4',.82,.82,.06,.06);}break;
    case 'M':R('#4A4F58',0,.7,1.02,.32);R('#B08D3A',0,.25,1.02,.1);R('#8A6D2A',.3,.1,.1,.6);if((x+y)%2)R('#DDD',.62,.05,.06,.06);break;
    case '@':{const rot=(M.name==='roofs'?(G.flags.roofState||0)*0.4:time*.6);ctx.save();ctx.translate(sx+s*.5,sy+s*.5);ctx.rotate(rot);ctx.fillStyle='#C9A227';for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.fillRect(-s*.07,-s*.48,s*.14,s*.18);}ctx.beginPath();ctx.arc(0,0,s*.34,0,7);ctx.fill();ctx.fillStyle='#5A4A2A';ctx.beginPath();ctx.arc(0,0,s*.12,0,7);ctx.fill();ctx.restore();break;}
    case '*':R('#F4F8FB',((x*7+y*3)%5)/6,.3,.4,.12);break;
    case '+':R('#6E737D',0,.1,1.02,.8);for(let i=0;i<4;i++)R('#9AA0AA',0,.18+i*.2,1.02,.04);break;
    case 'f':if(G.lost.includes('土')){for(let i=0;i<3;i++)R('#6E5236',0,.2+i*.3,1.02,.06);R('#A08A5A',.3,.1,.05,.12);}else{ctx.fillStyle='#7CC26B';ctx.fillRect(sx,sy,s+1,s+1);for(let i=0;i<3;i++){R('#5A3A1C',0,.25+i*.3,1.02,.05);R('#3E9A4A',.15+i*.3,.05+i*.3,.1,.2);R('#E0C040',.18+i*.3,.02+i*.3,.05,.06);}}break;
    case 'S':if((x*5+y*7)%9===0)R('#C8D6E2',.3,.5,.2,.06);if(G.lost.includes('氷')&&(x*3+y*5)%6===0){R('#FFFFFF',.4,.2,.06,.06);R('#FFFFFF',.7,.6,.05,.05);}break;
    case '凍':R('#8FC7E8',.1,0,.8,1.02);R('#DDF2FF',.25,0,.12,1.02);R('#DDF2FF',.6,0,.08,1.02);break;
    case '弁':{const on=G.flags['valve_'+x+'_'+y];R('#5A5F68',.2,.4,.6,.5);ctx.fillStyle=on?'#6FBF94':'#C8553D';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.35,s*.28,0,7);ctx.fill();R('#DDD',.46,.1,.08,.5);break;}
    case '鏡':{const on=G.flags['mir_'+x+'_'+y];R('#8A8F99',.25,.1,.5,.8);ctx.fillStyle=on?'#FFF6C8':'#9FC7E0';ctx.fillRect(sx+s*.32,sy+s*.16,s*.36,s*.5);if(on){ctx.fillStyle='rgba(255,246,200,.5)';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.4,s*.45,0,7);ctx.fill();}break;}
    case '碑':{R('#8A8F99',.2,.1,.6,.85);R('#6A6F78',.2,.8,.6,.15);const sy2=tabSym(x,y);ctx.fillStyle='#223';ctx.font='bold '+Math.round(s*.4)+'px sans-serif';ctx.textAlign='center';ctx.fillText(sy2,sx+s*.5,sy+s*.55);ctx.textAlign='left';break;}
    case '鐘':R('#6B4222',.15,.1,.08,.85);R('#6B4222',.77,.1,.08,.85);R('#6B4222',.1,.08,.8,.08);ctx.fillStyle='#C9A227';ctx.beginPath();ctx.moveTo(sx+s*.3,sy+s*.65);ctx.quadraticCurveTo(sx+s*.5,sy+s*.1,sx+s*.7,sy+s*.65);ctx.fill();break;
    case '潮':if(G.flags.swampNight){ctx.fillStyle='#5F8A58';ctx.fillRect(sx,sy,s+1,s+1);R('#3F7FA8',.1,.2,.3,.15);R('#3F7FA8',.55,.6,.35,.15);}else{const o=Math.sin(time*2+x)*s*.06;R('#BFE3F7',.15,.4+o/s,.3,.04);R('#BFE3F7',.55,.7-o/s,.3,.04);}break;
    case 'y':if((x*5+y*3)%7===0)R('#F4F1EA',.3,.5,.1,.08);if((x*3+y*7)%11===0)R('#E88FB0',.6,.3,.08,.08);break;
    case 'P':R('#6B4A2B',.42,.6,.16,.35);ctx.fillStyle='#F2A7C3';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.42,s*.44,0,7);ctx.fill();ctx.fillStyle='#FFD1E0';ctx.beginPath();ctx.arc(sx+s*.38,sy+s*.32,s*.16,0,7);ctx.fill();R('#FFFFFF',.62,.5,.07,.07);break;
    case 'J':for(let i=0;i<3;i++)R('#2E3746',0,i*.33+.28,1.02,.06);R('#56627A',0,0,1.02,.06);break;
    case 'g':case 'm':R('#8A5F33',0,.3,1.02,.04);R('#8A5F33',0,.7,1.02,.04);if(t==='m'){ctx.fillStyle='#5A3A1C';ctx.beginPath();ctx.arc(sx+s*.5,sy+s*.5,s*.22,0,7);ctx.fill();R('#F4F1EA',-.3,.35,1.6,.08);}break;
    case 'V':for(let i=0;i<3;i++){R('#4E8A3C',.12+i*.3,0,.14,1.02);R('#3E7430',.12+i*.3,.3+i*.15,.14,.04);}break;
    case 's':R('#8B5A2B',.05,.45,.9,.45);R((x%2)?'#C8553D':'#3D6FB6',0,.1,1.02,.2);R('#F4F1EA',.2,.1,.15,.2);R('#F4F1EA',.6,.1,.15,.2);R('#FFD27A',.2,.5,.2,.15);R('#E07A5F',.55,.5,.2,.15);break;
  }
}
function drawPerson(cx,cy,o){
  const s=TS*(o.small?.8:1);const x=cx-s/2,y=cy-s*.62;
  ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(cx,cy+s*.36,s*.28,s*.1,0,0,7);ctx.fill();
  ctx.fillStyle=o.col;ctx.fillRect(x+s*.25,y+s*.5,s*.5,s*.42);
  if(o.cape){ctx.fillStyle=o.cape;if(o.dir===3)ctx.fillRect(x+s*.22,y+s*.5,s*.56,s*.4);else{ctx.fillRect(x+s*.2,y+s*.5,s*.07,s*.38);ctx.fillRect(x+s*.73,y+s*.5,s*.07,s*.38);}}
  ctx.fillStyle='#F2C9A0';ctx.fillRect(x+s*.28,y+s*.15,s*.44,s*.38);
  ctx.fillStyle=o.hair;
  if(o.hood){ctx.fillRect(x+s*.22,y+s*.06,s*.56,s*.14);ctx.fillRect(x+s*.22,y+s*.06,s*.1,s*.46);ctx.fillRect(x+s*.68,y+s*.06,s*.1,s*.46);}
  if(o.dir===3){ctx.fillRect(x+s*.26,y+s*.12,s*.48,s*.4);}
  else{ctx.fillRect(x+s*.26,y+s*.1,s*.48,s*.14);
    const ey=y+s*.32,ew=s*.07,eh=s*.09;ctx.fillStyle='#1B1B1B';
    if(o.dir===0){ctx.fillRect(x+s*.36,ey,ew,eh);ctx.fillRect(x+s*.57,ey,ew,eh);}
    else if(o.dir===1){ctx.fillStyle=o.hair;ctx.fillRect(x+s*.6,y+s*.1,s*.14,s*.3);ctx.fillStyle='#1B1B1B';ctx.fillRect(x+s*.33,ey,ew,eh);}
    else{ctx.fillStyle=o.hair;ctx.fillRect(x+s*.26,y+s*.1,s*.14,s*.3);ctx.fillStyle='#1B1B1B';ctx.fillRect(x+s*.6,ey,ew,eh);}
  }
  if(o.long&&o.dir!==3){ctx.fillStyle=o.hair;ctx.fillRect(x+s*.22,y+s*.2,s*.08,s*.35);ctx.fillRect(x+s*.7,y+s*.2,s*.08,s*.35);}
  if(o.crown){ctx.fillStyle='#F2C230';ctx.fillRect(x+s*.3,y,s*.4,s*.1);ctx.fillRect(x+s*.3,y-s*.06,s*.08,s*.08);ctx.fillRect(x+s*.46,y-s*.08,s*.08,s*.1);ctx.fillRect(x+s*.62,y-s*.06,s*.08,s*.08);}
  if(o.sword){ctx.fillStyle='#D8DEE9';if(o.dir===1)ctx.fillRect(x+s*.08,y+s*.55,s*.16,s*.06);else if(o.dir===2)ctx.fillRect(x+s*.76,y+s*.55,s*.16,s*.06);else ctx.fillRect(x+s*.78,y+s*.35,s*.06,s*.4);
    ctx.fillStyle='#FF7A4D';ctx.globalAlpha=.6+.4*Math.sin(perf*6);ctx.fillRect(o.dir===1?x+s*.06:x+s*.78,o.dir===1||o.dir===2?y+s*.53:y+s*.32,s*.06,s*.06);ctx.globalAlpha=1;}
}
function drawBear(cx,cy){const s=TS;ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(cx,cy+s*.45,s*.8,s*.18,0,0,7);ctx.fill();
  ctx.fillStyle='#6B4226';ctx.beginPath();ctx.ellipse(cx,cy+s*.1,s*.78,s*.5,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(cx-s*.45,cy-s*.25,s*.32,0,7);ctx.fill();
  ctx.beginPath();ctx.arc(cx-s*.68,cy-s*.5,s*.12,0,7);ctx.arc(cx-s*.25,cy-s*.52,s*.12,0,7);ctx.fill();
  ctx.fillStyle='#C9A27A';ctx.beginPath();ctx.ellipse(cx-s*.52,cy-s*.15,s*.13,s*.09,0,0,7);ctx.fill();ctx.fillStyle='#1B1B1B';ctx.fillRect(cx-s*.58,cy-s*.3,s*.08,2);ctx.fillRect(cx-s*.38,cy-s*.3,s*.08,2);}
function drawZzz(cx,cy){const t=(perf%2)/2;ctx.font='12px '+FONT();ctx.textAlign='left';ctx.globalAlpha=1-t;ctx.fillStyle='#FFFFFF';ctx.strokeStyle='#000';ctx.lineWidth=3;const x=cx+TS*.2,y=cy-TS*.7-t*10;ctx.strokeText('Z z',x,y);ctx.fillText('Z z',x,y);ctx.globalAlpha=1;}
function drawSign(cx,cy){const s=TS;ctx.fillStyle='#6B4A2B';ctx.fillRect(cx-s*.05,cy-s*.1,s*.1,s*.45);ctx.fillStyle='#C89B5E';ctx.fillRect(cx-s*.35,cy-s*.4,s*.7,s*.35);ctx.fillStyle='#6B4A2B';ctx.fillRect(cx-s*.25,cy-s*.3,s*.5,s*.04);ctx.fillRect(cx-s*.25,cy-s*.2,s*.4,s*.04);}
function drawFoe(f,cx,cy){
  const d=FOES[f.k],s=TS;const b=Math.sin(perf*5+cx)*s*.04;
  ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(cx,cy+s*.3,s*.3,s*.1,0,0,7);ctx.fill();
  const k=d.svg;
  if(k==='rat'){ctx.fillStyle=f.k==='mouse'?'#7A6F66':'#8A8A8A';ctx.beginPath();ctx.ellipse(cx,cy+b,s*.3,s*.2,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(cx-s*.2,cy-s*.15+b,s*.09,0,7);ctx.arc(cx+s*.2,cy-s*.15+b,s*.09,0,7);ctx.fill();ctx.fillStyle='#000';ctx.fillRect(cx-s*.1,cy-s*.05+b,3,3);ctx.fillRect(cx+s*.07,cy-s*.05+b,3,3);}
  else if(k==='beetle'){ctx.fillStyle='#5E5A55';ctx.beginPath();ctx.ellipse(cx,cy+b,s*.42,s*.3,0,0,7);ctx.fill();ctx.fillStyle='#FF7A2F';ctx.fillRect(cx-s*.15,cy-s*.1+b,4,4);ctx.fillRect(cx+s*.1,cy-s*.1+b,4,4);}
  else if(k==='weed'){ctx.fillStyle='#4FB05A';ctx.beginPath();ctx.arc(cx,cy+b,s*.26,0,7);ctx.fill();ctx.fillStyle='#8EDC7A';ctx.fillRect(cx-s*.05,cy-s*.42+b,s*.1,s*.2);ctx.fillStyle='#000';ctx.fillRect(cx-s*.1,cy-s*.05+b,3,3);ctx.fillRect(cx+s*.07,cy-s*.05+b,3,3);}
  else if(k==='hare'){ctx.fillStyle='#F4F1EA';ctx.beginPath();ctx.ellipse(cx,cy+b,s*.26,s*.22,0,0,7);ctx.fill();ctx.fillRect(cx-s*.14,cy-s*.45+b,s*.08,s*.25);ctx.fillRect(cx+s*.06,cy-s*.45+b,s*.08,s*.25);ctx.fillStyle='#E0A526';ctx.fillRect(cx-s*.02,cy-s*.35+b,s*.05,s*.15);ctx.fillStyle='#C0392B';ctx.fillRect(cx-s*.1,cy-s*.04+b,3,3);ctx.fillRect(cx+s*.07,cy-s*.04+b,3,3);}
  else if(k==='boar'){ctx.fillStyle='#7A4E2D';ctx.beginPath();ctx.ellipse(cx,cy+b,s*.52,s*.36,0,0,7);ctx.fill();ctx.fillStyle='#F4F1EA';ctx.beginPath();ctx.moveTo(cx-s*.3,cy+b);ctx.lineTo(cx-s*.45,cy-s*.2+b);ctx.lineTo(cx-s*.22,cy-s*.05+b);ctx.fill();ctx.beginPath();ctx.moveTo(cx+s*.3,cy+b);ctx.lineTo(cx+s*.45,cy-s*.2+b);ctx.lineTo(cx+s*.22,cy-s*.05+b);ctx.fill();ctx.fillStyle='#000';ctx.fillRect(cx-s*.14,cy-s*.12+b,4,4);ctx.fillRect(cx+s*.1,cy-s*.12+b,4,4);}
  else if(k==='crab'||k==='crabking'){const z=k==='crabking'?1.5:1;ctx.fillStyle=k==='crabking'?'#B03A2E':'#D2553D';ctx.beginPath();ctx.ellipse(cx,cy+b,s*.34*z,s*.22*z,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(cx-s*.36*z,cy-s*.12*z+b,s*.1*z,0,7);ctx.arc(cx+s*.36*z,cy-s*.12*z+b,s*.1*z,0,7);ctx.fill();ctx.fillStyle='#FFF';ctx.fillRect(cx-s*.1,cy-s*.12*z+b,3,3);ctx.fillRect(cx+s*.07,cy-s*.12*z+b,3,3);}
  else if(k==='kappa'){ctx.fillStyle='#5DA05A';ctx.beginPath();ctx.ellipse(cx,cy+s*.08+b,s*.24,s*.2,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(cx,cy-s*.2+b,s*.18,0,7);ctx.fill();ctx.fillStyle='#DDEFF7';ctx.beginPath();ctx.ellipse(cx,cy-s*.34+b,s*.14,s*.05,0,0,7);ctx.fill();ctx.fillStyle='#111';ctx.fillRect(cx-s*.08,cy-s*.22+b,3,3);ctx.fillRect(cx+s*.05,cy-s*.22+b,3,3);ctx.fillStyle='#F2C230';ctx.fillRect(cx-s*.04,cy-s*.14+b,s*.08,s*.05);}
  else if(k==='tanuki'){ctx.fillStyle='#8A6A48';ctx.beginPath();ctx.ellipse(cx,cy+s*.05+b,s*.28,s*.24,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(cx,cy-s*.22+b,s*.18,0,7);ctx.fill();ctx.fillStyle='#E8D9B5';ctx.beginPath();ctx.ellipse(cx,cy+s*.1+b,s*.15,s*.13,0,0,7);ctx.fill();ctx.fillStyle='#3A2A1C';ctx.fillRect(cx-s*.12,cy-s*.26+b,s*.09,s*.07);ctx.fillRect(cx+s*.03,cy-s*.26+b,s*.09,s*.07);ctx.fillStyle='#5DA05A';ctx.fillRect(cx-s*.05,cy-s*.42+b,s*.1,s*.05);}
  else if(k==='kitsunebi'){ctx.fillStyle='rgba(127,200,255,.85)';ctx.beginPath();ctx.moveTo(cx,cy-s*.42+b);ctx.quadraticCurveTo(cx+s*.3,cy-s*.05+b,cx,cy+s*.2+b);ctx.quadraticCurveTo(cx-s*.3,cy-s*.05+b,cx,cy-s*.42+b);ctx.fill();ctx.fillStyle='#E6F6FF';ctx.beginPath();ctx.arc(cx,cy+b,s*.1,0,7);ctx.fill();}
  else if(k==='fox'){ctx.fillStyle='#E8A04A';ctx.beginPath();ctx.ellipse(cx,cy+b,s*.4,s*.28,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(cx-s*.25,cy-s*.28+b,s*.2,0,7);ctx.fill();ctx.fillStyle='#F4E3C0';ctx.beginPath();ctx.ellipse(cx+s*.42,cy-s*.2+b,s*.14,s*.3,.5,0,7);ctx.fill();}
  else if(k==='itachi'){ctx.fillStyle='#C9B38A';ctx.beginPath();ctx.ellipse(cx,cy+b,s*.3,s*.16,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(cx+s*.26,cy-s*.12+b,s*.13,0,7);ctx.fill();ctx.strokeStyle='#C9B38A';ctx.lineWidth=s*.08;ctx.beginPath();ctx.moveTo(cx-s*.28,cy+b);ctx.quadraticCurveTo(cx-s*.5,cy-s*.3+b,cx-s*.3,cy-s*.42+b);ctx.stroke();}
  else if(k==='karasu'){ctx.fillStyle='#3D6FB6';ctx.fillRect(cx-s*.14,cy-s*.1+b,s*.28,s*.32);ctx.fillStyle='#2B2B3A';ctx.beginPath();ctx.arc(cx,cy-s*.22+b,s*.14,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(cx-s*.14,cy-s*.05+b);ctx.lineTo(cx-s*.42,cy-s*.2+b);ctx.lineTo(cx-s*.14,cy+s*.15+b);ctx.fill();ctx.beginPath();ctx.moveTo(cx+s*.14,cy-s*.05+b);ctx.lineTo(cx+s*.42,cy-s*.2+b);ctx.lineTo(cx+s*.14,cy+s*.15+b);ctx.fill();ctx.fillStyle='#E0A526';ctx.fillRect(cx+s*.08,cy-s*.24+b,s*.14,s*.05);}
  else if(k==='gearbot'){ctx.fillStyle='#8A7A5A';ctx.fillRect(cx-s*.25,cy-s*.3+b,s*.5,s*.5);ctx.fillStyle='#C9A227';ctx.beginPath();ctx.arc(cx,cy-s*.05+b,s*.14,0,7);ctx.fill();ctx.fillStyle='#FF7A4D';ctx.fillRect(cx-s*.14,cy-s*.26+b,4,4);ctx.fillRect(cx+s*.08,cy-s*.26+b,4,4);}
  else if(k==='steamrat'){ctx.fillStyle='#7A6F66';ctx.beginPath();ctx.ellipse(cx,cy+b,s*.3,s*.2,0,0,7);ctx.fill();ctx.fillStyle='#C9A227';ctx.fillRect(cx-s*.12,cy-s*.26+b,s*.24,s*.1);ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.arc(cx,cy-s*.4+b,s*.08,0,7);ctx.fill();}
  else if(k==='sludge'){ctx.fillStyle='rgba(143,224,176,.85)';ctx.beginPath();ctx.ellipse(cx,cy+s*.05+b,s*.34,s*.26,0,Math.PI,0);ctx.fill();ctx.fillRect(cx-s*.34,cy+s*.05+b,s*.68,s*.12);ctx.fillStyle='#123';ctx.fillRect(cx-s*.12,cy-s*.08+b,4,4);ctx.fillRect(cx+s*.08,cy-s*.08+b,4,4);}
  else if(k==='kodama'){ctx.fillStyle='#9AA79A';ctx.beginPath();ctx.moveTo(cx,cy-s*.42+b);ctx.quadraticCurveTo(cx+s*.34,cy+b,cx+s*.2,cy+s*.25+b);ctx.lineTo(cx-s*.2,cy+s*.25+b);ctx.quadraticCurveTo(cx-s*.34,cy+b,cx,cy-s*.42+b);ctx.fill();ctx.fillStyle='#222';ctx.fillRect(cx-s*.1,cy-s*.08+b,3,3);ctx.fillRect(cx+s*.06,cy-s*.08+b,3,3);}
  else if(k==='ruinbot'){ctx.fillStyle='#9A9FA8';ctx.fillRect(cx-s*.24,cy-s*.2+b,s*.48,s*.44);ctx.fillStyle='#8A8F99';ctx.fillRect(cx-s*.16,cy-s*.4+b,s*.32,s*.2);ctx.fillStyle='#8FE0B0';ctx.fillRect(cx-s*.1,cy-s*.33+b,s*.2,s*.05);}
  else if(k==='kujira'){ctx.fillStyle='#DDE6EE';ctx.beginPath();ctx.ellipse(cx,cy+b,s*.6,s*.34,0,0,7);ctx.fill();ctx.fillStyle='#223';ctx.fillRect(cx-s*.35,cy-s*.08+b,4,4);}
  else if(k==='mukade'){ctx.fillStyle='#8E2C3E';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(cx-s*.4+i*s*.2,cy+Math.sin(i+perf*4)*s*.05+b,s*.13,0,7);ctx.fill();}}
  else if(k==='jelly'){ctx.fillStyle='#C7B3E6';ctx.beginPath();ctx.arc(cx,cy-s*.05+b,s*.25,Math.PI,0);ctx.fill();ctx.strokeStyle='#B19CD9';ctx.lineWidth=2;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(cx+i*s*.09,cy-s*.05+b);ctx.lineTo(cx+i*s*.1,cy+s*.22+b);ctx.stroke();}}
  else if(k==='gama'){ctx.fillStyle='#5C9A4C';ctx.beginPath();ctx.ellipse(cx,cy+b,s*.6,s*.39,0,0,7);ctx.fill();ctx.beginPath();ctx.arc(cx-s*.3,cy-s*.3+b,s*.14,0,7);ctx.arc(cx+s*.3,cy-s*.3+b,s*.14,0,7);ctx.fill();ctx.fillStyle='#FFF';ctx.beginPath();ctx.arc(cx-s*.3,cy-s*.32+b,s*.08,0,7);ctx.arc(cx+s*.3,cy-s*.32+b,s*.08,0,7);ctx.fill();ctx.fillStyle='#F2C230';ctx.beginPath();ctx.moveTo(cx-s*.15,cy-s*.4+b);ctx.lineTo(cx,cy-s*.65+b);ctx.lineTo(cx+s*.15,cy-s*.4+b);ctx.fill();}
  const diff=d.lv-G.L;const col=diff>=3?'#FF5A4F':diff<=-3?'#9AA3AD':'#FFFFFF';
  const label=(d.short||d.name)+' Lv'+d.lv;
  ctx.font='12px '+FONT();ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#000';ctx.strokeText(label,cx,cy-s*.55);ctx.fillStyle=col;ctx.fillText(label,cx,cy-s*.55);
}
let perf=0,camX=0,camY=0;
function drawLights(){
  const dark=M.d.night?.62:M.d.dim?.38:0;if(!dark)return;
  const w=cv.width,h=cv.height;sctx.setTransform(1,0,0,1,0,0);sctx.globalCompositeOperation='source-over';
  sctx.clearRect(0,0,w,h);sctx.fillStyle='rgba(8,12,35,'+dark+')';sctx.fillRect(0,0,w,h);
  sctx.globalCompositeOperation='destination-out';
  const light=(x,y,r)=>{const px=(x-camX)*TS*DPR,py=(y-camY)*TS*DPR,rr=r*TS*DPR;const g=sctx.createRadialGradient(px,py,0,px,py,rr);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');sctx.fillStyle=g;sctx.beginPath();sctx.arc(px,py,rr,0,7);sctx.fill();};
  light(G.px,G.py,M.d.night?1.8:2.6);
  const x0=Math.max(0,Math.floor(camX)-2),y0=Math.max(0,Math.floor(camY)-2);
  for(let y=y0;y<Math.min(M.H,y0+VH+5);y++)for(let x=x0;x<Math.min(M.W,x0+Math.ceil(VW)+5);x++){
    const c=M.t[y][x];
    if(c==='L'&&fireOn())light(x+.5,y+.3,2.6);
    else if(c==='s'&&fireOn())light(x+.5,y+.5,1.4);
    else if((c==='O'||c==='j'||c==='Y'||c==='N'))light(x+.5,y+.4,2.4);
    else if(c==='H'&&M.d.night&&(x+y)%2===0&&fireOn())light(x+.5,y+.5,.9);
  }
  if(flame>0)light(G.px,G.py-.3,2.2);
  ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(shade,0,0);ctx.setTransform(DPR,0,0,DPR,0,0);
}
function draw(){
  const w=cv.width/DPR;
  camX=Math.max(0,Math.min(M.W-VW,G.px-VW/2));camY=Math.max(0,Math.min(M.H-VH,G.py-VH/2));
  if(M.W<VW)camX=(M.W-VW)/2;if(M.H<VH)camY=(M.H-VH)/2;
  ctx.fillStyle='#000';ctx.fillRect(0,0,w,TS*VH);
  const x0=Math.floor(camX),y0=Math.floor(camY);
  for(let y=Math.max(0,y0);y<=Math.min(M.H-1,y0+VH+1);y++)for(let x=Math.max(0,x0);x<=Math.min(M.W-1,x0+Math.ceil(VW)+1);x++)drawTile(M.t[y][x],Math.floor((x-camX)*TS),Math.floor((y-camY)*TS),x,y,perf);
  const sc=(x,y)=>[(x-camX)*TS,(y-camY)*TS];
  chestList().forEach(ch=>{if(G.chests[ch.flag])return;const [cx,cy]=sc(ch.x,ch.y);ctx.fillStyle=ch.item?'#6B2E5E':'#8B5A2B';ctx.fillRect(cx-TS*.3,cy-TS*.2,TS*.6,TS*.42);ctx.fillStyle='#F2C230';ctx.fillRect(cx-TS*.3,cy-TS*.05,TS*.6,TS*.06);});
  const ents=[];
  visibleNpcs().forEach(n=>ents.push({y:n.y,f:()=>{const [cx,cy]=sc(n.x,n.y);if(n.sign)drawSign(cx,cy);else if(n.bear)drawBear(cx,cy);else drawPerson(cx,cy,n);if(n.sleep)drawZzz(cx,cy);}}));
  M.foes.forEach(f=>{if(f.alive&&(!f.show||f.show()))ents.push({y:f.y,f:()=>{const [cx,cy]=sc(f.x,f.y);drawFoe(f,cx,cy);}});});
  const fol=G.follow||(G.party[1]||null);
  if(fol&&trail.length>14){const p=trail[trail.length-14];const c=CHARS[fol];ents.push({y:p.y,f:()=>{const [cx,cy]=sc(p.x,p.y);drawPerson(cx,cy,{col:c.col,hair:c.hair,cape:c.cape,dir:p.d,long:fol==='lucia',hood:fol==='lucia'&&!G.flags.festivalEnd?false:false});}});}
  ents.push({y:G.py,f:()=>{const [cx,cy]=sc(G.px,G.py);if(inv>0&&!scriptBusy&&Math.floor(perf*10)%2)return;const hid=G.party[0]||'leon',c=CHARS[hid];drawPerson(cx,cy,{col:c.col,hair:c.hair,cape:c.cape,dir:G.dir,sword:hid==='leon',long:!!c.long});}});
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
  drawLights();
  if(M.d.puzzle){
    const [px,py]=sc(G.px,G.py);
    if(flame>0){const f=Math.sin(perf*14)*2;ctx.fillStyle='#FF7A2F';ctx.beginPath();ctx.moveTo(px-5,py-TS*.95);ctx.lineTo(px,py-TS*1.35+f);ctx.lineTo(px+5,py-TS*.95);ctx.fill();}
    const n=flame>FL/2?2:flame>0?1:0;
    ctx.font='12px '+FONT();ctx.textAlign='left';ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(8,8,112,24);ctx.strokeStyle='#FFF';ctx.lineWidth=2;ctx.strokeRect(8,8,112,24);
    ctx.fillStyle='#FFF';ctx.fillText('剣の火',16,25);
    for(let i=0;i<2;i++){ctx.fillStyle=i<n?'#FF7A2F':'#444';ctx.beginPath();ctx.moveTo(72+i*22,14);ctx.lineTo(80+i*22,20);ctx.lineTo(72+i*22,26);ctx.lineTo(64+i*22,20);ctx.fill();}
  }
  if(joy&&joy.moved){ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(joy.ox,joy.oy,34,0,7);ctx.stroke();ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.arc(joy.ox+joy.dx*34,joy.oy+joy.dy*34,14,0,7);ctx.fill();}
  if(toastT&&toastT.text){ctx.font='14px '+FONT();ctx.textAlign='center';const tw=ctx.measureText(toastT.text).width+24;ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(w/2-tw/2,TS*VH-52,tw,30);ctx.strokeStyle='#FFF';ctx.lineWidth=2;ctx.strokeRect(w/2-tw/2,TS*VH-52,tw,30);ctx.fillStyle='#FFD34D';ctx.fillText(toastT.text,w/2,TS*VH-32);}
  if(fx)drawFx(w,TS*VH);
}
/* 演出 */
let fx=null;
function drawFx(w,h){
  const t=fx.t;
  if(fx.type==='fade'){const a=Math.min(1,t/.5);ctx.fillStyle='rgba(0,0,0,'+a+')';ctx.fillRect(0,0,w,h);if(t>.4){ctx.globalAlpha=Math.min(1,(t-.4)/.5);ctx.fillStyle='#FFF';ctx.font='16px '+FONT();ctx.textAlign='center';wrapText(fx.text,w/2,h/2,w-40,24);ctx.globalAlpha=1;}}
  if(fx.type==='vision'){const a=Math.min(1,t/.6)*(t>2.6?Math.max(0,1-(t-2.6)/.5):1);ctx.globalAlpha=a;ctx.fillStyle='#0B1026';ctx.fillRect(0,0,w,h);
    ctx.fillStyle='#E8EEF5';for(let i=0;i<30;i++){ctx.fillRect((i*97)%w,(i*53)%(h*.5),2,2);}
    ctx.fillStyle='#1B2238';ctx.beginPath();ctx.ellipse(w/2,h*.95,w*.8,h*.45,0,Math.PI,0);ctx.fill();
    const fx0=w/2,fy=h*.5;ctx.fillStyle='#3A4260';ctx.fillRect(fx0-8,fy-10,16,36);ctx.fillStyle='#C9D1E0';ctx.fillRect(fx0-7,fy-24,14,14);ctx.fillRect(fx0-10,fy-28,20,8);ctx.fillStyle='#8A93A8';ctx.fillRect(fx0+10,fy-12,3,40);
    ctx.fillStyle='#FFF';ctx.font='13px '+FONT();ctx.textAlign='center';ctx.fillText('遠くの 丘の上に、銀の髪の 騎士が 立っている――',w/2,h*.2);ctx.globalAlpha=1;}
  if(fx.type==='title'){const a=Math.min(1,t/.8)*(t>3.2?Math.max(0,1-(t-3.2)/.6):1);ctx.globalAlpha=a;ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(0,0,w,h);ctx.fillStyle='#FFD34D';ctx.font='40px '+FONT();ctx.textAlign='center';ctx.fillText('七つの灯',w/2,h/2);ctx.fillStyle='#FFF';ctx.font='14px '+FONT();ctx.fillText('― Seven Lights ―',w/2,h/2+34);ctx.globalAlpha=1;}
}
function wrapText(text,x,y,maxW,lh){const lines=[];let cur='';for(const ch of text){if(ctx.measureText(cur+ch).width>maxW){lines.push(cur);cur=ch;}else cur+=ch;}lines.push(cur);const y0=y-(lines.length-1)*lh/2;lines.forEach((l,i)=>ctx.fillText(l,x,y0+i*lh));}
function playFx(type,text,dur){return new Promise(res=>{fx={type,text,t:0,dur,res};});}

/* ===== 入力 ===== */
let joy=null;const keys={};
cv.addEventListener('pointerdown',e=>{if(mode!=='field')return;const r=cv.getBoundingClientRect();joy={ox:e.clientX-r.left,oy:e.clientY-r.top,dx:0,dy:0,t:performance.now(),moved:false};try{cv.setPointerCapture(e.pointerId);}catch(_){}$('hint').hidden=true;e.preventDefault();});
cv.addEventListener('pointermove',e=>{if(!joy)return;const r=cv.getBoundingClientRect();let dx=(e.clientX-r.left-joy.ox)/34,dy=(e.clientY-r.top-joy.oy)/34;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}if(l>.25)joy.moved=true;joy.dx=dx;joy.dy=dy;});
cv.addEventListener('pointerup',()=>{if(joy&&!joy.moved&&performance.now()-joy.t<250)interact();joy=null;});
cv.addEventListener('pointercancel',()=>{joy=null;});
window.addEventListener('keydown',e=>{keys[e.key]=true;if(mode==='field'&&(e.key==='Enter'||e.key===' '||e.key==='z')){e.preventDefault();interact();}});
window.addEventListener('keyup',e=>{keys[e.key]=false;});
/* 十字キー */
let pad=null;const dpad=$('dpad');
function padAt(e){const r=dpad.getBoundingClientRect();const x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
  if(Math.hypot(x,y)<10){pad=null;}else{const a=Math.round(Math.atan2(y,x)/(Math.PI/4))*(Math.PI/4);pad={dx:Math.round(Math.cos(a)*100)/100,dy:Math.round(Math.sin(a)*100)/100};}
  dpad.querySelectorAll('.ar').forEach(s=>{const d=s.dataset.d;s.classList.toggle('on',!!pad&&((d==='u'&&pad.dy<-.3)||(d==='d'&&pad.dy>.3)||(d==='l'&&pad.dx<-.3)||(d==='r'&&pad.dx>.3)));});}
function padEnd(){pad=null;dpad.querySelectorAll('.ar').forEach(s=>s.classList.remove('on'));}
dpad.addEventListener('pointerdown',e=>{e.preventDefault();try{dpad.setPointerCapture(e.pointerId);}catch(_){}$('hint').hidden=true;padAt(e);});
dpad.addEventListener('pointermove',e=>{if(pad!==undefined&&e.buttons!==0||e.pointerType==='touch')padAt(e);});
dpad.addEventListener('pointerup',padEnd);dpad.addEventListener('pointercancel',padEnd);dpad.addEventListener('lostpointercapture',padEnd);

/* ===== 会話 ===== */
let mode='field',dialog=null,inv=0,menuOpen=false,scriptBusy=false,toastT=null,flame=0,safe={x:0,y:0},insideTrig=new Set(),pushT=0;
const FL=4.2;
function toast(t){toastT={text:t,t:2.2};}
function faceDir(dx,dy){return Math.abs(dx)>Math.abs(dy)?(dx<0?1:2):(dy<0?3:0);}
let casualNow=false,pendingShop=null,shopKind=null,shopTab='buy',sellArm=null;
const goldFor=(d)=>Math.round((8+d.lv*7)*(d.boss?4:1)*(0.8+Math.random()*0.4));
const sellPrice=it=>SELL_BASE[Math.max(0,RAR.findIndex(r=>r.n===it.rar.n))]+((it.atk||0)+(it.def||0))*2;
function sayAsync(lines,who){return new Promise(res=>{dialog={lines:lines.slice(),who,i:0,res,casual:casualNow};renderMsg();});}
let choosing=null;
function askChoice(who,q,opts){return new Promise(res=>{choosing=true;const m=$('fmsg');
  m.innerHTML=(who?'<div class="who">'+who+'</div>':'')+'<div>'+q+'</div><div class="choices">'+opts.map((o,i)=>'<button class="chbtn" data-i="'+i+'">▶ '+o+'</button>').join('')+'</div>';
  m.querySelectorAll('.chbtn').forEach(b=>b.onclick=e=>{e.stopPropagation();choosing=null;renderMsg();res(+b.dataset.i);});});}
function closeCasual(){if(!dialog||!dialog.casual)return;const r=dialog.res;dialog=null;renderMsg();r&&r('closed');}
function renderMsg(){
  const m=$('fmsg');if(choosing)return;
  if(dialog){m.innerHTML=(dialog.who?'<div class="who">'+dialog.who+'</div>':'')+'<div>'+dialog.lines[dialog.i]+'</div><div class="next">▼</div>';}
  else if(fx&&fx.type==='fade'){m.innerHTML='<div class="next">▼</div>';}
  else m.innerHTML='<div class="dim">'+idleText()+'</div>';
}
function idleText(){
  if(M.d.puzzle)return '火守の古炉。奥に 火の祭壇が ある。';
  if(G.map==='town')return G.flags.luciaWith?(G.flags.rinaBread&&G.flags.teller?'北東の すみの 見晴らし台へ 行こう。':'こむぎ亭の パン屋（左上の家の前）と、うらない師の 屋台（右）に 寄ろう。'):'祭りの 見回り中。広場の 噴水の そばに、見覚えのある 人影が……';
  if(G.map==='castle')return !G.flags.cookTalk?'厨房（左下の部屋）の 様子を 見に行こう。':!G.flags.cellarDone?'厨房の すみの 階段から 地下へ。':!G.flags.throneDone?'謁見の間（上の部屋）へ 向かおう。':'兵舎（右下の部屋）の ベッドで 休もう。';
  if(G.map==='cellar')return G.flags.cellarDone?'上り階段（左上）から 城へ 戻ろう。':'地下の まものを 追い払おう。';
  if(G.map==='port')return !G.party.includes('mizuha')?'水の 神殿（上の 大きな 建物）の 前に、水を 配る 神官が いる。':!G.flags.seaDone?'桟橋の 階段から 海の底へ。南東の 洞窟が 目印だ。':G.flags.ch1End?'船長カイトに 話しかけると、ヒノワへ 出航できる。':'海が 戻った！ 船長カイトに 話しかけてみよう。';
  if(G.map==='ship')return '舳先（甲板の いちばん 上）で 見張りを しよう。仲間とも 話せる。';
  if(G.map==='urahama')return !G.flags.kohakuJoin?'ひとりきりだ。村の 北、竹林の 先の 道場を 訪ねてみよう。':'北の 竹林の 道が、桜ノ津へ 続いている。';
  if(G.map==='hinowa')return '桜の 街道。道しるべ（中央）で 行き先を 確かめよう。北ほど 敵が 強い。';
  if(G.map==='jouki')return '蒸気の 裏通り。東は 雲海の 浮き島、北は 歯車墓場への 昇降機。';
  if(G.map==='dangai')return ['5_4','15_7','12_19'].every(k=>G.flags['mir_'+k])?'灯台の 光が 海を 照らした。浜の 南に 宝箱が 現れた！':'潮風の 断崖。どこかに 海の 宝が 眠っている という。';
  if(G.map==='shitsugen')return G.flags.swampNight?'夜の 湿原。':'きらめき湿原。南へは 潮に はばまれて 渡れない。';
  if(G.map==='mori')return STORY.tabletsOK()?'三つの 碑が そろった。南西の 宝箱へ。':'いにしえの 大森林。古い 碑が 眠っている。';
  if(G.map==='hakurei')return G.flags.hkMelt?'山頂の 宝を 目指そう。':'吹雪の 白嶺山脈。山頂に 宝が 眠るという。';
  if(G.map==='henkyo')return G.flags.earthDone?'畑に 緑が 戻った。':'北の 岩山の 洞窟に、地の祭壇が ある。';
  if(G.map==='dochi')return G.flags.earthDone?'地の祭壇に 土の 力が 満ちている。':'奥の 地の祭壇へ。';
  if(G.map==='hakusetsu')return G.flags.iceDone?'雪が また 降りはじめた。':'時の 止まった 雪山。山頂に 氷の祭壇が ある。';
  if(G.map==='haguruma')return G.flags.darkDone?'ギアリムに 夜が 戻った。':'奥の 闇の祭壇へ。';
  if(G.map==='arcanoa')return G.flags.gameClear?'世界に 色が 戻った。':'北の 巨木の 根元、「根の神殿」へ。光の 祭壇を 目指そう。';
  if(G.map==='roots')return G.flags.lightBack?'祭壇の 奥の 門へ。':'光の 祭壇は 神殿の 最奥。';
  if(G.map==='heart')return G.flags.gameClear?'――― おわり ―――':'ノアに 話しかけると、最後の 戦いが 始まる。';
  if(G.map==='gearim')return G.flags.ch3End?'南の 港の 飛行艇から、秘境 アルカノアへ 飛べる。':!G.flags.vegaCaught?'ヴェガを 追って、北の 屋根の 上へ。':'古代機関（中央の 建物）の 扉が 開く。記録庫へ。';
  if(G.map==='roofs')return 'いちばん 上に ヴェガが いる。';
  if(G.map==='archive')return G.flags.archDoor?'奥の 記録を 調べよう。':'記録庫の 奥を 目指そう。';
  if(G.map==='tenpu')return G.flags.nagiDone?'風が 戻った！':'ソラを 背負って 山頂へ。';
  if(G.map==='hidamari')return G.flags.oniDone?'【ルシア編】村は 守られた。':G.flags.luciaLight?'【ルシア編】村長に 話しかけよう。':'【ルシア編】うつむく 村の 人たちに、声を かけて まわろう。（'+['hv1','hv2','hv3'].filter(k=>G.flags['lit_'+k]).length+'/3）';
  if(G.map==='kazami'&&G.party[0]==='leon')return G.flags.soraCarried?'ソラを 背負って、北の 天風峰へ。':'大風車の そばに、ソラが 倒れている……！';
  if(G.map==='kazami')return !G.flags.itachiDone?'【ソラ編】村の子 フウの 話を 聞こう。':'【ソラ編】……風が、消えた。';
  if(G.map==='yamajinja')return !G.flags.mizuLog?'【ミズハ編】池の 小島から 出られない……。':!G.flags.namazuDone?'【ミズハ編】神主に 話を 聞こう。':'【ミズハ編】山道（下）を 下れば 桜ノ津。';
  if(G.map==='sakuranotsu'&&G.flags.ch2End)return '首飾りを 追って、空の 都へ。桟橋の 船大工に 話しかけよう。';
  if(G.map==='sakuranotsu')return !G.flags.foxDone?'【リナ編】団子屋の 親方の 頼み。北の 稲荷の森の 奥、お狐さまの 社へ。':'【リナ編】みんなを 待とう。';
  if(G.map==='seacave')return '奥の 水の祭壇を 目指そう。';
  if(G.map==='field'&&G.flags.waterGone&&!G.flags.seaDone)return '村の 東の 道から、港町ミナトベへ 向かおう。';
  if(G.map==='waterway')return '地下水路を 抜けて、城の 外へ。';
  if(G.map==='field'&&!G.party.includes('rina'))return '村の パン屋（こむぎ亭）の 前に、元気のない 娘が いる。';
  if(G.map==='field'&&!G.flags.bearMoved&&!(G.dg&&G.dg.boss))return '北の丘の「火守の古炉」の 入口を、大ぐまが ふさいでいる。';
  if(G.map==='field'&&!G.party.includes('sora'))return '村の 北、川に かかる 橋の 上で、誰かが 昼寝を している。';
  if(G.map==='field')return fireOn()?'火が 戻った！ 草原を 自由に 冒険しよう。':'草原の 北の 丘、「火守の古炉」を 目指そう。名前の色で まものの強さが わかる（赤＝格上・白＝同格・灰＝格下）。';
  return '';
}
function advance(){
  if(fx&&fx.type==='fade'&&fx.t>.8){fx.t=fx.dur;return;}
  if(!dialog)return;dialog.i++;if(dialog.i>=dialog.lines.length){const r=dialog.res;dialog=null;renderMsg();r&&r();}else renderMsg();
}
$('fmsg').addEventListener('click',()=>advance());

/* ===== イベント再生 ===== */
async function runScript(steps){
  if(!steps||!steps.length)return;
  const outer=scriptBusy;scriptBusy=true;joy=null;
  if(!outer)casualNow=steps.every(s=>s[0]==='say');
  try{for(const s of steps){const r=await doStep(s);if(r==='abort'||r==='closed')break;}}
  finally{if(!outer){scriptBusy=false;casualNow=false;if(M&&mode==='field')save();if(pendingShop){const k=pendingShop;pendingShop=null;shopKind=k;toggleMenu(true,'shop');}}renderMsg();renderTop();}
}
async function doStep(s){
  const k=s[0];
  switch(k){
    case 'say':return sayAsync(s[2],s[1]);
    case 'flag':G.flags[s[1]]=s[2];return;
    case 'join':ensureMember(s[1]);if(!G.party.includes(s[1]))G.party.push(s[1]);if(G.follow===s[1])G.follow=null;renderTop();return;
    case 'leave':G.party=G.party.filter(x=>x!==s[1]);renderTop();return;
    case 'follow':G.follow=s[1];trail=[];return;
    case 'warp':changeMap(s[1],s[2],s[3],s[4]);{const on=M.d.onEnter&&M.d.onEnter();if(on)for(const t of on){const r=await doStep(t);if(r==='abort')return 'abort';}}return;
    case 'fade':await playFx('fade',s[1],3.2);return;
    case 'vision':await playFx('vision','',3.1);return;
    case 'title':await playFx('title','',3.8);return;
    case 'lose':setTimeout(applyDusk,0);if(!G.lost.includes(s[1]))G.lost.push(s[1]);Object.values(WORLD).forEach(refreshWater);return;
    case 'regain':setTimeout(applyDusk,0);G.lost=G.lost.filter(x=>x!==s[1]);Object.values(WORLD).forEach(refreshWater);return;
    case 'battle':{const r=await startBattle({k:s[1],alive:true,scripted:true},s[2]);if(r!=='win'){if(s[3]==='loseOk')return;handleLose();return 'abort';}return;}
    case 'heal':fullHeal();renderTop();return;
    case 'hearth':setTile(s[1],s[2],s[3]?'j':'h');return;
    case 'wait':await sleep(s[1]);return;
    case 'bread':G.bread+=s[1];renderTop();return;
    case 'save':save();return;
    case 'shop':pendingShop=s[1];return;
    case 'choice':{const i=await askChoice(s[1],s[2],s[3]);const br=s[4]&&s[4][i];if(br)for(const t of br){const q=await doStep(t);if(q==='abort')return 'abort';}return;}
    case 'gold':G.gold=Math.max(0,G.gold+s[1]);renderTop();return;
    case 'scatter':G.scattered=G.party.filter(id=>id!=='leon');G.party=['leon'];G.active=null;G.follow=null;renderTop();return;
    case 'hero':{if(!G.groups)G.groups={};const h=G.party[0];G.groups[h]={party:G.party.slice(),map:G.map,px:G.px,py:G.py};
      G.party=[s[1]];G.active=null;G.follow=null;ensureMember(s[1]);G.hp[s[1]]=maxHP(s[1]);renderTop();changeMap(s[2],s[3],s[4],s[5]);{const on=M.d.onEnter&&M.d.onEnter();if(on)for(const t of on){const r=await doStep(t);if(r==='abort')return 'abort';}}return;}
    case 'regroup':G.party=s[1].slice();G.party.forEach(ensureMember);G.active=null;G.follow=null;fullHeal();renderTop();return;
    case 'guest':{ensureMember(s[1]);if(!G.party.includes(s[1]))G.party.push(s[1]);G.hp[s[1]]=maxHP(s[1]);G.prevActive=G.active||null;const rest=activeParty().filter(x=>x!=='leon'&&x!==s[1]).slice(0,2);G.active=['leon',s[1],...rest];renderTop();return;}
    case 'unguest':G.party=G.party.filter(x=>x!==s[1]);G.active=G.prevActive||null;renderTop();return;
    case 'airship':{const list=FLY.filter(f=>f[4]()&&f[1]!==G.map);const i=await askChoice('','どこへ 飛ぶ？',[...list.map(f=>f[0]),'やめる']);if(i>=list.length)return;const f=list[i];await playFx('fade','―― '+f[0]+'へ',2.2);changeMap(f[1],f[2],f[3],3);{const on=M.d.onEnter&&M.d.onEnter();if(on)for(const t of on){const r=await doStep(t);if(r==='abort')return 'abort';}}return;}
    case 'push':G.px=safe.x;G.py=safe.y;return;
    case 'call':{const r=s[1]();if(Array.isArray(r))for(const t of r){const q=await doStep(t);if(q==='abort')return 'abort';}return;}
  }
}
const RESPAWN={hinowa:['sakuranotsu',4.5,15.5,0],jouki:['gearim',10.5,14.5,3],chikurin:['chikurin',12.5,23.5,3],ukishima:['ukishima',12.5,22.5,3],dangai:['field',25.5,12.5,1],shitsugen:['field',13.5,41.5,3],mori:['field',2.5,24.5,2],hakurei:['field',13.5,2.5,0],henkyo:['henkyo',9.5,13.5,3],dochi:['henkyo',9.5,3.5,0],hakusetsu:['hakusetsu',9.5,17.5,3],haguruma:['haguruma',8.5,12.5,3],arcanoa:['arcanoa',10.5,17.5,3],roots:['arcanoa',10.5,2.5,0],heart:['arcanoa',10.5,2.5,0],gearim:['gearim',10.5,14.5,3],roofs:['gearim',10.5,1.5,0],archive:['gearim',10.5,8.4,0],tenpu:['kazami',9.5,2.5,0],hidamari:['hidamari',10.5,8.5,0],kazami:['kazami',9.5,8.5,0],yamajinja:['yamajinja',9.5,11.5,3],sakuranotsu:['sakuranotsu',4.5,15.5,0],ship:['urahama',6.5,22.5,0],urahama:['urahama',6.5,17.9,3],port:['port',4.5,5.6,3],seacave:['port',4.5,5.6,3],field:['field',21.5,36.6,3],ruins:['field',21.5,36.6,3],castle:['castle',2.5,11.4,0],cellar:['castle',2.5,11.4,0],town:['town',9.5,8.5,0],waterway:['waterway',2.5,1.6,0]};
function handleLose(){
  const r=RESPAWN[G.map]||RESPAWN.field;fullHeal();changeMap(r[0],r[1],r[2],r[3]);save();
  runScript([['say','',['目の前が まっくらに なった……','……気がつくと、見覚えのある 場所に いた。持ち物は ぶじだ。']]]);
}

/* ===== フィールド処理 ===== */
function currentTrigs(){
  const list=(M.d.triggers?M.d.triggers():[]).map((t,i)=>Object.assign({key:G.map+'#'+i},t));
  const tx=Math.floor(G.px),ty=Math.floor(G.py);
  return list.filter(t=>tx>=t.x&&tx<t.x+t.w&&ty>=t.y&&ty<t.y+t.h&&(!t.cond||t.cond()));
}
function interact(){
  if(mode!=='field'||menuOpen)return;
  if(dialog||fx){advance();return;}
  if(scriptBusy)return;
  const fx0=G.px+[0,-1,1,0][G.dir]*.8,fy0=G.py+[1,0,0,-1][G.dir]*.8;
  let best=null,bd=1.4;
  visibleNpcs().forEach(n=>{if(!n.talk)return;const d=Math.min(Math.hypot(n.x-fx0,n.y-fy0),Math.hypot(n.x-G.px,n.y-G.py));if(d<bd){bd=d;best=n;}});
  if(best){talkTo(best);return;}
  for(const it of (M.d.interact||[])){if(Math.hypot(it.x+.5-G.px,it.y+.5-G.py)<(it.r||1.4)){G.dir=faceDir(it.x+.5-G.px,it.y+.5-G.py);runScript(it.run());return;}}
  {const ch=chestList().find(c=>!G.chests[c.flag]&&Math.hypot(c.x-G.px,c.y-G.py)<1.3);if(ch){openChest(ch);return;}}
  if(pullBlock())return;
  runScript([['say','',['とくに 何もない。']]]);
}
/* 石を引く：石の前で しらべる */
function pullBlock(){
  const dx=[0,-1,1,0][G.dir],dy=[1,0,0,-1][G.dir];
  const px=Math.floor(G.px),py=Math.floor(G.py);
  const bx=Math.floor(G.px+dx*.7),by=Math.floor(G.py+dy*.7);
  if(!(M.t[by]&&M.t[by][bx]==='K'))return false;
  const tx=bx-dx,ty=by-dy;          // 石の移動先（今の自分のマス）
  const sx=tx-dx,sy=ty-dy;          // 自分の下がり先
  if(tx===bx&&ty===by)return false;
  const okT=M.t[ty]&&M.t[ty][tx]===':',okS=M.t[sy]&&M.t[sy][sx]===':';
  if(!okT||!okS){toast('うしろが つかえて 引けない……');return true;}
  M.t[by][bx]=':';M.t[ty][tx]='K';
  G.px=sx+.5;G.py=sy+.5;trail=[];
  toast('ズズッ…… 石を 引いた！');
  return true;
}
$('talkBtn').onclick=()=>interact();
function talkTo(n){if(!n.sign)n.dir=faceDir(G.px-n.x,G.py-n.y);G.dir=faceDir(n.x-G.px,n.y-G.py);bumpCool=n.id||'sign';runScript(n.talk());}
const TAB_OFF={'6_5':1,'12_20':2,'19_6':0},TAB_GOAL={'6_5':'○','12_20':'△','19_6':'□'};
function tabSym(x,y){const k=x+'_'+y;return ['○','△','□'][((G.flags['tab_'+k]||0)+(TAB_OFF[k]||0))%3];}
function chestList(){return [...(M.d.chest?[M.d.chest]:[]),...(M.d.chests||[])].filter(c=>!c.show||c.show());}
const DIARY={1:['「団子 三百本。……うまかった。全部 数えた」','「リナ殿は 焼くのが 早い。尊敬する。言えない」'],2:['「ソラ殿が 私の 背中で 寝ていた。起こせなかった」','「足が しびれた。……悪くない」'],3:['「レオン殿が『……頼む』と 言った」','「私も いつか、言えるだろうか。……言いたい」']};
function openDiary(ch){G.chests[ch.flag]=true;const n=[1,2,3].filter(i=>G.chests['dia'+i]).length;const lines=['<span class="hot">コハクの 日記（'+ch.diary+'）を 見つけた！</span>',...DIARY[ch.diary]];
  const tail=[['say','コハク',['…………。','（見なかった ことに してほしい）']]];
  if(n>=3){const it=newItem({type:'acc',name:'コハクの 日記帳',rar:RAR[4],opts:['崩しダメージ +30%','経験値 +10%'],hpb:10});tail.push(['say','',['<span class="hot">日記が 三冊 そろった！「コハクの 日記帳」を 手に入れた！</span>','（崩しダメージ ＋30%・経験値 ＋10%）']]);}
  save();runScript([['say','',lines],...tail]);}
function openChest(ch){if(ch.diary)return openDiary(ch);G.chests[ch.flag]=true;const l=ch.item?newItem(Object.assign({opts:[]},ch.item,{rar:RAR[ch.item.ri||0]})):addLoot(ch.tier||0);if(ch.onOpen)ch.onOpen();save();
  runScript([['say','',['宝箱を 開けた！','<span class="hot">'+l.rar.n+'「'+l.name+'」</span>を 手に入れた！',itemKind(l)+'　'+itemStats(l)+'<br><span class="dim">メニューの「そうび」で 付けられる</span>']]]);}
/* ぶつかって調べる */
let bumpT=0,bumpCool=null;
function bumpCheck(dt){
  const ax=G.px+[0,-1,1,0][G.dir]*.75,ay=G.py+[1,0,0,-1][G.dir]*.75;
  let target=null,id=null;
  const n=visibleNpcs().find(n=>n.talk&&Math.hypot(n.x-ax,n.y-ay)<(n.big?1.1:.7));
  if(n){target=()=>talkTo(n);id=n.id||'sign';}
  if(!target)for(const it of (M.d.interact||[])){if(Math.floor(ax)===it.x&&Math.floor(ay)===it.y){target=()=>{runScript(it.run());};id='it'+it.x+','+it.y;break;}}
  {const ch=chestList().find(c=>!G.chests[c.flag]&&Math.hypot(c.x-ax,c.y-ay)<.8);if(!target&&ch){target=()=>openChest(ch);id='chest';}}
  if(!target){bumpT=0;return;}
  if(bumpCool===id){return;}
  bumpT+=dt;if(bumpT>.12){bumpT=0;bumpCool=id;target();}
}
function puzzleTick(moved){
  if(flame>0){const b=flame;flame=Math.max(0,flame-moved);if(b>0&&flame===0)toast('剣の火が 消えた…');}
  if(tileAt(G.px,G.py)==='w'&&flame>0){flame=0;toast('水たまりで 火が消えた！');}
  const cx=Math.floor(G.px),cy=Math.floor(G.py);
  for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){
    if(y<0||x<0||y>=M.H||x>=M.W)continue;const c=M.t[y][x];
    if(Math.hypot(x+.5-G.px,y+.5-G.py)>1.15)continue;
    if(c==='O'||c==='Y')flame=FL;
    else if(c==='o'&&flame>0){M.t[y][x]='O';G.dg.lit.push(x+','+y);flame=FL;toast('燭台に 火が灯った！');
      const lit=(a,b)=>M.t[b][a]==='O';
      if(!G.dg.g1&&G1.every(([a,b])=>lit(a,b))){G.dg.g1=true;M.t[14][7]=':';toast('ゴゴゴ……奥の扉が 開いた！');}
      if(!G.dg.g2&&G2.every(([a,b])=>lit(a,b))){G.dg.g2=true;M.t[6][7]=':';toast('ゴゴゴ……祭壇への扉が 開いた！');}
      save();}
    else if(c==='u'&&flame>0){flame=0;toast('水の燭台だ！ 火が 消えてしまった');}
  }
}
function update(dt){
  if(G.flags.earthNote&&mode==='field'&&!scriptBusy&&!dialog&&!menuOpen&&!fx){G.flags.earthNote=false;runScript(STORY.earthNews());}
  perf+=dt;if(inv>0)inv-=dt;if(toastT){toastT.t-=dt;if(toastT.t<=0)toastT=null;}
  if(fx){fx.t+=dt;if(fx.t>=fx.dur){const r=fx.res;fx=null;renderMsg();r&&r();}}
  const wantMove=!!pad||(joy&&joy.moved)||keys.ArrowLeft||keys.ArrowRight||keys.ArrowUp||keys.ArrowDown||keys.a||keys.d||keys.w||keys.s;
  if(dialog&&dialog.casual&&wantMove&&mode==='field'){closeCasual();return;}
  if(mode!=='field'||dialog||menuOpen||scriptBusy||fx)return;
  if(G.map==='field'&&fireOn()&&G.party.includes('sora')&&G.party.includes('rina')&&!G.flags.waterGone&&inv<=0){runScript(STORY.waterGone());return;}
  if(bumpCool){const ax=G.px,ay=G.py;const near=visibleNpcs().some(n=>(n.id||'sign')===bumpCool&&Math.hypot(n.x-ax,n.y-ay)<1.15)||(String(bumpCool).startsWith('it')||bumpCool==='chest');if(!near||!wantMove)bumpCool=null;}
  let dx=0,dy=0;if(joy){dx=joy.dx;dy=joy.dy;}if(pad){dx=pad.dx;dy=pad.dy;}
  if(keys.ArrowLeft||keys.a)dx=-1;if(keys.ArrowRight||keys.d)dx=1;if(keys.ArrowUp||keys.w)dy=-1;if(keys.ArrowDown||keys.s)dy=1;
  const l=Math.hypot(dx,dy);
  if(l>.2){
    if(l>1){dx/=l;dy/=l;}
    G.dir=faceDir(dx,dy);
    const sp=4.2*dt*(G.flags.dash?1.35:1),r=.28,ox=G.px,oy=G.py;
    const blocked=(x,y)=>solidAt(x-r,y-r+.2)||solidAt(x+r,y-r+.2)||solidAt(x-r,y+r)||solidAt(x+r,y+r)||visibleNpcs().some(n=>{const r=n.big?.95:.6,d=Math.hypot(n.x-x,n.y-y);return d<r&&d<=Math.hypot(n.x-G.px,n.y-G.py);});
    const nx=G.px+dx*sp,ny=G.py+dy*sp;
    if(!blocked(nx,G.py))G.px=nx;
    if(!blocked(G.px,ny))G.py=ny;
    const moved=Math.hypot(G.px-ox,G.py-oy);
    if(moved>0.001){trail.push({x:ox,y:oy,d:G.dir});if(trail.length>40)trail.shift();}
    // 石を押す
    if(moved<0.001){const tx=Math.floor(G.px+[0,-1,1,0][G.dir]*.7),ty=Math.floor(G.py+[1,0,0,-1][G.dir]*.7);
      if(M.t[ty]&&M.t[ty][tx]==='K'){pushT+=dt;if(pushT>.12){pushT=0;const nx2=tx+[0,-1,1,0][G.dir],ny2=ty+[1,0,0,-1][G.dir];const c=M.t[ny2]&&M.t[ny2][nx2];
        if(c===':'){M.t[ty][tx]=':';M.t[ny2][nx2]='K';}
        else if(c==='q'){M.t[ty][tx]=':';M.t[ny2][nx2]='Q';if(M.d.gears){toast('ガチン！ 歯車が はまった！');gearDoorCheck();}else toast('ゴトン！ 石が 割れ目を ふさいだ！');}
        else if(c==='~'){M.t[ty][tx]=':';M.t[ny2][nx2]='B';G.flags.bridge=true;toast('ザブン！ 石が 水路を ふさいで 橋になった！');save();}}}
      else{pushT=0;if(M.t[ty]&&M.t[ty][tx]==='q'&&!(toastT&&toastT.t>0)&&!dialog)toast('深い 割れ目だ。');}
      bumpCheck(dt);}
    else bumpT=0;
    if(M.d.puzzle)puzzleTick(moved);
  }else if(M.d.puzzle)puzzleTick(0);
  // トリガー
  const trigs=currentTrigs();const now=new Set(trigs.map(t=>t.key));
  for(const t of trigs){if(!insideTrig.has(t.key)){insideTrig=now;if(t.block){const back={x:safe.x,y:safe.y};runScript(t.run()).then(()=>{G.px=back.x;G.py=back.y;});return;}runScript(t.run());return;}}
  insideTrig=now;if(!trigs.some(t=>t.block))safe={x:G.px,y:G.py};
  // まもの
  M.foes.forEach(f=>{
    if(f.show&&!f.show())return;
    if(!f.alive){if(!FOES[f.k].boss&&f.respawn>0){f.respawn-=dt;if(f.respawn<=0){f.alive=true;f.x=f.hx;f.y=f.hy;}}return;}
    if(!FOES[f.k].boss){
      f.t-=dt;if(f.t<=0){f.t=1+Math.random()*2;const a=Math.random()*Math.PI*2;const mv=Math.random()<.35?0:.8;f.vx=Math.cos(a)*mv;f.vy=Math.sin(a)*mv;}
      const nx=f.x+f.vx*dt,ny=f.y+f.vy*dt;
      if(!solidAt(nx,ny)&&Math.hypot(nx-f.hx,ny-f.hy)<2.2&&tileAt(nx,ny)!=='='){f.x=nx;f.y=ny;}else{f.vx=-f.vx;f.vy=-f.vy;}
    }
    if(inv<=0&&Math.hypot(f.x-G.px,f.y-G.py)<(FOES[f.k].boss?.95:.75))encounter(f);
  });
}
function encounter(f){
  const d=FOES[f.k];
  if(d.lv-G.L<=-3&&!d.boss){
    f.alive=false;f.respawn=25;
    const e=expFor(d.lv);const gd=Math.round(goldFor(d)*.5);G.gold+=gd;const lines=['先制！ '+d.name+'を 蹴散らした！','経験値 '+e+' と '+gd+'G を かくとく。',...giveExp(e)];
    if(Math.random()<.2){const l=addLoot(0);lines.push('<span class="hot">'+l.rar.n+'「'+l.name+'」</span>を ひろった！');}
    save();renderTop();runScript([['say','',lines]]);inv=.6;return;
  }
  let tut=null;
  if(f.k==='mouse'&&!G.flags.tut1Shown){tut=STORY.tutorial1;G.flags.tut1Shown=true;}
  if(f.k==='beetle')tut=STORY.tutorial2;
  startBattle(f,tut).then(r=>{
    if(r!=='win'){handleLose();return;}
    if(f.k==='mouse'){const s=STORY.afterMouse();if(s)runScript(s);}
    if(f.k==='beetle')runScript(STORY.afterBeetle());
  });
}

/* ===== ステータス表示 ===== */
function statusHTML(ids,hp,max){
  let h='';for(let i=0;i<4;i++){const id=ids[i];if(!id){h+='<div class="st empty"></div>';continue;}const c=CHARS[id];const v=hp[i],mx=max[i];const cls=v<=0?'dead':(v/mx<0.35?'low':'');
    h+='<div class="win st '+cls+'" id="st-'+i+'"><div class="nm">'+c.name+'</div><div class="row"><span>H</span><span>'+v+'</span></div><div class="row lvrow"><span>Lv</span><span>'+G.L+'</span></div><div class="row el"><span>'+c.job+'</span><span class="e-'+c.elem+'" style="color:var(--ec)">'+c.elem+'</span></div></div>';}
  return h;
}
function applyDusk(){const on=!!(G&&G.lost.includes('光'));document.body.classList.toggle('dusk',on);}
function renderTop(){applyDusk();
  if(mode==='battle')return;
  const ap=activeParty();$('status').innerHTML=statusHTML(ap,ap.map(id=>G.hp[id]),ap.map(maxHP));
  $('lv').textContent='Lv'+G.L;$('expbar').style.width=Math.min(100,G.exp/needExp(G.L)*100)+'%';
  $('bread').textContent='パン×'+G.bread+'　'+G.gold+'G';
}

/* ===== メニュー ===== */
let mv='top',eqC=null,eqS=null;
function canFly(){return !!(G.flags.ch2End&&G.party[0]==='leon'&&!M.d.dim&&!['ship','heart','roofs'].includes(G.map)&&!G.flags.noFly);}
const FLY=[['王国・草原','field',21.5,36.6,()=>true],['港町 ミナトベ','port',4.5,5.6,()=>true],['王国の辺境（ガラムの畑）','henkyo',9.5,13.5,()=>G.flags.ch2End],
  ['ヒノワ・桜ノ津','sakuranotsu',10.5,11.5,()=>true],['ヒノワ・白雪嶺','hakusetsu',9.5,17.5,()=>G.flags.ch2End],
  ['空都 ギアリム','gearim',10.5,14.5,()=>G.flags.gearimIntro],['ギアリム地下・歯車墓場','haguruma',8.5,12.5,()=>G.flags.vegaJoin],['秘境 アルカノア','arcanoa',10.5,17.5,()=>G.flags.arcIntro],['ヒノワ・竹林の街道','chikurin',12.5,23.5,()=>G.flags.ch2End],['ギアリム・雲海の浮き島','ukishima',12.5,22.5,()=>G.flags.vegaJoin],['ヒノワ・桜の街道','hinowa',15.5,21.5,()=>G.flags.epLucia]];
const mbtn=(label,sub,go)=>'<button class="item" data-go="'+go+'"><span>'+label+'</span><small>'+sub+'</small></button>';
const df=(v,u)=>v>0?'<span class="up">↑'+v+(u||'')+'</span>':v<0?'<span class="down">↓'+(-v)+(u||'')+'</span>':'<span class="dim">→</span>';
function equipItem(cid,slot,itemId){
  if(itemId!==null){const w=whoWears(itemId);if(w)SLOTS.forEach(sl=>{if(G.equip[w][sl]===itemId)G.equip[w][sl]=null;});}
  G.equip[cid][slot]=itemId;G.party.forEach(id=>G.hp[id]=Math.min(G.hp[id],maxHP(id)));save();renderTop();
}
function renderMenu(){
  const p=$('menuPanel');let h='';if(!eqC||!G.party.includes(eqC))eqC=G.party[0];
  if(mv==='top'){
    h+='<h3>メニュー　<span style="color:var(--ink)">'+G.gold+' G</span></h3>'+mbtn('そうび','ぶき・よろい・かざりを 付け替える','equip')+(G.party.length>1?mbtn('なかま','戦いに 出る 4人を えらぶ','party'):'')+mbtn('どうぐ','焼きたてパン ×'+G.bread,'items')+mbtn('つよさ','Lv'+G.L+'　つぎのレベルまで '+(needExp(G.L)-G.exp),'stats')+(G.quests&&Object.keys(G.quests).length?mbtn('クエスト','受けている 頼みごと','quests'):'')+mbtn('ずかん','融合・反応 '+G.dex.length+'/'+DEX.length,'dex')+(canFly()?mbtn('ひこうてい','各地へ 飛ぶ','fly'):'')+mbtn('セーブ',G.savedAt?'さいごの記録 '+G.savedAt:'まだ記録していない','save')+mbtn('とじる','','close');
  }else if(mv==='quests'){
    h+='<h3>クエスト</h3>';Object.entries(G.quests||{}).forEach(([k,st])=>{const q=QUESTS[k];if(!q)return;h+='<div class="item" style="display:block"><span>'+(st==='done'?'<span class="dim">✔ ':'')+q.name+(st==='done'?'</span>':'')+'</span><br><small>'+(st==='done'?'達成':q.desc())+'</small></div>';});
    h+=mbtn('もどる','','top');
  }else if(mv==='equip'){
    h+='<div class="tabs" style="grid-template-columns:repeat('+G.party.length+',1fr)">'+G.party.map(id=>'<button class="tab'+(id===eqC?' on':'')+'" data-c="'+id+'">'+CHARS[id].name+'</button>').join('')+'</div>';
    const c=CHARS[eqC];
    h+='<div class="sheet"><span>'+c.name+'<small>（'+c.job+'・得意'+c.elem+'）</small></span><span>HP '+maxHP(eqC)+'</span><span>攻撃 '+atkOf(eqC)+'</span><span>守備 '+defOf(eqC)+'</span></div>';
    if(eqS===null){
      SLOTS.forEach(sl=>{const it=itemById(G.equip[eqC][sl]);
        h+='<button class="item" data-s="'+sl+'"><span>'+SLOT_JP[sl]+'　'+(it?'<span style="color:var('+it.rar.c+')">'+it.name+'</span>':'<span class="dim">なし</span>')+'</span><small>'+(it?itemStats(it):'')+'</small></button>';
        if(it&&it.opts.length)h+='<div class="optline">'+it.opts.join('／')+'</div>';});
      h+=mbtn('もどる','','top');
    }else{
      const cur=itemById(G.equip[eqC][eqS]);
      h+='<h3>'+c.name+'の '+SLOT_JP[eqS]+' を えらぶ'+(eqS==='weapon'?'（'+WT_JP[c.wtype]+'のみ）':'')+'</h3>';
      const cands=G.items.filter(it=>it.type===eqS&&(eqS!=='weapon'||it.wtype===c.wtype)).sort((x,y)=>RAR.findIndex(r=>r.n===y.rar.n)-RAR.findIndex(r=>r.n===x.rar.n)||((y.atk+y.def)-(x.atk+x.def)));
      const base=k=>cur?(cur[k]||0):0;
      cands.forEach(it=>{const w=whoWears(it.id);const mine=cur&&cur.id===it.id;
        const tagW=mine?'<span class="eqmark">E</span>':w?'<small class="dim">（'+CHARS[w].name+'が装備中）</small>':'';
        const d=mine?itemStats(it):'攻撃'+df((it.atk||0)-base('atk'))+'　守備'+df((it.def||0)-base('def'))+((it.hpb||base('hpb'))?'　HP'+df((it.hpb||0)-base('hpb'),'%'):'');
        h+='<button class="item'+(mine?' eq':'')+'" data-id="'+it.id+'"><span>'+tagW+'<span style="color:var('+it.rar.c+')">'+it.name+'</span> <small>'+it.rar.n+'</small></span><small>'+d+'</small></button>';
        if(it.opts.length)h+='<div class="optline">'+it.opts.join('／')+'</div>';});
      if(!cands.length)h+='<div class="dim" style="font-size:13px">付けられる ものを 持っていない。</div>';
      if(cur)h+='<button class="item" data-id="none"><span>はずす</span><small></small></button>';
      h+='<button class="item" data-back="1"><span>もどる</span><small></small></button>';
    }
  }else if(mv==='party'){
    const ap=activeParty();
    h+='<h3>なかま　<span class="dim" style="font-size:12px">戦いに 出られるのは 4人まで</span></h3>';
    G.party.forEach(id=>{const c=CHARS[id];const on=ap.includes(id);const lock=id===G.party[0];
      h+='<button class="item'+(on?' eq':'')+'" data-mem="'+id+'"'+(lock?' disabled':'')+'><span>'+(on?'<span class="eqmark">戦う</span>':'<span class="dim">ひかえ</span>')+' '+c.name+' <small>'+c.job+'・得意'+c.elem+'</small></span><small>HP '+G.hp[id]+'/'+maxHP(id)+(lock?'（固定）':'')+'</small></button>';});
    h+='<div id="partyMsg" class="dim" style="font-size:12px;min-height:16px"></div>'+mbtn('もどる','','top');
  }else if(mv==='items'){
    h+='<h3>どうぐ　<span style="color:var(--ink)">'+G.gold+' G</span></h3><button class="item" id="eatBtn"'+(G.bread<=0?' disabled':'')+'><span>焼きたてパン ×'+G.bread+'</span><small>全員のHPが 半分回復</small></button><button class="item" id="feastBtn"'+(G.feast<=0?' disabled':'')+'><span>ごちそうパン ×'+G.feast+'</span><small>全員のHPが 全回復</small></button>';
    const spare=G.items.filter(it=>!whoWears(it.id));
    h+='<h3>もちもの（装備していない）'+spare.length+'</h3>';
    spare.forEach(it=>{h+='<div class="item" style="cursor:default"><span style="color:var('+it.rar.c+')">'+it.name+'</span><small>'+itemKind(it)+'　'+itemStats(it)+'</small></div>';});
    h+=mbtn('もどる','','top');
  }else if(mv==='stats'){
    h+='<h3>つよさ　Lv'+G.L+'</h3><div class="dim" style="font-size:13px">経験値 '+G.exp+' / '+needExp(G.L)+'</div>';
    h+='<table class="stbl"><tr><th></th><th>HP</th><th>攻撃</th><th>守備</th></tr>'+G.party.map(id=>'<tr><td>'+CHARS[id].name+'</td><td>'+G.hp[id]+'/'+maxHP(id)+'</td><td>'+atkOf(id)+'</td><td>'+defOf(id)+'</td></tr>').join('')+'</table>';
    if(G.lost.length)h+='<div class="dim" style="font-size:12px">世界から 消えている属性：'+G.lost.join('・')+'（その技は 使えない）</div>';
    h+=mbtn('もどる','','top');
  }else if(mv==='dex'){
    const ds=new Set(G.dex);
    h+='<h3>融合・反応ずかん '+ds.size+'/'+DEX.length+'</h3><div class="dex">'+DEX.map(n=>ds.has(n)?'<span class="got">'+n+'</span>':'<span>？？？</span>').join('')+'</div>'+mbtn('もどる','','top');
  }else if(mv==='save'){
    const ok=save();
    h+='<h3>セーブ</h3><div style="font-size:14px">'+(ok?'冒険の記録を のこした。（'+G.savedAt+'）':'この環境では 記録できなかった。')+'</div><div class="dim" style="font-size:12px">'+({cloud:'記録は あなたのアカウントに 保存される（別の端末からも つづきから 遊べる）。',local:'記録は この端末のブラウザに 保存される。',none:'この画面では 自動の記録が できないみたい。下の「ふっかつのじゅもん」を 控えておいてね。'})[storeMode()]+'宿屋・戦闘のあと・場面の区切りでも 自動で記録される。</div>'+mbtn('（予備）ふっかつのじゅもん','ふだんは 使わなくて 大丈夫','code')+mbtn('さいしょから はじめる','記録を消して 最初に戻る','reset')+mbtn('もどる','','top');
  }else if(mv==='code'){
    h+='<h3>ふっかつのじゅもん</h3><div class="dim" style="font-size:12px">この文字を メモ帳などに 貼って 控えておく。タイトル画面の「じゅもんを いれる」に 貼ると、ここから 再開できる。</div><textarea id="codeBox" readonly style="width:100%;height:110px;font:12px monospace;background:#111;color:#FFF;border:1px solid #FFF6;border-radius:6px;padding:6px;word-break:break-all">作成中……</textarea><button class="item" id="copyBtn"><span>コピーする</span><small></small></button>'+mbtn('もどる','','save');
  }else if(mv==='shop'){
    const S=SHOPS[shopKind];
    h+='<h3>'+S.name+'　<span style="color:var(--ink)">'+G.gold+' G</span></h3>';
    if(shopKind==='arms')h+='<div class="tabs" style="grid-template-columns:1fr 1fr"><button class="tab'+(shopTab==='buy'?' on':'')+'" data-tab="buy">かう</button><button class="tab'+(shopTab==='sell'?' on':'')+'" data-tab="sell">うる</button></div>';
    if(shopKind!=='arms'||shopTab==='buy'){
      S.goods.forEach((g,i)=>{const can=G.gold>=g.price;let sub=g.desc||'';
        if(g.kind==='gear'){sub=(g.type==='weapon'?WT_JP[g.wtype]+'（'+wtOwner(g.wtype)+'用）':'よろい')+'　'+(g.atk?'攻撃+'+g.atk:'守備+'+g.def);}
        h+='<button class="item" data-buy="'+i+'"'+(can?'':' disabled')+'><span>'+g.name+'</span><small>'+sub+'　<span style="color:var(--hot)">'+g.price+'G</span></small></button>';});
    }else{
      const spare=G.items.filter(it=>!whoWears(it.id));
      if(!spare.length)h+='<div class="dim" style="font-size:13px">売れる ものが ない。（装備中の ものは 売れない）</div>';
      spare.forEach(it=>{const arm=sellArm===it.id;h+='<button class="item'+(arm?' eq':'')+'" data-sell="'+it.id+'"><span style="color:var('+it.rar.c+')">'+it.name+'</span><small>'+(arm?'<span style="color:var(--hot)">もう一度 押すと 売る</span>':itemStats(it))+'　'+sellPrice(it)+'G</small></button>';});
    }
    h+='<div id="shopMsg" class="dim" style="font-size:13px;min-height:18px"></div><button class="item" data-go="close"><span>店を 出る</span><small></small></button>';
  }else if(mv==='reset'){
    h+='<h3>本当に さいしょから はじめる？</h3><div class="dim" style="font-size:13px">レベル・装備・物語の進み具合は すべて消える。</div>'+mbtn('はい、消して はじめる','','doreset')+mbtn('いいえ','','top');
  }
  p.innerHTML=h;
  p.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const g=b.dataset.go;if(g==='close'){toggleMenu(false);return;}if(g==='fly'){toggleMenu(false);runScript([['airship']]);return;}if(g==='doreset'){eraseSave().then(()=>location.reload());return;}mv=g;eqS=null;renderMenu();});
  p.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{eqC=b.dataset.c;eqS=null;renderMenu();});
  p.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{eqS=b.dataset.s;renderMenu();});
  p.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>{eqS=null;renderMenu();});
  p.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{const v=b.dataset.id;equipItem(eqC,eqS,v==='none'?null:+v);eqS=null;renderMenu();});
  if(mv==='code'){makeCode().then(c=>{const b=$('codeBox');if(b)b.value=c;});const cb=$('copyBtn');if(cb)cb.onclick=()=>copyText($('codeBox'),cb.querySelector('span'));}
  p.querySelectorAll('[data-mem]').forEach(b=>b.onclick=()=>{const id=b.dataset.mem;let ap=activeParty();
    if(ap.includes(id)){if(ap.length<=1)return;ap=ap.filter(x=>x!==id);}
    else{if(ap.length>=4){const m=$('partyMsg');if(m)m.textContent='先に 誰かを「ひかえ」に してね（4人まで）';return;}ap=ap.concat([id]);}
    G.active=ap;save();renderTop();renderMenu();});
  p.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{shopTab=b.dataset.tab;sellArm=null;renderMenu();});
  p.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{const g=SHOPS[shopKind].goods[+b.dataset.buy];if(G.gold<g.price)return;G.gold-=g.price;
    if(g.kind==='bread')G.bread++;else if(g.kind==='feast')G.feast++;
    else newItem({type:g.type,wtype:g.wtype||null,name:g.name,rar:RAR[0],atk:g.atk||0,def:g.def||0,opts:[]});
    save();renderTop();renderMenu();const m=$('shopMsg');if(m)m.innerHTML='<span class="hot">'+g.name+'を 買った！</span>'+(g.kind==='gear'?' メニューの「そうび」で 付けられる。':'');});
  p.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{const id=+b.dataset.sell;if(sellArm!==id){sellArm=id;renderMenu();return;}
    const it=itemById(id);if(!it||whoWears(id))return;const pr=sellPrice(it);G.gold+=pr;G.items=G.items.filter(x=>x.id!==id);sellArm=null;save();renderTop();renderMenu();const m=$('shopMsg');if(m)m.innerHTML='<span class="hot">'+it.name+'を '+pr+'Gで 売った。</span>';});
  const feast=$('feastBtn');if(feast)feast.onclick=()=>{if(G.feast<=0)return;G.feast--;fullHeal();save();renderTop();renderMenu();};
  const eat=$('eatBtn');if(eat)eat.onclick=()=>{if(G.bread<=0)return;G.bread--;G.party.forEach(id=>{G.hp[id]=Math.min(maxHP(id),Math.max(0,G.hp[id])+Math.round(maxHP(id)/2));});save();renderTop();renderMenu();};
}
function toggleMenu(on,view){if(on&&(scriptBusy||dialog))return;menuOpen=on;mv=view||'top';sellArm=null;eqS=null;$('menuPanel').hidden=!on;$('fieldBox').hidden=on;$('fmsg').hidden=on;$('talkBtn').disabled=on;$('ctrl').classList.toggle('menuon',on);$('menuBtn').textContent=on?'とじる':'メニュー';if(on)renderMenu();else resize();}
$('menuBtn').onclick=()=>toggleMenu(!menuOpen);
