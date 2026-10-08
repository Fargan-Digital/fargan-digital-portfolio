import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Compass, 
  Footprints, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  ExternalLink,
  MessageSquare,
  Volume2,
  VolumeX,
  X,
  Target,
  ChevronDown
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

  // Active targeted building for GPS Compass (defaults to Brand Owner OS)
  const [activeCompassTarget, setActiveCompassTarget] = useState<CityBuilding>(portfolioProjects[0]);
  const [distanceToTarget, setDistanceToTarget] = useState<number>(28);

  const [activeDialogue, setActiveDialogue] = useState<CityBuilding | null>(null);
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTypingDone, setIsTypingDone] = useState<boolean>(false);
  const [dialogueSfxEnabled, setDialogueSfxEnabled] = useState<boolean>(true);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const [playerCoord, setPlayerCoord] = useState<{ x: number; z: number }>({ x: 0, z: 6 });
  const [mobileRadarOpen, setMobileRadarOpen] = useState(false);

  // Player Teleport & Face Align Ref
  const playerTeleportRef = useRef<((x: number, z: number) => void) | null>(null);
  const alignCameraToTargetRef = useRef<(() => void) | null>(null);

  // Mobile controller touch states
  const mobileInputRef = useRef({ forward: false, backward: false, left: false, right: false, jump: false });

  // Web Audio Typewriter Click SFX
  const playTypewriterClick = useCallback(() => {
    if (!dialogueSfxEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680 + Math.random() * 180, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.035, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.032);
    } catch {
      // Audio fallback
    }
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

  // Handle external teleport or target selection
  useEffect(() => {
    if (targetBuildingId) {
      const b = portfolioProjects.find(item => item.id === targetBuildingId);
      if (b) {
        setActiveCompassTarget(b);
        if (playerTeleportRef.current) {
          const targetX = b.position[0];
          const targetZ = b.position[2] + (b.position[2] < 0 ? 5 : -5);
          playerTeleportRef.current(targetX, targetZ);
          setDismissedId(null);
          setActiveDialogue(b);
        }
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

      if (Math.abs(b.position[0]) > Math.abs(b.position[2])) {
        signMesh.rotation.y = b.position[0] < 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      bGroup.add(signMesh);

      // Entrance Glow Pad
      let padOffsetX = 0;
      let padOffsetZ = 0;
      let npcOffsetX = 0;
      let npcOffsetZ = 0;
      let npcRotationY = 0;

      if (b.position[2] < -10) {
        padOffsetZ = b.depth / 2 + 1.5;
        npcOffsetX = -1.6;
        npcOffsetZ = b.depth / 2 + 2.4;
        npcRotationY = 0;
      } else if (b.position[2] > 10) {
        padOffsetZ = -b.depth / 2 - 1.5;
        npcOffsetX = 1.6;
        npcOffsetZ = -b.depth / 2 - 2.4;
        npcRotationY = Math.PI;
      } else if (b.position[0] < -10) {
        padOffsetX = b.width / 2 + 1.5;
        npcOffsetX = b.width / 2 + 2.4;
        npcOffsetZ = 1.4;
        npcRotationY = Math.PI / 2;
      } else {
        padOffsetX = -b.width / 2 - 1.5;
        npcOffsetX = -b.width / 2 - 2.4;
        npcOffsetZ = -1.4;
        npcRotationY = -Math.PI / 2;
      }

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

      // 3D NPC Resepsionis
      const npcGroup = new THREE.Group();

      const npcSkinMat = new THREE.MeshStandardMaterial({ color: 0xFAD090, roughness: 0.5 });
      const npcShirtMat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.3 });
      const npcNeonMat = new THREE.MeshStandardMaterial({ 
        color: b.neonColor, 
        emissive: b.neonColor, 
        emissiveIntensity: 0.5 
      });
      const npcPantsMat = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.6 });

      const npcFaceCanvas = document.createElement('canvas');
      npcFaceCanvas.width = 128;
      npcFaceCanvas.height = 128;
      const nfctx = npcFaceCanvas.getContext('2d');
      if (nfctx) {
        nfctx.fillStyle = '#FAD090';
        nfctx.fillRect(0, 0, 128, 128);
        nfctx.fillStyle = '#0F172A';
        nfctx.fillRect(30, 42, 16, 22);
        nfctx.fillRect(82, 42, 16, 22);
        nfctx.fillStyle = '#FFFFFF';
        nfctx.fillRect(38, 44, 6, 8);
        nfctx.fillRect(90, 44, 6, 8);
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

      const npcTorso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.05, 0.52), npcShirtMat);
      npcTorso.position.y = 0.82;
      npcTorso.castShadow = true;
      npcGroup.add(npcTorso);

      const npcTie = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.05), npcNeonMat);
      npcTie.position.set(0, 0.9, 0.28);
      npcGroup.add(npcTie);

      const npcArmGeo = new THREE.BoxGeometry(0.35, 0.95, 0.42);
      const npcLeftArm = new THREE.Mesh(npcArmGeo, npcShirtMat);
      npcLeftArm.position.set(-0.68, 0.82, 0);
      npcLeftArm.castShadow = true;
      npcGroup.add(npcLeftArm);

      const npcRightArm = new THREE.Mesh(npcArmGeo, npcShirtMat);
      npcRightArm.position.set(0.68, 0.82, 0);
      npcRightArm.castShadow = true;
      npcGroup.add(npcRightArm);

      const npcLegGeo = new THREE.BoxGeometry(0.42, 0.85, 0.42);
      const npcLeftLeg = new THREE.Mesh(npcLegGeo, npcPantsMat);
      npcLeftLeg.position.set(-0.23, -0.05, 0);
      npcGroup.add(npcLeftLeg);

      const npcRightLeg = new THREE.Mesh(npcLegGeo, npcPantsMat);
      npcRightLeg.position.set(0.23, -0.05, 0);
      npcGroup.add(npcRightLeg);

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
    // 6. 3D HOLOGRAPHIC WAYPOINT BEACON IN THE SKY
    // =========================================================
    const beaconGeo = new THREE.CylinderGeometry(0.4, 0.4, 50, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ 
      color: 0x00A2FF, 
      transparent: true, 
      opacity: 0.38 
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    scene.add(beaconMesh);

    // =========================================================
    // 7. 3D COMPASS ARROW AT PLAYER FEET (REAL-TIME GPS POINTER)
    // =========================================================
    const compassArrowGroup = new THREE.Group();

    // Pulsing Outer Ring
    const ringGeo = new THREE.RingGeometry(1.3, 1.48, 32);
    const ringMat = new THREE.MeshBasicMaterial({ 
      color: 0x00E5FF, 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0.7 
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    compassArrowGroup.add(ringMesh);

    // Sharp Directional Chevron Pointer
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 2.2);
    arrowShape.lineTo(0.7, 0.6);
    arrowShape.lineTo(0.2, 0.8);
    arrowShape.lineTo(0, 0.9);
    arrowShape.lineTo(-0.2, 0.8);
    arrowShape.lineTo(-0.7, 0.6);
    arrowShape.closePath();

    const arrowGeo = new THREE.ShapeGeometry(arrowShape);
    const arrowMat = new THREE.MeshBasicMaterial({ 
      color: 0x00E5FF, 
      side: THREE.DoubleSide, 
      transparent: true, 
      opacity: 0.95 
    });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    arrowMesh.rotation.x = -Math.PI / 2;
    compassArrowGroup.add(arrowMesh);

    compassArrowGroup.position.set(0, 0.08, 0);
    scene.add(compassArrowGroup);

    // 8. Playable Roblox Player Character Rig
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

    // Start facing North (towards Brand Owner OS)
    playerGroup.position.set(0, 1.35, 6);
    playerGroup.rotation.y = Math.PI; // Look North
    scene.add(playerGroup);

    // Camera Orbit State: always maintains smooth 3rd person follow behind character
    let cameraYaw = Math.PI;
    let targetCameraYaw = Math.PI;

    playerTeleportRef.current = (tx: number, tz: number) => {
      playerGroup.position.x = tx;
      playerGroup.position.z = tz;
      playerGroup.position.y = 1.35;
    };

    // Auto-Align Camera & Character to current compass target
    alignCameraToTargetRef.current = () => {
      const curTarget = activeCompassTarget;
      const tdx = curTarget.position[0] - playerGroup.position.x;
      const tdz = curTarget.position[2] - playerGroup.position.z;
      const angle = Math.atan2(tdx, tdz);
      playerGroup.rotation.y = angle;
      targetCameraYaw = angle;
      cameraYaw = angle;
    };

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

    // 9. Main Game Loop
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

        // Player rotates towards movement direction
        const targetAngle = Math.atan2(normX, normZ);
        playerGroup.rotation.y = targetAngle;

        // Smoothly orbit camera behind character's back so character is ALWAYS facing forward
        targetCameraYaw = targetAngle;

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

      playerGroup.position.x = Math.max(-48, Math.min(48, playerGroup.position.x));
      playerGroup.position.z = Math.max(-48, Math.min(48, playerGroup.position.z));

      // AI Orb
      orb.position.y = 1.8 + Math.sin(elapsedTime * 3) * 0.2;
      orb.rotation.y += 0.04;
      monument.rotation.y += 0.01;

      // Animate NPCs: Waving arm when player approaches
      npcsList.forEach(npc => {
        const dist = Math.hypot(playerGroup.position.x - npc.pos.x, playerGroup.position.z - npc.pos.z);
        if (dist < 7.5) {
          npc.waveArm.rotation.x = -Math.PI / 2 + Math.sin(elapsedTime * 8) * 0.4;
          npc.waveArm.rotation.z = Math.sin(elapsedTime * 6) * 0.25;
        } else {
          npc.waveArm.rotation.x = Math.sin(elapsedTime * 1.5) * 0.06;
          npc.waveArm.rotation.z = 0;
        }
      });

      // Update 3D GPS Compass Arrow & Distance
      compassArrowGroup.position.x = playerGroup.position.x;
      compassArrowGroup.position.z = playerGroup.position.z;

      const targetX = activeCompassTarget.position[0];
      const targetZ = activeCompassTarget.position[2];
      const tdx = targetX - playerGroup.position.x;
      const tdz = targetZ - playerGroup.position.z;
      const compassAngle = Math.atan2(tdx, tdz);
      compassArrowGroup.rotation.y = compassAngle;

      const pulse = 1 + Math.sin(elapsedTime * 4.5) * 0.08;
      compassArrowGroup.scale.set(pulse, 1, pulse);

      // Sky Waypoint Light Beam on target building
      beaconMesh.position.set(targetX, activeCompassTarget.height + 25, targetZ);
      beaconMesh.rotation.y += 0.02;
      (beaconMesh.material as THREE.MeshBasicMaterial).color.setHex(activeCompassTarget.neonColor);
      (arrowMesh.material as THREE.MeshBasicMaterial).color.setHex(activeCompassTarget.neonColor);
      (ringMesh.material as THREE.MeshBasicMaterial).color.setHex(activeCompassTarget.neonColor);

      const curDist = Math.round(Math.hypot(tdx, tdz));
      setDistanceToTarget(curDist);

      // Coordinates
      setPlayerCoord({
        x: Math.round(playerGroup.position.x * 10) / 10,
        z: Math.round(playerGroup.position.z * 10) / 10
      });

      // Proximity check for NPC Dialogue
      const near = checkNearestBuilding(playerGroup.position.x, playerGroup.position.z);
      if (near) {
        if (near.id !== dismissedId) {
          setActiveDialogue(near);
        }
      } else {
        setActiveDialogue(null);
        setDismissedId(null);
      }

      // Smooth Orbit Camera behind character
      let angleDiff = targetCameraYaw - cameraYaw;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      cameraYaw += angleDiff * (isMobile ? 0.065 : 0.055);

      const camDist = isMobile ? 11.4 : 8.8;
      const camHeight = isMobile ? 5.8 : 4.4;

      const targetCamX = playerGroup.position.x - Math.sin(cameraYaw) * camDist;
      const targetCamZ = playerGroup.position.z - Math.cos(cameraYaw) * camDist;
      const targetCamY = playerGroup.position.y + camHeight;

      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.1);
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
      cancelAnimationFrame(animId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [onBuildingSelect, dismissedId, activeCompassTarget]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ========================================================= */}
      {/* SMART GPS COMPASS NAVIGATOR (TOP-CENTER HUD) */}
      {/* ========================================================= */}
      <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 shadow-xl text-xs max-w-[94vw]">
          <div className="flex items-center gap-1 font-mono text-cyan-400 font-bold flex-shrink-0">
            <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="hidden xs:inline">GPS:</span>
          </div>

          <div className="relative flex items-center">
            <select
              value={activeCompassTarget.id}
              onChange={(e) => {
                const found = portfolioProjects.find(item => item.id === e.target.value);
                if (found) {
                  setActiveCompassTarget(found);
                  if (alignCameraToTargetRef.current) {
                    setTimeout(() => alignCameraToTargetRef.current?.(), 50);
                  }
                }
              }}
              className="bg-slate-900 text-white font-bold cursor-pointer rounded-lg px-2 py-0.5 text-xs outline-none border border-white/10 max-w-[130px] sm:max-w-[200px] truncate"
            >
              {portfolioProjects.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-950 text-white">
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 pointer-events-none" />
          </div>

          <span 
            className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ 
              backgroundColor: `#${activeCompassTarget.neonColor.toString(16).padStart(6, '0')}22`,
              color: `#${activeCompassTarget.neonColor.toString(16).padStart(6, '0')}`
            }}
          >
            {distanceToTarget}m
          </span>

          <button
            onClick={() => alignCameraToTargetRef.current?.()}
            className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] sm:text-xs flex items-center gap-1 shadow cursor-pointer active:scale-95 flex-shrink-0"
            title="Hadapkan karakter dan kamera presisi lurus ke gedung tujuan"
          >
            <Target className="w-3 h-3" />
            <span className="hidden sm:inline">Arahkan</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE RADAR TOGGLE BUTTON (COMPACT PILL IN TOP-LEFT) */}
      {/* ========================================================= */}
      <div className="sm:hidden absolute top-28 left-3 z-30 pointer-events-auto">
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
              const isTarget = activeCompassTarget.id === b.id;
              return (
                <div
                  key={b.id}
                  title={b.name}
                  onClick={() => {
                    setActiveCompassTarget(b);
                    alignCameraToTargetRef.current?.();
                  }}
                  className={`absolute w-2.5 h-2.5 rounded-sm -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer ${
                    isTarget ? 'ring-2 ring-white scale-150 animate-pulse' : ''
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
        <div className="sm:hidden absolute top-28 left-3 right-3 z-40 bg-slate-950/95 backdrop-blur-xl rounded-2xl p-4 border border-cyan-500/40 shadow-2xl space-y-3 animate-fade-in pointer-events-auto">
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
                const isTarget = activeCompassTarget.id === b.id;
                return (
                  <div
                    key={b.id}
                    title={b.name}
                    className={`absolute w-3 h-3 rounded-sm -translate-x-1/2 -translate-y-1/2 transition-all ${
                      isTarget ? 'ring-2 ring-white scale-150 animate-pulse' : ''
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
                  setActiveCompassTarget(b);
                  if (playerTeleportRef.current) {
                    playerTeleportRef.current(b.position[0], b.position[2] + (b.position[2] < 0 ? 5 : -5));
                  }
                  setMobileRadarOpen(false);
                  setDismissedId(null);
                  setActiveDialogue(b);
                  setTimeout(() => alignCameraToTargetRef.current?.(), 100);
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
                setActiveCompassTarget(b);
                if (playerTeleportRef.current) {
                  playerTeleportRef.current(b.position[0], b.position[2] + (b.position[2] < 0 ? 5 : -5));
                }
                setDismissedId(null);
                setActiveDialogue(b);
                setTimeout(() => alignCameraToTargetRef.current?.(), 100);
              }}
              className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                activeCompassTarget.id === b.id
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
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-3">
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

            <div 
              onClick={() => {
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
      {/* MOBILE TOUCH CONTROLS (VIRTUAL D-PAD & JUMP) */}
      {/* ========================================================= */}
      <div className="sm:hidden absolute bottom-5 left-3 z-30 pointer-events-auto">
        <div className="grid grid-cols-3 gap-1.5 w-32 h-32 p-1.5 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/10 shadow-2xl">
          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); mobileInputRef.current.forward = true; }}
            onTouchEnd={(e) => { e.preventDefault(); mobileInputRef.current.forward = false; }}
            onMouseDown={() => { mobileInputRef.current.forward = true; }}
            onMouseUp={() => { mobileInputRef.current.forward = false; }}
            className="flex items-center justify-center rounded-xl bg-slate-800/80 active:bg-cyan-500 text-white active:text-slate-950 shadow touch-none"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <div />

          <button
            onTouchStart={(e) => { e.preventDefault(); mobileInputRef.current.left = true; }}
            onTouchEnd={(e) => { e.preventDefault(); mobileInputRef.current.left = false; }}
            onMouseDown={() => { mobileInputRef.current.left = true; }}
            onMouseUp={() => { mobileInputRef.current.left = false; }}
            className="flex items-center justify-center rounded-xl bg-slate-800/80 active:bg-cyan-500 text-white active:text-slate-950 shadow touch-none"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center justify-center text-[9px] text-cyan-400/70 font-mono font-bold">
            MOVE
          </div>
          <button
            onTouchStart={(e) => { e.preventDefault(); mobileInputRef.current.right = true; }}
            onTouchEnd={(e) => { e.preventDefault(); mobileInputRef.current.right = false; }}
            onMouseDown={() => { mobileInputRef.current.right = true; }}
            onMouseUp={() => { mobileInputRef.current.right = false; }}
            className="flex items-center justify-center rounded-xl bg-slate-800/80 active:bg-cyan-500 text-white active:text-slate-950 shadow touch-none"
          >
            <ArrowRight className="w-6 h-6" />
          </button>

          <div />
          <button
            onTouchStart={(e) => { e.preventDefault(); mobileInputRef.current.backward = true; }}
            onTouchEnd={(e) => { e.preventDefault(); mobileInputRef.current.backward = false; }}
            onMouseDown={() => { mobileInputRef.current.backward = true; }}
            onMouseUp={() => { mobileInputRef.current.backward = false; }}
            className="flex items-center justify-center rounded-xl bg-slate-800/80 active:bg-cyan-500 text-white active:text-slate-950 shadow touch-none"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
          <div />
        </div>
      </div>

      {/* Mobile Jump Button */}
      <div className="sm:hidden absolute bottom-5 right-3 z-30 pointer-events-auto">
        <button
          onTouchStart={(e) => { e.preventDefault(); mobileInputRef.current.jump = true; }}
          onTouchEnd={(e) => { e.preventDefault(); mobileInputRef.current.jump = false; }}
          onMouseDown={() => { mobileInputRef.current.jump = true; }}
          onMouseUp={() => { mobileInputRef.current.jump = false; }}
          className="w-16 h-16 rounded-full bg-cyan-500 active:bg-cyan-400 text-slate-950 font-black text-xs shadow-2xl flex flex-col items-center justify-center gap-0.5 border-2 border-white/20 active:scale-95 touch-none"
        >
          <Footprints className="w-5 h-5" />
          <span>JUMP</span>
        </button>
      </div>
    </div>
  );
};
