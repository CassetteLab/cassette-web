/*
 * The few events components use to talk to each other, in one place.
 *
 *  hero:screen         Hero → 3D phone. The hero switched to screen `index`;
 *                      the 3D phone spins to it.
 *  live-cover:paint    NowPlaying → Hero. The visitor clicked the live pill and
 *                      the page now wears that cover's color; the hero stops
 *                      rotating and unselects its screens.
 *  live-cover:release  Hero → NowPlaying. A screen was picked again; the pill
 *                      is no longer the one painting the page.
 */
import type { Tint } from "./tint";

declare global {
  interface WindowEventMap {
    "hero:screen": CustomEvent<{ index: number }>;
    "live-cover:paint": CustomEvent<Tint>;
    "live-cover:release": Event;
  }
}

type Detail<K extends keyof WindowEventMap> = WindowEventMap[K] extends CustomEvent<infer D> ? D : undefined;

export function emit<K extends keyof WindowEventMap>(name: K, ...detail: Detail<K> extends undefined ? [] : [Detail<K>]) {
  window.dispatchEvent(detail.length ? new CustomEvent(name, { detail: detail[0] }) : new Event(name));
}
