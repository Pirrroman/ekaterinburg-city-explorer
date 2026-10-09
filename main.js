import * as THREE from './vendor/three.module.js';
import {createWorld} from './world.js';
import {createStreetLabels} from './street-labels.js';
import {initArchitectureMaterials} from './architecture-kit.js';
import {installDetailedLandmarks} from './detailed-landmarks.js';
import {installFinalLandmarks} from './final-landmarks.js';
import {createExplorationControls,explorationState} from './exploration-controls.js';
import {populationForYear,polityForState} from './calendar-info.js';
import {clamp} from './math.js';
import {HDRLoader} from './vendor/HDRLoader.js';
import {EffectComposer} from './vendor/addons/postprocessing/EffectComposer.js';
import {RenderPass} from './vendor/addons/postprocessing/RenderPass.js';
import {OutputPass} from './vendor/addons/postprocessing/OutputPass.js';

const byId=id=>document.getElementById(id),canvas=byId('scene'),labelsCanvas=byId('labels');
let year=2026,clock=0,lastTick=0,lastRendered=0,width=1,height=1,dirty=true,disposed=false;
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.96;renderer.localClippingEnabled=true;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#bfd6e2');scene.fog=new THREE.Fog('#bfd6e2',6500,26000);
const camera=new THREE.PerspectiveCamera(40,1,1,100000);
const hemisphere=new THREE.HemisphereLight('#d4e5f0','#536441',.48);scene.add(hemisphere);
const sun=new THREE.DirectionalLight('#fff2df',2.55);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.near=10;sun.shadow.camera.far=6500;
Object.assign(sun.shadow.camera,{left:-1000,right:1000,top:1000,bottom:-1000});sun.shadow.bias=-.00015;sun.shadow.normalBias=.12;scene.add(sun,sun.target);
byId('loading-detail').textContent='Подготавливаем материалы и освещение…';
const [,daylight]=await Promise.all([initArchitectureMaterials(),new HDRLoader().loadAsync(new URL('./assets/pbr/daylight.hdr',import.meta.url).href)]);
const pmrem=new THREE.PMREMGenerator(renderer),environment=pmrem.fromEquirectangular(daylight);scene.environment=environment.texture;scene.environmentIntensity=.62;daylight.dispose();pmrem.dispose();
byId('loading-detail').textContent='Собираем улицы, здания и городской ландшафт…';
await new Promise(resolve=>requestAnimationFrame(resolve));
const world=createWorld();scene.add(world.group);installDetailedLandmarks(world);const finalLandmarks=installFinalLandmarks(world);
const renderTarget=new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:4}),composer=new EffectComposer(renderer,renderTarget);composer.addPass(new RenderPass(scene,camera));composer.addPass(new OutputPass());
const labels=createStreetLabels(labelsCanvas,camera),controls=createExplorationControls(canvas,{fov:camera.fov,onChange:()=>{dirty=true;}});
controls.setEnabled(true);controls.reset(world.targets.dam,1550);
function currentState(){return explorationState(year,clock,0);}
function updateUI(){const state=currentState(),polity=polityForState(state);byId('city-name').textContent=polity.cityName;byId('polity').textContent=polity.label;byId('population').textContent=populationForYear(state.calendarYear).label;byId('explore-year').value=year;byId('explore-year-number').value=year;byId('explore-year').setAttribute('aria-valuetext',year+' год');document.title=polity.cityName+' · '+year+' · Исследовать город';}
function render(){const state=currentState();world.update(state);world.updateArchitecture(state);finalLandmarks.update(state);const shot=controls.getView();camera.position.set(...shot.position);camera.lookAt(...shot.target);const distance=camera.position.distanceTo(new THREE.Vector3(...shot.target));const span=clamp(distance*.62,120,1900);sun.target.position.set(...shot.target);sun.position.set(shot.target[0]-1100,shot.target[1]+2300,shot.target[2]+800);sun.castShadow=distance<7200;Object.assign(sun.shadow.camera,{left:-span,right:span,top:span,bottom:-span});sun.shadow.camera.updateProjectionMatrix();scene.fog.near=Math.max(6500,distance*1.12);scene.fog.far=Math.max(26000,distance*3);world.setView?.(camera.position,shot.target);composer.render();labelsCanvas.getContext('2d').clearRect(0,0,width,height);labels.draw(state);dirty=false;return state;}
function resize(){const ratio=Math.min(window.devicePixelRatio||1,1.5),rect=canvas.getBoundingClientRect();width=Math.max(1,Math.round(rect.width*ratio));height=Math.max(1,Math.round(rect.height*ratio));renderer.setSize(width,height,false);composer.setSize(width,height);labelsCanvas.width=width;labelsCanvas.height=height;camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;}
function setYear(value){if(!Number.isFinite(+value))return year;year=clamp(Math.round(+value),1720,2026);clock=0;updateUI();dirty=true;render();return year;}
function reset(place='centre'){const point=place==='airport'?world.targets.airport:world.targets.dam;controls.reset(point,place==='airport'?2200:1550);render();}
function snapshot(){render();const output=document.createElement('canvas');output.width=width;output.height=height;const ctx=output.getContext('2d');ctx.drawImage(canvas,0,0);ctx.drawImage(labelsCanvas,0,0);const s=width/1920,polity=polityForState(currentState());ctx.fillStyle='rgba(21,45,44,.87)';ctx.fillRect(26*s,24*s,Math.min(width-52*s,650*s),118*s);ctx.fillStyle='#fff7e7';ctx.font=32*s+'px Georgia';ctx.fillText(polity.cityName+' · '+year,48*s,69*s);ctx.font=17*s+'px Arial';ctx.fillStyle='#dce8de';ctx.fillText(polity.label+' · '+populationForYear(currentState().calendarYear).label+' жителей',48*s,106*s);ctx.textAlign='right';ctx.font=14*s+'px Arial';ctx.fillStyle='rgba(21,45,44,.86)';ctx.fillRect(width-532*s,height-40*s,522*s,30*s);ctx.fillStyle='#fff7e7';ctx.fillText('© OpenStreetMap contributors · openstreetmap.org/copyright',width-20*s,height-20*s);return output.toDataURL('image/png');}
byId('explore-year').oninput=e=>setYear(e.target.value);byId('explore-year-number').onchange=e=>setYear(e.target.value);byId('explore-centre').onclick=()=>reset('centre');byId('explore-airport').onclick=()=>reset('airport');byId('explore-snapshot').onclick=()=>{const link=document.createElement('a');link.href=snapshot();link.download='ekaterinburg-'+year+'.png';link.click();};byId('help-toggle').onclick=()=>{const help=byId('help');help.hidden=!help.hidden;byId('help-toggle').setAttribute('aria-expanded',String(!help.hidden));};
window.addEventListener('resize',resize);document.addEventListener('visibilitychange',()=>{lastTick=0;dirty=true;});canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();disposed=true;byId('loading').hidden=false;byId('loading-detail').textContent='Графический контекст потерян. Перезагрузите страницу, чтобы восстановить город.';byId('retry').hidden=false;});
resize();updateUI();render();byId('loading').hidden=true;
window.cityExplorer={ready:true,setYear,reset,screenshot:snapshot,getCamera:()=>controls.getView(),setCamera:shot=>{const result=controls.setView(shot);render();return result;},get year(){return year;},get state(){return currentState();},get visibleLabels(){return labels.visible;},diagnostics:()=>({year,buildings:world.city?.records?.length,renderer:renderer.info.render,canvas:{width,height},geography:world.validateGeography?.()})};
function frame(now){if(disposed)return;requestAnimationFrame(frame);if(document.hidden){lastTick=0;return;}const dt=lastTick?Math.min(.1,(now-lastTick)/1000):0;lastTick=now;clock+=dt;controls.update(dt);if(dirty||now-lastRendered>=33){render();lastRendered=now;}}
requestAnimationFrame(frame);
