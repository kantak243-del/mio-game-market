/* ===== ゲームデータ ===== */
const ELEM={
  '火':{len:2,fusion:'陽炎',res:'残り火'},
  '水':{len:3,fusion:'渦潮',res:'潤い'},
  '土':{len:4,fusion:'岩壁',res:'地脈'},
  '風':{len:1,fusion:'疾風',res:'追い風'},
  '光':{len:2,fusion:'閃光',res:'残光'},
  '氷':{len:2,fusion:'氷華',res:'冷気'},
  '闇':{len:3,fusion:'深淵',res:'影'}
};
const pk=(a,b)=>[a,b].sort().join('');
const REACT={};
REACT[pk('火','水')]='蒸気';REACT[pk('火','風')]='炎嵐';REACT[pk('水','土')]='泥沼';REACT[pk('風','土')]='砂嵐';REACT[pk('氷','水')]='凍結';REACT[pk('氷','火')]='霧散';REACT[pk('闇','光')]='明滅';
const DEX=['陽炎','炎嵐','蒸気','泥沼','砂嵐','凍結','氷華','崩し'];

const CHARS={
  leon:{name:'レオン',job:'ナイト',elem:'土',base:950,wtype:'sword',hair:'#1B1B1B',col:'#2E5AAC',cape:'#B23A48',cmds:[
    {n:'斬る',t:'atk',p:130,brk:true,d:'斬る系'},
    {n:'守る',t:'guard',d:'被ダメ半減'},
    {n:'残り火',t:'elem',e:'火',p:90,ember:true,d:'剣の火'},
    {n:'岩砕き',t:'elem',e:'土',p:110,d:'土'}]},
  lucia:{name:'ルシア',job:'王女',elem:'光',base:720,wtype:'rapier',hair:'#E8C45A',col:'#F4F1EA',cape:'#3D6FB6',cmds:[
    {n:'細剣',t:'atk',p:100,brk:true,d:'斬る系'},
    {n:'守る',t:'guard',d:'被ダメ半減'},
    {n:'はげます',t:'heal',p:90,d:'全体回復'},
    {n:'灯す',t:'elem',e:'光',p:120,req:'luciaLight',d:'光'},
    {n:'七色の灯',t:'elem',e:'光',p:240,req:'luciaAwake',d:'奥義・光'}]},
  rina:{name:'リナ',job:'魔導士',elem:'火',base:620,wtype:'staff',hair:'#C8553D',col:'#7B4B94',cmds:[
    {n:'火球',t:'elem',e:'火',p:150,d:'火'},
    {n:'杖打ち',t:'atk',p:60,brk:true,d:'斬る系'},
    {n:'小麦粉',t:'blind',d:'敵の攻撃を1回外す'},
    {n:'守る',t:'guard',d:'被ダメ半減'}]},
  sora:{name:'ソラ',job:'精霊使い',elem:'風',base:680,wtype:'dual',hair:'#B8D8C8',col:'#3E8E6E',cmds:[
    {n:'風刃',t:'elem',e:'風',p:110,d:'風'},
    {n:'火の粉',t:'elem',e:'火',p:90,d:'火'},
    {n:'双剣',t:'atk',p:90,brk:true,d:'斬る系'}]},
  mizuha:{name:'ミズハ',job:'神官',elem:'水',base:640,wtype:'rod',hair:'#3D6FB6',col:'#E8EEF5',cmds:[
    {n:'癒し',t:'heal',p:160,d:'全体回復'},
    {n:'水弾',t:'elem',e:'水',p:100,d:'水'},
    {n:'守る',t:'guard',d:'被ダメ半減'}]},
  kohaku:{name:'コハク',job:'侍',elem:'氷',base:820,wtype:'katana',hair:'#1B1B1B',col:'#3B4A7A',cmds:[
    {n:'居合',t:'atk',p:170,brk:true,d:'斬る系・強'},
    {n:'氷刃',t:'elem',e:'氷',p:120,d:'氷'},
    {n:'見切り',t:'guard',d:'被ダメ半減'}]},
  vega:{name:'ヴェガ',job:'空賊',elem:'闇',base:780,wtype:'cutlass',hair:'#8E2C3E',col:'#2B2B3A',long:true,cmds:[
    {n:'カトラス',t:'atk',p:130,brk:true,d:'斬る系'},
    {n:'影縫い',t:'elem',e:'闇',p:130,d:'闇'},
    {n:'煙幕',t:'blind',d:'敵の攻撃を1回外す'}]}
};
const STARTER={
  leon:[{type:'weapon',wtype:'sword',name:'戦士長の剣',ri:1,atk:10,opts:['剣に 残り火が 宿っている']},{type:'armor',name:'騎士のよろい',ri:0,def:10}],
  lucia:[{type:'weapon',wtype:'rapier',name:'王家の細剣',ri:1,atk:8},{type:'armor',name:'旅の外套',ri:0,def:6}],
  rina:[{type:'weapon',wtype:'staff',name:'見習いの杖',ri:0,atk:6},{type:'armor',name:'焦げたエプロン',ri:0,def:4}],
  sora:[{type:'weapon',wtype:'dual',name:'木の双剣',ri:0,atk:6},{type:'armor',name:'旅人の服',ri:0,def:5}],
  mizuha:[{type:'weapon',wtype:'rod',name:'神官のロッド',ri:0,atk:5},{type:'armor',name:'水の法衣',ri:0,def:7}],
  vega:[{type:'weapon',wtype:'cutlass',name:'黒鴉のカトラス',ri:2,atk:16},{type:'armor',name:'空賊のコート',ri:1,def:10}],
  kohaku:[{type:'weapon',wtype:'katana',name:'師範代の刀',ri:1,atk:12},{type:'armor',name:'藍染めの道着',ri:0,def:8}]
};

const A=(k,n,p,d)=>({k,n,p,d});
const FOES={
  mouse:{name:'地下ねずみ',fixed:true,lv:1,hp:260,cycle:[[A('single','かじる',45,'1人に攻撃'),A('single','かじる',45,'1人に攻撃')]],bg:'cave',svg:'rat'},
  beetle:{name:'灰かぶり虫',fixed:true,lv:3,hp:700,boss:true,cycle:[[A('charge','ためる',0,'大技の準備'),A('big','灰たいあたり',150,'全体に大ダメ')],[A('single','かみつく',70,'1人に攻撃'),A('single','かみつく',70,'1人に攻撃')]],bg:'cave',svg:'beetle'},
  rat:{name:'灰ねずみ',lv:4,hp:700,cycle:[[A('single','かじる',90,'1人に攻撃'),A('single','かじる',90,'1人に攻撃')]],bg:'field',svg:'rat'},
  weed:{name:'ぷるぷる草',lv:7,hp:1300,cycle:[[A('all','しびれ粉',50,'全体に攻撃'),A('single','つる',120,'1人に攻撃')],[A('charge','ためる',0,'大技の準備'),A('big','大つる',160,'全体に大ダメ')]],bg:'field',svg:'weed'},
  hare:{name:'角うさぎ',lv:9,hp:1600,cycle:[[A('single','突進',150,'1人に強打'),A('single','突進',150,'1人に強打')],[A('charge','ためる',0,'大技の準備'),A('big','大突進',200,'全体に大ダメ')]],bg:'field',svg:'hare'},
  boar:{name:'草原のヌシ 大角イノシシ',short:'大角イノシシ',lv:14,hp:3400,boss:true,angry:true,cycle:[[A('single','突進',190,'1人に強打'),A('all','地ならし',110,'全体に攻撃')],[A('charge','ためる',0,'大技の準備'),A('big','猛突進',280,'全体に大ダメ')],[A('all','地ならし',110,'全体に攻撃'),A('single','突進',190,'1人に強打')]],bg:'field',svg:'boar'},
  ash:{name:'古炉の番人 灰喰らい',short:'灰喰らい',lv:12,hp:3400,boss:true,angry:true,cycle:[[A('all','灰まき',90,'全体に攻撃'),A('water','火喰い',60,'全体 火を消す')],[A('charge','灰を吸う',0,'大技の準備'),A('big','灰の嵐',260,'全体に大ダメ')],[A('single','かみつく',200,'1人に強打'),A('water','火喰い',60,'全体 火を消す')]],bg:'cave',svg:'ash'},
  crab:{name:'干潟ガニ',lv:11,hp:1500,cycle:[[A('single','ハサミ',160,'1人に強打'),A('single','ハサミ',160,'1人に強打')],[A('charge','ためる',0,'大技の準備'),A('big','泡の渦',190,'全体に大ダメ')]],bg:'sea',svg:'crab'},
  jelly:{name:'ひからびクラゲ',lv:12,hp:1400,cycle:[[A('all','しびれ触手',90,'全体に攻撃'),A('single','からみつく',140,'1人に攻撃')]],bg:'sea',svg:'jelly'},
  crabking:{name:'干潟の主 大王ガニ',short:'大王ガニ',lv:16,hp:3800,boss:true,angry:true,cycle:[[A('single','大バサミ',220,'1人に強打'),A('all','泡しぶき',120,'全体に攻撃')],[A('charge','甲羅を 鳴らす',0,'大技の準備'),A('big','潮津波',300,'全体に大ダメ')],[A('all','砂かけ',100,'全体に攻撃'),A('single','大バサミ',220,'1人に強打')]],bg:'sea',svg:'crabking'},
  kraken:{name:'深海の主 クラーケン',short:'クラーケン',fixed:true,unkillable:true,loseTurn:3,lv:40,hp:9999,boss:true,cycle:[[A('all','触手なぎ',260,'全体に攻撃'),A('single','しめつけ',420,'1人に強打'),],[A('charge','大渦を 呼ぶ',0,'大技の準備'),A('big','大渦',520,'全体に大ダメ')]],bg:'deck',svg:'kraken'},
  kappa:{name:'いたずらカッパ',lv:11,hp:1500,cycle:[[A('single','すもう',150,'1人に強打'),A('water','水かけ',70,'全体 火を消す')],[A('single','すもう',150,'1人に強打'),A('single','皿アタック',130,'1人に攻撃')]],bg:'beach',svg:'kappa'},
  tanuki:{name:'化けだぬき',lv:12,hp:1700,cycle:[[A('single','腹つづみ',140,'1人に攻撃'),A('single','ひっかき',140,'1人に攻撃')],[A('charge','化ける',0,'大技の準備'),A('big','大だぬき落とし',230,'全体に大ダメ')]],bg:'bamboo',svg:'tanuki'},
  kitsunebi:{name:'狐火',lv:12,hp:1400,cycle:[[A('single','ひのこ',130,'1人に攻撃'),A('single','ひのこ',130,'1人に攻撃')],[A('all','まぼろし',90,'全体に攻撃'),A('single','ひのこ',130,'1人に攻撃')]],bg:'bamboo',svg:'kitsunebi'},
  fox:{name:'稲荷の森の 化け狐',short:'化け狐',lv:15,hp:3600,boss:true,angry:true,cycle:[[A('single','爪',200,'1人に強打'),A('all','狐火の輪',110,'全体に攻撃')],[A('charge','尾を ふくらませる',0,'大技の準備'),A('big','九尾の まぼろし',300,'全体に大ダメ')],[A('single','爪',200,'1人に強打'),A('single','かみつき',180,'1人に攻撃')]],bg:'bamboo',svg:'fox'},
  namazu:{name:'水守の池の 大ナマズ',short:'大ナマズ',lv:15,hp:3800,boss:true,angry:true,cycle:[[A('all','地鳴り',120,'全体に攻撃'),A('single','体当たり',230,'1人に強打')],[A('charge','ひげを 震わせる',0,'大技の準備'),A('big','大ゆれ',320,'全体に大ダメ')],[A('single','体当たり',230,'1人に強打'),A('all','泥しぶき',110,'全体に攻撃')]],bg:'pond',svg:'namazu'},
  itachi:{name:'つむじイタチ',lv:13,hp:1500,cycle:[[A('single','かまいたち',150,'1人に強打'),A('single','かまいたち',150,'1人に強打')],[A('all','つむじ風',100,'全体に攻撃'),A('single','かみつき',130,'1人に攻撃')]],bg:'highland',svg:'itachi'},
  kamaitachi:{name:'風喰らいの 大かまいたち',short:'大かまいたち',lv:16,hp:3800,boss:true,angry:true,cycle:[[A('single','真空の 爪',230,'1人に強打'),A('all','風を 喰らう',120,'全体に攻撃')],[A('charge','風を 溜める',0,'大技の準備'),A('big','大旋風',320,'全体に大ダメ')],[A('single','真空の 爪',230,'1人に強打'),A('single','かみつき',200,'1人に攻撃')]],bg:'highland',svg:'kamaitachi'},
  yamaoni:{name:'山の 荒くれ 山鬼',short:'山鬼',lv:16,hp:4000,boss:true,angry:true,cycle:[[A('single','金棒',240,'1人に強打'),A('all','地団駄',120,'全体に攻撃')],[A('charge','金棒を 振りかぶる',0,'大技の準備'),A('big','鬼の 一撃',340,'全体に大ダメ')],[A('single','金棒',240,'1人に強打'),A('single','つかみ',200,'1人に攻撃')]],bg:'highland',svg:'yamaoni'},
  karasu:{name:'はぐれ烏天狗',lv:15,hp:1800,cycle:[[A('single','くちばし',170,'1人に強打'),A('all','羽ばたき',100,'全体に攻撃')],[A('charge','錫杖を 構える',0,'大技の準備'),A('big','天狗礫',240,'全体に大ダメ')]],bg:'peak',svg:'karasu'},
  nagi:{name:'風の祭壇の主 凪の大鴉',short:'凪の大鴉',lv:18,hp:5200,boss:true,angry:true,cycle:[[A('charge','黒い 翼を 広げる',0,'大技の準備'),A('big','凪ぎ払い',330,'全体に大ダメ')],[A('single','くちばし',260,'1人に強打'),A('all','羽根の 雨',140,'全体に攻撃')],[A('charge','鳴き声を 溜める',0,'大技の準備'),A('big','凪の 叫び',360,'全体に大ダメ')],[A('single','つかみ',240,'1人に強打'),A('single','くちばし',260,'1人に強打')]],bg:'peak',svg:'nagi'},
  gearbot:{name:'歯車ゴーレム',lv:17,hp:2000,cycle:[[A('single','鉄拳',180,'1人に強打'),A('charge','蒸気を 溜める',0,'大技の準備')],[A('big','蒸気噴射',230,'全体に大ダメ'),A('single','鉄拳',180,'1人に強打')]],bg:'city',svg:'gearbot'},
  steamrat:{name:'蒸気ネズミ',lv:16,hp:1600,cycle:[[A('single','かじる',150,'1人に攻撃'),A('water','湯気',80,'全体 火を消す')],[A('single','かじる',150,'1人に攻撃'),A('all','ボイラー破裂',110,'全体に攻撃')]],bg:'city',svg:'steamrat'},
  sludge:{name:'残りスライム',lv:18,hp:2200,cycle:[[A('all','残りの しぶき',120,'全体に攻撃'),A('single','のしかかり',190,'1人に強打')],[A('charge','ふくれる',0,'大技の準備'),A('big','はじける 残り',260,'全体に大ダメ')]],bg:'archive',svg:'sludge'},
  zanshiX:{name:'残滓の 巨獣',short:'残滓の巨獣',fixed:true,unkillable:true,loseTurn:2,lv:40,hp:9999,boss:true,cycle:[[A('all','残りの 奔流',300,'全体に攻撃'),A('single','押しつぶし',450,'1人に強打')],[A('charge','千年分の 残りを 吸う',0,'大技の準備'),A('big','崩壊',600,'全体に大ダメ')]],bg:'archive',svg:'zanshi'},
  zanshi:{name:'残滓の 巨獣',short:'残滓の巨獣',lv:22,hp:7200,boss:true,angry:true,cycle:[[A('all','残りの 奔流',150,'全体に攻撃'),A('single','押しつぶし',280,'1人に強打')],[A('charge','残りを 吸う',0,'大技の準備'),A('big','崩壊',360,'全体に大ダメ')],[A('single','押しつぶし',280,'1人に強打'),A('all','残りの しぶき',140,'全体に攻撃')]],bg:'archive',svg:'zanshi'},
  kodama:{name:'色なし木霊',lv:21,hp:2300,cycle:[[A('all','ざわめき',130,'全体に攻撃'),A('single','根の 鞭',210,'1人に強打')],[A('single','根の 鞭',210,'1人に強打'),A('all','ざわめき',130,'全体に攻撃')]],bg:'forest',svg:'kodama'},
  ruinbot:{name:'遺跡の 番兵',lv:22,hp:2600,cycle:[[A('single','石の 拳',230,'1人に強打'),A('charge','目が 光る',0,'大技の準備')],[A('big','光線',280,'全体に大ダメ'),A('single','石の 拳',230,'1人に強打')]],bg:'forest',svg:'ruinbot'},
  noah1:{name:'千年の騎士 ノア',short:'ノア',lv:30,hp:6000,boss:true,angry:true,cycle:[[A('single','古剣',260,'1人に強打'),A('all','残りの 波',150,'全体に攻撃')]],bg:'heart',svg:'noah'},
  noah2:{name:'千年の騎士 ノア',short:'ノア',lv:30,hp:5000,boss:true,tailwind:true,cycle:[[A('single','古剣',240,'1人に強打'),A('charge','千年分の 残りを 構える',0,'大技の準備')],[A('big','千年の 重み',340,'全体に大ダメ'),A('all','残りの 波',150,'全体に攻撃')]],bg:'heart',svg:'noah'},
  noah3:{name:'千年の騎士 ノア',short:'ノア',lv:30,hp:1,fixed:true,boss:true,link:true,cycle:[[A('single','……',1,'剣を 下ろしている'),A('single','……',1,'ただ 立っている')]],bg:'heart',svg:'noah'},
  rat2:{name:'枯れ野ネズミ',lv:20,hp:2100,cycle:[[A('single','かじる',190,'1人に攻撃'),A('single','かじる',190,'1人に攻撃')],[A('all','砂けむり',130,'全体に攻撃'),A('single','かじる',190,'1人に攻撃')]],bg:'field',svg:'rat'},
  boar2:{name:'荒れ地の イノシシ',lv:22,hp:2600,cycle:[[A('single','突進',240,'1人に強打'),A('all','地ならし',140,'全体に攻撃')],[A('charge','ためる',0,'大技の準備'),A('big','猛突進',300,'全体に大ダメ')]],bg:'field',svg:'boar'},
  moguraou:{name:'大地喰らいの モグラ王',short:'モグラ王',lv:25,hp:6500,boss:true,angry:true,cycle:[[A('single','爪',280,'1人に強打'),A('all','地割れ',160,'全体に攻撃')],[A('charge','地中に もぐる',0,'大技の準備'),A('big','大噴出',360,'全体に大ダメ')],[A('water','泥水',100,'全体 火を消す'),A('single','爪',280,'1人に強打')]],bg:'cave',svg:'mole'},
  snowhare:{name:'止まり雪うさぎ',lv:21,hp:2300,cycle:[[A('single','突進',210,'1人に強打'),A('single','突進',210,'1人に強打')],[A('charge','ためる',0,'大技の準備'),A('big','雪崩突進',280,'全体に大ダメ')]],bg:'snow',svg:'hare'},
  icewisp:{name:'凍て鬼火',lv:22,hp:2400,cycle:[[A('all','冷気',150,'全体に攻撃'),A('single','氷のつぶて',220,'1人に強打')]],bg:'snow',svg:'kitsunebi'},
  yukiookami:{name:'白雪嶺の主 雪狼',short:'雪狼',lv:25,hp:6500,boss:true,angry:true,cycle:[[A('single','牙',290,'1人に強打'),A('all','吹雪',160,'全体に攻撃')],[A('charge','遠吠え',0,'大技の準備'),A('big','白き 牙の 嵐',370,'全体に大ダメ')],[A('single','牙',290,'1人に強打'),A('single','爪',250,'1人に攻撃')]],bg:'snow',svg:'wolf'},
  fumin:{name:'眠らずの 機兵',short:'眠らずの機兵',lv:25,hp:6500,boss:true,angry:true,cycle:[[A('single','鉄槌',280,'1人に強打'),A('all','投光',160,'全体に攻撃')],[A('charge','炉を 燃やす',0,'大技の準備'),A('big','白夜の 砲',370,'全体に大ダメ')],[A('all','投光',160,'全体に攻撃'),A('single','鉄槌',280,'1人に強打')]],bg:'archive',svg:'gearbot'},
  kohakuDuel:{name:'師範代 コハク',short:'コハク',fixed:true,lv:13,hp:1300,cycle:[[A('single','払い',110,'1人に攻撃'),A('charge','居合の 構え',0,'大技の準備')],[A('big','抜刀・雪月',380,'全体に大ダメ'),A('single','払い',110,'1人に攻撃')]],bg:'bamboo',svg:'kohaku'},
  gama:{name:'沼のヌシ ガマ大王',short:'ガマ大王',lv:22,hp:6000,boss:true,angry:true,cycle:[[A('single','舌打ち',210,'1人に強打'),A('water','水鉄砲',80,'全体 火を消す')],[A('charge','溜め',0,'大技の準備'),A('big','大跳躍',300,'全体に大ダメ')],[A('water','水鉄砲',80,'全体 火を消す'),A('single','舌打ち',210,'1人に強打')]],bg:'swamp',svg:'gama'}
};

/* 装備 */
const SLOTS=['weapon','armor','acc'];
const SLOT_JP={weapon:'ぶき',armor:'よろい',acc:'かざり'};
const WT_JP={cutlass:'カトラス',katana:'刀',sword:'剣',staff:'杖',dual:'双剣',rod:'ロッド',rapier:'細剣'};
const RAR=[{n:'コモン',c:'--muted'},{n:'アンコモン',c:'--wind'},{n:'レア',c:'--water'},{n:'エピック',c:'--enemy'},{n:'レジェンド',c:'--hot'}];
const NAMES={
  sword:['鉄の剣','草原の剣','銀騎士の剣','角の長剣','灯火の剣'],
  staff:['樫の杖','こむぎの杖','灯火の杖','星見の杖','炎紋の杖'],
  dual:['鉄の双剣','疾風の双剣','角うさぎの双剣','風鳴りの双剣'],
  rod:['銀のロッド','潮騒のロッド','泉のロッド','癒し手のロッド'],
  cutlass:['鉄のカトラス','空賊の曲刀'],
  katana:['打刀','桜吹雪','雪月','潮鳴り'],
  rapier:['銀の細剣','薔薇の細剣','月影の細剣','王冠の細剣'],
  armor:['革のよろい','草原のマント','鉄のよろい','ヌシの毛皮','銀のくさりかたびら','灯火のローブ'],
  acc:['草原の紋章','こむぎの紋章','灯火の紋章','角うさぎの紋章','ヌシの紋章','銀騎士の紋章']
};

/* 敵の絵 */
const SVG={
  crab:'<ellipse cx="75" cy="112" rx="55" ry="6" fill="#00000033"/><path d="M30 60 L15 40 L35 45 Z M120 60 L135 40 L115 45 Z" fill="#D2553D"/><ellipse cx="75" cy="82" rx="48" ry="28" fill="#D2553D"/><circle cx="60" cy="58" r="6" fill="#FFF"/><circle cx="90" cy="58" r="6" fill="#FFF"/><circle cx="60" cy="58" r="3" fill="#111"/><circle cx="90" cy="58" r="3" fill="#111"/><path d="M35 100 L22 112 M50 106 L42 116 M115 100 L128 112 M100 106 L108 116" stroke="#A8432F" stroke-width="4"/>',
  jelly:'<ellipse cx="75" cy="114" rx="45" ry="5" fill="#00000033"/><path d="M35 70 Q75 10 115 70 Z" fill="#C7B3E6"/><path d="M45 70 Q48 95 42 110 M60 70 Q62 98 58 112 M75 70 Q75 100 75 112 M90 70 Q88 98 92 112 M105 70 Q102 95 108 110" fill="none" stroke="#B19CD9" stroke-width="4"/><circle cx="62" cy="52" r="4" fill="#4B2E83"/><circle cx="88" cy="52" r="4" fill="#4B2E83"/>',
  crabking:'<ellipse cx="75" cy="114" rx="68" ry="7" fill="#00000044"/><path d="M18 60 L2 26 L30 38 Z M132 60 L148 26 L120 38 Z" fill="#B03A2E"/><ellipse cx="75" cy="80" rx="62" ry="34" fill="#B03A2E"/><path d="M30 70 Q75 40 120 70" fill="none" stroke="#8E2C22" stroke-width="5"/><circle cx="58" cy="52" r="8" fill="#FFF"/><circle cx="92" cy="52" r="8" fill="#FFF"/><circle cx="58" cy="52" r="4" fill="#111"/><circle cx="92" cy="52" r="4" fill="#111"/><polygon points="60,40 64,26 70,36 75,22 80,36 86,26 90,40" fill="#F2C230"/>',
  rat:'<ellipse cx="75" cy="112" rx="50" ry="6" fill="#00000033"/><path d="M110 90 Q140 80 138 60" fill="none" stroke="#C7A1A1" stroke-width="4"/><ellipse cx="75" cy="85" rx="45" ry="28" fill="#8A8A8A"/><circle cx="45" cy="55" r="14" fill="#8A8A8A"/><circle cx="105" cy="55" r="14" fill="#8A8A8A"/><circle cx="45" cy="55" r="7" fill="#E7B3B3"/><circle cx="105" cy="55" r="7" fill="#E7B3B3"/><circle cx="62" cy="78" r="4" fill="#111"/><circle cx="88" cy="78" r="4" fill="#111"/><circle cx="75" cy="90" r="4" fill="#E7B3B3"/>',
  beetle:'<ellipse cx="75" cy="112" rx="55" ry="6" fill="#00000044"/><path d="M40 60 L20 40 M110 60 L130 40" stroke="#3A3A3A" stroke-width="5"/><ellipse cx="75" cy="80" rx="52" ry="34" fill="#5E5A55"/><path d="M75 48 L75 112" stroke="#3A3632" stroke-width="3"/><circle cx="55" cy="70" r="6" fill="#FF7A2F"/><circle cx="95" cy="70" r="6" fill="#FF7A2F"/><circle cx="40" cy="95" r="4" fill="#8A847C"/><circle cx="110" cy="92" r="5" fill="#8A847C"/>',
  weed:'<ellipse cx="75" cy="112" rx="45" ry="6" fill="#00000033"/><path d="M75 60 Q60 20 40 30 M75 60 Q95 15 115 28" fill="none" stroke="#3E8E41" stroke-width="6"/><circle cx="75" cy="82" r="32" fill="#4FB05A"/><circle cx="63" cy="78" r="4" fill="#111"/><circle cx="87" cy="78" r="4" fill="#111"/><path d="M62 92 Q75 100 88 92" fill="none" stroke="#111" stroke-width="3"/><circle cx="115" cy="28" r="8" fill="#FF9EC7"/>',
  hare:'<ellipse cx="75" cy="112" rx="45" ry="6" fill="#00000033"/><rect x="52" y="10" width="12" height="45" rx="6" fill="#F4F1EA"/><rect x="86" y="10" width="12" height="45" rx="6" fill="#F4F1EA"/><ellipse cx="75" cy="82" rx="38" ry="30" fill="#F4F1EA"/><polygon points="70,58 75,28 80,58" fill="#E0A526"/><circle cx="62" cy="78" r="4" fill="#C0392B"/><circle cx="88" cy="78" r="4" fill="#C0392B"/>',
  boar:'<ellipse cx="75" cy="114" rx="62" ry="6" fill="#00000033"/><ellipse cx="75" cy="78" rx="62" ry="36" fill="#7A4E2D"/><path d="M40 50 L55 60 M110 50 L95 60" stroke="#5A3820" stroke-width="6"/><ellipse cx="75" cy="92" rx="22" ry="14" fill="#A0714A"/><circle cx="68" cy="92" r="3" fill="#111"/><circle cx="82" cy="92" r="3" fill="#111"/><polygon points="50,95 30,70 58,88" fill="#F4F1EA"/><polygon points="100,95 120,70 92,88" fill="#F4F1EA"/><circle cx="55" cy="70" r="5" fill="#111"/><circle cx="95" cy="70" r="5" fill="#111"/>',
  ash:'<ellipse cx="75" cy="114" rx="60" ry="6" fill="#00000055"/><path d="M20 100 Q15 50 45 30 Q75 5 105 30 Q135 50 130 100 Z" fill="#5A5550"/><path d="M30 100 Q40 70 55 90 Q70 60 80 92 Q95 65 105 90 Q115 72 122 100 Z" fill="#3E3A36"/><circle cx="58" cy="55" r="9" fill="#FF7A2F"/><circle cx="92" cy="55" r="9" fill="#FF7A2F"/><circle cx="58" cy="55" r="4" fill="#FFD34D"/><circle cx="92" cy="55" r="4" fill="#FFD34D"/><path d="M55 78 L62 72 L68 80 L75 72 L82 80 L88 72 L95 78" fill="none" stroke="#1B1B1B" stroke-width="3"/>',
  kraken:'<ellipse cx="75" cy="118" rx="74" ry="6" fill="#00000055"/><path d="M8 120 Q0 70 22 60 Q30 90 30 120 Z M142 120 Q150 70 128 60 Q120 90 120 120 Z" fill="#6B2E5E"/><path d="M40 120 Q30 90 45 80 L55 120 Z M110 120 Q120 90 105 80 L95 120 Z" fill="#7E3A70"/><ellipse cx="75" cy="58" rx="46" ry="52" fill="#8E4A80"/><circle cx="56" cy="62" r="11" fill="#F2C230"/><circle cx="94" cy="62" r="11" fill="#F2C230"/><rect x="53" y="54" width="6" height="16" fill="#111"/><rect x="91" y="54" width="6" height="16" fill="#111"/><circle cx="62" cy="28" r="5" fill="#B06AA0"/><circle cx="86" cy="22" r="4" fill="#B06AA0"/>',
  kappa:'<ellipse cx="75" cy="114" rx="42" ry="6" fill="#00000033"/><ellipse cx="75" cy="86" rx="34" ry="28" fill="#5DA05A"/><ellipse cx="75" cy="92" rx="18" ry="16" fill="#E9E2B0"/><circle cx="75" cy="48" r="26" fill="#5DA05A"/><ellipse cx="75" cy="28" rx="20" ry="7" fill="#DDEFF7" stroke="#8CB8CC" stroke-width="2"/><circle cx="66" cy="50" r="4" fill="#111"/><circle cx="84" cy="50" r="4" fill="#111"/><path d="M68 60 L75 66 L82 60 Z" fill="#F2C230"/>',
  tanuki:'<ellipse cx="75" cy="114" rx="46" ry="6" fill="#00000033"/><ellipse cx="75" cy="84" rx="40" ry="32" fill="#8A6A48"/><ellipse cx="75" cy="92" rx="24" ry="20" fill="#E8D9B5"/><circle cx="75" cy="44" r="26" fill="#8A6A48"/><circle cx="54" cy="24" r="8" fill="#6B4E32"/><circle cx="96" cy="24" r="8" fill="#6B4E32"/><ellipse cx="64" cy="46" rx="9" ry="7" fill="#3A2A1C"/><ellipse cx="86" cy="46" rx="9" ry="7" fill="#3A2A1C"/><circle cx="64" cy="46" r="3" fill="#FFF"/><circle cx="86" cy="46" r="3" fill="#FFF"/><ellipse cx="75" cy="36" rx="7" ry="4" fill="#5DA05A"/>',
  kohaku:'<ellipse cx="75" cy="116" rx="36" ry="5" fill="#00000033"/><rect x="52" y="54" width="46" height="58" rx="6" fill="#3B4A7A"/><rect x="52" y="90" width="46" height="22" fill="#2B3558"/><rect x="58" y="22" width="34" height="32" rx="4" fill="#F2C9A0"/><rect x="56" y="16" width="38" height="12" fill="#1B1B1B"/><rect x="88" y="10" width="10" height="26" fill="#1B1B1B"/><rect x="64" y="36" width="5" height="6" fill="#111"/><rect x="81" y="36" width="5" height="6" fill="#111"/><rect x="100" y="40" width="5" height="70" fill="#D8DEE9" transform="rotate(20 102 75)"/><rect x="96" y="92" width="12" height="5" fill="#C9A227" transform="rotate(20 102 75)"/>',
  kitsunebi:'<ellipse cx="75" cy="116" rx="30" ry="4" fill="#00000022"/><path d="M75 20 Q110 60 95 90 Q75 115 55 90 Q40 60 75 20 Z" fill="#7FC8FF" opacity=".85"/><path d="M75 45 Q95 70 85 88 Q75 100 65 88 Q56 70 75 45 Z" fill="#E6F6FF"/><circle cx="68" cy="78" r="4" fill="#123"/><circle cx="82" cy="78" r="4" fill="#123"/>',
  fox:'<ellipse cx="75" cy="116" rx="60" ry="6" fill="#00000033"/><path d="M110 100 Q150 70 140 30 Q130 60 112 70 Z M112 95 Q155 90 150 55 Q138 80 116 82 Z" fill="#F4E3C0"/><ellipse cx="72" cy="86" rx="40" ry="26" fill="#E8A04A"/><circle cx="58" cy="52" r="26" fill="#E8A04A"/><path d="M36 38 L40 10 L54 30 Z M66 30 L78 8 L82 36 Z" fill="#E8A04A"/><path d="M42 58 L58 64 L42 70 Z" fill="#F4E3C0"/><path d="M48 50 L56 48 M64 48 L72 50" stroke="#222" stroke-width="3"/><circle cx="36" cy="60" r="3" fill="#222"/><path d="M60 30 L64 22 L68 30 Z" fill="#C8553D"/>',
  namazu:'<ellipse cx="75" cy="116" rx="68" ry="6" fill="#00000033"/><ellipse cx="75" cy="82" rx="66" ry="30" fill="#5A5E6B"/><ellipse cx="75" cy="92" rx="48" ry="16" fill="#A7A9B0"/><path d="M20 80 Q-2 60 4 40 M20 86 Q0 96 2 116 M130 80 Q152 60 146 40 M130 86 Q150 96 148 116" fill="none" stroke="#3E4150" stroke-width="4"/><circle cx="50" cy="70" r="7" fill="#F2C230"/><circle cx="100" cy="70" r="7" fill="#F2C230"/><circle cx="50" cy="70" r="3" fill="#111"/><circle cx="100" cy="70" r="3" fill="#111"/><path d="M50 92 Q75 104 100 92" fill="none" stroke="#2B2E38" stroke-width="4"/>',
  itachi:'<ellipse cx="75" cy="116" rx="44" ry="5" fill="#00000033"/><path d="M30 100 Q20 70 50 70 L100 70 Q125 70 118 96 Z" fill="#C9B38A"/><circle cx="104" cy="60" r="18" fill="#C9B38A"/><circle cx="110" cy="56" r="3" fill="#111"/><path d="M28 96 Q8 60 30 40" fill="none" stroke="#C9B38A" stroke-width="8"/><path d="M60 110 L50 120 M90 110 L100 120" stroke="#8A7555" stroke-width="4"/>',
  kamaitachi:'<ellipse cx="75" cy="116" rx="64" ry="6" fill="#00000033"/><path d="M8 40 Q40 60 30 100 M140 30 Q110 60 124 98" fill="none" stroke="#DDEFF7" stroke-width="5" opacity=".7"/><ellipse cx="75" cy="84" rx="46" ry="26" fill="#B89A6A"/><circle cx="75" cy="50" r="24" fill="#B89A6A"/><path d="M58 32 L54 16 L66 28 Z M92 32 L96 16 L84 28 Z" fill="#B89A6A"/><circle cx="66" cy="50" r="4" fill="#C8303D"/><circle cx="84" cy="50" r="4" fill="#C8303D"/><path d="M20 100 L6 70 L28 88 Z M130 100 L144 70 L122 88 Z" fill="#D8DEE9"/>',
  yamaoni:'<ellipse cx="75" cy="118" rx="56" ry="6" fill="#00000033"/><rect x="42" y="56" width="66" height="58" rx="10" fill="#C8553D"/><rect x="42" y="92" width="66" height="14" fill="#E0A526"/><rect x="48" y="96" width="8" height="8" fill="#1B1B1B"/><rect x="66" y="96" width="8" height="8" fill="#1B1B1B"/><rect x="84" y="96" width="8" height="8" fill="#1B1B1B"/><circle cx="75" cy="40" r="26" fill="#C8553D"/><path d="M58 20 L54 4 L66 16 Z M92 20 L96 4 L84 16 Z" fill="#F4F1EA"/><circle cx="66" cy="40" r="5" fill="#FFF"/><circle cx="84" cy="40" r="5" fill="#FFF"/><circle cx="66" cy="40" r="2" fill="#111"/><circle cx="84" cy="40" r="2" fill="#111"/><path d="M64 54 L68 50 L72 54 L78 50 L82 54 L86 50" fill="none" stroke="#FFF" stroke-width="2"/><rect x="112" y="30" width="12" height="80" rx="5" fill="#4A4038" transform="rotate(15 118 70)"/>',
  karasu:'<ellipse cx="75" cy="116" rx="44" ry="5" fill="#00000033"/><path d="M20 70 L60 60 L55 90 Z M130 70 L90 60 L95 90 Z" fill="#2B2B3A"/><rect x="55" y="56" width="40" height="52" rx="8" fill="#3D6FB6"/><circle cx="75" cy="44" r="18" fill="#2B2B3A"/><path d="M75 44 L100 52 L75 56 Z" fill="#E0A526"/><circle cx="70" cy="40" r="3" fill="#FFF"/><rect x="104" y="30" width="4" height="80" fill="#C9A227"/>',
  nagi:'<ellipse cx="75" cy="118" rx="70" ry="6" fill="#00000044"/><path d="M4 90 Q20 30 60 50 L60 100 Z M146 90 Q130 30 90 50 L90 100 Z" fill="#1E1E2A"/><ellipse cx="75" cy="78" rx="34" ry="38" fill="#2B2B3A"/><circle cx="75" cy="40" r="22" fill="#2B2B3A"/><path d="M75 42 L110 54 L75 58 Z" fill="#8A8F99"/><circle cx="68" cy="36" r="5" fill="#C8303D"/><path d="M50 116 L44 124 M60 116 L60 124 M90 116 L90 124 M100 116 L106 124" stroke="#8A8F99" stroke-width="4"/>',
  gearbot:'<ellipse cx="75" cy="118" rx="50" ry="5" fill="#00000033"/><rect x="45" y="48" width="60" height="62" rx="6" fill="#8A7A5A"/><circle cx="75" cy="78" r="18" fill="#C9A227"/><circle cx="75" cy="78" r="7" fill="#5A4A2A"/><rect x="55" y="22" width="40" height="28" rx="4" fill="#6E655B"/><rect x="62" y="30" width="8" height="8" fill="#FF7A4D"/><rect x="80" y="30" width="8" height="8" fill="#FF7A4D"/><rect x="28" y="56" width="16" height="40" rx="6" fill="#6E655B"/><rect x="106" y="56" width="16" height="40" rx="6" fill="#6E655B"/><path d="M100 20 Q110 5 120 18" fill="none" stroke="#DDD" stroke-width="4" opacity=".7"/>',
  steamrat:'<ellipse cx="75" cy="112" rx="50" ry="6" fill="#00000033"/><ellipse cx="75" cy="85" rx="45" ry="28" fill="#7A6F66"/><rect x="60" y="50" width="30" height="16" rx="4" fill="#C9A227"/><rect x="70" y="36" width="8" height="16" fill="#8A7A5A"/><path d="M74 34 Q80 18 92 26" fill="none" stroke="#EEE" stroke-width="4" opacity=".7"/><circle cx="45" cy="78" r="5" fill="#FF5A4F"/><path d="M118 90 Q145 80 140 60" fill="none" stroke="#C7A1A1" stroke-width="4"/>',
  sludge:'<ellipse cx="75" cy="116" rx="56" ry="6" fill="#00000044"/><path d="M20 112 Q18 60 50 50 Q75 30 100 50 Q132 60 130 112 Z" fill="#8FE0B0" opacity=".85"/><path d="M40 112 Q42 80 60 76 Q75 70 90 78 Q108 84 110 112 Z" fill="#C8FFD8" opacity=".6"/><circle cx="60" cy="70" r="6" fill="#123"/><circle cx="90" cy="70" r="6" fill="#123"/>',
  zanshi:'<ellipse cx="75" cy="120" rx="74" ry="6" fill="#00000055"/><path d="M2 118 Q0 40 40 30 Q75 0 110 30 Q150 40 148 118 Z" fill="#6FBF94"/><path d="M20 118 Q24 70 50 60 Q75 44 100 60 Q126 70 130 118 Z" fill="#A8F0C8" opacity=".6"/><circle cx="52" cy="58" r="10" fill="#F2C230"/><circle cx="98" cy="58" r="10" fill="#F2C230"/><circle cx="52" cy="58" r="4" fill="#111"/><circle cx="98" cy="58" r="4" fill="#111"/><path d="M40 90 Q75 110 110 90" fill="none" stroke="#2B5A40" stroke-width="6"/><rect x="30" y="20" width="10" height="20" fill="#C9A227" transform="rotate(-20 35 30)"/><rect x="110" y="16" width="10" height="20" fill="#C9A227" transform="rotate(20 115 26)"/>',
  kodama:'<ellipse cx="75" cy="116" rx="40" ry="5" fill="#00000033"/><path d="M50 112 Q40 60 75 30 Q110 60 100 112 Z" fill="#9AA79A"/><circle cx="65" cy="62" r="5" fill="#222"/><circle cx="85" cy="62" r="5" fill="#222"/><path d="M75 30 Q60 10 50 16 M75 30 Q90 8 100 14" fill="none" stroke="#6E7A6E" stroke-width="5"/>',
  ruinbot:'<ellipse cx="75" cy="118" rx="50" ry="5" fill="#00000033"/><rect x="40" y="46" width="70" height="66" rx="4" fill="#9A9FA8"/><rect x="52" y="20" width="46" height="30" rx="4" fill="#8A8F99"/><rect x="62" y="30" width="26" height="8" fill="#8FE0B0"/><path d="M48 60 L102 60 M48 80 L102 80" stroke="#6A6F78" stroke-width="3"/><path d="M60 46 Q75 70 90 46" fill="none" stroke="#4E8A3C" stroke-width="4"/>',
  noah:'<ellipse cx="75" cy="118" rx="44" ry="6" fill="#00000044"/><path d="M40 60 L20 118 L130 118 L110 60 Z" fill="#3A3F4A"/><rect x="50" y="54" width="50" height="60" rx="6" fill="#4A5060"/><rect x="50" y="80" width="50" height="6" fill="#8A8F99"/><rect x="58" y="20" width="34" height="34" rx="4" fill="#F2DCC0"/><path d="M54 16 L96 16 L100 44 L94 30 L56 30 L50 44 Z" fill="#DDE3EA"/><rect x="64" y="36" width="5" height="4" fill="#223"/><rect x="81" y="36" width="5" height="4" fill="#223"/><rect x="108" y="36" width="6" height="74" fill="#D8DEE9"/><rect x="102" y="90" width="18" height="5" fill="#C9A227"/><rect x="109" y="30" width="4" height="8" fill="#FF7A4D"/>',
  mole:'<ellipse cx="75" cy="118" rx="64" ry="6" fill="#00000044"/><ellipse cx="75" cy="84" rx="60" ry="34" fill="#5A4636"/><ellipse cx="75" cy="60" rx="30" ry="22" fill="#6B5444"/><ellipse cx="75" cy="66" rx="10" ry="7" fill="#E88FB0"/><circle cx="60" cy="54" r="3" fill="#111"/><circle cx="90" cy="54" r="3" fill="#111"/><path d="M20 104 L6 96 M20 110 L4 112 M130 104 L144 96 M130 110 L146 112" stroke="#F4E3C0" stroke-width="5"/><polygon points="60,40 64,28 70,36 75,24 80,36 86,28 90,40" fill="#C9A227"/>',
  wolf:'<ellipse cx="75" cy="118" rx="62" ry="6" fill="#00000033"/><path d="M20 100 Q20 60 60 58 L110 58 Q135 62 130 100 Z" fill="#E8EEF5"/><path d="M100 60 L110 24 L122 52 L132 30 L134 66 Z" fill="#E8EEF5"/><circle cx="118" cy="56" r="3" fill="#3D6FB6"/><path d="M130 66 L146 70 L130 74 Z" fill="#BFD0E0"/><path d="M20 90 Q0 70 12 50" fill="none" stroke="#E8EEF5" stroke-width="10"/><path d="M40 100 L36 118 M60 100 L60 118 M96 100 L96 118 M116 100 L120 118" stroke="#BFD0E0" stroke-width="7"/>',
  gama:'<ellipse cx="75" cy="112" rx="58" ry="7" fill="#00000033"/><ellipse cx="75" cy="80" rx="62" ry="36" fill="#5C9A4C"/><ellipse cx="75" cy="92" rx="38" ry="20" fill="#E9E2B0"/><circle cx="45" cy="44" r="17" fill="#5C9A4C"/><circle cx="105" cy="44" r="17" fill="#5C9A4C"/><circle cx="45" cy="42" r="10" fill="#FFFFFF"/><circle cx="105" cy="42" r="10" fill="#FFFFFF"/><circle cx="47" cy="44" r="5" fill="#1B1B1B"/><circle cx="103" cy="44" r="5" fill="#1B1B1B"/><polygon points="58,30 62,10 69,24 75,6 81,24 88,10 92,30" fill="#F2C230" stroke="#9A6F10" stroke-width="2"/><path d="M48 74 Q75 90 102 74" fill="none" stroke="#1B1B1B" stroke-width="3" stroke-linecap="round"/>'
};
const SKY='<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6FB7E3"/><stop offset="1" stop-color="#CDEBF3"/></linearGradient></defs><rect width="360" height="200" fill="url(#sky)"/><circle cx="300" cy="36" r="16" fill="#FFF6C8"/>';
const BG={
  sea:'<rect width="360" height="200" fill="#3B4A5C"/><rect y="120" width="360" height="80" fill="#C9B38A"/><ellipse cx="60" cy="150" rx="40" ry="8" fill="#B8A07A"/><ellipse cx="280" cy="170" rx="50" ry="9" fill="#B8A07A"/><path d="M40 130 L48 100 L56 130 Z M300 128 L310 90 L320 128 Z" fill="#E07A5F"/><circle cx="180" cy="160" r="4" fill="#F4F1EA"/><circle cx="120" cy="175" r="3" fill="#F4F1EA"/>',
  field:SKY+'<ellipse cx="80" cy="125" rx="130" ry="40" fill="#8CC77A"/><ellipse cx="290" cy="128" rx="130" ry="38" fill="#7DBA6C"/><rect y="125" width="360" height="75" fill="#7CC26B"/><circle cx="60" cy="170" r="3" fill="#FF9EC7"/><circle cx="300" cy="160" r="3" fill="#FFF"/><circle cx="200" cy="185" r="3" fill="#FFE066"/>',
  swamp:SKY+'<ellipse cx="60" cy="120" rx="110" ry="42" fill="#79B06F"/><ellipse cx="290" cy="124" rx="120" ry="40" fill="#6AA262"/><rect y="120" width="360" height="80" fill="#4F8C74"/><ellipse cx="180" cy="176" rx="130" ry="18" fill="#3F7A64"/>',
  deck:'<rect width="360" height="200" fill="#2E3C55"/><path d="M0 70 Q90 50 180 72 T360 64 L360 130 L0 130 Z" fill="#23405E"/><path d="M0 100 Q60 90 120 104 T240 98 T360 102" fill="none" stroke="#6FA3C8" stroke-width="3"/><rect y="130" width="360" height="70" fill="#8B5A2B"/><g fill="#6B4222"><rect y="148" width="360" height="3"/><rect y="170" width="360" height="3"/></g><rect y="124" width="360" height="8" fill="#5A3A1C"/>',
  beach:SKY+'<rect y="100" width="360" height="36" fill="#4FA3D9"/><path d="M0 132 Q90 122 180 134 T360 128 L360 200 L0 200 Z" fill="#E6D3A3"/><circle cx="70" cy="160" r="4" fill="#F4F1EA"/><circle cx="260" cy="176" r="3" fill="#F4F1EA"/><path d="M300 100 L318 60 L336 100 Z" fill="#E88FB0"/>',
  bamboo:SKY+'<rect y="120" width="360" height="80" fill="#6FA35A"/><g fill="#5E9A4A"><rect x="20" y="0" width="12" height="140"/><rect x="70" y="0" width="10" height="130"/><rect x="290" y="0" width="12" height="140"/><rect x="330" y="0" width="10" height="130"/></g><g fill="#4E8A3C"><rect x="20" y="40" width="12" height="3"/><rect x="70" y="60" width="10" height="3"/><rect x="290" y="50" width="12" height="3"/><rect x="330" y="30" width="10" height="3"/></g>',
  pond:SKY+'<rect y="110" width="360" height="90" fill="#6FA35A"/><ellipse cx="180" cy="160" rx="170" ry="34" fill="#3F7FA8"/><path d="M40 108 L60 70 L80 108 Z M280 108 L300 60 L320 108 Z" fill="#3E7430"/><rect x="160" y="60" width="8" height="50" fill="#C8553D"/><rect x="200" y="60" width="8" height="50" fill="#C8553D"/><rect x="150" y="56" width="68" height="8" fill="#C8553D"/>',
  highland:SKY+'<path d="M0 120 L80 60 L140 110 L220 30 L300 100 L360 70 L360 200 L0 200 Z" fill="#8AA7B8"/><path d="M200 50 L220 30 L240 50 Z" fill="#F4F1EA"/><rect y="130" width="360" height="70" fill="#9CC17A"/><rect x="290" y="80" width="10" height="55" fill="#8B5A2B"/><path d="M295 82 L270 60 M295 82 L320 60 M295 82 L270 104 M295 82 L320 104" stroke="#F4F1EA" stroke-width="5"/>',
  peak:'<rect width="360" height="200" fill="#9AA7B5"/><rect width="360" height="90" fill="#C7D0DA"/><g fill="#E8EEF5"><ellipse cx="60" cy="40" rx="50" ry="14"/><ellipse cx="260" cy="30" rx="70" ry="16"/></g><path d="M0 140 L60 100 L120 130 L180 90 L240 120 L300 95 L360 130 L360 200 L0 200 Z" fill="#7A7F88"/><rect y="150" width="360" height="50" fill="#8A8F99"/>',
  city:'<rect width="360" height="200" fill="#C9D6E2"/><g fill="#E8EEF5"><ellipse cx="70" cy="50" rx="60" ry="14"/><ellipse cx="280" cy="40" rx="70" ry="16"/></g><rect x="20" y="70" width="60" height="70" fill="#8A7A5A"/><rect x="280" y="60" width="60" height="80" fill="#7A6F66"/><circle cx="180" cy="80" r="40" fill="none" stroke="#C9A227" stroke-width="10"/><rect y="140" width="360" height="60" fill="#8A8F99"/><g fill="#6E737D"><rect y="160" width="360" height="3"/><rect y="182" width="360" height="3"/></g>',
  archive:'<rect width="360" height="200" fill="#262B30"/><rect y="130" width="360" height="70" fill="#3A4046"/><g fill="#8FE0B0" opacity=".35"><ellipse cx="60" cy="150" rx="40" ry="8"/><ellipse cx="290" cy="170" rx="50" ry="9"/></g><circle cx="180" cy="70" r="46" fill="none" stroke="#6E655B" stroke-width="8"/><circle cx="180" cy="70" r="16" fill="#6E655B"/>',
  forest:'<rect width="360" height="200" fill="#6E8A6A"/><g fill="#4E6A4A"><rect x="30" y="0" width="40" height="150"/><rect x="290" y="0" width="46" height="150"/></g><path d="M0 150 Q90 120 180 150 T360 150 L360 200 L0 200 Z" fill="#5E7A5A"/><path d="M60 150 Q80 120 110 150 M250 150 Q280 115 310 150" fill="none" stroke="#3E5A3A" stroke-width="8"/>',
  heart:'<rect width="360" height="200" fill="#1E2330"/><g fill="#FFF6C8" opacity=".6"><circle cx="40" cy="30" r="2"/><circle cx="120" cy="50" r="2"/><circle cx="300" cy="24" r="2"/><circle cx="220" cy="60" r="1.5"/></g><rect y="140" width="360" height="60" fill="#3A4A3A"/><path d="M150 140 L180 40 L210 140 Z" fill="#6FBF94" opacity=".35"/>',
  snow:'<rect width="360" height="200" fill="#DDE6EE"/><path d="M0 130 L70 70 L130 120 L200 50 L270 110 L360 60 L360 200 L0 200 Z" fill="#F4F8FB"/><g fill="#FFFFFF"><circle cx="40" cy="30" r="2"/><circle cx="110" cy="60" r="2"/><circle cx="200" cy="20" r="2"/><circle cx="300" cy="45" r="2"/><circle cx="250" cy="90" r="2"/></g><rect y="150" width="360" height="50" fill="#E8EEF5"/>',
  cave:'<rect width="360" height="200" fill="#2E2722"/><rect y="130" width="360" height="70" fill="#5E5144"/><g fill="#3A322B"><rect x="0" y="20" width="360" height="3"/><rect x="0" y="60" width="360" height="3"/><rect x="0" y="100" width="360" height="3"/></g><rect x="40" y="80" width="8" height="50" fill="#3B3B3B"/><path d="M32 80 L44 55 L56 80 Z" fill="#FF7A2F"/><rect x="312" y="80" width="8" height="50" fill="#3B3B3B"/><path d="M304 80 L316 55 L328 80 Z" fill="#FF7A2F"/>'
};

/* お店 */
const SHOPS={
  tool:{name:'道具屋',goods:[
    {kind:'bread',name:'焼きたてパン',price:20,desc:'全員のHPが 半分回復'},
    {kind:'feast',name:'ごちそうパン',price:80,desc:'全員のHPが 全回復'}]},
  arms:{name:'武器・防具屋',goods:[
    {kind:'gear',type:'weapon',wtype:'sword',name:'鉄の剣',atk:16,price:150},
    {kind:'gear',type:'weapon',wtype:'rapier',name:'銀の細剣',atk:14,price:140},
    {kind:'gear',type:'weapon',wtype:'staff',name:'樫の杖',atk:12,price:120},
    {kind:'gear',type:'weapon',wtype:'dual',name:'鉄の双剣',atk:13,price:130},
    {kind:'gear',type:'weapon',wtype:'rod',name:'銀のロッド',atk:10,price:110},
    {kind:'gear',type:'armor',name:'革のよろい',def:8,price:60},
    {kind:'gear',type:'armor',name:'鉄のよろい',def:14,price:180}]}
};
const SELL_BASE=[10,25,60,150,400];
/* ノア：取り戻していない属性ほど強くなる */
FOES.noah1.dyn=function(d){
  const L=G.lost.slice();const EN={'土':'大地の 千年','氷':'凍てつく 千年','闇':'影の 千年','火':'灰の 千年','水':'渇きの 千年','風':'凪の 千年','光':'薄明の 千年'};
  d.hp=5000+1300*L.length;
  const cyc=[[A('single','古剣',260,'1人に強打'),A('all','残りの 波',150,'全体に攻撃')]];
  L.forEach(e=>cyc.push([A('charge',e+'を 抱える',0,'大技の準備'),A('big',EN[e]||e,300,'全体に大ダメ（'+e+'）')]));
  if(!L.length)cyc.push([A('charge','残りを 構える',0,'大技の準備'),A('big','千年の 剣',280,'全体に大ダメ')]);
  d.cycle=cyc;
};
Object.keys(CHARS).forEach(id=>CHARS[id].cmds.push({n:'繋ぐ',t:'link',req:'linkPhase',d:'ノアの 残りを 受け取る'}));
/* ===== バランス調整：章ごとの敵レベル帯 ===== */
(function(){
  const NEWLV={kappa:17,tanuki:18,kitsunebi:18,fox:21,namazu:21,itachi:19,kamaitachi:22,yamaoni:22,karasu:23,nagi:26,
    gearbot:28,steamrat:27,sludge:30,zanshi:33,kodama:35,ruinbot:36,noah1:42,noah2:42,
    rat2:30,boar2:32,moguraou:34,snowhare:30,icewisp:31,yukiookami:34,fumin:36,crabking:17,gama:24};
  const mul=l=>0.6+0.05*l;
  for(const [k,lv] of Object.entries(NEWLV)){const d=FOES[k];if(!d||d.fixed)continue;const r=mul(lv)/mul(d.lv);
    d.hp=Math.round(d.hp*r*(d.boss?1.2:1));d.cycle.forEach(t=>t.forEach(a=>{a.p=Math.round(a.p*r);}));d.lv=lv;}
  // ノア第一段階の基礎値もレベルに合わせる
  const nd=FOES.noah1.dyn;FOES.noah1.dyn=function(d){nd(d);const r=mul(42)/mul(30);d.hp=Math.round(d.hp*r*1.2);d.cycle.forEach(t=>t.forEach(a=>{a.p=Math.round(a.p*r);}));};
})();
/* 各地の武器屋 */
SHOPS.arms2={name:'桜ノ津の 刀剣屋',goods:[
  {kind:'gear',type:'weapon',wtype:'sword',name:'桜鋼の剣',atk:30,price:900},{kind:'gear',type:'weapon',wtype:'katana',name:'雪月',atk:32,price:950},
  {kind:'gear',type:'weapon',wtype:'rapier',name:'花冠の細剣',atk:27,price:850},{kind:'gear',type:'weapon',wtype:'staff',name:'狐火の杖',atk:25,price:800},
  {kind:'gear',type:'weapon',wtype:'dual',name:'疾風の双剣',atk:26,price:820},{kind:'gear',type:'weapon',wtype:'rod',name:'潮騒のロッド',atk:22,price:760},
  {kind:'gear',type:'armor',name:'藍染めの鎧',def:26,price:880}]};
SHOPS.arms3={name:'ギアリムの 工房',goods:[
  {kind:'gear',type:'weapon',wtype:'sword',name:'蒸気機関の剣',atk:46,price:2600},{kind:'gear',type:'weapon',wtype:'katana',name:'歯車刀',atk:48,price:2700},
  {kind:'gear',type:'weapon',wtype:'rapier',name:'真鍮の細剣',atk:42,price:2400},{kind:'gear',type:'weapon',wtype:'staff',name:'ボイラーの杖',atk:40,price:2300},
  {kind:'gear',type:'weapon',wtype:'dual',name:'双歯車',atk:41,price:2350},{kind:'gear',type:'weapon',wtype:'rod',name:'圧力計のロッド',atk:36,price:2200},
  {kind:'gear',type:'weapon',wtype:'cutlass',name:'黒鴉の大曲刀',atk:47,price:2650},{kind:'gear',type:'armor',name:'真鍮の鎧',def:40,price:2500}]};

FOES.noah1.hard=1.3;FOES.noah1.hpMul=1.3;FOES.noah2.hard=1.3;FOES.noah2.hpMul=1.2;FOES.zanshi.hpMul=0.75;
FOES.yamaoni.hpMul=0.7;FOES.yamaoni.hard=0.85;
/* ===== 王国の辺境（格上エリア） ===== */
(function(){
  const N=(name,lv,svg,bg,extra)=>{const s=9*lv+20,a=Math.round(5.5*lv+10);return Object.assign({name,lv,hp:80*lv+300,cycle:[[A('single','こうげき',s,'1人に攻撃'),A('all','なぎはらい',a,'全体に攻撃')],[A('charge','ためる',0,'大技の準備'),A('big','大技',Math.round(s*1.3),'全体に大ダメ')]],bg,svg},extra||{});};
  const Bo=(name,short,lv,svg,bg,names)=>({name,short,lv,hp:260*lv,boss:true,angry:true,bg,svg,
    cycle:[[A('single',names[0],11*lv,'1人に強打'),A('all',names[1],Math.round(6.5*lv),'全体に攻撃')],[A('charge',names[2],0,'大技の準備'),A('big',names[3],14*lv,'全体に大ダメ')],[A('all',names[1],Math.round(6.5*lv),'全体に攻撃'),A('single',names[0],11*lv,'1人に強打')]]});
  Object.assign(FOES,{
    gakegani:N('断崖ガニ',16,'crab','sea'),shiokurage:N('潮風クラゲ',17,'jelly','sea'),
    iwagani:Bo('断崖のヌシ 岩壁の大ガニ','岩壁の大ガニ',20,'crabking','sea',['大バサミ','潮しぶき','甲羅を 鳴らす','大津波']),
    numagaeru:N('きらめきガエル',19,'gama','swamp'),hikaritake:N('ひかりダケ',20,'weed','swamp'),
    hikarinushi:Bo('湿原のヌシ ひかり沼の大スライム','ひかり沼の大スライム',24,'sludge','swamp',['のしかかり','光る しぶき','ふくらむ','大はじけ']),
    morikodama:N('森の 木霊',23,'kodama','forest'),moridanuki:N('森の 大だぬき',24,'tanuki','forest'),
    jureishin:Bo('森のヌシ いにしえの大樹霊','大樹霊',28,'kodama','forest',['根の 鞭','木の葉 嵐','森の 声を 集める','大樹の 怒り']),
    yukiusagi:N('吹雪うさぎ',26,'hare','snow'),hyouki:N('氷鬼火',27,'kitsunebi','snow'),
    hakureiookami:Bo('白嶺のヌシ 白牙の狼王','白牙の狼王',30,'wolf','snow',['白牙','吹雪','遠吠え','白嶺の 咆哮'])
  });
})();
/* ===== ヒノワ・ギアリムの寄り道 ===== */
(function(){
  const N=(name,lv,svg,bg)=>{const s=9*lv+20,a=Math.round(5.5*lv+10);return {name,lv,hp:80*lv+300,bg,svg,cycle:[[A('single','こうげき',s,'1人に攻撃'),A('all','なぎはらい',a,'全体に攻撃')],[A('charge','ためる',0,'大技の準備'),A('big','大技',Math.round(s*1.3),'全体に大ダメ')]]};};
  const Bo=(name,short,lv,svg,bg,n)=>({name,short,lv,hp:260*lv,boss:true,angry:true,bg,svg,cycle:[[A('single',n[0],11*lv,'1人に強打'),A('all',n[1],Math.round(6.5*lv),'全体に攻撃')],[A('charge',n[2],0,'大技の準備'),A('big',n[3],14*lv,'全体に大ダメ')],[A('all',n[1],Math.round(6.5*lv),'全体に攻撃'),A('single',n[0],11*lv,'1人に強打')]]});
  Object.assign(FOES,{
    takegarasu:N('竹林の 烏天狗',27,'karasu','bamboo'),takedanuki:N('竹だぬき',28,'tanuki','bamboo'),
    daitengu:Bo('竹林のヌシ 大天狗','大天狗',31,'karasu','bamboo',['錫杖','天狗風','羽扇を 構える','大天狗礫']),
    kumonosei:N('雲の 精',33,'kitsunebi','city'),norakihei:N('野良機兵',34,'gearbot','city'),
    kumokujira:Bo('雲海のヌシ 雲鯨','雲鯨',37,'kujira','city',['尾びれ','潮雲','大きく 息を 吸う','雲海の 咆哮']),
    kraken2:Object.assign(Bo('深海の主 クラーケン（再戦）','クラーケン',40,'kraken','deck',['しめつけ','触手なぎ','大渦を 呼ぶ','大渦']),{hpMul:1.4,hard:1.2})
  });
})();
SVG.kujira='<ellipse cx="75" cy="118" rx="70" ry="5" fill="#00000022"/><path d="M8 80 Q20 40 80 42 Q130 44 140 70 L150 50 L148 90 Q120 110 70 108 Q20 106 8 80 Z" fill="#DDE6EE"/><path d="M20 88 Q70 100 130 84" fill="none" stroke="#B5C3D1" stroke-width="4"/><circle cx="40" cy="70" r="5" fill="#223"/><path d="M60 40 Q62 20 70 30 Q76 14 80 34" fill="none" stroke="#FFF" stroke-width="4"/>';
CHARS.vega.cmds.splice(3,0,{n:'盗む',t:'steal',d:'敵から 装備を 盗む（1戦に1回）'});
/* ===== ヒノワの街道・蒸気の裏通り ===== */
(function(){
  const N=(name,lv,svg,bg)=>{const s=9*lv+20,a=Math.round(5.5*lv+10);return {name,lv,hp:80*lv+300,bg,svg,cycle:[[A('single','こうげき',s,'1人に攻撃'),A('all','なぎはらい',a,'全体に攻撃')],[A('charge','ためる',0,'大技の準備'),A('big','大技',Math.round(s*1.3),'全体に大ダメ')]]};};
  const Bo=(name,short,lv,svg,bg,n)=>({name,short,lv,hp:260*lv,boss:true,angry:true,bg,svg,cycle:[[A('single',n[0],11*lv,'1人に強打'),A('all',n[1],Math.round(6.5*lv),'全体に攻撃')],[A('charge',n[2],0,'大技の準備'),A('big',n[3],14*lv,'全体に大ダメ')],[A('all',n[1],Math.round(6.5*lv),'全体に攻撃'),A('single',n[0],11*lv,'1人に強打')]]});
  Object.assign(FOES,{
    oogama:N('街道の 大ガマ',22,'gama','swamp'),onibi:N('さまよう 鬼火',24,'kitsunebi','bamboo'),
    tsumuji:N('つむじ風イタチ',26,'itachi','highland'),yamagarasu:N('山の 烏天狗',28,'karasu','highland'),
    omukade:Bo('街道のヌシ 大ムカデ','大ムカデ',30,'mukade','highland',['毒牙','百足 なぎ','体を 丸める','百足 大車輪']),
    boukon:N('蒸気の 亡霊',32,'kitsunebi','city')
  });
})();
SVG.mukade='<ellipse cx="75" cy="116" rx="66" ry="5" fill="#00000033"/><g fill="#8E2C3E">'+[0,1,2,3,4,5].map(i=>'<circle cx="'+(20+i*22)+'" cy="'+(80-Math.sin(i)*14)+'" r="16"/>').join('')+'</g><g stroke="#F2C230" stroke-width="3">'+[0,1,2,3,4,5].map(i=>'<path d="M'+(20+i*22)+' '+(92-Math.sin(i)*14)+' l-6 18 M'+(20+i*22)+' '+(92-Math.sin(i)*14)+' l6 18"/>').join('')+'</g><circle cx="14" cy="74" r="4" fill="#FFF"/><path d="M8 66 L0 54 M14 64 L12 50" stroke="#F2C230" stroke-width="3"/>';
FOES.kamaitachi.hpMul=0.8;FOES.kamaitachi.hard=0.75;
FOES.zanshi.hpMul=0.6;FOES.nagi.hpMul=0.85;
