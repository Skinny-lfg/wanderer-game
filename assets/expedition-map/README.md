# Expedition map artwork

Each Affinity uses its supplied map artwork in both Realms. Backgrounds are selected in `online/v013-stage45-map-qa.css`, using URLs relative to the stylesheet so they also work when the game is hosted in a subdirectory. Mirror runtime assets to `docs/assets/expedition-map/`.

The original PNGs are retained as source artwork. The game loads resized WebP backgrounds and WebP cloud textures with affinity highlights precomputed from the two supplied fog PNGs. This reduces transfer size and avoids animated SVG color filters. The fog mask follows actual map coordinates; it does not change map generation or saves. Motion is disabled for `prefers-reduced-motion`.
