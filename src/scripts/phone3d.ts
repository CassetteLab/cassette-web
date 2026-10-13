/*
 * Entry point for the 3D phone. Tiny on purpose: the head of the page has
 * already decided whether this device gets the 3D version (html[data-3d]),
 * and only then is Three.js downloaded. If anything fails, the attribute is
 * removed and the 2D phone comes back.
 */
const root = document.documentElement;

if (root.hasAttribute("data-3d")) {
  import("./phone3d-scene")
    .then((m) => m.start())
    .catch((err) => {
      console.warn("[phone3d] falling back to 2D:", err);
      root.removeAttribute("data-3d");
    });
}
