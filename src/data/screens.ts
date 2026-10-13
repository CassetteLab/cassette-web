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
  /** Showcase section: what this screen is, and one line about it. */
  name: string;
  line: string;
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
    name: "Now playing",
    line: "The cover sets the color of the whole screen. Lyrics and the queue open without leaving the player.",
  },
  {
    img: album,
    alt: "An album page in Cassette on iPhone: Random Access Memories by Daft Punk, with its track list.",
    title: "Random Access Memories",
    by: "Daft Punk",
    tint: "#8a91a8",
    ink: "#0b0b0c",
    texture: "/models/screens/album.webp",
    name: "Albums",
    line: "Tracks, year and file format at a glance. Play it, shuffle it or download it from the top of the page.",
  },
  {
    img: playlist,
    alt: "A playlist in Cassette on iPhone, the whole screen tinted pink by its cover.",
    title: "Cassette · Workout",
    by: "Playlist",
    tint: "#b71b48",
    ink: "#ffffff",
    texture: "/models/screens/playlist.webp",
    name: "Playlists",
    line: "Edit them in place, add music from anywhere in your library, or let smart shuffle pick.",
  },
  {
    img: artist,
    alt: "An artist page in Cassette on iPhone: Zed Yun Pavarotti, with his latest release.",
    title: "Zed Yun Pavarotti",
    by: "Artist page",
    tint: "#d6d3dc",
    ink: "#0b0b0c",
    texture: "/models/screens/artist.webp",
    name: "Artists",
    line: "Latest release, top tracks and similar artists, on one page.",
  },
];
