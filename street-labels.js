import * as THREE from './vendor/three.module.js';
import {GEO,heightAt,project} from './geo.js';
import {SQUARE_LABELS} from './data/square-labels.js';
import {buildRoadStages} from './road-history.js';
import {STREET_NAMES,streetNameAt} from './street-label-names.js';
import {clamp,ease} from './math.js';

export function createStreetLabels(canvas,camera){
  const ctx=canvas.getContext('2d'),v=new THREE.Vector3(),candidates=[];
  // Fixed world anchors prevent labels from crawling along the street in flight.
  for(const road of GEO.roads){
    if(!STREET_NAMES[road.name])continue;
    for(const stage of buildRoadStages(road)){
      let distance=0,next=45;
      for(let i=1;i<stage.p.length;i++){
        const a=stage.p[i-1],b=stage.p[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
        if(length<1)continue;
        while(next<distance+length){
          const t=(next-distance)/length,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;
          candidates.push({name:road.name,start:stage.start,end:stage.end,x,z,y:heightAt(x,z)+2,
            dx:(b[0]-a[0])/length,dz:(b[1]-a[1])/length,id:road.id+':'+i+':'+next});
          next+=180;
        }
        distance+=length;
      }
      // Short central blocks still deserve a candidate.
      if(distance>35&&distance<45){const a=stage.p[0],b=stage.p.at(-1),x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;
        candidates.push({name:road.name,start:stage.start,end:stage.end,x,z,y:heightAt(x,z)+2,dx:(b[0]-a[0])/distance,dz:(b[1]-a[1])/distance,id:road.id+':short'});}
    }
  }
  for(const square of SQUARE_LABELS){
    const [x,z]=project(square.lon,square.lat);
    candidates.push({...square,name:square.label,id:'square:'+square.key,x,z,y:heightAt(x,z)+3,dx:1,dz:0,square:true});
  }
  let last=[];
  function screen(x,y,z){v.set(x,y,z).project(camera);return{x:(v.x*.5+.5)*canvas.width,y:(.5-v.y*.5)*canvas.height,z:v.z};}
  function draw(state){
    last=[];if(state.intro)return;
    const scale=canvas.width/1920,year=state.calendarYear??state.year;
    const cathedralRemoval=Math.min(state.demolitionProgress?.catherine??1,state.demolitionProgress?.epiphany??1);
    const roadYear=cathedralRemoval<.999?Math.min(year,1930.54):year;
    const flight=state.outro?1:ease((state.eventProgress-(state.cameraArrival||0))/.08);
    const zoom=1-clamp((camera.position.y-6500)/7000),opacity=flight*zoom*.88;
    if(opacity<.02)return;
    const w=canvas.width,h=canvas.height,options=[];
    camera.updateMatrixWorld();ctx.save();ctx.setTransform(1,0,0,1,0,0);
    ctx.font=`600 ${20*scale}px "Segoe UI", Arial, sans-serif`;
    for(const c of candidates){
      // These two near-side road labels cross the close-shot roof silhouette.
      if((state.eventId===46&&c.name==='улица Луначарского')||(state.eventId===41&&c.name==='улица Карла Либкнехта'))continue;
      if((c.square?year:roadYear)<c.start||(c.square?year:roadYear)>=c.end)continue;
      const label=c.square?c.label:streetNameAt(c.name,year,c.x,c.z);if(!label)continue;
      const p=screen(c.x,c.y,c.z);if(c.square)p.y+=42*scale;if(p.z<=-1||p.z>=1||p.x<90*scale||p.x>w-90*scale||p.y<190*scale||p.y>h-280*scale)continue;
      const q=screen(c.x+c.dx*50,c.y,c.z+c.dz*50),pixels=Math.hypot(q.x-p.x,q.y-p.y);
      if(pixels<(c.square?5:13)*scale||pixels>230*scale)continue;
      let angle=Math.atan2(q.y-p.y,q.x-p.x);if(angle>Math.PI/2)angle-=Math.PI;if(angle< -Math.PI/2)angle+=Math.PI;
      if(c.square)angle=0;
      const tw=ctx.measureText(label).width+24*scale,th=30*scale;
      const bw=Math.abs(Math.cos(angle))*tw+Math.abs(Math.sin(angle))*th,bh=Math.abs(Math.sin(angle))*tw+Math.abs(Math.cos(angle))*th;
      if(p.x-bw/2<36*scale||p.x+bw/2>w-36*scale)continue;
      if(p.y-bh/2<185*scale||p.y+bh/2>h-265*scale)continue;
      options.push({...c,label,p,angle,bw,bh,score:Math.hypot((p.x-w*.5)*.8,p.y-h*.47)-(c.square?150*scale:0)});
    }
    options.sort((a,b)=>a.score-b.score||a.id.localeCompare(b.id));
    const names=new Set();
    for(const c of options){
      if(names.has(c.name)||last.some(o=>Math.abs(c.p.x-o.p.x)<(c.bw+o.bw)/2+32*scale&&Math.abs(c.p.y-o.p.y)<(c.bh+o.bh)/2+24*scale))continue;
      ctx.save();ctx.translate(c.p.x,c.p.y);ctx.rotate(c.angle);ctx.globalAlpha=opacity;
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=5*scale;
      ctx.strokeStyle='rgba(30,42,35,.84)';ctx.fillStyle=c.square?'#ffe0a0':'#fff5d8';ctx.strokeText(c.label,0,0);ctx.fillText(c.label,0,0);ctx.restore();
      last.push(c);names.add(c.name);if(last.length===8)break;
    }
    ctx.restore();
  }
  return{draw,get visible(){return last.map(({name,label,x,z,start,end,p,angle})=>({name,label,x,z,start,end,screen:p,angle}));},candidateCount:candidates.length};
}
