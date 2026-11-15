import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {installSevastyanovAsset} from '../sevastyanov-asset.js';

function modelFixture() {
  const scene = new THREE.Group();
  for (const name of ['SevastyanovExterior','SevastyanovModernHall']) {
    const group = new THREE.Group(); group.name = name;
    const geometry = new THREE.BoxGeometry(4,10,6).translate(0,5,0);
    group.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial()));
    scene.add(group);
  }
  return {scene};
}

function fixture(loader) {
  const group = new THREE.Group(); group.position.set(167,12,-53); group.rotation.y = -1.3763563;
  const constructionGroup = new THREE.Group(); group.add(constructionGroup);
  const metric = new THREE.Group(); metric.scale.set(1.274,1.209,.843); metric.position.set(-3,2,5);
  constructionGroup.add(metric);
  const building = modelFixture().scene; metric.add(building);
  const item = {key:'sevastyanov',group,constructionGroup,metric,building,position:group.position.clone(),spec:{startYear:1863}};
  let clipCalls = 0;
  const world = {landmarks:{items:new Map([['sevastyanov',item]]),applyClipping(){clipCalls++;}}};
  const controller = installSevastyanovAsset(world,{loader,logger:{warn(){}}});
  function update(year,distance=170) {
    group.visible = year >= 1863;
    controller.update({calendarYear:year},item.position.clone().add(new THREE.Vector3(0,0,distance)));
  }
  return {controller,item,update,get clipCalls(){return clipCalls;}};
}

test('historical views load nothing; the modern overview requests only the small model', async () => {
  const requests = [];
  const f = fixture({loadAsync:async url=>{requests.push(url);return modelFixture();}});
  for (const year of [1862,1864,1866,2008]) f.update(year);
  assert.equal(requests.length,0);
  f.update(2026,1550);
  await f.controller.ready;
  assert.equal(requests.length,1);
  assert.ok(requests[0].endsWith('sevastyanov-house-lod.glb'));
  assert.equal(f.controller.diagnostics().detailLevel,'coarse');
  assert.equal(f.controller.diagnostics().levels.detailed.status,'idle');
  assert.equal(f.item.metric.visible,false);
});

test('late loading uses the latest historical year and preserves the legacy model', async () => {
  const resolves = [];
  const f = fixture({loadAsync(){return new Promise(r=>{resolves.push(r);});}});
  const originalBuilding = f.item.building;
  f.update(2026); await Promise.resolve();
  assert.equal(f.item.metric.visible,true);
  f.update(2008);
  for (const resolve of resolves) resolve(modelFixture());
  await f.controller.ready;
  assert.equal(f.controller.diagnostics().visibleModel,'existing');
  f.update(2009);
  assert.equal(f.controller.diagnostics().visibleModel,'modern');
  assert.equal(f.item.metric.visible,false);
  f.update(1866);
  assert.equal(f.controller.diagnostics().visibleModel,'existing');
  f.update(1862);
  assert.equal(f.controller.diagnostics().visibleModel,'none');
  assert.equal(f.item.building,originalBuilding);
  assert.equal(resolves.length,2);
  assert.equal(f.clipCalls,2);
});

test('the imported rotunda is not warped by the historical metric normalization', async () => {
  const f = fixture({loadAsync:async()=>modelFixture()});
  f.update(2026); await f.controller.ready;
  const d = f.controller.diagnostics();
  for (const scale of d.worldScale) assert.ok(Math.abs(scale-1/.88)<1e-10);
  assert.deepEqual(f.item.metric.scale.toArray(),[1.274,1.209,.843]);
  assert.ok(Math.abs(d.worldBounds.min[1]-12)<1e-8);
  const modern = f.item.constructionGroup.getObjectByName('Sevastyanov-modern-geographic-placement');
  const origin = new THREE.Vector3().applyMatrix4(modern.matrixWorld);
  const x = new THREE.Vector3(1,0,0).applyMatrix4(modern.matrixWorld).sub(origin);
  const z = new THREE.Vector3(0,0,1).applyMatrix4(modern.matrixWorld).sub(origin);
  assert.ok(Math.abs(x.length()-z.length())<1e-10);
  assert.ok(Math.abs(x.dot(z))<1e-10);
  assert.ok(Math.abs(Math.atan2(-x.z,x.x)-11*Math.PI/180)<1e-10);
});

test('distance hysteresis prevents rapid swapping and loading happens once', async () => {
  let requests = 0;
  const f = fixture({loadAsync:async()=>{requests++;return modelFixture();}});
  f.update(2026,800); await f.controller.ready;
  assert.equal(f.controller.diagnostics().detailLevel,'coarse');
  for (const [distance,expected] of [[640,'detailed'],[700,'detailed'],[760,'coarse'],[700,'coarse'],[640,'detailed'],[1550,'coarse']]) {
    f.update(2026,distance);
    assert.equal(f.controller.diagnostics().detailLevel,expected);
    assert.equal(f.controller.diagnostics().visibleModel,'modern');
    assert.equal(f.item.metric.visible,false);
  }
  assert.equal(requests,2);
});

test('failure of both payloads keeps a landmark without an automatic retry loop', async () => {
  let requests = 0;
  const f = fixture({loadAsync:async()=>{requests++;throw new Error('HTTP404');}});
  f.update(2026); assert.equal(await f.controller.ready,false);
  for (let i=0;i<5;i++) f.update(2026);
  assert.equal(f.controller.diagnostics().status,'error');
  assert.equal(f.controller.diagnostics().visibleModel,'existing');
  assert.equal(f.item.metric.visible,true);
  assert.equal(requests,2);
});

function controlledLoader() {
  const pending = {};
  return {pending,loadAsync(url){
    const name = url.endsWith('-lod.glb') ? 'coarse' : 'detailed';
    return new Promise((resolve,reject)=>{pending[name]={resolve,reject};});
  }};
}
const flush = () => new Promise(resolve=>setImmediate(resolve));

test('a late or failed coarse load never replaces the loaded modern house with the old shape', async () => {
  for (const fail of [false,true]) {
    const loader = controlledLoader(), f = fixture(loader);
    f.update(2026); await flush();
    loader.pending.detailed.resolve(modelFixture()); await flush();
    assert.equal(f.controller.diagnostics().detailLevel,'detailed');
    f.update(2026,1550);
    assert.equal(f.controller.diagnostics().detailLevel,'detailed');
    if (fail) loader.pending.coarse.reject(new Error('LOD404'));
    else loader.pending.coarse.resolve(modelFixture());
    await f.controller.ready;
    assert.equal(f.controller.diagnostics().detailLevel,fail?'detailed':'coarse');
    assert.equal(f.controller.diagnostics().visibleModel,'modern');
    assert.equal(f.item.metric.visible,false);
  }
});

test('a late or failed detailed load keeps the modern coarse house visible', async () => {
  for (const fail of [false,true]) {
    const loader = controlledLoader(), f = fixture(loader);
    f.update(2026); await flush();
    loader.pending.coarse.resolve(modelFixture()); await flush();
    assert.equal(f.controller.diagnostics().detailLevel,'coarse');
    if (fail) loader.pending.detailed.reject(new Error('Detail404'));
    else loader.pending.detailed.resolve(modelFixture());
    await f.controller.ready;
    assert.equal(f.controller.diagnostics().detailLevel,fail?'coarse':'detailed');
    f.update(2026,1550);
    assert.equal(f.controller.diagnostics().detailLevel,'coarse');
    assert.equal(f.item.metric.visible,false);
  }
});

test('the shipped binary parses with the exact vendored loader and contains only the house', async () => {
  const bytes = await fs.readFile(new URL('../assets/models/sevastyanov-house.glb',import.meta.url));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'c396c9beb45db3dfca5864a3aef2e2a97bf3e1c15571285eba7d4937591510e8');
  assert.equal(bytes.readUInt32LE(0),0x46546c67);
  assert.equal(bytes.readUInt32LE(4),2);
  assert.equal(bytes.readUInt32LE(8),bytes.length);
  const json = JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
  assert.ok((json.buffers??[]).every(b=>!b.uri));
  assert.equal((json.images??[]).length,0);
  assert.equal((json.cameras??[]).length,0);
  assert.equal((json.animations??[]).length,0);
  const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  assert.ok(gltf.scene.getObjectByName('SevastyanovExterior'));
  assert.ok(gltf.scene.getObjectByName('SevastyanovModernHall'));
  let meshes=0,triangles=0;
  gltf.scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  assert.equal(meshes,17); assert.equal(triangles,522656);
  const size = new THREE.Box3().setFromObject(gltf.scene).getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.x-41.54)<.01 && Math.abs(size.y-15.71)<.01 && Math.abs(size.z-35.33)<.01);
});

test('the shipped coarse model retains the detailed origin, bounds and PBR colors within its budget', async () => {
  const read = async file => {
    const bytes = await fs.readFile(new URL('../assets/models/'+file,import.meta.url));
    const json = JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString('utf8'));
    const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    return {bytes,json,gltf,bounds:new THREE.Box3().setFromObject(gltf.scene)};
  };
  const [high,low] = await Promise.all([read('sevastyanov-house.glb'),read('sevastyanov-house-lod.glb')]);
  assert.equal(crypto.createHash('sha256').update(low.bytes).digest('hex'),'1daebe4df2079a1ca7691cd8e7d42527d65c2478520319362a66a13ccab1138a');
  assert.ok(low.bytes.length < 2000000);
  assert.ok((low.json.buffers??[]).every(b=>!b.uri));
  for (const key of ['images','animations','cameras']) assert.equal((low.json[key]??[]).length,0);
  for (const name of ['SevastyanovRoot','SevastyanovExterior','SevastyanovModernHall']) {
    const a = high.gltf.scene.getObjectByName(name), b = low.gltf.scene.getObjectByName(name);
    assert.ok(a && b,name);
    assert.deepEqual(b.matrix.elements,a.matrix.elements,name+' origin/transform');
  }
  for (const edge of ['min','max']) for (const axis of ['x','y','z']) {
    assert.ok(Math.abs(low.bounds[edge][axis]-high.bounds[edge][axis]) < .005,edge+'.'+axis);
  }
  for (const material of low.json.materials) {
    const original = high.json.materials.find(m=>m.name===material.name);
    assert.ok(original,material.name);
    for (const property of ['pbrMetallicRoughness','emissiveFactor','alphaMode','doubleSided']) {
      assert.deepEqual(material[property],original[property],material.name+'.'+property);
    }
  }
  let triangles=0;
  low.gltf.scene.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
  assert.equal(triangles,66344);
  assert.ok(triangles<80000);
});
