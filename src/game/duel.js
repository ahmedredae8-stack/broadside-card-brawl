// قواعد المبارزة: حتمية بالكامل. نفس المدخلات تعطي نفس النتيجة دائمًا (تعمل في المتصفح وفي السيرفر).
export const CFG={rounds:10,decideSeconds:10,buildSeconds:20,shipHp:60,burnDamage:8,burnRounds:3};
export const WEAPONS={
 cannon:{name:'المدفع',type:'kinetic',dmg:30,cd:0,aim:'spot'},
 mortar:{name:'الهاون',type:'kinetic',dmg:36,splash:18,cd:1,aim:'spot'},
 missile:{name:'الصواريخ',type:'kinetic',dmg:30,cd:1,aim:'ship'},
 torpedo:{name:'الطوربيد',type:'pierce',dmg:40,cd:1,aim:'spot'},
 fire_barrel:{name:'الجمرة',type:'fire',dmg:15,cd:1,aim:'spot',burn:true},
 frost_shell:{name:'الصقيع',type:'ice',dmg:10,cd:1,aim:'spot',freeze:true},
 harpoon:{name:'الحربة',type:'pierce',dmg:10,cd:2,aim:'spot',pin:true},
 sun:{name:'شمس الليل',type:'ultimate',dmg:40,cd:99,aim:'all'}};
export const SHIELDS={
 1:{name:'درع البرونز',blocks:['kinetic'],hits:1,reflect:0},
 2:{name:'درع الفولاذ',blocks:['kinetic','fire'],hits:1,reflect:0},
 3:{name:'درع الزمرد',blocks:['kinetic','fire','ice'],hits:2,reflect:0},
 4:{name:'درع الجوهرة',blocks:['kinetic','fire','ice','pierce'],hits:2,reflect:0},
 5:{name:'الدرع الملكي العاكس',blocks:['kinetic','fire','ice','pierce'],ultimateHalf:true,hits:3,reflect:.4}};
const other=s=>s==='a'?'b':'a',clone=o=>JSON.parse(JSON.stringify(o));
// cfg: {first:'a'|'b', a:{ships:[{weapons:[..],spot:0|1}x3],shields:[tier..]}, b:{...}}
export function newState(cfg){const mk=p=>({shields:p.shields.slice(),ships:p.ships.map((s,i)=>({id:i,hp:CFG.shipHp,max:CFG.shipHp,spot:s.spot|0,shield:null,lock:0,frozen:false,burn:0,alive:true,weapons:s.weapons.map(w=>({id:w,cd:0,used:false}))}))});
 return{round:1,first:cfg.first,a:mk(cfg.a),b:mk(cfg.b),over:false,winner:null}}
export const attackerOf=s=>s.round%2===1?s.first:other(s.first);
export function validate(state,side,ch){if(!ch||ch.type==='pass')return side===attackerOf(state)?'المهاجم يجب أن يختار':null;const P=state[side],att=side===attackerOf(state);
 if(ch.type==='shield'){const sh=P.ships[ch.ship];if(!sh||!sh.alive)return'سفينة غير صالحة';if(sh.shield)return'عليها درع';if(!P.shields.includes(ch.tier))return'لا تملك هذا الدرع';return null}
 if(ch.type==='move'){if(att)return'المهاجم لا يتحرك';const sh=P.ships[ch.ship];if(!sh||!sh.alive)return'سفينة غير صالحة';return null}
 if(ch.type==='attack'){if(!att)return'المدافع لا يهاجم';const sh=P.ships[ch.ship];if(!sh||!sh.alive)return'سفينة غير صالحة';const w=sh.weapons.find(x=>x.id===ch.weapon);if(!w)return'سلاح غير موجود';if(w.cd>0||(ch.weapon==='sun'&&w.used))return'السلاح في فترة انتظار';
  const t=state[other(side)].ships[ch.target&&ch.target.ship];if(!t||!t.alive)return'هدف غير صالح';return null}
 return'اختيار غير معروف'}
function dead(sh,ev,side){if(sh.hp<=0&&sh.alive){sh.hp=0;sh.alive=false;sh.shield=null;ev.push({t:'dead',side,ship:sh.id})}}
// يطبّق ضربة واحدة على سفينة ويراعي الدرع. يعيد وصف النتيجة.
function strike(state,ev,tSide,t,w,base,att){const wp=WEAPONS[w.id||w],type=wp.type,res={side:tSide,ship:t.id,spot:t.spot,kind:'hit',dmg:0,tags:[]};let d=base;
 const sh=t.shield;if(sh){const S=SHIELDS[sh.tier];if(type==='ultimate'&&S.ultimateHalf){d=Math.round(d*.5);res.tags.push('نصف القوة');sh.hits--}
  else if(S.blocks.includes(type)){sh.hits--;res.kind='blocked';res.tier=sh.tier;if(S.reflect>0&&att){const r=Math.round(base*S.reflect);att.hp-=r;res.reflect={ship:att.id,dmg:r}}
   if(sh.hits<=0){t.shield=null;ev.push({t:'shieldBreak',side:tSide,ship:t.id})}return res}
  if(sh.hits<=0){t.shield=null;ev.push({t:'shieldBreak',side:tSide,ship:t.id})}}
 if(type==='kinetic'&&t.frozen){d*=2;t.frozen=false;t.lock=0;res.tags.push('تحطّم ×2')}
 res.dmg=Math.round(d);t.hp-=res.dmg;if(wp.burn&&t.alive){t.burn=CFG.burnRounds;res.tags.push('حرق')}if(wp.freeze&&t.alive){t.frozen=true;t.lock=1;res.tags.push('تجميد')}if(wp.pin&&t.alive){t.lock=1;res.tags.push('تثبيت')}
 return res}
export function resolveRound(state0,ch){const s=clone(state0),ev=[],att=attackerOf(s),def=other(att);
 // 1) الحرق في بداية كل جولة
 for(const side of ['a','b'])for(const sh of s[side].ships)if(sh.alive&&sh.burn>0){sh.burn--;sh.hp-=CFG.burnDamage;ev.push({t:'burn',side,ship:sh.id,dmg:CFG.burnDamage});dead(sh,ev,side)}
 // 2) الدروع والتحرك (قبل الهجوم) — الاختيارات سرية ومتزامنة
 for(const side of [att,def]){const c=ch[side];if(!c||validate(s,side,c))continue;const P=s[side];
  if(c.type==='shield'){const sh=P.ships[c.ship];P.shields.splice(P.shields.indexOf(c.tier),1);sh.shield={tier:c.tier,hits:SHIELDS[c.tier].hits};ev.push({t:'shield',side,ship:c.ship,tier:c.tier})}
  if(c.type==='move'){const sh=P.ships[c.ship];if(sh.lock>0)ev.push({t:'moveFail',side,ship:c.ship,reason:sh.frozen?'مجمّدة':'مثبّتة'});else{sh.spot^=1;ev.push({t:'move',side,ship:c.ship,spot:sh.spot})}}}
 // 3) الهجوم
 const ac=ch[att];if(ac&&ac.type==='attack'&&!validate(s,att,ac)){const A=s[att].ships[ac.ship],W=A.weapons.find(x=>x.id===ac.weapon),wp=WEAPONS[ac.weapon],tS=s[def],T=tS.ships[ac.target.ship],hits=[];
  if(ac.weapon==='sun')W.used=true;
  if(wp.aim==='all'){tS.ships.forEach(t=>{if(t.alive)hits.push(strike(s,ev,def,t,ac.weapon,wp.dmg,A))})}
  else if(wp.aim==='ship'){hits.push(strike(s,ev,def,T,ac.weapon,wp.dmg,A))}
  else{const spot=ac.target.spot;if(T.spot===spot)hits.push(strike(s,ev,def,T,ac.weapon,wp.dmg,A));
   else if(wp.splash)hits.push(Object.assign(strike(s,ev,def,T,ac.weapon,wp.splash,A),{kind:'splash'}));
   else hits.push({side:def,ship:T.id,spot,kind:'miss',dmg:0,tags:[]})}
  hits.forEach(h=>{const t=tS.ships[h.ship];if(h.kind!=='miss'){}});
  ev.push({t:'fire',side:att,ship:ac.ship,weapon:ac.weapon,aim:{ship:ac.target.ship,spot:ac.target.spot},hits});
  hits.forEach(h=>{dead(tS.ships[h.ship],ev,def)});dead(A,ev,att);W.cd=wp.cd}
 // 4) نهاية الجولة: فترات الانتظار وأقفال الحركة
 for(const sh of s[att].ships)for(const w of sh.weapons)if(w.cd>0&&!(ac&&ac.type==='attack'&&ac.ship===sh.id&&ac.weapon===w.id))w.cd--;
 for(const sh of s[def].ships)if(sh.lock>0){sh.lock--;if(!sh.lock)sh.frozen=false}
 // 5) النهاية
 const hp=side=>s[side].ships.reduce((x,y)=>x+y.hp,0),alive=side=>s[side].ships.some(x=>x.alive);
 s.round++;if(!alive('a')||!alive('b')||s.round>CFG.rounds){s.over=true;const pa=hp('a'),pb=hp('b');s.winner=!alive('a')&&!alive('b')?'draw':!alive('a')?'b':!alive('b')?'a':pa===pb?'draw':pa>pb?'a':'b';ev.push({t:'end',winner:s.winner})}
 return{state:s,events:ev}}
// خصم آلي للتجربة. عشوائيته مزروعة بـ seed فلا يتغير ناتج نفس المباراة.
export function mulberry(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
export function aiChoose(state,side,rnd){const P=state[side],E=state[other(side)],att=attackerOf(state)===side,alive=P.ships.filter(x=>x.alive);
 if(att){const opts=[];alive.forEach(sh=>sh.weapons.forEach(w=>{if(w.cd===0&&!(w.id==='sun'&&w.used))opts.push([sh,w])}));
  if(!opts.length)return{type:'pass'};if(P.shields.length&&rnd()<.15){const sh=alive.find(x=>!x.shield);if(sh)return{type:'shield',ship:sh.id,tier:P.shields[0]}}
  const [sh,w]=opts[Math.floor(rnd()*opts.length)],ts=E.ships.filter(x=>x.alive),t=ts[Math.floor(rnd()*ts.length)];return{type:'attack',ship:sh.id,weapon:w.id,target:{ship:t.id,spot:rnd()<.62?t.spot:t.spot^1}}}
 const r=rnd();if(r<.4){const m=alive.filter(x=>x.lock===0);if(m.length)return{type:'move',ship:m[Math.floor(rnd()*m.length)].id}}
 if(r<.65&&P.shields.length){const c=alive.filter(x=>!x.shield);if(c.length)return{type:'shield',ship:c[Math.floor(rnd()*c.length)].id,tier:P.shields[0]}}return{type:'pass'}}
