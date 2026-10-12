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
  /** What's on screen, shown in the hero's "now on screen" list. */
  title: string;
  by: string;
  tint: string;
  ink: string;
}

export const heroScreens: HeroScreen[] = [
  {
    img: player,
    alt: "Cassette's player on iPhone, playing Vampire love story by Jardin Public, the screen tinted red by the cover art.",
    title: "vampire love story",
    by: "jardin public",
    tint: "#b8111e",
    ink: "#ffffff",
  },
  {
    img: album,
    alt: "An album page in Cassette on iPhone: Random Access Memories by Daft Punk, with its track list.",
    title: "random access memories",
    by: "daft punk",
    tint: "#8a91a8",
    ink: "#0b0b0c",
  },
  {
    img: playlist,
    alt: "A playlist in Cassette on iPhone, the whole screen tinted pink by its cover.",
    title: "cassette · workout",
    by: "a playlist",
    tint: "#b71b48",
    ink: "#ffffff",
  },
  {
    img: artist,
    alt: "An artist page in Cassette on iPhone: Zed Yun Pavarotti, with his latest release.",
    title: "zed yun pavarotti",
    by: "an artist page",
    tint: "#d6d3dc",
    ink: "#0b0b0c",
  },
];
