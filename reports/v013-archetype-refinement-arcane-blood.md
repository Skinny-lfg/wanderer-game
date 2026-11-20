# Wanderer v0.13 — experiência Arcane/Aegis e Blood sustain

**Estado:** alterações apenas aos perfis de agentes de simulação na branch `audit/v013-stage6`. Nenhuma mudança ao combate, valores dos talentos, loot ou estatísticas do jogo. Sem merge nem deploy.

## Alterações efetivamente aplicadas

- **Leather Duelist:** continua Fury+Blood, Leather e Daggers/Bow. Ordem de investimento: `quick_hands`, `bleeding_edge`, `blood_drinker`, `precision`, `double_strike`, `blood_harvest`, `crimson_rush`. Continua a procurar `red_guillotine` e a usar target focus. Não mudaram os limiares de cura/retirada nem o risco.
- **Hexblade Hybrid:** continua a preferir Decay+Magic como Affinities de escolha dos Realms, Leather e Daggers/Wand. Removido o elemento Frost, passando ao modo Arcane por defeito. Os pontos de Aegis são objetivos secundários explícitos, **não** uma terceira Affinity de Realm: `toxic_touch`, `arcane_focus`, `affinity_aegis`, `mana_spring`, `guarded_block`, `arcane_resonance`, `hex_bolt`, `barrier_pulse`, `arcane_surge`, `arcane_mastery`. Continua a procurar `grave_bloom` quando for possível. Sem mudanças de risco ou retirada.

## Efeitos nativos verificados

- `Blood Drinker` regenera em ataques contra alvos com Bleed, cooldown de 4 s; rank 1 com limite de 0,8% Max HP por ativação (+0,25 pontos percentuais por rank) e também limitado pelo dano do golpe.
- `Blood Harvest` restaura 3% Max HP em mortes de inimigos com Bleed.
- `Arcane Resonance`, `Arcane Surge`, `Arcane Mastery` dão +5%, +8%, +12% Spell Power, respetivamente, **mas apenas após serem comprados**. Arcane por defeito não concede automaticamente os três bónus.
- A Affinity Aegis concede Barrier inicial igual a 5% Max HP + 8% Spell Power; `Guarded Block` funciona sem escudo. São características existentes do jogo, não buffs deste teste.

## Comparação com Stage 04 — as mesmas 12 sementes (11001–11012)

| Perfil | E1 vencido, configuração anterior | E1 vencido, refinada | E5 vencido, anterior | E5 vencido, refinada | E20 vencido |
|---|---:|---:|---:|---:|---:|
| Leather Duelist | 5/12 | **5/12** | 0/12 | 0/12 | 0/12 em ambas |
| Hexblade Hybrid | 7/12 | **7/12** | 0/12 | 0/12 | 0/12 em ambas |

### Talentos realmente adquiridos no final das 12 contas refinadas

| Talent | Contas com esse talent |
|---|---:|
| Leather: Blood Drinker | 3/12 |
| Leather: Blood Harvest | 1/12 |
| Hexblade: Affinity Aegis | 6/12 |
| Hexblade: Guarded Block | 2/12 |
| Hexblade: Barrier Pulse | **0/12** |
| Hexblade: Arcane Resonance, Surge ou Mastery | **0/12** |

A primeira tentativa de configuração do Hexblade tratou Aegis como uma terceira Affinity principal e atrasou o investimento defensivo, causando **0/12** vitórias em E1. Foi corrigida. A configuração final mantém o padrão da configuração Frost original no E1 (**7/12**), mas não melhora a progressão até E5 nesta amostra.

## Interpretação

- A proposta do utilizador é coerente e altera o estilo sem tornar as builds automaticamente vencedoras.
- As novas fontes de cura e defesa continuam a ser relativamente tardias, devido às pré-requisitos e ao XP natural disponível. **Nenhuma conta desta amostra comprou os bónus Arcane de Spell Power**.
- Os resultados não justificam aumentar artificialmente stats, oferecer XP/equipamento ou mexer nos coeficientes do jogo.
- O experimento testa contas naturais emparelhadas por semente/perfil, mas as escolhas de talentos alteram decisões e RNG posteriores; não é um replay do mesmo combate.

## Evidência

- [Stage 04 original, 12 sementes Adaptive](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44787333743)
- [Primeira revisão Arcane+Aegis, não aceite por regressão E1](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44795112278)
- [Revisão com Aegis secundário antecipado — 12 lotes concluídos, três testes aprovados, zero erros](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44795574453)

**Sem alterações a main nem deploy.**
