#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
out_dir=${1:-/tmp/v012-phase-b3-chunks}
if [[ ${WANDERER_B3_ARCHIVED_RUN:-0} != 1 ]]; then
  clean_repo=${WANDERER_B3_CLEAN_REPO:-/tmp/wanderer-b3-base-15e8bd8}
  mkdir -p "$clean_repo"
  git -C "$repo_root" archive 15e8bd8 | tar -xf - -C "$clean_repo"
  cp "$script_dir/v012-phase-b3-sim.cjs" "$clean_repo/scripts/"
  cp "$script_dir/v012-affinity-combat-sim.cjs" "$clean_repo/scripts/"
  cp "$script_dir/v012-phase-b3-run.sh" "$clean_repo/scripts/"
  WANDERER_B3_ARCHIVED_RUN=1 bash "$clean_repo/scripts/v012-phase-b3-run.sh" "$out_dir"
  exit $?
fi
mkdir -p "$out_dir"
count=0
for E in 50 100 200; do
  for bi in 0 1 2 3 4 5 6; do
    for policy in triple random; do
      profiles=2
      if [[ $bi == 3 ]]; then profiles=1; fi
      for ((pi=0; pi<profiles; pi++)); do
        for mode in control candidate; do
          if [[ $mode == candidate && ( $bi == 0 || $bi == 3 ) ]]; then continue; fi
          file="$out_dir/${E}-${bi}-${policy}-${pi}-${mode}.json"
          if [[ -f "$file" ]]; then continue; fi
          node scripts/v012-phase-b3-sim.cjs "$E" "$bi" "$policy" "$pi" "$mode" "$file" >/dev/null &
          count=$((count+1))
          if (( $(jobs -pr | wc -l) >= 4 )); then wait -n; fi
          if ((count % 12 == 0)); then printf 'B.3 queued %s new chunks\n' "$count" >&2; fi
        done
      done
    done
  done
done
wait
printf 'B.3 completed %s chunks\n' "$(find "$out_dir" -maxdepth 1 -name '*.json' | wc -l)" >&2
