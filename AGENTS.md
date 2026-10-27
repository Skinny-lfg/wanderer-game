# Wanderer Dev Agent — project guidance

## Efficient task start

Use the existing `UserPromptSubmit` hook snapshot when present. Do **not** run the same full preflight again unless the hook failed, the environment changed, or the task needs diagnostics absent from its short summary. The snapshot describes local state only; verify GitHub or Drive through connected tools when that service is relevant. Never infer connector permissions from local CLI status.

Establish the active code and requested branch/ref from the actual checkout. The normal development target is `development`; an isolated maintenance/prototype branch is permitted only when explicitly authorized. Keep the source ref and intended integration target distinct. Before any Git write, verify repository identity, permissions, the current remote target SHA and local pending changes; do not silently overwrite or reconcile divergence. For read-only tasks, reuse a previously verified snapshot if it is still applicable.

Version strings in documents and filenames are historical clues. Inspect the active entrypoint/modules and authoritative documentation **relevant to the change**, not the entire history on every prompt. Read additional project files only as needed.

## Non-negotiable boundaries

- Never modify, merge or publish `main` without explicit separate authorization.
- Never deploy Firebase/Railway, publish Firebase Rules, authenticate to production Firebase, or read/write real player saves without authorization for that specific operation.
- Use synthetic fixtures, isolated browser storage and `demo-*` Firebase emulators for local testing.
- Preserve pending work; no reset, clean, overwrite or force-push. Do not push or deploy without authorization.
- Do not revive retired gameplay, compatibility code or experiments without evidence of a live dependency.
- Do not change gameplay, balance, save contracts or production configuration unless requested.

## Proportional validation and responses

Prefer one implementation batch followed by targeted checks for changed code. Run broader browser suites, audits or simulations at integration/release checkpoints or when risk requires them; always test security-critical changes immediately. Reuse successful checks for the same unchanged commit, but rerun affected checks after code changes. Report `PASS`, `FAIL` and `NOT TESTED` accurately, including unresolved release blockers; mocks do not prove production behavior.

Conclude with a short handoff: active branch/commit, changes, checks, blockers and next step. Do not copy full test logs or historical documents into the response unless requested.
