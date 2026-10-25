# Wanderer v0.12 — E.3.3 Bleed, Procs e Passivos

**PASS técnico — 180 simulações instrumentadas, 0 erros.**

Execução: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39679110948

## Método
Seis configurações E200 × 30 seeds comuns; simulações independentes, sem poções. Instrumentação da cópia em memória do runtime de combate, não do motor de produção. Regista Main/Off Hand, DoT global (não apenas Bleed), contagens de Bleed ticks, danos diretos de procs e mapa `metrics.procs`. Os `procCounts` são *ocorrências/eventos*, não dano individual.

| Configuração | Vitórias | DPS médio | DoT combinado | Dano direto de efeitos | Bleed ticks |
|---|---:|---:|---:|---:|---:|
| Dual Daggers | 30/30 | 4574 | 38199 | 364822 | 304 |
| Single Dagger | 2/30 | 2998 | 35746 | 352624 | 311 |
| Wand + Orb | 15/30 | 3552 | 149096 | 140373 | 11 |
| Wand sem Orb | 0/30 | 2218 | 62348 | 32661 | 5 |
| Sword + Shield | 15/30 | 2545 | 4055 | 207743 | 13 |
| Sword sem Shield | 0/30 | 1336 | 247 | 999 | 0 |

## Procs selecionados

- Dual Daggers: 442 Bleed applications, 836 Double Strike, 19 Static Discharges; Single Dagger: 457 Bleed applications, 926 Double Strike, 16 Static Discharges. Totais brutos diferem por duração e número de encontros, não são rates por ataque.
- Wand + Orb: 372 Spellblade, 125 Static Discharge, 546 Burn applications, 87 Spell Surge. Sem Orb: 28 Spellblade, 61 Static Discharge, 268 Burn applications, 17 Spell Surge.
- Sword + Shield: 238 Shield Counterattack, 69 Counterstrike, 69 Iron Reversal. Sem Shield: zero dessas ativações.

## Caveats fundamentais
1. `dotDamage` inclui ticks agregados de DoT (Bleed, Burn, etc.), **não é dano exclusivamente de Bleed**. Os `bleedTicks` são ticks em que havia Bleed, mas cada tick pode agregar dano de outros efeitos. Não afirmar que 38199 são 38199 pontos de Bleed.
2. `directProcDamage` mede o dano efetivamente passado por `setDirectEnemyDamage` (capped pela vida restante), incluindo contra-ataques, Double Strike e efeitos mágicos. Não equivale necessariamente a total de passivos; alguns passivos reforçam dano direto sem passar por esta função.
3. A comparação sem Off-Hand altera simultaneamente atributos, resistência, perfis de combate e sequência RNG, e portanto não é causalmente atribuível a um único passivo.
4. A presença de `double_strike` em Single Dagger não é bug por si só: o mecanismo é ligado à Main Dagger, não estritamente à Off-Hand.
5. Números de proc sem normalização por ataques, segundos e combates podem ser enganadores.

## Decisão
**Não alterar balanceamento.** A E.3.4 deverá separar DoT por tipo (Bleed vs Burn/Rot), normalizar procs por 100 ataques e, caso se queira atribuição causal do efeito de Off-Hand, manter estatísticas iguais entre variantes e medir dano de golpes isolados. Não tocar em main, Firebase ou saves.
