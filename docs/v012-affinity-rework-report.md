# Wanderer v0.12 — Affinity rework A/B/C

Implementado em `development`, preservando os 63 IDs. Validação funcional: **PASS**. Aprovação de balanceamento: **PENDENTE**; nenhuma alteração automática aos valores da especificação. Sem main, deploy, Firebase, saves reais ou E∞.

## Commits e âmbito

- `020cd0a` — Fase A: 33 normais, 29 Rank5/4 Unique, efeitos, custos e caps.
- `f3ec140` — Fase B: draft contextual, tags, triggers, pity por par e persistência.
- `26a78a6` — Fase C: 30 híbridos Unique, conversões de DoT, cura/Barrier, cooldowns e snapshots de morte.
- `2718f70` — bloqueio de upgrades sem ganho (incluindo Adrenaline no cap), eventos e regressões/checkpoints/UI atual.
- `6d8daa0` — ferramentas de combate nativo, distribuição do draft e ensaio de ranks.

Módulos: `combat/v012-buildcraft.js`, `combat/v012-combat-runtime.js`, `online/v012-expedition-runtime.js`, `online/v012-persistence-runtime.js`, `online/v012-save.js`; integração visual em `index.html`. `online/pvp-stats.mjs` regenerado da fonte canónica já existente. Nenhuma regra duplicada no HTML.

## Saves e segurança

Novas builds usam versão 3; o envelope de save permanece v12. Builds antigas mantêm picks/IDs; o rank efetivo é limitado a 5/1. Híbridos legacy repetidos/do mesmo par não acumulam efeitos: primeira alternativa válida, até três pares. Um draft antigo é convertido deterministicamente ao restaurar, preservando picks; o novo draft v3, seed, categorias e pity persistem sem recriar cartas. Testes cobrem ambos os caminhos. Last Stand consumido também é marcado no checkpoint de entrada para não rearmar com refresh. Guardian’s Oath e Second Breath usam chave de Wave.

Starter apenas após primeira vitória da família, seguido de uma escolha normal na mesma Realm. Não há draft na Realm15. Máximo de três affinities, três híbridos e um híbrido por par. Eventos usam os mesmos caps; Unique não pode servir de sacrifício sem perda real no Last Ember.

## Testes

| Check | Resultado |
| --- | --- |
| `npm test` | PASS — 205 testes, 0 FAIL |
| Normais | PASS — 33 IDs, ranks, ganho/condições, custo funded/free, caps, JSON e eventos |
| Draft | PASS — 1.200 seeds × 14 drafts; três IDs legais, categorias, limite/pity, late unlock R12–R14, restore byte-idêntico e clique duplicado |
| Híbridos | PASS — 30 positivos + 30 negativos, gating de 15 pares, ICD/charges/JSON, não recursão, conversão de DoT e caps normal/Elite/boss |
| Browser Chromium | PASS — 390px/1280px: Expedition completa, draft, lojas/poções, refresh, Static, Rune única, duas tabs, Evasion e preview/CSP |
| Assets/VFX | PASS — 29 PNGs e routing existente |
| PvP gerado | PASS — `node scripts/build-pvp-stats.cjs --check` |

Testes obsoletos atualizados: ranks ilimitados/janelas 6–8–10, Static antes do starter e relatório por Realm. A fixture lifecycle tinha `while(run)` infinito no estado `cleared`; passou a verificar combate/EXIT REALM. Os hashes antigos de equivalência 0c8d2ae foram substituídos por uma referência do rework, pois efeitos/RNG mudaram intencionalmente. A fixture Static agora fornece Mana sintética suficiente para exatamente três casts funded; não altera a fórmula. Nenhum teste v0.12 eliminado.

## Distribuição do draft

Ensaio estrutural separado do combate: 1.000 seeds, três famílias já desbloqueadas, 14.000 drafts/42.000 cartas por política, baseline `02feebb`. Picks aleatórios legais; RNG diverge depois das primeiras decisões.

| Métrica | Antes | Depois |
| --- | ---: | ---: |
| Cartas com upgrade próprio útil | 25.72% | 39.92% |
| Cartas sem trigger funcional | 34 | 0 |
| Cartas que excederiam os novos caps | 1380 | 0 |
| Pity apresentado | 0 | 4460 |
| Combinação disponível até R10 / R14 | 1000/1000 · 1000/1000 | 1000/1000 · 1000/1000 |
| Builds finais distintas | 1000 | 1000 |
| Erros/pool impossível | 0 | 0 |

As 14.000 cartas Synergy do novo modelo passaram o validador funcional; o baseline não possuía categorias comparáveis. A análise não mede win rate. Os três rerolls de Realm continuam separados do draft; testes de browser verificam saldo, quarto reroll bloqueado e persistência.

## Combate integrado — resultados

**3360 Expeditions nativas**, E1/E10/E50/E100/E200 × sete armas × Rare/Epic × seis affinities iniciais × quatro estratégias × com/sem três Runas. Zero erros/timeouts; 200.6s de execução total. Sem inimigos abatidos artificialmente nesta matriz. Gear homogéneo no tier/raridade da célula; três Runas reais coerentes com arma/tier. Mesmo seed inicial nos pares de estratégias/ablação; estado final de RNG registado. Sem poções, trocas de gear ou benefícios de eventos (todos recusados), para controlar variáveis.

Um seed por célula fina: são comparações exploratórias agregadas, não estimativas robustas de probabilidade populacional. “Mono” significa prioridade a uma família nos picks; as ofertas normais podem obrigar a adquirir outras famílias. Dual/triple procuram pré-requisitos e apenas priorizam híbridos do conjunto pretendido. O ficheiro de dados distingue famílias alvo, adquiridas, não previstas e híbridos realmente conseguidos.

Vitórias com três Runas — **84 execuções por célula** (sete armas × duas raridades × seis famílias):

| Expedition | Aleatória | Foco mono | Sinergia dupla | Sinergia tripla |
| --- | ---: | ---: | ---: | ---: |
| E1 | 98.8% | 96.4% | 97.6% | 98.8% |
| E10 | 1.2% | 3.6% | 3.6% | 8.3% |
| E50 | 1.2% | 0% | 3.6% | 4.8% |
| E100 | 9.5% | 9.5% | 8.3% | 9.5% |
| E200 | 21.4% | 17.9% | 19% | 23.8% |

Agregação de todos os tiers, com três Runas (420 execuções/estratégia):

| Estratégia | Vitória | Realm mediana/P90 | Tempo simulado mediano | DPS mediano | 1.º híbrido mediano* |
| --- | ---: | --- | ---: | ---: | ---: |
| random | 26.4% | 8/15 | 33.88s | 434.29 | 7 |
| mono | 25.5% | 10/15 | 32.12s | 427.65 | 8 |
| dual | 26.4% | 10/15 | 32.34s | 431.9 | 7 |
| triple | 29% | 11/15 | 31.68s | 431.9 | 6 |

*Apenas entre runs que adquiriram um híbrido. Duração inclui derrotas precoces; não é duração mediana de uma vitória nem tempo humano de sessão. Wall time por execução mede custo da simulação.

Ablação de Runas, todos os tiers:

| Estratégia | 3 Runas | Sem Runas |
| --- | ---: | ---: |
| random | 26.4% | 23.8% |
| mono | 25.5% | 24.3% |
| dual | 26.4% | 23.8% |
| triple | 29% | 25% |

Por arma, todas as estratégias/tiers, três Runas (240 runs/arma):

| Arma | Vitória | Realm mediana | DPS mediano |
| --- | ---: | ---: | ---: |
| Sword | 28.3% | 10 | 368.33 |
| Mace | 23.8% | 10 | 280.81 |
| Bow | 33.3% | 12 | 607.93 |
| Daggers | 35.4% | 14 | 670 |
| Two-Handed | 26.3% | 11 | 612.61 |
| Staff | 23.3% | 8 | 480.62 |
| Wand | 17.5% | 4 | 335.64 |

Por família inicial, mesmas condições (280 runs/família; não são builds puras garantidas):

| Família | Vitória | Realm mediana | DPS mediano |
| --- | ---: | ---: | ---: |
| blood | 23.9% | 9 | 391.53 |
| decay | 23.2% | 9 | 411.46 |
| vitality | 27.9% | 9 | 427.65 |
| aegis | 29.3% | 10 | 391.22 |
| fury | 30.4% | 10 | 501.2 |
| magic | 26.4% | 10 | 431.9 |

## Limitações e recomendações de balanceamento

- E10/E50 têm sobrevivência baixa neste protocolo; E200 volta a melhorar. Investigar a curva gear/inimigos/Runas e a dependência de preparação antes de propor mudanças nos passivos. Não comparar armas isoladamente sem controlar armadura, off-hand e sustain.
- Daggers/Bow superaram Wand/Mace nesta amostra. Repetir com loadouts adequados e consumíveis antes de propor ajustes de coeficientes.
- Foco mono não garante rota mono: com três Runas, 379/420 runs adquiriram família não prevista; dual teve 328/420. Triple obteve híbrido alvo em 264/420, dual em 223/420. Não atribuir toda derrota à força do híbrido; dados registam famílias em falta e Realm de aquisição. Garantir uma rota familiar exigiria decisão de design fora deste rework.
- 580 ensaios nativos de 30s cobrem os 29 escaláveis × R1…R5 × 0…3 complementares (além do starter). Em 96/116 contextos houve cinco resultados finais diferentes; diferenças probabilísticas/arredondamentos/caps podem produzir o mesmo agregado curto. Os testes unitários verificam os incrementos prescritos; contextos já saturados não são upgrades elegíveis. O ensaio identificou o cap de Adrenaline e a oferta foi corrigida sem alterar valores.
- O bench usa inimigo durável sintético e completa artificialmente uma Wave apenas para medir Second Breath: não entra nas taxas de vitória acima. Some buffs são modificadores contínuos, por isso activations=0 não significa ausência de efeito.
- DPS usa dano efetivo registado pelo motor. DOT detalhado inclui dano solicitado por ticks normais antes de overkill; peakProcBurst mede um proc, não burst de uma janela inteira. `observedEhpBudget` é MaxHP + cura efetiva + Barrier absorvida, não EHP teórico com armor. Falta medição humana de duração e análise estatística com múltiplos seeds independentes por célula.
- Sem ajustes automáticos. Recomenda-se revisão de balanceamento com estes dados e novo playtest; não declarar release balanceada apenas por CI verde.

## Matriz dos 63 passivos

A = `tests/v012-affinity-phase-a.test.cjs`; C = `tests/v012-affinity-phase-c.test.cjs`. Normais: ranks/execução/serialização e caps. Híbridos: positivo, negativo, gates, serialização e ICD/charges aplicáveis. Os valores integrais permanecem nos três documentos aprovados e na implementação canónica.

| ID | Máx. | Efeito/trigger validado | Teste | Resultado |
| --- | ---: | --- | --- | --- |
| `bleeding_edge` | 5 | Hits: Bleed chance; 16% base per tick, ICD 0.9s. | A | PASS |
| `deep_cuts` | 5 | All player Bleed +15% per rank, applied on creation. | A | PASS |
| `executioner` | 1 | Bleeding foe at ≤30% HP: bounded burst, ICD 6s. | A | PASS |
| `blood_drinker` | 5 | Hit bleeding foe: bounded heal, ICD 4s; healing reduction applies. | A | PASS |
| `sanguine_fury` | 5 | Critical: Bleed 14% base + direct burst, ICD 2.5s. | A | PASS |
| `toxic_touch` | 5 | Hit: Poison 12% and Rot 6.5% base; ICD 1.3s. | A | PASS |
| `virulent_rot` | 5 | New Rot stacks +15% damage per rank. | A | PASS |
| `wasting_curse` | 5 | Rotted enemy deals less damage; combined reduction cap 28%. | A | PASS |
| `wither` | 5 | Rot reduces enemy healing and direct damage; player healing unaffected. | A | PASS |
| `blight` | 1 | Hit rotted foe: bounded burst, ICD 7s. | A | PASS |
| `strong_heart` | 5 | Maximum HP scales with square root of rank; no free healing. | A | PASS |
| `renewal` | 5 | Continuous healing per second; healing reduction applies. | A | PASS |
| `last_stand` | 1 | Survive one lethal hit per Expedition at 6% MaxHP. | A | PASS |
| `second_breath` | 5 | Heal once per completed Wave. | A | PASS |
| `life_bloom` | 5 | Restore HP and Mana each combat second. | A | PASS |
| `iron_skin` | 5 | Defense scales with square root of rank. | A | PASS |
| `fortified` | 5 | Incoming damage −4% per rank, within global 28% cap. | A | PASS |
| `guarded_block` | 5 | Bonus block chance; total cap 65%, existing block reduction. | A | PASS |
| `barrier_pulse` | 5 | Barrier every 6s; engine Barrier cap applies. | A | PASS |
| `retaliation` | 1 | Real Barrier absorption empowers next hit by 15% base, once. | A | PASS |
| `quick_hands` | 5 | Attack speed +8% per rank; total cap 5/s. | A | PASS |
| `precision` | 5 | Extra critical chance, total cap 65%. | A | PASS |
| `brutal_crit` | 5 | Real critical adds non-recursive base damage. | A | PASS |
| `double_strike` | 5 | Chance of one 30% extra hit, no recursive procs. | A | PASS |
| `adrenaline` | 5 | Real critical: 3s attack speed buff, ICD 3s. | A | PASS |
| `arcane_focus` | 5 | Elemental spell power scales with square root of rank. | A | PASS |
| `mana_spring` | 5 | Mana regeneration scales with square root of rank. | A | PASS |
| `efficient_cast` | 5 | Funded elemental cast Mana cost: 7/6/5/4/3. | A | PASS |
| `arcane_echo` | 5 | Every fourth funded elemental hit echoes without recursion. | A | PASS |
| `elemental_force` | 5 | Elemental power +12% per rank, once per funded cast. | A | PASS |
| `kindling` | 5 | Funded Fire cast applies Burn. | A | PASS |
| `deep_winter` | 5 | Funded Frost: Chill, bounded burst vs chilled foe, ICD 4s; boss Chill ≤1.2s. | A | PASS |
| `overcharge` | 5 | Four funded Lightning casts discharge Static; charges persist between Realms. | A | PASS |
| `plague_rupture` | 1 | Bleed + Rot unleash a burst on critical hits (8s cooldown). | C +/− | PASS |
| `blood_ward` | 1 | Bleeding enemies generate Barrier every 5s. | C +/− | PASS |
| `hemovore` | 1 | Kills on bleeding foes heal 4% max HP. | C +/− | PASS |
| `crimson_rush` | 1 | Critical strikes against bleeding foes deal 15% bonus damage. | C +/− | PASS |
| `hex_bleed` | 1 | Funded Magic hits inflict Bleed (3s cooldown). | C +/− | PASS |
| `rot_recovery` | 1 | Defeating a rotted enemy heals 4% max HP. | C +/− | PASS |
| `rot_ward` | 1 | Rot ticks grant Barrier every 5s. | C +/− | PASS |
| `toxic_precision` | 1 | Crits inflict Poison and Rot (2s cooldown). | C +/− | PASS |
| `hex_bolt` | 1 | Funded spells against Rot deal 25% Spell Power plus one Rot tick (3s cooldown). | C +/− | PASS |
| `sanctuary` | 1 | Recovering Health grants Barrier equal to 20% of the heal. | C +/− | PASS |
| `fervent_life` | 1 | Critical strikes restore 2% maximum HP; overhealing grants Barrier (4s cooldown). | C +/− | PASS |
| `life_conduit` | 1 | Effective healing restores 4 Mana and empowers the next spell by 10% (3s cooldown). | C +/− | PASS |
| `counterstrike` | 1 | Blocking grants one 18% base-hit counterstrike. | C +/− | PASS |
| `runic_shield` | 1 | Funded elemental spells grant Barrier (3s cooldown). | C +/− | PASS |
| `spellblade` | 1 | Each funded cast empowers the next weapon hit, including Staff and Wand, by 15%. | C +/− | PASS |
| `carrion_detonation` | 1 | Consume Bleed and Rot for a bounded damage burst (8s cooldown). | C +/− | PASS |
| `crimson_pact` | 1 | Pay 2% max HP to inflict an immediate empowered Bleed (8s cooldown; requires more than 20% HP). | C +/− | PASS |
| `sanguine_reprisal` | 1 | Blocking or absorbing Barrier charges a counter-bleed. | C +/− | PASS |
| `reapers_cadence` | 1 | Critical hits on wounded bleeding enemies add a bounded finisher and restore 2 Mana (7s cooldown). | C +/− | PASS |
| `hemal_sigil` | 1 | Magic converts Bleed into elemental Fire, Frost or Lightning effects. | C +/− | PASS |
| `rot_symbiosis` | 1 | Rot ticks recover a little HP (6s cooldown). | C +/− | PASS |
| `rot_husk` | 1 | Breaking a Barrier while Rot is active grants a small new ward. | C +/− | PASS |
| `venom_shatter` | 1 | Critical hits consume Rot for a bounded burst (5s cooldown). | C +/− | PASS |
| `elemental_blight` | 1 | Fire, Frost and Lightning manipulate accumulated Rot differently. | C +/− | PASS |
| `guardians_oath` | 1 | After a Barrier shatters, heal once per Wave. | C +/− | PASS |
| `redline` | 1 | When wounded, deal a bounded burst but take increased damage briefly. | C +/− | PASS |
| `lifeweave` | 1 | Convert HP into Mana when nearly empty (8s cooldown). | C +/− | PASS |
| `iron_reversal` | 1 | A successful Block charges a heavy counter at the cost of brief vulnerability. | C +/− | PASS |
| `prismatic_rebound` | 1 | Damage absorbed by Barrier empowers your next Magic cast. | C +/− | PASS |
| `spell_surge` | 1 | A critical strike charges your next elemental cast. | C +/− | PASS |

## Dados e reprodução

- [Resumo JSON](v012-affinity-rework-results.json): grupos por tier/arma/família/raridade/Runas, métricas de draft, ranks e telemetria por ID.
- [Dados completos comprimidos](v012-affinity-rework-results.json.gz): 3.360 sessões, 580 ensaios de ranks e análise do draft. Inclui DPS/DoTs, HP/Mana, crit/block, cura/Barrier por segundo, triggers, rotas e RNG final.

```sh
npm test
npm run test:browser
npm run test:assets
node scripts/build-pvp-stats.cjs --check
node scripts/v012-affinity-combat-sim.cjs /tmp/affinity-combat.json
node scripts/v012-affinity-draft-analysis.cjs /tmp/affinity-draft.json
node scripts/v012-affinity-rank-analysis.cjs /tmp/affinity-ranks.json
```

Teste manual: slot isolado → preparar equipamento/Runas → affinity/elemento sem efeitos grátis → primeira vitória dá starter + draft → confirmar categorias/preview → refresh conserva cartas → adquirir segunda família tarde → validar pity → concluir boss sem novo draft → escolher Rune uma vez. Verificar ranks/caps, Between Realms, Static e equipamento em desktop/mobile.

CI local completa: PASS. O estado da execução hospedada do GitHub deve ser verificado após push; este relatório não pressupõe publicação ou deploy.
