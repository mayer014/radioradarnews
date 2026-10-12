import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useTheme } from '@/contexts/ThemeContext';

interface Tile {
  x: number;
  y: number;
  z: number;
  velocity: number;
}

const createGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.7)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(canvas);
};

const HexagonSurface = () => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const isDark = theme === 'dark';
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setFallback(true);
      return;
    }
    setFallback(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x080b12 : 0xf6f7fb);
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 160);
    camera.position.set(0, 0, 80);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, isDark ? 0x35415a : 0xb8c4da, isDark ? 1.1 : 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.4 : 2.5);
    keyLight.position.set(-25, 35, 45);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xcfdcff, isDark ? 0.35 : 0.7);
    fillLight.position.set(30, -15, 20);
    scene.add(fillLight);

    const blueLight = new THREE.PointLight(0x39c7ff, 0, 38, 2);
    const violetLight = new THREE.PointLight(0x9461ff, 0, 34, 2);
    const roseLight = new THREE.PointLight(0xff77cc, 0, 30, 2);
    scene.add(blueLight, violetLight, roseLight);

    const material = new THREE.MeshPhysicalMaterial({
      color: isDark ? 0x1b202a : 0xf4f5f8,
      roughness: isDark ? 0.32 : 0.24,
      metalness: isDark ? 0.22 : 0.08,
      clearcoat: 0.9,
      clearcoatRoughness: 0.14,
    });
    const floorGeometry = new THREE.PlaneGeometry(1, 1);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: isDark ? 0x05070c : 0xd8e1ee });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.z = -0.8;
    scene.add(floor);

    const glowTexture = createGlowTexture();
    const glowMaterials = [
      new THREE.SpriteMaterial({ map: glowTexture, color: 0x39c7ff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
      new THREE.SpriteMaterial({ map: glowTexture, color: 0x9461ff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
      new THREE.SpriteMaterial({ map: glowTexture, color: 0xff77cc, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
    ];
    const glows = glowMaterials.map(glowMaterial => {
      const glow = new THREE.Sprite(glowMaterial);
      glow.position.z = -0.6;
      glow.scale.set(18, 18, 1);
      scene.add(glow);
      return glow;
    });

    let mesh: THREE.InstancedMesh<THREE.ExtrudeGeometry, THREE.MeshPhysicalMaterial> | undefined;
    let tiles: Tile[] = [];
    let radius = 1.4;
    let frame = 0;
    let previousTime = 0;
    let lastPaint = 0;
    let time = 0;
    let activeAmount = 0;
    let contextLost = false;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = new THREE.Vector2();
    const cursor = new THREE.Vector3();
    const target = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const transform = new THREE.Object3D();
    let pointerActive = false;

    const buildGrid = (width: number, height: number) => {
      const worldHeight = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const worldWidth = worldHeight * camera.aspect;
      radius = worldHeight * (width < 640 ? 28 : 36) / height;
      const stepX = Math.sqrt(3) * radius;
      const stepY = 1.5 * radius;
      const columns = Math.ceil(worldWidth / stepX) + 4;
      const rows = Math.ceil(worldHeight / stepY) + 4;
      const shape = new THREE.Shape();
      for (let side = 0; side < 6; side++) {
        const angle = Math.PI / 6 + side * Math.PI / 3;
        // Leave a clear channel for the internal glow, even when raised tiles expand in perspective.
        const x = Math.cos(angle) * radius * 0.91;
        const y = Math.sin(angle) * radius * 0.91;
        if (side === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: radius * 0.28,
        steps: 1,
        bevelEnabled: true,
        bevelThickness: radius * 0.035,
        bevelSize: radius * 0.025,
        bevelSegments: 2,
        curveSegments: 1,
      });
      if (mesh) {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.dispose();
      }
      mesh = new THREE.InstancedMesh(geometry, material, columns * rows);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      // Tiles move beyond their initial bounds near the pointer.
      mesh.frustumCulled = false;
      tiles = [];
      for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
        tiles.push({
          x: (column - (columns - 1) / 2) * stepX + (row % 2 ? stepX / 2 : 0),
          y: (row - (rows - 1) / 2) * stepY,
          z: 0,
          velocity: 0,
        });
      }
      scene.add(mesh);
      floor.scale.set(worldWidth * 1.2, worldHeight * 1.2, 1);
      floor.position.z = -radius * 1.1;
    };

    const render = (delta: number, immediate = false) => {
      if (!mesh || contextLost) return;
      const reduced = motion.matches;
      if (!reduced) time += delta;
      const smoothing = immediate || reduced ? 1 : 1 - Math.exp(-delta * 9);
      activeAmount += ((pointerActive ? 1 : 0) - activeAmount) * smoothing;
      cursor.lerp(target, smoothing);
      const influence = radius * 5;
      // All colored emitters sit underneath the opaque tiles, inside the channels.
      const emitterZ = -radius * 0.4;
      blueLight.position.set(cursor.x - radius * 1.4, cursor.y + radius, emitterZ);
      violetLight.position.set(cursor.x + radius * 2, cursor.y - radius, emitterZ);
      roseLight.position.set(cursor.x + Math.sin(time * 0.9) * radius * 2.4, cursor.y + Math.cos(time * 0.9) * radius * 2.4, emitterZ);
      blueLight.intensity = activeAmount * 80;
      violetLight.intensity = activeAmount * 65;
      roseLight.intensity = activeAmount * 50;
      [blueLight, violetLight, roseLight].forEach((light, index) => {
        light.distance = radius * 10;
        // Depth testing lets the geometry mask the glow: only the gaps reveal it.
        glows[index].position.set(light.position.x, light.position.y, -radius * 0.9);
        glows[index].scale.set(radius * 14, radius * 14, 1);
        glowMaterials[index].opacity = activeAmount * [1, 0.95, 0.85][index];
      });

      const step = Math.min(delta * 60, 2);
      tiles.forEach((tile, index) => {
        const dx = tile.x - cursor.x;
        const dy = tile.y - cursor.y;
        const distance = Math.hypot(dx, dy);
        const bump = Math.max(0, 1 - (distance / influence) ** 1.5) * activeAmount;
        const wave = reduced ? 0 : Math.sin(tile.x * 0.22 + time * 0.7) * Math.cos(tile.y * 0.2 + time * 0.5) * radius * 0.055;
        const desiredZ = reduced ? 0 : bump * radius * 2.15 + wave;
        if (immediate || reduced) {
          tile.z = desiredZ;
          tile.velocity = 0;
        } else {
          tile.velocity = (tile.velocity + (desiredZ - tile.z) * 0.055 * step) * Math.pow(0.79, step);
          tile.z += tile.velocity * step;
        }
        const tilt = Math.min(distance / (radius * 1.5), 1) * tile.z / radius * 0.12;
        transform.position.set(tile.x, tile.y, tile.z);
        transform.rotation.set(distance > 0.01 ? -dy / distance * tilt : 0, distance > 0.01 ? dx / distance * tilt : 0, 0);
        transform.updateMatrix();
        mesh.setMatrixAt(index, transform.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    };

    const animate = (now: number) => {
      if (now - lastPaint >= 1000 / 30) {
        const delta = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 1 / 30;
        previousTime = lastPaint = now;
        render(delta);
      }
      frame = window.requestAnimationFrame(animate);
    };

    const resume = () => {
      window.cancelAnimationFrame(frame);
      previousTime = 0;
      render(0, motion.matches);
      if (!document.hidden && !motion.matches && !contextLost) frame = window.requestAnimationFrame(animate);
    };

    const updatePointer = (event: PointerEvent) => {
      pointer.set(event.clientX / window.innerWidth * 2 - 1, -event.clientY / window.innerHeight * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(plane, target)) pointerActive = true;
      // Reduced motion keeps the geometry still while allowing light to follow input.
      if (motion.matches) render(0, true);
    };
    const resetPointer = () => {
      pointerActive = false;
      if (motion.matches) render(0, true);
    };
    const endTouch = (event: PointerEvent) => {
      if (event.pointerType === 'touch') resetPointer();
    };
    const resize = () => {
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      renderer.setSize(width, height, false);
      buildGrid(width, height);
      render(0, true);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      window.cancelAnimationFrame(frame);
      setFallback(true);
    };
    const onContextRestored = () => {
      contextLost = false;
      setFallback(false);
      resume();
    };

    resize();
    resume();
    window.addEventListener('pointermove', updatePointer, { passive: true });
    window.addEventListener('pointerdown', updatePointer, { passive: true });
    window.addEventListener('pointerup', endTouch, { passive: true });
    window.addEventListener('pointercancel', resetPointer);
    document.documentElement.addEventListener('pointerleave', resetPointer);
    window.addEventListener('blur', resetPointer);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', resume);
    motion.addEventListener('change', resume);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', updatePointer);
      window.removeEventListener('pointerdown', updatePointer);
      window.removeEventListener('pointerup', endTouch);
      window.removeEventListener('pointercancel', resetPointer);
      document.documentElement.removeEventListener('pointerleave', resetPointer);
      window.removeEventListener('blur', resetPointer);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', resume);
      motion.removeEventListener('change', resume);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      mesh?.geometry.dispose();
      mesh?.dispose();
      material.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      glowTexture?.dispose();
      glowMaterials.forEach(glowMaterial => glowMaterial.dispose());
      renderer.dispose();
      // React StrictMode reuses this canvas during its setup/cleanup check.
      // Forcing context loss here would break the next renderer initialization.
    };
  }, [theme]);

  return (
    <div className="geometric-background" data-renderer={fallback ? 'fallback' : 'webgl'} aria-hidden="true">
      <div className="geometric-fallback" />
      <canvas ref={canvasRef} className="geometric-canvas" />
      <div className="geometric-reading-light" />
    </div>
  );
};

export default HexagonSurface;
