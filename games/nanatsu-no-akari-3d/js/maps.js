/* ===== マップ定義 =====
 屋外: . 草  , 花  = 道  ~ 水  B 橋  T 木  H 壁  R 屋根  d 家の扉  D 門(通れる)  F 柵  W 井戸/噴水  % 沼  C 洞窟  L 街灯  s 屋台
 屋内: : 床  # 壁  k じゅうたん  Z 玉座  h 暖炉(消)  j 暖炉(点)  t 机  e ベッド  x たる  > 下り階段  < 上り階段  E 出口
       w 水たまり  o 燭台  O 燭台(点)  u 水の燭台  1 2 格子扉  X 祭壇  Y 祭壇(点)  K 押せる石  ~ 水路
*/
const SOLID=new Set(['弁','鏡','碑','鐘','凍','蔦','岩','滝','影','M','@','*','^','z','I','U','l','P','J','m','V','T','H','R','~','F','W','d','#','o','O','u','1','2','X','Y','L','s','h','j','Z','t','e','x','K','b','q','r','n','N']);

const ROWS={
town:[
"TTTTTT########TTTTTT",
"TTTTTT###DD###TTTTTT",
"T....L..====..L....T",
"T.......====.......T",
"T.RRRR..====..RRRR.T",
"T.RRRR..====..RRRR.T",
"T.HHHH..====..HHHH.T",
"T.HHdH..====..HdHH.T",
"T..,....====....,..T",
"T..L.s.======.s.L..T",
"T.....========.....T",
"T..s..===WW===..s..T",
"T.....===WW===.....T",
"T..L..========..L..T",
"T.....s======s.....T",
"T.RRRR..====..RRRR.T",
"T.RRRR..====..RRRR.T",
"T.HHHH..====..HHHH.T",
"T.HdHH..====..HHdH.T",
"T..,....====....,..T",
"T.L.....====.....L.T",
"TTTTTTTT====TTTTTTTT"],
castle:[
"################",
"#bb:::::ZZ:::bb#",
"#h::::::kk:::::#",
"#:::::::kk:::::#",
"#:::::::kk:::::#",
"########kk######",
"#:::::::kk:::::#",
"#:::::::kk:::::#",
"###:####kk##:###",
"#h::t:#:kk:#:::#",
"#:::t:#:kk:#:e:#",
"#:::::#:kk:#:::#",
"#:>:::#:kk:#:::#",
"#:::::#:kk:#:::#",
"#######:DD:#####",
"################"],
cellar:[
"##############",
"#<:::::#:::::#",
"#:::x::#::x::#",
"#::::::::::::#",
"#::x:::#:::x:#",
"#::::::#:::::#",
"####::###::###",
"#::::::::::::#",
"#:x::::::::x:#",
"#::::::::::::#",
"##############"],
waterway:[
"##############",
"#::::#:::::::#",
"#::::#:::::::#",
"#::::::::K:::#",
"#::::#:::::::#",
"#::::#:::::::#",
"#~~~~~~~~~~~~#",
"#::::::::::::#",
"#::::::::::::#",
"######::######",
"######EE######",
"##############"],
ruins:[
"###############",
"#####:::::#####",
"####:::::::####",
"####:::X:::####",
"####:::::::####",
"#####:::::#####",
"#######2#######",
"#:::::::::::::#",
"#:u::::o::::u:#",
"#:::::www:::::#",
"#:o::o:::o::o:#",
"#:::::::::::::#",
"#::::::o::::::#",
"#:::::::::::::#",
"#######1#######",
"#:::::o:::::::#",
"#::o::www::o::#",
"#:::::w:w:::::#",
"#:ww::www::ww:#",
"#::o:::o:::o::#",
"#::::ww:ww::::#",
"#::::::o::::::#",
"#:::::::o:::::#",
"######:::######",
"#:::::::::::::#",
"#::O::o::o::o:#",
"#:::::::::::::#",
"#:::::::::::::#",
"#::::::E::::::#",
"###############"],
port:[
"TTTTTTTTTTTTTTTTTTTTTT",
"T.RRRR....RRRRRR....TT",
"T.RRRR....RRRRRR....TT",
"T.HHdH....HHHdHH....TT",
"T.........====.......T",
"=====================T",
"T.....s......s.......T",
"T....................T",
"FFFFFF==FFFFFFFFFFFFFT",
"vvvvvv==vvvvvvvvvvvvvT",
"vvvvvv==vvvvvvvvvvvvvT",
"vvvvvvvvvvvvvvvvvvvvvT",
"vvvvvvvvvvvvvvvvvvvvvT",
"vvvvvvvvvvvvvCvvvvvvvT",
"vvvvvvvvvvvvvvvvvvvvvT",
"TTTTTTTTTTTTTTTTTTTTTT"],
ship:["~~~~~~~~~~~~~~~~", "~~~~~~~gg~~~~~~~", "~~~~~~gggg~~~~~~", "~~~~~gggggg~~~~~", "~~~~~ggmggg~~~~~", "~~~~~gggggg~~~~~", "~~~~~gggggg~~~~~", "~~~~~ggggmg~~~~~", "~~~~~gggggg~~~~~", "~~~~~gggggg~~~~~", "~~~~~~gggg~~~~~~", "~~~~~~~~~~~~~~~~"],
urahama:["VVVVVVVVVV==VVVVVVVVVV", "VV..JJJJJJ..........VV", "VV..JJJJJJ..P....P..VV", "VV..HHHdHH..........VV", "VV..........=.......VV", "VV.........==......VVV", "VVVVVVV....==..VVVVVVV", "VVVVVV.....==...VVVVVV", "VVVVV......==....VVVVV", "VVVV...V...==.V...VVVV", "VVV........==......VVV", "VV..V......==...V...VV", "VV.........==.......VV", "TTTTTTT....==..TTTTTTT", "T..P.......==.....P..T", "T.JJJJ.....==..JJJJ..T", "T.HHdH.....==..HdHH..T", "T..........======....T", "T..P.......==....P...T", "T.JJJJ.....==..JJJJ..T", "T.HHdH.....==..HHdH..T", "T..........==........T", "TyyyyyyyyyyyyyyyyyyyyT", "yyyyyyyyyyyyyyyyyyyyyy", "yyyyyyyyyyyyyyyyyyyyyy", "~~~~~~~~~~~~~~~~~~~~~~", "~~~~~~~~~~~~~~~~~~~~~~"],
sakuranotsu:["VVVVVVVVVVVVVVVVVVVVVV", "VVVVVVVVJJJJJVVVVVVVVV", "VVV.....HHdHH.....VVVV", "VV....P...=...P....VVV", "VV........=.........VV", "VV..V.....=.....V...VV", "VV........=.........VV", "VVV...V...=...V....VVV", "VVVVV.....=.....VVVVVV", "VVVVVVVV..=..VVVVVVVVV", "TTTTTTTTP.=.PTTTTTTTTT", "T.........=..........T", "T.JJJJ....=....JJJJJ.T", "T.HHdH....=....HHdHH.T", "T.........=....s.....T", "======================", "T..P......=......P...T", "T.JJJJJ...=...JJJJ...T", "T.HHdHH...=...HdHH...T", "T.........=..........T", "yyyyyyyyyy=yyyyyyyyyyy", "yyyyyyyyyy=yyyyyyyyyyy", "~~~~~~~~~BBB~~~~~~~~~~", "~~~~~~~~~BBB~~~~~~~~~~"],
yamajinja:["TTTTTTTTTTTTTTTTTTTT", "TT....JJJJJJ....P.TT", "TT....HHHdHH......TT", "TT.......=........TT", "TT..W....=....P...TT", "TT.......=........TT", "T..~~~~~~l~~~~~~~..T", "T..~~~~~~l~~~~~~~..T", "T..~~~~~...~~~~~~..T", "T..~~~~~...~~~~~~..T", "T..~~~~~~~~~~~~~~..T", "T..................T", "TTT....T....T....TTT", "T.....P......T.....T", "T..T.....T.......T.T", "T..................T", "T.....T.......P....T", "T..P.......T.......T", "T..................T", "TTTTTTTT==TTTTTTTTTT"],
kazami:["VVVVVVVVV==VVVVVVVVV", "T........=.........T", "T..U.....=.....U...T", "T........=.........T", "T..JJJJ..=..JJJJ...T", "T..HHdH..=..HdHH...T", "T........=.........T", "T..,,....=....,,...T", "T........=.........T", "TTTT.....=.....TTTTT", "T........=........TT", "T..P.....=....T....T", "T....T...=........PT", "T........=...T.....T", "T..T.....=.........T", "T........=....P....T", "T........=.........T", "TTTTTTTTT==TTTTTTTTT"],
hidamari:["TTTTTTTTTTTTTTTTTTTT", "T..JJJJ.....JJJJ...T", "T..HHdH.....HdHH...T", "T.........L........T", "T..P.............P.T", "T....JJJJ...JJJJ...T", "T....HdHH...HHdH...T", "T..L......=.....L..T", "T.........=........T", "T..,,.....=.....,,.T", "TFFFFFFFF.=.FFFFFFFT", "T.........=........T", "T..T......=.....T..T", "T......T..=........T", "T..P......=....T...T", "T.........=........T", "T....T....=....P...T", "TTTTTTTTTT=TTTTTTTTT"],
tenpu:["^^^^^^^^^^^^^^^^^^^^", "^^^^^^^aaaaa^^^^^^^^", "^^^^^^aaaXaaa^^^^^^^", "^^^^^^aaaaaaa^^^^^^^", "^^^^^^^aaaaa^^^^^^^^", "^^^^^^^^aaa^^^^^^^^^", "^^^^^aaaaaaaaaa^^^^^", "^^^^aaaaaaaaaaaa^^^^", "^^^^aaaaaaaaaaaa^^^^", "^^^^^^^^^aa^^^^^^^^^", "^^^^^^^^^zz^^^^^^^^^", "^^^^^^^^^zz^^^^^^^^^", "^^^^aaaaaaIaaaa^^^^^", "^^^^aaaaaaaaaaaa^^^^", "^^^^aa^^^^^^^^aa^^^^", "^^^aaa^^^^^^^^aaa^^^", "^^^aaa^^^^^^^^aaa^^^", "^^^aaaaaaaaaaaaaa^^^", "^^^^^^^^^aa^^^^^^^^^", "^^^^^^^^^zz^^^^^^^^^", "^^^^^^^^^zz^^^^^^^^^", "^^^^^aaaaIaaaaa^^^^^", "^^^^aaaaaaaaaaaa^^^^", "^^^^aa^^^^^^^^aa^^^^", "^^^^aa^^aaaa^^aa^^^^", "^^^^aaaaa^^aaaaa^^^^", "^^^^^^^^a^^a^^^^^^^^", "^^^^^^^^aaaa^^^^^^^^", "^^^^^^^^aaaa^^^^^^^^", "^^^^^^^^^aa^^^^^^^^^"],
gearim:["MMMMMMMMMMppMMMMMMMMMM", "MppppppppppppppppppppM", "MpJJJJppppppppppJJJJpM", "MpHHdHppMMMMMMppHdHHpM", "MpppppppMMMMMMpppppppM", "MpppppppMMMMMMpppppppM", "MppsppppMMMMMMppppsppM", "MpppppppMMDDMMpppppppM", "MppppppppppppppppppppM", "Mppp@pppppppppppp@pppp", "MppppppppppppppppppppM", "MpJJJJJppppppppJJJJJpM", "MpHHdHHppppppppHdHHHpM", "MppppppppppppppppppppM", "MppppppppppppppppppppM", "Mppppppp++++++pppppppM", "M*******++++++*******M", "MMMMMMMMMM++MMMMMMMMMM"],
roofs:["******************", "*pppppppppppppppp*", "*pppppppppppppppp*", "*ppMppppppppppMpp*", "*pppppppppppppppp*", "*pppppppppppppppp*", "******************", "******************", "*pppppppppppppppp*", "*pppppppppppppppp*", "*ppMMpppppp@ppppp*", "*pppppppppppppppp*", "*pppppppppppppppp*", "*pppppppppppppppp*", "******************", "******************", "*pppppppppppppppp*", "*ppppp@pppppppppp*", "*pppppppppppMMppp*", "*ppMMpppppppppppp*", "*pppppppppppppppp*", "*pppppppppppppppp*", "*pppppppppppppppp*", "********pp********"],
archive:["#################", "#:::::::::::::::#", "#::o:::::::::o::#", "#:::::::X:::::::#", "#:::::::::::::::#", "#:::::::::::::::#", "#::o:::::::::o::#", "#:::::::::::::::#", "#:::::::::::::::#", "########1########", "#:::q:::q:::q:::#", "#:::::::::::::::#", "#::::::::::K::::#", "#::::K::::::::::#", "#:::::::K:::::::#", "#:::::::::::::::#", "#:::::::::::::::#", "#:::::::::::::::#", "#:::::::::::::::#", "########E########"],
arcanoa:["TTTTTTTTTT..TTTTTTTTTT", "T........^..^........T", "T........^..^........T", "T..TT.....==.....TT..T", "T.......I.==.I.......T", "T.........==.........T", "T....I....==....I....T", "T.........==.........T", "T.T.......==.......T.T", "T...,.....==.....,...T", "T.........==.........T", "T.....T...==...T.....T", "T.........==.........T", "T.........==.........T", "T..T......==......T..T", "T....I....==....I....T", "T.........==.........T", "T......,..==..,......T", "T.........==.........T", "TTTTTTTTTT==TTTTTTTTTT"],
roots:["#####################", "#####################", "#########:X:#########", "#:::::::::::::::::::#", "#:::::::::::::::::::#", "#:::o:::::::::::o:::#", "#:::::::::::::::::::#", "#:::::::::::::::::::#", "##:#######影##########", "##:#######:##########", "##q#######:##########", "##:#######滝##########", "##:::::::::##########", "##:#######:##########", "##:#######岩##########", "##:::::::::##########", "##K#######:##########", "##:#######蔦##########", "##:#######:##########", "#:::::::::::::::::::#", "#:::o:::::::::::o:::#", "#:::::::::::::::::::#", "#:::::::::::::::::::#", "##########E##########"],
heart:["TTTTTTTTTTTTTTTT", "T..............T", "T..............T", "T..P........P..T", "T..............T", "T..............T", "T.P..........P.T", "T.......W......T", "T..............T", "T..............T", "T..P........P..T", "T..............T", "T..............T", "TTTTTTTTTTTTTTTT"],
henkyo:["TTTTTTTTTTTTTTTTTTTT", "T....^^^^C^^^^.....T", "T....^^^^.^^^^.....T", "T.........=........T", "T..RRRR...=..ffff..T", "T..HHdH...=..ffff..T", "T.........=..ffff..T", "T..ffff...=........T", "T..ffff...=...ffff.T", "T..ffff...=...ffff.T", "T.........=...ffff.T", "T..ffff...=........T", "T..ffff...=........T", "T.........=........T", "T.........=........T", "TTTTTTTTTT=TTTTTTTTT"],
dochi:["#################", "######:::::######", "######::X::######", "######:::::######", "#######:::#######", "#######:q:#######", "#:::::::::::::::#", "#:::K:::::::::::#", "#:::::::::::K:::#", "#:::::::::::::::#", "######:::::######", "######:::::######", "########E########", "#################"],
hakusetsu:["^^^^^^^^^^^^^^^^^^^^", "^^^^^^^SSSSS^^^^^^^^", "^^^^^^SSSXSSS^^^^^^^", "^^^^^^SSSSSSS^^^^^^^", "^^^^^^^^^凍^^^^^^^^^^", "^^^^^^^SSSSS^^^^^^^^", "^^^^SSSSSSSSSSSS^^^^", "^^^SSJJJSSSSSSSSS^^^", "^^^SSHdHSSSSSSSSS^^^", "^^^SSSSSSSSSSSSSS^^^", "^^^SSSSTSSSSSSTSS^^^", "^^^SSSSSSSSSSSSSS^^^", "^^^^SSSSSSSSSSSS^^^^", "^^^^^SSSSSSSSSS^^^^^", "^^^^^^SSSSSSSS^^^^^^", "^^^^^^^SSSSSS^^^^^^^", "^^^^^^^^SSSS^^^^^^^^", "^^^^^^^^SSSS^^^^^^^^", "^^^^^^^^^SS^^^^^^^^^", "^^^^^^^^^SS^^^^^^^^^"],
haguruma:["#################", "######:::::######", "######::X::######", "######:::::######", "#######:::#######", "########1########", "#:::::::::::::::#", "#::q:::::::::q::#", "#:::::::::::::::#", "#:::K:::::::K:::#", "#:::::::::::::::#", "#:::::::::::::::#", "######:::::######", "######:::::######", "########E########", "#################"],
dangai:["^^^^^^^^^^^^^^^^^^^^^^^^^^", "^.,........^.^..^yy~~~~~~^", "^.....^.^..^....Iyy~~~~~~^", "^.,.........^...yyy~~~~~~^", "^..^.鏡...^...^...yy~~~~~~^", "^^.^^........^...yy~~~~~~^", "^........^,.....^yy~~~~~~^", "^^.......,.....鏡.yy~~~~~~^", "^........^.......yy~~~~~~^", "^..^......,^..^..yy~~~~~~^", "^.........^^.....yy~~~~~~^", "^....^.....,.....yy~~~~~~^", "...............yyyy~~~~~~^", "^..^.^........^..yy~~~~~~^", "^....,...........yy~~~~~~^", "^.......,.,......yy~~~~~~^", "^..^^.^....^..^..yy~~~~~~^", "^.^..........^...yy~~~~~~^", "^.........^......yy~~~~~~^", "^..........,鏡....yy~~~~~~^", "^......^....^.^..yy~~~~~~^", "^...........^....yy~~~~~~^", "^................yy~~~~~~^", "^^^^^^^^^^^^^^^^^^^^^^^^^^"],
shitsugen:["TTTTTTTTTTTT%%TTTTTTTTTTTT", "T%%~%%%%%%%%%%%%,%~%,%%%%T", "T%%%%%%%%%%%%%,%%~%~%,%%%T", "T,%%鐘%%%%%%~%%T,%%%%~%%%%T", "T%%%%%%%%,~%%%%%,%%,,%%%%T", "T%%,%~%%%%%,%~%%%,%,%%~%%T", "T%%%%~%%~%%T%%%%%%~%%%%~%T", "T%~%%%~%%%%%%%%T~%%T%%%%%T", "T%%%%%%%%%%%%%%%%%~%%%%%%T", "T%%%%~%%%%~~%,%%%%%%%%%%%T", "T%%%,~%%~%%T%%%%,%%%%%%~%T", "T%%%%%%~%%T,%%~%%%TT%~%%%T", "T%T~~%,%,%%%%T%%%%%%%%%%,T", "T,%%%%%T%%%%%%TT,%%%%%~%%T", "T%%%%%%%%%~%%%%%%%%%%~%%%T", "T%%%%%%~%~%%%%%%%,%%~%%%%T", "T潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮T", "T潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮潮T", "T%%%%~%%%%,%%%T%%%T,%%%%%T", "T%%%%%%%~%%%%T%%%%%~%%%,%T", "T~T%%%%%%%%%%%~%%%%%%%%,%T", "T%~%%%%%%~,%%%T%~%%%%%%%%T", "T%%%%~%%%%%%%%,%%%~%%T%%~T", "T%%%%%,%%%%%%%%%%%%%%%,~%T", "T%%%~%%,%%%~%,%T~~~%T%T%%T", "TTTTTTTTTTTTTTTTTTTTTTTTTT"],
mori:["TTTTTTTTTTTTTTTTTTTTTTTTTT", "T...T...T...........T....T", "T...TT..T..T.TTT...TTT...T", "TTII.TTTT.......T...T.T..T", "T......TT.....T...T...TT.T", "T.....碑..........TTT..TT.T", "TT.................碑.....T", "T.TT...T.....TTTT.T....TTT", "TT.....T.....TT..T.....TTT", "T.....T.TT.......T.....T.T", "TTTT...T..TT....T........T", "T........TT.......T..T...T", "T.TT...........T..T.T....T", "T..T......................", "T..............T.T..T.T..T", "T.....T.T................T", "T............T..TTT..T.TTT", "T.......TT...T........T..T", "TT...T.TT..T.T......T....T", "T..........T..TT..T..T.TTT", "TT.......TT.碑....T...TT..T", "T........T....T..T..T..T.T", "T.T...T...T...T.....T.T..T", "T...TT..........T........T", "T...T..TT.T...T....TT..TTT", "TTTTTTTTTTTTTTTTTTTTTTTTTT"],
hakurei:["^^^^^^^^^^^^^^^^^^^^^^^^", "^SSSSS^^^SSTSSSSS^SS^^^^", "^S^SS^SSSSSS^SSS^SSSSSS^", "^SSSSSSSSS^SS^SSSSSS^SS^", "^S^S^S^SSSSSSS^SSSSSSSS^", "^S^SSSSSTSTSS^SSS^SSS^S^", "^SSSSSSS^SSSSSSSSSSST^S^", "^SSSSSSSSTSS^TSS^S^^SSS^", "^^^^^^^^^^^凍^^^^^^^^^^^^", "^SSSSSSSSSSSSSSSSSTSSSS^", "^SSSSS^SS^SSS^STSSSSSSS^", "^T^SSSSSSSSSST^STSSSSS^^", "^^SSSSSSSTSS^^SS^SSSSSS^", "^SSSSSSS^SSSTSSSS^SS^S^^", "^SS^SSSSSSSSSSSSSSSSSSS^", "^SSSSSSSSSSSS^^SSTSSSSS^", "^SSSSSSSSSSS^^SS^SSSSSS^", "^^SSSSSS^SSSSSTSSS^SSSS^", "^^SSS^SSSSSSSS^SSSSSSSS^", "^SS^TTS^SSSSS^S^^S^S^SS^", "^^SSS^^SSTSSSTSS^^SSSSS^", "^SSSSTSTSS^SSSSSSSSSSSS^", "^SSSSSST^SSS^SS^SSSSSSS^", "^T^^SSSSS^^SS^^SS^S^SSS^", "^SSSSSSSSSSSSS^^SSSSSST^", "^^^^^^^^^^^SS^^^^^^^^^^^"],
chikurin:["VVVVVVVVVVVVVVVVVVVVVVVVVV", "VV.V...VV...........VV...V", "VVV..V..V.V.VVV..V..VV...V", "V.V..V..VVV..........V...V", "VV....V.VV....V.V.....V..V", "V.V...VV.V......V.VV....VV", "VV..V....V.V.......V..V..V", "V.VV..V....V.V....V..V...V", "VV..V..V...V.VV...VV.V...V", "V...V.........VV.........V", "V.V.V..............V..VVVV", "VV..V.V...V.V...V.....VVVV", "VV.VV...V.....V..VV......V", "V..V...V.V......V..V.....V", "V.V...V..V.....VVV.V.....V", "V.......VV.VV.....V..V..VV", "V.V.V..VV.V..VV..V.V...V.V", "VV.VV...VV.V...VV......VVV", "VVV.............V.V..V..VV", "VV..VVV..V.....VVVVV.V...V", "VV..V......V..V..VVV.V...V", "VVV..V.VV..V.VV........V.V", "V....V........VVV.....V.VV", "V......V...V..VVV.VV.VV..V", "V.V.V.V.VVV..VVV.V..VVVV.V", "VVVVVVVVVVVVVVVVVVVVVVVVVV"],
ukishima:["**************************", "**************************", "***....**........*********", "***....**........***....**", "***....++........+++....**", "***....**........***....**", "*********........***....**", "*********........*********", "************+*************", "************+*************", "************+*************", "************+*************", "**.......***+****.......**", "**.......***+****.......**", "**......++++++++++......**", "**.......********.......**", "**.......********.......**", "**.......********.......**", "*****++++++++*******+*****", "************+*******+*****", "*********........***+*****", "*********........***+*****", "*********.......+++++*****", "*********........*********", "*********........*********", "**************************"],
hinowa:["TTTT=TTTTTTTTTT=TTTTTTTTTTTTTTTT", "T...=..........=,............^^T", "T.T.=..........=..P.....P^^..^.T", "T...=====...P..=...PP.P^..^....T", "T.VV.V..=......=....^^.^....^^.T", "T.V..TV.=.....T=....^.......^.^T", "TV...VVV=...P..=.,P.^.^.....^..T", "T..VVVV.=..T.P.=...P..^,^P.....T", "T..VT.P.=...,..=............T..T", "T.V,V,.V=.T..P.=..T............T", "T...V.V.=..PP..=.....,...,.....T", "T....V..=.....P=..T...P....T...T", "T...V.V.=..P.P.=.......T..,..P.T", "T.V...V.=...T..=....P..,.......T", "=========.....T=....P...P..TT..T", "T..V.T.V=......=....TPT..T.PP,.T", "TVV.V.P.=......=....P..........T", "TVV.VVV.=..T,..=..,...T........T", "TV......=....P.=P........P.....T", "TV.V.VV.=......=.P.......T.P...T", "T.T.....=================..P.P.T", "T.P............=....,...=...T..T", "T..............=..P.,...========", "T....T.T...,.P.=........,......T", "T...P.P....P...=.........P.....T", "T..T.....TPT...=...............T", "T~~~~~~~~~~~~~~B~~~~~~~~~~~~~~~T", "T..........TP..=...,....T..T...T", "T..............=...............T", "T...P......,.P.=..P..,.........T", "T......P..======...P...........T", "T....P,.P.=...,=...........PTP.T", "T.........=.JJJDJJJ............T", "T.P..,...T=.HHHHHHH.T...,.T.P..T", "TP.....,..=....=..,........,...T", "T,.T..,P..=....=,.T......,,....T", "T...============..P,.....T.P...T", "T.T.=.................T........T", "T...=....T..,.....T.....T.....TT", "TTTT=TTTTTTTTTTTTTTTTTTTTTTTTTTT"],
jouki:["MMMMMMMMMMMMMMMMMMMMMMMMMM", "MppppppppppppDppMpppppMpMM", "MppMppppppppppppM@pppppppM", "MppppppppppppppppppppppppM", "MMp弁ppppppppppp@pppppppppM", "Mpppppppppppppp@pMpppppppM", "Mpppppppp@pppppMMppppppMpM", "MpppppppppppppMppppppppppM", "MpMpppppppMpppMMp@pppppp@M", "pppppppppppppppppppppppppM", "Mppp@@pppppppppppppppMpppp", "MpppppppppppppppppMppppppM", "M@pppppMppppppppppp@pppppM", "MppppppMppppppppMpppppp@pM", "Mppppppppppppp@pMppppMpMpM", "MpppppppppMppMpMMppppMpppM", "MpMpp弁pppppppppMpppp弁ppp@M", "MpMpppppppppppppppppMpMppM", "MppMpppppMpMpppppppMpppMpM", "MMMMMMMMMMMMMMMMMMMMMMMMMM"],
seacave:[
"#################",
"######:::::######",
"#####:::n:::#####",
"#####:::::::#####",
"######:::::######",
"#######:::#######",
"########q########",
"#:::::::::::::::#",
"#::r::::K::::r::#",
"#:::::::::::::::#",
"#::::r::::::r:::#",
"########q########",
"#::::K::::::::::#",
"#:::::::::::::::#",
"#:::::::::::::::#",
"#::r:::::::::r::#",
"#:::::::E:::::::#",
"#################"]
};
Object.entries(ROWS).forEach(([k,rows])=>rows.forEach((r,i)=>{if(r.length!==rows[0].length)console.error('map row width',k,i,r.length);}));

function buildField(){
  const W=28,H=44;const m=[];for(let y=0;y<H;y++)m.push(Array(W).fill('.'));
  const setT=(x,y,c)=>{if(x>=0&&y>=0&&x<W&&y<H)m[y][x]=c;};
  const fill=(x0,y0,x1,y1,c)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)setT(x,y,c);};
  fill(1,1,9,8,'%');
  [[3,3],[4,3],[7,6],[8,6],[2,7]].forEach(([x,y])=>setT(x,y,'~'));
  for(let x=0;x<W;x++){setT(x,0,'T');setT(x,H-1,'T');}
  for(let y=0;y<H;y++){setT(0,y,'T');setT(W-1,y,'T');}
  for(let x=1;x<W-1;x++)setT(x,18,'~');
  fill(13,2,14,43,'=');
  setT(13,18,'B');setT(14,18,'B');
  fill(3,35,24,35,'=');
  for(let x=1;x<W-1;x++)if(x<12||x>15)setT(x,29,'F');
  const house=(x,y,w,h)=>{fill(x,y,x+w-1,y+1,'R');fill(x,y+2,x+w-1,y+h-1,'H');setT(x+Math.floor(w/2),y+h-1,'d');};
  house(3,31,6,4);house(18,31,6,4);house(4,37,5,4);house(19,37,5,4);
  setT(10,36,'W');setT(16,5,'C');
  fill(25,35,27,35,'=');
  setT(27,12,'=');setT(26,12,'=');setT(0,24,'=');setT(1,24,'=');setT(13,0,'=');setT(14,0,'=');setT(13,1,'=');setT(14,1,'=');
  [[3,24],[4,24],[3,25],[22,26],[23,26],[23,25],[5,15],[6,15],[21,15],[22,16],[17,6],[18,6],[18,7],[25,14],[24,15],[20,3],[21,3],[22,4],[9,21],[25,22],[2,12],[11,10],[16,13],[25,5],[25,6],[1,27],[26,27],[2,33],[25,33],[1,40],[26,40],[11,3],[3,10]].forEach(([x,y])=>setT(x,y,'T'));
  [[7,23],[8,23],[19,23],[20,24],[6,12],[7,13],[19,10],[20,11],[10,31],[16,33],[16,41],[9,41],[23,20],[4,20]].forEach(([x,y])=>{if(m[y][x]==='.')setT(x,y,',');});
  return m;
}

const fireOn=()=>!G.lost.includes('火');
const MAPS={
  town:{
    rows:ROWS.town,night:true,title:'王都 ― 灯火祭の夜',
    npcs:()=>[
      {id:'lucia_t',x:12.5,y:13.5,name:'フードの少女',col:'#5B4A6B',hair:'#5B4A6B',hood:true,dir:1,show:()=>!G.flags.luciaWith,talk:()=>STORY.luciaTown()},
      {id:'rina_t',x:5.5,y:8.5,name:'パン屋の娘',col:'#7B4B94',hair:'#C8553D',dir:0,talk:()=>STORY.rinaTown()},
      {id:'teller',x:15.5,y:10.5,name:'うらない師',col:'#4B2E83',hair:'#999',dir:1,talk:()=>STORY.teller()},
      {id:'kid_t',x:3.5,y:12.5,name:'子ども',col:'#F2CC8F',hair:'#8B5A2B',small:true,dir:0,talk:()=>[['say','子ども',['灯火祭って 大好き！','街灯の 火が ゆらゆらして、きれいでしょ？']]]},
      {id:'old_t',x:17.5,y:12.5,name:'おばあさん',col:'#9C6644',hair:'#DDD',dir:1,talk:()=>[['say','おばあさん',['灯火祭はね、初代の 女王さまが 世界に 灯りを ともした日を 祝う お祭りなんだよ。']]]},
      {id:'guard_s',x:9.5,y:20.5,name:'衛兵',col:'#8D99AE',hair:'#555',dir:3,talk:()=>[['say','衛兵',['戦士長どの、お疲れさまです！','祭りの夜は 城下の外へは 出られない 決まりです。']]]}
    ],
    triggers:()=>[
      {x:9,y:2,w:2,h:1,run:()=>STORY.castleGateNight()},
      {x:16,y:2,w:3,h:2,run:()=>STORY.lookout(),cond:()=>G.flags.luciaWith&&!G.flags.festivalEnd}
    ],
    foes:[]
  },
  castle:{
    rows:ROWS.castle,title:'王城',
    npcs:()=>[
      {id:'king',x:8.5,y:2.5,name:'国王',col:'#8E2C3E',hair:'#DDD',crown:true,dir:0},
      {id:'mage',x:11.5,y:3.5,name:'宮廷魔導士',col:'#4B2E83',hair:'#777',dir:1},
      {id:'lucia_c',x:6.5,y:3.5,name:'ルシア',col:'#F4F1EA',hair:'#E8C45A',dir:2,show:()=>G.flags.throneDone&&!G.flags.nightDone},
      {id:'cook',x:2.5,y:10.5,name:'料理長',col:'#EEE',hair:'#6B3E26',dir:2,talk:()=>STORY.cook()},
      {id:'maid',x:4.5,y:7.5,name:'メイド',col:'#2B2D42',hair:'#6B3E26',dir:0,talk:()=>[['say','メイド',['今朝は 暖炉が ただの 石の箱に 見えるんです……','あそこで 何を していたんでしたっけ？']]]},
      {id:'soldier',x:12.5,y:6.5,name:'兵士',col:'#8D99AE',hair:'#333',dir:1,talk:()=>[['say','兵士',['戦士長！ おはようございます。','……あれ？ 背中の剣、なんだか 赤く 光ってません？']]]},
      {id:'lucia_n',x:13.5,y:12.5,name:'ルシア',col:'#3D6FB6',hair:'#E8C45A',dir:3,show:()=>G.flags.luciaAtBed&&!G.flags.nightDone}
    ],
    triggers:()=>[
      {x:8,y:5,w:2,h:1,cond:()=>!G.flags.cellarDone,block:true,run:()=>[['say','',['謁見の間は 朝の 会議中のようだ。（先に 厨房の 様子を 見に行こう）']]]},
      {x:8,y:4,w:2,h:1,cond:()=>G.flags.cellarDone&&!G.flags.throneDone,run:()=>STORY.throne()},
      {x:2,y:12,w:1,h:1,run:()=>[['warp','cellar',2.5,1.6,0]]},
      {x:8,y:14,w:2,h:1,block:true,run:()=>G.flags.throneDone?[['say','',['城門は 夜は 閉ざされている。……兵舎の ベッドで 休もう。']]]:[['say','',['まずは 城の 中の 様子を 確かめよう。']]]}
    ],
    interact:[{x:13,y:10,run:()=>STORY.bed()}],
    onEnter:()=>G.flags.morningIntro?null:STORY.morning()
  },
  cellar:{
    rows:ROWS.cellar,title:'城の地下貯蔵庫',dim:true,
    npcs:()=>[
      {id:'lucia_cel',x:2.5,y:3.5,name:'ルシア',col:'#F4F1EA',hair:'#E8C45A',dir:2,show:()=>G.flags.tut1Done&&!G.party.includes('lucia')&&!G.flags.cellarDone,talk:()=>STORY.luciaCellar()}
    ],
    triggers:()=>[
      {x:1,y:1,w:1,h:1,run:()=>[['warp','castle',2.5,11.4,0]]},
      {x:1,y:2,w:4,h:2,cond:()=>G.flags.tut1Done&&!G.party.includes('lucia')&&!G.flags.cellarDone,run:()=>STORY.luciaCellar()}
    ],
    foes:[['mouse',9,3],['mouse',4,8],['mouse',11,9]],
    special:[{k:'beetle',x:6,y:8,show:()=>G.party.includes('lucia')&&!G.flags.cellarDone}],
    onEnter:()=>G.flags.cellarIntro?null:[['flag','cellarIntro',true],['say','',['ひんやりと した 地下だ。奥で 何かが カサカサと 動いている。']]]
  },
  waterway:{
    rows:ROWS.waterway,title:'地下水路',dim:true,
    triggers:()=>[{x:6,y:10,w:2,h:1,run:()=>STORY.leaveWaterway()}],
    onEnter:()=>G.flags.waterIntro?null:STORY.waterIntro()
  },
  field:{
    build:buildField,title:'王都の外 ― 翠風の草原',
    npcs:()=>[
      {id:'baker',x:7.5,y:35.5,name:'パン屋のおかみ',col:'#E07A5F',hair:'#6B3E26',dir:0,talk:()=>STORY.baker()},
      {id:'inn',x:21.5,y:35.5,name:'宿屋の主人',col:'#3D5A80',hair:'#222',dir:0,talk:()=>STORY.inn()},
      {id:'rina_f',x:8.5,y:35.5,name:'パン屋の娘',col:'#7B4B94',hair:'#C8553D',dir:0,show:()=>!G.party.includes('rina'),talk:()=>STORY.rinaJoin()},
      {id:'sora_f',x:14,y:18.5,name:'橋の上の少年',col:'#3E8E6E',hair:'#B8D8C8',dir:0,big:true,sleep:true,show:()=>!G.party.includes('sora'),talk:()=>STORY.soraJoin()},
      {id:'bear',x:16.5,y:5.5,name:'くいしんぼうの 大ぐま',bear:true,big:true,sleep:true,show:()=>!G.flags.bearMoved&&!(G.dg&&G.dg.boss),talk:()=>STORY.bear()},
      {id:'toolshop',x:6.5,y:41.5,name:'道具屋',col:'#6A994E',hair:'#6B3E26',dir:3,talk:()=>STORY.toolShop()},
      {id:'armshop',x:21.5,y:41.5,name:'武器屋',col:'#6C584C',hair:'#333',dir:3,talk:()=>STORY.armsShop()},
      {id:'kid',x:10.5,y:33.5,name:'村の子ども',col:'#F2CC8F',hair:'#8B5A2B',dir:0,small:true,talk:()=>[['say','村の子ども',['ねえ知ってる？ 名前が 赤い まものは すっごく強いんだって！','白い名前なら いい勝負。灰色なら ザコだよ！']]]},
      {id:'guard',x:11.5,y:30.5,name:'見張り',col:'#8D99AE',hair:'#555',dir:0,talk:()=>[['say','見張り',['北の草原は まものが 増えてるぞ。','名前が 灰色の 格下の まものなら、ぶつかるだけで 蹴散らせる。','東の奥には 草原のヌシ、北の丘には 古い炉の遺跡「火守の古炉」が あるそうだ。']]]},
      {id:'oldman',x:11.5,y:37.5,name:'井戸のおじいさん',col:'#9C6644',hair:'#DDD',dir:1,talk:()=>[['say','井戸のおじいさん',['火が消えた あの夜のことじゃ……','丘の上に、銀の髪の騎士が 立っておった。','あれは 夢じゃったのかのう……']]]},
      {id:'sign1',x:15.5,y:2.5,name:'立て札',sign:true,talk:()=>[['say','',['「この先 北の街道」','（まだ 先へは 進めない）']]]},
      {id:'sign2',x:10.5,y:6.5,name:'立て札',sign:true,talk:()=>[['say','',['「危険！ 沼のヌシ ガマ大王 Lv22」']]]},
      {id:'sign3',x:17.5,y:4.5,name:'立て札',sign:true,talk:()=>[['say','',['「火守の古炉」','「火の祖、ここに眠る」']]]}
    ],
    triggers:()=>[{x:16,y:5,w:1,h:1,run:()=>[['warp','ruins',7.5,26.5,3]]},
      {x:27,y:12,w:1,h:1,run:()=>[['warp','dangai',1.5,12.5,2]]},{x:0,y:24,w:1,h:1,run:()=>[['warp','mori',24.5,13.5,1]]},{x:13,y:43,w:2,h:1,run:()=>[['warp','shitsugen',12.5,1.5,0]]},{x:13,y:0,w:2,h:1,run:()=>[['warp','hakurei',11.5,24.4,3]]},
      {x:27,y:35,w:1,h:1,cond:()=>!G.flags.waterGone,block:true,run:()=>[['say','',['東の 港町ミナトベへ 続く道だ。','（今は 北の丘の「火守の古炉」が 先だ）']]]},
      {x:27,y:35,w:1,h:1,cond:()=>G.flags.waterGone,run:()=>[['warp','port',1.5,5.5,2]]}],
    foes:[['rat',12,26],['rat',16,24],['rat',7,26],['rat',19,27],['weed',6,21],['weed',20,21],['weed',10,14],['hare',18,12],['hare',8,11],['hare',15,9],['boar',22,10],['gama',5,4]],
    chest:{x:24.5,y:9.5,flag:'chest1',tier:2}
  },
  port:{
    rows:ROWS.port,title:'港町ミナトベ',water:true,
    npcs:()=>[
      {id:'mizuha_p',x:13.5,y:4.5,name:'水の神官',col:'#E8EEF5',hair:'#3D6FB6',long:true,dir:0,show:()=>!G.party.includes('mizuha'),talk:()=>STORY.mizuhaJoin()},
      {id:'oldfisher',x:7,y:8.5,name:'老いた漁師',col:'#5C6B73',hair:'#DDD',big:true,dir:0,show:()=>!G.party.includes('mizuha')&&!G.flags.seaDone,talk:()=>[['say','老いた漁師',['この先は 干上がった 海の底だ。','潮が いつ 戻るか わからねえ。水の 神官さまと 一緒でなきゃ、通せねえよ。']]]},
      {id:'kaito',x:4.5,y:7.5,name:'船長カイト',col:'#2B4C7E',hair:'#1B1B1B',dir:0,talk:()=>STORY.kaito()},
      {id:'fisher',x:16.5,y:7.5,name:'漁師',col:'#6C584C',hair:'#6B3E26',dir:1,talk:()=>[['say','漁師',G.flags.seaDone?['海が 戻ったぞ！ 今夜は 大漁 まちがいなしだ！']:['海が まるごと 干上がっちまった……','船が 砂の上じゃ、漁にも 出られねえ。']]]},
      {id:'portinn',x:4.5,y:4.5,name:'宿屋の女将',col:'#9C6644',hair:'#6B3E26',dir:0,talk:()=>STORY.inn('宿屋の女将')},
      {id:'porttool',x:17.5,y:4.5,name:'道具屋',col:'#6A994E',hair:'#333',dir:0,talk:()=>STORY.toolShop()}
    ],
    triggers:()=>[{x:0,y:5,w:1,h:1,run:()=>[['warp','field',26.5,35.5,1]]},
      {x:13,y:13,w:1,h:1,cond:()=>G.lost.includes('水'),run:()=>[['warp','seacave',8.5,15.4,3]]}],
    onEnter:()=>G.flags.portIntro?null:[['flag','portIntro',true],['say','',['港町ミナトベ。','……海が ない。見わたす かぎり、白い 砂の 海底が 広がっている。']],['say','リナ',['船が みんな 砂の 上に 乗っかってる……']]]
  },
  ship:{
    rows:ROWS.ship,title:'カイトの船',
    npcs:()=>[
      {id:'lucia_s',x:6.5,y:5.5,name:'ルシア',col:'#F4F1EA',hair:'#E8C45A',dir:2,show:()=>!G.flags.kraken,talk:()=>[['say','ルシア',['見て、レオン。海の 向こうが 少し 桜色に 見える。','……次は 間に合わせましょう。今度こそ。']]]},
      {id:'rina_s',x:9.5,y:6.5,name:'リナ',col:'#7B4B94',hair:'#C8553D',dir:1,show:()=>!G.flags.kraken,talk:()=>[['say','リナ',['母さんの パン、もう 半分 食べちゃった……。','だって 船の 上って、おなか すくんだもん！']]]},
      {id:'mizuha_s',x:6.5,y:8.5,name:'ミズハ',col:'#E8EEF5',hair:'#3D6FB6',long:true,dir:0,show:()=>!G.flags.kraken&&G.party.includes('mizuha'),talk:()=>[['say','ミズハ',['……だいじょうぶ です。','船は 平気です。落ちなければ。……落ちなければ。']]]},
      {id:'sora_s',x:8.5,y:3.5,name:'ソラ',col:'#3E8E6E',hair:'#B8D8C8',dir:0,show:()=>!G.flags.kraken&&G.party.includes('sora'),talk:()=>[['say','ソラ',['いい 風！ 帆が よろこんでる。','……ねえレオン。海の 下、なんか いる気が しない？']]]},
      {id:'kaito_s',x:8.5,y:9.5,name:'船長カイト',col:'#2B4C7E',hair:'#1B1B1B',dir:3,show:()=>!G.flags.kraken,talk:()=>[['say','船長カイト',['この 潮なら 夕方には ヒノワだ。','舳先（上の 先っぽ）で 前でも 見張っててくれ！']]]}
    ],
    triggers:()=>[{x:5,y:0,w:6,h:3,cond:()=>!G.flags.kraken,run:()=>STORY.kraken()}],
    onEnter:()=>G.flags.sailIntro?null:[['flag','sailIntro',true],['flag','earthMig',true],['fade','翌朝 ―― 出航'],['say','',['カイトの 船は、東の 島国ヒノワへ 向けて 港を 出た。','リナの 両親に もらった パンの 匂いが、甲板に ただよっている。']],['say','',['……出航の 前夜は、新月だった。','港に 届いた 知らせ。「王国の 畑が、枯れはじめている」']],['lose','土'],['say','',['<span class="hot">土が 消えた。</span>（レオンの「岩砕き」は 使えない。土を 取り戻す 寄り道は、あとで 飛行艇から 挑める）']],['say','船長カイト',['舳先で 見張りを 頼む！']]]
  },
  urahama:{
    rows:ROWS.urahama,title:'ヒノワ・浦浜の漁村',
    npcs:()=>[
      {id:'obaba',x:5.5,y:17.5,name:'漁村の おばば',col:'#7A5C8A',hair:'#DDD',dir:0,talk:()=>STORY.obaba()},
      {id:'ufisher',x:16.5,y:21.5,name:'漁師',col:'#3B4A7A',hair:'#1B1B1B',dir:0,talk:()=>[['say','漁師',G.flags.kohakuJoin?['北の 竹林を 抜けて、ずっと 行けば 桜ノ津だ。','あっちの 浜にも、異国の 者が 流れ着いたって 噂だぞ。']:['嵐でも ねえのに、沖で 船が 沈んだらしい。','あんた、その 船の 生き残りかい？ ……北の 道場の 師範代なら、なにか 知ってるかもな。']]]},
      {id:'ukid',x:12.5,y:14.5,name:'村の子ども',col:'#E07A5F',hair:'#3A2A1C',dir:0,talk:()=>[['say','村の子ども',['おにいちゃん、ひとり？','ひとりで 旅するの、さみしくない？']]]},
      {id:'kohaku_d',x:11.5,y:3.5,name:'道場の侍',col:'#3B4A7A',hair:'#1B1B1B',dir:0,show:()=>!G.flags.kohakuJoin,talk:()=>STORY.kohakuMeet()}
    ],
    triggers:()=>[{x:10,y:0,w:2,h:1,cond:()=>G.flags.epLucia,run:()=>[['warp','hinowa',4.5,38.4,3]]},{x:10,y:0,w:2,h:1,cond:()=>!G.flags.epLucia,block:true,run:()=>[['say','',G.flags.kohakuJoin?['この 先は 港町「桜ノ津」へ 続く 竹林の 道だ。','（今は 道場の 侍と 話そう）']:['竹林の 奥へ 続く 道だ。','……ひとりで 進むには、心細い。まずは 村の 北の 道場を 訪ねてみよう。']]]}],
    foes:[['kappa',17,23],['kappa',4,24],['tanuki',6,10],['tanuki',15,8],['kappa',9,23],['tanuki',17,11]],
    onEnter:()=>G.flags.urahamaIntro?null:STORY.wakeUp()
  },
  sakuranotsu:{
    rows:ROWS.sakuranotsu,title:'ヒノワ・港町 桜ノ津',
    npcs:()=>[
      {id:'funa',x:8.5,y:19.5,name:'船大工',col:'#8B5A2B',hair:'#DDD',dir:0,show:()=>G.flags.ch2End,talk:()=>STORY.funadaiku()},
      {id:'kaito_s2',x:6.5,y:20.5,name:'船長カイト',col:'#2B4C7E',hair:'#1B1B1B',dir:0,show:()=>G.flags.ch2End,talk:()=>STORY.krakenRematch()},
      {id:'sarms',x:14.5,y:12.5,name:'刀剣屋',col:'#3B4A7A',hair:'#333',dir:0,show:()=>G.party[0]==='leon'||G.flags.ch2End,talk:()=>[['say','刀剣屋',['ヒノワの 鋼は よく 斬れるよ。']],['shop','arms2']]},
      {id:'dango',x:16.5,y:14.5,name:'団子屋の親方',col:'#C8553D',hair:'#333',dir:0,talk:()=>STORY.dangoBoss()},
      {id:'sinn',x:4.5,y:14.5,name:'宿屋の女将',col:'#9C6644',hair:'#1B1B1B',dir:0,talk:()=>STORY.inn('宿屋の女将')},
      {id:'stool',x:17.5,y:19.5,name:'道具屋',col:'#6A994E',hair:'#333',dir:0,talk:()=>STORY.toolShop()},
      {id:'smiko',x:12.5,y:3.5,name:'稲荷の巫女',col:'#F4F1EA',hair:'#1B1B1B',long:true,dir:0,talk:()=>[['say','稲荷の巫女',G.flags.foxDone?['お狐さまが 静まりました。ありがとうございます。']:['森の お狐さまが、この ところ 荒れて いるのです。','団子の 供え物が 途絶えてから……']]]},
      {id:'sgirl',x:7.5,y:19.5,name:'町の娘',col:'#E88FB0',hair:'#6B3E26',dir:0,talk:()=>G.flags.epLucia?STORY.qNeko():[['say','町の娘',['桜が ちょっと 色あせて きてる 気が しない？','この 島の 桜が こんなに 元気 ないの、はじめて。']]]},
      {id:'sfish',x:12.5,y:20.5,name:'船乗り',col:'#3B4A7A',hair:'#6B3E26',dir:0,talk:()=>[['say','船乗り',['南の 沖で 船が 沈んだってな。','流れ着いた 者は、浦浜や 山の 神社にも いるって 噂だ。']]]}
    ],
    triggers:()=>[{x:0,y:15,w:1,h:1,cond:()=>!G.flags.epLucia,block:true,run:()=>[['say','',['西の 街道は 浦浜の 漁村へ 続いている。','（今は ここで 待つと 決めた）']]]},{x:0,y:15,w:1,h:1,cond:()=>G.flags.epLucia,run:()=>[['warp','hinowa',15.5,31.4,3]]},
      {x:10,y:22,w:3,h:1,block:true,run:()=>[['say','',['桟橋の 先は 海だ。']]]}],
    interact:[{x:10,y:2,r:1.6,run:()=>STORY.foxShrine()}],
    foes:[['kitsunebi',5,5],['kitsunebi',15,6],['tanuki',8,7],['kitsunebi',12,4]],
    onEnter:()=>G.flags.rinaEpIntro?null:STORY.rinaEp()
  },
  yamajinja:{
    rows:ROWS.yamajinja,title:'ヒノワ・山あいの 水守神社',
    npcs:()=>[
      {id:'kannushi',x:12.5,y:3.5,name:'神主',col:'#F4F1EA',hair:'#DDD',dir:0,talk:()=>STORY.kannushi()}
    ],
    triggers:()=>[{x:8,y:19,w:2,h:1,cond:()=>G.flags.epLucia,run:()=>[['warp','hinowa',30.5,22.5,1]]},{x:8,y:19,w:2,h:1,cond:()=>!G.flags.epLucia,block:true,run:()=>[['say','',G.flags.epMizuha?['山道を 下れば、港町 桜ノ津だ。','（今は 神社の 様子を 見守ろう）']:['山を 下る 道だ。','……その前に、神社の 様子が 気になる。']]]}],
    interact:[{x:9,y:7,r:1.4,run:()=>STORY.mizuLog()},{x:4,y:4,r:1.5,run:()=>STORY.chozuya()}],
    foes:[['kappa',4,13],['tanuki',15,14],['kitsunebi',10,16],['kappa',16,17]],
    onEnter:()=>G.flags.mizuEpIntro?null:STORY.mizuhaEp()
  },
  kazami:{
    rows:ROWS.kazami,title:'天風峰のふもと・風車の村 カザミ',
    npcs:()=>[
      {id:'fuu',x:4.5,y:3.5,name:'村の子 フウ',col:'#E0A526',hair:'#6B3E26',small:true,dir:0,talk:()=>STORY.fuu()},
      {id:'sora_down',x:15.5,y:3.5,name:'ソラ',col:'#3E8E6E',hair:'#B8D8C8',dir:0,big:true,sleep:true,show:()=>G.flags.epSora&&G.party[0]==='leon'&&!G.flags.soraCarried,talk:()=>STORY.carrySora()},
      {id:'kzelder',x:12.5,y:6.5,name:'村の長老',col:'#5C6B73',hair:'#DDD',dir:0,talk:()=>[['say','村の長老',G.flags.itachiDone?['大風車が また 回りだした。……だが、今夜は 新月じゃ。']:['風が 弱い……。天風峰から 下りてくる 風が、年々 細く なっておる。','このごろは かまいたちまで 出て、村の 風を 食い荒らしよる。']]]}
    ],
    triggers:()=>[{x:9,y:0,w:2,h:1,block:true,cond:()=>!G.flags.soraCarried,run:()=>[['say','',['天風峰の 頂上へ 続く 山道だ。','……今は この 村を 離れられない。']]]},
      {x:9,y:0,w:2,h:1,cond:()=>G.flags.soraCarried,run:()=>[['warp','tenpu',9.5,28.4,3]]},
      {x:9,y:17,w:2,h:1,cond:()=>!G.flags.epLucia,block:true,run:()=>[['say','',['山を 下る 道だ。','……今は この 村を 離れられない。']]]},{x:9,y:17,w:2,h:1,cond:()=>G.flags.epLucia,run:()=>[['warp','hinowa',15.5,1.5,0]]}],
    interact:[{x:15,y:2,r:1.6,run:()=>STORY.bigWindmill()}],
    foes:[['itachi',6,12],['itachi',14,14],['itachi',11,10],['kitsunebi',4,15]],
    onEnter:()=>G.flags.soraEpIntro?null:STORY.soraEp()
  },
  hidamari:{
    rows:ROWS.hidamari,title:'ヒノワ・山里 ヒダマリ',
    npcs:()=>[
      {id:'hv1',x:5.5,y:3.5,name:'村の じいさま',col:'#6C584C',hair:'#DDD',dir:0,talk:()=>STORY.hvTalk('hv1')},
      {id:'hv2',x:14.5,y:8.5,name:'村の おかみさん',col:'#9C6644',hair:'#3A2A1C',dir:1,talk:()=>STORY.hvTalk('hv2')},
      {id:'hv3',x:7.5,y:12.5,name:'村の 子ども',col:'#3D6FB6',hair:'#1B1B1B',small:true,dir:0,talk:()=>STORY.hvTalk('hv3')},
      {id:'hchief',x:10.5,y:4.5,name:'村長',col:'#5C6B73',hair:'#AAA',dir:0,talk:()=>STORY.hChief()}
    ],
    triggers:()=>[{x:10,y:17,w:1,h:1,block:true,run:()=>[['say','',G.flags.oniDone?['この 山道を 下れば、桜ノ津だ。']:['山を 下る 道だ。','……今、村を 置いては 行けない。']]]}],
    foes:[['tanuki',4,14],['itachi',15,13]],
    onEnter:()=>G.flags.luciaEpIntro?null:STORY.luciaEp()
  },
  tenpu:{
    rows:ROWS.tenpu,title:'天風峰',
    npcs:()=>[
      {id:'vega_t',x:12.5,y:7.5,name:'空賊の 船長',col:'#2B2B3A',hair:'#8E2C3E',long:true,dir:1,show:()=>!G.flags.nagiDone,talk:()=>STORY.vegaTalk()}
    ],
    triggers:()=>[{x:9,y:29,w:2,h:1,run:()=>[['warp','kazami',9.5,1.5,0]]},
      {x:4,y:6,w:12,h:3,cond:()=>!G.flags.vegaMet,run:()=>STORY.vegaMeet()},
      {x:4,y:17,w:13,h:1,cond:()=>!G.flags.soraMumble,run:()=>[['flag','soraMumble',true],['say','ソラ',['……レオン。','……オレ、重くない？']],['say','レオン',['軽すぎるくらいだ。……しゃべるな、体に さわる。']],['say','ソラ',['へへ……']]]}],
    interact:[{x:9,y:21,r:1.5,run:()=>STORY.pillar(9,21)},{x:10,y:12,r:1.5,run:()=>STORY.pillar(10,12)},{x:9,y:2,r:1.8,run:()=>STORY.windAltar()}],
    foes:[['itachi',5,24],['karasu',14,15],['itachi',4,16],['karasu',6,7]],
    onEnter:()=>G.flags.tenpuIntro?null:[['flag','tenpuIntro',true],['say','',['天風峰。ヒノワで いちばん 高い 山。','風の ない 山肌には、枯れた 草が 貼りついたまま 動かない。']],['say','コハク',['……本来は、上昇気流に 乗って 登る 山。','風が ない 今は、道が 途切れている。']]]
  },
  gearim:{
    rows:ROWS.gearim,title:'歯車の空都 ギアリム',
    npcs:()=>[
      {id:'gmech',x:10.5,y:9.5,name:'機関士の娘',col:'#C9A227',hair:'#6B3E26',dir:0,talk:()=>STORY.gMech()},
      {id:'ginn',x:4.5,y:4.5,name:'宿屋の主人',col:'#5C6B73',hair:'#333',dir:0,talk:()=>STORY.inn('宿屋の主人')},
      {id:'garms',x:15.5,y:9.5,name:'工房の 親方',col:'#8A7A5A',hair:'#333',dir:0,talk:()=>[['say','工房の 親方',['蒸気で 鍛えた 一級品だ。']],['shop','arms3']]},
      {id:'gtool',x:17.5,y:4.5,name:'道具屋',col:'#6A994E',hair:'#333',dir:0,talk:()=>STORY.toolShop()},
      {id:'gold1',x:4.5,y:13.5,name:'古老',col:'#6C584C',hair:'#DDD',dir:0,talk:()=>[['say','古老',G.lost.includes('闇')?['夜が 来ない……。わしら、もう 三日も 眠れておらん。']:['この 街は、千年前の 古代機関で 浮いておる。','じゃが この ところ、街が 少しずつ 傾いて きてな……']]]},
      {id:'gkid',x:16.5,y:13.5,name:'黒鴉の 子分',col:'#2B2B3A',hair:'#8E2C3E',small:true,dir:0,show:()=>!G.flags.vegaCaught,talk:()=>[['say','黒鴉の 子分',['ヴェガ姉ちゃんを 追ってきたの？','……姉ちゃんは 悪い人じゃ ないよ。屋根の 上に いるけど、言わないからね！']]]}
    ],
    triggers:()=>[{x:10,y:0,w:2,h:1,run:()=>[['warp','roofs',8.5,22.4,3]]},{x:21,y:9,w:1,h:1,run:()=>[['warp','jouki',1.5,9.5,2]]},
      {x:10,y:7,w:2,h:1,cond:()=>!G.flags.vegaCaught,block:true,run:()=>[['say','',['古代機関の 扉だ。古い 紋章の 錠が かかっている。','……首飾りの 形に 似た くぼみが ある。']]]},
      {x:10,y:7,w:2,h:1,cond:()=>G.flags.vegaCaught,run:()=>[['warp','archive',8.5,18.4,3]]},
      {x:10,y:17,w:2,h:1,block:true,cond:()=>!G.flags.ch3End,run:()=>[['say','',['一行の 飛行艇が 係留されている。','（今は 前へ 進もう）']]]},
      {x:10,y:17,w:2,h:1,block:true,cond:()=>G.flags.ch3End,run:()=>[['choice','ヴェガ','古代の翼の 準備は できてる。秘境 アルカノアへ 飛ぶかい？',['飛ぶ','まだ'],[[['fade','―― 古代の翼、色の ない 空へ'],['warp','arcanoa',10.5,17.5,3]],[['say','ヴェガ',['いつでも 言いな。']]]]]]}],
    foes:[],
    onEnter:()=>G.flags.gearimIntro?null:STORY.gearimIntro()
  },
  roofs:{
    rows:ROWS.roofs,title:'ギアリム・屋根の上',
    npcs:()=>[{id:'vega_r',x:8.5,y:2.5,name:'ヴェガ',col:'#2B2B3A',hair:'#8E2C3E',long:true,dir:0,show:()=>!G.flags.vegaCaught,talk:()=>STORY.vegaCaught()}],
    triggers:()=>[{x:8,y:23,w:2,h:1,run:()=>[['warp','gearim',10.5,1.5,0]]}],
    interact:[{x:6,y:17,r:1.5,run:()=>STORY.gearLever()},{x:11,y:10,r:1.5,run:()=>STORY.gearLever()}],
    foes:[['gearbot',12,20],['steamrat',5,11],['gearbot',13,9],['steamrat',6,3]],
    onEnter:()=>G.flags.roofIntro?null:[['flag','roofIntro',true],['say','',['歯車と 蒸気パイプの 屋根が、空の 上に 続いている。','屋根と 屋根の あいだは、雲の 海だ。']],['say','ソラ',['いた！ いちばん 上に ヴェガ！']]]
  },
  archive:{
    rows:ROWS.archive,title:'古代記録庫',dim:true,gears:true,
    triggers:()=>[{x:8,y:19,w:1,h:1,run:()=>[['warp','gearim',10.5,8.4,0]]}],
    interact:[{x:8,y:3,r:1.8,run:()=>STORY.record()}],
    foes:[['sludge',3,16],['sludge',13,15],['gearbot',6,5]],
    onEnter:()=>G.flags.archIntro?null:[['flag','archIntro',true],['say','',['古代機関の 真下。千年前の 記録庫。','壁の すきまから、光る 泥のような「残り」が じわじわ 染み出している。']],['say','ヴェガ',['奥の 扉が、どうしても 開かなくてね。','……あたしらだけじゃ、どうにも ならなかったんだ。']]]
  },
  arcanoa:{
    rows:ROWS.arcanoa,title:'碧樹の秘境 アルカノア',
    npcs:()=>[],
    triggers:()=>[{x:10,y:0,w:2,h:1,run:()=>[['warp','roots',10.5,22.4,3]]},
      {x:10,y:19,w:2,h:1,block:true,run:()=>[['say','',['古代の翼が 停泊している。','（メニューの「ひこうてい」で 各地へ 飛べる）']]]}],
    foes:[['kodama',5,10],['ruinbot',16,12],['kodama',14,7],['ruinbot',6,16],['sludge',15,16]],
    onEnter:()=>G.flags.arcIntro?null:STORY.arcIntro()
  },
  roots:{
    rows:ROWS.roots,title:'碧樹の 根の神殿',dim:true,
    triggers:()=>[{x:10,y:23,w:1,h:1,run:()=>[['warp','arcanoa',10.5,1.5,0]]},
      {x:1,y:3,w:19,h:5,cond:()=>!G.flags.soraConfess,run:()=>STORY.soraConfess()}],
    interact:[{x:10,y:17,r:1.4,run:()=>STORY.obstacle(10,17)},{x:10,y:14,r:1.4,run:()=>STORY.obstacle(10,14)},{x:10,y:11,r:1.4,run:()=>STORY.obstacle(10,11)},{x:10,y:8,r:1.4,run:()=>STORY.obstacle(10,8)},{x:10,y:2,r:1.8,run:()=>STORY.lightAltar()}],
    foes:[['kodama',15,20],['ruinbot',6,15],['sludge',14,5],['kodama',6,12]],
    onEnter:()=>G.flags.rootsIntro?null:[['flag','rootsIntro',true],['say','',['巨木の 根が 絡みあう 神殿。奥に 光の 祭壇が ある。']],['say','ヴェガ',['まっすぐ 行けりゃ 早いが……蔦に 岩に 滝に 影。道が ふさがってる。']]]
  },
  heart:{
    rows:ROWS.heart,title:'アルカノア・門の奥',
    npcs:()=>[{id:'noah_h',x:8.5,y:3.5,name:'ノア',col:'#4A5060',hair:'#DDE3EA',long:true,dir:0,show:()=>!G.flags.gameClear,talk:()=>STORY.noahTalk()}],
    onEnter:()=>G.flags.noahFire?null:STORY.noahFire()
  },
  henkyo:{
    rows:ROWS.henkyo,title:'王国の辺境・ガラムの畑',
    npcs:()=>[{id:'garam',x:7.5,y:6.5,name:'先代戦士長 ガラム',col:'#6C584C',hair:'#AAA',dir:0,talk:()=>STORY.garam()}],
    triggers:()=>[{x:9,y:1,w:1,h:1,run:()=>[['warp','dochi',8.5,11.4,3]]},{x:10,y:15,w:1,h:1,run:()=>[['warp','field',21.5,36.6,3]]}],
    foes:[['boar2',15,12],['rat2',4,13],['boar2',16,3]],
    onEnter:()=>G.flags.henkyoIntro?null:STORY.henkyoIntro()
  },
  dochi:{
    rows:ROWS.dochi,title:'辺境の 地の祭壇',dim:true,
    triggers:()=>[{x:8,y:12,w:1,h:1,run:()=>[['warp','henkyo',9.5,2.5,0]]}],
    interact:[{x:8,y:2,r:1.8,run:()=>STORY.earthAltar()}],
    foes:[['rat2',3,9],['rat2',13,6]],
    onEnter:()=>G.flags.dochiIntro?null:[['flag','dochiIntro',true],['say','',['乾いた 洞窟。奥に 地の祭壇が ある。']]]
  },
  hakusetsu:{
    rows:ROWS.hakusetsu,title:'ヒノワ・白雪嶺',
    npcs:()=>[{id:'shisho',x:10.5,y:9.5,name:'コハクの 師匠',col:'#3B4A7A',hair:'#DDD',dir:0,talk:()=>STORY.shisho()}],
    triggers:()=>[{x:9,y:19,w:2,h:1,run:()=>[['warp','hinowa',4.5,1.5,0]]}],
    interact:[{x:9,y:2,r:1.6,run:()=>STORY.iceAltar()},{x:9,y:4,r:1.2,run:()=>STORY.frozenFall()}],
    foes:[['snowhare',6,12],['icewisp',13,11],['snowhare',12,14]],
    onEnter:()=>G.flags.hakuIntro?null:STORY.hakuIntro()
  },
  haguruma:{
    rows:ROWS.haguruma,title:'ギアリム地下・歯車墓場',dim:true,gears:true,gateAt:[8,5],
    triggers:()=>[{x:8,y:14,w:1,h:1,run:()=>[['say','',['昇降機で 地上へ 戻った。']],['warp','gearim',12.5,14.5,3]]}],
    interact:[{x:8,y:2,r:1.8,run:()=>STORY.darkAltar()}],
    foes:[['gearbot',3,11],['steamrat',13,11]],
    onEnter:()=>G.flags.hagIntro?null:STORY.hagIntro()
  },
  dangai:{
    rows:ROWS.dangai,title:'王国の辺境・潮風の断崖（推奨Lv15〜20）',
    npcs:()=>[{id:'dsign',x:16.5,y:13.5,name:'立て札',sign:true,talk:()=>[['say','',['「潮風の 断崖」','「灯台の 光、海の 宝を 照らす」']]]},
      {id:'dview',x:18.5,y:6.5,name:'見晴らし',sign:true,talk:()=>[['say','',['水平線の 向こうに、桜色の 島影が 見える……。']]]}],
    triggers:()=>[{x:0,y:12,w:1,h:1,run:()=>[['warp','field',26.5,12.5,1]]}],
    interact:[{x:5,y:4,r:1.4,run:()=>STORY.mirror(5,4)},{x:15,y:7,r:1.4,run:()=>STORY.mirror(15,7)},{x:12,y:19,r:1.4,run:()=>STORY.mirror(12,19)}],
    chests:[{x:18.5,y:21.5,flag:'cDangai',show:()=>['5_4','15_7','12_19'].every(k=>G.flags['mir_'+k]),item:{type:'acc',name:'潮風の 首飾り',ri:3,hpb:25,opts:['最大HP +25%','勝利時の回復 +10%']}},{x:2.5,y:22.5,flag:'cDangai2',tier:1}],
    foes:[['gakegani',6,9],['shiokurage',10,15],['gakegani',13,19],['shiokurage',4,18],['iwagani',16,4]]
  },
  shitsugen:{
    rows:ROWS.shitsugen,title:'王国の辺境・きらめき湿原（推奨Lv18〜24）',get night(){return !!G.flags.swampNight;},
    npcs:()=>[{id:'ssign',x:13.5,y:2.5,name:'立て札',sign:true,talk:()=>[['say','',['「きらめき湿原」','「夜の 湿原は、昼と ちがう 顔を 見せる」']]]}],
    triggers:()=>[{x:12,y:0,w:2,h:1,run:()=>[['warp','field',13.5,42.4,3]]}],
    interact:[{x:4,y:3,r:1.5,run:()=>STORY.swampBell()}],
    chests:[{x:20.5,y:22.5,flag:'cSwamp',item:{type:'acc',name:'ひかり苔の お守り',ri:3,hpb:12,opts:['最大HP +12%','勝利時の回復 +10%','経験値 +10%']}},{x:22.5,y:3.5,flag:'cSwamp2',tier:1}],
    foes:[['numagaeru',7,5],['hikaritake',18,5],['numagaeru',16,12],['hikaritake',6,20],['hikarinushi',19,20]]
  },
  mori:{
    rows:ROWS.mori,title:'王国の辺境・いにしえの大森林（推奨Lv22〜28）',
    npcs:()=>[{id:'msign',x:13.5,y:12.5,name:'古い 立て札',sign:true,talk:()=>[['say','',['「三つの 碑に、森の 印を 刻め」','「○は 北西に、△は 南に、□は 北東に」']]]},
      {id:'mgate',x:4.5,y:3.5,name:'古代の門',sign:true,talk:()=>[['say','',['苔むした 古代の 門。びくとも しない。','……門の 紋様は、光でしか 開かないと 語っているようだ。']]]}],
    triggers:()=>[{x:25,y:13,w:1,h:1,run:()=>[['warp','field',1.5,24.5,2]]}],
    interact:[{x:6,y:5,r:1.4,run:()=>STORY.tablet(6,5)},{x:12,y:20,r:1.4,run:()=>STORY.tablet(12,20)},{x:19,y:6,r:1.4,run:()=>STORY.tablet(19,6)}],
    chests:[{x:3.5,y:22.5,flag:'cMori',show:()=>STORY.tabletsOK(),item:{type:'acc',name:'疾風の 靴',ri:3,hpb:8,opts:['移動が 速くなる','最大HP +8%']},onOpen:()=>{G.flags.dash=true;}},{x:22.5,y:22.5,flag:'cMori2',tier:1}],
    foes:[['morikodama',8,8],['moridanuki',15,15],['morikodama',19,3],['moridanuki',5,17],['jureishin',7,23]]
  },
  hakurei:{
    rows:ROWS.hakurei,title:'王国の辺境・白嶺山脈（推奨Lv25〜30）',dim:true,noFlyOK:true,
    npcs:()=>[{id:'hsign',x:12.5,y:15.5,name:'立て札',sign:true,talk:()=>[['say','',['「白嶺山脈」','「白嶺の 頂に、氷晶の 剣 眠る」']]]},
      {id:'hview',x:14.5,y:3.5,name:'見晴らし',sign:true,talk:()=>[['say','',['吹雪の 切れ間。雲の 上に、歯車の 街の 影が 浮かんで 見えた……。']]]}],
    triggers:()=>[{x:11,y:25,w:2,h:1,run:()=>[['warp','field',13.5,1.6,0]]}],
    interact:[{x:11,y:8,r:1.4,run:()=>STORY.hkFall()}],
    chests:[{x:11.5,y:2.5,flag:'cHakurei',item:{type:'weapon',wtype:'sword',name:'氷晶の剣',ri:4,atk:70,opts:['崩しダメージ +30%','攻撃力 +10']}},{x:21.5,y:1.5,flag:'cHakurei2',tier:2}],
    foes:[['yukiusagi',6,19],['hyouki',16,17],['yukiusagi',4,12],['hyouki',19,11],['hakureiookami',15,4]]
  },
  chikurin:{
    rows:ROWS.chikurin,title:'ヒノワ・竹林の街道（推奨Lv26〜31）',
    npcs:()=>[{id:'csign',x:13.5,y:23.5,name:'立て札',sign:true,talk:()=>[['say','',['「竹林の 街道」','「迷うな。大天狗の 庭なり」']]]}],
    triggers:()=>[{x:12,y:25,w:1,h:1,run:()=>[['warp','hinowa',1.5,14.5,2]]}],
    chests:[{x:3.5,y:23.5,flag:'dia1',diary:1},{x:20.5,y:3.5,flag:'dia2',diary:2},{x:17.5,y:21.5,flag:'dia3',diary:3},{x:18.5,y:10.5,flag:'cChiku',tier:2}],
    foes:[['takegarasu',12,14],['takedanuki',5,14],['takegarasu',20,8],['takedanuki',22,17],['daitengu',5,4]]
  },
  ukishima:{
    rows:ROWS.ukishima,title:'ギアリム・雲海の浮き島（推奨Lv32〜37）',
    npcs:()=>[{id:'usign',x:14.5,y:23.5,name:'立て札',sign:true,talk:()=>[['say','',['「雲海の 浮き島」','「雲鯨の 通り道。落ちるな」']]]}],
    triggers:()=>[{x:12,y:24,w:1,h:1,run:()=>[['warp','jouki',24.5,10.5,1]]}],
    chests:[{x:4.5,y:3.5,flag:'cUki1',tier:2},{x:21.5,y:4.5,flag:'cUki2',tier:2},{x:3.5,y:16.5,flag:'cUki3',tier:1}],
    foes:[['kumonosei',5,14],['norakihei',20,14],['kumonosei',12,4],['norakihei',14,21],['kumokujira',12,5]]
  },
  hinowa:{
    rows:ROWS.hinowa,title:'ヒノワ・桜の街道',
    npcs:()=>[
      {id:'hcat',x:2.5,y:1.5,name:'子猫',col:'#F2C9A0',hair:'#E0A526',small:true,dir:0,show:()=>G.quests&&G.quests.neko==='on'&&!G.flags.catFound,talk:()=>STORY.catFound()},
      {id:'htrav',x:16.5,y:21.5,name:'旅の 行商人',col:'#8B5A2B',hair:'#333',dir:0,talk:()=>STORY.qMukade()},
      {id:'hsign1',x:16.5,y:19.5,name:'道しるべ',sign:true,talk:()=>[['say','',['「北：風車の村 カザミ／天風峰」','「西：竹林の街道」 「北西：白雪嶺」','「東：水守神社」 「南：桜ノ津／浦浜」']]]}
    ],
    triggers:()=>[
      {x:15,y:32,w:1,h:1,run:()=>[['warp','sakuranotsu',1.5,15.5,2]]},
      {x:4,y:39,w:1,h:1,run:()=>[['warp','urahama',10.5,1.5,3]]},
      {x:31,y:22,w:1,h:1,run:()=>[['warp','yamajinja',8.5,18.4,0]]},
      {x:15,y:0,w:1,h:1,run:()=>[['warp','kazami',9.5,16.4,0]]},
      {x:0,y:14,w:1,h:1,run:()=>[['warp','chikurin',12.5,24.4,0]]},
      {x:4,y:0,w:1,h:1,run:()=>[['warp','hakusetsu',9.5,18.4,0]]}
    ],
    foes:[['kappa',6,33],['kappa',20,30],['tanuki',25,34],['oogama',22,24],['oogama',10,22],['onibi',18,15],['onibi',11,9],['tsumuji',25,11],['tsumuji',18,4],['yamagarasu',27,16],['yamagarasu',3,10],['omukade',28,3]]
  },
  jouki:{
    rows:ROWS.jouki,title:'ギアリム・蒸気の裏通り',
    npcs:()=>[{id:'jsign',x:11.5,y:8.5,name:'立て札',sign:true,talk:()=>[['say','',['「東：雲海の浮き島」 「北：歯車墓場への 昇降機」','「圧力弁は 勝手に 回すな ―― 機関組合」']]]}],
    triggers:()=>[{x:0,y:9,w:1,h:1,run:()=>[['warp','gearim',19.5,9.5,1]]},{x:25,y:10,w:1,h:1,run:()=>[['warp','ukishima',12.5,22.5,3]]},
      {x:13,y:1,w:1,h:1,cond:()=>!G.flags.vegaJoin,block:true,run:()=>[['say','',['地下への 昇降機だ。……鍵が かかっている。']]]},
      {x:13,y:1,w:1,h:1,cond:()=>G.flags.vegaJoin,run:()=>[['warp','haguruma',8.5,12.5,3]]}],
    interact:[{x:5,y:16,r:1.4,run:()=>STORY.valve(5,16)},{x:20,y:16,r:1.4,run:()=>STORY.valve(20,16)},{x:3,y:4,r:1.4,run:()=>STORY.valve(3,4)}],
    foes:[['steamrat',6,12],['gearbot',18,5],['sludge',21,13],['boukon',9,3],['boukon',22,7],['gearbot',4,17]]
  },
  seacave:{
    rows:ROWS.seacave,title:'干上がった海底洞窟',dim:true,
    triggers:()=>[{x:8,y:16,w:1,h:1,run:()=>[['warp','port',13.5,14.3,0]]}],
    interact:[{x:8,y:2,r:1.8,run:()=>STORY.waterAltar()}],
    foes:[['crab',4,13],['jelly',12,9],['crab',3,7]],
    onEnter:()=>G.flags.seaIntro?null:[['flag','seaIntro',true],['say','',['干上がった 海底洞窟に 入った。貝殻と 珊瑚が 白く 乾いている。']],['say','ミズハ',['奥に 水の祭壇が あるはずです。……割れ目が 道を ふさいでいますね。']]]
  },
  ruins:{
    rows:ROWS.ruins,title:'火守の古炉',dim:true,
    triggers:()=>[{x:7,y:28,w:1,h:1,run:()=>[['warp','field',16.5,6.6,0]]}],
    interact:[{x:7,y:3,r:1.8,run:()=>STORY.altar()}],
    foes:[['rat',11,27],['rat',10,11],['rat',4,17]],
    onEnter:()=>G.dg&&G.dg.intro?null:STORY.ruinsIntro(),
    puzzle:true
  }
};
const G1=[[6,15],[3,16],[11,16],[3,19],[7,19],[11,19],[7,21]];
const G2=[[7,8],[2,10],[5,10],[9,10],[12,10],[7,12]];
