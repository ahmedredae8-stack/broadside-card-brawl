// الصواريخ — رشقة من صواريخ تتبع الهدف: الإقلاع ← الانحناء ← قفل الهدف والغوص ← اصطدامات متتابعة (إصابة / صدّ / إخفاق) ← ما بعد الانفجار.
// كل الرسم برمجي (بلا صور). كل الأرقام في CANNON تعدّل من الخارج عبر opts.config.
export const MISSILE={
 salvo:{count:3,gap:.16,fan:40,spread:15},
 flight:{dur:1.15,size:76,boostUp:.34,diveK:.42,perspective:.16,lockAt:.45,trailStep:3},
 launch:{smoke:7,sparks:10,shake:2.2},
 hit:{shake:[4,5.5,8],stop:[.05,.035,.06],zoom:1.025,flash:.14,fire:8,smoke:8,wood:9,metal:5,sparks:16,embers:7},
 blocked:{shake:3,sparks:14},
 miss:{shake:2,spray:10,drops:12}};
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
 S.rocket=(()=>{const c=cv(256,80),g=c.getContext('2d');const O='#12161d';
 const red=(x0,y0,x1,y1)=>{const r=g.createLinearGradient(x0,y0,x1,y1);r.addColorStop(0,'#ff9a8a');r.addColorStop(.5,'#d9352e');r.addColorStop(1,'#7a1a16');return r};
 g.lineJoin='round';g.lineWidth=3;g.strokeStyle=O;
 g.fillStyle=red(0,0,0,30);g.beginPath();g.moveTo(88,22);g.lineTo(62,3);g.lineTo(104,3);g.lineTo(114,22);g.closePath();g.fill();g.stroke();
 g.fillStyle=red(0,50,0,80);g.beginPath();g.moveTo(88,58);g.lineTo(62,77);g.lineTo(104,77);g.lineTo(114,58);g.closePath();g.fill();g.stroke();
 const nz=g.createLinearGradient(0,28,0,52);nz.addColorStop(0,'#5a6474');nz.addColorStop(.5,'#2a313c');nz.addColorStop(1,'#12161d');g.fillStyle=nz;g.beginPath();g.moveTo(66,28);g.lineTo(50,24);g.lineTo(46,56);g.lineTo(66,52);g.closePath();g.fill();g.stroke();
 const bd=g.createLinearGradient(0,22,0,58);bd.addColorStop(0,'#ffffff');bd.addColorStop(.35,'#e6ebf3');bd.addColorStop(.75,'#aeb9ca');bd.addColorStop(1,'#6e7b90');g.fillStyle=bd;g.beginPath();g.moveTo(70,22);g.lineTo(196,22);g.quadraticCurveTo(208,22,208,40);g.quadraticCurveTo(208,58,196,58);g.lineTo(70,58);g.quadraticCurveTo(60,58,60,40);g.quadraticCurveTo(60,22,70,22);g.closePath();g.fill();g.stroke();
 g.fillStyle=red(0,22,0,58);g.beginPath();g.moveTo(196,22);g.quadraticCurveTo(238,24,254,40);g.quadraticCurveTo(238,56,196,58);g.closePath();g.fill();g.stroke();
 g.fillStyle='#2b323d';g.fillRect(128,22,10,36);g.fillStyle=red(0,22,0,58);g.fillRect(98,22,6,36);g.fillStyle='#2b323d';g.fillRect(172,22,4,36);
 g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=1.4;[84,112,150].forEach(x=>{g.beginPath();g.moveTo(x,23);g.lineTo(x,57);g.stroke()});
 const w=g.createRadialGradient(160,38,1,160,40,9);w.addColorStop(0,'#cfeeff');w.addColorStop(.6,'#5aa8e0');w.addColorStop(1,'#1d4f86');g.fillStyle=w;g.beginPath();g.arc(160,40,8,0,7);g.fill();g.strokeStyle=O;g.lineWidth=2.4;g.stroke();g.fillStyle='rgba(255,255,255,.8)';g.beginPath();g.arc(157,37,2.4,0,7);g.fill();
 g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(74,26);g.lineTo(190,26);g.stroke();g.strokeStyle='rgba(255,220,210,.75)';g.beginPath();g.moveTo(206,28);g.quadraticCurveTo(236,28,246,38);g.stroke();return c})();
 S.flame=(()=>{const c=cv(160,40),g=c.getContext('2d'),r=g.createLinearGradient(0,0,160,0);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.45,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,1)');g.fillStyle=r;g.beginPath();g.moveTo(0,20);g.quadraticCurveTo(80,-2,160,5);g.lineTo(160,35);g.quadraticCurveTo(80,42,0,20);g.fill();return c})();
 return S}
const tintCache=new Map();
function tint(src,key,color){const k=key+color;let c=tintCache.get(k);if(!c){c=cv(src.width,src.height);const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,c.width,c.height);tintCache.set(k,c)}return c}
export function createMissileFx(root,opts){opts=opts||{};const C=merge(MISSILE,opts.config||{}),canvas=document.createElement('canvas'),cx=canvas.getContext('2d');
 Object.assign(canvas.style,{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none'});root.append(canvas);
 let W=450,H=500,dpr=1,K=opts.scale||1,P=[],ms=[],locks=[],user=1,hs=0,ramp=0,run=false,last=0,pend=[];const S=makeSprites(),vis={};
 const layers=['launch','trail','missile','lock','impact','debris','smoke','decal'];layers.forEach(l=>vis[l]=true);
 function resize(w,h,d){W=w;H=h;dpr=d||1;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);K=opts.scale||w/450}
 function E(o){const p=Object.assign({x:0,y:0,vx:0,vy:0,ay:0,drag:0,age:0,life:1,s0:10,s1:10,rot:0,vr:0,spr:'soft',blend:'add',a:1,ac:null,pal:null,stretch:0,flat:1,z:3,layer:'impact',delay:0,tintc:null,sc:null,asp:1,curl:0,cf:6,cp:0},o);P.push(p);kick();return p}
 function kick(){if(!run&&!opts.manual){run=true;last=performance.now();requestAnimationFrame(loop)}}
 const ph=n=>{if(opts.onPhase)opts.onPhase(n)};
 const bez=(m,w)=>{const u=1-w,a=u*u*u,b=3*u*u*w,c=3*u*w*w,d=w*w*w,P0=m.p[0],P1=m.p[1],P2=m.p[2],P3=m.p[3];return{x:a*P0.x+b*P1.x+c*P2.x+d*P3.x,y:a*P0.y+b*P1.y+c*P2.y+d*P3.y,dx:3*u*u*(P1.x-P0.x)+6*u*w*(P2.x-P1.x)+3*w*w*(P3.x-P2.x),dy:3*u*u*(P1.y-P0.y)+6*u*w*(P2.y-P1.y)+3*w*w*(P3.y-P2.y)}};
 function step(dt){const slow=hs>0?(hs-=dt,.04):ramp>0?(ramp-=dt,lerp(.04,1,1-clamp(ramp/.14,0,1))):1,d=dt*slow*user,k=K;
  for(let i=P.length-1;i>=0;i--){const p=P[i];if(p.delay>0){p.delay-=d;continue}p.age+=d;if(p.age>=p.life){P.splice(i,1);continue}if(p.curl){p.vx+=Math.cos(p.age*p.cf+p.cp)*p.curl*d;p.vy+=Math.sin(p.age*p.cf+p.cp)*p.curl*d}p.vy+=p.ay*d;const q=Math.max(0,1-p.drag*d);p.vx*=q;p.vy*=q;p.x+=p.vx*d;p.y+=p.vy*d;p.rot+=p.vr*d}
  for(let i=locks.length-1;i>=0;i--){locks[i].age+=d;if(locks[i].age>=locks[i].life)locks.splice(i,1)}
  for(let i=ms.length-1;i>=0;i--){const m=ms[i];if(m.wait>0){m.wait-=d;continue}if(!m.launched){m.launched=1;ignite(m)}
   m.t+=d/C.flight.dur;const u=clamp(m.t,0,1),w=u*u*(1.7-.7*u),B=bez(m,w);let tx=0,ty=0;if(m.track){const T=m.track();if(T){tx=(T.x-m.to.x)*u*u;ty=(T.y-m.to.y)*u*u}}
   const px=m.x,py=m.y;m.x=B.x+tx;m.y=B.y+ty;m.ang=Math.atan2(B.dy,B.dx);m.roll=.05*Math.sin(m.t*14+m.seed);m.sc=lerp(1,m.dy<0?1-C.flight.perspective:1+C.flight.perspective,u)*(1+.18*u*u);m.age+=d;
   const L=C.flight.size*k*m.sc,dirx=Math.cos(m.ang),diry=Math.sin(m.ang),nx=m.x-dirx*L*.39,ny=m.y-diry*L*.39;m.acc+=Math.hypot(m.x-px,m.y-py);
   while(m.acc>C.flight.trailStep*k&&vis.trail){m.acc-=C.flight.trailStep*k;E({x:nx+rnd(-2,2)*k,y:ny+rnd(-2,2)*k,vx:-dirx*rnd(10,40)*k+rnd(-12,12)*k,vy:-diry*rnd(10,40)*k+rnd(-12,12)*k,life:rnd(.7,1.3),s0:6*k,s1:rnd(26,42)*k,spr:'puff',blend:'n',a:.34,ac:[[0,0],[.08,1],[1,0]],z:1,layer:'smoke',tintc:'#d9dee5',rot:rnd(0,6.28),vr:rnd(-.8,.8),curl:rnd(40,90)*k,cf:rnd(4,8),cp:rnd(0,6.28)});
    E({x:nx,y:ny,vx:-dirx*rnd(20,60)*k,vy:-diry*rnd(20,60)*k,life:rnd(.14,.26),s0:rnd(10,16)*k,s1:3*k,spr:'soft',a:.9,z:3,layer:'trail',pal:['#ffffff','#ffc24a','#e8601a']})}
   if(!m.flare&&u>=.16){m.flare=1;E({x:m.x,y:m.y,s0:10*k,s1:80*k,life:.2,spr:'core',a:.9,z:4,layer:'launch',pal:['#ffffff','#ffd86a','#ff9a2a']});for(let q=0;q<6;q++)E({x:m.x,y:m.y,vx:rnd(-90,90)*k,vy:rnd(-90,90)*k,drag:3,life:rnd(.2,.4),s0:rnd(8,14)*k,s1:2*k,spr:'streak',stretch:.01,a:1,z:3,layer:'launch',pal:['#fff6c8','#ffc24a','#ff7a1a']});if(m.idx===0)ph(2)}
   if(!locks.length&&!m.locked&&u>=C.flight.lockAt&&m.idx===0&&!ms.some(x=>x.lockedAny)){m.locked=1;ms.forEach(x=>x.lockedAny=1);ph(3);const life=(1-m.t)*C.flight.dur+(ms.length-1)*C.salvo.gap+.15;locks.push({x:m.to.x,y:m.to.y,age:0,life})}
   if(m.t>=1){ms.splice(i,1);impact(m)}}
  for(let i=pend.length-1;i>=0;i--){pend[i].t-=dt;if(pend[i].t<=0){pend[i].f();pend.splice(i,1)}}}
 function draw(){cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
  for(let z=0;z<=4;z++){for(const p of P){if(p.z!==z||p.delay>0||!vis[p.layer])continue;const t=p.age/p.life;let a=p.a*(p.ac?curve(p.ac,t):1-t);if(a<=.004)continue;const s=lerp(p.s0,p.s1,p.sc?curve(p.sc,t):eo(t));if(s<=.2)continue;
    cx.globalAlpha=Math.min(1,a);cx.globalCompositeOperation=p.blend==='add'?'lighter':'source-over';cx.save();cx.translate(p.x,p.y);
    let img;if(p.pal)img=tint(S[p.spr],p.spr,p.pal[Math.min(p.pal.length-1,Math.floor(t*p.pal.length))]);else if(p.tintc)img=tint(S[p.spr],p.spr,p.tintc);else img=S[p.spr];
    if(p.stretch){const sp=Math.hypot(p.vx,p.vy);cx.rotate(Math.atan2(p.vy,p.vx));const l=Math.max(s,s*(1+sp*p.stretch));cx.drawImage(img,-l,-s*.5,l,s)}
    else{if(p.rot)cx.rotate(p.rot);if(p.flat!==1)cx.scale(1,p.flat);cx.drawImage(img,-s/2,-s*p.asp/2,s,s*p.asp)}cx.restore()}
   if(z===3&&vis.missile)ms.forEach(m=>{if(m.launched)drawRocket(m)});if(z===4&&vis.lock)locks.forEach(drawLock)}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over'}
 function drawRocket(m){const k=K,L=C.flight.size*k*m.sc,ang=m.ang+m.roll,dx=Math.cos(ang),dy=Math.sin(ang),fl=1+.16*Math.sin(m.age*52+m.seed)+.09*Math.sin(m.age*97),nx=m.x-dx*L*.39,ny=m.y-dy*L*.39;
  cx.globalCompositeOperation='lighter';cx.globalAlpha=.55*fl;cx.drawImage(tint(S.soft,'soft','#ff8a2a'),nx-L*.55,ny-L*.55,L*1.1,L*1.1);
  [['#ff7a1a',1.55,.5,.85],['#ffc24a',1.05,.34,.95],['#ffffff',.55,.2,1]].forEach(([c,len,h,a])=>{const ll=L*len*fl;cx.save();cx.translate(nx+dx*L*.02,ny+dy*L*.02);cx.rotate(ang);cx.globalAlpha=a;cx.drawImage(tint(S.flame,'flame',c),-ll,-L*h*.5*(.92+.16*Math.sin(m.age*70+len)),ll,L*h);cx.restore()});
  cx.globalCompositeOperation='source-over';cx.globalAlpha=.2;cx.fillStyle='#000';cx.beginPath();cx.ellipse(m.x+L*.1,m.y+L*.35,L*.3,L*.05,ang,0,7);cx.fill();
  cx.globalAlpha=1;cx.save();cx.translate(m.x,m.y);cx.rotate(ang);const w=L,h=L*80/256;cx.drawImage(S.rocket,-w*.586,-h/2,w,h);cx.restore();
  cx.globalCompositeOperation='lighter';cx.globalAlpha=.9*fl;cx.drawImage(tint(S.core,'core','#ffd86a'),nx-L*.1,ny-L*.1,L*.2,L*.2);cx.globalCompositeOperation='source-over'}
 function drawLock(l){const k=K,t=l.age/l.life,R=lerp(84,30,t)*k,rot=l.age*2.4,al=clamp(t*6,0,1)*(.55+.45*Math.sin(l.age*16));cx.globalCompositeOperation='lighter';cx.strokeStyle='#ff5a3a';cx.lineWidth=3*k;cx.lineCap='round';cx.globalAlpha=al;
  for(let j=0;j<4;j++){const a=rot+j*Math.PI/2;cx.beginPath();cx.ellipse(l.x,l.y,R,R*.62,0,a-.34,a+.34);cx.stroke()}cx.globalAlpha=al*.8;cx.lineWidth=1.6*k;cx.beginPath();cx.ellipse(l.x,l.y,R*.42,R*.26,0,0,6.3);cx.stroke();cx.fillStyle='#ffb09a';cx.beginPath();cx.arc(l.x,l.y,3*k,0,6.3);cx.fill();cx.globalCompositeOperation='source-over'}
 function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;step(dt);draw();if(P.length||ms.length||locks.length||pend.length||hs>0)requestAnimationFrame(loop);else{run=false;cx.clearRect(0,0,W,H)}}
 // ---------- الإقلاع: وميض ودفعة دخان للخلف وغبار
 function ignite(m){const k=K,L=C.launch,F=m.p[0];E({x:F.x,y:F.y,s0:16*k,s1:100*k,life:.12,spr:'star',a:1,z:4,layer:'launch',rot:-Math.PI/2,tintc:'#ffe9a0',ac:[[0,1],[.4,1],[1,0]]});E({x:F.x,y:F.y,s0:20*k,s1:70*k,life:.14,spr:'core',a:1,z:4,layer:'launch',pal:['#ffffff','#ffe27a','#ffa63a']});
  for(let i=0;i<L.sparks;i++){const a=-Math.PI/2+rnd(-.9,.9),v=rnd(120,340)*k;E({x:F.x,y:F.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:360*k,drag:2.2,life:rnd(.25,.6),s0:rnd(8,14)*k,s1:2*k,spr:'streak',stretch:.01,a:1,z:3,layer:'launch',pal:['#fff6c8','#ffc24a','#ff7a1a']})}
  E({x:F.x,y:F.y+8*k,s0:20*k,s1:120*k,life:.5,spr:'ring',a:.7,flat:.34,z:1,layer:'launch',tintc:'#e8e2d8',ac:[[0,.7],[1,0]]});
  for(let i=0;i<L.smoke;i++){const sd=rnd(-1,1),v=rnd(20,150)*k;E({x:F.x+sd*8*k,y:F.y+6*k,vx:sd*v,vy:rnd(-20,50)*k,drag:1.6,life:rnd(.9,1.6),s0:rnd(14,24)*k,s1:rnd(50,84)*k,spr:'puff',blend:'n',a:.46,ac:[[0,0],[.1,1],[1,0]],z:1,layer:'smoke',tintc:i%2?'#9aa1a9':'#cdd3da',rot:rnd(0,6.28),vr:rnd(-.6,.6),delay:rnd(0,.05)})}
  if(opts.onShake)opts.onShake(L.shake*k,150);if(m.idx===0){if(opts.onRecoil)opts.onRecoil(Math.PI/2);ph(1)}}
 // ---------- الاصطدامات
 function hitM(T,i,last){const k=K,H_=C.hit,sh=H_.shake[Math.min(i,H_.shake.length-1)]||4,st=H_.stop[Math.min(i,H_.stop.length-1)]||.04;hs=Math.max(hs,st);ramp=.14;if(opts.onHitStop)opts.onHitStop(st*1000);
  E({x:T.x,y:T.y,s0:20*k,s1:92*k,life:.13,spr:'star',a:1,z:4,tintc:'#fff2c0',ac:[[0,1],[.3,1],[1,0]],rot:rnd(0,3)});E({x:T.x,y:T.y,s0:26*k,s1:78*k,life:.16,spr:'core',a:1,z:4,pal:['#ffffff','#fff0a0','#ffb347','#e8601a']});
  E({x:T.x,y:T.y,s0:10*k,s1:170*k,life:.42,spr:'ring',a:.85,flat:.38,z:3,tintc:'#ffe6b0',ac:[[0,.9],[.5,.5],[1,0]]});
  for(let q=0;q<H_.fire;q++){const a=rnd(0,6.28),v=rnd(20,130)*k;E({x:T.x+rnd(-6,6)*k,y:T.y+rnd(-5,5)*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.7-rnd(10,60)*k,drag:2.6,life:rnd(.3,.65),s0:rnd(24,38)*k,s1:rnd(54,86)*k,spr:'soft',a:.7,z:3,pal:FIRE,ac:[[0,.2],[.15,1],[1,0]],delay:rnd(0,.04)})}
  for(let q=0;q<H_.smoke;q++){const a=rnd(0,6.28),v=rnd(20,90)*k;E({x:T.x+rnd(-10,10)*k,y:T.y+rnd(-6,6)*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.5-rnd(20,70)*k,drag:1.4,life:rnd(1,1.8),s0:rnd(24,38)*k,s1:rnd(70,120)*k,spr:'puff',blend:'n',a:.58,ac:[[0,0],[.12,1],[.6,.6],[1,0]],z:1,layer:'smoke',tintc:q%3?'#3c3c42':'#6a6a72',rot:rnd(0,6.28),vr:rnd(-.5,.5),delay:rnd(.04,.16)})}
  for(let q=0;q<H_.wood;q++){const a=rnd(0,6.28),v=rnd(120,380)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(120,280)*k,ay:900*k,life:rnd(.7,1.2),s0:rnd(18,34)*k,s1:rnd(14,28)*k,asp:.28,spr:'splinter',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-14,14)})}
  for(let q=0;q<H_.metal;q++){const a=rnd(0,6.28),v=rnd(100,320)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(100,200)*k,ay:900*k,life:rnd(.6,1),s0:rnd(7,12)*k,s1:rnd(5,9)*k,spr:'metal',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-18,18)})}
  for(let q=0;q<H_.sparks;q++){const a=rnd(0,6.28),v=rnd(160,500)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(30,170)*k,ay:520*k,drag:1.6,life:rnd(.3,.7),s0:rnd(9,18)*k,s1:2*k,spr:'streak',stretch:.007,a:1,z:3,pal:['#ffffff','#ffd86a','#ff8a2a','#e8601a']})}
  for(let q=0;q<H_.embers;q++){const a=rnd(0,6.28),v=rnd(30,150)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(50,140)*k,ay:150*k,drag:1.1,life:rnd(.9,1.6),s0:rnd(4,8)*k,s1:rnd(2,3)*k,spr:'soft',a:1,z:3,pal:['#ffe27a','#ff9a2a','#e8601a','#6a2a10'],ac:[[0,0],[.1,1],[.5,.8],[.7,.3],[.8,.9],[1,0]],delay:rnd(.05,.25)})}
  E({x:T.x,y:T.y+6*k,s0:24*k,s1:56*k,life:2,spr:'soft',blend:'n',a:.5,flat:.5,z:0,layer:'decal',tintc:'#14100c',ac:[[0,0],[.08,1],[.7,.8],[1,0]]});
  if(last){for(let q=0;q<6;q++)E({x:T.x+rnd(-14,14)*k,y:T.y-rnd(0,20)*k,vx:rnd(-24,24)*k,vy:-rnd(70,170)*k,drag:.8,life:rnd(1.6,2.4),s0:rnd(34,48)*k,s1:rnd(96,150)*k,spr:'puff',blend:'n',a:.62,ac:[[0,0],[.12,1],[.6,.6],[1,0]],z:1,layer:'smoke',tintc:q<3?'#2c2c32':'#5a5a62',rot:rnd(0,6.28),delay:q*.03});if(opts.onZoom)opts.onZoom(H_.zoom,240);if(opts.onFlash)opts.onFlash(H_.flash,200)}
  if(opts.onShake)opts.onShake(sh*k,300)}
 function blockedM(T,col,i){const k=K,B=C.blocked;col=col||'#7fe3ff';E({x:T.x,y:T.y,s0:20*k,s1:110*k,life:.18,spr:'core',a:1,z:4,tintc:col});E({x:T.x,y:T.y,s0:10*k,s1:170*k,life:.45,spr:'ring',a:.9,flat:.7,z:3,tintc:col,ac:[[0,.95],[1,0]]});
  for(let q=0;q<B.sparks;q++){const a=-Math.PI/2+rnd(-1.5,1.5),v=rnd(150,430)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:420*k,drag:1.2,life:rnd(.3,.7),s0:rnd(14,24)*k,s1:3*k,spr:'streak',stretch:.012,a:1,z:3,tintc:q%2?'#ffffff':col})}
  if(opts.onShake)opts.onShake(B.shake*k,200)}
 function missM(T,i,last){const k=K,M=C.miss;E({x:T.x,y:T.y,s0:14*k,s1:80*k,life:.14,spr:'core',a:1,z:4,tintc:'#e8f8ff'});
  for(let q=0;q<M.spray;q++){const v=rnd(220,430)*k;E({x:T.x+rnd(-6,6)*k,y:T.y,vx:rnd(-50,50)*k,vy:-v,ay:900*k,drag:.3,life:rnd(.6,1),s0:rnd(14,22)*k,s1:rnd(34,58)*k,spr:'puff',blend:'n',a:1,ac:[[0,0],[.1,1],[.7,.7],[1,0]],z:2,layer:'smoke',tintc:'#f0fbff',rot:rnd(0,6.28),delay:rnd(0,.05)})}
  for(let q=0;q<M.drops;q++){const a=rnd(-2.7,-.4),v=rnd(120,380)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:900*k,life:rnd(.6,1),s0:rnd(9,14)*k,s1:rnd(7,10)*k,asp:1.5,spr:'drop',blend:'n',a:.95,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris'})}
  for(let q=0;q<2;q++)E({x:T.x,y:T.y+3*k,s0:10*k,s1:(110+q*40)*k,life:1,spr:'ring',a:1,flat:.32,z:1,tintc:'#f4fcff',delay:q*.1,ac:[[0,.9],[.6,.4],[1,0]]});
  if(opts.onShake)opts.onShake(M.shake*k,160)}
 function impact(m){const o=m.outcome,last=m.last,first=!m.job.firstDone;if(first){m.job.firstDone=1;ph(4)}
  if(o==='miss')missM(m.to,m.idx,last);else if(o==='blocked')blockedM(m.to,m.color,m.idx);else hitM(m.to,m.idx,last);
  if(opts.onMissileImpact)opts.onMissileImpact(m.idx,o);
  m.job.left--;if(m.job.left===0){if(opts.onImpact)opts.onImpact(o);pend.push({t:.5,f:()=>ph(5)});pend.push({t:.9,f:m.job.done});kick()}}
 // cfg: {from,to,outcome:'hit'|'blocked'|'miss',shieldColor,track:()=>({x,y}) اختياري لتتبع هدف يتحرك}
 function fire(cfg){return new Promise(res=>{const F=cfg.from,T=cfg.to,n=C.salvo.count,k=K,dx=T.x-F.x,dy=T.y-F.y,dist=Math.hypot(dx,dy),job={left:n,done:res};
  const Hup=clamp(dist*C.flight.boostUp,90*k,230*k),Hd=clamp(dist*C.flight.diveK,110*k,260*k);
  for(let i=0;i<n;i++){const o=(i-(n-1)/2),off=o*C.salvo.fan*k,fo={x:F.x+o*8*k,y:F.y},to={x:T.x+o*C.salvo.spread*k,y:T.y+Math.abs(o)*4*k};
   const p1={x:fo.x+dx*.1+off*1.25,y:fo.y-Hup*(1+.16*o)},p2={x:to.x-dx*.1+off*.5,y:to.y-Hd*(1+.1*o)};
   ms.push({idx:i,last:i===n-1,job,p:[fo,p1,p2,to],to,t:0,wait:i*C.salvo.gap,launched:0,x:fo.x,y:fo.y,ang:-Math.PI/2,roll:0,sc:1,age:0,acc:0,seed:rnd(0,6),dy,outcome:cfg.outcome||'hit',color:cfg.shieldColor,track:cfg.track||null})}kick()})}
 function advance(dt){step(dt);draw()}
 return{resize,fire,advance,clear(){P=[];ms=[];locks=[];pend=[];cx.clearRect(0,0,W,H)},setTimeScale(v){user=v},setLayer(n,v){vis[n]=v},setSalvo(n){C.salvo.count=n},stats(){return{particles:P.length,missiles:ms.length}},layers,config:C}}
