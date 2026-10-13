/*
 * Motion layer (GSAP + ScrollTrigger + SplitText).
 *
 * Purely an enhancement:
 * - Nothing runs when the visitor asked for reduced motion; the page is
 *   already complete without it.
 * - Hero pieces start hidden only when <html> carries .js-motion (set inline
 *   in the head, with a safety timeout), so a failed script never leaves the
 *   hero blank.
 * - Smooth wheel scrolling (smooth-scroll.ts) starts here too.
 * - Every split and tween lives inside gsap.matchMedia, so it is reverted
 *   cleanly if the motion preference changes.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { smoothScroll } from "./smooth-scroll";

gsap.registerPlugin(ScrollTrigger, SplitText);

const EASE = "expo.out";
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  [...root.querySelectorAll<T>(sel)];

/*
 * Splits are one-shot: text is split once (after webfonts, see the bottom of
 * the file), animated, then put back to its original markup on complete, so
 * a later resize or copy-paste only ever sees the real text.
 */

/* Letters rising out of their own mask: the house move for display type. */
const riseChars = (el: Element, vars: gsap.TweenVars = {}) => {
  const split = SplitText.create(el, { type: "chars", mask: "chars", aria: "none" });
  // Display type has a line-height well under 1, so a mask the size of the
  // line box would crop the glyphs. Grow the masks without moving anything.
  gsap.set(split.masks, { paddingBlock: "0.2em", marginBlock: "-0.2em" });
  return gsap.from(split.chars, {
    yPercent: 110,
    duration: 1.1,
    ease: EASE,
    stagger: 0.035,
    ...vars,
    onComplete: () => split.revert(),
  });
};

/* Lines of running text sliding up from under a mask. */
const riseLines = (el: Element, vars: gsap.TweenVars = {}) => {
  const split = SplitText.create(el, { type: "lines", mask: "lines" });
  gsap.set(split.masks, { paddingBottom: "0.12em", marginBottom: "-0.12em" });
  return gsap.from(split.lines, {
    yPercent: 105,
    duration: 1,
    ease: EASE,
    stagger: 0.08,
    ...vars,
    onComplete: () => split.revert(),
  });
};

const onEnter = (trigger: Element, start = "top 82%") => ({
  trigger,
  start,
  once: true,
});

function heroIntro() {
  const hero = $("[data-hero]");
  if (!hero) return;
  const word = $("[data-hero-word]", hero);
  const phone = $("[data-phone-motion]", hero);
  const parallax = $("[data-phone-parallax]", hero);
  const deck = $("[data-hero-deck]", hero);

  // Reveal the containers; their contents are animated from hidden states below.
  gsap.set("[data-intro]", { autoAlpha: 1 });

  const tl = gsap.timeline({ defaults: { ease: EASE } });

  if (word) {
    tl.add(riseChars(word, { yPercent: 115, duration: 1.3, stagger: { each: 0.045, from: "center" } }), 0);
  }

  if (phone) {
    // Rises from below the fold, fully opaque: no fade over the letters.
    tl.from(phone, { yPercent: 75, scale: 0.94, duration: 1.7, ease: "expo.out" }, 0.15);
  }

  const lede = $("[data-hero-lede]", hero);
  if (lede) tl.add(riseLines(lede, { stagger: 0.09 }), 0.55);
  const rest = $$("[data-hero-step]", hero).filter((el) => !el.hidden);
  if (rest.length) tl.from(rest, { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.07 }, 0.8);

  if (deck) {
    tl.from($$("[data-hero-deck-step]", deck), { x: 24, autoAlpha: 0, duration: 0.9, stagger: 0.06 }, 0.85);
  }

  // Scroll: a light parallax, the word drifts down a touch while the phone lifts.
  const scroll = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
  if (word) gsap.fromTo(word, { yPercent: 0 }, { yPercent: 8, ease: "none", immediateRender: false, scrollTrigger: scroll });
  // On its own wrapper, not the one the intro moves: otherwise this tween
  // records the intro's start offset and snaps the phone down on first scroll.
  if (parallax) gsap.fromTo(parallax, { yPercent: 0 }, { yPercent: -4, ease: "none", immediateRender: false, scrollTrigger: { ...scroll } });
}

/*
 * Scroll reveals, declared in the markup:
 *
 *   data-reveal="chars"   letters rise out of their masks (display type)
 *   data-reveal="lines"   lines rise out of their masks (running text)
 *   data-reveal="up"      fades up a little
 *   data-reveal="count"   counts up to the number it shows ("1,300+")
 *
 *   data-reveal-group     on a container: its revealed children share one
 *                         trigger, and "up" children are staggered in order
 *   data-reveal-start     ScrollTrigger start for that trigger ("top 85%")
 *   data-reveal-delay     extra delay in seconds
 *   data-reveal-stagger   per-letter / per-line stagger in seconds
 *
 * Renaming a CSS class never breaks an animation this way.
 */
function reveals() {
  const upIndex = new Map<Element, number>();

  $$("[data-reveal]").forEach((el) => {
    const group = el.closest("[data-reveal-group]") ?? el;
    const start = (group as HTMLElement).dataset.revealStart ?? "top 85%";
    const st = onEnter(group, start);
    const delay = Number(el.dataset.revealDelay ?? 0);
    const stagger = el.dataset.revealStagger ? Number(el.dataset.revealStagger) : undefined;

    switch (el.dataset.reveal) {
      case "chars":
        riseChars(el, { delay, scrollTrigger: st, ...(stagger !== undefined && { stagger }) });
        break;
      case "lines":
        riseLines(el, { delay, scrollTrigger: st, ...(stagger !== undefined && { stagger }) });
        break;
      case "up": {
        const i = upIndex.get(group) ?? 0;
        upIndex.set(group, i + 1);
        gsap.from(el, { y: 20, autoAlpha: 0, duration: 0.9, ease: EASE, delay: delay + i * 0.07, scrollTrigger: st });
        break;
      }
      case "count": {
        const raw = el.textContent ?? "";
        const target = Number(raw.replace(/[^\d]/g, ""));
        if (!target) break;
        const suffix = raw.replace(/[\d,.\s]/g, "");
        const counter = { n: 0 };
        gsap.to(counter, {
          n: target,
          duration: 1.8,
          ease: "power3.out",
          delay,
          scrollTrigger: st,
          onUpdate: () => {
            el.textContent = `${Math.round(counter.n).toLocaleString("en-US")}${suffix}`;
          },
        });
        break;
      }
    }
  });
}

/* Mac section, desktop: pin it and slide the screenshots through the window,
   one pixel of scroll per pixel of track. */
function macGallery() {
  const stage = $("[data-mac-stage]");
  const win = $("[data-mac-window]");
  const track = $("[data-mac-track]");
  if (!stage || !win || !track) return;

  gsap.matchMedia().add("(min-width: 900px)", () => {
    const distance = () => Math.max(0, track.scrollWidth - win.clientWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
  });
}

/* The install block wipes open from a rounded card to full bleed. */
function installWipe() {
  const section = $("[data-install]");
  if (!section) return;
  gsap.fromTo(
    section,
    { clipPath: "inset(6% 4% 6% 4% round 28px)" },
    { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: section, start: "top 95%", end: "top 30%", scrub: true } },
  );
}

/*
 * Juice for buttons: they lean toward the pointer (magnetic), spring back
 * with a little overshoot, and give under a press. Fine pointers only, so
 * touch screens never get a button stuck mid-lean.
 */
function buttons() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  $$(".fx-roll, .fx-fill").forEach((btn) => {
    const toX = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
    const toY = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
    const pull = Number(btn.dataset.magnet ?? 0.22); // data-magnet tunes the pull

    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      toX((e.clientX - (r.left + r.width / 2)) * pull);
      toY((e.clientY - (r.top + r.height / 2)) * pull * 1.2);
    });
    btn.addEventListener("pointerleave", () => {
      gsap.to(btn, { x: 0, y: 0, scale: 1, duration: 0.9, ease: "elastic.out(1, 0.35)", overwrite: "auto" });
    });
    btn.addEventListener("pointerdown", () => {
      gsap.to(btn, { scale: 0.94, duration: 0.15, ease: "power2.out" });
    });
    btn.addEventListener("pointerup", () => {
      gsap.to(btn, { scale: 1, duration: 0.6, ease: "elastic.out(1.1, 0.4)" });
    });
  });
}

const start = () => {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const stopSmoothScroll = smoothScroll();
    heroIntro();
    reveals();
    macGallery();
    installWipe();
    buttons();
    return stopSmoothScroll;
  });
  // Reduced motion: make sure nothing stays hidden.
  mm.add("(prefers-reduced-motion: reduce)", () => {
    document.documentElement.classList.remove("js-motion");
  });
  // Lazy images change the page height: re-measure trigger positions.
  window.addEventListener("load", () => ScrollTrigger.refresh());
};

// Split only once the webfonts are in, or lines and letters would be measured
// with the fallback font. Fonts are self-hosted, so this is a few ms.
(document.fonts ? document.fonts.ready : Promise.resolve()).then(start, start);
