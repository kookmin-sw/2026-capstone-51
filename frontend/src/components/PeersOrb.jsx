/**
 * 동기/선배 비교 — 5축 입체 레이더 (유리 구체 안에 입체 차트).
 * Three.js 사용. 기본 정지, 마우스 드래그로만 회전 (놓으면 모멘텀 감쇠 후 정지).
 *
 * props:
 *   axes  — [{ label, me, peers, seniors? }] (값 0~100, seniors 없으면 0 처리)
 *   title, sub
 *   embedded — true 면 외곽 .card 래퍼/패딩 제거. 상단 통합 카드의 한 칸으로 들어갈 때 사용.
 *   chartMaxWidth — 차트 wrap 의 maxWidth(px). 모달 확대 모드에서 키워 사용.
 *   onExpand — 헤더 우측 확대 아이콘 클릭 콜백. 미지정이면 아이콘 자체가 안 보임.
 *
 * 시각 정책:
 *  - 세 폴리곤(나/동기/선배) 모두 grid 평면(z=0) 을 가운데로 두고 +z / -z 양쪽으로
 *    반씩 솟는 "샌드위치" prism. 어느 방향에서 봐도 폴리곤이 튀어나와 보임.
 *  - depth 만 단계화(선배 0.07 / 동기 0.10 / 나 0.13) — 작은 폴리곤(예: 나)이 더 두껍게
 *    양쪽으로 빼꼼히 솟아 stepped 중첩이 회전 어느 각도에서도 유지.
 *  - 색은 사용자가 범례 swatch 를 눌러 바꿀 수 있고 localStorage 에 저장됨.
 *
 * WebGL 미지원 / 컨텍스트 생성 실패 시 막대 그래프로 graceful degradation.
 *  - 마운트 전에 canvas.getContext('webgl') 으로 사전 체크
 *  - 사전 체크 통과해도 런타임에 WebGLRenderer 생성 실패할 수 있어 try/catch
 *  - 어느 쪽이든 실패하면 PeersFallbackChart 로 5축 값 그대로 렌더
 */
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Maximize2 } from 'lucide-react';
import { cn } from '../lib/cn';

const COLOR_DEFAULTS = {
  me: '#1e40af', // Blue-800
  peers: '#94a3b8', // Slate-400
  seniors: '#c2410c', // Orange-700
};
const COLOR_STORAGE_KEY = 'peersOrb.colors.v1';

function loadColors() {
  if (typeof window === 'undefined') return COLOR_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(COLOR_STORAGE_KEY);
    if (!raw) return COLOR_DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...COLOR_DEFAULTS, ...parsed };
  } catch {
    return COLOR_DEFAULTS;
  }
}

function isWebGLAvailable() {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl2') ||
        c.getContext('webgl') ||
        c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export default function PeersOrb({
  axes,
  title = '내 동기들은 뭐하고 있을까?',
  sub = '소프트웨어학부 22학번 · 익명 집계 · 214명 기준',
  embedded = false,
  chartMaxWidth = 360,
  onExpand,
}) {
  const wrapRef = useRef(null);
  const [webglOK, setWebglOK] = useState(isWebGLAvailable);
  const [showMe, setShowMe] = useState(true);
  const [showPeers, setShowPeers] = useState(true);
  const [showSeniors, setShowSeniors] = useState(true);
  const [colors, setColors] = useState(loadColors);
  // 메쉬 가시성/색을 토글로 즉시 반영하기 위해 ref 보관 (scene 재구축 회피).
  const myMeshRef = useRef(null);
  const peersMeshRef = useRef(null);
  const seniorsMeshRef = useRef(null);

  // 색 변경 — localStorage 영속화.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(COLOR_STORAGE_KEY, JSON.stringify(colors));
    } catch {
      /* quota / private mode — 무시 */
    }
  }, [colors]);

  useEffect(() => {
    if (!webglOK) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    // 0~1 정규화
    const labels = axes.map((a) => a.label);
    const myData = axes.map((a) => a.me / 100);
    const peersData = axes.map((a) => a.peers / 100);
    const seniorsData = axes.map((a) => (a.seniors ?? 0) / 100);
    const N = axes.length;

    const SPHERE_R = 2.5;
    const CHART_R = 1.7;
    const LABEL_R = 2.15;

    const angleAt = (i) => Math.PI / 2 - (i * 2 * Math.PI) / N;
    const pointAt = (i, value) => {
      const a = angleAt(i);
      const r = CHART_R * value;
      return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0);
    };

    /* ========== Scene setup ========== */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.3, 8.5);
    camera.lookAt(0, 0, 0);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn('[PeersOrb] WebGLRenderer 생성 실패, fallback 렌더', e);
      }
      // 사전 체크 통과했지만 런타임에 컨텍스트 생성 실패한 케이스 — fallback 으로 전환.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWebglOK(false);
      return;
    }
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    wrap.appendChild(renderer.domElement);

    /* ========== Lights ========== */
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(-4, 6, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xbfdbfe, 0.4);
    rimLight.position.set(5, -3, 4);
    scene.add(rimLight);
    const topGlow = new THREE.PointLight(0xffffff, 0.7, 12);
    topGlow.position.set(-2, 3, 4);
    scene.add(topGlow);

    /* ========== Orb group (회전 적용 대상) ========== */
    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    /* ===== Glass sphere ===== */
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(SPHERE_R, 64, 64),
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.12,
        shininess: 180,
        specular: 0xffffff,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    orbGroup.add(sphere);

    orbGroup.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(SPHERE_R + 0.003, 24, 16),
        new THREE.MeshBasicMaterial({
          color: 0x94a3b8,
          wireframe: true,
          transparent: true,
          opacity: 0.07,
          depthWrite: false,
        })
      )
    );

    {
      const points = [];
      const seg = 64;
      for (let i = 0; i <= seg; i++) {
        const t = (i / seg) * Math.PI * 2;
        points.push(
          new THREE.Vector3(SPHERE_R * Math.cos(t), 0, SPHERE_R * Math.sin(t))
        );
      }
      orbGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({
            color: 0xcbd5e1,
            transparent: true,
            opacity: 0.4,
          })
        )
      );
    }

    /* ===== Grid: 동심 N각형 + 축선 ===== */
    const polygonOpacityFor = (level) => {
      if (level === 1) return 0.55;
      if (level === 0.75) return 0.4;
      if (level === 0.5) return 0.35;
      return 0.25;
    };
    [0.25, 0.5, 0.75, 1].forEach((level) => {
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const a = angleAt(i % N);
        const r = CHART_R * level;
        pts.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 0));
      }
      const mat = new THREE.LineBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: polygonOpacityFor(level),
      });
      orbGroup.add(
        new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat)
      );
    });

    const axisMat = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.45,
    });
    for (let i = 0; i < N; i++) {
      const a = angleAt(i);
      const pts = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(CHART_R * Math.cos(a), CHART_R * Math.sin(a), 0),
      ];
      orbGroup.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          axisMat.clone()
        )
      );
    }

    const makeScaleText = (text) => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#9ca3af';
      ctx.font = '600 18px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 32, 16);
      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.LinearFilter;
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          depthTest: false,
        })
      );
      sp.scale.set(0.4, 0.2, 1);
      return sp;
    };
    [0.25, 0.5, 0.75, 1].forEach((level) => {
      const sp = makeScaleText(Math.round(level * 100));
      sp.position.set(0.06, CHART_R * level, 0.001);
      sp.center.set(0, 0.5);
      orbGroup.add(sp);
    });

    /* ===== Data shapes (입체 polygon) ===== */
    const buildDataMesh = (data, color, opacity, depth, zOffset) => {
      const shape = new THREE.Shape();
      for (let i = 0; i < N; i++) {
        const p = pointAt(i, data[i]);
        if (i === 0) shape.moveTo(p.x, p.y);
        else shape.lineTo(p.x, p.y);
      }
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 2,
        curveSegments: 1,
      });
      const mat = new THREE.MeshPhysicalMaterial({
        color,
        transparent: true,
        opacity,
        roughness: 0.35,
        metalness: 0.15,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = zOffset - depth / 2;

      const edgePts = [];
      for (let i = 0; i <= N; i++) edgePts.push(pointAt(i % N, data[i % N]));
      const edgeLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(edgePts),
        new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 })
      );
      edgeLine.position.z = zOffset + depth / 2 + 0.001;

      const grp = new THREE.Group();
      grp.add(mesh);
      grp.add(edgeLine);
      return grp;
    };

    const avgMesh = buildDataMesh(avgData, 0x8b5cf6, 0.55, 0.04, -0.02);
    orbGroup.add(avgMesh);
    const myMesh = buildDataMesh(myData, 0x2563eb, 0.6, 0.06, 0.08);
    orbGroup.add(myMesh);

    // 꼭짓점 (나)
    myData.forEach((v, i) => {
      const p = pointAt(i, v);
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 16, 16),
        new THREE.MeshPhysicalMaterial({
          color: 0xffffff,
          roughness: 0.2,
          metalness: 0.3,
          emissive: 0x2563eb,
          emissiveIntensity: 0.2,
        })
      );
      dot.position.set(p.x, p.y, 0.13);
      orbGroup.add(dot);
    });

    /* ===== Labels (sprite) ===== */
    const makeLabel = (text) => {
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 80;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#1f2937';
      ctx.font = '700 30px -apple-system, "Pretendard", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 160, 40);
      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      const sp = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          depthTest: false,
        })
      );
      sp.scale.set(1.4, 0.35, 1);
      return sp;
    };
    for (let i = 0; i < N; i++) {
      const a = angleAt(i);
      const sp = makeLabel(labels[i]);
      sp.position.set(LABEL_R * Math.cos(a), LABEL_R * Math.sin(a), 0.05);
      sp.renderOrder = 999;
      orbGroup.add(sp);
    }

    /* ========== Interaction (drag rotate) ========== */
    // 기본 정지. 드래그 시 velY/velX 가 채워지고, 손 떼면 0.93 배씩 감쇠해 자연스럽게 멈춤.
    let rotY = 0.0,
      rotX = 0.18,
      velY = 0,
      velX = 0;
    let isDragging = false;
    let lastX = 0,
      lastY = 0,
      lastMoveTime = 0;
    const dom = renderer.domElement;

    const onDown = (e) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTime = performance.now();
      dom.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      if (!isDragging) return;
      const now = performance.now();
      const dt = Math.max(now - lastMoveTime, 1);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      rotY += dx * 0.008;
      rotX += dy * 0.006;
      rotX = Math.max(-0.9, Math.min(0.9, rotX));
      velY = dx * 0.008 * (16 / dt);
      velX = dy * 0.006 * (16 / dt);
      lastX = e.clientX;
      lastY = e.clientY;
      lastMoveTime = now;
    };
    const onUp = (e) => {
      if (!isDragging) return;
      isDragging = false;
      dom.releasePointerCapture?.(e.pointerId);
    };
    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointerup', onUp);
    dom.addEventListener('pointercancel', onUp);
    dom.addEventListener('pointerleave', onUp);

    /* ========== Animate ========== */
    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!isDragging) {
        rotY += velY;
        rotX += velX;
        velY *= 0.93;
        velX *= 0.93;
        rotX = Math.max(-0.9, Math.min(0.9, rotX));
        rotX += (0.18 - rotX) * 0.005;
      }
      orbGroup.rotation.y = rotY;
      orbGroup.rotation.x = rotX;
      renderer.render(scene, camera);
    };
    tick();

    /* ========== Resize ========== */
    const onResize = () => {
      const w = wrap.clientWidth,
        h = wrap.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(wrap);

    /* ========== Cleanup ========== */
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerup', onUp);
      dom.removeEventListener('pointercancel', onUp);
      dom.removeEventListener('pointerleave', onUp);
      renderer.dispose();
      wrap.removeChild(dom);
    };
  }, [axes, webglOK]);

  return (
    <section className="card">
      <div className="flex items-start gap-2 mb-1">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-ink-500 mt-0.5"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
        </svg>
        <div>
          <h2 className="text-[16px] font-bold text-ink-900 leading-tight">
            {title}
          </h2>
          <div className="text-[12px] text-ink-500 mt-1">{sub}</div>
        </div>
      </div>

      {webglOK ? (
        <>
          <div
            ref={wrapRef}
            className="w-full aspect-square relative rounded-lg overflow-hidden mt-4"
            style={{
              background:
                'radial-gradient(ellipse at center, #ffffff 0%, #f9fafb 70%, #f3f4f6 100%)',
              maxWidth: 560,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          />
          <p className="text-center text-[11px] text-ink-400 mt-1.5 tracking-wide">
            ↻ 드래그해서 돌려보세요
          </p>
        </>
      ) : (
        <PeersFallbackChart axes={axes} />
      )}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-ink-150">
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink-700">
          <span
            className="w-3.5 h-3.5 rounded"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
              boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1)',
            }}
          />
          나
        </span>
        <span className="flex items-center gap-2 text-[13px] font-medium text-ink-700">
          <span
            className="w-3.5 h-3.5 rounded"
            style={{
              background: 'linear-gradient(135deg, #c4b5fd, #7c3aed)',
              boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.1)',
            }}
          />
          동기 평균
        </span>
      </div>
    </section>
  );
}

/**
 * WebGL 미지원/실패 시 단순 막대 차트 fallback.
 * 5축 데이터(label/me/peers) 그대로 표시 — 시연 안전망.
 */
function PeersFallbackChart({ axes }) {
  return (
    <div className="mt-4 grid gap-3 px-2 pb-2">
      {axes.map((a) => (
        <div
          key={a.label}
          className="grid grid-cols-[80px_1fr] items-center gap-3"
        >
          <div className="text-[12.5px] font-semibold text-ink-700 truncate">
            {a.label}
          </div>
          <div className="grid gap-1.5">
            <FallbackBar
              label="나"
              value={a.me}
              color="linear-gradient(90deg, #3b82f6, #1e40af)"
            />
            <FallbackBar
              label="동기"
              value={a.peers}
              color="linear-gradient(90deg, #c4b5fd, #7c3aed)"
            />
          </div>
        </div>
      ))}
      <div className="text-center text-[11px] text-ink-400 mt-1 tracking-wide">
        3D 차트를 표시할 수 없어 단순 모드로 보이는 중
      </div>
    </div>
  );
}

function FallbackBar({ label, value, color }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10.5px] text-ink-500 w-7 shrink-0">{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-ink-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${v}%`, background: color }}
        />
      </div>
      <span className="text-[11px] text-ink-700 tabular-nums w-8 text-right shrink-0">
        {v}
      </span>
    </div>
  );
}
