import * as THREE from './vendor/three.module.js';
import {BACKGROUND_LANDMARKS} from './data/background-landmarks.js';
import {heightAt} from './geo.js';
import {backgroundBuilding} from './models/background-buildings.js';

// This layer is deliberately independent of the main-scene construction
// direction. New background landmarks retain their source calendar dates.
export function createBackgroundLandmarks(){
 const group=new THREE.Group();group.name='dated-background-landmarks';
 const items=new Map();let hasActiveConstruction=false;
 for(const spec of BACKGROUND_LANDMARKS){
  const samples=spec.polygon.map(([x,z])=>heightAt(x+spec.x,z+spec.z)).sort((a,b)=>a-b);
  const ground=samples.at(-1)+.04; // Flat occupied floor clears all surveyed edge elevations.
  const plane=new THREE.Plane(new THREE.Vector3(0,-1,0),ground),object=backgroundBuilding(spec,plane);
  object.name=spec.key;object.position.set(spec.x,ground,spec.z);group.add(object);
  // Close only the wall footprint to the DEM; no oversized flat platform.
  const vertices=[],indices=[];
  spec.polygon.forEach(([x,z],i)=>{vertices.push(x,0,z,x,Math.min(0,heightAt(x+spec.x,z+spec.z)-ground)-.3,z);const j=(i+1)%spec.polygon.length;if(spec.key==='radugaPark'&&Math.max(x,spec.polygon[j][0])+spec.x>-3834)return;indices.push(i*2,j*2,i*2+1,j*2,j*2+1,i*2+1);});
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const skirt=new THREE.Mesh(geometry,object.userData.materials.wall);skirt.receiveShadow=true;object.add(skirt);
  object.visible=false;items.set(spec.key,{key:spec.key,spec,group:object,ground,height:spec.height,plane,growth:0});
 }
 function update(state){
  const year=Number(state?.calendarYear??state?.year??1722);hasActiveConstruction=false;
  for(const item of items.values()){
   if(item.delegated)continue;
   const {spec}=item,span=spec.endYear-spec.startYear;
   const p=span>0?Math.max(0,Math.min(1,(year-spec.startYear)/span)):Number(year>=spec.endYear);
   item.growth=p*p*(3-2*p);const gone=Number.isFinite(spec.removedYear)&&year>=spec.removedYear;
   item.group.visible=item.growth>0&&!gone;
   if(spec.key==='trinityCathedral')item.group.userData.roofline.visible=year<1930||year>=2000;
   item.plane.constant=item.ground+item.height*item.growth+.02;
   hasActiveConstruction||=item.group.visible&&item.growth<1;
  }
 }
 return{group,items,update,get hasActiveConstruction(){return hasActiveConstruction;}};
}
