// الطوربيد — سلاح تحت الماء: الغطسة ← الجري المغمور بأثر V ← نبضات سونار على الهدف ← انفجار تحت الهيكل بعمود ماء ينهار (إصابة / إخفاق / صدّ).
// كل الرسم برمجي (بلا صور). كل الأرقام في CANNON تعدّل من الخارج عبر opts.config.
export const TORPEDO={
 run:{dur:1.7,size:84,hullDrop:28,perspective:.18,sonarAt:.4,wobble:6},
 launch:{bubbles:16,drops:12,shake:2},
 hit:{stop:.09,shake:10,shakeMs:520,zoom:1.03,flash:.12,geyser:22,crown:14,fire:8,wood:12,metal:6,smoke:8,bubbles:32,drops:44},
 miss:{geyser:10,drops:20,shake:3.5},
 blocked:{sparks:18,shake:4}};
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
 S.bubble=(()=>{const c=cv(48,48),g=c.getContext('2d');g.strokeStyle='rgba(255,255,255,.95)';g.lineWidth=3;g.beginPath();g.arc(24,24,18,0,7);g.stroke();const r=g.createRadialGradient(24,24,8,24,24,19);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(1,'rgba(255,255,255,.35)');g.fillStyle=r;g.beginPath();g.arc(24,24,18,0,7);g.fill();g.fillStyle='rgba(255,255,255,.95)';g.beginPath();g.arc(17,16,4,0,7);g.fill();return c})();
 S.torp=(()=>{const c=cv(240,64),g=c.getContext('2d'),O='#10151c';g.lineJoin='round';g.lineWidth=3;g.strokeStyle=O;
  const st=g.createLinearGradient(0,10,0,54);st.addColorStop(0,'#c7d2e2');st.addColorStop(.35,'#7d8a9e');st.addColorStop(.75,'#3c4656');st.addColorStop(1,'#1b212b');
  g.fillStyle='#3c4656';g.beginPath();g.moveTo(52,14);g.lineTo(38,2);g.lineTo(66,2);g.lineTo(74,14);g.closePath();g.fill();g.stroke();g.beginPath();g.moveTo(52,50);g.lineTo(38,62);g.lineTo(66,62);g.lineTo(74,50);g.closePath();g.fill();g.stroke();
  g.fillStyle=st;g.beginPath();g.moveTo(40,12);g.lineTo(188,12);g.quadraticCurveTo(206,12,206,32);g.quadraticCurveTo(206,52,188,52);g.lineTo(40,52);g.quadraticCurveTo(28,52,28,32);g.quadraticCurveTo(28,12,40,12);g.closePath();g.fill();g.stroke();
  const rd=g.createLinearGradient(0,12,0,52);rd.addColorStop(0,'#ff9a8a');rd.addColorStop(.5,'#d9352e');rd.addColorStop(1,'#6a1814');g.fillStyle=rd;g.beginPath();g.moveTo(186,12);g.quadraticCurveTo(232,14,238,32);g.quadraticCurveTo(232,50,186,52);g.closePath();g.fill();g.stroke();
  const br=g.createLinearGradient(0,12,0,52);br.addColorStop(0,'#fff0a0');br.addColorStop(.5,'#e0ac2a');br.addColorStop(1,'#8a5a0c');g.fillStyle=br;[[96,10],[150,10]].forEach(([x,w])=>{g.fillRect(x,12,w,40);g.strokeRect(x,12,w,40)});
  g.fillStyle='#232a35';g.fillRect(30,12,8,40);g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=1.4;[70,124,176].forEach(x=>{g.beginPath();g.moveTo(x,13);g.lineTo(x,51);g.stroke()});
  g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=3;g.lineCap='round';g.beginPath();g.moveTo(44,17);g.lineTo(184,17);g.stroke();g.strokeStyle='rgba(255,220,210,.7)';g.beginPath();g.moveTo(190,18);g.quadraticCurveTo(222,19,231,30);g.stroke();return c})();
  S.torpDeep=(()=>{const c=cv(240,64),g=c.getContext('2d');g.drawImage(S.torp,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(18,92,128,.52)';g.fillRect(0,0,240,64);const l=g.createLinearGradient(0,0,0,64);l.addColorStop(0,'rgba(190,240,255,.35)');l.addColorStop(.4,'rgba(190,240,255,0)');g.fillStyle=l;g.fillRect(0,0,240,64);return c})();
 return S}
const tintCache=new Map();
function tint(src,key,color){const k=key+color;let c=tintCache.get(k);if(!c){c=cv(src.width,src.height);const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,c.width,c.height);tintCache.set(k,c)}return c}
export function createTorpedoFx(root,opts){opts=opts||{};const C=merge(TORPEDO,opts.config||{}),canvas=document.createElement('canvas'),cx=canvas.getContext('2d');
 Object.assign(canvas.style,{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none'});root.append(canvas);
 let W=450,H=500,dpr=1,K=opts.scale||1,P=[],ts=[],user=1,hs=0,ramp=0,run=false,last=0,pend=[];const S=makeSprites(),vis={};
 const layers=['launch','trail','torpedo','sonar','impact','debris','smoke','decal'];layers.forEach(l=>vis[l]=true);
 function resize(w,h,d){W=w;H=h;dpr=d||1;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);K=opts.scale||w/450}
 function E(o){const p=Object.assign({x:0,y:0,vx:0,vy:0,ay:0,drag:0,age:0,life:1,s0:10,s1:10,rot:0,vr:0,spr:'soft',blend:'add',a:1,ac:null,pal:null,stretch:0,flat:1,z:3,layer:'impact',delay:0,tintc:null,sc:null,asp:1,curl:0,cf:6,cp:0},o);P.push(p);kick();return p}
 function kick(){if(!run&&!opts.manual){run=true;last=performance.now();requestAnimationFrame(loop)}}
 const ph=n=>{if(opts.onPhase)opts.onPhase(n)};
 function step(dt){const slow=hs>0?(hs-=dt,.04):ramp>0?(ramp-=dt,lerp(.04,1,1-clamp(ramp/.16,0,1))):1,d=dt*slow*user,k=K;
  for(let i=P.length-1;i>=0;i--){const p=P[i];if(p.delay>0){p.delay-=d;continue}p.age+=d;if(p.age>=p.life){P.splice(i,1);continue}if(p.curl){p.vx+=Math.cos(p.age*p.cf+p.cp)*p.curl*d;p.vy+=Math.sin(p.age*p.cf+p.cp)*p.curl*d}p.vy+=p.ay*d;const q=Math.max(0,1-p.drag*d);p.vx*=q;p.vy*=q;p.x+=p.vx*d;p.y+=p.vy*d;p.rot+=p.vr*d}
  for(let i=ts.length-1;i>=0;i--){const m=ts[i];m.t+=d/C.run.dur;const u=clamp(m.t,0,1),w=u*u*(1.8-.8*u),F=m.F,Tt=m.W;let tx=0,ty=0;if(m.track){const T=m.track();if(T){tx=(T.x-m.to.x)*u*u;ty=(T.y-m.to.y)*u*u}}
   const dx=Tt.x+tx-F.x,dy=Tt.y+ty-F.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len,wob=C.run.wobble*k*Math.sin(u*7+m.seed)*(1-u*.6),drop=(1-clamp(u/.1,0,1))*-12*k;
   const px=m.x,py=m.y;m.x=F.x+dx*w+nx*wob;m.y=F.y+dy*w+ny*wob+drop;m.sub=clamp(u/.14,0,1);
   m.ang=Math.atan2(dy,dx)+.1*Math.cos(u*7+m.seed)*(1-u*.6);m.sc=lerp(1,dy<0?1-C.run.perspective:1+C.run.perspective,u);m.age+=d;m.spin+=d*40;
   const L=C.run.size*k*m.sc,dirx=Math.cos(m.ang),diry=Math.sin(m.ang),tailx=m.x-dirx*L*.42,taily=m.y-diry*L*.42,sub=m.sub;m.acc+=Math.hypot(m.x-px,m.y-py);
   while(m.acc>3.2*k&&vis.trail){m.acc-=3.2*k;const side=[1,-1];
    side.forEach(sg=>E({x:tailx,y:taily+3*k,vx:nx*sg*rnd(14,34)*k-dirx*rnd(0,16)*k,vy:ny*sg*rnd(14,34)*k-diry*rnd(0,16)*k,drag:1.2,life:rnd(1.1,1.7),s0:rnd(10,16)*k,s1:rnd(30,48)*k,spr:'soft',blend:'n',a:.5,flat:.45,z:1,layer:'trail',tintc:'#ffffff',ac:[[0,0],[.1,1],[1,0]]}));
    E({x:tailx+rnd(-3,3)*k,y:taily+rnd(-2,4)*k,vx:rnd(-10,10)*k,vy:-rnd(8,28)*k,life:rnd(1,1.7),s0:rnd(5,9)*k,s1:rnd(6,10)*k,spr:'bubble',blend:'n',a:.85,ac:[[0,0],[.1,1],[.8,.8],[1,0]],z:2,layer:'trail',curl:rnd(10,30)*k,cf:rnd(4,9),cp:rnd(0,6)});
    E({x:m.x+dirx*L*.42,y:m.y+diry*L*.42+4*k,vx:nx*rnd(-10,10)*k,vy:ny*rnd(-10,10)*k,life:rnd(.5,.9),s0:rnd(10,16)*k,s1:rnd(22,34)*k,spr:'soft',blend:'n',a:.3,flat:.4,z:1,layer:'trail',tintc:'#ffffff',ac:[[0,0],[.15,1],[1,0]]});
    if(Math.random()<.12)E({x:m.x,y:m.y+5*k,s0:8*k,s1:60*k,life:.9,spr:'ring',blend:'n',a:.5,flat:.34,z:1,layer:'trail',tintc:'#eefbff',ac:[[0,.6],[1,0]]})}
   if(!m.sonar&&u>=C.run.sonarAt){m.sonar=1;m.ping=0;ph(3)}
   if(m.sonar){m.ping-=d;if(m.ping<=0){m.ping=.34;const tp={x:m.to.x,y:m.to.y+C.run.hullDrop*k};E({x:tp.x,y:tp.y,s0:14*k,s1:130*k,life:.85,spr:'ring',a:.8,flat:.36,z:1,layer:'sonar',tintc:'#7fffd8',ac:[[0,0],[.1,1],[1,0]]});E({x:tp.x,y:tp.y,s0:10*k,s1:10*k,life:.34,spr:'soft',a:.9,flat:.5,z:1,layer:'sonar',tintc:'#ff6a5a',ac:[[0,0],[.3,1],[1,0]]})}}
   if(u>=1){ts.splice(i,1);impact(m)}}
  for(let i=pend.length-1;i>=0;i--){pend[i].t-=dt;if(pend[i].t<=0){pend[i].f();pend.splice(i,1)}}}
 function draw(){cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
  for(let z=0;z<=4;z++){for(const p of P){if(p.z!==z||p.delay>0||!vis[p.layer])continue;const t=p.age/p.life;let a=p.a*(p.ac?curve(p.ac,t):1-t);if(a<=.004)continue;const s=lerp(p.s0,p.s1,p.sc?curve(p.sc,t):eo(t));if(s<=.2)continue;
    cx.globalAlpha=Math.min(1,a);cx.globalCompositeOperation=p.blend==='add'?'lighter':'source-over';cx.save();cx.translate(p.x,p.y);
    let img;if(p.pal)img=tint(S[p.spr],p.spr,p.pal[Math.min(p.pal.length-1,Math.floor(t*p.pal.length))]);else if(p.tintc)img=tint(S[p.spr],p.spr,p.tintc);else img=S[p.spr];
    if(p.stretch){const sp=Math.hypot(p.vx,p.vy);cx.rotate(Math.atan2(p.vy,p.vx));const l=Math.max(s,s*(1+sp*p.stretch));cx.drawImage(img,-l,-s*.5,l,s)}
    else{if(p.rot)cx.rotate(p.rot);if(p.flat!==1)cx.scale(1,p.flat);cx.drawImage(img,-s/2,-s*p.asp/2,s,s*p.asp)}cx.restore()}
   if(z===2&&vis.torpedo)ts.forEach(drawTorp)}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over'}
 function drawTorp(m){const k=K,L=C.run.size*k*m.sc,w=L,h=L*64/240,sub=m.sub;cx.globalCompositeOperation='source-over';
  cx.globalAlpha=.18+.12*sub;cx.fillStyle='#04202e';cx.beginPath();cx.ellipse(m.x+L*.05,m.y+L*.16+4*k,L*.45,L*.09,m.ang,0,7);cx.fill();
  cx.save();cx.translate(m.x,m.y);cx.rotate(m.ang);const px=-w*.5,py=-h/2;
  cx.globalAlpha=1-.55*sub;cx.drawImage(S.torp,px,py,w,h);cx.globalAlpha=.85*sub;cx.drawImage(S.torpDeep,px,py,w,h);
  const tx=-w*.5+w*.1;cx.globalCompositeOperation='lighter';cx.globalAlpha=.55;for(let j=0;j<3;j++){const a=m.spin+j*2.09,ry=Math.abs(Math.sin(a))*h*.46+2*k;cx.fillStyle='#dff6ff';cx.beginPath();cx.ellipse(tx-3*k,0,2.4*k,ry,0,0,7);cx.fill()}
  cx.globalAlpha=.4*sub;cx.drawImage(tint(S.soft,'soft','#9ff0ff'),tx-w*.12,-h*.7,w*.24,h*1.4);cx.restore();cx.globalCompositeOperation='source-over';cx.globalAlpha=1}
 function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;step(dt);draw();if(P.length||ts.length||pend.length||hs>0)requestAnimationFrame(loop);else{run=false;cx.clearRect(0,0,W,H)}}
 // ---------- الإطلاق: فقاعات هواء مضغوط وغطسة ورذاذ وحلقة
 function launch(F){const k=K,L=C.launch;E({x:F.x,y:F.y+4*k,s0:16*k,s1:96*k,life:.5,spr:'soft',blend:'n',a:.75,flat:.4,z:1,layer:'launch',tintc:'#ffffff',ac:[[0,0],[.1,1],[1,0]]});
  E({x:F.x,y:F.y+4*k,s0:10*k,s1:150*k,life:.8,spr:'ring',a:.9,flat:.34,z:1,layer:'launch',tintc:'#f4fcff',ac:[[0,.9],[1,0]]});E({x:F.x,y:F.y+4*k,s0:10*k,s1:100*k,life:.7,spr:'ring',a:.7,flat:.34,z:1,layer:'launch',tintc:'#f4fcff',delay:.1,ac:[[0,.8],[1,0]]});
  for(let i=0;i<L.bubbles;i++)E({x:F.x+rnd(-12,12)*k,y:F.y+rnd(-2,8)*k,vx:rnd(-30,30)*k,vy:-rnd(30,110)*k,drag:.8,life:rnd(.8,1.5),s0:rnd(5,11)*k,s1:rnd(7,13)*k,spr:'bubble',blend:'n',a:.9,ac:[[0,0],[.1,1],[.8,.8],[1,0]],z:2,layer:'launch',curl:rnd(20,60)*k,cf:rnd(4,9),cp:rnd(0,6),delay:rnd(0,.1)});
  for(let i=0;i<L.drops;i++){const a=rnd(-2.6,-.55),v=rnd(80,260)*k;E({x:F.x,y:F.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:900*k,life:rnd(.5,.9),s0:rnd(8,13)*k,s1:rnd(6,9)*k,asp:1.5,spr:'drop',blend:'n',a:.95,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'launch'})}
  if(opts.onShake)opts.onShake(L.shake*k,150);if(opts.onRecoil)opts.onRecoil(0);ph(1)}
 // ---------- عمود الماء: صعود ثم انهيار
 function geyser(W_,n,crown,col,fireN){const k=K;
  for(let i=0;i<n;i++){const v=rnd(300,640)*k;E({x:W_.x+rnd(-14,14)*k,y:W_.y,vx:rnd(-60,60)*k,vy:-v,ay:760*k,drag:.35,life:rnd(1,1.7),s0:rnd(30,48)*k,s1:rnd(80,125)*k,spr:'puff',blend:'n',a:.95,ac:[[0,0],[.1,1],[.65,.8],[1,0]],z:2,layer:'smoke',tintc:i%3?'#f4fcff':'#cfe9f5',rot:rnd(0,6.28),vr:rnd(-.5,.5),delay:rnd(0,.1)})}
  for(let i=0;i<crown;i++){const a=rnd(0,6.28),v=rnd(120,300)*k;E({x:W_.x+Math.cos(a)*16*k,y:W_.y+4*k,vx:Math.cos(a)*v,vy:-rnd(60,200)*k+Math.sin(a)*v*.25,ay:700*k,drag:.5,life:rnd(.7,1.2),s0:rnd(18,30)*k,s1:rnd(40,66)*k,spr:'puff',blend:'n',a:.9,ac:[[0,0],[.1,1],[1,0]],z:2,layer:'smoke',tintc:'#ffffff',rot:rnd(0,6.28)})}
  for(let i=0;i<(fireN||0);i++){const a=rnd(0,6.28),v=rnd(10,70)*k;E({x:W_.x+rnd(-10,10)*k,y:W_.y-rnd(0,40)*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6-rnd(60,220)*k,drag:2,life:rnd(.4,.8),s0:rnd(30,46)*k,s1:rnd(64,96)*k,spr:'soft',a:.7,z:3,pal:FIRE,ac:[[0,.2],[.15,1],[1,0]],delay:rnd(0,.05)})}
  for(let i=0;i<4;i++)E({x:W_.x,y:W_.y+3*k,s0:12*k,s1:(190+i*60)*k,life:1.2,spr:'ring',a:1,flat:.32,z:1,layer:'impact',tintc:'#f4fcff',delay:i*.1,ac:[[0,.9],[.6,.4],[1,0]]});
  E({x:W_.x,y:W_.y+4*k,s0:30*k,s1:200*k,life:2.4,spr:'soft',blend:'n',a:.75,flat:.3,z:0,layer:'decal',tintc:'#ffffff',ac:[[0,0],[.12,1],[.7,.8],[1,0]]})}
 // ---------- الإصابة: انفجار تحت الهيكل
 function hit(W_,T){const k=K,H_=C.hit;hs=H_.stop;ramp=.16;if(opts.onHitStop)opts.onHitStop(H_.stop*1000);
  E({x:W_.x,y:W_.y-8*k,s0:30*k,s1:150*k,life:.17,spr:'star',a:1,z:4,tintc:'#fff2c0',ac:[[0,1],[.3,1],[1,0]],rot:-1.57});E({x:W_.x,y:W_.y-8*k,s0:40*k,s1:130*k,life:.2,spr:'core',a:1,z:4,pal:['#ffffff','#fff0a0','#ffb347','#e8601a']});
  [[340,.6,0],[260,.45,.05],[190,.35,.1]].forEach(([s1,l,dl],i)=>E({x:W_.x,y:W_.y,s0:10*k,s1:s1*k,life:l,spr:'ring',a:.9,flat:.36,z:3,tintc:i?'#fff':'#ffe6b0',delay:dl,ac:[[0,.9],[.5,.5],[1,0]]}));
  geyser(W_,H_.geyser,H_.crown,'#fff',H_.fire);
  for(let i=0;i<H_.wood;i++){const a=rnd(-2.9,-.25),v=rnd(160,470)*k;E({x:W_.x,y:W_.y-10*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(80,220)*k,ay:900*k,life:rnd(.9,1.6),s0:rnd(22,42)*k,s1:rnd(18,34)*k,asp:.28,spr:'splinter',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-14,14)})}
  for(let i=0;i<H_.metal;i++){const a=rnd(-2.8,-.3),v=rnd(120,380)*k;E({x:W_.x,y:W_.y-10*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(80,200)*k,ay:900*k,life:rnd(.8,1.3),s0:rnd(8,14)*k,s1:rnd(6,11)*k,spr:'metal',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-18,18)})}
  for(let i=0;i<H_.smoke;i++)E({x:W_.x+rnd(-16,16)*k,y:W_.y-rnd(10,50)*k,vx:rnd(-30,30)*k,vy:-rnd(50,140)*k,drag:.9,life:rnd(1.5,2.4),s0:rnd(34,50)*k,s1:rnd(90,140)*k,spr:'puff',blend:'n',a:.55,ac:[[0,0],[.15,1],[.6,.6],[1,0]],z:1,layer:'smoke',tintc:i%2?'#3c3c42':'#6a6a72',rot:rnd(0,6.28),delay:rnd(.05,.25)});
  for(let i=0;i<H_.bubbles;i++)E({x:W_.x+rnd(-60,60)*k,y:W_.y+rnd(-6,14)*k,vx:rnd(-20,20)*k,vy:-rnd(20,80)*k,life:rnd(1.2,2.2),s0:rnd(5,12)*k,s1:rnd(7,14)*k,spr:'bubble',blend:'n',a:.9,ac:[[0,0],[.1,1],[.8,.8],[1,0]],z:2,layer:'impact',curl:rnd(20,50)*k,cf:rnd(4,9),cp:rnd(0,6),delay:rnd(0,.4)});
  for(let i=0;i<H_.drops;i++){const a=rnd(-2.8,-.34),v=rnd(150,520)*k;E({x:W_.x,y:W_.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:900*k,life:rnd(.8,1.4),s0:rnd(11,17)*k,s1:rnd(8,12)*k,asp:1.5,spr:'drop',blend:'n',a:.95,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris'})}
  // انهيار العمود: مطر قطرات ورذاذ حلقي ثانٍ
  for(let i=0;i<26;i++)E({x:W_.x+rnd(-70,70)*k,y:W_.y-rnd(160,260)*k,vx:rnd(-30,30)*k,vy:rnd(40,160)*k,ay:700*k,life:rnd(.6,1),s0:rnd(9,14)*k,s1:rnd(7,10)*k,asp:1.5,spr:'drop',blend:'n',a:.9,ac:[[0,1],[.85,1],[1,0]],z:2,layer:'debris',delay:.55+rnd(0,.3)});
  E({x:W_.x,y:W_.y+3*k,s0:20*k,s1:230*k,life:1.1,spr:'ring',a:.95,flat:.32,z:1,layer:'impact',tintc:'#ffffff',delay:.6,ac:[[0,.9],[.6,.4],[1,0]]});
  E({x:W_.x,y:W_.y+6*k,s0:24*k,s1:70*k,life:2.2,spr:'soft',blend:'n',a:.5,flat:.5,z:0,layer:'decal',tintc:'#10161c',ac:[[0,0],[.08,1],[.7,.8],[1,0]]});
  if(opts.onShake)opts.onShake(H_.shake*k,H_.shakeMs);if(opts.onZoom)opts.onZoom(H_.zoom,260);if(opts.onFlash)opts.onFlash(H_.flash,220)}
 function miss(W_){const k=K,M=C.miss;E({x:W_.x,y:W_.y,s0:16*k,s1:90*k,life:.16,spr:'core',a:1,z:4,tintc:'#e8f8ff'});geyser(W_,M.geyser,8,'#fff',0);for(let i=0;i<M.drops;i++){const a=rnd(-2.7,-.4),v=rnd(120,420)*k;E({x:W_.x,y:W_.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:900*k,life:rnd(.6,1.1),s0:rnd(10,15)*k,s1:rnd(7,10)*k,asp:1.5,spr:'drop',blend:'n',a:.95,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris'})}if(opts.onShake)opts.onShake(M.shake*k,200)}
 function blocked(W_,col){const k=K,B=C.blocked;col=col||'#7fe3ff';E({x:W_.x,y:W_.y-10*k,s0:30*k,s1:160*k,life:.22,spr:'core',a:1,z:4,tintc:col});E({x:W_.x,y:W_.y,s0:10*k,s1:250*k,life:.55,spr:'ring',a:.95,flat:.4,z:3,tintc:col,ac:[[0,.95],[1,0]]});E({x:W_.x,y:W_.y,s0:10*k,s1:180*k,life:.42,spr:'ring',a:.8,flat:.4,z:3,tintc:'#fff',delay:.06,ac:[[0,.8],[1,0]]});
  for(let i=0;i<B.sparks;i++){const a=-Math.PI/2+rnd(-1.4,1.4),v=rnd(160,460)*k;E({x:W_.x,y:W_.y-10*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:440*k,drag:1.2,life:rnd(.3,.8),s0:rnd(14,26)*k,s1:3*k,spr:'streak',stretch:.012,a:1,z:3,tintc:i%2?'#ffffff':col})}
  for(let i=0;i<14;i++)E({x:W_.x+rnd(-50,50)*k,y:W_.y+rnd(-4,10)*k,vx:rnd(-20,20)*k,vy:-rnd(20,70)*k,life:rnd(1,1.7),s0:rnd(5,10)*k,s1:rnd(6,12)*k,spr:'bubble',blend:'n',a:.85,ac:[[0,0],[.1,1],[.8,.8],[1,0]],z:2,layer:'impact',delay:rnd(0,.3)});
  if(opts.onShake)opts.onShake(B.shake*k,220)}
 function impact(m){ph(4);const o=m.outcome;if(o==='miss')miss(m.W);else if(o==='blocked')blocked(m.W,m.color);else hit(m.W,m.to);if(opts.onImpact)opts.onImpact(o);pend.push({t:.5,f:()=>ph(5)});pend.push({t:.9,f:m.done});kick()}
 // cfg: {from:{x,y} نقطة خروج الطوربيد عند خط الماء, to:{x,y} مركز سفينة الخصم, outcome:'hit'|'miss'|'blocked', shieldColor, track}
 function fire(cfg){return new Promise(res=>{const F=cfg.from,T=cfg.to,k=K,Wp={x:T.x,y:T.y+C.run.hullDrop*k};launch(F);
  ts.push({F,to:T,W:Wp,t:0,x:F.x,y:F.y,ang:Math.atan2(Wp.y-F.y,Wp.x-F.x),sc:1,sub:0,spin:0,age:0,acc:0,seed:rnd(0,6),outcome:cfg.outcome||'hit',color:cfg.shieldColor,track:cfg.track||null,done:res});kick()})}
 function advance(dt){step(dt);draw()}
 return{resize,fire,advance,clear(){P=[];ts=[];pend=[];cx.clearRect(0,0,W,H)},setTimeScale(v){user=v},setLayer(n,v){vis[n]=v},stats(){return{particles:P.length,torpedoes:ts.length}},layers,config:C}}
