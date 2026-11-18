# Expedition map artwork slots

Each Affinity uses its supplied map image in both of its Realms. The generated gradient remains a fallback for an unknown Affinity. These are background illustrations; the interactive routes are generated separately. The map exposes two optional CSS image slots:

- `--realm-map-art`: background artwork, behind the dark readability overlay.
- `--realm-map-overlay`: transparent decoration above the readability overlay and below map paths and nodes.

Use `[data-realm-map="temple"]` or `[data-map-affinity="decay"]` to target a specific Realm or Affinity in `online/v013-stage45-map-qa.css`. Example URLs in CSS are resolved relative to that stylesheet, e.g. `url('../assets/expedition-map/venomreach.png')`. Add and mirror actual files to `docs/assets/expedition-map/` when ready. No placeholder file requests are made while these properties are unset.

Use a low-detail background with a quiet center. Place important decorative details around the edges; artwork is cropped with `cover` on different screens. Keep overlays transparent and avoid covering paths and labels. PNG is suitable for transparent overlays; optimized WebP is an option for opaque backgrounds. Preview at mobile and desktop sizes before shipping.

Fog of War uses the supplied `fog-dense.png` and `fog-dispersed.png` unchanged (RGBA). The mask is derived from the rendered map positions and the currently visible, visited and cleared nodes; it does not modify the generated map or save data. Drift is disabled for `prefers-reduced-motion`.
