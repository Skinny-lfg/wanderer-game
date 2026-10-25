# Wanderer v0.12 — E.3.5 Off-Hand Dagger damage sensitivity

**PASS técnico — 180 simulações, zero erros/timeout.** GitHub Actions https://github.com/Skinny-lfg/wanderer-game/actions/runs/39680354973

## Âmbito real executado
6 configurações × 30 seeds iguais, cenário sintético E200 com Epic Gear e 3 Runas; alterações ao fator de dano do golpe `offhandStrike` **só numa cópia do runtime em memória**. Nenhum código de produção ou balanceamento foi alterado. As políticas de passivos e equipamento são as do teste E.3.2.

| Variante | Vitórias/30 | DPS médio | Golpes da Off-Hand | Dano da Off-Hand |
|---|---:|---:|---:|---:|
| Dual 50% atual | 30 | 4574 | 3324 | 1407427 |
| Dual 40% | 30 | 4258 | 3544 | 1209531 |
| Dual 35% | 28 | 4100 | 3678 | 1100675 |
| Dual 30% | 25 | 3944 | 3811 | 980651 |
| Single Dagger | 2 | 2998 | 0 | 0 |
| Archer | 24 | 4132 | 0 | 0 |

### Interpretação
- 50→40%: aproximadamente −6.9% DPS, nenhuma perda de vitórias nesta amostra.
- 50→35%: aproximadamente −10.4% DPS e 2 vitórias a menos; DPS próximo do Archer.
- 50→30%: aproximadamente −13.8% DPS e 5 vitórias a menos; ajuste mais agressivo.
- A quantidade de golpes muda entre cenários porque durações e resultados de combate mudam, pelo que o dano total da Off-Hand não escala linearmente com o coeficiente.
- O cenário de 35% é um **candidato para teste alargado**, não autorização para nerf imediato. Requer maior número de seeds, vários níveis e equipamentos, e validação de que ataques secundários continuam a interagir corretamente com procs.

## Limitações / dívida de observabilidade
A componente **Rot não foi medida** nesta execução. O runtime primário mede separadamente os arrays periódicos Bleed e Burn, mas Rot pode aplicar dano por outros caminhos. Não inventar medição do Rot. As comparações por seeds não são um isolamento causal perfeito dos restantes RNGs depois de mudadas as durações das lutas.

## Próximo passo recomendado
E.3.6: repetição em E50/E100/E150/E200 com 100 seeds por coeficiente, pelo menos dois tipos de build e contadores reais de Rot/proc para validar um eventual nerf 35%, sem tocar no código de produção até aprovação explícita.
