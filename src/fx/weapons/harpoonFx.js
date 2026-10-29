// الحربة — حربة بحبل: الإطلاق ← الطيران ← علامة التصويب ← الاصطدام (إصابة / إخفاق / صدّ درع) ← ما بعد ← التثبيت المستمر.
// كل الرسم برمجي (بلا صور). كل الأرقام في HARPOON تعدّل من الخارج عبر opts.config.
// واجهة التثبيت: pin (حربة منغرسة وحبل مشدود بين السفينتين) / release (تخرج وتُسحب) / shiver (ارتجاف عند محاولة التحرك).
export const HARPOON={
 flight:{dur:.55,arc:.04,arcMin:14,len:52,sag:30,dust:22},
 launch:{smoke:7,sparks:12,ring:1,shake:2.2},
 warn:{at:.4},
 hit:{stop:.07,shake:4.5,shakeMs:320,zoom:1.012,flash:.08,sparks:20,splinters:12,dust:6,drops:9},
 miss:{shake:1.4,spray:10,drops:14,retract:.75},
 blocked:{shake:2.4,sparks:22,bounce:170,retract:.75},
 pin:{len:58,idle:.03,glintRate:5,sag:5}};
const rnd=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),eo=t=>1-Math.pow(1-t,3);
const merge=(a,b)=>{const o=Array.isArray(a)?a.slice():Object.assign({},a);for(const k in b)o[k]=b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])?merge(a[k]||{},b[k]):b[k];return o};
const curve=(c,t)=>{for(let i=1;i<c.length;i++)if(t<=c[i][0]){const a=c[i-1],b=c[i],u=(t-a[0])/(b[0]-a[0]||1);return lerp(a[1],b[1],u)}return c[c.length-1][1]};
const SPARK=['#ffffff','#ffe9a8','#ffb347','#d8641a'];
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function makeSprites(){const S={};
 const soft=(sz,st)=>{const c=cv(sz,sz),g=c.getContext('2d'),r=g.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);st.forEach(([o,a])=>r.addColorStop(o,'rgba(255,255,255,'+a+')'));g.fillStyle=r;g.fillRect(0,0,sz,sz);return c};
 S.soft=soft(128,[[0,1],[.35,.55],[1,0]]);S.core=soft(128,[[0,1],[.18,1],[.55,.3],[1,0]]);
 S.puff=(()=>{const c=cv(128,128),g=c.getContext('2d');for(let i=0;i<9;i++){const a=i/9*6.28,x=64+Math.cos(a)*18+rnd(-6,6),y=64+Math.sin(a)*18+rnd(-6,6),r=rnd(22,34),q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba(255,255,255,.55)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,128,128)}const q=g.createRadialGradient(64,64,0,64,64,40);q.addColorStop(0,'rgba(255,255,255,.5)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,128,128);return c})();
 S.ring=(()=>{const c=cv(256,256),g=c.getContext('2d'),r=g.createRadialGradient(128,128,70,128,128,126);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.72,'rgba(255,255,255,.15)');r.addColorStop(.9,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,256,256);return c})();
 S.streak=(()=>{const c=cv(128,24),g=c.getContext('2d'),r=g.createLinearGradient(0,0,128,0);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.7,'rgba(255,255,255,.8)');r.addColorStop(1,'rgba(255,255,255,1)');g.fillStyle=r;g.beginPath();g.moveTo(0,12);g.quadraticCurveTo(70,2,128,10);g.lineTo(128,14);g.quadraticCurveTo(70,22,0,12);g.fill();return c})();
 S.star=(()=>{const c=cv(192,192),g=c.getContext('2d');g.translate(96,96);for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4+.2);const l=i%2?58:92,r=g.createLinearGradient(0,0,l,0);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.beginPath();g.moveTo(0,-7);g.lineTo(l,0);g.lineTo(0,7);g.fill();g.restore()}const q=g.createRadialGradient(0,0,0,0,0,40);q.addColorStop(0,'rgba(255,255,255,1)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(-96,-96,192,192);return c})();
 S.splinter=(()=>{const c=cv(64,16),g=c.getContext('2d'),r=g.createLinearGradient(0,0,0,16);r.addColorStop(0,'#a8683a');r.addColorStop(1,'#3a210e');g.fillStyle=r;g.beginPath();g.moveTo(0,8);g.lineTo(52,1);g.lineTo(64,8);g.lineTo(52,15);g.closePath();g.fill();g.strokeStyle='#150a04';g.lineWidth=1.5;g.stroke();return c})();
 S.drop=(()=>{const c=cv(32,48),g=c.getContext('2d'),r=g.createLinearGradient(0,0,0,48);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(1,'rgba(190,230,248,.9)');g.fillStyle=r;g.beginPath();g.moveTo(16,2);g.quadraticCurveTo(30,28,16,46);g.quadraticCurveTo(2,28,16,2);g.fill();return c})();
 // حربة (تتجه لليمين، وطرف السنّ عند أقصى اليمين، وحلقة ربط الحبل عند أقصى اليسار)
 S.harpoon=(()=>{const c=cv(192,40),g=c.getContext('2d');g.lineJoin='round';
  const w=g.createLinearGradient(0,16,0,24);w.addColorStop(0,'#d6a96c');w.addColorStop(.5,'#9a6a36');w.addColorStop(1,'#4e2f14');g.fillStyle=w;g.fillRect(12,16,128,8);g.strokeStyle='#1c0f05';g.lineWidth=2;g.strokeRect(12,16,128,8);
  g.fillStyle='#caa772';[34,60,96].forEach(x=>{g.fillRect(x,15,6,10);g.strokeRect(x,15,6,10)});
  const m=g.createLinearGradient(0,11,0,29);m.addColorStop(0,'#e4ebf4');m.addColorStop(.5,'#8a96a6');m.addColorStop(1,'#2a313c');g.fillStyle=m;g.strokeStyle='#0d1117';g.lineWidth=2;
  g.fillRect(134,12,16,16);g.strokeRect(134,12,16,16);
  g.beginPath();g.moveTo(148,13);g.lineTo(176,15);g.lineTo(190,20);g.lineTo(176,25);g.lineTo(148,27);g.closePath();g.fill();g.stroke();
  g.beginPath();g.moveTo(158,15);g.lineTo(146,3);g.lineTo(170,14);g.closePath();g.fill();g.stroke();g.beginPath();g.moveTo(158,25);g.lineTo(146,37);g.lineTo(170,26);g.closePath();g.fill();g.stroke();
  g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1.6;g.beginPath();g.moveTo(152,17);g.lineTo(184,20);g.stroke();
  g.strokeStyle='#8a96a6';g.lineWidth=3;g.beginPath();g.arc(8,20,6,0,7);g.stroke();g.strokeStyle='#0d1117';g.lineWidth=1;g.stroke();return c})();
 return S}
const tintCache=new Map();
function tint(src,key,color){const k=key+color;let c=tintCache.get(k);if(!c){c=cv(src.width,src.height);const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,c.width,c.height);tintCache.set(k,c)}return c}
export function createHarpoonFx(root,opts){opts=opts||{};const C=merge(HARPOON,opts.config||{}),canvas=document.createElement('canvas'),cx=canvas.getContext('2d');
 Object.assign(canvas.style,{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none'});root.append(canvas);
 let W=450,H=500,dpr=1,K=opts.scale||1,P=[],bs=[],loose=[],auras=new Map(),user=1,hs=0,ramp=0,run=false,last=0,pend=[],clock=0;const S=makeSprites(),vis={};
 const layers=['launch','trail','harpoon','warn','impact','debris','smoke','decal','rope'];layers.forEach(l=>vis[l]=true);
 const ph=n=>{if(opts.onPhase)opts.onPhase(n)};
 function resize(w,h,d){W=w;H=h;dpr=d||1;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);K=opts.scale||w/450}
 function E(o){const p=Object.assign({x:0,y:0,vx:0,vy:0,ay:0,drag:0,age:0,life:1,s0:10,s1:10,rot:0,vr:0,spr:'soft',blend:'add',a:1,ac:null,pal:null,stretch:0,flat:1,z:3,layer:'impact',delay:0,tintc:null,sc:null,asp:1},o);P.push(p);kick();return p}
 function kick(){if(!run&&!opts.manual){run=true;last=performance.now();requestAnimationFrame(loop)}}
 const dust=(x,y,s0,s1,life,o)=>E(Object.assign({x,y,vy:-rnd(8,36)*K,vx:rnd(-30,30)*K,drag:1,life,s0,s1,spr:'puff',blend:'n',a:.5,ac:[[0,0],[.15,1],[.6,.6],[1,0]],z:1,layer:'smoke',tintc:Math.random()<.5?'#8d8070':'#b3a692',rot:rnd(0,6.28),vr:rnd(-.5,.5)},o||{}));
 const spark=(x,y,ang,sp,o)=>E(Object.assign({x,y,vx:Math.cos(ang)*sp,vy:Math.sin(ang)*sp,ay:520*K,drag:1.5,life:rnd(.25,.65),s0:rnd(10,20)*K,s1:2*K,spr:'streak',stretch:.008,a:1,z:3,pal:SPARK},o||{}));
 const splash=(x,y,n)=>{const k=K;for(let i=0;i<n;i++){const v=rnd(220,440)*k;E({x:x+rnd(-8,8)*k,y,vx:rnd(-60,60)*k,vy:-v,ay:900*k,drag:.3,life:rnd(.7,1.1),s0:rnd(14,24)*k,s1:rnd(36,60)*k,spr:'puff',blend:'n',a:1,ac:[[0,0],[.1,1],[.7,.7],[1,0]],z:2,layer:'smoke',tintc:'#f0fbff',rot:rnd(0,6.28),delay:rnd(0,.05)})}
  for(let i=0;i<14;i++){const a=rnd(-2.7,-.4),v=rnd(120,380)*k;E({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:900*k,life:rnd(.6,1),s0:rnd(10,15)*k,s1:rnd(7,10)*k,asp:1.5,spr:'drop',blend:'n',a:.95,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris'})}
  for(let i=0;i<3;i++)E({x,y:y+3*k,s0:12*k,s1:(130+i*40)*k,life:1,spr:'ring',a:1,flat:.32,z:1,layer:'impact',tintc:'#f4fcff',delay:i*.1,ac:[[0,.9],[.6,.4],[1,0]]})};
 function step(dt){const slow=hs>0?(hs-=dt,.04):ramp>0?(ramp-=dt,lerp(.04,1,1-clamp(ramp/.14,0,1))):1,d=dt*slow*user,k=K;clock+=d;
  for(let i=P.length-1;i>=0;i--){const p=P[i];if(p.delay>0){p.delay-=d;continue}p.age+=d;if(p.age>=p.life){P.splice(i,1);continue}p.vy+=p.ay*d;const q=Math.max(0,1-p.drag*d);p.vx*=q;p.vy*=q;p.x+=p.vx*d;p.y+=p.vy*d;p.rot+=p.vr*d}
  for(let i=bs.length-1;i>=0;i--){const b=bs[i];b.t+=d/C.flight.dur;const u=clamp(b.t,0,1),dx=b.to.x-b.from.x,dy=b.to.y-b.from.y,h=Math.max(C.flight.arcMin*k,C.flight.arc*b.dist),pos=v=>({x:b.from.x+dx*v,y:b.from.y+dy*v-4*h*v*(1-v)}),p0=pos(u),p1=pos(Math.min(1,u+.02));
   b.x=p0.x;b.y=p0.y;b.ang=Math.atan2(p1.y-p0.y,p1.x-p0.x);b.da+=d*C.flight.dust;
   while(b.da>=1&&vis.trail){b.da--;dust(b.x-Math.cos(b.ang)*C.flight.len*k*.6+rnd(-4,4)*k,b.y-Math.sin(b.ang)*C.flight.len*k*.6+rnd(-4,4)*k,rnd(5,8)*k,rnd(16,26)*k,rnd(.3,.55),{layer:'trail',a:.3,vx:rnd(-12,12)*k,vy:rnd(-12,12)*k})}
   if(Math.random()<d*40&&vis.trail)E({x:b.x,y:b.y,s0:6*k,s1:14*k,life:.2,spr:'star',a:1,z:4,layer:'trail',tintc:'#fff4cc',ac:[[0,0],[.3,1],[1,0]]});
   if(!b.warned&&u>=C.warn.at){b.warned=1;warn(b);ph(3)}
   if(b.t>=1){bs.splice(i,1);impact(b)}}
  for(let i=loose.length-1;i>=0;i--){const l=loose[i];if(l.delay>0){l.delay-=d;continue}
   if(l.phase==='fall'){l.t+=d;l.vy+=900*k*d;l.x+=l.vx*d;l.y+=l.vy*d;l.rot+=l.vr*d;if(l.t>=l.fallT){splash(l.x,l.y,5);l.phase='retract';l.r0={x:l.x,y:l.y};l.u=0}}
   else{l.u+=d/l.retract;const e=Math.pow(clamp(l.u,0,1),1.6),F=l.fromTrack?l.fromTrack():l.from;l.x=lerp(l.r0.x,F.x,e);l.y=lerp(l.r0.y,F.y,e);l.rot=Math.atan2(l.r0.y-F.y,l.r0.x-F.x);
    if(vis.trail&&Math.random()<d*60)E({x:l.x,y:l.y+4*k,s0:10*k,s1:30*k,life:.5,spr:'soft',blend:'n',a:.55,flat:.35,z:1,layer:'trail',tintc:'#f4fcff',ac:[[0,0],[.15,1],[1,0]]});if(l.u>=1)loose.splice(i,1)}}
  auras.forEach((a,key)=>{const T=a.track?a.track():a.pos;if(T)a.pos=T;a.age+=d;a.wave=Math.max(0,a.wave-d*.9);a.vib=Math.max(0,a.vib-d*1.6);a.pull=Math.max(0,a.pull-d*3);const pos=a.pos;if(!pos)return;
   a.ag+=d*C.pin.glintRate;while(a.ag>=1){a.ag--;const F=a.fromTrack?a.fromTrack():a.from,t=rnd(.1,.9);if(F)E({x:lerp(F.x,pos.x,t),y:lerp(F.y,pos.y,t),s0:5*k,s1:12*k,life:.35,spr:'star',a:.9,z:4,layer:'rope',tintc:'#ffe6a8',ac:[[0,0],[.3,1],[1,0]]})}});
  for(let i=pend.length-1;i>=0;i--){pend[i].t-=dt;if(pend[i].t<=0){pend[i].f();pend.splice(i,1)}}}
 // حبل مجدول: خط خارجي داكن + جسم + خيوط مضيئة متقطعة. sag تدلٍّ، wave موجة جانبية تخمد
 function rope(F,Pt,sag,wave,phs,al){const k=K,dx=Pt.x-F.x,dy=Pt.y-F.y,L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,N=22,pts=[];for(let i=0;i<=N;i++){const t=i/N,off=wave*Math.sin(Math.PI*t)*Math.sin(phs+t*9);pts.push([F.x+dx*t+nx*off,F.y+dy*t+ny*off+sag*4*t*(1-t)])}
  const path=()=>{cx.beginPath();pts.forEach((p,i)=>i?cx.lineTo(p[0],p[1]):cx.moveTo(p[0],p[1]))};cx.globalCompositeOperation='source-over';cx.lineCap='round';cx.lineJoin='round';cx.globalAlpha=al;
  cx.strokeStyle='#2a1a0c';cx.lineWidth=5.4*k;path();cx.stroke();cx.strokeStyle='#a07a48';cx.lineWidth=3.6*k;path();cx.stroke();cx.strokeStyle='#e0c08a';cx.lineWidth=1.5*k;cx.setLineDash([5*k,5*k]);path();cx.stroke();cx.setLineDash([]);cx.globalAlpha=1}
 function harp(x,y,ang,len){cx.save();cx.translate(x,y);cx.rotate(ang);const h=len*40/192;cx.drawImage(S.harpoon,-len*190/192,-h/2,len,h);cx.restore()}
 function draw(){cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
  for(let z=0;z<=4;z++){for(const p of P){if(p.z!==z||p.delay>0||!vis[p.layer])continue;const t=p.age/p.life;let a=p.a*(p.ac?curve(p.ac,t):1-t);if(a<=.004)continue;const s=lerp(p.s0,p.s1,p.sc?curve(p.sc,t):eo(t));if(s<=.2)continue;
    cx.globalAlpha=Math.min(1,a);cx.globalCompositeOperation=p.blend==='add'?'lighter':'source-over';cx.save();cx.translate(p.x,p.y);
    let img;if(p.pal)img=tint(S[p.spr],p.spr,p.pal[Math.min(p.pal.length-1,Math.floor(t*p.pal.length))]);else if(p.tintc)img=tint(S[p.spr],p.spr,p.tintc);else img=S[p.spr];
    if(p.stretch){const sp=Math.hypot(p.vx,p.vy);cx.rotate(Math.atan2(p.vy,p.vx));const l=Math.max(s,s*(1+sp*p.stretch));cx.drawImage(img,-l,-s*.5,l,s)}
    else{if(p.rot)cx.rotate(p.rot);if(p.flat!==1)cx.scale(1,p.flat);cx.drawImage(img,-s/2,-s*p.asp/2,s,s*p.asp)}cx.restore()}
   if(z===2){if(vis.rope)auras.forEach(drawPin);if(vis.harpoon){bs.forEach(drawFlying);loose.forEach(drawLoose)}}}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over'}
 const len=()=>C.flight.len*K;
 function drawFlying(b){const L=len(),tail={x:b.x-Math.cos(b.ang)*L*.97,y:b.y-Math.sin(b.ang)*L*.97},u=clamp(b.t,0,1);rope(b.from,tail,lerp(C.flight.sag,5,eo(u))*K,0,0,1);
  cx.globalAlpha=.22;cx.fillStyle='#000';cx.beginPath();cx.ellipse(b.x,b.y+30*K,L*.4,L*.07,0,0,7);cx.fill();cx.globalAlpha=1;harp(b.x,b.y,b.ang,L)}
 function drawLoose(l){if(l.delay>0)return;const L=len(),F=l.fromTrack?l.fromTrack():l.from,tail={x:l.x-Math.cos(l.rot)*L*.97,y:l.y-Math.sin(l.rot)*L*.97};rope(F,tail,(l.phase==='fall'?46:10)*K,0,0,l.phase==='retract'?.9:1);harp(l.x,l.y,l.rot,L)}
 // حربة منغرسة وحبل مشدود بين السفينتين
 function drawPin(a){const pos=a.pos;if(!pos||a.delay>0)return;const F=a.fromTrack?a.fromTrack():a.from;if(!F)return;const k=K,L=C.pin.len*k,ang=a.ang,tip={x:pos.x+Math.cos(ang)*5*k,y:pos.y+Math.sin(ang)*5*k},vb=Math.sin(a.age*46)*a.vib*.07,tail={x:tip.x-Math.cos(ang+vb)*L*.97,y:tip.y-Math.sin(ang+vb)*L*.97};
  const wv=(C.pin.idle+a.wave*.4)*Math.hypot(F.x-tail.x,F.y-tail.y)*.06+a.wave*4*k;rope(F,tail,(C.pin.sag+a.wave*6)*k,wv,clock*7,1);harp(tip.x,tip.y,ang+vb,L)}
 // ---------- 1) الإطلاق: لسان نار ودخان من فوهة مدفع الحربة، والحبل ينفلت
 function launch(F,ang){const k=K,L=C.launch,dx=Math.cos(ang),dy=Math.sin(ang);
  E({x:F.x+dx*8*k,y:F.y+dy*8*k,s0:16*k,s1:84*k,life:.11,spr:'star',a:1,z:4,layer:'launch',tintc:'#fff0c0',rot:ang,ac:[[0,1],[.4,1],[1,0]]});
  E({x:F.x+dx*10*k,y:F.y+dy*10*k,s0:14*k,s1:50*k,life:.13,spr:'core',a:1,z:4,layer:'launch',pal:['#ffffff','#ffd86a','#ff8a2a']});
  for(let i=0;i<L.sparks;i++)spark(F.x,F.y,ang+rnd(-.5,.5),rnd(180,460)*k,{layer:'launch'});
  for(let i=0;i<L.smoke;i++)dust(F.x+dx*8*k+rnd(-6,6)*k,F.y+dy*8*k,rnd(10,16)*k,rnd(40,64)*k,rnd(.7,1.2),{layer:'launch',a:.55,tintc:'#6e6a64',vx:dx*rnd(20,90)*k+rnd(-30,30)*k,vy:dy*rnd(20,90)*k-rnd(10,40)*k,delay:rnd(0,.05)});
  if(L.ring)E({x:F.x,y:F.y+4*k,s0:10*k,s1:76*k,life:.22,spr:'ring',a:.5,flat:.4,z:3,layer:'launch',tintc:'#d9d2c4'});
  if(opts.onShake)opts.onShake(L.shake*k,150)}
 // ---------- 3) علامة التصويب: حلقتان كهرمانيتان وتقاطع يضيقان على الهدف
 function warn(b){const k=K,T=b.to,life=(1-b.t)*C.flight.dur+.04;
  E({x:T.x,y:T.y+6*k,s0:130*k,s1:30*k,life,spr:'ring',a:.85,flat:.42,z:1,layer:'warn',tintc:'#ffcf5a',ac:[[0,0],[.15,1],[.85,1],[1,0]],sc:[[0,0],[1,1]]});
  E({x:T.x,y:T.y+6*k,s0:84*k,s1:18*k,life,spr:'ring',a:.9,flat:.42,z:1,layer:'warn',tintc:'#ffffff',ac:[[0,0],[.2,1],[.9,1],[1,0]],sc:[[0,0],[1,1]]});
  E({x:T.x,y:T.y+4*k,s0:70*k,s1:26*k,life,spr:'star',a:.7,flat:.5,z:1,layer:'warn',tintc:'#ffd980',rot:.4,vr:1.4,ac:[[0,0],[.3,.8],[.9,1],[1,0]],sc:[[0,0],[1,1]]})}
 // ---------- 4أ) الإصابة: السنّ ينغرس في الهيكل، والحبل يشتد ويرتجّ
 function hit(T,ang,b){const k=K,H_=C.hit;hs=H_.stop;ramp=.14;if(opts.onHitStop)opts.onHitStop(H_.stop*1000);
  E({x:T.x,y:T.y,s0:18*k,s1:96*k,life:.13,spr:'star',a:1,z:4,rot:ang,tintc:'#fff4cc',ac:[[0,1],[.3,1],[1,0]]});
  E({x:T.x,y:T.y,s0:24*k,s1:66*k,life:.18,spr:'core',a:1,z:4,pal:['#ffffff','#ffe9a8','#ffb347']});
  E({x:T.x,y:T.y+4*k,s0:8*k,s1:150*k,life:.38,spr:'ring',a:.8,flat:.45,z:3,tintc:'#f1f5ff',ac:[[0,.9],[1,0]]});
  E({x:T.x,y:T.y+4*k,s0:8*k,s1:100*k,life:.3,spr:'ring',a:.7,flat:.5,z:3,tintc:'#ffcf5a',delay:.03,ac:[[0,.8],[1,0]]});
  for(let i=0;i<H_.sparks;i++)spark(T.x,T.y,ang+Math.PI+rnd(-1.25,1.25),rnd(160,520)*k);
  for(let i=0;i<H_.splinters;i++){const a=ang+Math.PI+rnd(-1.5,1.5),v=rnd(100,360)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(80,220)*k,ay:900*k,life:rnd(.6,1.1),s0:rnd(20,36)*k,s1:rnd(16,28)*k,asp:.28,spr:'splinter',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-14,14)})}
  for(let i=0;i<H_.dust;i++)dust(T.x+rnd(-14,14)*k,T.y+rnd(-8,8)*k,rnd(16,26)*k,rnd(54,90)*k,rnd(.8,1.5),{a:.6,delay:rnd(0,.15)});
  const F=b.fromTrack?b.fromTrack():b.from;for(let i=0;i<H_.drops;i++){const t=rnd(.2,.9);E({x:lerp(F.x,T.x,t),y:lerp(F.y,T.y,t),vx:rnd(-30,30)*k,vy:rnd(-40,20)*k,ay:700*k,life:rnd(.5,.9),s0:rnd(6,10)*k,s1:rnd(4,6)*k,asp:1.5,spr:'drop',blend:'n',a:.9,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'rope',delay:rnd(0,.12)})}
  if(opts.onShake)opts.onShake(H_.shake*k,H_.shakeMs);if(opts.onZoom)opts.onZoom(H_.zoom,300);if(opts.onFlash)opts.onFlash(H_.flash,200);ph(4);pend.push({t:.9,f:()=>ph(5)})}
 // ---------- 4ب) الإخفاق: تسقط في الماء ثم تُسحب عائدة بالحبل وتشق الماء
 function miss(T,b){const k=K,M=C.miss;E({x:T.x,y:T.y,s0:18*k,s1:90*k,life:.15,spr:'core',a:1,z:4,pal:['#ffffff','#e0f4ff','#9fdcff']});splash(T.x,T.y,M.spray);
  loose.push({x:T.x,y:T.y,vx:0,vy:0,rot:b.ang,vr:0,t:0,fallT:0,phase:'retract',r0:{x:T.x,y:T.y},u:0,retract:M.retract,from:b.from,fromTrack:b.fromTrack,delay:.25});
  if(opts.onShake)opts.onShake(M.shake*k,200);ph(4);pend.push({t:.9,f:()=>ph(5)})}
 // ---------- 4ج) صدّ الدرع: ترتد الحربة بشرر ولون الدرع ثم تسقط في الماء وتُسحب
 function blocked(T,ang,col,b){const k=K,B=C.blocked;col=col||'#7fe3ff';E({x:T.x,y:T.y,s0:30*k,s1:140*k,life:.2,spr:'core',a:1,z:4,tintc:col});E({x:T.x,y:T.y,s0:10*k,s1:200*k,life:.5,spr:'ring',a:.9,flat:.7,z:3,tintc:col,ac:[[0,.95],[1,0]]});
  E({x:T.x,y:T.y,s0:16*k,s1:70*k,life:.22,spr:'star',a:1,z:4,tintc:'#ffffff',ac:[[0,1],[1,0]]});
  for(let i=0;i<B.sparks;i++){const a=ang+Math.PI+rnd(-1.2,1.2),v=rnd(160,460)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(0,120)*k,ay:420*k,drag:1.2,life:rnd(.3,.7),s0:rnd(14,24)*k,s1:3*k,spr:'streak',stretch:.012,a:1,z:3,tintc:i%2?'#ffffff':col})}
  const bk=B.bounce*k;loose.push({x:T.x,y:T.y,vx:Math.cos(ang+Math.PI)*bk*.8,vy:-bk*rnd(.5,.9),rot:ang+rnd(-.3,.3),vr:rnd(-9,9),t:0,fallT:.55,phase:'fall',retract:B.retract,from:b.from,fromTrack:b.fromTrack,u:0});
  if(opts.onShake)opts.onShake(B.shake*k,220);ph(4);pend.push({t:.8,f:()=>ph(5)})}
 function impact(b){const out=b.outcome,ang=b.ang;if(out==='miss')miss(b.to,b);else if(out==='blocked')blocked(b.to,ang,b.color,b);else{hit(b.to,ang,b);if(b.pin)pin(b.pin.key,{track:b.pin.track,fromTrack:b.fromTrack,from:b.from,pos:b.to,ang})}
  if(opts.onImpact)opts.onImpact(out);pend.push({t:.7,f:b.done});kick()}
 // ---------- التثبيت المستمر
 // pin: يربط حربة منغرسة وحبلًا مشدودًا بين المهاجم (from/fromTrack) والهدف (track/pos). instant:true بلا ارتجاج بداية (لاستعادة حالة محفوظة). متكرر الاستدعاء بأمان.
 function pin(key,o){o=o||{};const a=auras.get(key);if(a){if(o.track)a.track=o.track;if(o.fromTrack)a.fromTrack=o.fromTrack;return}
  const F=o.from||(o.fromTrack?o.fromTrack():null),T=o.pos||(o.track?o.track():null);let ang=o.ang;if(ang===undefined)ang=F&&T?Math.atan2(T.y-F.y,T.x-F.x):-Math.PI/2;
  auras.set(key,{track:o.track||null,fromTrack:o.fromTrack||null,from:F,pos:T,ang,age:0,wave:o.instant?0:1,vib:o.instant?0:1,pull:0,ag:0});kick()}
 // release: تخرج الحربة من الهيكل وتسقط ثم تُسحب ('free')، أو تختفي سريعًا ('dead' عند تدمير السفينة)
 function release(key,mode){const a=auras.get(key);if(!a)return;auras.delete(key);const T=a.track?a.track():a.pos,k=K;if(!T)return;
  for(let i=0;i<8;i++)spark(T.x,T.y,rnd(0,6.28),rnd(80,260)*k);for(let i=0;i<3;i++)dust(T.x+rnd(-8,8)*k,T.y+rnd(-6,6)*k,rnd(14,20)*k,rnd(40,64)*k,rnd(.6,1));
  if(mode==='dead'){if(opts.onShake)opts.onShake(1.2*k,150);kick();return}
  const dx=Math.cos(a.ang),dy=Math.sin(a.ang);loose.push({x:T.x,y:T.y,vx:-dx*60*k,vy:-dy*60*k-80*k,rot:a.ang,vr:rnd(-4,4),t:0,fallT:.5,phase:'fall',retract:C.miss.retract,from:a.from,fromTrack:a.fromTrack,u:0});
  if(opts.onShake)opts.onShake(1.6*k,160);kick()}
 // shiver: محاولة تحرك فاشلة (moveFail «مثبّتة»): الحبل يرتجّ والحربة تهتز وشرر
 function shiver(key){const a=auras.get(key);if(!a)return;a.wave=1;a.vib=1;const T=a.track?a.track():a.pos,k=K;if(T)for(let i=0;i<8;i++)spark(T.x,T.y,a.ang+Math.PI+rnd(-1.3,1.3),rnd(100,300)*k);if(opts.onShake)opts.onShake(1.6*k,200);kick()}
 function fire(cfg){return new Promise(res=>{const F=cfg.from,T=cfg.to,ang=Math.atan2(T.y-F.y,T.x-F.x);ph(1);launch(F,ang);if(opts.onRecoil)opts.onRecoil(ang);
  bs.push({from:F,fromTrack:cfg.fromTrack||null,to:T,t:0,x:F.x,y:F.y,ang,dist:Math.hypot(T.x-F.x,T.y-F.y),da:0,outcome:cfg.outcome||'hit',color:cfg.shieldColor,pin:cfg.pin||null,done:res});ph(2);kick()})}
 function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;step(dt);draw();if(P.length||bs.length||loose.length||pend.length||hs>0||auras.size)requestAnimationFrame(loop);else{run=false;cx.clearRect(0,0,W,H)}}
 function advance(dt){step(dt);draw()}
 return{resize,fire,advance,pin,release,shiver,clear(){P=[];bs=[];loose=[];pend=[];auras.clear();cx.clearRect(0,0,W,H)},setTimeScale(v){user=v},setLayer(n,v){vis[n]=v},pinned(){return[...auras.keys()]},stats(){return{particles:P.length,harpoons:bs.length+loose.length,pinned:auras.size}},layers,config:C}}
