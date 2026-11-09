/**
 * Script appended to the King of Seas game page at launch. It runs in the game's global scope and
 * reuses the game's own `scene`, `cam`, `W`, `fit`, `fallbackShip`, `goIsland`:
 *  - spawns every lobby captain (real + AI) as a ship on the sea with a floating name plate,
 *  - shows a gold survivors panel; when only 3 ships remain the match moves to the island,
 *  - on defeat offers spectate or exit (gold panels, no emoji),
 *  - player missiles damage the nearest captain ship.
 */
export type RoyaleSeat = { id?: string; name: string; isBot: boolean; me?: boolean };

export function royaleScript(seats: RoyaleSeat[], selfId = "offline"): string {
  const others = seats.filter((s) => !s.me).map((s, i) => ({ id: s.id ?? `seat-${i}`, n: s.name, b: s.isBot }));
  return `<style>
.ks-panel{position:fixed;top:max(10px,env(safe-area-inset-top));right:10px;z-index:8;min-width:150px;padding:8px 10px;border-radius:14px;
background:linear-gradient(180deg,rgba(28,20,8,.92),rgba(12,9,4,.92));border:2px solid #d4a24a;box-shadow:0 0 0 1px #5a3d12 inset,0 8px 20px rgba(0,0,0,.5);
color:#f7e3b0;font:600 12px system-ui;direction:rtl;pointer-events:none}
.ks-panel h4{margin:0 0 6px;font-size:13px;color:#ffd77a;display:flex;justify-content:space-between}
.ks-panel li{list-style:none;display:flex;justify-content:space-between;gap:8px;padding:2px 0;opacity:1}
.ks-panel li.dead{opacity:.35;text-decoration:line-through}.ks-panel ul{margin:0;padding:0}
.ks-tag{position:fixed;z-index:6;transform:translate(-50%,-100%);pointer-events:none;font:700 11px system-ui;color:#ffe9b0;
padding:2px 8px;border-radius:9px;background:rgba(20,14,4,.8);border:1px solid #c8963e;white-space:nowrap}
.ks-tag i{display:block;height:3px;margin-top:2px;background:#3a2a10;border-radius:2px}.ks-tag i b{display:block;height:100%;background:#e9b84c;border-radius:2px}
.ks-feed{position:fixed;top:45%;left:50%;transform:translateX(-50%);z-index:8;font:800 16px system-ui;color:#ffd77a;text-shadow:0 2px 6px #000;pointer-events:none;transition:opacity .4s}
.ks-modal{position:fixed;inset:0;z-index:20;display:grid;place-items:center;background:rgba(5,4,2,.6);direction:rtl}
.ks-card{width:min(360px,88vw);padding:22px;border-radius:18px;text-align:center;color:#f7e3b0;font-family:system-ui;
background:linear-gradient(180deg,#2a1d0a,#120c04);border:2px solid #d4a24a;box-shadow:0 0 0 2px #5a3d12 inset,0 20px 50px rgba(0,0,0,.6)}
.ks-card h2{margin:0 0 6px;color:#ffd77a;font-size:24px}.ks-card p{margin:0 0 16px;opacity:.85}
.ks-card button{display:block;width:100%;margin:8px 0;padding:12px;border-radius:12px;font:800 15px system-ui;cursor:pointer;
border:2px solid #d4a24a;background:linear-gradient(180deg,#f3c75a,#b07a22);color:#2a1a04}
.ks-card button.ghost{background:transparent;color:#f7e3b0}
#over{display:none!important}
</style>
<script>
(function(){
var SEATS=${JSON.stringify(others)},SELF_ID=${JSON.stringify(selfId)};
var bots=[],remote={},hitSeen={},hitSeq=0,ended=false,spectate=false,meDead=false,feedT=0,lastSync=0,lastShipPos=null;
function rnd(a,b){return a+Math.random()*(b-a)}
var feed=document.createElement('div');feed.className='ks-feed';document.body.appendChild(feed);
function say2(t){feed.textContent=t;feed.style.opacity=1;clearTimeout(feedT);feedT=setTimeout(function(){feed.style.opacity=0},2400)}
var panel=document.createElement('div');panel.className='ks-panel';document.body.appendChild(panel);
SEATS.forEach(function(s,i){
  var g;try{g=fit(fallbackShip(),CFG.ship.len,true)}catch(e){g=new THREE.Group()}
  var a=i/SEATS.length*6.283,d=rnd(70,170);
  g.position.set(Math.cos(a)*d,0,Math.sin(a)*d);scene.add(g);
  var tag=document.createElement('div');tag.className='ks-tag';tag.innerHTML=s.n+'<i><b></b></i>';document.body.appendChild(tag);
  bots.push({id:s.id,n:s.n,b:s.b,remote:!s.b,g:g,tag:tag,hp:300,yaw:rnd(0,6.28),turn:0,alive:true,cd:rnd(3,8)});
});
window.addEventListener('message',function(e){
  if(e.source!==parent)return;var m=e.data||{};
  if(m.type==='kos-remote'&&m.id&&m.state)remote[m.id]=m;
  if(m.type==='kos-hit'&&m.hit){var h=m.hit;if(!h.id||hitSeen[h.id]||h.shooterId===SELF_ID)return;hitSeen[h.id]=true;
    if(h.targetId===SELF_ID&&W.ship&&typeof W.ship.hp==='number'){W.ship.hp=Math.max(0,W.ship.hp-(h.damage||60));if(W.ship.hp<=0)W.over=true;}
    else{var t=bots.find(function(x){return x.id===h.targetId});if(t&&t.alive){t.hp-=h.damage||60;if(t.hp<=0)kill(t,'قبطان');}}
  }
});
setInterval(function(){if(!W.ship||!W.ship.pos)return;var p=W.ship.pos;
  var yaw=lastShipPos?Math.atan2(p.z-lastShipPos.z,p.x-lastShipPos.x):0;lastShipPos={x:p.x,z:p.z};
  parent.postMessage({type:'kos-state',state:{pos:{x:p.x,y:p.y,z:p.z},yaw:yaw,hp:W.ship.hp,alive:!(W.over&&W.ship.hp<=0)}},'*');
},100);
function alive(){return bots.filter(function(b){return b.alive}).length+(meDead?0:1)}
function render(){
  var rows=bots.map(function(b){return '<li class="'+(b.alive?'':'dead')+'"><span>'+b.n+'</span><span>'+(b.alive?Math.ceil(b.hp/3)+'%':'غرق')+'</span></li>'}).join('');
  panel.innerHTML='<h4><span>الناجون</span><span>'+alive()+' / '+(bots.length+1)+'</span></h4><ul><li class="'+(meDead?'dead':'')+'"><span>أنت</span><span>'+(meDead?'غرق':'')+'</span></li>'+rows+'</ul>';
}
function kill(b,by){if(!b.alive)return;b.alive=false;b.hp=0;scene.remove(b.g);b.tag.remove();say2(b.n+' غرق'+(by?' بنيران '+by:''));try{boom(b.g.position.clone(),60,14)}catch(e){}render();check()}
function check(){
  if(ended||W.stage==='island')return;
  if(alive()<=3){ended=true;say2('آخر 3 ناجين — الانتقال إلى جزيرة المصير');
    setTimeout(function(){bots.forEach(function(b){if(b.g.parent)scene.remove(b.g);b.tag.remove()});panel.style.display='none';
      if(meDead){modal('انتهت معركة البحر','الناجون الثلاثة انتقلوا إلى الجزيرة',[['الخروج',exit]]);return}
      try{goIsland()}catch(e){}},2200);}
}
function exit(){try{parent.postMessage({type:'kos-exit'},'*')}catch(e){}}
function modal(t,p,btns){var m=document.createElement('div');m.className='ks-modal';var c=document.createElement('div');c.className='ks-card';
  c.innerHTML='<h2>'+t+'</h2><p>'+p+'</p>';btns.forEach(function(x){var b=document.createElement('button');b.textContent=x[0];if(x[2])b.className='ghost';b.onclick=function(){m.remove();x[1]()};c.appendChild(b)});m.appendChild(c);document.body.appendChild(m)}
var lastHp=W.ship?W.ship.hp:300;
var last=performance.now();
var v=new THREE.Vector3();
function step(now){requestAnimationFrame(step);var dt=Math.min((now-last)/1000,.05);last=now;
  if(W.stage==='island'){return}
  // my death
  if(!meDead&&W.over&&W.ship&&W.ship.hp<=0){meDead=true;render();
    modal('غرقت سفينتك','يمكنك متابعة المعركة حتى النهاية أو العودة للميناء',[['متابعة المشاهدة',function(){spectate=true}],['الخروج',exit,1]]);check()}
  var me=W.ship&&W.ship.pos;
  bots.forEach(function(b,i){if(!b.alive)return;var p=b.g.position;
    if(b.remote){var r=remote[b.id];if(r&&r.state){var st=r.state;if(st.alive===false){kill(b,'');return;}if(st.pos){p.set(st.pos.x,st.pos.y,st.pos.z);b.hp=st.hp||b.hp;if(typeof st.yaw==='number')b.g.rotation.y=-st.yaw+Math.PI/2;}}}
    else{
      b.turn-=dt;if(b.turn<=0){b.turn=rnd(1.5,4);b.ty=rnd(0,6.28)}
      var R=Math.hypot(p.x,p.z);if(R>300)b.ty=Math.atan2(-p.z,-p.x);
      var dy=((b.ty-b.yaw+Math.PI)%(6.283)+6.283)%6.283-Math.PI;b.yaw+=Math.max(-1,Math.min(1,dy))*dt*.9;
      p.x+=Math.cos(b.yaw)*14*dt;p.z+=Math.sin(b.yaw)*14*dt;
      try{p.y=waveH(p.x,p.z,W.t||0)*.6}catch(e){}
      b.g.rotation.y=-b.yaw+Math.PI/2;
      // Local NPCs fight each other; human damage is synchronized from Playroom.
      b.cd-=dt;if(b.cd<=0){b.cd=rnd(4,9);var foes=bots.filter(function(o){return o.alive&&o!==b&&!o.remote});
        if(foes.length){var f=foes[(Math.random()*foes.length)|0];f.hp-=rnd(25,60);if(f.hp<=0)kill(f,b.n);}}
    }
    // player missiles
    if(W.missiles)W.missiles.forEach(function(m){if(m.P&&!m.ksHit&&Math.hypot(m.P.x-p.x,m.P.z-p.z)<12&&m.P.y<20){m.ksHit=true;m.life=0;b.hp-=60;try{boom(m.P.clone(),30,8)}catch(e){}if(b.remote){var hit={id:SELF_ID+'-'+(++hitSeq),shooterId:SELF_ID,targetId:b.id,damage:60};hitSeen[hit.id]=true;parent.postMessage({type:'kos-hit',hit:hit},'*');}if(b.hp<=0)kill(b,'أنت')}});
    // name plate
    v.set(p.x,p.y+14,p.z).project(cam);var on=v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1&&Math.hypot(p.x-(me?me.x:0),p.z-(me?me.z:0))<420;
    b.tag.style.display=on?'block':'none';if(on){b.tag.style.left=((v.x+1)/2*innerWidth)+'px';b.tag.style.top=((1-v.y)/2*innerHeight)+'px';b.tag.querySelector('b').style.width=Math.max(0,b.hp/3)+'%'}
  });
  if(spectate){var t=bots.find(function(b){return b.alive});if(t){cam.position.lerp(new THREE.Vector3(t.g.position.x-40,30,t.g.position.z-40),.04);cam.lookAt(t.g.position)}}
}
render();requestAnimationFrame(step);
setInterval(render,1000);
})();
</script>`;
}
