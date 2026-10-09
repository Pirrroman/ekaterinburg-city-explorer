import {heightAt} from './geo.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const editable=target=>target?.closest?.('input,select,textarea,button,a,[contenteditable="true"]');

// Ground-oriented orbit and pan use the same metre coordinates as the city.
// There is no external input dependency, and film cameras never use this state.
export function createExplorationControls(canvas,{fov=40,onChange=()=>{}}={}){
  const target=[0,heightAt(0,0)+10,0],keys=new Set(),pointers=new Map();
  let enabled=false,radius=1550,theta=.2,polar=.78,gesture=null;
  const minRadius=28,maxRadius=42000;
  const updateTarget=()=>{target[0]=clamp(target[0],-16000,26000);target[2]=clamp(target[2],-18000,29000);target[1]=heightAt(target[0],target[2])+10;};
  function view(){
    const flat=radius*Math.sin(polar),x=target[0]+Math.sin(theta)*flat,z=target[2]+Math.cos(theta)*flat;
    const y=Math.max(target[1]+radius*Math.cos(polar),heightAt(x,z)+12);
    return {position:[x,y,z],target:[...target],radius,azimuth:theta,polar};
  }
  function changed(){onChange(view());}
  function zoom(delta){radius=clamp(radius*Math.exp(delta),minRadius,maxRadius);changed();}
  function pan(dx,dy){
    const scale=2*radius*Math.tan(fov*Math.PI/360)/Math.max(1,canvas.getBoundingClientRect().height);
    target[0]+=(-dx*Math.cos(theta)+dy*Math.sin(theta))*scale;
    target[2]+=(dx*Math.sin(theta)+dy*Math.cos(theta))*scale;
    updateTarget();changed();
  }
  function rotate(dx,dy){theta-=dx*.005;polar=clamp(polar+dy*.004,.16,1.40);changed();}
  function recordGesture(){
    const all=[...pointers.values()];
    if(all.length===1)gesture={x:all[0].x,y:all[0].y};
    else if(all.length>1)gesture={x:(all[0].x+all[1].x)/2,y:(all[0].y+all[1].y)/2,distance:Math.hypot(all[1].x-all[0].x,all[1].y-all[0].y)};
    else gesture=null;
  }
  canvas.addEventListener('pointerdown',e=>{
    if(!enabled||![0,1,2].includes(e.button))return;
    e.preventDefault();canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:e.button!==0||e.shiftKey});recordGesture();canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove',e=>{
    if(!enabled||!pointers.has(e.pointerId))return;
    const pointer=pointers.get(e.pointerId);pointer.x=e.clientX;pointer.y=e.clientY;
    const previous=gesture;recordGesture();if(!previous||!gesture)return;
    if(pointers.size>1){pan(gesture.x-previous.x,gesture.y-previous.y);if(previous.distance>1&&gesture.distance>1)zoom(Math.log(previous.distance/gesture.distance));}
    else if(pointer.pan||e.shiftKey)pan(gesture.x-previous.x,gesture.y-previous.y);
    else rotate(gesture.x-previous.x,gesture.y-previous.y);
  });
  const end=e=>{pointers.delete(e.pointerId);recordGesture();if(!pointers.size)canvas.classList.remove('dragging');};
  canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
  canvas.addEventListener('contextmenu',e=>{if(enabled)e.preventDefault();});
  canvas.addEventListener('wheel',e=>{if(!enabled)return;e.preventDefault();zoom(clamp(e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?500:1),-700,700)*.0012);},{passive:false});
  const movement=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Equal','Minus','NumpadAdd','NumpadSubtract'];
  document.addEventListener('keydown',e=>{if(!enabled||editable(e.target)||!movement.includes(e.code))return;e.preventDefault();keys.add(e.code);});
  document.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
  return {
    get enabled(){return enabled;},getView:view,
    setEnabled(value){enabled=Boolean(value);keys.clear();pointers.clear();gesture=null;canvas.classList.remove('dragging');canvas.tabIndex=enabled?0:-1;canvas.setAttribute('aria-label',enabled?'Исследовать город: мышь — вращение, правая кнопка — перемещение, колесо — масштаб':'Трёхмерная история Екатеринбурга');},
    setView(shot){
      if(!shot?.target?.every(Number.isFinite)||!shot?.position?.every(Number.isFinite))return false;
      target.splice(0,3,...shot.target);updateTarget();const dx=shot.position[0]-target[0],dy=shot.position[1]-target[1],dz=shot.position[2]-target[2];
      radius=clamp(Math.hypot(dx,dy,dz),minRadius,maxRadius);theta=Math.atan2(dx,dz);polar=clamp(Math.acos(clamp(dy/Math.max(1,radius),-1,1)),.16,1.4);changed();return true;
    },
    reset(point=[0,0,0],range=1550){target.splice(0,3,point[0],point[1]||0,point[2]);updateTarget();radius=clamp(range,minRadius,maxRadius);theta=.2;polar=.78;changed();},
    update(dt){
      if(!enabled||!keys.size)return false;
      const has=(...codes)=>codes.some(c=>keys.has(c));
      const forward=Number(has('KeyW','ArrowUp'))-Number(has('KeyS','ArrowDown'));
      const right=Number(has('KeyD','ArrowRight'))-Number(has('KeyA','ArrowLeft'));
      const speed=Math.max(20,radius*.55)*Math.min(.1,dt)/Math.max(1,Math.hypot(forward,right));
      target[0]+=(right*Math.cos(theta)-forward*Math.sin(theta))*speed;target[2]+=(-right*Math.sin(theta)-forward*Math.cos(theta))*speed;updateTarget();
      if(has('Equal','NumpadAdd'))radius=clamp(radius*Math.exp(-dt),minRadius,maxRadius);
      if(has('Minus','NumpadSubtract'))radius=clamp(radius*Math.exp(dt),minRadius,maxRadius);
      changed();return true;
    }
  };
}

export function explorationState(year,time,duration,lastEvent=null){
  const selected=clamp(Math.round(Number.isFinite(+year)?+year:2026),1720,2026);
  // Each annual snapshot shows the end of that year. Empty cue maps let the
  // dated models use their physical construction dates, not a film transition.
  return {time,duration,year:selected,calendarYear:selected===2026?2026:selected+.9999,eventId:0,event:null,eventIndex:-1,previousEvent:null,lastEvent,eventProgress:1,chapter:1,intro:false,outro:false,exploring:true,constructionProgress:{},demolitionProgress:{}};
}
