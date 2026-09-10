import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(q.matches);
    q.addEventListener("change", update);
    return () => q.removeEventListener("change", update);
  }, []);
  return reduced;
}
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
// Stable seeds make every formation identical when scrolling back to it.
function random(seed: number) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}
function Crystals({
  progress,
  count,
}: {
  progress: React.RefObject<{ value: number }>;
  count: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        a: random(i + 1),
        b: random(i + 211),
        c: random(i + 531),
        d: random(i + 973),
      })),
    [count],
  );
  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 0.2,
        y: (e.clientY / window.innerHeight - 0.5) * 0.13,
      };
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  useEffect(() => {
    if (!mesh.current) return;
    const color = new THREE.Color();
    seeds.forEach((s, i) => {
      color.set(s.d > 0.94 ? "#e9d7c6" : s.d > 0.6 ? "#b4bed9" : "#5e6f9e");
      mesh.current!.setColorAt(i, color);
    });
    if (mesh.current.instanceColor)
      mesh.current.instanceColor.needsUpdate = true;
  }, [seeds]);
  useFrame((state, delta) => {
    if (!mesh.current || !group.current) return;
    const p = progress.current.value;
    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      pointer.current.x,
      3,
      delta,
    );
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      pointer.current.y,
      3,
      delta,
    );
    const w = state.viewport.width,
      h = state.viewport.height;
    const phase = Math.min(p * 4, 3.999),
      from = Math.floor(phase),
      mix = THREE.MathUtils.smoothstep(phase - from, 0, 1);
    const point = (s: (typeof seeds)[number], stage: number) => {
      const angle = s.a * Math.PI * 2;
      // Elliptical perimeter, flowing ribbons, separated concept clusters, upward arc, open constellation.
      if (stage === 0) {
        const r = 0.79 + s.b * 0.62;
        return [
          Math.cos(angle) * w * 0.53 * r,
          Math.sin(angle) * h * 0.58 * r,
          -3 + s.c * 5,
        ];
      }
      if (stage === 1) {
        const x = (s.a - 0.5) * w * 1.35;
        return [
          x,
          Math.sin(s.a * 8 + s.c * 1.8) * h * 0.21 + (s.b - 0.5) * h * 0.28,
          -4 + s.c * 6,
        ];
      }
      if (stage === 2) {
        const cluster = Math.floor(s.a * 4);
        const theta = s.b * Math.PI * 2;
        return [
          (cluster % 2 === 0 ? -1 : 1) * w * 0.37 +
            Math.cos(theta) * s.c * w * 0.13,
          (cluster < 2 ? 1 : -1) * h * 0.3 + Math.sin(theta) * s.c * h * 0.18,
          -3 + s.d * 5,
        ];
      }
      if (stage === 3) {
        const x = (s.a - 0.5) * w * 1.2;
        return [
          x,
          (s.a * s.a - 0.35) * h * 0.65 + (s.b - 0.5) * h * 0.2,
          -4 + s.c * 6,
        ];
      }
      return [(s.a - 0.5) * w * 1.5, (s.b - 0.5) * h * 1.4, -4 + s.c * 6];
    };
    seeds.forEach((s, i) => {
      const a = point(s, from),
        b = point(s, from + 1);
      dummy.position.set(
        THREE.MathUtils.lerp(a[0], b[0], mix),
        THREE.MathUtils.lerp(a[1], b[1], mix),
        THREE.MathUtils.lerp(a[2], b[2], mix),
      );
      dummy.rotation.set(
        s.a * 6 + p * (s.c + 0.2),
        s.b * 6 + p * 2,
        s.c * 6 - p,
      );
      // Scroll-linked glints, no time-driven random jitter.
      const glint = 0.85 + 0.15 * Math.sin(p * 20 + s.d * 50);
      const size = (s.d > 0.95 ? 0.049 : 0.012 + s.b * 0.026) * glint;
      dummy.scale.set(size * (s.c + 0.5), size * 1.4, size * 0.7);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group ref={group}>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          metalness={0.72}
          roughness={0.2}
          emissive="#6b79ae"
          emissiveIntensity={0.3}
        />
      </instancedMesh>
    </group>
  );
}
export default function CrystalField() {
  const reduced = useReducedMotion();
  const progress = useRef({ value: 0 });
  const [available, setAvailable] = useState(false);
  const [active, setActive] = useState(!document.hidden);
  const count = useMemo(
    () =>
      window.innerWidth < 700 || navigator.hardwareConcurrency < 5 ? 320 : 850,
    [],
  );
  useEffect(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    setAvailable(!!gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }, []);
  useEffect(() => {
    const onVisibility = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);
  useEffect(() => {
    if (reduced) return;
    const tween = gsap.to(progress.current, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".landing",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.6,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reduced]);
  return (
    <div className="crystal-field" aria-hidden="true">
      <div className="static-stars" />
      {available && !reduced && (
        <SceneBoundary>
          <Suspense fallback={null}>
            <Canvas
              dpr={[1, 1.5]}
              camera={{ position: [0, 0, 9], fov: 55 }}
              gl={{
                alpha: true,
                antialias: false,
                powerPreference: "low-power",
              }}
              frameloop={active ? "always" : "never"}
              onCreated={({ gl }) => {
                const lost = (e: Event) => {
                  e.preventDefault();
                  setAvailable(false);
                };
                gl.domElement.addEventListener("webglcontextlost", lost, {
                  once: true,
                });
              }}
            >
              <ambientLight intensity={1.2} />
              <directionalLight
                position={[3, 4, 5]}
                intensity={4}
                color="#dae0ff"
              />
              <pointLight
                position={[-4, -1, 3]}
                intensity={14}
                color="#6175ff"
              />
              <Crystals progress={progress} count={count} />
            </Canvas>
          </Suspense>
        </SceneBoundary>
      )}
      <div className="readability-vignette" />
    </div>
  );
}
