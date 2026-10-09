import { GEO, LANDMARKS, heightAt, waterAt, pointInside, segmentDistance } from './geo.js';
import { ROAD_META } from './assets/geography/road-history-data.js';

// Modern surveyed centrelines are reused only inside dated historical envelopes.
// The archive plans establish phases, not the opening date of every modern OSM way.
export const ROAD_SOURCES={
  plans:'https://xn--80aaebf3an9auge0i.xn--p1ai/cards_of_ekaterinburg',
  stoneBridge:'https://dm-centre.ru/wp-content/uploads/2025/07/mosty-kraevedcheskaya-laboratoriya.pdf',
  tsarskyBridge:'https://book.uraic.ru/galereja/vystavki-2026/kupecheskij_kvartal',
  kuibyshevBridge:'https://portal.okn.midural.ru/sites/default/files/expertiza/2025/2.akt_gike_ekaterinburg_kulturnyy_sloy_po_ul._8_marta_43_cirk_ros_tonnel_pod_ul._kuybysheva.pdf',
  names:'https://xn--80aaebf3an9auge0i.xn--p1ai/cards_of_ekaterinburg',
  osm:'https://www.openstreetmap.org/copyright'
};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const firstAxes=/Ленина|8 Марта|Карла Либкнехта|Толмач[её]ва|Воеводина/;
const oldGrid=/Ленина|8 Марта|Малышева|Карла Либкнехта|Толмач[её]ва|Вайнера|Розы Люксембург|Пушкина|Горького|Московская|Хохрякова|Чернышевского|Белинского|Луначарского|Куйбышева|Декабристов|Большакова|Восточная|Шейнкмана|Сакко и Ванцетти|Челюскинцев|Свердлова|Первомайская|Тургенева|Мамина-Сибиряка|Шарташская/;
const sourceNames=[
  [/Ленина/, [[1845,'Главная першпективная улица'],[1919,'Главный проспект'],[1962,'улица Ленина']]],
  [/Малышева/,[[1919,'Покровский проспект']]],
  [/8 Марта/,[[1919,'Уктусская улица'],[1928,'улица Троцкого']]],
  [/Карла Либкнехта/,[[1919,'Вознесенский проспект']]],
  [/Вайнера/,[[1919,'Успенская улица']]],
  [/Розы Люксембург/,[[1919,'Златоустовская улица']]],
  [/Куйбышева/,[[1919,'Сибирский проспект']]],
  [/Декабристов/,[[1919,'Александровский проспект']]],
  [/Толмач[её]ва/,[[1830,'Мокрая улица'],[1919,'Колобовская улица']]],
  [/Челюскинцев/,[[1934,'Северная улица']]],
  [/Большакова/,[[1919,'Болотная улица']]]
];
export function historicalRoadName(road,year){for(const[rx,periods]of sourceNames)if(rx.test(road.name||'')){const p=periods.find(([end])=>year<end);if(p)return p[1];}return road.name||'';}
function inOldCity(x,z){return x>-1200&&x<1900&&z>-2250&&z<2350;}
function phaseYear(r,x,z){
  const name=r.name||'',rad=Math.hypot(x,z),meta=ROAD_META[r.id]||{};
  if(/runway|taxiway|apron|terminal/.test(r.type))return r.year;
  if(/ЕКАД/.test(name))return r.year;
  if(r.type==='rail'){
    if(meta.service)return z<-4200&&z>-7600?1932+(r.id%6)*5:Math.max(1935,r.year)+(r.id%10)*5;
    // The first railway corridor precedes later freight sidings and orbital lines.
    return r.usage==='main'&&z<-1600&&z>-4000?1878:Math.max(1930,r.year)+(r.id%8)*5;
  }
  if(r.type==='tram'){
    if(x>-450&&x<1050&&z>-2500&&z<1800)return 1929;
    if(z<-3500&&z>-7600&&x>-1500&&x<2100)return 1933;
    return inOldCity(x,z)?1947:rad<6000?1960:1980;
  }
  if(meta.bridge){
    if(/Каменный мост/.test(name))return 1800; // earlier timber crossing, stage estimate
    if(/Царский мост/.test(name))return 1824;
    if(/Куйбышева/.test(name))return 1930;
    if(/Ленина/.test(name)&&rad<160)return 1723.98;
    if(/Макаровский/.test(name))return 1881;
    return Math.max(1930,r.year);
  }
  if(/Бориса Ельцина/.test(name))return 1990;
  if(/Объездная|Кольцовск|Дубл[её]р|Серафимы Дерябиной|Амундсена|Вильгельма де Геннина|Вильгельма-де-Геннина|Академика|Сахарова|Павла Шаманова/.test(name))return Math.max(1970,r.year);
  if(firstAxes.test(name)&&Math.abs(x)<400&&Math.abs(z)<370)return 1723.8;
  if(firstAxes.test(name)&&rad<760)return 1734;
  if(oldGrid.test(name)&&rad<1150)return 1781;
  if(inOldCity(x,z))return oldGrid.test(name)?1829:1845+(r.id%5)*10;
  if(z<-4200&&z>-7800&&x>-3500&&x<3200)return 1928+(r.id%8);
  if(rad<3700)return 1925+(r.id%7)*2;
  if(rad<6000)return 1947+(r.id%7)*3;
  if(rad<9000)return 1960+(r.id%8)*3;
  return Math.max(1980,r.year)+(r.id%5)*3;
}
function local(p,l){const x=p[0]-l.x,z=p[1]-l.z,c=Math.cos(l.azimuth),s=Math.sin(l.azimuth);return[x*c-z*s,x*s+z*c];}
function global(p,l){const c=Math.cos(l.azimuth),s=Math.sin(l.azimuth);return[l.x+p[0]*c+p[1]*s,l.z-p[0]*s+p[1]*c];}
function intersects(a,b,l,margin){a=local(a,l);b=local(b,l);const w=l.width/2+margin,d=l.depth/2+margin;let lo=0,hi=1;for(const[k,h]of[[0,w],[1,d]]){const delta=b[k]-a[k];if(Math.abs(delta)<1e-9){if(Math.abs(a[k])>h)return false;}else{let q=(-h-a[k])/delta,t=(h-a[k])/delta;if(q>t)[q,t]=[t,q];lo=Math.max(lo,q);hi=Math.min(hi,t);if(lo>hi)return false;}}return true;}
export function routeAvoidingCathedrals(points,year,width=7){
  let out=points.map(p=>p.slice());
  for(const l of[LANDMARKS.catherine,LANDMARKS.epiphany]){
    if(!l||year>=(l.removedYear||9999)+.55)continue;
    // Keep the church square reserved even before this specific stone building.
    const margin=width/2+12,w=l.width/2+margin,d=l.depth/2+margin;
    const rebuilt=[out[0]];
    for(let i=1;i<out.length;i++){
      const a=out[i-1],b=out[i];if(!intersects(a,b,l,margin)){rebuilt.push(b);continue;}
      const aa=local(a,l),bb=local(b,l),horizontal=Math.abs(bb[0]-aa[0])>Math.abs(bb[1]-aa[1]),inside=p=>Math.abs(p[0])<=w&&Math.abs(p[1])<=d;
      if(horizontal){const side=(aa[1]+bb[1])>=0?1:-1,dir=bb[0]>=aa[0]?1:-1;if(inside(aa)){aa[0]=-dir*w;rebuilt[rebuilt.length-1]=global(aa,l);}if(inside(bb))bb[0]=dir*w;rebuilt.push(global([-dir*w,side*d],l),global([dir*w,side*d],l),global(bb,l));}
      else{const side=(aa[0]+bb[0])>=0?1:-1,dir=bb[1]>=aa[1]?1:-1;if(inside(aa)){aa[1]=-dir*d;rebuilt[rebuilt.length-1]=global(aa,l);}if(inside(bb))bb[1]=dir*d;rebuilt.push(global([side*w,-dir*d],l),global([side*w,dir*d],l),global(bb,l));}
    }
    out=rebuilt;
  }
  return out;
}
export function roadPlotCollision(a,b,width,l){return intersects(a,b,l,width/2+2);}
const stages=new Map();let prepared=false;
export function prepareRoadHistory(){
  if(prepared)return;prepared=true;
  for(const r of GEO.roads){
    r.historyOriginalYear=r.year;r.historyMeta=ROAD_META[r.id]||{};
    const samples=[];for(let i=1;i<r.p.length;i++){const a=r.p[i-1],b=r.p[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/170));for(let j=0;j<n;j++){const p=[mix(a[0],b[0],j/n),mix(a[1],b[1],j/n)],q=[mix(a[0],b[0],(j+1)/n),mix(a[1],b[1],(j+1)/n)],x=(p[0]+q[0])/2,z=(p[1]+q[1])/2; samples.push({p:[p,q],year:phaseYear(r,x,z)});}}
    r.historyPieces=samples;r.year=Math.min(...samples.map(s=>s.year));r.dateConfidence='archive-envelope/model-phase';
  }
}
export function buildRoadStages(r){
  if(stages.has(r.id))return stages.get(r.id);
  const all=[],meta=r.historyMeta||{},special=/runway|taxiway|apron|terminal/.test(r.type)||/ЕКАД/.test(r.name||'');
  for(const piece of r.historyPieces||[{p:r.p,year:r.year}]){
    const birth=special?r.year:Math.max(piece.year,r.year),p=piece.p,rad=Math.hypot(...p[0]),rail=r.type==='rail'||r.type==='tram';
    if(special||rail){
      const intersectsChurch=rail&&[LANDMARKS.catherine,LANDMARKS.epiphany].some(l=>l&&intersects(p[0],p.at(-1),l,r.width/2+14));
      if(intersectsChurch&&birth<1930.55){all.push({p:routeAvoidingCathedrals(p,1900,r.width),start:birth,end:1930.55,width:r.width,surface:'rail',bridge:!!meta.bridge,detour:true});all.push({p,start:1930.55,end:9999,width:r.width,surface:'rail',bridge:!!meta.bridge});}
      else all.push({p,start:birth,end:9999,width:r.width,surface:rail?'rail':'asphalt',bridge:!!meta.bridge});continue;
    }
    const knownStone=/Каменный мост/.test(r.name||'')?1841:/Царский мост/.test(r.name||'')?1890:null;
    const cobble=knownStone|| (birth<1880?1880+(r.id%5):birth),asphalt=Math.max(birth,rad<2000?1935+(r.id%5):1955+(r.id%5)*3),wide=Math.max(asphalt+10,rad<2200?1960:1970),cuts=[birth,cobble,asphalt,wide,9999].filter((v,i,a)=>i===0||v>a[i-1]);
    for(let i=0;i<cuts.length-1;i++){
      const start=cuts[i],end=cuts[i+1],surface=knownStone&&start<knownStone?'timber':start<cobble?'earth':start<asphalt?'cobble':'asphalt';let width=start<cobble?Math.min(r.width,6):start<asphalt?Math.min(r.width,8):start<wide?Math.min(r.width,10):r.width;
      if(meta.bridge&&start<1930)width=Math.min(width,7);
      const cross=[LANDMARKS.catherine,LANDMARKS.epiphany].some(l=>l&&intersects(p[0],p.at(-1),l,width/2+14));
      if(cross&&start<1930.55){
        const death=Math.min(end,1930.55);all.push({p:routeAvoidingCathedrals(p,1900,width),start,end:death,width,surface,bridge:!!meta.bridge,detour:true});
        if(end>1930.55)all.push({p,start:1930.55,end,width,surface,bridge:!!meta.bridge});
      }else all.push({p,start,end,width,surface,bridge:!!meta.bridge});
    }
  }
  stages.set(r.id,all);return all;
}
export function getRoadPresentation(road,year){
  const segments=buildRoadStages(road).filter(s=>year>=s.start&&year<s.end);
  return{active:segments.length>0,width:segments.length?Math.max(...segments.map(s=>s.width)):0,surface:segments[0]?.surface||null,name:historicalRoadName(road,year),segments,confidence:road.dateConfidence||'model-phase'};
}
let roadBins=null;
function historyBin(x,z){
  if(!roadBins){roadBins=new Map();for(const r of GEO.roads)for(const s of buildRoadStages(r))for(let i=1;i<s.p.length;i++){const a=s.p[i-1],b=s.p[i],reach=s.width/2+40;for(let bx=Math.floor((Math.min(a[0],b[0])-reach)/200);bx<=Math.floor((Math.max(a[0],b[0])+reach)/200);bx++)for(let bz=Math.floor((Math.min(a[1],b[1])-reach)/200);bz<=Math.floor((Math.max(a[1],b[1])+reach)/200);bz++){const key=bx+','+bz;if(!roadBins.has(key))roadBins.set(key,[]);roadBins.get(key).push({a,b,s});}}}
  return roadBins.get(Math.floor(x/200)+','+Math.floor(z/200))||[];
}
export function nearHistoricalRoad(x,z,margin=0,year=2026){return historyBin(x,z).some(({a,b,s})=>year>=s.start&&year<s.end&&segmentDistance(x,z,a,b)<s.width/2+margin);}
export function historicalRoadFirstYear(x,z,margin=0){let first=9999;for(const {a,b,s}of historyBin(x,z))if(s.start<first&&segmentDistance(x,z,a,b)<s.width/2+margin)first=s.start;return first;}
export function frontageRoadYear(r,x,z){let nearest=Infinity,year=r.year;for(const p of r.historyPieces||[]){const d=segmentDistance(x,z,p.p[0],p.p.at(-1));if(d<nearest){nearest=d;year=p.year;}}return Math.max(year,r.year);}
export function roadHeightAt(road,x,z){
  const meta=road.historyMeta||{},water=waterAt(x,z),a=road.p[0],b=road.p.at(-1);
  if(!meta.bridge)return heightAt(x,z)+.85;
  const t=clamp(((x-a[0])*(b[0]-a[0])+(z-a[1])*(b[1]-a[1]))/(Math.pow(b[0]-a[0],2)+Math.pow(b[1]-a[1],2)||1));
  return Math.max(heightAt(x,z)+.85,mix(heightAt(...a),heightAt(...b),t)+.85,water?water.level+2.4:-999);
}
export function roadHistoryDiagnostics(year){let metres=0,count=0,detours=0,bridges=0;const surfaces={};for(const r of GEO.roads){if(r.urbanManaged)continue;const d=getRoadPresentation(r,year);for(const s of d.segments){let length=0;for(let i=1;i<s.p.length;i++)length+=Math.hypot(s.p[i][0]-s.p[i-1][0],s.p[i][1]-s.p[i-1][1]);metres+=length;count++;surfaces[s.surface]=(surfaces[s.surface]||0)+length;if(s.detour)detours++;if(s.bridge)bridges++;}}return{year,count,km:metres/1000,surfacesKm:Object.fromEntries(Object.entries(surfaces).map(([k,v])=>[k,v/1000])),detours,bridges};}
