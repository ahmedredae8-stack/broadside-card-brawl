// الصقيع — قذيفة جليد: الإطلاق ← الطيران ← علامة السقوط ← الاصطدام (إصابة / إخفاق / صدّ درع) ← ما بعد ← التجميد المستمر على السفينة.
// كل الرسم برمجي (بلا صور). كل الأرقام في FROST_SHELL تعدّل من الخارج عبر opts.config.
// واجهة التجميد: freeze (يغلّف السفينة بالجليد) / shatter (تحطيمه عند ضربة حركية ×2) / thaw (ذوبانه) / shiver (ارتجاف عند محاولة التحرك).
export const FROST_SHELL={
 flight:{dur:.85,arc:.1,shell:34,spin:8,perspective:.2,mistRate:34,sparkleRate:34},
 launch:{mist:8,sparkles:16,flakes:6,ring:1,shake:1.6},
 warn:{at:.45},
 hit:{stop:.05,shake:3.5,shakeMs:300,zoom:1.01,flash:.1,spikes:9,shards:16,flakes:14,mist:9,sparkles:22,patch:1},
 miss:{shake:1.6,spray:8,drops:12,shards:10,spikes:5},
 blocked:{shake:2.6,spikes:9,sparkles:20},
 ice:{width:74,height:42,crystals:15,mistRate:6,sparkleRate:9,grow:.6,fade:1,shatterShards:2}};
const rnd=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),eo=t=>1-Math.pow(1-t,3);
const merge=(a,b)=>{const o=Array.isArray(a)?a.slice():Object.assign({},a);for(const k in b)o[k]=b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])?merge(a[k]||{},b[k]):b[k];return o};
const curve=(c,t)=>{for(let i=1;i<c.length;i++)if(t<=c[i][0]){const a=c[i-1],b=c[i],u=(t-a[0])/(b[0]-a[0]||1);return lerp(a[1],b[1],u)}return c[c.length-1][1]};
const ICE=['#ffffff','#d6f4ff','#9fdcff','#5fb4ee'];
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function makeSprites(){const S={};
 const soft=(sz,st)=>{const c=cv(sz,sz),g=c.getContext('2d'),r=g.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);st.forEach(([o,a])=>r.addColorStop(o,'rgba(255,255,255,'+a+')'));g.fillStyle=r;g.fillRect(0,0,sz,sz);return c};
 S.soft=soft(128,[[0,1],[.35,.55],[1,0]]);S.core=soft(128,[[0,1],[.18,1],[.55,.3],[1,0]]);
 S.puff=(()=>{const c=cv(128,128),g=c.getContext('2d');for(let i=0;i<9;i++){const a=i/9*6.28,x=64+Math.cos(a)*18+rnd(-6,6),y=64+Math.sin(a)*18+rnd(-6,6),r=rnd(22,34),q=g.createRadialGradient(x,y,0,x,y,r);q.addColorStop(0,'rgba(255,255,255,.55)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,128,128)}const q=g.createRadialGradient(64,64,0,64,64,40);q.addColorStop(0,'rgba(255,255,255,.5)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(0,0,128,128);return c})();
 S.ring=(()=>{const c=cv(256,256),g=c.getContext('2d'),r=g.createRadialGradient(128,128,70,128,128,126);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.72,'rgba(255,255,255,.15)');r.addColorStop(.9,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,256,256);return c})();
 S.streak=(()=>{const c=cv(128,24),g=c.getContext('2d'),r=g.createLinearGradient(0,0,128,0);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.7,'rgba(255,255,255,.8)');r.addColorStop(1,'rgba(255,255,255,1)');g.fillStyle=r;g.beginPath();g.moveTo(0,12);g.quadraticCurveTo(70,2,128,10);g.lineTo(128,14);g.quadraticCurveTo(70,22,0,12);g.fill();return c})();
 S.star=(()=>{const c=cv(192,192),g=c.getContext('2d');g.translate(96,96);for(let i=0;i<8;i++){g.save();g.rotate(i*Math.PI/4+.2);const l=i%2?58:92,r=g.createLinearGradient(0,0,l,0);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.beginPath();g.moveTo(0,-7);g.lineTo(l,0);g.lineTo(0,7);g.fill();g.restore()}const q=g.createRadialGradient(0,0,0,0,0,40);q.addColorStop(0,'rgba(255,255,255,1)');q.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=q;g.fillRect(-96,-96,192,192);return c})();
 S.drop=(()=>{const c=cv(32,48),g=c.getContext('2d'),r=g.createLinearGradient(0,0,0,48);r.addColorStop(0,'rgba(255,255,255,.95)');r.addColorStop(1,'rgba(190,230,248,.9)');g.fillStyle=r;g.beginPath();g.moveTo(16,2);g.quadraticCurveTo(30,28,16,46);g.quadraticCurveTo(2,28,16,2);g.fill();return c})();
 // ندفة ثلج بست أذرع بتفرعات
 S.flake=(()=>{const c=cv(128,128),g=c.getContext('2d');g.translate(64,64);g.lineCap='round';[[9,.22],[4,.95]].forEach(([w,a])=>{g.strokeStyle='rgba(255,255,255,'+a+')';g.lineWidth=w;for(let i=0;i<6;i++){g.save();g.rotate(i*Math.PI/3);g.beginPath();g.moveTo(0,0);g.lineTo(0,-56);g.moveTo(0,-24);g.lineTo(-13,-38);g.moveTo(0,-24);g.lineTo(13,-38);g.moveTo(0,-40);g.lineTo(-8,-50);g.moveTo(0,-40);g.lineTo(8,-50);g.stroke();g.restore()}});return c})();
 // شظية/سنّ جليد (قمتها للأعلى وقاعدتها أسفل الصورة) بأوجه مضيئة ومعتمة
 S.spike=(()=>{const c=cv(32,96),g=c.getContext('2d');g.lineJoin='round';const L=g.createLinearGradient(0,0,32,0);L.addColorStop(0,'rgba(246,253,255,.96)');L.addColorStop(.5,'rgba(190,232,255,.92)');L.addColorStop(.5,'rgba(120,196,240,.9)');L.addColorStop(1,'rgba(70,150,215,.9)');
  g.fillStyle=L;g.beginPath();g.moveTo(16,1);g.lineTo(28,66);g.lineTo(16,95);g.lineTo(4,66);g.closePath();g.fill();
  g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=1.4;g.beginPath();g.moveTo(16,1);g.lineTo(16,95);g.moveTo(4,66);g.lineTo(28,66);g.stroke();
  g.strokeStyle='rgba(30,100,170,.7)';g.lineWidth=2;g.beginPath();g.moveTo(16,1);g.lineTo(28,66);g.lineTo(16,95);g.lineTo(4,66);g.closePath();g.stroke();
  const m=g.createLinearGradient(0,0,0,96);m.addColorStop(0,'rgba(255,255,255,1)');m.addColorStop(1,'rgba(255,255,255,.7)');return c})();
 // قذيفة جليد مضلّعة
 S.shell=(()=>{const c=cv(128,128),g=c.getContext('2d');const r=g.createRadialGradient(50,44,4,64,64,62);r.addColorStop(0,'#f4fdff');r.addColorStop(.4,'#9fdcff');r.addColorStop(.8,'#3f8fd0');r.addColorStop(1,'#1c4f8a');g.fillStyle=r;g.beginPath();g.arc(64,64,58,0,7);g.fill();
  g.save();g.beginPath();g.arc(64,64,58,0,7);g.clip();g.strokeStyle='rgba(255,255,255,.55)';g.lineWidth=2.6;g.beginPath();[[64,6,22,44],[22,44,10,90],[22,44,64,60],[64,60,106,40],[106,40,118,84],[64,60,48,118],[64,60,98,110],[106,40,64,6]].forEach(([a,b,x,y])=>{g.moveTo(a,b);g.lineTo(x,y)});g.stroke();
  g.fillStyle='rgba(255,255,255,.28)';g.beginPath();g.moveTo(64,6);g.lineTo(22,44);g.lineTo(64,60);g.closePath();g.fill();g.fillStyle='rgba(10,50,110,.28)';g.beginPath();g.moveTo(64,60);g.lineTo(118,84);g.lineTo(98,110);g.closePath();g.fill();g.restore();
  g.strokeStyle='#123a6a';g.lineWidth=3.5;g.beginPath();g.arc(64,64,58,0,7);g.stroke();g.fillStyle='rgba(255,255,255,.9)';g.beginPath();g.ellipse(44,36,11,6,-.6,0,7);g.fill();return c})();
 // شقوق جليد متشعبة على سطح الماء
 S.cracks=(()=>{const c=cv(256,256),g=c.getContext('2d');g.translate(128,128);g.lineCap='round';g.strokeStyle='rgba(255,255,255,.9)';for(let i=0;i<11;i++){let a=i/11*6.28+rnd(-.2,.2),x=0,y=0;g.lineWidth=3;g.beginPath();g.moveTo(0,0);for(let s=0;s<5;s++){const l=rnd(16,30);x+=Math.cos(a)*l;y+=Math.sin(a)*l;a+=rnd(-.5,.5);g.lineTo(x,y);if(s>0&&Math.random()<.6){g.moveTo(x,y);g.lineTo(x+Math.cos(a+1)*14,y+Math.sin(a+1)*14);g.moveTo(x,y)}}g.stroke()}
  g.lineWidth=2;g.beginPath();for(let i=0;i<=12;i++){const a=i/12*6.28,r=84+rnd(-7,7);i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r)}g.stroke();return c})();
 return S}
const tintCache=new Map();
function tint(src,key,color){const k=key+color;let c=tintCache.get(k);if(!c){c=cv(src.width,src.height);const g=c.getContext('2d');g.drawImage(src,0,0);g.globalCompositeOperation='source-in';g.fillStyle=color;g.fillRect(0,0,c.width,c.height);tintCache.set(k,c)}return c}
export function createFrostFx(root,opts){opts=opts||{};const C=merge(FROST_SHELL,opts.config||{}),canvas=document.createElement('canvas'),cx=canvas.getContext('2d');
 Object.assign(canvas.style,{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none'});root.append(canvas);
 let W=450,H=500,dpr=1,K=opts.scale||1,P=[],bs=[],auras=new Map(),user=1,hs=0,ramp=0,run=false,last=0,pend=[];const S=makeSprites(),vis={};
 const layers=['launch','trail','shell','warn','impact','debris','smoke','decal','ice'];layers.forEach(l=>vis[l]=true);
 const ph=n=>{if(opts.onPhase)opts.onPhase(n)};
 function resize(w,h,d){W=w;H=h;dpr=d||1;canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);K=opts.scale||w/450}
 function E(o){const p=Object.assign({x:0,y:0,vx:0,vy:0,ay:0,drag:0,age:0,life:1,s0:10,s1:10,rot:0,vr:0,spr:'soft',blend:'add',a:1,ac:null,pal:null,stretch:0,flat:1,z:3,layer:'impact',delay:0,tintc:null,sc:null,asp:1,curl:0,cf:6,cp:0,anchor:false},o);P.push(p);kick();return p}
 function kick(){if(!run&&!opts.manual){run=true;last=performance.now();requestAnimationFrame(loop)}}
 const mist=(x,y,s0,s1,life,o)=>E(Object.assign({x,y,vy:-rnd(8,36)*K,vx:rnd(-30,30)*K,drag:1,life,s0,s1,spr:'puff',blend:'n',a:.5,ac:[[0,0],[.15,1],[.6,.6],[1,0]],z:1,layer:'smoke',tintc:Math.random()<.5?'#e4f6ff':'#bfe6fb',rot:rnd(0,6.28),vr:rnd(-.5,.5)},o||{}));
 const spark=(x,y,size,life,o)=>E(Object.assign({x,y,s0:size*.4,s1:size,life,spr:'star',a:1,z:4,layer:'impact',tintc:Math.random()<.5?'#ffffff':'#bfeaff',rot:rnd(0,6),vr:rnd(-2,2),ac:[[0,0],[.25,1],[1,0]],sc:[[0,.2],[.3,1],[1,.1]]},o||{}));
 const spike=(x,y,len,life,rot,o)=>E(Object.assign({x,y,s0:0,s1:len*.34,life,spr:'spike',blend:'n',asp:3,anchor:true,a:1,z:2,layer:'impact',rot,ac:[[0,0],[.06,1],[.7,1],[1,0]],sc:[[0,0],[.22,1],[.8,1],[1,.85]]},o||{}));
 const shard=(x,y,vx,vy,size,life)=>E({x,y,vx,vy,ay:800*K,drag:.4,life,s0:size*.34,s1:size*.3,asp:3,spr:'spike',blend:'n',a:1,z:2,layer:'debris',rot:rnd(0,6.28),vr:rnd(-14,14),ac:[[0,1],[.75,1],[1,0]]});
 function step(dt){const slow=hs>0?(hs-=dt,.04):ramp>0?(ramp-=dt,lerp(.04,1,1-clamp(ramp/.14,0,1))):1,d=dt*slow*user,k=K;
  for(let i=P.length-1;i>=0;i--){const p=P[i];if(p.delay>0){p.delay-=d;continue}p.age+=d;if(p.age>=p.life){P.splice(i,1);continue}if(p.curl){p.vx+=Math.cos(p.age*p.cf+p.cp)*p.curl*d}p.vy+=p.ay*d;const q=Math.max(0,1-p.drag*d);p.vx*=q;p.vy*=q;p.x+=p.vx*d;p.y+=p.vy*d;p.rot+=p.vr*d}
  for(let i=bs.length-1;i>=0;i--){const b=bs[i];b.t+=d/C.flight.dur;const u=clamp(b.t,0,1),e=u*(1.08-.08*u),dx=b.to.x-b.from.x,dy=b.to.y-b.from.y,h=Math.max(30*k,C.flight.arc*b.dist);
   b.gx=b.from.x+dx*e;b.gy=b.from.y+dy*e;b.x=b.gx;b.y=b.gy-4*h*u*(1-u);b.rot+=C.flight.spin*d;b.persp=lerp(1,dy<0?1-C.flight.perspective:1+C.flight.perspective,u)*(1+.12*Math.sin(Math.PI*u));
   const vxp=b.x-(b.px===undefined?b.x:b.px),vyp=b.y-(b.py===undefined?b.y:b.py);b.px=b.x;b.py=b.y;const l=Math.hypot(vxp,vyp)||1,ux=vxp/l,uy=vyp/l,r=C.flight.shell*k*b.persp*.5;
   b.am+=d*C.flight.mistRate;b.asp+=d*C.flight.sparkleRate;
   while(b.am>=1&&vis.trail){b.am--;mist(b.x-ux*r,b.y-uy*r,rnd(8,13)*k,rnd(30,50)*k,rnd(.7,1.2),{layer:'trail',a:.5,vx:-ux*rnd(10,40)*k+rnd(-20,20)*k,vy:-uy*rnd(10,40)*k+rnd(-6,14)*k,curl:rnd(20,50)*k,cf:rnd(4,7)})}
   while(b.asp>=1&&vis.trail){b.asp--;const q=b.hist.length&&Math.random()<.5?b.hist[Math.min(b.hist.length-1,Math.floor(rnd(0,b.hist.length)))]:{x:b.x,y:b.y};spark(q.x+rnd(-r,r),q.y+rnd(-r,r),rnd(10,20)*k,rnd(.35,.7),{layer:'trail',vy:rnd(0,30)*k})}
   b.hist.unshift({x:b.x,y:b.y});if(b.hist.length>14)b.hist.pop();
   if(!b.warned&&u>=C.warn.at){b.warned=1;warn(b);ph(3)}
   if(b.t>=1){bs.splice(i,1);impact(b)}}
  // التجميد المستمر على السفن
  auras.forEach((a,key)=>{const T=a.track?a.track():a.pos;if(T)a.pos=T;if(a.delay>0){a.delay-=d;return}a.age+=d;let I=a.instant?1:clamp(a.age/.3,0,1);if(a.ending){a.endT+=d;I*=clamp(1-a.endT/a.fade,0,1);if(a.endT>=a.fade){auras.delete(key);return}}a.I=I;a.shiv=Math.max(0,a.shiv-d*3);
   const B=C.ice,pos=a.pos;if(!pos)return;const wd=B.width*k,ht=B.height*k;a.am+=d*B.mistRate*I;a.asp+=d*(B.sparkleRate+a.shiv*40)*I;
   while(a.am>=1){a.am--;mist(pos.x+rnd(-.55,.55)*wd,pos.y+ht*.45,rnd(14,20)*k,rnd(44,66)*k,rnd(1.4,2.2),{layer:'ice',a:.26,vy:rnd(4,20)*k,vx:rnd(-24,24)*k})}
   while(a.asp>=1){a.asp--;spark(pos.x+rnd(-.5,.5)*wd,pos.y+rnd(-.9,.4)*ht,rnd(8,15)*k,rnd(.4,.8),{layer:'ice'})}
   if(a.ending&&a.mode==='melt'){a.ad+=d*14;while(a.ad>=1){a.ad--;E({x:pos.x+rnd(-.5,.5)*wd,y:pos.y+rnd(-.1,.5)*ht,vy:rnd(0,40)*k,ay:640*k,life:rnd(.4,.7),s0:rnd(7,11)*k,s1:rnd(4,7)*k,asp:1.5,spr:'drop',blend:'n',a:.9,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'ice',tintc:'#c6ecff'})}}});
  for(let i=pend.length-1;i>=0;i--){pend[i].t-=dt;if(pend[i].t<=0){pend[i].f();pend.splice(i,1)}}}
 function draw(){cx.setTransform(dpr,0,0,dpr,0,0);cx.clearRect(0,0,W,H);
  for(let z=0;z<=4;z++){for(const p of P){if(p.z!==z||p.delay>0||!vis[p.layer])continue;const t=p.age/p.life;let a=p.a*(p.ac?curve(p.ac,t):1-t);if(a<=.004)continue;const s=lerp(p.s0,p.s1,p.sc?curve(p.sc,t):eo(t));if(s<=.2)continue;
    cx.globalAlpha=Math.min(1,a);cx.globalCompositeOperation=p.blend==='add'?'lighter':'source-over';cx.save();cx.translate(p.x,p.y);
    let img;if(p.pal)img=tint(S[p.spr],p.spr,p.pal[Math.min(p.pal.length-1,Math.floor(t*p.pal.length))]);else if(p.tintc)img=tint(S[p.spr],p.spr,p.tintc);else img=S[p.spr];
    if(p.stretch){const sp=Math.hypot(p.vx,p.vy);cx.rotate(Math.atan2(p.vy,p.vx));const l=Math.max(s,s*(1+sp*p.stretch));cx.drawImage(img,-l,-s*.5,l,s)}
    else{if(p.rot)cx.rotate(p.rot);if(p.flat!==1)cx.scale(1,p.flat);cx.drawImage(img,-s/2,p.anchor?-s*p.asp*.97:-s*p.asp/2,s,s*p.asp)}cx.restore()}
   if(z===1&&vis.ice)auras.forEach(drawIce);if(z===2&&vis.shell)bs.forEach(drawShell)}
  cx.globalAlpha=1;cx.globalCompositeOperation='source-over'}
 function drawShell(b){const w=C.flight.shell*K*b.persp;cx.globalCompositeOperation='source-over';
  cx.globalAlpha=.2;cx.fillStyle='#000';cx.beginPath();cx.ellipse(b.gx+w*.2,b.gy+w*.9+8*K,w*.5*(1-.25*Math.sin(Math.PI*b.t)),w*.15,0,0,7);cx.fill();
  cx.globalAlpha=1;cx.save();cx.translate(b.x,b.y);cx.rotate(b.rot);cx.drawImage(S.shell,-w/2,-w/2,w,w);cx.restore();
  cx.globalCompositeOperation='lighter';const fl=.8+.2*Math.sin(b.t*50);cx.globalAlpha=.6*fl;const gs=w*2.4;cx.drawImage(tint(S.core,'core','#7fd4ff'),b.x-gs/2,b.y-gs/2,gs,gs);cx.globalAlpha=.3;const s2=w*1.3;cx.save();cx.translate(b.x,b.y);cx.rotate(-b.rot*.6);cx.drawImage(S.flake,-s2/2,-s2/2,s2,s2);cx.restore();cx.globalCompositeOperation='source-over';cx.globalAlpha=1}
 // طبقة الجليد على السفينة: لوح شفاف + بلورات تنمو + لمعان
 function drawIce(a){const pos=a.pos;if(!pos||a.delay>0||a.I<.01)return;const k=K,B=C.ice,I=a.I,wd=B.width*k,ht=B.height*k,x0=pos.x,y0=pos.y+ht*.2,rx=wd*.55,ry=ht*.55,g=clamp(a.age/B.grow,0,1),melt=a.ending&&a.mode==='melt'?1-a.endT/a.fade*.6:1;
  cx.globalCompositeOperation='source-over';cx.globalAlpha=I*g;const gr=cx.createRadialGradient(x0,y0,0,x0,y0,rx);gr.addColorStop(0,'rgba(215,245,255,.34)');gr.addColorStop(.7,'rgba(140,210,245,.24)');gr.addColorStop(1,'rgba(225,249,255,.06)');
  cx.fillStyle=gr;cx.beginPath();cx.ellipse(x0,y0,rx*eo(g),ry*eo(g),0,0,7);cx.fill();cx.strokeStyle='rgba(235,250,255,.8)';cx.lineWidth=2*k;cx.stroke();
  for(const c of a.cr){const gg=clamp((a.age-c.d)/.35,0,1);if(gg<=0)continue;const h=c.len*k*eo(gg)*melt*(1+a.shiv*.05),w=h*.34,x=x0+Math.cos(c.t)*rx*c.r,y=y0+Math.sin(c.t)*ry*c.r;cx.save();cx.translate(x,y);cx.rotate(c.lean);cx.globalAlpha=I*.96;cx.drawImage(S.spike,-w/2,-h,w,h);cx.restore()}
  cx.globalCompositeOperation='lighter';for(const c of a.cr){const gg=clamp((a.age-c.d)/.35,0,1);if(gg<.8)continue;const tw=Math.max(0,Math.sin(a.age*c.sp+c.ph));if(tw<.2)continue;const h=c.len*k*melt,x=x0+Math.cos(c.t)*rx*c.r+Math.sin(c.lean)*h*.9,y=y0+Math.sin(c.t)*ry*c.r-Math.cos(c.lean)*h*.9,s=(12+10*tw)*k;cx.globalAlpha=I*tw*.9;cx.drawImage(S.star,x-s/2,y-s/2,s,s)}
  cx.globalCompositeOperation='source-over';cx.globalAlpha=1}
 // ---------- 1) الإطلاق: وميض بارد وضباب صقيعي وندف ثلج
 function launch(F,ang){const k=K,L=C.launch;
  E({x:F.x,y:F.y,s0:16*k,s1:92*k,life:.12,spr:'star',a:1,z:4,layer:'launch',tintc:'#dff6ff',rot:ang,ac:[[0,1],[.4,1],[1,0]]});
  E({x:F.x,y:F.y,s0:14*k,s1:56*k,life:.14,spr:'core',a:1,z:4,layer:'launch',pal:['#ffffff','#bfeaff','#6cc4f4']});
  for(let i=0;i<L.mist;i++)mist(F.x+rnd(-8,8)*k,F.y-2*k,rnd(12,18)*k,rnd(44,66)*k,rnd(.9,1.5),{layer:'launch',vx:Math.cos(ang)*rnd(10,60)*k+rnd(-40,40)*k,vy:-rnd(10,50)*k,delay:rnd(0,.06)});
  for(let i=0;i<L.sparkles;i++){const a=ang+rnd(-.9,.9),v=rnd(100,300)*k;E({x:F.x,y:F.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(0,80)*k,ay:200*k,drag:2.4,life:rnd(.3,.7),s0:rnd(10,18)*k,s1:2*k,spr:'streak',stretch:.01,a:1,z:3,layer:'launch',pal:['#ffffff','#c8efff','#7fd0ff']})}
  for(let i=0;i<L.flakes;i++)E({x:F.x+rnd(-10,10)*k,y:F.y,vx:rnd(-50,50)*k,vy:-rnd(30,90)*k,ay:120*k,drag:1.2,life:rnd(.7,1.2),s0:rnd(8,12)*k,s1:rnd(14,22)*k,spr:'flake',a:.9,z:3,layer:'launch',tintc:'#e6f8ff',rot:rnd(0,6),vr:rnd(-3,3),ac:[[0,0],[.15,1],[.7,.8],[1,0]]});
  if(L.ring)E({x:F.x,y:F.y+4*k,s0:10*k,s1:84*k,life:.25,spr:'ring',a:.6,flat:.4,z:3,layer:'launch',tintc:'#bfeaff'});
  if(opts.onShake)opts.onShake(L.shake*k,150)}
 // ---------- 3) علامة السقوط: حلقتان باردتان وندفة ثلج تدور على الهدف
 function warn(b){const k=K,T=b.to,life=(1-b.t)*C.flight.dur+.04;
  E({x:T.x,y:T.y+6*k,s0:150*k,s1:34*k,life,spr:'ring',a:.85,flat:.42,z:1,layer:'warn',tintc:'#9fdcff',ac:[[0,0],[.15,1],[.85,1],[1,0]],sc:[[0,0],[1,1]]});
  E({x:T.x,y:T.y+6*k,s0:96*k,s1:20*k,life,spr:'ring',a:.9,flat:.42,z:1,layer:'warn',tintc:'#ffffff',ac:[[0,0],[.2,1],[.9,1],[1,0]],sc:[[0,0],[1,1]]});
  E({x:T.x,y:T.y+4*k,s0:30*k,s1:74*k,life,spr:'flake',a:.7,flat:.5,z:1,layer:'warn',tintc:'#dff6ff',rot:0,vr:2.2,ac:[[0,0],[.3,.8],[.9,1],[1,0]]})}
 // ---------- 4أ) الإصابة: انفجار جليدي وبلورات تنمو وصقيع ينتشر على الماء
 function hit(T,ang,b){const k=K,H_=C.hit;hs=H_.stop;ramp=.14;if(opts.onHitStop)opts.onHitStop(H_.stop*1000);
  E({x:T.x,y:T.y,s0:20*k,s1:110*k,life:.14,spr:'star',a:1,z:4,rot:ang,tintc:'#eafaff',ac:[[0,1],[.3,1],[1,0]]});
  E({x:T.x,y:T.y,s0:30*k,s1:92*k,life:.2,spr:'core',a:1,z:4,pal:['#ffffff','#d6f4ff','#7fd0ff']});
  E({x:T.x,y:T.y+4*k,s0:10*k,s1:200*k,life:.5,spr:'ring',a:.85,flat:.4,z:3,tintc:'#bfeaff',ac:[[0,.9],[1,0]]});
  E({x:T.x,y:T.y+4*k,s0:10*k,s1:130*k,life:.35,spr:'ring',a:.7,flat:.5,z:3,tintc:'#ffffff',delay:.04,ac:[[0,.7],[1,0]]});
  for(let i=0;i<H_.spikes;i++){const f=(i-(H_.spikes-1)/2)/((H_.spikes-1)/2||1);spike(T.x+f*30*k,T.y+rnd(-2,6)*k,rnd(46,86)*k*(1-Math.abs(f)*.3),rnd(.9,1.3),f*.8+rnd(-.12,.12),{delay:rnd(0,.1)})}
  for(let i=0;i<H_.shards;i++){const a=ang+rnd(-1.8,1.8),v=rnd(120,400)*k;shard(T.x,T.y,Math.cos(a)*v,Math.sin(a)*v-rnd(120,300)*k,rnd(20,42)*k,rnd(.7,1.2))}
  for(let i=0;i<H_.flakes;i++){const a=rnd(0,6.28),v=rnd(30,150)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(60,160)*k,ay:60*k,drag:1.3,life:rnd(1,1.8),s0:rnd(8,12)*k,s1:rnd(14,24)*k,spr:'flake',a:.95,z:3,tintc:'#eefaff',rot:rnd(0,6),vr:rnd(-4,4),curl:rnd(20,60)*k,cf:rnd(3,7),cp:rnd(0,6.28),ac:[[0,0],[.1,1],[.7,.8],[1,0]],delay:rnd(0,.25)})}
  for(let i=0;i<H_.mist;i++)mist(T.x+rnd(-24,24)*k,T.y+rnd(-8,8)*k,rnd(28,42)*k,rnd(90,140)*k,rnd(1.4,2.4),{vx:rnd(-50,50)*k,vy:-rnd(10,50)*k,a:.6,delay:rnd(.05,.3),drag:.9});
  for(let i=0;i<H_.sparkles;i++){const a=rnd(0,6.28),v=rnd(160,500)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(40,160)*k,ay:380*k,drag:1.6,life:rnd(.3,.8),s0:rnd(10,20)*k,s1:2*k,spr:'streak',stretch:.007,a:1,z:3,pal:['#ffffff','#d6f4ff','#8fdaff']})}
  if(H_.patch){E({x:T.x,y:T.y+6*k,s0:30*k,s1:150*k,life:2.8,spr:'soft',blend:'n',a:.55,flat:.38,z:0,layer:'decal',tintc:'#e6f8ff',ac:[[0,0],[.1,1],[.75,.85],[1,0]]});E({x:T.x,y:T.y+6*k,s0:30*k,s1:150*k,life:2.8,spr:'cracks',blend:'n',a:.75,flat:.38,z:0,layer:'decal',ac:[[0,0],[.12,1],[.75,.8],[1,0]]})}
  if(opts.onShake)opts.onShake(H_.shake*k,H_.shakeMs);if(opts.onZoom)opts.onZoom(H_.zoom,300);if(opts.onFlash)opts.onFlash(H_.flash,220);ph(4);pend.push({t:.9,f:()=>ph(5)})}
 // ---------- 4ب) الإخفاق: الماء حول نقطة السقوط يتجمد كطوف جليد ثم يتشقق ويذوب
 function miss(T){const k=K,M=C.miss;E({x:T.x,y:T.y,s0:20*k,s1:110*k,life:.16,spr:'core',a:1,z:4,pal:['#ffffff','#d6f4ff','#9fdcff']});
  for(let i=0;i<M.spray;i++){const v=rnd(220,440)*k;E({x:T.x+rnd(-8,8)*k,y:T.y,vx:rnd(-60,60)*k,vy:-v,ay:900*k,drag:.3,life:rnd(.7,1.1),s0:rnd(14,24)*k,s1:rnd(36,60)*k,spr:'puff',blend:'n',a:1,ac:[[0,0],[.1,1],[.7,.7],[1,0]],z:2,layer:'smoke',tintc:'#f0fbff',rot:rnd(0,6.28),delay:rnd(0,.05)})}
  for(let i=0;i<M.drops;i++){const a=rnd(-2.7,-.4),v=rnd(120,380)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,ay:900*k,life:rnd(.6,1),s0:rnd(10,15)*k,s1:rnd(7,10)*k,asp:1.5,spr:'drop',blend:'n',a:.95,ac:[[0,1],[.8,1],[1,0]],z:2,layer:'debris'})}
  E({x:T.x,y:T.y+4*k,s0:20*k,s1:170*k,life:2.6,spr:'soft',blend:'n',a:.7,flat:.34,z:0,layer:'decal',tintc:'#e9f9ff',ac:[[0,0],[.08,1],[.72,.9],[1,0]],sc:[[0,0],[.18,1],[1,1]]});
  E({x:T.x,y:T.y+4*k,s0:20*k,s1:170*k,life:2.6,spr:'cracks',blend:'n',a:.85,flat:.34,z:0,layer:'decal',ac:[[0,0],[.1,1],[.72,.85],[1,0]],sc:[[0,0],[.18,1],[1,1]]});
  for(let i=0;i<M.spikes;i++){const f=(i-(M.spikes-1)/2)/((M.spikes-1)/2||1);spike(T.x+f*44*k,T.y+rnd(0,6)*k,rnd(30,56)*k,rnd(1.2,1.8),f*.7+rnd(-.12,.12),{delay:rnd(.05,.2)})}
  for(let i=0;i<M.shards;i++){const a=rnd(-2.7,-.4),v=rnd(120,330)*k;shard(T.x,T.y,Math.cos(a)*v,Math.sin(a)*v,rnd(16,30)*k,rnd(.6,1))}
  for(let i=0;i<3;i++)E({x:T.x,y:T.y+3*k,s0:12*k,s1:(150+i*44)*k,life:1,spr:'ring',a:1,flat:.32,z:1,layer:'impact',tintc:'#f4fcff',delay:i*.1,ac:[[0,.9],[.6,.4],[1,0]]});
  if(opts.onShake)opts.onShake(M.shake*k,200);ph(4);pend.push({t:.9,f:()=>ph(5)})}
 // ---------- 4ج) صدّ الدرع: بلورات تنتشر على سطح القبة بلونها ثم تتحطم
 function blocked(T,ang,col){const k=K,B=C.blocked;col=col||'#7fe3ff';E({x:T.x,y:T.y,s0:30*k,s1:150*k,life:.2,spr:'core',a:1,z:4,tintc:col});E({x:T.x,y:T.y,s0:10*k,s1:210*k,life:.5,spr:'ring',a:.9,flat:.7,z:3,tintc:col,ac:[[0,.95],[1,0]]});
  E({x:T.x,y:T.y,s0:20*k,s1:90*k,life:.3,spr:'core',a:.8,z:3,pal:['#ffffff','#d6f4ff','#7fd0ff']});
  for(let i=0;i<B.spikes;i++){const a=-Math.PI*(i+.5)/B.spikes,r=rnd(30,54)*k;spike(T.x+Math.cos(a)*r,T.y+Math.sin(a)*r*.8,rnd(22,44)*k,rnd(.5,.9),a+Math.PI/2,{delay:rnd(0,.12)});shard(T.x+Math.cos(a)*r,T.y+Math.sin(a)*r*.8,Math.cos(a)*rnd(80,200)*k,Math.sin(a)*rnd(80,200)*k,rnd(14,24)*k,rnd(.5,.9))}
  for(let i=0;i<B.sparkles;i++){const a=ang+Math.PI+rnd(-1.2,1.2),v=rnd(160,440)*k;E({x:T.x,y:T.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(0,120)*k,ay:420*k,drag:1.2,life:rnd(.3,.7),s0:rnd(14,24)*k,s1:3*k,spr:'streak',stretch:.012,a:1,z:3,tintc:i%2?'#ffffff':col})}
  if(opts.onShake)opts.onShake(B.shake*k,220);ph(4);pend.push({t:.7,f:()=>ph(5)})}
 function impact(b){const out=b.outcome,ang=Math.atan2(b.to.y-b.from.y,b.to.x-b.from.x);if(out==='miss')miss(b.to);else if(out==='blocked')blocked(b.to,ang,b.color);else{hit(b.to,ang,b);if(b.freeze)freeze(b.freeze.key,{track:b.freeze.track,delay:.3,pos:b.to})}
  if(opts.onImpact)opts.onImpact(out);pend.push({t:.7,f:b.done});kick()}
 // ---------- التجميد المستمر
 function mkCrystals(){const n=C.ice.crystals,a=[];for(let i=0;i<n;i++){const t=(i/n)*6.28+rnd(-.2,.2),r=rnd(.35,1);a.push({t,r,len:rnd(18,40)*(.7+.5*(1-r)),lean:Math.cos(t)*rnd(.25,.6)+rnd(-.12,.12),d:rnd(0,.35),sp:rnd(3,7),ph:rnd(0,6.28)})}a.sort((p,q)=>Math.sin(p.t)*p.r-Math.sin(q.t)*q.r);return a}
 // freeze: يغلّف السفينة بالجليد. instant:true بلا نمو (لاستعادة حالة محفوظة). متكرر الاستدعاء بأمان.
 function freeze(key,o){o=o||{};const a=auras.get(key);if(a){a.ending=false;a.endT=0;if(o.track)a.track=o.track;return}
  auras.set(key,{track:o.track||null,pos:o.pos||null,age:o.instant?C.ice.grow+.5:0,delay:o.delay||0,instant:!!o.instant,I:0,shiv:0,am:0,asp:0,ad:0,ending:false,endT:0,fade:C.ice.fade,mode:'melt',cr:mkCrystals()});kick()}
 // thaw: ذوبان تدريجي (mode='melt')، أو إخفاء سريع إن دُمرت السفينة (mode='dead')
 function thaw(key,mode){const a=auras.get(key);if(!a||a.ending)return;a.ending=true;a.endT=0;a.mode=mode==='dead'?'dead':'melt';a.fade=a.mode==='dead'?.25:C.ice.fade;if(a.mode==='melt'&&a.pos){const k=K;for(let i=0;i<6;i++)mist(a.pos.x+rnd(-.5,.5)*C.ice.width*k,a.pos.y,rnd(16,24)*k,rnd(50,80)*k,rnd(1,1.6),{layer:'ice',tintc:'#e6f4fa',a:.3,vy:-rnd(14,36)*k,delay:rnd(0,.3)})}}
 // shatter: ضربة حركية على سفينة متجمدة (تحطّم ×2): الجليد ينفجر شظايا
 function shatter(key){const a=auras.get(key);if(!a)return false;const T=a.track?a.track():a.pos,k=K;auras.delete(key);if(!T)return false;
  const B=C.ice,wd=B.width*k,ht=B.height*k,x0=T.x,y0=T.y+ht*.2;
  E({x:T.x,y:T.y,s0:30*k,s1:130*k,life:.18,spr:'star',a:1,z:4,layer:'ice',tintc:'#eafaff',ac:[[0,1],[.3,1],[1,0]]});E({x:T.x,y:T.y,s0:10*k,s1:200*k,life:.45,spr:'ring',a:.85,flat:.45,z:3,layer:'ice',tintc:'#cfeeff',ac:[[0,.9],[1,0]]});
  for(const c of a.cr)for(let j=0;j<B.shatterShards;j++){const x=x0+Math.cos(c.t)*wd*.55*c.r,y=y0+Math.sin(c.t)*ht*.55*c.r,an=rnd(0,6.28),v=rnd(100,380)*k;shard(x,y,Math.cos(an)*v,Math.sin(an)*v-rnd(100,260)*k,rnd(18,40)*k,rnd(.7,1.2))}
  for(let i=0;i<18;i++){const an=rnd(0,6.28),v=rnd(160,480)*k;E({x:T.x,y:T.y,vx:Math.cos(an)*v,vy:Math.sin(an)*v-rnd(40,160)*k,ay:380*k,drag:1.6,life:rnd(.3,.8),s0:rnd(10,18)*k,s1:2*k,spr:'streak',stretch:.007,a:1,z:3,layer:'ice',pal:['#ffffff','#d6f4ff','#8fdaff']})}
  for(let i=0;i<6;i++)mist(T.x+rnd(-.5,.5)*wd,T.y,rnd(22,32)*k,rnd(70,110)*k,rnd(1.1,1.8),{layer:'ice',a:.5,vy:-rnd(14,40)*k});
  if(opts.onShake)opts.onShake(4*k,260);if(opts.onFlash)opts.onFlash(.08,200);kick();return true}
 // shiver: محاولة تحرك فاشلة (moveFail «مجمّدة»): ارتجاف ولمعان
 function shiver(key){const a=auras.get(key);if(!a)return;a.shiv=1;if(opts.onShake)opts.onShake(1.4*K,200);const T=a.track?a.track():a.pos;if(T)for(let i=0;i<5;i++)E({x:T.x+rnd(-30,30)*K,y:T.y+rnd(-16,10)*K,s0:6*K,s1:16*K,life:.3,spr:'star',a:1,z:4,layer:'ice',tintc:'#ffffff',delay:rnd(0,.15),ac:[[0,0],[.3,1],[1,0]]});kick()}
 function fire(cfg){return new Promise(res=>{const F=cfg.from,T=cfg.to,ang=Math.atan2(T.y-F.y,T.x-F.x);ph(1);launch(F,ang);if(opts.onRecoil)opts.onRecoil(ang);
  bs.push({from:F,to:T,t:0,x:F.x,y:F.y,gx:F.x,gy:F.y,dist:Math.hypot(T.x-F.x,T.y-F.y),rot:rnd(0,6),persp:1,hist:[],am:0,asp:0,outcome:cfg.outcome||'hit',color:cfg.shieldColor,freeze:cfg.freeze||null,done:res});ph(2);kick()})}
 function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;step(dt);draw();if(P.length||bs.length||pend.length||hs>0||auras.size)requestAnimationFrame(loop);else{run=false;cx.clearRect(0,0,W,H)}}
 function advance(dt){step(dt);draw()}
 return{resize,fire,advance,freeze,thaw,shatter,shiver,clear(){P=[];bs=[];pend=[];auras.clear();cx.clearRect(0,0,W,H)},setTimeScale(v){user=v},setLayer(n,v){vis[n]=v},frozen(){return[...auras.keys()]},stats(){return{particles:P.length,shells:bs.length,frozen:auras.size}},layers,config:C}}
