# Wanderer v0.12 — Re-simulação depois do rework A/B/C e Rot-only
**Data:** 20/10/2026  
**Branch / SHA imutável:** development @ `8fe012ab0cd6b38d9f0efeb72fee209336eb28f7`  
**Estado:** simulação concluída; **sem alterações** a gameplay, main, Railway, Firebase ou saves reais.  
**Âmbito:** 3.360 Expeditions E1–E200 em combate real, não E∞. Os resultados são independentes do relatório do Codex que continha simulações pré-Rot-only.

## Método reproduzível
- Executei o motor original desta revisão: os 14 módulos JS integrados, o script inline do `index.html`, o harness inerte `tests/v012-economy-harness.cjs` e a política `scripts/v012-affinity-combat-sim.cjs` carregados diretamente de GitHub e avaliados num contexto JS isolado; não houve leituras/escritas de perfis nem ação no deployment. Foram usadas as estratégias do script canónico e o mesmo esquema de seeds/condições.
- Matriz completa: **5 tiers** (E1, E10, E50, E100, E200) × **7 armas** (Sword, Mace, Bow, Daggers, Two-Handed, Staff, Wand) × **2 raridades** (Rare, Epic) × **6 affinities iniciais** (Blood, Decay, Vitality, Aegis, Fury, Magic) × **4 estratégias** (random, mono, dual, triple) × **2 condições** (3 Runas / sem Runas) = **3.360**.
- Itens equipados completos, feitos ao tier da célula, com raridade indicada; Runas Vitality, Warding e Might ou Wisdom para Staff/Wand ao mesmo tier. Combate, loot/Bag, Realms, drafts, passivos e híbridos do código real; sem poções, sem upgrades de loot durante a Expedition, eventos recusados, descarte do excesso de Bag. Nenhuma morte/kill artificial na matriz. RNG inicial emparelhado por tier/arma/raridade/affinity, mas a ordem posterior de chamadas aleatórias diverge com as escolhas e resultados.
- Estratégias são heurísticas de navegação e seleção; `triple` **não é uma build ótima garantida**. Um seed por célula fina, 84 execuções por célula E/estratégia/runas. Valores são exploratórios, NÃO probabilidades populacionais precisas.
- **Zero erros de execução e zero timeouts reportados** nos 3.360 testes. Estes testes executam o engine JS real mas NÃO substituem CI/browser/playtest humano. O relatório do Codex documentava 209 testes PASS após Rot-only, os quais não foram reexecutados nesta re-simulação.

## Vitórias COM 3 Runas (84 execuções por estratégia e tier)
| Expedition | Random | Mono | Dual | Triple |
| --- | ---: | ---: | ---: | ---: |
| **E1** | 83/84 = 98,8% | 81/84 = 96,4% | 83/84 = 98,8% | 83/84 = 98,8% |
| **E10** | 1/84 = 1,2% | 3/84 = 3,6% | 3/84 = 3,6% | 7/84 = 8,3% |
| **E50** | 1/84 = 1,2% | 0/84 = 0% | 2/84 = 2,4% | 4/84 = 4,8% |
| **E100** | 8/84 = 9,5% | 7/84 = 8,3% | 6/84 = 7,1% | 8/84 = 9,5% |
| **E200** | 18/84 = 21,4% | 14/84 = 16,7% | 16/84 = 19,0% | 18/84 = 21,4% |
| **TODOS (n=420/estratégia)** | **111/420 = 26,4%** | **105/420 = 25,0%** | **110/420 = 26,2%** | **120/420 = 28,6%** |

## Vitórias SEM Runas (84 execuções por estratégia e tier)
| Expedition | Random | Mono | Dual | Triple |
| --- | ---: | ---: | ---: | ---: |
| E1 | 79/84 = 94,0% | 81/84 = 96,4% | 80/84 = 95,2% | 81/84 = 96,4% |
| E10 | 2/84 = 2,4% | 1/84 = 1,2% | 1/84 = 1,2% | 4/84 = 4,8% |
| E50 | 1/84 = 1,2% | 0/84 = 0% | 1/84 = 1,2% | 1/84 = 1,2% |
| E100 | 6/84 = 7,1% | 4/84 = 4,8% | 6/84 = 7,1% | 7/84 = 8,3% |
| E200 | 13/84 = 15,5% | 16/84 = 19,0% | 12/84 = 14,3% | 12/84 = 14,3% |
| **TOTAL (n=420/estratégia)** | **101/420 = 24,0%** | **102/420 = 24,3%** | **100/420 = 23,8%** | **105/420 = 25,0%** |

Impacto bruto das 3 Runas sobre o total: 446/1.680 = 26,5% win COM Runas contra 408/1.680 = 24,3% SEM Runas (+2,3 pontos percentuais, arredondamento). Isto não define o valor de todas as Runas e níveis, só do loadout fixo deste protocolo.

## Comparação com a simulação ANTERIOR do Codex (antes de Rot-only)
Valores anteriores com 3 Runas, reportados em `docs/v012-affinity-rework-report.md`, foram:
- E1: random 98,8%; mono 96,4%; dual 97,6%; triple 98,8%.
- E10: random 1,2%; mono 3,6%; dual 3,6%; triple 8,3%.
- E50: random 1,2%; mono 0%; dual 3,6%; triple 4,8%.
- E100: random 9,5%; mono 9,5%; dual 8,3%; triple 9,5%.
- E200: random 21,4%; mono 17,9%; dual 19,0%; triple 23,8%.
- Média anterior ponderada por todos os tiers com Runas: random 26,4%; mono 25,5%; dual 26,4%; triple 29,0%.
**Agora:** random 26,4%; mono 25,0%; dual 26,2%; triple 28,6%. Portanto a remoção do Poison separado resultou apenas em pequenas mudanças globais sob estas condições, sem resolver a pequena diferença entre estratégias. Existem mudanças de RNG e de rotas depois dos efeitos, por isso não atribuir mecanicamente cada vitória perdida a dano Rot.

## Affinities iniciais no E200 (com 3 Runas; 56 casos cada)
| Inicial | Vitórias | Média de Realms |
| --- | ---: | ---: |
| Blood | 8/56 = 14,3% | 8,48 |
| Decay | 9/56 = 16,1% | 7,18 |
| Vitality | 11/56 = 19,6% | 8,88 |
| Aegis | 12/56 = 21,4% | 9,11 |
| Fury | 15/56 = 26,8% | 9,29 |
| Magic | 11/56 = 19,6% | 9,29 |

A família inicial não descreve uma build pura: durante a run entram outras famílias. Não concluir que Blood/Decay são intrinsecamente mais fracas a partir desta amostra.

## Armas no E200 (com 3 Runas; 48 casos cada)
| Arma | Vitórias | Média de Realms |
| --- | ---: | ---: |
| Sword | 11/48 = 22,9% | 11,40 |
| Mace | 4/48 = 8,3% | 9,98 |
| Bow | 18/48 = 37,5% | 9,63 |
| Daggers | 22/48 = 45,8% | 11,35 |
| Two-Handed | 4/48 = 8,3% | 7,10 |
| Staff | 7/48 = 14,6% | 8,48 |
| Wand | **0/48 = 0%** | **2,98** |

**E100**: Daggers 12/48 (25%), Bow 10/48 (20,8%); Wand/Staff/Mace 0/48. **E10**: Staff/Wand 0/48; **E50**: Staff/Wand também 0/48. Os valores não são prova de que uma arma específica é fraca, pois equipamento completo, atributos, mão secundária, Mana/sustain e escala inimiga precisam de controlo adicional.

## Buildcraft efetivo no E200
- Random: 18 vitórias/84, média 8,12 Realms, pelo menos 1 híbrido em **44,0%** das runs.
- Mono: 14/84, média 8,74 Realms, pelo menos 1 híbrido em **22,6%** (apesar da prioridade mono, ofertas/rotas podem forçar outros).
- Dual: 16/84, média 8,90 Realms, pelo menos 1 **híbrido alvo** em **45,2%**.
- Triple: 18/84, média 9,05 Realms, pelo menos 1 **híbrido alvo** em **56,0%**.
- Logo até a estratégia Triple orientada a sinergia obteve híbrido alvo em apenas ~metade das runs E200; a vantagem em profundidade não se materializou em vitórias claramente superiores. Isso pode refletir (a) builds incompletas antes da derrota, (b) pouca força relativa dos híbridos, (c) combate curto e progressão de tier, (d) heurística não ótima. Medir estes fatores diretamente ANTES de buff/nerf.

## Diagnóstico e prioridades
**P1 — Curva de dificuldade da progressão:** com equipamento e 3 Runas do tier respetivo, E1 fica quase automática, E10 e E50 quase impossíveis, E100/E200 relativamente mais fáceis. Investigar curvas de HP/ATK inimigos, roll dos itens, baseline de defesa, mitigação e Mana com tiers E1/E10/E50/E100/E200; comparar dano recebido por Wave, survivability e tempo até boss. A simulação com full gear é **otimista para jogadores E1 reais sem esse equipamento** e não representa os seus primeiros passos. Não corrigir curvas com nerf aos híbridos.
**P2 — Desequilíbrio aparente por arma:** Wand (0/48 em E200; média 2,98 Realms) e Staff/Mace versus Daggers/Bow; refazer em loadouts realmente apropriados e com fontes de Mana, sem alterar armas antes de isolar confounders. Verificar 2H/offhand, armor type e stats.
**P3 — Recompensa pelo planeamento:** triple supera random em **9 vitórias nas 420 comparações com Runas**, apenas **+2,14 pp** global (28,6 vs26,4), e empata em E100/E200. Construir estratégias otimizadas **realmente alcançáveis** para Blood+Decay, Vitality+Aegis e Fury+Magic, com telemetria de pré-requisitos/Realm do primeiro híbrido, buffs/debuffs ativados e custo das Realms gastas a obter segunda family. Comparar também a mesma rota Realm e a mesma arma/gear/Rune, para medir valor dos picks em separado da navegação.
**P4 — Runas:** +2,3 pp global com loadout fixo; aferir utilidade das Runas ofensivas/defensivas com escolhas otimizadas.
**P5 — Repetir 3–10 seeds independentes por célula selecionada**, intervalos de confiança por arma/family/estratégia; não extrapolar 84 casos para meta definitiva. Exigir um ganho perceptível da build intencional SEM inviabilizar picks random.
**P6 — Playtest com poções, gear incompleto e loot realmente apanhado** para avaliar tempo da sessão e a progressão real. Neste ensaio todas as Realms com eventos foram recusadas e o gear permaneceu fixo.

## Como reproduzir na development
```sh
node scripts/v012-affinity-combat-sim.cjs /tmp/v012-affinity-post-rot.json
npm test
```
O script nativo preenche a mesma matriz integral 3.360 casos com output de rows e agregações; o presente ensaio isolado executou a mesma lógica e produziu as agregações acima. **Não** foram gravados 3.360 rows individuais na branch nesta execução, nem corridos testes Node/Chromium em ambiente local. Os 209 PASS citados são os reportados pelo Codex.

**Decisão:** nenhum ajuste de balanceamento foi aplicado; resultados destinam-se a design/testes posteriores, não a justificar deploy.
