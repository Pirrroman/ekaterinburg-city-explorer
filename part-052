import * as THREE from '../vendor/three.module.js';
import { getMaterials, paint, box, cylinder, gable, addWindow, arch } from '../architecture-kit.js';

// Reference-specific massing reconstructed from the photographs listed in
// data/historic-model-sources.json. These are full 3D models, not image facades.
const up = new THREE.Vector3(0, 1, 0);
const group = name => { const g = new THREE.Group(); g.name = name; return g; };
function solid(parent, geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material); m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function lineBeam(parent, a, b, radius, material) {
  const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), delta = end.clone().sub(start);
  const center = start.clone().add(end).multiplyScalar(.5);
  const m = cylinder(parent, center.x, center.y, center.z, radius, delta.length(), material, 8);
  m.quaternion.setFromUnitVectors(up, delta.normalize()); return m;
}
function ring(parent, x, y, z, radius, thickness, material, segments = 64) {
  const m = solid(parent, new THREE.TorusGeometry(radius, thickness, 8, segments), material, x, y, z);
  m.rotation.x = Math.PI / 2; return m;
}
function lathe(parent, x, y, z, points, material, segments = 64) {
  return solid(parent, new THREE.LatheGeometry(points.map(p => new THREE.Vector2(...p)), segments), material, x, y, z);
}
function cross(parent, x, y, z, h, mat) {
  box(parent, x, y + h / 2, z, .18, h, .2, mat);
  box(parent, x, y + h * .65, z, h * .5, .18, .2, mat);
  box(parent, x, y + h * .85, z, h * .27, .13, .18, mat);
  lineBeam(parent, [x - h * .2, y + h * .25, z], [x + h * .2, y + h * .34, z], .08, mat);
}
function dome(parent, x, y, z, radius, mat, ratio = .75) {
  const points = [];
  for (let i = 0; i <= 24; i++) { const a = i * Math.PI / 48; points.push([Math.cos(a) * radius, Math.sin(a) * radius * ratio]); }
  const m = lathe(parent, x, y, z, points, mat, 80); m.userData.archRoof = true;
  return m;
}
function bulb(parent, x, y, z, radius, mat) {
  const p = [[radius * .5, 0], [radius * .82, radius * .22], [radius, radius * .55],
    [radius * .97, radius * .78], [radius * .8, radius * 1.02], [radius * .45, radius * 1.32],
    [radius * .15, radius * 1.55], [0, radius * 1.7]];
  return lathe(parent, x, y, z, p, mat);
}
function layers(g, x, y, z, w, d, mat, levels = [.4, .8, .5]) {
  let yy = y;
  levels.forEach((h, i) => { box(g, x, yy + h / 2, z, w + i * .45, h, d + i * .45, mat); yy += h; });
}
function dentils(g, x, y, z, width, depth, mat, spacing = 1.4) {
  const countX = Math.round(width / spacing), countZ = Math.round(depth / spacing);
  for (let i = 0; i < countX; i++) {
    const xx = x - width / 2 + (i + .5) * width / countX;
    for (const zz of [z - depth / 2, z + depth / 2]) box(g, xx, y, zz, .48, .65, .55, mat);
  }
  for (let i = 0; i < countZ; i++) {
    const zz = z - depth / 2 + (i + .5) * depth / countZ;
    for (const xx of [x - width / 2, x + width / 2]) box(g, xx, y, zz, .55, .65, .48, mat);
  }
}
function pilaster(g, x, y, z, height, width, mat, rotationY = 0) {
  const p = group('moulded pilaster'); p.position.set(x, y, z); p.rotation.y = rotationY; g.add(p);
  box(p, 0, height / 2, 0, width, height, .46, mat);
  box(p, 0, .5, .2, width + .5, 1, .72, mat);
  box(p, 0, height - .7, .2, width + .65, 1.2, .78, mat);
  for (const dx of [-width * .28, width * .28]) box(p, dx, height / 2, .27, .14, height - 2, .13, mat);
  return p;
}
function column(g, x, y, z, height, radius, mat, ornate = false) {
  cylinder(g, x, y + height / 2, z, radius, height, mat, 32);
  cylinder(g, x, y + .35, z, radius * 1.25, .7, mat, 32);
  cylinder(g, x, y + .95, z, radius * 1.1, .45, mat, 32);
  cylinder(g, x, y + height - .55, z, radius * 1.4, 1, mat, 32);
  box(g, x, y + height + .12, z, radius * 2.9, .55, radius * 2.9, mat);
  if (ornate) for (let j = 0; j < 8; j++) {
    const a = j * Math.PI / 4;
    const ornament = solid(g, new THREE.SphereGeometry(.37, 10, 8), mat,
      x + Math.cos(a) * radius, y + height - 1.1, z + Math.sin(a) * radius);
    ornament.scale.set(.65, 1.8, .65); ornament.rotation.z = Math.cos(a) * .3;
  }
}
function hipRoof(g, x, y, z, w, d, height, material) {
  const left = [-w / 2, 0, -d / 2], right = [w / 2, 0, -d / 2],
    nearRight = [w / 2, 0, d / 2], nearLeft = [-w / 2, 0, d / 2];
  const ridgeInset = Math.min(w * .22, d * .45), r1 = [-w / 2 + ridgeInset, height, 0], r2 = [w / 2 - ridgeInset, height, 0];
  const triangles = [[left, right, r2], [left, r2, r1], [nearRight, nearLeft, r1], [nearRight, r1, r2], [left, r1, nearLeft], [right, nearRight, r2]];
  const positions = [], uvs = [];
  for (const face of triangles) {
    const [a, b, c] = face.map(p => new THREE.Vector3(...p));
    const normal = b.clone().sub(a).cross(c.clone().sub(a));
    const ordered = normal.y < 0 ? [face[0], face[2], face[1]] : face;
    for (const p of ordered) { positions.push(...p); uvs.push(p[0] / w + .5, p[2] / d + .5); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.computeVertexNormals();
  const m = solid(g, geo, material, x, y, z); m.userData.archRoof = true;
  lineBeam(g, [x + r1[0], y + height + .1, z], [x + r2[0], y + height + .1, z], .12, material);
  return m;
}
function profileRoof(g, x, y, z, r, mat, curve) {
  const roof = lathe(g, x, y, z, curve.map(p => [p[0] * r, p[1] * r]), mat);
  roof.userData.archRoof = true; return roof;
}
function pediment(g, x, y, z, w, h, mat, insetMat = mat) {
  const outer = new THREE.Shape(); outer.moveTo(-w / 2, 0); outer.lineTo(w / 2, 0); outer.lineTo(0, h); outer.closePath();
  solid(g, new THREE.ExtrudeGeometry(outer, { depth: .8, bevelEnabled: false }), mat, x, y, z);
  const inner = new THREE.Shape(); inner.moveTo(-w * .39, .6); inner.lineTo(w * .39, .6); inner.lineTo(0, h - .6); inner.closePath();
  solid(g, new THREE.ExtrudeGeometry(inner, { depth: .15, bevelEnabled: false }), insetMat, x, y, z + .81);
}
function pointedShape(w, h) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h * .18);
  s.quadraticCurveTo(w * .44, h * .36, 0, h / 2);
  s.quadraticCurveTo(-w * .44, h * .36, -w / 2, h * .18); s.closePath(); return s;
}
function pointedWindow(g, x, y, z, w, h, mats, rot = 0, redInset = false) {
  const p = group('gothic lancet window'); p.position.set(x, y, z); p.rotation.y = rot; g.add(p);
  if (redInset) box(p, 0, 0, -.14, w + .85, h + .7, .22, mats.red);
  const trim = pointedShape(w + .7, h + .65), hole = new THREE.Path(pointedShape(w, h).getPoints(32)); trim.holes.push(hole);
  solid(p, new THREE.ExtrudeGeometry(trim, { depth: .35, bevelEnabled: false, curveSegments: 24 }), mats.white, 0, 0, 0);
  solid(p, new THREE.ShapeGeometry(pointedShape(w - .2, h - .2), 24), mats.glass, 0, 0, .06);
  box(p, 0, -.4, .2, .15, h - .8, .2, mats.white); box(p, 0, -h * .15, .2, w - .3, .14, .2, mats.white);
  box(p, 0, -h / 2 - .28, .2, w + 1, .42, .8, mats.white);
  return p;
}
function openArchPanel(parent, x, y, z, w, h, holeW, holeH, material, rot = 0, sill = 1) {
  const outer = new THREE.Shape(); outer.moveTo(-w / 2, 0); outer.lineTo(w / 2, 0); outer.lineTo(w / 2, h); outer.lineTo(-w / 2, h); outer.closePath();
  const r = holeW / 2, path = new THREE.Path();
  path.moveTo(-r, sill); path.lineTo(-r, sill + holeH - r);
  path.absarc(0, sill + holeH - r, r, Math.PI, 0, true); path.lineTo(r, sill); path.closePath(); outer.holes.push(path);
  const p = group('open belfry arch'); p.position.set(x, y, z); p.rotation.y = rot; parent.add(p);
  solid(p, new THREE.ExtrudeGeometry(outer, { depth: 1.2, bevelEnabled: false, curveSegments: 24 }), material, 0, 0, -.6);
  arch(p, 0, sill + holeH / 2, .72, holeW + .45, holeH + .35, .35, material);
  return p;
}
function belfry(g, x, y, z, radius, height, material, trim, sides = 8) {
  const width = 2 * radius * Math.tan(Math.PI / sides);
  for (let i = 0; i < sides; i++) {
    const a = i * Math.PI * 2 / sides;
    openArchPanel(g, x + Math.sin(a) * radius, y, z + Math.cos(a) * radius,
      width + .45, height, width * .64, height * .74, material, a, 1);
  }
  cylinder(g, x, y, z, radius * 1.14, .8, trim, sides);
  cylinder(g, x, y + height, z, radius * 1.17, 1.1, trim, sides);
}
function stairs(g, x, z, width, rise, count, mat) {
  for (let i = 0; i < count; i++) box(g, x, rise * (count - i) / 2, z + i * 1.2, width + i * .3, rise * (count - i), 1.6, mat);
}
function ornateQuoin(g, x, y, z, height, mat) {
  for (let yy = .8; yy < height; yy += 1.3) {
    box(g, x, y + yy, z, yy % 2.6 < 1.3 ? 1.8 : 1.1, .7, .55, mat);
  }
}

function catherineEarlyCore(M) {
  const g = group('Catherine 1768 — conservative early core');
  const wall = paint('#bebdb3', 'plaster'), white = paint('#e9e5db', 'stone');
  box(g, 0, 1, -1, 22, 2, 75, M.limestone);
  box(g, 0, 13, -3, 18, 26, 55, wall);
  layers(g, 0, 25.5, -3, 19.2, 56.2, white); gable(g, 0, 27, -3, 20, 5, 56.5, M.roofGreen).userData.archRoof = true;
  for (const side of [-1, 1]) for (let i = 0; i < 7; i++) {
    const zz = -27 + i * 8;
    addWindow(g, side * 9.15, 8, zz, 3, 8, { arched: true, rotationY: side * Math.PI / 2, color: '#e9e5db', glassMaterial: M.glassDark });
    addWindow(g, side * 9.15, 20.3, zz, 2.8, 4, { arched: true, rotationY: side * Math.PI / 2, color: '#e9e5db', glassMaterial: M.glassDark });
    pilaster(g, side * 9.5, 1, zz + 3.6, 24, .9, white, side * Math.PI / 2);
  }
  // The original project drawing documents the narrower ship plan and Baroque
  // crowns. Its precise as-built ornament is unknown, so the early core is spare.
  box(g, 0, 16, -27, 22, 32, 20, wall); layers(g, 0, 31.5, -27, 23, 21, white);
  cylinder(g, 0, 40.1, -27, 7, 14, wall, 8); cylinder(g, 0, 47.8, -27, 8, 1.5, white, 8);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; addWindow(g, Math.sin(a) * 6.8, 40.2, -27 + Math.cos(a) * 6.8, 2.6, 8, { arched: true, rotationY: a, color: '#e9e5db', glassMaterial: M.glassDark }); }
  profileRoof(g, 0, 49, -27, 8, M.roofGreen, [[1, 0], [.98, .3], [.8, .68], [.55, .94], [.22, 1.08]]);
  cylinder(g, 0, 60.1, -27, 2.3, 4.6, white, 8); dome(g, 0, 62.4, -27, 2.8, M.roofGreen, .7); cross(g, 0, 64.5, -27, 4, M.gold);
  box(g, 0, 15.5, 29, 17, 31, 17, wall); layers(g, 0, 30.5, 29, 18.5, 18.5, white);
  addWindow(g, 0, 14, 37.6, 6, 17, { arched: true, color: '#e9e5db', glassMaterial: M.glassDark });
  belfry(g, 0, 33, 29, 5.8, 17, wall, white, 8);
  profileRoof(g, 0, 51.3, 29, 7, M.roofGreen, [[1, 0], [.94, .18], [.66, .6], [.4, .88]]);
  belfry(g, 0, 58.5, 29, 3.1, 8.5, wall, white, 8); bulb(g, 0, 68, 29, 3.5, M.roofGreen);
  solid(g, new THREE.ConeGeometry(1.7, 15, 12), M.roofGreen, 0, 81, 29).userData.archRoof = true;
  cross(g, 0, 88.8, 29, 4, M.gold); stairs(g, 0, 38, 12, .45, 5, M.limestone);
  return g;
}

function epiphanyFirstFloor(M) {
  const g = group('Epiphany 1774 — first-floor milestone reconstruction');
  const wall = paint('#9ab6c6', 'plaster'), white = paint('#e6e4db', 'stone');
  box(g, 0, 1, -2, 34, 2, 71, M.limestone); box(g, 0, 8.5, -7, 31, 17, 53, wall);
  layers(g, 0, 16.7, -7, 32.2, 54.2, white);
  // Low temporary roof avoids pretending the later upper church/belfry was
  // already complete at the first-floor consecration in March 1774.
  hipRoof(g, 0, 18, -7, 33, 55, 4, M.roofGreen);
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    const zz = -28 + i * 8;
    addWindow(g, side * 15.6, 8, zz, 3.7, 8, { arched: true, rotationY: side * Math.PI / 2, color: '#e6e4db', glassMaterial: M.glassDark });
    pilaster(g, side * 15.9, 1, zz + 3.5, 15, .8, white, side * Math.PI / 2);
  }
  box(g, 0, 8.5, 27, 20, 17, 20, wall); layers(g, 0, 16.7, 27, 21, 21, white);
  hipRoof(g, 0, 18, 27, 22, 22, 4, M.roofGreen);
  addWindow(g, 0, 7.4, 37.2, 6.5, 11, { arched: true, color: '#e6e4db', glassMaterial: M.glassDark });
  cross(g, 0, 22.2, 27, 4, M.gold); stairs(g, 0, 38, 14, .45, 4, M.limestone);
  return g;
}

function catherineModel(M) {
  const g = group('Catherine Cathedral — archival reconstruction');
  const wall = paint('#bebdb3', 'plaster'), white = paint('#e9e5db', 'stone');
  const ornament = { white, glass: M.glassDark, red: wall };
  const pointed1854 = group('Catherine pointed window surrounds attested 1854');
  const earlierSurrounds = group('Catherine pre-1854 rounded window surrounds');
  g.add(pointed1854, earlierSurrounds);
  pointed1854.userData.dynamic = true; earlierSurrounds.userData.dynamic = true;
  box(g, 0, 1.1, 0, 35, 2.2, 77, M.limestone);
  box(g, 0, 16, -2, 30, 30, 70, wall);
  layers(g, 0, 14.6, -2, 30.8, 70.8, white); layers(g, 0, 30.5, -2, 31.5, 71.5, white);
  dentils(g, 0, 30.4, -2, 31.6, 71.6, white);
  const naveRoof = gable(g, 0, 32, -5, 31.5, 7, 61, M.roofGreen); naveRoof.userData.archRoof = true;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const zz = -29 + i * 7;
      pointedWindow(pointed1854, side * 15.2, 7.3, zz, 3.2, 8.5, ornament, side * Math.PI / 2);
      addWindow(earlierSurrounds, side * 15.2, 7.3, zz, 3.2, 8.5, { arched: true, rotationY: side * Math.PI / 2, color: '#e9e5db', glassMaterial: M.glassDark });
      addWindow(g, side * 15.2, 22.6, zz, 3.2, 6.5, { arched: true, rotationY: side * Math.PI / 2, color: '#e9e2d2', mullions: 2, glassMaterial: M.glassDark });
      pilaster(g, side * 15.45, 1.3, zz + 3.4, 28.7, .7, white, side * Math.PI / 2);
    }
  }
  // East sanctuary: square body, octagonal upper drum and two bulbous lanterns.
  box(g, 0, 17, -32, 32, 32, 20, wall); layers(g, 0, 31.9, -32, 33, 21, white);
  for (const x of [-11, -5.5, 0, 5.5, 11]) addWindow(g, x, 22, -42.25, 3.2, 7, { arched: true, rotationY: Math.PI, color: '#e9e2d2', glassMaterial: M.glassDark });
  const eastPediment = group('curved eastern gables'); eastPediment.position.set(0, 34, -42.4); eastPediment.rotation.y = Math.PI; g.add(eastPediment);
  pediment(eastPediment, 0, 0, 0, 27, 5.4, white, wall);
  cylinder(g, 0, 40, -27, 7.3, 14, wall, 8); cylinder(g, 0, 47.6, -27, 8.4, 1.5, white, 8);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; addWindow(g, Math.sin(a) * 6.85, 41, -27 + Math.cos(a) * 6.85, 2.6, 8, { arched: true, rotationY: a, color: '#e9e2d2', glassMaterial: M.glassDark }); }
  bulb(g, 0, 49, -27, 6.4, M.roofGreen); cylinder(g, 0, 61, -27, 2.7, 4, white, 8); bulb(g, 0, 63, -27, 2.8, M.roofGreen); cross(g, 0, 68, -27, 5, M.gold);
  // Western stacked octagonal belfry and pencil spire, not five onion domes.
  box(g, 0, 16.4, 29, 23, 32.8, 22, wall); layers(g, 0, 31.8, 29, 24, 23, white);
  for (const x of [-8, 0, 8]) {
    pointedWindow(pointed1854, x, 8, 40.2, 4.1, 9.2, ornament);
    addWindow(earlierSurrounds, x, 8, 40.2, 4.1, 9.2, { arched: true, color: '#e9e5db', glassMaterial: M.glassDark });
    addWindow(g, x, 23, 40.2, 4.1, 7, { arched: true, color: '#e9e2d2', mullions: 2, glassMaterial: M.glassDark });
  }
  for (const x of [-11.6, 11.6]) ornateQuoin(g, x, 2, 40.45, 29, white);
  belfry(g, 0, 34.5, 29, 8.5, 15.3, wall, white);
  cylinder(g, 0, 51, 29, 8.1, 2, M.roofGreen, 8); belfry(g, 0, 53, 29, 5.7, 13, wall, white);
  cylinder(g, 0, 67, 29, 6.6, 1.4, M.roofGreen, 8);
  const spire = solid(g, new THREE.ConeGeometry(3.4, 24, 8), M.roofGreen, 0, 79.8, 29); spire.userData.archRoof = true;
  cross(g, 0, 92, 29, 4, M.gold);
  stairs(g, 0, 41, 13, .5, 5, M.limestone);
  const model = group('Catherine Cathedral — dated historical phases'), early = catherineEarlyCore(M);
  early.userData.dynamic = true; g.userData.dynamic = true; model.add(early, g);
  model.scale.set(1.35, .72, .72);
  model.userData.earlyCore = early; model.userData.late1830s = g;
  model.userData.windowSurrounds1854 = pointed1854; model.userData.pre1854Surrounds = earlierSurrounds;
  model.userData.updateState = state => {
    const year = Number.isFinite(Number(state?.calendarYear ?? state?.year)) ? Number(state.calendarYear ?? state.year) : 1768;
    // Published reconstruction dates are a decade, not an invented exact year.
    // Show the finished widened two-storey wings only after that decade ends.
    early.visible = year < 1840; g.visible = year >= 1840;
    pointed1854.visible = year >= 1854; earlierSurrounds.visible = year < 1854;
  };
  model.userData.updateState({ year: 1768 });
  return model;
}

function epiphanyModel(M) {
  const g = group('Epiphany Cathedral — baroque archival reconstruction');
  const wall = paint('#9ab6c6', 'plaster'), white = paint('#e6e4db', 'stone'), slate = paint('#40525b', 'metal', { roughness: .43, metalness: .5 });
  box(g, 0, 1, 0, 36, 2, 75, M.limestone); box(g, 0, 16.5, -8, 31, 33, 52, wall);
  layers(g, 0, 15, -8, 31.8, 52.8, white); layers(g, 0, 32, -8, 32.6, 53.6, white);
  hipRoof(g, 0, 34, -8, 33, 54, 7, slate);
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    const zz = -29 + i * 8;
    addWindow(g, side * 15.7, 8, zz, 3.7, 8, { arched: true, rotationY: side * Math.PI / 2, color: '#e6e4db', frame: .3, glassMaterial: M.glassDark });
    addWindow(g, side * 15.7, 24, zz, 4, 7.5, { arched: true, rotationY: side * Math.PI / 2, color: '#e6e4db', frame: .4, glassMaterial: M.glassDark });
    pilaster(g, side * 16.05, 2, zz + 3.5, 29, 1.2, white, side * Math.PI / 2);
  }
  // The sanctuary has a substantial faceted cupola and a smaller lantern above.
  cylinder(g, 0, 39, -20, 11.7, 4.5, white, 8);
  profileRoof(g, 0, 41, -20, 11.5, slate, [[1, 0], [.94, .3], [.72, .63], [.4, .85], [.24, .95]]);
  cylinder(g, 0, 55.2, -20, 5.3, 15, wall, 8); cylinder(g, 0, 62.6, -20, 6, 1.6, white, 8);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; addWindow(g, Math.sin(a) * 5, 55, -20 + Math.cos(a) * 5, 2.6, 8, { arched: true, rotationY: a, color: '#e6e4db', glassMaterial: M.glassDark }); }
  bulb(g, 0, 64, -20, 4.8, slate); cylinder(g, 0, 73, -20, 1.8, 2.2, white); bulb(g, 0, 74.1, -20, 1.9, M.gold); cross(g, 0, 77.5, -20, 4, M.gold);
  // Successive open belfry stages create the actual very tall skyline.
  box(g, 0, 15.5, 21, 23, 31, 24, wall); layers(g, 0, 29.8, 21, 24.5, 25.5, white);
  belfry(g, 0, 32, 21, 9.5, 22, wall, white, 4);
  for (const x of [-9.5, 9.5]) for (const z of [11.5, 30.5]) ornateQuoin(g, x, 32.5, z, 21, white);
  layers(g, 0, 54.5, 21, 21, 21, white);
  for (const rot of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const p = group('broken baroque belfry pediment'); p.position.set(Math.sin(rot) * 10.5, 56.1, 21 + Math.cos(rot) * 10.5); p.rotation.y = rot; g.add(p);
    pediment(p, 0, 0, 0, 19, 4.1, white, wall);
  }
  belfry(g, 0, 62, 21, 6.2, 16, wall, white, 4);
  profileRoof(g, 0, 79.1, 21, 7.2, slate, [[1, 0], [.93, .18], [.7, .3], [.62, .55], [.45, .67], [.34, .85], [.14, 1.05]]);
  const spire = solid(g, new THREE.ConeGeometry(1.1, 28, 16), M.gold, 0, 101.2, 21); spire.userData.archRoof = true;
  cross(g, 0, 115.2, 21, 2.8, M.gold);
  // Curved low entry vestibule in front, visible in the archival photograph.
  box(g, 0, 7.2, 39, 20, 14.4, 14, wall); layers(g, 0, 14.1, 39, 21, 15, white);
  hipRoof(g, 0, 15.5, 39, 22, 16, 3.5, slate);
  addWindow(g, 0, 6.2, 46.25, 7.2, 10, { arched: true, color: '#e6e4db', frame: .5, glassMaterial: M.glassDark });
  stairs(g, 0, 46.5, 16, .45, 4, M.limestone);
  const model = group('Epiphany Cathedral — dated first-floor and completed phases'), firstFloor = epiphanyFirstFloor(M);
  firstFloor.userData.dynamic = true; g.userData.dynamic = true; model.add(firstFloor, g); model.scale.setScalar(.67);
  model.userData.firstFloor1774 = firstFloor; model.userData.completed1795 = g;
  model.userData.updateState = state => {
    const year = Number.isFinite(Number(state?.calendarYear ?? state?.year)) ? Number(state.calendarYear ?? state.year) : 1774;
    firstFloor.visible = year < 1795; g.visible = year >= 1795;
  };
  model.userData.updateState({ year: 1774 });
  return model;
}

function nevskyModel(M) {
  const g = group('Alexander Nevsky Cathedral — classical white massing');
  const white = paint('#eeeeE7', 'plaster'), stone = paint('#e0dfd3', 'stone');
  box(g, 0, 1.3, 0, 68, 2.6, 84, M.limestone); box(g, 0, 16, -10, 51, 32, 46, white);
  layers(g, 0, 30, -10, 53, 48, stone); dentils(g, 0, 30.4, -10, 53.5, 48.5, stone);
  hipRoof(g, 0, 32, -10, 55, 50, 3.8, M.roofGreen);
  // Main golden hemisphere on a tall windowed cylindrical drum.
  cylinder(g, 0, 40, -13, 12.8, 17, white, 64); ring(g, 0, 48.6, -13, 13.3, .8, stone);
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    addWindow(g, Math.sin(a) * 12.6, 41, -13 + Math.cos(a) * 12.6, 2.6, 11, { arched: true, rotationY: a, frame: .25, color: '#e0dfd3', glassMaterial: M.glass });
    pilaster(g, Math.sin(a + Math.PI / 12) * 12.9, 32, -13 + Math.cos(a + Math.PI / 12) * 12.9, 16, .65, stone, a + Math.PI / 12);
  }
  dome(g, 0, 50, -13, 13.7, M.gold, .92); cylinder(g, 0, 63.5, -13, 1.6, 4.2, white); bulb(g, 0, 66, -13, 1.7, M.gold); cross(g, 0, 69.3, -13, 5, M.gold);
  // Four secondary hemispheres, each on a windowed drum (not tall onion heads).
  for (const [x, z] of [[-20, -26], [20, -26], [-20, 6], [20, 6]]) {
    cylinder(g, x, 36, z, 5.7, 12.4, white, 48); ring(g, x, 42.3, z, 6.2, .5, stone);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; addWindow(g, x + Math.sin(a) * 5.6, 36, z + Math.cos(a) * 5.6, 1.8, 7.5, { arched: true, rotationY: a, color: '#e0dfd3', glassMaterial: M.glass }); }
    dome(g, x, 43.2, z, 6.6, M.gold, .86); cylinder(g, x, 49.7, z, .85, 2, white); bulb(g, x, 51, z, .95, M.gold); cross(g, x, 53, z, 3.5, M.gold);
  }
  // Front porch and bell tower are separate from the central drum.
  box(g, 0, 15, 28, 24, 30, 26, white); layers(g, 0, 29, 28, 25.5, 27.5, stone);
  belfry(g, 0, 32, 28, 8.1, 22, white, stone, 4);
  dentils(g, 0, 53.7, 28, 17.5, 17.5, stone);
  belfry(g, 0, 57, 28, 5.8, 10, white, stone, 8);
  dome(g, 0, 68.3, 28, 6.5, M.gold, .75);
  solid(g, new THREE.ConeGeometry(1.1, 26, 16), M.gold, 0, 87, 28).userData.archRoof = true;
  cross(g, 0, 100.4, 28, 5, M.gold);
  // Three six-column classical porticoes, matching the building's plan.
  for (const [x, z, rot] of [[0, 43, 0], [-30, -6, -Math.PI / 2], [30, -6, Math.PI / 2]]) {
    const portico = group('six-column Corinthian portico'); portico.position.set(x, 0, z); portico.rotation.y = rot; g.add(portico);
    box(portico, 0, 1.7, 1, 34, 3.4, 13, M.limestone);
    for (const xx of [-13, -7.8, -2.6, 2.6, 7.8, 13]) column(portico, xx, 3.4, 6, 21, 1.1, stone, true);
    box(portico, 0, 25.4, 6, 34, 2, 8, stone); dentils(portico, 0, 26.3, 6, 34, 8, stone);
    pediment(portico, 0, 26.8, 2.3, 36, 6, stone, white); stairs(portico, 0, 7, 34, .45, 7, M.limestone);
  }
  for (const side of [-1, 1]) for (const z of [-27, -13, 2]) {
    addWindow(g, side * 25.7, 12.2, z, 3.2, 7.1, { rotationY: side * Math.PI / 2, color: '#e0dfd3', frame: .25, glassMaterial: M.glass });
    pilaster(g, side * 26, 2, z + 5, 27, 1.2, stone, side * Math.PI / 2);
  }
  g.scale.setScalar(.75);
  return g;
}

function estateModel(M) {
  const g = group('Rastorguyev–Kharitonov asymmetric estate');
  const wall = paint('#ede3b9', 'plaster'), white = paint('#f0ebe0', 'stone');
  const wing = (x, z, w, h, d, stories) => {
    box(g, x, 1, z, w + 1.2, 2, d + 1.2, M.limestone); box(g, x, h / 2 + 1, z, w, h, d, wall);
    layers(g, x, h + .5, z, w + .8, d + .8, white); dentils(g, x, h + .5, z, w + 1.1, d + 1.1, white);
    hipRoof(g, x, h + 2, z, w + 2, d + 2, 4, M.roofGreen);
    const cols = Math.max(2, Math.round(w / 5.9));
    for (let j = 0; j < cols; j++) for (let level = 0; level < stories; level++) {
      const xx = x - w / 2 + (j + .5) * w / cols, yy = 1 + h * (level + .53) / stories;
      for (const side of [-1, 1]) addWindow(g, xx, yy, z + side * (d / 2 + .08), 2.6, stories > 1 ? 6 : 5,
        { rotationY: side > 0 ? 0 : Math.PI, color: '#f0ebe0', frame: .2, glassMaterial: M.glassDark });
    }
    if (stories > 1) layers(g, x, 1 + h / 2, z, w + .4, d + .4, white, [.3, .35]);
  };
  // High corner house, lower colonnaded central house and long service wings.
  wing(38, -6, 34, 26, 34, 2); wing(-3, 3, 43, 16, 29, 1);
  wing(-47, -27, 31, 20, 32, 2); wing(-48, 7, 60, 9, 22, 1);
  wing(-63, -19, 14, 12, 54, 1); wing(2, -40, 68, 13, 19, 1);
  const frontPortico = group('six-column principal portico'); frontPortico.position.set(-1, 0, 18); g.add(frontPortico);
  for (const x of [-15, -9, -3, 3, 9, 15]) column(frontPortico, x, 1, 3.5, 16, 1, white);
  layers(frontPortico, 0, 17.8, 3, 36, 7.5, white); pediment(frontPortico, 0, 19.5, -.5, 38, 6, white, wall);
  stairs(frontPortico, 0, 6, 36, .4, 6, M.limestone);
  const cornerPortico = group('two-storey corner-house portico'); cornerPortico.position.set(38, 0, 12); g.add(cornerPortico);
  for (const x of [-12, -7.2, -2.4, 2.4, 7.2, 12]) column(cornerPortico, x, 1, 4, 25, 1, white);
  layers(cornerPortico, 0, 26.2, 4, 30, 9, white); pediment(cornerPortico, 0, 28, 0, 33, 5, white, wall);
  // Arched carriage passage joining houses; no invented symmetric palace plan.
  const passage = group('carriage passage'); passage.position.set(19, 0, 10); g.add(passage);
  openArchPanel(passage, 0, 1, 7, 12, 16, 6.5, 12, wall); layers(passage, 0, 17, 3, 13, 10, white);
  for (const x of [-5.2, 5.2]) pilaster(passage, x, 1, 7.8, 15, .8, white);
  arch(passage, 0, 8.5, 8, 8.1, 13.7, .5, white);
  // Enclosed courtyard with stone gate piers and forged railing.
  for (let x = -73; x <= 57; x += 13) {
    box(g, x, 3.5, 30, 1.8, 7, 1.8, white); cylinder(g, x, 7.5, 30, 1.1, .6, white, 16);
    if (x < 57) for (let j = 1; j <= 8; j++) box(g, x + j * 1.4, 2.8, 30, .13, 4.7, .13, M.black);
  }
  box(g, -8, 4.9, 30, 130, .16, .16, M.black); box(g, -8, 1.1, 30, 130, .16, .16, M.black);
  return g;
}

function curvingPediment(parent, x, y, z, width, height, white, green) {
  const s = new THREE.Shape(); s.moveTo(-width / 2, 0); s.lineTo(width / 2, 0);
  s.lineTo(width * .45, height * .27); s.quadraticCurveTo(width * .22, height * .27, width * .2, height * .66);
  s.quadraticCurveTo(0, height * 1.25, -width * .2, height * .66);
  s.quadraticCurveTo(-width * .22, height * .27, -width * .45, height * .27); s.closePath();
  solid(parent, new THREE.ExtrudeGeometry(s, { depth: .55, bevelEnabled: false, curveSegments: 20 }), white, x, y, z);
  const inside = solid(parent, new THREE.ExtrudeGeometry(s, { depth: .15, bevelEnabled: false, curveSegments: 20 }), green, x, y + .4, z + .56);
  inside.scale.set(.84, .79, 1);
  const medallion = solid(parent, new THREE.TorusGeometry(height * .18, .15, 8, 32), white, x, y + height * .52, z + .87); medallion.scale.x = .75;
}
function quatrefoil(parent, x, y, z, radius, mat) {
  for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const ringMesh = solid(parent, new THREE.TorusGeometry(radius * .5, radius * .13, 6, 16), mat,
      x + Math.cos(a) * radius * .38, y + Math.sin(a) * radius * .38, z);
  }
}
function sevastyanovModel(M) {
  const g = group('Sevastyanov House — neo-Gothic curved facades');
  const green = paint('#398f82', 'plaster'), white = paint('#f0eee2', 'stone'), red = paint('#9b3e35', 'plaster');
  const decor = { white, red, glass: M.glassDark };
  const h = 24, radius = 10.6;
  // Two long perpendicular wings terminate in the large curved corner facade.
  box(g, -27, 12, -8, 34, h, 20, green); box(g, -8, 12, -29, 20, h, 38, green);
  cylinder(g, 0, 12, 0, radius, h, green, 96);
  hipRoof(g, -27, 24.6, -8, 35.5, 21.5, 3.4, M.roofGreen);
  const roofB = group('long return wing roof'); roofB.position.set(-8, 24.6, -29); roofB.rotation.y = Math.PI / 2; g.add(roofB);
  hipRoof(roofB, 0, 0, 0, 39.5, 21.5, 3.4, M.roofGreen);
  for (const [x, z, w, d] of [[-27, -8, 34, 20], [-8, -29, 20, 38]]) {
    layers(g, x, 1, z, w + .5, d + .5, white, [.35, .3]);
    layers(g, x, 8, z, w + .7, d + .7, white, [.4, .55, .3]);
    layers(g, x, 23.8, z, w + 1, d + 1, white, [.3, .4, .45]);
    dentils(g, x, 23.7, z, w + .8, d + .8, white, .9);
  }
  for (const yy of [1, 8.3, 9.2, 24.1, 25.1]) ring(g, 0, yy, 0, radius + .32, yy === 9.2 ? .38 : .22, white, 96);
  const bays = [];
  for (let i = 0; i < 7; i++) bays.push([-42 + i * 5.1, 2.12, 0]);
  for (let i = 0; i < 7; i++) bays.push([2.12, -45 + i * 5.15, Math.PI / 2]);
  for (const [x, z, rot] of bays) {
    const b = group('ornate flat facade bay'); b.position.set(x, 0, z); b.rotation.y = rot; g.add(b);
    pointedWindow(b, 0, 16.7, .05, 3.3, 10.4, decor, 0, true);
    addWindow(b, 0, 4.7, .04, 3.2, 6, { arched: true, color: '#f0eee2', frame: .25, depth: .32, glassMaterial: M.glassDark });
    arch(b, 0, 4.7, .52, 4.2, 6.9, .3, white);
    for (const xcol of [-2.4, 2.4]) {
      pilaster(b, xcol, 9.3, .23, 13.7, .48, white);
      box(b, xcol, 7.6, .35, .85, .65, .7, white);
    }
    quatrefoil(b, 0, 22.7, .49, .7, white);
    const diamond = box(b, 0, 10.2, .45, .75, .75, .25, red); diamond.rotation.z = Math.PI / 4;
  }
  // Six exposed tall lancets follow the real cylindrical street corner.
  for (let i = 0; i < 8; i++) {
    const a = -.78 + i * 3.1 / 7, rot = Math.PI / 2 - a;
    const b = group('curved rotunda bay'); b.position.set(Math.cos(a) * (radius + .06), 0, Math.sin(a) * (radius + .06)); b.rotation.y = rot; g.add(b);
    pointedWindow(b, 0, 16.65, .04, 2.8, 10.5, decor, 0, true);
    addWindow(b, 0, 4.65, .04, 2.9, 6, { arched: true, color: '#f0eee2', frame: .22, glassMaterial: M.glassDark });
    for (const x of [-1.9, 1.9]) { pilaster(b, x, 9.4, .34, 13.6, .35, white); }
    box(b, 0, 9.6, .7, 3.7, .42, 1, white);
    const railing = group('rotunda stone balcony'); railing.position.set(0, 9.4, 1); b.add(railing);
    for (const x of [-1.4, -.7, 0, .7, 1.4]) box(railing, x, .85, 0, .14, 1.7, .14, white);
    box(railing, 0, 1.6, 0, 3.7, .2, .35, white);
  }
  // Shallow cylindrical lantern and metal cupola rather than a cone turret.
  cylinder(g, 0, 27.3, 0, 8.8, 4.8, green, 96); ring(g, 0, 25.1, 0, 9.2, .35, white);
  ring(g, 0, 29.8, 0, 9.2, .42, white);
  for (let i = 0; i < 20; i++) {
    const a = i * Math.PI / 10, x = Math.sin(a) * 8.75, z = Math.cos(a) * 8.75;
    addWindow(g, x, 27.5, z, 1.35, 2.3, { rotationY: a, color: '#f0eee2', frame: .12, sill: false, glassMaterial: M.glassDark });
  }
  dome(g, 0, 30.4, 0, 9.2, M.roofGreen, .38);
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(Math.cos(a) * 9.2, 30.5, Math.sin(a) * 9.2),
      new THREE.Vector3(Math.cos(a) * 5, 35, Math.sin(a) * 5), new THREE.Vector3(0, 33.9, 0));
    solid(g, new THREE.TubeGeometry(curve, 16, .075, 5, false), white);
  }
  // Curving gables, Gothic diamonds and trefoils across the parapet.
  for (const x of [-40, -29.5, -19]) curvingPediment(g, x, 25.3, 2.4, 10, 4.9, white, green);
  const returnParapet = group('return facade curved parapet'); returnParapet.position.set(2.4, 0, -8); returnParapet.rotation.y = Math.PI / 2; g.add(returnParapet);
  for (const x of [6, 17, 28, 38]) curvingPediment(returnParapet, x, 25.3, 0, 9.4, 4.5, white, green);
  for (let x = -44; x <= -10; x += 1.8) { box(g, x, 25.8, 2.25, 1.5, 1.2, .5, white); const diamond = box(g, x, 25.8, 2.6, .52, .52, .18, red); diamond.rotation.z = Math.PI / 4; }
  for (let z = -48; z <= -10; z += 1.8) { box(g, 2.25, 25.8, z, .5, 1.2, 1.5, white); const diamond = box(g, 2.6, 25.8, z, .18, .52, .52, red); diamond.rotation.x = Math.PI / 4; }
  // Low forged fence with diamond lattice keeps the riverfront setting legible.
  for (let x = -46; x <= 13; x += 3) {
    box(g, x, 2.9, 16, .16, 5.8, .16, M.black);
    solid(g, new THREE.SphereGeometry(.24, 8, 6), M.gold, x, 5.9, 16);
    if (x < 13) { const a = box(g, x + 1.5, 2.7, 16, .11, 4.1, .11, M.black); a.rotation.z = .58;
      const b = box(g, x + 1.5, 2.7, 16, .11, 4.1, .11, M.black); b.rotation.z = -.58; }
  }
  for (const yy of [.8, 4.8]) box(g, -16.5, yy, 16, 62, .15, .15, M.black);
  return g;
}

function ipatievModel(M) {
  const g = group('Ipatiev House — sloping-street archival reconstruction');
  const wall = paint('#dbd4c3', 'plaster'), trim = paint('#ebe3d5', 'stone'), darkRoof = paint('#515d57', 'metal', { roughness: .53, metalness: .42 });
  // A single principal storey above the exposed downhill basement.
  box(g, 0, 2.8, 0, 46, 5.6, 29, M.limestone); box(g, 0, 11.5, 0, 45, 12, 28, wall);
  box(g, -18, 11.5, 1.3, 11, 12, 29.8, wall); box(g, 17, 11.5, 1.3, 11, 12, 29.8, wall);
  layers(g, 0, 5.45, .2, 46, 29, trim, [.35, .45]); layers(g, 0, 17.4, .2, 46.2, 29.2, trim, [.4, .7, .4]);
  dentils(g, 0, 18.1, .2, 46.5, 29.5, trim, .9);
  hipRoof(g, 0, 19.5, 0, 46.5, 30.5, 3.8, darkRoof);
  for (const x of [-20, -14, -7, 0, 7, 14, 20]) {
    addWindow(g, x, 11.7, 15.25, 3.15, 7.1, { color: '#ebe3d5', frame: .32, depth: .3, glassMaterial: M.glassDark });
    box(g, x, 15.7, 15.7, 4.3, .55, .8, trim);
    for (const dx of [-2, 2]) for (const yy of [9.1, 10.3, 12.7, 14]) box(g, x + dx, yy, 15.6, .9, .5, .65, trim);
  }
  for (const side of [-1, 1]) for (const zz of [-9, -2, 5, 11]) {
    addWindow(g, side * 23.6, 11.7, zz, 3.15, 7.1, { rotationY: side * Math.PI / 2, color: '#ebe3d5', frame: .3, glassMaterial: M.glassDark });
  }
  for (const x of [-22.7, -12.5, 11.8, 22.7]) ornateQuoin(g, x, 5.7, 15.8, 11.6, trim);
  for (const x of [-12, -5, 2, 9, 16, 22]) addWindow(g, x, 2.7, 14.7, 2.25, 2.4, { arched: true, color: '#a79e89', frame: .18, glassMaterial: M.glassDark });
  // Distinct arched basement doorway and two raised scalloped attic crowns.
  addWindow(g, -20, 2.9, 15.2, 5, 5.2, { arched: true, color: '#ebe3d5', frame: .45, glassMaterial: M.glassDark });
  arch(g, -20, 3.2, 15.8, 6.5, 6.3, .5, trim);
  for (const x of [-18, 17]) {
    box(g, x, 20, 15.6, 11, 3.2, .75, wall);
    curvingPediment(g, x, 20.2, 16, 10, 4.8, trim, wall);
    addWindow(g, x, 22.1, 16.75, 1.7, 3.3, { arched: true, color: '#ebe3d5', frame: .18, glassMaterial: M.glassDark });
  }
  for (const [x, z] of [[-13, -7], [6, -6], [17, 5]]) {
    box(g, x, 24.5, z, 1.6, 5, 1.6, M.redBrick); box(g, x, 27.1, z, 2.3, .55, 2.3, trim);
  }
  const front = group('1918 opaque front palisade'), left = group('1918 side palisade west'), right = group('1918 side palisade east');
  front.position.set(0, 0, 21); left.position.set(-28, 0, 0); right.position.set(28, 0, 0);
  left.rotation.y = Math.PI / 2; right.rotation.y = Math.PI / 2;
  for (const [fence, width] of [[front, 56], [left, 42], [right, 42]]) {
    g.add(fence);
    for (let xx = -width / 2; xx <= width / 2; xx += .7) box(fence, xx, 4.9, 0, .64, 9.8, .38, M.wood);
    for (const yy of [2.4, 7.5]) box(fence, 0, yy, -.38, width, .45, .5, M.wood);
  }
  g.userData.fence = [front, left, right];
  return g;
}

export function createHistoricModels() {
  const M = getMaterials();
  return {
    catherine: catherineModel(M), epiphany: epiphanyModel(M), nevsky: nevskyModel(M),
    estate: estateModel(M), sevastyanov: sevastyanovModel(M), ipatiev: ipatievModel(M),
  };
}
