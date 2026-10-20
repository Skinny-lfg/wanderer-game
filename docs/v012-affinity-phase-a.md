# FASE A — Rework completo dos 33 passivos normais

**Status:** especificação de implementação, sem alterações ao gameplay por este documento. **Fonte:** combat/v012-buildcraft.js na development, incluindo UI/persistência/testes. **Valores abaixo:** baseline inicial sujeita a simulação posterior.

## Regras gerais
- Rank máximo **5** para efeitos numéricos que ganham valor real em cada rank; Rank **1** para talentos que só desbloqueiam uma habilidade única.
- **29 normais Rank5 e 4 normais Rank1**. Starter de cada família conta como Rank1 e é garantido após **primeira Realm vencida dessa família**, seguido de draft de três opções na mesma Realm. Nada de efeitos grátis ao escolher affinity/entrar.
- Não permitir comprar um rank sem ganho real, inclusive se cap de crit/block/DR/attack speed já foi atingido por outras fontes. Preview deve calcular ganho efetivo.
- Notação: r=rank 1..5; base=dano do hit antes de procs; power=Spell Power de cast financiado; HP%=percentagem de HP máximo do jogador. ICD=cooldown interno; DoT continua limitado por duração/stacks já usados. Todos os incrementos multiplicativos são aplicados **uma vez** por trigger e sem recursão.

## Blood — cinco talentos
| ID | Rank máx. | Efeito proposto para Codex |
| --- | ---: | --- |
| bleeding_edge | 5 | Starter. Hit causa Bleed com 42/46/50/54/58% chance em R1..5, ICD 0,9s; Bleed=16% base por tick antes de Deep Cuts. |
| deep_cuts | 5 | Todos os Bleeds do jogador causam +15% por rank (R5 +75%), incluindo outros passivos; não reaplicar multiplicador a um stack em cada tick. |
| executioner | 1 | Contra alvo com Bleed e HP <=30%, burst min(32% base, 2,5% MaxHP inimigo), ICD 6s. |
| blood_drinker | 5 | Hit em alvo com Bleed cura min([0,8%+0,25%×(r−1)] MaxHP, [10%+2,5%×(r−1)] base), ICD 4s, Healing Reduction aplicável. |
| sanguine_fury | 5 | Critical hit aplica Bleed de 14% base e dano direto extra [8%+2%×(r−1)] base, ICD 2,5s. Corrigir descrição antiga que prometia +8% contra Bleed sem lógica implementada. |

## Decay — cinco talentos
| ID | Rank máx. | Efeito |
| --- | ---: | --- |
| toxic_touch | 5 | Starter. Hit tem 42/46/50/54/58% chance de aplicar Poison=12% base + Rot=6,5% base, ICD 1,3s. Continuar cap 6 Rot stacks × 4 ticks. |
| virulent_rot | 5 | Dano de Rot +15% por rank (R5 +75%), aplicado uma vez quando o stack é criado. |
| wasting_curse | 5 | Enquanto Rot ativo, alvo causa 4% menos dano por rank (R5 −20%), sujeito ao cap conjunto de redução de dano. |
| wither | 5 | Enquanto Rot ativo: healing inimigo −20/30/40/50/60% e dano direto do alvo −2% por rank, sujeito ao cap conjunto de DR. Não reduzir cura do jogador. |
| blight | 1 | Hit em alvo com Rot causa burst min(38% base, 2,5% MaxHP inimigo), ICD 7s. |

## Vitality — cinco talentos
| ID | Rank máx. | Efeito |
| --- | ---: | --- |
| strong_heart | 5 | Starter. MaxHP × [1+0,10×sqrt(r)]. Alterar MaxHP não pode criar cura infinita por equip/unequip. |
| renewal | 5 | Heal contínuo 0,55%×sqrt(r) MaxHP/s, cap próprio 1,25%/s; Healing Reduction aplicável. |
| last_stand | 1 | Uma única sobrevivência a golpe fatal por Expedition, restaurando 6% MaxHP. Não rearmar ao trocar Realm/refresh. |
| second_breath | 5 | Ao concluir cada Wave, heal [1,5%+0,4%×(r−1)] MaxHP (R5 3,1%), apenas uma vez por waveKey. |
| life_bloom | 5 | A cada segundo heal 0,25%×sqrt(r) MaxHP e regen 1,5×sqrt(r) Mana; caps 0,6% MaxHP/s e 3,4 Mana/s; não exceder recursos. |

## Aegis — cinco talentos
| ID | Rank máx. | Efeito |
| --- | ---: | --- |
| iron_skin | 5 | Starter. Defense × [1+0,12×sqrt(r)], preview com Defense final. |
| fortified | 5 | Redução de dano recebido 4% por rank, até 20% no R5, dentro do cap global temporário de 28%. Nenhuma melhoria sem ganho efetivo. |
| guarded_block | 5 | Bonus Block Chance = round[24×(1−exp(−r/4))] pontos percentuais, cap total Block 65%; Block Reduction original. |
| barrier_pulse | 5 | A cada 6s, Barrier de [2%+0,6%×(r−1)] MaxHP, R5 4,4%, dentro do cap total do motor. |
| retaliation | 1 | Barrier realmente absorvida prepara próximo ataque para +15% base; consumir uma única vez, sem procs recursivos. |

## Fury — cinco talentos
| ID | Rank máx. | Efeito |
| --- | ---: | --- |
| quick_hands | 5 | Starter. Attack Speed × [1+0,08×r], até 5 ataques/s; não permitir rank sem ganho quando cap atingido. |
| precision | 5 | Critical Chance extra round[19×(1−exp(−r/3))] pontos percentuais, cap total 65%. |
| brutal_crit | 5 | Critical real acrescenta min(65%,12%×sqrt(r)) base em dano extra; sem novos críticos/procs. |
| double_strike | 5 | Chance min(60%,10%×sqrt(r)) de um hit extra 30% base; extra não gera Double Strike, outros procs ou críticos. |
| adrenaline | 5 | Critical real ativa Attack Speed +[10%+2,5%×(r−1)] durante 3s (R5 +20%), ICD 3s; cap velocidade respeitado. |

## Magic — oito talentos
| ID | Rank máx. | Efeito |
| --- | ---: | --- |
| arcane_focus | 5 | Elemental Spell Power × [1+0,15×sqrt(r)]. Funciona para Staff, Wand e cast financiado com qualquer arma. |
| mana_spring | 5 | Mana Regen × [1+0,12×sqrt(r)], reduzindo a inflação anterior de mana. |
| efficient_cast | 5 | Custo de cast funded temporário: **7/6/5/4/3 Mana** em R1..5, custo base 8. Corrigir ranks inúteis criados por arredondamentos anteriores. |
| arcane_echo | 5 | Cada quarto hit elemental funded gera eco de **25/30/35/40/45% power**, sem recursão ou hits grátis contados. |
| elemental_force | 5 | Power elemental temporário × [1+0,12×r], aplicar UMA vez por cast funded; incluir status e demais efeitos correspondentes. |
| kindling | 5 | Starter Fire. Burn por cast funded = 15% power × [1+0,15×r]. Apenas elemento Fire escolhido. |
| deep_winter | 5 | Starter Frost. Chill em casts funded; contra alvo chilled, burst a cada 4s = min([18%+3%×(r−1)] power, 1,5% MaxHP boss ou 5% MaxHP normal). Chill boss <=1,2s. |
| overcharge | 5 | Starter Lightning. Quatro casts funded geram Static burst = min([32%+6%×(r−1)] power, 3,5% MaxHP inimigo). Charges entre Realms, sem procs gratuitos, respeitar persistência. |

## Integração e critérios de aceitação
1. Atualizar catálogo, mods/onAttack/onCast/onSecond/onKill/incoming/survive/nextCost e descrições de UI. Não duplicar regras em HTML; manter fonte única de rank/efeito.
2. Manter IDs exatamente como acima. Numericamente comparar R1→R2→R3→R4→R5 nas condições de trigger apropriadas; verificar ganho >0 em **cada etapa** dos 29 escaláveis, sem exigir aumento de dano a skills defensivas.
3. Os 4 únicos (executioner, blight, last_stand, retaliation) só podem surgir em Rank1. Todos os 29 restantes ≤Rank5; upgrades R5→R6 rejeitados por choose(), eligible(), UI, events e validação de save.
4. Não invalidar checkpoints já existentes com ranks antigos acima de R5; criar versão/migração segura ou permitir fechar a run legacy com effectiveRank limitado, sem redistribuir picks nem tocar em saves reais durante testes.
5. Preservar caps globais (Crit65%, Block65%, AttackSpeed5, mitigação temporária28%, Rot6 stacks, Barrier do motor), timers e anti-duplicação.
6. Gerar testes unitários automáticos para os 33 IDs, incluindo cooldown, paid/free cast, effect actual vs tooltip e refresh. **Nenhum TODO e nenhum rank morto.**
