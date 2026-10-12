import { GEOGRAPHY } from './assets/geography/city-data.js';
import { COMPLEX_BUILDINGS } from './assets/geography/complex-buildings.js';

// Local tangent plane, metres. Origin is OSM dam way171261814 midpoint.
export const ORIGIN = {lon:60.6033600,lat:56.8386511};
const K=111320, C=Math.cos(ORIGIN.lat*Math.PI/180);
export function project(lon,lat){return [(lon-ORIGIN.lon)*K*C,(ORIGIN.lat-lat)*K];}
export function unproject(x,z){return [ORIGIN.lon+x/(K*C),ORIGIN.lat-z/K];}
// OSM ways and relations have separate ID namespaces. Negative render IDs retain
// compatibility with the existing numeric way-ID filters; source type/id remain explicit.
const replacedWays=new Set(COMPLEX_BUILDINGS.suppressedWayIds);
export const GEO={...GEOGRAPHY,buildings:[...GEOGRAPHY.buildings.filter(b=>!replacedWays.has(b.id)),...COMPLEX_BUILDINGS.records]};
const specs = {
 dam:[60.60336,56.8386511,0.225,160,38,9,1723.32,1723.98],
 mint:[60.60285,56.83740,1.39,50,38,15,1725,1726],
 viz:[60.5584259136,56.8416072129,-.0152242983,210,50,28,1726,1726],
 gold:[60.799,56.912,0.4,120,110,18,1745,1745],
 mine:[60.799,56.912,0.4,120,110,28,1748,1748],
 // Schematic production phase ends with the park; surviving museum buildings are retained separately.
 lapidary:[60.60349,56.83677,1.39,36,26,14,1751,1751,1973],
 catherine:[60.60702,56.83850,-1.42,32,72,58,1758,1768,1930],
 epiphany:[60.59885,56.83828,-1.42,33,62,66,1771,1774,1930],
 estate:[60.6111268,56.8454198,-1.4630363,70,64,20,1794,1824],
 theater:[60.6106976,56.83963145,0.20132,42,32,18,1844,1845],
 nevsky:[60.598553,56.8229241,-1.2839663,38,58,48,1838,1852],
 sevastyanov:[60.606098,56.8391313,-1.3763563,45,35,19,1863,1866],
 station:[60.600735,56.8587994,0.0208663564,82,23,20,1875,1878],
 exhibition:[60.6030,56.83665,1.39,130,120,15,1887,1887,1888],
 electric:[60.6078341314,56.8337546099,1.7705966615,31,27.5,28,1894,1895],
 square:[60.59865,56.83824,0.17,140,100,1,1781,1781],
 opera:[60.6167217,56.8388024,-2.9447040447,70,105,32,1910,1912],
 mining:[60.5960441457,56.8260380266,-2.9286457247,58.18,22.85,23,1910,1913],
 ipatiev:[60.60924,56.84415,-1.40,27,23,12,1880,1890,1977],
 university:[60.653564,56.843984,-1.3749479345,196,165,39,1929,1939],
 uralmash:[60.5930000,56.8831106,-3.0171726536,210,390,35,1928,1933],
 whiteTower:[60.5723175,56.8931649,-0.525,15,13,29,1929,1931],
 cityhall:[60.5976404,56.8372322,-2.9530573101,125,45,67,1930,1934],
 stadium:[60.5734829232,56.8325339383,-.0758385114,198.14335,251.60328,45.5,1953,1957],
 historicSquare:[60.6036,56.8365,0.17,180,300,5,1971,1973],
 circus:[60.6050477,56.8257357,-1.38907059,114,88.4,50,1976,1980],
 metro:[60.61351,56.88648,0.18368,3.10,11.71,5,1980,1991],
 blood:[60.6089716,56.8443907,-1.43,38,44,60,2000,2003],
 vysotsky:[60.6146057,56.8361029,0.20238,43,42,188.3,2008,2011],
 yeltsin:[60.59126043,56.84481803,-0.636,148.4,119.9,40,2009,2015],
 iset:[60.5906759,56.8435691,0.21,38,38,212.8,2008,2016],
 // Photo-informed additions: facade is local +Z; calendar dates own construction.
 universityEarly:[60.6027673566,56.8249843452,0.2195920786,113.5,31,27,1840,1845],
 hotelIset:[60.6209889443,56.8408015113,0.0543616278,54.56,30.26,30,1932,1934],
 dynamo:[60.60047929691718,56.84448207908754,0.3138895298,23.66,58.69,24,1931,1934.33],
 cosmos:[60.6043025203,56.8455443133,-0.3420872377,147.8,81.32,29,1964,1967.98082],
 government:[60.5941220267,56.8419070901,-0.6172856121,55.42,34.81,89,1975,1982],
 drama:[60.593174,56.84372845,0.9405268669,64.1,118.72,32,1977,1990],
 expo:[60.75861106232809,56.76711937942421,-0.446,494.16344106467477,222.2284066157722,21,2010,2011.5],
 airportTerminal:[60.806413,56.750142,3.141592653589793,142,33,32,1951,1954.5],
 airport:[60.8020,56.7470,-0.14,4600,1900,28,1930,1943],
};
export const LANDMARKS=Object.fromEntries(Object.entries(specs).map(([id,[lon,lat,azimuth,width,depth,height,startYear,endYear,removedYear]])=>{const[x,z]=project(lon,lat);return[id,{x,z,lon,lat,azimuth,width,depth,height,startYear,endYear,removedYear}];}));
LANDMARKS.arena={...LANDMARKS.stadium,startYear:2014,endYear:2018,height:45.5};

const D=GEO.dem;
function sampleDem(x,z){
 const [lon,lat]=unproject(x,z),nx=((lon+180)/360*1024*256-D.x0)/(D.step||1),ny=((1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*1024*256-D.y0)/(D.step||1);
 const ix=Math.max(0,Math.min(D.width-2,Math.floor(nx))),iy=Math.max(0,Math.min(D.height-2,Math.floor(ny))),fx=Math.max(0,Math.min(1,nx-ix)),fy=Math.max(0,Math.min(1,ny-iy));
 const a=D.heights[iy*D.width+ix],b=D.heights[iy*D.width+ix+1],c=D.heights[(iy+1)*D.width+ix],d=D.heights[(iy+1)*D.width+ix+1];
 return (a*(1-fx)+b*fx)*(1-fy)+(c*(1-fx)+d*fx)*fy-D.datum;
}
export function pointInside(x,z,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>z)!==(b[1]>z))&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function segmentDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);}
// Spatial bins are shared by road clearance, plots, trees and routing verification.
const BIN=200, roadBins=new Map(),waterBins=new Map();
function addBins(map,box,item){for(let x=Math.floor(box[0]/BIN);x<=Math.floor(box[2]/BIN);x++)for(let z=Math.floor(box[1]/BIN);z<=Math.floor(box[3]/BIN);z++){const k=x+','+z;if(!map.has(k))map.set(k,[]);map.get(k).push(item);}}
GEO.roads.forEach(r=>{for(let i=1;i<r.p.length;i++){const a=r.p[i-1],b=r.p[i],e={a,b,road:r};addBins(roadBins,[Math.min(a[0],b[0])-35,Math.min(a[1],b[1])-35,Math.max(a[0],b[0])+35,Math.max(a[1],b[1])+35],e);}});
GEO.water.forEach(w=>{const xs=w.p.map(p=>p[0]),zs=w.p.map(p=>p[1]);w.b=[Math.min(...xs),Math.min(...zs),Math.max(...xs),Math.max(...zs)];addBins(waterBins,w.b,w);});
export function nearRoad(x,z,margin=0,year=2026){const a=roadBins.get(Math.floor(x/BIN)+','+Math.floor(z/BIN))||[];return a.some(e=>year>=e.road.year&&segmentDistance(x,z,e.a,e.b)<e.road.width/2+margin);}
export function roadFirstYear(x,z,margin=0){const a=roadBins.get(Math.floor(x/BIN)+','+Math.floor(z/BIN))||[];let year=9999;for(const e of a)if(segmentDistance(x,z,e.a,e.b)<e.road.width/2+margin)year=Math.min(year,e.road.year);return year;}
export function waterAt(x,z,year=2026){return (waterBins.get(Math.floor(x/BIN)+','+Math.floor(z/BIN))||[]).find(w=>year>=w.year&&pointInside(x,z,w.p));}
export function isWater(x,z,year=2026){return !!waterAt(x,z,year);}
const gradingPlots=Object.entries(LANDMARKS).filter(([id])=>!['dam','gold','mine','square','exhibition','historicSquare','arena'].includes(id)).map(([id,l])=>{let level=id==='airport'?233-D.datum:sampleDem(l.x,l.z);for(const w of GEO.water){const reach=Math.hypot(l.width,l.depth)/2+25;if(l.x<w.b[0]-reach||l.x>w.b[2]+reach||l.z<w.b[1]-reach||l.z>w.b[3]+reach)continue;for(let i=1;i<w.p.length;i++)if(segmentDistance(l.x,l.z,w.p[i-1],w.p[i])<reach)level=Math.max(level,w.level+1.2);}return{...l,id,level};});
export function heightAt(x,z){const w=waterAt(x,z,2026);if(w)return w.level-.8;let h=sampleDem(x,z);for(const l of gradingPlots){const dx=x-l.x,dz=z-l.z;if(Math.abs(dx)>l.width+l.depth||Math.abs(dz)>l.width+l.depth)continue;const c=Math.cos(l.azimuth),s=Math.sin(l.azimuth),u=Math.abs(dx*c-dz*s)-l.width/2,v=Math.abs(dx*s+dz*c)-l.depth/2,edge=Math.max(u,v),weight=Math.max(0,Math.min(1,1-edge/12));if(weight>0)h=h*(1-weight)+l.level*weight;}return h;}
export function rawHeightAt(x,z){return sampleDem(x,z);}
export function landmarkContains(x,z,l,margin=4){const dx=x-l.x,dz=z-l.z,c=Math.cos(l.azimuth),s=Math.sin(l.azimuth);return Math.abs(dx*c-dz*s)<l.width/2+margin&&Math.abs(dx*s+dz*c)<l.depth/2+margin;}
export function reserved(x,z,year=2026,margin=4){return Object.values(LANDMARKS).some(l=>year>=l.startYear&&(!l.removedYear||year<l.removedYear+.55)&&landmarkContains(x,z,l,margin));}
export const ATTRIBUTION='© OpenStreetMap contributors, ODbL; elevation: Mapzen/AWS Terrain Tiles (Terrarium), underlying public elevation sources. Modern footprints are measured; earlier ordinary buildings are an illustrative reconstruction.';
