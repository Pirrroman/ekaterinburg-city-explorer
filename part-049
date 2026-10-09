import * as THREE from '../vendor/three.module.js';
import {getMaterials,paint,box,cylinder,gable,addWindow,arch} from '../architecture-kit.js';

// Massing and facade rhythms were rebuilt after examining the cited photographs.
// These are architectural reconstructions, not survey or photogrammetry meshes.
const PI=Math.PI, TAU=PI*2;
const B=new THREE.BoxGeometry(1,1,1), CYL=new THREE.CylinderGeometry(1,1,1,24);
let M;
function group(name){const g=new THREE.Group();g.name=name;return g;}
function mesh(g,geo,material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function rod(g,a,b,r,material){const p=new THREE.Vector3(...a),q=new THREE.Vector3(...b),d=q.clone().sub(p);const m=mesh(g,CYL,material);m.position.copy(p).add(q).multiplyScalar(.5);m.scale.set(r,d.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
function sphere(g,x,y,z,r,material,sx=1,sy=1,sz=1){const m=mesh(g,new THREE.SphereGeometry(r,18,12),material,x,y,z);m.scale.set(sx,sy,sz);return m;}
function ring(g,rx,rz,y,r,material){const m=mesh(g,new THREE.TorusGeometry(1,r/rx,8,96),material,0,y,0);m.rotation.x=PI/2;m.scale.set(rx,rz,rx);return m;}
function cornice(g,x,y,z,w,d,material=M.whiteStone){for(const [dy,extra,h]of[[-.55,.5,.45],[0,1.3,.75],[.65,2.1,.45]])box(g,x,y+dy,z,w+extra,h,d+extra,material);}
function plinth(g,w,d,z=0){box(g,0,.85,z,w+1.8,1.7,d+1.8,M.limestone);}
function steps(g,x,z,w,count=5,base=0){for(let n=0;n<count;n++)box(g,x,base+(n+.5)*.38,z-n*.72,w,.38,(count-n)*.72+.8,M.limestone);}
function column(g,x,y,z,h,r,material=M.whiteStone){cylinder(g,x,y+h*.5,z,r,h,material);cylinder(g,x,y+.38,z,r*1.4,.76,material);cylinder(g,x,y+h-.3,z,r*1.55,.6,material);box(g,x,y+h+.28,z,r*3.3,.58,r*3.3,material);}
function windowsRow(g,n,y,z,start,step,w,h,opts={}){for(let i=0;i<n;i++)addWindow(g,start+i*step,y,z,w,h,{frame:.25,depth:.25,mullions:1,...opts});}
function dentils(g,w,y,z,count=25){for(let i=0;i<count;i++)box(g,-w/2+i*w/(count-1),y,z,.95,.8,.85,M.whiteStone);}
function balustrade(g,x,y,z,w,n=12){box(g,x,y+.1,z,w,.45,1.05,M.whiteStone);box(g,x,y+2.8,z,w+.5,.5,1.2,M.whiteStone);for(let i=0;i<n;i++){const xx=x-w*.5+.6+i*(w-1.2)/(n-1);cylinder(g,xx,y+1.5,z,.26,2.3,M.whiteStone,12);sphere(g,xx,y+1.2,z,.44,M.whiteStone,.8,1.25,.8);}}
function relief(g,x,y,z,w=4){const geo=new THREE.TorusGeometry(w*.23,.16,6,20);const r=mesh(g,geo,M.whiteStone,x,y,z);r.scale.y=.78;for(const s of[-1,1]){const leaf=sphere(g,x+s*w*.31,y+.17,z,.8,M.whiteStone,1.7,.35,.22);leaf.rotation.z=s*.45;box(g,x+s*w*.12,y-w*.17,z,.28,w*.24,.23,M.whiteStone);}}
function figure(g,x,y,z,h,raised=false,seated=false){
  const f=group('Carved roof figure');f.position.set(x,y,z);g.add(f);
  const points=[new THREE.Vector2(h*.23,0),new THREE.Vector2(h*.20,h*.25),new THREE.Vector2(h*.14,h*.51),new THREE.Vector2(h*.18,h*.70),new THREE.Vector2(h*.10,h*.82)];
  mesh(f,new THREE.LatheGeometry(points,20),M.whiteStone);sphere(f,0,h*.92,0,h*.105,M.whiteStone,.85,1.1,.9);
  const shoulder=h*.68;for(const s of[-1,1]){
    const armEnd=raised&&s===1?[s*h*.13,h*1.30,0]:[s*h*.32,h*.41,seated?h*.15:0];
    rod(f,[s*h*.14,shoulder,0],armEnd,h*.055,M.whiteStone);
    if(seated){rod(f,[s*h*.13,h*.38,0],[s*h*.2,h*.2,h*.3],h*.085,M.whiteStone);rod(f,[s*h*.2,h*.2,h*.3],[s*h*.2,0,h*.2],h*.06,M.whiteStone);}
  }
  if(raised){cylinder(f,h*.13,h*1.36,0,h*.03,h*.18,M.whiteStone,12);sphere(f,h*.13,h*1.47,0,h*.055,M.whiteStone);}
  for(let i=0;i<7;i++){const a=i*TAU/7;rod(f,[Math.cos(a)*h*.18,0,Math.sin(a)*h*.18],[Math.cos(a)*h*.115,h*.44,Math.sin(a)*h*.115],h*.012,M.whiteStone);}
  return f;
}
function hippedRoof(g,x,y,z,w,d,h,material,checker=false){
  const topW=w*.44,topD=d*.16,faces=[
    [[-w/2,0,d/2],[w/2,0,d/2],[-topW/2,h,topD/2],[topW/2,h,topD/2]],
    [[w/2,0,-d/2],[-w/2,0,-d/2],[topW/2,h,-topD/2],[-topW/2,h,-topD/2]],
    [[-w/2,0,-d/2],[-w/2,0,d/2],[-topW/2,h,-topD/2],[-topW/2,h,topD/2]],
    [[w/2,0,d/2],[w/2,0,-d/2],[topW/2,h,topD/2],[topW/2,h,-topD/2]],
  ];const pos=[],uv=[],cols=[],indices=[];
  for(const f of faces)for(let r=0;r<8;r++)for(let c=0;c<12;c++){
    const base=pos.length/3;
    for(const [u,v]of[[c/12,r/8],[(c+1)/12,r/8],[(c+1)/12,(r+1)/8],[c/12,(r+1)/8]]){
      for(let k=0;k<3;k++)pos.push(THREE.MathUtils.lerp(THREE.MathUtils.lerp(f[0][k],f[1][k],u),THREE.MathUtils.lerp(f[2][k],f[3][k],u),v));
      uv.push(u,v);const cc=new THREE.Color(checker?((r+c)%2?'#eee4cb':'#9d352b'):'#ffffff');cols.push(cc.r,cc.g,cc.b);
    }
    indices.push(base,base+1,base+2,base,base+2,base+3);
  }
  // Local vertices; outward winding is checked with the sloping face normal.
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));geo.setIndex(indices);geo.computeVertexNormals();
  const m=mesh(g,geo,checker?paint('#ffffff','roof',{vertexColors:true,side:THREE.DoubleSide}):material,x,y,z);
  box(g,x,y+h,z,topW,.2,topD,checker?M.roofTerracotta:material);return m;
}
function clock(g,x,y,z,r,rotation=0){
  const c=group('Clock face');c.position.set(x,y,z);c.rotation.y=rotation;g.add(c);
  mesh(c,new THREE.CircleGeometry(r,64),M.black,0,0,.03);const edge=mesh(c,new THREE.TorusGeometry(r,.18,8,64),M.gold,0,0,.1);
  for(let i=0;i<12;i++){const a=i*TAU/12,b=box(c,Math.sin(a)*r*.82,Math.cos(a)*r*.82,.25,.18,r*.20,.14,M.gold);b.rotation.z=-a;}
  rod(c,[0,0,.3],[r*.15,r*.53,.3],.09,M.gold);rod(c,[0,0,.4],[-r*.52,-r*.21,.4],.075,M.gold);sphere(c,0,0,.4,.17,M.gold);
}

function operaModel(){
  const g=group('Opera:1912modernstylefacade'),wall=paint('#d3d2c8','plaster'),warm=paint('#ded8c9','plaster');
  plinth(g,86,74,-12);box(g,0,18,-12,86,36,74,wall);box(g,0,26,-43,50,46,29,wall);
  const facade=group('Threebayedportico');g.add(facade);box(facade,0,20,27,56,40,14,warm);
  for(const x of[-38,38]){const a=group('Facetedcornerpavilion');a.position.set(x,0,22);a.rotation.y=x>0?-PI/8:PI/8;g.add(a);box(a,0,18,0,19,36,19,wall);cornice(a,0,35,0,21,22);addWindow(a,0,22,10,7,13,{arched:true,color:'#ded7c7',frame:.45,mullions:2});box(a,0,30.2,12,11,1.2,5,M.whiteStone);balustrade(a,0,31,13,11,7);}
  for(const x of[-17,0,17]){
    addWindow(facade,x,5.9,34.2,7.6,9.3,{glassMaterial:M.wood,color:'#eee7d9',frame:.65,mullions:1});
    addWindow(facade,x,22,34.25,7.8,14.4,{arched:true,color:'#efe4d2',frame:.65,mullions:2});
    box(facade,x,29.4,36,12,1.15,4.8,M.whiteStone);balustrade(facade,x,30,37,12,7);
    addWindow(facade,x,34,34.3,8.1,4.1,{color:'#eae3d4',frame:.45,mullions:2});
    for(const off of[-4.6,4.6])rod(facade,[x+off,27.2,35.2],[x+off,29.1,37.4],.48,M.whiteStone);
  }
  box(facade,0,12.3,37,58,1.6,5,M.whiteStone);balustrade(facade,0,13.2,39,58,32);
  for(const x of[-28,-24.5,24.5,28]){box(facade,x,24,34.9,1.55,26,.7,M.whiteStone);box(facade,x,36,35.2,2.7,1.2,1.1,M.whiteStone);}
  cornice(g,0,37,-11,89,76);cornice(facade,0,40,28,59,17);dentils(facade,58,39,37,35);
  box(facade,0,44,28,51,7,14,wall);for(const x of[-17,0,17])relief(facade,x,43.7,35.3,7);
  cornice(facade,0,47.5,28,55,16);balustrade(g,0,39,-10,82,46);
  for(const x of[-27,27]){box(facade,x,46,28,8,11,17,wall);cornice(facade,x,51.2,28,8.5,17.5);cylinder(facade,x,55,28,.55,5,M.whiteStone);sphere(facade,x,58,28,1.3,M.whiteStone,1,.8,1);}
  figure(facade,0,48,31,10,true);figure(facade,-7.5,48,33,7,false,true);figure(facade,7.5,48,33,7,false,true);
  for(const side of[-1,1]){const f=group('Sidefacade');f.position.x=side*43.2;f.rotation.y=side*PI/2;g.add(f);for(const z of[-32,-14,4]){addWindow(f,-z,21,0,7,13,{arched:true,frame:.45,mullions:2,color:'#e2d9c7'});addWindow(f,-z,33,0,7,4,{frame:.35,mullions:2});relief(f,-z,28,1,4);} }
  steps(g,0,42,51,4);g.userData.photoSpecific=['3tallarches','3balconies','threefemaleallegories','facetedcornerbays','flatparapet'];return g;
}

function stationModel(){
  const g=group('Oldrailwaystation1878'),wall=paint('#d0bea0','plaster'),red=paint('#8e493b','brick');
  plinth(g,130,34);box(g,0,9,0,128,18,32,wall);cornice(g,0,17.5,0,130,34);hippedRoof(g,0,18,0,130,33,5,M.roofTerracotta);
  for(const x of[-51,0,51]){
    const w=x===0?27:25,h=x===0?24:22;box(g,x,h*.5,1,w,h,38,wall);cornice(g,x,h,1,w+2,40);hippedRoof(g,x,h+.4,1,w+5,42,x===0?7:9,M.roofTerracotta,true);
    for(const xx of[x-w*.5,x+w*.5]){column(g,xx,2,20,h-3,.57);for(let yy=2;yy<h;yy+=2.3)box(g,xx,yy,20,2.5,.6,1.1,M.whiteStone);}
  }
  for(const side of[-1,1])for(let i=0;i<6;i++){
    const x=side*(14+i*6.6);addWindow(g,x,9.5,16.3,4.0,10.5,{arched:true,color:'#f0eadb',frame:.4,mullions:2});
    box(g,x,3,17,5.8,.6,1.2,M.whiteStone);column(g,x+2.8,2.5,17.1,11,.36);relief(g,x,15.4,17.1,3);
    const roof=group('Pointedroofgables');roof.position.set(x,18.6,16.3);g.add(roof);gable(roof,0,0,0,6.1,4,2.1,M.whiteStone);gable(roof,0,.3,.2,4.7,2.7,1.9,red);
  }
  arch(g,0,10.2,21,13.4,20,1.3,M.whiteStone);addWindow(g,0,10.1,20.2,10.3,17.6,{arched:true,frame:.9,glassMaterial:M.wood,color:'#ece4d5'});
  for(const x of[-8,8]){addWindow(g,x,14,20.4,4,7,{arched:true,frame:.45});column(g,x,1,21,15,.65);}
  box(g,0,34.8,4,9.2,7,10,M.whiteStone);clock(g,0,34.8,9.2,2.6);hippedRoof(g,0,38.3,4,11.8,12,2.7,M.roofTerracotta,true);
  cylinder(g,0,42.5,4,2.3,3,M.whiteStone,12);mesh(g,new THREE.ConeGeometry(3.2,3,8),M.roofTerracotta,0,45.5,4);rod(g,[0,47,4],[0,51,4],.1,M.steel);
  for(const x of[-65,-38,38,65]){cylinder(g,x,24,1,1,5,M.whiteStone,12);sphere(g,x,27,1,1.25,M.whiteStone);}
  steps(g,0,27,21,4);box(g,0,.6,-35,137,1.2,17,M.limestone);box(g,0,13,-36,137,.8,16,M.roofGreen);for(let x=-64;x<=64;x+=12)column(g,x,1,-35,12,.3,M.steel);
  return g;
}

function whiteTowerModel(){
  const g=group('WhiteTower:asymmetricconstructivistwaterreservoir'),white=paint('#edece4','plaster'),edge=paint('#c9cdc6','stone');
  box(g,0,1.3,0,37,2.6,31,edge);box(g,-15,35,-3,10,70,15,white);
  addWindow(g,-15,32,4.6,3.1,54,{frame:.14,mullions:0,color:'#d4d6ce',glassMaterial:M.glassDark});
  for(let y=7;y<62;y+=7)box(g,-15,y,4.9,3.5,.27,.3,M.steel);
  for(const [x,z]of[[9,-9],[9,9],[-3,-9],[-3,9]])box(g,x,17.5,z,2.3,35,2.7,white);
  const saucer=new THREE.LatheGeometry([new THREE.Vector2(0,30),new THREE.Vector2(11,30),new THREE.Vector2(15,31.7),new THREE.Vector2(18,34.5)],64);mesh(g,saucer,white);
  cylinder(g,0,47,0,18,25,white,72);cylinder(g,0,33.4,0,17.8,1.3,edge,72);cylinder(g,0,59.8,0,18.3,1.3,edge,72);
  cylinder(g,0,56.3,0,18.13,5.8,M.glass,72);cylinder(g,0,52.95,0,18.45,.7,edge,72);cylinder(g,0,59.25,0,18.45,.7,edge,72);
  cylinder(g,0,32.4,0,16.6,3,M.glassDark,72);
  for(let i=0;i<36;i++){const a=i*TAU/36;box(g,Math.cos(a)*18.3,56.3,Math.sin(a)*18.3,.23,6,.23,M.steel);}
  for(const a of[.28,1.12,2.0,2.88,3.68,4.5,5.32]){
    const p=group('Roundporthole');p.position.set(Math.sin(a)*18.05,41.2,Math.cos(a)*18.05);p.rotation.y=a;g.add(p);mesh(p,new THREE.CircleGeometry(1.25,32),M.glassDark,0,0,.13);mesh(p,new THREE.TorusGeometry(1.42,.19,8,32),edge,0,0,.2);
  }
  box(g,-9,67,-3,26,6,18,white);box(g,-9,63.9,-3,28,.9,21,edge);
  windowsRow(g,7,66.9,6.15,-20,3.7,3.3,3.4,{frame:.1,mullions:0,color:'#bdc6c5',glassMaterial:M.glass});
  for(let i=0;i<38;i++){const a=i*TAU/38;box(g,Math.cos(a)*18.0,62.1,Math.sin(a)*18.0,.18,3.2,.18,M.steel);}ring(g,18,18,63.5,.14,M.steel);
  for(const z of[-13.5,8]){box(g,-9,64.9,z,28,.17,.17,M.steel);for(let x=-23;x<=5;x+=3.5)box(g,x,64.2,z,.15,1.5,.15,M.steel);}
  const slender=group('Photographicreservoirproportions');for(const child of [...g.children])slender.add(child);slender.scale.set(.83,1,.83);g.add(slender);return g;
}

function cityhallModel(){
  const g=group('CityhallUplanand1954clocktower'),wall=paint('#c5a486','plaster'),light=paint('#dadbd1','stone');
  box(g,0,17,0,108,34,34,wall);plinth(g,108,34);hippedRoof(g,0,34,0,110,36,4,M.roofGreen);
  for(const x of[-46,46]){
    box(g,x,17,-47,16,34,94,wall);hippedRoof(g,x,34,-47,18,97,4,M.roofGreen);cornice(g,x,32.8,-47,17,95,light);
    for(const face of[-1,1]){
      const wing=group('Cityhallsiderhythm');wing.position.set(x+face*8.25,0,-47);wing.rotation.y=face*PI/2;g.add(wing);
      for(const y of[5.8,14,22.4,29.5])windowsRow(wing,14,y,0,-42,6.4,3.25,5.5,{color:'#cbd0c4',frame:.22,mullions:2});
      for(let z=-44;z<=44;z+=6.4)box(wing,z,20.4,.6,.9,25,1.0,light);
    }
  }
  for(let x=-48;x<=48;x+=6){
    for(const y of[5.8,14,22.4,29.5])addWindow(g,x,y,17.25,3.25,y<10?5.3:5.7,{color:'#cbd0c4',frame:.22,mullions:2});
    box(g,x+2.8,20.4,18.15,.9,25,1.3,light);box(g,x+2.8,33,18.2,2.2,1.4,1.8,light);
  }
  cornice(g,0,33,0,110,36,light);cornice(g,0,9.2,0,109,35,light);dentils(g,105,32.1,18.4,65);
  for(const x of[-49,49]){column(g,x,2,18.5,30,1.05,light);column(g,x-Math.sign(x)*3,2,18.5,30,1.05,light);}
  for(const x of[-9.5,9.5])column(g,x,2,20.5,32,1.15,light);
  addWindow(g,0,7.9,17.5,8.5,13,{arched:true,color:'#e2ded1',frame:.8,glassMaterial:M.wood});box(g,0,29,19.2,18,6,2.1,wall);relief(g,0,29,20.4,8);
  const t=group('1954clocktowerandspire');g.add(t);g.userData.spire=t;
  box(t,0,44,0,25,19,26,wall);cornice(t,0,36,0,27,28,light);cornice(t,0,53.7,0,27,28,light);
  box(t,0,65,0,20,21,21,wall);for(const x of[-9,9])for(const z of[-10,10])column(t,x,55,z,20,.78,light);
  clock(t,0,65,10.6,5);clock(t,0,65,-10.6,5,PI);clock(t,10.5,65,0,5,PI/2);clock(t,-10.5,65,0,5,-PI/2);
  cornice(t,0,76,0,25,26,light);cylinder(t,0,84,0,8.6,14,light,8);cylinder(t,0,77.2,0,10.6,1.5,light,8);
  for(let i=0;i<8;i++){const a=i*TAU/8;column(t,Math.cos(a)*8,78,Math.sin(a)*8,11,.57,light);}
  cylinder(t,0,91,0,10.2,1.5,light,8);mesh(t,new THREE.ConeGeometry(3.2,28,12),M.gold,0,105,0);sphere(t,0,120,0,1.0,M.gold);
  const star=new THREE.Shape();for(let i=0;i<10;i++){const a=i*PI/5+PI/2,r=i%2?1.35:3.2;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?star.lineTo(x,y):star.moveTo(x,y);}star.closePath();mesh(t,new THREE.ExtrudeGeometry(star,{depth:.6,bevelEnabled:true,bevelSize:.12,bevelThickness:.08,bevelSegments:1}),M.gold,0,124,0);
  // Keep the fixed photo proportions inside the historically revealed outerGroup.
  // The lifecycle reveals the tower with a clipping plane; this author scale is fixed.
  const proportion=group('Clocktowervsfrontfacadeproportions');for(const child of [...t.children])proportion.add(child);proportion.scale.y=.65;proportion.position.y=-34*.65;t.position.y=34;t.add(proportion);
  steps(g,0,25,22,6);
  // The 1930s constructivist body predates the post-war decorative facade and
  // clock tower. Keep both architectural phases at the same measured plot.
  const root=group('Cityhall:1934body,1954facade'),early=group('1934constructivistbody');
  const plain=paint('#baab8c','plaster');
  box(early,0,17,0,108,34,34,plain);hippedRoof(early,0,34,0,110,36,4,M.roofGreen);
  for(const x of[-46,46]){box(early,x,17,-47,16,34,94,plain);hippedRoof(early,x,34,-47,18,97,4,M.roofGreen);}
  for(const y of[5.8,14,22.4,29.5])windowsRow(early,16,y,17.3,-47,6.25,3.1,5.5,{frame:.14,mullions:1,color:'#bdb7a6'});
  box(early,0,1.2,20,25,2.4,7,M.limestone);
  root.add(early,g,t);root.userData.spire=t;root.userData.earlyFacade=early;root.userData.postwarFacade=g;
  root.userData.updateState=state=>{const year=state.calendarYear??state.year,p=state.constructionProgress?.cityhallSpire;const postwar=Number.isFinite(p)?p>0:year>=1954;early.visible=!postwar;g.visible=postwar;};
  return root;
}

function circusModel(){
  const g=group('Circus:radialconcretevaultoverseparatedinnerdome'),wall=paint('#d6d4c8','stone');
  box(g,0,9,0,171,18,148,wall);plinth(g,171,148);box(g,0,18.5,0,172,1.6,149,M.limestone);
  for(const side of[-1,1]){const f=group('Rectangularcircusglazedfoyer');f.position.set(side===1?0:85.7,0,side===1?74.2:0);f.rotation.y=side===1?0:PI/2;g.add(f);const n=side===1?18:15,w=side===1?9:9;for(let i=0;i<n;i++){const x=(i-(n-1)/2)*w;addWindow(f,x,5.2,.2,7.1,8.6,{frame:.25,mullions:2,glassMaterial:M.glass,color:'#b6b8b2'});addWindow(f,x,13.3,.3,6.9,4.8,{frame:.18,mullions:2});}}
  for(const x of[-65,-39,-13,13,39,65]){box(g,x,13.7,75.1,8.2,7.6,1.2,M.whiteStone);const relief=figure(g,x,10.2,75.9,6,false,true);relief.scale.z=.15;}
  const inner=mesh(g,new THREE.SphereGeometry(1,64,32,0,TAU,0,PI/2),paint('#252c2b','metal',{roughness:.85,metalness:.05}),0,19,0);inner.scale.set(74,44,60);
  const rx=88,rz=71,h=65,base=19,n=24;
  const vertex=(i,t)=>new THREE.Vector3(Math.cos(i*TAU/n)*(5+(rx-5)*Math.sin(t)),base+h*Math.cos(t),Math.sin(i*TAU/n)*(4+(rz-4)*Math.sin(t)));
  for(let i=0;i<n;i++){
    const pts=[];for(let j=0;j<=28;j++)pts.push(vertex(i,j*PI/56));
    const c=new THREE.CatmullRomCurve3(pts);mesh(g,new THREE.TubeGeometry(c,40,1.22,8,false),M.whiteStone);
    // Large V bays and crossing inner diagonals, rather than a line-grid sphere.
    for(const [a,b]of[[.24,.73],[.73,1.18],[1.18,PI/2]]){
      rod(g,vertex(i,a).toArray(),vertex((i+1)%n,b).toArray(),.43,M.whiteStone);
      rod(g,vertex((i+1)%n,a).toArray(),vertex(i,b).toArray(),.43,M.whiteStone);
    }
  }
  ring(g,88,71,19,1,M.whiteStone);ring(g,5,4,84,.75,M.whiteStone);steps(g,0,83,77,6);return g;
}

function ovalSurface(rx,rz,ix,iz,y,iy= y){
  const pos=[],uv=[],idx=[];for(let i=0;i<=128;i++){const a=i*TAU/128,c=Math.cos(a),s=Math.sin(a);pos.push(rx*c,y,rz*s,ix*c,iy,iz*s);uv.push(i/128,1,i/128,0);if(i<128){const n=i*2;idx.push(n,n+1,n+3,n,n+3,n+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
function ovalWall(rx,rz,y,h,material,parent,openEnds=false){
  const pos=[],uv=[],idx=[];for(let i=0;i<=128;i++){const a=i*TAU/128;pos.push(rx*Math.cos(a),y,rz*Math.sin(a),rx*Math.cos(a),y+h,rz*Math.sin(a));uv.push(i/8,0,i/8,h/10);if(i<128&&(!openEnds||Math.abs(Math.cos(a))>.28)){const n=i*2;idx.push(n,n+1,n+3,n,n+3,n+2);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return mesh(parent,g,material);
}
function seatRing(parent,rows,count,startX,startZ,dy,colorMat){
  const geo=new THREE.BoxGeometry(2.1,.85,2.1),ins=new THREE.InstancedMesh(geo,colorMat,rows*count),o=new THREE.Object3D();let n=0;
  for(let r=0;r<rows;r++)for(let i=0;i<count;i++){const a=i*TAU/count;if(i%18===0)continue;o.position.set((startX+r*2.2)*Math.cos(a),4+r*dy,(startZ+r*2.55)*Math.sin(a));o.rotation.y=-a-PI/2;o.scale.set(1,1,1);o.updateMatrix();ins.setMatrixAt(n++,o.matrix);}ins.count=n;ins.castShadow=true;ins.receiveShadow=true;parent.add(ins);return ins;
}
function stadiumModel(){
  const g=group('Central stadium: measured pitch, east/west historic facades'),old=group('Old1957stadium'),arena=group('2018arenabowl'),temporary=group('TemporaryexternalWorldCupstands');
  g.add(old,arena,temporary);Object.assign(g.userData,{oldStadium:old,arena,temporaryStands:temporary});
  // OSM relation55833 outer18074396: 198.14335×251.60328m in pitch axes.
  // Temporary north/south stands must never shrink the permanent bowl or field.
  g.userData.metricBounds=new THREE.Box3(new THREE.Vector3(-99.071675,0,-125.80164),new THREE.Vector3(99.071675,45.5,125.80164));
  const ochre=paint('#c4ab72','plaster'),seat=paint('#ba684b','plaster'),concrete=M.concrete;
  mesh(g,ovalSurface(97,123,0,0,.12),M.asphalt);mesh(g,ovalSurface(47,78,0,0,.30),paint('#427c3c','plaster'));box(g,0,.32,0,68,.5,105,paint('#427c3c','plaster'));
  for(const z of[-52.5,52.5])box(g,0,.6,z,68,.07,.16,M.whiteStone);for(const x of[-34,34])box(g,x,.6,0,.16,.07,105,M.whiteStone);box(g,0,.6,0,68,.07,.16,M.whiteStone);ring(g,9.15,9.15,.62,.10,M.whiteStone);
  for(const sign of[-1,1]){for(const x of[-20.16,20.16])box(g,x,.63,sign*44.25,.16,.07,16.5,M.whiteStone);box(g,0,.63,sign*36,40.32,.07,.16,M.whiteStone);for(const x of[-3.66,3.66])rod(g,[x,.6,sign*52.5],[x,3.04,sign*52.5],.09,M.whiteStone);rod(g,[-3.66,3.04,sign*52.5],[3.66,3.04,sign*52.5],.09,M.whiteStone);}
  mesh(old,ovalSurface(57,90,47,78,.66),paint('#a76b52','plaster'));
  const tierWall=paint('#b6b4a8','concrete',{side:THREE.DoubleSide});
  for(let r=0;r<20;r++){mesh(old,ovalSurface(59+r*1.8,91+r*1.5,57.2+r*1.8,89.5+r*1.5,1+r*.62),r%2?concrete:M.limestone);ovalWall(57.2+r*1.8,89.5+r*1.5,.38+r*.62,.62,tierWall,old);}
  for(const x of[-85,85])for(const z of[-102,102]){rod(old,[x,0,z],[x,38,z],.4,M.steel);box(old,x,39,z,10,4,1.5,M.whiteStone);}
  // The preserved monumental facades are along the east and west stands.
  for(const side of[-1,1]){
    const f=group('Preserved1957eastwestfacade');f.position.x=side*93.7;f.rotation.y=side*PI/2;g.add(f);
    box(f,0,9.5,0,85,19,9,ochre);plinth(f,85,9);cornice(f,0,19,0,88,10);
    for(const x of[-29,-17,-5.5,5.5,17,29]){column(f,x-3.6,1,5,17,.63,M.whiteStone);addWindow(f,x,10,4.65,5.9,13,{arched:true,frame:.35,mullions:2,color:'#ddd6c5'});box(f,x,5.8,5.3,6.8,.7,1.4,M.whiteStone);figure(f,x-3.6,18.7,5,3.8);}
    for(const x of[-45,45]){box(f,x,9.5,0,10,19,10,ochre);addWindow(f,x,10,5.1,4.5,9,{frame:.4,mullions:2});cornice(f,x,19,0,11,11);}steps(f,0,8,67,3);
  }
  {
    const pos=[],idx=[];for(let i=0;i<=128;i++){const a=i*TAU/128,y=Math.abs(Math.sin(a))<.405?23:3;pos.push(98.3*Math.cos(a),y,124.5*Math.sin(a),98.3*Math.cos(a),43,124.5*Math.sin(a));if(i<128&&Math.abs(Math.cos(a))>.30){const n=i*2;idx.push(n,n+1,n+3,n,n+3,n+2);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(arena,geo,paint('#a3acac','metal',{roughness:.58,side:THREE.DoubleSide}));
  }
  for(let i=0;i<96;i++){const a=i*TAU/96;if(Math.abs(Math.cos(a))<.30)continue;rod(arena,[98.3*Math.cos(a),3,124.5*Math.sin(a)],[98.3*Math.cos(a),44,124.5*Math.sin(a)],.18,M.steel);}
  for(const y of[8,19,30,41])ring(arena,98.5,124.7,y,.18,M.steel);
  mesh(arena,ovalSurface(99,125.6,65,89,45.5,43),paint('#bcc3c2','metal',{side:THREE.DoubleSide,roughness:.66}));
  for(let i=0;i<64;i++){const a=i*TAU/64;rod(arena,[99*Math.cos(a),45.5,125.6*Math.sin(a)],[65*Math.cos(a),43,89*Math.sin(a)],.16,M.steel);}
  // 22 sloped tiers. Side seating and curved end seating share the actual field,
  // with open north/south portals to the temporary external World Cup stands.
  for(let r=0;r<22;r++){const rx=43+r*2.15,rz=65+r*2.48,y=1.6+r*1.55;mesh(arena,ovalSurface(rx+2.15,rz+2.48,rx,rz,y),concrete);ovalWall(rx,rz,y-1.55,1.55,tierWall,arena,r>10);
    for(let i=0;i<136;i++){const a=i*TAU/136;if(i%17===0||(r>10&&Math.abs(Math.cos(a))<.31))continue;const chair=box(arena,rx*Math.cos(a),y+.4,rz*Math.sin(a),1.0,.65,1.15,seat);chair.rotation.y=-a-PI/2;}}
  for(const sign of[-1,1]){
    const section=group('Openendedexternalgrandstand');temporary.add(section);
    for(let row=0;row<20;row++){const y=13+row*1.37,z=sign*(111+row*2.35);box(section,0,y-.4,z,76,.8,2.35,concrete);for(let col=0;col<59;col++)box(section,(col-29)*1.23,y+.22,z,.95,.58,1.05,seat);}
    for(const x of[-35,-17,0,17,35])for(const z of[122,137,155]){const h=13+(z-111)/2.35*1.37;rod(section,[x,0,sign*z],[x,h,sign*z],.27,M.steel);rod(section,[x-5,0,sign*z],[x+5,h,sign*z],.16,M.steel);}
  }
  return g;
}

function uralmashModel(){
  const g=group('Uralmash:constructivistverticalglazingandsawtoothworks'),wall=paint('#bda99c','plaster'),brick=paint('#8f6650','brick');
  const gate=group('actual-1933-gate');gate.scale.set(.48,.6,1);g.add(gate);
  box(gate,0,20,0,112,40,35,wall);plinth(gate,112,35);cornice(gate,0,40,0,115,37,M.concrete);
  for(let i=0;i<14;i++){const x=-50+i*7.7;addWindow(gate,x,23,17.7,4.9,31,{frame:.26,mullions:2,color:'#ccc4b4',glassMaterial:M.glassDark});for(let y=8;y<38;y+=4.8)box(gate,x,y,18.1,5.2,.2,.18,M.steel);box(gate,x+3.8,22,18,.75,35,.75,M.limestone);}
  box(gate,0,2.7,19,115,5.4,2,M.limestone);addWindow(gate,0,4.5,19.7,8,8,{frame:.45,glassMaterial:M.glassDark});
  for(let hall=0;hall<4;hall++){
    const z=-150-hall*80;box(g,0,12,z,150,24,65,brick);plinth(g,150,65,z);
    for(let bay=0;bay<6;bay++){
      const x=-62.5+bay*25;
      // Continuous sawtooth clerestories reproduce the real industrial skyline.
      const pts=[[-12.5,0,-32.5],[12.5,0,-32.5],[7.5,10,-32.5],[-12.5,0,32.5],[12.5,0,32.5],[7.5,10,32.5]],p=pts.flat(),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4]);geo.computeVertexNormals();mesh(g,geo,M.roofGreen,x,24,z);
      box(g,x+9.8,29,z,1,8,62,M.glass);for(let zz=-30;zz<32;zz+=5)box(g,x+10.4,29,z+zz,1.1,8,.24,M.steel);
    }
    for(const side of[-1,1]){const f=group('Factorysideglazing');f.position.set(side*75.3,0,z);f.rotation.y=side*PI/2;g.add(f);windowsRow(f,10,14,0,-28,6.2,5,13,{frame:.3,mullions:2,glassMaterial:M.glass,color:'#b8b5a9'});}
    windowsRow(g,19,13,z+32.7,-69,7.7,5.8,13,{frame:.3,mullions:2,glassMaterial:M.glass,color:'#bdb8ac'});
  }
  for(const [x,z,h]of[[-90,-220,76],[90,-310,95],[90,-400,65]]){cylinder(g,x,h*.5,z,4.6,h,brick,40);for(let y=9;y<h;y+=12)cylinder(g,x,y,z,4.85,.75,M.steel,40);cylinder(g,x,h,z,5.5,2,M.black,40);}
  return g;
}

function universityModel(){
  const g=group('UPI1939Uplan'),early=group('Preserveoriginal1920institution'),campus=group('1939maincampus');early.userData.keepOriginalEarly=true;g.add(early,campus);Object.assign(g.userData,{early,campus,keepOriginalEarly:true});
  const wall=paint('#d1d5ca','plaster');
  box(campus,0,16,-60,171,32,32,wall);hippedRoof(campus,0,32,-60,173,34,5,M.roofGreen);cornice(campus,0,31,-60,173,34);
  for(const x of[-78,78]){box(campus,x,16,0,18,32,105,wall);hippedRoof(campus,x,32,0,20,108,5,M.roofGreen);cornice(campus,x,31,0,20,108);
    const side=group('Campusinnerwingfacade');side.position.set(x-Math.sign(x)*9.2,0,0);side.rotation.y=-Math.sign(x)*PI/2;campus.add(side);for(const y of[6,16,25])windowsRow(side,15,y,0,-45,6.5,3.4,5.4,{frame:.22,mullions:1,color:'#deded2'});
    const end=group('Wingterminalportico');end.position.set(x,0,53);campus.add(end);box(end,0,16,0,25,32,12,wall);for(const xx of[-9,-3,3,9])column(end,xx,2,8,27,1,M.whiteStone);gable(end,0,32,6,27,5.5,13,M.whiteStone);
  }
  for(const y of[6,16,25])windowsRow(campus,25,y,-43.7,-79,6.5,3.4,5.4,{frame:.22,mullions:1,color:'#deded2'});
  box(campus,0,22,-51,51,44,30,wall);for(const x of[-22,-15.7,-9.4,-3.1,3.1,9.4,15.7,22])column(campus,x,3,-31,36,1.25,M.whiteStone);cornice(campus,0,40,-39,56,20);gable(campus,0,41,-39,56,7,21,M.whiteStone);
  for(const x of[-14,0,14])addWindow(campus,x,18,-35.7,7.6,25,{frame:.5,mullions:2});steps(campus,0,-20,50,7);
  // Schematic landscaped courtyard preserves the photographed U-shaped negative space.
  for(const x of[-52,52])box(campus,x,.25,8,20,.5,54,paint('#617a42','plaster'));box(campus,0,.12,18,14,.24,71,M.limestone);
  return g;
}

export function createCivicModels(){
  M=getMaterials();return {opera:operaModel(),station:stationModel(),whiteTower:whiteTowerModel(),cityhall:cityhallModel(),circus:circusModel(),stadium:stadiumModel(),uralmash:uralmashModel(),university:universityModel()};
}
