/*
 * Smooth (inertial) wheel scrolling with Lenis.
 *
 * - Only the mouse wheel / trackpad is smoothed; touch keeps the platform's
 *   native momentum, and the page still scrolls natively (position: fixed,
 *   sticky, scroll-snap carousels and ScrollTrigger pins behave as usual).
 * - Lenis is driven by the GSAP ticker and reports every frame to
 *   ScrollTrigger, so scrubbed timelines and the 3D phone stay in lockstep.
 * - Same-page anchor links (#install, /#faq…) glide instead of jumping. Lenis'
 *   own `anchors` option lets the browser's jump happen first and then
 *   fights it, so links are handled here.
 * - Started from motion.ts inside the no-reduced-motion media query, so it is
 *   torn down if the visitor turns reduced motion on.
 */
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const easeInOutQuart = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

export function smoothScroll() {
  const lenis = new Lenis({
    autoRaf: false,
    lerp: 0.1,
    wheelMultiplier: 1,
  });

  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  // Lenis computes its own deltas; GSAP's lag smoothing would make it stutter.
  gsap.ticker.lagSmoothing(0);

  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href*='#']") : null;
    if (!link || (link.target && link.target !== "_self")) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.hash.length < 2) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;

    e.preventDefault();
    if (url.hash !== location.hash) history.pushState(null, "", url.hash);
    lenis.scrollTo(target, { duration: 1.4, easing: easeInOutQuart });
    // Like a native jump: the next Tab starts from the section.
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };
  document.addEventListener("click", onClick);

  return () => {
    document.removeEventListener("click", onClick);
    gsap.ticker.remove(tick);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.destroy();
  };
}
