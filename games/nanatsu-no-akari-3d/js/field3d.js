/* ===== 3Dフィールド =====
   マップ・会話・イベントは engine.js のまま。見た目だけを 3D に 差し替える。
   地面の絵は 既存の drawTile で #map キャンバスに描き、それを 3D の地形に貼る。
   人や まものは 既存の 2Dドット絵を 板ポリゴンにして 立てる。 */
const F3={TT:32,texW:0,texH:0,mapName:null,sig:'',paintT:0,lampT:0,tick:0};
const fbox=$('fieldBox');
const gl3=document.createElement('canvas');gl3.id='gl3';fbox.insertBefore(gl3,cv);
const ov3=document.createElement('canvas');ov3.id='ov3';fbox.insertBefore(ov3,cv);
const octx=ov3.getContext('2d');
const R3=new THREE.WebGLRenderer({canvas:gl3,antialias:true});
R3.outputEncoding=THREE.sRGBEncoding;R3.shadowMap.enabled=true;R3.shadowMap.type=THREE.PCFSoftShadowMap;
const scene3=new THREE.Scene();
const cam3=new THREE.PerspectiveCamera(46,1,.1,140);
const hemi3=new THREE.HemisphereLight('#eaf4ff','#5a6b4a',.8);
const sun3=new THREE.DirectionalLight('#fff3dc',.8);
sun3.castShadow=true;sun3.shadow.mapSize.set(1024,1024);sun3.shadow.bias=-.002;
Object.assign(sun3.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:1,far:40});sun3.shadow.camera.updateProjectionMatrix();
scene3.add(hemi3,sun3,sun3.target);
const lamps3=[0,1,2,3,4,5].map(()=>{const l=new THREE.PointLight('#ffb35a',0,6,2);scene3.add(l);return l;});
const plight3=new THREE.PointLight('#ffd9a0',0,6,2);scene3.add(plight3);
const world3=new THREE.Group();scene3.add(world3);

/* ---- 地面テクスチャ（#map キャンバスを そのまま使う） ---- */
const gtex3=new THREE.CanvasTexture(cv);
gtex3.encoding=THREE.sRGBEncoding;gtex3.magFilter=THREE.NearestFilter;gtex3.minFilter=THREE.LinearFilter;gtex3.generateMipmaps=false;
const groundMat3=new THREE.MeshLambertMaterial({map:gtex3,vertexColors:true,side:THREE.DoubleSide});

/* ---- 高さ ---- */
const HT3={'#':1.2,'H':1.15,'d':1.15,'R':1.65,'1':1.1,'2':1.1,'z':1.2,'J':1.3,'I':1.5,'凍':1.1,'蔦':1.2,'滝':1.3,'影':.05,'岩':.7,'^':1.3,'M':.8,'V':1.0,'C':1.3,
  'b':1.1,'h':.8,'j':.8,'K':.75,'x':.6,'Z':.6,'t':.45,'e':.35,'X':.5,'Y':.5,'n':.5,'N':.5,'o':.45,'O':.45,'u':.45,'F':.35,'W':.35,'s':.55,
  'L':0,'T':0,'P':0,'U':.3,'@':.25,'l':.3,'m':.3,'q':-.35,'~':-.25,'r':.4,'弁':.5,'鏡':.8,'碑':.8,'鐘':.9,'*':.5,'B':.03,'w':0};
function tileH3(x,y){
  if(x<0||y<0||x>=M.W||y>=M.H)return null;
  const c=M.t[y][x];
  if(c==='潮')return G.flags.swampNight?0:-.2;
  if(c==='~'&&M.d.dim)return -.25;
  if(c in HT3)return HT3[c];
  return SOLID.has(c)?.5:0;
}

/* ---- 地形メッシュ ---- */
let terrain3=null,props3=[];
function buildTerrain3(){
  if(terrain3){world3.remove(terrain3);terrain3.geometry.dispose();}
  props3.forEach(p=>{world3.remove(p);p.geometry&&p.geometry.dispose();});props3=[];
  const P=[],N=[],U=[],C=[];const TT=F3.TT,tw=F3.texW,th=F3.texH;
  const quad=(a,b,c,d,n,uv,k)=>{for(const [v,t] of [[a,uv[0]],[b,uv[1]],[c,uv[2]],[a,uv[0]],[c,uv[2]],[d,uv[3]]]){P.push(...v);N.push(...n);U.push(...t);C.push(k,k,k);}};
  for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){
    const h=tileH3(x,y);const u0=x*TT/tw,u1=(x+1)*TT/tw,v1=1-y*TT/th,v0=1-(y+1)*TT/th;
    quad([x,h,y],[x+1,h,y],[x+1,h,y+1],[x,h,y+1],[0,1,0],[[u0,v1],[u1,v1],[u1,v0],[u0,v0]],1);
    const side=(nx,ny,a,b,n,k)=>{let nh=tileH3(nx,ny);if(nh===null)nh=Math.min(h,0)-.6;if(nh>=h)return;
      quad([a[0],h,a[1]],[b[0],h,b[1]],[b[0],nh,b[1]],[a[0],nh,a[1]],n,[[u0,v1],[u1,v1],[u1,v0],[u0,v0]],k);};
    side(x,y+1,[x,y+1],[x+1,y+1],[0,0,1],.86);
    side(x+1,y,[x+1,y+1],[x+1,y],[1,0,0],.7);
    side(x-1,y,[x,y],[x,y+1],[-1,0,0],.7);
    side(x,y-1,[x+1,y],[x,y],[0,0,-1],.58);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  terrain3=new THREE.Mesh(g,groundMat3);terrain3.receiveShadow=true;terrain3.castShadow=true;world3.add(terrain3);
  buildProps3();
}
const PM3={};const pmat3=(c,o)=>PM3[c+(o?JSON.stringify(o):'')]||(PM3[c+(o?JSON.stringify(o):'')]=new THREE.MeshLambertMaterial(Object.assign({color:c,flatShading:true},o||{})));
const flameG3=new THREE.ConeGeometry(1,1,6),flameM3=new THREE.MeshBasicMaterial({color:'#FF8A3D',transparent:true,opacity:.9}),flameM3b=new THREE.MeshBasicMaterial({color:'#FFE27A'});
const swordFlame3=new THREE.Group();swordFlame3.add(new THREE.Mesh(flameG3,flameM3),new THREE.Mesh(flameG3,flameM3b));swordFlame3.children[0].scale.set(.13,.34,.13);swordFlame3.children[1].scale.set(.07,.2,.07);swordFlame3.children[1].position.y=-.04;
const dropG3=new THREE.IcosahedronGeometry(1,1),dropM3=new THREE.MeshBasicMaterial({color:'#6FC3FF'}),wRingG3=new THREE.RingGeometry(1.02,1.15,40),wRingM3=new THREE.MeshBasicMaterial({color:'#4FA3FF',transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide});
const trunkG3=new THREE.CylinderGeometry(.09,.13,.7,6),coneG3=new THREE.ConeGeometry(1,1,7),ballG3=new THREE.IcosahedronGeometry(1,0),postG3=new THREE.BoxGeometry(.1,1.3,.1),headG3=new THREE.BoxGeometry(.28,.28,.28);
function inst3(geo,mat,list,fn){if(!list.length)return;const m=new THREE.InstancedMesh(geo,mat,list.length);const o=new THREE.Object3D();
  list.forEach((p,i)=>{fn(o,p,i);o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.castShadow=true;m.receiveShadow=true;world3.add(m);props3.push(m);}
function buildProps3(){
  const T=[],Pk=[],Lp=[];
  for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){const c=M.t[y][x];if(c==='T')T.push([x,y]);else if(c==='P')Pk.push([x,y]);else if(c==='L')Lp.push([x,y]);}
  const snow=M.name==='hakusetsu'||M.name==='hakurei';
  const hr=(x,y)=>((x*73856093)^(y*19349663))>>>0;
  inst3(trunkG3,pmat3('#6B4A2B'),[...T,...Pk],(o,[x,y])=>{o.position.set(x+.5,.35,y+.5);o.scale.set(1,1,1);o.rotation.set(0,0,0);});
  inst3(coneG3,pmat3(snow?'#E8F0F4':'#2F7D3A'),T,(o,[x,y])=>{const s=.95+(hr(x,y)%5)*.06;o.position.set(x+.5,1.1*s,y+.5);o.scale.set(.52,1.1*s,.52);});
  inst3(coneG3,pmat3(snow?'#FFFFFF':'#3E9A4A'),T,(o,[x,y])=>{const s=.95+(hr(x,y)%5)*.06;o.position.set(x+.5,1.55*s,y+.5);o.scale.set(.38,.8*s,.38);});
  inst3(ballG3,pmat3('#F2A7C3'),Pk,(o,[x,y])=>{o.position.set(x+.5,1.05,y+.5);o.scale.set(.55,.48,.55);o.rotation.set(0,hr(x,y)%6,0);});
  inst3(postG3,pmat3('#3B3B3B'),Lp,(o,[x,y])=>{o.position.set(x+.5,.65,y+.5);});
  const lit=fireOn();
  inst3(headG3,pmat3(lit?'#FFE08A':'#666',lit?{emissive:'#FFB84D',emissiveIntensity:.9}:null),Lp,(o,[x,y])=>{o.position.set(x+.5,1.38,y+.5);});
  // 燃えている 燭台・祭壇・暖炉には 常に 3Dの炎を 立てる（離れても 消えて見えない）
  const Fl=[];for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){const c=M.t[y][x];if(c==='O'||c==='Y'||c==='j')Fl.push([x,y,c]);}
  if(Fl.length){
    const outer=new THREE.InstancedMesh(flameG3,flameM3,Fl.length),inner=new THREE.InstancedMesh(flameG3,flameM3b,Fl.length),o=new THREE.Object3D();
    Fl.forEach(([x,y,c],i)=>{const h=(HT3[c]||.45)+(c==='j'?-.25:0);o.position.set(x+.5,h+.2,y+.5);o.scale.set(.16,.4,.16);o.updateMatrix();outer.setMatrixAt(i,o.matrix);
      o.position.set(x+.5,h+.14,y+.5);o.scale.set(.09,.24,.09);o.updateMatrix();inner.setMatrixAt(i,o.matrix);});
    world3.add(outer,inner);props3.push(outer,inner);
  }
  // 水の燭台：青い しずくと、火が 消える 範囲の 輪
  const Wu=[];for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++)if(M.t[y][x]==='u')Wu.push([x,y]);
  if(Wu.length){
    const drop=new THREE.InstancedMesh(dropG3,dropM3,Wu.length),ring=new THREE.InstancedMesh(wRingG3,wRingM3,Wu.length),o=new THREE.Object3D();
    Wu.forEach(([x,y],i)=>{o.rotation.set(0,0,0);o.position.set(x+.5,.78,y+.5);o.scale.set(.15,.2,.15);o.updateMatrix();drop.setMatrixAt(i,o.matrix);
      o.rotation.set(-Math.PI/2,0,0);o.position.set(x+.5,.03,y+.5);o.scale.set(1,1,1);o.updateMatrix();ring.setMatrixAt(i,o.matrix);});
    world3.add(drop,ring);props3.push(drop,ring);
  }
}

/* ---- ドット絵を 板ポリゴンに ---- */
const atlas3=document.createElement('canvas');atlas3.width=1024;atlas3.height=1024;const actx3=atlas3.getContext('2d');
const stex3=new THREE.CanvasTexture(atlas3);stex3.encoding=THREE.sRGBEncoding;stex3.magFilter=THREE.NearestFilter;stex3.minFilter=THREE.LinearFilter;stex3.generateMipmaps=false;
const smat3=new THREE.MeshBasicMaterial({map:stex3,alphaTest:.5,side:THREE.DoubleSide});
const slots3=new Map();let nslot3=0;
const FIELD_SVG=new Set(['rat','beetle','weed','hare','boar','crab','crabking','kappa','tanuki','kitsunebi','fox','itachi','karasu','gearbot','steamrat','sludge','kodama','ruinbot','kujira','mukade','jelly','gama']);
function spriteSlot(key,fn){
  if(slots3.has(key))return slots3.get(key);
  if(nslot3>=256){slots3.clear();nslot3=0;actx3.clearRect(0,0,1024,1024);}
  const i=nslot3++,sx=(i%16)*64,sy=Math.floor(i/16)*64,y0=F3.texH;
  const oTS=TS;TS=F3.TT;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,y0,64,64);
  const ft=ctx.fillText,st=ctx.strokeText;ctx.fillText=()=>{};ctx.strokeText=()=>{};
  try{fn(32,y0+38);}finally{ctx.fillText=ft;ctx.strokeText=st;TS=oTS;}
  ctx.clearRect(0,y0+48,64,16);
  actx3.clearRect(sx,sy,64,64);actx3.drawImage(cv,0,y0,64,64,sx,sy,64,64);stex3.needsUpdate=true;
  const s={u0:sx/1024,u1:(sx+64)/1024,v1:1-sy/1024,v0:1-(sy+64)/1024};slots3.set(key,s);return s;
}
function genericFoe(cx,cy,big){const s=TS*(big?1.3:1);ctx.fillStyle='#3A2E4A';ctx.beginPath();ctx.ellipse(cx,cy-s*.05,s*.34,s*.32,0,0,7);ctx.fill();
  ctx.fillStyle='#FF5A4F';ctx.fillRect(cx-s*.14,cy-s*.12,4,4);ctx.fillRect(cx+s*.08,cy-s*.12,4,4);}
/* 戦闘用：ボスなどの 大きな絵（戦闘画面の SVG） */
const svgAtlas3=document.createElement('canvas');svgAtlas3.width=512;svgAtlas3.height=512;const sctx3=svgAtlas3.getContext('2d');
const svgTex3=new THREE.CanvasTexture(svgAtlas3);svgTex3.encoding=THREE.sRGBEncoding;svgTex3.minFilter=THREE.LinearFilter;svgTex3.generateMipmaps=false;
const svgMat3=new THREE.MeshBasicMaterial({map:svgTex3,alphaTest:.4,side:THREE.DoubleSide});
const svgSlots3=new Map();let svgN3=0,svgBad3=false;
function svgSlot(kind){
  if(svgBad3||!SVG[kind])return null;
  if(svgSlots3.has(kind))return svgSlots3.get(kind);
  if(svgN3>=16)return null;
  const i=svgN3++,sx=(i%4)*128,sy=Math.floor(i/4)*128;
  const s={u0:sx/512,u1:(sx+128)/512,v1:1-sy/512,v0:1-(sy+128)/512,ready:false};svgSlots3.set(kind,s);
  const img=new Image();
  img.onload=()=>{try{sctx3.drawImage(img,sx,sy+26,128,102);sctx3.getImageData(sx,sy,1,1);s.ready=true;svgTex3.needsUpdate=true;}catch(_){svgBad3=true;sctx3.clearRect(0,0,512,512);}};
  img.onerror=()=>{svgBad3=true;};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 120" width="150" height="120">'+SVG[kind]+'</svg>');
  return s;
}
const teleG3=new THREE.CircleGeometry(1,40),teleRingG3=new THREE.RingGeometry(.9,1,48);
const telePool3=[];
function tele3(i,x,y,r,k,col){
  let t=telePool3[i];
  if(!t){const dm=new THREE.MeshBasicMaterial({color:'#ff463c',transparent:true,opacity:.25,depthWrite:false});const rm=new THREE.MeshBasicMaterial({color:'#ff6a5a',transparent:true,opacity:.95,depthWrite:false});
    const d=new THREE.Mesh(teleG3,dm),g=new THREE.Mesh(teleRingG3,rm),e=new THREE.Mesh(teleRingG3,rm);d.rotation.x=g.rotation.x=e.rotation.x=-Math.PI/2;
    t={d,g,e,dm,rm};telePool3[i]=t;world3.add(d,g,e);}
  const hh=Math.max(0,tileH3(Math.floor(x),Math.floor(y))||0)+.04;
  t.dm.color.set(col);t.rm.color.set(col);t.dm.opacity=.14+k*.24;
  t.d.position.set(x,hh,y);t.d.scale.set(r,r,1);t.e.position.set(x,hh+.01,y);t.e.scale.set(r,r,1);
  const kk=Math.max(.03,k);t.g.position.set(x,hh+.02,y);t.g.scale.set(r*kk,r*kk,1);
  t.d.visible=t.g.visible=t.e.visible=true;
}
const bbPool=[],shPool=[],chPool=[];
const shG3=new THREE.CircleGeometry(.3,16),shM3=new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.28,depthWrite:false});
const chG3=new THREE.BoxGeometry(.6,.42,.42);
function billboard(i,slot,x,y,lift,lean,sc,svg){
  sc=sc||1;
  let m=bbPool[i];
  if(!m){const g=new THREE.PlaneGeometry(2,2);g.translate(0,.5,0);m=new THREE.Mesh(g,smat3);bbPool[i]=m;world3.add(m);}
  const uv=m.geometry.attributes.uv;uv.setXY(0,slot.u0,slot.v1);uv.setXY(1,slot.u1,slot.v1);uv.setXY(2,slot.u0,slot.v0);uv.setXY(3,slot.u1,slot.v0);uv.needsUpdate=true;
  m.material=svg?svgMat3:smat3;m.scale.setScalar(sc);
  m.position.set(x,lift+(svg?.5*sc:0)+Math.max(0,tileH3(Math.floor(x),Math.floor(y))||0),y);m.rotation.set(-lean,0,0);m.visible=true;
  let s=shPool[i];if(!s){s=new THREE.Mesh(shG3,shM3);s.rotation.x=-Math.PI/2;shPool[i]=s;world3.add(s);}
  s.scale.setScalar(sc);s.position.set(x,.02+Math.max(0,tileH3(Math.floor(x),Math.floor(y))||0),y+.05);s.visible=true;
}
const personKey=o=>['p',o.col,o.hair,o.cape,o.dir|0,o.long?1:0,o.hood?1:0,o.crown?1:0,o.sword?1:0,o.small?1:0].join('|');

/* ---- サイズ ---- */
function resize(){
  const w=fbox.clientWidth||360;const h=Math.round(w*13/11);
  fbox.style.height=h+'px';cv.style.height=h+'px';
  const d=Math.min(2,window.devicePixelRatio||1);
  R3.setPixelRatio(d);R3.setSize(w,h,false);cam3.aspect=w/h;cam3.updateProjectionMatrix();
  ov3.width=Math.round(w*d);ov3.height=Math.round(h*d);F3.w=w;F3.h=h;F3.dpr=d;
  F3.mapName=null;
}
window.addEventListener('resize',()=>resize());

/* ---- 投影 ---- */
const _p3=new THREE.Vector3();
function proj3(x,h,y){_p3.set(x,h,y).project(cam3);return{x:(_p3.x+1)/2*F3.w,y:(1-_p3.y)/2*F3.h,ok:_p3.z<1};}

/* ---- 明るさ ---- */
function lightMode3(){
  const night=!!M.d.night,dim=!!M.d.dim;
  const bg=night?'#0b1026':dim?'#0b0a10':'#9fd3ef';
  scene3.background=new THREE.Color(bg);scene3.fog=new THREE.Fog(bg,night||dim?9:18,night||dim?22:34);
  hemi3.intensity=night?.28:dim?.5:.8;hemi3.color.set(night?'#8aa0ff':'#eaf4ff');
  sun3.intensity=night?.12:dim?.3:.8;
  F3.spriteBright=night?.62:dim?.85:1;F3.lampOn=night||dim;
}
function updateLamps3(){
  const src=[];const x0=Math.floor(G.px),y0=Math.floor(G.py);const on=fireOn();
  for(let y=Math.max(0,y0-8);y<Math.min(M.H,y0+9);y++)for(let x=Math.max(0,x0-8);x<Math.min(M.W,x0+9);x++){
    const c=M.t[y][x];if(((c==='L'||c==='s')&&on)||c==='O'||c==='j'||c==='Y'||c==='N')src.push([x,y,c,Math.hypot(x-x0,y-y0)]);}
  src.sort((a,b)=>a[3]-b[3]);
  lamps3.forEach((l,i)=>{const s=src[i];if(!s||!F3.lampOn){l.intensity=0;return;}
    l.position.set(s[0]+.5,s[2]==='L'?1.4:1.0,s[1]+.5);l.color.set(s[2]==='N'?'#8FD0FF':'#FFB35A');l.intensity=1.4;});
}

/* ---- 描画 ---- */
function draw(){
  const TT=F3.TT;
  // マップが変わった／キャンバスが外から変えられた
  const wantW=Math.max(M.W*TT,64),wantH=M.H*TT+64;
  if(F3.mapName!==M.name||cv.width!==wantW||cv.height!==wantH){
    cv.width=wantW;cv.height=wantH;F3.texW=wantW;F3.texH=M.H*TT;F3.mapName=M.name;F3.sig='';
    slots3.clear();nslot3=0;actx3.clearRect(0,0,1024,1024);lightMode3();F3.paintT=0;
  }
  // 地面の絵（0.2秒ごと）
  F3.paintT-=1/60;F3.tick++;
  if(F3.paintT<=0){F3.paintT=.2;const oTS=TS;TS=TT;ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;
    ctx.fillStyle='#000';ctx.fillRect(0,0,F3.texW,F3.texH);
    for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++)drawTile(M.t[y][x],x*TT,y*TT,x,y,perf);
    TS=oTS;gtex3.needsUpdate=true;}
  if(F3.tick%10===0||!F3.sig){const sig=M.t.map(r=>r.join('')).join('')+(G.flags.swampNight?1:0)+(fireOn()?1:0);if(sig!==F3.sig){F3.sig=sig;buildTerrain3();}}
  if(F3.tick%20===0)updateLamps3();

  // カメラ
  const cx=G.px,cz=G.py;
  const shk=typeof FT!=='undefined'&&FT&&FT.shake>0?FT.shake*.5:0;
  cam3.position.set(cx+(Math.random()-.5)*shk,10+(Math.random()-.5)*shk,cz+8.6);cam3.lookAt(cx,.4,cz-.2);cam3.updateMatrixWorld();
  sun3.position.set(cx+5,12,cz+7);sun3.target.position.set(cx,0,cz);sun3.target.updateMatrixWorld();
  plight3.position.set(cx,1.3,cz);plight3.intensity=(F3.lampOn?1.1:0)+(flame>0?1.4:0);
  if(!swordFlame3.parent)scene3.add(swordFlame3);swordFlame3.visible=flame>0&&M.d.puzzle&&!(typeof FT!=='undefined'&&FT);
  if(swordFlame3.visible){const fl=1+Math.sin(perf*18)*.12;swordFlame3.position.set(cx+.28,1.15+Math.max(0,tileH3(Math.floor(cx),Math.floor(cz))||0),cz);swordFlame3.scale.set(1,fl,1);}
  flameM3.opacity=.8+Math.sin(perf*14)*.12;wRingM3.opacity=flame>0?.6+Math.sin(perf*8)*.3:.3;

  // 人・まもの
  let n=0;const lean=.42,T=TS;
  const fighting=typeof FT!=='undefined'&&FT;let nt=0;
  visibleNpcs().forEach(o=>{let slot;
    if(o.sign)slot=spriteSlot('sign',(x,y)=>drawSign(x,y));
    else if(o.bear)slot=spriteSlot('bear',(x,y)=>drawBear(x,y));
    else slot=spriteSlot(personKey(o),(x,y)=>drawPerson(x,y,o));
    billboard(n++,slot,o.x,o.y,0,lean);});
  M.foes.forEach(f=>{if(!f.alive||(f.show&&!f.show()))return;if(fighting&&FT.foes.some(e=>e.f===f))return;const d=FOES[f.k];
    const slot=spriteSlot('f|'+d.svg+'|'+(f.k==='mouse'?1:0),(x,y)=>{if(FIELD_SVG.has(d.svg))drawFoe(f,x,y);else genericFoe(x,y,d.boss);});
    billboard(n++,slot,f.x,f.y,Math.abs(Math.sin(perf*5+f.x))*.08,lean);});
  if(fighting){
    for(const e of FT.foes){if(e.dead)continue;const d=e.d;let s=null,svg=false;
      if(d.boss||!FIELD_SVG.has(d.svg)){s=svgSlot(d.svg);if(s&&s.ready)svg=true;else s=null;}
      if(!s)s=spriteSlot('f|'+d.svg+'|'+(e.k==='mouse'?1:0),(x,y)=>{if(FIELD_SVG.has(d.svg))drawFoe(e.f,x,y);else genericFoe(x,y,d.boss);});
      const lift=(e.state==='stagger'||e.stun>0||e.frozen>0)?0:Math.abs(Math.sin(e.bob))*.08;
      billboard(n,s,e.x+(e.flash>0?(Math.random()-.5)*.08:0),e.y,lift,lean,svg?e.scale:e.scale*.9,svg);n++;
      if(e.state==='windup')tele3(nt++,e.ax,e.ay,e.rad,1-e.st/((e.it&&e.it.k==='big'?1.25:.8)+(d.boss?.2:0)),'#ff463c');
      else if(e.state==='charge')tele3(nt++,e.x,e.y,e.r+.5+Math.sin(perf*10)*.08,1,'#F5A623');
    }
    if(FT.loseAt&&FT.time>FT.loseAt-6){const k=Math.min(1,(FT.time-(FT.loseAt-6))/6);tele3(nt++,M.W/2,M.H/2,Math.max(M.W,M.H)*.6,k,'#4FA3FF');}
    const lk=FT.lock&&!FT.lock.dead?FT.lock:null;if(lk)tele3(nt++,lk.x,lk.y,lk.r+.35,1,'#FFD34D');
    FT.party.forEach((u,i)=>{const c=u.c;const o={col:c.col,hair:c.hair,cape:c.cape,dir:u.dir,sword:u.id==='leon',long:!!c.long};
      billboard(n,spriteSlot(personKey(o),(x,y)=>drawPerson(x,y,o)),u.x,u.y,u.hp<=0?-.35:(u.dodgeT>0?.1:0),u.hp<=0?1.35:lean);
      bbPool[n].visible=!(u.hurtT>0&&Math.floor(perf*30)%2);n++;});
  }else{
  const fol=G.follow||(G.party[1]||null);
  if(fol&&trail.length>14){const p=trail[trail.length-14];const c=CHARS[fol];const o={col:c.col,hair:c.hair,cape:c.cape,dir:p.d,long:fol==='lucia'};
    billboard(n++,spriteSlot(personKey(o),(x,y)=>drawPerson(x,y,o)),p.x,p.y,0,lean);}
  const blink=inv>0&&!scriptBusy&&Math.floor(perf*10)%2;
  {const hid=G.party[0]||'leon',c=CHARS[hid];const o={col:c.col,hair:c.hair,cape:c.cape,dir:G.dir,sword:hid==='leon',long:!!c.long};
    const moving=trail.length&&Math.hypot(trail[trail.length-1].x-G.px,trail[trail.length-1].y-G.py)<.2;
    billboard(n,spriteSlot(personKey(o),(x,y)=>drawPerson(x,y,o)),G.px,G.py,moving?Math.abs(Math.sin(perf*14))*.05:0,lean);
    bbPool[n].visible=!blink;n++;}
  }
  for(let i=nt;i<telePool3.length;i++){const t=telePool3[i];t.d.visible=t.g.visible=t.e.visible=false;}
  svgMat3.color.setScalar(F3.spriteBright||1);
  for(let i=n;i<bbPool.length;i++){bbPool[i].visible=false;shPool[i].visible=false;}
  smat3.color.setScalar(F3.spriteBright||1);
  // 宝箱
  const chs=chestList().filter(ch=>!G.chests[ch.flag]);
  chs.forEach((ch,i)=>{let m=chPool[i];if(!m){m=new THREE.Mesh(chG3,pmat3('#8B5A2B'));m.castShadow=true;chPool[i]=m;world3.add(m);}
    m.material=pmat3(ch.item?'#6B2E5E':'#8B5A2B');m.position.set(ch.x,.21,ch.y);m.visible=true;});
  for(let i=chs.length;i<chPool.length;i++)chPool[i].visible=false;

  R3.render(scene3,cam3);
  drawOverlay3();
}

/* ---- 上に重ねる 文字や演出 ---- */
function drawOverlay3(){
  const o=octx,w=F3.w,h=F3.h;o.setTransform(F3.dpr,0,0,F3.dpr,0,0);o.clearRect(0,0,w,h);
  const font=FONT();
  M.foes.forEach(f=>{if(!f.alive||(f.show&&!f.show()))return;if(typeof FT!=='undefined'&&FT&&FT.foes.some(e=>e.f===f))return;const d=FOES[f.k];const p=proj3(f.x,1.45,f.y);if(!p.ok)return;
    const diff=d.lv-G.L;const col=diff>=3?'#FF5A4F':diff<=-3?'#9AA3AD':'#FFFFFF';const label=(d.short||d.name)+' Lv'+d.lv;
    o.font='12px '+font;o.textAlign='center';o.lineWidth=3;o.strokeStyle='#000';o.strokeText(label,p.x,p.y);o.fillStyle=col;o.fillText(label,p.x,p.y);});
  visibleNpcs().forEach(nn=>{if(!nn.sleep)return;const p=proj3(nn.x,1.6,nn.y);const t=(perf%2)/2;o.font='12px '+font;o.textAlign='left';o.globalAlpha=1-t;
    o.lineWidth=3;o.strokeStyle='#000';o.strokeText('Z z',p.x+6,p.y-t*10);o.fillStyle='#FFF';o.fillText('Z z',p.x+6,p.y-t*10);o.globalAlpha=1;});
  if(M.d.puzzle){
    if(flame>0){const p=proj3(G.px,1.55,G.py);const f=Math.sin(perf*14)*2;o.fillStyle='#FF7A2F';o.beginPath();o.moveTo(p.x-5,p.y);o.lineTo(p.x,p.y-14+f);o.lineTo(p.x+5,p.y);o.fill();}
    const nn=flame>FL/2?2:flame>0?1:0;
    o.font='12px '+font;o.textAlign='left';o.fillStyle='rgba(0,0,0,.75)';o.fillRect(8,8,112,24);o.strokeStyle='#FFF';o.lineWidth=2;o.strokeRect(8,8,112,24);
    o.fillStyle='#FFF';o.fillText('剣の火',16,25);
    o.fillStyle='#444';o.fillRect(62,15,50,10);o.fillStyle=flame>FL*.3?'#FF7A2F':'#FFD34D';o.fillRect(62,15,50*Math.max(0,flame)/FL,10);o.fillStyle='rgba(0,0,0,.75)';o.fillRect(8,34,112,20);o.fillStyle=flame>0?'#FFD34D':'#9AA6BF';o.font='11px '+font;o.fillText(flame>0?'あと 約'+Math.ceil(flame/.55)+'マス':'火が ない',16,48);
  }
  if(joy&&joy.moved){o.strokeStyle='rgba(255,255,255,.6)';o.lineWidth=2;o.beginPath();o.arc(joy.ox,joy.oy,34,0,7);o.stroke();o.fillStyle='rgba(255,255,255,.5)';o.beginPath();o.arc(joy.ox+joy.dx*34,joy.oy+joy.dy*34,14,0,7);o.fill();}
  if(typeof FT!=='undefined'&&FT)fightOverlay(o,font);
  if(toastT&&toastT.text){const ty=h-52-(typeof FT!=='undefined'&&FT?50:0);o.font='14px '+font;o.textAlign='center';const tw=o.measureText(toastT.text).width+24;o.fillStyle='rgba(0,0,0,.8)';o.fillRect(w/2-tw/2,ty,tw,30);o.strokeStyle='#FFF';o.lineWidth=2;o.strokeRect(w/2-tw/2,ty,tw,30);o.fillStyle='#FFD34D';o.fillText(toastT.text,w/2,ty+20);}
  if(fx)drawFx3(o,w,h,font);
}
function wrap3(o,text,x,y,maxW,lh){const lines=[];let cur='';for(const ch of text){if(o.measureText(cur+ch).width>maxW){lines.push(cur);cur=ch;}else cur+=ch;}lines.push(cur);const y0=y-(lines.length-1)*lh/2;lines.forEach((l,i)=>o.fillText(l,x,y0+i*lh));}
function drawFx3(o,w,h,font){
  const t=fx.t;
  if(fx.type==='fade'){const a=Math.min(1,t/.5);o.fillStyle='rgba(0,0,0,'+a+')';o.fillRect(0,0,w,h);if(t>.4){o.globalAlpha=Math.min(1,(t-.4)/.5);o.fillStyle='#FFF';o.font='16px '+font;o.textAlign='center';wrap3(o,fx.text,w/2,h/2,w-40,24);o.globalAlpha=1;}}
  if(fx.type==='vision'){const a=Math.min(1,t/.6)*(t>2.6?Math.max(0,1-(t-2.6)/.5):1);o.globalAlpha=a;o.fillStyle='#0B1026';o.fillRect(0,0,w,h);
    o.fillStyle='#E8EEF5';for(let i=0;i<30;i++){o.fillRect((i*97)%w,(i*53)%(h*.5),2,2);}
    o.fillStyle='#1B2238';o.beginPath();o.ellipse(w/2,h*.95,w*.8,h*.45,0,Math.PI,0);o.fill();
    const fx0=w/2,fy=h*.5;o.fillStyle='#3A4260';o.fillRect(fx0-8,fy-10,16,36);o.fillStyle='#C9D1E0';o.fillRect(fx0-7,fy-24,14,14);o.fillRect(fx0-10,fy-28,20,8);o.fillStyle='#8A93A8';o.fillRect(fx0+10,fy-12,3,40);
    o.fillStyle='#FFF';o.font='13px '+font;o.textAlign='center';o.fillText('遠くの 丘の上に、銀の髪の 騎士が 立っている――',w/2,h*.2);o.globalAlpha=1;}
  if(fx.type==='title'){const a=Math.min(1,t/.8)*(t>3.2?Math.max(0,1-(t-3.2)/.6):1);o.globalAlpha=a;o.fillStyle='rgba(0,0,0,.72)';o.fillRect(0,0,w,h);o.fillStyle='#FFD34D';o.font='40px '+font;o.textAlign='center';o.fillText('七つの灯',w/2,h/2);o.fillStyle='#FFF';o.font='14px '+font;o.fillText('― Seven Lights ―',w/2,h/2+34);o.globalAlpha=1;}
}

/* 剣の火：歩ける距離を 約1.8倍に（3Dだと 距離感が つかみにくいため） */
const _engPuzzleTick=puzzleTick;
puzzleTick=function(moved){_engPuzzleTick(moved*.55);};

/* ===== ダンジョンの 進み具合を 残す =====
   割れ目を 石で ふさいだ（q→Q）・燭台に 火を灯した（o→O）は、全滅しても 再読み込みしても 消えない。 */
const KEEP_FROM=new Set(['q','o']);
const _engGetMap=getMap;
getMap=function(name){
  const fresh=!WORLD[name];const m=_engGetMap(name);
  if(fresh&&MAPS[name]){
    try{m.base=MAPS[name].build?MAPS[name].build():MAPS[name].rows.map(r=>r.split(''));}catch(_){m.base=null;}
    const keep=(G.tileKeep||{})[name]||[];
    keep.forEach(k=>{const [x,y,c]=k.split(',');const X=+x,Y=+y;if(m.t[Y]&&KEEP_FROM.has(m.base&&m.base[Y]&&m.base[Y][X])&&m.t[Y][X]===m.base[Y][X])m.t[Y][X]=c;});
  }
  return m;
};
let keepT=0;
function keepScan(dt){
  keepT-=dt;if(keepT>0||!M||!M.base)return;keepT=.5;
  const out=[];
  for(let y=0;y<M.H;y++)for(let x=0;x<M.W;x++){const b=M.base[y]&&M.base[y][x];if(KEEP_FROM.has(b)&&M.t[y][x]!==b&&(M.t[y][x]==='Q'||M.t[y][x]==='O'))out.push(x+','+y+','+M.t[y][x]);}
  const prev=((G.tileKeep||{})[M.name]||[]).join('|');
  if(out.join('|')!==prev&&out.length>=prev.split('|').filter(Boolean).length){G.tileKeep=G.tileKeep||{};G.tileKeep[M.name]=out;save();}
}
