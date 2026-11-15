import * as THREE from './vendor/three.module.js';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {project} from './geo.js';

export const SEVASTYANOV_ASSET_URL = new URL('./assets/models/sevastyanov-house.glb', import.meta.url);
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

  let status = 'idle', errorMessage = null, loadPromise = null, asset = null;
  let year = 0, distance = Infinity, detailRequested = false;
  let triangleCount = 0, meshCount = 0;
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
    const showModern = status === 'ready' && year >= SEVASTYANOV_MODERN_YEAR && detailRequested;
    historicalMetric.visible = !showModern;
    modern.visible = showModern;
    if (showModern) place();
  }

  function ensureLoaded() {
    if (status !== 'idle') return loadPromise;
    status = 'loading';
    // Keep the existing landmark visible throughout loading and on failure.
    loadPromise = Promise.resolve().then(() => loader.loadAsync(String(url))).then(gltf => {
      const model = gltf.scene;
      if (!model?.getObjectByName('SevastyanovExterior') || !model.getObjectByName('SevastyanovModernHall')) {
        throw new Error('The Sevastyanov GLB is missing its architectural groups');
      }
      model.traverse(object => {
        if (!object.isMesh) return;
        object.castShadow = true;
        object.receiveShadow = true;
        meshCount++;
        triangleCount += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
      });
      if (!meshCount) throw new Error('The Sevastyanov GLB contains no meshes');
      asset = model;
      modern.add(model);
      world.landmarks.applyClipping(item,model);
      place();
      status = 'ready';
      // Use the latest year/view, not the state when the request began.
      applyVisibility();
      return true;
    }).catch(error => {
      status = 'error';
      errorMessage = error instanceof Error ? error.message : String(error);
      modern.visible = false;
      historicalMetric.visible = true;
      logger.warn('Detailed Sevastyanov model unavailable; keeping the existing landmark.',error);
      return false;
    });
    return loadPromise;
  }

  function update(state,cameraPosition) {
    const value = Number(state.calendarYear ?? state.year);
    year = Number.isFinite(value) ? value : 0;
    distance = cameraPosition?.isVector3 ? cameraPosition.distanceTo(item.position) : Infinity;
    // Hysteresis avoids repeatedly swapping models near a distance boundary.
    detailRequested = distance <= (detailRequested ? releaseDistance : detailDistance);
    if (year >= SEVASTYANOV_MODERN_YEAR && distance <= loadDistance && item.group.visible) ensureLoaded();
    applyVisibility();
  }

  function diagnostics() {
    const built = item.group.visible && year >= item.spec.startYear;
    let bounds = null, scale = null;
    if (asset) {
      modern.updateWorldMatrix(true,true);
      worldBounds.setFromObject(modern);
      bounds = {min:worldBounds.min.toArray(),max:worldBounds.max.toArray()};
      modern.getWorldScale(worldScale);
      scale = worldScale.toArray();
    }
    return {
      status, error:errorMessage, year, modernSince:SEVASTYANOV_MODERN_YEAR,
      visibleModel:!built?'none':modern.visible?'modern':'existing',
      distance:Number.isFinite(distance)?Math.round(distance):null,
      detailRequested, meshes:meshCount, triangles:triangleCount,
      worldScale:scale, worldBounds:bounds,
    };
  }

  return {update,diagnostics,get ready(){return loadPromise ?? Promise.resolve(false);}};
}
