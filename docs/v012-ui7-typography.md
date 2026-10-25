# UI.7 — Dark Fantasy Typography

Branch: `development` only. No changes to game mechanics, player saves, assets, Firebase rules or deployments.

## Approved font pairing
- **Grenze Gotisch 600/700** — main page titles (`h1`) and text fallback for the brand logo. The shipped Wanderer logo image is unchanged.
- **Grenze 400/500/600/700** — window headings (`h2`/`h3`), navigation, buttons, equipment names and larger UI action labels.
- **Alegreya Sans 400/500/600/700** — body copy, player stats, small instructions, text inputs and numbers.

## Integration
- One Google Fonts CSS2 URL loads all three families, with `display=swap` and connection hints. No font binary is copied into the repository.
- CSS design tokens `--font-display`, `--font-head`, `--font-body` live in the existing `:root` of `online/v012-core.css`, with conservative fallbacks.
- Existing CSS rules updated in place: core, phase1, UI4, UI4c, Camp and Shrine caption; no additional overriding stylesheet.
- Kept all dimensions, item frames, layout structure, potion logic, save schema and browser event handlers unchanged.
- Added `tests/v012-typography.test.cjs` to `npm test` to guard the type mapping.

## Verification
- Inline application JavaScript parsed successfully after the HTML stylesheet link update.
- Existing loaded stylesheet sources contain no residual hardcoded Georgia display overrides in migrated rules.
- Runtime font loading and responsive screenshots are still to be checked in browser; different glyph metrics can change text wrapping.
- If Google Fonts is temporarily unavailable, Georgia/system fallback fonts render the UI.
