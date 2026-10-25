# Wanderer v0.12 — UI.4d hotfix

Branch: `development` · Local commit only; no push, merge, deploy, main, Firebase or real-save changes.

## Root causes and fixes

- **Merchant categories:** the `view === 'city-center'` conditional bypassed the data filter in the legacy Merchant route, rendering all 12 stock entries. Filtering now always selects the active category from stock before rendering; the three groups are weapons (weapon/offhand), armor (helm/armor/gloves/boots/belt), and accessories (rings/amulet). Each is limited to its four existing offers. Buy, Compare, restock prices and economy actions are unchanged.
- **Validation save:** the live Merchant stores 12 offers, four per category, while `WandererV012Save.profileCheck()` rejected `stock.length > 4` with `Invalid v0.12 save: Merchant`. The validator now accepts the historical shape of at most four offers or the current shape of exactly 12 with four valid slots in each category. Incomplete 5–11 item pools and unbalanced 12-item pools remain rejected; item, ID, price and sigil checks are unchanged.

The isolated browser fixture recorded the payload before Merchant entry (`profile.merchant: null`) and after entry (`stock.length: 12`, 4/4/4 categories, `sigils.length: 0`, `refreshCost: 20` at E1). After one purchase, the pool remained 12 and the purchased item entered Stash; leaving for Camp did not alter the Merchant payload. Reload restored the same pool and purchased item without blocking validation.

## Validation

- UI.4d isolated Chromium flow: **PASS** — category filtering in both legacy and City Center routes, repeated tab switching, Compare, Buy, return to Camp, save/reload and same-slot second-tab collision.
- UI.3 browser regression: **PASS**, six viewports (1440×900 through 360×800).
- Save validation unit tests: **PASS**, 15/15, including 12 categorized offers and rejection of incomplete/unbalanced pools.
- Economy regressions: **PASS**, 7/7.
- Safari/WebKit: **pending** — this Linux environment has neither Safari nor Playwright WebKit installed. Firefox is also unavailable here.

No balance, gameplay, prices, stock generation, restock cost or save data outside the test's isolated `validationSlot` was changed.

## Restock follow-up

The `New <category> stock` action now replaces only the four offers in the selected tab. The existing restock price and refresh counter are unchanged; the other eight item IDs remain stable. A category refresh fails closed without charging if its four-slot pool is malformed. The no-category runtime API retains whole-shop restock behavior for existing callers.

Follow-up checks: the new category-restock unit case **PASS**; UI.3 browser regression **PASS** at all six viewports and now asserts only the active category changes. `v012-economy.test.cjs` **PASS 7/7**. The broader legacy equipment test remains **PARTIAL (13/14)** due its existing `window is not defined` Belt harness failure. The legacy economy browser test times out on its obsolete `[data-phase3-nav="forge"]` selector before reaching Merchant; UI.3 covers the current City Center restock flow.
