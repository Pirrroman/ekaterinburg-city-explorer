import * as THREE from './vendor/three.module.js';
import { LANDMARKS, heightAt, isWater } from './geo.js';
import { createBackgroundLandmarks } from './background-landmarks.js';

// Every landmark is placed in projected metres. Author geometry, metric pose and
// construction state have independent transforms; temporal updates never change size.
// The dates describe the pictured phase, rather than the institution's foundation.
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = v => { const t = clamp(v); return t * t * (3 - 2 * t); };
const PALETTE = {
  white: 0xf3f0dd, cream: 0xead8b0, yellow: 0xe3c577, mint: 0x80b49a,
  green: 0x247c65, red: 0xb96341, brick: 0xa2644b, stone: 0xb8b0a0,
  gold: 0xd6a33c, glass: 0x537988, dark: 0x263c42, wood: 0x806548,
  steel: 0xb9c5c2, lawn: 0x749956, water: 0x467f90, light: 0xffce74,
};
const materials = Object.fromEntries(Object.entries(PALETTE).map(([k, color]) => [k,
  new THREE.MeshStandardMaterial({ color, roughness: k === 'glass' ? .27 : .76,
    metalness: ['gold', 'steel'].includes(k) ? .38 : 0 })]));
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, 24),
  cone: new THREE.ConeGeometry(1, 1, 24),
  sphere: new THREE.SphereGeometry(1, 16, 10),
};
const tmp = new THREE.Object3D();
function mesh(g, geom, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geom, typeof mat === 'string' ? materials[mat] : mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz);
  m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function box(g, x, y, z, w, h, d, mat = 'cream') {
  return mesh(g, GEO.box, mat, x, y, z, w, h, d);
}
function cyl(g, x, y, z, r, h, mat = 'white', rz = r) {
  return mesh(g, GEO.cylinder, mat, x, y, z, r, h, rz);
}
function cone(g, x, y, z, r, h, mat = 'green') {
  return mesh(g, GEO.cone, mat, x, y, z, r, h, r);
}
function sphere(g, x, y, z, r, mat = 'gold', ry = r, rz = r) {
  return mesh(g, GEO.sphere, mat, x, y, z, r, ry, rz);
}
function batch(g, geom, mat, instances) {
  if (!instances.length) return null;
  const m = new THREE.InstancedMesh(geom, typeof mat === 'string' ? materials[mat] : mat, instances.length);
  instances.forEach((p, i) => {
    tmp.position.set(p[0], p[1], p[2]); tmp.scale.set(p[3], p[4], p[5]);
    tmp.rotation.set(p[6] || 0, p[7] || 0, p[8] || 0); tmp.updateMatrix();
    m.setMatrixAt(i, tmp.matrix);
  });
  m.instanceMatrix.needsUpdate = true; m.castShadow = true; m.receiveShadow = true;
  g.add(m); return m;
}
function gable(g, x, y, z, w, h, d, mat = 'red') {
  const verts = [
    -w / 2, 0, -d / 2, w / 2, 0, -d / 2, 0, h, -d / 2,
    w / 2, 0, d / 2, -w / 2, 0, d / 2, 0, h, d / 2,
    -w / 2, 0, d / 2, -w / 2, 0, -d / 2, 0, h, -d / 2,
    -w / 2, 0, d / 2, 0, h, -d / 2, 0, h, d / 2,
    0, h, d / 2, 0, h, -d / 2, w / 2, 0, -d / 2,
    0, h, d / 2, w / 2, 0, -d / 2, w / 2, 0, d / 2,
    -w / 2, 0, d / 2, w / 2, 0, d / 2, w / 2, 0, -d / 2,
    -w / 2, 0, d / 2, w / 2, 0, -d / 2, -w / 2, 0, -d / 2,
  ];
  // Reverse each triangle to point normals outside the roof prism.
  // Back-facing slopes otherwise disappear and expose the pale cornice below.
  for (let i = 0; i < verts.length; i += 9) for (let k = 0; k < 3; k++) {
    const old = verts[i + 3 + k]; verts[i + 3 + k] = verts[i + 6 + k]; verts[i + 6 + k] = old;
  }
  const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geom.computeVertexNormals(); return mesh(g, geom, mat, x, y, z);
}
function windows(g, w, d, h, floors = 2, cols = 7, mat = 'dark', x = 0, z = 0, y = 0) {
  const panels = [], ledges = [];
  const wh = Math.min(5.2, h / floors * .48), ww = Math.min(4.5, w / (cols + 1) * .55);
  for (let floor = 0; floor < floors; floor++) {
    const cy = y + h * (floor + .6) / floors;
    for (let j = 1; j <= cols; j++) {
      const cx = x - w / 2 + w * j / (cols + 1);
      panels.push([cx, cy, z + d / 2 + .18, ww, wh, .3], [cx, cy, z - d / 2 - .18, ww, wh, .3]);
      ledges.push([cx, cy - wh / 2 - .6, z + d / 2 + .35, ww + 1, .65, .8], [cx, cy - wh / 2 - .6, z - d / 2 - .35, ww + 1, .65, .8]);
    }
    const sideCols = Math.max(2, Math.round(cols * d / w));
    for (let j = 1; j <= sideCols; j++) {
      const cz = z - d / 2 + d * j / (sideCols + 1);
      panels.push([x - w / 2 - .18, cy, cz, .3, wh, ww], [x + w / 2 + .18, cy, cz, .3, wh, ww]);
    }
  }
  batch(g, GEO.box, mat, panels); batch(g, GEO.box, 'white', ledges);
}
function bands(g, w, d, h, floors = 2, x = 0, z = 0, y = 0) {
  for (let i = 0; i <= floors; i++) box(g, x, y + h * i / floors, z, w + 1.8, 1.2, d + 1.8, 'white');
}
function column(g, x, z, y, height, r = 1.7, mat = 'white') {
  const pools = g.userData.columnPools ||= {};
  const instances = pools[mat] ||= [];
  instances.push([x, y + height / 2, z, r, height, r],
    [x, y + .8, z, r * 1.4, 1.6, r * 1.4],
    [x, y + height - .8, z, r * 1.35, 1.6, r * 1.35]);
}
function stairs(g, x, z, width, steps = 5, direction = 1) {
  for (let i = 0; i < steps; i++) box(g, x, .7 * (steps - i), z + direction * i * 2,
    width + i * 2, 1.4 * (steps - i), 3, 'stone');
}
function cross(g, x, y, z, height = 8, mat = 'gold') {
  box(g, x, y + height / 2, z, .8, height, .8, mat);
  box(g, x, y + height * .65, z, height * .48, .75, .8, mat);
  box(g, x, y + height * .83, z, height * .25, .5, .65, mat);
}
function onion(g, x, y, z, r, mat = 'gold') {
  const profile = [new THREE.Vector2(0, 0), new THREE.Vector2(r * .76, 0),
    new THREE.Vector2(r, r * .62), new THREE.Vector2(r * .93, r * 1.12),
    new THREE.Vector2(r * .6, r * 1.65), new THREE.Vector2(r * .25, r * 2.03),
    new THREE.Vector2(0, r * 2.4)];
  mesh(g, new THREE.LatheGeometry(profile, 24), mat, x, y, z);
  cross(g, x, y + r * 2.35, z, r * .8);
}
function dome(g, x, y, z, r, mat = 'gold') {
  mesh(g, new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y, z, r, r * .82, r);
  cyl(g, x, y + r * .77, z, r * .14, r * .25, mat);
  cross(g, x, y + r * .9, z, r * .55);
}
function building(g, x, z, w, h, d, color = 'cream', floors = 2, roof = 'red') {
  box(g, x, h / 2, z, w, h, d, color);
  bands(g, w, d, h, floors, x, z); windows(g, w, d, h, floors, Math.max(3, Math.round(w / 9)), 'dark', x, z);
  gable(g, x, h + .5, z, w + 3, Math.min(12, w * .18), d + 3, roof);
}
function clock(g, x, y, z, radius = 5, direction = 0) {
  const face = new THREE.Group(); face.position.set(x, y, z); face.rotation.y = direction; g.add(face);
  const m = cyl(face, 0, 0, 0, radius, .65, 'white'); m.rotation.x = Math.PI / 2;
  const marks = [];
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6; marks.push([Math.sin(a) * radius * .81, Math.cos(a) * radius * .81, .6, .55, radius * .18, .25, 0, 0, -a]);
  }
  batch(face, GEO.box, 'dark', marks);
  const h = box(face, -radius * .14, radius * .18, .85, .65, radius * .58, .25, 'dark'); h.rotation.z = Math.PI / 4;
  const minute = box(face, radius * .22, radius * .25, .9, .5, radius * .85, .25, 'dark'); minute.rotation.z = -Math.PI / 4;
}

function oldCathedral(g, kind) {
  const catherine = kind === 'catherine';
  const main = catherine ? 'yellow' : 'mint';
  const base = catherine ? 30 : 33, h = catherine ? 32 : 36;
  box(g, 0, 2, 0, base + 7, 4, 64, 'stone');
  building(g, 0, 4, base, h, 36, main, 2, 'green');
  building(g, 0, 28, base + 7, 18, 18, main, 1, 'green');
  box(g, 0, 19, -21, 28, 38, 22, main); bands(g, 28, 22, 38, 3, 0, -21);
  cyl(g, 0, h + 8, 4, 8.5, 14, main); cyl(g, 0, h + 14.5, 4, 10, 2, 'white');
  onion(g, 0, h + 16, 4, 9, 'green');
  if (!catherine) for (const [x, z] of [[-11, -6], [11, -6], [-11, 16], [11, 16]]) {
    cyl(g, x, h + 1, z, 3, 7, 'white'); onion(g, x, h + 4.5, z, 3.8, 'green');
  }
  // A slender stepped belfry is the defining lost skyline feature.
  box(g, 0, 42, -21, 20, 10, 17, main); bands(g, 20, 17, 10, 1, 0, -21, 37);
  box(g, 0, 53, -21, 14, 12, 13, main); bands(g, 14, 13, 12, 1, 0, -21, 47);
  windows(g, 14, 13, 12, 1, 2, 'dark', 0, -21, 47);
  cyl(g, 0, 63, -21, 6.5, 9, main); cone(g, 0, 73, -21, 8, 13, 'green'); cross(g, 0, 80, -21, 6);
  for (const x of [-12, 12]) { column(g, x, 37, 0, 18); }
  gable(g, 0, 19, 38, 30, 7, 7, 'white'); stairs(g, 0, 42, 29, 4);
}
function nevsky(g) {
  box(g, 0, 2, 0, 73, 4, 65, 'stone');
  building(g, 0, 0, 63, 34, 46, 'yellow', 2, 'green');
  box(g, 0, 21, 23, 44, 42, 18, 'yellow');
  for (const x of [-16, -8, 0, 8, 16]) column(g, x, 36, 0, 30, 2);
  box(g, 0, 31, 35, 44, 3, 9, 'white'); gable(g, 0, 33, 35, 46, 11, 9, 'white');
  stairs(g, 0, 39, 47, 6);
  cyl(g, 0, 42, -2, 14, 18, 'yellow'); cyl(g, 0, 51, -2, 15, 2, 'white'); dome(g, 0, 53, -2, 15, 'gold');
  for (const [x, z] of [[-23, -15], [23, -15], [-23, 16], [23, 16]]) {
    cyl(g, x, 36, z, 6.4, 12, 'yellow'); dome(g, x, 43, z, 7.5, 'gold');
  }
  const colonnade = [];
  for (const x of [-35, 35]) for (let z = -23; z <= 20; z += 9) colonnade.push([x, 17, z, 1.7, 30, 1.7]);
  batch(g, GEO.cylinder, 'white', colonnade);
}
function sevastyanov(g) {
  building(g, 0, 0, 45, 18, 28, 'mint', 2, 'red');
  building(g, 13, 18, 19, 18, 24, 'mint', 2, 'red');
  // Red and white arches and a polygonal corner rotunda distinguish the facade.
  const rot = cyl(g, -20, 10, 13, 13, 20, 'mint');
  rot.geometry = new THREE.CylinderGeometry(1, 1, 1, 8);
  const top = cone(g, -20, 24, 13, 14, 10, 'red'); top.geometry = new THREE.ConeGeometry(1, 1, 8);
  cyl(g, -20, 20, 13, 14, 1.6, 'white');
  const ornaments = [], redFrames = [];
  for (let j = 0; j < 8; j++) {
    const a = j * Math.PI / 4, x = -20 + Math.cos(a) * 12.2, z = 13 + Math.sin(a) * 12.2;
    ornaments.push([x, 11, z, 1.1, 18, 1.1]);
    const window = box(g, x, 12.5, z, 4.3, 5.5, .4, 'dark'); window.rotation.y = Math.PI / 2 - a;
    const trim = box(g, x, 16.3, z, 5.8, 1.2, .9, 'white'); trim.rotation.y = Math.PI / 2 - a;
  }
  for (let i = 0; i < 7; i++) {
    const x = -16 + i * 6;
    ornaments.push([x, 9, 14.8, .8, 17.6, .8]);
    redFrames.push([x + 2.3, 13, 14.7, .6, 6, .6], [x - 2.3, 13, 14.7, .6, 6, .6], [x, 16, 14.7, 5, .8, .6]);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.55, .4, 5, 10, Math.PI), materials.white);
    arch.position.set(x, 15.4, 15); g.add(arch);
  }
  batch(g, GEO.box, 'white', ornaments); batch(g, GEO.box, 'red', redFrames);
  box(g, 1, 2, 15.5, 45, 3, 2, 'white'); box(g, 1, 18.5, 15.5, 45, 2, 2, 'white');
  for (const x of [-16, 0, 16]) gable(g, x, 19, 14, 8, 5, 3, 'white');
  stairs(g, 13, 32, 13, 3);
}
function estate(g) {
  building(g, 0, -10, 74, 22, 31, 'yellow', 2, 'green');
  for (const x of [-43, 43]) building(g, x, 16, 21, 15, 46, 'yellow', 1, 'green');
  for (const x of [-43, 43]) building(g, x, 42, 27, 19, 17, 'yellow', 2, 'green');
  for (const x of [-18, -10.8, -3.6, 3.6, 10.8, 18]) column(g, x, 9, 1, 22, 1.8);
  box(g, 0, 23, 9, 46, 2.5, 9, 'white'); gable(g, 0, 25, 9, 49, 10, 9, 'white');
  stairs(g, 0, 15, 47, 5);
  const fence = [];
  for (let x = -57; x <= 57; x += 7) fence.push([x, 3, 58, .7, 6, .7]);
  batch(g, GEO.box, 'dark', fence); box(g, 0, 5, 58, 115, .5, .6, 'dark');
  // Rear garden pavilion and alleys remain in the same plot over all later years.
  cyl(g, 13, 8, -79, 8, 1, 'white'); dome(g, 13, 9, -79, 9, 'white');
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; column(g, 13 + 7 * Math.cos(a), -79 + 7 * Math.sin(a), 0, 8, .8); }
}
function opera(g) {
  building(g, 0, -13, 87, 31, 55, 'cream', 3, 'green');
  box(g, 0, 21, 16, 56, 42, 25, 'cream'); bands(g, 56, 25, 42, 3, 0, 16);
  for (const x of [-21, -12.6, -4.2, 4.2, 12.6, 21]) column(g, x, 34, 7, 26, 2.1);
  box(g, 0, 35, 34, 57, 3, 11, 'white'); gable(g, 0, 37, 34, 60, 10, 11, 'white');
  stairs(g, 0, 41, 58, 7);
  for (const x of [-35, 35]) {
    box(g, x, 34, 16, 18, 8, 22, 'cream'); gable(g, x, 39, 16, 20, 12, 23, 'green');
    sphere(g, x, 52, 16, 2.4, 'white');
  }
  // Apollo / sculptural roof silhouettes, rather than an untextured flat block.
  const statues = [];
  for (const x of [-22, -11, 0, 11, 22]) {
    statues.push([x, 51, 34, 1.2, 5.5, 1.2]); sphere(g, x, 54.5, 34, 1.4, 'white');
  }
  batch(g, GEO.cylinder, 'white', statues);
  box(g, 0, 11, 37, 47, 3, 3, 'white');
}
function station(g) {
  building(g, 0, 0, 104, 19, 31, 'cream', 2, 'red');
  for (const x of [-43, 43]) { building(g, x, 0, 21, 24, 37, 'cream', 2, 'red'); cone(g, x, 34, 0, 14, 13, 'red'); }
  building(g, 0, 3, 30, 28, 35, 'cream', 2, 'red');
  clock(g, 0, 24, 21, 3.4);
  box(g, 0, 6, 21, 14, 12, 2, 'dark'); stairs(g, 0, 23, 25, 3);
  box(g, 0, 1, -37, 135, 2, 18, 'stone');
  const legs = [];
  for (let x = -60; x <= 60; x += 12) legs.push([x, 6.5, -40, .8, 11, .8]);
  batch(g, GEO.box, 'steel', legs); box(g, 0, 12.5, -40, 133, 1, 14, 'green');
}
function ipatiev(g) {
  building(g, 0, 0, 33, 15, 27, 'white', 2, 'green');
  building(g, 15, -8, 18, 15, 18, 'white', 2, 'green');
  box(g, 0, 3.8, 15, 42, 7.6, 1.2, 'wood');
  box(g, -22, 3.8, 0, 1.2, 7.6, 31, 'wood');
  box(g, 23, 3.8, 0, 1.2, 7.6, 31, 'wood');
  // The closed wooden fence belongs only to the 1918 episode.
  g.userData.fence = g.children.slice(-3);
}
function whiteTower(g) {
  box(g, 0, 1.5, 0, 27, 3, 28, 'stone');
  box(g, -5, 18, -5, 10, 34, 12, 'white');
  box(g, -5, 19, 1.2, 4.5, 28, .4, 'dark');
  for (const x of [-10, 10]) for (const z of [-8, 8]) box(g, x, 21, z, 2.4, 38, 2.4, 'white');
  cyl(g, 0, 42, 0, 18, 21, 'white'); cyl(g, 0, 32, 0, 18.5, 2.2, 'white');
  cyl(g, 0, 53, 0, 18.5, 2.2, 'white'); cyl(g, 0, 56, 0, 9.2, 4.5, 'white');
  const slots = [];
  for (let j = 0; j < 28; j++) { const a = j * Math.PI * 2 / 28; slots.push([17.95 * Math.cos(a), 46, 17.95 * Math.sin(a), .35, 4.3, 1.8, 0, -a, 0]); }
  batch(g, GEO.box, 'dark', slots);
  const rail = [];
  for (let j = 0; j < 24; j++) { const a = j * Math.PI * 2 / 24; rail.push([17.8 * Math.cos(a), 56, 17.8 * Math.sin(a), .35, 3.5, .35]); }
  batch(g, GEO.box, 'steel', rail);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(17.8, .3, 4, 48), materials.steel); ring.rotation.x = Math.PI / 2; ring.position.y = 57.5; g.add(ring);
}
function uralmash(g) {
  building(g, 0, 0, 83, 31, 37, 'cream', 3, 'red');
  for (const x of [-34, -23, -12, 0, 12, 23, 34]) column(g, x, 22, 2, 25, 1.5);
  box(g, 0, 30, 22, 86, 3, 7, 'white');
  for (let i = 0; i < 4; i++) {
    const z = -85 - i * 80; box(g, 0, 12, z, 130, 24, 65, 'brick');
    windows(g, 130, 65, 24, 2, 16, 'glass', 0, z);
    for (let j = 0; j < 5; j++) gable(g, -52 + j * 26, 24, z, 26, 10, 67, 'steel');
  }
  for (const [x, z, h] of [[-85, -140, 73], [88, -225, 91], [88, -325, 61]]) {
    cyl(g, x, h / 2, z, 5.5, h, 'brick'); cyl(g, x, h, z, 6.4, 2, 'dark');
  }
}
function cityhall(g) {
  building(g, 0, 0, 105, 30, 46, 'cream', 3, 'green');
  for (const x of [-39, 39]) {
    building(g, x, 23, 21, 39, 22, 'cream', 4, 'green');
    for (const xx of [x - 6, x, x + 6]) column(g, xx, 37, 7, 26, 1.5);
  }
  for (let x = -28; x <= 28; x += 8) column(g, x, 28, 5, 25, 1.35);
  box(g, 0, 31, 27, 66, 2, 8, 'white'); gable(g, 0, 33, 26, 62, 7, 10, 'white');
  const tower = new THREE.Group(); g.add(tower); g.userData.spire = tower;
  box(tower, 0, 43, -2, 22, 27, 19, 'cream'); bands(tower, 22, 19, 27, 3, 0, -2, 29.5);
  clock(tower, 0, 48, 8, 5.4); clock(tower, 11.4, 48, -2, 5.4, Math.PI / 2);
  box(tower, 0, 59, -2, 18, 6, 16, 'white');
  cone(tower, 0, 80, -2, 12, 38, 'gold'); sphere(tower, 0, 102, -2, 2.1, 'gold');
  // Five-point star at the end of the spire.
  const star = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + Math.PI / 2, r = i % 2 ? 1.9 : 4.2; const x = r * Math.cos(a), y = r * Math.sin(a); i ? star.lineTo(x, y) : star.moveTo(x, y); }
  star.closePath(); const s = mesh(tower, new THREE.ExtrudeGeometry(star, { depth: .7, bevelEnabled: false }), 'gold', 0, 107, -2);
  s.rotation.y = Math.PI / 4;
  stairs(g, 0, 32, 61, 4);
}
function ringGeometry(outerX, outerZ, innerX, innerZ, height) {
  const shape = new THREE.Shape(); shape.absellipse(0, 0, outerX, outerZ, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absellipse(0, 0, innerX, innerZ, 0, Math.PI * 2, true); shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 64 });
  geo.rotateX(-Math.PI / 2); return geo;
}
function stadium(g) {
  const old = new THREE.Group(), modern = new THREE.Group(); g.add(old, modern); g.userData.oldStadium = old; g.userData.arena = modern;
  box(g, 0, .6, 0, 208, 1.2, 286, 'stone');
  mesh(g, ringGeometry(107, 143, 75, 109, 9), 'cream', 0, 0, 0);
  // Historical entrance facades stay after reconstruction.
  for (const z of [-148, 148]) {
    const facade = new THREE.Group(); facade.position.z = z; if (z < 0) facade.rotation.y = Math.PI; g.add(facade);
    building(facade, 0, 0, 75, 15, 16, 'cream', 1, 'green');
    for (const x of [-28, -17, -6, 6, 17, 28]) column(facade, x, 10, 0, 14, 1.8);
    box(facade, 0, 15, 10, 78, 2.5, 5, 'white');
    for (const x of [-42, 42]) { box(facade, x, 11, 0, 16, 22, 20, 'cream'); gable(facade, x, 22, 0, 20, 5, 23, 'green'); }
    stairs(facade, 0, 14, 70, 4);
  }
  box(g, 0, 1.4, 0, 68, 1, 111, 'lawn');
  const field = [];
  for (const x of [-34, 34]) field.push([x, 2, 0, .8, .25, 111]);
  for (const z of [-55, 55]) field.push([0, 2, z, 68, .25, .8]); field.push([0, 2, 0, 68, .25, .6]);
  batch(g, GEO.box, 'white', field);
  const center = new THREE.Mesh(new THREE.TorusGeometry(11, .28, 4, 48), materials.white); center.rotation.x = Math.PI / 2; center.position.y = 2; g.add(center);
  for (const z of [-57, 57]) { box(g, 0, 4, z, 15, .5, .5, 'white'); for (const x of [-7.5, 7.5]) box(g, x, 2.5, z, .5, 5, .5, 'white'); }
  for (let i = 0; i < 6; i++) mesh(old, ringGeometry(82 + i * 4, 116 + i * 4, 79 + i * 4, 113 + i * 4, 1.4), i % 2 ? 'stone' : 'cream', 0, 2 + i * 1.4, 0);
  for (const x of [-100, 100]) for (const z of [-109, 109]) {
    box(old, x, 23, z, 1.7, 46, 1.7, 'steel'); box(old, x, 46, z, 13, 8, 3, 'white');
  }
  mesh(modern, ringGeometry(114, 149, 75, 110, 30), 'white', 0, 4, 0);
  const bowlSeats = [], bowlAisles = [];
  for (let row = 0; row < 12; row++) for (let segment = 0; segment < 88; segment++) {
    const a = segment * Math.PI * 2 / 88;
    const rx = 45 + row * 2.55, rz = 69 + row * 3.23;
    const entry = [rx * Math.cos(a), 3.5 + row * 2.4, rz * Math.sin(a), 5.2, 1.6, 3.3, 0, -a - Math.PI / 2, 0];
    (segment % 11 === 0 ? bowlAisles : bowlSeats).push(entry);
  }
  batch(modern, GEO.box, 'red', bowlSeats); batch(modern, GEO.box, 'stone', bowlAisles);
  const ribs = [];
  for (let i = 0; i < 80; i++) {
    const a = i * Math.PI * 2 / 80; ribs.push([114.7 * Math.cos(a), 19, 149.7 * Math.sin(a), 1.1, 31, 1.1]);
  }
  batch(modern, GEO.box, 'steel', ribs);
  mesh(modern, ringGeometry(118, 153, 68, 103, 4), 'white', 0, 35, 0);
  for (let i = 0; i < 64; i++) {
    const a = i * Math.PI * 2 / 64, start = new THREE.Vector3(70 * Math.cos(a), 37, 105 * Math.sin(a));
    const end = new THREE.Vector3(118 * Math.cos(a), 41.5, 153 * Math.sin(a));
    const direction = end.clone().sub(start), center = end.clone().add(start).multiplyScalar(.5);
    const rib = mesh(modern, GEO.cylinder, 'steel', center.x, center.y, center.z, .65, direction.length(), .65);
    rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  }
  const cable = mesh(modern, new THREE.TorusGeometry(1, .035, 6, 64), 'steel', 0, 39.5, 0, 71, 108, 1);
  cable.rotation.x = Math.PI / 2;
  // The 2018 end stands project outside the oval roof, a memorable real feature.
  const temporary = new THREE.Group(); modern.add(temporary); g.userData.temporaryStands = temporary;
  for (const z of [-166, 166]) {
    const dir = Math.sign(z);
    for (let i = 0; i < 14; i++) {
      box(temporary, 0, 10 + i * 2.4, z + dir * i * 4.7, 88, 1.8, 5.2, i % 4 === 0 ? 'stone' : 'red');
    }
    const supports = [];
    for (const x of [-42, -21, 0, 21, 42]) for (const j of [0, 5, 9, 13]) {
      const h = 10 + j * 2.4; supports.push([x, h / 2, z + dir * j * 4.7, .9, h, .9]);
    }
    batch(temporary, GEO.box, 'steel', supports);
    for (const x of [-42, 42]) for (let j = 0; j < 13; j += 3) {
      const start = new THREE.Vector3(x, 1, z + dir * j * 4.7);
      const end = new THREE.Vector3(x, 10 + (j + 3) * 2.4, z + dir * (j + 3) * 4.7);
      const direction = end.clone().sub(start), center = start.clone().add(end).multiplyScalar(.5);
      const brace = mesh(temporary, GEO.cylinder, 'steel', center.x, center.y, center.z, .6, direction.length(), .6);
      brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    }
    box(temporary, 0, 44, z + dir * 61, 91, 1.2, 1.2, 'steel');
  }
}
function circus(g) {
  cyl(g, 0, 7, 0, 83, 14, 'white', 68); cyl(g, 0, 15, 0, 86, 3, 'cream', 71);
  box(g, 0, 6, 73, 99, 12, 22, 'white'); windows(g, 99, 22, 12, 1, 14, 'glass', 0, 73);
  stairs(g, 0, 89, 95, 7);
  mesh(g, new THREE.SphereGeometry(1, 48, 20, 0, Math.PI * 2, 0, Math.PI / 2), 'glass', 0, 15, 0, 70, 32, 57);
  const positions = [];
  const vertex = (phi, theta) => [Math.cos(theta) * Math.cos(phi) * 96, 16 + Math.sin(phi) * 66, Math.sin(theta) * Math.cos(phi) * 79];
  const line = (a, b) => positions.push(...a, ...b);
  const meridians = 64, rings = 13;
  for (let i = 0; i < meridians; i++) for (let j = 0; j < rings; j++) {
    const t = i * Math.PI * 2 / meridians, tn = (i + 1) * Math.PI * 2 / meridians;
    const p = j * Math.PI / (2 * rings), pn = (j + 1) * Math.PI / (2 * rings);
    line(vertex(p, t), vertex(pn, t)); line(vertex(p, t), vertex(p, tn));
    line(vertex(p, t), vertex(pn, tn));
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const lattice = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xf3efdd })); g.add(lattice);
  const bracing = [];
  for (let i = 0; i < 32; i++) { const a = i * Math.PI * 2 / 32; bracing.push([Math.cos(a) * 93, 9, Math.sin(a) * 76, 1.2, 18, 1.2]); }
  batch(g, GEO.box, 'white', bracing);
}
function blood(g) {
  box(g, 0, 3, 0, 67, 6, 59, 'stone');
  box(g, 0, 14, 0, 59, 25, 51, 'white'); bands(g, 59, 51, 25, 2);
  box(g, 0, 31, 0, 47, 17, 43, 'white'); bands(g, 47, 43, 17, 1, 0, 0, 22.5);
  for (const [x, z] of [[-22, -20], [22, -20], [-22, 20], [22, 20]]) {
    cyl(g, x, 34, z, 7.5, 16, 'white'); cyl(g, x, 42, z, 8.5, 1.6, 'gold'); onion(g, x, 43, z, 8, 'gold');
  }
  cyl(g, 0, 43, 0, 11, 22, 'white'); cyl(g, 0, 54, 0, 12, 1.8, 'gold'); onion(g, 0, 56, 0, 13, 'gold');
  const pilasters = [];
  for (const x of [-26, -18, -9, 0, 9, 18, 26]) pilasters.push([x, 18, 26.1, 1.1, 25, 1.2]);
  batch(g, GEO.box, 'cream', pilasters); windows(g, 59, 51, 25, 2, 7, 'dark', 0, 0, 3);
  box(g, 0, 9, 27, 14, 14, 1.5, 'dark');
  gable(g, 0, 19, 30, 22, 6, 12, 'white'); stairs(g, 0, 36, 30, 8);
}
function glassTower(g, key) {
  const iset = key === 'iset', h = iset ? 210 : 188, r = iset ? 26 : 28;
  const cylinder = cyl(g, 0, h / 2, 0, r, h, 'glass', iset ? r : 21);
  if (!iset) cylinder.geometry = new THREE.CylinderGeometry(1, 1, 1, 12);
  cyl(g, 0, 7, 0, r + 11, 14, 'stone', iset ? r + 11 : 30);
  const floorBands = [], mullions = [];
  for (let i = 0; i <= Math.round(h / 4); i++) {
    const yy = 14 + i * (h - 14) / Math.round(h / 4);
    floorBands.push([0, yy, 0, r + .25, .22, iset ? r + .25 : 21.25]);
  }
  for (let i = 0; i < (iset ? 32 : 24); i++) {
    const a = i * Math.PI * 2 / (iset ? 32 : 24);
    mullions.push([Math.cos(a) * (r + .2), (h + 14) / 2, Math.sin(a) * (iset ? r + .2 : 21.2), .42, h - 14, .42]);
  }
  batch(g, cylinder.geometry, 'steel', floorBands); batch(g, GEO.box, 'steel', mullions);
  if (iset) {
    // Sloping crown, expressed as a few stepped glass facets.
    for (let i = 0; i < 5; i++) {
      const crown = cyl(g, 0, h + i * 1.5, 0, r - i * 2, 1.5, 'glass'); crown.rotation.z = -.08;
    }
  } else { cyl(g, 0, h + 1, 0, r + 1, 3, 'steel', 22); cyl(g, 0, h + 4, 0, 14, 4, 'glass', 11); }
  box(g, 0, 5, r + 9, 39, 10, 20, 'glass'); stairs(g, 0, r + 22, 37, 4);
}
function yeltsin(g) {
  box(g, 0, 12, 0, 78, 24, 69, 'glass'); box(g, 0, 25, 0, 83, 2, 73, 'white');
  const panels = [], openings = [];
  for (let j = 0; j < 22; j++) {
    const x = -40 + j * 3.8, depth = 36 + 2.8 * Math.sin(j * .65);
    panels.push([x, 15, depth, 2.1, 23, 1]);
    for (let k = 0; k < 6; k++) {
      // Perforated facade openings, instanced so the building remains inexpensive.
      openings.push([x + .85, 6 + k * 3.4, depth + .7, .9, 1.5, .35]);
    }
  }
  batch(g, GEO.box, 'white', panels); batch(g, GEO.box, 'dark', openings);
  box(g, 40, 15, 0, 2, 26, 71, 'white');
  box(g, 0, 1, 58, 102, 2, 43, 'stone');
  box(g, -28, 4, 58, 17, 7, 14, 'white');
  const memorial = new THREE.Group(); memorial.position.set(-29, 0, 74); g.add(memorial);
  box(memorial, 0, 6, 0, 5, 12, 2.5, 'white'); sphere(memorial, 0, 12.5, 0, 2, 'white');
}
function workshops(g, type) {
  if (type === 'dam') {
    box(g, 0, 2, 0, 130, 4, 19, 'wood');
    for (const x of [-45, -18, 18, 45]) box(g, x, 3, 0, 9, 6, 25, 'stone');
    box(g, 0, 5.5, 0, 134, 1, 22, 'wood');
    const rails = [];
    for (let x = -65; x <= 65; x += 8) for (const z of [-10, 10]) rails.push([x, 7.5, z, .6, 4, .6]);
    batch(g, GEO.box, 'wood', rails);
    box(g, 0, 9, -10, 134, .5, .5, 'wood'); box(g, 0, 9, 10, 134, .5, .5, 'wood');
    for (const x of [-46, 46]) building(g, x, 22, 27, 10, 23, 'wood', 1, 'red');
    g.userData.woodenDamParts = [];
    g.traverse(p => { if (p.isMesh && p.material === materials.wood) g.userData.woodenDamParts.push(p); });
  } else if (type === 'viz') {
    building(g, 0, 0, 75, 18, 36, 'brick', 2, 'red');
    building(g, -63, -10, 37, 14, 39, 'wood', 1, 'red');
    box(g, 50, 8, -7, 60, 16, 37, 'brick'); gable(g, 50, 16, -7, 63, 9, 41);
    for (const x of [-35, 44]) { cyl(g, x, 24, -30, 3.5, 48, 'brick'); cyl(g, x, 48, -30, 4.2, 2, 'dark'); }
    box(g, 0, 2, 36, 145, 4, 13, 'wood');
  } else if (type === 'electric') {
    building(g, 0, 0, 45, 20, 32, 'brick', 2, 'red');
    cyl(g, 26, 32, -12, 3.3, 64, 'brick'); cyl(g, 26, 64, -12, 4.1, 2, 'dark');
    box(g, -26, 5, 0, 11, 10, 22, 'dark');
  } else {
    building(g, 0, 0, type === 'mint' ? 37 : 52, 12, 25, 'cream', 1, 'red');
    building(g, 24, -12, 20, 12, 23, 'cream', 1, 'red');
    if (type === 'mint') {
      const copper = new THREE.MeshStandardMaterial({ color: 0xb27c49, metalness: .55, roughness: .55 });
      const plates = []; for (let i = 0; i < 12; i++) plates.push([-13 + i % 4 * 7, 1.5 + Math.floor(i / 4) * .7, 22, 5, .5, 5]);
      g.userData.copperPlates = batch(g, GEO.box, copper, plates);
    } else {
      for (const x of [-16, 0, 16]) { cyl(g, x, 4, 24, 6, 8, 'green'); cyl(g, x, 8.5, 24, 7.3, 2, 'green'); }
    }
  }
}
function historicalSquare(g) {
  // Split riverbank park: never place a solid plaza over the Iset channel.
  for (const side of [-1, 1]) {
    const bank=mesh(g,new THREE.BoxGeometry(45,.3,270,30,1,180),'stone',side*60,.15,0);
    bank.userData.terrainPatch=true;
    for (const z of [-90, 0, 90]) {const lawn=mesh(g,new THREE.BoxGeometry(18,.3,65,9,1,33),'lawn',side*72,.35,z);lawn.userData.terrainPatch=true;}
    for (const z of [-110, -55, 55, 110]) box(g, side * 51, .65, z, 5, .55, 1.4, 'wood');
    for (const [z, r] of [[-65, 2.5], [38, 3]]) sphere(g, side * 60, r * .55, z, r, 'stone', r * .55);
  }
  const wheel = new THREE.Group(); wheel.position.set(62, 3, -65); g.add(wheel);
  wheel.add(new THREE.Mesh(new THREE.TorusGeometry(2.5, .25, 6, 24), materials.wood));
  for (let i = 0; i < 8; i++) { const spoke = box(wheel, 0, 0, 0, 5, .18, .18, 'wood'); spoke.rotation.z = i * Math.PI / 8; }
}
function metro(g) {
  // One entrance at its measured station plot. Underground stations are not
  // compressed into an above-ground miniature strip through neighbouring houses.
  const cutaway = new THREE.Group(); cutaway.name = 'underground-route-managed-by-world'; g.add(cutaway); g.userData.cutaway = cutaway;
  box(g, 0, .18, 0, 13, .36, 15, 'stone');
  for (const x of [-5.5, 5.5]) box(g, x, 1.5, 1, .28, 3, 12, 'steel');
  box(g, 0, 3.4, 1, 12, .45, 13, 'white');
  box(g, 0, 1.7, -4.8, 11, 3.2, .4, 'glass');
  for (const x of [-5.5, 5.5]) box(g, x, 1.7, 1, .35, 3.2, 12, 'glass');
  for (let i=0;i<7;i++) box(g, 0, .25 + (6-i)*.16, 5-i*1.25, 10, .18, 1.2, 'stone');
  const sign = new THREE.Group(); sign.position.set(0, 4.1, 6.8); g.add(sign);
  for (const x of [-.75,.75]) box(sign, x, 0, 0, .18, 1.6, .18, 'red');
  for (const [x,a] of [[-.3,.55],[.3,-.55]]) { const m=box(sign,x,.18,0,.18,1.15,.18,'red');m.rotation.z=a; }
}

export function createLandmarks() {
  const group = new THREE.Group(); group.name = 'Historical landmarks';
  const background=createBackgroundLandmarks();group.add(background.group);
  const items = new Map(), targets = {};
  let hasActiveConstruction = false;
  function clippedMaterial(item, source, planes = [item.clipPlane]) {
    const id = source.uuid + '|' + planes.map(p => p._landmarkId).join('|');
    if (!item.materialCopies.has(id)) {
      const copy = source.clone();
      // Three's clone does not copy shader callbacks. Preserve world-space PBR UVs.
      copy.onBeforeCompile = source.onBeforeCompile;
      copy.customProgramCacheKey = source.customProgramCacheKey.bind(source);
      copy.clippingPlanes = planes; copy.clipShadows = true;
      item.materialCopies.set(id, copy);
    }
    return item.materialCopies.get(id);
  }
  function applyClipping(item, model, planes = [item.clipPlane]) {
    model.traverse(o => {
      if (!o.material) return;
      o.material = Array.isArray(o.material)
        ? o.material.map(m => clippedMaterial(item, m, planes))
        : clippedMaterial(item, o.material, planes);
    });
  }
  function installModel(item, model) {
    if (item.metric) item.constructionGroup.remove(item.metric);
    for (const m of item.materialCopies.values()) m.dispose();
    item.materialCopies.clear(); item.phases = new Map();
    const metric = new THREE.Group(); metric.name = item.key + '-metric-normalization';
    metric.add(model); item.constructionGroup.add(metric); item.metric = metric; item.building = model;
    metric.updateMatrixWorld(true);
    // Bounds in author space, including later dated phases, give a stable plot.
    const parent = metric.parent; parent.remove(metric); metric.updateMatrixWorld(true);
    const bounds = model.userData.metricBounds?.clone() || new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
    parent.add(metric);
    if (!bounds.isEmpty()) {
      const spec = item.spec;
      const sx = spec.width / Math.max(.01, size.x), sy = spec.height / Math.max(.01, size.y), sz = spec.depth / Math.max(.01, size.z);
      const center = bounds.getCenter(new THREE.Vector3());
      metric.scale.set(sx, sy, sz);
      metric.position.set(-center.x * sx, -bounds.min.y * sy, -center.z * sz);
      item.localBounds = { min: [-spec.width / 2, 0, -spec.depth / 2], max: [spec.width / 2, spec.height, spec.depth / 2] };
    }
    if(item.key === 'historicSquare') {
      item.group.updateMatrixWorld(true);
      const v=new THREE.Vector3(), center=new THREE.Vector3();
      model.traverse(mesh=>{
        if(!mesh.isMesh||!mesh.geometry?.attributes.position)return;
        const source=mesh.geometry.clone(), geo=source.index?source.toNonIndexed():source;
        const attr=geo.attributes.position, inv=mesh.matrixWorld.clone().invert();
        new THREE.Box3().setFromObject(mesh).getCenter(center);
        const rigidDelta=heightAt(center.x,center.z)-item.position.y;
        const keep=[];
        for(let i=0;i<attr.count;i+=3){
          let sx=0,sz=0,touchesWater=false;
          for(let k=0;k<3;k++){v.fromBufferAttribute(attr,i+k).applyMatrix4(mesh.matrixWorld);sx+=v.x;sz+=v.z;touchesWater ||= isWater(v.x,v.z); }
          if(mesh.userData.terrainPatch && (touchesWater || isWater(sx/3,sz/3)))continue;
          for(let k=0;k<3;k++)keep.push(i+k);
        }
        for(let i=0;i<attr.count;i++){
          v.fromBufferAttribute(attr,i).applyMatrix4(mesh.matrixWorld);
          v.y+=mesh.userData.terrainPatch?heightAt(v.x,v.z)-item.position.y:rigidDelta;
          v.applyMatrix4(inv);attr.setXYZ(i,v.x,v.y,v.z);
        }
        geo.setIndex(keep);geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();mesh.geometry=geo;
      });
      item.group.updateMatrixWorld(true);
      const actual=new THREE.Box3().setFromObject(model);
      item.fullHeight=actual.max.y-item.position.y;
      item.spec.height=actual.max.y-actual.min.y;
    }
    applyClipping(item, model); item.group.updateMatrixWorld(true);
    const initialPhase = model.userData.earlyFacade || model.userData.earlyCore || model.userData.firstFloor1774 || model.userData.oldStadium;
    item.buildHeight = item.fullHeight ?? (initialPhase ? new THREE.Box3().setFromObject(initialPhase).max.y - item.position.y : item.spec.height);
    return model;
  }
  function phase(item, name, model, progress) {
    if (!model) return;
    let entry = item.phases.get(name);
    if (!entry) {
      item.group.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(model);
      const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), b.max.y + 1);
      plane._landmarkId = item.key + '-' + name;
      entry = { plane, min: b.min.y, max: b.max.y }; item.phases.set(name, entry);
      applyClipping(item, model, [item.clipPlane, plane]);
    }
    model.visible = progress > .00001;
    if (item.group.visible && progress > .00001 && progress < .99999) hasActiveConstruction = true;
    entry.plane.constant = entry.min + (entry.max - entry.min) * clamp(progress) + (progress >= 1 ? .1 : 0);
  }
  function add(key, x, z, opened, type, builder, options = {}) {
    const spec = LANDMARKS[key] ? {...LANDMARKS[key]} : { x, z, azimuth: 0, width: 40, depth: 35, height: 25, startYear: options.construction ?? opened - .8, endYear: opened };
    x = spec.x; z = spec.z;
    const ground = heightAt(x, z);
    const root = new THREE.Group(); root.name = key; root.position.set(x, ground, z); root.rotation.y = spec.azimuth || 0; group.add(root);
    const constructionGroup = new THREE.Group(); constructionGroup.name = key + '-construction'; root.add(constructionGroup);
    const buildingGroup = new THREE.Group(); buildingGroup.name = key + '-building';
    if (builder) builder(buildingGroup);
    const columnGroups = [];
    buildingGroup.traverse(p => { if (p.userData.columnPools) columnGroups.push(p); });
    for (const p of columnGroups) {
      for (const [mat, values] of Object.entries(p.userData.columnPools)) batch(p, GEO.cylinder, mat, values);
      delete p.userData.columnPools;
    }
    const position = new THREE.Vector3(x, ground, z);
    const clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), ground); clipPlane._landmarkId = key;
    const item = { ...options, key, spec, group: root, constructionGroup, position, opened, type, clipPlane, materialCopies: new Map(), phases: new Map() };
    installModel(item, buildingGroup);
    items.set(key, item);
    targets[key] = [x, ground + Math.min(spec.height * .55, options.targetY || spec.height * .4), z];
    // A narrow open perimeter platform marks the work level without hiding
    // the roof, courtyard or building silhouette beneath a solid footprint cap.
    const scaffold = new THREE.Group(); scaffold.name = key + '-scaffold'; root.add(scaffold); item.scaffold = scaffold;
    if (builder && type !== 'park' && type !== 'transport') {
      const w = spec.width * .94, d = spec.depth * .94, plank=Math.min(1.1,Math.min(w,d)*.05);
      const poles=[];
      for(let i=0,n=Math.max(1,Math.ceil(w/12));i<=n;i++)for(const zz of[-d/2,d/2])poles.push([-w/2+w*i/n,.5,zz,.14,1,.14]);
      for(let i=1,n=Math.max(1,Math.ceil(d/12));i<n;i++)for(const xx of[-w/2,w/2])poles.push([xx,.5,-d/2+d*i/n,.14,1,.14]);
      batch(scaffold,GEO.box,'steel',poles);
      const deck=new THREE.Group();deck.name=key+'-open-scaffold-deck';deck.position.y=1;deck.scale.y=.02;scaffold.add(deck);item.scaffoldDeck=deck;
      for(const zz of[-(d-plank)/2,(d-plank)/2])box(deck,0,0,zz,w,1,plank,'wood');
      for(const xx of[-(w-plank)/2,(w-plank)/2])box(deck,xx,0,0,plank,1,Math.max(.1,d-2*plank),'wood');
      for(const zz of[-d/2,d/2])box(deck,0,5,zz,w,.35,.08,'steel');
      for(const xx of[-w/2,w/2])box(deck,xx,5,0,.08,.35,d,'steel');
    }
    if (options.removed) {
      const rubble = new THREE.Group(); rubble.name = key + '-rubble'; root.add(rubble);
      const stones = [];
      for (let i = 0; i < 34; i++) {
        const angle = i * 2.39996, radius = 4 + (i % 9) * 2.4;
        stones.push([Math.cos(angle) * radius, 1.3 + i % 3 * .4, Math.sin(angle) * radius, 2 + i % 4, 2 + i % 3, 2 + i % 5, .15 * i, .4 * i, .1 * i]);
      }
      batch(rubble, GEO.box, 'stone', stones); rubble.visible = false; item.rubble = rubble;
      const dust = new THREE.Group(); root.add(dust); item.dust = dust;
      const dustMat = new THREE.MeshStandardMaterial({ color: 0xc5b99c, transparent: true, opacity: .5, roughness: 1, depthWrite: false });
      for (let i = 0; i < 9; i++) sphere(dust, (i % 3 - 1) * 10, 5 + Math.floor(i / 3) * 6, (Math.floor(i / 3) - 1) * 8, 7 + i % 3 * 2, dustMat);
      item.dustMaterial = dustMat;
    }
    return item;
  }
  add('dam', 0, 0, 1723, 'industrial', g => workshops(g, 'dam'), { eventId: 1, construction: 1723, targetY: 5 });
  add('mint', 0, 65, 1726, 'industrial', g => workshops(g, 'mint'), { eventId: 2 });
  add('viz', -850, -300, 1726, 'industrial', g => workshops(g, 'viz'), { eventId: 3 });
  add('gold', 3400, -1200, 1745, 'regional', null, { eventId: 4, targetY: 0 });
  add('mine', 3400, -1200, 1748, 'regional', null, { eventId: 5, targetY: 0 });
  add('lapidary', 55, 100, 1751, 'industrial', g => workshops(g, 'lapidary'), { eventId: 6, targetY: 10, removed:1973, removeEvent:35 });
  add('catherine', 115, -20, 1768, 'cathedral', g => oldCathedral(g, 'catherine'), { eventId: 7, removed: 1930, removeEvent: 27, targetY: 34 });
  add('epiphany', -130, -55, 1774, 'cathedral', g => oldCathedral(g, 'epiphany'), { eventId: 8, removed: 1930, removeEvent: 27, targetY: 34 });
  add('estate', 290, -520, 1824, 'estate', estate, { eventId: 11, targetY: 16, footprint: [.6, .6, 48, 0] });
  // In 1843 the first professional performances used rented premises.
  const theater = add('theater', -100, 70, 1843, 'institution', g => {
    const rented = new THREE.Group(), purposeBuilt = new THREE.Group(); g.add(rented, purposeBuilt);
    building(rented, 0, 0, 29, 11, 24, 'cream', 1, 'red');
    building(purposeBuilt, 0, 0, 48, 17, 31, 'yellow', 2, 'red');
    for (const x of [-14, -7, 0, 7, 14]) column(purposeBuilt, x, 19, 0, 14, 1.3);
    gable(purposeBuilt, 0, 16, 19, 36, 6, 8, 'white'); stairs(purposeBuilt, 0, 24, 34, 3);
    g.userData.rented = rented; g.userData.purposeBuilt = purposeBuilt;
  }, { eventId: 12, targetY: 12 });
  add('nevsky', -260, 600, 1852, 'cathedral', nevsky, { eventId: 13, targetY: 35 });
  add('sevastyanov', 98, -85, 1866, 'mansion', sevastyanov, { eventId: 14, targetY: 12 });
  add('station', 100, -1050, 1878, 'station', station, { eventId: 15, targetY: 18 });
  add('exhibition', -220, 130, 1887, 'temporary', null, { eventId: 16 });
  add('electric', -30, 360, 1895, 'industrial', g => workshops(g, 'electric'), { eventId: 17, targetY: 20 });
  add('square', -160, -85, 1781, 'civic', null, { targetY: 0 });
  add('opera', 520, -60, 1912, 'theater', opera, { eventId: 19, targetY: 25 });
  add('mining', -350, 700, 1914, 'institution', g => {
    const early = new THREE.Group(), later = new THREE.Group(); g.add(early, later);
    // The existing school opened in January 1913; mining occupied it only in 1921.
    building(early, 0, 0, 36, 14, 25, 'cream', 2, 'red');
    building(later, 0, -22, 86, 27, 41, 'cream', 3, 'green');
    for (const x of [-15, -5, 5, 15]) column(later, x, 3, 1, 23, 1.7);
    gable(later, 0, 27, 3, 40, 8, 9, 'white');
    g.userData.early = early; g.userData.later = later;
  }, { eventId: 20, targetY: 15 });
  add('ipatiev', 220, -370, 1890, 'house', ipatiev, { removed: 1977, removeEvent: 36, targetY: 12, footprint: [.7, .7] });
  add('university', 1400, -180, 1920, 'institution', g => {
    const early = new THREE.Group(), campus = new THREE.Group(); g.add(early, campus);
    building(early, 0, 0, 47, 18, 30, 'cream', 2, 'red');
    building(campus, 0, 0, 158, 32, 45, 'cream', 3, 'green');
    building(campus, 0, 9, 47, 47, 58, 'cream', 4, 'green');
    for (const x of [-18, -10.8, -3.6, 3.6, 10.8, 18]) column(campus, x, 39, 2, 34, 1.8);
    gable(campus, 0, 38, 39, 53, 9, 12, 'white');
    for (const x of [-70, 70]) building(campus, x, -47, 26, 24, 71, 'cream', 3, 'green');
    stairs(campus, 0, 45, 50, 6); g.userData.early = early; g.userData.campus = campus;
  }, { eventId: 23, targetY: 25 });
  add('uralmash', 260, -2300, 1933, 'industrial', uralmash, { eventId: 29, construction: 1928, targetY: 23 });
  add('whiteTower', -100, -2450, 1931, 'tower', whiteTower, { eventId: 28, construction: 1929, targetY: 35 });
  add('cityhall', -165, -65, 1934, 'civic', cityhall, { targetY: 49 });
  add('stadium', -1050, 160, 1957, 'stadium', stadium, { eventId: 33, targetY: 18 });
  // Separate registered targets; each uses the same calendar-only reveal adapter.
  for (const key of ['universityEarly','hotelIset','dynamo','cosmos','government','drama','expo','airportTerminal']) {
    const spec=LANDMARKS[key];
    add(key,spec.x,spec.z,spec.endYear,'civic',g=>box(g,0,.5,0,1,1,1,materials.stone),{targetY:Math.min(30,spec.height*.45)});
  }
  // Alias target selects the same stadium plot in 2018 without duplicate geometry.
  targets.arena = [...targets.stadium];
  add('historicSquare', 25, 70, 1973, 'park', historicalSquare, { eventId: 35, targetY: 8 });
  add('circus', -80, 650, 1980, 'circus', circus, { eventId: 37, targetY: 34 });
  add('metro', 260, -1600, 1991, 'transport', metro, { eventId: 38, targetY: 8 });
  add('blood', 220, -370, 2003, 'cathedral', blood, { eventId: 40, targetY: 35, footprint: [.7, .7] });
  add('vysotsky', 390, 150, 2011, 'skyscraper', g => glassTower(g, 'vysotsky'), { eventId: 41, construction: 2008, targetY: 94 });
  add('yeltsin', -240, -530, 2015, 'cultural', yeltsin, { eventId: 42, targetY: 16, footprint: [.7, .7, 14, 9] });
  add('iset', -360, -605, 2016, 'skyscraper', g => glassTower(g, 'iset'), { eventId: 43, construction: 2008, targetY: 106, footprint: [.6, .6] });
  const stadiumItem = items.get('stadium');
  items.set('arena', { ...stadiumItem, opened: 2018, type: 'stadium-alias', alias: true });

  function update(state) {
    hasActiveConstruction = false;
    background.update(state);
    const year = Number.isFinite(state.calendarYear) ? state.calendarYear : state.year;
    const eventId = state.eventId || 0;
    const progress=(key,fallback)=>Number.isFinite(state.constructionProgress?.[key])?clamp(state.constructionProgress[key]):fallback;
    const demolitionProgress=(key,fallback)=>Number.isFinite(state.demolitionProgress?.[key])?clamp(state.demolitionProgress[key]):fallback;
    for (const item of items.values()) {
      if (item.alias) continue;
      const start = item.spec.startYear ?? item.construction ?? item.opened - .8;
      const end = item.spec.endYear ?? item.opened;
      const growth = progress(item.key,start === end ? Number(year >= end) : smooth((year - start) / Math.max(.001, end - start)));
      const removal = item.spec.removedYear ?? item.removed;
      const demolition = demolitionProgress(item.key,removal ? smooth((year - removal) / .35) : 0);
      item.growth = growth; item.demolition = demolition;
      item.group.visible = growth > .00001 && demolition < 1;
      item.building.visible = growth > .00001 && demolition < 1;
      // The mesh remains at full metric scale. A common horizontal work level
      // reveals complete-size masonry, windows and roof details from bottom up.
      const fraction = Math.min(growth, 1 - demolition);
      if (item.group.visible && fraction > .00001 && fraction < .99999) hasActiveConstruction = true;
      const constructionHeight = growth < 1 ? item.buildHeight : (item.fullHeight??item.spec.height);
      item.clipPlane.constant = item.position.y + constructionHeight * fraction + (fraction >= 1 ? .1 : 0);
      item.scaffold.visible = growth > .005 && growth < .98 && demolition === 0;
      const workHeight = Math.max(.8, Math.ceil(item.buildHeight * growth / 3) * 3);
      item.scaffold.scale.y = workHeight;
      if (item.scaffoldDeck) item.scaffoldDeck.scale.y = .20 / workHeight;
      if (item.rubble) {
        const clearing = Number.isFinite(state.demolitionProgress?.[item.key]) ? demolition > 0 && demolition < 1 : year >= removal && year < removal + .55;
        item.rubble.visible = clearing && demolition > .12;
        item.group.visible ||= clearing;
        item.dust.visible = demolition > .01 && demolition < .99;
        item.dustMaterial.opacity = Math.sin(demolition * Math.PI) * .28;
      }
    }
    const theaterData = theater.building.userData;
    // This plot is the permanent 1847 theatre. Earlier rented premises are unlocated.
    theaterData.rented.visible = false; theaterData.purposeBuilt.visible = true;
    const damItem = items.get('dam'), damData = damItem.building.userData;
    damData.woodenDamParts.forEach(part => { part.material = clippedMaterial(damItem, year >= 1973 ? materials.stone : materials.wood); });
    items.get('mint').building.userData.copperPlates.visible = year < 1877;
    items.get('metro').building.userData.cutaway.visible = eventId === 38;
    const miningData = items.get('mining').building.userData;
    miningData.early.visible = year < 1935; miningData.later.visible = year >= 1935;
    const universityItem = items.get('university'), universityData = universityItem.building.userData;
    // The university foundation predates this campus; its first premises are not
    // established at this plot. The camera shows the city for the 1920 event.
    universityData.early.visible = false; universityData.campus.visible = year >= 1929;
    const earlyUniversity=items.get('universityEarly');
    phase(earlyUniversity,'1941-addition',earlyUniversity.building.userData.lateAddition,progress('universityEarlyAddition',smooth((year-1934)/7)));
    const cityhallItem = items.get('cityhall');
    phase(cityhallItem, 'clock-tower', cityhallItem.building.userData.spire, progress('cityhallSpire',smooth((year - 1952) / 2)));
    const ipatievData = items.get('ipatiev').building.userData;
    ipatievData.fence.forEach(fence => { fence.visible = year >= 1918 && year < 1919; });
    const sd = stadiumItem.building.userData;
    const arenaProgress=progress('stadiumArena',smooth((year-2014)/4));
    sd.oldStadium.visible = Number.isFinite(state.constructionProgress?.stadiumArena)?arenaProgress<.03:year<2014;
    phase(stadiumItem, 'arena-reconstruction', sd.arena, arenaProgress);
    phase(stadiumItem,'temporary-stands',sd.temporaryStands,progress('stadiumTemporaryStands',Number(year>=2018&&year<2020)));
  }
  update({ year: 1722, calendarYear: 1722, eventProgress: 0, eventId: 0 });
  return { group, items, targets, background, update, installModel, applyClipping, get hasActiveConstruction() { return hasActiveConstruction||background.hasActiveConstruction; } };
}
