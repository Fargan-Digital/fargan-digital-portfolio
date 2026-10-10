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
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '../utils/audioManager';
import { DIGITAL_PRODUCTS, type DigitalProduct } from '../data/creativeProducts';

interface CreativeLoungeWorldProps {
  onSwitchDimension: (dimension: 'business' | 'kids' | 'creative') => void;
  lang?: 'id' | 'en';
}

export const CreativeLoungeWorld: React.FC<CreativeLoungeWorldProps> = ({ onSwitchDimension }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);
  const [showToolModal, setShowToolModal] = useState(false);

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

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0a1a); // Moody Cyber Twilight
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.02);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 300);
    camera.position.set(0, 12, 20);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting (Warm cafe lights + Cyberpunk neon)
    const ambientLight = new THREE.AmbientLight(0x2a1b4e, 1.2);
    scene.add(ambientLight);

    const warmLight = new THREE.PointLight(0xffaa44, 2.5, 35);
    warmLight.position.set(0, 10, 0);
    warmLight.castShadow = true;
    scene.add(warmLight);

    const neonCyan = new THREE.PointLight(0x00f5ff, 2, 25);
    neonCyan.position.set(-14, 6, -8);
    scene.add(neonCyan);

    const neonPink = new THREE.PointLight(0xff007f, 2, 25);
    neonPink.position.set(14, 6, -8);
    scene.add(neonPink);

    // 5. Rooftop Cafe Deck
    const deckGeo = new THREE.BoxGeometry(38, 1, 32);
    const deckMat = new THREE.MeshStandardMaterial({
      color: 0x1f1a24, // Dark wooden decking
      roughness: 0.7,
      metalness: 0.2,
    });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.y = -0.5;
    deck.receiveShadow = true;
    scene.add(deck);

    // Neon edge border
    const borderGeo = new THREE.BoxGeometry(38.4, 0.4, 32.4);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x8338ec, wireframe: true });
    const border = new THREE.Mesh(borderGeo, borderMat);
    border.position.y = 0.1;
    scene.add(border);

    // Click marker
    const markerGeo = new THREE.RingGeometry(0.4, 0.8, 32);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x00f5ff, side: THREE.DoubleSide });
    const clickMarker = new THREE.Mesh(markerGeo, markerMat);
    clickMarker.rotation.x = -Math.PI / 2;
    clickMarker.position.y = 0.05;
    clickMarker.visible = false;
    scene.add(clickMarker);
    clickMarkerRef.current = clickMarker;

    // 6. CAFE BAR COUNTER & NEON BILLBOARDS
    const barCounter = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2.4, 3),
      new THREE.MeshStandardMaterial({ color: 0x3d0066, roughness: 0.3 })
    );
    barCounter.position.set(0, 1.2, -10);
    barCounter.castShadow = true;
    barCounter.receiveShadow = true;
    scene.add(barCounter);

    // Neon Sign: FARGAN DIGITAL CAFE & CREATIVE LAB
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sCtx = signCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = '#050510';
      sCtx.fillRect(0, 0, 512, 128);
      sCtx.fillStyle = '#FF007F';
      sCtx.font = 'bold 34px sans-serif';
      sCtx.textAlign = 'center';
      sCtx.fillText('☕ FARGAN CREATIVE CAFE', 256, 50);
      sCtx.fillStyle = '#00F5FF';
      sCtx.font = 'bold 20px monospace';
      sCtx.fillText('DIGITAL ASSETS & AI TOOLS LAB', 256, 95);
    }
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 3.5),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signMesh.position.set(0, 5, -10);
    scene.add(signMesh);

    // 7. FOUR PRODUCT DISPLAY KIOSKS
    const kioskCoords = [
      { x: -10, z: -2 },
      { x: -4, z: -2 },
      { x: 4, z: -2 },
      { x: 10, z: -2 },
    ];
    kioskCoords.forEach((coord, idx) => {
      const prod = DIGITAL_PRODUCTS[idx];
      const kGroup = new THREE.Group();
      kGroup.position.set(coord.x, 0, coord.z);

      // Kiosk pedestal
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 2, 2.2, 16),
        new THREE.MeshStandardMaterial({ color: 0x180b33, metalness: 0.6, roughness: 0.3 })
      );
      ped.position.y = 1.1;
      ped.castShadow = true;
      kGroup.add(ped);

      // Floating Hologram Cube / Product Display
      const holoGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
      const holoMat = new THREE.MeshStandardMaterial({
        color: [0x00f5ff, 0xff007f, 0x8338ec, 0xffb703][idx],
        emissive: [0x00f5ff, 0xff007f, 0x8338ec, 0xffb703][idx],
        emissiveIntensity: 0.5,
        wireframe: false,
        roughness: 0.2,
      });
      const holoMesh = new THREE.Mesh(holoGeo, holoMat);
      holoMesh.position.y = 3.2;
      holoMesh.castShadow = true;
      holoMesh.userData = { product: prod };
      kGroup.add(holoMesh);

      scene.add(kGroup);
    });

    // Cozy Cafe Tables & Chairs
    [-12, 12].forEach((tx) => {
      [4, 10].forEach((tz) => {
        const table = new THREE.Mesh(
          new THREE.CylinderGeometry(1.5, 1.5, 1.6, 16),
          new THREE.MeshStandardMaterial({ color: 0x3a0ca3, roughness: 0.4 })
        );
        table.position.set(tx, 0.8, tz);
        table.castShadow = true;
        scene.add(table);

        const candle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8),
          new THREE.MeshBasicMaterial({ color: 0xffdd88 })
        );
        candle.position.set(tx, 1.9, tz);
        scene.add(candle);
      });
    });

    // 8. CHILL GEN-Z AVATAR
    const player = new THREE.Group();
    player.position.set(0, 0, 8);

    // Head with Cyber Visor
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 1.1, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xfad2e1, roughness: 0.4 })
    );
    head.position.y = 2.0;
    head.castShadow = true;
    player.add(head);

    // Glowing Neon Headband
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.25, 1.2),
      new THREE.MeshBasicMaterial({ color: 0x00f5ff })
    );
    band.position.set(0, 2.2, 0);
    player.add(band);

    // Body (Cyber Hoodie)
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 1.3, 1),
      new THREE.MeshStandardMaterial({ color: 0x1b1464, roughness: 0.4 })
    );
    torso.position.y = 1.0;
    torso.castShadow = true;
    player.add(torso);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.45, 0.6, 0.5);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x111122 });
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.35, 0.3, 0);
    const legR = legL.clone();
    legR.position.set(0.35, 0.3, 0);
    player.add(legL);
    player.add(legR);

    scene.add(player);
    playerRef.current = player;

    // 9. CLICK TO MOVE (Tap anywhere on deck)
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

    // Keyboard handlers
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

    // 10. ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Floating city ambient pulse
      ambientLight.intensity = 0.9 + Math.sin(elapsed * 2) * 0.1;

      // Player Movement
      if (playerRef.current) {
        let moveX = 0;
        let moveZ = 0;
        const speed = 11 * delta;

        if (playerTargetRef.current) {
          const currentPos = new THREE.Vector3(playerRef.current.position.x, 0, playerRef.current.position.z);
          const dir = new THREE.Vector3().subVectors(playerTargetRef.current, currentPos);
          const dist = dir.length();

          if (dist > 0.4) {
            dir.normalize();
            playerRef.current.position.x += dir.x * speed;
            playerRef.current.position.z += dir.z * speed;
            playerRef.current.rotation.y = Math.atan2(dir.x, dir.z);

            legL.rotation.x = Math.sin(elapsed * 12) * 0.5;
            legR.rotation.x = -Math.sin(elapsed * 12) * 0.5;
          } else {
            playerTargetRef.current = null;
            if (clickMarkerRef.current) clickMarkerRef.current.visible = false;
            legL.rotation.x = 0;
            legR.rotation.x = 0;
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

            legL.rotation.x = Math.sin(elapsed * 12) * 0.5;
            legR.rotation.x = -Math.sin(elapsed * 12) * 0.5;
          } else {
            legL.rotation.x = 0;
            legR.rotation.x = 0;
          }
        }

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
  }, []);

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

        {/* Right: Sound & Micro Tool Hub */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Free AI Tool Button */}
          <button
            onClick={() => setShowToolModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 border border-cyan-300/40 cursor-pointer active:scale-95 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">AI Generator Gratis</span>
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
          onClick={() => setSelectedProduct(DIGITAL_PRODUCTS[0])}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-600/90 hover:bg-purple-500 text-white font-black text-[11px] sm:text-xs shadow-lg shadow-purple-500/40 border border-purple-400/40 cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Lihat Rak Produk Digital 🛍️</span>
        </button>
      </div>

      {/* BOTTOM CONTROL & INSTRUCTION BAR */}
      <div className="absolute bottom-3 left-3 right-3 z-30 flex items-end justify-between pointer-events-none">
        <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-purple-500/30 shadow-xl pointer-events-auto max-w-[280px] sm:max-w-xs space-y-1">
          <div className="flex items-center gap-1.5 text-purple-400 font-black text-xs">
            <Coffee className="w-4 h-4 text-amber-400" />
            <span>FARGAN CREATIVE LOUNGE:</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight">
            Nongkrong virtual, dengarkan Lo-Fi, coba AI tool gratis, atau jelajahi produk digital bernilai tinggi.
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
          <span className="text-[9px] font-mono">HOP</span>
        </button>
      </div>

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
                  ⭐ {selectedProduct.rating} ({selectedProduct.salesCount} Terjual)
                </span>
              </div>
              <h3 className="text-lg font-black mt-2 text-white">{selectedProduct.title}</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedProduct.description}</p>
            </div>

            {/* Pricing Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono text-slate-400">HARGA SPESIAL HARI INI:</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-black text-emerald-400">{selectedProduct.price}</span>
                  <span className="text-xs text-slate-500 line-through">{selectedProduct.originalPrice}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                HEMAT 60%+
              </span>
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
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>BELI LANGSUNG VIA WHATSAPP (INSTAN) ➔</span>
              </a>

              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
                {DIGITAL_PRODUCTS.map((p) => (
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
      {/* MODAL 2: FREE AI PROMPT & HOOK GENERATOR (VALUE ADD) */}
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
