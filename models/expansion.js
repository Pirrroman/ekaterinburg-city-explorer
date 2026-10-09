import * as THREE from '../vendor/three.module.js';
import {getMaterials,paint,box,cylinder,gable,addWindow} from '../architecture-kit.js';
import {EXPO_HALLS} from './expansion-plans.js';

// Reconstructed silhouettes and facade rhythms from dated photographs. All
// dimensions here are metres; the pose adapter calibrates each surveyed plot.
// The main architectural front is +Z. No later congress hall or signage is
// included in the 2011 Expo, and the 1920 school is not its Soviet extension.
let M;
const G=name=>{const g=new THREE.Group();g.name=name;return g;};
function mesh(g,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;}
function rows(g,x0,x1,z,ys,w=1.7,h=2.1,opts={}){for(let x=x0;x<=x1+.01;x+=opts.step||4.5)for(const y of ys)addWindow(g,x,y,z,w,h,{depth:.12,frame:.11,...opts});}
function ribbon(g,x,y,z,w,h=2){box(g,x,y,z,w,h,.13,M.glass);for(let k=-w/2;k<=w/2;k+=2.8)box(g,x+k,y,z+.13,.075,h,.10,M.whiteStone);}
function steps(g,w,z,count=5){for(let i=0;i<count;i++)box(g,0,.14+i*.19,z-i*.36,w,.28+i*.38,1.2,M.limestone);}
function roof(g,x,y,z,w,d){box(g,x,y,z,w,.45,d,M.roofGreen);box(g,x,y-.4,z,w+.45,.35,d+.45,M.whiteStone);}
function pier(g,x,y,z,w,h,d){box(g,x,y,z,w,h,d,M.whiteStone);box(g,x,y-h/2+.2,z,w+.2,.4,d+.2,M.limestone);}
function curvedBand(g,r0,r1,y,h,start,end,material,segments=48,z0=0){
 const shape=new THREE.Shape();for(let i=0;i<=segments;i++){const a=start+(end-start)*i/segments;const x=Math.sin(a)*r1,z=Math.cos(a)*r1+z0;i?shape.lineTo(x,-z):shape.moveTo(x,-z);}
 for(let i=segments;i>=0;i--){const a=start+(end-start)*i/segments;shape.lineTo(Math.sin(a)*r0,-(Math.cos(a)*r0+z0));}shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false,steps:1});geo.rotateX(-Math.PI/2);return mesh(g,geo,material,0,y,0);
}
function hotel(){
 const g=G('Iset-1934-semicircular-dormitory'),wall=paint('#d7c5b8','plaster'),white=paint('#e8e4dc','plaster');
 curvedBand(g,13,26,0,28,-Math.PI/2,Math.PI/2,wall,56,-12);
 curvedBand(g,12.8,26.35,28,2,-Math.PI/2,Math.PI/2,white,56,-12);
 for(let floor=0;floor<9;floor++){const y=2+floor*2.9;curvedBand(g,25.95,26.35,y-1.3,.32,-Math.PI/2,Math.PI/2,white,56,-12);for(let a=-1.48;a<=1.49;a+=.139){const w=addWindow(g,Math.sin(a)*26.14,y,Math.cos(a)*26.14-12,2.12,1.65,{rotationY:a,frame:.12,color:'#e2e0d8'});}}
 for(let a=-1.48;a<1.5;a+=.278){const r=G('vertical-facade-pier');r.position.set(Math.sin(a)*26.45,0,Math.cos(a)*26.45-12);r.rotation.y=a;g.add(r);box(r,0,14,0,.32,25,.32,white);}
 for(const s of [-1,1]){box(g,s*22,14,-13,8,28,5,white);roof(g,s*22,28.2,-13,8,5);}
 curvedBand(g,13,26.5,0,1,-Math.PI/2,Math.PI/2,M.limestone,56,-12);
 return g;
}
function dynamo(){
 const g=G('Dynamo-house-ship-1934'),blue=paint('#2d81a6','plaster'),white=paint('#e4e2d9','plaster');
 // Only the documented southern ship house. Undated northern wing omitted.

 box(g,0,6.5,43,19,13,35,white);curvedBand(g,0,11.5,0,13,-Math.PI/2,Math.PI/2,white,28,59);
 for(const side of [-1,1]){const f=G('ship-side-window-bands');f.position.set(side*9.55,0,43);f.rotation.y=side*Math.PI/2;g.add(f);for(const y of [3.1,7.1,11.1])ribbon(f,0,y,0,30,2.2);}
 // Bridge and rounded decks at the south end, the recognisable ship profile.
 for(const y of [4.2,8.2,12.4]){curvedBand(g,0,11.9,y,.65,-Math.PI/2,Math.PI/2,blue,28,59);for(let a=-1.4;a<=1.4;a+=.24)addWindow(g,Math.sin(a)*11.56,y+1.6,Math.cos(a)*11.56+59,2,2.2,{rotationY:a,color:'#e8e6db'});}
 box(g,0,17.1,56,15.5,8.2,19,white);for(const y of [15.2,18.5])ribbon(g,0,y,65.6,15.5,2.3);
 for(const side of [-1,1]){const f=G('bridge-side-windows');f.position.set(side*7.8,0,56);f.rotation.y=side*Math.PI/2;g.add(f);for(const y of [15.2,18.5])ribbon(f,0,y,0,17,2.3);}
 box(g,0,21.5,56,16.1,.7,19.6,blue);box(g,0,11.1,70.5,2.7,21.3,.9,blue);
 ribbon(g,0,12,71,1.7,17);cylinder(g,0,23,56,.17,2,M.steel,8);

 return g;
}
function school(){
 const g=G('Former-spiritual-school-first-university-premises'),early=G('historic-school-before-1920'),later=G('1934-1941-school-extension');g.add(early,later);
 const wall=paint('#dfcbbc','plaster'),trim=paint('#e8dfcf','stone');
 box(early,0,5.8,0,115,11.6,28,wall);box(early,0,.7,0,116,1.4,29,M.limestone);
 for(const y of [1.4,5.7,11.7])box(early,0,y,14.3,115,.4,.45,trim);
 rows(early,-53,53,14.3,[3.35,8.4],2,3,{step:4.6,color:'#e9e1d2'});
 for(let x=-55;x<=55;x+=9.2)box(early,x,6,14.5,.8,11.4,.55,trim);
 box(early,40,7,1,29,14,29,wall);gable(early,40,15.8,1,31,3.2,30,M.roofGreen);
 rows(early,29,52,15.7,[3.3,8.4,12.6],1.9,2.6,{step:4.6});
 roof(early,-18,12.2,0,79,28.5);steps(early,9,16.4,4);
 // The taller Soviet teaching block is absent in the 1920 founding scene.
 box(later,12,18.5,-5,83,12.5,19,wall);roof(later,12,25,-5,84,20);
 rows(later,-27,49,4.65,[14.5,18.5,22.5],2.1,2.7,{step:4.8});
 box(later,40,22,4.8,27,6,1,wall);gable(later,40,26,0,29,2,11,M.whiteStone);
 g.userData.earlyCore=early;g.userData.lateAddition=later;return g;
}
function cosmos(){
 const g=G('Cosmos-1967-original-cinema'),wall=paint('#c6c2b7','stone'),silver=paint('#a9aaa6','metal',{metalness:.32,roughness:.5});
 // Main high auditorium on the right and low restaurant wing on the left;
 // the historical photo shows a straight mullioned foyer, not 2004's round skin.
 box(g,25,14.5,-7,83,29,63,wall);box(g,-48,6,2,46,12,55,wall);
 box(g,1,8,28,137,16,17,wall);box(g,1,8,36.65,135,15,.15,M.glass);
 for(let x=-65;x<=67;x+=3.8)pier(g,x,8,36.85,.45,16,.45);
 for(const y of [1,8,15.8])box(g,1,y,37,135,.5,.55,M.whiteStone);
 box(g,25,23.3,25,83,10.5,1.1,silver);for(let x=-16;x<=66;x+=1.4)box(g,x,23.3,25.65,.09,10.4,.11,M.steel);
 roof(g,25,29.25,-7,83.5,63.5);roof(g,-48,12.25,2,46.5,55.5);
 for(let x=0;x<48;x+=6){const c=box(g,x,4.3,39,6,.3,5,M.whiteStone);c.rotation.z=(Math.floor(x/6)%2?-.13:.13);}
 steps(g,57,40.2,4);return g;
}
function government(){
 const g=G('White-house-1982'),marble=paint('#dcded8','stone'),dark=paint('#536167','metal',{metalness:.25,roughness:.4});
 box(g,0,41.7,0,51,83.4,31,marble);box(g,0,42,15.6,42,81,.15,M.glassDark);box(g,0,42,-15.6,42,81,.15,M.glassDark);
 // Full-height marble blades create deep shadows between the narrow windows.
 for(let x=-20;x<=20;x+=2.85)for(const s of [-1,1])box(g,x,42,s*16.3,1.15,81,1.7,marble);
 for(let y=3;y<84;y+=3.5)for(const s of [-1,1])box(g,0,y,s*16,42,.22,.65,dark);
 for(const x of [-24.3,24.3])box(g,x,43.5,0,5.6,87,33.2,marble);
 for(const x of [-12,12])box(g,x,86,0,5,2.5,27,M.whiteStone);
 for(const side of [-1,1]){const s=G('end-window-strip');s.position.x=side*25.6;s.rotation.y=side*Math.PI/2;g.add(s);for(const z of [-9,9])ribbon(s,z,42,.1,2.5,77);}
 box(g,0,2.5,17,25,5,2.5,M.whiteStone);ribbon(g,0,2.2,18.35,21,3.1);steps(g,25,18.3,4);cylinder(g,0,88.3,0,.09,1.4,M.steel,8);return g;
}
function drama(){
 const g=G('Academic-drama-theatre-1990'),wall=paint('#d7c7a6','stone'),frame=paint('#d4c38b','stone');
 box(g,0,8,32,62,16,44,wall);box(g,0,13,-19,54,26,53,wall);box(g,0,23,-25,29,18,27,wall);
 box(g,0,8,54.1,60,15.7,.18,M.glassDark);
 for(let x=-30;x<=30.1;x+=7.5)box(g,x,8,54.35,.72,16.5,.9,frame);
 for(const y of [0.8,5.7,10.8,16])box(g,0,y,54.4,62,.5,.95,frame);
 for(let x=-29;x<=29;x+=1.8)box(g,x,8,54.48,.055,15,.13,M.steel);
 box(g,0,16.8,46,44,1.8,1.5,wall);roof(g,0,16.3,31,62.5,44);roof(g,0,32.2,-25,29.5,27.5);
 steps(g,62,58,8);return g;
}
function airport(){
 const g=G('Koltsovo-1954-classical-terminal'),wall=paint('#dedbd0','plaster');
 box(g,0,7.6,0,137,15.2,25,wall);box(g,0,.65,0,142,1.3,29,M.limestone);
 for(const x of [-49,49]){rows(g,x-16,x+16,12.7,[4.1,10.5],2.3,3.4,{step:5.3,arched:true});gable(g,x,16.6,0,41,2.5,26,M.roofGreen);}
 box(g,0,8,0,40,16,26,wall);for(let x=-17.5;x<=17.6;x+=5){cylinder(g,x,7.5,15.1,.67,13.8,M.whiteStone,16);cylinder(g,x,1,15.1,.88,.8,M.limestone,16);cylinder(g,x,14.4,15.1,.9,.6,M.whiteStone,16);}
 box(g,0,15.1,15,39,1.4,3.1,M.whiteStone);gable(g,0,18.1,1,42,4.6,31,M.whiteStone);
 rows(g,-15,15,13.15,[5.3,11],2.5,3.9,{step:5,arched:true});
 cylinder(g,0,22.1,0,3.1,5.1,wall,8);for(let a=0;a<Math.PI*2;a+=Math.PI/4){const c=G('spire-belfry');c.rotation.y=a;g.add(c);addWindow(c,0,22.1,2.9,1.25,2.6,{arched:true});}
 const cap=mesh(g,new THREE.ConeGeometry(3.7,3,8),M.roofGreen,0,26,0);mesh(g,new THREE.ConeGeometry(.9,6.5,12),M.steel,0,30.6,0);steps(g,40,16.9,5);return g;
}
function expo(){
 const g=G('Ekaterinburg-Expo-2011-four-pavilions'),wall=paint('#d8dddd','metal',{metalness:.25,roughness:.52}),colors=['#69b9aa','#a8c971','#c071a6','#9fb8d0'];
 for(const p of EXPO_HALLS){const h=G('OSM-hall-'+p.id);h.position.set(p.x,0,p.z);g.add(h);box(h,0,p.h/2,0,p.w,p.h,p.d,wall);box(h,0,p.h+.35,0,p.w,.7,p.d,M.steel);box(h,0,3.7,p.d/2+.08,p.w-2,5.8,.15,M.glassDark);
  for(let x=-p.w/2+2;x<p.w/2;x+=4){box(h,x,3.7,p.d/2+.2,.18,5.8,.25,M.whiteStone);box(h,x,p.h-1.2,0,.2,.4,p.d,M.whiteStone);}
  if(p.h>10)for(let x=-p.w/2+4,j=0;x<p.w/2-4;x+=10,j++){box(h,x,8.4,p.d/2+.1,3.2,3.2,.12,paint(colors[j%4],'metal'));}
 }
 return g;
}
export function createExpansionModels(){M=getMaterials();return{universityEarly:school(),hotelIset:hotel(),dynamo:dynamo(),cosmos:cosmos(),government:government(),drama:drama(),expo:expo(),airportTerminal:airport()};}  // Only the documented southern ship house. The undated northern wing
