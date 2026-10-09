import * as THREE from './vendor/three.module.js';
import {paint,box,cylinder,gable,arch} from './architecture-kit.js';

// Ascension church: the building's west entrance is local +Z. Its two-storey
// baroque core is distinct from the nineteenth-century lateral additions.
export function buildAscension(){
 const root=new THREE.Group();root.name='Ascension: 1792–1818 core, nineteenth-century additions';
 const core=new THREE.Group(),late=new THREE.Group();root.add(core,late);
 const blue=paint('#59acd0','plaster'),white=paint('#f4f0da','stone'),stone=paint('#b7b1a0','stone'),roof=paint('#909fa5','metal',{roughness:.46,metalness:.5}),gold=paint('#d8ae4b','metal',{roughness:.24,metalness:.72}),glass=paint('#486369','glass',{roughness:.42}),dark=paint('#202b2c','stone');
 const mesh=(g,geo,mat,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
 const cross=(g,x,y,z,h=2)=>{box(g,x,y+h/2,z,.14,h,.14,gold);box(g,x,y+h*.69,z,h*.7,.13,.13,gold);box(g,x,y+h*.85,z,h*.37,.12,.13,gold);const q=box(g,x,y+h*.29,z,h*.5,.12,.13,gold);q.rotation.z=-.22;};
 const onion=(g,x,y,z,r,h)=>{const profile=[[0,0],[.7,.05],[1,.3],[.93,.48],[.55,.74],[.22,.92],[0,1]].map(([a,b])=>new THREE.Vector2(a*r,b*h));mesh(g,new THREE.LatheGeometry(profile,40),gold,x,y,z);cross(g,x,y+h,z,1.8);};
 function window(g,x,y,z,w=1.55,h=3.6,yaw=0,bell=false){
  const q=new THREE.Group();q.position.set(x,y,z);q.rotation.y=yaw;g.add(q);
  const shape=new THREE.Shape(),r=w/2,bottom=-h/2,spring=h/2-r;shape.moveTo(-r,bottom);shape.lineTo(r,bottom);shape.lineTo(r,spring);shape.absarc(0,spring,r,0,Math.PI,false);shape.closePath();mesh(q,new THREE.ShapeGeometry(shape,20),bell?dark:glass,0,0,.025);
  arch(q,0,0,0,w+.38,h+.35,.22,white);box(q,0,bottom-.21,.02,w+.68,.24,.4,white);
  if(!bell){for(const xx of[-w*.24,0,w*.24])box(q,xx,-.18,.045,.055,h-.3,.06,white);for(const yy of[-h*.26,.02,h*.26])box(q,0,yy,.047,w-.12,.055,.06,white);}
 }
 function body(g,x,z,w,d,h){
  box(g,x,h/2,z,w,h,d,blue);for(const yy of[.65,7.7,h-.2]){box(g,x,yy,z,w+.5,.4,d+.5,white);box(g,x,yy-.34,z,w+.22,.16,d+.22,white);}
  for(const xx of[-1,1])for(const zz of[-1,1]){box(g,x+xx*(w/2-.35),h/2,z+zz*(d/2+.08),.6,h,.3,white);box(g,x+xx*(w/2+.08),h/2,z+zz*(d/2-.35),.3,h,.6,white);}
 }
 // Narrow original refectory and square upper/lower church.
 body(core,0,8,13.6,20,16);body(core,0,-8,14.2,14,18.7);
 gable(core,0,16.05,8,14.1,2.1,20.2,roof);gable(core,0,18.9,-8,14.8,2.5,14.7,roof);
 for(const side of[-1,1])for(const z of[-12,-8,-4,1,5,9])for(const y of[3.9,12])window(core,side*7.16,y,z,1.65,3.9,side*Math.PI/2);
 for(const side of[-1,1]){for(const x of[-4,0,4])window(core,x,12,-15.12,1.6,4,Math.PI);}
 // East rounded sanctuary, gold finial; no fictitious five-dome composition.
 cylinder(core,0,7,-17.2,5.3,14,blue,40);for(const y of[.6,7.7,13.8])cylinder(core,0,y,-17.2,5.55,.38,white,40);
 mesh(core,new THREE.SphereGeometry(5.55,32,12,0,Math.PI*2,0,Math.PI/2),roof,0,14,-17.2).scale.y=.33;
 for(const a of[-.85,0,.85])window(core,Math.sin(a)*5.33,10.5,-17.2-Math.cos(a)*5.33,1.5,3.6,Math.PI-a);
 onion(core,0,16,-17.2,1.15,1.45);
 // Main octagonal drum rises from a hipped roof, with arched lights and gold head.
 cylinder(core,0,23.15,-8,3.9,4.5,blue,8).rotation.y=Math.PI/8;cylinder(core,0,21,-8,4.1,.4,white,8).rotation.y=Math.PI/8;cylinder(core,0,25.2,-8,4.2,.45,white,8).rotation.y=Math.PI/8;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;window(core,Math.sin(a)*3.66,23.15,-8+Math.cos(a)*3.66,1.2,2.7,a);}
 onion(core,0,25.5,-8,3.15,3.9);
 // Bell tower above western portal. Openings stay recessed in each tier.
 body(core,0,12.7,9.2,9.2,20.2);
 const bellLate=new THREE.Group(),bellEarly=new THREE.Group();root.add(bellLate,bellEarly);
 for(const [y,h,w]of[[24.5,8,7.7],[31.2,5.1,5.8],[36.1,3.6,4.4]]){
  box(bellLate,0,y,12.7,w,h,w,blue);for(const yy of[y-h/2,y+h/2])box(bellLate,0,yy,12.7,w+.55,.35,w+.55,white);
  for(const a of[0,Math.PI/2,Math.PI,Math.PI*1.5]){window(bellLate,Math.sin(a)*(w/2+.03),y,12.7+Math.cos(a)*(w/2+.03),w*.39,h*.72,a,true);for(const side of[-1,1]){const q=new THREE.Group();q.position.set(Math.sin(a)*(w/2+.1),y,12.7+Math.cos(a)*(w/2+.1));q.rotation.y=a;bellLate.add(q);box(q,side*(w/2-.42),0,0,.46,h,.3,white);}}
 }
 onion(bellLate,0,38.15,12.7,2.4,2.1);
 // Earlier bell silhouette used a pointed spire, replaced in the XIX century.
 cylinder(bellEarly,0,24,12.7,4.25,7.2,blue,8).rotation.y=Math.PI/8;for(const y of[20.6,27.6])cylinder(bellEarly,0,y,12.7,4.55,.35,white,8).rotation.y=Math.PI/8;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;window(bellEarly,Math.sin(a)*3.95,24,12.7+Math.cos(a)*3.95,1.65,4.8,a,true);}
 mesh(bellEarly,new THREE.ConeGeometry(4.3,4,8),roof,0,29.8,12.7);mesh(bellEarly,new THREE.ConeGeometry(.8,7.4,12),gold,0,35.1,12.7);cross(bellEarly,0,38.8,12.7,2.1);
 for(let i=0;i<7;i++)box(core,0,.17+i*.2,18.4-i*.3,5.2,.34+i*.4,2.7,stone);
 window(core,0,3.6,18.14,3.4,5.3,0,true);window(core,0,11.7,18.14,2.8,4.1);
 box(core,0,6.65,18.2,4.6,.32,.65,white);gable(core,0,6.82,18.25,4.7,1.45,.6,white);
 // Later north/south chapels fill out the broad west facade, without appearing
 // in the1818 scene. The exact build phases are compressed into1837–1890.
 for(const side of[-1,1]){
  const x=side*10.4;body(late,x,7.2,6.6,21.5,15.8);gable(late,x,15.8,7.2,7,2.8,21.9,roof);
  for(const y of[3.9,11.6]){window(late,x,y,18.06,2.1,4);for(const z of[-1,4.3,9.6,14.5])window(late,side*13.78,y,z,1.55,3.8,side*Math.PI/2);}
  // Curved pediment over each chapel, defined with sampled elliptical outline.
  const curve=new THREE.Shape();curve.moveTo(-3.7,0);for(let i=0;i<=24;i++){const a=Math.PI-i*Math.PI/24;curve.lineTo(Math.cos(a)*3.7,Math.sin(a)*2.8);}curve.lineTo(3.7,0);const geo=new THREE.ExtrudeGeometry(curve,{depth:.45,bevelEnabled:false});mesh(late,geo,blue,x,15.7,17.95);const points=[];for(let i=0;i<=28;i++){const a=Math.PI-i*Math.PI/28;points.push(new THREE.Vector3(x+Math.cos(a)*3.7,15.7+Math.sin(a)*2.8,18.43));}mesh(late,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),30,.16,6,false),white);
 }
 root.userData={core,late,bellEarly,bellLate,phaseNote:'Core1792–1818; lateral chapels represented1837–1890'};return root;
}
