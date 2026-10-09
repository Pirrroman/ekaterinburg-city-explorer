import * as THREE from './vendor/three.module.js';
import { URBAN } from './assets/geography/urban-data.js';
import { GEO, project, heightAt, pointInside } from './geo.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const UNIT_BOX=new THREE.BoxGeometry(1,1,1);
function pathOf(points){let total=0;const d=[0];for(let i=1;i<points.length;i++){total+=Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]);d.push(total);}return{points,d,total};}
function sample(path,d){d=clamp(d,0,path.total);let i=1;while(i<path.d.length-1&&path.d[i]<d)i++;const a=path.points[i-1],b=path.points[i],t=(d-path.d[i-1])/Math.max(.001,path.d[i]-path.d[i-1]);return{x:mix(a[0],b[0],t),z:mix(a[1],b[1],t),angle:Math.atan2(b[0]-a[0],b[1]-a[1])};}
function nearestDistance(path,x,z){let best=Infinity,distance=0;for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);if(d<best){best=d;distance=mix(path.d[i-1],path.d[i],t);}}return distance;}
function overlayMaterial(color){return new THREE.MeshBasicMaterial({color,depthTest:false,depthWrite:false});}
function cube(group,x,y,z,w,h,d,mat){const m=new THREE.Mesh(UNIT_BOX,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.renderOrder=100;group.add(m);return m;}
function label(text,color='#f2edcc'){
  if(typeof document==='undefined')return new THREE.Group();
  const c=document.createElement('canvas');c.width=1024;c.height=128;const q=c.getContext('2d');q.fillStyle='rgba(13,33,40,.94)';q.fillRect(0,0,1024,128);q.strokeStyle=color;q.lineWidth=7;q.strokeRect(4,4,1016,120);q.font='600 47px Arial';q.textAlign='center';q.textBaseline='middle';q.fillStyle=color;q.fillText(text,512,65,980);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false,depthWrite:false}));s.renderOrder=120;s.scale.set(350,44,1);const worldPoint=new THREE.Vector3(),viewPoint=new THREE.Vector3(),screenPoint=new THREE.Vector3(),worldScale=new THREE.Vector3();s.onBeforeRender=(renderer,scene,camera)=>{s.getWorldPosition(worldPoint);viewPoint.copy(worldPoint).applyMatrix4(camera.matrixWorldInverse);screenPoint.copy(worldPoint).project(camera);s.getWorldScale(worldScale);const depth=-viewPoint.z,halfX=worldScale.x*camera.projectionMatrix.elements[0]/(2*depth),halfY=worldScale.y*camera.projectionMatrix.elements[5]/(2*depth);const safe=depth>0&&screenPoint.x-halfX>-.96&&screenPoint.x+halfX<.96&&screenPoint.y-halfY>-.57&&screenPoint.y+halfY<.65;s.material.opacity=safe?1:0;s.userData.viewportSafe=safe;};return s;
}

const airportPolys=URBAN.airport.terminals.map(t=>t.p);
const academicBounds=URBAN.akademichesky.bounds;
function academicContains(x,z){const a=project(academicBounds[0],academicBounds[3]),b=project(academicBounds[2],academicBounds[1]);return x>a[0]&&x<b[0]&&z>a[1]&&z<b[1];}
export function urbanManagedBuilding(b){return b.id===482197424||airportPolys.some(p=>pointInside(b.x,b.z,p));}
export function urbanForestDate(x,z){if(URBAN.uralmash&&pointInside(x,z,URBAN.uralmash.p))return URBAN.uralmash.clearYear;if(academicContains(x,z))return 2006;for(const f of URBAN.factories)if(pointInside(x,z,f.p))return f.year-.8;return null;}
export function prepareUrbanData(){
  for(const b of GEO.buildings){
    if(b.id===166197685){b.year=2017;b.style='contemporary';b.ageSource='operator-history';b.ageRule='Greenwich current complete outline after January 2017 reconstruction; first gallery opened October 2004';b.sourceDate='2017';b.sourceUrl='https://grinvich.com/about/';}

    if(academicContains(b.x,b.z)&&b.ageSource==='model-period'){const first=URBAN.akademichesky.firstIds.slice(0,3).indexOf(b.id);b.year=first>=0?2009.01+first*.012:2009.8+(b.id%150)/10;b.style='contemporary';b.ageRule=first>=0?'First three houses completed 30 June 2009; construction reveal begins 0.45 years earlier':'Akademichesky development after 2009, phased model estimate';if(first>=0){b.completed=URBAN.akademichesky.firstCompleted;b.ageSource='developer-completion';}}
  }
  // Modern OSM pavement is not a historical plan. Retain only the documented runway milestone in 2009.
  const airNetwork=new Map(URBAN.airport.network.map(r=>[r.id,r.type]));
  for(const r of GEO.roads){const p=r.p[Math.floor(r.p.length/2)];if(!airNetwork.has(r.id)||p[0]<9500||p[0]>14500||p[1]<8700||p[1]>12100)continue;const type=airNetwork.get(r.id);if(type==='terminal')continue;r.year=type==='runway'?(r.id===1380068040?2009.45:2017):2018+(r.id%25)/10;r.ageSource='airport-milestone-model';}
  const ekad=new Map(URBAN.ekad.roads.map(r=>[r.id,r]));
  for(const r of GEO.roads){if(academicContains(...r.p[Math.floor(r.p.length/2)])&&!/Краснолесья/.test(r.name||''))r.year=Math.max(r.year,2006);if(ekad.has(r.id)){const e=ekad.get(r.id);r.year=e.last?2022.68493:Math.max(1994,r.year);r.urbanLastRing=e.last;}if([35102521,95432242,174717774,997962419].includes(r.id))r.urbanManaged=true;}
}

function solid(color){return new THREE.MeshStandardMaterial({color,roughness:.72,metalness:.04});}
function solidBox(group,x,y,z,w,h,d,mat){const m=new THREE.Mesh(UNIT_BOX,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
function footprint(group,p,y,h,mat){const shape=new THREE.Shape(p.map(q=>new THREE.Vector2(q[0],-q[1]))),geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1});geo.rotateX(-Math.PI/2);const m=new THREE.Mesh(geo,mat);m.position.y=y;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
function centerOf(p){return[p.reduce((a,q)=>a+q[0],0)/p.length,p.reduce((a,q)=>a+q[1],0)/p.length];}
function pipe(group,x,z,y,h,r,color){const m=new THREE.Mesh(new THREE.CylinderGeometry(r*.8,r,h,12),solid(color));m.position.set(x,y+h/2,z);m.castShadow=true;group.add(m);return m;}
function crane(group,x,z,base){const g=new THREE.Group(),m=solid('#c99439');g.position.set(x,base,z);solidBox(g,0,20,0,1.5,40,1.5,m);solidBox(g,9,40,0,32,1.5,1.5,m);solidBox(g,23,31,0,.16,18,.16,m);solidBox(g,-9,38,0,5,3,3,m);group.add(g);return g;}
function paving(group,points,width,color){
  const vertices=[];
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/len*width/2,nz=(b[0]-a[0])/len*width/2,steps=Math.ceil(len/20);for(let j=0;j<steps;j++){const at=(t,side)=>{const x=mix(a[0],b[0],t)+nx*side,z=mix(a[1],b[1],t)+nz*side;return[x,heightAt(x,z)+.96,z]},p=at(j/steps,-1),q=at(j/steps,1),r=at((j+1)/steps,1),s=at((j+1)/steps,-1);vertices.push(...p,...q,...r,...p,...r,...s);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();const material=solid(color);material.side=THREE.DoubleSide;const mesh=new THREE.Mesh(geometry,material);mesh.receiveShadow=true;group.add(mesh);return mesh;
}

export function createUrbanExpansion(){
  const group=new THREE.Group();group.name='Dated urban expansion and underground-line diagram';
  const targets={},labels=[],stages=[],construction=[],eventLabels=[],metroGroup=new THREE.Group();group.add(metroGroup);
  function stage(g,start,end,bottom,top,death=9999,key=null,range=[0,1]){const plane=new THREE.Plane(new THREE.Vector3(0,-1,0),bottom);g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.clippingPlanes=[plane];o.material.clipShadows=true;}});stages.push({g,start,end,bottom,top,death,plane,key,range});return g;}
  for(const f of URBAN.factories){
    const focus=centerOf(f.halls.slice(0,3).map(h=>[h.x,h.z]));targets[f.key]=[focus[0],heightAt(...focus)+18,focus[1]];
    for(let i=0;i<f.halls.length;i++){const h=f.halls[i],g=new THREE.Group(),y=Math.max(...h.p.map(p=>heightAt(...p)))+.3,start=f.year+i*.12,end=start+.6,body=GEO.buildings.find(b=>b.id===h.id),death=body?.year||1980;group.add(g);footprint(g,h.p,y-3,18,solid(['#956d4e','#ab7955','#b89062'][i%3]));footprint(g,h.p,y+15,.65,solid('#69736a'));
      for(let j=1;j<h.p.length;j++){const a=h.p[j-1],b=h.p[j],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<12)continue;const win=solidBox(g,(a[0]+b[0])/2,y+9,(a[1]+b[1])/2,length*.78,3,.32,solid('#586f6c'));win.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);}
      // Repeated roof lights make these industrial halls legible at the real plot scale.
      const edge=h.p.slice(1).map((b,j)=>({a:h.p[j],b,len:Math.hypot(b[0]-h.p[j][0],b[1]-h.p[j][1])})).sort((a,b)=>b.len-a.len)[0];
      if(edge){const ux=(edge.b[0]-edge.a[0])/edge.len,uz=(edge.b[1]-edge.a[1])/edge.len;for(const offset of[-14,0,14]){const x=h.x-uz*offset,z=h.z+ux*offset,len=Math.min(64,edge.len*.65);if([-1,1].every(sign=>pointInside(x+ux*len*.5*sign,z+uz*len*.5*sign,h.p))){const light=solidBox(g,x,y+17,z,len,3.1,4.5,solid('#88a2a0'));light.rotation.y=-Math.atan2(uz,ux);const cap=solidBox(g,x,y+18.8,z,len+1,.5,5.4,solid('#a8aaa0'));cap.rotation.y=light.rotation.y;}}}
      pipe(g,h.x+13,h.z+8,y,35,2.0,'#89674e');pipe(g,h.x-8,h.z+5,y,22,1.4,'#827a68');stage(g,start,end,y-3,y+35,death,f.key,[i*.14,.4+i*.15]);
    }
    const c=crane(group,focus[0]+65,focus[1]+40,heightAt(focus[0]+65,focus[1]+40));construction.push({g:c,start:f.year-.15,end:f.year+1.15,key:f.key});
  }
  for(const t of URBAN.airport.terminals){const g=new THREE.Group(),c=centerOf(t.p),y=heightAt(...c);group.add(g);footprint(g,t.p,y,16,solid('#607f89'));footprint(g,t.p,y+16,.9,solid('#c1c5bd'));for(let i=1;i<t.p.length;i++){const a=t.p[i-1],b=t.p[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<15)continue;const band=solidBox(g,(a[0]+b[0])/2,y+9,(a[1]+b[1])/2,len,.65,.7,solid('#d8ddd3'));band.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);}const minX=Math.min(...t.p.map(p=>p[0])),maxX=Math.max(...t.p.map(p=>p[0])),south=Math.max(...t.p.map(p=>p[1]));for(let i=1;i<=3;i++){const x=mix(minX,maxX,i/4);solidBox(g,x,y+5,south+17,8,4,34,solid('#aab4b2'));solidBox(g,x,y+5,south+35,12,5,8,solid('#d3d7ce'));}stage(g,t.start,t.end,y,y+18,9999,'airportModern',t.id===14224085?[0,.55]:[.3,1]);}
  const terminalCenter=centerOf(URBAN.airport.terminals.flatMap(t=>t.p));targets.airportModern=[terminalCenter[0],heightAt(...terminalCenter)+18,terminalCenter[1]];
  // The operator documents a 1 km hard runway in 1941. Its exact historic ends are unknown;
  // show a compact reconstruction on the measured northern runway axis, not the 2026 apron.
  const runway=pathOf(URBAN.airport.oldRunway),mid=runway.total*.58;
  const airPhase=(name,start,end,draw)=>{const g=new THREE.Group();g.name=name;group.add(g);draw(g);construction.push({g,start,end});};
  const strip=(g,length,width,color)=>{const a=sample(runway,mid-length/2),b=sample(runway,mid+length/2);paving(g,[[a.x,a.z],[b.x,b.z]],width,color);};
  airPhase('1941 compact reconstructed airfield',1941,2003,g=>strip(g,1000,32,'#6b6c60'));
  const oldTerminal=project(60.806413,56.750142);
  airPhase('1954 compact apron reconstruction',1954,2018,g=>{paving(g,[[oldTerminal[0]-80,oldTerminal[1]+86],[oldTerminal[0]+90,oldTerminal[1]+86]],100,'#83867a');paving(g,[[oldTerminal[0]+50,oldTerminal[1]+110],[oldTerminal[0]+50,10448]],16,'#74796c');});
  airPhase('Pre-extension northern runway',2003,2009.45,g=>strip(g,2500,45,'#4b5350'));
  airPhase('Terminal reconstruction limited apron',2007.8,2018,g=>{paving(g,[[11920,10000],[12325,10000]],145,'#85897c');paving(g,[[12190,10055],[12190,10448]],20,'#70776e');});
  const a=URBAN.akademichesky.center;targets.akademichesky=[a[0],heightAt(...a)+35,a[1]];const firstHouses=URBAN.akademichesky.firstIds.slice(0,3).map(id=>GEO.buildings.find(b=>b.id===id)).filter(Boolean),firstCenter=centerOf(firstHouses.map(b=>[b.x,b.z]));targets.akademicheskyFirst=[firstCenter[0],heightAt(...firstCenter)+18,firstCenter[1]];for(const id of URBAN.akademichesky.firstIds.slice(0,4)){const b=GEO.buildings.find(b=>b.id===id);if(!b)continue;const c=crane(group,b.x+35,b.z+25,heightAt(b.x+35,b.z+25));construction.push({g:c,start:2007.2,end:b.year+.45,key:URBAN.akademichesky.firstIds.slice(0,3).includes(id)?'akademichesky':null});}
  // One continuous deck per carriageway. Earlier 24 m fragments each had an
  // independent clipping ceiling and the east deck was displaced west: the
  // resulting gaps looked like a collapsing bridge. Coordinates now follow OSM.
  const bridge=URBAN.bridge,p0=bridge.p[0],p1=bridge.p.at(-1),dx=p1[0]-p0[0],dz=p1[1]-p0[1],length=Math.hypot(dx,dz),nx=-dz/length,nz=dx/length,deckY=Math.max(7.5,heightAt(...p0)+1,heightAt(...p1)+1),bridgeCenter=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2];
  targets.makarovBridge=[bridgeCenter[0]-nx*11,deckY+1,bridgeCenter[1]-nz*11];
  const bridgeParts=[];
  // Subpixel hard-edged boxes flicker at this wide film angle. Wide transparent
  // quads retain the physical paint width, with derivative-based edge coverage.
  const bridgeMarkQuad=new THREE.PlaneGeometry(2,1);bridgeMarkQuad.rotateX(-Math.PI/2);
  const markingMaterial=(color,halfWidth,length)=>new THREE.ShaderMaterial({
    uniforms:{ink:{value:new THREE.Color(color)},halfWidth:{value:halfWidth},lineLength:{value:length}},
    transparent:true,depthWrite:false,depthTest:true,clipping:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,
    vertexShader: `varying vec2 vMarkUv;
#include <clipping_planes_pars_vertex>
void main(){vMarkUv=uv;vec4 mvPosition=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mvPosition;
#include <clipping_planes_vertex>
}`,
    fragmentShader: `uniform vec3 ink;uniform float halfWidth;uniform float lineLength;varying vec2 vMarkUv;
#include <clipping_planes_pars_fragment>
void main(){
#include <clipping_planes_fragment>
float across=abs(vMarkUv.x-.5)*2.0;float aa=max(fwidth(across),.001);float coverage=1.0-smoothstep(halfWidth-aa,halfWidth+aa,across);float end=min(vMarkUv.y,1.0-vMarkUv.y)*lineLength;coverage*=smoothstep(0.0,max(fwidth(end),.003),end);gl_FragColor=vec4(ink,coverage);
#include <colorspace_fragment>
}`
  });
  function roadPaint(parent,x,y,z,length,material){const mesh=new THREE.Mesh(bridgeMarkQuad,material);mesh.position.set(x,y,z);mesh.scale.z=length;mesh.renderOrder=2;mesh.castShadow=mesh.receiveShadow=false;mesh.name='Antialiased bridge road marking';parent.add(mesh);return mesh;}

  function bridgeHalf(name,offset,width,start,end,death,range,old=false){
    const g=new THREE.Group();g.name=name;g.position.set(bridgeCenter[0]+nx*offset,0,bridgeCenter[1]+nz*offset);g.rotation.y=Math.atan2(dx,dz);group.add(g);
    const concrete=solid('#b4b4aa'),asphalt=solid('#4c585b'),edge=solid('#dfded1');
    // Complete reinforced beams bridge the piers; neighbouring pieces overlap at
    // joints, and all meshes share a single horizontal construction plane.
    solidBox(g,0,deckY-.45,0,width,1.5,length+.8,concrete);
    solidBox(g,0,deckY+.4,0,width-1.1,.22,length+.8,asphalt);
    for(const z of[-length*.5,-length*.32,-length*.1,length*.13,length*.35,length*.5]){
      const worldX=bridgeCenter[0]+Math.sin(g.rotation.y)*z+nx*offset,worldZ=bridgeCenter[1]+Math.cos(g.rotation.y)*z+nz*offset;
      const base=Math.min(-1,heightAt(worldX,worldZ)-.8),top=deckY-1.1;
      for(const side of[-1,1])solidBox(g,side*width*.28,(base+top)/2,z,1.7,top-base,3.4,concrete);
      solidBox(g,0,deckY-1.2,z,width*.82,1.2,4.5,concrete);
    }
    for(const side of[-1,1]){
      // Omit the internal barrier where the two modern halves meet.
      if(!old&&((offset===0&&side===1)||(offset<0&&side===-1)))continue;
      solidBox(g,side*(width/2-.32),deckY+.76,0,.24,.62,length,edge);
      solidBox(g,side*(width/2-.32),deckY+1.22,0,.11,.1,length,edge);
      for(let z=-length/2;z<length/2;z+=5)solidBox(g,side*(width/2-.32),deckY+1.02,z,.1,.55,.1,edge);
    }
    const paint=markingMaterial('#d8d9c9',.08,6);for(const x of[-3.5,3.5])for(let z=-length/2+5;z<length/2-5;z+=13)roadPaint(g,x,deckY+.59,z,6,paint);
    stage(g,start,end,-1,deckY+1.5,death,old?null:'makarovBridge',range);
    if(old)stages.at(-1).replacedBy='makarovBridge';
    bridgeParts.push({name,g,offset,width,length,deckY,range,old});
    return g;
  }
  // +normal points west; the other OSM carriageway lies EAST, hence -22 m.
  bridgeHalf('Makarov historical continuous crossing',0,22,1954,1959,2019.1,[0,1],true);
  bridgeHalf('Makarov eastern continuous deck',-22,22,2017,2019.05,9999,[0,.47]);
  bridgeHalf('Makarov western continuous deck',0,22,2019.05,2021.8301,9999,[.52,.97]);
  // Rails run on the real surveyed tram alignment between road lanes.
  for(const offset of[-9.5,-13.5])for(const gauge of[-.76,.76]){
    const parent=bridgeParts[1].g,relative=-(offset-bridgeParts[1].offset)+gauge;
    const rail=roadPaint(parent,relative,deckY+.61,0,length,markingMaterial('#afb8ac',.045,length));rail.name='Antialiased bridge tram rail';rail.material.clippingPlanes=[stages.find(s=>s.g===parent).plane];
  }
  // Grade the final 24 m into both banks, so a level deck joins sloping roads.
  for(const part of bridgeParts){for(const sign of[-1,1]){
    const g=new THREE.Group();g.name=part.name+' bank approach';group.add(g);const verts=[];
    for(let j=0;j<6;j++){
      const row=t=>{const along=sign*(length/2+24*t),x=bridgeCenter[0]+dx/length*along+nx*part.offset,z=bridgeCenter[1]+dz/length*along+nz*part.offset,y=mix(deckY+.51,heightAt(x,z)+.99,t);return[-1,1].map(side=>[x+nx*side*part.width/2,y,z+nz*side*part.width/2]);},a=row(j/6),b=row((j+1)/6);verts.push(...a[0],...a[1],...b[1],...a[0],...b[1],...b[0]);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.computeVertexNormals();const mat=solid('#56615f');mat.side=THREE.DoubleSide;g.add(new THREE.Mesh(geo,mat));
    const source=stages.find(s=>s.g===part.g);stage(g,source.start,source.end,-1,deckY+1.5,source.death,source.key,source.range);if(part.old)stages.at(-1).replacedBy='makarovBridge';
  }}
  const bridgeCrane=crane(group,bridgeCenter[0]-nx*38,bridgeCenter[1]-nz*38,deckY);
  const platformMaterial=solid('#9d9e90');solidBox(bridgeCrane,0,-.35,0,9,.7,9,platformMaterial);for(const x of[-3.4,3.4])for(const z of[-3.4,3.4])solidBox(bridgeCrane,x,-(deckY+2)/2,z,.8,deckY+2,.8,platformMaterial);
  construction.push({g:bridgeCrane,start:2017,end:2021.8301,key:'makarovBridge'});
  const last=URBAN.ekad.roads.filter(r=>r.last),ringPoints=last.flatMap(r=>r.p),ringCenter=centerOf(ringPoints);targets.ekad=[ringCenter[0],heightAt(...ringCenter)+15,ringCenter[1]];
  // Earthworks advance along the measured closing section; the dated asphalt is drawn by world.js.
  for(const r of last){for(let i=1;i<r.p.length;i++){const a=r.p[i-1],b=r.p[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<25)continue;const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,g=new THREE.Group();g.position.set(x,heightAt(x,z)+.25,z);g.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);solidBox(g,0,0,0,21,.25,len,solid('#a88f5b'));group.add(g);construction.push({g,start:2019+(r.id%20)/10,end:2022.68493,key:'ekad'});}}
  const raw=URBAN.metro.line.map(p=>project(...p));if(raw[0][1]>raw.at(-1)[1])raw.reverse();
  const path=pathOf(raw),stations=URBAN.metro.stations.map(s=>{const[x,z]=project(s.lon,s.lat);return{...s,x,z,d:nearestDistance(path,x,z)};});
  const bedMat=overlayMaterial('#123e43'),railMat=overlayMaterial('#79c9af'),platformMat=overlayMaterial('#d5c39a'),trainMat=overlayMaterial('#3d899c'),glassMat=overlayMaterial('#183a4b'),roofMat=overlayMaterial('#c4cec7');
  const segments=[];
  for(let d=0;d<path.total;d+=30){const a=sample(path,d),b=sample(path,Math.min(path.total,d+30)),m=new THREE.Group(),x=(a.x+b.x)/2,z=(a.z+b.z)/2,len=Math.hypot(b.x-a.x,b.z-a.z);m.position.set(x,heightAt(x,z)+45,z);m.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);cube(m,0,0,0,15,.9,len,bedMat);for(const off of[-4.5,-3,3,4.5])cube(m,off,1,0,.3,.3,len,railMat);metroGroup.add(m);segments.push({group:m,d:d+15});}
  for(const s of stations){const p=sample(path,s.d),m=new THREE.Group();m.position.set(p.x,heightAt(p.x,p.z)+45,p.z);m.rotation.y=p.angle;cube(m,0,1,0,27,2,140,platformMat);cube(m,0,2.05,0,5,.12,140,railMat);metroGroup.add(m);s.group=m;const text=label(s.name);text.position.set(s.x,heightAt(s.x,s.z)+130,s.z);metroGroup.add(text);labels.push(text);s.label=text;}
  const cars=[];for(let i=0;i<4;i++){const m=new THREE.Group();cube(m,0,2.0,0,2.9,3.5,18,trainMat);cube(m,0,2.9,0,3.0,1.1,16,glassMat);cube(m,0,3.85,0,3.0,.25,18.2,roofMat);for(const end of[-1,1]){cube(m,0,2.7,end*9.05,2.3,1.1,.12,glassMat);for(const x of[-1,1])cube(m,x,.6,end*5, .6,.7,1.6,glassMat);}metroGroup.add(m);cars.push(m);}
  const title=new THREE.Group(); // Diagram title is shown in the HUD, station labels stay in the scene.
  const northD=(stations[0].d+stations[2].d)/2,southD=(stations[6].d+stations[8].d)/2;
  const target=d=>{const p=sample(path,d);return[p.x,heightAt(p.x,p.z)+48,p.z];};
  targets.metroNorth=target(northD);targets.metroSouth=target(southD);targets.metroTrainNorth=target(northD);targets.metroTrainSouth=target(southD);
  const bounds={metroNorth:{length:stations[2].d-stations[0].d,width:600},metroSouth:{length:stations[8].d-stations[6].d,width:1900}};
  let lastMetro=null;
  function update(s){
    const key=s.event?.scene_key||'',north=s.eventId===38||key==='metro_1991',south=key==='metro_south'||s.eventId===58;
    for(const item of stages){const override=s.constructionProgress?.[item.key],replacement=s.constructionProgress?.[item.replacedBy],progress=Number.isFinite(override)?clamp((override-item.range[0])/Math.max(.01,item.range[1]-item.range[0])):clamp((s.calendarYear-item.start)/Math.max(.01,item.end-item.start));item.g.visible=Number.isFinite(override)?progress>0&&s.calendarYear<item.death:s.calendarYear>=item.start&&s.calendarYear<item.death;if(Number.isFinite(replacement))item.g.visible=s.calendarYear>=item.start&&replacement<.5;item.plane.constant=mix(item.bottom,item.top,progress)+.03;}
    for(const item of construction){const override=s.constructionProgress?.[item.key];item.g.visible=Number.isFinite(override)?override>0&&override<1:s.calendarYear>=item.start&&s.calendarYear<item.end;}
    for(const item of eventLabels)item.g.visible=item.keys.includes(key);
    metroGroup.visible=(north||south)&&s.calendarYear>=1991.318;
    const from=north?stations[0].d:stations[6].d,to=north?stations[2].d:stations[8].d;
    const opened=stations.filter(st=>st.year<=s.calendarYear),override=s.constructionProgress?.[north?'metroNorth':'metroSouth'],calendarEnd=opened.length?Math.max(...opened.map(st=>st.d)):0,end=Number.isFinite(override)?from+(to-from)*clamp(override):calendarEnd;
    if(north&&override===0)metroGroup.visible=false;
    for(const seg of segments)seg.group.visible=seg.d<=end&&seg.d>=stations[0].d;
    for(const st of stations){st.group.visible=st.label.visible=st.year<=s.calendarYear&&st.d<=end&&(north?st.d<=stations[2].d:st.d>=stations[6].d);}
    const usable=Math.max(1,Math.min(to,end)-from-110),phase=(s.time*11)%(usable*2),d=from+55+(phase<=usable?phase:2*usable-phase),dir=phase<=usable?1:-1;
    for(let i=0;i<cars.length;i++){cars[i].visible=end-from>110;const p=sample(path,d-i*19.3*dir);cars[i].position.set(p.x,heightAt(p.x,p.z)+46,p.z);cars[i].rotation.y=p.angle;}
    const p=sample(path,d);title.position.set(p.x,heightAt(p.x,p.z)+108,p.z);targets[north?'metroTrainNorth':'metroTrainSouth']=[p.x,heightAt(p.x,p.z)+49,p.z];
    lastMetro={active:metroGroup.visible,north,year:s.calendarYear,stations:stations.filter(st=>st.group.visible).map(st=>st.name),train:[p.x,p.z],routeSource:URBAN.metro.source};
  }
  function setView(position){for(const t of labels){const distance=position.distanceTo?position.distanceTo(t.position):Math.hypot(position.x-t.position.x,position.y-t.position.y,position.z-t.position.z),width=clamp(distance*(t===title ? .42 : .24),t===title?65:45,t===title?900:550);t.scale.set(width,width/8,1);}}
  function diagnostics(){return{bridge:bridgeParts.map(p=>({name:p.name,offset:p.offset,width:p.width,length:p.length,deckY:p.deckY,visible:p.g.visible,range:p.range})),metro:lastMetro,bounds,stages:stages.map(i=>({start:i.start,end:i.end,death:i.death,key:i.key,range:i.range,visible:i.g.visible,ceiling:i.plane.constant})),constructionVisible:construction.filter(i=>i.g.visible).length,targets:Object.keys(targets)};}
  return{group,targets,bounds,update,setView,diagnostics,stages,construction,metro:{path,stations,cars,group:metroGroup}};
}
