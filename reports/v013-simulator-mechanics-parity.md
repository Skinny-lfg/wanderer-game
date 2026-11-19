# Wanderer v0.13 — Auditoria de cobertura do simulador (19/11/2026)

> **Atualização Stage S1 (19/11/2026):** as lacunas prioritárias de upgrade permanente de tier, escolha de elementos Magic, preparação de talentos avançados e reset de talentos foram implementadas **no simulador** da `audit/v013` e verificadas em **56/56 testes**, incluindo Chromium/VM. Esta matriz documenta o estado **anterior à S1**; consultar [Relatório de implementação S1](v013-s1-native-simulator-parity.md) e [execução de testes](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44631558946). Continuam por completar as lacunas S2/S3 de diversidade de decisões e cobertura estatística.

**Branch:** `audit/v013`. **Objetivo:** confrontar as regras executáveis da versão atual com (A) motor de combate controlado `scripts/simulate-progression.cjs` e (B) agente persistente `scripts/v013-natural-progression.cjs`. Sem alterações a gameplay, coeficientes, `main`, Firebase ou saves. A verificação é por inspeção do código, cruzamento automático de módulos e testes existentes; **não é uma demonstração formal de cada estado possível**.

## Resultado executivo

**O simulador controlado reutiliza o motor nativo** de combate, progressão de combate e dungeon, mas **a experiência de jogador simulada é incompleta**. Regras ativadas em encontros reais produzem resultados reais; só que dezenas de caminhos não são ativados, adquiridos, equipados ou escolhidos pelos agentes. Assim, é inadequado concluir equilíbrio global de E5/E10/E20 com base apenas em win rates de simulações controladas. A versão natural usa uma conta real a partir de E1 mas apenas três políticas de decisão, sem adaptação completa de builds, upgrades de tier, runas, consumíveis e Forge.

Classificação: **Nativa** = motor do jogo executado, desde que seja atingido o estado; **Parcial** = regra disponível mas seleção/exposição limitada; **Ausente** = ação essencial não executada pelo simulador; **Fora de escopo** = isolamento intencional, sem impacto direto nos números de combate.

## Matriz 1 — Combate e inimigos

| Mecânica executável atual | Combate controlado | Progressão natural | Constatação / risco de interpretação |
|---|---|---|---|
| Estatísticas STR/AGI/INT/END/CHA, HP, mana, ataque, defesa | Nativa | Nativa | `totalStats` e combate reais; política de gearScore ignora/atribui pesos grosseiros a vários atributos |
| Sete armas: Sword, Mace, Bow, Daggers, Two-Handed, Staff, Wand; offhand/shield/orb, cadência | Nativa | Parcial | Só 7 builds fixas no controlado; 3 perfis naturais; muitos pares e armaduras nunca escolhidos propositadamente |
| Crítico, Dodge/Evasion, Armor/Block, Barrier, ataque normal vs cast financiado e fallback sem mana | Nativa | Nativa | `updateFight` e `weaponAttack` reais; impactos especiais exigem instrumentação para medir frequência |
| Bleed, Rot, Burn, Frost/slow, Lightning chain, DoT, AoE e propagação ao morrer | Nativa | Parcial | Regras reais quando equipadas/desbloqueadas; natural não tem perfis especializados Magic/Decay ou elemental |
| Árvore de Talentos v15 (343 nós), pré-requisitos, XP e exclusões | Parcial | Parcial | Usa `T.allocate` nativo; controlado começa por omissão com 24 pontos artificiais, natural usa XP legítima, mas só explora subconjuntos |
| **Preparação de habilidade avançada** (`progress.prepared`) | **Ausente** | **Ausente** | Interface permite `WandererTreeAPI.prepare`; ambos os agentes nunca selecionam `prepared`, logo efeitos dependentes dessa seleção podem ficar inativos |
| Seleção Fire/Frost/Lightning e especializações | Parcial | **Ausente como estratégia** | Controlado tem apenas Magic Fire (Wand) e Lightning (Staff); Frost não aparece nas builds predefinidas. Natural não seleciona elementos nem segue caminhos Magic |
| Reset completo de talentos / mudança de build entre Expedições | Ausente | **Ausente** | Runtime tem `WandererAutomaticTalents.reset` e UI; `actions.resets` do agente natural fica sem ações |
| 12 equipamentos Legendary e respetivos procs/cooldowns | Nativa se equipados | Parcial | Cálculo real no combate, mas nenhum programa garante cobertura por Legendary, raridade, afinidade e nível |
| Traits de item forjado (5) | Nativa se equipadas | Parcial | Mecânicas reais; agente faz no máximo duas crafts por Camp, nem sempre obtém receitas/traits para as testar |
| Inimigos normais: 6 Affinities, 4 roles e 18 abilities ativas (tank/skirmisher/caster) | Nativa | Nativa se encontrados | Roleta/roster reais; `roles` pode avaliar amostras controladas, mas política natural não garante representatividade de cada ability |
| Elites: 7 arquétipos, incluindo Gravecaller/Rotbound Exarch/Ashen Executioner | Nativa | Nativa se encontrados | Atributos, summons, Deathbound e cooldowns são reais; cohorts emparelhados forçam apenas tipo de encontro, não frequência no mapa |
| Bosses: 6 estilos e minions/wards/heals/interrupts | Nativa | Nativa quando realmente alcançados | `bosses` percorre estilos com procura de seeds; natural pode nem chegar ao Boss, censurando levels posteriores |
| Encounter Traits (6) | Nativa | Nativa se geradas | Modo `traits` injeta uma trait controlada, podendo ignorar compatibilidade natural de Affinity e localização |
| Boss Modifiers (6) e conflitos | Nativa | Nativa se gerados | Modo `bossmods` injeta combinações compatíveis; frequência e coocorrência natural não são inferidas |
| Expedition Conditions (6) | Nativa | Nativa se geradas | `conditions` percorre risco/card, mas teste controlado pode mover posição diretamente para chegar a Marked room |
| Retarget manual / prioridade de minions | Parcial | Parcial | Controlado decide a cada tick; natural só a cada 8 ticks. Nenhum representa tempos humanos reais ou exploração tática completa |
| Efeitos visuais da arena, animações, combat-links e Action Bar | Fora de escopo | Fora de escopo | Módulos marcados como visual-only; omissão não invalida por si só estatísticas de combate |

## Matriz 2 — Dungeon, recursos e economia

| Mecânica executável atual | Combate controlado / rota única | Progressão natural | Constatação / risco de interpretação |
|---|---|---|---|
| 3 dificuldades Guarded, Dangerous e Brutal (18/20/22 salas, 14/13/12 passos) | Nativa / amostragem controlada | **Parcial** | Perfis cautious/balanced tendem a Guarded, daring a Dangerous; não há perfil natural dirigido a Brutal |
| Mapa procedural, atalhos, Fog, scouting, condições de passos | Nativa | Nativa, com heurística | Controlado usa rota mais curta; natural usa `travelPath` e `travelCost`, mas heurísticas não abrangem todas as estratégias |
| Escolha de Realm Card por Affinity/risco | Parcial | Parcial | Controlado escolhe por afinidade pré-fixada ou risco solicitado; natural tem apenas três estilos de decisão |
| Boon Shrines e 6 Boons | Nativa, mas seleção `none`/`first` | Parcial | Natural pontua 6 opções, faz reroll com Fate em casos específicos; falta cruzar Boons com todas as builds |
| 4 Contracts, objetivos e recompensas exclusivas | Nativa, escolha `none`/`first` | Parcial | Natural tem prioridades fixas e tenta objetivos elegíveis; não explora todas as estratégias e planos |
| 9 eventos: Merchant, Collector, Altar, Idol, Arsenal, Bounty, Spring, Oracle, Reliquary | Nativa se encontrados | Parcial | Controlado testa opções `[2,0,1]`; natural usa prioridades específicas para alguns e fallback genérico. Nem todos os eventos/options têm cohorts completos |
| Marked Elite, Forgotten Reliquary e Boss preparation | Nativa ou fixtures | Nativa se explorados | O modo `bossprep` aplica preparação na primeira sala controlada sem fazer visita natural às salas opcionais |
| HP/Mana entre salas, descanso/Spring, combate e extraction | Nativa | Nativa | Conta natural decide retirar-se por limiares heurísticos; pode bloquear artificialmente acesso ao Boss apesar de gameplay legal |
| Loot aleatório, raridades, drops Grey, reagents, Essence, Fragments, Gold e XP | Nativa | Nativa | Nenhum drop garantido no Dungeon; sim controlado usa equipamento sintético de entrada, mas o natural acumula recompensas reais |
| Equipar loot entre salas e vendas/salvage | **Não** no modo rota | Parcial | Natural equipa por `gearScore`, vende excedentes e preserva a bolsa; scoring não valoriza adequadamente alguns affixes e efeitos |
| Merchant, compra, renovação de stock | Não em modo isolado | Parcial | Compra até duas peças por Camp, sem estratégia completa de reroll de Merchant, nem previsão robusta de sinergias |
| Apothecary (13 poções), compra, 3 slots, uso entre salas | Não automático no controlado | **Parcial** | Natural prioriza e usa um subconjunto: Health, Mana, Ironhide, Barrier, Scout, Trail, Purifying e Fate; falta estratégia ativa para Might, Haste, Fortune, Veilsight, Arcane |
| Crafting por Blueprint, Forge, 5 traits, custos, desbloqueio por Affinity | Não na rota isolada | Parcial | Usa `WandererV013Crafting.prepareCraft` legítimo, mas tenta só 2 peças por Camp e `focus=none` |
| **Focus de Forge: Spellweave, Quickstep, Bulwark** | **Ausente no cenário** | **Ausente** | Há custo e benefícios em `WandererV013Crafting`, mas `craftEarned` nunca escolhe focus |
| **Refino de reagents: 3 dry rooms + 6 Essence** | **Ausente** | **Ausente** | Interface chama `WandererV013Crafting.refine`; agente não usa |
| **Upgrade permanente do tier do equipamento em E5/15/35/70** | **Não carregado** | **Ausente** | O módulo live `economy/v013-tier-upgrade.js` NÃO figura no harness VM; UI/Forge possui transação `WandererV013TierUpgrade.prepare`. Existe teste unitário separado, mas não entra na economia de contas simuladas. **Maior lacuna de progressão** |
| Reforço Legendary (+ranks), custo Fragments | Ausente nos roteiros | Ausente | UI/runtime `reinforceEquipment` existe; nenhum agente investe nesse upgrade |
| Runes: 8 famílias, 3 slots, boss rewards, reciclagem | Sintéticas quando `--runes=true` | **Parcial** | Natural reivindica runas obtidas e runtime auto-equipa no primeiro slot livre; porém não substitui runa fraca após os slots encherem nem recicla duplicados estrategicamente |
| Upgrades de capacidade da Stash, overflow, Bag lock e salvamento de saque | Nativa se entradas acionadas | Parcial | Natural faz salvage/claim/discard reais, mas nunca compra melhoria de capacidade. A poupança e os ganhos são políticas incompletas |
| Checkpoint, retoma de sessão, saves, anti-duplicação, Firebase | **Fora de escopo na simulação** | Fora de escopo | O harness substitui `phase5Persist` após boot; regressões de saves/checkpoints e regras existem noutros testes, não em simulações estatísticas |
| Progressão **E1–E20 de conta real**, talismãs, Runas, Gold e derrota | Sim sintético sem acumulação entre E | **Nativa + política parcial** | Natural só avança após Boss real e preserva conta; E5/E10/E20 são `not_reached` se falhar E anterior, não vitórias simuladas de jogadores nesses levels |

**Nota sobre poções:** o jogo não permite livre uso de Health/Mana durante combate. O simulador natural não as usar a meio de um ataque **não é um bug de paridade**, e não deve ser corrigido com poderes artificiais. Os estados válidos são preparação, entre salas e janelas especiais que a API permite.

## Comparação automática das entradas do navegador com o harness

Inspeção de `index.html` e `tests/v012-economy-harness.cjs` no HEAD auditado:

- 47 `<script src>` ativos no jogo;
- 34 listados nos módulos VM do harness; **mais 2 Talent modules pré-carregados por `require()`**, logo não estão realmente ausentes.
- Omissões deliberadas: `combat/action-bar.js`, `combat/arena-hud.js`, `online/v013-map-fog.js`, `online/v013-combat-links.js`, `online/v012-gothic-panels.js`, autenticação/conta/feedback/leaderboard; o último grupo precisa de tests próprios, não de reintroduzir Firebase.
- **Omissão funcional inequívoca:** `economy/v013-tier-upgrade.js`, mais a interface `online/v013-tier-upgrade-ui.js`. Trata-se de progressão de equipamento, não de efeito puramente visual.
- O `tests/v013-runtime-parity.test.cjs` compara traces no Chromium e no VM para **um** combate controlado (Wand, runa Wisdom, 12 mobs, alvo alterado e casts). Esse teste **não está** na seleção `npm run test:v013` nem listado explicitamente nos 4 jobs C7; a sua existência não demonstra cobertura de todos os caminhos.
- `tests/v013-tier-upgrade.test.cjs` **está** em `npm run test:v013`; isto prova que a mecânica isolada tem regressões, **não** que o agente a utiliza.

## Problemas de cobertura estatística e medição

1. **Ausência de matriz de exposição por mecânica.** Há métricas úteis de danos, bosses, summons, roles e loot. Mas um total de sucessos sem contagens por `talentId`, `preparedId`, `runeFamily`, `legendaryId`, `potionKind`, `forgeFocus`, `gearTierUpgrade`, `bossStyle`, `conditionId` e `eventChoice` não distingue “o efeito é fraco” de “nunca foi ativado”.
2. **Enviesamento por builds e equipamento sintéticos.** O modo `encounter` gera peças Rare nos vários slots e atribui 24 pontos permanentes por omissão, incluindo em E1. Isto serve comparação *controlada*, não representatividade de jogadores novos. As 7 builds não cobrem as 12 builds de referência do documento de design, nem todos os híbridos, árvores focused/mixed, Cloth/Leather/Plate, atributos ou elementos.
3. **Agentes de progressão estreitos.** Há apenas três perfis `cautious`, `balanced`, `daring`. Nenhum escolhe uma build de mago, Frost, Decay puro, mudanças de classe, reset de talentos ou preparo avançado. A pontuação `gearScore` não incorpora várias propriedades, inclusive velocidade `spd`, Charisma, Mana, bonificações de crítico, efeitos Legendary/traits e interações com passivos. Pode descartar ou ignorar itens objetivamente melhores.
4. **Amostra e censura.** O natural permite `--max-level=20`, mas defaults são E1–E8 com dois seeds e dois perfis. Apenas um Boss vencido desbloqueia o E seguinte. É correto censurar os níveis não alcançados, mas é incorreto interpretar uma simulação de E20 sem alcançar E20 como evidência de dificuldade em E20.
5. **Paridade browser/VM parcial.** O harness altera DOM, relógio, RNG, persistência e animações de forma deliberada. A comparação atual de um único trace deve alargar-se a multi-room, morte/extraction, mudança de equipamento, prepared abilities, Boons, item upgrades, todos os Bosses e Elites. Os testes individuais existentes não substituem estes casos integrados.

## Ordem recomendada — antes do grande balanceamento

### P0 — Confiança e cobertura de progressão

1. Adicionar **`WandererV013TierUpgrade` ao harness** e ação de upgrade nativa no Camp. Comparar escolhas de forjar nova peça vs subir tier da peça atual.
2. Adicionar decisões legais de **prepared advanced ability, escolha Fire/Frost/Lightning, reset total** e perfis focused/hybrid, sempre usando `WandererAutomaticTalents` e XP reais.
3. Construir perfis de personagens que cubram **7 armas, 3 armaduras, offhand/shields/orbs, 6 Affinities, elementos Magic e híbridos**, sem obrigar todas as combinações artificiais a existir naturalmente. Avaliar dano/mitigação *com* e *sem* sinergias.
4. Fazer os agentes decidirem runas reais (8 famílias), upgrades/substituições, e poções efetivamente disponíveis (13 tipos) com consumo apenas em estados legais.
5. Acrescentar à telemetria por seed **o que ficou disponível, o que foi escolhido, o que ativou e quantas vezes**. Falhas de cobertura não devem aparecer como equilíbrio neutro.

### P1 — Economia e adversários

6. Cobrir refino de reagentes, Forge Focus, Legendary +rank e efeitos de todos os 12 Legendary; testar *gasto por recurso* e impacto líquido em vários patamares.
7. Amostrar explicitamente todas as **18 abilities de classes inimigas**, os 7 Elites, 6 Bosses, 6 Conditions, 6 Traits, 6 Boss Modifiers, 6 Boons, 4 Contracts e 9 eventos, em contextos naturais e controlados separados. Medir coocorrências, cooldowns, recasts, summons e mitigação.
8. Ampliar a paridade Chromium/VM para cenários multirroom e decisões de Camp/Forge/talentos. Integrar a prova relevante no gate técnico obrigatório depois de estabilizada.

### P2 — Só depois: balanceamento

9. Medir coortes persistentes E1→E5→E10→E20, repetição de tentativas, taxas de extração, build swaps, gastos, loot, equipamento, dificuldades Guarded/Dangerous/Brutal e razões de morte. Agrupar por seed e perfil; **separar** falha de agente, erro técnico, morte legítima, timeout e nível não alcançado.
10. Com cobertura confirmada, ajustar Elites/Bosses, E1/E5/E10/E20, economia e sinergias. **Não alterar balanceamento com amostras onde prepared/upgrade/runa/crafting não foram sequer usados.**

## Validação de auditoria executada no GitHub Actions

[**Paridade do simulador — execução 44629608521 (aprovada)**](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44629608521). Feita em `audit/v013`, sem deploy, sem alterar gameplay, sem credenciais Firebase. Resultados: `npm run test:v013:sim` **7/7**; comparador VM/Chromium + testes de Tier Upgrade **9/9**; testes de progressão natural e escolhas **21/21**. Total de **37/37 testes** executados neste gate isolado, com comparação de um trace real de combate no navegador.

A execução automática conferiu **47 scripts ativos** em `index.html`, **36 scripts VM** contando os dois módulos Talent extra carregados, e identificou **11 imports live não reproduzidos no VM**: sobretudo UI, conta/Firebase, mapa e FX; entre eles, a omissão funcional do **`economy/v013-tier-upgrade.js`**. O valor `TIER_UPGRADE_LOADED_IN_SIMULATOR=false` foi confirmado no CI.

**Correção no próprio teste de auditoria:** a primeira execução [44629334624](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44629334624) falhou porque o caminho do Chromium não foi exportado para a etapa que executava Playwright; foi corrigido na configuração do workflow de auditoria, **não no jogo**, e o gate acima passou integralmente. Nenhum desvio de lógica de combate foi confirmado nessa falha inicial.

---

## Ficheiros inspecionados

- `index.html`; `tests/v012-economy-harness.cjs`; `scripts/simulate-progression.cjs`; `scripts/v013-natural-progression.cjs`; `scripts/v013-elite-tank-parity.cjs`.
- `combat/v012-combat-runtime.js`, `combat/v012-combat-core.js`, `combat/v012-buildcraft.js`, `combat/v012-gear-stats.js`, `combat/talent-graph-next.js`, `combat/talent-graph-runtime.js`, `combat/talent-graph-bridge.js`, `combat/v012-runes.js`, `combat/legendary.js`.
- `combat/v013-expedition-foundation.js`, `online/v012-expedition-controller.js`, `online/v012-expedition-runtime.js`, `online/v013-enemy-roster.js`, `online/v013-enemy-abilities.js`, `online/v013-elite-abilities.js`, `online/v013-boss-infrastructure.js`, `online/v013-boss-abilities.js`, `online/v013-boss-preparation.js`, `online/v013-expedition-conditions.js`, `online/v013-encounter-traits.js`, `online/v013-expedition-boons.js`, `online/v013-expedition-contracts.js`, `online/v012-expedition-events.js`, `online/v012-consumables.js`.
- `economy/v012-equipment-runtime.js`, `economy/v012-loot-rules.js`, `economy/v013-crafting.js`, `economy/v013-gear-rolls.js`, `economy/v013-tier-upgrade.js`, `online/v013-tier-upgrade-ui.js`; testes do simulador, paridade, economia, talentos, Bosses e longitudinal.

**Conclusão:** motor nativo adequado como referência numérica, mas **simulador de jogador/progressão não está completo**. A recomendação é fechar os P0 antes de gerar milhões de corridas ou tocar no balanceamento. O Firebase não precisa de ser ativado para nenhuma destas correções.
