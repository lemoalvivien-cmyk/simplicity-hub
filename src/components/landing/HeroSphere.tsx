import { useRef, useMemo, forwardRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Perlin noise (Ken Perlin improved) ────────────────────────────────────
const P = new Uint8Array(512);
const perm = [
  151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
  8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,
  35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,
  134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,
  55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,
  18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,
  250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
  189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
  172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,
  228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,
  107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180,
];
for (let i = 0; i < 256; i++) P[i] = P[i + 256] = perm[i];
function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
function grad(h: number, x: number, y: number, z: number) {
  const g = h & 15, u = g < 8 ? x : y, v = g < 4 ? y : g === 12 || g === 14 ? x : z;
  return ((g & 1) ? -u : u) + ((g & 2) ? -v : v);
}
function noise(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z;
  const B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
  return lerp(
    lerp(lerp(grad(P[AA],x,y,z),grad(P[BA],x-1,y,z),u), lerp(grad(P[AB],x,y-1,z),grad(P[BB],x-1,y-1,z),u), v),
    lerp(lerp(grad(P[AA+1],x,y,z-1),grad(P[BA+1],x-1,y,z-1),u), lerp(grad(P[AB+1],x,y-1,z-1),grad(P[BB+1],x-1,y-1,z-1),u), v),
    w
  );
}

// ─── Organic morphing sphere ────────────────────────────────────────────────
function OrganicSphere({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.7, 64), []);
  const basePositions = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.606, 0.72, 0.28),
    roughness: 0.08,
    metalness: 0.92,
    wireframe: false,
    envMapIntensity: 1.6,
  }), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < arr.length; i += 3) {
      const ox = basePositions[i], oy = basePositions[i + 1], oz = basePositions[i + 2];
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / len, ny = oy / len, nz = oz / len;
      // 3-octave FBM
      const n1 = noise(nx * 1.8 + t * 0.28, ny * 1.8 + t * 0.22, nz * 1.8 + t * 0.24);
      const n2 = noise(nx * 3.5 + t * 0.14, ny * 3.5 - t * 0.11, nz * 3.5 + t * 0.18) * 0.45;
      const n3 = noise(nx * 6.2 - t * 0.09, ny * 6.2 + t * 0.07, nz * 6.2 - t * 0.12) * 0.2;
      const disp = 1 + (n1 + n2 + n3) * 0.3;
      arr[i]     = nx * len * disp + mouseX * 0.18 * ny;
      arr[i + 1] = ny * len * disp + mouseY * 0.18 * nx;
      arr[i + 2] = nz * len * disp + mouseX * 0.05 * nz;
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
    meshRef.current.rotation.y = t * 0.10 + mouseX * 0.5;
    meshRef.current.rotation.x = t * 0.07 + mouseY * 0.25;
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} castShadow />;
}

// ─── Orbital ring — imperative ref to avoid forwardRef warning ──────────────
function Ring({ radius, thickness, color, speed, axis }: {
  radius: number; thickness: number; color: number; speed: number; axis: "x" | "y" | "z";
}) {
  const geo = useMemo(() => new THREE.TorusGeometry(radius, thickness, 8, 128), [radius, thickness]);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 }), [color]);
  // Use a plain object ref instead of THREE.Mesh ref to avoid R3F forwardRef warning
  const ref = useRef<THREE.Mesh | null>(null);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.getElapsedTime() * speed;
    if (axis === "x") m.rotation.x = t;
    else if (axis === "y") m.rotation.y = t;
    else { m.rotation.z = t; m.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.4; }
  });

  return (
    <mesh
      ref={ref}
      geometry={geo}
      material={mat}
    />
  );
}

// ─── Energy particle field ──────────────────────────────────────────────────
function ParticleField() {
  const ref = useRef<THREE.Points>(null);
  const COUNT = 220;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.4 + Math.random() * 2.2;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      const t = Math.random();
      colors[i * 3]     = t > 0.7 ? 1.0 : 0.22;
      colors[i * 3 + 1] = t > 0.7 ? 0.42 : 0.48;
      colors[i * 3 + 2] = t > 0.7 ? 0.0 : 0.85;
    }
    return { positions, colors };
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = t * 0.05;
    ref.current.rotation.x = t * 0.03;
  });

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [positions, colors]);

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.03} vertexColors transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

// ─── Scan line (holographic) ────────────────────────────────────────────────
function ScanLine() {
  const ref = useRef<THREE.Mesh | null>(null);
  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: 0x3a9bd5, transparent: true, opacity: 0.08, side: THREE.DoubleSide }),
    []
  );
  const geo = useMemo(() => new THREE.PlaneGeometry(6, 0.015), []);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    m.position.y = Math.sin(clock.getElapsedTime() * 0.8) * 2.2;
    (m.material as THREE.MeshBasicMaterial).opacity =
      0.06 + Math.abs(Math.sin(clock.getElapsedTime() * 0.8)) * 0.08;
  });

  return <mesh ref={ref} geometry={geo} material={mat} />;
}

// ─── Export ─────────────────────────────────────────────────────────────────
interface Props { mouseX?: number; mouseY?: number; }

export default function HeroSphere({ mouseX = 0, mouseY = 0 }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.8], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 6, 6]} intensity={1.6} color={0xffffff} />
      <pointLight position={[-5, -3, -3]} intensity={1.2} color={0xff6b00} />
      <pointLight position={[4, 5, 3]} intensity={0.9} color={0x3a7bd5} />
      <pointLight position={[0, -7, 2]} intensity={0.6} color={0x1a2a6a} />
      <pointLight position={[0, 0, 4]} intensity={0.4} color={0xffffff} />
      <OrganicSphere mouseX={mouseX} mouseY={mouseY} />
      <Ring radius={2.4} thickness={0.022} color={0xff6b00} speed={0.22} axis="z" />
      <Ring radius={2.9} thickness={0.014} color={0x3a7bd5} speed={-0.15} axis="y" />
      <Ring radius={3.3} thickness={0.009} color={0x2edd8e} speed={0.08} axis="x" />
      <ParticleField />
      <ScanLine />
    </Canvas>
  );
}
