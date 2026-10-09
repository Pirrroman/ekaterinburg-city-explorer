import * as THREE from './vendor/three.module.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';

const maps={}, materialCache=new Map(), geometryCache=new Map();
let palette;
const unitBox=new THREE.BoxGeometry(1,1,1),unitPlane=new THREE.PlaneGeometry(1,1);
const key=(...parts)=>parts.join('|');
function geometry(id,make){if(!geometryCache.has(id))geometryCache.set(id,make());return geometryCache.get(id);}

export async function initArchitectureMaterials(){
  const loader=new THREE.TextureLoader();
  const jobs=[];
  for(const surface of ['plaster','stone','brick','roof','concrete','wood']){
    maps[surface]={};
    for(const type of ['color','normal','roughness'])jobs.push(loader.loadAsync(new URL(`./assets/pbr/${surface}-${type}.jpg`,import.meta.url).href).then(t=>{
      t.wrapS=t.wrapT=THREE.RepeatWrapping;
      const repeat={plaster:5,stone:4,brick:7,roof:4,concrete:5,wood:3}[surface];t.repeat.set(repeat,repeat);
      if(type==='color')t.colorSpace=THREE.SRGBColorSpace;
      t.anisotropy=8;maps[surface][type]=t;
    }));
  }
  await Promise.all(jobs);
  materialCache.clear();palette=null;
  return maps;
}

export function paint(color,surface='plaster',options={}){
  const id=key(color,surface,JSON.stringify(options));
  if(materialCache.has(id))return materialCache.get(id);
  const texture=maps[surface]||{};
  const normalStrength={plaster:.12,stone:.19,brick:.34,roof:.32,concrete:.17,wood:.24,metal:.1}[surface]||.1;
  const mat=new THREE.MeshStandardMaterial({
    color,map:texture.color||null,normalMap:texture.normal||null,roughnessMap:texture.roughness||null,
    normalScale:new THREE.Vector2(normalStrength,normalStrength),roughness:surface==='metal'?.4:.76,
    metalness:surface==='metal'?.76:0,envMapIntensity:.6,...options
  });
  if(texture.color){
    // Project scans in world units so a long facade cannot stretch one brick across a wall.
    const density={plaster:.65,stone:.4,brick:.5,roof:.45,concrete:.55,wood:.38}[surface]||.5;
    mat.onBeforeCompile=shader=>{
      const varying='varying vec3 vArchWorld;\nvarying vec3 vArchWorldNormal;\n';
      shader.vertexShader=varying+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
        vec4 archLocalPosition = vec4(transformed,1.0);
        vec3 archLocalNormal = objectNormal;
        #ifdef USE_INSTANCING
          archLocalPosition = instanceMatrix * archLocalPosition;
          archLocalNormal = mat3(instanceMatrix) * archLocalNormal;
        #endif
        vArchWorld = (modelMatrix * archLocalPosition).xyz;
        vArchWorldNormal = normalize(mat3(modelMatrix) * archLocalNormal);`);
      shader.fragmentShader=varying+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('void main() {',`void main() {
        vec3 archAxis = abs(normalize(vArchWorldNormal));
        vec2 archUV = archAxis.x > archAxis.y && archAxis.x > archAxis.z ? vArchWorld.zy : (archAxis.y > archAxis.z ? vArchWorld.xz : vArchWorld.xy);
        archUV *= ${density.toFixed(3)};`);
      for(const chunk of ['map_fragment','roughnessmap_fragment','normal_fragment_begin','normal_fragment_maps']){
        let code=THREE.ShaderChunk[chunk].replace(/vMapUv|vRoughnessMapUv|vNormalMapUv/g,'archUV');
        if(chunk==='map_fragment'&&['plaster','stone'].includes(surface)){
          code=code.replace('diffuseColor *= sampledDiffuseColor;',`float archLuminance = dot(sampledDiffuseColor.rgb, vec3(.2126,.7152,.0722));
            sampledDiffuseColor.rgb = vec3(mix(.83, archLuminance, .17));
            diffuseColor *= sampledDiffuseColor;`);
        }
        shader.fragmentShader=shader.fragmentShader.replace(`#include <${chunk}>`,code);
      }
    };
    mat.customProgramCacheKey=()=>`architectural-world-scan-v4-${surface}`;
  }
  mat.name=`architecture-${surface}-${color}`;materialCache.set(id,mat);return mat;
}

export function getMaterials(){
  if(palette)return palette;
  const glass=new THREE.MeshPhysicalMaterial({color:'#7394a1',metalness:.08,roughness:.12,reflectivity:.86,clearcoat:1,clearcoatRoughness:.09,ior:1.48,envMapIntensity:.95});glass.name='architectural-glass';
  const glassDark=glass.clone();glassDark.color.set('#263b43');glassDark.roughness=.23;
  palette={
    plasterWarm:paint('#e0d2b9'),plasterMint:paint('#7cab9b'),whiteStone:paint('#ebe9e3','stone'),
    limestone:paint('#c7bea9','stone'),redBrick:paint('#995e46','brick'),roofTerracotta:paint('#aa553b','roof'),
    roofGreen:paint('#244f4a','metal',{roughness:.42}),copper:paint('#887360','metal',{roughness:.38}),
    concrete:paint('#b1b0a5','concrete'),glass,glassDark,steel:paint('#718087','metal',{metalness:.85,roughness:.3}),
    wood:paint('#968674','wood'),asphalt:paint('#656966','concrete'),gold:paint('#c5a047','metal',{metalness:1,roughness:.31,envMapIntensity:.9}),
    black:paint('#202b2c','metal',{metalness:.15,roughness:.75}),interior:new THREE.MeshStandardMaterial({color:'#24312e',roughness:.9})
  };
  return palette;
}

function addMesh(parent,geo,mat,x,y,z,sx=1,sy=1,sz=1){
  const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}
export function box(parent,x,y,z,w,h,d,material){return addMesh(parent,unitBox,material,x,y,z,w,h,d);}
export function cylinder(parent,x,y,z,r,height,material,segments=32){
  return addMesh(parent,geometry(key('cylinder',segments),()=>new THREE.CylinderGeometry(1,1,1,segments)),material,x,y,z,r,height,r);
}
export function gable(parent,x,y,z,w,height,d,material){
  const id=key('gable',w,height,d);
  const geo=geometry(id,()=>{
    const ax=-w/2,bx=w/2,az=-d/2,bz=d/2;
    const positions=[ax,0,az, ax,0,bz,0,height,bz, ax,0,az,0,height,bz,0,height,az,
      bx,0,bz,bx,0,az,0,height,az,bx,0,bz,0,height,az,0,height,bz,
      ax,0,bz,bx,0,bz,0,height,bz,bx,0,az,ax,0,az,0,height,az];
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    const uv=[];for(let i=0;i<positions.length;i+=3)uv.push((positions[i]+w/2)/w,(positions[i+2]+d/2)/d+positions[i+1]/height);
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
  });
  return addMesh(parent,geo,material,x,y,z);
}

function archShape(w,h){
  const r=w/2,shoulder=h/2-r;
  const s=new THREE.Shape();s.moveTo(-r,-h/2);s.lineTo(r,-h/2);s.lineTo(r,shoulder);s.absarc(0,shoulder,r,0,Math.PI,false);s.lineTo(-r,-h/2);return s;
}
export function arch(parent,x,y,z,width,height,depth,material){
  const geo=geometry(key('arch-trim',width,height,depth),()=>{
    const frame=Math.max(.08,Math.min(width*.1,.28));
    const s=archShape(width,height),inside=archShape(width-frame*2,height-frame*2);
    const hole=new THREE.Path();hole.copy(inside);s.holes.push(hole);
    return new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:18});
  });
  return addMesh(parent,geo,material,x,y,z-depth/2);
}
export function addWindow(parent,x,y,z,w,h,options={}){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=options.rotationY||0;parent.add(g);
  const frame=options.frame??.15,depth=options.depth??.16;
  const frameMat=paint(options.color||'#e4e1d7','stone',{roughness:.8});
  const glass=options.glassMaterial||getMaterials().glass;
  box(g,0,0,-depth*.92,w+frame*.8,h+frame*.8,.12,getMaterials().interior);
  if(options.arched){
    arch(g,0,0,.03,w+frame*2,h+frame*2,depth,frameMat);
    const geo=geometry(key('arched-glass',w,h),()=>new THREE.ShapeGeometry(archShape(w,h),18));
    addMesh(g,geo,glass,0,0,-depth*.36);
  }else{
    box(g,-w/2-frame/2,0,0,frame,h+frame*2,depth,frameMat);box(g,w/2+frame/2,0,0,frame,h+frame*2,depth,frameMat);
    box(g,0,h/2+frame/2,0,w,frame,depth,frameMat);box(g,0,-h/2-frame/2,0,w,frame,depth,frameMat);
    addMesh(g,unitPlane,glass,0,0,-depth*.36,w,h);
  }
  const mullions=options.mullions??1;
  for(let i=1;i<=mullions;i++)box(g,-w/2+w*i/(mullions+1),0,-depth*.18,Math.max(.055,frame*.43),h,.1,frameMat);
  if(h>2)box(g,0,h*.04,-depth*.15,w,Math.max(.05,frame*.4),.1,frameMat);
  if(options.sill!==false)box(g,0,-h/2-frame,.05,w+frame*3,frame*.8,depth*2.4,frameMat);
  return g;
}

/** Batch static descendant meshes while preserving groups used by historical updates. */
export function finalizeModel(root){
  root.updateMatrixWorld(true);
  const protectedGroups=new Set();
  root.traverse(o=>{if(o.userData.dynamic)protectedGroups.add(o);for(const value of Object.values(o.userData)){if(value?.isGroup)protectedGroups.add(value);if(Array.isArray(value))value.forEach(v=>{if(v?.isGroup)protectedGroups.add(v);});}});
  const boundaries=[root,...protectedGroups];
  for(const boundary of boundaries){
    const groups=new Map(),inverse=boundary.matrixWorld.clone().invert();
    function visit(o){for(const child of [...o.children]){
      if(child!==boundary&&protectedGroups.has(child))continue;
      if(child.isMesh&&!child.isInstancedMesh&&!Array.isArray(child.material)&&!child.userData.keep){
        const id=key(child.geometry.uuid,child.material.uuid);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(child);
      }else visit(child);
    }}visit(boundary);
    for(const meshes of groups.values()){
      if(meshes.length<3)continue;
      const batch=new THREE.InstancedMesh(meshes[0].geometry,meshes[0].material,meshes.length);
      batch.name='facade-batch';batch.castShadow=true;batch.receiveShadow=true;
      meshes.forEach((m,i)=>{batch.setMatrixAt(i,new THREE.Matrix4().multiplyMatrices(inverse,m.matrixWorld));m.parent.remove(m);});
      batch.instanceMatrix.needsUpdate=true;batch.computeBoundingBox();batch.computeBoundingSphere();boundary.add(batch);
    }
    // Sculpted profiles often have unique geometries. Merge those by material as
    // well, rather than paying a draw call for every cornice and pointed arch.
    const sculpted=new Map();
    function gather(o){for(const child of [...o.children]){
      if(protectedGroups.has(child))continue;
      if(child.isMesh&&!child.isInstancedMesh&&!Array.isArray(child.material)&&!child.userData.keep){
        const attributes=Object.keys(child.geometry.attributes).sort().join(',');
        const id=key(child.material.uuid,attributes);
        if(!sculpted.has(id))sculpted.set(id,[]);sculpted.get(id).push(child);
      }else gather(child);
    }}gather(boundary);
    for(const meshes of sculpted.values()){
      if(meshes.length<2)continue;
      const parts=meshes.map(m=>{
        const geo=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();
        geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,m.matrixWorld));return geo;
      });
      const merged=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());
      if(!merged)continue;
      merged.computeBoundingBox();merged.computeBoundingSphere();
      const batch=new THREE.Mesh(merged,meshes[0].material);batch.name='sculpted-facade';batch.castShadow=true;batch.receiveShadow=true;
      meshes.forEach(m=>m.parent.remove(m));boundary.add(batch);
    }
  }
  root.updateMatrixWorld(true);return root;
}
