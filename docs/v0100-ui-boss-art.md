# Wanderer v0.10.0 — UI and boss art integration

**State:** development only, no main merge, Firebase changes or save resets.

- Player mana is a blue bar below HP when a mana-using caster is equipped, updated every combat tick, without duplicate MP in the HP label.
- Account, Leaderboard and Feedback move to the header where the wallet was. Desktop wallet now follows the Dungeons navigation; compact mobile currency appears above the tabs. The mobile three-line menu contains Account, Leaderboard and Feedback.
- Elite enemy names are now unique to their existing portraits: Gravebound Bulwark (Tank), Bloodscar Ravager (Berserker), Sanguine Wraith (Vampire), Voidborne Hexer (Caster). Attack and status behavior remains unchanged.
- Boss previews explain existing Guardian Barrier, Rift healing (28% damage reaching HP) and Ember Enrage (+35% attack below 50% HP) before wave 5, including mobile decision text.
- **Boss art:** fade images supplied in Google Drive `Wanderer/02 - Assets/Packs/Wanderer_Bosses_3_Transparent_Fade`. Rift Harbinger and Ember Sovereign are imported as PNGs. Abyssal Guardian retains the previous visual until its original PNG has been committed; this is an outstanding asset-upload-only item, not a mechanics issue.
- Visible version, document title and latest changelog title use v0.10.0; historic v0.9.3 simulation reports remain as history.
- `npm test` includes `tests/v0100-ui-regression.cjs` as a lightweight source regression. Visual QA and full browser runs are still required before main publication.

No further backlog features or combat balance changes are part of this update.
