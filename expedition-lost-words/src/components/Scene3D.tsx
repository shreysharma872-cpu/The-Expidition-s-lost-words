import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Coordinate } from "../algorithm/types";

type Props = { grid: string[][]; path: Coordinate[] | null };

const PAPER = new THREE.Color("#ece6d3");
const FLAG = new THREE.Color("#d9a441");
const GAP = 1.08;

function labelTexture(text: string, color: string, bg?: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d")!;
  if (bg) { x.fillStyle = bg; x.beginPath(); x.arc(64, 64, 58, 0, Math.PI * 2); x.fill(); }
  x.fillStyle = color;
  x.font = "400 100px 'Instrument Serif', Georgia, serif";
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillText(text.toUpperCase(), 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

export default function Scene3D({ grid, path }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const pathRef = useRef<Coordinate[] | null>(path);
  const gridRef = useRef(grid);
  gridRef.current = grid;
  const apiRef = useRef<{ setGrid: (g: string[][]) => void; setPath: (p: Coordinate[] | null) => void } | null>(null);

  useEffect(() => {
    const el = host.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0c2a33, 14, 34);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.autoRotate = !reduce;
    controls.autoRotateSpeed = 0.6;

    scene.add(new THREE.HemisphereLight(0xcfe9f0, 0x0c2a33, 1.1));
    const sun = new THREE.DirectionalLight(0xfff1c9, 2.2);
    sun.position.set(6, 12, 5); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 });
    scene.add(sun);
    const lamp = new THREE.PointLight(0xd9a441, 0, 10);
    scene.add(lamp);

    // floating dust
    const dustGeo = new THREE.BufferGeometry();
    const dp = new Float32Array(400 * 3);
    for (let i = 0; i < dp.length; i += 3) { dp[i] = (Math.random() - 0.5) * 30; dp[i + 1] = Math.random() * 9; dp[i + 2] = (Math.random() - 0.5) * 30; }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dp, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xd9a441, size: 0.06, transparent: true, opacity: 0.55 }));
    scene.add(dust);

    const world = new THREE.Group();
    scene.add(world);

    type Tile = { body: THREE.Mesh; mat: THREE.MeshStandardMaterial; baseY: number; lift: number; onRoute: boolean; hover: boolean };
    let tiles: Tile[][] = [];
    let rows = 0, cols = 0;
    const texCache = new Map<string, THREE.CanvasTexture>();
    const tex = (k: string, c: string, bg?: string) => {
      const key = k + c + (bg ?? "");
      if (!texCache.has(key)) texCache.set(key, labelTexture(k, c, bg));
      return texCache.get(key)!;
    };

    let boardGroup = new THREE.Group();
    let routeGroup = new THREE.Group();
    world.add(boardGroup, routeGroup);
    const tileGeo = new THREE.BoxGeometry(0.94, 0.22, 0.94);
    const pos = (r: number, c: number) => new THREE.Vector3((c - (cols - 1) / 2) * GAP, 0, (r - (rows - 1) / 2) * GAP);

    let curve: THREE.CatmullRomCurve3 | null = null;
    let tube: THREE.Mesh | null = null;
    let orb: THREE.Mesh | null = null;
    let progress = 0;
    const orbMat = new THREE.MeshBasicMaterial({ color: 0xfff1c9 });

    const clearGroup = (g: THREE.Group) => {
      g.children.forEach((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry && m.geometry !== tileGeo) m.geometry.dispose();
      });
      g.clear();
    };

    function setGrid(g: string[][]) {
      clearGroup(boardGroup);
      rows = g.length; cols = g[0]?.length ?? 0;
      const board = new THREE.Mesh(
        new THREE.BoxGeometry(cols * GAP + 0.8, 0.3, rows * GAP + 0.8),
        new THREE.MeshStandardMaterial({ color: 0x10242c, roughness: 0.8 })
      );
      board.position.y = -0.3; board.receiveShadow = true;
      boardGroup.add(board);
      tiles = g.map((row, r) => row.map((letter, c) => {
        const mat = new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.55 });
        const body = new THREE.Mesh(tileGeo, mat);
        body.castShadow = body.receiveShadow = true;
        const p = pos(r, c); body.position.copy(p);
        body.userData = { r, c };
        if (letter) {
          const face = new THREE.Mesh(
            new THREE.PlaneGeometry(0.8, 0.8),
            new THREE.MeshBasicMaterial({ map: tex(letter, "#14232b"), transparent: true })
          );
          face.rotation.x = -Math.PI / 2; face.position.y = 0.115;
          body.add(face);
        }
        boardGroup.add(body);
        return { body, mat, baseY: 0, lift: 0, onRoute: false, hover: false };
      }));
      const d = Math.max(rows, cols) * 1.25 + 4;
      camera.position.set(0, d * 0.75, d * 0.85);
      controls.target.set(0, 0, 0);
      controls.minDistance = d * 0.5; controls.maxDistance = d * 1.8;
      lamp.position.set(0, 3, 0);
      setPath(pathRef.current);
    }

    function setPath(p: Coordinate[] | null) {
      pathRef.current = p;
      clearGroup(routeGroup);
      tube = orb = null; curve = null; progress = 0;
      tiles.forEach((row) => row.forEach((t) => { t.onRoute = false; }));
      if (!p || p.length === 0) return;
      p.forEach((q, i) => {
        const t = tiles[q.row]?.[q.col]; if (!t) return;
        t.onRoute = true;
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex(String(i + 1), "#d9a441", "#14232b"), depthTest: false }));
        s.scale.set(0.42, 0.42, 1);
        s.position.copy(pos(q.row, q.col)).setY(0.95);
        s.renderOrder = 10;
        routeGroup.add(s);
      });
      const pts = p.map((q) => pos(q.row, q.col).setY(0.62));
      if (pts.length > 1) {
        curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.1);
        tube = new THREE.Mesh(
          new THREE.TubeGeometry(curve, pts.length * 16, 0.07, 10, false),
          new THREE.MeshStandardMaterial({ color: 0xd9a441, emissive: 0xd9a441, emissiveIntensity: 0.9 })
        );
        routeGroup.add(tube);
      }
      orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 20), orbMat);
      orb.position.copy(pts[0]);
      routeGroup.add(orb);
    }

    apiRef.current = { setGrid, setPath };
    setGrid(grid);
    let alive = true;
    document.fonts?.ready.then(() => {
      if (!alive) return;
      texCache.forEach((t) => t.dispose());
      texCache.clear();
      setGrid(gridRef.current);
    });

    // hover lift
    const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    let hovered: Tile | null = null;
    const onMove = (e: PointerEvent) => {
      const b = renderer.domElement.getBoundingClientRect();
      mouse.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1);
      ray.setFromCamera(mouse, camera);
      const hit = ray.intersectObjects(tiles.flat().map((t) => t.body), false)[0];
      if (hovered) hovered.hover = false;
      hovered = hit ? tiles[hit.object.userData.r][hit.object.userData.c] : null;
      if (hovered) hovered.hover = true;
      renderer.domElement.style.cursor = hovered ? "pointer" : "grab";
    };
    renderer.domElement.addEventListener("pointermove", onMove);
    controls.addEventListener("start", () => { controls.autoRotate = false; });

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(el); resize();

    const clock = new THREE.Clock();
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      tiles.forEach((row) => row.forEach((tl) => {
        const target = (tl.onRoute ? 0.38 : 0) + (tl.hover ? 0.15 : 0);
        tl.lift += (target - tl.lift) * Math.min(1, dt * 9);
        tl.body.position.y = tl.lift;
        tl.mat.color.lerp(tl.onRoute ? FLAG : PAPER, Math.min(1, dt * 8));
      }));
      if (curve && tube && orb) {
        progress = Math.min(1, progress + dt / (reduce ? 0.01 : 1.8));
        const total = tube.geometry.index!.count;
        tube.geometry.setDrawRange(0, Math.floor((progress * total) / 3) * 3);
        orb.position.copy(curve.getPointAt(progress));
        lamp.position.copy(orb.position).setY(1.4);
        lamp.intensity = 14;
      } else { lamp.intensity = 0; if (orb) orb.position.y = 0.62 + Math.sin(t * 3) * 0.06; }
      dust.rotation.y += dt * 0.02;
      controls.update();
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      alive = false;
      cancelAnimationFrame(raf); ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onMove);
      controls.dispose(); renderer.dispose();
      texCache.forEach((t) => t.dispose());
      el.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gridKey = grid.map((r) => r.join("")).join("/");
  useEffect(() => { apiRef.current?.setGrid(grid); /* eslint-disable-next-line */ }, [gridKey]);
  useEffect(() => { apiRef.current?.setPath(path); }, [path]);

  return <div ref={host} className="scene" aria-label="3D map of the letter grid. Drag to rotate, scroll to zoom." role="img" />;
}
