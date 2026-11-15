import * as THREE from './vendor/three.module.js';
import {GEO,heightAt} from './geo.js';
import {SEVASTYANOV_NEIGHBOR_IDS,SEVASTYANOV_NEIGHBOR_YEAR,TARASOV_PARTS,NEIGHBOR_DESIGNS} from './data/sevastyanov-neighborhood.js';

const EPS = 1e-7;
const lerp = (a,b,t) => [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
const area = p => p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-a[1]*b[0];},0)/2;
const cross = (a,b,p) => (b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
function inside(point,ring) {
  let result=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const a=ring[i],b=ring[j];
    if((a[1]>point[1])!==(b[1]>point[1]) && point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0]) result=!result;
  }
  return result;
}
const inFootprint = (p,b) => inside(p,b.p) && !(b.holes||[]).some(h=>inside(p,h));
function convexContains(p,mask,tolerance=EPS) {
  const sign=Math.sign(area(mask))||1;
  return mask.every((a,i)=>cross(a,mask[(i+1)%mask.length],p)*sign>=-tolerance);
}
function splitPolygon(poly,a,b,sign) {
  const yes=[],no=[];
  for(let i=0;i<poly.length;i++) {
    const p=poly[i],q=poly[(i+1)%poly.length],vp=cross(a,b,p)*sign,vq=cross(a,b,q)*sign;
    (vp>=-EPS?yes:no).push(p);
    if((vp>=-EPS)!==(vq>=-EPS)) {const hit=lerp(p,q,vp/(vp-vq));yes.push(hit);no.push(hit);}
  }
  return [yes,no];
}
function cutByMask(poly,mask) {
  let remainder=poly;
  const outside=[],sign=Math.sign(area(mask))||1;
  for(let i=0;i<mask.length && remainder.length>=3;i++) {
    const [yes,no]=splitPolygon(remainder,mask[i],mask[(i+1)%mask.length],sign);
    if(no.length>=3 && Math.abs(area(no))>EPS) outside.push(no);
    remainder=yes;
  }
  return {inside:remainder.length>=3&&Math.abs(area(remainder))>EPS?remainder:null,outside};
}
function footprintTriangles(b) {
  const contour=b.p.map(([x,z])=>new THREE.Vector2(x,-z));
  const holes=(b.holes||[]).map(r=>r.map(([x,z])=>new THREE.Vector2(x,-z)));
  const vertices=[...b.p,...(b.holes||[]).flat()];
  return THREE.ShapeUtils.triangulateShape(contour,holes).map(t=>t.map(i=>vertices[i]));
}
function partAt(p,parts) {
  const exact=parts.find(part=>convexContains(p,part.mask));
  if(exact)return exact;
  // The reference masks were rounded. A sub-centimetre gap takes its nearest
  // partition; it must never punch a crack through an authoritative footprint.
  let best=parts[0],score=Infinity;
  for(const part of parts) {
    const sign=Math.sign(area(part.mask))||1;
    const miss=Math.max(...part.mask.map((a,i)=>{
      const b=part.mask[(i+1)%part.mask.length];return -cross(a,b,p)*sign/Math.hypot(b[0]-a[0],b[1]-a[1]);
    }));
    if(miss<score){score=miss;best=part;}
  }
  return best;
}
function removeZeroAreaSpikes(polygon) {
  const clean=polygon.slice();
  let changed=true;
  while(changed&&clean.length>3) {
    changed=false;
    for(let i=0;i<clean.length;i++) {
      const a=clean[(i+clean.length-1)%clean.length],p=clean[i],b=clean[(i+1)%clean.length];
      const dx=p[0]-a[0],dz=p[1]-a[1],ex=b[0]-p[0],ez=b[1]-p[1];
      if(dx*ex+dz*ez<0&&Math.abs(dx*ez-dz*ex)<1e-7*Math.max(1,Math.hypot(dx,dz)+Math.hypot(ex,ez))) {
        clean.splice(i,1);changed=true;break;
      }
    }
  }
  return clean;
}

/** Disjoint roof pieces cover exactly p minus holes; masks only choose height. */
export function partitionNeighborFootprint(building,parts=TARASOV_PARTS) {
  const pieces=[];
  for(const triangle of footprintTriangles(building)) {
    let remaining=[triangle];
    for(const part of parts) {
      const next=[];
      for(const poly of remaining) {
        const cut=cutByMask(poly,part.mask);
        if(cut.inside)pieces.push({part,polygon:cut.inside});
        next.push(...cut.outside);
      }
      remaining=next;
    }
    for(const polygon of remaining) {
      const center=polygon.reduce((v,p)=>[v[0]+p[0]/polygon.length,v[1]+p[1]/polygon.length],[0,0]);
      pieces.push({part:partAt(center,parts),polygon});
    }
  }
  return pieces.map(piece=>({...piece,polygon:removeZeroAreaSpikes(piece.polygon)}));
}

function segmentDistance(p,a,b) {
  const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz)));
  return Math.hypot(p[0]-a[0]-dx*t,p[1]-a[1]-dz*t);
}
function edgeCuts(a,b,parts) {
  const cuts=[0,1],dx=b[0]-a[0],dz=b[1]-a[1];
  for(const {mask} of parts)for(let i=0;i<mask.length;i++) {
    const c=mask[i],d=mask[(i+1)%mask.length],ex=d[0]-c[0],ez=d[1]-c[1],den=dx*ez-dz*ex;
    if(Math.abs(den)<EPS)continue;
    const t=((c[0]-a[0])*ez-(c[1]-a[1])*ex)/den,u=((c[0]-a[0])*dz-(c[1]-a[1])*dx)/den;
    if(t>EPS&&t<1-EPS&&u>=-EPS&&u<=1+EPS)cuts.push(t);
  }
  return [...new Set(cuts.map(t=>Math.round(t*1e9)/1e9))].sort((x,y)=>x-y);
}

const COLORS={cream:'#eee2bd',lenina:'#d9caa8',white:'#f0eee3',ochre:'#ceb47c',roof:'#348d7b',glass:'#304b50',stone:'#b5aa92',dark:'#626762'};
class Builder {
  constructor(building) {this.building=building;this.arrays=new Map();this.features={windows:0,glazingPanels:0,mezzanine:false};}
  tri(material,a,b,c,normal=null) {
    if(normal) {
      const ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
      const dot=(ab[1]*ac[2]-ab[2]*ac[1])*normal[0]+(ab[2]*ac[0]-ab[0]*ac[2])*normal[1]+(ab[0]*ac[1]-ab[1]*ac[0])*normal[2];
      if(dot<0)[b,c]=[c,b];
    }
    if(!this.arrays.has(material))this.arrays.set(material,[]);
    this.arrays.get(material).push(...a,...b,...c);
  }
  quad(m,a,b,c,d,n=null){this.tri(m,a,b,c,n);this.tri(m,a,c,d,n);}
  solid(m,center,size,angle=0) {
    const [x,y,z]=center,[w,h,d]=size,co=Math.cos(angle),si=Math.sin(angle);
    const v=(u,q,r)=>[x+u*co+r*si,y+q,z-u*si+r*co];
    const a=v(-w/2,-h/2,-d/2),b=v(w/2,-h/2,-d/2),c=v(w/2,h/2,-d/2),e=v(-w/2,h/2,-d/2);
    const f=v(-w/2,-h/2,d/2),g=v(w/2,-h/2,d/2),k=v(w/2,h/2,d/2),l=v(-w/2,h/2,d/2);
    this.quad(m,a,e,c,b);this.quad(m,f,g,k,l);this.quad(m,a,f,l,e);this.quad(m,b,c,k,g);this.quad(m,e,l,k,c);this.quad(m,a,b,g,f);
  }
  faceRect(m,origin,tangent,normal,u,y,w,h,depth=.03) {
    const v=(s,q)=>[origin[0]+tangent[0]*s+normal[0]*depth,q,origin[1]+tangent[1]*s+normal[1]*depth];
    this.quad(m,v(u-w/2,y-h/2),v(u+w/2,y-h/2),v(u+w/2,y+h/2),v(u-w/2,y+h/2),[normal[0],0,normal[1]]);
  }
  window(origin,t,n,u,y,w,h,modern=false) {
    this.features.windows++;
    this.faceRect('glass',origin,t,n,u,y,w,h,.04);
    const frame=modern?.085:.13;
    for(const s of [-1,1])this.faceRect('white',origin,t,n,u+s*(w+frame)/2,y,frame,h+frame*2,.11);
    for(const s of [-1,1])this.faceRect('white',origin,t,n,u,y+s*(h+frame)/2,w+frame*2,frame,.12);
    this.faceRect('white',origin,t,n,u,y,.045,h,.15);
    this.faceRect('white',origin,t,n,u,y+h*.1,w,.045,.15);
    const sill=[origin[0]+t[0]*u+n[0]*.16,y-h/2-.13,origin[1]+t[1]*u+n[1]*.16];
    this.solid('stone',sill,[w+.36,.16,.35],Math.atan2(-t[1],t[0]));
  }
  finish(baseY,name) {
    const group=new THREE.Group();group.name=name;group.position.y=baseY;
    for(const [key,positions] of this.arrays) {
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();
      const material=new THREE.MeshStandardMaterial({color:COLORS[key],roughness:key==='glass'?.28:key==='roof'?.55:.86,metalness:key==='glass'?.18:key==='roof'?.18:0});
      const mesh=new THREE.Mesh(geometry,material);mesh.name=name+' '+key;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
    }
    group.userData={id:this.building.id,footprint:this.building.p.map(p=>p.slice()),holes:(this.building.holes||[]).map(h=>h.map(p=>p.slice())),features:this.features,estimatedDimensions:true};
    return group;
  }
}

function facade(builder,a,b,part,normal,{bottom=0,decorate=true}={}) {
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.02)return;
  const t=[(b[0]-a[0])/length,(b[1]-a[1])/length],top=part.height-(part.roofRise||0),modern=part.role==='modern';
  const yBands=modern?[bottom,Math.max(bottom,6.65),top]:[bottom,top];
  for(let i=1;i<yBands.length;i++)if(yBands[i]>yBands[i-1]+.01) {
    const m=modern?(i===1?'ochre':'white'):part.role==='lenina'?'lenina':'cream';
    builder.quad(m,[...a.slice(0,1),yBands[i-1],a[1]],[b[0],yBands[i-1],b[1]],[b[0],yBands[i],b[1]],[a[0],yBands[i],a[1]],[normal[0],0,normal[1]]);
  }
  const center=lerp(a,b,.5),angle=Math.atan2(-t[1],t[0]);
  for(const [y,h,w,m] of [[Math.max(bottom+.2,.35),.3,.18,'stone'],[top-.10,.22,.3,'white'],[top-.40,.12,.18,'white']]) {
    if(y<bottom+.08)continue;
    builder.solid(m,[center[0]+normal[0]*.07,y,center[1]+normal[1]*.07],[length,h,w],angle);
  }
  if(!decorate||length<2.0||top-bottom<1.5)return;
  const levels=part.levels||2,floor=top/levels,bays=Math.max(1,Math.floor((length-.65)/(modern?3.5:3.2))),spacing=length/bays;
  // The photographed eastern elevation has tall glazed bays spanning the
  // upper three storeys, alternating with narrow rows of punched windows.
  const glazedCenters=modern&&normal[0]>.7&&length>12?
    Array.from({length:Math.max(1,Math.round(length/24))},(_,i)=>(i+.5)*length/Math.max(1,Math.round(length/24))):[];
  const glazedWidth=Math.min(4.5,length*.24);
  for(let row=0;row<levels;row++) {
    const y=(row+.54)*floor,wh=Math.min(modern?2.15:row===0?1.65:2.35,floor*.69);
    if(y-wh/2<bottom+.4)continue;
    for(let i=0;i<bays;i++) {
      const u=(i+.5)*spacing;
      if(row>=2&&glazedCenters.some(c=>Math.abs(u-c)<glazedWidth/2+.6))continue;
      builder.window(a,t,normal,u,y,Math.min(modern?1.45:1.15,spacing*.48),wh,modern);
    }
  }
  for(const u of glazedCenters) {
    const low=Math.max(6.95,bottom+.3),high=top-.9,h=high-low,y=(high+low)/2;
    if(h<2)continue;
    builder.features.glazingPanels++;
    builder.faceRect('white',a,t,normal,u,y,glazedWidth+.65,h+.55,.07);
    builder.faceRect('glass',a,t,normal,u,y,glazedWidth,h,.10);
    for(let col=0;col<=4;col++)builder.faceRect('white',a,t,normal,u-glazedWidth/2+col*glazedWidth/4,y,.055,h,.16);
    for(let row=0;row<=7;row++)builder.faceRect('white',a,t,normal,u,low+row*h/7,glazedWidth,.055,.16);
    builder.solid('white',[a[0]+t[0]*u+normal[0]*.13,top+.10,a[1]+t[1]*u+normal[1]*.13],[glazedWidth+.9,.25,.4],angle);
  }
  if(!modern&&levels===2&&length>6) {
    for(let i=1;i<bays;i++)builder.solid('white',[a[0]+t[0]*i*spacing+normal[0]*.10,top*.73,a[1]+t[1]*i*spacing+normal[1]*.10],[.20,top*.48,.20],angle);
    builder.solid('white',[center[0]+normal[0]*.08,top/2,center[1]+normal[1]*.08],[length,.14,.22],angle);
  }
}

const roofPlaneCache=new WeakMap();
const planeValue=(plane,p)=>plane[0]*p[0]+plane[1]*p[1]+plane[2];
function roofEdgePlanes(building) {
  if(roofPlaneCache.has(building))return roofPlaneCache.get(building);
  const groups=[],slope=.48;
  for(const ring of [building.p,...(building.holes||[])])for(let i=0;i<ring.length;i++) {
    const a=ring[i],b=ring[(i+1)%ring.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<EPS)continue;
    const t=[(b[0]-a[0])/length,(b[1]-a[1])/length],n=[-t[1],t[0]];
    const through=(axis,p)=>[axis[0]*slope,axis[1]*slope,-(axis[0]*p[0]+axis[1]*p[1])*slope];
    // A polyhedral distance to a finite eave gives straight hip/valley planes,
    // including at re-entrant corners. It has no circular distance patches.
    groups.push([through(n,a),through(n.map(x=>-x),a),through(t.map(x=>-x),a),through(t,b)]);
  }
  roofPlaneCache.set(building,groups);return groups;
}
function roofHeight(p,b,part) {
  const rise=part.roofRise||0;
  const height=Math.min(rise,...roofEdgePlanes(b).map(planes=>Math.max(...planes.map(plane=>planeValue(plane,p)))));
  return part.height-rise+Math.max(0,height);
}
function splitByPlane(poly,plane) {
  const yes=[],no=[];
  for(let i=0;i<poly.length;i++) {
    const p=poly[i],q=poly[(i+1)%poly.length],vp=planeValue(plane,p),vq=planeValue(plane,q);
    (vp<=0?yes:no).push(p);
    if((vp<=0)!==(vq<=0)){const hit=lerp(p,q,Math.max(0,Math.min(1,vp/(vp-vq))));yes.push(hit);no.push(hit);}
  }
  return [yes,no];
}
const validRoofPolygon=p=>p.length>=3&&Math.abs(area(p))>1e-6;
function planarRoofPieces(polygon,building,rise) {
  let regions=[{polygon,plane:[0,0,rise]}];
  for(const edges of roofEdgePlanes(building)) {
    const next=[];
    for(const region of regions) {
      let candidate=region.polygon;
      // Outside this intersection, the existing roof plane is already lower.
      for(const edge of edges) {
        if(!validRoofPolygon(candidate))break;
        const difference=edge.map((v,i)=>v-region.plane[i]);
        const [yes,no]=splitByPlane(candidate,difference);
        if(validRoofPolygon(no))next.push({polygon:no,plane:region.plane});
        candidate=yes;
      }
      if(!validRoofPolygon(candidate))continue;
      // Split at every change of the winning affine plane. Triangles are
      // generated only afterwards, so none can straddle a ridge or valley.
      for(let i=0;i<edges.length;i++) {
        let cell=candidate;
        for(let j=0;j<edges.length&&validRoofPolygon(cell);j++)if(i!==j) {
          [cell]=splitByPlane(cell,edges[j].map((v,k)=>v-edges[i][k]));
        }
        if(validRoofPolygon(cell))next.push({polygon:cell,plane:edges[i]});
      }
    }
    regions=next;
  }
  return regions;
}
function roofTriangle(builder,a,b,c,part) {
  const rise=part.roofRise||0,base=part.height-rise;
  for(const {polygon,plane} of planarRoofPieces([a,b,c],builder.building,rise)) {
    const v=p=>[p[0],base+Math.max(0,planeValue(plane,p)),p[1]];
    for(let i=1;i+1<polygon.length;i++)if(Math.abs(area([polygon[0],polygon[i],polygon[i+1]]))>1e-6) {
      builder.tri('roof',v(polygon[0]),v(polygon[i]),v(polygon[i+1]),[0,1,0]);
    }
  }
}
function basicBuilding(builder,part) {
  const b=builder.building;
  for(const ring of [b.p,...(b.holes||[])])for(let i=0;i<ring.length;i++) {
    const a=ring[i],z=ring[(i+1)%ring.length],len=Math.hypot(z[0]-a[0],z[1]-a[1]);
    let n=[-(z[1]-a[1])/len,(z[0]-a[0])/len];const mid=lerp(a,z,.5);
    if(inFootprint([mid[0]+n[0]*.05,mid[1]+n[1]*.05],b))n=n.map(x=>-x);
    facade(builder,a,z,part,n);
  }
  for(const [a,z,c] of footprintTriangles(b))roofTriangle(builder,a,z,c,part);
}

function leninaMezzanine(builder) {
  const t=[.9805806757,-.1961161351],n=[.1961161351,.9805806757],origin=[220.1,-41.5],angle=Math.atan2(-t[1],t[0]);
  const v=(u,y,d=0)=>[origin[0]+t[0]*u+n[0]*d,y,origin[1]+t[1]*u+n[1]*d];
  const width=10.8,base=7.7,top=10.65;
  builder.solid('lenina',v(0,(base+top)/2,-4.0),[width,top-base,8],angle);
  for(const [y,w] of [[base,.25],[top,.35]])builder.solid('white',v(0,y,.08),[width+.4,.22,w],angle);
  for(const u of [-3.75,3.75])builder.window(origin,t,n,u,9.2,.85,1.45);
  const radius=1.6,archBase=8.3,segments=24;
  for(let i=0;i<segments;i++) {
    const a=i*Math.PI/segments,b=(i+1)*Math.PI/segments;
    const arc=(r,theta,d)=>v(r*Math.cos(theta),archBase+r*Math.sin(theta),d);
    builder.tri('glass',v(0,archBase,.055),arc(radius,a,.055),arc(radius,b,.055),[n[0],0,n[1]]);
    builder.quad('white',arc(radius,a,.12),arc(radius+.19,a,.12),arc(radius+.19,b,.12),arc(radius,b,.12),[n[0],0,n[1]]);
  }
  for(const theta of [Math.PI/6,Math.PI/3,Math.PI/2,2*Math.PI/3,5*Math.PI/6]) {
    const a=v(0,archBase,.145),b=v(radius*Math.cos(theta),archBase+radius*Math.sin(theta),.145);
    const up=[t[0]*.022,0,t[1]*.022];builder.quad('white',a.map((x,i)=>x-up[i]),b.map((x,i)=>x-up[i]),b.map((x,i)=>x+up[i]),a.map((x,i)=>x+up[i]),[n[0],0,n[1]]);
  }
  builder.faceRect('white',origin,t,n,0,archBase,3.6,.16,.16);
  builder.tri('lenina',v(-5.65,top,.02),v(5.65,top,.02),v(0,top+1.25,.02),[n[0],0,n[1]]);
  for(const side of [-1,1]) {
    const a=v(side*5.7,top+.12,.09),b=v(0,top+1.35,.09),delta=b.map((x,i)=>x-a[i]),len=Math.hypot(...delta);
    const geometry=new THREE.BoxGeometry(len,.15,.32),mesh=new THREE.Mesh(geometry);
    mesh.position.copy(new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),new THREE.Vector3(...delta).normalize());mesh.updateMatrix();
    const p=geometry.toNonIndexed().applyMatrix4(mesh.matrix).attributes.position;
    for(let i=0;i<p.count;i+=3)builder.tri('white',[p.getX(i),p.getY(i),p.getZ(i)],[p.getX(i+1),p.getY(i+1),p.getZ(i+1)],[p.getX(i+2),p.getY(i+2),p.getZ(i+2)]);
    geometry.dispose();
  }
  builder.quad('roof',v(-5.6,top+.1,-8.1),v(-5.6,top+.1,.05),v(0,top+1.25,.05),v(0,top+1.25,-8.1),[0,1,0]);
  builder.quad('roof',v(0,top+1.25,-8.1),v(0,top+1.25,.05),v(5.6,top+.1,.05),v(5.6,top+.1,-8.1),[0,1,0]);
  for(const u of [-1.5,1.5]) {
    builder.solid('white',v(u,5.8,.23),[.22,3.1,.26],angle);
    builder.solid('white',v(u,7.35,.23),[.42,.18,.4],angle);
  }
  for(const u of [-14,-9,9,14]) {
    const c=v(u,8.35,-3.6);builder.solid('cream',c,[.55,1.4,.65],angle);builder.solid('white',[c[0],9.03,c[2]],[.8,.2,.88],angle);
  }
  builder.features.mezzanine=true;
}

function residence(builder) {
  const b=builder.building,parts=TARASOV_PARTS;
  const pieces=partitionNeighborFootprint(b,parts);
  for(const {part,polygon} of pieces) {
    const triangles=THREE.ShapeUtils.triangulateShape(polygon.map(([x,z])=>new THREE.Vector2(x,-z)),[]);
    for(const t of triangles)roofTriangle(builder,polygon[t[0]],polygon[t[1]],polygon[t[2]],part);
  }
  for(const ring of [b.p,...(b.holes||[])])for(let i=0;i<ring.length;i++) {
    const a=ring[i],z=ring[(i+1)%ring.length],len=Math.hypot(z[0]-a[0],z[1]-a[1]);
    if(len<EPS)continue;
    let n=[-(z[1]-a[1])/len,(z[0]-a[0])/len],mid=lerp(a,z,.5);
    if(inFootprint([mid[0]+n[0]*.06,mid[1]+n[1]*.06],b))n=n.map(x=>-x);
    const cuts=edgeCuts(a,z,parts);
    for(let j=1;j<cuts.length;j++) {
      const p=lerp(a,z,cuts[j-1]),q=lerp(a,z,cuts[j]),m=lerp(p,q,.5),part=partAt([m[0]-n[0]*.05,m[1]-n[1]*.05],parts);
      facade(builder,p,q,part,n);
    }
  }
  // Only genuine height steps get internal walls. Equal-height modern masks
  // form one volume and receive no artificial facade/glazing seams.
  const seen=new Set();
  for(const {part,polygon} of pieces)for(let i=0;i<polygon.length;i++) {
    const a=polygon[i],z=polygon[(i+1)%polygon.length],len=Math.hypot(z[0]-a[0],z[1]-a[1]);if(len<.2)continue;
    const n=[-(z[1]-a[1])/len,(z[0]-a[0])/len],mid=lerp(a,z,.5),left=[mid[0]+n[0]*.08,mid[1]+n[1]*.08],right=[mid[0]-n[0]*.08,mid[1]-n[1]*.08];
    if(!inFootprint(left,b)||!inFootprint(right,b))continue;
    const l=partAt(left,parts),r=partAt(right,parts);if(Math.abs(l.height-r.height)<.3)continue;
    const high=l.height>r.height?l:r,low=l.height>r.height?r:l;if(high!==part)continue;
    const key=[a,z].map(p=>p.map(v=>v.toFixed(3)).join(',')).sort().join('|');if(seen.has(key))continue;seen.add(key);
    const normal=l.height>r.height?n.map(x=>-x):n;
    facade(builder,a,z,high,normal,{bottom:low.height,decorate:true});
    const top=high.height-high.roofRise;
    builder.quad('white',[a[0],top,a[1]],[z[0],top,z[1]],[z[0],roofHeight(z,b,high),z[1]],[a[0],roofHeight(a,b,high),a[1]],[normal[0],0,normal[1]]);
  }
  builder.features.heightParts=parts.map(p=>({id:p.id,height:p.height,role:p.role}));
  builder.features.courtyardOpen=true;
}

export function buildSevastyanovNeighborModels({buildings=GEO.buildings,groundHeight=heightAt}={}) {
  return SEVASTYANOV_NEIGHBOR_IDS.map(id=>{
    const b=buildings.find(b=>b.id===id);if(!b)throw new Error('Missing Sevastyanov neighbor footprint '+id);
    const design=NEIGHBOR_DESIGNS[id],builder=new Builder(b);
    if(id===-421103)residence(builder);
    else {
      basicBuilding(builder,{...design,role:id===51503512?'lenina':'historical'});
      if(id===51503512)leninaMezzanine(builder);
    }
    return builder.finish(groundHeight(b.x,b.z),design.name);
  });
}

export function installSevastyanovNeighborhood(world) {
  const group=new THREE.Group();group.name='Sevastyanov neighborhood modern';group.visible=false;
  const oldPharmacy=world.landmarks?.background?.items?.get('mountainPharmacy');
  const models=buildSevastyanovNeighborModels();group.add(...models);world.group.add(group);
  let year=0;
  const stats=models.map(model=>{
    model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model);let triangles=0;
    model.traverse(o=>{if(o.isMesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});
    return {id:model.userData.id,name:model.name,triangles,meshes:model.children.length,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},groundHeight:model.position.y};
  });
  return {group,update(state){
    year=Number(state.calendarYear??state.year)||0;group.visible=year>=SEVASTYANOV_NEIGHBOR_YEAR;
    // The normal landmark update has already restored the period's visibility.
    // Do not change its removal date or delegate flag: historical years still use it.
    if(group.visible&&oldPharmacy)oldPharmacy.group.visible=false;
  },diagnostics(){return {visible:group.visible,year,modernSince:SEVASTYANOV_NEIGHBOR_YEAR,ids:SEVASTYANOV_NEIGHBOR_IDS,
    triangles:stats.reduce((n,s)=>n+s.triangles,0),buildings:stats,
    replacedBackground:oldPharmacy?{key:'mountainPharmacy',visible:oldPharmacy.group.visible}:null};}};
}
