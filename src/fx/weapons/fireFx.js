// الجمرة — برميل نار مقذوف: الإطلاق ← القذف والطيران ← علامة السقوط ← الاصطدام (إصابة / إخفاق / صدّ درع) ← ما بعد ← الحرق المستمر على السفينة.
// كل الرسم برمجي (بلا صور). كل الأرقام في FIRE_BARREL تعدّل من الخارج عبر opts.config.
// الجديد عن باقي الأسلحة: الحرق يدوم 3 جولات، فالمحرك يملك واجهة للاشتعال المستمر: ignite / burnTick / extinguish.
export const FIRE_BARREL={
 flight:{dur:1.05,arc:.2,arcMin:62,barrel:46,spin:6.5,perspective:.2,flameRate:60,smokeRate:24,dripRate:16},
 launch:{flame:9,smoke:8,sparks:14,ring:1,shake:2},
 warn:{at:.42},
 hit:{stop:.06,shake:5.5,shakeMs:360,zoom:1.015,flash:.1,blobs:12,tongues:16,smoke:12,staves:12,metal:5,sparks:22,embers:18,decal:1},
 miss:{shake:2,spray:12,drops:20,floating:9,steam:9},
 blocked:{shake:3,tongues:12,sparks:20},
 burn:{rounds:3,width:64,height:30,flameRate:24,smokeRate:7,emberRate:9,glowRate:10,tickShake:1.2,fade:.8}};
const rnd=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),eo=t=>1-Math.pow(1-t,3);
const merge=(a,b)=>{const o=Array.isArray(a)?a.slice():Object.assign({},a);for(const k in b)o[k]=b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])?merge(a[k]||{},b[k]):b[k];return o};
const curve=(c,t)=>{for(let i=1;i<c.length;i++)if(t<=c[i][0]){const a=c[i-1],b=c[i],u=(t-a[0])/(b[0]-a[0]||1);return lerp(a[1],b[1],u)}return c[c.length-1][1]};
const FIRE=['#ffd24a','#ff9a2a','#e8601a','#a8321a','#5a1e10','#2a1008'];
const FLAME=['#fff6c0','#ffc84a','#ff8a2a','#d8451a','#6a1e10'];
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function makeSprites(){const S={};
 const soft=(sz,st)=>{const c=cv(sz,sz),g=c.getContext('2d'),r=g.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);st.forEach(([o,a])=>r.addColorStop(o,'rgba(255,255,255,'+a+')'));g.fillStyle=r;g.fillRect(0,0,sz,sz);return c};
 S.soft=soft(128,[[0,1],[.35,.55],[1,0]]);S.core=soft(128,[[0,1],[.18,1],[.55,.3],[1,0]]);
 S.puff=(()=>{const c=cv(128,128),g=c.getContext('2d');for(let i=0;i<9;i++){const a=i/9*6.28,x=64+Math.cos(a)*18+rnd(-6,6),y=64+Math.sin(a)*18+rnd(-6,6),r=rnd(22,34),q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba(255,255,255,.55)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,128,128)}const q=g.createRadialGradient(64,64,0,64,64,40);q.addColorStop(0,'rgba(255,255,255,.5)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,128,128);return c})();
 S.ring=(()=>{const c=cv(256,256),g=c.getContext('2d'),r=g.createRadialGradient(128,128,70,128,128,126);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.72,'rgba(255,255,255,.15)');r.addColorStop(.9,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,256,256);return c})();
 S.streak=(()=>{const c=cv(128,24),g=c.getContext('2d'),r=g.createLinearGradient(0,0,128,0);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.7,'rgba(255,255,255,.8)');r.addColorStop(1,'rgba(255,255,255,1)');g.fillStyle=r;g.beginPath();g.moveTo(0,12);g.quadraticCurveTo(70,2,128,10);g.lineTo(128,14);g.quadraticCurveTo(70,22,0,12);g.fill();return c})();
 S.star=(()=>{const c=cv(192,192),g=c.getContext('2d');g.translate(96,96);for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4+.2);const l=i%2?58:92,r=g.createLinearGradient(0,0,l,0);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.beginPath();g.moveTo(0,-7);g.lineTo(l,0);g.lineTo(0,7);g.fill();g.restore()}const q=g.createRadialGradient(0,0,0,0,0,40);q.addColorStop(0,'rgba(255,255,255,1)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(-96,-96,192,192);return c})();
 S.splinter=(()=>{const c=cv(64,16),g=c.getContext('2d'),r=g.createLinearGradient(0,0,0,16);r.addColorStop(0,'#a8683a');r.addColorStop(1,'#3a210e');g.fillStyle=r;g.beginPath();g.moveTo(0,8);g.lineTo(52,1);g.lineTo(64,8);g.lineTo(52,15);g.closePath();g.fill();g.strokeStyle='#150a04';g.lineWidth=1.5;g.stroke();g.fillStyle='rgba(255,140,40,.55)';g.fillRect(40,5,18,3);return c})();
 S.metal=(()=>{const c=cv(32,32),g=c.getContext('2d');g.fillStyle='#8b96a6';g.beginPath();g.moveTo(4,10);g.lineTo(20,2);g.lineTo(28,16);g.lineTo(14,28);g.closePath();g.fill();g.strokeStyle='#12161d';g.lineWidth=2;g.stroke();g.fillStyle='rgba(255,255,255,.55)';g.beginPath();g.moveTo(8,10);g.lineTo(18,5);g.lineTo(16,12);g.closePath();g.fill();return c})();
 S.drop=(()=>{const c=cv(32,48),g=c.getContext('2d'),r=g.createLinearGradient(0,0,0,48);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(1,'rgba(190,230,248,.9)');g.fillStyle=r;g.beginPath();g.moveTo(16,2);g.quadraticCurveTo(30,28,16,46);g.quadraticCurveTo(2,28,16,2);g.fill();return c})();
 // لسان لهب (قمته للأعلى، وقاعدته أسفل الصورة): يُلوَّن بالـpal فيمر من الأصفر إلى الأحمر إلى الأسود
 S.tongue=(()=>{const c=cv(64,128),g=c.getContext('2d');const path=()=>{g.beginPath();g.moveTo(32,126);g.bezierCurveTo(-4,108,2,66,22,40);g.bezierCurveTo(28,30,24,16,38,2);g.bezierCurveTo(38,22,50,34,56,58);g.bezierCurveTo(68,92,52,118,32,126);g.closePath()};
  g.lineJoin='round';g.fillStyle='#fff';[[11,.1],[7,.14],[3.5,.2]].forEach(([w,a])=>{g.strokeStyle='rgba(255,255,255,'+a+')';g.lineWidth=w;path();g.stroke()});path();g.fill();
  g.globalCompositeOperation='destination-in';const m=g.createLinearGradient(0,0,0,128);m.addColorStop(0,'rgba(255,255,255,.06)');m.addColorStop(.35,'rgba(255,255,255,.55)');m.addColorStop(.75,'rgba(255,255,255,.95)');m.addColorStop(1,'rgba(255,255,255,.9)');g.fillStyle=m;g.fillRect(0,0,64,128);return c})();
 // برميل خشبي بأطواق حديد وشقوق متوهجة (الطول أفقي)
 S.barrel=(()=>{const c=cv(160,112),g=c.getContext('2d');const yt=x=>22-18*(1-Math.pow((x-80)/58,2)),yb=x=>90+18*(1-Math.pow((x-80)/58,2));
  g.lineJoin='round';const body=()=>{g.beginPath();g.moveTo(22,22);g.quadraticCurveTo(80,-14,138,22);g.lineTo(138,90);g.quadraticCurveTo(80,126,22,90);g.closePath()};
  const w=g.createLinearGradient(0,0,0,112);w.addColorStop(0,'#c58a50');w.addColorStop(.3,'#8f5c30');w.addColorStop(.7,'#5a3519');w.addColorStop(1,'#26150a');body();g.fillStyle=w;g.fill();
  g.save();body();g.clip();for(let x=30;x<=134;x+=11){g.strokeStyle='rgba(15,7,2,.5)';g.lineWidth=2;g.beginPath();g.moveTo(x,0);g.quadraticCurveTo(x+(x-80)*.08,56,x,112);g.stroke();g.strokeStyle='rgba(255,130,30,.32)';g.lineWidth=1.4;g.beginPath();g.moveTo(x+4,10);g.quadraticCurveTo(x+4+(x-80)*.08,56,x+4,104);g.stroke()}
  const ch=g.createLinearGradient(22,0,138,0);ch.addColorStop(0,'rgba(10,4,0,.0)');ch.addColorStop(1,'rgba(10,4,0,.55)');g.fillStyle=ch;g.fillRect(0,0,160,112);
  const hl=g.createLinearGradient(0,6,0,40);hl.addColorStop(0,'rgba(255,230,180,.6)');hl.addColorStop(1,'rgba(255,230,180,0)');g.fillStyle=hl;g.fillRect(22,0,116,40);g.restore();
  g.strokeStyle='#150a04';g.lineWidth=3;body();g.stroke();
  [34,80,126].forEach(x=>{const bw=9,s=g.createLinearGradient(0,0,0,112);s.addColorStop(0,'#aab4c2');s.addColorStop(.4,'#5b6575');s.addColorStop(1,'#1a1f27');g.fillStyle=s;g.beginPath();g.moveTo(x-bw/2,yt(x-bw/2));g.lineTo(x+bw/2,yt(x+bw/2));g.lineTo(x+bw/2,yb(x+bw/2));g.lineTo(x-bw/2,yb(x-bw/2));g.closePath();g.fill();g.strokeStyle='#0c0f14';g.lineWidth=2;g.stroke()});
  g.fillStyle='#4a2c14';g.beginPath();g.ellipse(22,56,9,35,0,0,7);g.fill();g.strokeStyle='#150a04';g.lineWidth=2.4;g.stroke();g.fillStyle='#b66a2a';g.beginPath();g.ellipse(22,56,4,22,0,0,7);g.fill();
  g.fillStyle='#1a0d05';g.beginPath();g.arc(88,16,5,0,7);g.fill();g.strokeStyle='#ffb04a';g.lineWidth=1.6;g.stroke();return c})();
 return S}
const tintCache=new Map();
function tint(src,key,color){const k=key+color;let c=tintCache.get(k);if(!c){c=cv(src.width,src.height);const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,c.width,c.height);tintCache.set(k,c)}return c}
export function createFireFx(root,opts){opts=opts||{};const C=merge(FIRE_BARREL,opts.config||{}),canvas=document.createElement('canvas'),cx=canvas.getContext('2d');
 Object.assign(canvas.style,{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none'});root.append(canvas);
 let W=450,H=500,dpr=1,K=opts.scale||1,P=[],bs=[],auras=new Map(),user=1,hs=0,ramp=0,run=false,last=0,pend=[];const S=makeSprites(),vis={};
 const layers=['launch','trail','barrel','warn','impact','debris','smoke','decal','burn'];layers.forEach(l=>vis[l]=true);
 const ph=n=>{if(opts.onPhase)opts.onPhase(n)};
 function resize(w,h,d){W=w;H=h;dpr=d||1;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);K=opts.scale||w/450}
 function E(o){const p=Object.assign({x:0,y:0,vx:0,vy:0,ay:0,drag:0,age:0,life:1,s0:10,s1:10,rot:0,vr:0,spr:'soft',blend:'add',a:1,ac:null,pal:null,stretch:0,flat:1,z:3,layer:'impact',delay:0,tintc:null,sc:null,asp:1,curl:0,cf:6,cp:0,anchor:false},o);P.push(p);kick();return p}
 function kick(){if(!run&&!opts.manual){run=true;last=performance.now();requestAnimationFrame(loop)}}
 // لسان لهب مثبّت القاعدة: يكبر ثم يخبو وهو يتمايل
 const HOT=['#ffffff','#fff3b0','#ffd24a','#ff9a2a'];
 const tongue=(x,y,size,life,o)=>{const q=Object.assign({x,y,vx:rnd(-12,12)*K,vy:-rnd(30,80)*K,drag:.6,life,s0:2*K,s1:size,spr:'tongue',asp:2,anchor:true,a:.9,ac:[[0,0],[.12,1],[.6,.65],[1,0]],sc:[[0,.35],[.3,1],[1,.22]],pal:FLAME,z:3,layer:'impact',rot:rnd(-.22,.22),curl:rnd(20,60)*K,cf:rnd(5,9),cp:rnd(0,6.28)},o||{});
  E(q);return E(Object.assign({},q,{s0:q.s0*.5,s1:q.s1*.52,pal:HOT,life:q.life*.82,a:1,delay:(q.delay||0)+.01}))};
 const smoke=(x,y,s0,s1,life,o)=>E(Object.assign({x,y,vy:-rnd(30,70)*K,vx:rnd(-20,20)*K,drag:1,life,s0,s1,spr:'puff',blend:'n',a:.5,ac:[[0,0],[.12,1],[.6,.6],[1,0]],z:1,layer:'smoke',tintc:Math.random()<.6?'#2a2a30':'#4c4c54',rot:rnd(0,6.28),vr:rnd(-.6,.6)},o||{}));
 function step(dt){const slow=hs>0?(hs-=dt,.04):ramp>0?(ramp-=dt,lerp(.04,1,1-clamp(ramp/.14,0,1))):1,d=dt*slow*user,k=K;
  for(let i=P.length-1;i>=0;i--){const p=P[i];if(p.delay>0){p.delay-=d;continue}p.age+=d;if(p.age>=p.life){P.splice(i,1);continue}if(p.curl){p.vx+=Math.cos(p.age*p.cf+p.cp)*p.curl*d}p.vy+=p.ay*d;const q=Math.max(0,1-p.drag*d);p.vx*=q;p.vy*=q;p.x+=p.vx*d;p.y+=p.vy*d;p.rot+=p.vr*d}
  for(let i=bs.length-1;i>=0;i--){const b=bs[i];b.t+=d/C.flight.dur;const u=clamp(b.t,0,1),e=u*(1.06-.06*u),dx=b.to.x-b.from.x,dy=b.to.y-b.from.y,h=Math.max(C.flight.arcMin*k,C.flight.arc*b.dist);
   b.gx=b.from.x+dx*e;b.gy=b.from.y+dy*e;b.x=b.gx;b.y=b.gy-4*h*u*(1-u);b.rot+=C.flight.spin*d*(1+.5*u);b.persp=lerp(1,dy<0?1-C.flight.perspective:1+C.flight.perspective,u)*(1+.22*Math.sin(Math.PI*u));
   b.hist.unshift({x:b.x,y:b.y});if(b.hist.length>26)b.hist.pop();
   const vxp=b.x-(b.px===undefined?b.x:b.px),vyp=b.y-(b.py===undefined?b.y:b.py);b.px=b.x;b.py=b.y;const sp=Math.hypot(vxp,vyp)/Math.max(d,1e-4),ux=sp?vxp/Math.hypot(vxp,vyp):0,uy=sp?vyp/Math.hypot(vxp,vyp):0;
   const r=C.flight.barrel*k*b.persp*.5;b.af+=d*C.flight.flameRate;b.as+=d*C.flight.smokeRate;b.ad+=d*C.flight.dripRate;
   while(b.af>=1&&vis.trail){b.af--;tongue(b.x-ux*r*.4+rnd(-r,r)*.5,b.y-uy*r*.4+rnd(-r*.3,r*.5),rnd(22,40)*k*b.persp,rnd(.28,.5),{layer:'trail',vx:-ux*rnd(30,110)*k+rnd(-20,20)*k,vy:-uy*rnd(30,110)*k-rnd(40,110)*k,anchor:true,asp:2.3,rot:Math.atan2(-uy,-ux)+Math.PI/2+rnd(-.3,.3),curl:0,ac:[[0,0],[.1,1],[1,0]]})}
   while(b.as>=1&&vis.trail){b.as--;smoke(b.x-ux*r,b.y-uy*r-4*k,rnd(10,16)*k,rnd(36,60)*k,rnd(.9,1.5),{layer:'trail',a:.55,vx:-ux*rnd(10,40)*k+rnd(-18,18)*k,vy:-rnd(14,50)*k,curl:rnd(30,70)*k,cf:rnd(4,7)})}
   while(b.ad>=1&&vis.trail){b.ad--;E({x:b.x+rnd(-r,r)*.7,y:b.y+r*.4,vx:rnd(-25,25)*k,vy:rnd(0,40)*k,ay:520*k,drag:.3,life:rnd(.4,.8),s0:rnd(8,13)*k,s1:rnd(3,5)*k,spr:'soft',a:1,z:3,layer:'trail',pal:FIRE,ac:[[0,.2],[.1,1],[.8,.7],[1,0]]})}
   if(!b.warned&&u>=C.warn.at){b.warned=1;warn(b);ph(3)}
   if(b.t>=1){bs.splice(i,1);impact(b)}}
  // الحرق المستمر على السفن
  auras.forEach((a,key)=>{const T=a.track?a.track():a.pos;if(T)a.pos=T;if(a.delay>0){a.delay-=d;return}a.age+=d;let I=clamp(a.age/.5,0,1);if(a.ending){a.endT+=d;I*=clamp(1-a.endT/a.fade,0,1);if(a.endT>=a.fade){auras.delete(key);return}}
   a.pulse=Math.max(0,a.pulse-d*2.2);I=Math.min(1.6,I*(1+a.pulse*.8));const B=C.burn,pos=a.pos,wd=B.width*k,ht=B.height*k;if(!pos)return;
   a.af+=d*B.flameRate*I;a.as+=d*B.smokeRate*I;a.ae+=d*B.emberRate*I;a.ag+=d*B.glowRate;
   while(a.af>=1){a.af--;tongue(pos.x+rnd(-.5,.5)*wd,pos.y+rnd(-.35,.4)*ht,rnd(24,44)*k*(.7+.5*I),rnd(.45,.85),{layer:'burn'})}
   while(a.as>=1){a.as--;smoke(pos.x+rnd(-.4,.4)*wd,pos.y-ht*.4,rnd(12,18)*k,rnd(40,70)*k,rnd(1.1,1.8),{layer:'burn',a:.42,vy:-rnd(34,70)*k})}
   while(a.ae>=1){a.ae--;E({x:pos.x+rnd(-.5,.5)*wd,y:pos.y-ht*.2,vx:rnd(-30,30)*k,vy:-rnd(50,120)*k,ay:-20*k,drag:.5,life:rnd(.9,1.6),s0:rnd(4,8)*k,s1:rnd(1.5,3)*k,spr:'soft',a:1,z:3,layer:'burn',curl:rnd(30,70)*k,cf:rnd(4,9),cp:rnd(0,6.28),pal:['#ffe27a','#ff9a2a','#e8601a','#6a2a10'],ac:[[0,0],[.1,1],[.6,.7],[1,0]]})}
   while(a.ag>=1){a.ag--;E({x:pos.x+rnd(-.2,.2)*wd,y:pos.y-ht*.1,s0:70*k*(.8+.4*I),s1:100*k*(.8+.4*I),life:.32,spr:'core',a:.2*I,z:3,layer:'burn',tintc:'#ff7a1a',ac:[[0,0],[.3,1],[1,0]]})}});
  for(let i=pend.length-1;i>=0;i--){pend[i].t-=dt;if(pend[i].t<=0){pend[i].f();pend.splice(i,1)}}}
 function draw(){cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
  for(let z=0;z<=4;z++){for(const p of P){if(p.z!==z||p.delay>0||!vis[p.layer])continue;const t=p.age/p.life;let a=p.a*(p.ac?curve(p.ac,t):1-t);if(a<=.004)continue;const s=lerp(p.s0,p.s1,p.sc?curve(p.sc,t):eo(t));if(s<=.2)continue;
    cx.globalAlpha=Math.min(1,a);cx.globalCompositeOperation=p.blend==='add'?'lighter':'source-over';cx.save();cx.translate(p.x,p.y);
    let img;if(p.pal)img=tint(S[p.spr],p.spr,p.pal[Math.min(p.pal.length-1,Math.floor(t*p.pal.length))]);else if(p.tintc)img=tint(S[p.spr],p.spr,p.tintc);else img=S[p.spr];
    if(p.stretch){const sp=Math.hypot(p.vx,p.vy);cx.rotate(Math.atan2(p.vy,p.vx));const l=Math.max(s,s*(1+sp*p.stretch));cx.drawImage(img,-l,-s*.5,l,s)}
    else{if(p.rot)cx.rotate(p.rot);if(p.flat!==1)cx.scale(1,p.flat);cx.drawImage(img,-s/2,p.anchor?-s*p.asp*.94:-s*p.asp/2,s,s*p.asp)}cx.restore()}
   if(z===2&&vis.barrel)bs.forEach(drawBarrel)}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over'}
 function drawBarrel(b){const w=C.flight.barrel*K*b.persp,h=w*.7,fl=.85+.15*Math.sin(b.t*60),n=b.hist.length;cx.globalCompositeOperation='source-over';
  cx.globalAlpha=.2;cx.fillStyle='#000';cx.beginPath();cx.ellipse(b.gx+w*.2,b.gy+w*.9+8*K,w*.55*(1-.25*Math.sin(Math.PI*b.t)),w*.16,0,0,7);cx.fill();
  cx.globalAlpha=1;cx.save();cx.translate(b.x,b.y);cx.rotate(b.rot);cx.drawImage(S.barrel,-w/2,-h/2,w,h);cx.restore();
  cx.globalCompositeOperation='lighter';cx.globalAlpha=.55*fl;const gs=w*2.1,g=tint(S.core,'core','#ff8a2a');cx.drawImage(g,b.x-gs/2,b.y-gs/2,gs,gs);cx.globalAlpha=.7*fl;const g2=tint(S.core,'core','#ffe9a0'),s2=w*.9;cx.drawImage(g2,b.x-s2/2,b.y-s2/2,s2,s2);cx.globalCompositeOperation='source-over';cx.globalAlpha=1}
 // ---------- 1) الإطلاق: لهب عمودي ودخان وشرر من سطح سفينة المهاجم
 function launch(F,ang){const k=K,L=C.launch,dx=Math.cos(ang),dy=Math.sin(ang);
  E({x:F.x,y:F.y,s0:16*k,s1:96*k,life:.12,spr:'star',a:1,z:4,layer:'launch',tintc:'#ffd890',rot:ang,ac:[[0,1],[.4,1],[1,0]]});
  E({x:F.x,y:F.y,s0:14*k,s1:56*k,life:.14,spr:'core',a:1,z:4,layer:'launch',pal:['#ffffff','#ffd86a','#ff8a2a']});
  for(let i=0;i<L.flame;i++)tongue(F.x+rnd(-8,8)*k,F.y+rnd(-2,5)*k,rnd(28,52)*k,rnd(.25,.45),{layer:'launch',vx:dx*rnd(20,90)*k+rnd(-30,30)*k,vy:-rnd(60,140)*k,delay:rnd(0,.05)});
  for(let i=0;i<L.sparks;i++){const a=-Math.PI/2+rnd(-.9,.9),v=rnd(140,380)*k;E({x:F.x,y:F.y,vx:Math.cos(a)*v+dx*60*k,vy:Math.sin(a)*v,ay:300*k,drag:2.6,life:rnd(.3,.7),s0:rnd(10,18)*k,s1:2*k,spr:'streak',stretch:.01,a:1,z:3,layer:'launch',pal:['#fff6c8','#ffc24a','#ff7a1a']})}
  for(let i=0;i<L.smoke;i++)smoke(F.x+rnd(-8,8)*k,F.y-4*k,rnd(12,18)*k,rnd(46,70)*k,rnd(.9,1.5),{layer:'launch',vx:rnd(-40,40)*k+dx*20*k,vy:-rnd(30,90)*k,delay:rnd(0,.06)});
  if(L.ring)E({x:F.x,y:F.y+4*k,s0:10*k,s1:90*k,life:.25,spr:'ring',a:.6,flat:.4,z:3,layer:'launch',tintc:'#ffc880'});
  if(opts.onShake)opts.onShake(L.shake*k,150)}
 // ---------- 3) علامة السقوط: حلقتان برتقاليتان تضيقان وجمرة تنبض على الهدف
 function warn(b){const k=K,T=b.to,life=(1-b.t)*C.flight.dur+.04;
  E({x:T.x,y:T.y+6*k,s0:150*k,s1:34*k,life,spr:'ring',a:.85,flat:.42,z:1,layer:'warn',tintc:'#ff8a2a',ac:[[0,0],[.15,1],[.85,1],[1,0]],sc:[[0,0],[1,1]]});
  E({x:T.x,y:T.y+6*k,s0:96*k,s1:20*k,life,spr:'ring',a:.9,flat:.42,z:1,layer:'warn',tintc:'#ffd24a',ac:[[0,0],[.2,1],[.9,1],[1,0]],sc:[[0,0],[1,1]]});
  E({x:T.x,y:T.y+4*k,s0:20*k,s1:60*k,life,spr:'core',a:.55,flat:.5,z:1,layer:'warn',tintc:'#ff6a1a',ac:[[0,0],[.3,.5],[.5,1],[.7,.4],[.9,1],[1,0]]})}
 // ---------- 4أ) الإصابة: انفجار البرميل وتناثر الزيت المشتعل
 function hit(T,ang,b){const k=K,H_=C.hit;hs=H_.stop;ramp=.14;if(opts.onHitStop)opts.onHitStop(H_.stop*1000);
  E({x:T.x,y:T.y,s0:20*k,s1:110*k,life:.14,spr:'star',a:1,z:4,rot:ang,tintc:'#fff0c0',ac:[[0,1],[.3,1],[1,0]]});
  E({x:T.x,y:T.y,s0:30*k,s1:92*k,life:.2,spr:'core',a:1,z:4,pal:['#ffffff','#fff0a0','#ffb347','#e8601a']});
  E({x:T.x,y:T.y+4*k,s0:10*k,s1:170*k,life:.45,spr:'ring',a:.7,flat:.4,z:3,tintc:'#ffb860',ac:[[0,.8],[1,0]]});
  for(let i=0;i<H_.blobs;i++){const a=rnd(0,6.28),v=rnd(40,210)*k;E({x:T.x+rnd(-8,8)*k,y:T.y+rnd(-5,5)*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v*.6-rnd(30,110)*k,ay:260*k,drag:2,life:rnd(.5,1),s0:rnd(26,44)*k,s1:rnd(54,92)*k,spr:'soft',a:.75,z:3,pal:FIRE,ac:[[0,.2],[.15,1],[1,0]],delay:rnd(0,.05)})}
  for(let i=0;i<H_.tongues;i++){const sx=rnd(-1,1);tongue(T.x+sx*40*k,T.y+rnd(-6,8)*k,rnd(44,92)*k*(1-Math.abs(sx)*.35),rnd(.9,1.7),{layer:'impact',vy:-rnd(40,110)*k,delay:rnd(0,.22),vx:sx*rnd(10,40)*k})}
  for(let i=0;i<H_.smoke;i++)smoke(T.x+rnd(-18,18)*k,T.y+rnd(-8,6)*k,rnd(30,46)*k,rnd(90,150)*k,rnd(1.6,2.6),{vx:rnd(-40,40)*k,vy:-rnd(40,100)*k,a:.7,delay:rnd(.05,.3),drag:.9});
  for(let i=0;i<H_.staves;i++){const a=ang+rnd(-1.7,1.7),v=rnd(110,400)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(120,300)*k,ay:900*k,life:rnd(.7,1.3),s0:rnd(22,40)*k,s1:rnd(18,32)*k,asp:.28,spr:'splinter',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-14,14)})}
  for(let i=0;i<H_.metal;i++){const a=rnd(0,6.28),v=rnd(100,320)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(100,220)*k,ay:900*k,life:rnd(.6,1.1),s0:rnd(8,14)*k,s1:rnd(6,11)*k,spr:'metal',blend:'n',a:1,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-18,18)})}
  for(let i=0;i<H_.sparks;i++){const a=rnd(0,6.28),v=rnd(160,520)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(40,200)*k,ay:520*k,drag:1.6,life:rnd(.3,.8),s0:rnd(10,20)*k,s1:2*k,spr:'streak',stretch:.007,a:1,z:3,pal:['#ffffff','#ffd86a','#ff8a2a','#e8601a']})}
  for(let i=0;i<H_.embers;i++){const a=rnd(0,6.28),v=rnd(30,150)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(80,200)*k,ay:-30*k,drag:1,life:rnd(1.1,2),s0:rnd(5,9)*k,s1:rnd(1.5,3)*k,spr:'soft',a:1,z:3,curl:rnd(30,80)*k,cf:rnd(4,9),cp:rnd(0,6.28),pal:['#ffe27a','#ff9a2a','#e8601a','#6a2a10'],ac:[[0,0],[.1,1],[.6,.8],[1,0]],delay:rnd(.05,.4)})}
  if(H_.decal){E({x:T.x,y:T.y+8*k,s0:34*k,s1:84*k,life:2.6,spr:'soft',blend:'n',a:.6,flat:.5,z:0,layer:'decal',tintc:'#120c08',ac:[[0,0],[.08,1],[.7,.8],[1,0]]});E({x:T.x,y:T.y+8*k,s0:30*k,s1:70*k,life:2.2,spr:'soft',a:.5,flat:.5,z:0,layer:'decal',tintc:'#ff5a14',ac:[[0,0],[.1,1],[.6,.5],[1,0]]})}
  if(opts.onShake)opts.onShake(H_.shake*k,H_.shakeMs);if(opts.onZoom)opts.onZoom(H_.zoom,320);if(opts.onFlash)opts.onFlash(H_.flash,220);ph(4);pend.push({t:.9,f:()=>ph(5)})}
 // ---------- 4ب) الإخفاق: البرميل يسقط في الماء ويطفو مشتعلًا لحظات ثم يُطفأ
 function miss(T){const k=K,M=C.miss;E({x:T.x,y:T.y,s0:20*k,s1:120*k,life:.16,spr:'core',a:1,z:4,pal:['#fff6d0','#ffd890','#ffb060']});
  for(let i=0;i<M.spray;i++){const v=rnd(240,480)*k;E({x:T.x+rnd(-8,8)*k,y:T.y,vx:rnd(-60,60)*k,vy:-v,ay:900*k,drag:.3,life:rnd(.7,1.1),s0:rnd(16,28)*k,s1:rnd(40,70)*k,spr:'puff',blend:'n',a:1,ac:[[0,0],[.1,1],[.7,.7],[1,0]],z:2,layer:'smoke',tintc:'#f0fbff',rot:rnd(0,6.28),delay:rnd(0,.06)})}
  for(let i=0;i<M.drops;i++){const a=rnd(-2.7,-.4),v=rnd(120,400)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:900*k,life:rnd(.6,1.1),s0:rnd(10,16)*k,s1:rnd(7,11)*k,asp:1.5,spr:'drop',blend:'n',a:.95,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris'})}
  for(let i=0;i<3;i++)E({x:T.x,y:T.y+3*k,s0:12*k,s1:(160+i*46)*k,life:1.05,spr:'ring',a:1,flat:.32,z:1,layer:'impact',tintc:'#f4fcff',delay:i*.1,ac:[[0,.9],[.6,.4],[1,0]]});
  for(let i=0;i<M.floating;i++){const sx=rnd(-1,1);tongue(T.x+sx*46*k,T.y+rnd(-2,5)*k,rnd(26,52)*k*(1-Math.abs(sx)*.4),rnd(.9,1.8),{layer:'impact',vy:-rnd(20,50)*k,vx:sx*rnd(8,22)*k,delay:rnd(.08,.5)})}
  E({x:T.x,y:T.y+4*k,s0:40*k,s1:110*k,life:1.9,spr:'soft',a:.45,flat:.3,z:0,layer:'decal',tintc:'#ff7a1a',ac:[[0,0],[.15,1],[.7,.6],[1,0]]});
  for(let i=0;i<M.steam;i++)smoke(T.x+rnd(-40,40)*k,T.y-4*k,rnd(20,30)*k,rnd(70,110)*k,rnd(1.2,2),{tintc:'#e6eef3',a:.5,vy:-rnd(30,70)*k,delay:rnd(.3,1.1)});
  if(opts.onShake)opts.onShake(M.shake*k,200);ph(4);pend.push({t:.9,f:()=>ph(5)})}
 // ---------- 4ج) صدّ الدرع: اللهب ينتشر على سطح القبة بلون الدرع ثم يخبو
 function blocked(T,ang,col){const k=K,B=C.blocked;col=col||'#7fe3ff';E({x:T.x,y:T.y,s0:30*k,s1:150*k,life:.2,spr:'core',a:1,z:4,tintc:col});E({x:T.x,y:T.y,s0:10*k,s1:210*k,life:.5,spr:'ring',a:.9,flat:.7,z:3,tintc:col,ac:[[0,.95],[1,0]]});
  E({x:T.x,y:T.y,s0:20*k,s1:90*k,life:.3,spr:'core',a:.8,z:3,pal:['#ffffff','#ffd890','#ff8a2a']});
  for(let i=0;i<B.tongues;i++){const a=rnd(-Math.PI,0),r=rnd(18,50)*k;tongue(T.x+Math.cos(a)*r,T.y+Math.sin(a)*r*.8,rnd(26,50)*k,rnd(.5,.9),{layer:'impact',vy:-rnd(20,60)*k,vx:Math.cos(a)*rnd(20,60)*k,delay:rnd(0,.15),pal:['#ffffff',col,'#ff8a2a','#6a1e10']})}
  for(let i=0;i<B.sparks;i++){const a=ang+Math.PI+rnd(-1.2,1.2),v=rnd(160,460)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(0,120)*k,ay:420*k,drag:1.2,life:rnd(.3,.7),s0:rnd(16,26)*k,s1:3*k,spr:'streak',stretch:.012,a:1,z:3,tintc:i%2?'#ffffff':col})}
  if(opts.onShake)opts.onShake(B.shake*k,220);ph(4);pend.push({t:.7,f:()=>ph(5)})}
 function impact(b){const out=b.outcome,ang=Math.atan2(b.to.y-b.from.y,b.to.x-b.from.x);if(out==='miss')miss(b.to);else if(out==='blocked')blocked(b.to,ang,b.color);else{hit(b.to,ang,b);if(b.burn)ignite(b.burn.key,{track:b.burn.track,rounds:b.burn.rounds,delay:.3,pos:b.to})}
  if(opts.onImpact)opts.onImpact(out);pend.push({t:.7,f:b.done});kick()}
 // ---------- الحرق المستمر (3 جولات): اشتعال ← نبضة عند كل جولة ← إطفاء
 function ignite(key,o){o=o||{};const a=auras.get(key),R=o.rounds||C.burn.rounds;if(a){a.rounds=R;a.ending=false;a.endT=0;a.pulse=1;if(o.track)a.track=o.track;return R}
  auras.set(key,{track:o.track||null,pos:o.pos||null,rounds:R,age:0,delay:o.delay||0,pulse:0,af:0,as:0,ae:0,ag:0,ending:false,endT:0,fade:C.burn.fade});kick();return R}
 // يُستدعى مع حدث burn من duel.js: يعيد عدد الجولات المتبقية. عند الصفر يُطفأ الحريق تلقائيًا بعد النبضة.
 function burnTick(key,o){let a=auras.get(key);if(!a&&o&&o.track){ignite(key,{track:o.track,rounds:1});a=auras.get(key)}if(!a)return 0;const k=K,T=a.track?a.track():a.pos;a.pulse=1;a.rounds=Math.max(0,a.rounds-1);
  if(T){E({x:T.x,y:T.y,s0:30*k,s1:130*k,life:.28,spr:'core',a:.9,z:4,layer:'burn',pal:['#ffffff','#ffd24a','#ff7a1a']});for(let i=0;i<7;i++)tongue(T.x+rnd(-.5,.5)*C.burn.width*k,T.y+rnd(-4,8)*k,rnd(50,84)*k,rnd(.6,1),{layer:'burn',vy:-rnd(70,140)*k,delay:rnd(0,.1)});
   for(let i=0;i<8;i++){const an=rnd(-2.6,-.5),v=rnd(120,300)*k;E({x:T.x,y:T.y,vx:Math.cos(an)*v,vy:Math.sin(an)*v,ay:500*k,drag:1.4,life:rnd(.3,.7),s0:rnd(10,18)*k,s1:2*k,spr:'streak',stretch:.008,a:1,z:3,layer:'burn',pal:['#fff6c8','#ffc24a','#ff7a1a']})}}
  if(opts.onShake)opts.onShake(C.burn.tickShake*k,180);if(a.rounds<=0)pend.push({t:.9,f:()=>extinguish(key,'end')});kick();return a.rounds}
 // mode: 'end' انتهاء الحرق (بخار ودخان) | 'dead' السفينة دُمّرت (يخبو بسرعة لأن اللعبة تعرض انفجارها)
 function extinguish(key,mode){const a=auras.get(key);if(!a||a.ending)return;a.ending=true;a.endT=0;a.fade=mode==='dead'?.25:C.burn.fade;const T=a.track?a.track():a.pos,k=K;
  if(T&&mode!=='dead')for(let i=0;i<8;i++)smoke(T.x+rnd(-.5,.5)*C.burn.width*k,T.y-6*k,rnd(20,30)*k,rnd(60,100)*k,rnd(1,1.6),{layer:'burn',tintc:'#dfe7ec',a:.4,vy:-rnd(30,60)*k,delay:rnd(0,.3)})}
 function fire(cfg){return new Promise(res=>{const F=cfg.from,T=cfg.to,ang=Math.atan2(T.y-F.y,T.x-F.x);ph(1);launch(F,ang);if(opts.onRecoil)opts.onRecoil(ang);
  bs.push({from:F,to:T,t:0,x:F.x,y:F.y,gx:F.x,gy:F.y,dist:Math.hypot(T.x-F.x,T.y-F.y),rot:rnd(0,6),persp:1,hist:[],af:0,as:0,ad:0,outcome:cfg.outcome||'hit',color:cfg.shieldColor,burn:cfg.burn||null,done:res});ph(2);kick()})}
 function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;step(dt);draw();if(P.length||bs.length||pend.length||hs>0||auras.size)requestAnimationFrame(loop);else{run=false;cx.clearRect(0,0,W,H)}}
 function advance(dt){step(dt);draw()}
 return{resize,fire,advance,ignite,burnTick,extinguish,clear(){P=[];bs=[];pend=[];auras.clear();cx.clearRect(0,0,W,H)},setTimeScale(v){user=v},setLayer(n,v){vis[n]=v},burning(){return[...auras.keys()]},stats(){return{particles:P.length,barrels:bs.length,fires:auras.size}},layers,config:C}}
