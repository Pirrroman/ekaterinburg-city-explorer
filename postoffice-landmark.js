import * as THREE from './vendor/three.module.js';
import {paint,box,finalizeModel} from './architecture-kit.js';
import {project,heightAt} from './geo.js';

// OSM relation 16896445, refreshed 2026-10-12. Local +Z faces Lenina avenue;
// the actual street-aligned yaw is 11.11 degrees, not a cardinal-direction guess.
// Architectural details studied in PastVu 1719751 (1934), 2449833 (1956–60),
// 1113784 (1964). Their image pixels are not embedded or redistributed.
export const POST_OFFICE_SPEC=Object.freeze({
 key:'postOffice',title:'Главпочтамт — Дом связи',lon:60.6087248,lat:56.8394592,
 azimuth:.193906603,width:51.01,depth:59.32,height:33.4,startYear:1931,endYear:1934,
 polygon:[[-7.411,-32.823],[-7.415,-20.447],[-7.422,11.884],[26.117,11.89],[26.117,26.491],[-10.184,26.486],[-24.89,26.48],[-24.884,8.659],[-24.873,-32.826],[-24.589,-32.816]]
});
// Site-clearing consumers use world-axis offsets, not unrotated facade-local
// coordinates. Keep this polygon derived from the one geographic source above.
export const POSTOFFICE_PLOT=Object.freeze({
 key:'postOffice',x:326.6727962123328,z:-89.95769200004702,startYear:1931,
 polygon:POST_OFFICE_SPEC.polygon.map(([u,v])=>{
  const c=Math.cos(POST_OFFICE_SPEC.azimuth),s=Math.sin(POST_OFFICE_SPEC.azimuth);
  return[u*c+v*s,-u*s+v*c];
 })
});
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};

function inscription(text,color='#b4a282'){
 const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=128;
 const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);
 c.font='bold 81px Georgia, serif';c.textAlign='center';c.textBaseline='middle';
 c.fillStyle=color;c.fillText(text,768,66,1490);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 texture.anisotropy=4;
 return new THREE.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.25,roughness:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
}

export function buildPostOffice(){
 const root=new THREE.Group();root.name='Главпочтамт: Дом связи, 1931–1934';
 const wall=paint('#d4cdb9','plaster',{roughness:.91}),edge=paint('#ede8d8','plaster'),
  stone=paint('#888b85','stone'),roof=paint('#6b716e','metal',{metalness:.3,roughness:.78}),
  frame=paint('#7f897e','metal',{metalness:.22,roughness:.71}),glass=paint('#506264','glass',{roughness:.39}),
  dark=paint('#263a3b','glass',{roughness:.52});
 function block(name,x,z,w,d,h){
  const g=new THREE.Group();g.name=name;root.add(g);
  box(g,x,h/2,z,w,h,d,wall);box(g,x,.55,z,w+.1,1.1,d+.1,stone);
  box(g,x,h+.11,z,w+.08,.22,d+.08,roof);
  // Low parapets cast a readable lip, with no ornamental classical cornice.
  for(const zz of[-1,1])box(g,x,h+.38,z+zz*(d/2-.12),w,.6,.24,edge);
  for(const xx of[-1,1])box(g,x+xx*(w/2-.12),h+.38,z,.24,.6,d,edge);
  return g;
 }
 // L-shaped historic footprint: tall western body and a lower front wing.
 // The unrelated rear address39B is intentionally not absorbed into this model.
 block('Western seven-level body',-16.15,-12.08,17.45,41.49,27.2);
 block('Southwest entrance block',-17.535,17.575,14.71,17.83,29.2);
 block('Long southern facade',7.965,19.187,36.305,14.60,24.1);
 // Upper storey is set back from the street, matching the stepped 1934 silhouette.
 block('Set-back upper floor',7.9,15.3,35.0,6.7,27.2);
 // Narrow, high staircase blade is the defining vertical accent in the archive view.
 block('Glazed stair tower',-10.96,18.34,3.82,16.3,32.68);

 function window(parent,x,y,z,w,h,yaw=0,m=glass){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=yaw;parent.add(g);
  box(g,0,0,.03,w+.22,h+.22,.12,stone);
  box(g,0,0,.11,w,h,.13,m);
  const divisions=Math.max(1,Math.round(w/1.25));
  for(let i=0;i<=divisions;i++)box(g,-w/2+i*w/divisions,0,.2,.065,h+.05,.1,frame);
  for(const yy of[-h/2,h*.13,h/2])box(g,0,yy,.21,w,.065,.1,frame);
  box(g,0,-h/2-.13,.16,w+.34,.14,.3,edge);return g;
 }
 // West elevation: rhythm of tall lights on the long wall, small clerestory row.
 for(const z of[-29,-24.1,-19.2,-14.3,-9.4,-4.5,.4,5.3]){
  for(const y of[4.1,8.7,13.3,17.9,22.5])window(root,-24.925,y,z,2.55,3.25,-Math.PI/2);
  window(root,-24.925,26,z,2.45,1.15,-Math.PI/2);
 }
 // Return wall faces the courtyard, not the street; remain within measured plan.
 for(const z of[-29,-24,-19,-14,-9,-4,1,6])for(const y of[4.2,8.9,13.6,18.3,23])
  window(root,-7.39,y,z,2.3,2.85,Math.PI/2);
 for(const x of[-22,-17,-12])for(const y of[4.2,8.9,13.6,18.3,23])window(root,x,y,-32.86,2.65,2.85,Math.PI);

 // Archive photographs show grouped ribbon lights around the high entrance.
 for(const y of[9.5,14.4,19.3,24.2]){
  window(root,-19.0,y,26.53,9.0,2.3);
  window(root,-24.93,y,18.3,9.6,2.3,-Math.PI/2);
 }
 for(const y of[7.8,12.0,16.2,20.4])window(root,8.35,y,26.535,33.0,2.25);
 // Dense vertical mullions in the top-level hall are visible in the1934 photo.
 for(let x=-7.45;x<=23.3;x+=2.28)window(root,x,25.75,18.70,1.32,3.2);
 for(const y of[4.5,9.1,13.7,18.3,22])for(const z of[14.5,19.2,23.9])window(root,26.16,y,z,2.9,2.7,Math.PI/2);
 // The less-documented courtyard side uses the same understated window module;
 // its openings are a reconstruction, not a claimed photogrammetric survey.
 for(const x of[-3.5,2.1,7.7,13.3,18.9,23.1])for(const y of[4.3,8.9,13.5,18.1,22.4])
  window(root,x,y,11.85,2.6,2.8,Math.PI);
 // Stairwell glazing is slender and continuous, separated by the real landings.
 window(root,-10.96,18.85,26.535,1.32,23.5);
 for(let y=8;y<30;y+=3.3)box(root,-10.96,y,26.8,1.42,.15,.2,edge);

 // Recessed ground-floor doors, glazed vestibule, broad stone entry and L canopy.
 for(const x of[-21.5,-18.8,-16.1])window(root,x,2.8,26.60,1.85,4.3,0,dark);
 for(const z of[12.0,15.1,18.2,21.3])window(root,-24.94,2.8,z,2.1,4.3,-Math.PI/2,dark);
 for(const x of[-4.5,1.4,7.3,13.2,19.1,24])window(root,x,2.7,26.53,2.2,2.8,0,dark);
 for(let i=0;i<6;i++)box(root,-18.1,.12+i*.16,28.30-i*.25,12.9,.24+i*.32,3.0-i*.20,stone);
 box(root,-17.9,6.0,27.52,17.2,.53,3.38,edge);
 box(root,-26.08,6.0,18.3,2.4,.53,18.9,edge);
 box(root,-17.9,6.41,29.18,17.2,.30,.22,stone);
 box(root,-27.20,6.41,18.3,.22,.30,18.9,stone);
 for(const x of[-24.9,-10.5])box(root,x,3.1,28.4,.42,5.7,.42,edge);
 for(const z of[10.5,23.5])box(root,-26.4,3.1,z,.42,5.7,.42,edge);

 const signage=new THREE.Group();signage.name='Canopy inscription documented1956–1964';signage.userData.dynamic=true;root.add(signage);
 const signmat=inscription('ПОЧТА  ТЕЛЕГРАФ  ТЕЛЕФОН');
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(15.2,1.12),signmat);sign.position.set(-17.8,6.36,29.31);signage.add(sign);
 const sideSign=new THREE.Mesh(new THREE.PlaneGeometry(16.1,1.12),signmat);sideSign.position.set(-27.35,6.36,18.3);sideSign.rotation.y=-Math.PI/2;signage.add(sideSign);
 // Simple rooftop service equipment is low and deterministic, not an invented spire.
 for(const [x,z]of[[14,15],[-18,-24],[-17,-10]])box(root,x,28.05,z,1.15,1.15,1.3,roof);
 root.userData={signage,referenceIds:[1719751,2449833,1113784],heightEstimate:true};
 finalizeModel(root);return root;
}

export function installPostOffice(world){
 if(world.postOffice)return world.postOffice;
 const spec=POST_OFFICE_SPEC,[x,z]=project(spec.lon,spec.lat),c=Math.cos(spec.azimuth),s=Math.sin(spec.azimuth);
 const ground=Math.max(...spec.polygon.map(([u,v])=>heightAt(x+u*c+v*s,z-u*s+v*c)))+.09;
 const group=new THREE.Group();group.name='Geographic pose: Главпочтамт';
 group.position.set(x,ground,z);group.rotation.y=spec.azimuth;world.group.add(group);
 const model=buildPostOffice();group.add(model);
 const plane=new THREE.Plane(new THREE.Vector3(0,-1,0),ground),cache=new Map();
 model.traverse(o=>{if(!o.isMesh)return;const clipped=m=>{if(!cache.has(m)){const q=m.clone();q.onBeforeCompile=m.onBeforeCompile;q.customProgramCacheKey=m.customProgramCacheKey;q.clippingPlanes=[plane];q.clipShadows=true;cache.set(m,q);}return cache.get(m);};o.material=Array.isArray(o.material)?o.material.map(clipped):clipped(o.material);});
 const target=[x,ground+17,z],targets={postOffice:target};Object.assign(world.targets,targets);
 let growth=0;
 function update(state){
  const year=Number(state.calendarYear??state.year??1722);
  growth=Number.isFinite(state.constructionProgress?.postOffice)?clamp(state.constructionProgress.postOffice):ease((year-spec.startYear)/(spec.endYear-spec.startYear));
  group.visible=growth>0;plane.constant=ground+spec.height*growth+.1;
  model.userData.signage.visible=year>=1956;
 }
 const api={group,model,spec,targets,ground,plane,update,get growth(){return growth;},get hasActiveConstruction(){return growth>0&&growth<1;}};
 world.postOffice=api;update({year:1722});return api;
}
