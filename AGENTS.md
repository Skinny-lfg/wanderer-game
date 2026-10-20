# Wanderer — Codex repository guidance

**Project:** Wanderer browser game. **Current development focus:** v0.12 Expeditions.

## Read first for v0.12 tasks
1. [Codex handoff](docs/v012-codex-handoff.md) — current priorities, requirement precedence, repository links, test plan and safety.
2. [Complete post-integration backlog](docs/v012-post-integration-backlog.md) — mirrored from the owner's Google Doc; full list, including provisional proposals and superseded notes.
3. [Integration audit](docs/v012-integration-audit.md), [v0.12 final validation report](docs/v012-final-validation.md), [Realms/events/bag implementation report](docs/v012-realms-events-bag-implementation.md).
4. Inspect the real code and tests at the current `development` head. Do not treat old documentation as proof of current behavior.

**Latest requirement precedence:** backlog §28 > §27.08 (Rune guaranteed after *each* completed Expedition, plus no free affinity procs); §27.03 > UI-014 (3 shared rerolls *per Expedition*); §28 Character 5/5 layout applies to character equipment, not to approved homepage layout; §22 supersedes §21. Many experimental backlog ideas are **not** automatically approved for implementation.

## Safety and execution boundaries
- Work only on `development`; **do not edit/merge/publish `main`** unless the owner explicitly requests it.
- **No production deployment** (including Railway/Firebase), Firebase rules changes, or modifications/migrations to real players' cloud/local saves unless separately authorized.
- Protect legacy data, real items and item IDs. Use synthetic/isolated QA profiles and test storage. Do not assume browser-local save data are production-safe.
- A request to read, audit, mirror, plan or review documentation **is not permission to implement changes**. Implement only the scope expressly requested in the current Codex task.
- Preserve classic gameplay where v0.12 changes are feature-gated; avoid re-enabling removed gear affinity/set bonuses just to satisfy outdated tests.
- Before finishing an implementation task, run relevant focused tests, disclose existing test failures, report changed files/commits and unresolved risks. No automatic deployment.

## UI/asset context
- Reuse existing repo art and layout rather than reconstructing it. Approved homepage reference is *image A* embedded in the original Google Doc: **HP/Mana left; character centered; Expedition card right**. That external image is not embedded in the Markdown mirror; textual specification is in the handoff.
- Final illustration and interface redesign will be supplied separately. Functional requirements first; avoid unapproved visual redesign.
