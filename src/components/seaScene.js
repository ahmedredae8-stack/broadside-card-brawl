const IW=1428,IH=2560,N=3,AW=2304,AH=576,CW=768,CH=576;
const VS='attribute vec2 a;varying vec2 vUv;void main(){vUv=vec2(a.x*.5+.5,.5-a.y*.5);gl_Position=vec4(a,0.,1.);}';
const WAVE='float W(vec2 uv,float t){float s=mix(2.6,1.,clamp((uv.y-.42)/.58,0.,1.));vec2 p=vec2(uv.x*.558,uv.y)*s*14.;return sin(dot(p,vec2(.9,.4))+t*1.1)*.5+sin(dot(p,vec2(-.5,.8))*1.7+t*1.5)*.28+sin(dot(p,vec2(.3,-1.))*2.9+t*2.1)*.15+sin(dot(p,vec2(1.,.1))*5.3+t*2.9)*.07;}';
const FS=`precision highp float;varying vec2 vUv;uniform sampler2D uB,uM,uS;uniform float uT,uAmp,uRef,uSun,uFoam,uRip,uBw[3],uBa[3],uBA[3],uAsp[3],uWl[3];uniform vec2 uBc[3];uniform vec4 uR[3];uniform vec3 uSky,uSunC;const vec2 RS=vec2(1428.,2560.);
float hs(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1.,0.)),f.x),mix(hs(i+vec2(0.,1.)),hs(i+vec2(1.,1.)),f.x),f.y);}
${WAVE}
float ripAt(vec2 uv,float t,vec2 bc,float bw,float A){if(A<.001)return 0.;vec2 d=(uv-bc)*RS/(bw*.55);d.y*=2.6;float r=length(d);return sin(r*9.-t*3.)*exp(-r*1.5)*smoothstep(.55,.95,r)*uRip*A;}
float H(vec2 uv,float t){return W(uv,t)*uAmp+(ripAt(uv,t,uBc[0],uBw[0],uBA[0])+ripAt(uv,t,uBc[1],uBw[1],uBA[1])+ripAt(uv,t,uBc[2],uBw[2],uBA[2]))*.35;}
void main(){vec2 uv=vUv,px=uv*RS;float t=uT;vec3 md=texture2D(uM,uv).rgb;float m=md.r,dp=md.g;
float e=.0016,h0=W(uv,t),hx=H(uv+vec2(e,0.),t)-H(uv-vec2(e,0.),t),hy=H(uv+vec2(0.,e),t)-H(uv-vec2(0.,e),t);
vec3 N=normalize(vec3(-hx*2.2,-hy*2.2,1.));vec3 col=texture2D(uB,uv+vec2(hx,hy)*.02*uRef*m).rgb;
col=mix(col,uSky,clamp(1.-N.z,0.,1.)*.8*m);col*=1.+h0*.035*uAmp*m;
vec3 Hh=normalize(normalize(vec3(.55,-.5,.65))+vec3(0.,0.,1.));float sp=pow(max(dot(N,Hh),0.),150.)*1.4*uSun;sp+=smoothstep(.93,1.,nz(px*.3+vec2(t*.5,-t*.3)))*pow(max(dot(N,Hh),0.),30.)*uSun;col+=uSunC*sp*m;
float fc=smoothstep(.8,1.,h0+(nz(px*.13+vec2(t*.4,t*.1))-.5)*.55)*smoothstep(.15,.45,dp)*uFoam;col=mix(col,vec3(1.),fc*.3*m);
float band=smoothstep(0.,.03,dp)*(1.-smoothstep(.05,.16,dp)),ls=sin(dp*70.-t*1.6+nz(px*.02)*3.)*.5+.5;col=mix(col,vec3(1.),band*smoothstep(.55,.9,ls)*uFoam*.55*m);
vec2 p2=px*.03;float cc=sin(p2.x+sin(p2.y*1.3+t))*sin(p2.y+sin(p2.x*1.1-t*.8));col+=vec3(.9,1.,.9)*pow(.5+.5*cc,6.)*.10*(1.-smoothstep(.1,.5,dp))*m;
for(int i=0;i<3;i++){float A=uBA[i];if(A<.001)continue;float bw=uBw[i];vec2 bc=uBc[i];vec2 dd=(uv-bc)*RS/(bw*.55);dd.y*=2.6;float rr=length(dd);col*=1.-.3*exp(-rr*rr*1.5)*m*A;
vec2 d0=px-bc*RS;float ca=cos(uBa[i]),sa=sin(uBa[i]);vec2 d=vec2(ca*d0.x+sa*d0.y,-sa*d0.x+ca*d0.y);float bl=sin(d.x*.05-t*2.)*2.5+sin(d.x*.021+t*1.2)*2.,below=d.y-bl;float asp=uAsp[i],wl=uWl[i];
float u=d.x/bw+.5,v=d.y/(bw*asp)+wl;float rv=wl-d.y/(bw*asp),ru=u+sin(d.y*.12+t*2.)*.01,rin=step(0.,ru)*step(ru,1.)*step(0.,rv)*step(rv,1.)*step(0.,d.y);
vec4 rs=texture2D(uS,vec2(uR[i].x+ru*uR[i].z,uR[i].y+rv*uR[i].w));col=mix(col,rs.rgb/max(rs.a,.001)*vec3(.7,.85,1.),rs.a*.25*exp(-max(d.y,0.)/(bw*.1))*rin*m*A);
u+=step(0.,below)*sin(d.y*.18+t*3.)*.004;float inb=step(.001,u)*step(u,.999)*step(.001,v)*step(v,.999);vec4 sc=texture2D(uS,vec2(uR[i].x+u*uR[i].z,uR[i].y+v*uR[i].w))*inb;vec3 sr=sc.rgb/max(sc.a,.001);float al=sc.a;
if(below>0.){vec3 wc=col*vec3(.85,.95,1.05);float wm=smoothstep(.2,.6,m);sr=mix(sr,wc,clamp(.5+below/(bw*.09),.5,.97)*wm);al*=1.-smoothstep(bw*.04,bw*.13,below)*wm;}
col=mix(col,sr,al*A);}
gl_FragColor=vec4(col,1.);}`;
function Wj(ux,uy,t){const s=2.6-1.6*Math.min(1,Math.max(0,(uy-.42)/.58)),px=ux*.558*s*14,py=uy*s*14;return Math.sin(px*.9+py*.4+t*1.1)*.5+Math.sin((-px*.5+py*.8)*1.7+t*1.5)*.28+Math.sin((px*.3-py)*2.9+t*2.1)*.15+Math.sin((px+py*.1)*5.3+t*2.9)*.07}
const imgCache=new Map(),boxCache=new WeakMap();const loadImg=src=>{let p=imgCache.get(src);if(!p){p=new Promise((r,j)=>{const i=new Image();i.crossOrigin='anonymous';i.onload=()=>r(i);i.onerror=e=>{imgCache.delete(src);j(e)};i.src=src});imgCache.set(src,p)}return p};
function bbox(img){try{const k=Math.min(1,256/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*k)),h=Math.max(1,Math.round(img.height*k)),c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(img,0,0,w,h);const d=x.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=0,y1=0;
for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++)if(d[(y*w+xx)*4+3]>16){if(xx<x0)x0=xx;if(xx>x1)x1=xx;if(y<y0)y0=y;if(y>y1)y1=y}if(x1<x0)return[0,0,img.width,img.height];return[x0/k,y0/k,(x1-x0+1)/k,(y1-y0+1)/k]}catch(e){return[0,0,img.width,img.height]}}
export function createSeaScene(cv,opt){opt=opt||{};const gl=cv.getContext('webgl',{antialias:false});if(!gl)return{setScene(){},setShips(){},setParams(){},destroy(){}};
const P=Object.assign({amp:1,spd:1,ref:1,sun:1,foam:.7,rip:1,paused:false},opt.params||{});let scn={sky:[.75,.88,1],sun:[1,.97,.88],foam:.7},geo=[],st=[],atlasKey='',T=0,ST=0,dead=false,raf=0,last=performance.now(),U={};
const atl=document.createElement('canvas');atl.width=AW;atl.height=AH;const atx=atl.getContext('2d');
const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))console.error(gl.getShaderInfoLog(o));return o};
const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.bindAttribLocation(pr,0,'a');gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))console.error(gl.getProgramInfoLog(pr));gl.useProgram(pr);
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
['uB','uM','uS','uT','uAmp','uRef','uSun','uFoam','uRip','uSky','uSunC','uBc','uBw','uBa','uBA','uAsp','uWl','uR'].forEach(n=>U[n]=gl.getUniformLocation(pr,n));['uB','uM','uS'].forEach((n,k)=>gl.uniform1i(U[n],k));
const tex=(u,pm)=>{const x=gl.createTexture();gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,x);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,pm);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,0]));[gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE));[gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER].forEach(k=>gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR));return x};
const tB=tex(0,0),tM=tex(1,0),tS=tex(2,1);
const up=(u,t,src,pm)=>{gl.activeTexture(gl.TEXTURE0+u);gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,pm);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src)};
async function setScene(s){const[b,m]=await Promise.all([loadImg(s.bg),s.mask?loadImg(s.mask):Promise.resolve(null)]);up(0,tB,b,0);if(m)up(1,tM,m,0);else{gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,tM);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]))}
scn={sky:s.sky||scn.sky,sun:s.sun||scn.sun,foam:s.foam!==undefined?s.foam:.7}}
async function setShips(list){const items=(list||[]).slice(0,N),key=items.map(s=>s.src+(s.flip?'!f':'')).join('|');
if(key!==atlasKey){const imgs=await Promise.all(items.map(s=>loadImg(s.src)));atlasKey=key;atx.clearRect(0,0,AW,AH);
geo=items.map((s,i)=>{const im=imgs[i];let bb=boxCache.get(im);if(!bb){bb=bbox(im);boxCache.set(im,bb)}const[bx,by,bw,bh]=bb,k=Math.min((CW-8)/bw,(CH-8)/bh),w=bw*k,h=bh*k,ox=i*CW+(CW-w)/2,oy=(CH-h)/2;
if(s.flip){atx.save();atx.translate(ox+w,oy);atx.scale(-1,1);atx.drawImage(im,bx,by,bw,bh,0,0,w,h);atx.restore()}
else atx.drawImage(im,bx,by,bw,bh,ox,oy,w,h);
return{rect:[ox/AW,oy/AH,w/AW,h/AH],asp:bh/bw}});up(2,tS,atl,1)}
st=items.map((s,i)=>Object.assign({},geo[i],{x:s.x,y:s.y,w:(s.width||.34)*(s.squash||1),asp:geo[i].asp/(s.squash||1),wl:s.waterline||.9,vis:s.visible!==false}))}
function setParams(p){Object.assign(P,p)}
function frame(n){if(dead)return;raf=requestAnimationFrame(frame);const dt=Math.min(.05,(n-last)/1000);last=n;
const dpr=Math.min(devicePixelRatio||1,2),cw=cv.clientWidth||cv.width,tw=Math.min(IW,Math.round(cw*dpr)),th=Math.round(tw*IH/IW);if(cv.width!==tw||cv.height!==th){cv.width=tw;cv.height=th}gl.viewport(0,0,cv.width,cv.height);
if(!P.paused){T+=dt*P.spd;ST+=dt}
const bc=new Float32Array(6),bw=new Float32Array(3),ba=new Float32Array(3),bA=new Float32Array(3),as=new Float32Array(3),wl=new Float32Array(3),rc=new Float32Array(12);
const ord=st.map((s,i)=>i).filter(i=>st[i]&&st[i].vis&&st[i].rect).sort((a,b)=>st[a].y-st[b].y);
ord.forEach((si,k)=>{const s=st[si],hv=Wj(s.x,s.y,T)*P.amp,sl=(Wj(s.x+.04,s.y,T)-Wj(s.x-.04,s.y,T))*P.amp/.08;bc[k*2]=s.x;bc[k*2+1]=s.y+hv*7/IH;bw[k]=s.w*IW;ba[k]=Math.max(-.07,Math.min(.07,sl*.0022))+Math.sin(ST*.9+si)*.008;bA[k]=1;as[k]=s.asp;wl[k]=s.wl;rc.set(s.rect,k*4)});
const u1=(k,v)=>gl.uniform1f(U[k],v);u1('uT',T);u1('uAmp',P.amp);u1('uRef',P.ref);u1('uSun',P.sun);u1('uFoam',P.foam*scn.foam/.7);u1('uRip',P.rip);
gl.uniform2fv(U.uBc,bc);gl.uniform1fv(U.uBw,bw);gl.uniform1fv(U.uBa,ba);gl.uniform1fv(U.uBA,bA);gl.uniform1fv(U.uAsp,as);gl.uniform1fv(U.uWl,wl);gl.uniform4fv(U.uR,rc);gl.uniform3f(U.uSky,scn.sky[0],scn.sky[1],scn.sky[2]);gl.uniform3f(U.uSunC,scn.sun[0],scn.sun[1],scn.sun[2]);
gl.drawArrays(gl.TRIANGLES,0,3)}
raf=requestAnimationFrame(frame);
return{setScene,setShips,setParams,destroy(){dead=true;cancelAnimationFrame(raf)}}}
