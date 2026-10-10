import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Volume2, 
  VolumeX, 
  Coffee, 
  ShoppingBag, 
  Zap, 
  Check, 
  MessageCircle, 
  Copy, 
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  ShieldCheck,
  Star
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../utils/audioManager';
import { DIGITAL_PRODUCTS, type DigitalProduct } from '../data/creativeProducts';
import { projectStorage } from '../utils/projectStorage';
import { type CharacterGender } from '../utils/translations';

interface CreativeLoungeWorldProps {
  onSwitchDimension: (dimension: 'business' | 'kids' | 'creative') => void;
  lang?: 'id' | 'en';
  initialGender?: CharacterGender;
  onGenderChange?: (gender: CharacterGender) => void;
}

interface CafeVisitorNPC {
  group: THREE.Group;
  name: string;
  role: string;
  dialogue: string;
  targetPos: THREE.Vector3;
  idleTimer: number;
  legL: THREE.Mesh;
  legR: THREE.Mesh;
}

export const CreativeLoungeWorld: React.FC<CreativeLoungeWorldProps> = ({ 
  onSwitchDimension,
  initialGender = 'male',
  onGenderChange
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Dynamic Products from storage
  const [productsList, setProductsList] = useState<DigitalProduct[]>(() => projectStorage.getCreativeProducts());

  useEffect(() => {
    projectStorage.loadCreativeProducts().then((prods) => {
      if (prods && prods.length > 0) {
        setProductsList(prods);
      }
    });
  }, []);

  // Character gender & Day/Night state
  const [gender, setGender] = useState<CharacterGender>(initialGender);
  const [showGenderModal, setShowGenderModal] = useState<boolean>(() => {
    return !localStorage.getItem('fargan_cafe_gender_chosen');
  });

  const getIsNight = () => {
    const hours = new Date().getHours();
    return hours >= 19 || hours < 5;
  };
  const [isNightTime, setIsNightTime] = useState<boolean>(getIsNight());

  // Real-time Day/Night update
  useEffect(() => {
    const interval = setInterval(() => {
      setIsNightTime(getIsNight());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Audio & Modals
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [showToolModal, setShowToolModal] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState<{ name: string; role: string; text: string } | null>(null);

  // Free AI Tool State inside Cafe
  const [promptTopic, setPromptTopic] = useState('');
  const [generatedHook, setGeneratedHook] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const playerTargetRef = useRef<THREE.Vector3 | null>(null);
  const clickMarkerRef = useRef<THREE.Mesh | null>(null);
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false, jump: false });
  const isJumpingRef = useRef(false);
  const jumpVelocityRef = useRef(0);
  const legRefs = useRef<{ legL: THREE.Mesh | null; legR: THREE.Mesh | null }>({ legL: null, legR: null });
  const npcsRef = useRef<CafeVisitorNPC[]>([]);
  const kioskMeshesRef = useRef<THREE.Mesh[]>([]);

  // Function to build Anime Character Avatar
  const createAnimeAvatar = (isFemale: boolean, accentColor = 0x00f5ff) => {
    const group = new THREE.Group();

    // Skin & Clothes
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xFAD090, roughness: 0.5 });
    const clothMat = new THREE.MeshStandardMaterial({
      color: isFemale ? 0x2A1230 : 0x111625,
      roughness: 0.4
    });
    const secondaryClothMat = new THREE.MeshStandardMaterial({
      color: isFemale ? 0x4A0E4E : 0x1E293B,
      roughness: 0.35
    });
    const neonMat = new THREE.MeshStandardMaterial({
      color: isFemale ? 0xEC4899 : accentColor,
      emissive: isFemale ? 0xDB2777 : accentColor,
      emissiveIntensity: 0.65
    });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x0B0F19, roughness: 0.6 });

    // 1. Face Canvas
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 128;
    faceCanvas.height = 128;
    const fctx = faceCanvas.getContext('2d');
    if (fctx) {
      fctx.fillStyle = '#FAD090';
      fctx.fillRect(0, 0, 128, 128);

      if (isFemale) {
        // Cute Anime Female Eyes & Blush
        fctx.fillStyle = '#1e1b4b';
        fctx.fillRect(26, 42, 20, 24);
        fctx.fillRect(82, 42, 20, 24);
        // Lashes
        fctx.fillStyle = '#0f172a';
        fctx.fillRect(22, 38, 26, 5);
        fctx.fillRect(80, 38, 26, 5);
        // Reflections
        fctx.fillStyle = '#f43f5e';
        fctx.fillRect(32, 46, 8, 10);
        fctx.fillRect(88, 46, 8, 10);
        fctx.fillStyle = '#ffffff';
        fctx.fillRect(36, 48, 4, 4);
        fctx.fillRect(92, 48, 4, 4);
        // Soft blush
        fctx.fillStyle = '#fda4af';
        fctx.fillRect(20, 70, 14, 6);
        fctx.fillRect(94, 70, 14, 6);
        // Cute smile
        fctx.fillStyle = '#be123c';
        fctx.beginPath();
        fctx.arc(64, 86, 12, 0.1 * Math.PI, 0.9 * Math.PI);
        fctx.lineWidth = 4;
        fctx.stroke();
      } else {
        // Anime Male Eyes
        fctx.fillStyle = '#111625';
        fctx.fillRect(28, 42, 18, 26);
        fctx.fillRect(82, 42, 18, 26);
        fctx.fillStyle = '#00E5FF';
        fctx.fillRect(32, 46, 8, 10);
        fctx.fillRect(86, 46, 8, 10);
        fctx.fillStyle = '#ffffff';
        fctx.fillRect(34, 48, 4, 4);
        fctx.fillRect(88, 48, 4, 4);
        // Confident smirk
        fctx.fillStyle = '#111625';
        fctx.beginPath();
        fctx.arc(64, 86, 15, 0.1 * Math.PI, 0.9 * Math.PI);
        fctx.lineWidth = 5;
        fctx.stroke();
      }
    }
    const faceTex = new THREE.CanvasTexture(faceCanvas);
    const headMats = [
      skinMat, skinMat, skinMat, skinMat,
      new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.5 }),
      skinMat
    ];

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), headMats);
    head.position.y = 2.1;
    head.castShadow = true;
    group.add(head);

    // Hair / Accessories
    if (isFemale) {
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.4 });
      const hairTop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), hairMat);
      hairTop.position.set(0, 2.7, 0);
      group.add(hairTop);

      const ponytail = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.1, 0.45), hairMat);
      ponytail.position.set(0, 2.45, -0.7);
      ponytail.rotation.x = -0.3;
      group.add(ponytail);

      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.18, 0.3), neonMat);
      ribbon.position.set(0, 2.75, -0.5);
      group.add(ribbon);

      // Cute Cyber Antennas
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 4), neonMat);
      earL.position.set(-0.55, 2.9, 0);
      earL.rotation.z = 0.2;
      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 4), neonMat);
      earR.position.set(0.55, 2.9, 0);
      earR.rotation.z = -0.2;
      group.add(earL, earR);
    } else {
      // Gaming Cyber Headphone
      const band = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.2, 0.5), clothMat);
      band.position.set(0, 2.7, 0);
      group.add(band);

      const earGeo = new THREE.BoxGeometry(0.25, 0.5, 0.5);
      const leftEar = new THREE.Mesh(earGeo, neonMat);
      leftEar.position.set(-0.65, 2.15, 0);
      const rightEar = new THREE.Mesh(earGeo, neonMat);
      rightEar.position.set(0.65, 2.15, 0);
      group.add(leftEar, rightEar);
    }

    // Torso (Cyber Hoodie)
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.3, 0.9), secondaryClothMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    const logoStrip = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.9, 0.92), neonMat);
    logoStrip.position.set(0, 1.05, 0.02);
    group.add(logoStrip);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.45, 1.2, 0.45);
    const armL = new THREE.Mesh(armGeo, clothMat);
    armL.position.set(-0.95, 1.05, 0);
    const armR = new THREE.Mesh(armGeo, clothMat);
    armR.position.set(0.95, 1.05, 0);
    group.add(armL, armR);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.45, 0.8, 0.5);
    const legL = new THREE.Mesh(legGeo, pantsMat);
    legL.position.set(-0.35, 0.4, 0);
    legL.castShadow = true;
    const legR = new THREE.Mesh(legGeo, pantsMat);
    legR.position.set(0.35, 0.4, 0);
    legR.castShadow = true;
    group.add(legL, legR);

    // Cyber shoes
    const shoeGeo = new THREE.BoxGeometry(0.5, 0.18, 0.65);
    const shoeL = new THREE.Mesh(shoeGeo, neonMat);
    shoeL.position.set(-0.35, 0.09, 0.05);
    const shoeR = new THREE.Mesh(shoeGeo, neonMat);
    shoeR.position.set(0.35, 0.09, 0.05);
    group.add(shoeL, shoeR);

    return { group, legL, legR };
  };

  // Helper for Floating Hologram Text/Banner
  const createHologramBanner = (text: string, subtext: string, colorHex: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(10, 10, 30, 0.85)';
      ctx.roundRect ? ctx.roundRect(10, 10, 492, 236, 24) : ctx.rect(10, 10, 492, 236);
      ctx.fill();

      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 6;
      ctx.roundRect ? ctx.roundRect(10, 10, 492, 236, 24) : ctx.rect(10, 10, 492, 236);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(text, 256, 90);

      ctx.fillStyle = colorHex;
      ctx.font = 'bold 32px monospace';
      ctx.fillText(subtext, 256, 160);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('⚡ KLIK UNTUK BELI VIA WA', 256, 210);
    }
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(4.5, 2.25, 1);
    return sprite;
  };

  // Setup Three.js Cafe Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const isMobile = width < 768;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const skyColor = isNightTime ? 0x070913 : 0x7dd3fc;
    const fogColor = isNightTime ? 0x070913 : 0xbae6fd;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(fogColor, isNightTime ? 0.022 : 0.015);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 300);
    camera.position.set(0, 12, 20);
    cameraRef.current = camera;

    // 3. Renderer (mobile optimized)
    const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isMobile ? 1.25 : Math.min(window.devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = !isMobile;
    if (!isMobile) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting based on Real-Time Day / Night
    if (isNightTime) {
      const ambientLight = new THREE.AmbientLight(0x1a1236, 1.4);
      scene.add(ambientLight);

      const warmBarLight = new THREE.PointLight(0xffaa44, 3, 30);
      warmBarLight.position.set(0, 9, -10);
      if (!isMobile) warmBarLight.castShadow = true;
      scene.add(warmBarLight);

      const neonCyan = new THREE.PointLight(0x00f5ff, 2.5, 28);
      neonCyan.position.set(-14, 6, -6);
      scene.add(neonCyan);

      const neonPink = new THREE.PointLight(0xff007f, 2.5, 28);
      neonPink.position.set(14, 6, -6);
      scene.add(neonPink);
    } else {
      // Day Sun & Bright Cafe Light
      const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
      sunLight.position.set(15, 24, 15);
      if (!isMobile) sunLight.castShadow = true;
      scene.add(sunLight);

      const warmFill = new THREE.PointLight(0xffedd5, 1.5, 25);
      warmFill.position.set(0, 8, 0);
      scene.add(warmFill);
    }

    // 5. Rooftop Cafe Deck
    const deckGeo = new THREE.BoxGeometry(40, 1, 34);
    const deckMat = new THREE.MeshStandardMaterial({
      color: isNightTime ? 0x181422 : 0xd6c7b2, // Dark cyber wood at night, bright latte timber at day
      roughness: 0.7,
      metalness: 0.15,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = -0.5;
    deck.receiveShadow = true;
    scene.add(deck);

    // Neon edge border
    const borderGeo = new THREE.BoxGeometry(40.4, 0.4, 34.4);
    const borderMat = new THREE.MeshBasicMaterial({ 
      color: isNightTime ? 0x8338ec : 0x0284c7, 
      wireframe: true 
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = 0.1;
    scene.add(border);

    // Decorative City Skylines / Rooftop Planters
    [-19, 19].forEach((px) => {
      for (let pz = -14; pz <= 14; pz += 7) {
        const planter = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 1.2, 4),
          new THREE.MeshStandardMaterial({ color: isNightTime ? 0x221338 : 0x57534e })
        );
        planter.position.set(px, 0.6, pz);
        scene.add(planter);

        const bush = new THREE.Mesh(
          new THREE.DodecahedronGeometry(1.2),
          new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.8 })
        );
        bush.position.set(px, 1.8, pz);
        scene.add(bush);
      }
    });

    // Click marker
    const markerGeo = new THREE.RingGeometry(0.4, 0.8, 32);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, side: THREE.DoubleSide });
    const clickMarker = new THREE.Mesh(markerGeo, markerMat);
    clickMarker.rotation.x = -Math.PI / 2;
    clickMarker.position.y = 0.05;
    clickMarker.visible = false;
    scene.add(clickMarker);
    clickMarkerRef.current = clickMarker;

    // 6. CAFE BAR COUNTER & SIGNBOARD
    const barCounter = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2.4, 3),
      new THREE.MeshStandardMaterial({ 
        color: isNightTime ? 0x3d0066 : 0x7c2d12, 
        roughness: 0.3 
      })
    );
    barCounter.position.set(0, 1.2, -10);
    barCounter.castShadow = true;
    barCounter.receiveShadow = true;
    scene.add(barCounter);

    // Espresso Machine & Coffee Cups
    const coffeeMachine = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.8, 1.5),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 })
    );
    coffeeMachine.position.set(4, 3.1, -10);
    scene.add(coffeeMachine);

    // Neon / Billboard Cafe Sign
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = isNightTime ? '#050510' : '#1e1b4b';
      sCtx.fillRect(0, 0, 512, 128);
      sCtx.fillStyle = '#FF007F';
      sCtx.font = 'bold 32px sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText('☕ FARGAN DIGITAL CAFE & LAB', 256, 50);
      sCtx.fillStyle = '#00F5FF';
      sCtx.font = 'bold 20px monospace';
      sCtx.fillText('BEST DIGITAL PRODUCTS & AI TOOLS', 256, 95);
    }
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 3.5),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signMesh.position.set(0, 5.5, -10);
    scene.add(signMesh);

    // 7. BARISTA NPC BEHIND THE COUNTER (Alex - AI Digital Consultant)
    const baristaAvatar = createAnimeAvatar(false, 0xffb703);
    baristaAvatar.group.position.set(0, 0, -12);
    scene.add(baristaAvatar.group);

    // Barista Floating Nametag
    const bTagCanvas = document.createElement('canvas');
    bTagCanvas.width = 256;
    bTagCanvas.height = 96;
    const bCtx = bTagCanvas.getContext('2d');
    if (bCtx) {
      bCtx.fillStyle = 'rgba(0,0,0,0.85)';
      bCtx.fillRect(0, 0, 256, 96);
      bCtx.strokeStyle = '#00F5FF';
      bCtx.lineWidth = 4;
      bCtx.strokeRect(0, 0, 256, 96);
      bCtx.textAlign = 'center';
      bCtx.fillStyle = '#00F5FF';
      bCtx.font = 'bold 26px sans-serif';
      bCtx.fillText('☕ ALEX (BARISTA)', 128, 40);
      bCtx.fillStyle = '#facc15';
      bCtx.font = 'bold 20px sans-serif';
      bCtx.fillText('AI Digital Consultant', 128, 76);
    }
    const bTagTex = new THREE.CanvasTexture(bTagCanvas);
    const bTagSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bTagTex, transparent: true }));
    bTagSprite.position.set(0, 4.2, -12);
    bTagSprite.scale.set(3, 1.2, 1);
    scene.add(bTagSprite);

    // 8. 4 DIGITAL PRODUCT KIOSKS WITH 3D HOLOGRAM LABELS
    const currentProds = projectStorage.getCreativeProducts();
    const kioskCoords = [
      { x: -11, z: -2, color: '#00f5ff' },
      { x: -4, z: -2, color: '#ff007f' },
      { x: 4, z: -2, color: '#8338ec' },
      { x: 11, z: -2, color: '#ffb703' },
    ];
    const createdKiosks: THREE.Mesh[] = [];

    kioskCoords.forEach((coord, idx) => {
      const prod = currentProds[idx] || DIGITAL_PRODUCTS[idx];
      const kGroup = new THREE.Group();
      kGroup.position.set(coord.x, 0, coord.z);

      // Kiosk pedestal
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 2, 2.2, 16),
        new THREE.MeshStandardMaterial({ 
          color: isNightTime ? 0x180b33 : 0x475569, 
          metalness: 0.6, 
          roughness: 0.3 
        })
      );
      ped.position.y = 1.1;
      ped.castShadow = true;
      kGroup.add(ped);

      // Glowing Base Ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.7, 0.12, 16, 32),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(coord.color) })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.1;
      kGroup.add(ring);

      // Floating Hologram Product Cube
      const holoGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
      const holoMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(coord.color),
        emissive: new THREE.Color(coord.color),
        emissiveIntensity: 0.6,
        roughness: 0.2,
      });
      const holoMesh = new THREE.Mesh(holoGeo, holoMat);
      holoMesh.position.y = 3.2;
      holoMesh.castShadow = true;
      holoMesh.userData = { product: prod, kioskIndex: idx };
      kGroup.add(holoMesh);
      createdKiosks.push(holoMesh);

      // Floating Hologram 3D Billboard above Kiosk
      const holoBanner = createHologramBanner(
        prod.title.length > 22 ? prod.title.slice(0, 20) + '...' : prod.title,
        prod.price,
        coord.color
      );
      holoBanner.position.set(0, 5.2, 0);
      kGroup.add(holoBanner);

      scene.add(kGroup);
    });
    kioskMeshesRef.current = createdKiosks;

    // 9. COZY CAFE TABLES & CANDLES
    const tablePositions = [
      { x: -12, z: 6 },
      { x: -12, z: 12 },
      { x: 12, z: 6 },
      { x: 12, z: 12 },
    ];
    tablePositions.forEach((tp) => {
      const table = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 1.6, 16),
        new THREE.MeshStandardMaterial({ 
          color: isNightTime ? 0x2e1065 : 0x78716c, 
          roughness: 0.4 
        })
      );
      table.position.set(tp.x, 0.8, tp.z);
      table.castShadow = true;
      scene.add(table);

      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8),
        new THREE.MeshBasicMaterial({ color: 0xffdd88 })
      );
      candle.position.set(tp.x, 1.9, tp.z);
      scene.add(candle);
    });

    // 10. ROAMING CAFE VISITORS & CUSTOMERS (NPCs)
    const visitorConfigs = [
      { 
        name: 'Nadia', 
        role: 'Gen-Z Creator', 
        isFemale: true, 
        color: 0xec4899,
        dialogue: 'Template Canva & Notion dari Fargan estetik banget! Followerku naik 3x lipat.',
        initX: -6, 
        initZ: 5 
      },
      { 
        name: 'Rian', 
        role: 'Tech Solopreneur', 
        isFemale: false, 
        color: 0x06b6d4,
        dialogue: 'Prompt Engine 500+ ini hemat waktu riset saya berjam-jam. Recommended parah!',
        initX: 6, 
        initZ: 5 
      },
      { 
        name: 'Maya', 
        role: 'Digital Nomad', 
        isFemale: true, 
        color: 0xa855f7,
        dialogue: 'Suka banget nongkrong di cafe virtual ini sambil dengerin Lo-Fi beats.',
        initX: 0, 
        initZ: 2 
      }
    ];

    const npcsList: CafeVisitorNPC[] = [];
    visitorConfigs.forEach((cfg) => {
      const avatar = createAnimeAvatar(cfg.isFemale, cfg.color);
      avatar.group.position.set(cfg.initX, 0, cfg.initZ);

      // Name sprite
      const vCanvas = document.createElement('canvas');
      vCanvas.width = 256;
      vCanvas.height = 72;
      const vCtx = vCanvas.getContext('2d');
      if (vCtx) {
        vCtx.fillStyle = 'rgba(0,0,0,0.8)';
        vCtx.fillRect(0, 0, 256, 72);
        vCtx.strokeStyle = cfg.isFemale ? '#ec4899' : '#06b6d4';
        vCtx.lineWidth = 3;
        vCtx.strokeRect(0, 0, 256, 72);
        vCtx.textAlign = 'center';
        vCtx.fillStyle = '#ffffff';
        vCtx.font = 'bold 24px sans-serif';
        vCtx.fillText(`${cfg.name} (${cfg.role})`, 128, 44);
      }
      const vTex = new THREE.CanvasTexture(vCanvas);
      const vSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: vTex, transparent: true }));
      vSprite.position.set(0, 3.8, 0);
      vSprite.scale.set(3, 1, 1);
      avatar.group.add(vSprite);

      scene.add(avatar.group);

      npcsList.push({
        group: avatar.group,
        name: cfg.name,
        role: cfg.role,
        dialogue: cfg.dialogue,
        targetPos: new THREE.Vector3(cfg.initX, 0, cfg.initZ),
        idleTimer: Math.random() * 4,
        legL: avatar.legL,
        legR: avatar.legR
      });
    });
    npcsRef.current = npcsList;

    // 11. PLAYER AVATAR (Male or Female based on State)
    const playerAvatar = createAnimeAvatar(gender === 'female', 0x00f5ff);
    playerAvatar.group.position.set(0, 0, 9);
    scene.add(playerAvatar.group);
    playerRef.current = playerAvatar.group;
    legRefs.current = { legL: playerAvatar.legL, legR: playerAvatar.legR };

    // 12. RAYCASTER FOR CLICK TO MOVE & KIOSK / NPC SELECTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.lounge-overlay') || target.closest('input')) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const rect = container.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // 1. Check if clicking on Kiosks directly
      const kioskHits = raycaster.intersectObjects(kioskMeshesRef.current);
      if (kioskHits.length > 0) {
        const hit = kioskHits[0];
        const prod = hit.object.userData?.product as DigitalProduct;
        if (prod) {
          // Walk to kiosk
          const targetX = hit.object.parent ? hit.object.parent.position.x : hit.point.x;
          const targetZ = hit.object.parent ? hit.object.parent.position.z + 2.5 : hit.point.z;
          playerTargetRef.current = new THREE.Vector3(targetX, 0, targetZ);
          if (clickMarkerRef.current) {
            clickMarkerRef.current.position.set(targetX, 0.05, targetZ);
            clickMarkerRef.current.visible = true;
          }
          soundEngine.playFootstep();

          // Open product modal directly
          setTimeout(() => {
            setSelectedProduct(prod);
            soundEngine.playTypewriterBlip();
          }, 300);
          return;
        }
      }

      // 2. Check if clicking Barista
      const baristaHit = raycaster.intersectObject(baristaAvatar.group, true);
      if (baristaHit.length > 0) {
        setActiveDialogue({
          name: 'Alex',
          role: 'AI Barista & Consultant',
          text: 'Selamat datang di Fargan Creative Cafe! Mau kopi digital hangat atau butuh rekomendasi AI Tools & Template bisnis terbaik untuk scale-up tokomu?'
        });
        soundEngine.playTypewriterBlip();
        return;
      }

      // 3. Check if clicking on Walkable Deck
      const intersects = raycaster.intersectObject(deck);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        playerTargetRef.current = new THREE.Vector3(point.x, 0, point.z);

        if (clickMarkerRef.current) {
          clickMarkerRef.current.position.set(point.x, 0.05, point.z);
          clickMarkerRef.current.visible = true;
        }
        soundEngine.playFootstep();
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);

    // Keyboard Controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.forward = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.backward = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (e.code === 'Space') {
        if (!isJumpingRef.current) {
          isJumpingRef.current = true;
          jumpVelocityRef.current = 0.3;
          soundEngine.playJump();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.forward = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.backward = false;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // 13. ANIMATION LOOP
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Rotate Hologram Product Cubes
      kioskMeshesRef.current.forEach((kMesh, i) => {
        kMesh.rotation.y += 0.015;
        kMesh.rotation.x = Math.sin(elapsed * 1.5 + i) * 0.15;
        kMesh.position.y = 3.2 + Math.sin(elapsed * 2 + i) * 0.18;
      });

      // Animate NPCs (Wandering around Cafe)
      npcsRef.current.forEach((npc, i) => {
        npc.idleTimer -= delta;
        if (npc.idleTimer <= 0) {
          // Pick new random spot in cafe
          const rx = (Math.random() - 0.5) * 26;
          const rz = (Math.random() - 0.5) * 18 + 2;
          npc.targetPos.set(rx, 0, rz);
          npc.idleTimer = 4 + Math.random() * 5;
        }

        const npcDir = new THREE.Vector3().subVectors(npc.targetPos, npc.group.position);
        npcDir.y = 0;
        const npcDist = npcDir.length();

        if (npcDist > 0.4) {
          npcDir.normalize();
          npc.group.position.x += npcDir.x * 2.8 * delta;
          npc.group.position.z += npcDir.z * 2.8 * delta;
          npc.group.rotation.y = Math.atan2(npcDir.x, npcDir.z);

          npc.legL.rotation.x = Math.sin(elapsed * 8 + i) * 0.4;
          npc.legR.rotation.x = -Math.sin(elapsed * 8 + i) * 0.4;
        } else {
          npc.legL.rotation.x = 0;
          npc.legR.rotation.x = 0;
        }
      });

      // Animate Barista Subtle Greeting Sway
      baristaAvatar.group.rotation.y = Math.sin(elapsed * 1.2) * 0.2;

      // Player Movement Logic
      if (playerRef.current) {
        let moveX = 0;
        let moveZ = 0;
        const speed = 11 * delta;
        const { legL, legR } = legRefs.current;

        if (playerTargetRef.current) {
          const currentPos = new THREE.Vector3(playerRef.current.position.x, 0, playerRef.current.position.z);
          const dir = new THREE.Vector3().subVectors(playerTargetRef.current, currentPos);
          const dist = dir.length();

          if (dist > 0.4) {
            dir.normalize();
            playerRef.current.position.x += dir.x * speed;
            playerRef.current.position.z += dir.z * speed;
            playerRef.current.rotation.y = Math.atan2(dir.x, dir.z);

            if (legL && legR) {
              legL.rotation.x = Math.sin(elapsed * 12) * 0.5;
              legR.rotation.x = -Math.sin(elapsed * 12) * 0.5;
            }
          } else {
            playerTargetRef.current = null;
            if (clickMarkerRef.current) clickMarkerRef.current.visible = false;
            if (legL && legR) {
              legL.rotation.x = 0;
              legR.rotation.x = 0;
            }
          }
        } else {
          if (keysRef.current.forward) moveZ -= 1;
          if (keysRef.current.backward) moveZ += 1;
          if (keysRef.current.left) moveX -= 1;
          if (keysRef.current.right) moveX += 1;

          if (moveX !== 0 || moveZ !== 0) {
            const moveVec = new THREE.Vector3(moveX, 0, moveZ).normalize();
            playerRef.current.position.x += moveVec.x * speed;
            playerRef.current.position.z += moveVec.z * speed;
            playerRef.current.rotation.y = Math.atan2(moveVec.x, moveVec.z);

            if (legL && legR) {
              legL.rotation.x = Math.sin(elapsed * 12) * 0.5;
              legR.rotation.x = -Math.sin(elapsed * 12) * 0.5;
            }
          } else {
            if (legL && legR) {
              legL.rotation.x = 0;
              legR.rotation.x = 0;
            }
          }
        }

        // Clamp inside rooftop deck
        playerRef.current.position.x = Math.max(-18, Math.min(18, playerRef.current.position.x));
        playerRef.current.position.z = Math.max(-14, Math.min(15, playerRef.current.position.z));

        // Jump physics
        if (isJumpingRef.current) {
          playerRef.current.position.y += jumpVelocityRef.current;
          jumpVelocityRef.current -= 0.018;
          if (playerRef.current.position.y <= 0) {
            playerRef.current.position.y = 0;
            isJumpingRef.current = false;
            jumpVelocityRef.current = 0;
          }
        }

        // Camera Follow
        const targetCamX = playerRef.current.position.x;
        const targetCamY = playerRef.current.position.y + 9;
        const targetCamZ = playerRef.current.position.z + 14;
        camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.06);
        camera.lookAt(playerRef.current.position.x, playerRef.current.position.y + 1.2, playerRef.current.position.z);
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gender, isNightTime]);

  // Gender Selection Handler
  const handleSelectGender = (selected: CharacterGender) => {
    setGender(selected);
    localStorage.setItem('fargan_cafe_gender_chosen', selected);
    setShowGenderModal(false);
    if (onGenderChange) onGenderChange(selected);
    soundEngine.playJump();
  };

  const handleGenerateHook = () => {
    if (!promptTopic.trim()) return;
    const hooks = [
      `🔥 90% Orang Masih Salah Mengira Bahwa ${promptTopic} Itu Sulit. Ini Rahasia Praktisnya:`,
      `💡 Dari Modal Nol Jadi Ahli: Ini 3 Langkah Cerdas Menguasai ${promptTopic} di 2026!`,
      `⚠️ Jangan Pernah Mulai ${promptTopic} Sebelum Tahu 4 Aturan Emas Ini (Poin 3 Paling Krusial):`,
      `🚀 Cara Saya Menghemat 10 Jam Kerja Seminggu Hanya Menggunakan Formula ${promptTopic}:`
    ];
    const picked = hooks[Math.floor(Math.random() * hooks.length)];
    setGeneratedHook(picked);
    soundEngine.playTypewriterBlip();
  };

  const handleCopy = () => {
    if (!generatedHook) return;
    navigator.clipboard.writeText(generatedHook);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    soundEngine.playTypewriterBlip();
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-slate-950 font-sans">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-pointer" />

      {/* TOP HUD: Multi-Dimension Gateway Switcher */}
      <header className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-40 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Dimension Switcher Hub */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-slate-900/90 backdrop-blur-md shadow-lg border border-purple-500/40">
          <button
            onClick={() => onSwitchDimension('business')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-[11px] sm:text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
            title="Pindah ke Kota Bisnis & Portofolio B2B"
          >
            <span>🏢</span>
            <span className="hidden md:inline">Kota Bisnis</span>
          </button>

          <button
            onClick={() => onSwitchDimension('kids')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-pink-900/80 text-pink-200 hover:bg-pink-800 text-[11px] sm:text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
            title="Pindah ke Dunia Anak & Bioskop Cilik"
          >
            <span>🧸</span>
            <span className="hidden md:inline">Dunia Anak</span>
          </button>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white text-[11px] sm:text-xs font-black shadow-md shadow-purple-500/30 cursor-default"
          >
            <span>☕</span>
            <span>Cafe Kreatif</span>
            <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">AKTIF</span>
          </button>
        </div>

        {/* Right: Character Switcher, Time Mode & Sound Hub */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Avatar Switcher */}
          <button
            onClick={() => setShowGenderModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-purple-300 hover:text-white shadow border border-purple-500/30 cursor-pointer active:scale-95 transition-all text-xs font-bold"
            title="Ganti Karakter Avatar (Male / Female)"
          >
            <span>{gender === 'female' ? '👧' : '👦'}</span>
            <span className="hidden sm:inline">{gender === 'female' ? 'Female' : 'Male'}</span>
          </button>

          {/* Real-time Day/Night Indicator */}
          <div 
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-900/90 text-amber-300 shadow border border-amber-500/30 text-xs font-bold font-mono"
            title={isNightTime ? 'Waktu Malam (19:00 - 05:00)' : 'Waktu Siang (05:00 - 19:00)'}
          >
            {isNightTime ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden md:inline">{isNightTime ? 'Malam' : 'Siang'}</span>
          </div>

          {/* Free AI Tool Button */}
          <button
            onClick={() => setShowToolModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 border border-cyan-300/40 cursor-pointer active:scale-95 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">AI Tools Gratis</span>
            <span className="sm:hidden">AI Tools</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const newMuted = soundEngine.toggleMute();
              setSoundEnabled(!newMuted);
            }}
            className="p-2 rounded-2xl bg-slate-900/90 text-purple-300 hover:text-white shadow border border-purple-500/30 cursor-pointer active:scale-95 transition-all"
            title="Lo-Fi Ambient Beats"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </header>

      {/* FLOATING ACTION PILLS: Quick Jump to Catalog */}
      <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        <button
          onClick={() => setSelectedProduct(productsList[0] || DIGITAL_PRODUCTS[0])}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-500/40 border border-purple-400/40 cursor-pointer transition-all hover:scale-105 active:scale-95 animate-pulse"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Lihat Rak Produk Digital Unggulan 🛍️</span>
        </button>
      </div>

      {/* BOTTOM CONTROL & INSTRUCTION BAR */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-end justify-between pointer-events-none">
        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-purple-500/30 shadow-xl pointer-events-auto max-w-[280px] sm:max-w-xs space-y-1">
          <div className="flex items-center gap-1.5 text-purple-400 font-black text-xs">
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>FARGAN CREATIVE CAFE:</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            Sentuh lantai untuk jalan, klik hologram produk untuk belanja instan, atau ajak ngobrol barista dan pengunjung cafe!
          </p>
        </div>

        {/* Jump Button */}
        <button
          onClick={() => {
            if (!isJumpingRef.current && playerRef.current) {
              isJumpingRef.current = true;
              jumpVelocityRef.current = 0.3;
              soundEngine.playJump();
            }
          }}
          className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-purple-600/90 hover:bg-purple-500 text-white font-black text-xs flex flex-col items-center justify-center gap-0.5 shadow-2xl border border-purple-400/40 cursor-pointer active:scale-90 transition-all"
        >
          <span className="text-base">🚀</span>
          <span className="text-[9px] font-mono">LOMPAT</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL 0: WELCOME & GENDER SELECTION MODAL */}
      {/* ======================================================== */}
      {showGenderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-purple-500/50 shadow-2xl p-6 text-white text-center space-y-5 relative">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 mx-auto flex items-center justify-center mb-3">
                <Sparkles className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white">SELAMAT DATANG DI CAFE DIGITAL</h2>
              <p className="text-xs text-purple-300 font-mono mt-1">Pilih Karakter Avatar Anda Sebelum Masuk:</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Male Choice */}
              <button
                onClick={() => handleSelectGender('male')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  gender === 'male'
                    ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800/60 border-white/10 text-slate-300 hover:border-cyan-400/50'
                }`}
              >
                <span className="text-4xl">👦</span>
                <span className="text-sm font-black">Cowok (Male)</span>
                <span className="text-[10px] text-slate-400">Cyber Techwear Avatar</span>
              </button>

              {/* Female Choice */}
              <button
                onClick={() => handleSelectGender('female')}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95 ${
                  gender === 'female'
                    ? 'bg-pink-950/60 border-pink-400 text-pink-300 shadow-lg shadow-pink-500/20'
                    : 'bg-slate-800/60 border-white/10 text-slate-300 hover:border-pink-400/50'
                }`}
              >
                <span className="text-4xl">👧</span>
                <span className="text-sm font-black">Cewek (Female)</span>
                <span className="text-[10px] text-slate-400">Anime Cute Ribbon Avatar</span>
              </button>
            </div>

            <button
              onClick={() => handleSelectGender(gender)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-sm shadow-xl shadow-purple-500/30 cursor-pointer transition-all active:scale-95"
            >
              MASUK KE CAFE VIRTUAL ☕
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: PRODUCT SHOWCASE & INSTANT CHECKOUT */}
      {/* ======================================================== */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-purple-500/40 shadow-2xl p-5 sm:p-6 text-white relative space-y-4">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            {/* Badge & Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedProduct.icon}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                  {selectedProduct.badge}
                </span>
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-current" /> {selectedProduct.rating} ({selectedProduct.salesCount} Terjual)
                </span>
              </div>
              <h3 className="text-lg font-black mt-2 text-white">{selectedProduct.title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedProduct.description}</p>
            </div>

            {/* Pricing Box & QRIS Assurance */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400">HARGA SPESIAL HARI INI:</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-emerald-400">{selectedProduct.price}</span>
                  <span className="text-xs text-slate-500 line-through">{selectedProduct.originalPrice}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  HEMAT 60%+
                </span>
                <span className="text-[9px] font-mono text-cyan-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> QRIS &amp; Transfer Instan
                </span>
              </div>
            </div>

            {/* Features Checklist */}
            <div className="space-y-1.5 text-xs text-slate-200">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">YANG ANDA DAPATKAN:</div>
              {selectedProduct.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-around text-[10px] text-purple-300 font-mono">
              <span>⚡ Akses Langsung Kirim</span>
              <span>🔒 100% Aman &amp; Terverifikasi</span>
              <span>⭐ Support Konsultasi</span>
            </div>

            {/* Checkout CTA via WhatsApp */}
            <div className="pt-2 space-y-2">
              <a
                href={selectedProduct.ctaLink}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
                  soundEngine.playTypewriterBlip();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>BELI SEKARANG VIA WHATSAPP (INSTAN) ➔</span>
              </a>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
                {productsList.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProduct(p);
                      soundEngine.playTypewriterBlip();
                    }}
                    className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      selectedProduct.id === p.id ? 'bg-purple-600/30 border-purple-400 scale-105' : 'bg-slate-800/60 border-white/5 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="text-[9px] font-bold truncate text-slate-300">{p.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: NPC INTERACTION & CONSULTANT DIALOGUE */}
      {/* ======================================================== */}
      {activeDialogue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl p-5 text-white relative space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">☕</span>
                <div>
                  <h3 className="text-sm font-black text-cyan-300">{activeDialogue.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400">{activeDialogue.role}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveDialogue(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-950/60 p-3 rounded-2xl border border-white/5">
              "{activeDialogue.text}"
            </p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  setActiveDialogue(null);
                  setSelectedProduct(productsList[0] || DIGITAL_PRODUCTS[0]);
                }}
                className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                Tunjukkan Produk Rekomendasi 🚀
              </button>
              <button
                onClick={() => setActiveDialogue(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Oke, Terima Kasih!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: FREE AI PROMPT & HOOK GENERATOR (VALUE ADD) */}
      {/* ======================================================== */}
      {showToolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-2xl p-5 sm:p-6 text-white relative space-y-4">
            <button
              onClick={() => setShowToolModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-black">AI VIRAL HOOK GENERATOR</h3>
                <p className="text-[11px] text-cyan-300 font-mono">Gratis Dicoba Langsung di Fargan Creative Lab</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-300 font-bold block mb-1">
                  Topik Konten / Ide Bisnis Anda:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promptTopic}
                    onChange={(e) => setPromptTopic(e.target.value)}
                    placeholder="Contoh: Bisnis Kopi, Jasa Website, Belajar Coding..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/20 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleGenerateHook}
                    className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer active:scale-95 transition-all shadow shadow-cyan-500/20"
                  >
                    Generate ✨
                  </button>
                </div>
              </div>

              {generatedHook && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300">
                    <span>HASIL HOOK VIRAL:</span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer"
                    >
                      {isCopied ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Tersalin!' : 'Salin Teks'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-white leading-relaxed font-sans font-medium">"{generatedHook}"</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 text-center space-y-2">
              <p className="text-[11px] text-slate-400">
                Ingin 500+ formula prompt bisnis &amp; AI otomatisasi lengkap?
              </p>
              <button
                onClick={() => {
                  setShowToolModal(false);
                  setSelectedProduct(DIGITAL_PRODUCTS[0]);
                }}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer underline underline-offset-4"
              >
                Lihat Paket Lengkap 500+ AI Prompt Engine (Hanya Rp 29.000) ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
