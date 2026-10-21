#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
baseline_dir=${1:-/tmp/v012-phase-b3-chunks}
out_dir=${2:-/tmp/v012-phase-b4-chunks}
if [[ ${WANDERER_B4_ARCHIVED_RUN:-0} != 1 ]]; then
  clean_repo=${WANDERER_B4_CLEAN_REPO:-/tmp/wanderer-b4-base-952c048}
  mkdir -p "$clean_repo"
  git -C "$repo_root" archive 952c048 | tar -xf - -C "$clean_repo"
  cp "$repo_root/combat/v012-combat-runtime.js" "$repo_root/combat/v012-gear-stats.js" "$clean_repo/combat/"
  git -C "$repo_root" show :economy/v012-equipment-runtime.js > "$clean_repo/economy/v012-equipment-runtime.js"
  cp "$repo_root/online/pvp-stats.mjs" "$clean_repo/online/"
  cp "$script_dir/v012-phase-b4-compare.cjs" "$script_dir/v012-phase-b4-run.sh" "$clean_repo/scripts/"
  cp "$repo_root/tests/v012-phase-b4.test.cjs" "$clean_repo/tests/"
  if [[ ! -f "$baseline_dir/50-0-triple-0-control.json" ]]; then bash "$script_dir/v012-phase-b3-run.sh" "$baseline_dir"; fi
  WANDERER_B4_ARCHIVED_RUN=1 bash "$clean_repo/scripts/v012-phase-b4-run.sh" "$baseline_dir" "$out_dir"
  exit $?
fi
mkdir -p "$out_dir"
for E in 50 100 200; do
  for bi in 0 1 2 3 4 5 6; do
    for policy in triple random; do
      profiles=2
      if [[ $bi == 3 ]]; then profiles=1; fi
      for ((pi=0; pi<profiles; pi++)); do
        file="$out_dir/${E}-${bi}-${policy}-${pi}.json"
        if [[ -f "$file" ]]; then continue; fi
        node scripts/v012-phase-b4-compare.cjs "$E" "$bi" "$policy" "$pi" "$baseline_dir" "$file" > /dev/null &
        if (( $(jobs -pr | wc -l) >= 4 )); then wait -n; fi
      done
    done
  done
done
wait
printf 'B.4 completed %s chunks\n' "$(find "$out_dir" -maxdepth 1 -name '*.json' | wc -l)" >&2
