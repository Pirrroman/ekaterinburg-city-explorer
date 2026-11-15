import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../world.js';
import {GEO} from '../geo.js';
import {explorationState} from '../exploration-controls.js';
import {installSevastyanovNeighborhood} from '../sevastyanov-neighborhood.js';

test('the real world replaces both background and batched neighbors at the modern boundary', () => {
  const world=createWorld();
  const neighborhood=installSevastyanovNeighborhood(world);
  const pharmacy=world.landmarks.background.items.get('mountainPharmacy');
  assert.ok(pharmacy,'the separate background landmark must be replaced as well');
  for (const year of [2008,2009,2012,2026,2008]) {
    const state=explorationState(year,0,0);
    world.update(state);
    neighborhood.update(state);
    assert.equal(neighborhood.group.visible,year>=2009);
    assert.equal(pharmacy.group.visible,year<2009);
  }

  // Test the actual GPU batch attributes, not just the replacement-ID helper.
  // The other two source records are already excluded from this generic batch.
  const source=GEO.buildings.find(b=>b.id===51503506);
  const xs=source.p.map(p=>p[0]),zs=source.p.map(p=>p[1]);
  const xmin=Math.min(...xs)-.01,xmax=Math.max(...xs)+.01;
  const zmin=Math.min(...zs)-.01,zmax=Math.max(...zs)+.01;
  const batch=world.city.meshes.find(m=>m.name==='City fabric contemporary');
  const {position,birth,death}=batch.geometry.attributes;
  let replacedVertices=0;
  for(let i=0;i<death.count;i++)if(death.getX(i)===2009) {
    replacedVertices++;
    assert.equal(birth.getX(i),2012);
    assert.ok(position.getX(i)>=xmin&&position.getX(i)<=xmax);
    assert.ok(position.getZ(i)>=zmin&&position.getZ(i)<=zmax);
  }
  assert.ok(replacedVertices>0,'the generic southern wing must have a finite end year');
  assert.ok(batch.customDepthMaterial,'the same dated geometry must be used by shadows');
});
