/*
 * The 3D phone: one fixed, click-through canvas over the page.
 *
 * Choreography (all driven by scroll through one scrubbed GSAP timeline):
 *  - hero:      big, low in the frame like the 2D phone it replaces, follows
 *               the hero's screen rotation with a quick spin per change;
 *  - descent:   shrinks into the middle of the viewport while the hero
 *               scrolls away, and turns once onto the first showcase screen;
 *  - showcase:  pinned in the middle; between panels it sidesteps away from
 *               the copy and spins a full turn, swapping the screen while its
 *               back faces the camera, then a glint crosses the glass;
 *  - exit:      leaves upward with the end of the section.
 *
 * Model: "iPhone 17 Pro Max" by MajdyModels (CC BY 4.0), modified
 * (wallpaper removed, materials retuned, compressed). Credited in the footer.
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { heroScreens } from "../data/screens";

gsap.registerPlugin(ScrollTrigger);

const TAU = Math.PI * 2;

/* Everything the timeline animates. Units:
   x, y: fraction of the viewport (0 = centre, +y = down); h: phone height as
   a fraction of viewport height; ry/rx/rz: radians; screen: showcase screen
   index (fractional while spinning; < 0 means "follow the hero"); glint: 0..1 */
const pose = { x: 0, y: 0.13, h: 0.9, ry: -0.18, rx: 0.04, rz: 0, screen: -1, glint: 0 };
/* Additive layers that live outside the scroll timeline. */
const extra = { y: 1.1, ry: 0, glint: 0 };

const SCREEN_FRAG = /* glsl */ `
  uniform sampler2D map;
  uniform float glint;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(map, vUv).rgb;
    // A soft diagonal band of light sweeping across the glass.
    float d = (vUv.x * 0.55 + vUv.y) - (glint * 2.3 - 0.5);
    float band = smoothstep(0.0, 0.07, d) * smoothstep(0.26, 0.07, d);
    c += band * 0.42 * step(0.001, glint) * step(glint, 0.999);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;
const SCREEN_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export async function start() {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  const showcase = document.querySelector<HTMLElement>("[data-showcase]");
  if (!hero || !showcase) throw new Error("hero or showcase missing");

  // ── Renderer ────────────────────────────────────────────────
  const canvas = document.createElement("canvas");
  canvas.className = "phone3d";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.7;
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(3, 4, 5);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  // ── Assets ──────────────────────────────────────────────────
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const texLoader = new THREE.TextureLoader();
  const loadTex = async (url: string) => {
    const t = await texLoader.loadAsync(url);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  const [gltf, ...textures] = await Promise.all([
    loader.loadAsync("/models/iphone.glb"),
    ...heroScreens.map((s) => loadTex(s.texture)),
  ]);

  const screenMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: textures[0] }, glint: { value: 0 } },
    vertexShader: SCREEN_VERT,
    fragmentShader: SCREEN_FRAG,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  const model = gltf.scene;
  model.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const name = mat.name ?? "";
    if (name.startsWith("screen")) {
      // The stock UVs are off; project them from the screen's own face.
      const g = mesh.geometry;
      g.computeBoundingBox();
      const b = g.boundingBox!;
      const p = g.attributes.position;
      const uv = new Float32Array(p.count * 2);
      for (let i = 0; i < p.count; i++) {
        uv[i * 2] = 1 - (p.getY(i) - b.min.y) / (b.max.y - b.min.y);
        uv[i * 2 + 1] = (p.getZ(i) - b.min.z) / (b.max.z - b.min.z);
      }
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      mesh.material = screenMat;
    } else if (name.startsWith("metalframe")) {
      mat.metalness = 1;
      mat.roughness = 0.3;
    } else if (name.startsWith("backpanel") || name.startsWith("basecolor")) {
      mat.metalness = 0.55;
      mat.roughness = 0.42;
    } else if (name.startsWith("glass")) {
      mat.opacity = 0.08;
    }
  });

  // Centre the model, then hang it on a pivot we can turn. The phone's front
  // faces +X in the file, so a base rotation brings the screen to the camera.
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  model.position.sub(box.getCenter(new THREE.Vector3()));
  const base = new THREE.Group();
  base.rotation.y = Math.PI / 2;
  base.add(model);
  const pivot = new THREE.Group();
  pivot.add(base);
  scene.add(pivot);
  const modelHeight = size.y;

  // ── Sizing ──────────────────────────────────────────────────
  let vw = 1, vh = 1, visH = 1, visW = 1;
  const resize = () => {
    vw = window.innerWidth;
    vh = window.innerHeight;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.updateProjectionMatrix();
    visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    visW = visH * camera.aspect;
    dirty = true;
  };

  // ── Screen selection ────────────────────────────────────────
  // Start on whatever the hero is showing now (it may have rotated while
  // Three.js was downloading).
  const pressed = hero.querySelector<HTMLElement>('[data-screen-btn][aria-pressed="true"]');
  let heroIndex = Number(pressed?.dataset.screenBtn ?? 0) || 0;
  let shown = -1;
  const setScreen = (i: number) => {
    if (i === shown) return;
    shown = i;
    screenMat.uniforms.map.value = textures[i];
    dirty = true;
  };

  // ── Render (only when something moved) ──────────────────────
  let dirty = true;
  let last = "";
  const render = () => {
    const y = pose.y + extra.y;
    const ry = pose.ry + extra.ry;
    const glint = Math.max(pose.glint, extra.glint);
    const sig = `${pose.x}|${y}|${pose.h}|${ry}|${pose.rx}|${pose.rz}|${pose.screen}|${glint}|${heroIndex}`;
    if (!dirty && sig === last) return;
    last = sig;
    dirty = false;

    const s = (pose.h * visH) / modelHeight;
    pivot.scale.setScalar(s);
    pivot.position.set(pose.x * visW, -y * visH, 0);
    pivot.rotation.set(pose.rx, ry, pose.rz);

    // < 0: follow the hero. Rounding swaps the texture exactly when the
    // spin has the phone's back to the camera, so the change is never seen.
    setScreen(pose.screen < -0.5 ? heroIndex : Math.min(textures.length - 1, Math.max(0, Math.round(pose.screen))));
    screenMat.uniforms.glint.value = glint;
    renderer.render(scene, camera);
  };

  resize();
  window.addEventListener("resize", resize);
  gsap.ticker.add(render);

  // Hide the canvas once the phone has left, so it never sits over later sections.
  ScrollTrigger.create({
    trigger: showcase,
    start: "bottom top",
    onEnter: () => (canvas.style.visibility = "hidden"),
    onLeaveBack: () => (canvas.style.visibility = "visible"),
  });

  // ── Intro: rise from below the fold ─────────────────────────
  gsap.to(extra, { y: 0, duration: 1.7, ease: "expo.out", delay: 0.15 });

  // ── Hero: a quick spin each time the hero changes screen ────
  let spin: gsap.core.Tween | null = null;
  window.addEventListener("hero:screen", (e) => {
    const next = (e as CustomEvent<{ index: number }>).detail.index;
    if (pose.screen >= -0.5) {
      heroIndex = next; // phone is past the hero, nothing to show
      return;
    }
    spin?.progress(1);
    extra.ry = 0;
    let swapped = false;
    spin = gsap.to(extra, {
      ry: TAU,
      duration: 1.1,
      ease: "power3.inOut",
      onUpdate() {
        if (!swapped && this.progress() >= 0.5) {
          swapped = true;
          heroIndex = next;
        }
      },
      onComplete: () => {
        extra.ry = 0;
        gsap.fromTo(extra, { glint: 0.001 }, { glint: 0.999, duration: 0.9, ease: "power2.inOut", onComplete: () => void (extra.glint = 0) });
      },
    });
  });

  // ── Scroll choreography ─────────────────────────────────────
  const panels = [...showcase.querySelectorAll<HTMLElement>("[data-sc-panel]")];
  const side = (i: number) => (panels[i]?.classList.contains("is-right") ? -1 : 1); // phone opposite the copy

  // 1. Descent: through the hero, into the middle, one turn onto screen 0.
  gsap.timeline({
    scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
    defaults: { ease: "none" },
  })
    .to(pose, { y: 0, h: 0.74, rx: 0, ease: "power1.inOut" }, 0)
    // Sideways only once the hero copy is mostly gone, so the phone never
    // crosses the "In the app" list.
    .to(pose, { x: 0.2 * side(0), ease: "power2.inOut", duration: 0.3 }, 0.55)
    .fromTo(pose, { ry: -0.18 }, { ry: -0.18 - TAU, ease: "power2.inOut" }, 0.15)
    .fromTo(pose, { screen: -1 }, { screen: 0, ease: "power2.inOut", immediateRender: false }, 0.15)
    .to(pose, { ry: -TAU - 0.12, duration: 0.1 }, ">");

  // 2. Showcase: between consecutive panels, sidestep + full turn + glint.
  // Timeline time == panel index (0..n-1), so snapping to multiples of
  // 1/(n-1) of the scroll lands each panel dead centre, transition finished.
  const steps = Math.max(1, panels.length - 1);
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: showcase,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      snap: {
        snapTo: 1 / steps,
        directional: true, // a nudge down goes to the next screen, not back
        duration: { min: 0.35, max: 0.9 },
        delay: 0.08,
        ease: "power2.inOut",
      },
    },
    defaults: { ease: "power2.inOut" },
  });
  for (let i = 1; i < panels.length; i++) {
    const at = i - 1;
    tl.to(pose, { x: 0.2 * side(i), duration: 0.6 }, at + 0.2)
      .to(pose, { ry: `-=${TAU}`, duration: 0.6 }, at + 0.2)
      .to(pose, { screen: i, duration: 0.6 }, at + 0.2)
      .fromTo(pose, { glint: 0.001 }, { glint: 0.999, duration: 0.25, ease: "none", immediateRender: false }, at + 0.72)
      .set(pose, { glint: 0 }, at + 0.98);
  }
  // Pad to exactly n-1 so time and scroll progress line up for the snap.
  if (tl.duration() < steps) tl.to({}, { duration: steps - tl.duration() }, tl.duration());

  // 3. Exit: up and away with the end of the section.
  gsap.timeline({
    scrollTrigger: { trigger: showcase, start: "bottom bottom", end: "bottom top", scrub: 0.6 },
    defaults: { ease: "power1.in" },
  }).to(pose, { y: -0.9, rx: -0.25 }, 0);

  ScrollTrigger.refresh();
}
