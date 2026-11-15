import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {GEO} from '../geo.js';
import {SEVASTYANOV_NEIGHBOR_IDS,SEVASTYANOV_NEIGHBOR_YEAR,neighborhoodReplacementYear} from '../data/sevastyanov-neighborhood.js';
import {buildSevastyanovNeighborModels,installSevastyanovNeighborhood,partitionNeighborFootprint} from '../sevastyanov-neighborhood.js';

const area=p=>Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-a[1]*b[0];},0)/2);
function inside(p,ring){let yes=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
const targets=GEO.buildings.filter(b=>SEVASTYANOV_NEIGHBOR_IDS.includes(b.id));
const before=JSON.stringify(targets);
const models=buildSevastyanovNeighborModels({groundHeight:()=>0});

test('only the three selected footprint IDs are replaced from the modern cutover',()=>{
  assert.deepEqual(SEVASTYANOV_NEIGHBOR_IDS,[51503512,-421103,51503506]);
  for(const id of SEVASTYANOV_NEIGHBOR_IDS)assert.equal(neighborhoodReplacementYear(id),2009);
  for(const id of [51503508,51503507,1234567])assert.equal(neighborhoodReplacementYear(id),9999);
  assert.equal(JSON.stringify(targets),before);
});

test('height partitioning preserves the complete source OSM outer footprint and open courtyard',()=>{
  const b=targets.find(b=>b.id===-421103),pieces=partitionNeighborFootprint(b);
  const expected=area(b.p)-(b.holes||[]).reduce((n,h)=>n+area(h),0);
  const actual=pieces.reduce((n,p)=>n+area(p.polygon),0);
  assert.ok(Math.abs(expected-actual)<1e-6,`${actual} versus ${expected}`);
  for(const {polygon} of pieces){
    const mid=polygon.reduce((v,p)=>[v[0]+p[0]/polygon.length,v[1]+p[1]/polygon.length],[0,0]);
    assert.equal(b.holes.some(h=>inside(mid,h)),false);
  }
});

test('actual roof triangles do not cap the Tarasov courtyard',()=>{
  const model=models.find(m=>m.userData.id===-421103),hole=model.userData.holes[0];
  const roof=model.children.find(m=>m.name.endsWith(' roof')),p=roof.geometry.attributes.position;
  for(let i=0;i<p.count;i+=3){
    const center=[(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,(p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3];
    assert.equal(inside(center,hole),false,`roof caps courtyard at ${center}`);
  }
  const center=hole.reduce((v,p)=>[v[0]+p[0]/hole.length,v[1]+p[1]/hole.length],[0,0]);
  model.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(new THREE.Vector3(center[0],50,center[1]),new THREE.Vector3(0,-1,0));
  assert.equal(ray.intersectObject(model,true).length,0);
});

test('roof triangles follow flat or constant-pitch planes without straddling ridges',()=>{
  for(const model of models.filter(m=>m.userData.id!==51503512)) {
    const roof=model.children.find(m=>m.name.endsWith(' roof')),p=roof.geometry.attributes.position;
    let projectedArea=0;
    for(let i=0;i<p.count;i+=3) {
      const a=new THREE.Vector3().fromBufferAttribute(p,i),b=new THREE.Vector3().fromBufferAttribute(p,i+1),c=new THREE.Vector3().fromBufferAttribute(p,i+2);
      const n=b.sub(a).cross(c.sub(a));
      projectedArea+=Math.abs(n.y)/2;
      if(Math.abs(n.y)<.02)continue; // Float32 error dominates vanishing edge slivers.
      assert.ok(n.y>0,'roof winding points down');
      const slope=Math.hypot(n.x,n.z)/n.y;
      assert.ok(slope<.003||Math.abs(slope-.48)<.003,`non-planar roof slope ${slope}`);
    }
    const b=targets.find(b=>b.id===model.userData.id),expected=area(b.p)-(b.holes||[]).reduce((n,h)=>n+area(h),0);
    assert.ok(Math.abs(projectedArea-expected)<.02,`roof coverage ${projectedArea} versus ${expected}`);
  }
});

test('batched geometry keeps bounded footprints, distinct heights and a small triangle budget',()=>{
  let total=0;
  for(const model of models){
    const b=targets.find(b=>b.id===model.userData.id),box=new THREE.Box3().setFromObject(model);
    assert.ok(box.min.toArray().concat(box.max.toArray()).every(Number.isFinite));
    assert.ok(box.min.x>=Math.min(...b.p.map(p=>p[0]))-.8);
    assert.ok(box.max.x<=Math.max(...b.p.map(p=>p[0]))+.8);
    assert.ok(box.min.z>=Math.min(...b.p.map(p=>p[1]))-.8);
    assert.ok(box.max.z<=Math.max(...b.p.map(p=>p[1]))+.8);
    assert.ok(box.min.y>=-.01);
    assert.ok(model.children.length<=8);
    model.traverse(o=>{if(o.isMesh)total+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
  }
  assert.ok(total<50000,`triangle count ${total}`);
  assert.ok(new THREE.Box3().setFromObject(models[0]).max.y>10.5);
  assert.ok(new THREE.Box3().setFromObject(models[1]).max.y<=17.51);
  assert.ok(new THREE.Box3().setFromObject(models[2]).max.y<=8.21);
  assert.equal(models[0].userData.features.mezzanine,true);
  assert.ok(models[1].userData.features.glazingPanels>=2);
});

test('modern neighbor visibility is reversible without changing historic source records',()=>{
  const pharmacy={group:new THREE.Group()};
  const world={group:new THREE.Group(),landmarks:{background:{items:new Map([['mountainPharmacy',pharmacy]])}}};
  const controller=installSevastyanovNeighborhood(world);
  for(const [year,visible] of [[2008,false],[SEVASTYANOV_NEIGHBOR_YEAR,true],[2026,true],[1866,false]]){
    pharmacy.group.visible=year>=1821; // Existing background.update happens first.
    controller.update({calendarYear:year});assert.equal(controller.group.visible,visible);
    assert.equal(controller.diagnostics().visible,visible);
    assert.equal(pharmacy.group.visible,!visible);
  }
  assert.equal(JSON.stringify(targets),before);
  assert.equal(controller.diagnostics().buildings.length,3);
});

test('Lenina 37 central raised facade meets the main wall without an open horizontal gap',()=>{
  const n=new THREE.Vector3(.1961161351,0,.9805806757),front=new THREE.Vector3(220.1,7.15,-41.5);
  models[0].updateMatrixWorld(true);
  const ray=new THREE.Raycaster(front.clone().addScaledVector(n,2),n.clone().negate());
  const hits=ray.intersectObject(models[0],true);
  assert.ok(hits.length&&hits[0].distance<2.1,'open seam below the mezzanine');
});
