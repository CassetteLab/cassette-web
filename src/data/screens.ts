import type { ImageMetadata } from "astro";

import player from "../assets/screens/iphone-player.png";
import album from "../assets/screens/iphone-album.png";
import playlist from "../assets/screens/iphone-playlist.png";
import artist from "../assets/screens/iphone-artist.png";

/**
 * The hero rotation. Each entry is a real screenshot of the app, plus the
 * color Cassette pulls out of it. `tint` is the screen's dominant color,
 * `ink` is whichever of black/white reads best on top of it (WCAG).
 * Add a screen: drop the PNG in src/assets/screens, import it, add a line.
 */
export interface HeroScreen {
  img: ImageMetadata;
  alt: string;
  /** What's on screen, shown in the hero's "In the app" list. */
  title: string;
  by: string;
  tint: string;
  ink: string;
  /** Screen texture for the 3D phone (public/models/screens). */
  texture: string;
  /** Showcase section: the argument this screen carries, a line about it,
      and a few short spec tags. */
  name: string;
  line: string;
  points: string[];
}

export const heroScreens: HeroScreen[] = [
  {
    img: player,
    alt: "Cassette's player on iPhone, playing Vampire love story by Jardin Public, the screen tinted red by the cover art.",
    title: "Vampire love story",
    by: "Jardin Public",
    tint: "#b8111e",
    ink: "#ffffff",
    texture: "/models/screens/player.webp",
    name: "Native",
    line: "Swift and SwiftUI from top to bottom. It scrolls, animates and plays like the apps that came with your iPhone, Liquid Glass included.",
    points: ["Swift 6", "SwiftUI", "No web view"],
  },
  {
    img: album,
    alt: "An album page in Cassette on iPhone: Random Access Memories by Daft Punk, with its track list.",
    title: "Random Access Memories",
    by: "Daft Punk",
    tint: "#8a91a8",
    ink: "#0b0b0c",
    texture: "/models/screens/album.webp",
    name: "Self-hosted",
    line: "Talks to Navidrome, Gonic, Ampache or any OpenSubsonic server through SwiftSonic, its own open-source client library. A reverse proxy or Cloudflare Access in front is fine.",
    points: ["OpenSubsonic", "Custom headers", "Keychain"],
  },
  {
    img: playlist,
    alt: "A playlist in Cassette on iPhone, the whole screen tinted pink by its cover.",
    title: "Cassette · Workout",
    by: "Playlist",
    tint: "#b71b48",
    ink: "#ffffff",
    texture: "/models/screens/playlist.webp",
    name: "Integrated",
    line: "Lock screen, Control Center and AirPlay all work. Your own server behaves like Apple Music, without the subscription.",
    points: ["Now Playing", "AirPlay", "ListenBrainz"],
  },
  {
    img: artist,
    alt: "An artist page in Cassette on iPhone: Zed Yun Pavarotti, with his latest release.",
    title: "Zed Yun Pavarotti",
    by: "Artist page",
    tint: "#d6d3dc",
    ink: "#0b0b0c",
    texture: "/models/screens/artist.webp",
    name: "Free",
    line: "Open source under MPL-2.0, with nothing to sign up for. No ads and no analytics. It is funded by the people who use it.",
    points: ["MPL-2.0", "No account", "No tracking"],
  },
];
