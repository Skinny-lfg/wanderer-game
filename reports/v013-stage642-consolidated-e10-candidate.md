# Stage 6.42 — E10-led enemy balance, no stacked fixes

**Status:** candidate implemented in the isolated balance branch. No merge/deploy. This is a pragmatic coarse calibration, not a claim of final perfection. All numbers below are *native controlled first-ring E10 fights*, except the separately labelled 25-account early-progression pilot. Same 16 genuinely earned E10 Camp snapshots, same 2 encounter seeds and same equipment/TalentGraph per arm. Repeated encounters are not 32 independent players.

## Changes: replace, do not stack

1. **Normal rooms:** removed three old exported functions (\`applySoloNormalReinforcement\`, \`applyNormalRoomMinionProfile\`, \`applyMinionEscortRelief\`) and removed the additional E1-only/tapered group-pressure pass from \`online/v012-expedition-runtime.js\`. Their intended role/solo/group behavior is now applied **once** by \`WandererV012CombatCore.applyNormalRoomBudget(group, expedition)\`, after native Risk, before Traits, with full roster and reserves included. No second multiplication after this single budget.
2. **E1→E10 leader transition:** removed \`firstExpeditionLeader\` and the two E1-only override maps. Added two **absolute** opening budgets, \`OPENING_ELITE_BASE\` / \`OPENING_BOSS_BASE\`, interpolated smoothly to each **direct mature** Elite/Boss budget by E10 (smoothstep). This retires the sudden E1→E2 identity switch without changing the one shared \`enemyReference(E)\` growth curve.
3. **Eight Elites:** tuned directly inside \`ELITE_ARCHETYPES\` at mature E10; native abilities and summoned Minion logic are unchanged. Oathbound Exarch and Briarspine Horror received only small mature adjustments because they were already the toughest Elites.
4. **Six Bosses:** tuned five direct \`BOSS_BASE\` identities (Blood/Decay/Aegis/Fury/Magic); **Vitality/Devourer unchanged** because its E10 rate was already near the target. No new boss-wide multiplier.
5. The Stage 8 normal-room roster composition is **unchanged**. More principals in 12-member swarms made AoE collapse in exploratory replays, so that experiment was discarded.

## AoE build mechanics confirmed from current code

- **Bow:** one secondary piercing hit per main attack (35% base, or 55% with \`bow_pierce\`). More attack speed raises piercing-hit frequency, so Fury + Bow is a genuine high-frequency AoE build. Secondary damage is also counted as real AoE in the simulator.
- **Two-Handed:** two secondary Cleave hits at 40% base, improving to 60% with \`cleave_mastery\`.
- **Decay + Blood:** \`plague_spread\` transfers one active Bleed and Rot to up to two other enemies when a target dies, at 50% damage. It does not recursively propagate.
- **Magic + Decay:** prepared \`grave_bloom\` can spread Rot through funded casts/Infusion. \`spore_mark\` copies one Rot stack when switching targets.
- These are distinct *direct AoE*, *on-kill DoT spread*, and *attack-speed-driven AoE* archetypes. A mere "has AoE" boolean does not mean equal AoE power. The Stage 6.42 matched E10 rate comparison uses actual earned AoE users; a focused Blood/Decay Rot-spread profile still needs its own population coverage.

## Controlled E10 — matched before/after (16 earned characters × 2 trials)

| Normal group | Before Stage 6.42 | Candidate Stage 6.42 |
|---|---:|---:|
| 1 | 32/32 (100%) | 32/32 (100%) |
| 2 | 32/32 (100%) | 32/32 (100%) |
| 3 | 31/32 (96.9%) | 31/32 (96.9%) |
| 4 | 22/32 (68.8%) | 22/32 (68.8%) |
| 5 | 29/32 (90.6%) | 27/32 (84.4%) |
| 8 | 28/32 (87.5%) | 22/32 (68.8%) |
| 12 | 32/32 (100%) | 27/32 (84.4%) |

The old 4-vs-12 gap was 31.2 percentage points. It is now 15.6 pp across these matched players; that is **better, not perfect**. No extra artificial count-based exception was applied. Some individual builds still struggle at 8–12 (especially Hexblade/Lightning), while Bow and Two-Handed retain genuine AoE utility. Revisit those builds with more seeds rather than adding blanket Minion multipliers.

| Elite | Before wins | E10 candidate wins |
|---|---:|---:|
| Tank | 32/32 | 30/32 |
| Berserker | 32/32 | 24/32 |
| Vampire | 31/32 | 25/32 |
| Caster | 32/32 | 21/32 |
| Gravecaller | 32/32 | 32/32 |
| Oathbound Exarch | 27/32 | 27/32 |
| Briarspine Horror | 26/32 | 26/32 |
| Ashen Executioner | 32/32 | 20/32 |

| Boss (Affinity) | Before wins | E10 candidate wins |
|---|---:|---:|
| Blood / Leech | 21/32 | 21/32 |
| Decay / Matriarch | 32/32 | 28/32 |
| Vitality / Devourer | 16/32 | 16/32 |
| Aegis / Guardian | 30/32 | 24/32 |
| Fury / Berserker | 27/32 | 26/32 |
| Magic / Conductor | 30/32 | 23/32 |

**Still high:** Gravecaller 100%, Boss Decay 87.5%, Fury 81.3%; we deliberately did not stack more buffs when the moderate individual pass fell short. These need mechanics-specific investigation, especially summoned units, interruptions and target switching.

## Early E1–E2 pilot (same fixed 5 profiles × 5 seeds, 25 E1-born accounts)

| Encounter | Previous candidate | Stage 6.42 candidate |
|---|---:|---:|
| E1 normal | 278/330 | 279/331 |
| E1 Elite | 15/31 | 15/31 |
| E1 Boss | 12/31 | 12/31 |
| E2 normal | 72/73 | 69/72 |
| E2 Elite | 17/25 | 13/19 |
| E2 Boss | 10/16 | 11/14 |

These samples are small, encounters are not individually paired between full Expedition runs, and denominators vary with route/earlier survival. The E1 values are essentially preserved. E2 Elite success remains near 68% among encounters reached. **The pilot is not a substitute for the 500-account natural-progression regression.** That full run must confirm no E1→E2 or build-specific collapse.

## Acceptance and next check

- Keep all edits on the isolated \`balance/stage-6.40-e1-calibration\` branch; no merge/deploy.
- Run migrated tests for the old Stage 6.37–6.40 references plus the new Stage 6.42 one-budget checks.
- Run full 500-account E1–E2 and fresh E10 population regression on GitHub Actions, archiving JSON.
- If the bigger sample finds strong AoE or early-progression regressions, **revise the existing canonical budgets** — never add a separate emergency multiplier or an E2-only special case.
- After accepted E1–E10: inspect E20/E35/E70/E200 with one continuous enemy reference.


---

## Validação final em GitHub Actions — 520 contas E1/E2 (Stage 6.42)

Execução verificada: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45264815615 — preflight e progressão completa concluídos com sucesso; não houve merge nem deploy. O ensaio corresponde ao commit `5b33f6f2f0944084504c1854883dc98dedf2d694`. O histórico de simulações com outros coeficientes serve apenas como investigação, **não** como resultado do código final.

| Combate | E1 | E2 |
|---|---:|---:|
| Normais agregados | 5374/6691 (80,3%) | 1386/1474 (94,0%) |
| Elites agregados | 473/644 (73,4%) | 293/329 (89,1%) |
| Bosses agregados | 192/540 (35,6%) | 171/218 (78,4%) |

### Elites E1, individualmente

| Elite | Vitórias |
|---|---:|
| Tank | 14/25 (56,0%) |
| Berserker | 44/70 (62,9%) |
| Vampire | 68/103 (66,0%) |
| Caster | 65/100 (65,0%) |
| Gravecaller | 88/113 (77,9%) |
| Oathbound Exarch | 28/40 (70,0%) |
| Briarspine Horror | 119/126 (94,4%) |
| Ashen Executioner | 47/67 (70,1%) |

**Bloqueio real:** Briarspine Horror é muito sensível aos coeficientes nativos de abertura. Com a mesma estrutura de orçamento, `hp:1.55, atk:.98, interval:1.92` resultou em 53/154 vitórias (34,4%); com `hp:1.53, atk:.97, interval:1.93`, resultou em 119/126 (94,4%). Não são confrontos individualmente emparelhados e os denominadores mudam após progressão natural, mas a variação é demasiado grande para se continuar a perseguir percentagens apenas com microalterações de atributos. **Auditar Thornbloom, duração/ativações, combate antes/depois do guard, número de ciclos e a relação entre HP do Elite e Gear/DPS disponível.** Não adicionar um novo nerf contextual por Expedition ou multiplicador de emergência.

Na E2, as altas taxas de sucesso dos jogadores que lá chegam representam uma população sobrevivente/mais equipada. A função de progressão já é contínua; **continuidade matemática não equivale a dificuldade equilibrada**. Validar transições em personagens emparelhadas antes de alterar `enemyReference(E)`, para não prejudicar E10–E200 inadvertidamente.

### Benchmark E10 — não reinterpretar o número de sobreviventes

A execução completa mais recente de E10 anterior a esta correção de abertura foi https://github.com/Skinny-lfg/wanderer-game/actions/runs/45260060456: 14/18 chegaram à E10 e seis tinham AoE real. O jogador venceu 92,9–100% contra os oito Elites individuais e 71,4–96,4% contra os seis Bosses na amostra controlada desses sobreviventes. Isso **não comprova** que todos os encontros sejam fáceis para um jogador em progressão natural; estes agentes tinham até 24 tentativas por Expedition e há viés de sobrevivência. A correção final de Briarspine afeta as Expeditions anteriores à E10, não os coeficientes da E10 para uma mesma personagem, mas pode alterar *quem* chega à E10.

### Decisão

**Stage 6.42: consolidação de código e telemetria realizada, mas balanceamento global ainda NÃO APROVADO.** A E1 está próxima das metas agregadas para normais e Bosses, mas há outliers individuais nos Elites; a E2 continua muito mais fácil para os sobreviventes. Os testes de regressão dirigidos passaram no CI e os resultados dos 520 percursos ficaram arquivados. Preservar esta branch isolada, sem merge/deploy, e resolver a sensibilidade de Thornbloom e as diferenças por tipo de build com testes emparelhados; alterar os coeficientes canónicos existentes, nunca reintroduzir camadas de escalabilidade.
