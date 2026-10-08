import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Compass, 
  Footprints, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  ExternalLink
} from 'lucide-react';
import { portfolioProjects, type CityBuilding } from '../data/portfolioProjects';

export { type CityBuilding } from '../data/portfolioProjects';

interface RobloxCityWorldProps {
  onBuildingSelect: (building: CityBuilding) => void;
  targetBuildingId?: string | null;
}

export const RobloxCityWorld: React.FC<RobloxCityWorldProps> = ({ 
  onBuildingSelect,
  targetBuildingId
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [activePrompt, setActivePrompt] = useState<CityBuilding | null>(null);
  const [playerCoord, setPlayerCoord] = useState<{ x: number; z: number }>({ x: 0, z: 6 });
  const [controlsHintVisible, setControlsHintVisible] = useState(true);

  // Player Teleport Ref
  const playerTeleportRef = useRef<((x: number, z: number) => void) | null>(null);

  // Mobile controller touch states
  const mobileInputRef = useRef({ forward: false, backward: false, left: false, right: false, jump: false });

  // Handle external teleport if targetBuildingId provided
  useEffect(() => {
    if (targetBuildingId && playerTeleportRef.current) {
      const b = portfolioProjects.find(item => item.id === targetBuildingId);
      if (b) {
        // Teleport in front of entrance
        const targetX = b.position[0];
        const targetZ = b.position[2] + (b.position[2] < 0 ? 5 : -5);
        playerTeleportRef.current(targetX, targetZ);
      }
    }
  }, [targetBuildingId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.016);

    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      180
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // 2. City Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    dirLight.position.set(25, 50, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // 3. Ground & Cyber Road System
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x090D16, roughness: 0.85 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Ground Cyber Grid
    const grid = new THREE.GridHelper(120, 60, 0x00A2FF, 0x142236);
    grid.position.y = 0.02;
    scene.add(grid);

    // Road Networks (Asphalt avenues)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x0e1422, roughness: 0.7 });

    const createRoad = (width: number, length: number, x: number, z: number, rotate = false) => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(width, length), roadMat);
      road.rotation.x = -Math.PI / 2;
      if (rotate) road.rotation.z = Math.PI / 2;
      road.position.set(x, 0.03, z);
      road.receiveShadow = true;
      scene.add(road);
    };

    // Main Avenue (North-South)
    createRoad(8, 110, 0, 0);
    // East & West Avenues
    createRoad(6, 110, -18, 0);
    createRoad(6, 110, 18, 0);
    // Cross Boulevards (East-West)
    createRoad(6, 110, 0, -8, true);
    createRoad(6, 110, 0, 16, true);

    // Central Plaza circle
    const plazaGeo = new THREE.CircleGeometry(10, 32);
    const plazaMat = new THREE.MeshStandardMaterial({ color: 0x111b2b, roughness: 0.6 });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, 0.04, 0);
    plaza.receiveShadow = true;
    scene.add(plaza);

    // Center fountain hologram
    const monumentGeo = new THREE.CylinderGeometry(0.8, 1.2, 3, 8);
    const monumentMat = new THREE.MeshStandardMaterial({ 
      color: 0x00e5ff, 
      emissive: 0x00a2ff, 
      emissiveIntensity: 0.6,
      wireframe: true 
    });
    const monument = new THREE.Mesh(monumentGeo, monumentMat);
    monument.position.set(0, 1.5, 0);
    scene.add(monument);

    // 4. Construct All 10 City Buildings
    portfolioProjects.forEach(b => {
      const bGroup = new THREE.Group();

      // Main Building Body
      const bodyGeo = new THREE.BoxGeometry(b.width, b.height, b.depth);
      const bodyMat = new THREE.MeshStandardMaterial({ 
        color: b.color, 
        roughness: 0.25,
        metalness: 0.3
      });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.y = b.height / 2;
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      bGroup.add(bodyMesh);

      // Neon Cyber Edges
      const edges = new THREE.EdgesGeometry(bodyGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: b.neonColor, linewidth: 2 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.position.y = b.height / 2;
      bGroup.add(wireframe);

      // Holographic Signboard on Top
      const signCanvas = document.createElement('canvas');
      signCanvas.width = 512;
      signCanvas.height = 130;
      const sctx = signCanvas.getContext('2d');
      if (sctx) {
        sctx.fillStyle = '#070b13';
        sctx.fillRect(0, 0, 512, 130);
        sctx.strokeStyle = `#${b.neonColor.toString(16).padStart(6, '0')}`;
        sctx.lineWidth = 6;
        sctx.strokeRect(4, 4, 504, 122);

        sctx.fillStyle = '#FFFFFF';
        sctx.font = 'bold 32px sans-serif';
        sctx.textAlign = 'center';
        sctx.fillText(b.name.toUpperCase(), 256, 52);

        sctx.fillStyle = `#${b.neonColor.toString(16).padStart(6, '0')}`;
        sctx.font = 'bold 22px monospace';
        sctx.fillText(`[ ${b.badge} ]`, 256, 96);
      }
      const signTexture = new THREE.CanvasTexture(signCanvas);
      const signGeo = new THREE.PlaneGeometry(b.width * 0.95, 2.3);
      const signMat = new THREE.MeshBasicMaterial({ 
        map: signTexture, 
        side: THREE.DoubleSide 
      });
      const signMesh = new THREE.Mesh(signGeo, signMat);
      signMesh.position.set(0, b.height + 1.4, 0);

      // Orient sign towards closest street
      if (Math.abs(b.position[0]) > Math.abs(b.position[2])) {
        // East or West buildings
        signMesh.rotation.y = b.position[0] < 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      bGroup.add(signMesh);

      // Entrance Glow Pad
      let padOffsetX = 0;
      let padOffsetZ = 0;
      if (b.position[2] < -10) {
        padOffsetZ = b.depth / 2 + 1.5; // North building faces south
      } else if (b.position[2] > 10) {
        padOffsetZ = -b.depth / 2 - 1.5; // South building faces north
      } else if (b.position[0] < -10) {
        padOffsetX = b.width / 2 + 1.5; // West building faces east
      } else {
        padOffsetX = -b.width / 2 - 1.5; // East building faces west
      }

      const padGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.1, 16);
      const padMat = new THREE.MeshBasicMaterial({ 
        color: b.neonColor, 
        wireframe: true 
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(padOffsetX, 0.06, padOffsetZ);
      bGroup.add(pad);

      // Neon Spot Light
      const spot = new THREE.PointLight(b.neonColor, 3.5, 12);
      spot.position.set(padOffsetX, 2.2, padOffsetZ);
      bGroup.add(spot);

      bGroup.position.set(b.position[0], 0, b.position[2]);
      scene.add(bGroup);
    });

    // 5. Streetlights around the city
    const addStreetLight = (x: number, z: number) => {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 1.75, z);
      scene.add(pole);

      const lampGeo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
      const lampMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF });
      const lamp = new THREE.Mesh(lampGeo, lampMat);
      lamp.position.set(x, 3.6, z);
      scene.add(lamp);

      const light = new THREE.PointLight(0x00E5FF, 1.4, 9);
      light.position.set(x, 3.5, z);
      scene.add(light);
    };

    // Boulevard lights
    const lightCoords = [
      [-6, -6], [6, -6], [-6, 6], [6, 6],
      [-6, -18], [6, -18], [-6, 18], [6, 18],
      [-24, -6], [-24, 6], [24, -6], [24, 6]
    ];
    lightCoords.forEach(([lx, lz]) => addStreetLight(lx, lz));

    // 6. Playable Roblox Character Rig
    const playerGroup = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFAD090, roughness: 0.5 });
    const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.4 });
    const cyanNeonMat = new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x00A2FF, emissiveIntensity: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0B0F19, roughness: 0.6 });

    // Head with Face
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 128;
    faceCanvas.height = 128;
    const fctx = faceCanvas.getContext('2d');
    if (fctx) {
      fctx.fillStyle = '#FAD090';
      fctx.fillRect(0, 0, 128, 128);
      fctx.fillStyle = '#111625';
      fctx.fillRect(28, 40, 18, 26);
      fctx.fillRect(82, 40, 18, 26);
      fctx.fillStyle = '#00E5FF';
      fctx.fillRect(32, 44, 8, 10);
      fctx.fillRect(86, 44, 8, 10);
      fctx.beginPath();
      fctx.arc(64, 84, 16, 0.1 * Math.PI, 0.9 * Math.PI);
      fctx.lineWidth = 5;
      fctx.stroke();
    }
    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    const headMatArray = [
      skinMat, skinMat, skinMat, skinMat,
      new THREE.MeshStandardMaterial({ map: faceTexture }),
      skinMat
    ];

    const headGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const head = new THREE.Mesh(headGeo, headMatArray);
    head.position.y = 1.65;
    head.castShadow = true;
    playerGroup.add(head);

    // Cyber Headphones
    const bandGeo = new THREE.BoxGeometry(0.82, 0.08, 0.2);
    const band = new THREE.Mesh(bandGeo, cyanNeonMat);
    band.position.set(0, 2.05, 0);
    playerGroup.add(band);

    const earGeo = new THREE.BoxGeometry(0.12, 0.28, 0.28);
    const earL = new THREE.Mesh(earGeo, cyanNeonMat);
    earL.position.set(-0.41, 1.65, 0);
    const earR = new THREE.Mesh(earGeo, cyanNeonMat);
    earR.position.set(0.41, 1.65, 0);
    playerGroup.add(earL, earR);

    // Torso (Hoodie with F Logo)
    const torsoGeo = new THREE.BoxGeometry(1.0, 1.1, 0.55);
    const torso = new THREE.Mesh(torsoGeo, hoodieMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    playerGroup.add(torso);

    const logoGeo = new THREE.BoxGeometry(0.35, 0.35, 0.05);
    const logoMesh = new THREE.Mesh(logoGeo, cyanNeonMat);
    logoMesh.position.set(0, 0.95, 0.29);
    playerGroup.add(logoMesh);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.38, 1.0, 0.45);
    const leftArm = new THREE.Mesh(armGeo, hoodieMat);
    leftArm.position.set(-0.72, 0.85, 0);
    leftArm.castShadow = true;
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, hoodieMat);
    rightArm.position.set(0.72, 0.85, 0);
    rightArm.castShadow = true;
    playerGroup.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.44, 0.9, 0.45);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.24, -0.05, 0);
    leftLeg.castShadow = true;
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.24, -0.05, 0);
    rightLeg.castShadow = true;
    playerGroup.add(rightLeg);

    // Floating Companion AI Orb
    const orbGeo = new THREE.IcosahedronGeometry(0.18, 1);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, wireframe: true });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0.9, 1.9, -0.4);
    playerGroup.add(orb);

    // Spawn character at center facing BrandPulse
    playerGroup.position.set(0, 1.35, 6);
    scene.add(playerGroup);

    // Expose teleport function
    playerTeleportRef.current = (tx: number, tz: number) => {
      playerGroup.position.x = tx;
      playerGroup.position.z = tz;
      playerGroup.position.y = 1.35;
    };

    // Movement Physics & State
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === 'e') {
        const near = checkNearestBuilding(playerGroup.position.x, playerGroup.position.z);
        if (near) {
          onBuildingSelect(near);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const moveSpeed = 0.28;
    const jumpStrength = 0.22;
    const gravity = -0.012;
    let velocityY = 0;
    let walkCycle = 0;

    const checkNearestBuilding = (px: number, pz: number): CityBuilding | null => {
      for (const b of portfolioProjects) {
        const dist = Math.hypot(px - b.position[0], pz - b.position[2]);
        const triggerDistance = Math.max(b.width, b.depth) / 2 + 3.8;
        if (dist < triggerDistance) {
          return b;
        }
      }
      return null;
    };

    const cameraOffset = new THREE.Vector3(0, 4.8, 9.2);

    // 7. Animation Loop
    let animId: number;
    let lastTime = performance.now();

    const animate = (now: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const elapsedTime = now * 0.001;

      // Inputs
      const forward = keys['w'] || keys['arrowup'] || mobileInputRef.current.forward;
      const backward = keys['s'] || keys['arrowdown'] || mobileInputRef.current.backward;
      const left = keys['a'] || keys['arrowleft'] || mobileInputRef.current.left;
      const right = keys['d'] || keys['arrowright'] || mobileInputRef.current.right;
      const jump = (keys[' '] || mobileInputRef.current.jump) && playerGroup.position.y <= 1.36;

      let moveX = 0;
      let moveZ = 0;
      if (forward) moveZ -= 1;
      if (backward) moveZ += 1;
      if (left) moveX -= 1;
      if (right) moveX += 1;

      const isMoving = moveX !== 0 || moveZ !== 0;

      if (isMoving) {
        const len = Math.hypot(moveX, moveZ);
        const normX = (moveX / len) * moveSpeed;
        const normZ = (moveZ / len) * moveSpeed;

        playerGroup.position.x += normX;
        playerGroup.position.z += normZ;

        const targetAngle = Math.atan2(normX, normZ);
        playerGroup.rotation.y = targetAngle;

        walkCycle += delta * 15;
        leftLeg.rotation.x = Math.sin(walkCycle) * 0.7;
        rightLeg.rotation.x = -Math.sin(walkCycle) * 0.7;
        leftArm.rotation.x = -Math.sin(walkCycle) * 0.7;
        rightArm.rotation.x = Math.sin(walkCycle) * 0.7;
      } else {
        walkCycle = 0;
        leftLeg.rotation.x *= 0.8;
        rightLeg.rotation.x *= 0.8;
        leftArm.rotation.x = Math.sin(elapsedTime * 2) * 0.08;
        rightArm.rotation.x = -Math.sin(elapsedTime * 2) * 0.08;
      }

      // Jump
      if (jump) {
        velocityY = jumpStrength;
      }
      playerGroup.position.y += velocityY;
      velocityY += gravity;

      if (playerGroup.position.y < 1.35) {
        playerGroup.position.y = 1.35;
        velocityY = 0;
      }

      // Boundary clamp
      playerGroup.position.x = Math.max(-48, Math.min(48, playerGroup.position.x));
      playerGroup.position.z = Math.max(-48, Math.min(48, playerGroup.position.z));

      // Orbiting AI Drone
      orb.position.y = 1.8 + Math.sin(elapsedTime * 3) * 0.2;
      orb.rotation.y += 0.04;
      monument.rotation.y += 0.01;

      // Coordinate updates
      setPlayerCoord({
        x: Math.round(playerGroup.position.x * 10) / 10,
        z: Math.round(playerGroup.position.z * 10) / 10
      });

      // Proximity Prompt check
      const near = checkNearestBuilding(playerGroup.position.x, playerGroup.position.z);
      setActivePrompt(near);

      // Camera Follow
      const targetCamPos = playerGroup.position.clone().add(cameraOffset);
      camera.position.lerp(targetCamPos, 0.08);
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1, playerGroup.position.z);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onBuildingSelect]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ========================================================= */}
      {/* ROBLOX HUD OVERLAY: RADAR MINI-MAP & METRICS */}
      {/* ========================================================= */}
      <div className="absolute top-16 left-4 z-30 pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-xl space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between gap-3 text-[11px] font-mono text-cyan-400 font-bold">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>RADAR KOTA FARGAN</span>
            </div>
            <span className="text-[10px] text-slate-400">10 KARYA</span>
          </div>

          {/* Mini-Map Radar Canvas View */}
          <div className="relative w-36 h-36 rounded-xl bg-slate-900/90 border border-cyan-500/30 overflow-hidden flex items-center justify-center">
            {/* Radar Grid Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,162,255,0.15)_0%,transparent_70%)]" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/20" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/20" />
            <div className="absolute w-24 h-24 rounded-full border border-cyan-500/20" />

            {/* Buildings on Mini-Map */}
            {portfolioProjects.map(b => {
              // Map from world [-48, 48] to mini-map [0, 144]
              const mapX = 72 + (b.position[0] / 48) * 60;
              const mapY = 72 + (b.position[2] / 48) * 60;
              const isNear = activePrompt?.id === b.id;
              return (
                <div
                  key={b.id}
                  title={b.name}
                  className={`absolute w-2.5 h-2.5 rounded-sm -translate-x-1/2 -translate-y-1/2 transition-all ${
                    isNear ? 'ring-2 ring-white scale-150 animate-pulse' : ''
                  }`}
                  style={{
                    left: `${mapX}px`,
                    top: `${mapY}px`,
                    backgroundColor: `#${b.neonColor.toString(16).padStart(6, '0')}`
                  }}
                />
              );
            })}

            {/* Player Marker in Radar */}
            <div 
              className="absolute w-3 h-3 rounded-full bg-cyan-400 ring-4 ring-cyan-400/40 -translate-x-1/2 -translate-y-1/2 shadow-lg"
              style={{
                left: `${72 + (playerCoord.x / 48) * 60}px`,
                top: `${72 + (playerCoord.z / 48) * 60}px`
              }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>POS: {playerCoord.x}, {playerCoord.z}</span>
            <span className="text-emerald-400">FPS: 60</span>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROBLOX HUD OVERLAY: QUICK TELEPORT / DIRECTORY */}
      {/* ========================================================= */}
      <div className="absolute top-16 right-4 z-30 hidden sm:block">
        <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-xl max-h-72 overflow-y-auto w-52 space-y-1 text-xs">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-white/10 flex items-center justify-between">
            <span>Daftar Gedung Karya</span>
            <MapPin className="w-3 h-3 text-cyan-400" />
          </div>
          {portfolioProjects.map(b => (
            <button
              key={b.id}
              onClick={() => {
                if (playerTeleportRef.current) {
                  playerTeleportRef.current(b.position[0], b.position[2] + (b.position[2] < 0 ? 5 : -5));
                }
              }}
              className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                activePrompt?.id === b.id
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: `#${b.neonColor.toString(16).padStart(6, '0')}` }}
              />
              <span className="truncate text-[11px]">{b.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ROBLOX PROXIMITY PROMPT MODAL (WHEN NEAR A BUILDING) */}
      {/* ========================================================= */}
      {activePrompt && (
        <div className="absolute bottom-24 sm:bottom-12 left-1/2 -translate-x-1/2 z-40 animate-bounce">
          <div className="roblox-panel p-4 px-6 flex items-center gap-4 border-2 border-cyan-400 shadow-2xl bg-slate-950/95 max-w-md">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 font-black flex items-center justify-center text-lg shadow-lg shadow-cyan-500/50 flex-shrink-0">
              E
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                  {activePrompt.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">Didekati</span>
              </div>
              <h4 className="text-sm font-black text-white">{activePrompt.name}</h4>
              <p className="text-[11px] text-slate-300 line-clamp-1">{activePrompt.subtitle}</p>
            </div>

            <button
              onClick={() => onBuildingSelect(activePrompt)}
              className="ml-2 px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/30 cursor-pointer flex-shrink-0"
            >
              <span>KUNJUNGI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTROLS HINT NOTIFICATION */}
      {/* ========================================================= */}
      {controlsHintVisible && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <div className="bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl flex items-center gap-3 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Gunakan tombol <strong>W, A, S, D</strong> untuk berjalan & <strong>SPASI</strong> untuk melompat</span>
            <button 
              onClick={() => setControlsHintVisible(false)}
              className="text-slate-400 hover:text-white ml-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MOBILE TOUCH CONTROLS (VIRTUAL D-PAD & JUMP) */}
      {/* ========================================================= */}
      <div className="sm:hidden absolute bottom-5 left-4 z-30 pointer-events-auto">
        <div className="grid grid-cols-3 gap-1.5 w-32 h-32 p-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-white/10 shadow-2xl">
          <div />
          <button
            onTouchStart={() => { mobileInputRef.current.forward = true; }}
            onTouchEnd={() => { mobileInputRef.current.forward = false; }}
            className="flex items-center justify-center rounded-xl bg-slate-800/90 active:bg-cyan-500 text-white active:text-slate-950 text-xs font-bold shadow"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />

          <button
            onTouchStart={() => { mobileInputRef.current.left = true; }}
            onTouchEnd={() => { mobileInputRef.current.left = false; }}
            className="flex items-center justify-center rounded-xl bg-slate-800/90 active:bg-cyan-500 text-white active:text-slate-950 text-xs font-bold shadow"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center text-[10px] text-slate-500 font-mono font-bold">
            MOVE
          </div>
          <button
            onTouchStart={() => { mobileInputRef.current.right = true; }}
            onTouchEnd={() => { mobileInputRef.current.right = false; }}
            className="flex items-center justify-center rounded-xl bg-slate-800/90 active:bg-cyan-500 text-white active:text-slate-950 text-xs font-bold shadow"
          >
            <ArrowRight className="w-5 h-5" />
          </button>

          <div />
          <button
            onTouchStart={() => { mobileInputRef.current.backward = true; }}
            onTouchEnd={() => { mobileInputRef.current.backward = false; }}
            className="flex items-center justify-center rounded-xl bg-slate-800/90 active:bg-cyan-500 text-white active:text-slate-950 text-xs font-bold shadow"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <div />
        </div>
      </div>

      {/* Mobile Jump Button */}
      <div className="sm:hidden absolute bottom-5 right-4 z-30 pointer-events-auto">
        <button
          onTouchStart={() => { mobileInputRef.current.jump = true; }}
          onTouchEnd={() => { mobileInputRef.current.jump = false; }}
          className="w-16 h-16 rounded-full bg-cyan-500 active:bg-cyan-400 text-slate-950 font-black text-xs shadow-2xl flex flex-col items-center justify-center gap-0.5 border-2 border-white/20 active:scale-95"
        >
          <Footprints className="w-5 h-5" />
          <span>JUMP</span>
        </button>
      </div>
    </div>
  );
};
