import {createHistoricModels} from './models/historic.js';
import {createCivicModels} from './models/civic.js';
import {createModernModels} from './models/modern.js';
import {createExpansionModels} from './models/expansion.js';
import {finalizeModel,paint,getMaterials} from './architecture-kit.js';

export function installDetailedLandmarks(world){
  const landmarks=world.landmarks;
  const groups={...createHistoricModels(),...createCivicModels(),...createModernModels(),...createExpansionModels()};
  const replacements=[];
  for(const [key,model]of Object.entries(groups)){
    const item=landmarks.items.get(key);if(!item)throw Error('Unknown photo landmark: '+key);
    const previous=item.building;
    if((model.userData.keepOriginalEarly||model.userData.early?.userData.keepOriginalEarly)&&previous.userData.early){
      model.userData.early?.parent?.remove(model.userData.early);
      model.userData.early=previous.userData.early;model.add(model.userData.early);
    }
    // Model transforms belong to its author. Geographic pose and real dimensions
    // live in independent parents and survive both detail replacement and time.
    model.name = previous.name;
    finalizeModel(model);
    landmarks.installModel(item, model);
    if(key==='stadium')landmarks.items.get('arena').building=model;
    replacements.push(key);
  }
  // Remaining industrial/support architecture receives the same physical material system.
  const upgraded=new Map(),newGroups=new Set(Object.values(groups));
  for(const item of landmarks.items.values()){
    if(item.alias||newGroups.has(item.building))continue;
    item.building.traverse(o=>{
      if(!o.isMesh||!o.material||Array.isArray(o.material)||o.material.transparent)return;
      const original=o.material;if(!upgraded.has(original)){
        const c=original.color;
        if(!c)return;
        let mat;
        if(c.r+c.g+c.b<.35)mat=getMaterials().glassDark;
        else if(original.metalness>.35)mat=paint('#'+c.getHexString(),'metal',{metalness:original.metalness,roughness:.4});
        else mat=paint('#'+c.getHexString(),c.r>c.g*1.35&&c.r>c.b*1.3?'roof':'plaster');
        upgraded.set(original,mat);
      }
      if(upgraded.has(original))o.material=upgraded.get(original);
    });
    landmarks.applyClipping(item, item.building);
  }
  world.photoLandmarks=replacements;
  // Close-up framing for the historic ship's prow, independent of the long
  // OSM complex bounds. Compute after calibration, never from sketch units.
  const dynamo=landmarks.items.get('dynamo');
  dynamo.group.updateMatrixWorld(true);
  const nose=dynamo.building.position.clone().set(0,14,60);
  dynamo.building.localToWorld(nose);
  landmarks.targets.dynamoNose=nose.toArray();
  world.targets.dynamoNose=nose.toArray();
  world.updateArchitecture=state=>{for(const model of Object.values(groups))model.userData.updateState?.(state);};
  return {replacements,physicalMaterialCount:upgraded.size};
}
