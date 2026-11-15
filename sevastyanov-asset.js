import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {project} from './geo.js';

export const SEVASTYANOV_ASSET_URL = new URL('./assets/models/sevastyanov-house.glb', import.meta.url);
export const SEVASTYANOV_COARSE_URL = new URL('./assets/models/sevastyanov-house-lod.glb', import.meta.url);
export const SEVASTYANOV_MODERN_YEAR = 2009;

// Inverse of the reference scene's horizontal OSM fit. A uniform scale keeps
// columns and the rotunda circular. Applying it vertically is an explicit
// visual calibration (17.85 m overall), not a surveyed building elevation.
const SOURCE_FRAME = Object.freeze({lon:60.60581, lat:56.83897, angle:11*Math.PI/180, scale:.88});
const WORLD_SCALE = 1 / SOURCE_FRAME.scale;

function placementMatrix(groundHeight) {
  const [x,z] = project(SOURCE_FRAME.lon,SOURCE_FRAME.lat);
  const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),SOURCE_FRAME.angle);
  const offset = new THREE.Vector3(3,0,2.6).applyQuaternion(rotation);
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x+offset.x,groundHeight,z+offset.z), rotation,
    new THREE.Vector3(WORLD_SCALE,WORLD_SCALE,WORLD_SCALE),
  );
}

/** Add the modern asset beside, rather than inside, the legacy metric scaler. */
export function installSevastyanovAsset(world, {
  loader = new GLTFLoader(),
  url = SEVASTYANOV_ASSET_URL,
  coarseUrl = SEVASTYANOV_COARSE_URL,
  loadDistance = 900,
  detailDistance = 650,
  releaseDistance = 750,
  logger = console,
} = {}) {
  const item = world.landmarks.items.get('sevastyanov');
  if (!item?.metric || !item.constructionGroup) throw new Error('Install the existing Sevastyanov landmark first');

  const historicalMetric = item.metric;
  const modern = new THREE.Group();
  modern.name = 'Sevastyanov-modern-geographic-placement';
  modern.matrixAutoUpdate = false;
  modern.visible = false;
  item.constructionGroup.add(modern);

  const levels = Object.fromEntries([
    ['coarse',coarseUrl], ['detailed',url],
  ].map(([name,source]) => [name,{
    name, url:String(source), status:'idle', error:null, promise:null,
    asset:null, meshes:0, triangles:0,
  }]));
  let selected = null;
  let year = 0, distance = Infinity, detailRequested = false;
  const worldScale = new THREE.Vector3();
  const worldBounds = new THREE.Box3();

  function place() {
    // Cancel every geographic parent transform, but never inherit the legacy
    // model's independent X/Y/Z normalization. This also handles late loads.
    item.constructionGroup.updateWorldMatrix(true,false);
    modern.matrix.copy(item.constructionGroup.matrixWorld).invert().multiply(placementMatrix(item.position.y));
    modern.updateMatrixWorld(true);
  }

  function applyVisibility() {
    const low = levels.coarse.status === 'ready' ? levels.coarse : null;
    const high = levels.detailed.status === 'ready' ? levels.detailed : null;
    selected = year < SEVASTYANOV_MODERN_YEAR ? null :
      high && (detailRequested || !low) ? high : low;
    // Once either modern asset is ready, distance/loading failures must never
    // substitute the differently shaped historical building for it.
    historicalMetric.visible = !selected;
    modern.visible = Boolean(selected);
    for (const level of Object.values(levels)) {
      if (level.asset) level.asset.visible = level === selected;
    }
    if (selected) place();
  }

  function ensureLoaded(level) {
    if (level.status !== 'idle') return level.promise;
    level.status = 'loading';
    level.promise = Promise.resolve().then(() => loader.loadAsync(level.url)).then(gltf => {
      const model = gltf.scene;
      if (!model?.getObjectByName('SevastyanovExterior') || !model.getObjectByName('SevastyanovModernHall')) {
        throw new Error('The Sevastyanov GLB is missing its architectural groups');
      }
      model.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        level.meshes++;
        level.triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
      });
      if (!level.meshes) throw new Error('The Sevastyanov GLB contains no meshes');
      level.asset = model;
      modern.add(model);
      world.landmarks.applyClipping(item,model);
      place();
      level.status = 'ready';
      // Use the latest year/view, not the state when the request began.
      applyVisibility();
      return true;
    }).catch(error => {
      level.status = 'error';
      level.error = error instanceof Error ? error.message : String(error);
      applyVisibility();
      logger.warn(`Sevastyanov ${level.name} model unavailable; keeping the available landmark.`,error);
      return false;
    });
    return level.promise;
  }

  function update(state,cameraPosition) {
    const value = Number(state.calendarYear ?? state.year);
    year = Number.isFinite(value) ? value : 0;
    distance = cameraPosition?.isVector3 ? cameraPosition.distanceTo(item.position) : Infinity;
    // Hysteresis avoids repeatedly swapping models near a distance boundary.
    detailRequested = distance <= (detailRequested ? releaseDistance : detailDistance);
    if (year >= SEVASTYANOV_MODERN_YEAR && item.group.visible) {
      // The small modern silhouette also serves the initial city overview.
      ensureLoaded(levels.coarse);
      if (distance <= loadDistance) ensureLoaded(levels.detailed);
    }
    applyVisibility();
  }

  function diagnostics() {
    const built = item.group.visible && year >= item.spec.startYear;
    let bounds = null, scale = null;
    const asset = selected?.asset ?? levels.coarse.asset ?? levels.detailed.asset;
    if (asset) {
      modern.updateWorldMatrix(true,true);
      worldBounds.setFromObject(asset);
      bounds = {min:worldBounds.min.toArray(),max:worldBounds.max.toArray()};
      modern.getWorldScale(worldScale);
      scale = worldScale.toArray();
    }
    return {
      status:Object.values(levels).some(l=>l.status === 'ready') ? 'ready' :
        Object.values(levels).some(l=>l.status === 'loading') ? 'loading' :
        Object.values(levels).some(l=>l.status === 'error') ? 'error' : 'idle',
      error:Object.values(levels).map(l=>l.error).filter(Boolean).join('; ') || null,
      year, modernSince:SEVASTYANOV_MODERN_YEAR,
      visibleModel:!built?'none':modern.visible?'modern':'existing',
      detailLevel:!built?'none':selected?.name ?? 'historical',
      distance:Number.isFinite(distance)?Math.round(distance):null,
      detailRequested, meshes:selected?.meshes ?? 0, triangles:selected?.triangles ?? 0,
      levels:Object.fromEntries(Object.entries(levels).map(([name,l])=>[name,{
        status:l.status,error:l.error,meshes:l.meshes,triangles:l.triangles,
      }])),
      worldScale:scale, worldBounds:bounds,
    };
  }

  return {update,diagnostics,get ready(){
    return Promise.all(Object.values(levels).map(l=>l.promise ?? Promise.resolve(false)))
      .then(results=>results.some(Boolean));
  }};
}
