import * as THREE from '../vendor/three.module.js';
// Measured OSM wall outlines are retained in projected metres, without
// rectangular re-scaling. Profile details only decorate those actual walls.
const unit=new THREE.BoxGeometry(1,1,1),tmp=new THREE.Object3D();
export function inside(x,z,poly){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit&&!(poly.holes??[]).some(h=>inside(x,z,h));}
function solid(poly,height,y,material){
 const shape=new THREE.Shape();poly.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
 for(const ring of poly.holes??[]){const hole=new THREE.Path();ring.forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));hole.closePath();shape.holes.push(hole);}
 const m=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:1}),material);m.rotation.x=-Math.PI/2;m.position.y=y;m.castShadow=true;m.receiveShadow=true;return m;
}
function clipHalfPlane(poly,nx,nz,limit){const cut=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*nx+a[1]*nz-limit,db=b[0]*nx+b[1]*nz-limit;if(da<=0)cut.push(a);if((da<=0)!==(db<=0)){const t=da/(da-db);cut.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}return cut;}
const styles={youthPalace:[0xb5b4aa,0xd8d2b5],divs:[0xbabcb8,0xcbd3d8],puppetTheatre:[0xcfb980,0xf0e6c7],hyattRegency:[0x5b778b,0xb7c6cc],hyattPlace:[0xaaa89f,0xddd8c5],synagogue:[0xdfd2bc,0xf7ebd4],bigZlatoust:[0xdfa35c,0xf4e6ce],mega:[0xc9bd92,0x248aae],carnival:[0xd59b52,0xb42432],veerMall:[0xd7c2a0,0xba9f77],alatyr:[0x989fa3,0xd84240],radugaPark:[0xc7c0a3,0xacc440],passageModern:[0xd8c9ae,0xf5e7cb],anteyMall:[0x779799,0xb8c4bd],bigUralHotel:[0xd7c2a4,0xe6dcc4],chuvildinHouse:[0x994d36,0xbd7653],metenkovHouse:[0xbbae92,0x756052],stepanovHouse:[0xb6c6c1,0xdcd4bd],granitePrinting:[0xa6c2ac,0xe3dfce],zemstvoSchool:[0xaa694e,0xd2b18c],mountainPharmacy:[0xe0cfa3,0xebe0c6],trinityCathedral:[0xe2c976,0xf0e7d3],baptistCathedral:[0xe1e2d5,0xf5eedb],tyuz:[0xc9c0a5,0xe8dfc9],officersHouse:[0xd0b391,0xe1d2b9]};
export function backgroundBuilding(spec,plane){
 const root=new THREE.Group(),roofline=new THREE.Group(),poly=spec.polygon,profile=spec.profile||'historic';poly.holes=spec.holes??[];root.add(roofline);roofline.name='dated-domes-and-belltower';
 let hash=0;for(const c of spec.key)hash=(hash*31+c.charCodeAt(0))>>>0;
 const historic=/historic|mansion|merchant|museum|estate|school|bank|classical|civic|wooden|brick/i.test(profile),church=/church|cathedral|monastery/i.test(profile),tower=/tower|business/i.test(profile),mall=profile==='mall',arena=profile==='arena';
 const palette=styles[spec.key]||[historic?[0xdec29b,0xbfcdc5,0xd6bd9d,0xd7cab4][hash%4]:[0xbabcb7,0xd4cbbb,0xadbfc4][hash%3],0xe8decd];
 const mat=(color,metalness=0,roughness=.68)=>new THREE.MeshStandardMaterial({color,metalness,roughness,clippingPlanes:[plane],clipShadows:true});
 const wall=mat(palette[0]),trim=mat(0xe8decd,.08,.43),accent=mat(palette[1],.12,.5),roof=mat(0x525957,.3,.55),glass=mat(spec.key==='anteyMall'?0x37757e:0x355467,.42,.25),gold=mat(0xcfa544,.72,.25);
 const staged=profile==='theatre'||['youthPalace','dkUralmash','synagogue'].includes(spec.key);
 let bodyH=spec.height-(historic?2.4:1.2);if(church)bodyH=spec.height*(spec.key==='trinityCathedral'?.24:.30);if(arena)bodyH=spec.height*.62;if(staged)bodyH=spec.height*.46;
 const passage=spec.key==='radugaPark',clearance=5.3,passageX=-3834-spec.x;
 if(passage){root.add(solid(clipHalfPlane(poly,1,0,passageX),clearance,0,wall),solid(poly,bodyH-clearance,clearance,wall));}
 else root.add(solid(poly,bodyH,0,wall));
 root.add(solid(poly,.48,bodyH,roof));
 const buckets={windows:[],frames:[],bands:[],details:[]};
 const box=(key,x,y,z,w,h,d,yaw=0)=>buckets[key].push({x,y,z,w,h,d,yaw});
 function roofBox(x,z,w,d,h,material=roof){
  if(![[x-w/2,z-d/2],[x+w/2,z-d/2],[x-w/2,z+d/2],[x+w/2,z+d/2]].every(p=>inside(...p,poly)))return;
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,bodyH+h/2,z);m.castShadow=true;root.add(m);
 }
 let area=0;poly.forEach((a,i)=>{const b=poly[(i+1)%poly.length];area+=a[0]*b[1]-b[0]*a[1];});
 const edges=poly.map((a,i)=>{const b=poly[(i+1)%poly.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz),sign=area>0?1:-1;return{a,b,dx,dz,length,nx:sign*dz/length,nz:-sign*dx/length};});
 const longest=edges.reduce((a,b)=>a.length>b.length?a:b),levels=Math.max(1,Math.min(30,church?3:staged?2:spec.levels)),fh=bodyH/levels;
 if(profile==='wooden'||spec.key==='stepanovHouse')root.add(solid(poly,bodyH*.49,bodyH*.5,accent));
 if(staged){
  // Split the actual wall polygon into a low foyer and the higher auditorium.
  const nx=longest.nx,nz=longest.nz,values=poly.map(p=>p[0]*nx+p[1]*nz),limit=Math.min(...values)+(Math.max(...values)-Math.min(...values))*.54,cut=[];
  for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*nx+a[1]*nz-limit,db=b[0]*nx+b[1]*nz-limit;if(da<=0)cut.push(a);if((da<=0)!==(db<=0)){const t=da/(da-db);cut.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}}
  if(cut.length>=3){root.add(solid(cut,spec.height-bodyH-.6,bodyH,wall),solid(cut,.55,spec.height-.6,roof));}
 }
 for(const e of edges){
  if(e.length<2)continue;
  const yaw=Math.atan2(e.nx,e.nz),cx=(e.a[0]+e.b[0])/2,cz=(e.a[1]+e.b[1])/2;
  box('bands',cx+e.nx*.045,bodyH-.16,cz+e.nz*.045,e.length,.34,.17,yaw);
  if(historic||profile==='constructivist'||spec.key==='passageModern')for(let f=1;f<levels;f++)box('bands',cx+e.nx*.035,f*fh,cz+e.nz*.035,e.length,.18,.14,yaw);
  if(profile==='wooden'||spec.key==='stepanovHouse')for(let y=bodyH*.5;y<bodyH;y+=.28)box('details',cx+e.nx*.025,y,cz+e.nz*.025,e.length,.045,.07,yaw);
  const glazed=tower||profile==='hotel'||arena||spec.key==='anteyMall'||(spec.key==='youthPalace'&&e.length>35),spacing=glazed?2.1:historic?3.5:mall?8.8:4.2,count=Math.floor((e.length-.9)/spacing);
  for(let f=0;f<levels;f++)for(let j=0;j<count;j++){
   const u=(j+.5)/count,x=e.a[0]+e.dx*u,z=e.a[1]+e.dz*u,w=glazed?e.length/count-.18:Math.min(historic?1.5:mall?3.4:2.2,e.length/count-.6),h=glazed?fh-.27:Math.min(fh*.65,historic?2.1:3.1),y=f*fh+fh*.54;
   box('frames',x+e.nx*.035,y,z+e.nz*.035,w+.19,h+.2,.11,yaw);box('windows',x+e.nx*.107,y,z+e.nz*.107,w,h,.045,yaw);
   if(historic)box('bands',x+e.nx*.055,y-h/2-.15,z+e.nz*.055,w+.38,.15,.2,yaw);
  }
  if(mall&&e.length>20){const n=Math.max(2,Math.floor(e.length/(spec.key==='veerMall'?4:18)));for(let j=0;j<n;j++){const u=(j+.5)/n;box('details',e.a[0]+e.dx*u+e.nx*.06,bodyH*.64,e.a[1]+e.dz*u+e.nz*.06,spec.key==='veerMall'?1.2:2.7,bodyH*.64,.13,yaw);}}
  if(historic&&e.length>10)for(let j=0;j<=Math.floor(e.length/8);j++){const u=j/Math.max(1,Math.floor(e.length/8));box('bands',e.a[0]+e.dx*u+e.nx*.03,bodyH/2,e.a[1]+e.dz*u+e.nz*.03,.4,bodyH,.12,yaw);}
 }
 const e=longest,ew=Math.min(8,e.length*.3),ex=(e.a[0]+e.b[0])/2,ez=(e.a[1]+e.b[1])/2,eyaw=Math.atan2(e.nx,e.nz);
 box('windows',ex+e.nx*.11,1.7,ez+e.nz*.11,ew,3.4,.08,eyaw);if(!church)box('bands',ex,3.5,ez,ew+.35,.25,.2,eyaw);
 if(historic&&spec.key!=='chuvildinHouse'){
  const w=Math.min(ew+1.3,10),h=Math.min(1.6,spec.height-bodyH-.1),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-w/2,0,0,w/2,0,0,0,h,0],3));g.computeVertexNormals();const pediment=new THREE.Mesh(g,trim);pediment.material.side=THREE.DoubleSide;pediment.rotation.y=eyaw;pediment.position.set(ex+e.nx*.13,bodyH+.12,ez+e.nz*.13);root.add(pediment);
 }
 const xs=poly.map(p=>p[0]),zs=poly.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs),cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
 if(historic||arena){
  const vertices=[],step=historic?2.2:3.2;
  function roofY(x,z){
   if(arena){const rx=(x-cx)/((maxX-minX)/2),rz=(z-cz)/((maxZ-minZ)/2);return bodyH+(spec.height-bodyH)*Math.sqrt(Math.max(0,1-rx*rx-rz*rz));}
   let distance=Infinity;for(const e of edges){const t=Math.max(0,Math.min(1,((x-e.a[0])*e.dx+(z-e.a[1])*e.dz)/(e.length*e.length)));distance=Math.min(distance,Math.hypot(x-e.a[0]-e.dx*t,z-e.a[1]-e.dz*t));}return bodyH+Math.max(.49,Math.min(2.4,distance*.55));
  }
  for(let z=minZ;z<maxZ;z+=step)for(let x=minX;x<maxX;x+=step){const q=[[x,z],[Math.min(x+step,maxX),z],[x,Math.min(z+step,maxZ)],[Math.min(x+step,maxX),Math.min(z+step,maxZ)]];for(const tri of [[0,2,1],[1,2,3]])if(tri.every(i=>inside(...q[i],poly)))for(const i of tri)vertices.push(q[i][0],roofY(...q[i]),q[i][1]);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.computeVertexNormals();const cap=new THREE.Mesh(geo,arena?trim:roof);cap.castShadow=true;cap.receiveShadow=true;root.add(cap);
 }
 else if(mall){for(let z=minZ+10;z<maxZ-10;z+=24)for(let x=minX+10;x<maxX-10;x+=35)roofBox(x,z,12,6,.9,glass);}
 else if(profile==='theatre'||profile==='culture')roofBox(cx,cz,Math.min(22,(maxX-minX)*.25),Math.min(18,(maxZ-minZ)*.25),.9,trim);
 else if(tower)roofBox(cx,cz,Math.min(9,(maxX-minX)*.25),Math.min(10,(maxZ-minZ)*.25),.72,trim);
 if(spec.key==='trinityCathedral'){
  // Primary facade reference: stks-ekb.ru/hram — classical drum, broad dome,
  // western bell tower and side portico, all removed upper parts grouped below.
  const widthMajor=spec.width>=spec.depth,a=spec.azimuth,ax=widthMajor?Math.cos(a):Math.sin(a),az=widthMajor?-Math.sin(a):Math.cos(a),long=Math.max(spec.width,spec.depth),short=Math.min(spec.width,spec.depth);
  const dx=cx+ax*long*.18,dz=cz+az*long*.18,bx=cx-ax*long*.27,bz=cz-az*long*.27,r=short*.25;
  const cyl=(x,y,z,r,h,material,segments=24)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material);m.position.set(x,y+h/2,z);roofline.add(m);return m;};
  cyl(dx,bodyH,dz,r,spec.height*.30,wall);cyl(dx,bodyH+spec.height*.30,dz,r*1.08,.65,trim);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(r,24,12,0,Math.PI*2,0,Math.PI/2),gold);dome.position.set(dx,bodyH+spec.height*.30,dz);roofline.add(dome);
  for(let i=0;i<12;i++){const t=i*Math.PI/6,nx=Math.sin(t),nz=Math.cos(t);box('frames',dx+nx*(r+.025),bodyH+spec.height*.15,dz+nz*(r+.025),r*.37,spec.height*.18,.13,t);box('windows',dx+nx*(r+.105),bodyH+spec.height*.15,dz+nz*(r+.105),r*.24,spec.height*.14,.06,t);buckets.frames.at(-1).temporal=true;buckets.windows.at(-1).temporal=true;}
  let y=bodyH;for(let i=0;i<2;i++){const rr=short*(i?.11:.145),h=spec.height*(i?.22:.24);cyl(bx,y,bz,rr,h,wall,4);for(let j=0;j<4;j++){const t=Math.PI/4+j*Math.PI/2,nx=Math.sin(t),nz=Math.cos(t),rad=rr/Math.sqrt(2);box('frames',bx+nx*(rad+.03),y+h*.52,bz+nz*(rad+.03),rr*.75,h*.8,.13,t);box('windows',bx+nx*(rad+.12),y+h*.52,bz+nz*(rad+.12),rr*.48,h*.7,.06,t);buckets.frames.at(-1).temporal=true;buckets.windows.at(-1).temporal=true;}y+=h;cyl(bx,y,bz,rr*1.11,.6,trim,4);}
  cyl(bx,y,bz,short*.078,spec.height*.13,trim,12);y+=spec.height*.13;
  const cap=new THREE.Mesh(new THREE.SphereGeometry(short*.08,16,8,0,Math.PI*2,0,Math.PI/2),gold);cap.position.set(bx,y,bz);roofline.add(cap);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,spec.height-y-short*.08,8),gold);pole.position.set(bx,(spec.height+y+short*.08)/2,bz);roofline.add(pole);
  for(let i=0;i<6;i++){const u=(i-2.5)*2.1,x=ex+e.dx/e.length*u-e.nx*.45,z=ez+e.dz/e.length*u-e.nz*.45,m=new THREE.Mesh(new THREE.CylinderGeometry(.36,.44,bodyH*.91,10),trim);m.position.set(x,bodyH*.46,z);root.add(m);}
 } else if(church){
  const r=Math.min(spec.width,spec.depth)*.31;let y=bodyH;
  for(let level=0;level<3;level++){
   const h=spec.height*[.25,.18,.11][level],rr=r*(1-level*.18),drum=new THREE.Mesh(new THREE.CylinderGeometry(rr,rr,h,8),wall);drum.position.set(cx,y+h/2,cz);roofline.add(drum);
   for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4,nx=Math.sin(a),nz=Math.cos(a),rad=rr*Math.cos(Math.PI/8);box('frames',cx+nx*(rad+.05),y+h*.51,cz+nz*(rad+.05),rr*.60,h*.69,.16,a);box('windows',cx+nx*(rad+.15),y+h*.51,cz+nz*(rad+.15),rr*.40,h*.57,.08,a);buckets.frames.at(-1).temporal=true;buckets.windows.at(-1).temporal=true;}
   y+=h;const rim=new THREE.Mesh(new THREE.CylinderGeometry(rr*1.065,rr*1.065,.7,8),trim);rim.position.set(cx,y,cz);roofline.add(rim);
  }
  const domeH=spec.height*.115,points=[[0,0],[.58,0],[.85,.15],[1,.32],[.94,.48],[.66,.66],[.30,.83],[.07,1]].map(([x,y])=>new THREE.Vector2(x*r*.67,y*domeH));
  const dome=new THREE.Mesh(new THREE.LatheGeometry(points,24),gold);dome.position.set(cx,y,cz);roofline.add(dome);y+=domeH;
  const crossH=Math.max(.7,spec.height-y),v=new THREE.Mesh(new THREE.BoxGeometry(.35,crossH,.35),gold),h=new THREE.Mesh(new THREE.BoxGeometry(2.7,.3,.3),gold);v.position.set(cx,y+crossH/2,cz);h.position.set(cx,y+crossH*.65,cz);roofline.add(v,h);
 }
 for(const[name,all]of Object.entries(buckets)){
  const filtered=passage?all.filter(q=>q.x+Math.max(q.w,q.d)/2<passageX||q.y-q.h/2>=clearance):all;
  for(const temporal of [false,true]){const entries=filtered.filter(q=>!!q.temporal===temporal);if(!entries.length)continue;
   const inst=new THREE.InstancedMesh(unit,name==='windows'?glass:name==='details'?accent:trim,entries.length);
   entries.forEach((q,i)=>{tmp.position.set(q.x,q.y,q.z);tmp.rotation.set(0,q.yaw,0);tmp.scale.set(q.w,q.h,q.d);tmp.updateMatrix();inst.setMatrixAt(i,tmp.matrix);});
   inst.name=name;inst.castShadow=name!=='windows';inst.receiveShadow=true;(temporal?roofline:root).add(inst);
  }
 }
 root.userData={profile,roofline,footprint:poly,sourceUrls:spec.sourceUrls,materials:{wall,trim,roof,glass,gold,accent}};return root;
}
