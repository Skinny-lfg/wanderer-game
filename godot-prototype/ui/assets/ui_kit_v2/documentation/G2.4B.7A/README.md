# G2.4B.7A — Early in-engine UI kit preview

Equipment art intentionally postponed until owner visual approval. Existing G2.3B composition and gameplay untouched. The Godot prototype is a presentation fixture, not the browser game.

The game shell opts into UI Kit v2 via GameKit.USE_V2; existing G2.2 packs and gallery remain available. New PNGs drive navigation, button states, resource bars, bag/equipment slot layers, tooltip frames, resource counters, attribute glyphs, city service icons and six reagent sample stacks in the existing Stash. Dedicated action glyphs are used only where appropriate. Existing character, equipment, realm and potion art retained. Reagents are illustrative quantities, not runtime crafting items. No browser build or economy change.

Use separate layers; no baked frame on a reagent or attribute glyph. Existing rarity enum and labels unchanged; V2 frame hues are art candidates. Use dark charcoal sparingly. Preserve native focus, input and state, optional primary crests at widths >=200, aspect ratio and separate bar fill clipping. Compact bars below the offline-tested height are included as preview candidates, not assumed approved.

Validation: extended shell smoke to check V2 navigation, slot adapter, reagent filter and bar opt-in; existing CI import and capture workflow must run. Actual screenshots and owner visual approval pending. No claim of in-engine verification until CI completes. Revert this integration commit if required; no asset edits.
