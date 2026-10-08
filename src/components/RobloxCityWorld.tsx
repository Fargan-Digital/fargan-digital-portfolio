import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  ExternalLink,
  MessageSquare,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  RotateCw,
  Navigation
} from 'lucide-react';
import { portfolioProjects, type CityBuilding } from '../data/portfolioProjects';
import { soundEngine } from '../utils/audioManager';

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

  const [activeDialogue, setActiveDialogue] = useState<CityBuilding | null>(null);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTypingDone, setIsTypingDone] = useState<boolean>(false);
  const [dialogueSfxEnabled, setDialogueSfxEnabled] = useState<boolean>(true);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const [playerCoord, setPlayerCoord] = useState<{ x: number; z: number }>({ x: 0, z: 6 });
  const [controlsHintVisible, setControlsHintVisible] = useState(true);
  const [mobileRadarOpen, setMobileRadarOpen] = useState(false);

  // Sync refs so Three.js scene never needs to re-mount when callbacks or IDs change
  const onBuildingSelectRef = useRef(onBuildingSelect);
  useEffect(() => {
    onBuildingSelectRef.current = onBuildingSelect;
  }, [onBuildingSelect]);

  const dismissedIdRef = useRef(dismissedId);
  useEffect(() => {
    dismissedIdRef.current = dismissedId;
  }, [dismissedId]);

  const activeDialogueRef = useRef(activeDialogue);
  useEffect(() => {
    activeDialogueRef.current = activeDialogue;
  }, [activeDialogue]);

  // Player Teleport Ref
  const playerTeleportRef = useRef<((x: number, z: number) => void) | null>(null);

  // Camera Orbit & Reset Control Refs (Google Maps style)
  const rotateCameraRef = useRef<((delta: number) => void) | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);

  // Mobile controller touch states
  const mobileInputRef = useRef({ forward: false, backward: false, left: false, right: false, jump: false });

  // Web Audio Typewriter Click SFX
  const playTypewriterClick = useCallback(() => {
    if (!dialogueSfxEnabled) return;
    soundEngine.playTypewriterBlip();
  }, [dialogueSfxEnabled]);

  // Handle Typewriter Text Animation
  useEffect(() => {
    if (!activeDialogue) {
      setDisplayedText('');
      setIsTypingDone(false);
      return;
    }

    const fullText = activeDialogue.dialogueText;
    let charIndex = 0;
    setDisplayedText('');
    setIsTypingDone(false);

    const timer = setInterval(() => {
      charIndex++;
      if (charIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex));
        // Play click every 2 characters or on whitespace for gentle typewriter cadence
        if (charIndex % 2 === 0 || fullText[charIndex - 1] === ' ') {
          playTypewriterClick();
        }
      } else {
        setIsTypingDone(true);
        clearInterval(timer);
      }
    }, 22);

    return () => clearInterval(timer);
  }, [activeDialogue, playTypewriterClick]);

  // Handle external teleport if targetBuildingId provided
  useEffect(() => {
    if (targetBuildingId && playerTeleportRef.current) {
      const b = portfolioProjects.find(item => item.id === targetBuildingId);
      if (b) {
        const targetX = b.position[0];
        const targetZ = b.position[2] + (b.position[2] < 0 ? 5 : -5);
        playerTeleportRef.current(targetX, targetZ);
        setDismissedId(null);
        setActiveDialogue(b);
      }
    }
  }, [targetBuildingId]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect mobile viewport
    const checkIsMobile = () => container.clientWidth < 640 || container.clientWidth < container.clientHeight;
    const isMobile = checkIsMobile();

    // 1. Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);
    scene.fog = new THREE.FogExp2(0x060911, 0.015);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 65 : 52,
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

    const grid = new THREE.GridHelper(120, 60, 0x00A2FF, 0x142236);
    grid.position.y = 0.02;
    scene.add(grid);

    const roadMat = new THREE.MeshStandardMaterial({ color: 0x0e1422, roughness: 0.7 });

    const createRoad = (width: number, length: number, x: number, z: number, rotate = false) => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(width, length), roadMat);
      road.rotation.x = -Math.PI / 2;
      if (rotate) road.rotation.z = Math.PI / 2;
      road.position.set(x, 0.03, z);
      road.receiveShadow = true;
      scene.add(road);
    };

    createRoad(8, 110, 0, 0);
    createRoad(6, 110, -18, 0);
    createRoad(6, 110, 18, 0);
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

    // Center fountain monument
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

    // Array to track NPCs for animation
    const npcsList: { 
      id: string; 
      building: CityBuilding; 
      waveArm: THREE.Mesh; 
      pos: THREE.Vector3 
    }[] = [];

    // 4. Construct All 10 City Buildings + 3D NPCs in front
    portfolioProjects.forEach(b => {
      const bGroup = new THREE.Group();

      // Building Body
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

      // Neon Edges
      const edges = new THREE.EdgesGeometry(bodyGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: b.neonColor, linewidth: 2 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.position.y = b.height / 2;
      bGroup.add(wireframe);

      // Holographic Signboard
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
        sctx.font = 'bold 30px sans-serif';
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

      // Determine building facade and entrance direction
      const isWestSide = b.id === 'roban-alam-lestari' || b.id === 'han-waste' || (b.position[0] <= -20);
      const isEastSide = b.id === 'kavling-morowali' || b.id === 'farghan-digital-marketing' || (b.position[0] >= 20);
      const isNorthSide = b.id === 'brandpulse' || b.id === 'anti-sobis' || b.id === 'fargan-guard-trading' || (b.position[2] <= -10);

      let padOffsetX = 0;
      let padOffsetZ = 0;
      let npcOffsetX = 0;
      let npcOffsetZ = 0;
      let npcRotationY = 0;

      if (isWestSide) {
        signMesh.rotation.y = Math.PI / 2; // sign faces East toward central road
        padOffsetX = b.width / 2 + 1.5;
        npcOffsetX = b.width / 2 + 2.3;
        npcOffsetZ = 0;
        npcRotationY = Math.PI / 2; // NPC stands in front, facing East
      } else if (isEastSide) {
        signMesh.rotation.y = -Math.PI / 2; // sign faces West toward central road
        padOffsetX = -b.width / 2 - 1.5;
        npcOffsetX = -b.width / 2 - 2.3;
        npcOffsetZ = 0;
        npcRotationY = -Math.PI / 2; // NPC stands in front, facing West
      } else if (isNorthSide) {
        signMesh.rotation.y = 0; // sign faces South toward plaza
        padOffsetZ = b.depth / 2 + 1.5;
        npcOffsetX = 0;
        npcOffsetZ = b.depth / 2 + 2.3;
        npcRotationY = 0; // NPC stands in front, facing South
      } else {
        // South buildings (fargan-kopi, farghan-butik, hendar-fitness)
        signMesh.rotation.y = Math.PI; // sign faces North toward plaza
        padOffsetZ = -b.depth / 2 - 1.5;
        npcOffsetX = 0;
        npcOffsetZ = -b.depth / 2 - 2.3;
        npcRotationY = Math.PI; // NPC stands in front, facing North
      }
      bGroup.add(signMesh);

      const padGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.1, 16);
      const padMat = new THREE.MeshBasicMaterial({ 
        color: b.neonColor, 
        wireframe: true 
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(padOffsetX, 0.06, padOffsetZ);
      bGroup.add(pad);

      const spot = new THREE.PointLight(b.neonColor, 3.5, 12);
      spot.position.set(padOffsetX, 2.2, padOffsetZ);
      bGroup.add(spot);

      bGroup.position.set(b.position[0], 0, b.position[2]);
      scene.add(bGroup);

      // =========================================================
      // 3D ROBLOX NPC CHARACTER IN FRONT OF BUILDING ENTRANCE
      // =========================================================
      const npcGroup = new THREE.Group();

      const npcSkinMat = new THREE.MeshStandardMaterial({ color: 0xFAD090, roughness: 0.5 });
      const npcShirtMat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.3 });
      const npcNeonMat = new THREE.MeshStandardMaterial({ 
        color: b.neonColor, 
        emissive: b.neonColor, 
        emissiveIntensity: 0.5 
      });
      const npcPantsMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.6 });

      // NPC Head with Smile Face
      const npcFaceCanvas = document.createElement('canvas');
      npcFaceCanvas.width = 128;
      npcFaceCanvas.height = 128;
      const nfctx = npcFaceCanvas.getContext('2d');
      if (nfctx) {
        nfctx.fillStyle = '#FAD090';
        nfctx.fillRect(0, 0, 128, 128);
        nfctx.fillStyle = '#0F172A';
        // Friendly Eyes
        nfctx.fillRect(30, 42, 16, 22);
        nfctx.fillRect(82, 42, 16, 22);
        // Catchlight
        nfctx.fillStyle = '#FFFFFF';
        nfctx.fillRect(38, 44, 6, 8);
        nfctx.fillRect(90, 44, 6, 8);
        // Smile
        nfctx.strokeStyle = '#0F172A';
        nfctx.beginPath();
        nfctx.arc(64, 82, 18, 0.1 * Math.PI, 0.9 * Math.PI);
        nfctx.lineWidth = 6;
        nfctx.stroke();
      }
      const npcFaceTexture = new THREE.CanvasTexture(npcFaceCanvas);
      const npcHeadMatArray = [
        npcSkinMat, npcSkinMat, npcSkinMat, npcSkinMat,
        new THREE.MeshStandardMaterial({ map: npcFaceTexture }),
        npcSkinMat
      ];

      const npcHead = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), npcHeadMatArray);
      npcHead.position.y = 1.62;
      npcHead.castShadow = true;
      npcGroup.add(npcHead);

      // NPC Floating Nametag Billboard above head
      const nameCanvas = document.createElement('canvas');
      nameCanvas.width = 320;
      nameCanvas.height = 100;
      const nctx = nameCanvas.getContext('2d');
      if (nctx) {
        nctx.fillStyle = '#080C14';
        nctx.fillRect(0, 0, 320, 100);
        nctx.strokeStyle = `#${b.neonColor.toString(16).padStart(6, '0')}`;
        nctx.lineWidth = 5;
        nctx.strokeRect(4, 4, 312, 92);

        nctx.fillStyle = '#FFFFFF';
        nctx.font = 'bold 26px sans-serif';
        nctx.textAlign = 'center';
        nctx.fillText(b.npcName, 160, 42);

        nctx.fillStyle = `#${b.neonColor.toString(16).padStart(6, '0')}`;
        nctx.font = 'bold 18px monospace';
        nctx.fillText(b.npcRole.split('—')[0].trim(), 160, 78);
      }
      const nameTexture = new THREE.CanvasTexture(nameCanvas);
      const nameMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 0.75),
        new THREE.MeshBasicMaterial({ map: nameTexture, side: THREE.DoubleSide })
      );
      nameMesh.position.set(0, 2.35, 0);
      npcGroup.add(nameMesh);

      // NPC Torso (Suit / Uniform)
      const npcTorso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 0.52), npcShirtMat);
      npcTorso.position.y = 0.82;
      npcTorso.castShadow = true;
      npcGroup.add(npcTorso);

      // Tie / Badge on chest
      const npcTie = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.05), npcNeonMat);
      npcTie.position.set(0, 0.9, 0.28);
      npcGroup.add(npcTie);

      // NPC Arms (Left arm can wave)
      const npcArmGeo = new THREE.BoxGeometry(0.35, 0.95, 0.42);
      const npcLeftArm = new THREE.Mesh(npcArmGeo, npcShirtMat);
      npcLeftArm.position.set(-0.68, 0.82, 0);
      npcLeftArm.castShadow = true;
      npcGroup.add(npcLeftArm);

      const npcRightArm = new THREE.Mesh(npcArmGeo, npcShirtMat);
      npcRightArm.position.set(0.68, 0.82, 0);
      npcRightArm.castShadow = true;
      npcGroup.add(npcRightArm);

      // NPC Legs
      const npcLegGeo = new THREE.BoxGeometry(0.42, 0.85, 0.42);
      const npcLeftLeg = new THREE.Mesh(npcLegGeo, npcPantsMat);
      npcLeftLeg.position.set(-0.23, -0.05, 0);
      npcGroup.add(npcLeftLeg);

      const npcRightLeg = new THREE.Mesh(npcLegGeo, npcPantsMat);
      npcRightLeg.position.set(0.23, -0.05, 0);
      npcGroup.add(npcRightLeg);

      // Position NPC in world
      const worldNpcX = b.position[0] + npcOffsetX;
      const worldNpcZ = b.position[2] + npcOffsetZ;
      npcGroup.position.set(worldNpcX, 0, worldNpcZ);
      npcGroup.rotation.y = npcRotationY;
      scene.add(npcGroup);

      npcsList.push({
        id: b.id,
        building: b,
        waveArm: npcLeftArm,
        pos: new THREE.Vector3(worldNpcX, 0, worldNpcZ)
      });
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

    const lightCoords = [
      [-6, -6], [6, -6], [-6, 6], [6, 6],
      [-6, -18], [6, -18], [-6, 18], [6, 18],
      [-24, -6], [-24, 6], [24, -6], [24, 6]
    ];
    lightCoords.forEach(([lx, lz]) => addStreetLight(lx, lz));

    // =========================================================
    // LIVING CITY: HOVER CARS, FLYING DRONE & AMBIENT PARTICLES
    // =========================================================
    const hoverCars: { mesh: THREE.Group; axis: 'x' | 'z'; dir: number; speed: number; min: number; max: number }[] = [];

    const createHoverCar = (color: number, lightColor: number) => {
      const car = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.45, 2.8),
        new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.8 })
      );
      body.position.y = 0.55;
      car.add(body);

      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.35, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x0A0F1D, roughness: 0.1 })
      );
      glass.position.set(0, 0.85, -0.2);
      car.add(glass);

      const lightGeo = new THREE.BoxGeometry(0.35, 0.12, 0.05);
      const headL = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: lightColor }));
      headL.position.set(-0.5, 0.55, -1.41);
      const headR = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: lightColor }));
      headR.position.set(0.5, 0.55, -1.41);
      car.add(headL, headR);

      const tailL = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xFF0055 }));
      tailL.position.set(-0.5, 0.55, 1.41);
      const tailR = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xFF0055 }));
      tailR.position.set(0.5, 0.55, 1.41);
      car.add(tailL, tailR);

      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 2.4),
        new THREE.MeshBasicMaterial({ color: lightColor, transparent: true, opacity: 0.45 })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.08;
      car.add(glow);

      return car;
    };

    const car1 = createHoverCar(0x0F2838, 0x00E5FF);
    car1.position.set(-8, 0, -35);
    scene.add(car1);
    hoverCars.push({ mesh: car1, axis: 'z', dir: 1, speed: 0.30, min: -42, max: 42 });

    const car2 = createHoverCar(0x380F28, 0xFF0077);
    car2.position.set(8, 0, 35);
    car2.rotation.y = Math.PI;
    scene.add(car2);
    hoverCars.push({ mesh: car2, axis: 'z', dir: -1, speed: 0.28, min: -42, max: 42 });

    const car3 = createHoverCar(0x35250A, 0xF59E0B);
    car3.position.set(-35, 0, 32);
    car3.rotation.y = Math.PI / 2;
    scene.add(car3);
    hoverCars.push({ mesh: car3, axis: 'x', dir: 1, speed: 0.26, min: -42, max: 42 });

    // Flying AI Drone in city skyline
    const droneGroup = new THREE.Group();
    const droneBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.22, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.3 })
    );
    droneGroup.add(droneBody);

    const ringGeo = new THREE.RingGeometry(0.25, 0.38, 12);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, side: THREE.DoubleSide });
    [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].forEach(([rx, rz]) => {
      const r = new THREE.Mesh(ringGeo, ringMat);
      r.rotation.x = Math.PI / 2;
      r.position.set(rx, 0.1, rz);
      droneGroup.add(r);
    });

    const droneLight = new THREE.PointLight(0x00E5FF, 1.2, 14);
    droneLight.position.set(0, -0.3, 0);
    droneGroup.add(droneLight);

    droneGroup.position.set(0, 11, 0);
    scene.add(droneGroup);

    // Atmospheric Floating Cyber Sparks
    const particleCount = 70;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 80;
      particlePositions[i * 3 + 1] = 0.5 + Math.random() * 12;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00E5FF,
      size: 0.25,
      transparent: true,
      opacity: 0.6
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Playable Roblox Player Character Rig
    const playerGroup = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFAD090, roughness: 0.5 });
    const hoodieMat = new THREE.MeshStandardMaterial({ color: 0x111625, roughness: 0.4 });
    const cyanNeonMat = new THREE.MeshStandardMaterial({ color: 0x00E5FF, emissive: 0x00A2FF, emissiveIntensity: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0B0F19, roughness: 0.6 });

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

    // Headphones
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

    // Torso
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

    // Floating AI Orb
    const orbGeo = new THREE.IcosahedronGeometry(0.18, 1);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x00E5FF, wireframe: true });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(0.9, 1.9, -0.4);
    playerGroup.add(orb);

    playerGroup.position.set(0, 1.35, 6);
    scene.add(playerGroup);

    playerTeleportRef.current = (tx: number, tz: number) => {
      playerGroup.position.x = tx;
      playerGroup.position.z = tz;
      playerGroup.position.y = 1.35;
    };

    // Camera Orbit & Zoom State (Google Maps style)
    let cameraAngle = 0; // Azimuth yaw (0 = North)
    let targetCameraAngle = 0;

    let cameraPitch = isMobile ? 0.44 : 0.40; // Elevation pitch
    let targetCameraPitch = isMobile ? 0.44 : 0.40;

    let cameraDistance = isMobile ? 12.0 : 9.5; // Zoom distance
    let targetCameraDistance = isMobile ? 12.0 : 9.5;

    const MIN_DISTANCE = 4.5;
    const MAX_DISTANCE = 32.0;
    const MIN_PITCH = 0.15;
    const MAX_PITCH = 0.88;

    rotateCameraRef.current = (delta: number) => {
      targetCameraAngle += delta;
    };
    resetCameraRef.current = () => {
      targetCameraAngle = 0;
      targetCameraPitch = isMobile ? 0.44 : 0.40;
      targetCameraDistance = isMobile ? 12.0 : 9.5;
    };

    // Mouse & Touch Orbit / Pinch Controls (Google Maps style)
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastPinchDist = 0;

    // Desktop Mouse Drag
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only left-click
      isDragging = true;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;

      targetCameraAngle -= dx * 0.007;
      targetCameraPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, targetCameraPitch + dy * 0.005));
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Desktop Mouse Wheel Zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.015;
      targetCameraDistance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, targetCameraDistance + zoomDelta));
    };

    // Mobile Touch Drag & Pinch-to-Zoom
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        lastPointerX = e.touches[0].clientX;
        lastPointerY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        isDragging = false;
        lastPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        if (e.cancelable) e.preventDefault();
        const dx = e.touches[0].clientX - lastPointerX;
        const dy = e.touches[0].clientY - lastPointerY;
        lastPointerX = e.touches[0].clientX;
        lastPointerY = e.touches[0].clientY;

        targetCameraAngle -= dx * 0.008;
        targetCameraPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, targetCameraPitch + dy * 0.006));
      } else if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastPinchDist > 0) {
          const pinchDelta = (lastPinchDist - dist) * 0.05;
          targetCameraDistance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, targetCameraDistance + pinchDelta));
        }
        lastPinchDist = dist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isDragging = false;
        lastPinchDist = 0;
      } else if (e.touches.length === 1) {
        lastPointerX = e.touches[0].clientX;
        lastPointerY = e.touches[0].clientY;
        isDragging = true;
        lastPinchDist = 0;
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchEnd, { passive: true });

    // Movement Physics & State
    const keys: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key.toLowerCase()] = true;
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
    let stepTimer = 0;

    const checkNearestBuilding = (px: number, pz: number): CityBuilding | null => {
      for (const b of portfolioProjects) {
        const dist = Math.hypot(px - b.position[0], pz - b.position[2]);
        const triggerDistance = Math.max(b.width, b.depth) / 2 + 4.2;
        if (dist < triggerDistance) {
          return b;
        }
      }
      return null;
    };

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

      // Camera-relative horizontal vectors (Right on D-Pad is always right on screen, Up is always up into screen)
      const forwardX = -Math.sin(cameraAngle);
      const forwardZ = -Math.cos(cameraAngle);
      const rightX = Math.cos(cameraAngle);
      const rightZ = -Math.sin(cameraAngle);

      let moveDirX = 0;
      let moveDirZ = 0;
      if (forward) {
        moveDirX += forwardX;
        moveDirZ += forwardZ;
      }
      if (backward) {
        moveDirX -= forwardX;
        moveDirZ -= forwardZ;
      }
      if (left) {
        moveDirX -= rightX;
        moveDirZ -= rightZ;
      }
      if (right) {
        moveDirX += rightX;
        moveDirZ += rightZ;
      }

      const isMoving = moveDirX !== 0 || moveDirZ !== 0;

      if (isMoving) {
        const len = Math.hypot(moveDirX, moveDirZ);
        const normX = (moveDirX / len) * moveSpeed;
        const normZ = (moveDirZ / len) * moveSpeed;

        playerGroup.position.x += normX;
        playerGroup.position.z += normZ;

        const targetAngle = Math.atan2(normX, normZ);
        playerGroup.rotation.y = targetAngle;

        walkCycle += delta * 15;
        leftLeg.rotation.x = Math.sin(walkCycle) * 0.7;
        rightLeg.rotation.x = -Math.sin(walkCycle) * 0.7;
        leftArm.rotation.x = -Math.sin(walkCycle) * 0.7;
        rightArm.rotation.x = Math.sin(walkCycle) * 0.7;

        // Footstep sound cadence
        stepTimer += delta;
        if (stepTimer >= 0.32) {
          stepTimer = 0;
          soundEngine.playFootstep();
        }
      } else {
        stepTimer = 0.28;
        walkCycle = 0;
        leftLeg.rotation.x *= 0.8;
        rightLeg.rotation.x *= 0.8;
        leftArm.rotation.x = Math.sin(elapsedTime * 2) * 0.08;
        rightArm.rotation.x = -Math.sin(elapsedTime * 2) * 0.08;
      }

      // Jump
      if (jump && playerGroup.position.y <= 1.36) {
        velocityY = jumpStrength;
        soundEngine.playJump();
      }
      playerGroup.position.y += velocityY;
      velocityY += gravity;

      if (playerGroup.position.y < 1.35) {
        playerGroup.position.y = 1.35;
        velocityY = 0;
      }

      playerGroup.position.x = Math.max(-48, Math.min(48, playerGroup.position.x));
      playerGroup.position.z = Math.max(-48, Math.min(48, playerGroup.position.z));

      // AI Orb & Central Monument
      orb.position.y = 1.8 + Math.sin(elapsedTime * 3) * 0.2;
      orb.rotation.y += 0.04;
      monument.rotation.y += 0.01;

      // Animate Living City: Hover Cars
      hoverCars.forEach(car => {
        if (car.axis === 'z') {
          car.mesh.position.z += car.speed * car.dir;
          if (car.dir > 0 && car.mesh.position.z > car.max) car.mesh.position.z = car.min;
          if (car.dir < 0 && car.mesh.position.z < car.min) car.mesh.position.z = car.max;
        } else {
          car.mesh.position.x += car.speed * car.dir;
          if (car.dir > 0 && car.mesh.position.x > car.max) car.mesh.position.x = car.min;
          if (car.dir < 0 && car.mesh.position.x < car.min) car.mesh.position.x = car.max;
        }
        car.mesh.position.y = 0.45 + Math.sin(elapsedTime * 6 + car.speed * 10) * 0.05;
      });

      // Animate Living City: Flying AI Drone
      droneGroup.position.x = Math.sin(elapsedTime * 0.35) * 24;
      droneGroup.position.z = Math.cos(elapsedTime * 0.35) * 19;
      droneGroup.position.y = 11 + Math.sin(elapsedTime * 1.5) * 0.6;
      droneGroup.rotation.y = elapsedTime * 0.35 + Math.PI / 2;

      // Animate Living City: Floating Cyber Sparks
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        let py = posAttr.getY(i) + 0.015;
        if (py > 13) py = 0.5;
        posAttr.setY(i, py);
      }
      posAttr.needsUpdate = true;

      // Animate NPCs: Waving arm & breathing when player approaches
      npcsList.forEach(npc => {
        const dist = Math.hypot(playerGroup.position.x - npc.pos.x, playerGroup.position.z - npc.pos.z);
        if (dist < 7.5) {
          // Waving hand
          npc.waveArm.rotation.x = -Math.PI / 2 + Math.sin(elapsedTime * 8) * 0.4;
          npc.waveArm.rotation.z = Math.sin(elapsedTime * 6) * 0.25;
        } else {
          npc.waveArm.rotation.x = Math.sin(elapsedTime * 1.5) * 0.06;
          npc.waveArm.rotation.z = 0;
        }
      });

      // Coordinates
      setPlayerCoord({
        x: Math.round(playerGroup.position.x * 10) / 10,
        z: Math.round(playerGroup.position.z * 10) / 10
      });

      // Proximity check for NPC Dialogue
      const near = checkNearestBuilding(playerGroup.position.x, playerGroup.position.z);
      if (near) {
        if (near.id !== dismissedIdRef.current) {
          if (!activeDialogueRef.current || activeDialogueRef.current.id !== near.id) {
            soundEngine.playProximityChime();
          }
          setActiveDialogue(near);
        }
      } else {
        setActiveDialogue(null);
        setDismissedId(null);
      }

      // Smooth Camera Interpolation (Google Maps Orbit & Zoom)
      cameraAngle += (targetCameraAngle - cameraAngle) * 0.12;
      cameraPitch += (targetCameraPitch - cameraPitch) * 0.12;
      cameraDistance += (targetCameraDistance - cameraDistance) * 0.12;

      const cosP = Math.cos(cameraPitch);
      const sinP = Math.sin(cameraPitch);
      const camOffsetX = -Math.sin(cameraAngle) * cosP * cameraDistance;
      const camOffsetZ = Math.cos(cameraAngle) * cosP * cameraDistance;
      const camOffsetY = sinP * cameraDistance + 1.2;

      const targetCamPos = new THREE.Vector3(
        playerGroup.position.x + camOffsetX,
        playerGroup.position.y + camOffsetY,
        playerGroup.position.z + camOffsetZ
      );

      camera.position.lerp(targetCamPos, 0.14);
      camera.lookAt(playerGroup.position.x, playerGroup.position.y + 1.0, playerGroup.position.z);

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const isMob = checkIsMobile();
      camera.fov = isMob ? 65 : 52;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ========================================================= */}
      {/* MOBILE RADAR TOGGLE BUTTON (COMPACT PILL IN TOP-LEFT) */}
      {/* ========================================================= */}
      <div className="sm:hidden absolute top-14 left-3 z-30 pointer-events-auto">
        <button
          onClick={() => setMobileRadarOpen(!mobileRadarOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold shadow-lg cursor-pointer active:scale-95"
        >
          <Compass className={`w-3.5 h-3.5 text-cyan-400 ${mobileRadarOpen ? 'rotate-180' : ''}`} />
          <span>{mobileRadarOpen ? 'Tutup Peta ✕' : 'Peta Radar (10)'}</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* ROBLOX HUD OVERLAY: RADAR MINI-MAP & METRICS (DESKTOP) */}
      {/* ========================================================= */}
      <div className="hidden sm:block absolute top-16 left-4 z-30 pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-xl space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between gap-3 text-[11px] font-mono text-cyan-400 font-bold">
            <div className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>RADAR KOTA FARGAN</span>
            </div>
            <span className="text-[10px] text-slate-400">10 KARYA</span>
          </div>

          <div className="relative w-36 h-36 rounded-xl bg-slate-900/90 border border-cyan-500/30 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,162,255,0.15)_0%,transparent_70%)]" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/20" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/20" />
            <div className="absolute w-24 h-24 rounded-full border border-cyan-500/20" />

            {portfolioProjects.map(b => {
              const mapX = 72 + (b.position[0] / 48) * 60;
              const mapY = 72 + (b.position[2] / 48) * 60;
              const isNear = activeDialogue?.id === b.id;
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
      {/* MOBILE RADAR DROPDOWN MODAL */}
      {/* ========================================================= */}
      {mobileRadarOpen && (
        <div className="sm:hidden absolute top-24 left-3 right-3 z-40 bg-slate-950/95 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/40 shadow-2xl space-y-3 animate-fade-in pointer-events-auto">
          <div className="flex items-center justify-between text-xs font-mono text-cyan-300 font-bold border-b border-white/10 pb-2">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>RADAR KOTA (10 KARYA)</span>
            </div>
            <button
              onClick={() => setMobileRadarOpen(false)}
              className="text-slate-400 hover:text-white p-1 font-bold text-sm"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-44 h-44 rounded-2xl bg-slate-900 border border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,162,255,0.18)_0%,transparent_70%)]" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/20" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/20" />
              <div className="absolute w-32 h-32 rounded-full border border-cyan-500/20" />

              {portfolioProjects.map(b => {
                const mapX = 88 + (b.position[0] / 48) * 75;
                const mapY = 88 + (b.position[2] / 48) * 75;
                const isNear = activeDialogue?.id === b.id;
                return (
                  <div
                    key={b.id}
                    title={b.name}
                    className={`absolute w-3 h-3 rounded-sm -translate-x-1/2 -translate-y-1/2 transition-all ${
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

              <div 
                className="absolute w-3.5 h-3.5 rounded-full bg-cyan-400 ring-4 ring-cyan-400/40 -translate-x-1/2 -translate-y-1/2 shadow-lg"
                style={{
                  left: `${88 + (playerCoord.x / 48) * 75}px`,
                  top: `${88 + (playerCoord.z / 48) * 75}px`
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pt-1">
            {portfolioProjects.map(b => (
              <button
                key={b.id}
                onClick={() => {
                  if (playerTeleportRef.current) {
                    playerTeleportRef.current(b.position[0], b.position[2] + (b.position[2] < 0 ? 5 : -5));
                  }
                  setMobileRadarOpen(false);
                  setDismissedId(null);
                  setActiveDialogue(b);
                }}
                className="p-1.5 rounded-lg bg-slate-900 border border-white/5 text-left flex items-center gap-1.5 text-[10px] text-slate-300 active:bg-cyan-500/20"
              >
                <span 
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `#${b.neonColor.toString(16).padStart(6, '0')}` }}
                />
                <span className="truncate">{b.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* QUICK TELEPORT DIRECTORY (DESKTOP) */}
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
                setDismissedId(null);
                setActiveDialogue(b);
              }}
              className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                activeDialogue?.id === b.id
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
      {/* RPG TYPEWRITER DIALOGUE BOX WITH CS NPC AVATAR */}
      {/* ========================================================= */}
      {activeDialogue && (
        <div className="absolute bottom-40 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 w-[94vw] sm:w-[620px] max-w-full pointer-events-auto animate-fade-in">
          <div 
            className="roblox-panel p-4 sm:p-5 border-2 shadow-2xl bg-slate-950/95 backdrop-blur-xl rounded-3xl space-y-3"
            style={{ borderColor: `#${activeDialogue.neonColor.toString(16).padStart(6, '0')}` }}
          >
            {/* NPC Header & Nametag */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-3">
                {/* 3D NPC Head Avatar Badge */}
                <div 
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-slate-950 font-black text-lg shadow-lg flex-shrink-0 border border-white/20"
                  style={{ backgroundColor: `#${activeDialogue.neonColor.toString(16).padStart(6, '0')}` }}
                >
                  <MessageSquare className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-white">{activeDialogue.npcName}</span>
                    <span 
                      className="text-[9px] sm:text-[10px] font-mono px-2 py-0.2 rounded-full font-bold"
                      style={{ 
                        backgroundColor: `#${activeDialogue.neonColor.toString(16).padStart(6, '0')}22`,
                        color: `#${activeDialogue.neonColor.toString(16).padStart(6, '0')}`,
                        border: `1px solid #${activeDialogue.neonColor.toString(16).padStart(6, '0')}55`
                      }}
                    >
                      {activeDialogue.badge}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-cyan-300 font-mono mt-0.5">{activeDialogue.npcRole}</p>
                </div>
              </div>

              {/* Sound & Close Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDialogueSfxEnabled(!dialogueSfxEnabled)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Toggle Suara Ketikan"
                >
                  {dialogueSfxEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => {
                    setDismissedId(activeDialogue.id);
                    setActiveDialogue(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer font-bold text-sm"
                  title="Tutup Percakapan"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Typewriter Dialogue Speech Bubble */}
            <div 
              onClick={() => {
                // Click bubble to instantly reveal full text
                setDisplayedText(activeDialogue.dialogueText);
                setIsTypingDone(true);
              }}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/5 cursor-pointer relative min-h-[64px]"
            >
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {displayedText}
                {!isTypingDone && (
                  <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                onClick={() => onBuildingSelect(activeDialogue)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all active:scale-95"
              >
                📋 Spesifikasi Gedung
              </button>

              <a
                href={activeDialogue.url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl font-black text-xs text-slate-950 flex items-center gap-1.5 shadow-lg transition-all active:scale-95 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, #${activeDialogue.neonColor.toString(16).padStart(6, '0')}, #38bdf8)`
                }}
              >
                <span>BUKA WEBSITE LIVE ➔</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => {
                  setDismissedId(activeDialogue.id);
                  setActiveDialogue(null);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
              >
                Permisi ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONTROLS & GESTURE HINT NOTIFICATION */}
      {/* ========================================================= */}
      {controlsHintVisible && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[92vw]">
          <div className="bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/30 shadow-xl flex items-center gap-2 text-[11px] text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 animate-pulse" />
            <span className="truncate">
              Geser layar untuk putar sudut 360° • Cubit layar untuk zoom (seperti Google Maps)
            </span>
            <button 
              onClick={() => setControlsHintVisible(false)}
              className="text-slate-400 hover:text-white ml-1 cursor-pointer font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* COMPACT CAMERA ROTATE & COMPASS HELPER (TOP-RIGHT) */}
      {/* ========================================================= */}
      <div className="absolute top-14 right-3 sm:top-16 sm:right-60 z-30 pointer-events-auto flex items-center gap-1 bg-slate-950/85 backdrop-blur-md px-2 py-1.5 rounded-full border border-cyan-500/30 shadow-xl">
        <button
          onClick={() => rotateCameraRef.current?.(-Math.PI / 4)}
          className="p-1.5 rounded-full bg-slate-900/90 text-slate-300 hover:text-white active:bg-cyan-500 active:text-slate-950 transition-colors active:scale-95 cursor-pointer shadow"
          title="Putar Kamera ke Kiri (45°)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => resetCameraRef.current?.()}
          className="px-2.5 py-1 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-bold active:scale-95 cursor-pointer flex items-center gap-1 shadow"
          title="Reset Sudut Pandang (Arah Utara)"
        >
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>Utara</span>
        </button>
        <button
          onClick={() => rotateCameraRef.current?.(Math.PI / 4)}
          className="p-1.5 rounded-full bg-slate-900/90 text-slate-300 hover:text-white active:bg-cyan-500 active:text-slate-950 transition-colors active:scale-95 cursor-pointer shadow"
          title="Putar Kamera ke Kanan (45°)"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ========================================================= */}
      {/* MOBILE TOUCH CONTROLS (VIRTUAL D-PAD & JUMP - COMPACT & ELEVATED) */}
      {/* ========================================================= */}
      <div className="sm:hidden absolute bottom-7 left-4 z-40 pointer-events-auto">
        <div className="grid grid-cols-3 gap-1 w-28 h-28 p-1 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-cyan-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.85)]">
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.forward = true; }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.forward = false; }}
            onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.forward = false; }}
            onMouseDown={() => { mobileInputRef.current.forward = true; }}
            onMouseUp={() => { mobileInputRef.current.forward = false; }}
            onMouseLeave={() => { mobileInputRef.current.forward = false; }}
            className="flex items-center justify-center rounded-lg bg-slate-900/95 border border-white/10 active:bg-cyan-400 text-cyan-300 active:text-slate-950 shadow transition-all active:scale-95 touch-none"
            aria-label="Maju"
          >
            <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <div />

          <button
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.left = true; }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.left = false; }}
            onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.left = false; }}
            onMouseDown={() => { mobileInputRef.current.left = true; }}
            onMouseUp={() => { mobileInputRef.current.left = false; }}
            onMouseLeave={() => { mobileInputRef.current.left = false; }}
            className="flex items-center justify-center rounded-lg bg-slate-900/95 border border-white/10 active:bg-cyan-400 text-cyan-300 active:text-slate-950 shadow transition-all active:scale-95 touch-none"
            aria-label="Kiri"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <div className="flex items-center justify-center text-[8px] text-cyan-400/80 font-mono font-bold tracking-wider">
            MOVE
          </div>
          <button
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.right = true; }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.right = false; }}
            onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.right = false; }}
            onMouseDown={() => { mobileInputRef.current.right = true; }}
            onMouseUp={() => { mobileInputRef.current.right = false; }}
            onMouseLeave={() => { mobileInputRef.current.right = false; }}
            className="flex items-center justify-center rounded-lg bg-slate-900/95 border border-white/10 active:bg-cyan-400 text-cyan-300 active:text-slate-950 shadow transition-all active:scale-95 touch-none"
            aria-label="Kanan"
          >
            <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
          </button>

          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.backward = true; }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.backward = false; }}
            onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.backward = false; }}
            onMouseDown={() => { mobileInputRef.current.backward = true; }}
            onMouseUp={() => { mobileInputRef.current.backward = false; }}
            onMouseLeave={() => { mobileInputRef.current.backward = false; }}
            className="flex items-center justify-center rounded-lg bg-slate-900/95 border border-white/10 active:bg-cyan-400 text-cyan-300 active:text-slate-950 shadow transition-all active:scale-95 touch-none"
            aria-label="Mundur"
          >
            <ArrowDown className="w-5 h-5" strokeWidth={2.5} />
          </button>
          <div />
        </div>
      </div>

      {/* Mobile Jump Button - Compact & Elevated */}
      <div className="sm:hidden absolute bottom-7 right-4 z-40 pointer-events-auto">
        <button
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.jump = true; }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.jump = false; }}
          onTouchCancel={(e) => { e.preventDefault(); e.stopPropagation(); mobileInputRef.current.jump = false; }}
          onMouseDown={() => { mobileInputRef.current.jump = true; }}
          onMouseUp={() => { mobileInputRef.current.jump = false; }}
          onMouseLeave={() => { mobileInputRef.current.jump = false; }}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-500 text-slate-950 font-black text-[11px] shadow-[0_8px_25px_rgba(0,229,255,0.4)] flex flex-col items-center justify-center gap-0.5 border-2 border-white/40 active:scale-90 transition-transform touch-none cursor-pointer"
          aria-label="Lompat"
        >
          <Footprints className="w-4 h-4" />
          <span>JUMP</span>
        </button>
      </div>
    </div>
  );
};
