# Wanderer v0.12 — Fase D.6: balanceamento Endless

Estado: implementado em `development`, sem deploy. Base: `53b84a1`.

## Fórmulas definitivas

- Inimigos acima de E200: `1 + 0.005 × (E - 200)` sobre a referência E200 (inalterado).
- Atributos numéricos de equipamento e Runas acima de E200: `1 + 0.0048 × (tier - 200)` sobre a referência E200. O multiplicador é aplicado uma vez na criação/cálculo do atributo; percentagens, efeitos especiais, velocidade e custos mantêm as regras existentes.
- Dano do golpe da arma: `round(dano × (1 + máximo × clamp((E - 200) / 100, 0, 1)))`, aplicado antes de somar dano independente de efeitos. E200 e níveis inferiores recebem 0%.

| Configuração equipada | Máximo em E300+ | E201 | E250 |
| --- | ---: | ---: | ---: |
| Daggers + Off-Hand Dagger (ou Daggers antigo) | 30% | 0,3% | 15% |
| Sword + Shield | 20% | 0,2% | 10% |
| Mace + Shield | 30% | 0,3% | 15% |
| Wand + Orb | 15% | 0,15% | 7,5% |

O cálculo consulta o equipamento ativo em cada golpe; remover ou trocar qualquer peça exigida elimina imediatamente o bónus. `base`, crítico, procs, Second Strike, passivos, DoTs e dano independente não recebem o multiplicador. Equipamento antigo conserva os seus atributos guardados; Runas restauradas continuam válidas e usam a fórmula atual de `runeValue`.

## Validação dirigida

- `node --check` dos três ficheiros de combate alterados: PASS.
- `node --test tests/v012-phase-d-endless.test.cjs tests/v012-complete-combat.test.cjs tests/v012-complete-runes.test.cjs tests/v012-save.test.mjs`: PASS (4 ficheiros). Verifica E199/E200/E201/E500/E1000, escalamento único, fórmula gradual, combinações de slots, saves isolados, combate, Runas, progressão e sete resultados de combate E200 idênticos à auditoria anterior.
- Quatro resultados E300 reproduziram exatamente a simulação gradual D.5 (Realm, dano e número de ataques).
- Amostra pareada de 20 corridas de produção em E201/E250/E300/E500/E1000, quatro armas, comparada com D.4/D.5: **140/140 métricas idênticas**, incluindo vitórias, dano, DPS, ataques, críticos e Blocks; zero erros e timeouts. As matrizes D.4/D.5 não foram repetidas.

## Limites conhecidos

- As combinações Blood/Decay com Sword ou Mace e Decay com Daggers continuaram fracas nas auditorias D.4/D.5. Esta fase não altera Affinities nem balanceamento até E200.
- A amostra de regressão confirma paridade com as simulações aprovadas, mas não substitui uma auditoria de balanceamento futura com mais seeds.
