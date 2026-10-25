# Wanderer v0.12 — E.3.2 Atribuição de Dano por Mecanismo

**PASS técnico: 180 Expeditions instrumentadas, 0 erros, sem alterações do motor de produção.**

Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39677836714

## Método

6 configurações × 30 seeds iguais por configuração em E200, gear Epic sintético e runas, sem poções. Uma cópia **só em memória** do módulo `combat/v012-combat-runtime.js` recebe contadores internos via `moduleOverrides`, sem alterar código da aplicação. Também se instrumenta uma cópia em memória de `scripts/v012-affinity-combat-sim.cjs` para exportar os campos `e32`. Mede golpes de Main Hand, Off-Hand, dano direto após defesa inimiga, contra-ataques base de Shield e Barrier criada por Orb Ward.

| Build | Vitórias /30 | DPS médio | Main hits | Off hits | Main direct damage | Off direct damage | Counters | Counter nominal damage | Orb Wards | Orb Barrier |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Dual Daggers | 30 | 4574 | 3683 | 3324 | 2275413 | 1407427 | 0 | 0 | 0 | 0 |
| Single Dagger | 2 | 2998 | 3987 | 0 | 2551659 | 0 | 0 | 0 | 0 | 0 |
| Wand + Orb | 15 | 3552 | 2050 | 0 | 3216863 | 0 | 0 | 0 | 172 | 23028.3 |
| Wand only | 0 | 2218 | 1354 | 0 | 1467738 | 0 | 0 | 0 | 0 | 0 |
| Sword + Shield | 15 | 2545 | 2844 | 0 | 3704749 | 0 | 238 | 178704 | 0 | 0 |
| Sword only | 0 | 1336 | 571 | 0 | 779904 | 0 | 0 | 0 | 0 | 0 |

## Interpretação

- Dual Daggers: 3324 golpes de Off-Hand efetivos e 1 407 427 pontos de dano direto contabilizados, 38.2% da soma do dano direto dos golpes Main+Off (não inclui dano de DoT, procs e golpes adicionais). A redução do dano individual da Off-Hand para 50% **não equivale** a reduzir em 50% o dano total da build, porque acrescenta um golpe em grande parte dos ataques. Ainda não se isolou Bleed / proc por mão.
- Orb Ward: 172 aplicações bem-sucedidas de Barrier, 23028.3 Barrier criada. Este número não é necessariamente Barrier absorvida, e o teste não isolou a contribuição do atributo Spell Power.
- Sword + Shield: 238 contra-ataques base; 178704 de dano nominal pré-aplicação, portanto **não** equipará-lo a dano efetivo contra HP, sobretudo com Barrier e overkill. Outros efeitos de Shield não estão incluídos.
- Vitórias com e sem Off-Hand não controlam todas as diferenças de atributos e passivos. Os resultados demonstram a contribuição dos mecanismos mas não estabelecem uma correção de balanceamento a fazer já.

## Decisão

Sem mudanças de dano, atributos, cooldowns ou probabilidade de drop. Próxima E.3.3 pode instrumentar dano de Bleed e procs por origem e neutralizar diferenças de stats para comparação realmente causal (Dual vs single, Wand+Orb vs Staff, Shield counter vs defesa). Manter exclusivamente `development`; não tocar main, Firebase, saves reais.
