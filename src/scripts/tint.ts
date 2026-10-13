/*
 * The page color. Everything that recolors the site goes through setTint:
 * the hero rotation, the showcase panels, the live cover (NowPlaying) and the
 * 404 page. CSS reads the result from two registered custom properties on
 * <html> (see global.css): --tint (background color of the moment) and --ink
 * (black or white, whichever reads best on it).
 */
export interface Tint {
  tint: string;
  ink: string;
}

export function setTint({ tint, ink }: Tint) {
  const root = document.documentElement;
  root.style.setProperty("--tint", tint);
  root.style.setProperty("--ink", ink);
  // Browser chrome on phones follows along.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tint);
}

/* Black or white, whichever has more contrast on an sRGB color (WCAG). */
export function inkFor(r: number, g: number, b: number): string {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return (L + 0.05) / 0.05 > 1.05 / (L + 0.05) ? "#0b0b0c" : "#ffffff";
}
