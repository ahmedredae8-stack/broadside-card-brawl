// المدفع — نظام مؤثرات كامل للقذيفة: وميض الفوهة ← الطيران ← الاصطدام (إصابة / إخفاق / صدّ درع) ← ما بعد الانفجار.
// كل الرسم برمجي (بلا صور). كل الأرقام في CANNON تعدّل من الخارج عبر opts.config.
export const CANNON={
 flight:{dur:.78,arc:.07,ball:15,perspective:.2,spin:9,trailLife:.62,trailWidth:9,trailPoints:34},
 muzzle:{cone:1,smoke:9,sparks:15,ring:1,shake:2.2},
 hit:{stop:.08,shake:8,shakeMs:380,fire:18,smoke:15,wood:17,metal:9,sparks:28,embers:15,decal:1},
 miss:{shake:2.4,spray:16,drops:28},
 blocked:{shake:3.6,sparks:28}};
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
 return S}
const tintCache=new Map();
function tint(src,key,color){const k=key+color;let c=tintCache.get(k);if(!c){c=cv(src.width,src.height);const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,c.width,c.height);tintCache.set(k,c)}return c}
export function createCannonFx(root,opts){opts=opts||{};const C=merge(CANNON,opts.config||{}),canvas=document.createElement('canvas'),cx=canvas.getContext('2d');
 Object.assign(canvas.style,{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none'});root.append(canvas);
 let W=450,H=500,dpr=1,K=opts.scale||1,P=[],balls=[],trails=[],user=1,hs=0,ramp=0,run=false,last=0,pend=[];const S=makeSprites(),vis={};
 const layers=['muzzle','trail','ball','impact','debris','smoke','decal'];layers.forEach(l=>vis[l]=true);
 function resize(w,h,d){W=w;H=h;dpr=d||1;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);K=opts.scale||w/450}
 function E(o){const p=Object.assign({x:0,y:0,vx:0,vy:0,ay:0,drag:0,age:0,life:1,s0:10,s1:10,rot:0,vr:0,spr:'soft',blend:'add',a:1,ac:null,pal:null,stretch:0,flat:1,z:3,layer:'impact',delay:0,tintc:null,smokeMix:0,sc:null,asp:1},o);P.push(p);kick();return p}
 function kick(){if(!run&&!opts.manual){run=true;last=performance.now();requestAnimationFrame(loop)}}
 function step(dt){const slow=hs>0?(hs-=dt,.04):ramp>0?(ramp-=dt,lerp(.04,1,1-clamp(ramp/.14,0,1))):1,d=dt*slow*user;
  for(let i=P.length-1;i>=0;i--){const p=P[i];if(p.delay>0){p.delay-=d;continue}p.age+=d;if(p.age>=p.life){P.splice(i,1);continue}p.vy+=p.ay*d;const k=Math.max(0,1-p.drag*d);p.vx*=k;p.vy*=k;p.x+=p.vx*d;p.y+=p.vy*d;p.rot+=p.vr*d}
  for(let i=balls.length-1;i>=0;i--){const b=balls[i];b.t+=d/C.flight.dur;const u=clamp(b.t,0,1),e=u*(1.1-.1*u),dx=b.to.x-b.from.x,dy=b.to.y-b.from.y,h=C.flight.arc*b.dist;
   b.x=b.from.x+dx*e;b.y=b.from.y+dy*e-4*h*u*(1-u);b.rot+=C.flight.spin*d;b.persp=lerp(1,dy<0?1-C.flight.perspective:1+C.flight.perspective,u);
   b.hist.unshift({x:b.x,y:b.y});if(b.hist.length>C.flight.trailPoints)b.hist.pop();b.times.unshift(b.t);if(b.times.length>C.flight.trailPoints)b.times.pop();
   if(vis.trail&&Math.random()<.85)E({x:b.x,y:b.y,vx:rnd(-6,6)*K,vy:rnd(-12,-2)*K,life:rnd(.6,1),s0:8*K,s1:24*K,spr:'puff',blend:'n',a:.22,z:1,layer:'smoke',tintc:'#b4bac2',rot:rnd(0,6.28),vr:rnd(-1,1)});
   if(u>=1){balls.splice(i,1);impact(b)}}
  for(let i=pend.length-1;i>=0;i--){pend[i].t-=dt;if(pend[i].t<=0){pend[i].f();pend.splice(i,1)}}}
 function draw(){cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
  for(let z=0;z<=4;z++){for(const p of P){if(p.z!==z||p.delay>0||!vis[p.layer])continue;const t=p.age/p.life;let a=p.a*(p.ac?curve(p.ac,t):1-t);if(a<=.004)continue;const s=lerp(p.s0,p.s1,p.sc?curve(p.sc,t):eo(t));if(s<=.2)continue;
    cx.globalAlpha=Math.min(1,a);cx.globalCompositeOperation=p.blend==='add'?'lighter':'source-over';cx.save();cx.translate(p.x,p.y);
    let img;if(p.pal)img=tint(S[p.spr],p.spr,p.pal[Math.min(p.pal.length-1,Math.floor(t*p.pal.length))]);else if(p.tintc)img=tint(S[p.spr],p.spr,p.tintc);else img=S[p.spr];
    if(p.stretch){const sp=Math.hypot(p.vx,p.vy);cx.rotate(Math.atan2(p.vy,p.vx));const l=Math.max(s,s*(1+sp*p.stretch));cx.drawImage(img,-l,-s*.5,l,s)}
    else{if(p.rot)cx.rotate(p.rot);if(p.flat!==1)cx.scale(1,p.flat);cx.drawImage(img,-s/2,-s*p.asp/2,s,s*p.asp)}cx.restore()}
   if(z===1&&vis.trail)drawTrails();if(z===3&&vis.ball)balls.forEach(drawBall)}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over'}
 function drawTrails(){balls.forEach(b=>{const n=b.hist.length;if(n<2)return;cx.lineCap='round';cx.globalCompositeOperation='source-over';for(let i=1;i<n;i++){const f=1-i/n;cx.strokeStyle='rgba(205,212,220,'+(.72*f*f).toFixed(3)+')';cx.lineWidth=C.flight.trailWidth*K*f*b.persp;cx.beginPath();cx.moveTo(b.hist[i-1].x,b.hist[i-1].y);cx.lineTo(b.hist[i].x,b.hist[i].y);cx.stroke()}})}
 function drawBall(b){const r=C.flight.ball*K*b.persp,n=b.hist.length;cx.globalCompositeOperation='source-over';
  for(let g=3;g>=1;g--){const h=b.hist[Math.min(n-1,g*2)];if(!h)continue;const dx=b.x-h.x,dy=b.y-h.y,l=Math.hypot(dx,dy);if(l<1)continue;cx.save();cx.translate((b.x+h.x)/2,(b.y+h.y)/2);cx.rotate(Math.atan2(dy,dx));cx.globalAlpha=.16/g*2;cx.fillStyle='#10141b';cx.beginPath();cx.ellipse(0,0,l/2+r*.6,r*.8,0,0,7);cx.fill();cx.restore()}
  cx.globalAlpha=.22;cx.fillStyle='#000';cx.beginPath();cx.ellipse(b.x+r*.5,b.y+r*1.5+8*K,r*.9,r*.28,0,0,7);cx.fill();cx.globalAlpha=1;
  cx.save();cx.translate(b.x,b.y);cx.drawImage(S.ballBase,-r,-r,2*r,2*r);cx.save();cx.beginPath();cx.arc(0,0,r*.96,0,7);cx.clip();cx.rotate(b.rot);cx.drawImage(S.ballSeam,-r,-r,2*r,2*r);cx.restore();cx.drawImage(S.ballSpec,-r,-r,2*r,2*r);cx.restore()}
 function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;step(dt);draw();if(P.length||balls.length||pend.length||hs>0)requestAnimationFrame(loop);else{run=false;cx.clearRect(0,0,W,H)}}
 // ---------- الوميض عند الفوهة
 function muzzle(F,ang){const k=K,M=C.muzzle,dx=Math.cos(ang),dy=Math.sin(ang);const at=(d)=>({x:F.x+dx*d*k,y:F.y+dy*d*k});
  E({x:F.x,y:F.y,s0:20*k,s1:110*k,life:.09,spr:'star',rot:ang,a:1,ac:[[0,1],[.4,1],[1,0]],z:4,layer:'muzzle',blend:'add',tintc:'#ffe9a0'});
  E({x:F.x,y:F.y,s0:16*k,s1:46*k,life:.1,spr:'core',a:1,z:4,layer:'muzzle',pal:['#ffffff','#ffe27a','#ffa63a']});
  if(M.cone)for(let i=0;i<4;i++){const a=ang+rnd(-.2,.2),L=rnd(60,115)*k,q={x:F.x+Math.cos(a)*L*.5,y:F.y+Math.sin(a)*L*.5};E({x:q.x,y:q.y,life:.13,s0:L*.9,s1:L*1.15,asp:rnd(.16,.26),spr:'streak',rot:a+Math.PI,a:.95,z:3,layer:'muzzle',pal:['#fff3b8','#ffb347','#e8601a']})}
  for(let i=0;i<M.sparks;i++){const a=ang+rnd(-.5,.5),v=rnd(160,420)*k;E({x:F.x,y:F.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:260*k,drag:3,life:rnd(.2,.5),s0:rnd(10,20)*k,s1:2*k,spr:'streak',stretch:.01,a:1,z:3,layer:'muzzle',pal:['#fff6c8','#ffc24a','#ff7a1a']})}
  for(let i=0;i<M.smoke;i++){const a=ang+rnd(-.38,.38),v=rnd(40,150)*k;E({x:F.x+dx*10*k,y:F.y+dy*10*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v-10*k,drag:1.8,life:rnd(.7,1.2),s0:rnd(10,16)*k,s1:rnd(42,64)*k,spr:'puff',blend:'n',a:.55,ac:[[0,0],[.1,1],[1,0]],z:1,layer:'smoke',tintc:i%2?'#8d949c':'#c3c9d0',rot:rnd(0,6.28),vr:rnd(-.8,.8),delay:rnd(0,.05)})}
  if(M.ring)E({x:F.x,y:F.y,s0:10*k,s1:90*k,life:.22,spr:'ring',a:.7,flat:.8,z:3,layer:'muzzle',tintc:'#ffe8b0'});
  if(opts.onShake)opts.onShake(M.shake*k,160)}
 // ---------- الإصابة: وميض ← كرة نار ← موجة صدمة ← شظايا ← دخان ← جمر
 function hit(T,ang){const k=K,H_=C.hit,dx=Math.cos(ang),dy=Math.sin(ang);hs=H_.stop;ramp=.14;if(opts.onHitStop)opts.onHitStop(H_.stop*1000);
  E({x:T.x,y:T.y,s0:20*k,s1:105*k,life:.14,spr:'star',a:1,z:4,rot:ang,tintc:'#fff2c0',ac:[[0,1],[.3,1],[1,0]]});
  E({x:T.x,y:T.y,s0:30*k,s1:80*k,life:.16,spr:'core',a:1,z:4,pal:['#ffffff','#fff0a0','#ffb347','#e8601a']});
  E({x:T.x,y:T.y,s0:10*k,s1:210*k,life:.5,spr:'ring',a:.9,flat:.38,z:3,tintc:'#ffe6b0',ac:[[0,.9],[.5,.5],[1,0]]});
  E({x:T.x,y:T.y,s0:10*k,s1:150*k,life:.35,spr:'ring',a:.7,flat:.5,z:3,tintc:'#fff',delay:.04,ac:[[0,.7],[1,0]]});
  for(let i=0;i<H_.fire;i++){const a=rnd(0,6.28),v=rnd(20,150)*k;E({x:T.x+rnd(-8,8)*k,y:T.y+rnd(-6,6)*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-rnd(10,70)*k,drag:2.6,life:rnd(.35,.75),s0:rnd(28,46)*k,s1:rnd(62,100)*k,spr:'soft',a:.7,z:3,pal:FIRE,ac:[[0,.2],[.15,1],[1,0]],delay:rnd(0,.05)})}
  for(let i=0;i<H_.smoke;i++){const a=rnd(0,6.28),v=rnd(20,100)*k;E({x:T.x+rnd(-14,14)*k,y:T.y+rnd(-8,8)*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.5-rnd(20,60)*k,drag:1.4,life:rnd(1,1.8),s0:rnd(30,46)*k,s1:rnd(90,150)*k,spr:'puff',blend:'n',a:.62,ac:[[0,0],[.12,1],[.6,.6],[1,0]],z:1,layer:'smoke',tintc:i%3?'#3c3c42':'#6a6a72',rot:rnd(0,6.28),vr:rnd(-.5,.5),delay:rnd(.04,.2)})}
  for(let i=0;i<H_.wood;i++){const a=ang+rnd(-1.6,1.6),v=rnd(120,420)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(120,300)*k,ay:900*k,life:rnd(.7,1.3),s0:rnd(22,42)*k,s1:rnd(18,34)*k,asp:.28,spr:'splinter',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-14,14)})}
  for(let i=0;i<H_.metal;i++){const a=rnd(0,6.28),v=rnd(100,360)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(100,220)*k,ay:900*k,life:rnd(.6,1.1),s0:rnd(7,13)*k,s1:rnd(6,11)*k,spr:'metal',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-18,18)})}
  for(let i=0;i<H_.sparks;i++){const a=rnd(0,6.28),v=rnd(180,560)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(40,200)*k,ay:520*k,drag:1.6,life:rnd(.3,.8),s0:rnd(10,22)*k,s1:2*k,spr:'streak',stretch:.007,a:1,z:3,pal:['#ffffff','#ffd86a','#ff8a2a','#e8601a']})}
  for(let i=0;i<H_.embers;i++){const a=rnd(0,6.28),v=rnd(30,170)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(60,160)*k,ay:150*k,drag:1.1,life:rnd(.9,1.7),s0:rnd(5,9)*k,s1:rnd(2,4)*k,spr:'soft',a:1,z:3,pal:['#ffe27a','#ff9a2a','#e8601a','#6a2a10'],ac:[[0,0],[.1,1],[.5,.8],[.7,.3],[.8,.9],[1,0]],delay:rnd(.05,.3)})}
  if(H_.decal)E({x:T.x,y:T.y+8*k,s0:30*k,s1:70*k,life:2.2,spr:'soft',blend:'n',a:.55,flat:.5,z:0,layer:'decal',tintc:'#14100c',ac:[[0,0],[.08,1],[.7,.8],[1,0]]});
  if(opts.onShake)opts.onShake(H_.shake*k,H_.shakeMs)}
 // ---------- الإخفاق: عمود ماء + حلقات + رغوة
 function miss(T){const k=K,M=C.miss;E({x:T.x,y:T.y,s0:20*k,s1:120*k,life:.16,spr:'core',a:1,z:4,tintc:'#e8f8ff'});
  for(let i=0;i<M.spray;i++){const v=rnd(260,520)*k;E({x:T.x+rnd(-8,8)*k,y:T.y,vx:rnd(-60,60)*k,vy:-v,ay:900*k,drag:.3,life:rnd(.7,1.1),s0:rnd(18,30)*k,s1:rnd(44,74)*k,spr:'puff',blend:'n',a:1,ac:[[0,0],[.1,1],[.7,.7],[1,0]],z:2,layer:'smoke',tintc:'#f0fbff',rot:rnd(0,6.28),delay:rnd(0,.06)})}
  for(let i=0;i<M.drops;i++){const a=rnd(-2.7,-.4),v=rnd(120,420)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:900*k,life:rnd(.6,1.1),s0:rnd(11,17)*k,s1:rnd(8,12)*k,asp:1.5,spr:'drop',blend:'n',a:.95,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',stretch:.0}).rot=0;P[P.length-1].vr=0}
  for(let i=0;i<3;i++)E({x:T.x,y:T.y+3*k,s0:12*k,s1:(170+i*46)*k,life:1.05,spr:'ring',a:1,flat:.32,z:1,layer:'impact',tintc:'#f4fcff',delay:i*.1,ac:[[0,.9],[.6,.4],[1,0]]});
  E({x:T.x,y:T.y+4*k,s0:30*k,s1:170*k,life:1.4,spr:'soft',blend:'n',a:.7,flat:.3,z:0,layer:'decal',tintc:'#ffffff',ac:[[0,0],[.15,1],[1,0]]});
  if(opts.onShake)opts.onShake(M.shake*k,200)}
 // ---------- صدّ الدرع: شرر مرتد وحلقة بلون الدرع
 function blocked(T,ang,col){const k=K,B=C.blocked;col=col||'#7fe3ff';E({x:T.x,y:T.y,s0:30*k,s1:150*k,life:.2,spr:'core',a:1,z:4,tintc:col});E({x:T.x,y:T.y,s0:10*k,s1:210*k,life:.5,spr:'ring',a:.9,flat:.7,z:3,tintc:col,ac:[[0,.95],[1,0]]});
  for(let i=0;i<B.sparks;i++){const a=ang+Math.PI+rnd(-1.2,1.2),v=rnd(160,480)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(0,120)*k,ay:420*k,drag:1.2,life:rnd(.3,.7),s0:rnd(16,28)*k,s1:3*k,spr:'streak',stretch:.012,a:1,z:3,tintc:i%2?'#ffffff':col})}
  if(opts.onShake)opts.onShake(B.shake*k,220)}
 function impact(b){const out=b.outcome,ang=Math.atan2(b.to.y-b.from.y,b.to.x-b.from.x);if(out==='miss')miss(b.to);else if(out==='blocked')blocked(b.to,ang,b.color);else hit(b.to,ang);if(opts.onImpact)opts.onImpact(out);pend.push({t:.7,f:b.done});kick()}
 // ---------- الواجهة
 // cfg: {from:{x,y}, to:{x,y}, outcome:'hit'|'miss'|'blocked', shieldColor:'#7fe3ff'} — يعيد وعدًا يكتمل بعد الاصطدام
 function fire(cfg){return new Promise(res=>{const F=cfg.from,T=cfg.to,ang=Math.atan2(T.y-F.y,T.x-F.x);muzzle(F,ang);if(opts.onRecoil)opts.onRecoil(ang);
  balls.push({from:F,to:T,t:0,x:F.x,y:F.y,dist:Math.hypot(T.x-F.x,T.y-F.y),rot:rnd(0,6),persp:1,hist:[],times:[],outcome:cfg.outcome||'hit',color:cfg.shieldColor,done:res});kick()})}
 function advance(dt){step(dt);draw()}
 return{resize,fire,advance,clear(){P=[];balls=[];pend=[];cx.clearRect(0,0,W,H)},setTimeScale(v){user=v},setLayer(n,v){vis[n]=v},layers,config:C}}
