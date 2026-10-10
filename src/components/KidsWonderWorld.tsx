import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Volume2, 
  CheckCircle2,
  Volume1,
  Moon,
  Sun
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../utils/audioManager';
import { projectStorage } from '../utils/projectStorage';
import { 
  KIDS_VIDEOS, 
  KIDS_ANIMALS, 
  KIDS_PIANO_NOTES, 
  KIDS_CHARACTERS,
  type KidsVideo, 
  type KidsAnimalFact,
  type KidsCharacter 
} from '../data/kidsContent';

interface KidsWonderWorldProps {
  onSwitchDimension: (dimension: 'business' | 'kids' | 'creative') => void;
  lang?: 'id' | 'en';
}

export const KidsWonderWorld: React.FC<KidsWonderWorldProps> = ({ onSwitchDimension }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // UI States
  // Sound is locked ON continuously for friendly voice interaction
  const [selectedVideo, setSelectedVideo] = useState<KidsVideo | null>(null);
  const [selectedAnimal, setSelectedAnimal] = useState<KidsAnimalFact | null>(null);
  const [activeCharacter, setActiveCharacter] = useState<KidsCharacter | null>(null);
  const [dialogueTypedText, setDialogueTypedText] = useState<string>('');
  const [isDialogueTypingDone, setIsDialogueTypingDone] = useState<boolean>(false);
  const [showParentsGuide, setShowParentsGuide] = useState(false);
  const [activePianoNote, setActivePianoNote] = useState<string | null>(null);

  // Real-time Clock (WIB & WITA) with automatic night mode (19:00 - 05:00)
  // and Bedtime Curfew: Closed between 23:00 (11 PM) - 07:00 (7 AM)
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const [isNightTime, setIsNightTime] = useState<boolean>(() => {
    const hr = new Date().getHours();
    return hr >= 19 || hr < 5;
  });
  const [isParkSleeping, setIsParkSleeping] = useState<boolean>(() => {
    const hr = new Date().getHours();
    return hr >= 23 || hr < 7;
  });

  useEffect(() => {
    // Sound is permanently unlocked and unmuted
    soundEngine.setMuted(false);

    const updateClock = () => {
      const now = new Date();
      const hr = now.getHours();
      setIsNightTime(hr >= 19 || hr < 5);
      setIsParkSleeping(hr >= 23 || hr < 7);

      // Formatter for WIB (UTC+7) or WITA (UTC+8) based on user's local Indonesian timezone
      const timeFormatter = new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const tzOffset = -now.getTimezoneOffset() / 60;
      const tzLabel = tzOffset === 8 ? 'WITA' : tzOffset === 9 ? 'WIT' : 'WIB';
      setCurrentTimeStr(`${timeFormatter.format(now)} ${tzLabel}`);
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Character meshes references for proximity & click
  const characterMeshesRef = useRef<{ group: THREE.Group; char: KidsCharacter; nametagMesh: THREE.Mesh; waveArm?: THREE.Mesh }[]>([]);
  const lastInteractedCharIdRef = useRef<string | null>(null);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const playerRef = useRef<THREE.Group | null>(null);
  const playerTargetRef = useRef<THREE.Vector3 | null>(null);
  const clickMarkerRef = useRef<THREE.Mesh | null>(null);

  // Orbit camera control refs (Rotate & Zoom like Roblox City)
  const rotateCameraRef = useRef<((delta: number) => void) | null>(null);
  const zoomCameraRef = useRef<((delta: number) => void) | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);

  // Movement keys
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false, jump: false });
  const isJumpingRef = useRef(false);
  const jumpVelocityRef = useRef(0);
  const starsMeshesRef = useRef<{ mesh: THREE.Group; id: number; collected: boolean }[]>([]);
  const isNightRef = useRef(isNightTime);
  isNightRef.current = isNightTime;

  // Web Speech API Voice Actor Synthesis for Character
  const speakVoice = (text: string, pitch = 1.2) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();

      // Clean emojis, asterisks, brackets, and symbols so voice actor only reads clean spoken words
      const cleanSpokenWords = text
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[▶️🎬⭐✨🦁🤖🚀🧁🐤🌿🐾🔢🎵🌈🎨📖💌💛💡👉]/g, '')
        .replace(/[*_~`#[\]()]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanSpokenWords) return;

      const utterance = new SpeechSynthesisUtterance(cleanSpokenWords);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05; // Lively children pace
      utterance.pitch = pitch; // Cheerful friendly pitch

      // Pick Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
      if (idVoice) utterance.voice = idVoice;

      window.speechSynthesis.speak(utterance);
    } catch {}
  };

  // Typewriter effect for Character dialogue & automatic friendly voice greetings
  useEffect(() => {
    if (!activeCharacter) {
      setDialogueTypedText('');
      setIsDialogueTypingDone(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    setDialogueTypedText('');
    setIsDialogueTypingDone(false);
    const fullText = `${activeCharacter.greeting} ${activeCharacter.dialogueIntro}`;
    let charIndex = 0;

    // Trigger sweet friendly voice speaking
    const voicePitch = activeCharacter.speechAudioPitch >= 600 ? 1.35 : 1.15;
    speakVoice(fullText, voicePitch);

    const timer = setInterval(() => {
      charIndex++;
      setDialogueTypedText(fullText.slice(0, charIndex));
      if (charIndex % 3 === 0) {
        soundEngine.playTypewriterBlip();
      }
      if (charIndex >= fullText.length) {
        clearInterval(timer);
        setIsDialogueTypingDone(true);
      }
    }, 28);

    return () => {
      clearInterval(timer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [activeCharacter]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup with Day / Night Mode adaptation
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const currentHour = new Date().getHours();
    const isNight = currentHour >= 19 || currentHour < 5;

    // Day: Cheerful pastel sky (0x8ecae6). Night: Deep twilight magical navy (0x0b132b)
    const skyColor = isNight ? 0x0b132b : 0x8ecae6;
    const fogDensity = isNight ? 0.018 : 0.015;
    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, fogDensity);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 300);
    camera.position.set(0, 14, 24);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting: Day Sun vs Night Moon & Disney Twinkle Lights
    const ambientLight = new THREE.AmbientLight(isNight ? 0x3d5a80 : 0xffffff, isNight ? 0.9 : 1.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(isNight ? 0x70a9a1 : 0xfff3b0, isNight ? 0.8 : 1.8);
    sunLight.position.set(isNight ? -20 : 30, 50, isNight ? -20 : 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Warm hemisphere light (Sunlit meadow vs Moonlight glimmer)
    const hemiLight = new THREE.HemisphereLight(
      isNight ? 0x1d3557 : 0x90e0ef,
      isNight ? 0x0f172a : 0x52b788,
      isNight ? 0.6 : 0.8
    );
    scene.add(hemiLight);

    // Glowing Moon in Night Sky
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfffae0 })
    );
    moonMesh.position.set(-35, 42, -45);
    moonMesh.visible = isNight;
    scene.add(moonMesh);

    const moonGlow = new THREE.PointLight(0xfffae0, isNight ? 2 : 0, 80);
    moonGlow.position.set(-35, 42, -45);
    moonGlow.visible = isNight;
    scene.add(moonGlow);

    // Night Stars Field (Twinkling starry dome in night sky)
    const starsCount = 120;
    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starsCount * 3);
    for (let si = 0; si < starsCount; si++) {
      const sTheta = Math.random() * Math.PI * 2;
      const sPhi = Math.acos(Math.random() * 0.8 + 0.1); // Upper hemisphere
      const sDist = 110 + Math.random() * 30;
      starPositions[si * 3] = sDist * Math.sin(sPhi) * Math.cos(sTheta);
      starPositions[si * 3 + 1] = sDist * Math.cos(sPhi) + 15;
      starPositions[si * 3 + 2] = sDist * Math.sin(sPhi) * Math.sin(sTheta);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.8,
      transparent: true,
      opacity: isNight ? 0.9 : 0
    });
    const starrySky = new THREE.Points(starsGeo, starsMat);
    starrySky.visible = isNight;
    scene.add(starrySky);

    // 5. Grand Disneyland Wonderland Island (Vast Safe Kingdom - Radius 75)
    const islandRadius = 75;
    const islandGeo = new THREE.CylinderGeometry(islandRadius, islandRadius + 10, 8, 64);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x6ede00, // Vibrant lush cartoon grass
      roughness: 0.65,
      metalness: 0.05,
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.y = -4;
    island.receiveShadow = true;
    scene.add(island);

    // Warm Sunburst Central Plaza (Spacious Hub)
    const plazaGeo = new THREE.CylinderGeometry(24, 24, 0.35, 48);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0xffd166, // Warm sunny yellow plaza
      roughness: 0.4,
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.y = 0.15;
    plaza.receiveShadow = true;
    scene.add(plaza);

    // Stone Promenade Walking Rings & Disney Walkways (Outer loop for parade cars & kids)
    const ringGeo = new THREE.RingGeometry(38, 46, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xffe6a7,
      roughness: 0.5,
      side: THREE.DoubleSide
    });
    const ringPath = new THREE.Mesh(ringGeo, ringMat);
    ringPath.rotation.x = -Math.PI / 2;
    ringPath.position.y = 0.12;
    ringPath.receiveShadow = true;
    scene.add(ringPath);

    // Safety Balloon Fence Posts along the Island Edge (Children never fall into abyss)
    const fencePostsCount = 48;
    for (let f = 0; f < fencePostsCount; f++) {
      const angle = (f / fencePostsCount) * Math.PI * 2;
      const fx = Math.cos(angle) * (islandRadius - 1.5);
      const fz = Math.sin(angle) * (islandRadius - 1.5);

      const fPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 3.5, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      fPost.position.set(fx, 1.75, fz);
      scene.add(fPost);

      const fTopper = new THREE.Mesh(
        new THREE.SphereGeometry(0.9, 16, 16),
        new THREE.MeshStandardMaterial({
          color: [0xff006e, 0x8338ec, 0x3a86ff, 0xffbe0b, 0x06d6a0][f % 5],
          roughness: 0.2
        })
      );
      fTopper.position.set(fx, 3.8, fz);
      scene.add(fTopper);
    }

    // Click target ground indicator
    const markerGeo = new THREE.RingGeometry(0.5, 1.0, 32);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xff006e, side: THREE.DoubleSide });
    const clickMarker = new THREE.Mesh(markerGeo, markerMat);
    clickMarker.rotation.x = -Math.PI / 2;
    clickMarker.position.y = 0.22;
    clickMarker.visible = false;
    scene.add(clickMarker);
    clickMarkerRef.current = clickMarker;

    // 6. BUILDINGS & STATIONS
    // STATION 1: Bioskop Teater Cilik (Cinema Pavilion)
    const cinemaGroup = new THREE.Group();
    cinemaGroup.position.set(0, 0, -18);

    // Cinema Screen Base & Border
    const screenBase = new THREE.Mesh(
      new THREE.BoxGeometry(16, 10, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xff006e, roughness: 0.3 })
    );
    screenBase.position.y = 6;
    screenBase.castShadow = true;
    cinemaGroup.add(screenBase);

    // Movie Display Screen (Glows with billboard art)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1D3557';
      ctx.fillRect(0, 0, 512, 320);
      ctx.fillStyle = '#E63946';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎬 BIOSKOP KARTUN CILIK', 256, 90);
      ctx.fillStyle = '#F1FAEE';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('Klik / Dekati Untuk Menonton!', 256, 150);
      ctx.font = 'bold 44px sans-serif';
      ctx.fillText('▶️ PUTAR VIDEO', 256, 230);
      ctx.fillStyle = '#A8DADC';
      ctx.font = '18px monospace';
      ctx.fillText('100% Konten Edukasi Ramah Anak', 256, 280);
    }
    const screenTex = new THREE.CanvasTexture(canvas);
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 8),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screenMesh.position.set(0, 6, 0.8);
    cinemaGroup.add(screenMesh);

    // Decorative Balloon Pillars on Cinema
    [-8, 8].forEach((bx) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 12, 16),
        new THREE.MeshStandardMaterial({ color: 0xffbe0b })
      );
      pillar.position.set(bx, 6, 0);
      cinemaGroup.add(pillar);

      const balloon = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 24, 24),
        new THREE.MeshStandardMaterial({ color: bx > 0 ? 0x06d6a0 : 0x118ab2, roughness: 0.2 })
      );
      balloon.position.set(bx, 12.5, 0);
      cinemaGroup.add(balloon);
    });
    scene.add(cinemaGroup);

    // STATION 2: Piano Pelangi Raksasa (Interactive Floor Piano)
    const pianoGroup = new THREE.Group();
    pianoGroup.position.set(-16, 0.1, 0);
    KIDS_PIANO_NOTES.forEach((note, idx) => {
      const keyMesh = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 0.3, 7),
        new THREE.MeshStandardMaterial({ color: note.color, roughness: 0.3 })
      );
      keyMesh.position.set((idx - 3.5) * 2.6, 0.1, 0);
      keyMesh.receiveShadow = true;
      keyMesh.name = `piano_${note.note}`;
      pianoGroup.add(keyMesh);
    });
    scene.add(pianoGroup);

    // STATION 3: Taman Hewan Safari Mini (Animal Statues)
    const animalGroup = new THREE.Group();
    animalGroup.position.set(16, 0, 0);
    KIDS_ANIMALS.forEach((anim, i) => {
      const aGroup = new THREE.Group();
      const angle = (i / KIDS_ANIMALS.length) * Math.PI * 2;
      aGroup.position.set(Math.cos(angle) * 6, 0, Math.sin(angle) * 6);

      // Animal Pedestal
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.8, 1, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
      );
      ped.position.y = 0.5;
      ped.castShadow = true;
      aGroup.add(ped);

      // Animal Mascot Voxel (Cuboid body)
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.8, 1.6),
        new THREE.MeshStandardMaterial({ color: anim.color, roughness: 0.3 })
      );
      body.position.y = 1.9;
      body.castShadow = true;
      aGroup.add(body);

      // Cute Ears / Horns
      const ear1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
      ear1.position.set(-0.5, 3.1, 0);
      const ear2 = ear1.clone();
      ear2.position.set(0.5, 3.1, 0);
      aGroup.add(ear1);
      aGroup.add(ear2);

      animalGroup.add(aGroup);
    });
    scene.add(animalGroup);

    // =========================================================
    // STATION 4: 5 DISNEYLAND CHARACTERS (CS SAHABAT FARGAN KIDS)
    // Formatted with full humanoid Roblox/CS body structure (Head, Suit Torso, Tie, Waving Arm, Legs)
    // =========================================================
    characterMeshesRef.current = [];
    const charactersGroup = new THREE.Group();
    const currentKidsCharacters = projectStorage.getKidsCharacters();

    currentKidsCharacters.forEach((c) => {
      const charGroup = new THREE.Group();
      charGroup.position.set(c.position[0], c.position[1], c.position[2]);

      // Pedestal Ring Stage with Star Glow
      const stageRing = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.6, 0.35, 24),
        new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.3 })
      );
      stageRing.position.y = 0.18;
      stageRing.receiveShadow = true;
      charGroup.add(stageRing);

      const centerDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 0.4, 24),
        new THREE.MeshStandardMaterial({ color: c.secondaryColor, roughness: 0.2 })
      );
      centerDisc.position.y = 0.2;
      charGroup.add(centerDisc);

      // Humanoid Materials
      const skinMat = new THREE.MeshStandardMaterial({ color: 0xFAD090, roughness: 0.5 });
      const outfitMat = new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.35 });
      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5 });
      const neonMat = new THREE.MeshStandardMaterial({ 
        color: c.secondaryColor, 
        emissive: c.secondaryColor, 
        emissiveIntensity: 0.5 
      });

      // 1. Head with Canvas Face Texture (Cartoon Eyes, Sparkles, Warm Smile)
      const faceCanvas = document.createElement('canvas');
      faceCanvas.width = 128;
      faceCanvas.height = 128;
      const fctx = faceCanvas.getContext('2d');
      if (fctx) {
        fctx.fillStyle = '#FAD090';
        fctx.fillRect(0, 0, 128, 128);
        fctx.fillStyle = '#0F172A';
        // Big cartoon eyes
        fctx.fillRect(28, 38, 20, 26);
        fctx.fillRect(80, 38, 20, 26);
        // White catchlight
        fctx.fillStyle = '#FFFFFF';
        fctx.fillRect(36, 42, 8, 10);
        fctx.fillRect(88, 42, 8, 10);
        // Rosy cheeks
        fctx.fillStyle = '#FF8DA1';
        fctx.beginPath();
        fctx.arc(28, 76, 10, 0, Math.PI * 2);
        fctx.arc(100, 76, 10, 0, Math.PI * 2);
        fctx.fill();
        // Friendly smile
        fctx.strokeStyle = '#D90429';
        fctx.lineWidth = 6;
        fctx.beginPath();
        fctx.arc(64, 84, 18, 0.1 * Math.PI, 0.9 * Math.PI);
        fctx.stroke();
      }
      const faceTex = new THREE.CanvasTexture(faceCanvas);
      const headMatArray = [
        skinMat, skinMat, skinMat, skinMat,
        new THREE.MeshStandardMaterial({ map: faceTex }),
        skinMat
      ];
      const cHead = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.85, 0.85), headMatArray);
      cHead.position.y = 2.15;
      cHead.castShadow = true;
      charGroup.add(cHead);

      // Cute Disney / Kid Cap with character color
      const cCap = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.25, 1.05),
        new THREE.MeshStandardMaterial({ color: c.secondaryColor, roughness: 0.3 })
      );
      cCap.position.set(0, 2.62, 0.05);
      charGroup.add(cCap);

      // 2. Torso (Smart Uniform / Mascot Outfit)
      const cTorso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.25, 0.65), outfitMat);
      cTorso.position.y = 1.15;
      cTorso.castShadow = true;
      charGroup.add(cTorso);

      // Star Badge / Tie on chest
      const cBadge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.4, 0.08), neonMat);
      cBadge.position.set(0, 1.25, 0.36);
      charGroup.add(cBadge);

      // 3. Humanoid Arms (Left Arm waves continuously to greet kids)
      const armGeo = new THREE.BoxGeometry(0.4, 1.1, 0.45);
      const leftArm = new THREE.Mesh(armGeo, outfitMat);
      leftArm.position.set(-0.85, 1.15, 0);
      leftArm.castShadow = true;
      charGroup.add(leftArm);

      const rightArm = new THREE.Mesh(armGeo, outfitMat);
      rightArm.position.set(0.85, 1.15, 0);
      rightArm.castShadow = true;
      charGroup.add(rightArm);

      // 4. Humanoid Legs
      const legGeo = new THREE.BoxGeometry(0.48, 0.95, 0.5);
      const leftLeg = new THREE.Mesh(legGeo, pantsMat);
      leftLeg.position.set(-0.3, 0.35, 0);
      leftLeg.castShadow = true;
      charGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(legGeo, pantsMat);
      rightLeg.position.set(0.3, 0.35, 0);
      rightLeg.castShadow = true;
      charGroup.add(rightLeg);

      // 5. Floating Billboard Nametag above Head
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 300;
      tagCanvas.height = 110;
      const tagCtx = tagCanvas.getContext('2d');
      if (tagCtx) {
        tagCtx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        tagCtx.roundRect(4, 4, 292, 102, 22);
        tagCtx.fill();
        tagCtx.strokeStyle = `#${c.color.toString(16).padStart(6, '0')}`;
        tagCtx.lineWidth = 6;
        tagCtx.stroke();

        tagCtx.fillStyle = '#0F172A';
        tagCtx.font = 'bold 26px sans-serif';
        tagCtx.textAlign = 'center';
        tagCtx.fillText(`${c.avatar} ${c.name.split(' ')[0]}`, 150, 44);

        tagCtx.fillStyle = `#${c.secondaryColor.toString(16).padStart(6, '0')}`;
        tagCtx.font = 'bold 18px monospace';
        tagCtx.fillText(`[ ${c.role.split('—')[0].trim()} ]`, 150, 80);
      }
      const tagTex = new THREE.CanvasTexture(tagCanvas);
      const tagMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 1.05),
        new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, side: THREE.DoubleSide })
      );
      tagMesh.position.set(0, 3.4, 0);
      charGroup.add(tagMesh);

      // Click Interaction Anchor Mesh (Clicking anywhere on character or stage directs child to walk towards character)
      const clickHitbox = new THREE.Mesh(
        new THREE.CylinderGeometry(2.2, 2.2, 3.8, 12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      clickHitbox.position.y = 1.9;
      clickHitbox.userData = { character: c };
      charGroup.add(clickHitbox);

      // Character Stage Spotlight (Warm & vibrant illumination for character)
      const stageSpotlight = new THREE.PointLight(c.color, isNight ? 2.8 : 0.8, 14);
      stageSpotlight.position.set(0, 2.8, 0);
      charGroup.add(stageSpotlight);

      charactersGroup.add(charGroup);
      characterMeshesRef.current.push({ group: charGroup, char: c, nametagMesh: tagMesh, waveArm: leftArm });
    });

    scene.add(charactersGroup);

    // =========================================================
    // 5B. MAGICAL PARK STREET LAMPS (TIANG LAMPU DISNEY TAMAN)
    // Placed along circular promenade (radius 44) & around central plaza (radius 22)
    // =========================================================
    const streetLampLights: THREE.PointLight[] = [];
    const streetLampMeshes: THREE.Mesh[] = [];

    const createStreetLamp = (lx: number, lz: number, lampColor = 0xFFF3B0) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(lx, 0, lz);

      // Cute Victorian / Disney street lamp post
      const baseGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.5, 12);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.4, metalness: 0.6 });
      const base = new THREE.Mesh(baseGeo, postMat);
      base.position.y = 0.25;
      lampGroup.add(base);

      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 4.2, 12), postMat);
      pole.position.y = 2.35;
      lampGroup.add(pole);

      // Glowing Glass Lantern Head (Sphere lantern with golden cap)
      const globeGeo = new THREE.SphereGeometry(0.55, 16, 16);
      const globeMat = new THREE.MeshBasicMaterial({ color: lampColor });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      globe.position.y = 4.6;
      lampGroup.add(globe);
      streetLampMeshes.push(globe);

      // Decorative Top Finial
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 8), postMat);
      finial.position.y = 5.25;
      lampGroup.add(finial);

      // PointLight Casting Warm Glow
      const pLight = new THREE.PointLight(lampColor, isNight ? 2.4 : 0.4, 18);
      pLight.position.y = 4.6;
      lampGroup.add(pLight);
      streetLampLights.push(pLight);

      scene.add(lampGroup);
    };

    // 10 Promenade Street Lamps (Along wide outer walking promenade, radius 44)
    for (let p = 0; p < 10; p++) {
      const pAngle = (p / 10) * Math.PI * 2;
      createStreetLamp(Math.cos(pAngle) * 44, Math.sin(pAngle) * 44, 0xFFE6A7);
    }

    // 6 Plaza Garden Lamps (Around inner central plaza, radius 21)
    for (let pz = 0; pz < 6; pz++) {
      const pzAngle = (pz / 6) * Math.PI * 2 + Math.PI / 6;
      createStreetLamp(Math.cos(pzAngle) * 21, Math.sin(pzAngle) * 21, 0x00E5FF);
    }

    // Decorative Lollipop Trees & Giant Mushrooms
    const parkLanterns: THREE.PointLight[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.2;
      const radius = 24 + Math.random() * 8;
      const tx = Math.cos(angle) * radius;
      const tz = Math.sin(angle) * radius;

      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);

      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 5, 8),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      trunk.position.y = 2.5;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Swirl Lollipop top
      const candyTop = new THREE.Mesh(
        new THREE.CylinderGeometry(2, 2, 0.6, 24),
        new THREE.MeshStandardMaterial({
          color: [0xff006e, 0x8338ec, 0x3a86ff, 0xffbe0b, 0xfb5607][i % 5],
          roughness: 0.2,
        })
      );
      candyTop.rotation.x = Math.PI / 2;
      candyTop.position.y = 5.2;
      candyTop.castShadow = true;
      treeGroup.add(candyTop);

      // Fairy Lantern Light under each lollipop tree (Glows warmly at night)
      const lanternLight = new THREE.PointLight(0xfff3b0, isNight ? 1.2 : 0, 16);
      lanternLight.position.y = 4.2;
      treeGroup.add(lanternLight);
      parkLanterns.push(lanternLight);

      scene.add(treeGroup);
    }

    // Floating Clouds
    const cloudsGroup = new THREE.Group();
    for (let c = 0; c < 8; c++) {
      const cloud = new THREE.Mesh(
        new THREE.DodecahedronGeometry(4 + Math.random() * 2, 1),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, opacity: 0.9, transparent: true })
      );
      cloud.position.set((Math.random() - 0.5) * 80, 22 + Math.random() * 6, (Math.random() - 0.5) * 80);
      cloudsGroup.add(cloud);
    }
    scene.add(cloudsGroup);

    // 7. GOLDEN STARS QUEST (5 Collectible Floating Stars)
    const starCoords = [
      { x: 0, z: -10 },
      { x: -14, z: 12 },
      { x: 14, z: 12 },
      { x: -20, z: -8 },
      { x: 20, z: -8 },
    ];
    starCoords.forEach((coord, idx) => {
      const sGroup = new THREE.Group();
      sGroup.position.set(coord.x, 2, coord.z);

      const starMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(1, 0),
        new THREE.MeshStandardMaterial({
          color: 0xffd166,
          emissive: 0xffb703,
          emissiveIntensity: 0.6,
          metalness: 0.8,
          roughness: 0.2,
        })
      );
      starMesh.castShadow = true;
      sGroup.add(starMesh);
      scene.add(sGroup);

      starsMeshesRef.current.push({ mesh: sGroup, id: idx, collected: false });
    });

    // =========================================================
    // 7B. DISNEYLAND PARADE: CUTE CARS & FLYING PATROL DRONES
    // Cars cruise smoothly around the promenade ring; Drones soar overhead
    // =========================================================
    const paradeCars: { mesh: THREE.Group; baseAngle: number; speed: number; radius: number }[] = [];

    const createKidsCar = (bodyColor: number, accentColor: number) => {
      const car = new THREE.Group();

      // Rounded Cute Car Body
      const cBody = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 0.9, 1.4),
        new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.25 })
      );
      cBody.position.y = 0.55;
      cBody.castShadow = true;
      car.add(cBody);

      // Cute Canopy / Bubble Roof
      const roof = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.65, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.1, transparent: true, opacity: 0.85 })
      );
      roof.position.set(-0.1, 1.25, 0);
      car.add(roof);

      // Cartoon Wheels (4 big cute wheels)
      const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.6 });
      const wheelPositions = [
        [0.7, 0.35, 0.75],
        [-0.7, 0.35, 0.75],
        [0.7, 0.35, -0.75],
        [-0.7, 0.35, -0.75],
      ];
      wheelPositions.forEach(([wx, wy, wz]) => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.x = Math.PI / 2;
        w.position.set(wx, wy, wz);
        car.add(w);
      });

      // Cheerful Cartoon Headlights
      const lightGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFF3B0 });
      const hl1 = new THREE.Mesh(lightGeo, lightMat);
      hl1.position.set(1.12, 0.6, 0.42);
      const hl2 = hl1.clone();
      hl2.position.set(1.12, 0.6, -0.42);
      car.add(hl1, hl2);

      // Star Flag on car antenna
      const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), new THREE.MeshStandardMaterial({ color: 0xFFD166 }));
      flagPole.position.set(-0.85, 1.4, 0);
      car.add(flagPole);

      const flag = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 4), new THREE.MeshBasicMaterial({ color: accentColor }));
      flag.rotation.z = -Math.PI / 2;
      flag.position.set(-0.6, 1.85, 0);
      car.add(flag);

      return car;
    };

    // 4 Parade Cars driving along promenade radius 33
    // 4 Parade Cars driving along wide promenade radius 42
    const carPalette = [
      { body: 0xFF006E, accent: 0xFFBE0B, speed: 0.35, radius: 41 },
      { body: 0x3A86FF, accent: 0xFF006E, speed: 0.42, radius: 43 },
      { body: 0xFB5607, accent: 0x8338EC, speed: -0.32, radius: 42 },
      { body: 0x06D6A0, accent: 0xFFD166, speed: -0.38, radius: 44 },
    ];
    carPalette.forEach((cp, idx) => {
      const carMesh = createKidsCar(cp.body, cp.accent);
      const baseAngle = (idx / carPalette.length) * Math.PI * 2;
      carMesh.position.set(Math.cos(baseAngle) * cp.radius, 0.1, Math.sin(baseAngle) * cp.radius);
      scene.add(carMesh);
      paradeCars.push({ mesh: carMesh, baseAngle, speed: cp.speed, radius: cp.radius });
    });

    // 3 Sky Patrol Drones flying overhead (Whimsical quadcopter design)
    const skyDrones: { group: THREE.Group; speed: number; radiusX: number; radiusZ: number; height: number }[] = [];
    const droneColors = [0xFF006E, 0x00E5FF, 0xFFBE0B];

    droneColors.forEach((dColor, idx) => {
      const droneGroup = new THREE.Group();
      const dBody = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.2 })
      );
      droneGroup.add(dBody);

      // Glowing LED eye visor
      const eyeVisor = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.25, 0.5),
        new THREE.MeshBasicMaterial({ color: dColor })
      );
      eyeVisor.position.set(0, 0.1, 0.4);
      droneGroup.add(eyeVisor);

      // 4 Rotor Arms with spinning propeller rings
      const armMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
      const ringMat = new THREE.MeshBasicMaterial({ color: dColor, side: THREE.DoubleSide });
      const ringGeo = new THREE.RingGeometry(0.28, 0.42, 16);

      [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]].forEach(([rx, rz]) => {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8), armMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(rx * 0.5, 0, rz * 0.5);
        droneGroup.add(arm);

        const r = new THREE.Mesh(ringGeo, ringMat);
        r.rotation.x = Math.PI / 2;
        r.position.set(rx, 0.18, rz);
        droneGroup.add(r);
      });

      scene.add(droneGroup);
      skyDrones.push({
        group: droneGroup,
        speed: 0.4 + idx * 0.15,
        radiusX: 28 + idx * 8,
        radiusZ: 30 + idx * 7,
        height: 14 + idx * 3
      });
    });

    // =========================================================
    // 7C. DISNEYLAND FERRIS WHEEL (BIANGLALA RAKSASA BERPUTAR)
    // Placed in the North territory [0, 0, -48]
    // =========================================================
    const ferrisWheelGroup = new THREE.Group();
    ferrisWheelGroup.position.set(0, 0, -50);

    // Support A-Frames
    const aFrameMat = new THREE.MeshStandardMaterial({ color: 0xFF006E, roughness: 0.3 });
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 18, 8), aFrameMat);
    leg1.position.set(-4.5, 8.5, 0);
    leg1.rotation.z = -0.22;
    const leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 18, 8), aFrameMat);
    leg2.position.set(4.5, 8.5, 0);
    leg2.rotation.z = 0.22;
    ferrisWheelGroup.add(leg1, leg2);

    // Rotating Wheel Structure
    const wheelCenter = new THREE.Group();
    wheelCenter.position.set(0, 16, 0);

    const rimGeo = new THREE.TorusGeometry(10, 0.35, 12, 32);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xFFBE0B, roughness: 0.2 });
    const wheelRim = new THREE.Mesh(rimGeo, rimMat);
    wheelCenter.add(wheelRim);

    // 8 Spokes & 8 Cute Passenger Cabins
    const ferrisCabins: THREE.Group[] = [];
    const spokeMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const cabinPalette = [0xFF006E, 0x8338EC, 0x3A86FF, 0x06D6A0, 0xFFBE0B, 0xFB5607, 0x9B5DE5, 0x00F5D4];

    for (let c = 0; c < 8; c++) {
      const angle = (c / 8) * Math.PI * 2;
      // Spoke
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 10, 8), spokeMat);
      spoke.position.set(Math.cos(angle) * 5, Math.sin(angle) * 5, 0);
      spoke.rotation.z = angle - Math.PI / 2;
      wheelCenter.add(spoke);

      // Cabin (Gondola)
      const cabin = new THREE.Group();
      cabin.position.set(Math.cos(angle) * 10, Math.sin(angle) * 10, 0);

      const cabinBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.4, 1.4),
        new THREE.MeshStandardMaterial({ color: cabinPalette[c], roughness: 0.3 })
      );
      cabin.add(cabinBox);

      // Little cabin window
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.45), new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
      cabin.add(win);

      wheelCenter.add(cabin);
      ferrisCabins.push(cabin);
    }

    // Glowing Ferris Wheel Central Hub Light
    const ferrisHubLight = new THREE.PointLight(0xFF006E, isNight ? 3.0 : 0.8, 28);
    wheelCenter.add(ferrisHubLight);

    ferrisWheelGroup.add(wheelCenter);
    scene.add(ferrisWheelGroup);

    // =========================================================
    // 7D. TRAMPOLIN PELANGI BOUNCING (TRAMPOLINE ZONES)
    // Placed at North-West [-22, 0, -12] and North-East [22, 0, -12]
    // =========================================================
    const trampolines: { pos: THREE.Vector3; mesh: THREE.Mesh; pad: THREE.Mesh }[] = [];
    const trampCoords = [
      new THREE.Vector3(-22, 0, -12),
      new THREE.Vector3(22, 0, -12)
    ];

    trampCoords.forEach((tPos, idx) => {
      const tGroup = new THREE.Group();
      tGroup.position.copy(tPos);

      // Outer rainbow ring frame
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(3.6, 3.8, 0.5, 32),
        new THREE.MeshStandardMaterial({ color: idx === 0 ? 0xFF006E : 0x3A86FF, roughness: 0.2 })
      );
      ring.position.y = 0.25;
      ring.receiveShadow = true;
      tGroup.add(ring);

      // Bouncy elastic center mat
      const matGeo = new THREE.CylinderGeometry(3.0, 3.0, 0.55, 32);
      const matMat = new THREE.MeshStandardMaterial({ color: 0xFFBE0B, roughness: 0.3 });
      const matMesh = new THREE.Mesh(matGeo, matMat);
      matMesh.position.y = 0.28;
      tGroup.add(matMesh);

      // Little decorative star in center
      const starDeco = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), new THREE.MeshBasicMaterial({ color: 0xFF006E }));
      starDeco.rotation.x = Math.PI / 2;
      starDeco.position.y = 0.6;
      tGroup.add(starDeco);

      scene.add(tGroup);
      trampolines.push({ pos: tPos, mesh: tGroup as any, pad: matMesh });
    });

    // =========================================================
    // 7E. FLOATING SOAP BUBBLE PARTICLES (POPPABLE BUBBLES)
    // Whimsical translucent spheres floating from grass
    // =========================================================
    const bubblesCount = 18;
    const bubbles: { mesh: THREE.Mesh; vy: number; vx: number; vz: number; basePos: THREE.Vector3 }[] = [];
    const bubbleGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0x90E0EF,
      transparent: true,
      opacity: 0.65,
      roughness: 0.1,
      metalness: 0.1
    });

    for (let b = 0; b < bubblesCount; b++) {
      const bMesh = new THREE.Mesh(bubbleGeo, bubbleMat);
      const bx = (Math.random() - 0.5) * 70;
      const bz = (Math.random() - 0.5) * 70;
      const by = 0.5 + Math.random() * 5;
      bMesh.position.set(bx, by, bz);
      scene.add(bMesh);

      bubbles.push({
        mesh: bMesh,
        vy: 0.8 + Math.random() * 0.8,
        vx: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        basePos: new THREE.Vector3(bx, 0, bz)
      });
    }

    // =========================================================
    // 7F. MAGICAL NIGHT FIREFLIES (KUNANG-KUNANG MALAM)
    // Gentle glowing firefly swarm around trees
    // =========================================================
    const fireflyCount = 28;
    const fireflies: { mesh: THREE.Mesh; seed: number; speed: number; radius: number }[] = [];
    const fireflyGeo = new THREE.SphereGeometry(0.18, 8, 8);
    const fireflyMat = new THREE.MeshBasicMaterial({ color: 0xCCFF33 });

    for (let ff = 0; ff < fireflyCount; ff++) {
      const fMesh = new THREE.Mesh(fireflyGeo, fireflyMat);
      fMesh.visible = isNight;
      scene.add(fMesh);
      fireflies.push({
        mesh: fMesh,
        seed: Math.random() * 100,
        speed: 0.6 + Math.random() * 0.8,
        radius: 12 + Math.random() * 38
      });
    }

    // =========================================================
    // 7G. LIVELY PARK FRIENDS (TEMAN-TEMAN CILIK YANG IKUT BERMAIN)
    // 6 Distinct Autonomous Kids: Chasing bubbles, bouncing on trampolines,
    // chatting with mascot characters, and running joyfully across park
    // =========================================================
    type KidState = 'run_target' | 'bounce_trampoline' | 'chat_mascot' | 'wander';
    interface ParkKidItem {
      group: THREE.Group;
      legL: THREE.Mesh;
      legR: THREE.Mesh;
      armL: THREE.Mesh;
      armR: THREE.Mesh;
      state: KidState;
      targetPos: THREE.Vector3;
      timer: number;
      speed: number;
      jumpY: number;
      jumpVy: number;
      name: string;
    }

    const parkKids: ParkKidItem[] = [];
    const kidConfigs = [
      { name: 'Kenzo 🧢', capColor: 0x3A86FF, shirtColor: 0xFF006E, pantsColor: 0x1E293B, start: new THREE.Vector3(-14, 0, 10) },
      { name: 'Alya 🎀', capColor: 0xFF70A6, shirtColor: 0xFFBE0B, pantsColor: 0x3A86FF, start: new THREE.Vector3(12, 0, -8) },
      { name: 'Rafa 🦖', capColor: 0x06D6A0, shirtColor: 0x118AB2, pantsColor: 0x073B4C, start: new THREE.Vector3(-22, 0, -12) },
      { name: 'Kimi 🐱', capColor: 0x8338EC, shirtColor: 0xFB5607, pantsColor: 0x1E293B, start: new THREE.Vector3(22, 0, -12) },
      { name: 'Salsa 🌸', capColor: 0xFFD166, shirtColor: 0x06D6A0, pantsColor: 0x8338EC, start: new THREE.Vector3(8, 0, 20) },
      { name: 'Bima ⚡', capColor: 0xEF476F, shirtColor: 0x3A86FF, pantsColor: 0x118AB2, start: new THREE.Vector3(-18, 0, 24) },
    ];

    kidConfigs.forEach((cfg) => {
      const kGroup = new THREE.Group();
      kGroup.position.copy(cfg.start);

      // Cute Voxel Kid Head
      const kHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.9, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xFDE2CA, roughness: 0.5 })
      );
      kHead.position.y = 1.7;
      kHead.castShadow = true;
      kGroup.add(kHead);

      // Hat / Cap
      const kCap = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.25, 1.1),
        new THREE.MeshStandardMaterial({ color: cfg.capColor, roughness: 0.3 })
      );
      kCap.position.set(0, 2.18, 0.05);
      kGroup.add(kCap);

      // Eyes
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0F172A });
      const kEyeL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.08), eyeMat);
      kEyeL.position.set(-0.22, 1.76, 0.46);
      const kEyeR = kEyeL.clone();
      kEyeR.position.set(0.22, 1.76, 0.46);
      kGroup.add(kEyeL, kEyeR);

      // Smile
      const kSmile = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.08), new THREE.MeshBasicMaterial({ color: 0xD90429 }));
      kSmile.position.set(0, 1.5, 0.46);
      kGroup.add(kSmile);

      // Torso / Colorful Hoodie
      const kTorso = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 1.0, 0.65),
        new THREE.MeshStandardMaterial({ color: cfg.shirtColor, roughness: 0.4 })
      );
      kTorso.position.y = 0.95;
      kTorso.castShadow = true;
      kGroup.add(kTorso);

      // Arms
      const armGeo = new THREE.BoxGeometry(0.3, 0.85, 0.35);
      const armMat = new THREE.MeshStandardMaterial({ color: cfg.shirtColor, roughness: 0.4 });
      const armL = new THREE.Mesh(armGeo, armMat);
      armL.position.set(-0.68, 0.95, 0);
      armL.castShadow = true;
      kGroup.add(armL);

      const armR = new THREE.Mesh(armGeo, armMat);
      armR.position.set(0.68, 0.95, 0);
      armR.castShadow = true;
      kGroup.add(armR);

      // Legs
      const legGeo = new THREE.BoxGeometry(0.38, 0.75, 0.4);
      const legMat = new THREE.MeshStandardMaterial({ color: cfg.pantsColor, roughness: 0.5 });
      const legL = new THREE.Mesh(legGeo, legMat);
      legL.position.set(-0.25, 0.38, 0);
      legL.castShadow = true;
      kGroup.add(legL);

      const legR = new THREE.Mesh(legGeo, legMat);
      legR.position.set(0.25, 0.38, 0);
      legR.castShadow = true;
      kGroup.add(legR);

      // Friendly floating player tag
      const tagCanvas = document.createElement('canvas');
      tagCanvas.width = 180;
      tagCanvas.height = 60;
      const tctx = tagCanvas.getContext('2d');
      if (tctx) {
        tctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        tctx.roundRect(4, 4, 172, 52, 16);
        tctx.fill();
        tctx.strokeStyle = `#${cfg.capColor.toString(16).padStart(6, '0')}`;
        tctx.lineWidth = 4;
        tctx.stroke();

        tctx.fillStyle = '#0F172A';
        tctx.font = 'bold 22px sans-serif';
        tctx.textAlign = 'center';
        tctx.fillText(cfg.name, 90, 36);
      }
      const tagTex = new THREE.CanvasTexture(tagCanvas);
      const tagMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.0, 0.65),
        new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, side: THREE.DoubleSide })
      );
      tagMesh.position.set(0, 2.65, 0);
      kGroup.add(tagMesh);

      scene.add(kGroup);

      parkKids.push({
        group: kGroup,
        legL,
        legR,
        armL,
        armR,
        state: 'wander',
        targetPos: new THREE.Vector3((Math.random() - 0.5) * 40, 0, (Math.random() - 0.5) * 40),
        timer: Math.random() * 5,
        speed: 5.5 + Math.random() * 3.5,
        jumpY: 0,
        jumpVy: 0,
        name: cfg.name
      });
    });

    // 8. CHIBI AVATAR (FARGAN JUNIOR)
    const player = new THREE.Group();
    player.position.set(0, 0, 8);

    // Head
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xffddd2, roughness: 0.4 })
    );
    head.position.y = 2.1;
    head.castShadow = true;
    player.add(head);

    // Cap / Visor
    const cap = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.4, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x3a86ff, roughness: 0.3 })
    );
    cap.position.set(0, 2.7, 0.1);
    player.add(cap);

    // Cute Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1d3557 });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.1), eyeMat);
    eyeL.position.set(-0.3, 2.2, 0.61);
    const eyeR = eyeL.clone();
    eyeR.position.set(0.3, 2.2, 0.61);
    player.add(eyeL);
    player.add(eyeR);

    // Cheerful Smile
    const smile = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xe63946 }));
    smile.position.set(0, 1.85, 0.61);
    player.add(smile);

    // Torso / Body (Bright Yellow Hoodie)
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.3, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xffbe0b, roughness: 0.4 })
    );
    torso.position.y = 1.1;
    torso.castShadow = true;
    player.add(torso);

    // Blue Shoes / Legs
    const legGeo = new THREE.BoxGeometry(0.5, 0.6, 0.6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1d3557 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.35, 0.3, 0);
    legL.castShadow = true;
    const legR = legL.clone();
    legR.position.set(0.35, 0.3, 0);
    player.add(legL);
    player.add(legR);

    scene.add(player);
    playerRef.current = player;

    // 9. ORBIT CAMERA & CLICK-TO-MOVE (LIKE ROBLOX CITY)
    const isMobile = window.innerWidth <= 768;
    let cameraAngle = 0;
    let targetCameraAngle = 0;
    let cameraPitch = isMobile ? 0.45 : 0.40;
    let targetCameraPitch = isMobile ? 0.45 : 0.40;
    let cameraDistance = isMobile ? 24.0 : 20.0;
    let targetCameraDistance = isMobile ? 24.0 : 20.0;

    const MIN_DISTANCE = 10.0;
    const MAX_DISTANCE = 42.0;
    const MIN_PITCH = 0.18;
    const MAX_PITCH = 0.82;

    rotateCameraRef.current = (delta: number) => {
      targetCameraAngle += delta;
      soundEngine.playFootstep();
    };
    zoomCameraRef.current = (delta: number) => {
      targetCameraDistance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, targetCameraDistance + delta));
      soundEngine.playFootstep();
    };
    resetCameraRef.current = () => {
      targetCameraAngle = 0;
      targetCameraPitch = isMobile ? 0.45 : 0.40;
      targetCameraDistance = isMobile ? 24.0 : 20.0;
      soundEngine.playFootstep();
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let dragDistance = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastPinchDist = 0;

    // Desktop Mouse Drag
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.kids-overlay')) return;
      if (e.button !== 0) return;
      isDragging = true;
      dragDistance = 0;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      dragDistance += Math.hypot(dx, dy);

      targetCameraAngle -= dx * 0.007;
      targetCameraPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, targetCameraPitch + dy * 0.005));
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!isDragging) return;
      isDragging = false;

      // If user merely clicked without dragging, perform Click-to-Move / Character Click!
      if (dragDistance < 6) {
        handleGroundClick(e.clientX, e.clientY);
      }
    };

    // Desktop Mouse Wheel Zoom
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.02;
      targetCameraDistance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, targetCameraDistance + zoomDelta));
    };

    // Mobile Touch Drag & Pinch-to-Zoom
    const onTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('.kids-overlay')) return;

      if (e.touches.length === 1) {
        isDragging = true;
        dragDistance = 0;
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
        dragDistance += Math.hypot(dx, dy);

        targetCameraAngle -= dx * 0.008;
        targetCameraPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, targetCameraPitch + dy * 0.006));
      } else if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastPinchDist > 0) {
          const pinchDelta = (lastPinchDist - dist) * 0.06;
          targetCameraDistance = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, targetCameraDistance + pinchDelta));
        }
        lastPinchDist = dist;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        if (isDragging && dragDistance < 10) {
          handleGroundClick(lastPointerX, lastPointerY);
        }
        isDragging = false;
        lastPinchDist = 0;
      } else if (e.touches.length === 1) {
        lastPointerX = e.touches[0].clientX;
        lastPointerY = e.touches[0].clientY;
        isDragging = true;
        dragDistance = 0;
        lastPinchDist = 0;
      }
    };

    const handleGroundClick = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check if clicking directly on a Character (Player walks toward character, only opens dialogue inside proximity)
      const charHits = raycaster.intersectObjects(charactersGroup.children, true);
      if (charHits.length > 0) {
        let hitObj: THREE.Object3D | null = charHits[0].object;
        while (hitObj && !hitObj.userData?.character) {
          hitObj = hitObj.parent;
        }
        if (hitObj && hitObj.userData?.character) {
          const charData = hitObj.userData.character as KidsCharacter;
          // Set movement target right near the character stage
          playerTargetRef.current = new THREE.Vector3(charData.position[0], 0, charData.position[2]);
          if (clickMarkerRef.current) {
            clickMarkerRef.current.position.set(charData.position[0], 0.22, charData.position[2]);
            clickMarkerRef.current.visible = true;
          }
          soundEngine.playCuteHop();
          return;
        }
      }

      const intersects = raycaster.intersectObjects([island, plaza]);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        playerTargetRef.current = new THREE.Vector3(point.x, 0, point.z);

        if (clickMarkerRef.current) {
          clickMarkerRef.current.position.set(point.x, 0.22, point.z);
          clickMarkerRef.current.visible = true;
        }
        soundEngine.playCuteHop();
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

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) keysRef.current.forward = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) keysRef.current.backward = true;
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keysRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keysRef.current.right = true;
      if (e.code === 'Space') {
        if (!isJumpingRef.current) {
          isJumpingRef.current = true;
          jumpVelocityRef.current = 0.32;
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

    // 10. ANIMATION & GAME LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let currentNightFactor = isNight ? 1 : 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Dynamically lerp between Day and Night mode smoothly
      const targetNightFactor = isNightRef.current ? 1 : 0;
      if (Math.abs(currentNightFactor - targetNightFactor) > 0.005) {
        currentNightFactor += (targetNightFactor - currentNightFactor) * delta * 2.0;

        // Day Sky (0x8ecae6) -> Night Sky (0x0b132b)
        const daySky = new THREE.Color(0x8ecae6);
        const nightSky = new THREE.Color(0x0b132b);
        const lerpedSky = daySky.clone().lerp(nightSky, currentNightFactor);
        scene.background = lerpedSky;
        if (scene.fog) {
          scene.fog.color = lerpedSky;
          (scene.fog as THREE.FogExp2).density = 0.015 + currentNightFactor * 0.004;
        }

        // Ambient light: 0xffffff (1.8 day) -> 0x64748b (1.35 night - brighter and crisp like Roblox City)
        const dayAmb = new THREE.Color(0xffffff);
        const nightAmb = new THREE.Color(0x64748b);
        ambientLight.color = dayAmb.clone().lerp(nightAmb, currentNightFactor);
        ambientLight.intensity = 1.8 - currentNightFactor * 0.45;

        // Sun / Directional light: 0xfff3b0 (2.4 day) -> 0x38bdf8 (2.0 night - brilliant moonlight)
        const daySun = new THREE.Color(0xfff3b0);
        const nightSun = new THREE.Color(0x38bdf8);
        sunLight.color = daySun.clone().lerp(nightSun, currentNightFactor);
        sunLight.intensity = 2.2 - currentNightFactor * 0.4;

        // Hemisphere light: Day (0x90e0ef / 0x52b788) -> Night (0x3b82f6 / 0x1e293b)
        const dayHemiSky = new THREE.Color(0x90e0ef);
        const nightHemiSky = new THREE.Color(0x3b82f6);
        hemiLight.color = dayHemiSky.clone().lerp(nightHemiSky, currentNightFactor);
        hemiLight.intensity = 0.8 + currentNightFactor * 0.4;

        // Moon & Glowing Stars visibility and glow
        moonMesh.visible = currentNightFactor > 0.05;
        moonGlow.visible = currentNightFactor > 0.05;
        moonGlow.intensity = currentNightFactor * 3.5;
        starrySky.visible = currentNightFactor > 0.05;
        starsMat.opacity = currentNightFactor * 0.95;

        // Street Lamps along promenade & central plaza (Brilliant illumination)
        streetLampLights.forEach((sl) => {
          sl.intensity = 0.3 + currentNightFactor * 2.5;
        });

        // Fairy Lanterns on Lollipop trees
        parkLanterns.forEach((l) => {
          l.intensity = 0.2 + currentNightFactor * 1.8;
        });

        // Ferris wheel hub glow
        ferrisHubLight.intensity = 0.8 + currentNightFactor * 2.8;

        // Fireflies visibility
        fireflies.forEach((ff) => {
          ff.mesh.visible = currentNightFactor > 0.15;
        });

        // Cloud visibility in night sky
        cloudsGroup.children.forEach((c) => {
          const mat = (c as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat) mat.opacity = 0.9 - currentNightFactor * 0.5;
        });
      }

      // Rotate Clouds gently
      cloudsGroup.rotation.y = elapsed * 0.02;
      starrySky.rotation.y = elapsed * 0.005;

      // Animate Stars
      starsMeshesRef.current.forEach((s) => {
        if (!s.collected) {
          s.mesh.rotation.y += delta * 2;
          s.mesh.position.y = 2 + Math.sin(elapsed * 3 + s.id) * 0.4;

          // Check Player Distance to Star
          if (playerRef.current) {
            const dist = playerRef.current.position.distanceTo(s.mesh.position);
            if (dist < 2.5) {
              s.collected = true;
              s.mesh.visible = false;
              soundEngine.playStarCollect();
              confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
            }
          }
        }
      });

      // Player Movement Logic
      if (playerRef.current) {
        let moveX = 0;
        let moveZ = 0;
        const speed = 12 * delta;

        // Click to move
        if (playerTargetRef.current) {
          const currentPos = new THREE.Vector3(playerRef.current.position.x, 0, playerRef.current.position.z);
          const dir = new THREE.Vector3().subVectors(playerTargetRef.current, currentPos);
          const dist = dir.length();

          if (dist > 0.4) {
            dir.normalize();
            playerRef.current.position.x += dir.x * speed;
            playerRef.current.position.z += dir.z * speed;
            playerRef.current.rotation.y = Math.atan2(dir.x, dir.z);

            // Bouncy Hop while moving
            legL.rotation.x = Math.sin(elapsed * 14) * 0.6;
            legR.rotation.x = -Math.sin(elapsed * 14) * 0.6;
            torso.position.y = 1.1 + Math.abs(Math.sin(elapsed * 14)) * 0.2;
          } else {
            playerTargetRef.current = null;
            if (clickMarkerRef.current) clickMarkerRef.current.visible = false;
            legL.rotation.x = 0;
            legR.rotation.x = 0;
            torso.position.y = 1.1;
          }
        } else {
          // Keyboard controls
          if (keysRef.current.forward) moveZ -= 1;
          if (keysRef.current.backward) moveZ += 1;
          if (keysRef.current.left) moveX -= 1;
          if (keysRef.current.right) moveX += 1;

          if (moveX !== 0 || moveZ !== 0) {
            const moveVec = new THREE.Vector3(moveX, 0, moveZ).normalize();
            playerRef.current.position.x += moveVec.x * speed;
            playerRef.current.position.z += moveVec.z * speed;
            playerRef.current.rotation.y = Math.atan2(moveVec.x, moveVec.z);

            legL.rotation.x = Math.sin(elapsed * 14) * 0.6;
            legR.rotation.x = -Math.sin(elapsed * 14) * 0.6;
            torso.position.y = 1.1 + Math.abs(Math.sin(elapsed * 14)) * 0.2;
          } else {
            legL.rotation.x = 0;
            legR.rotation.x = 0;
            torso.position.y = 1.1;
          }
        }

        // Jump physics
        if (isJumpingRef.current) {
          playerRef.current.position.y += jumpVelocityRef.current;
          jumpVelocityRef.current -= 0.018; // gravity
          if (playerRef.current.position.y <= 0) {
            playerRef.current.position.y = 0;
            isJumpingRef.current = false;
            jumpVelocityRef.current = 0;
          }
        }

        // Keep player safely inside the Disneyland Park boundaries (Expanded to 70)
        const playerDistFromCenter = Math.hypot(playerRef.current.position.x, playerRef.current.position.z);
        const maxBoundary = 70;
        if (playerDistFromCenter > maxBoundary) {
          const clampAngle = Math.atan2(playerRef.current.position.z, playerRef.current.position.x);
          playerRef.current.position.x = Math.cos(clampAngle) * maxBoundary;
          playerRef.current.position.z = Math.sin(clampAngle) * maxBoundary;
          playerTargetRef.current = null;
          if (clickMarkerRef.current) clickMarkerRef.current.visible = false;
        }

        // 1. Animate Disneyland Ferris Wheel (Smooth majestic rotation)
        wheelCenter.rotation.z += delta * 0.18;
        // Keep Ferris wheel gondolas hanging upright as wheel turns
        ferrisCabins.forEach((cab) => {
          cab.rotation.z = -wheelCenter.rotation.z;
        });

        // 2. Trampoline Bouncing Interaction (Auto-hop high when stepped on!)
        trampolines.forEach((t) => {
          const tDist = Math.hypot(playerRef.current!.position.x - t.pos.x, playerRef.current!.position.z - t.pos.z);
          if (tDist < 3.2 && playerRef.current!.position.y <= 0.8) {
            isJumpingRef.current = true;
            jumpVelocityRef.current = 0.55; // Super high trampoline bounce!
            soundEngine.playJump();
            confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 } });
          }
        });

        // 3. Animate Soap Bubbles (Drift upwards and pop when player runs into them)
        bubbles.forEach((b) => {
          b.mesh.position.y += b.vy * delta;
          b.mesh.position.x += Math.sin(elapsed * 2 + b.basePos.x) * delta * 0.5;
          b.mesh.position.z += Math.cos(elapsed * 2 + b.basePos.z) * delta * 0.5;

          // If reached sky, recycle bubble from grass
          if (b.mesh.position.y > 14) {
            b.mesh.position.y = 0.5;
            b.mesh.position.x = (Math.random() - 0.5) * 80;
            b.mesh.position.z = (Math.random() - 0.5) * 80;
            b.mesh.scale.setScalar(1);
          }

          // Player pops bubble!
          const bDist = playerRef.current!.position.distanceTo(b.mesh.position);
          if (bDist < 1.6) {
            b.mesh.position.y = 0.5; // Reset
            soundEngine.playCuteHop();
            confetti({ particleCount: 15, spread: 45, origin: { y: 0.7 } });
          }
        });

        // 4. Animate Fireflies (Magical nighttime glow dancing around park)
        fireflies.forEach((ff) => {
          const fa = elapsed * ff.speed + ff.seed;
          ff.mesh.position.x = Math.cos(fa) * ff.radius;
          ff.mesh.position.z = Math.sin(fa) * ff.radius;
          ff.mesh.position.y = 1.5 + Math.sin(elapsed * 3 + ff.seed) * 1.2;
          // Pulse brightness
          const fScale = 0.8 + Math.sin(elapsed * 5 + ff.seed) * 0.4;
          ff.mesh.scale.setScalar(fScale);
        });

        // Check Cinema Distance (Auto prompt)
        const distToCinema = playerRef.current.position.distanceTo(cinemaGroup.position);
        if (distToCinema < 7 && !selectedVideo) {
          // Proximity to cinema
        }

        // Check Proximity to Disneyland Characters
        let nearbyChar: KidsCharacter | null = null;
        characterMeshesRef.current.forEach((cm) => {
          // Make nametag always face camera like a billboard
          cm.nametagMesh.lookAt(camera.position);

          // Gentle bobbing character animation & continuous arm wave greeting
          cm.group.position.y = Math.sin(elapsed * 2.5 + cm.char.position[0]) * 0.08;
          if (cm.waveArm) {
            cm.waveArm.rotation.z = Math.sin(elapsed * 4 + cm.char.position[0]) * 0.4 + 0.3;
          }

          const dist = playerRef.current!.position.distanceTo(cm.group.position);
          if (dist < 3.5) {
            nearbyChar = cm.char;
          }
        });

        // Animate Parade Cars moving smoothly around circular promenade
        paradeCars.forEach((pc) => {
          pc.baseAngle += pc.speed * delta * 0.25;
          pc.mesh.position.x = Math.cos(pc.baseAngle) * pc.radius;
          pc.mesh.position.z = Math.sin(pc.baseAngle) * pc.radius;
          // Face tangential direction along circle
          pc.mesh.rotation.y = -pc.baseAngle + (pc.speed > 0 ? Math.PI / 2 : -Math.PI / 2);
          // Playful slight bouncing ride
          pc.mesh.position.y = 0.12 + Math.abs(Math.sin(elapsed * 8 + pc.baseAngle)) * 0.04;
        });

        // Animate Sky Patrol Drones soaring across park
        skyDrones.forEach((drone, idx) => {
          drone.group.position.x = Math.sin(elapsed * drone.speed + idx * 2) * drone.radiusX;
          drone.group.position.z = Math.cos(elapsed * drone.speed + idx * 2) * drone.radiusZ;
          drone.group.position.y = drone.height + Math.sin(elapsed * 2 + idx) * 0.8;
          drone.group.rotation.y = elapsed * drone.speed + Math.PI / 2;
        });

        // =========================================================
        // ANIMATE LIVELY PARK KIDS (TEMAN-TEMAN CILIK BERMAIN AKTIF)
        // Autonomous behaviors: Running, bouncing on trampolines, chasing bubbles, chatting
        // =========================================================
        parkKids.forEach((kid, kIdx) => {
          kid.timer -= delta;

          // State Machine Transitions
          if (kid.timer <= 0) {
            kid.timer = 5 + Math.random() * 6;
            const rChoice = Math.random();

            if (rChoice < 0.3) {
              // Target nearest trampoline
              const tTarget = trampolines[kIdx % trampolines.length];
              kid.state = 'bounce_trampoline';
              kid.targetPos.set(tTarget.pos.x + (Math.random() - 0.5) * 1.5, 0, tTarget.pos.z + (Math.random() - 0.5) * 1.5);
            } else if (rChoice < 0.6) {
              // Target one of the 5 mascot characters to chat/visit
              const activeChars = projectStorage.getKidsCharacters();
              const charTarget = activeChars[Math.floor(Math.random() * activeChars.length)] || KIDS_CHARACTERS[0];
              kid.state = 'chat_mascot';
              kid.targetPos.set(charTarget.position[0] + (Math.random() - 0.5) * 3, 0, charTarget.position[2] + (Math.random() - 0.5) * 3);
            } else {
              // Wander freely to random spot
              kid.state = 'wander';
              const randAng = Math.random() * Math.PI * 2;
              const randR = 10 + Math.random() * 45;
              kid.targetPos.set(Math.cos(randAng) * randR, 0, Math.sin(randAng) * randR);
            }
          }

          // Movement toward target
          const kidCurPos = new THREE.Vector3(kid.group.position.x, 0, kid.group.position.z);
          const kDir = new THREE.Vector3().subVectors(kid.targetPos, kidCurPos);
          const kDist = kDir.length();

          if (kDist > 0.6) {
            kDir.normalize();
            kid.group.position.x += kDir.x * kid.speed * delta;
            kid.group.position.z += kDir.z * kid.speed * delta;
            kid.group.rotation.y = Math.atan2(kDir.x, kDir.z);

            // Bouncy run leg & arm swing
            const runCycle = elapsed * 14 + kIdx;
            kid.legL.rotation.x = Math.sin(runCycle) * 0.65;
            kid.legR.rotation.x = -Math.sin(runCycle) * 0.65;
            kid.armL.rotation.x = -Math.sin(runCycle) * 0.6;
            kid.armR.rotation.x = Math.sin(runCycle) * 0.6;
          } else {
            // Idle or Action at destination
            kid.legL.rotation.x = 0;
            kid.legR.rotation.x = 0;

            if (kid.state === 'bounce_trampoline') {
              // Jump bouncy on trampoline pad
              if (kid.jumpY <= 0) {
                kid.jumpVy = 0.42;
              }
              kid.jumpY += kid.jumpVy;
              kid.jumpVy -= 0.018;
              if (kid.jumpY < 0) {
                kid.jumpY = 0;
                kid.jumpVy = 0;
              }
              kid.group.position.y = kid.jumpY;
              // Arms raised in excitement!
              kid.armL.rotation.z = 0.8;
              kid.armR.rotation.z = -0.8;
            } else if (kid.state === 'chat_mascot') {
              // Friendly wave arm to character
              kid.group.position.y = 0;
              kid.armL.rotation.z = Math.sin(elapsed * 5 + kIdx) * 0.5 + 0.3;
              kid.armR.rotation.z = 0;
            } else {
              kid.group.position.y = 0;
              kid.armL.rotation.x = 0;
              kid.armR.rotation.x = 0;
              kid.armL.rotation.z = 0;
              kid.armR.rotation.z = 0;
            }
          }
        });

        if (nearbyChar) {
          if (lastInteractedCharIdRef.current !== (nearbyChar as KidsCharacter).id && !activeCharacter) {
            lastInteractedCharIdRef.current = (nearbyChar as KidsCharacter).id;
            setActiveCharacter(nearbyChar);
            soundEngine.playProximityChime();
          }
        } else {
          // Reset last interacted when walking away
          if (lastInteractedCharIdRef.current) {
            lastInteractedCharIdRef.current = null;
          }
        }

        // Check Rainbow Piano collision
        if (Math.abs(playerRef.current.position.x - (-16)) < 11 && Math.abs(playerRef.current.position.z) < 3.5) {
          const relativeX = playerRef.current.position.x - (-16);
          const noteIndex = Math.min(7, Math.max(0, Math.floor((relativeX + 10) / 2.6)));
          const currentNote = KIDS_PIANO_NOTES[noteIndex];
          if (currentNote && activePianoNote !== currentNote.note) {
            setActivePianoNote(currentNote.note);
            soundEngine.playPianoNote(currentNote.freq);
          }
        } else {
          if (activePianoNote !== null) setActivePianoNote(null);
        }

        // Smooth Orbit Camera Interpolation (Zoom & Rotation Orbit)
        cameraAngle += (targetCameraAngle - cameraAngle) * 0.12;
        cameraPitch += (targetCameraPitch - cameraPitch) * 0.12;
        cameraDistance += (targetCameraDistance - cameraDistance) * 0.12;

        const cosP = Math.cos(cameraPitch);
        const sinP = Math.sin(cameraPitch);
        const camOffsetX = -Math.sin(cameraAngle) * cosP * cameraDistance;
        const camOffsetZ = Math.cos(cameraAngle) * cosP * cameraDistance;
        const camOffsetY = sinP * cameraDistance + 1.2;

        const targetCamPos = new THREE.Vector3(
          playerRef.current.position.x + camOffsetX,
          playerRef.current.position.y + camOffsetY,
          playerRef.current.position.z + camOffsetZ
        );

        camera.position.lerp(targetCamPos, 0.12);
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
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`relative w-full h-full overflow-hidden select-none font-sans transition-colors duration-1000 ${
      isNightTime ? 'bg-slate-950 text-slate-100' : 'bg-sky-200 text-slate-900'
    }`}>
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-pointer" />

      {/* TOP HUD: Multi-Dimension Gateway Switcher */}
      <header className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-40 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Left: Dimension Switcher Hub */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg border border-pink-300/80">
          <button
            onClick={() => onSwitchDimension('business')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 text-cyan-300 hover:bg-slate-800 text-[11px] sm:text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
            title="Pindah ke Kota Portofolio Bisnis (Untuk Klien & Brand Owner)"
          >
            <span>🏢</span>
            <span className="hidden md:inline">Kota Bisnis</span>
          </button>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 text-white text-[11px] sm:text-xs font-black shadow-md shadow-pink-500/30 cursor-default"
          >
            <span>🧸</span>
            <span>Dunia Anak</span>
            <span className="text-[9px] bg-white/30 px-1.5 py-0.2 rounded-full font-mono">AKTIF</span>
          </button>

          <button
            onClick={() => onSwitchDimension('creative')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-900/90 text-purple-200 hover:bg-purple-800 text-[11px] sm:text-xs font-bold transition-all shadow cursor-pointer active:scale-95"
            title="Pindah ke Cafe Kreatif & Produk Digital (Untuk Remaja)"
          >
            <span>☕</span>
            <span className="hidden md:inline">Cafe Kreatif</span>
          </button>
        </div>

        {/* Right: Real-time Indonesian Clock (WIB/WITA) & Parents Guide */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Real-time Clock Badge with Day/Night indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md text-slate-800 font-mono font-bold text-xs shadow-md border-2 border-pink-300">
            {isNightTime ? (
              <Moon className="w-3.5 h-3.5 text-indigo-500 fill-indigo-200" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-300" />
            )}
            <span>{currentTimeStr || '17:30 WITA'}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-sans font-black ${
              isNightTime ? 'bg-indigo-900 text-indigo-100' : 'bg-amber-100 text-amber-800'
            }`}>
              {isNightTime ? '🌙 MALAM' : '☀️ SIANG'}
            </span>
          </div>

          {/* Sound is permanently LOCKED ON */}
          <div 
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 font-black text-[11px] shadow-sm"
            title="Audio & Suara Bicara Terkunci Aktif (Selalu On)"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="hidden sm:inline font-mono">SUARA AKTIF</span>
          </div>

          {/* Parents Safe Zone Badge */}
          <button
            onClick={() => setShowParentsGuide(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow border-2 border-white cursor-pointer active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">100% Zona Aman Anak</span>
          </button>
        </div>
      </header>

      {/* BOTTOM CONTROL: ONLY THE BIG JUMP BUTTON REMAINS */}
      <div className="absolute bottom-5 right-5 z-30 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => {
            if (!isJumpingRef.current && playerRef.current) {
              isJumpingRef.current = true;
              jumpVelocityRef.current = 0.35;
              soundEngine.playJump();
            }
          }}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-black text-xs flex flex-col items-center justify-center gap-0.5 shadow-2xl border-4 border-white cursor-pointer active:scale-90 transition-all select-none"
          title="Tekan untuk Melompat Tinggi"
        >
          <span className="text-2xl sm:text-3xl">🚀</span>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">LOMPAT!</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL 0: INTERACTIVE DISNEYLAND CHARACTER DIALOGUE & YOUTUBE CTA */}
      {/* ======================================================== */}
      {activeCharacter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div 
            className="w-full max-w-lg rounded-3xl bg-white border-4 shadow-2xl p-5 sm:p-6 text-slate-900 relative space-y-3.5 flex flex-col max-h-[92vh] overflow-y-auto"
            style={{ borderColor: `#${activeCharacter.color.toString(16).padStart(6, '0')}` }}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveCharacter(null)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 font-bold flex items-center justify-center cursor-pointer transition-colors"
            >
              ✕
            </button>

            {/* Character Header: Avatar & Name */}
            <div className="flex items-center gap-3 pr-8">
              <div 
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl flex items-center justify-center text-3xl sm:text-4xl shadow-lg border-2 border-white shrink-0 animate-bounce"
                style={{ backgroundColor: `#${activeCharacter.color.toString(16).padStart(6, '0')}33` }}
              >
                {activeCharacter.avatar}
              </div>
              <div className="min-w-0">
                <span 
                  className="text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-full font-bold inline-block"
                  style={{ 
                    backgroundColor: `#${activeCharacter.secondaryColor.toString(16).padStart(6, '0')}22`,
                    color: `#${activeCharacter.secondaryColor.toString(16).padStart(6, '0')}` 
                  }}
                >
                  {activeCharacter.role}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5 truncate">
                  {activeCharacter.name}
                </h3>
                <p className="text-[11px] text-pink-600 font-bold">Sahabat Resmi Fargan Kids ✨</p>
              </div>
            </div>

            {/* RPG Typewriter Dialogue Speech Bubble */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-300 relative space-y-1.5 shadow-inner">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider">
                <span className="flex items-center gap-1">💬 BICARA DENGAN TEMANMU:</span>
                <button
                  onClick={() => {
                    const voicePitch = activeCharacter.speechAudioPitch >= 600 ? 1.35 : 1.15;
                    speakVoice(`${activeCharacter.greeting} ${activeCharacter.dialogueIntro}`, voicePitch);
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-900 border border-amber-400 cursor-pointer active:scale-95 transition-all"
                  title="Dengarkan Suara Karakter"
                >
                  <Volume1 className="w-3.5 h-3.5 text-amber-800" />
                  <span>Dengarkan Suara 🔊</span>
                </button>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed min-h-[50px]">
                {dialogueTypedText}
                {!isDialogueTypingDone && (
                  <span className="inline-block w-1.5 h-3.5 bg-pink-500 animate-pulse ml-1 align-middle" />
                )}
              </p>
            </div>

            {/* Educational Fun Fact / Lesson */}
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
              <span className="text-base shrink-0">💡</span>
              <p className="leading-snug">
                <strong>Catatan Pintar:</strong> {activeCharacter.lessonFunFact}
              </p>
            </div>

            {/* Direct YouTube Video CTA & Watch in Metaverse Button */}
            <div className="pt-1 space-y-2">
              {/* Button 1: Play Directly in Metaverse Theater */}
              <button
                onClick={() => {
                  const matchingVideo = KIDS_VIDEOS.find(v => v.youtubeId === activeCharacter.youtubeId) || {
                    id: activeCharacter.id,
                    title: activeCharacter.topicTitle,
                    category: 'cartoon' as const,
                    youtubeId: activeCharacter.youtubeId,
                    duration: '04:30',
                    thumbnail: activeCharacter.avatar,
                    description: activeCharacter.dialogueIntro,
                    badge: activeCharacter.role
                  };
                  setSelectedVideo(matchingVideo);
                  setActiveCharacter(null);
                  confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
                  soundEngine.playCuteHop();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-pink-500/30 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>🎬</span>
                <span>{activeCharacter.actionButtonText}</span>
              </button>

              {/* Button 2: Direct Open in YouTube App / Tab */}
              <a
                href={activeCharacter.youtubeUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
                  soundEngine.playStarCollect();
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow cursor-pointer transition-all hover:scale-[1.01]"
              >
                <span className="text-sm">▶️</span>
                <span>Buka di Aplikasi YouTube Channel Fargan Kids</span>
              </a>

              {/* Other Character Quick Switcher */}
              <div className="pt-2 border-t border-slate-200">
                <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                  SAPA SAHABAT LAINNYA DI PULAU:
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {projectStorage.getKidsCharacters().map((other) => (
                    <button
                      key={other.id}
                      onClick={() => {
                        setActiveCharacter(other);
                        soundEngine.playCuteHop();
                      }}
                      className={`p-1.5 rounded-xl flex flex-col items-center gap-0.5 border transition-all cursor-pointer ${
                        activeCharacter.id === other.id
                          ? 'bg-pink-100 border-pink-400 scale-105 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                      title={other.name}
                    >
                      <span className="text-base sm:text-lg">{other.avatar}</span>
                      <span className="text-[8px] sm:text-[9px] font-bold truncate text-slate-700 w-full text-center">
                        {other.name.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: BIOSKOP TEATER KARTUN (KIDS CINEMA PLAYER) */}
      {/* ======================================================== */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-slate-900 border-4 border-pink-500 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-pink-600 to-rose-600 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎬</span>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-tight">BIOSKOP KARTUN &amp; EDUKASI FARGAN JUNIOR</h3>
                  <p className="text-[10px] text-pink-200">100% Ramah Anak • Tanpa Iklan Dewasa • Terkurasi Penuh</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black flex-shrink-0">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                title={selectedVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            {/* Video Info & Playlist Selector */}
            <div className="p-4 overflow-y-auto space-y-3 bg-slate-900 text-slate-100 flex-1">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold">
                  {selectedVideo.badge}
                </span>
                <h4 className="text-base sm:text-lg font-black mt-1 text-white">{selectedVideo.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{selectedVideo.description}</p>
              </div>

              {/* Playlist Selection */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <div className="text-xs font-mono text-pink-400 font-bold uppercase tracking-wider">
                  📺 PILIH KARTUN LAINNYA:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {KIDS_VIDEOS.map((vid) => (
                    <button
                      key={vid.id}
                      onClick={() => setSelectedVideo(vid)}
                      className={`p-2.5 rounded-2xl flex items-center gap-3 text-left transition-all cursor-pointer border ${
                        selectedVideo.id === vid.id
                          ? 'bg-pink-600/20 border-pink-500 text-white'
                          : 'bg-slate-800/80 hover:bg-slate-800 border-white/5 text-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-xl shrink-0">
                        {vid.thumbnail}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold truncate text-white">{vid.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{vid.duration} • {vid.badge}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: TAMAN HEWAN SAFARI GEMOY */}
      {/* ======================================================== */}
      {selectedAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white border-4 border-amber-400 shadow-2xl p-6 text-slate-900 relative space-y-4">
            <button
              onClick={() => setSelectedAnimal(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 flex items-center justify-center text-4xl shadow-inner border-2 border-amber-300">
                {selectedAnimal.emoji}
              </div>
              <h3 className="text-xl font-black">{selectedAnimal.name}</h3>
              <div className="inline-block px-3 py-1 rounded-full bg-amber-500 text-white font-black text-xs">
                Suara: "{selectedAnimal.soundName}"
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-slate-800 leading-relaxed">
              💡 <strong>Tahukah Kamu?</strong>
              <p className="mt-1">{selectedAnimal.funFact}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2">
              {KIDS_ANIMALS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedAnimal(a);
                    soundEngine.playCuteHop();
                  }}
                  className={`p-2 rounded-2xl flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                    selectedAnimal.id === a.id ? 'bg-amber-400 border-amber-500 scale-105' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xl">{a.emoji}</span>
                  <span className="text-[10px] font-bold truncate">{a.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: PANDUAN ORANG TUA (PARENTS SAFETY GUARANTEE) */}
      {/* ======================================================== */}
      {showParentsGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white border-4 border-emerald-500 shadow-2xl p-6 text-slate-900 relative space-y-4">
            <button
              onClick={() => setShowParentsGuide(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600 cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                🛡️
              </div>
              <div>
                <h3 className="text-base font-black">GARANSI KEAMANAN UNTUK ORANG TUA</h3>
                <p className="text-[11px] text-emerald-700 font-mono">Fargan Kids Wonder World Ecosystem</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <span className="text-emerald-600 font-bold text-sm">✅</span>
                <span><strong>Bebas Algoritma Liar:</strong> Tidak ada video otomatis yang melenceng ke konten aneh atau berbahaya.</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <span className="text-emerald-600 font-bold text-sm">✅</span>
                <span><strong>Bebas Iklan Dewasa &amp; Judi:</strong> Menggunakan pemutar YouTube Privacy-Enhanced tanpa pelacakan agresif.</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-2">
                <span className="text-emerald-600 font-bold text-sm">✅</span>
                <span><strong>Stimulasi Motorik &amp; Kognitif:</strong> Anak diajak mengeksplorasi dunia 3D, memencet tuts musik, dan belajar fakta sains.</span>
              </div>
            </div>

            <button
              onClick={() => setShowParentsGuide(false)}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider cursor-pointer transition-all shadow"
            >
              SAYA MENGERTI, BIARKAN ANAK SAYA BERMAIN ➔
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: JAM TIDUR ANAK (BEDTIME CURFEW 23:00 - 07:00) */}
      {/* Melindungi jam istirahat anak dengan pesan hangat */}
      {/* ======================================================== */}
      {isParkSleeping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-fade-in pointer-events-auto">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-4 border-indigo-500 shadow-2xl p-6 sm:p-8 text-center text-white relative space-y-4">
            {/* Animated Sleeping Moon & Stars */}
            <div className="w-24 h-24 mx-auto rounded-full bg-indigo-950 border-4 border-indigo-400 flex items-center justify-center text-5xl shadow-inner shadow-indigo-500/50 animate-pulse">
              🌙
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase tracking-wider">
                ⏰ JAM TIDUR KECIL • {currentTimeStr}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white pt-1">
                Saatnya Bobo Ceria! ✨
              </h3>
            </div>

            <p className="text-sm text-indigo-200 leading-relaxed px-2">
              "Taman Fargan Kids sudah istirahat dulu ya teman kecil. <strong>Selamat tidur nyenyak, mimpi indah</strong>. Besok pagi pukul <strong>07.00</strong> kita main lagi bareng Milo, Pipa, Luna, Bobo &amp; Chiki!" 🧸💤
            </p>

            <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-800/60 text-xs text-indigo-300 flex items-center justify-center gap-2">
              <span>⭐</span>
              <span>Tubuh sehat dan pintar didapat dari tidur yang cukup malam ini.</span>
            </div>

            <button
              onClick={() => onSwitchDimension('business')}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-xs uppercase tracking-wider cursor-pointer transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
            >
              KEMBALI KE BERANDA UTAMA ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
