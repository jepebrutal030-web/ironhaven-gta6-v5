// Detailed procedural cars: body, cabin with a sloped rear window, four
// wheels, bright head- and taillights, bumpers and a plate. No model files.
import { CAR_MODELS } from './config.js';

export function buildCar(THREE, model, colorHex) {
  const g = new THREE.Group();
  const paintMat = new THREE.MeshStandardMaterial({
    color: colorHex, metalness: 0.55, roughness: 0.35,
  });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a2a3a, metalness: 0.7, roughness: 0.15,
  });
  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xb8bcc2, metalness: 0.9, roughness: 0.25,
  });
  const { len, wid } = model;
  const bodyH = model.roof === 'truck' || model.roof === 'van' ? 0.85 : 0.55;

  // Main body.
  const body = new THREE.Mesh(new THREE.BoxGeometry(len, bodyH, wid), paintMat);
  body.position.y = 0.55 + bodyH / 2 - 0.28;
  body.castShadow = true;
  g.add(body);
  // Hood taper and trunk: lower nose and tail boxes.
  const nose = new THREE.Mesh(new THREE.BoxGeometry(len * 0.22, 0.34, wid * 0.92), paintMat);
  nose.position.set(len / 2 - len * 0.11, 0.62, 0);
  nose.castShadow = true;
  g.add(nose);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(len * 0.18, 0.4, wid * 0.94), paintMat);
  tail.position.set(-len / 2 + len * 0.09, 0.66, 0);
  g.add(tail);

  // Cabin: glasshouse with a sloped rear window.
  if (model.roof !== 'truck') {
    const cabLen = model.roof === 'van' ? len * 0.62 : len * 0.42;
    const cab = new THREE.Mesh(new THREE.BoxGeometry(cabLen, 0.5, wid * 0.82), glassMat);
    cab.position.set(model.roof === 'van' ? -len * 0.08 : -len * 0.06, 1.18, 0);
    cab.castShadow = true;
    g.add(cab);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(cabLen * 0.9, 0.08, wid * 0.8), paintMat);
    roof.position.set(model.roof === 'van' ? -len * 0.08 : -len * 0.06, 1.46, 0);
    g.add(roof);
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, wid * 0.78), glassMat);
    rearGlass.position.set(-len * 0.06 - cabLen / 2 - 0.12, 1.14, 0);
    rearGlass.rotation.z = -0.6; // sloped rear window
    g.add(rearGlass);
  } else {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(len * 0.4, 0.3, wid * 0.9), darkMat);
    bed.position.set(-len * 0.24, 1.0, 0);
    g.add(bed);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(len * 0.3, 0.62, wid * 0.9), glassMat);
    cab.position.set(len * 0.2, 1.2, 0);
    cab.castShadow = true;
    g.add(cab);
  }

  // Wheels.
  const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 12);
  const hubGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.28, 8);
  const wheels = [];
  for (const [wx, wz] of [
    [len * 0.32, wid / 2 - 0.05], [len * 0.32, -wid / 2 + 0.05],
    [-len * 0.32, wid / 2 - 0.05], [-len * 0.32, -wid / 2 + 0.05],
  ]) {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(wx, 0.36, wz);
    wheel.castShadow = true;
    g.add(wheel);
    const hub = new THREE.Mesh(hubGeo, chromeMat);
    hub.rotation.x = Math.PI / 2;
    hub.position.set(wx, 0.36, wz);
    g.add(hub);
    wheels.push(wheel);
  }

  // Headlights: wide, bright; taillights: wide, red.
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfff8d0, emissive: 0xfff2b0, emissiveIntensity: 1.6,
  });
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.16, wid * 0.72), headMat);
  head.position.set(len / 2 + 0.01, 0.72, 0);
  g.add(head);
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xcc1111, emissive: 0xff2222, emissiveIntensity: 1.4,
  });
  const tailLight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, wid * 0.78), tailMat);
  tailLight.position.set(-len / 2 - 0.01, 0.74, 0);
  g.add(tailLight);

  // Bumpers and plate.
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x2a2d31, metalness: 0.6, roughness: 0.5 });
  for (const bx of [len / 2 + 0.06, -len / 2 - 0.06]) {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, wid * 0.96), bumperMat);
    bumper.position.set(bx, 0.42, 0);
    g.add(bumper);
  }
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.2, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xf2f2e8, roughness: 0.6 }),
  );
  plate.position.set(-len / 2 - 0.14, 0.55, 0);
  g.add(plate);

  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, paintMat, wheels, model, length: len, width: wid };
}

export function modelByName(name) {
  return CAR_MODELS.find((m) => m.name === name) || CAR_MODELS[0];
}
