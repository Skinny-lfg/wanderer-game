# UI.5 — Camp character window and refresh position

Scope: Camp-only layout plus session-only UI location. development only.

- Camp health and mana now render at the top of the character/equipment window.
- Camp gear buttons have 5 fixed rows per side, with smaller framed art and an independent text lane. The image's source ratio remains unchanged.
- Three potion loadout slots remain interactive and now sit in the same window beneath the character.
- Five attributes (Strength, Agility, Intellect, Endurance, Charisma) appear beneath the potions, then Attack, Defense, Health, Crit, Gear Power. Other stats stay under "More stats".
- Removed redundant Camp ATK and DEF cards from the former summary and moved Your Journey below Expedition and the rest of Camp.
- Mobile Camp adds a fixed, safe-area-aware Start Expedition action, retaining the original Expedition CTA and both existing click bindings.
- Reload stores/restores view, City Center tab and window scroll in sessionStorage only. Invalid views during an active Expedition are not restored. No game save schema/payload is changed.

Code checks: inline JavaScript parse, two CTA selectors for the existing handler, existing vitals/potion/gear calls preserved, no save code or backend changes.

Browser validation is still needed, especially 360px/390px/700px/1100px/desktop, iOS bottom safe area, potion remove/use and refresh with changing view and scroll.
