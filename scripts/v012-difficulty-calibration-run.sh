#!/usr/bin/env bash
set -euo pipefail
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
out_dir=${1:-/tmp/v012-phase-b2-chunks}
final_file=${2:-/tmp/v012-phase-b2-calibration-clean.json}
if [[ ${WANDERER_B2_ARCHIVED_RUN:-0} != 1 ]]; then
  clean_repo=${WANDERER_B2_CLEAN_REPO:-/tmp/wanderer-b2-base-62519a0}
  mkdir -p "$clean_repo"
  git -C "$repo_root" archive 62519a0 | tar -xf - -C "$clean_repo"
  for file in v012-affinity-combat-sim.cjs v012-difficulty-calibration-sim.cjs v012-difficulty-calibration-aggregate.cjs v012-difficulty-calibration-report.cjs v012-difficulty-calibration-run.sh; do
    cp "$script_dir/$file" "$clean_repo/scripts/$file"
  done
  WANDERER_B2_ARCHIVED_RUN=1 bash "$clean_repo/scripts/v012-difficulty-calibration-run.sh" "$out_dir" "$final_file"
  exit $?
fi
mkdir -p "$out_dir"
count=0
for curve in current A B; do
  for profile in A.2 B.1; do
    for E in 10 50 100 200; do
      for build in 0 1 2 3 4 5 6; do
        for policy in triple random; do
          file="$out_dir/${curve}-${profile}-${E}-${build}-${policy}.json"
          WANDERER_B2_CURVE="$curve" WANDERER_B2_PROFILE="$profile" WANDERER_B2_E="$E" WANDERER_B2_BUILD="$build" WANDERER_B2_POLICY="$policy" \
            node scripts/v012-difficulty-calibration-sim.cjs "$file"
          count=$((count+1))
          if ((count % 16 == 0)); then printf 'completed %s/336 chunks\n' "$count" >&2; fi
        done
      done
    done
  done
done
node scripts/v012-difficulty-calibration-aggregate.cjs "$out_dir" "$final_file"
