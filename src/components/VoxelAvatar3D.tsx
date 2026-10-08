import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface VoxelAvatar3DProps {
  currentStage: number;
}

export const VoxelAvatar3D: React.FC<VoxelAvatar3DProps> = ({ currentStage }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080C14, 0.04);

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

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00A2FF, 2.5);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    const goldLight = new THREE.PointLight(0xFFB800, 3, 10);
    goldLight.position.set(-3, 3, 2);
    scene.add(goldLight);

    // 3. Cyber Ground Grid
    const grid = new THREE.GridHelper(24, 24, 0x00A2FF, 0x1A2A40);
    grid.position.y = -1.6;
    scene.add(grid);

    // 4. Build Roblox Voxel Avatar Group
    const avatarGroup = new THREE.Group();

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({ 
      color: 0xFAD090, 
      roughness: 0.5 
    });
    const hoodieMat = new THREE.MeshStandardMaterial({ 
      color: 0x111625, 
      roughness: 0.4 
    });
    const neonCyanMat = new THREE.MeshStandardMaterial({ 
      color: 0x00E5FF, 
      emissive: 0x00A2FF, 
      emissiveIntensity: 0.6 
    });
    const neonGoldMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFD54F, 
      emissive: 0xFFB800, 
      emissiveIntensity: 0.5 
    });
    const pantsMat = new THREE.MeshStandardMaterial({ 
      color: 0x0B0F19, 
      roughness: 0.6 
    });

    // Face Texture via Canvas
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 128;
    faceCanvas.height = 128;
    const fctx = faceCanvas.getContext('2d');
    if (fctx) {
      fctx.fillStyle = '#FAD090';
      fctx.fillRect(0, 0, 128, 128);
      
      // Anime/Roblox friendly eyes
      fctx.fillStyle = '#111625';
      fctx.fillRect(28, 42, 18, 26);
      fctx.fillRect(82, 42, 18, 26);
      // Eye reflections
      fctx.fillStyle = '#00E5FF';
      fctx.fillRect(32, 46, 8, 10);
      fctx.fillRect(86, 46, 8, 10);
      
      // Confident smile
      fctx.fillStyle = '#111625';
      fctx.beginPath();
      fctx.arc(64, 86, 16, 0.1 * Math.PI, 0.9 * Math.PI);
      fctx.lineWidth = 5;
      fctx.stroke();
    }
    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    const headMaterials = [
      skinMat, // right
      skinMat, // left
      skinMat, // top
      skinMat, // bottom
      new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.5 }), // FRONT FACE
      skinMat  // back
    ];

    // Head
    const headGeo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
    const head = new THREE.Mesh(headGeo, headMaterials);
    head.position.y = 1.35;
    avatarGroup.add(head);

    // Gaming Headphone accessory
    const bandGeo = new THREE.BoxGeometry(1.25, 0.2, 0.5);
    const band = new THREE.Mesh(bandGeo, hoodieMat);
    band.position.y = 1.95;
    avatarGroup.add(band);

    const earGeo = new THREE.BoxGeometry(0.25, 0.5, 0.5);
    const leftEar = new THREE.Mesh(earGeo, neonCyanMat);
    leftEar.position.set(-0.65, 1.4, 0);
    const rightEar = new THREE.Mesh(earGeo, neonCyanMat);
    rightEar.position.set(0.65, 1.4, 0);
    avatarGroup.add(leftEar, rightEar);

    // Torso (Cyber Hoodie with AI Logo strip)
    const torsoGeo = new THREE.BoxGeometry(1.8, 1.8, 0.9);
    const torso = new THREE.Mesh(torsoGeo, hoodieMat);
    torso.position.y = -0.15;
    avatarGroup.add(torso);

    const logoStripGeo = new THREE.BoxGeometry(0.3, 1.2, 0.92);
    const logoStrip = new THREE.Mesh(logoStripGeo, neonCyanMat);
    logoStrip.position.set(0, -0.15, 0.01);
    avatarGroup.add(logoStrip);

    // Left & Right Arms
    const armGeo = new THREE.BoxGeometry(0.7, 1.7, 0.7);
    const leftArm = new THREE.Mesh(armGeo, hoodieMat);
    leftArm.position.set(-1.35, -0.15, 0);
    const rightArm = new THREE.Mesh(armGeo, hoodieMat);
    rightArm.position.set(1.35, -0.15, 0);
    avatarGroup.add(leftArm, rightArm);

    // Left & Right Legs
    const legGeo = new THREE.BoxGeometry(0.8, 1.8, 0.8);
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.48, -1.9, 0);
    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.48, -1.9, 0);
    avatarGroup.add(leftLeg, rightLeg);

    // 5. Floating Robotic AI Companion Crystal / Drone
    const droneGroup = new THREE.Group();
    const droneGeo = new THREE.OctahedronGeometry(0.35);
    const drone = new THREE.Mesh(droneGeo, neonGoldMat);
    droneGroup.add(drone);
    droneGroup.position.set(1.9, 1.8, 0.8);
    scene.add(droneGroup);

    // Initial positioning
    avatarGroup.position.y = 0.5;
    scene.add(avatarGroup);

    // 6. Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
      targetRotationY = x * 0.45;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 7. Render Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Idle float & breathing
      avatarGroup.position.y = 0.5 + Math.sin(elapsedTime * 2) * 0.08;
      
      // Arms gentle sway
      leftArm.rotation.x = Math.sin(elapsedTime * 2) * 0.08;
      rightArm.rotation.x = -Math.sin(elapsedTime * 2) * 0.08;
      
      // Head tracks mouse slightly
      head.rotation.y = mouseX * 0.35;
      head.rotation.x = -mouseY * 0.2;

      // Body smooth lerp rotate
      avatarGroup.rotation.y += (targetRotationY - avatarGroup.rotation.y) * 0.05;

      // Orbiting AI Drone
      droneGroup.position.x = Math.cos(elapsedTime * 2.5) * 1.8;
      droneGroup.position.z = Math.sin(elapsedTime * 2.5) * 1.5;
      droneGroup.position.y = 1.6 + Math.sin(elapsedTime * 3) * 0.15;
      drone.rotation.x += 0.03;
      drone.rotation.y += 0.04;

      // Camera position shift based on stage
      let targetCamX = 0;
      if (currentStage === 0) targetCamX = 0;
      else if (currentStage === 1) targetCamX = -1.2;
      else if (currentStage === 2) targetCamX = 1.3;
      else targetCamX = 0;

      camera.position.x += (targetCamX - camera.position.x) * 0.05;

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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [currentStage]);

  return <div ref={mountRef} className="three-canvas-container" />;
};
