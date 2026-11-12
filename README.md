# Wanderer v0.12

Wanderer is a browser game. The production release is maintained on `main` and hosted on Firebase Hosting at [wanderer-play.web.app](https://wanderer-play.web.app/).

## Game

Camp → choose an Expedition → complete up to 15 Realms with combat, events, Elites and a boss → collect gear, Gold, Fragments and Runes.

- 12 Realm themes, affinity combinations and hybrid options.
- Between-Realms preparation, equipment, potions, Blacksmith, Apothecary and Forge.
- Endless Expedition progression and Rune tiers beyond E200.

## Branches

- `main` is the production release branch.
- `development` is a separate work branch. It currently differs from `main` in application files, Firestore Rules, assets and GitHub workflows. Review the branch diff before merging or resetting it; do not assume it is a mirror of production.

## Firebase and publishing

- Production Hosting targets Firebase project `wanderer-play`.
- Publishing is manual through **Actions → Publish Wanderer v0.12 to Firebase Hosting**, from `main`, with target `production` and confirmation text `DEPLOY wanderer-play`.
- The workflow uses the GitHub Secret `FIREBASE_SERVICE_ACCOUNT_WANDERER_PLAY`. Never commit service-account keys.
- Development Firebase configuration remains separate in `online/firebase-config.mjs`; the production build installs the production configuration.
- The Hosting workflow does not deploy Firestore Rules. Rules changes require their own review and deployment decision.

## Checks

```sh
npm ci
npm test
npm run test:browser
npm run test:preview
npm run simulate:v012
```

Browser tests require Chromium and Playwright. The production build packages the public `index.html`, `assets/`, `online/`, `combat/` and `economy/` files.

Set `CHROMIUM_PATH` to the browser executable when it is not `/usr/bin/chromium`.
Set `WANDERER_ARTIFACT_ROOT` to an external directory to keep the main browser
suite's generated screenshots and metrics out of the working tree. Firestore
and Auth emulator tests use the demo project and require Java.

For a map of the current gameplay modules, see [docs/current-game-map.md](docs/current-game-map.md).

### Automatic RPG work in progress

`node scripts/prepare-automatic-preview.mjs` builds an isolated English-language
playtest in a new temporary directory and prints its path. Serve that directory
over localhost or HTTPS. It uses its own local save namespace and does not load
account or Firebase modules. The full design and unfinished systems are listed
in [docs/automatic-rpg-plan.md](docs/automatic-rpg-plan.md).

## Data safety

Do not delete player accounts or saves as part of code cleanup. Do not include real player data in tests or reports.
