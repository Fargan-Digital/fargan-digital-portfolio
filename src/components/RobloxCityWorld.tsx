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
  Navigation,
  MessageCircle
} from 'lucide-react';
import { portfolioProjects, type CityBuilding } from '../data/portfolioProjects';
import { soundEngine } from '../utils/audioManager';
import { 
  translations, 
  type Language, 
  type DayNightMode, 
  type CharacterGender 
} from '../utils/translations';

export { type CityBuilding } from '../data/portfolioProjects';

interface RobloxCityWorldProps {
  onBuildingSelect: (building: CityBuilding) => void;
  targetBuildingId?: string | null;
  projects?: CityBuilding[];
  lang?: Language;
  mode?: DayNightMode;
  gender?: CharacterGender;
  onToggleLang?: () => void;
  onToggleMode?: () => void;
  onToggleGender?: () => void;
}

export const RobloxCityWorld: React.FC<RobloxCityWorldProps> = ({ 
  onBuildingSelect,
  targetBuildingId,
  projects,
  lang = 'id',
  mode = 'night',
  gender = 'male'
}) => {
  const t = translations[lang];
  const currentProjects = projects && projects.length > 0 ? projects : portfolioProjects;
  const currentProjectsRef = useRef(currentProjects);
  currentProjectsRef.current = currentProjects;
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

  // Exact CS Circle Positions Ref (for pinpoint trigger & teleports)
  const csSpotsRef = useRef<Map<string, { x: number; z: number }>>(new Map());

  // Camera Orbit & Reset Control Refs (Google Maps style)
  const rotateCameraRef = useRef<((delta: number) => void) | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);

  // Mobile controller touch states
  const mobileInputRef = useRef({ forward: false, backward: false, left: false, right: false, jump: false });

  // Three.js dynamic refs for Day/Night and Character Gender
  const sceneRef = useRef<THREE.Scene | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const groundMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const roadMatRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const maleRigRef = useRef<THREE.Group | null>(null);
  const femaleRigRef = useRef<THREE.Group | null>(null);
  const orbMatRef = useRef<THREE.MeshBasicMaterial | null>(null);

  // Update Day / Night Mode dynamically without remounting Three.js scene
  useEffect(() => {
    if (!sceneRef.current || !dirLightRef.current || !ambientLightRef.current || !groundMatRef.current || !roadMatRef.current) return;
    const isDay = mode === 'day';
    sceneRef.current.background = new THREE.Color(isDay ? 0x38bdf8 : 0x060911);
    sceneRef.current.fog = new THREE.FogExp2(isDay ? 0xbae6fd : 0x060911, isDay ? 0.012 : 0.015);
    dirLightRef.current.color.setHex(isDay ? 0xfff7ed : 0x38bdf8);
    dirLightRef.current.intensity = isDay ? 3.2 : 2.2;
    ambientLightRef.current.intensity = isDay ? 2.4 : 1.3;
    groundMatRef.current.color.setHex(isDay ? 0x334155 : 0x090D16);
    roadMatRef.current.color.setHex(isDay ? 0x1e293b : 0x0e1422);
  }, [mode]);

  // Update Male / Female Rig visibility dynamically without resetting position
  useEffect(() => {
    if (maleRigRef.current && femaleRigRef.current) {
      maleRigRef.current.visible = gender === 'male';
      femaleRigRef.current.visible = gender === 'female';
    }
    if (orbMatRef.current) {
      orbMatRef.current.color.setHex(gender === 'female' ? 0xEC4899 : 0x00E5FF);
    }
  }, [gender]);

  // Web Audio Typewriter Click SFX
  const playTypewriterClick = useCallback(() => {
    if (!dialogueSfxEnabled) return;
    soundEngine.playTypewriterBlip();
  }, [dialogueSfxEnabled]);

  // Handle Typewriter Text Animation with Bilingual Support
  useEffect(() => {
    if (!activeDialogue) {
      setDisplayedText('');
      setIsTypingDone(false);
      return;
    }

    const fullText = (lang === 'en' && activeDialogue.dialogueTextEn) 
      ? activeDialogue.dialogueTextEn 
      : activeDialogue.dialogueText;
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
  }, [activeDialogue, lang, playTypewriterClick]);

  // Handle external teleport if targetBuildingId provided
  useEffect(() => {
    if (targetBuildingId && playerTeleportRef.current) {
      const b = currentProjectsRef.current.find(item => item.id === targetBuildingId);
      if (b) {
        const spot = csSpotsRef.current.get(b.id) || { 
          x: b.position[0], 
          z: b.position[2] + (b.position[2] < 0 ? 5 : -5) 
        };
        playerTeleportRef.current(spot.x, spot.z);
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
    const isDay = mode === 'day';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDay ? 0x38bdf8 : 0x060911);
    scene.fog = new THREE.FogExp2(isDay ? 0xbae6fd : 0x060911, isDay ? 0.012 : 0.015);
    sceneRef.current = scene;

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
    const ambient = new THREE.AmbientLight(0xffffff, isDay ? 2.4 : 1.3);
    scene.add(ambient);
    ambientLightRef.current = ambient;

    const dirLight = new THREE.DirectionalLight(isDay ? 0xfff7ed : 0x38bdf8, isDay ? 3.2 : 2.2);
    dirLight.position.set(25, 50, 25);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 3. Ground & Cyber Road System
    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({ color: isDay ? 0x334155 : 0x090D16, roughness: 0.85 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    groundMatRef.current = groundMat;

    const grid = new THREE.GridHelper(120, 60, 0x00A2FF, 0x142236);
    grid.position.y = 0.02;
    scene.add(grid);

    const roadMat = new THREE.MeshStandardMaterial({ color: isDay ? 0x1e293b : 0x0e1422, roughness: 0.7 });
    roadMatRef.current = roadMat;

    const createRoad = (width: number, length: number, x: number, z: number, rotate = false) => {
      const road = new THREE.Mesh(new THREE.PlaneGeometry(width, length), roadMat);
      road.rotation.x = -Math.PI / 2;
      if (rotate) road.rotation.z = Math.PI / 2;
      road.position.set(x, 0.03, z);
      road.receiveShadow = true;
      scene.add(road);
    };

    // Central Boulevard (N-S): x = 0, width 8, runs from Fargan Tower plaza (z = -29) to southern edge (z = +33)
    createRoad(8, 62, 0, 2);
    // West Avenue (N-S): x = -21, width 6, runs from z = -38 to z = +34
    createRoad(6, 72, -21, -2);
    // East Avenue (N-S): x = +21, width 6, runs from z = -38 to z = +34
    createRoad(6, 72, 21, -2);
    // North Crossroad (E-W): z = -12, width 6, runs from x = -36 to x = +36
    createRoad(6, 72, 0, -12, true);
    // South Crossroad (E-W): z = +14, width 6, runs from x = -36 to x = +36
    createRoad(6, 72, 0, 14, true);

    // Central Plaza circle
    const plazaGeo = new THREE.CircleGeometry(9, 32);
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

    // Array to track NPCs and CS circles for animation & pinpoint proximity
    const npcsList: { 
      id: string; 
      building: CityBuilding; 
      waveArm: THREE.Mesh; 
      pos: THREE.Vector3 
    }[] = [];
    const csSpots = new Map<string, { x: number; z: number }>();
    const csBeacons: THREE.Mesh[] = [];

    // 4. Construct City Buildings + 3D NPCs in front
    currentProjectsRef.current.forEach(b => {
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

      // Special Iconic 3D Multi-Tier Architecture for Central Tower
      if (b.id === 'fargan-tower') {
        // Tier 2: Middle Executive Tower
        const midGeo = new THREE.BoxGeometry(12, 10, 8);
        const midMat = new THREE.MeshStandardMaterial({ color: 0x07111e, roughness: 0.2, metalness: 0.4 });
        const midMesh = new THREE.Mesh(midGeo, midMat);
        midMesh.position.y = 19;
        midMesh.castShadow = true;
        bGroup.add(midMesh);

        const midEdges = new THREE.EdgesGeometry(midGeo);
        const midLines = new THREE.LineSegments(midEdges, lineMat);
        midLines.position.y = 19;
        bGroup.add(midLines);

        // Tier 3: Penthouse Crown
        const crownGeo = new THREE.BoxGeometry(8, 6, 6);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x0a1628, roughness: 0.15, metalness: 0.5 });
        const crownMesh = new THREE.Mesh(crownGeo, crownMat);
        crownMesh.position.y = 27;
        crownMesh.castShadow = true;
        bGroup.add(crownMesh);

        const crownEdges = new THREE.EdgesGeometry(crownGeo);
        const crownLines = new THREE.LineSegments(crownEdges, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 }));
        crownLines.position.y = 27;
        bGroup.add(crownLines);

        // Towering Cyber Spire Antenna & Beacon
        const spireGeo = new THREE.CylinderGeometry(0.12, 0.45, 8, 8);
        const spireMat = new THREE.MeshStandardMaterial({ 
          color: 0x00E5FF, 
          emissive: 0x00A2FF, 
          emissiveIntensity: 0.8 
        });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.y = 34;
        bGroup.add(spire);

        const beaconTopGeo = new THREE.OctahedronGeometry(0.8);
        const beaconTopMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8 });
        const beaconTop = new THREE.Mesh(beaconTopGeo, beaconTopMat);
        beaconTop.position.y = 38.5;
        bGroup.add(beaconTop);
        csBeacons.push(beaconTop);

        // Grand Illuminated Entrance Arch at base
        const archGeo = new THREE.BoxGeometry(8, 5, 1.2);
        const archMat = new THREE.MeshStandardMaterial({ 
          color: 0x030712, 
          emissive: 0x00E5FF, 
          emissiveIntensity: 0.35,
          roughness: 0.2
        });
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.position.set(0, 2.5, b.depth / 2 + 0.6);
        bGroup.add(arch);
      }

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
      signMesh.position.set(0, b.id === 'fargan-tower' ? 31 : b.height + 1.4, 0);

      // Determine building facade and entrance direction
      const isNorthTower = b.id === 'fargan-tower';
      const isWestSide = b.position[0] <= -20;
      const isEastSide = b.position[0] >= 20;
      const isInnerNorth = b.position[2] <= -15 && Math.abs(b.position[0]) < 20;
      const isInnerSouth = b.position[2] >= 15 && Math.abs(b.position[0]) < 20;

      let padOffsetX = 0;
      let padOffsetZ = 0;
      let npcOffsetX = 0;
      let npcOffsetZ = 0;
      let npcRotationY = 0;

      if (isNorthTower) {
        // Fargan Tower at [0, 14, -36] faces South down Central Boulevard
        signMesh.rotation.y = 0;
        padOffsetZ = b.depth / 2 + 1.5;
        npcOffsetX = 0;
        npcOffsetZ = b.depth / 2 + 2.5;
        npcRotationY = 0; // NPC faces South toward approaching player
      } else if (isWestSide) {
        // West avenue buildings face East toward avenue
        signMesh.rotation.y = Math.PI / 2;
        padOffsetX = b.width / 2 + 1.5;
        npcOffsetX = b.width / 2 + 2.3;
        npcOffsetZ = 0;
        npcRotationY = Math.PI / 2; // NPC stands in front, facing East
      } else if (isEastSide) {
        // East avenue buildings face West toward avenue
        signMesh.rotation.y = -Math.PI / 2;
        padOffsetX = -b.width / 2 - 1.5;
        npcOffsetX = -b.width / 2 - 2.3;
        npcOffsetZ = 0;
        npcRotationY = -Math.PI / 2; // NPC stands in front, facing West
      } else if (isInnerNorth) {
        // han-waste & fargan-butik face South toward North Crossroad (z = -12)
        signMesh.rotation.y = 0;
        padOffsetZ = b.depth / 2 + 1.5;
        npcOffsetX = 0;
        npcOffsetZ = b.depth / 2 + 2.3;
        npcRotationY = 0; // NPC stands in front, facing South
      } else if (isInnerSouth) {
        // fargan-kopi & hendar-fitness face North toward South Crossroad (z = 14)
        signMesh.rotation.y = Math.PI;
        padOffsetZ = -b.depth / 2 - 1.5;
        npcOffsetX = 0;
        npcOffsetZ = -b.depth / 2 - 2.3;
        npcRotationY = Math.PI; // NPC stands in front, facing North
      } else {
        // Default North-facing
        signMesh.rotation.y = 0;
        padOffsetZ = b.depth / 2 + 1.5;
        npcOffsetX = 0;
        npcOffsetZ = b.depth / 2 + 2.3;
        npcRotationY = 0;
      }
      bGroup.add(signMesh);

      // Register exact world coordinate of the CS circle
      const csWorldX = b.position[0] + padOffsetX;
      const csWorldZ = b.position[2] + padOffsetZ;
      csSpots.set(b.id, { x: csWorldX, z: csWorldZ });
      csSpotsRef.current.set(b.id, { x: csWorldX, z: csWorldZ });

      // CS Interactive Circle Pad (Solid glowing cylinder) - larger for iconic Fargan Tower
      const padRadius = b.id === 'fargan-tower' ? 3.5 : 2.2;
      const padGeo = new THREE.CylinderGeometry(padRadius, padRadius, 0.08, 32);
      const padMat = new THREE.MeshStandardMaterial({ 
        color: b.neonColor, 
        emissive: b.neonColor,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        transparent: true,
        opacity: 0.85
      });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(padOffsetX, 0.05, padOffsetZ);
      bGroup.add(pad);

      // Glowing outer ring border
      const ringGeo = new THREE.RingGeometry(padRadius - 0.12, padRadius + 0.18, 32);
      const ringMat = new THREE.MeshBasicMaterial({ 
        color: b.neonColor, 
        side: THREE.DoubleSide 
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(padOffsetX, 0.08, padOffsetZ);
      bGroup.add(ringMesh);

      // Floating holographic diamond beacon over CS spot
      const beaconGeo = new THREE.OctahedronGeometry(0.35);
      const beaconMat = new THREE.MeshBasicMaterial({ color: b.neonColor, wireframe: true });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.set(npcOffsetX, 3.2, npcOffsetZ);
      bGroup.add(beaconMesh);
      csBeacons.push(beaconMesh);

      const spot = new THREE.PointLight(b.neonColor, 3.5, 10);
      spot.position.set(padOffsetX, 2.0, padOffsetZ);
      bGroup.add(spot);

      bGroup.position.set(b.position[0], 0, b.position[2]);
      scene.add(bGroup);

      // =========================================================
      // 3D ROBLOX NPC CHARACTER IN FRONT OF BUILDING ENTRANCE
      // =========================================================
      const npcGroup = new THREE.Group();

      const isCeo = b.id === 'fargan-tower';
      const npcSkinMat = new THREE.MeshStandardMaterial({ color: 0xFAD090, roughness: 0.5 });
      const npcShirtMat = new THREE.MeshStandardMaterial({ 
        color: isCeo ? 0x091424 : b.color, 
        roughness: isCeo ? 0.2 : 0.3,
        metalness: isCeo ? 0.35 : 0
      });
      const npcNeonMat = new THREE.MeshStandardMaterial({ 
        color: isCeo ? 0x00E5FF : b.neonColor, 
        emissive: isCeo ? 0x00E5FF : b.neonColor, 
        emissiveIntensity: isCeo ? 0.85 : 0.5 
      });
      const npcPantsMat = new THREE.MeshStandardMaterial({ color: 0x070B14, roughness: 0.6 });

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

    // 5. Streetlights placed on sidewalks along roads
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
      // Central Boulevard sidewalks (width 8: edges at x = ±4.8)
      [-4.8, -6], [4.8, -6], [-4.8, 6], [4.8, 6],
      [-4.8, -20], [4.8, -20], [-4.8, 20], [4.8, 20],
      // West Avenue sidewalks (center x = -21, edges at x = -24.8 & -17.2)
      [-24.8, -2], [-17.2, -2], [-24.8, 22], [-17.2, 22],
      // East Avenue sidewalks (center x = 21, edges at x = 17.2 & 24.8)
      [17.2, -2], [24.8, -2], [17.2, 22], [24.8, 22]
    ];
    lightCoords.forEach(([lx, lz]) => addStreetLight(lx, lz));

    // =========================================================
    // LIVING CITY: HOVER CARS, FLYING DRONE & AMBIENT PARTICLES
    // Cars drive strictly on asphalt roads
    // =========================================================
    const hoverCars: { mesh: THREE.Group; axis: 'x' | 'z'; dir: number; speed: number; min: number; max: number }[] = [];

    const createHoverCar = (color: number, lightColor: number) => {
      const car = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.45, 2.7),
        new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.8 })
      );
      body.position.y = 0.55;
      car.add(body);

      const glass = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 0.35, 1.3),
        new THREE.MeshStandardMaterial({ color: 0x0A0F1D, roughness: 0.1 })
      );
      glass.position.set(0, 0.85, -0.2);
      car.add(glass);

      const lightGeo = new THREE.BoxGeometry(0.32, 0.12, 0.05);
      const headL = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: lightColor }));
      headL.position.set(-0.45, 0.55, -1.36);
      const headR = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: lightColor }));
      headR.position.set(0.45, 0.55, -1.36);
      car.add(headL, headR);

      const tailL = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xFF0055 }));
      tailL.position.set(-0.45, 0.55, 1.36);
      const tailR = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xFF0055 }));
      tailR.position.set(0.45, 0.55, 1.36);
      car.add(tailL, tailR);

      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(1.3, 2.3),
        new THREE.MeshBasicMaterial({ color: lightColor, transparent: true, opacity: 0.45 })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.08;
      car.add(glow);

      return car;
    };

    // Flying AI Drone Squad in city skyline
    const createSkyDrone = (accentColor: number, height: number, speed: number, radiusX: number, radiusZ: number) => {
      const droneGroup = new THREE.Group();
      const droneBody = new THREE.Mesh(
        new THREE.BoxGeometry(0.85, 0.22, 0.85),
        new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.3, metalness: 0.8 })
      );
      droneGroup.add(droneBody);

      const ringGeo = new THREE.RingGeometry(0.25, 0.40, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: accentColor, side: THREE.DoubleSide });
      [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(([rx, rz]) => {
        const r = new THREE.Mesh(ringGeo, ringMat);
        r.rotation.x = Math.PI / 2;
        r.position.set(rx, 0.1, rz);
        droneGroup.add(r);
      });

      const droneLight = new THREE.PointLight(accentColor, 1.8, 16);
      droneLight.position.set(0, -0.4, 0);
      droneGroup.add(droneLight);

      scene.add(droneGroup);
      return { group: droneGroup, height, speed, radiusX, radiusZ };
    };

    const skyDrones = [
      createSkyDrone(0x00E5FF, 12, 0.35, 26, 20),
      createSkyDrone(0xA855F7, 15, -0.28, 20, 24)
    ];

    // Car 1: Central Boulevard Southbound (x = 2.0, asphalt road is x in [-4, 4])
    const car1 = createHoverCar(0x0F2838, 0x00E5FF);
    car1.position.set(2.0, 0, -25);
    scene.add(car1);
    hoverCars.push({ mesh: car1, axis: 'z', dir: 1, speed: 0.32, min: -26, max: 28 });

    // Car 2: Central Boulevard Northbound (x = -2.0, asphalt road is x in [-4, 4])
    const car2 = createHoverCar(0x380F28, 0xFF0077);
    car2.position.set(-2.0, 0, 28);
    car2.rotation.y = Math.PI;
    scene.add(car2);
    hoverCars.push({ mesh: car2, axis: 'z', dir: -1, speed: 0.30, min: -26, max: 28 });

    // Car 3: Central Boulevard Express Southbound (x = 1.0)
    const car3 = createHoverCar(0x0B2A3B, 0x38BDF8);
    car3.position.set(1.0, 0, -10);
    scene.add(car3);
    hoverCars.push({ mesh: car3, axis: 'z', dir: 1, speed: 0.38, min: -26, max: 28 });

    // Car 4: West Avenue Northbound Lane 1 (x = -22.2)
    const car4 = createHoverCar(0x1B381E, 0x10B981);
    car4.position.set(-22.2, 0, 30);
    car4.rotation.y = Math.PI;
    scene.add(car4);
    hoverCars.push({ mesh: car4, axis: 'z', dir: -1, speed: 0.28, min: -34, max: 30 });

    // Car 5: West Avenue Southbound Lane 2 (x = -19.8)
    const car5 = createHoverCar(0x2E1B38, 0xC084FC);
    car5.position.set(-19.8, 0, -32);
    scene.add(car5);
    hoverCars.push({ mesh: car5, axis: 'z', dir: 1, speed: 0.27, min: -34, max: 30 });

    // Car 6: East Avenue Southbound Lane 1 (x = 19.8)
    const car6 = createHoverCar(0x38280F, 0xF59E0B);
    car6.position.set(19.8, 0, -34);
    scene.add(car6);
    hoverCars.push({ mesh: car6, axis: 'z', dir: 1, speed: 0.29, min: -34, max: 30 });

    // Car 7: East Avenue Northbound Lane 2 (x = 22.2)
    const car7 = createHoverCar(0x381220, 0xFB7185);
    car7.position.set(22.2, 0, 28);
    car7.rotation.y = Math.PI;
    scene.add(car7);
    hoverCars.push({ mesh: car7, axis: 'z', dir: -1, speed: 0.26, min: -34, max: 30 });

    // Car 8: North Crossroad Eastbound (z = -12, asphalt road is z in [-15, -9])
    const car8 = createHoverCar(0x280F38, 0xA855F7);
    car8.position.set(-32, 0, -12);
    car8.rotation.y = Math.PI / 2;
    scene.add(car8);
    hoverCars.push({ mesh: car8, axis: 'x', dir: 1, speed: 0.31, min: -34, max: 34 });

    // Car 9: North Crossroad Westbound (z = -10.5)
    const car9 = createHoverCar(0x0C283B, 0x00E5FF);
    car9.position.set(32, 0, -10.5);
    car9.rotation.y = -Math.PI / 2;
    scene.add(car9);
    hoverCars.push({ mesh: car9, axis: 'x', dir: -1, speed: 0.29, min: -34, max: 34 });

    // Car 10: South Crossroad Westbound (z = 14, asphalt road is z in [11, 17])
    const car10 = createHoverCar(0x0C2B38, 0x06B6D4);
    car10.position.set(32, 0, 14);
    car10.rotation.y = -Math.PI / 2;
    scene.add(car10);
    hoverCars.push({ mesh: car10, axis: 'x', dir: -1, speed: 0.30, min: -34, max: 34 });

    // Atmospheric Floating Cyber Sparks & Data Packets (bustling metaverse ambiance)
    const particleCount = 140;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 85;
      particlePositions[i * 3 + 1] = 0.5 + Math.random() * 14;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 85;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00E5FF,
      size: 0.28,
      transparent: true,
      opacity: 0.75
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Playable Roblox Player Character Rig
    const playerGroup = new THREE.Group();

    // ==========================================
    // MALE RIG
    // ==========================================
    const maleRig = new THREE.Group();

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
    maleRig.add(head);

    // Headphones
    const bandGeo = new THREE.BoxGeometry(0.82, 0.08, 0.2);
    const band = new THREE.Mesh(bandGeo, cyanNeonMat);
    band.position.set(0, 2.05, 0);
    maleRig.add(band);

    const earGeo = new THREE.BoxGeometry(0.12, 0.28, 0.28);
    const earL = new THREE.Mesh(earGeo, cyanNeonMat);
    earL.position.set(-0.41, 1.65, 0);
    const earR = new THREE.Mesh(earGeo, cyanNeonMat);
    earR.position.set(0.41, 1.65, 0);
    maleRig.add(earL, earR);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(1.0, 1.1, 0.55);
    const torso = new THREE.Mesh(torsoGeo, hoodieMat);
    torso.position.y = 0.85;
    torso.castShadow = true;
    maleRig.add(torso);

    const logoGeo = new THREE.BoxGeometry(0.35, 0.35, 0.05);
    const logoMesh = new THREE.Mesh(logoGeo, cyanNeonMat);
    logoMesh.position.set(0, 0.95, 0.29);
    maleRig.add(logoMesh);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.38, 1.0, 0.45);
    const leftArm = new THREE.Mesh(armGeo, hoodieMat);
    leftArm.position.set(-0.72, 0.85, 0);
    leftArm.castShadow = true;
    maleRig.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, hoodieMat);
    rightArm.position.set(0.72, 0.85, 0);
    rightArm.castShadow = true;
    maleRig.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.44, 0.9, 0.45);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.24, -0.05, 0);
    leftLeg.castShadow = true;
    maleRig.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.24, -0.05, 0);
    rightLeg.castShadow = true;
    maleRig.add(rightLeg);

    maleRig.visible = gender === 'male';
    maleRigRef.current = maleRig;
    playerGroup.add(maleRig);

    // ==========================================
    // FEMALE RIG
    // ==========================================
    const femaleRig = new THREE.Group();

    const fSkinMat = new THREE.MeshStandardMaterial({ color: 0xFDE2CA, roughness: 0.5 });
    const fTechMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 });
    const fPinkNeonMat = new THREE.MeshStandardMaterial({ color: 0xEC4899, emissive: 0xDB2777, emissiveIntensity: 0.6 });
    const fHairMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3 });
    const fPantsMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });

    const fFaceCanvas = document.createElement('canvas');
    fFaceCanvas.width = 128;
    fFaceCanvas.height = 128;
    const ffctx = fFaceCanvas.getContext('2d');
    if (ffctx) {
      ffctx.fillStyle = '#FDE2CA';
      ffctx.fillRect(0, 0, 128, 128);
      // Anime Eyes with stylish lashes
      ffctx.fillStyle = '#1e1b4b';
      ffctx.fillRect(26, 42, 20, 24);
      ffctx.fillRect(82, 42, 20, 24);
      // Lashes
      ffctx.fillStyle = '#0f172a';
      ffctx.fillRect(22, 38, 26, 5);
      ffctx.fillRect(80, 38, 26, 5);
      // Sparkling eyes
      ffctx.fillStyle = '#f43f5e';
      ffctx.fillRect(32, 46, 8, 10);
      ffctx.fillRect(88, 46, 8, 10);
      ffctx.fillStyle = '#ffffff';
      ffctx.fillRect(36, 48, 4, 4);
      ffctx.fillRect(92, 48, 4, 4);
      // Blush
      ffctx.fillStyle = '#fda4af';
      ffctx.fillRect(20, 70, 14, 6);
      ffctx.fillRect(94, 70, 14, 6);
      // Smile
      ffctx.fillStyle = '#be123c';
      ffctx.beginPath();
      ffctx.arc(64, 86, 12, 0.1 * Math.PI, 0.9 * Math.PI);
      ffctx.lineWidth = 4;
      ffctx.stroke();
    }
    const fFaceTexture = new THREE.CanvasTexture(fFaceCanvas);
    const fHeadMatArray = [
      fSkinMat, fSkinMat, fSkinMat, fSkinMat,
      new THREE.MeshStandardMaterial({ map: fFaceTexture }),
      fSkinMat
    ];

    const fHeadGeo = new THREE.BoxGeometry(0.68, 0.68, 0.68);
    const fHead = new THREE.Mesh(fHeadGeo, fHeadMatArray);
    fHead.position.y = 1.65;
    fHead.castShadow = true;
    femaleRig.add(fHead);

    // Female Hair Top
    const fHairTop = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.22, 0.74), fHairMat);
    fHairTop.position.set(0, 2.02, 0);
    femaleRig.add(fHairTop);

    // Cyber Ponytail
    const fPonytail = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.68, 0.28), fHairMat);
    fPonytail.position.set(0, 1.85, -0.42);
    fPonytail.rotation.x = -0.3;
    femaleRig.add(fPonytail);

    // Glowing Cyber Hair Ribbon
    const fRibbon = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.2), fPinkNeonMat);
    fRibbon.position.set(0, 2.06, -0.32);
    femaleRig.add(fRibbon);

    // Cat-ear cyber antennae
    const fEarL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 4), fPinkNeonMat);
    fEarL.position.set(-0.35, 2.18, 0);
    fEarL.rotation.z = 0.2;
    const fEarR = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.28, 4), fPinkNeonMat);
    fEarR.position.set(0.35, 2.18, 0);
    fEarR.rotation.z = -0.2;
    femaleRig.add(fEarL, fEarR);

    // Female Torso (Techwear Crop-Jacket)
    const fTorso = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.05, 0.52), fTechMat);
    fTorso.position.y = 0.85;
    fTorso.castShadow = true;
    femaleRig.add(fTorso);

    const fStripe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.05), fPinkNeonMat);
    fStripe.position.set(0, 0.9, 0.28);
    femaleRig.add(fStripe);

    // Female Arms
    const fArmGeo = new THREE.BoxGeometry(0.35, 0.95, 0.4);
    const leftArmFemale = new THREE.Mesh(fArmGeo, fTechMat);
    leftArmFemale.position.set(-0.68, 0.85, 0);
    leftArmFemale.castShadow = true;
    femaleRig.add(leftArmFemale);

    const rightArmFemale = new THREE.Mesh(fArmGeo, fTechMat);
    rightArmFemale.position.set(0.68, 0.85, 0);
    rightArmFemale.castShadow = true;
    femaleRig.add(rightArmFemale);

    // Female Legs
    const fLegGeo = new THREE.BoxGeometry(0.4, 0.88, 0.42);
    const leftLegFemale = new THREE.Mesh(fLegGeo, fPantsMat);
    leftLegFemale.position.set(-0.23, -0.05, 0);
    leftLegFemale.castShadow = true;
    femaleRig.add(leftLegFemale);

    const rightLegFemale = new THREE.Mesh(fLegGeo, fPantsMat);
    rightLegFemale.position.set(0.23, -0.05, 0);
    rightLegFemale.castShadow = true;
    femaleRig.add(rightLegFemale);

    femaleRig.visible = gender === 'female';
    femaleRigRef.current = femaleRig;
    playerGroup.add(femaleRig);

    // Floating AI Orb
    const orbGeo = new THREE.IcosahedronGeometry(0.18, 1);
    const orbMat = new THREE.MeshBasicMaterial({ 
      color: gender === 'female' ? 0xEC4899 : 0x00E5FF, 
      wireframe: true 
    });
    orbMatRef.current = orbMat;
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

    // Pinpoint proximity: Only triggers when player steps directly onto the glowing CS circle pad
    const checkNearestBuilding = (px: number, pz: number): CityBuilding | null => {
      for (const b of currentProjectsRef.current) {
        const spot = csSpotsRef.current.get(b.id);
        if (!spot) continue;
        const dist = Math.hypot(px - spot.x, pz - spot.z);
        // Trigger when standing on the glowing CS circle (pad radius 3.5m for Fargan Tower, 2.2m for other buildings)
        const triggerRadius = b.id === 'fargan-tower' ? 3.8 : 2.5;
        if (dist <= triggerRadius) {
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
        const legRot = Math.sin(walkCycle) * 0.7;
        const armRot = -Math.sin(walkCycle) * 0.7;

        leftLeg.rotation.x = legRot;
        rightLeg.rotation.x = -legRot;
        leftArm.rotation.x = armRot;
        rightArm.rotation.x = -armRot;

        leftLegFemale.rotation.x = legRot;
        rightLegFemale.rotation.x = -legRot;
        leftArmFemale.rotation.x = armRot;
        rightArmFemale.rotation.x = -armRot;

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
        leftLegFemale.rotation.x *= 0.8;
        rightLegFemale.rotation.x *= 0.8;

        const idleArm = Math.sin(elapsedTime * 2) * 0.08;
        leftArm.rotation.x = idleArm;
        rightArm.rotation.x = -idleArm;
        leftArmFemale.rotation.x = idleArm;
        rightArmFemale.rotation.x = -idleArm;
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

      // Animate Living City: Flying AI Drones Squad
      skyDrones.forEach((drone, idx) => {
        drone.group.position.x = Math.sin(elapsedTime * drone.speed + idx * Math.PI) * drone.radiusX;
        drone.group.position.z = Math.cos(elapsedTime * drone.speed + idx * Math.PI) * drone.radiusZ;
        drone.group.position.y = drone.height + Math.sin(elapsedTime * 1.5 + idx) * 0.6;
        drone.group.rotation.y = elapsedTime * drone.speed + Math.PI / 2;
      });

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

      // Animate floating holographic beacons above CS characters
      csBeacons.forEach((beacon, i) => {
        beacon.rotation.y += 0.04;
        beacon.position.y = 3.2 + Math.sin(elapsedTime * 3 + i) * 0.12;
      });

      // Coordinates
      setPlayerCoord({
        x: Math.round(playerGroup.position.x * 10) / 10,
        z: Math.round(playerGroup.position.z * 10) / 10
      });

      // Proximity check for NPC Dialogue: Strict CS Circle Check
      const near = checkNearestBuilding(playerGroup.position.x, playerGroup.position.z);
      if (near) {
        if (near.id !== dismissedIdRef.current) {
          if (!activeDialogueRef.current || activeDialogueRef.current.id !== near.id) {
            soundEngine.playProximityChime();
          }
          setActiveDialogue(near);
        }
      } else {
        // Only close when player has stepped completely outside the CS circle
        if (activeDialogueRef.current) {
          const activeSpot = csSpotsRef.current.get(activeDialogueRef.current.id);
          if (activeSpot) {
            const activeDist = Math.hypot(playerGroup.position.x - activeSpot.x, playerGroup.position.z - activeSpot.z);
            const exitThreshold = activeDialogueRef.current.id === 'fargan-tower' ? 4.8 : 3.2;
            if (activeDist > exitThreshold) {
              setActiveDialogue(null);
              setDismissedId(null);
            }
          } else {
            setActiveDialogue(null);
            setDismissedId(null);
          }
        } else {
          setDismissedId(null);
        }
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
          <span>{mobileRadarOpen ? 'Tutup Peta ✕' : `Peta Radar (${currentProjects.length})`}</span>
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
            <span className="text-[10px] text-slate-400">{currentProjects.length} GEDUNG</span>
          </div>

          <div className="relative w-36 h-36 rounded-xl bg-slate-900/90 border border-cyan-500/30 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,162,255,0.15)_0%,transparent_70%)]" />
            <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/20" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/20" />
            <div className="absolute w-24 h-24 rounded-full border border-cyan-500/20" />

            {currentProjects.map(b => {
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
              <span>{t.radarTitle} ({currentProjects.length})</span>
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

              {currentProjects.map(b => {
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
            {currentProjects.map(b => (
              <button
                key={b.id}
                onClick={() => {
                  if (playerTeleportRef.current) {
                    const spot = csSpotsRef.current.get(b.id) || { 
                      x: b.position[0], 
                      z: b.position[2] + (b.position[2] < 0 ? 5 : -5) 
                    };
                    playerTeleportRef.current(spot.x, spot.z);
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
            <span>{t.buildingDirectory}</span>
            <MapPin className="w-3 h-3 text-cyan-400" />
          </div>
          {currentProjects.map(b => (
            <button
              key={b.id}
              onClick={() => {
                if (playerTeleportRef.current) {
                  const spot = csSpotsRef.current.get(b.id) || { 
                    x: b.position[0], 
                    z: b.position[2] + (b.position[2] < 0 ? 5 : -5) 
                  };
                  playerTeleportRef.current(spot.x, spot.z);
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
        <div className="absolute bottom-32 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 w-[94vw] sm:w-[620px] max-w-full pointer-events-auto animate-fade-in max-h-[76vh] flex flex-col">
          <div 
            className="roblox-panel p-3.5 sm:p-5 border-2 shadow-2xl bg-slate-950/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl space-y-2.5 sm:space-y-3 overflow-y-auto"
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
                  {activeDialogue.id === 'fargan-tower' ? (
                    <span className="text-xl">👑</span>
                  ) : (
                    <MessageSquare className="w-5 h-5 text-slate-950" />
                  )}
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
                      {(lang === 'en' && activeDialogue.badgeEn) ? activeDialogue.badgeEn : activeDialogue.badge}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-cyan-300 font-mono mt-0.5">
                    {(lang === 'en' && activeDialogue.npcRoleEn) ? activeDialogue.npcRoleEn : activeDialogue.npcRole}
                  </p>
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
                const fullText = (lang === 'en' && activeDialogue.dialogueTextEn) 
                  ? activeDialogue.dialogueTextEn 
                  : activeDialogue.dialogueText;
                setDisplayedText(fullText);
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

            {/* Special Core Capabilities Grid for Fargan Central Tower */}
            {activeDialogue.id === 'fargan-tower' && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>{lang === 'en' ? 'Core Capabilities We Build & Deliver:' : 'Solusi & Jasa yang Bisa Kami Buat:'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/25 text-slate-200 flex items-center gap-1.5 shadow-sm">
                    <span className="text-cyan-400 font-bold">💎</span>
                    <span className="truncate">{lang === 'en' ? 'Premium Web Design' : 'Website Bisnis Mewah'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/25 text-slate-200 flex items-center gap-1.5 shadow-sm">
                    <span className="text-amber-400 font-bold">🤖</span>
                    <span className="truncate">{lang === 'en' ? 'Smart AI WhatsApp Bot' : 'Fitur Smart & Bot WA AI'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/25 text-slate-200 flex items-center gap-1.5 shadow-sm">
                    <span className="text-emerald-400 font-bold">⚡</span>
                    <span className="truncate">{lang === 'en' ? 'Custom SaaS & Cloud' : 'Software SaaS Kustom'}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-cyan-500/25 text-slate-200 flex items-center gap-1.5 shadow-sm">
                    <span className="text-purple-400 font-bold">🌐</span>
                    <span className="truncate">{lang === 'en' ? '3D Metaverse Web' : 'Showroom 3D Digital'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <button
                onClick={() => onBuildingSelect(activeDialogue)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-all active:scale-95"
              >
                {lang === 'en' ? '📋 Building Specs' : '📋 Spesifikasi Gedung'}
              </button>

              {activeDialogue.id === 'fargan-tower' ? (
                <a
                  href="https://wa.me/6281295175618?text=Halo%20CEO%20Fargan,%20saya%20tertarik%20berkonsultasi%20mengenai%20pembuatan%20website%20premium%20/%20fitur%20smart%20untuk%20bisnis%20saya..."
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => soundEngine.playJump()}
                  className="px-4 py-2 rounded-xl font-black text-xs text-slate-950 flex items-center gap-1.5 shadow-xl transition-all active:scale-95 hover:scale-105 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 border border-emerald-200/50 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-current text-slate-950" />
                  <span>{lang === 'en' ? '💬 Consult Business via WA ➔' : '💬 Konsultasi Ide Bisnis via WA ➔'}</span>
                </a>
              ) : (
                <a
                  href={activeDialogue.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl font-black text-xs text-slate-950 flex items-center gap-1.5 shadow-lg transition-all active:scale-95 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, #${activeDialogue.neonColor.toString(16).padStart(6, '0')}, #38bdf8)`
                  }}
                >
                  <span>{lang === 'en' ? 'OPEN LIVE SITE ➔' : 'BUKA WEBSITE LIVE ➔'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                onClick={() => {
                  setDismissedId(activeDialogue.id);
                  setActiveDialogue(null);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white font-bold text-xs cursor-pointer"
              >
                {lang === 'en' ? 'Close ✕' : 'Permisi ✕'}
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
              {lang === 'en' 
                ? 'Drag screen to orbit 360° • Pinch screen to zoom (Google Maps style)' 
                : 'Geser layar untuk putar sudut 360° • Cubit layar untuk zoom (seperti Google Maps)'}
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
      <div className="absolute top-14 right-3 sm:top-16 sm:right-60 z-30 pointer-events-auto flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-cyan-500/30 shadow-xl">
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
          <span>{t.compassNorth}</span>
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
          aria-label={t.jumpBtn}
        >
          <Footprints className="w-4 h-4" />
          <span>{t.jumpBtn.toUpperCase()}</span>
        </button>
      </div>
    </div>
  );
};
