/*
 * Hero rotation: cycles through the app screenshots, recolors the page with
 * each one, and keeps the "In the app" list in sync.
 *
 * - The active list item's progress bar is the clock: when its CSS fill
 *   animation ends, the next screen comes in.
 * - Hovering the phone or the list pauses it (the bar's animation pauses).
 * - It only runs while the hero is on screen, and not at all with reduced
 *   motion (the first screen just stays).
 * - Screens change with a bottom-up wipe (CSS, see Hero.astro).
 */
import { emit } from "./events";
import { setTint } from "./tint";

const DWELL = 5200; // ms per screen

export function initHero() {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero || hero.dataset.bound) return;
  hero.dataset.bound = "true";

  const imgs = [...hero.querySelectorAll<HTMLImageElement>("[data-screen]")];
  const btns = [...hero.querySelectorAll<HTMLButtonElement>("[data-screen-btn]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let current = 0;
  let playing = false;
  let visible = false;
  let held = false; // the live cover is painting the page

  hero.style.setProperty("--dwell", `${DWELL}ms`);

  const restartBar = () => {
    hero.removeAttribute("data-playing");
    void hero.offsetWidth; // reflow so the fill animation restarts
    if (playing) hero.setAttribute("data-playing", "");
  };

  const wipeIn = (prev: number, next: number) => {
    const incoming = imgs[next];
    imgs[prev].classList.add("is-leaving");
    void incoming.offsetWidth; // restart the animation if re-entered quickly
    incoming.classList.add("is-entering");
    incoming.addEventListener(
      "animationend",
      () => {
        incoming.classList.remove("is-entering");
        imgs[prev].classList.remove("is-leaving");
      },
      { once: true },
    );
  };

  const show = (i: number) => {
    const next = (i + imgs.length) % imgs.length;
    const prev = current;
    current = next;

    imgs.forEach((img, k) => {
      img.classList.remove("is-leaving", "is-entering");
      img.classList.toggle("is-active", k === next);
      // aria-hidden needs the literal "true" (an empty value doesn't hide).
      if (k === next) img.removeAttribute("aria-hidden");
      else img.setAttribute("aria-hidden", "true");
    });
    if (prev !== next) wipeIn(prev, next);

    btns.forEach((b, k) => b.setAttribute("aria-pressed", String(k === next)));
    const { tint = "#0b0b0c", ink = "#ffffff" } = btns[next].dataset;
    setTint({ tint, ink });
    if (prev !== next) emit("hero:screen", { index: next });
    restartBar();
  };

  const setPlaying = (on: boolean) => {
    visible = on;
    playing = on && !held && !reduceMotion;
    restartBar();
  };

  // The progress bar is the clock.
  hero.addEventListener("animationend", (e) => {
    if (playing && e.animationName.includes("deck-fill")) show(current + 1);
  });

  btns.forEach((b, k) =>
    b.addEventListener("click", () => {
      if (held) {
        held = false;
        emit("live-cover:release");
        setPlaying(visible);
      }
      show(k);
    }),
  );

  // The live cover took over the color: stop rotating until a screen is picked.
  window.addEventListener("live-cover:paint", () => {
    held = true;
    setPlaying(visible);
    btns.forEach((b) => b.setAttribute("aria-pressed", "false"));
  });

  [hero.querySelector("[data-hero-phone]"), hero.querySelector("[data-hero-deck]")].forEach((el) => {
    el?.addEventListener("pointerenter", () => hero.setAttribute("data-paused", ""));
    el?.addEventListener("pointerleave", () => hero.removeAttribute("data-paused"));
  });

  // Cycle only while the hero is on screen; the last color stays on the page.
  new IntersectionObserver(([entry]) => setPlaying(entry.isIntersecting), { threshold: 0.25 }).observe(hero);

  show(0);
}
