import * as THREE from '../vendor/three.module.js';
import { getMaterials, paint, box, cylinder, addWindow, arch } from '../architecture-kit.js';

// Reference-specific models: dimensions are local metres before the scene's
// existing plot transform. No second footprint narrowing is applied here.
const TAU = Math.PI * 2;
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UP = new THREE.Vector3(0, 1, 0);
const matrix = new THREE.Matrix4(), quaternion = new THREE.Quaternion();
const vector = new THREE.Vector3(), scale = new THREE.Vector3();
const geometryCache = new Map();

function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geometry, material);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
  parent.add(o); return o;
}
function instances(parent, cells, material, geometry = UNIT_BOX, shadows = true) {
  if (!cells.length) return null;
  const o = new THREE.InstancedMesh(geometry, material, cells.length);
  cells.forEach((p, i) => {
    vector.set(p.x || 0, p.y || 0, p.z || 0);
    scale.set(p.w ?? 1, p.h ?? 1, p.d ?? 1);
    quaternion.setFromAxisAngle(UP, p.ry || 0);
    matrix.compose(vector, quaternion, scale); o.setMatrixAt(i, matrix);
  });
  o.instanceMatrix.needsUpdate = true; o.castShadow = shadows; o.receiveShadow = true;
  o.computeBoundingBox(); o.computeBoundingSphere(); parent.add(o); return o;
}
function roundPlan(width, depth, radius, steps = 8) {
  const pts = [];
  for (const [cx, cz, start] of [[width/2-radius,depth/2-radius,0],[-width/2+radius,depth/2-radius,Math.PI/2],[-width/2+radius,-depth/2+radius,Math.PI],[width/2-radius,-depth/2+radius,3*Math.PI/2]]) {
    for (let i=0;i<=steps;i++) { const a=start+i*Math.PI/(2*steps); pts.push([cx+radius*Math.cos(a),cz+radius*Math.sin(a)]); }
  }
  return pts;
}
function ellipsePlan(rx, rz, count = 64, cx = 0, cz = 0) {
  return Array.from({length:count},(_,i)=>{const a=i*TAU/count;return[cx+rx*Math.cos(a),cz+rz*Math.sin(a)];});
}
function prismGeometry(plan, height) {
  const key = JSON.stringify([plan,height]);
  if (geometryCache.has(key)) return geometryCache.get(key);
  const shape = new THREE.Shape();
  plan.forEach(([x,z],i)=> i ? shape.lineTo(x,-z) : shape.moveTo(x,-z)); shape.closePath();
  const g = new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:1});
  g.rotateX(-Math.PI/2); g.computeVertexNormals(); geometryCache.set(key,g); return g;
}
function prism(parent, plan, base, height, material, roof = false) {
  const geo=prismGeometry(plan,height), o=mesh(parent,geo,material,0,base,0);
  if (roof) o.userData.roof = 'horizontal-cap'; return o;
}
function planBand(parent, plan, y, h, material) { return prism(parent,plan,y,h,material,true); }
function stairs(parent,x,z,width,depth,rise,steps=10,material=getMaterials().limestone) {
  for(let i=0;i<steps;i++) box(parent,x,rise*(i+1)/(2*steps),z-depth/2+depth*(i+.5)/steps,width,rise*(i+1)/steps,depth/steps+.04,material);
}
function beam(parent, a, b, radius, material, segments=8) {
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
  const o=mesh(parent,new THREE.CylinderGeometry(radius,radius,delta.length(),segments),material);
  o.position.copy(start.add(end).multiplyScalar(.5)); o.quaternion.setFromUnitVectors(UP,delta.normalize()); return o;
}
function glassPalette(m) {
  return ['#78979b','#729196','#809b9e','#6f8e93'].map(color=>{
    const material=m.glass.clone();material.color.set(color);material.roughness=.16;material.metalness=.35;material.envMapIntensity=1.45;return material;
  });
}
function curtainWall(parent, plan, base, floorHeight, floors, m, {bay=1.8,band=.23,bronze=false}={}) {
  const paneSets=[[],[],[],[]],frames=[],horizontal=[],ribs=[];
  const palette=glassPalette(m);
  for(let i=0;i<plan.length;i++) {
    const a=plan[i],b=plan[(i+1)%plan.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    if(length<.01)continue;
    const nx=dz/length,nz=-dx/length,rotation=Math.atan2(nx,nz),count=Math.max(1,Math.round(length/bay));
    for(let k=0;k<count;k++) {
      const t=(k+.5)/count,x=a[0]+dx*t+nx*.11,z=a[1]+dz*t+nz*.11;
      for(let f=0;f<floors;f++) {
        const hash=((Math.imul(f+17,73856093)^Math.imul(i+3,19349663)^Math.imul(k+11,83492791))>>>0);
        // The reflected environment should describe the facade. Sparse office
        // tint changes avoid the false repeating checkerboard of the first QA.
        const index=hash%37===0?1:hash%53===0?2:hash%101===0?3:0;
        paneSets[index].push({x,y:base+(f+.5)*floorHeight,z,w:length/count-.12,h:floorHeight-band,d:.10,ry:rotation});
      }
    }
    for(let k=0;k<=count;k++) {
      const t=k/count;frames.push({x:a[0]+dx*t+nx*.22,y:base+floors*floorHeight/2,z:a[1]+dz*t+nz*.22,w:.085,h:floors*floorHeight,d:.19,ry:rotation});
    }
    for(let f=0;f<=floors;f++) horizontal.push({x:(a[0]+b[0])/2+nx*.19,y:base+f*floorHeight,z:(a[1]+b[1])/2+nz*.19,w:length+.06,h:band,d:.20,ry:rotation});
    if(bronze && i%4===0)ribs.push({x:a[0]+nx*.44,y:base+floors*floorHeight/2,z:a[1]+nz*.44,w:.34,h:floors*floorHeight,d:.65,ry:rotation});
  }
  paneSets.forEach((p,i)=>instances(parent,p,palette[i],UNIT_BOX,false));
  instances(parent,frames,m.steel); instances(parent,horizontal,paint('#58686a','metal',{roughness:.28,metalness:.72}));
  if(ribs.length)instances(parent,ribs,m.copper);
}
function planRail(parent,plan,y,height,m) {
  const bars=[],posts=[];
  for(let i=0;i<plan.length;i++) {
    const a=plan[i],b=plan[(i+1)%plan.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
    if(length<.01)continue;
    const ry=-Math.atan2(dz,dx);
    bars.push({x:(a[0]+b[0])/2,y:y+height,z:(a[1]+b[1])/2,w:length+.03,h:.09,d:.09,ry});
    posts.push({x:a[0],y:y+height/2,z:a[1],w:.07,h:height,d:.07});
  }
  instances(parent,bars,m.steel);instances(parent,posts,m.steel);
}

function cross(parent,x,y,z,size,m) {
  const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);
  box(g,0,size*.5,0,.13*size,size,.11*size,m);
  box(g,0,size*.66,0,size*.66,size*.10,.13*size,m);
  box(g,0,size*.85,0,size*.38,size*.085,.12*size,m);
  const lower=box(g,0,size*.29,0,size*.45,size*.065,.12*size,m);lower.rotation.z=-.27;
  return g;
}
function goldHelmet(parent,x,y,z,r,m) {
  const profile=[[r,0],[r*1.015,r*.07],[r*.985,r*.23],[r*.84,r*.54],[r*.60,r*.78],[r*.27,r*.96],[r*.10,r*1.10],[r*.034,r*1.22],[0,r*1.25]];
  const geo=new THREE.LatheGeometry(profile.map(p=>new THREE.Vector2(...p)),64);
  const dome=mesh(parent,geo,m.gold,x,y,z);dome.userData.roof='lathe-helmet';
  const seams=[];
  // Diamond seams seen in the gold sheet cladding, rather than a smooth sphere.
  for(let j=0;j<profile.length-3;j++)for(let k=0;k<32;k++)for(const sign of [-1,1]){
    const a=k*TAU/32+(j%2)*Math.PI/32,b=a+sign*Math.PI/32;
    const p=profile[j],q=profile[j+1];
    seams.push(x+(p[0]+.016)*Math.cos(a),y+p[1],z+(p[0]+.016)*Math.sin(a),x+(q[0]+.016)*Math.cos(b),y+q[1],z+(q[0]+.016)*Math.sin(b));
  }
  const lines=new THREE.BufferGeometry();lines.setAttribute('position',new THREE.Float32BufferAttribute(seams,3));
  const seamMesh=new THREE.LineSegments(lines,new THREE.LineBasicMaterial({color:'#736035',transparent:true,opacity:.38}));parent.add(seamMesh);
  cylinder(parent,x,y+.04,z,r*1.018,.12,m.gold,64);
  cylinder(parent,x,y+r*1.27,z,r*.07,r*.15,m.gold,16);
  cross(parent,x,y+r*1.32,z,r*.52,m.gold);
}
function octaveDrum(parent,x,z,base,r,height,m,{open=false}={}) {
  const g=new THREE.Group();g.position.set(x,base,z);parent.add(g);
  cylinder(g,0,height/2,0,r,height,m.whiteStone,8);
  cylinder(g,0,.38,0,r*1.09,.76,m.whiteStone,8);
  cylinder(g,0,height-.32,0,r*1.10,.65,m.whiteStone,8);
  const granite=paint('#76504b','stone',{roughness:.58});
  const faceDistance=r*Math.cos(Math.PI/8),faceWidth=r*2*Math.sin(Math.PI/8);
  for(let i=0;i<8;i++) {
    const a=(i+.5)*TAU/8,nx=Math.sin(a),nz=Math.cos(a);
    const face=new THREE.Group();face.position.set(nx*(faceDistance+.04),height/2,nz*(faceDistance+.04));face.rotation.y=a;g.add(face);
    addWindow(face,0,.10,.06,faceWidth*.68,height*.68,{arched:true,frame:.22,color:'#e9e4d6',depth:.26,mullions:open?0:1,glassMaterial:open?m.interior:m.glassDark});
    for(const sign of [-1,1]) {
      cylinder(face,sign*faceWidth*.40,0,.27,r*.067,height*.73,granite,12);
      cylinder(face,sign*faceWidth*.40,height*.38,.27,r*.09,.22,m.whiteStone,12);
      cylinder(face,sign*faceWidth*.40,-height*.38,.27,r*.09,.26,m.whiteStone,12);
    }
  }
  goldHelmet(parent,x,base+height+.20,z,r*1.06,m);
  return g;
}

function bloodModel(m) {
  const g=new THREE.Group();g.name='Church on the Blood — stone arcade and five gold helmets';
  const red=paint('#7e4840','stone',{roughness:.72}),gray=paint('#595c5b','stone',{roughness:.81});
  box(g,0,2.8,0,63,5.6,53,gray);box(g,0,7.25,0,59,3.3,49,red);
  box(g,0,20.5,0,54,23.5,45,m.whiteStone);
  box(g,0,33,0,40,5,34,m.whiteStone);
  for(const [y,w,d] of [[5.5,64,54],[9,60,50],[10,58,48],[31.3,55.5,46.5],[32,57,48],[35.2,43,37]])box(g,0,y,0,w,.44,d,m.whiteStone);
  // Four facades receive the red lower arcade, paired tall windows and deep
  // projecting pilasters. The tall central zakomara has nested arch mouldings.
  for(let face=0;face<4;face++) {
    const wall=new THREE.Group();wall.rotation.y=face*Math.PI/2;g.add(wall);
    const width=face%2?45:54,distance=face%2?27.1:22.6;
    for(let x=-width/2+3;x<width/2-1;x+=4.9) {
      addWindow(wall,x,6.8,distance+.34,2.45,3.35,{arched:true,frame:.19,color:'#c8c3b4',glassMaterial:m.interior,mullions:0});
      cylinder(wall,x-1.52,6.5,distance+.54,.23,3.2,red,12);
      cylinder(wall,x+1.52,6.5,distance+.54,.23,3.2,red,12);
    }
    for(const x of [-width/2+2.8,-width*.29,width*.29,width/2-2.8]) {
      addWindow(wall,x,20.8,distance+.18,2.2,17.8,{arched:true,frame:.19,color:'#d9d6c9',mullions:1,glassMaterial:m.glassDark});
      box(wall,x-1.7,20.5,distance+.13,.58,22.5,.58,m.whiteStone);
      box(wall,x+1.7,20.5,distance+.13,.58,22.5,.58,m.whiteStone);
    }
    addWindow(wall,0,25.6,distance+.25,10.4,11.6,{arched:true,frame:.25,color:'#d6d2c4',mullions:2,glassMaterial:m.glassDark});
    for(let k=0;k<4;k++)arch(wall,0,26.8,distance+.30+k*.10,14.3+k*.8,17.5+k*.8,.24,m.whiteStone);
    for(const sign of [-1,1])box(wall,sign*9.1,20.7,distance+.57,.92,21.9,1.02,m.whiteStone);
  }
  octaveDrum(g,0,0,34.5,8.4,9.0,m);
  for(const [x,z] of [[-21,-17],[21,-17],[-21,17],[21,17]])octaveDrum(g,x,z,28.2,5.0,10.0,m,{open:true});
  // Semi-octagonal apse on the river-facing side, in the photographs with a
  // gold half dome and dark granite arched doorways at the lower church.
  const apse=ellipsePlan(8.9,7.7,16,0,26);
  prism(g,apse,0,7.8,gray);prism(g,apse,7.8,9.6,m.whiteStone);
  planBand(g,apse,17.35,.62,m.whiteStone);goldHelmet(g,0,18.0,26,9.0,m);
  addWindow(g,0,5.1,33.7,4.8,6.2,{arched:true,frame:.30,color:'#555652',glassMaterial:m.interior,mullions:0});
  arch(g,0,5.1,34.0,7.2,8.3,.72,gray);
  stairs(g,-17,34,17,13,5.7,16,m.limestone);
  stairs(g,17,34,17,13,5.7,16,m.limestone);
  g.userData.referenceModel='blood';return g;
}

function vysotskyModel(m) {
  const g=new THREE.Group();g.name='Vysotsky — rounded rectangular tower and stepped observatory';
  const plan=roundPlan(58,44,11,8),podium=roundPlan(74,58,10,6);
  prism(g,podium,0,13,m.glassDark);curtainWall(g,podium,1.2,3.65,3,m,{bay:2.4,band:.55});
  planBand(g,podium,12.6,.65,m.steel);stairs(g,0,36,25,12,1.2,5,m.limestone);
  prism(g,plan,13,154,m.glassDark);curtainWall(g,plan,13,3.35,46,m,{bay:1.9,band:.27});
  // The lighter opaque belts and ventilation levels interrupt the curtain wall.
  for(const y of [53,94,134,166])planBand(g,roundPlan(58.4,44.4,11.2,8),y,.65,paint('#aab6b5','metal',{roughness:.30,metalness:.62}));
  const terrace=roundPlan(59,45,12,8);planBand(g,terrace,166.8,1,m.steel);planRail(g,terrace,167.8,1.35,m);
  const upper=roundPlan(49,35,11,8);prism(g,upper,168.0,10,m.glassDark);curtainWall(g,upper,168.0,3.25,3,m,{bay:2.0,band:.25});
  planBand(g,upper,177.8,.70,m.steel);planRail(g,roundPlan(50,36,11,8),178.5,1.15,m);
  // The characteristic open crown contains a setback technical box, cooling
  // equipment and exposed lattice. The 2022 rooftop pool is deliberately not
  // put into the 2011 opening scene.
  box(g,-3,184.0,-3,25,6.8,19,paint('#bec6c5','metal',{roughness:.46,metalness:.52}));
  box(g,-3,187.8,-3,27,.55,21,m.steel);
  const roofRing=roundPlan(42,30,10,8);planRail(g,roofRing,181.2,2.5,m);
  for(let i=0;i<roofRing.length;i+=2) {
    const a=roofRing[i],b=roofRing[(i+4)%roofRing.length];
    beam(g,[a[0],179.8,a[1]],[b[0],185.7,b[1]],.13,m.steel);
  }
  for(const x of [-24,-14,13,23])for(const z of [-15,15]) {
    box(g,x,169.3,z,5.4,2.4,4,m.whiteStone);
    for(let k=0;k<3;k++)cylinder(g,x-1.55+k*1.5,170.55,z,.54,.20,m.black,16);
  }
  g.userData.referenceModel='vysotsky';return g;
}

function isetModel(m) {
  const g=new THREE.Group();g.name='Iset — elliptical curtain wall, bronze ribs and open rod crown';
  const plan=ellipsePlan(24,21,64),base=ellipsePlan(34,29,64);
  prism(g,base,0,13,m.glassDark);curtainWall(g,base,1,3.7,3,m,{bay:2.2,band:.6});
  for(let floor=0;floor<4;floor++)planBand(g,ellipsePlan(34.5-floor*.8,29.5-floor*.6,64),floor*3.7+.8,.48,m.steel);
  const shaftBase=13,fh=3.7355,floors=49;
  prism(g,plan,shaftBase,fh*floors,m.glassDark);curtainWall(g,plan,shaftBase,fh,floors,m,{bay:1.9,band:.19,bronze:true});
  const y=shaftBase+fh*floors;planBand(g,ellipsePlan(24.25,21.25,64),y,.65,m.steel);
  // Unlike Vysotsky's terrace stack, Iset ends with exposed slender bronze
  // vertical fins at unequal heights around a flat technical roof.
  const rods=[];
  for(let i=0;i<32;i++) {
    const a=i*TAU/32,extra=8.9+4.1*(.5+.5*Math.sin(a+.45));
    rods.push({x:24.2*Math.cos(a),y:y+extra/2,z:21.2*Math.sin(a),w:.26,h:extra,d:.42,ry:-a});
  }
  instances(g,rods,m.copper);planRail(g,ellipsePlan(20.5,17.5,32),y+.75,1.35,m);
  box(g,0,y+2.2,0,21,3.6,14,m.steel);box(g,0,y+4.15,0,22,.3,15,m.steel);
  stairs(g,0,35,26,10,1.0,5,m.limestone);
  g.userData.referenceModel='iset';return g;
}

let perforation;
function perforatedMetal(m) {
  if(perforation)return perforation;
  const size=512,pixels=new Uint8Array(size*size*4);
  for(let i=0;i<pixels.length;i+=4){pixels[i]=pixels[i+1]=pixels[i+2]=255;pixels[i+3]=255;}
  let seed=183632;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  // Perforations are real alpha-test openings in the outer metal plane. The
  // separate inner glazing and braces remain visible through them.
  for(let row=0;row<64;row++)for(let col=0;col<64;col++){
    const cx=col*8+(row%2)*4,cy=row*8,r=1.1+random()*2.4;
    for(let yy=Math.max(0,Math.floor(cy-r));yy<Math.min(size,cy+r+1);yy++)for(let xx=Math.max(0,Math.floor(cx-r));xx<Math.min(size,cx+r+1);xx++){
      if((xx-cx)**2+(yy-cy)**2<r*r){const i=(yy*size+xx)*4;pixels[i]=pixels[i+1]=pixels[i+2]=0;}
    }
  }
  const map=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);map.needsUpdate=true;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(1,1);
  map.minFilter=THREE.LinearMipmapLinearFilter;map.magFilter=THREE.LinearFilter;map.generateMipmaps=true;
  // Keep the large pixel buffer out of architecture-kit material cache keys.
  perforation=paint('#edece6','metal',{roughness:.40,metalness:.72,side:THREE.DoubleSide}).clone();
  // Stable coverage at the antialiased contour avoids temporal stochastic noise
  // during camera travel. Distant perforations naturally resolve into metal.
  perforation.alphaMap=map;perforation.alphaTest=.45;perforation.alphaHash=false;perforation.alphaToCoverage=true;
  perforation.name='Yeltsin-steel-perforations';return perforation;
}
function screen(parent,x,y,z,width,height,material,{rotation=0,panelsX=8,panelsY=4}={}) {
  const group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=rotation;parent.add(group);
  const geometry=new THREE.PlaneGeometry(width,height),uv=geometry.getAttribute('uv');
  for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*width/10,uv.getY(i)*height/10);
  uv.needsUpdate=true;mesh(group,geometry,material);
  const steel=getMaterials().steel,frame=paint('#bac0ba','metal',{roughness:.38,metalness:.74});
  for(let i=0;i<=panelsX;i++) {
    const xx=-width/2+i*width/panelsX;box(group,xx,0,-.14,.04,height,.18,frame);
    box(group,xx,0,-.75,.08,height,1.15,steel);
  }
  for(let i=0;i<=panelsY;i++)box(group,0,-height/2+i*height/panelsY,-.13,width,.045,.18,frame);
  return group;
}
function perforatedSign(parent,x,y,z,w,h) {
  if(typeof document==='undefined')return;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;
  const c=canvas.getContext('2d');c.clearRect(0,0,1024,512);c.fillStyle='#293331';c.font='bold 185px "Arial",sans-serif';c.textAlign='center';
  c.fillText('ЕЛЬЦИН',512,222);c.fillText('ЦЕНТР',512,425);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.1,roughness:.6,metalness:.3,depthWrite:false});
  mesh(parent,new THREE.PlaneGeometry(w,h),material,x,y,z);
}
function yeltsinModel(m) {
  const g=new THREE.Group();g.name='Yeltsin Center — asymmetric perforated media facade';
  const metal=perforatedMetal(m),clad=paint('#c8cfca','metal',{roughness:.37,metalness:.58});
  box(g,0,.45,15,98,.9,90,m.limestone);
  // Glass backing of the left museum/office volume; perforated L-shaped
  // screens stand 1.5m in front and reveal the structure through actual holes.
  box(g,-24,15,-3,34,29,43,m.glassDark);
  for(let x=-39;x<=-9;x+=4)box(g,x,15,18.8,.12,27,.15,m.steel);
  for(let y=3;y<=29;y+=4)box(g,-24,y,18.8,33,.18,.18,m.steel);
  screen(g,-29,23,21.2,16,43,metal,{panelsX:5,panelsY:13});
  screen(g,-21,36.5,21.2,32,16,metal,{panelsX:10,panelsY:5});
  // The backing box ends at x=-41: keep the silver screen 1.5m outside it.
  // A screen at x=-40 is buried inside opaque glazing and reads as a black slab.
  screen(g,-42.5,23,-3,43,43,metal,{rotation:-Math.PI/2,panelsX:13,panelsY:13});
  box(g,-23,28.5,21,33,1.1,6,m.steel);box(g,-23,28.9,20,33,.22,8,clad);
  // Central atrium rises behind the low entrance wall, with a descending
  // glass roof profile rather than a single flat white roof slab.
  box(g,1,11.5,-5,40,22,45,m.glassDark);
  const roofProfile=[];
  for(let i=0;i<=64;i++){const x=-12+i*.75,t=i/64;roofProfile.push([x,34-17*(1-Math.pow(1-t,2))]);}
  const roofShape=new THREE.Shape();roofProfile.forEach(([x,y],i)=>i?roofShape.lineTo(x,y):roofShape.moveTo(x,y));
  [...roofProfile].reverse().forEach(([x,y])=>roofShape.lineTo(x,y-.45));roofShape.closePath();
  const roofGeometry=new THREE.ExtrudeGeometry(roofShape,{depth:42.5,bevelEnabled:false,curveSegments:1});
  const roof=mesh(g,roofGeometry,clad,0,0,-24);roof.userData.roof='curved-profile';
  const sideShape=new THREE.Shape();sideShape.moveTo(roofProfile[0][0],1);
  roofProfile.forEach(([x,y])=>sideShape.lineTo(x,y-.45));sideShape.lineTo(roofProfile[roofProfile.length-1][0],1);sideShape.closePath();
  const glazedSide=mesh(g,new THREE.ShapeGeometry(sideShape),m.glass,0,0,17.82);glazedSide.castShadow=false;
  for(let i=0;i<roofProfile.length;i+=4){const[x,y]=roofProfile[i];box(g,x,y/2+.5,18.04,.11,y-1,.23,m.steel);}
  for(const y of [5.5,10,14.5])box(g,12,y,18.03,48,.12,.22,m.steel);
  // Low perforated wall is interrupted by a recessed entrance, not a painted
  // black doorway. Glass is 1.8m behind the metal, with a deep lintel reveal.
  box(g,-4,6.3,24,58,12.4,1,m.glassDark);
  screen(g,-21,7.4,26,24,14,metal,{panelsX:8,panelsY:5});
  screen(g,10.5,7.4,26,23,14,metal,{panelsX:8,panelsY:5});
  screen(g,-5,12.0,26,8,4.8,metal,{panelsX:3,panelsY:2});
  box(g,-5,4.8,24.6,8,9,.16,m.glass);box(g,-5,9.25,25,9,.30,2.0,m.steel);
  for(const x of [-8.4,-6.1,-3.8,-1.5])box(g,x,4.65,24.9,.10,8.6,.22,m.steel);
  perforatedSign(g,-22,4.8,26.05,17,6.5);
  // The right wing is a curved glazed pavilion under a perforated crown.
  const curved=ellipsePlan(26,19,64,25,4);prism(g,curved,1,19,m.glassDark);
  for(let i=0;i<32;i++) {
    const a=i*Math.PI/32,b=(i+1)*Math.PI/32;
    const x0=25+26*Math.cos(a),z0=4+19*Math.sin(a),x1=25+26*Math.cos(b),z1=4+19*Math.sin(b);
    const length=Math.hypot(x1-x0,z1-z0),ry=Math.atan2(z1-z0,-(x1-x0));
    const pane=box(g,(x0+x1)/2,11.0,(z0+z1)/2,length-.1,17.0,.12,m.glass);pane.rotation.y=ry;pane.castShadow=false;
    const crown=screen(g,(x0+x1)/2,22.4,(z0+z1)/2,length+.03,5.7,metal,{rotation:ry,panelsX:1,panelsY:2});
    box(crown,0,0,-.80,length,5.5,.11,m.glassDark);
    box(g,x0,10.5,z0,.10,19,.16,m.steel);
  }
  for(const y of [2.1,6.2,10.3,14.4,18.5])planBand(g,curved,y,.15,m.steel);
  planBand(g,curved,20.1,.40,clad);planBand(g,curved,25.0,.28,clad);
  stairs(g,0,39,77,13,1.0,5,m.limestone);
  g.userData.referenceModel='yeltsin';return g;
}

export function createModernModels() {
  const m=getMaterials();
  return {blood:bloodModel(m),vysotsky:vysotskyModel(m),iset:isetModel(m),yeltsin:yeltsinModel(m)};
}
