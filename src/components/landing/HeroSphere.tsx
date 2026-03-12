import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// Simplex-style noise inline (no external dep)
function noise(x: number, y: number, z: number): number {
  const p = new Array(512);
  const permutation = [
    151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,
    142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,
    203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,
    175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,
    230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,
    209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,
    198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,
    212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,
    2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,
    79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,
    12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,
    157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,
    29,24,72,243,141,128,195,78,66,215,61,156,180,
  ];
  for (let i = 0; i < 256; i++) p[256 + i] = p[i] = permutation[i];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (t: number, a: number, b: number) => a + t * (b - a);
  const grad = (hash: number, x: number, y: number, z: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z);
  const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z;
  const B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
  return lerp(w,
    lerp(v, lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
             lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))),
    lerp(v, lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
             lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1)))
  );
}

function OrganicSphere({ mouseX, mouseY }: { mouseX: number; mouseY: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();

  const geometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(1.6, 64);
  }, []);

  const basePositions = useMemo(() => {
    return Float32Array.from(geometry.attributes.position.array);
  }, [geometry]);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("hsl(218, 72%, 32%)"),
      roughness: 0.2,
      metalness: 0.85,
      wireframe: false,
      envMapIntensity: 1.2,
    });
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const pos = meshRef.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;
    const base = basePositions;

    for (let i = 0; i < arr.length; i += 3) {
      const ox = base[i], oy = base[i + 1], oz = base[i + 2];
      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const nx = ox / len, ny = oy / len, nz = oz / len;

      const n1 = noise(nx * 1.5 + t * 0.3, ny * 1.5 + t * 0.2, nz * 1.5 + t * 0.25);
      const n2 = noise(nx * 3 + t * 0.15, ny * 3 - t * 0.1, nz * 3 + t * 0.2) * 0.4;
      const displacement = 1 + (n1 + n2) * 0.28;

      arr[i]     = nx * len * displacement + mouseX * 0.15 * ny;
      arr[i + 1] = ny * len * displacement + mouseY * 0.15 * nx;
      arr[i + 2] = nz * len * displacement;
    }

    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();

    meshRef.current.rotation.y = t * 0.12 + mouseX * 0.4;
    meshRef.current.rotation.x = t * 0.08 + mouseY * 0.2;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} castShadow />
  );
}

function GlowRing() {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = clock.getElapsedTime() * 0.25;
    ringRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.4;
  });
  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[2.3, 0.025, 6, 120]} />
      <meshBasicMaterial color={new THREE.Color(0xff6b00)} transparent opacity={0.55} />
    </mesh>
  );
}

function GlowRing2() {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = -clock.getElapsedTime() * 0.18;
    ringRef.current.rotation.y = clock.getElapsedTime() * 0.12;
  });
  return (
    <mesh ref={ringRef}>
      <torusGeometry args={[2.7, 0.015, 6, 120]} />
      <meshBasicMaterial color={new THREE.Color(0x3a7bd5)} transparent opacity={0.35} />
    </mesh>
  );
}

function Particles() {
  const count = 180;
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.2 + Math.random() * 1.8;
      arr[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = clock.getElapsedTime() * 0.06;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.025} color={0xffffff} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

interface Props {
  mouseX?: number;
  mouseY?: number;
}

export default function HeroSphere({ mouseX = 0, mouseY = 0 }: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.5], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1.4} color={0xffffff} />
      <pointLight position={[-4, -4, -4]} intensity={0.8} color={0xff6b00} />
      <pointLight position={[4, 4, 4]} intensity={0.6} color={0x3a7bd5} />
      <pointLight position={[0, -6, 2]} intensity={0.5} color={0x1a3a7a} />
      <OrganicSphere mouseX={mouseX} mouseY={mouseY} />
      <GlowRing />
      <GlowRing2 />
      <Particles />
    </Canvas>
  );
}
