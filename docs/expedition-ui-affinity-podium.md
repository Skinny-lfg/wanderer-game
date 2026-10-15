# Development UX iteration — extraction, death, affinities, leaderboard

- At the end of **any** dungeon (normal W4 or chapter boss W5), hide the next-wave button entirely and emphasize the green **Extract & Complete** button. Extract is left, Continue Wave is right while still playable; speed remains secondary. No phantom Wave 5 on normal levels.
- On death, display the themed `Your Wanderer Has Fallen` dialog with numbers of lost and protected items. Existing protected gear, permanent runes and save behavior are unchanged. Native alert is used only in older browsers without dialog support.
- **Two-Handed, Bow, Staff** still occupy one item and both hands, but earn **two affinity *points*** toward their own elemental set (not two items, two drops, or two gear pieces). Equipped Off-Hand's affinity is ignored whenever the main-hand uses both hands; one-handed + Off-Hand each count normally. Applies equally to stored old items, online/PvP views and previews without any save migration.
- Show permanent runes immediately above Set Bonus Progress in the inventory and as a compact equipped-rune summary above Tier Bonuses in combat.
- Leaderboards: 🥇 🥈 🥉 on ranks one through three, DXX at the far right across deepest, first and fastest categories. Other metrics appear below the player nickname.
- Player and enemy statuses are absolute-positioned at the **top** of their own combat panel; character art, HP and attributes start below this reserved zone. Empty effects have no text; status data updates continuously while fighting.

`npm test` now covers the user requests in `tests/expedition-ui-smoke.cjs`. Manual browser QA is still needed for narrower screens and real browser dialogs.
