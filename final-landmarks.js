import * as THREE from './vendor/three.module.js';
import {FINAL_LANDMARKS} from './data/final-landmarks.js';
import {heightAt} from './geo.js';
import {buildAscension} from './ascension-landmark.js';
import {getMaterials,paint,box,cylinder,gable,addWindow,arch,finalizeModel} from './architecture-kit.js';

// All geometry is authored in metres inside the surveyed footprint. +Z is the
// principal facade; only the geographic parent rotates. No bounding-box scaling.
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
const period=(y,a,b)=>b>a?smooth((y-a)/(b-a)):Number(y>=b);
const group=name=>{const g=new THREE.Group();g.name=name;return g;};
const M=()=>getMaterials();
function mesh(g,geometry,material,x=0,y=0,z=0){const o=new THREE.Mesh(geometry,material);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
function rod(g,a,b,r,mat){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p),o=mesh(g,new THREE.CylinderGeometry(r,r,d.length(),8),mat);o.position.copy(p).add(q).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
function footprint(g,p,y,h,mat){const s=new THREE.Shape();p.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,steps:1});geo.rotateX(-Math.PI/2);return mesh(g,geo,mat,0,y,0);}
function slicePolygon(p,minX,maxX){let out=p;for(const [v,sign]of[[minX,1],[maxX,-1]]){const next=[];for(let i=0;i<out.length;i++){const a=out[i],b=out[(i+1)%out.length],ia=sign*(a[0]-v)>=0,ib=sign*(b[0]-v)>=0;if(ia)next.push(a);if(ia!==ib){const t=(v-a[0])/(b[0]-a[0]);next.push([v,a[1]+t*(b[1]-a[1])]);}}out=next;}return out;}
function facadeZ(spec,x){const p=spec.localPolygon;let values=[];for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if((a[0]<=x&&b[0]>x)||(b[0]<=x&&a[0]>x)){const t=(x-a[0])/(b[0]-a[0]);values.push(a[1]+t*(b[1]-a[1]));}}return values.length?Math.max(...values):spec.depth*.35;}
function column(g,x,z,y,h,r,mat){cylinder(g,x,y+h/2,z,r,h,mat,14);box(g,x,y+.2,z,r*2.7,.4,r*2.7,mat);box(g,x,y+h-.15,z,r*2.9,.4,r*2.9,mat);}
function facadeWindows(g,spec,x0,x1,rows,base,step,w=2,h=3){for(let x=x0;x<=x1+.01;x+=step){const z=facadeZ(spec,x)+.22;for(let r=0;r<rows;r++)addWindow(g,x,base+r*4.1,z,w,h,{frame:.12,mullions:1});}}
function station(spec){
 const g=group('New station: original1914, classical1939, wings1962'),early=group('1914 Art Nouveau station'),late=group('1939 classical central block'),wings=group('1959–1962 side wings'),extension=group('1995 western addition');g.add(early,late,wings,extension);
 const warm=paint('#e6d4ab','plaster'),trim=M().whiteStone,roof=paint('#526669','metal',{metalness:.25,roughness:.82});
 const coreWidth=103,core=slicePolygon(spec.localPolygon,-coreWidth/2,coreWidth/2);
 footprint(early,core,0,9.5,warm);
 for(const x of[-46,0,46]){const z=facadeZ(spec,x)-3;box(early,x,6.5,z,x===0?16:12,13,6,warm);box(early,x,13.2,z,(x===0?16:12)+1,.5,6.4,trim);if(x===0){addWindow(early,x,7.6,z+3.3,10,9.2,{arched:true,frame:.32,mullions:2});for(const sx of[-6.8,6.8]){box(early,sx,14.2,z+2.6,1.5,2,1.5,trim);rod(early,[sx,15,z+2.6],[sx,18,z+2.6],.08,M().steel);}}}
 for(let x=-38;x<=38;x+=7.6){if(Math.abs(x)<9)continue;const z=facadeZ(spec,x)+.22;addWindow(early,x,5,z,3.3,6.5,{arched:true,frame:.24,mullions:1});box(early,x+3.4,5,z-.1,.45,9.5,.45,trim);}
 box(early,0,9.6,-3,101,.5,24,trim);gable(early,0,9.8,-3,101,3.3,25,roof);
 footprint(late,core,0,15.8,warm);facadeWindows(late,spec,-48,48,2,4.1,6,2.6,3.2);
 const front=facadeZ(spec,0)-1.35;
 for(let x=-31.5;x<=31.5;x+=9)column(late,x,front,1,15.1,.65,trim);
 box(late,0,16.5,front-1,72,1.1,4,trim);box(late,0,17.4,front-1,74,.65,4.8,trim);gable(late,0,17.8,front-1,27,3.2,4,trim);
 for(const sign of[-1,1]){const x=sign*44;box(late,x,16.7,0,14,1.1,31,trim);}
 for(const sign of[-1,1]){const p=slicePolygon(spec.localPolygon,sign<0?-108:52,sign<0?-52:122);if(p.length>2)footprint(wings,p,0,12.6,warm);facadeWindows(wings,spec,sign<0?-103:58,sign<0?-58:116,2,3.8,6.5,2.3,3.1);}
 const p=slicePolygon(spec.localPolygon,-spec.width/2,-108);if(p.length>2)footprint(extension,p,0,13.5,warm);
 Object.assign(g.userData,{early,late,wings,extension});return g;
}
function urgu(spec){
 const g=group('Lenina51 four-storey university building'),stone=paint('#d6c9ac','stone'),trim=M().whiteStone;
 footprint(g,spec.localPolygon,0,18.6,stone);footprint(g,spec.localPolygon,18.6,.5,trim);
 for(const side of[-1,1])facadeWindows(g,spec,side<0?-62:22,side<0?-22:62,4,2.7,5.2,2.1,2.7);
 const z=facadeZ(spec,0),portico=group('Three arches and triangular pediment');g.add(portico);
 box(portico,0,10,z-.9,35,18,1.8,paint('#c4b69b','stone'));
 for(const x of[-11,0,11]){addWindow(portico,x,10,z+.26,8.1,13.8,{arched:true,frame:.4,mullions:2});arch(portico,x,10,z+.32,9.5,14.8,.45,trim);}
 for(const x of[-17,-5.6,5.6,17])column(portico,x,z-.1,1.5,17.6,.83,trim);
 box(portico,0,19.5,z-1.4,38,1.2,4.2,trim);gable(portico,0,20.1,z-1.5,38,4.9,4.2,trim);
 // Roof/parapet remains below the distinctive pediment; no false UPI colonnade.
 box(g,0,19.35,-7,123,.6,12,paint('#526359','metal',{metalness:.2,roughness:.82}));
 for(const x of[-60,-40,40,60]){const fz=facadeZ(spec,x);for(const y of[4.4,8.5,12.6,17.6])box(g,x,y,fz-.14,13,.32,.3,trim);}
 return g;
}
function tyuz(spec){
 const g=group('TYUZ 1977 foyer, relief and theatre masks'),white=paint('#e1e0d4','stone'),dark=M().glassDark;
 footprint(g,spec.localPolygon,0,10.5,white);footprint(g,spec.localPolygon,10.5,.55,white);
 // The stage house is at the rear, not a giant tower over the main entrance.
 box(g,0,16.7,-spec.depth*.20,35,12.6,30,paint('#d9d9d2','stone'));
 const z=facadeZ(spec,0)-.1;
 box(g,0,3.7,z+.35,42,6.4,.35,dark);box(g,-6.7,8.5,z,28.5,5, .3,M().glass);
 for(let x=-20;x<=6;x+=2.7)box(g,x,8.4,z+.18,.12,4.7,.24,M().steel);
 for(const y of[6.3,8.5,10.6])box(g,-6.7,y,z+.2,28.5,.12,.3,M().steel);
 for(let x=-20;x<=20;x+=5.5)box(g,x,3.3,z+.35,.65,6.5,.8,white);
 box(g,13.8,8.6,z+.05,10.8,5.1,.7,paint('#b9b6a4','stone'));
 // Cast concrete relief, represented by an irregular relief of masks and figures.
 for(let i=0;i<18;i++){const x=9.5+(i%6)*1.7,y=7+Math.floor(i/6)*1.6;const o=mesh(g,new THREE.DodecahedronGeometry(.65,0),white,x,y,z+.53);o.scale.set(.65,1,.3);o.rotation.z=Math.sin(i)*.4;}
 const poleX=-20.7,poleZ=z-.25;
 for(const dx of[0,1.4]){rod(g,[poleX+dx,0,poleZ],[poleX+dx,20,poleZ],.085,M().gold);const mask=mesh(g,new THREE.SphereGeometry(1.05,12,10),M().gold,poleX+dx,16+dx*1.4,poleZ);mask.scale.set(.74,1,.18);for(const ex of[-.23,.23])mesh(g,new THREE.SphereGeometry(.09,8,6),dark,poleX+dx+ex,16.2+dx*1.4,poleZ+.2);box(g,poleX+dx,15.65+dx*1.4,poleZ+.2,.4,.08,.08,dark);}
 return g;
}
function loftRing(g,p,y0,y1,s0,s1,mat){const pos=[],idx=[];for(let i=0;i<p.length;i++){const [x,z]=p[i];pos.push(x*s0,y0,z*s0,x*s1,y1,z*s1);const j=(i+1)%p.length;idx.push(i*2,i*2+1,j*2,j*2,i*2+1,j*2+1);}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();return mesh(g,geo,mat);}
function arena(spec){
 const g=group('UGMK Arena: bronze elliptical louvered shell'),p=spec.localPolygon,bronze=paint('#897557','metal',{metalness:.72,roughness:.42}),glass=M().glassDark;
 loftRing(g,p,0,9,.78,.83,glass);loftRing(g,p,8,38,.83,.982,paint('#403e37','metal',{metalness:.5,roughness:.65}));
 for(let i=0;i<15;i++){const y=9+i*1.9,s=.835+(y-9)/29*.148;loftRing(g,p,y,y+1.2,s,s+.006,bronze);}
 for(let i=0;i<p.length;i++){const a=p[i];rod(g,[a[0]*.785,0,a[1]*.785],[a[0]*.831,8.9,a[1]*.831],.18,M().steel);}
 footprint(g,p.map(([x,z])=>[x*.982,z*.982]),38,.65,paint('#bbb7ad','metal',{roughness:.78}));
 footprint(g,p.map(([x,z])=>[x*.9,z*.9]),38.65,1.35,paint('#a8aaa6','metal',{metalness:.18,roughness:.84}));
 const front=spec.depth*.395;for(const x of[-32,-16,0,16,32]){box(g,x,3.1,front,12,5.8,.45,M().glass);for(const dx of[-4,0,4])box(g,x+dx,3.1,front+.25,.16,5.8,.25,M().steel);}
 return g;
}
function tower(spec){
 const g=group('Unfinished concrete TV tower, 220m; no antenna'),concrete=paint('#aeb2ae','concrete',{roughness:.96}),segments=[];
 // Unfinished hollow shaft. Separate concrete lifts enable deterministic staged
 // demolition without shrinking a completed building into the ground.
 for(let i=0;i<44;i++){const y=i*5,r0=9.7-5.5*i/44,r1=9.7-5.5*(i+1)/44,part=group('Concrete lift '+i);part.userData.dynamic=true;part.position.y=y;
 const geo=new THREE.CylinderGeometry(r1,r0,5,36,1,true);mesh(part,geo,concrete,0,2.5,0);const inner=new THREE.CylinderGeometry(Math.max(.6,r1-.6),Math.max(.6,r0-.6),5,36,1,true);const inMat=paint('#666c68','concrete',{side:THREE.BackSide});mesh(part,inner,inMat,0,2.5,0);
 const lip=new THREE.Mesh(new THREE.RingGeometry(Math.max(.6,r1-.6),r1,36),concrete);lip.rotation.x=-Math.PI/2;lip.position.y=5;part.add(lip);
 for(let j=0;j<8;j++){const a=j*Math.PI/4;const seam=box(part,Math.cos(a)*(r0+.015),2.5,Math.sin(a)*(r0+.015),.055,4.9,.08,paint('#858d86','concrete'));seam.rotation.y=-a;}
 g.add(part);segments.push(part);
 }
 g.userData.segments=segments;return g;
}
function clipMaterials(object,plane){const map=new Map();object.traverse(o=>{if(!o.isMesh||!o.material)return;const clone=m=>{if(!map.has(m)){const c=m.clone();c.onBeforeCompile=m.onBeforeCompile;c.customProgramCacheKey=m.customProgramCacheKey;c.clippingPlanes=[plane];c.clipShadows=true;map.set(m,c);}return map.get(m);};o.material=Array.isArray(o.material)?o.material.map(clone):clone(o.material);});return map;}
function worksite(spec,ground){const g=group(spec.key+' construction perimeter'),m=M(),w=spec.key==='stationModern'?103:spec.width,d=spec.depth;const y=.15;
 for(const sign of[-1,1]){box(g,0,y,sign*d*.47,w*.92,.18,.8,m.wood);box(g,sign*w*.47,y,0,.8,.18,d*.92,m.wood);}
 if(spec.key==='ascension'||spec.key==='stationModern'){
  const timber=group('Period timber scaffolding and manual lifting winch');g.add(timber);
  const stationSite=spec.key==='stationModern',sx=stationSite?53.5:8.3,levels=stationSite?[3,6,9]:[5.5,11,16.5],sh=stationSite?10.5:18,zh=stationSite?18:12,zc=stationSite?0:-1;
  for(const side of[-1,1]){
   for(const z of[-zh,-zh/3,zh/3,zh].map(v=>v+zc)){rod(timber,[side*sx,0,z],[side*sx,sh,z],.16,m.wood);rod(timber,[side*(sx+1.8),0,z],[side*(sx+1.8),sh,z],.16,m.wood);}
   for(const y of levels){box(timber,side*(sx+.9),y,zc,2.5,.2,zh*2+1,m.wood);for(let z=zc-zh;z<zc+zh;z+=zh*2/3)rod(timber,[side*(sx+1.8),y-levels[0],z],[side*(sx+1.8),y,z+zh*2/3],.10,m.wood);}
  }
  const x=-sx-2.5,z=-10,h=sh+4;rod(timber,[x-2,0,z],[x,h,z],.22,m.wood);rod(timber,[x+2,0,z],[x,h,z],.22,m.wood);rod(timber,[x-1,h-1,z],[x+6,h-1,z],.20,m.wood);rod(timber,[x,h,z],[x+6,h-1,z],.065,m.black);rod(timber,[x+5,h-1,z],[x+5,h*.5,z],.045,m.black);
  box(timber,x+5,h*.5-.3,z,1.1,.7,1,m.wood);const drum=cylinder(timber,x,1.4,z,.4,1.4,m.wood,12);drum.rotation.z=Math.PI/2;rod(timber,[x-1.1,1.4,z],[x-1.1,2.2,z],.07,m.wood);
  return g;
 }
 const crane=group('Tower crane');g.add(crane);const cx=-w*.42,cz=-d*.35,h=Math.min(50,Math.max(18,spec.height*.65));
 for(const dx of[-.6,.6])for(const dz of[-.6,.6])rod(crane,[cx+dx,0,cz+dz],[cx+dx,h,cz+dz],.12,m.steel);
 for(let y=0;y<h;y+=4){rod(crane,[cx-.6,y,cz-.6],[cx+.6,Math.min(h,y+4),cz-.6],.09,m.steel);rod(crane,[cx+.6,y,cz+.6],[cx-.6,Math.min(h,y+4),cz+.6],.09,m.steel);}
 rod(crane,[cx-w*.15,h,cz],[cx+w*.42,h,cz],.24,m.gold);rod(crane,[cx,h+3,cz],[cx+w*.42,h,cz],.09,m.steel);rod(crane,[cx+w*.3,h,cz],[cx+w*.3,h*.4,cz],.055,m.black);return g;
}
export function installFinalLandmarks(world){
 if(world.finalLandmarks)return world.finalLandmarks;
 const root=group('Final researched landmarks'),items=new Map(),targets={},stats={objects:6,newObjects:4,reusedBackground:2,units:'metres',deterministic:true};world.group.add(root);let active=false;
 for(const spec of FINAL_LANDMARKS){
  const old=world.landmarks?.background?.items.get(spec.key);if(old){old.delegated=true;old.group.visible=false;old.group.removeFromParent();}
  const samples=spec.polygon.map(([x,z])=>heightAt(spec.x+x,spec.z+z)).sort((a,b)=>a-b),ground=samples.at(-1)+.08;
  const pose=group(spec.key+' geographic pose');pose.position.set(spec.x,ground,spec.z);pose.rotation.y=spec.azimuth;root.add(pose);
  const model={stationModern:station,universityUrgu:urgu,tyuz,ugmkArena:arena,tvTower:tower,ascension:buildAscension}[spec.key](spec),plane=new THREE.Plane(new THREE.Vector3(0,-1,0),ground);pose.add(model);
  finalizeModel(model);const materials=clipMaterials(model,plane),site=worksite(spec,ground);pose.add(site);pose.visible=false;
  items.set(spec.key,{key:spec.key,spec,group:pose,model,plane,ground,materials,site,growth:0,demolition:0});targets[spec.key]=[spec.x,ground+(spec.key==='tvTower'?110:spec.height*.48),spec.z];
 }
 const stationItem=items.get('stationModern');targets.stationModernEarly=[stationItem.spec.x,stationItem.ground+8,stationItem.spec.z];
 Object.assign(world.targets,targets);
 const progress=(s,key,fallback)=>Number.isFinite(s.constructionProgress?.[key])?clamp(s.constructionProgress[key]):fallback;
 function update(state){const year=Number(state.calendarYear??state.year??1722);active=false;
  for(const item of items.values()){
   const {spec,model}=item;let growth=progress(state,spec.key,period(year,spec.startYear,spec.endYear));
   let demolition=Number.isFinite(state.demolitionProgress?.[spec.key])?clamp(state.demolitionProgress[spec.key]):spec.removedYear?period(year,spec.removedYear,spec.removedYear+.6):0;
   const eventId=spec.eventId??{stationModern:62,universityUrgu:64,tyuz:66,tvTower:67,ugmkArena:69}[spec.key],siteActive=state.eventId===eventId&&growth<1;
   item.growth=growth;item.demolition=demolition;item.group.visible=(growth>0||siteActive)&&demolition<1;model.visible=growth>0;item.site.visible=growth<1&&(growth>0||siteActive);item.plane.constant=item.ground+spec.height*growth+.025;
   if(spec.key==='stationModern'){
    const d=model.userData,klass=progress(state,'stationModernClassical',period(year,1936,1939)),wings=progress(state,'stationModernWings',period(year,1959,1962)),ext=progress(state,'stationModernExtension',period(year,1993,1995));
    d.early.visible=klass<1;d.late.visible=klass>0;d.wings.visible=wings>0;d.extension.visible=ext>0;
    // Stage clipping is local to these groups and never reveals the full modern
    // station during the original 1914 construction scene.
    for(const [part,key,p,h]of[[d.late,'classical',klass,21],[d.wings,'wings',wings,13],[d.extension,'extension',ext,14]]){
     if(!item[key+'Plane']){item[key+'Plane']=new THREE.Plane(new THREE.Vector3(0,-1,0),0);clipMaterials(part,item[key+'Plane']);}
     item[key+'Plane'].constant=item.ground+h*Math.min(growth,p)+.025;active||=p>0&&p<1&&growth>0;
    }
   }
   if(spec.key==='ascension'){
    const lateProgress=period(year,1837,1890);model.userData.late.visible=lateProgress>0;model.userData.bellEarly.visible=year<1890;model.userData.bellLate.visible=year>=1890;
    if(!item.latePlane){item.latePlane=new THREE.Plane(new THREE.Vector3(0,-1,0),0);clipMaterials(model.userData.late,item.latePlane);}
    item.latePlane.constant=item.ground+19*Math.min(growth,lateProgress)+.025;
   }
   if(spec.key==='tvTower'){
    const parts=model.userData.segments;for(let i=0;i<parts.length;i++){const p=parts[i],cut=(parts.length-i)/parts.length,collapse=clamp((demolition-(cut-.08))/.08);
     p.visible=demolition<cut;p.position.y=i*5-(demolition>0?collapse*collapse*7:0);
     p.rotation.z=demolition>0?Math.sin(i*1.7)*collapse*.08:0;
    }
   }
   active||=item.group.visible&&(growth<1||demolition>0);
  }
 }
 const api={group:root,items,targets,stats,update,get hasActiveConstruction(){return active;}};world.finalLandmarks=api;return api;
}
