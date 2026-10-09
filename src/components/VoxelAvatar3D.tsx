import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { type CharacterGender, type DayNightMode } from '../utils/translations';

interface VoxelAvatar3DProps {
  currentStage: number;
  gender?: CharacterGender;
  mode?: DayNightMode;
}

export const VoxelAvatar3D: React.FC<VoxelAvatar3DProps> = ({ 
  currentStage, 
  gender = 'male',
  mode = 'night'
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const isDay = mode === 'day';
    
    scene.fog = new THREE.FogExp2(isDay ? 0xe0f2fe : 0x080C14, isDay ? 0.025 : 0.04);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Lighting based on Day / Night
    const ambientLight = new THREE.AmbientLight(0xffffff, isDay ? 2.2 : 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(isDay ? 0xfff7ed : 0x00A2FF, isDay ? 3.0 : 2.5);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const secondaryLight = new THREE.PointLight(isDay ? 0x38bdf8 : 0xFFB800, isDay ? 2.5 : 3, 10);
    secondaryLight.position.set(-3, 3, 2);
    scene.add(secondaryLight);

    // 3. Ground Grid
    const gridColor1 = isDay ? 0x0284c7 : 0x00A2FF;
    const gridColor2 = isDay ? 0x94a3b8 : 0x1A2A40;
    const grid = new THREE.GridHelper(24, 24, gridColor1, gridColor2);
    grid.position.y = -1.6;
    scene.add(grid);

    // 4. Build Roblox Voxel Avatar Group
    const avatarGroup = new THREE.Group();

    // Palette & Materials
    const skinMat = new THREE.MeshStandardMaterial({ 
      color: 0xFAD090, 
      roughness: 0.5 
    });
    const darkClothMat = new THREE.MeshStandardMaterial({ 
      color: 0x111625, 
      roughness: 0.4 
    });
    const secondaryClothMat = new THREE.MeshStandardMaterial({
      color: gender === 'female' ? 0x2A1230 : 0x1E293B,
      roughness: 0.35
    });
    const primaryNeonMat = new THREE.MeshStandardMaterial({ 
      color: gender === 'female' ? 0xEC4899 : 0x00E5FF, 
      emissive: gender === 'female' ? 0xDB2777 : 0x00A2FF, 
      emissiveIntensity: 0.65 
    });
    const accentNeonMat = new THREE.MeshStandardMaterial({ 
      color: gender === 'female' ? 0xA855F7 : 0xFFD54F, 
      emissive: gender === 'female' ? 0x9333EA : 0xFFB800, 
      emissiveIntensity: 0.55 
    });
    const pantsMat = new THREE.MeshStandardMaterial({ 
      color: 0x0B0F19, 
      roughness: 0.6 
    });

    // Face Texture
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 128;
    faceCanvas.height = 128;
    const fctx = faceCanvas.getContext('2d');
    if (fctx) {
      fctx.fillStyle = '#FAD090';
      fctx.fillRect(0, 0, 128, 128);
      
      if (gender === 'female') {
        // Anime female eyes with stylish lashes & reflections
        fctx.fillStyle = '#1e1b4b';
        fctx.fillRect(26, 42, 20, 24);
        fctx.fillRect(82, 42, 20, 24);
        // Lashes
        fctx.fillStyle = '#0f172a';
        fctx.fillRect(22, 38, 26, 5);
        fctx.fillRect(80, 38, 26, 5);
        // Sparkling reflections
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
        // Male anime eyes
        fctx.fillStyle = '#111625';
        fctx.fillRect(28, 42, 18, 26);
        fctx.fillRect(82, 42, 18, 26);
        fctx.fillStyle = '#00E5FF';
        fctx.fillRect(32, 46, 8, 10);
        fctx.fillRect(86, 46, 8, 10);
        fctx.fillStyle = '#111625';
        fctx.beginPath();
        fctx.arc(64, 86, 16, 0.1 * Math.PI, 0.9 * Math.PI);
        fctx.lineWidth = 5;
        fctx.stroke();
      }
    }
    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    const headMaterials = [
      skinMat, skinMat, skinMat, skinMat,
      new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.5 }),
      skinMat
    ];

    // Head
    const headGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
    const head = new THREE.Mesh(headGeo, headMaterials);
    head.position.y = 1.35;
    avatarGroup.add(head);

    // Hair & Head Accessories
    if (gender === 'female') {
      // Cyber Ponytail / Twin cyber hair buns
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.4 });
      const hairTopGeo = new THREE.BoxGeometry(1.2, 0.35, 1.2);
      const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
      hairTop.position.set(0, 1.95, 0);
      avatarGroup.add(hairTop);

      // High cyber ponytail
      const ponytailGeo = new THREE.BoxGeometry(0.45, 1.1, 0.45);
      const ponytail = new THREE.Mesh(ponytailGeo, hairMat);
      ponytail.position.set(0, 1.7, -0.7);
      ponytail.rotation.x = -0.3;
      avatarGroup.add(ponytail);

      // Glowing cyber hairpin / ribbons
      const ribbonGeo = new THREE.BoxGeometry(0.65, 0.18, 0.3);
      const ribbon = new THREE.Mesh(ribbonGeo, primaryNeonMat);
      ribbon.position.set(0, 2.05, -0.5);
      avatarGroup.add(ribbon);

      // Cat-ear style cyber antenna
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 4), primaryNeonMat);
      earL.position.set(-0.55, 2.2, 0);
      earL.rotation.z = 0.2;
      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 4), primaryNeonMat);
      earR.position.set(0.55, 2.2, 0);
      earR.rotation.z = -0.2;
      avatarGroup.add(earL, earR);
    } else {
      // Gaming Headphone accessory
      const bandGeo = new THREE.BoxGeometry(1.25, 0.2, 0.5);
      const band = new THREE.Mesh(bandGeo, darkClothMat);
      band.position.y = 1.95;
      avatarGroup.add(band);

      const earGeo = new THREE.BoxGeometry(0.25, 0.5, 0.5);
      const leftEar = new THREE.Mesh(earGeo, primaryNeonMat);
      leftEar.position.set(-0.65, 1.4, 0);
      const rightEar = new THREE.Mesh(earGeo, primaryNeonMat);
      rightEar.position.set(0.65, 1.4, 0);
      avatarGroup.add(leftEar, rightEar);
    }

    // Torso (Techwear Outfit)
    const torsoGeo = new THREE.BoxGeometry(1.7, 1.75, 0.85);
    const torso = new THREE.Mesh(torsoGeo, secondaryClothMat);
    torso.position.y = -0.15;
    avatarGroup.add(torso);

    const logoStripGeo = new THREE.BoxGeometry(0.35, 1.1, 0.88);
    const logoStrip = new THREE.Mesh(logoStripGeo, primaryNeonMat);
    logoStrip.position.set(0, -0.15, 0.01);
    avatarGroup.add(logoStrip);

    // Left & Right Arms
    const armGeo = new THREE.BoxGeometry(0.65, 1.65, 0.65);
    const leftArm = new THREE.Mesh(armGeo, darkClothMat);
    leftArm.position.set(-1.3, -0.15, 0);
    const rightArm = new THREE.Mesh(armGeo, darkClothMat);
    rightArm.position.set(1.3, -0.15, 0);
    avatarGroup.add(leftArm, rightArm);

    // Neon wrist bands
    const wristGeo = new THREE.BoxGeometry(0.72, 0.15, 0.72);
    const wristL = new THREE.Mesh(wristGeo, accentNeonMat);
    wristL.position.set(-1.3, -0.7, 0);
    const wristR = new THREE.Mesh(wristGeo, accentNeonMat);
    wristR.position.set(1.3, -0.7, 0);
    avatarGroup.add(wristL, wristR);

    // Left & Right Legs
    const legGeo = new THREE.BoxGeometry(0.75, 1.5, 0.75);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.45, -1.7, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.45, -1.7, 0);
    avatarGroup.add(leftLeg, rightLeg);

    // Cyber shoes with glowing soles
    const soleGeo = new THREE.BoxGeometry(0.82, 0.18, 0.95);
    const soleL = new THREE.Mesh(soleGeo, primaryNeonMat);
    soleL.position.set(-0.45, -2.4, 0.08);
    const soleR = new THREE.Mesh(soleGeo, primaryNeonMat);
    soleR.position.set(0.45, -2.4, 0.08);
    avatarGroup.add(soleL, soleR);

    // Floating Companion AI Orb
    const orbGeo = new THREE.IcosahedronGeometry(0.32, 1);
    const orbMat = new THREE.MeshBasicMaterial({ 
      color: gender === 'female' ? 0xEC4899 : 0x00E5FF, 
      wireframe: true 
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.set(1.8, 1.8, -0.8);
    avatarGroup.add(orb);

    scene.add(avatarGroup);

    // 5. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle floating breathing animation
      avatarGroup.position.y = Math.sin(elapsed * 2) * 0.08;

      // Rotation reacts to current active stage
      const targetRotationY = (currentStage * 0.45) - 0.9 + Math.sin(elapsed * 0.8) * 0.2;
      avatarGroup.rotation.y += (targetRotationY - avatarGroup.rotation.y) * 0.08;

      // Companion AI Orb orbiting
      orb.position.y = 1.6 + Math.sin(elapsed * 3) * 0.25;
      orb.rotation.y += 0.04;
      orb.rotation.x += 0.02;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [currentStage, gender, mode]);

  return <div ref={mountRef} className="w-full h-full pointer-events-none" />;
};
