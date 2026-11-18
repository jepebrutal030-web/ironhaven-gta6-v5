// IRONHAVEN city: a 392x392 m grid, 7 roads each way, downtown towers,
// residential blocks, a harbor with a sea to the east. Everything is
// procedural canvas textures and boxes — no downloaded assets.
import { WORLD, PALETTE, PLAZAS, WAREHOUSE } from './config.js';
import { range, pick } from './random.js';

export function dist2(ax, az, bx, bz) {
  const dx = ax - bx;
  const dz = az - bz;
  return dx * dx + dz * dz;
}

export function buildWorld(THREE, scene, rand) {
  const colliders = { aabbs: [], circles: [] };
  const blockCenters = [];
  for (let i = 0; i < WORLD.roads.length - 1; i += 1) {
    const c = (WORLD.roads[i] + WORLD.roads[i + 1]) / 2;
    blockCenters.push(c);
  }

  // --- ground: grass with a faint noise speckle ---
  const grassTex = (() => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = PALETTE.grass;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i += 1) {
      g.fillStyle = rand() > 0.5 ? '#547f43' : '#679654';
      g.fillRect(Math.floor(rand() * 256), Math.floor(rand() * 256), 3, 3);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(24, 24);
    return t;
  })();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.size + 140, WORLD.size + 140),
    new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(40, -0.05, 0);
  ground.receiveShadow = true;
  scene.add(ground);

  // --- roads: asphalt strips with a dashed center line ---
  // The dashes run along the canvas X axis; one texture repeats along the
  // road for X roads, a 90-degree-rotated copy does the same for Z roads.
  const roadTex = (() => {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = PALETTE.asphalt;
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i += 1) {
      g.fillStyle = rand() > 0.5 ? '#3f4247' : '#4b4e55';
      g.fillRect(Math.floor(rand() * 128), Math.floor(rand() * 128), 2, 2);
    }
    g.fillStyle = '#d8d8c8';
    g.fillRect(0, 6, 128, 3);
    g.fillRect(0, 119, 128, 3);
    g.fillStyle = '#e8c84a';
    g.fillRect(8, 62, 40, 4);
    g.fillRect(72, 62, 40, 4);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(24, 1);
    return t;
  })();
  const roadTexZ = roadTex.clone();
  roadTexZ.needsUpdate = true;
  roadTexZ.center.set(0.5, 0.5);
  roadTexZ.rotation = Math.PI / 2;
  const roadMatX = new THREE.MeshStandardMaterial({ map: roadTex, roughness: 0.95 });
  const roadMatZ = new THREE.MeshStandardMaterial({ map: roadTexZ, roughness: 0.95 });
  const roadGeoX = new THREE.PlaneGeometry(WORLD.size, WORLD.roadWidth);
  const roadGeoZ = new THREE.PlaneGeometry(WORLD.roadWidth, WORLD.size);
  for (const axis of WORLD.roads) {
    const rx = new THREE.Mesh(roadGeoX, roadMatX);
    rx.rotation.x = -Math.PI / 2;
    rx.position.set(0, 0.02, axis);
    rx.receiveShadow = true;
    scene.add(rx);
    const rz = new THREE.Mesh(roadGeoZ, roadMatZ);
    rz.rotation.x = -Math.PI / 2;
    rz.position.set(axis, 0.02, 0);
    rz.receiveShadow = true;
    scene.add(rz);
  }

  // --- sidewalk pads, one per block ---
  const walkMat = new THREE.MeshStandardMaterial({ color: PALETTE.sidewalk, roughness: 1 });
  const walkGeo = new THREE.PlaneGeometry(WORLD.block, WORLD.block);
  for (const cx of blockCenters) {
    for (const cz of blockCenters) {
      const pad = new THREE.Mesh(walkGeo, walkMat);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(cx, 0.03, cz);
      pad.receiveShadow = true;
      scene.add(pad);
    }
  }

  // --- facade textures, cached per colour ---
  const facadeCache = new Map();
  function facade(color, glass) {
    const key = color + (glass ? 'g' : 'b');
    if (facadeCache.has(key)) return facadeCache.get(key);
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = color;
    g.fillRect(0, 0, 128, 256);
    const cols = 4;
    const rows = 9;
    for (let r = 0; r < rows; r += 1) {
      for (let col = 0; col < cols; col += 1) {
        const lit = rand() > 0.72;
        g.fillStyle = glass
          ? (lit ? '#ffe9a8' : '#2a3a4a')
          : (lit ? '#ffe9a8' : '#20242c');
        g.fillRect(10 + col * 28, 12 + r * 26, 18, 14);
      }
    }
    if (!glass) {
      g.fillStyle = '#3a3a3a';
      g.fillRect(0, 232, 128, 24); // shopfront base
      g.fillStyle = '#c8b890';
      g.fillRect(8, 238, 50, 12);
      g.fillRect(70, 238, 50, 12);
    }
    const t = new THREE.CanvasTexture(c);
    facadeCache.set(key, t);
    return t;
  }

  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  function addBuilding(cx, cz, w, h, d, color, glass) {
    const mat = new THREE.MeshStandardMaterial({ map: facade(color, glass), roughness: 0.85 });
    const b = new THREE.Mesh(boxGeo, mat);
    b.scale.set(w, h, d);
    b.position.set(cx, h / 2, cz);
    b.castShadow = true;
    b.receiveShadow = true;
    scene.add(b);
    // A flat roof cap so the top is not a stretched facade.
    const cap = new THREE.Mesh(
      boxGeo,
      new THREE.MeshStandardMaterial({ color: 0x3c4046, roughness: 1 }),
    );
    cap.scale.set(w + 0.3, 0.4, d + 0.3);
    cap.position.set(cx, h + 0.2, cz);
    scene.add(cap);
    colliders.aabbs.push({
      minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2,
    });
    return b;
  }

  function isPlaza(cx, cz) {
    return PLAZAS.some((p) => p.x === cx && p.z === cz);
  }

  for (const cx of blockCenters) {
    for (const cz of blockCenters) {
      if (isPlaza(cx, cz)) continue;
      const downtown = Math.abs(cx) <= 84 && Math.abs(cz) <= 84;
      const harbor = cx >= 140;
      if (harbor) {
        addBuilding(cx, cz, 30, range(rand, 9, 15), 22, pick(rand, PALETTE.harbor), false);
      } else if (downtown) {
        if (rand() > 0.5) {
          addBuilding(cx, cz, 26, range(rand, 34, 68), 26, pick(rand, PALETTE.downtown), true);
        } else {
          addBuilding(cx - 9, cz, 16, range(rand, 26, 52), 22, pick(rand, PALETTE.downtown), true);
          addBuilding(cx + 9, cz, 16, range(rand, 20, 44), 22, pick(rand, PALETTE.downtown), true);
        }
      } else {
        const n = 2 + Math.floor(rand() * 3);
        for (let i = 0; i < n; i += 1) {
          const ox = range(rand, -13, 13);
          const oz = range(rand, -13, 13);
          addBuilding(cx + ox, cz + oz, range(rand, 9, 14), range(rand, 7, 15), range(rand, 9, 13), pick(rand, PALETTE.residential), false);
        }
      }
    }
  }

  // The harbor warehouse the final mission ends at.
  addBuilding(WAREHOUSE.x, WAREHOUSE.z, 26, 13, 18, '#5a6a7a', false);

  // --- trees: always inside blocks, >=10 m from any road axis ---
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.26, 1.6, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 1 });
  const leafGeo = new THREE.IcosahedronGeometry(1.5, 0);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7a34, roughness: 1 });
  const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x548c3a, roughness: 1 });
  for (const cx of blockCenters) {
    for (const cz of blockCenters) {
      if (isPlaza(cx, cz)) continue;
      const n = 1 + Math.floor(rand() * 2);
      for (let i = 0; i < n; i += 1) {
        const tx = cx + range(rand, -14, 14);
        const tz = cz + range(rand, -14, 14);
        // Keep trees out of building footprints.
        let inside = false;
        for (const a of colliders.aabbs) {
          if (tx > a.minX - 1 && tx < a.maxX + 1 && tz > a.minZ - 1 && tz < a.maxZ + 1) { inside = true; break; }
        }
        if (inside) continue;
        const trunk = new THREE.Mesh(trunkGeo, trunkMat);
        trunk.position.set(tx, 0.8, tz);
        trunk.castShadow = true;
        scene.add(trunk);
        const leaf = new THREE.Mesh(leafGeo, rand() > 0.5 ? leafMat : leafMat2);
        leaf.position.set(tx, 2.6, tz);
        leaf.scale.y = 1.25;
        leaf.castShadow = true;
        scene.add(leaf);
        colliders.circles.push({ x: tx, z: tz, r: 0.6 });
      }
    }
  }

  // --- street lamps at intersections ---
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.12, 5.2, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2c2f33, roughness: 0.7, metalness: 0.4 });
  const lampGeo = new THREE.SphereGeometry(0.28, 8, 6);
  const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff2c0, emissive: 0xffdf80, emissiveIntensity: 0.9 });
  for (const ax of WORLD.roads) {
    for (const az of WORLD.roads) {
      if ((ax + az) % 112 !== 0) continue;
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(ax + 6.2, 2.6, az + 6.2);
      scene.add(pole);
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(ax + 6.2, 5.3, az + 6.2);
      scene.add(lamp);
    }
  }

  // --- traffic lights at four central intersections ---
  const lightPoleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
  for (const [lx, lz] of [[0, 0], [56, -56], [-56, 56], [0, 112]]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.6, 6), lightPoleMat);
    pole.position.set(lx + 5.6, 2.8, lz + 5.6);
    scene.add(pole);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.1, 0.4), lightPoleMat);
    head.position.set(lx + 5.6, 5.4, lz + 5.6);
    scene.add(head);
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x22cc44, emissive: 0x22cc44, emissiveIntensity: 1.2 }),
    );
    dot.position.set(lx + 5.6, 5.15, lz + 5.35);
    scene.add(dot);
  }

  // --- harbor sea to the east, plus dock piers ---
  const sea = new THREE.Mesh(
    new THREE.PlaneGeometry(120, WORLD.size + 60),
    new THREE.MeshStandardMaterial({ color: 0x2a6a8a, roughness: 0.35, metalness: 0.25 }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(256, -0.4, 0);
  scene.add(sea);
  const pierMat = new THREE.MeshStandardMaterial({ color: 0x7a6a52, roughness: 1 });
  for (const pz of [-84, 0, 84]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(26, 0.3, 10), pierMat);
    pier.position.set(196, 0.05, pz);
    pier.receiveShadow = true;
    scene.add(pier);
  }

  // --- hideout beacon: a gold pillar of light at the hideout ---
  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, 60, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffd34a, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  );
  beacon.position.set(-56, 30, -140);
  scene.add(beacon);

  return {
    colliders,
    blockCenters,
    beacon,
    // Push a circle out of every collider. The lateral bias keeps cars from
    // wedging head-on against round obstacles (plaza trees): after the
    // radial push, slide a little along the tangent, in the direction of
    // travel, so a glancing hit becomes a slide instead of a stop.
    collideCircle(p, r, vx, vz) {
      let hit = false;
      for (const a of colliders.aabbs) {
        const cx = Math.max(a.minX, Math.min(p.x, a.maxX));
        const cz = Math.max(a.minZ, Math.min(p.z, a.maxZ));
        let dx = p.x - cx;
        let dz = p.z - cz;
        let d2 = dx * dx + dz * dz;
        if (d2 >= r * r) continue;
        hit = true;
        if (d2 < 1e-6) {
          // Center inside the box: push out along the smallest penetration.
          const pl = Math.min(p.x - a.minX, a.maxX - p.x);
          const pd = Math.min(p.z - a.minZ, a.maxZ - p.z);
          if (pl < pd) p.x += (p.x - a.minX < a.maxX - p.x ? -(pl + r) : pl + r);
          else p.z += (p.z - a.minZ < a.maxZ - p.z ? -(pd + r) : pd + r);
        } else {
          const d = Math.sqrt(d2);
          dx /= d;
          dz /= d;
          p.x = cx + dx * r;
          p.z = cz + dz * r;
        }
      }
      for (const c of colliders.circles) {
        let dx = p.x - c.x;
        let dz = p.z - c.z;
        const rr = r + c.r;
        let d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr || d2 < 1e-9) continue;
        hit = true;
        const d = Math.sqrt(d2);
        const nx = dx / d;
        const nz = dz / d;
        const overlap = rr - d;
        p.x = c.x + nx * rr;
        p.z = c.z + nz * rr;
        // Lateral bias: slide along the tangent.
        const tx = -nz;
        const tz = nx;
        const along = (vx || 0) * tx + (vz || 0) * tz;
        const bias = 0.35 * overlap * (along >= 0 ? 1 : -1);
        p.x += tx * bias;
        p.z += tz * bias;
      }
      return hit;
    },
    clampToCity(p) {
      p.x = Math.max(-WORLD.half + 2, Math.min(WORLD.half + 2, p.x));
      p.z = Math.max(-WORLD.half + 2, Math.min(WORLD.half + 2, p.z));
    },
  };
}
