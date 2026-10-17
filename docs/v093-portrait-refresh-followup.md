# Wanderer v0.9.3 — Character visuals and refresh follow-up

Development-only improvements based on the 2026-10-17 screenshot and playtest feedback.

- **Combat:** use the existing 256×256 face PNG without circular framing, clipping or a generated avatar background. Brighten the dungeon image's dark overlay while maintaining readable foreground text.
- **Character selection:** use the same unmodified face PNG (no rounded/circular mask, gradient background or image padding).
- **Equipment:** show the existing full-body WebP (assets/characters/full/) behind equipment; no change to character IDs, slots, loadout or save schema.
- **Dungeon cards:** enlarge favored equipment/affinity item icons on desktop only, leaving narrow mobile layouts compact.
- **Authenticated refresh:** do not open the Account modal during the initial Firebase authentication/profile restore. Missing session, missing profile, recovery errors and cloud save conflicts retain the existing required modal flows.
- **Tab restoration:** remember Tavern / Equipment / Forge / Merchant / Dungeons in sessionStorage per save key and per tab. Normal refresh returns to this view after the correct account save is restored. Combat is excluded, since interrupted combat is recovered and unextracted rewards are not kept.
- **Data safety:** do not change real saves, Firebase rules, account IDs, progression or gameplay balance.

Validation: run npm test and npm run test:browser (including a valid-session refresh on Forge without reopening Account) on the PR. Full browser visual inspection remains useful before pushing to main.