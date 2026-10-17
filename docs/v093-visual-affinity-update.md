# Wanderer v0.9.3: UI and passive gear affinity fixes

Assets: assets/branding/wanderer-logo.webp plus four user-supplied original PNGs in assets/elites/{tank,caster,vampire,berserker}.png.
These elite portraits are used at Wave 4 and in the warning panel, with fallback to existing art if an asset is unavailable.

Interface:
- Header displays just current version and official logo.
- Dungeons show wave structure and build threat, not static enemy stats.
- Legendary Hunt has directly selectable items with conditional odds by path.
- Tavern changelog contains current changes in short bullet points only.
- Combat uses the authenticated account nickname without copying it into saves.
- Background image is at 50% saturation. Combat animations/VFX overlays are hidden.
- Tank's healing-reduction badge appears once; application log fires at start, not on every refresh.
- The signed-out placeholder UI is hidden until the correct account has been restored.

Combat rule:
- Weapon and Off-Hand keep their existing rates.
- Non-weapon equipment has a SINGLE shared 14% chance on damaging weapon hits, with a 2-second internal cooldown.
- Pick a random eligible armor/jewelry piece when successful, apply at 45% normal affinity potency.
- Crit affinity on gear continues to contribute stats/set power but does not create a second crit status.
- No proc per gear slot, and no new persistence; existing saves remain compatible.

Validation: full npm test, browser login and saves, browser and mobile stress, PvP and isolated Firestore rule emulator. Do not deploy rules or reset live saves.