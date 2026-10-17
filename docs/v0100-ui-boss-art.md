# Wanderer v0.10.0 — UI and boss art integration

**State:** development only, no main merge, Firebase changes or save resets.

- Player mana is a blue bar below HP when a mana-using caster is equipped, updated every combat tick, without duplicate MP in the HP label.
- Account, Leaderboard and Feedback move to the header where the wallet was. Desktop wallet now follows the Dungeons navigation; compact mobile currency appears above the tabs. The mobile three-line menu contains Account, Leaderboard and Feedback.
- Elite enemy names are now unique to their existing portraits: Gravebound Bulwark (Tank), Bloodscar Ravager (Berserker), Sanguine Wraith (Vampire), Voidborne Hexer (Caster). Attack and status behavior remains unchanged.
- Boss previews explain existing Guardian Barrier, Rift healing (28% damage reaching HP) and Ember Enrage (+35% attack below 50% HP) before wave 5, including mobile decision text.
- **Boss art:** all three original transparent-fade PNGs from Google Drive `Wanderer/02 - Assets/Packs/Wanderer_Bosses_3_Transparent_Fade` are imported into `assets/bosses`: Abyssal Guardian, Rift Harbinger and Ember Sovereign. Abyssal Guardian's PNG was reconstructed and verified byte-for-byte against the original SHA-256 (`692a9fa950a8880e3596941306d81b5acbac7dfaa2c68ec9c1bb4e2033b96a86`) before committing it. No boss mechanics were changed.
- Visible version, document title and latest changelog title use v0.10.0; historic v0.9.3 simulation reports remain as history.
- `npm test` includes `tests/v0100-ui-regression.cjs` as a lightweight source regression. Automated full browser/mobile audit remains the release gate; human visual approval is still required before main publication.

No further backlog features or combat balance changes are part of this update.

## Final automated verification — 17 October 2026

- **Full pre-release audit: PASS** on gameplay commit `3d31bc1398addc17efdc4a032463369ae20725a3`. [GitHub Actions result](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39023602470).
- **Smoke / `npm test`: PASS**, including Shatter + Double Strike isolated A/B and the v0.10.0 UI regression.
- **Real Chromium browser:** mobile/desktop gameplay stress, account sign-in and save restoration, wallet + 3-line menu, boss warnings, mana bar, three boss PNGs and VFX **PASS** in isolated test fixtures.
- **Recovery, deterministic combat/save stress, practice PvP and Firestore rules in demo emulator:** **PASS**. The emulator is not the player's Firebase project.
- The previous browser test failure was a fixture-scope issue (trying to access script-local `state` from outside its scope); the fixture now exposes its own `setMana` helper. A separate bug was fixed to avoid overwriting connected Account/Leaderboard/Feedback click handlers on game re-renders.
- **Release remains held:** the owner can still review aesthetics and artwork in person. No merge to `main`, no live Firebase rules, account or save changes, and no deployment were performed.


## Post-audit visual fixes — 17 October 2026

- **Equipment desktop:** no-overlap slot layout with slightly taller compact portrait paper. Armor/Boots and all side equipment slots have separated vertical zones. Nine-slot collision checks added to Chromium regression.
- **Character picker labels:** Paladin, Ranger, Warrior, Wizard, Rogue. Character IDs, saved character choice, cosmetics and gameplay modifiers are unchanged. Both browser module URL and `online/model.mjs` import URL were refreshed to avoid stale cached character labels.
- **Elite portrait pack:** original optimized WebPs from Drive `Wanderer/02 - Assets/Packs/Wanderer_Elites_4_Optimized`, mapped to tank, vampire, berserker and caster. Original PNG files remain as archival copies; runtime uses the WebPs. Existing elite abilities and names are unchanged.
- **Targeted regression:** verify new names inside the actual Account & Character browser dialog and verify nine equipment slots have no bounding-box overlap at desktop viewport.
- Keep v0.10.0 in `development` until owner visually approves. No Firebase production changes or save resets.
