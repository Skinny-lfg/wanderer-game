# Wanderer — UI kit and information architecture (G1R)

Status: design specification for review; not approved final art or gameplay. English in-game labels, desktop-first, 1280×720 logical canvas with 1920×1080 and 2560×1440 targets. Browser reference: audit/v013-stage6 index.html, phase3RenderNav (five destinations). Do not copy HTML/CSS.

## Navigation and screen ownership
- Camp hub: hero, preparation, Begin Expedition; secondary Codex is optional.
- Inventory: equipped items, bag, stats, potions, rune item category (future rules).
- Talents: six Affinities, points, zoom, pan, node detail and reset confirmation.
- City Center: service entry scenes for Blacksmith (craft/blueprints), Merchant (buy/sell), Apothecary (potions).
- Shrine: permanent rune equipment and rune selection from bag; slot count and rune rules are provisional until browser design is finalized. Distinguish from temporary expedition Boon Shrines.
- Expedition: contextual sequence Choose Realm → difficulty → Contracts → map → encounter/event/shrine → map → extraction/boss/death → results → Camp. No global Camp tab bar during active runs. Combat is an encounter scene, not a tab. Prototype context buttons are not game state.
- Global overlays: settings/pause, confirmation, item detail/compare, rewards, notifications. Codex stays secondary until approved.
- Navigation outside runs only. During run, exit flow must require real extraction/death/finish rules; no free Camp bypass in production.

## Kit inventory (design before mechanics)
| Family | Components | Required states |
|---|---|---|
| Foundation | palette, type scale, spacing, borders, texture atlas, focus ring, icon grid | default/high contrast, safe area |
| Navigation | main tab, contextual action bar, subtab, breadcrumb, back, icon shortcut, notification badge | normal, hover, pressed, selected, focus, disabled, locked |
| Buttons | primary CTA, secondary, ghost, danger, icon-only, confirm/cancel | normal, hover, pressed, focus, disabled, locked, loading |
| Surfaces | edge frame, inset panel, divider, parchment/metal texture, modal, tooltip, scroll area | open/closed, focus, clipped |
| Inventory | item slot, equipment slot, bag grid, rarity frame, stack count, item tooltip, comparison, currency icon, item category/filter | empty, occupied, new, hover, selected, equipped, locked, incompatible, compare |
| Character | portrait, stat row, attribute icon, level/XP, HP/mana/barrier, potion slot | full, depleted, gain/loss, cooldown |
| Talents | node basic/ability/keystone, edge, affinity emblem, point badge, zoom/pan canvas | locked, reachable, allocated, selected, insufficient points |
| City | service entrance, craft recipe, materials, shop row, price, quantity control, confirmation | affordable/unaffordable, known/unknown, purchased, unavailable |
| Shrine | rune item slot, bound rune socket, rune tooltip, tier badge | empty, occupied, equipped, incompatible, locked |
| Expedition | realm selector, difficulty chip, contract card, map node, path, room marker, event choice, Boon option, extraction action, results rows | undiscovered, discovered, available, cleared, locked, selected, danger |
| Combat | enemy target indicator, enemy nameplate, HP/mana/barrier, action slot, status icon, stack count, cooldown, damage number, encounter result | alive/dead, focused, blocked, cooldown, active, expired |
| Feedback | toast, banner, confirmation, loot notification, loading, empty state, error message | info, success, warning, error |
| Accessibility | keyboard/gamepad focus, readable labels, high contrast, scalable text, reduced motion | no color-only signals, minimum target size |

## Direction
Game first: world artwork fills the screen; HUD uses compact, anchored overlays; no web cards for every piece of information. Charcoal, iron, aged gold, ivory; color accent reserved for meaning (rarity, affinity, status), not universal ornament. Initial token proposal: background #101216, surface #1A1B20, frame #544A3C, gold #D0AD72, ivory #E7DFCE, muted #A69F94; semantic colors separate. Heading serif and readable UI sans, licensed font selection still open. Use a 4/8 px spacing grid, 44 px minimum primary hit target, 16–18 px UI text at logical 720p, 28–44 px titles. Textures should tile or use NinePatchRect; no baked text. Prefer transparent PNG/WebP for art, SVG for clean icons, theme resources for states and fonts; reuse current art only when quality/composition is suitable.

## Proposed Godot layout
```
ui/
  theme/             # theme.tres, tokens, fonts
  components/
    navigation/      # buttons and tab strip
    surfaces/        # frames, dialogs, tooltip
    inventory/       # slots, item tooltip and comparison
    character/       # portrait, bars and stats
    talents/         # graph nodes and edges
    city/            # service and recipes
    shrine/          # sockets
    expedition/      # map, realm and contract visuals
    combat/          # HUD, targeting, status
    feedback/        # notifications and results
  assets/
    icons/           # categories, rarity, affinity, status, currency
    frames/          # nine-slice, borders, overlays
    textures/        # stone/iron/parchment
    fonts/           # project-licensed fonts + license
  showcase/          # independent UI kit gallery, no gameplay
scenes/screens/      # compositions using reusable components
scripts/             # existing prototype scripts, eventual screen controllers
tests/               # screenshot and navigation regression
```
Each reusable component gets its own scene and/or script, explicit properties and signals, no direct domain mutation. Theme shared, screen-specific layout stays in screen. Domain rules/data stay outside UI.

## G2 acceptance
1. Build the shared theme and UI kit gallery first: all button states, panels, item rarity, empty/filled slots, resource bars and tooltips.
2. Review rendered screenshots and pick visual style before migrating every screen.
3. Check keyboard focus, 1280×720 and 1920×1080, long labels, readable contrast, no clipping. Other aspect ratios are a subsequent check, not validated.
4. Reuse assets and test native UI state, not fabricated combat or economy data.
5. G3–G8 apply kit screen by screen; only G9+ ports mechanics and compares against frozen browser commit.
