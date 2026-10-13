# getcassette.app

The website of [Cassette](https://github.com/CassetteLab/cassette), a native iPhone and Mac app for the music on your own Subsonic / OpenSubsonic server (Navidrome and friends).

Live at **https://getcassette.app**.

## Stack

- [Astro 6](https://astro.build), static output, strict TypeScript
- [Tailwind CSS 4](https://tailwindcss.com) for the theme tokens; components carry their own scoped styles
- [GSAP](https://gsap.com) (ScrollTrigger, SplitText) for motion
- [Three.js](https://threejs.org) for the 3D iPhone, desktop only and loaded on demand
- Self-hosted fonts through Fontsource: Anton (display), Geist (text), JetBrains Mono (labels). No third-party requests apart from the live now-playing pill.

## Develop

Requires Node ≥ 22.12 and pnpm (the version is pinned in `package.json`).

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm check      # astro check (types, templates)
pnpm build      # static site in dist/
pnpm preview    # serve dist/
```

In dev, `/api/now-playing` and `/api/cover-art` are proxied to `mathieu-dubart.fr`, so the live pill works locally. Point it elsewhere with `NOW_PLAYING_ORIGIN=http://localhost:4533 pnpm dev`.

## Deploy

- **Pull requests** run `.github/workflows/ci.yml`: `pnpm check` and `pnpm build`.
- **Pushes to `main`** run `.github/workflows/deploy.yml`, which builds and publishes to GitHub Pages (Settings → Pages → Source must be "GitHub Actions"). The custom domain is configured in the repository's Pages settings.

## How the site works

### Structure

```
src/
├── pages/            index, contact, privacy, terms, 404
├── layouts/          Layout.astro: <head>, SEO, JSON-LD, the motion and 3D flags
├── components/       one file per section, plus Button, RollLabel, LegalPage, NowPlaying
├── data/screens.ts   the four app screens: screenshot, color, showcase copy, 3D texture
├── scripts/
│   ├── tint.ts         the page color (the only code that sets it)
│   ├── events.ts       the events components send each other
│   ├── hero.ts         hero screen rotation
│   ├── motion.ts       GSAP: hero intro, scroll reveals, Mac gallery, button magnetism
│   ├── phone3d.ts      loads the 3D scene when the page is flagged for it (html[data-3d])
│   └── phone3d-scene.ts  the 3D iPhone and its scroll choreography
└── styles/global.css theme tokens, the tint, button hover effects
public/models/        iphone.glb (compressed) and the screen textures
```

### The tint

The site takes the color of what's on screen, like the app does with cover art. `--tint` (the color) and `--ink` (black or white on top of it) are registered custom properties on `<html>`, so they animate. Only `setTint()` in `scripts/tint.ts` changes them; it is called by the hero rotation, the showcase panels, the live pill and the 404 page. Each screen's color lives in `data/screens.ts`.

### Motion

Scroll animations are declared in the markup and run by `motion.ts`:

| Attribute | Effect |
| --- | --- |
| `data-reveal="chars"` | letters rise out of their masks (display type) |
| `data-reveal="lines"` | lines rise out of their masks |
| `data-reveal="up"` | fades up |
| `data-reveal="count"` | counts up to the number it shows |
| `data-reveal-group` | on a container: shared trigger, `up` children staggered |
| `data-reveal-start` / `-delay` / `-stagger` | trigger start, delay and stagger in seconds |

Nothing animates with `prefers-reduced-motion`; everything is visible without JavaScript. Buttons: `Button.astro` (`solid` rolls its label, `line` fills from the pointer); `data-magnet` tunes the magnetic pull.

### The 3D iPhone

On wide screens with WebGL2 and motion allowed, an inline script in `Layout.astro` sets `html[data-3d]` before first paint. Only then is the Three.js chunk downloaded (`phone3d.ts` → `phone3d-scene.ts`). A fixed, click-through canvas replaces the hero phone, follows the hero's rotation, then scrolls into the showcase section where it spins between panels (the texture swaps while its back faces the camera) and snaps one panel at a time. Phones, reduced motion and no WebGL keep the 2D site and never download Three.js.

To swap the model: the GLB must have a separate screen mesh whose material name starts with `screen`; its UVs are recomputed from its shape. Compress with [glTF Transform](https://gltf-transform.dev) (meshopt).

### Live now-playing pill

`NowPlaying.astro` polls `mathieu-dubart.fr/api/now-playing` every 10 s and shows the track when one is playing. That endpoint is an nginx proxy in front of Navidrome which holds the credentials server-side and allows this origin through CORS (see the portfolio repository). No credentials ever reach this repository or the browser. Clicking the pill recolors the page with the cover's dominant color.

### Editing content

- App screens, their colors and the showcase arguments: `src/data/screens.ts` (screenshots in `src/assets/screens/`, 3D textures in `public/models/screens/`)
- Figures (testers, stars): `src/components/Proof.astro`, rounded and updated by hand
- Feature list: `src/components/Tracklist.astro`
- FAQ (also feeds the FAQ structured data): `src/components/Faq.astro`
- Share card: `public/og-card.png`; bump `OG_VERSION` in `Layout.astro` when it changes

## Credits

- 3D model: [“iPhone 17 Pro Max”](https://sketchfab.com/3d-models/iphone-17-pro-max-87fc1df741384124a8ce0226d2b2058d) by [MajdyModels](https://sketchfab.com/MG990), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), modified (wallpaper removed, materials retuned, compressed). Also credited in the site footer.

## License

The site's code is released under MPL-2.0, like the app. The Cassette name, logo, screenshots and copy are not covered by that license.
