# UI Architecture Audit — Gothic Gold Prototype

Branch: `development`
Baseline: `60a7eb7`
Local pre-refactor backup: `/tmp/wanderer-ui-gothic-gold-pre-60a7eb7.bundle`

## Findings

1. The page uses server-free native HTML plus one large `index.html` renderer and several extracted v0.12 runtime modules. Camp markup already has reusable structures: `.panel`, `.phase3ResourcePanel`, `.phase3ResourceTrack`, `.slotTile`, `.rarityImageFrame`, `.phase3CampCharacterStats`, `.phase3Journey`, and `.phase3ExpeditionPanel`. Rebuilding these as separate DOM components would duplicate existing behavior.
2. Styles are loaded in this order: `style.css`, `v012-phase1.css`, `ux39.css`, `v012-core.css`, `v012-ui4.css`, `v012-ui4c.css`, `v012-ui4e.css`, `v012-ui4f.css`, `v012-ui5-camp.css`, `v012-ui6-unified-inventory.css`. The later files successively override earlier Camp/paper/grid rules. `v012-phase1.css` defines absolute paper slots; `v012-ui5-camp.css` changes only Camp to grid, while retaining many `!important` declarations to beat those earlier rules. `v012-ui4f.css` adds another frame/paper layer before that override.
3. The current palette is split between the core wine/blue-gray palette and UI4's wine/bronze palette. Antique Gold `#9E7D44` / Highlight Gold `#D8BC7D` are not centralized. The Camp's image background is applied by different selectors at desktop and mobile; mobile paper rules use a fixed-height Camp image. These cascades make the intended visual result hard to tune consistently.
4. `online/v012-ui5-camp.css` owns the current Camp grid and is the right place to consolidate Camp-only layout. Its current declaration order repeats several tablet/mobile rules and pins many dimensions. Existing `clamp()` rarity frame styles in `v012-ui4f.css` and the responsive base grid should be reused.
5. UI controls already use semantic native buttons, selects, summaries and progressbar roles. A shared CSS vocabulary can map those elements to GothicPanel/Frame/Button/Tabs/ProgressBar/ItemSlot/Stat/Tooltip/Divider/Modal patterns without a JavaScript component framework or markup changes. The rarity frame remains a component wrapper; resource bars already share one rendered component.
6. Nine-slice/decorative image dependencies were removed in the previous audited commit. The only approved decorative bitmap control is the existing Start Expedition button with its left/right ends and a bounded center tile. No old frame assets need restoration.
7. An initial search across active `online/*.css` found 447 `!important` declarations, concentrated in older component placement overrides and Camp's override sheet. It is unsafe to delete shared rules wholesale because the paper doll is also used in Equipment, preparation and Bag screens. Cleanup must therefore stay scoped to Campaign/Camp selectors and preserve those consumers.
8. UI markup does contain inline presentation in older screens, but the Expedition Camp markup uses existing class-based structures and no new gameplay/persistence work is needed. Component rendering and state transitions remain in the existing JS modules.

## Likely causes

- Accumulated visual phases appended new CSS after shared layout rules instead of moving ownership to one stylesheet.
- Camp's previous `paper` positioning was reused across multiple screens, so its grid conversion needed high-specificity overrides.
- Theme tokens were added independently and partially, leaving wine, gray-blue, bronze and gold values in parallel.
- Breakpoint rules at 1050, 1150, 700, 650 and 380px overlap; later declarations silently become authoritative.

## Proposed reusable mapping

| Gothic UI concept | Existing v0.12 structure |
|---|---|
| GothicPanel / GothicFrame | `.panel`, `.phase3Camp`, `.paper` and nested card surfaces |
| GothicButton / GothicTabs | Native `button`, `.nav`, `.phase3Nav`, `aria-selected` and `aria-pressed` |
| GothicProgressBar | `.phase3ResourcePanel`, `.phase3ResourceTrack`, `.phase3Resource` |
| GothicItemSlot | `.slotTile`, `.phase3PotionSlot`, `.rarityImageFrame` |
| GothicStat | `.phase3CampStat`, `.phase3CampCharacterStats` |
| GothicTooltip / GothicModal | Native `<dialog>`, `.inspect`, `.phase3PassiveTooltip` |
| GothicDivider | Existing heading divider pseudo-element and `.rule` |

## Proposed structure

- Put reusable color, spacing, typography, border, focus and shadow tokens in the existing shared Gothic CSS layer.
- Keep Camp-specific surfaces, frame corners, resource bars, stat treatment and responsive geometry in `v012-ui5-camp.css`.
- Remove only conflicting declarations that target Camp exclusively from the previous UI layer; retain paper-doll behavior for Inventory, Between Realms and Bag.
- Keep all gameplay, save, combat, economy and component event logic untouched.
- Verify the existing functional selectors in Chromium before/after at 375, 430, 768, 1440 and 1920px.

## Prototype result

The Camp rules were consolidated in `online/v012-ui5-camp.css`; its final Camp layout has no `!important` declarations. Camp-only rules were removed from the older shared CSS layers while preserving preparation, inventory and Bag consumers. The visual and functional results, all five before/after viewport captures, and test status are recorded in [the prototype report](ui-gothic-gold-camp-prototype.md). The pre-refactor backup remains at `/tmp/wanderer-ui-gothic-gold-pre-60a7eb7.bundle`.
