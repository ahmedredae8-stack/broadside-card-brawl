// الهاون — قذيفة ثقيلة بقوس عالٍ: الإطلاق ← الصعود ← الهبوط مع علامة تحذير ← الاصطدام (إصابة / رشاش / إخفاق / صدّ) ← ما بعد الانفجار.
// كل الرسم برمجي (بلا صور). كل الأرقام في CANNON تعدّل من الخارج عبر opts.config.
export const MORTAR={
 flight:{dur:1.6,apexMin:150,apexK:.55,shell:17,perspective:.18,spin:3,warnAt:.42},
 launch:{smoke:12,sparks:14,flame:4,shake:3},
 hit:{stop:.11,shake:11,shakeMs:520,zoom:1.035,flash:.22,fireCore:8,fireMid:14,fireOuter:10,column:12,cap:8,wood:26,metal:14,sparks:40,embers:20,spray:18},
 splash:{shake:6.5,spray:20,drops:26},
 miss:{shake:3.5,spray:24,drops:40},
 blocked:{shake:4.5,sparks:28}};
const rnd=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),eo=t=>1-Math.pow(1-t,3),ei=t=>t*t;
const merge=(a,b)=>{const o=Array.isArray(a)?a.slice():Object.assign({},a);for(const k in b)o[k]=b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])?merge(a[k]||{},b[k]):b[k];return o};
const curve=(c,t)=>{for(let i=1;i<c.length;i++)if(t<=c[i][0]){const a=c[i-1],b=c[i],u=(t-a[0])/(b[0]-a[0]||1);return lerp(a[1],b[1],u)}return c[c.length-1][1]};
const FIRE=['#ffd24a','#ff9a2a','#e8601a','#a8321a','#5a1e10','#2a1008'];
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function makeSprites(){const S={};
 const soft=(sz,st)=>{const c=cv(sz,sz),g=c.getContext('2d'),r=g.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);st.forEach(([o,a])=>r.addColorStop(o,'rgba(255,255,255,'+a+')'));g.fillStyle=r;g.fillRect(0,0,sz,sz);return c};
 S.soft=soft(128,[[0,1],[.35,.55],[1,0]]);S.core=soft(128,[[0,1],[.18,1],[.55,.3],[1,0]]);
 S.puff=(()=>{const c=cv(128,128),g=c.getContext('2d');for(let i=0;i<9;i++){const a=i/9*6.28,x=64+Math.cos(a)*18+rnd(-6,6),y=64+Math.sin(a)*18+rnd(-6,6),r=rnd(22,34),q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba(255,255,255,.55)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,128,128)}const q=g.createRadialGradient(64,64,0,64,64,40);q.addColorStop(0,'rgba(255,255,255,.5)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,128,128);return c})();
 S.ring=(()=>{const c=cv(256,256),g=c.getContext('2d'),r=g.createRadialGradient(128,128,70,128,128,126);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.72,'rgba(255,255,255,.15)');r.addColorStop(.9,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,256,256);return c})();
 S.streak=(()=>{const c=cv(128,24),g=c.getContext('2d'),r=g.createLinearGradient(0,0,128,0);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.7,'rgba(255,255,255,.8)');r.addColorStop(1,'rgba(255,255,255,1)');g.fillStyle=r;g.beginPath();g.moveTo(0,12);g.quadraticCurveTo(70,2,128,10);g.lineTo(128,14);g.quadraticCurveTo(70,22,0,12);g.fill();return c})();
 S.star=(()=>{const c=cv(192,192),g=c.getContext('2d');g.translate(96,96);for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4+.2);const l=i%2?58:92,r=g.createLinearGradient(0,0,l,0);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.beginPath();g.moveTo(0,-7);g.lineTo(l,0);g.lineTo(0,7);g.fill();g.restore()}const q=g.createRadialGradient(0,0,0,0,0,40);q.addColorStop(0,'rgba(255,255,255,1)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(-96,-96,192,192);return c})();
 S.splinter=(()=>{const c=cv(64,16),g=c.getContext('2d'),r=g.createLinearGradient(0,0,0,16);r.addColorStop(0,'#c98a4a');r.addColorStop(1,'#5a3519');g.fillStyle=r;g.beginPath();g.moveTo(0,8);g.lineTo(52,1);g.lineTo(64,8);g.lineTo(52,15);g.closePath();g.fill();g.strokeStyle='#2a1608';g.lineWidth=1.5;g.stroke();return c})();
 S.metal=(()=>{const c=cv(32,32),g=c.getContext('2d');g.fillStyle='#8b96a6';g.beginPath();g.moveTo(4,10);g.lineTo(20,2);g.lineTo(28,16);g.lineTo(14,28);g.closePath();g.fill();g.strokeStyle='#12161d';g.lineWidth=2;g.stroke();g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.moveTo(8,10);g.lineTo(18,5);g.lineTo(16,12);g.closePath();g.fill();return c})();
 S.drop=(()=>{const c=cv(32,48),g=c.getContext('2d'),r=g.createLinearGradient(0,0,0,48);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(1,'rgba(190,230,248,.9)');g.fillStyle=r;g.beginPath();g.moveTo(16,2);g.quadraticCurveTo(30,28,16,46);g.quadraticCurveTo(2,28,16,2);g.fill();return c})();
 S.ballBase=(()=>{const c=cv(128,128),g=c.getContext('2d'),r=g.createRadialGradient(52,46,4,64,64,64);r.addColorStop(0,'#8995a6');r.addColorStop(.45,'#47505f');r.addColorStop(.85,'#161b23');r.addColorStop(1,'#0a0d12');g.fillStyle=r;g.beginPath();g.arc(64,64,60,0,7);g.fill();g.strokeStyle='rgba(150,175,205,.55)';g.lineWidth=5;g.beginPath();g.arc(64,64,55,.15,1.45);g.stroke();g.strokeStyle='#05070a';g.lineWidth=3;g.beginPath();g.arc(64,64,60,0,7);g.stroke();return c})();
 S.ballSeam=(()=>{const c=cv(128,128),g=c.getContext('2d');g.strokeStyle='rgba(5,7,10,.75)';g.lineWidth=3;g.beginPath();g.arc(64,64,40,.4,2.6);g.stroke();g.beginPath();g.arc(30,64,34,-1.2,1.2);g.stroke();g.fillStyle='rgba(5,7,10,.5)';[[84,48,4],[48,90,3.4],[96,80,3],[40,40,2.8]].forEach(([x,y,r])=>{g.beginPath();g.arc(x,y,r,0,7);g.fill()});return c})();
 S.ballSpec=(()=>{const c=cv(128,128),g=c.getContext('2d'),r=g.createRadialGradient(46,38,0,46,38,30);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(.35,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return c})();
 S.shell=(()=>{const c=cv(128,128),g=c.getContext('2d');g.strokeStyle='#4a3a22';g.lineWidth=5;g.lineCap='round';g.beginPath();g.moveTo(64,26);g.bezierCurveTo(64,12,76,8,84,4);g.stroke();
 const r=g.createRadialGradient(48,56,4,64,72,54);r.addColorStop(0,'#6b7688');r.addColorStop(.4,'#2e3644');r.addColorStop(.85,'#0e1218');r.addColorStop(1,'#06080b');g.fillStyle=r;g.beginPath();g.arc(64,72,50,0,7);g.fill();
 const b=g.createLinearGradient(0,50,0,94);b.addColorStop(0,'#fff0a0');b.addColorStop(.45,'#e0ac2a');b.addColorStop(1,'#8a5a0c');g.fillStyle=b;g.beginPath();g.moveTo(16,64);g.quadraticCurveTo(64,92,112,64);g.lineTo(114,78);g.quadraticCurveTo(64,110,14,78);g.closePath();g.fill();g.strokeStyle='#4a2e06';g.lineWidth=2.5;g.stroke();
 g.fillStyle='#5a3a08';[[34,78],[50,88],[66,92],[82,88],[98,78]].forEach(([x,y])=>{g.beginPath();g.arc(x,y,3,0,7);g.fill()});
 const f=g.createLinearGradient(52,0,76,0);f.addColorStop(0,'#8a5a0c');f.addColorStop(.5,'#ffe27a');f.addColorStop(1,'#8a5a0c');g.fillStyle=f;g.fillRect(52,18,24,14);g.strokeStyle='#4a2e06';g.lineWidth=2;g.strokeRect(52,18,24,14);
 g.strokeStyle='rgba(150,175,205,.5)';g.lineWidth=5;g.beginPath();g.arc(64,72,46,.2,1.4);g.stroke();
 const sp=g.createRadialGradient(44,50,0,44,50,22);sp.addColorStop(0,'rgba(255,255,255,.9)');sp.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=sp;g.fillRect(0,0,128,128);
 g.strokeStyle='#05070a';g.lineWidth=3;g.beginPath();g.arc(64,72,50,0,7);g.stroke();return c})();
 return S}
const tintCache=new Map();
function tint(src,key,color){const k=key+color;let c=tintCache.get(k);if(!c){c=cv(src.width,src.height);const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,c.width,c.height);tintCache.set(k,c)}return c}
export function createMortarFx(root,opts){opts=opts||{};const C=merge(MORTAR,opts.config||{}),canvas=document.createElement('canvas'),cx=canvas.getContext('2d');
 Object.assign(canvas.style,{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none'});root.append(canvas);
 let W=450,H=500,dpr=1,K=opts.scale||1,P=[],shells=[],user=1,hs=0,ramp=0,run=false,last=0,pend=[];const S=makeSprites(),vis={};
 const layers=['launch','trail','shell','marker','impact','debris','smoke','decal'];layers.forEach(l=>vis[l]=true);
 function resize(w,h,d){W=w;H=h;dpr=d||1;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);K=opts.scale||w/450}
 function E(o){const p=Object.assign({x:0,y:0,vx:0,vy:0,ay:0,drag:0,age:0,life:1,s0:10,s1:10,rot:0,vr:0,spr:'soft',blend:'add',a:1,ac:null,pal:null,stretch:0,flat:1,z:3,layer:'impact',delay:0,tintc:null,sc:null,asp:1},o);P.push(p);kick();return p}
 function kick(){if(!run&&!opts.manual){run=true;last=performance.now();requestAnimationFrame(loop)}}
 const ph=n=>{if(opts.onPhase)opts.onPhase(n)};
 function step(dt){const slow=hs>0?(hs-=dt,.04):ramp>0?(ramp-=dt,lerp(.04,1,1-clamp(ramp/.16,0,1))):1,d=dt*slow*user,k=K;
  for(let i=P.length-1;i>=0;i--){const p=P[i];if(p.delay>0){p.delay-=d;continue}p.age+=d;if(p.age>=p.life){P.splice(i,1);continue}p.vy+=p.ay*d;const q=Math.max(0,1-p.drag*d);p.vx*=q;p.vy*=q;p.x+=p.vx*d;p.y+=p.vy*d;p.rot+=p.vr*d}
  for(let i=shells.length-1;i>=0;i--){const s=shells[i];s.t+=d/C.flight.dur;const u=clamp(s.t,0,1),dx=s.to.x-s.from.x,dy=s.to.y-s.from.y;s.gx=s.from.x+dx*u;s.gy=s.from.y+dy*u;const h=4*u*(1-u)*s.Hh;s.x=s.gx;s.y=s.gy-h;s.h=s.Hh?h/s.Hh*4/4:0;s.persp=lerp(1,dy<0?1-C.flight.perspective:1+C.flight.perspective,u)*(1+.28*(h/s.Hh));s.rot=.14*Math.sin(s.t*7);s.age=(s.age||0)+d;
   const R=C.flight.shell*k*s.persp,sz=R*2.56,tipx=s.x+20/128*sz,tipy=s.y-60/128*sz;
   if(vis.trail){E({x:tipx,y:tipy,vx:rnd(-35,35)*k,vy:rnd(0,60)*k,ay:340*k,life:rnd(.25,.55),s0:rnd(7,12)*k,s1:2*k,spr:'soft',a:1,z:3,layer:'trail',pal:['#fff6c8','#ffc24a','#ff7a1a','#6a2a10']});
    if(Math.random()<.4)E({x:s.x,y:s.y,vx:rnd(-8,8)*k,vy:rnd(-8,8)*k,life:rnd(.5,.9),s0:6*k,s1:18*k,spr:'puff',blend:'n',a:.2,z:1,layer:'smoke',tintc:'#c3c9d0',rot:rnd(0,6.28)});
    if(u>.62&&Math.random()<.7)E({x:s.x+rnd(-8,8)*k,y:s.y-rnd(18,46)*k,vx:0,vy:340*k,life:.16,s0:26*k,s1:8*k,spr:'streak',stretch:.008,a:.7,z:3,layer:'trail',pal:['#ffffff','#ffd86a']})}
   if(!s.marked&&u>=C.flight.warnAt){s.marked=1;ph(3);const life=(1-s.t)*C.flight.dur;E({x:s.to.x,y:s.to.y+2*k,s0:140*k,s1:34*k,life,spr:'ring',a:.85,flat:.36,z:1,layer:'marker',tintc:'#ff7a4a',sc:[[0,0],[1,1]],ac:[[0,0],[.12,1],[.9,1],[1,.5]]});E({x:s.to.x,y:s.to.y+2*k,s0:92*k,s1:22*k,life,spr:'ring',a:.8,flat:.36,z:1,layer:'marker',tintc:'#ffd0a0',sc:[[0,0],[1,1]],ac:[[0,0],[.12,1],[.9,1],[1,.5]]});E({x:s.to.x,y:s.to.y+2*k,s0:30*k,s1:30*k,life,spr:'soft',a:.5,flat:.4,z:1,layer:'marker',tintc:'#ff5a3a',ac:[[0,0],[.2,1],[.9,1],[1,.4]]})}
   if(!s.apex&&u>=.5){s.apex=1;ph(2.5)}
   if(u>=1){shells.splice(i,1);impact(s)}}
  for(let i=pend.length-1;i>=0;i--){pend[i].t-=dt;if(pend[i].t<=0){pend[i].f();pend.splice(i,1)}}}
 function draw(){cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
  if(vis.shell)shells.forEach(s=>{const h=s.Hh?(s.gy-s.y)/s.Hh:0;cx.globalCompositeOperation='source-over';cx.globalAlpha=.16+.24*h;cx.fillStyle='#000';cx.beginPath();cx.ellipse(s.gx,s.gy+7*K,26*K*s.persp*(1-.4*h),9*K*s.persp*(1-.4*h),0,0,7);cx.fill()});
  for(let z=0;z<=4;z++){for(const p of P){if(p.z!==z||p.delay>0||!vis[p.layer])continue;const t=p.age/p.life;let a=p.a*(p.ac?curve(p.ac,t):1-t);if(a<=.004)continue;const s=lerp(p.s0,p.s1,p.sc?curve(p.sc,t):eo(t));if(s<=.2)continue;
    cx.globalAlpha=Math.min(1,a);cx.globalCompositeOperation=p.blend==='add'?'lighter':'source-over';cx.save();cx.translate(p.x,p.y);
    let img;if(p.pal)img=tint(S[p.spr],p.spr,p.pal[Math.min(p.pal.length-1,Math.floor(t*p.pal.length))]);else if(p.tintc)img=tint(S[p.spr],p.spr,p.tintc);else img=S[p.spr];
    if(p.stretch){const sp=Math.hypot(p.vx,p.vy);cx.rotate(Math.atan2(p.vy,p.vx));const l=Math.max(s,s*(1+sp*p.stretch));cx.drawImage(img,-l,-s*.5,l,s)}
    else{if(p.rot)cx.rotate(p.rot);if(p.flat!==1)cx.scale(1,p.flat);cx.drawImage(img,-s/2,-s*p.asp/2,s,s*p.asp)}cx.restore()}
   if(z===3&&vis.shell)shells.forEach(drawShell)}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over'}
 function drawShell(s){const R=C.flight.shell*K*s.persp,sz=R*2.56;cx.globalCompositeOperation='source-over';cx.globalAlpha=1;cx.save();cx.translate(s.x,s.y);cx.rotate(s.rot);cx.drawImage(S.shell,-sz/2,-sz/2,sz,sz);cx.restore();
  cx.globalCompositeOperation='lighter';const tx=s.x+20/128*sz,ty=s.y-60/128*sz;cx.globalAlpha=.9;cx.drawImage(tint(S.soft,'soft','#ffd86a'),tx-14*K,ty-14*K,28*K,28*K);cx.globalAlpha=1;cx.drawImage(tint(S.core,'core','#ffffff'),tx-6*K,ty-6*K,12*K,12*K);cx.globalCompositeOperation='source-over'}
 function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;step(dt);draw();if(P.length||shells.length||pend.length||hs>0)requestAnimationFrame(loop);else{run=false;cx.clearRect(0,0,W,H)}}
 // ---------- الإطلاق: دفعة للأسفل وغبار، وشعلة عمودية، ودخان يصعد
 function launch(F,ang){const k=K,L=C.launch,dx=Math.cos(ang),dy=Math.sin(ang);
  E({x:F.x,y:F.y,s0:20*k,s1:120*k,life:.1,spr:'star',rot:ang,a:1,ac:[[0,1],[.4,1],[1,0]],z:4,layer:'launch',tintc:'#ffe9a0'});E({x:F.x,y:F.y,s0:20*k,s1:70*k,life:.12,spr:'core',a:1,z:4,layer:'launch',pal:['#ffffff','#ffe27a','#ffa63a']});
  for(let i=0;i<L.flame;i++){const a=ang+rnd(-.22,.22),Ln=rnd(60,120)*k;E({x:F.x+Math.cos(a)*Ln*.5,y:F.y+Math.sin(a)*Ln*.5,life:.15,s0:Ln*.9,s1:Ln*1.15,asp:rnd(.16,.26),spr:'streak',rot:a+Math.PI,a:.95,z:3,layer:'launch',pal:['#fff3b8','#ffb347','#e8601a']})}
  for(let i=0;i<L.sparks;i++){const a=ang+rnd(-.7,.7),v=rnd(160,420)*k;E({x:F.x,y:F.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:380*k,drag:2.4,life:rnd(.25,.6),s0:rnd(10,18)*k,s1:2*k,spr:'streak',stretch:.01,a:1,z:3,layer:'launch',pal:['#fff6c8','#ffc24a','#ff7a1a']})}
  E({x:F.x,y:F.y+8*k,s0:20*k,s1:150*k,life:.55,spr:'ring',a:.8,flat:.34,z:1,layer:'launch',tintc:'#e8e2d8',ac:[[0,.8],[1,0]]});
  for(let i=0;i<L.smoke;i++){const side=rnd(-1,1),v=rnd(20,160)*k;E({x:F.x+side*10*k,y:F.y+6*k,vx:side*v,vy:-rnd(30,170)*k,drag:1.6,life:rnd(.9,1.6),s0:rnd(16,26)*k,s1:rnd(56,90)*k,spr:'puff',blend:'n',a:.6,ac:[[0,0],[.1,1],[1,0]],z:1,layer:'smoke',tintc:i%2?'#8d949c':'#c3c9d0',rot:rnd(0,6.28),vr:rnd(-.6,.6),delay:rnd(0,.06)})}
  if(opts.onShake)opts.onShake(L.shake*k,180)}
 // ---------- الإصابة: وميض ← كرة نار بثلاث طبقات ← موجات صدمة ← رذاذ ← شظايا ← عمود دخان وقبعة ← جمر
 function hit(T){const k=K,H_=C.hit;hs=H_.stop;ramp=.16;if(opts.onHitStop)opts.onHitStop(H_.stop*1000);
  E({x:T.x,y:T.y,s0:30*k,s1:150*k,life:.17,spr:'star',a:1,z:4,tintc:'#fff2c0',ac:[[0,1],[.3,1],[1,0]],rot:rnd(0,3)});E({x:T.x,y:T.y,s0:40*k,s1:120*k,life:.2,spr:'core',a:1,z:4,pal:['#ffffff','#fff0a0','#ffb347','#e8601a']});
  [[300,.55,0],[230,.4,.05],[170,.3,.1]].forEach(([s1,l,dl],i)=>E({x:T.x,y:T.y,s0:10*k,s1:s1*k,life:l,spr:'ring',a:.9,flat:.38,z:3,tintc:i?'#fff':'#ffe6b0',delay:dl,ac:[[0,.9],[.5,.5],[1,0]]}));
  for(let i=0;i<H_.fireCore;i++){const a=rnd(0,6.28),v=rnd(10,80)*k;E({x:T.x+rnd(-8,8)*k,y:T.y+rnd(-6,6)*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-rnd(20,60)*k,drag:2.2,life:rnd(.4,.75),s0:rnd(40,62)*k,s1:rnd(80,120)*k,spr:'soft',a:.75,z:3,pal:FIRE,ac:[[0,.2],[.15,1],[1,0]],delay:rnd(0,.04)})}
  for(let i=0;i<H_.fireMid;i++){const a=rnd(0,6.28),v=rnd(30,180)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-rnd(30,110)*k,drag:2.4,life:rnd(.5,.95),s0:rnd(28,48)*k,s1:rnd(66,110)*k,spr:'soft',a:.7,z:3,pal:FIRE,ac:[[0,.2],[.15,1],[1,0]],delay:rnd(0,.06)})}
  for(let i=0;i<H_.fireOuter;i++){const a=rnd(0,6.28),v=rnd(40,150)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6-rnd(40,120)*k,drag:1.8,life:rnd(.7,1.2),s0:rnd(40,60)*k,s1:rnd(90,140)*k,spr:'soft',blend:'n',a:.5,z:2,pal:['#c8481a','#8c2a10','#5a1e10','#2a1008'],ac:[[0,0],[.15,1],[1,0]],delay:rnd(.04,.12)})}
  for(let i=0;i<H_.spray;i++){const a=rnd(0,6.28),v=rnd(80,260)*k;E({x:T.x+Math.cos(a)*20*k,y:T.y+10*k,vx:Math.cos(a)*v,vy:-rnd(10,70)*k+Math.sin(a)*v*.25,ay:200*k,drag:1.5,life:rnd(.6,1),s0:rnd(14,26)*k,s1:rnd(40,70)*k,spr:'puff',blend:'n',a:.8,ac:[[0,0],[.1,1],[1,0]],z:2,layer:'smoke',tintc:'#eaf8ff',rot:rnd(0,6.28)})}
  for(let i=0;i<H_.column;i++)E({x:T.x+rnd(-14,14)*k,y:T.y-rnd(0,20)*k,vx:rnd(-30,30)*k,vy:-rnd(90,230)*k,drag:.8,life:rnd(1.8,2.8),s0:rnd(36,50)*k,s1:rnd(100,170)*k,spr:'puff',blend:'n',a:.66,ac:[[0,0],[.12,1],[.6,.6],[1,0]],z:1,layer:'smoke',tintc:i<6?'#2c2c32':'#5a5a62',rot:rnd(0,6.28),vr:rnd(-.4,.4),delay:i*.03});
  for(let i=0;i<H_.cap;i++){const a=rnd(-.5,.5)+(i%2?0:Math.PI),v=rnd(60,150)*k;E({x:T.x,y:T.y-150*k,vx:Math.cos(a)*v,vy:-rnd(0,30)*k,drag:1.2,life:rnd(1.4,2.2),s0:rnd(40,60)*k,s1:rnd(110,180)*k,spr:'puff',blend:'n',a:.5,ac:[[0,0],[.15,1],[.7,.5],[1,0]],z:1,layer:'smoke',tintc:'#6c6c74',rot:rnd(0,6.28),delay:.4+rnd(0,.15)})}
  for(let i=0;i<H_.wood;i++){const a=rnd(0,6.28),v=rnd(140,480)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(160,380)*k,ay:900*k,life:rnd(.8,1.5),s0:rnd(22,44)*k,s1:rnd(18,36)*k,asp:.28,spr:'splinter',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-14,14)})}
  for(let i=0;i<H_.metal;i++){const a=rnd(0,6.28),v=rnd(120,420)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(120,260)*k,ay:900*k,life:rnd(.7,1.2),s0:rnd(8,14)*k,s1:rnd(6,11)*k,spr:'metal',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-18,18)})}
  for(let i=0;i<H_.sparks;i++){const a=rnd(0,6.28),v=rnd(200,620)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(40,220)*k,ay:520*k,drag:1.6,life:rnd(.3,.9),s0:rnd(10,22)*k,s1:2*k,spr:'streak',stretch:.007,a:1,z:3,pal:['#ffffff','#ffd86a','#ff8a2a','#e8601a']})}
  for(let i=0;i<H_.embers;i++){const a=rnd(0,6.28),v=rnd(30,190)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(70,180)*k,ay:150*k,drag:1.1,life:rnd(1,1.9),s0:rnd(5,9)*k,s1:rnd(2,4)*k,spr:'soft',a:1,z:3,pal:['#ffe27a','#ff9a2a','#e8601a','#6a2a10'],ac:[[0,0],[.1,1],[.5,.8],[.7,.3],[.8,.9],[1,0]],delay:rnd(.05,.35)})}
  E({x:T.x,y:T.y+8*k,s0:40*k,s1:110*k,life:2.4,spr:'soft',blend:'n',a:.55,flat:.5,z:0,layer:'decal',tintc:'#14100c',ac:[[0,0],[.08,1],[.7,.8],[1,0]]});
  if(opts.onShake)opts.onShake(H_.shake*k,H_.shakeMs);if(opts.onZoom)opts.onZoom(H_.zoom,260);if(opts.onFlash)opts.onFlash(H_.flash,240)}
 // ---------- رشاش: انفجار على الماء قرب السفينة، موجة صدمة تصل إليها
 function waterColumn(T,n,drops,col){const k=K;for(let i=0;i<n;i++){const v=rnd(300,580)*k;E({x:T.x+rnd(-10,10)*k,y:T.y,vx:rnd(-70,70)*k,vy:-v,ay:900*k,drag:.3,life:rnd(.8,1.2),s0:rnd(20,32)*k,s1:rnd(48,80)*k,spr:'puff',blend:'n',a:1,ac:[[0,0],[.1,1],[.7,.7],[1,0]],z:2,layer:'smoke',tintc:col||'#f0fbff',rot:rnd(0,6.28),delay:rnd(0,.07)})}
  for(let i=0;i<drops;i++){const a=rnd(-2.8,-.34),v=rnd(140,470)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:900*k,life:rnd(.7,1.2),s0:rnd(11,17)*k,s1:rnd(8,12)*k,asp:1.5,spr:'drop',blend:'n',a:.95,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris'})}
  for(let i=0;i<4;i++)E({x:T.x,y:T.y+3*k,s0:12*k,s1:(180+i*50)*k,life:1.1,spr:'ring',a:1,flat:.32,z:1,layer:'impact',tintc:'#f4fcff',delay:i*.1,ac:[[0,.9],[.6,.4],[1,0]]});
  E({x:T.x,y:T.y+4*k,s0:30*k,s1:180*k,life:1.5,spr:'soft',blend:'n',a:.7,flat:.3,z:0,layer:'decal',tintc:'#ffffff',ac:[[0,0],[.15,1],[1,0]]})}
 function splash(T){const k=K,B=C.splash;E({x:T.x,y:T.y,s0:24*k,s1:130*k,life:.18,spr:'core',a:1,z:4,pal:['#ffffff','#ffd86a','#ff9a2a']});E({x:T.x,y:T.y,s0:10*k,s1:290*k,life:.6,spr:'ring',a:.85,flat:.38,z:3,tintc:'#ffe6c0',ac:[[0,.9],[.5,.45],[1,0]]});
  for(let i=0;i<7;i++){const a=rnd(0,6.28),v=rnd(20,110)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6-rnd(20,80)*k,drag:2.4,life:rnd(.4,.8),s0:rnd(26,40)*k,s1:rnd(56,90)*k,spr:'soft',a:.65,z:3,pal:FIRE,ac:[[0,.2],[.15,1],[1,0]]})}
  waterColumn(T,B.spray,B.drops);if(opts.onShake)opts.onShake(B.shake*k,260);if(opts.onFlash)opts.onFlash(.08,160)}
 function miss(T){const k=K,B=C.miss;E({x:T.x,y:T.y,s0:20*k,s1:120*k,life:.16,spr:'core',a:1,z:4,tintc:'#e8f8ff'});waterColumn(T,B.spray,B.drops);if(opts.onShake)opts.onShake(B.shake*k,220)}
 function blocked(T,ang,col){const k=K,B=C.blocked;col=col||'#7fe3ff';E({x:T.x,y:T.y,s0:30*k,s1:170*k,life:.22,spr:'core',a:1,z:4,tintc:col});E({x:T.x,y:T.y,s0:10*k,s1:240*k,life:.55,spr:'ring',a:.95,flat:.7,z:3,tintc:col,ac:[[0,.95],[1,0]]});E({x:T.x,y:T.y,s0:10*k,s1:170*k,life:.4,spr:'ring',a:.8,flat:.7,z:3,tintc:'#fff',delay:.05,ac:[[0,.8],[1,0]]});
  for(let i=0;i<B.sparks;i++){const a=-Math.PI/2+rnd(-1.5,1.5),v=rnd(180,520)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:460*k,drag:1.2,life:rnd(.3,.8),s0:rnd(16,28)*k,s1:3*k,spr:'streak',stretch:.012,a:1,z:3,tintc:i%2?'#ffffff':col})}
  if(opts.onShake)opts.onShake(B.shake*k,240)}
 function impact(s){ph(4);const o=s.outcome;if(o==='miss')miss(s.to);else if(o==='splash')splash(s.to);else if(o==='blocked')blocked(s.to,0,s.color);else hit(s.to);if(opts.onImpact)opts.onImpact(o);pend.push({t:.5,f:()=>ph(5)});pend.push({t:.8,f:s.done});kick()}
 // cfg: {from, to, outcome:'hit'|'splash'|'miss'|'blocked', shieldColor}
 function fire(cfg){return new Promise(res=>{const F=cfg.from,T=cfg.to,dx=T.x-F.x,dy=T.y-F.y,dist=Math.hypot(dx,dy),Hh=Math.max(C.flight.apexMin*K,dist*C.flight.apexK);
  const lean=Math.atan2(dx,Hh*2.2);launch(F,-Math.PI/2+lean);if(opts.onRecoil)opts.onRecoil(-Math.PI/2+lean);ph(1);
  shells.push({from:F,to:T,t:0,x:F.x,y:F.y,gx:F.x,gy:F.y,Hh,h:0,rot:0,persp:1,outcome:cfg.outcome||'hit',color:cfg.shieldColor,done:res});setTimeout(()=>ph(2),120);kick()})}
 function advance(dt){step(dt);draw()}
 return{resize,fire,advance,clear(){P=[];shells=[];pend=[];cx.clearRect(0,0,W,H)},setTimeScale(v){user=v},setLayer(n,v){vis[n]=v},layers,config:C}}
