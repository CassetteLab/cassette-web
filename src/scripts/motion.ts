/*
 * Motion layer (GSAP + ScrollTrigger + SplitText).
 *
 * Purely an enhancement:
 * - Nothing runs when the visitor asked for reduced motion; the page is
 *   already complete without it.
 * - Hero pieces start hidden only when <html> carries .js-motion (set inline
 *   in the head, with a safety timeout), so a failed script never leaves the
 *   hero blank.
 * - Every split and tween lives inside gsap.matchMedia, so it is reverted
 *   cleanly if the motion preference changes.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

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
  const intro = $(".hero-intro", hero);
  const deck = $("[data-hero-deck]", hero);

  // Reveal the containers; their contents are animated from hidden states below.
  gsap.set("[data-intro]", { autoAlpha: 1 });

  const tl = gsap.timeline({ defaults: { ease: EASE } });

  if (word) {
    tl.add(riseChars(word, { yPercent: 115, duration: 1.3, stagger: { each: 0.045, from: "center" } }), 0);
  }

  if (phone) {
    tl.from(phone, { yPercent: 38, rotate: 6, autoAlpha: 0, duration: 1.4 }, 0.25);
  }

  if (intro) {
    const lede = $(".hero-lede", intro);
    const rest = $$(".hero-sub, .hero-cta > *, .np:not([hidden])", intro);
    if (lede) tl.add(riseLines(lede, { stagger: 0.09 }), 0.55);
    if (rest.length) tl.from(rest, { y: 18, autoAlpha: 0, duration: 0.9, stagger: 0.07 }, 0.8);
  }

  if (deck) {
    tl.from($$(".deck-label, .deck-list li", deck), { x: 24, autoAlpha: 0, duration: 0.9, stagger: 0.06 }, 0.85);
  }

  // Scroll: a light parallax, the word drifts down a touch while the phone lifts.
  const scroll = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
  if (word) gsap.fromTo(word, { yPercent: 0 }, { yPercent: 8, ease: "none", immediateRender: false, scrollTrigger: scroll });
  // On its own wrapper, not the one the intro moves: otherwise this tween
  // records the intro's start offset and snaps the phone down on first scroll.
  if (parallax) gsap.fromTo(parallax, { yPercent: 0 }, { yPercent: -4, ease: "none", immediateRender: false, scrollTrigger: { ...scroll } });
}

function proof() {
  // Numbers count up when they come into view ("1,300+" keeps its comma and suffix).
  $$(".stat").forEach((stat, i) => {
    const value = $(".stat-value", stat);
    if (!value) return;
    const raw = value.textContent ?? "";
    const target = Number(raw.replace(/[^\d]/g, ""));
    const suffix = raw.replace(/[\d,.\s]/g, "");
    const counter = { n: 0 };
    gsap.from(stat, { y: 40, autoAlpha: 0, duration: 1, ease: EASE, delay: i * 0.08, scrollTrigger: onEnter(stat) });
    if (!target) return;
    gsap.to(counter, {
      n: target,
      duration: 1.8,
      ease: "power3.out",
      delay: i * 0.08,
      scrollTrigger: onEnter(stat),
      onUpdate: () => {
        value.textContent = `${Math.round(counter.n).toLocaleString("en-US")}${suffix}`;
      },
    });
  });

  $$(".quote").forEach((q) => {
    const text = $("blockquote p", q);
    const by = $(".quote-by", q);
    const st = onEnter(q, "top 85%");
    if (text) riseLines(text, { scrollTrigger: st });
    if (by) gsap.from(by, { autoAlpha: 0, y: 10, duration: 0.8, delay: 0.35, ease: EASE, scrollTrigger: st });
  });
}

function tracklist() {
  $$(".tl-row").forEach((row) => {
    const st = onEnter(row, "top 88%");
    const name = $(".tl-name", row);
    if (name) riseChars(name, { stagger: 0.025, scrollTrigger: st });
    const meta = $$(".tl-num, .tl-body", row);
    if (meta.length) gsap.from(meta, { autoAlpha: 0, y: 16, duration: 0.9, ease: EASE, delay: 0.15, scrollTrigger: st });
  });
}

function mac() {
  const title = $(".mac-title");
  if (title) riseChars(title, { stagger: 0.03, scrollTrigger: onEnter(title) });
  const shot = $(".mac-hero");
  if (shot) {
    // The Mac grows into place as you scroll toward it.
    gsap.fromTo(
      shot,
      { scale: 0.86, yPercent: 6, autoAlpha: 0.4 },
      { scale: 1, yPercent: 0, autoAlpha: 1, ease: "none", scrollTrigger: { trigger: shot, start: "top 95%", end: "top 35%", scrub: true } },
    );
  }
  const row = $(".mac-row");
  if (row) gsap.from($$("li", row), { y: 60, autoAlpha: 0, duration: 1, ease: EASE, stagger: 0.1, scrollTrigger: onEnter(row, "top 90%") });
}

function install() {
  const section = $("#install");
  if (!section) return;
  // The color block wipes open from a rounded card to full bleed.
  gsap.fromTo(
    section,
    { clipPath: "inset(6% 4% 6% 4% round 28px)" },
    { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none", scrollTrigger: { trigger: section, start: "top 95%", end: "top 30%", scrub: true } },
  );
  $$(".platform", section).forEach((p, i) => {
    const st = onEnter(p, "top 80%");
    const name = $(".platform-name", p);
    if (name) riseChars(name, { delay: i * 0.12, scrollTrigger: st });
    const parts = $$(".platform-body, .install-btn, .term", p);
    if (parts.length) gsap.from(parts, {
      y: 24, autoAlpha: 0, duration: 0.9, ease: EASE, stagger: 0.08, delay: 0.25 + i * 0.12, scrollTrigger: st,
    });
  });
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
    const pull = btn.classList.contains("term-copy") ? 0.15 : 0.22;

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

function footer() {
  const word = $(".footer-word");
  if (word) riseChars(word, { duration: 1.3, stagger: 0.05, scrollTrigger: onEnter(word, "top 92%") });
}

function notFound() {
  const code = $(".nf-code > span[aria-hidden]");
  if (!code) return;
  riseChars(code, { duration: 1.3, stagger: 0.08, delay: 0.1 });
  gsap.from($$(".nf-copy > *, .nf-label"), { y: 20, autoAlpha: 0, duration: 0.9, ease: EASE, stagger: 0.08, delay: 0.5 });
}

const start = () => {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    heroIntro();
    proof();
    tracklist();
    mac();
    install();
    footer();
    notFound();
    buttons();
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
