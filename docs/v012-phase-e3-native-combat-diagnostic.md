# Wanderer v0.12 — E.3 Native Combat Diagnosis

**PASS técnico — 240 simulações, 0 erros.**
Run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39676424186

## Metodologia
Oito configurações × 30 seeds comuns, início sintético E200, equipamento Epic E200, três runas, sem poções, decisões de passivos planeadas. O simulador usa o motor real e agrega damage dealt / elapsed time, dano recebido, duração total, ataques, bloqueios e chances iniciais. Mudanças de Off-Hand são *comparações de build completa*, não isolamento de um único atributo: remover Shield, Orb ou Off-Hand Dagger altera simultaneamente stats e comportamento. DPS médio é a média das razões por tentativa e pode refletir durações diferentes, não throughput num combate idêntico e fixo.

| Variante | Vitórias/30 | DPS médio | Dano recebido médio | Tempo médio | Ataques médios | Incoming médio | Bloqueios médios |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Battlemage Wand+Orb | 15 | 3551.63 | 5571.4 | 32.74 | 68.33 | 7.63 | 0.07 |
| Battlemage Wand sem Orb | 0 | 2217.53 | 5746.87 | 23.34 | 45.13 | 9.07 | 0 |
| Mage Staff | 23 | 3905.64 | 4834.3 | 33.39 | 70.53 | 6.1 | 0.03 |
| Assassin Dual Daggers | 30 | 4573.58 | 2697.67 | 29.82 | 122.77 | 2.87 | 0 |
| Assassin apenas Main Hand | 2 | 2997.6 | 5638 | 32.76 | 132.9 | 12.13 | 0 |
| Tank Sword+Shield | 15 | 2545.2 | 9782.1 | 51.56 | 94.8 | 22.07 | 10.47 |
| Tank sem Shield | 0 | 1336.28 | 5752.3 | 19.4 | 19.03 | 9.67 | 0.23 |
| Archer Bow | 24 | 4131.94 | 3936.53 | 32.63 | 133.23 | 4.13 | 0 |

## Atributos de exemplo: início da primeira seed
- Wand + Orb: Spell Power 1521, Mana 3151, HP 5343, Power 9478. Sem Orb: Spell Power 1011, Mana 2478, HP 5343, Power 8611.
- Dual Daggers e single Dagger partem ambos de Speed 4.2, Evasion Rating 1930, Attack 1091 e Power 8016 no primeiro combate; isto torna relevante investigar especificamente o papel da Off-Hand e dos efeitos de duas armas, não apenas o score de Power.
- Tank com Shield: HP 7053, Defense 1709, Block Chance 48, Speed 1.6048; sem Shield: HP 5343, Defense 1284, Block Chance 0, Speed 0.986.
- Archer: Attack 1162, Speed ~3.86, Evasion Rating 1930, Power 8147.

## Interpretação e próximos diagnósticos
1. Dual Daggers: 30/30 vs 2/30 sem Off-Hand, com diferença grande em DPS e número de ataques inimigos recebidos. Examinar as funções que introduzem second-strike, bleed, dodge e eventos de procs para identificar exatamente o que acontece ao remover a Off-Hand. Não presumir bug.
2. Battlemage: Wand+Orb 15/30, ainda inferior a Staff 23/30 neste setup. Controlar Spell Power e Mana em variante futura (separar efeito numérico do Orb do efeito de sinergias).
3. Tank: muito mais tempo exposto aos inimigos; comparar dano recebido por ataque inimigo e redução efetiva, não total bruto. Shield agrega HP/Defense/Block/Speed.
4. Antes de balancear, executar alternativas com equipamento de poder próximo, seeds repetidas e logging por ação para distinguir atributos, efeitos da Off-Hand e escolhas de passivos.

Não foram alterados scripts de produção, Gold, drops, main, Firebase nem saves reais. Esta fase apenas criou script de auditoria e workflow em development.
