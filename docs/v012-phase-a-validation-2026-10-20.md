# Wanderer v0.12 — Fase A: validação e simulações pareadas

**Data:** 2026-10-20
**Branch:** `development`
**Base pré-Fase A:** `f805c0a` (UX39 committed, sem Fase A)
**Escopo:** validação; nenhum coeficiente foi alterado durante as simulações.

## Método

- Script base: `scripts/v012-armor-archetypes-sim.cjs` + `scripts/v012-affinity-combat-sim.cjs`, executado em snapshots isolados pré e pós-Fase A. A matriz temporária acrescentou Leather Two-Handed e métricas Mana, attacks/s e Evasion; nenhum script de balanceamento do repositório foi alterado.
- 7 níveis × 7 configurações × 2 rarities × 8 sementes × 2 políticas (triple e random) = **1.568 execuções por snapshot / 3.136 total**. Seed offset `29,000,000`; mesma semente e configuração nos pares.
- Equipamento completo Rare ou Epic do mesmo nível, runas Vitality + Warding + Might (armas físicas) ou Wisdom (Staff/Wand), todas do nível correspondente. Não equipa Legendaries nem usa poções; eventos são recusados. 15 Realms por Expedition.
- Builds de affinities: Cloth `Magic + Aegis + Decay`; Plate `Vitality + Aegis + Fury`; Leather `Decay + Fury + Blood`. Os agentes são heurísticos; as políticas random/triple são resultados de agentes sintéticos, não probabilidades de jogadores. As seeds são pareadas, mas as sequências RNG podem divergir após alterações no combate.
- Mana pool é lido nas stats do primeiro combate; Mana final é o recurso restante no fim da Expedition. Block mostra chance da ficha no primeiro combate e percentagem de ataques inimigos bloqueados durante a execução. Evasion % é calculada pela fórmula efetiva do runtime com `EVASION_SCALE=20` e o teto de 30%.

## Resultado agregado

| Medida | Antes | Fase A | Diferença |
|---|---:|---:|---:|
| Vitórias | 28.76% | 25.57% | -3.19 pp |
| Realms médias | 9.43 | 9.93 | 0.5 |
| DPS médio | 680.27 | 676.47 | -3.8 |
| Healing/s | 1.817 | 2.663 | 0.846 |
| Barrier/s | 2.46 | 3.044 | 0.583 |
| Attacks/s observados | 1.574 | 1.51 | -0.064 |
| Mana pool inicial | 274.01 | 274.01 | 0 |
| Mana final | 276.66 | 276.29 | -0.37 |
| Block chance | 9.09% | 9.12% | 0.03 pp |
| Bloqueios observados | 13.15% | 13.23% | 0.07 pp |
| Evasion estimada | 12.5% | 12.5% | 0 pp |

Foram 451/1568 vitórias pré-Fase A e 401/1568 pós-Fase A. Os dois lotes terminaram sem erros e sem timeouts. A média de Realms subiu embora a taxa agregada de vitória tenha descido; por isso a tabela seguinte mantém nível e rarity separados.

## Comparação por nível, rarity e configuração

### E1

| Rarity | Configuração | Clears (pré → pós) | Realms (pré → pós) | DPS (pré → pós) | Heal/s (pré → pós) | Barrier/s (pré → pós) | Attacks/s (pré → pós) | Mana pool / final (pré → pós) | Block chance / real (pré → pós) | Evasion (pré → pós) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rare | Cloth Staff | 16/16 → 16/16 | 15 → 15 | 61.18 → 61.17 | 0.13 → 0.13 | 1.281 → 1.288 | 1.019 → 1.019 | 159 → 159 / 97.06 → 97.06 | 0.63 → 0.63% / 0 → 0% | 0 → 0% |
| Rare | Cloth Wand/Orb | 16/16 → 16/16 | 15 → 15 | 39.49 → 47.65 | 0.25 → 0.099 | 0.407 → 0.48 | 1.136 → 1.147 | 150 → 150 / 19.98 → 18.79 | 0.88 → 0.31% / 0.66 → 0% | 0 → 0% |
| Rare | Plate Mace/Shield | 16/16 → 16/16 | 15 → 15 | 32.8 → 35.81 | 1.172 → 1.463 | 0.273 → 0.183 | 0.653 → 0.638 | 0 → 0 / 5.72 → 11.93 | 22 → 22.31% / 21.48 → 25% | 0 → 0% |
| Rare | Plate Sword/Shield | 16/16 → 16/16 | 15 → 15 | 39.92 → 41.01 | 1.423 → 1.463 | 0.268 → 0.389 | 0.983 → 1.003 | 0 → 0 / 7.54 → 4.85 | 15 → 15% / 14.6 → 16.81% | 0 → 0% |
| Rare | Leather Dual Daggers | 16/16 → 16/16 | 15 → 15 | 51.8 → 51.8 | 0.364 → 0.364 | 0.047 → 0.056 | 2.046 → 2.046 | 0 → 0 / 0.61 → 0.61 | 0.31 → 0.31% / 0 → 0% | 30 → 30% |
| Rare | Leather Bow | 16/16 → 16/16 | 15 → 15 | 56.29 → 56.29 | 0.276 → 0.273 | 0.084 → 0.116 | 1.554 → 1.554 | 0 → 0 / 7.1 → 7.1 | 1.19 → 1.19% / 1.32 → 1.32% | 30 → 30% |
| Rare | Leather Two-Handed | 16/16 → 16/16 | 15 → 15 | 57.21 → 57.21 | 0.291 → 0.291 | 0.868 → 0.887 | 0.836 → 0.836 | 0 → 0 / 4.53 → 4.53 | 0.94 → 0.94% / 0.68 → 0.68% | 30 → 30% |
| Epic | Cloth Staff | 16/16 → 16/16 | 15 → 15 | 65.9 → 65.89 | 0.174 → 0.157 | 1.372 → 1.386 | 1.036 → 1.036 | 161 → 161 / 90.9 → 90.9 | 0 → 0% / 0 → 0% | 0 → 0% |
| Epic | Cloth Wand/Orb | 16/16 → 16/16 | 15 → 15 | 42.2 → 49.76 | 0.248 → 0.208 | 0.633 → 0.588 | 1.144 → 1.158 | 152 → 152 / 23.77 → 26.32 | 2.06 → 1.56% / 1.07 → 1.02% | 0 → 0% |
| Epic | Plate Mace/Shield | 16/16 → 16/16 | 15 → 15 | 34.18 → 36.51 | 1.285 → 1.376 | 0.28 → 0.208 | 0.669 → 0.653 | 0 → 0 / 1.62 → 0.48 | 22.63 → 22.31% / 22.28 → 25.63% | 0 → 0% |
| Epic | Plate Sword/Shield | 16/16 → 16/16 | 15 → 15 | 41.75 → 42.04 | 1.4 → 1.418 | 0.188 → 0.23 | 1.029 → 1.027 | 0 → 0 / 5.83 → 5.54 | 15.31 → 15.31% / 12.02 → 13.91% | 0 → 0% |
| Epic | Leather Dual Daggers | 16/16 → 16/16 | 15 → 15 | 56.28 → 56.28 | 0.592 → 0.592 | 0.06 → 0.069 | 2.003 → 2.003 | 0 → 0 / 1.1 → 1.1 | 1.19 → 1.19% / 0.74 → 0.74% | 30 → 30% |
| Epic | Leather Bow | 16/16 → 16/16 | 15 → 15 | 62.49 → 62.49 | 0.373 → 0.373 | 0.067 → 0.076 | 1.569 → 1.569 | 0 → 0 / 1.1 → 1.1 | 0.81 → 0.81% / 1.41 → 1.41% | 30 → 30% |
| Epic | Leather Two-Handed | 16/16 → 16/16 | 15 → 15 | 65.47 → 65.47 | 0.208 → 0.215 | 0.923 → 0.982 | 0.87 → 0.871 | 0 → 0 / 1.06 → 1.06 | 0.88 → 0.88% / 0 → 0% | 30 → 30% |

### E5

| Rarity | Configuração | Clears (pré → pós) | Realms (pré → pós) | DPS (pré → pós) | Heal/s (pré → pós) | Barrier/s (pré → pós) | Attacks/s (pré → pós) | Mana pool / final (pré → pós) | Block chance / real (pré → pós) | Evasion (pré → pós) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rare | Cloth Staff | 3/16 → 3/16 | 14.38 → 14.56 | 98.61 → 98.97 | 0.312 → 0.317 | 1.808 → 1.842 | 1.032 → 1.032 | 216 → 216 / 174.25 → 175.42 | 0.31 → 0.31% / 0 → 0% | 0 → 0% |
| Rare | Cloth Wand/Orb | 0/16 → 1/16 | 8.56 → 11.56 | 67.49 → 79.62 | 0.011 → 0.273 | 0.254 → 0.53 | 1.124 → 1.106 | 212 → 212 / 141.43 → 148.09 | 0 → 0% / 0 → 0% | 0 → 0% |
| Rare | Plate Mace/Shield | 8/16 → 5/16 | 13.75 → 13.94 | 58.4 → 59.54 | 2.192 → 2.265 | 0.475 → 0.556 | 0.651 → 0.637 | 0 → 0 / 9 → 1.49 | 23.31 → 23.63% / 22.89 → 22.01% | 0 → 0% |
| Rare | Plate Sword/Shield | 6/16 → 6/16 | 11.75 → 13.13 | 60.32 → 62.73 | 1.639 → 1.768 | 0.35 → 0.556 | 1.014 → 1.025 | 0 → 0 / 2.01 → 7.28 | 16.31 → 16.63% / 17.29 → 16.67% | 0 → 0% |
| Rare | Leather Dual Daggers | 2/16 → 2/16 | 14.13 → 14.13 | 90.45 → 90.45 | 0.149 → 0.149 | 0.013 → 0.013 | 2.439 → 2.439 | 0 → 0 / 2.79 → 2.79 | 1.44 → 1.44% / 1.05 → 1.05% | 27.62 → 27.62% |
| Rare | Leather Bow | 4/16 → 4/16 | 14.13 → 14.13 | 87.23 → 87.23 | 0.314 → 0.314 | 0.073 → 0.073 | 1.608 → 1.608 | 0 → 0 / 8.83 → 8.83 | 0.94 → 0.94% / 0.31 → 0.31% | 27.62 → 27.62% |
| Rare | Leather Two-Handed | 4/16 → 4/16 | 14.38 → 14.38 | 90.72 → 90.75 | 0.164 → 0.164 | 1.23 → 1.277 | 0.877 → 0.877 | 0 → 0 / 5.12 → 5.14 | 0.63 → 0.63% / 0.31 → 0.3% | 27.62 → 27.62% |
| Epic | Cloth Staff | 12/16 → 12/16 | 15 → 15 | 107.16 → 107.29 | 0.352 → 0.352 | 2.365 → 2.399 | 1.034 → 1.034 | 226 → 226 / 185.33 → 184.94 | 1.75 → 1.75% / 1.04 → 1.04% | 0 → 0% |
| Epic | Cloth Wand/Orb | 0/16 → 6/16 | 12.81 → 14.63 | 75.29 → 87.8 | 0.035 → 0.317 | 0.425 → 0.859 | 1.128 → 1.117 | 220 → 220 / 119.19 → 145.44 | 0 → 0.31% / 0 → 0% | 0 → 0% |
| Epic | Plate Mace/Shield | 15/16 → 14/16 | 15 → 15 | 63.52 → 66.86 | 2.397 → 2.35 | 0.374 → 0.096 | 0.659 → 0.664 | 0 → 0 / 15.75 → 16.34 | 23.88 → 23% / 25.71 → 20.7% | 0 → 0% |
| Epic | Plate Sword/Shield | 12/16 → 13/16 | 14.75 → 14.69 | 70.62 → 71.62 | 2.792 → 2.613 | 0.29 → 0.427 | 1.057 → 1.049 | 0 → 0 / 0.11 → 0.11 | 16 → 16% / 16.8 → 17.42% | 0 → 0% |
| Epic | Leather Dual Daggers | 14/16 → 14/16 | 15 → 15 | 107.51 → 107.5 | 0.073 → 0.073 | 0.176 → 0.224 | 2.405 → 2.405 | 0 → 0 / 1.73 → 1.73 | 1.75 → 1.75% / 1.18 → 1.18% | 30 → 30% |
| Epic | Leather Bow | 11/16 → 11/16 | 15 → 15 | 104.92 → 104.92 | 0.344 → 0.344 | 0 → 0 | 1.662 → 1.662 | 0 → 0 / 3.23 → 3.23 | 0 → 0% / 0 → 0% | 30 → 30% |
| Epic | Leather Two-Handed | 16/16 → 16/16 | 15 → 15 | 104.78 → 104.78 | 0.326 → 0.326 | 1.334 → 1.334 | 0.935 → 0.935 | 0 → 0 / 1.82 → 1.82 | 0.56 → 0.56% / 0.64 → 0.64% | 30 → 30% |

### E10

| Rarity | Configuração | Clears (pré → pós) | Realms (pré → pós) | DPS (pré → pós) | Heal/s (pré → pós) | Barrier/s (pré → pós) | Attacks/s (pré → pós) | Mana pool / final (pré → pós) | Block chance / real (pré → pós) | Evasion (pré → pós) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rare | Cloth Staff | 0/16 → 0/16 | 6.44 → 6.44 | 130.53 → 130.53 | 0.037 → 0.037 | 2.038 → 2.038 | 0.997 → 0.997 | 285 → 285 / 280.3 → 280.3 | 0 → 0% / 0 → 0% | 0 → 0% |
| Rare | Cloth Wand/Orb | 0/16 → 0/16 | 3.25 → 5.38 | 89.02 → 108.28 | 0 → 0.046 | 0 → 0.137 | 1.105 → 1.131 | 278 → 278 / 271.2 → 267.32 | 0 → 0% / 0 → 0% | 0 → 0% |
| Rare | Plate Mace/Shield | 0/16 → 0/16 | 6.19 → 6.25 | 72.84 → 77.99 | 1.111 → 1.087 | 0.172 → 0.188 | 0.616 → 0.618 | 0 → 0 / 1.93 → 2.02 | 25 → 25% / 23.65 → 25.46% | 0 → 0% |
| Rare | Plate Sword/Shield | 0/16 → 0/16 | 5.5 → 5.5 | 73.9 → 76.32 | 1.43 → 1.264 | 0.032 → 0.362 | 0.938 → 0.933 | 0 → 0 / 4.53 → 0.74 | 18 → 18% / 19.54 → 21.19% | 0 → 0% |
| Rare | Leather Dual Daggers | 0/16 → 0/16 | 7.38 → 7.38 | 121.98 → 121.98 | 0.147 → 0.147 | 0.026 → 0.04 | 2.429 → 2.429 | 0 → 0 / 1.52 → 1.52 | 0 → 0% / 0 → 0% | 27.69 → 27.69% |
| Rare | Leather Bow | 0/16 → 0/16 | 10.5 → 10.5 | 133.69 → 133.69 | 0.284 → 0.284 | 0.031 → 0.031 | 1.847 → 1.847 | 0 → 0 / 3.24 → 3.24 | 0 → 0% / 0 → 0% | 27.69 → 27.69% |
| Rare | Leather Two-Handed | 0/16 → 0/16 | 10.31 → 10.31 | 140.76 → 140.76 | 0.116 → 0.116 | 1.509 → 1.524 | 0.926 → 0.926 | 0 → 0 / 1.25 → 1.25 | 0.31 → 0.31% / 0 → 0% | 27.69 → 27.69% |
| Epic | Cloth Staff | 3/16 → 3/16 | 12.38 → 12.25 | 146.3 → 146.71 | 0.48 → 0.48 | 3.019 → 3.04 | 1.011 → 1.012 | 299 → 299 / 295.38 → 295.67 | 0.31 → 0.31% / 0.37 → 0.37% | 0 → 0% |
| Epic | Cloth Wand/Orb | 0/16 → 0/16 | 7.19 → 9.75 | 105.29 → 126.85 | 0.009 → 0.035 | 0.367 → 0.702 | 1.126 → 1.132 | 290 → 290 / 282.22 → 279.46 | 0.31 → 0.94% / 0 → 0% | 0 → 0% |
| Epic | Plate Mace/Shield | 0/16 → 1/16 | 11.63 → 13.19 | 86.77 → 94.91 | 2.147 → 2.546 | 0.303 → 0.849 | 0.655 → 0.64 | 0 → 0 / 10.64 → 16.05 | 25.31 → 25.31% / 23.67 → 28.65% | 0 → 0% |
| Epic | Plate Sword/Shield | 1/16 → 1/16 | 10.44 → 10.5 | 88.83 → 91.05 | 2.797 → 2.323 | 0.247 → 0.446 | 0.952 → 0.926 | 0 → 0 / 6.47 → 7.05 | 18 → 18.31% / 18.25 → 19.71% | 0 → 0% |
| Epic | Leather Dual Daggers | 0/16 → 0/16 | 14.38 → 14.38 | 163.04 → 163.04 | 0.152 → 0.152 | 0 → 0 | 2.594 → 2.594 | 0 → 0 / 3.87 → 3.87 | 0 → 0% / 0 → 0% | 30 → 30% |
| Epic | Leather Bow | 5/16 → 5/16 | 14.25 → 14.25 | 164.43 → 164.46 | 0.87 → 0.87 | 0.224 → 0.307 | 1.891 → 1.891 | 0 → 0 / 2.12 → 2.12 | 0.63 → 0.63% / 0.32 → 0.32% | 30 → 30% |
| Epic | Leather Two-Handed | 7/16 → 7/16 | 15 → 15 | 168.6 → 169.54 | 0.824 → 0.777 | 2.211 → 2.241 | 0.973 → 0.974 | 0 → 0 / 3.29 → 3.11 | 1.44 → 0.88% / 0 → 0.3% | 30 → 30% |

### E25

| Rarity | Configuração | Clears (pré → pós) | Realms (pré → pós) | DPS (pré → pós) | Heal/s (pré → pós) | Barrier/s (pré → pós) | Attacks/s (pré → pós) | Mana pool / final (pré → pós) | Block chance / real (pré → pós) | Evasion (pré → pós) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rare | Cloth Staff | 0/16 → 0/16 | 4.13 → 5.56 | 240.5 → 274.16 | 0.051 → 0.069 | 3.886 → 4.177 | 0.982 → 1.116 | 489 → 489 / 487.81 → 487.42 | 0.63 → 1.13% / 0 → 0.71% | 0 → 0% |
| Rare | Cloth Wand/Orb | 0/16 → 0/16 | 1.13 → 1.5 | 160.49 → 196.5 | 0 → 0 | 0 → 0 | 1.126 → 1.101 | 480 → 480 / 479.54 → 479.48 | 0 → 0% / 0 → 0% | 0 → 0% |
| Rare | Plate Mace/Shield | 0/16 → 0/16 | 4 → 4.81 | 138.29 → 156.32 | 1.432 → 2.468 | 0.118 → 0.414 | 0.612 → 0.648 | 0 → 0 / 3.6 → 2.65 | 29 → 29.31% / 29.8 → 31.85% | 0 → 0% |
| Rare | Plate Sword/Shield | 0/16 → 0/16 | 2.94 → 3.44 | 132.24 → 152.58 | 2.186 → 2.043 | 0.122 → 0.166 | 0.892 → 0.989 | 0 → 0 / 2.7 → 3.94 | 22 → 22% / 22.91 → 24.22% | 0 → 0% |
| Rare | Leather Dual Daggers | 0/16 → 0/16 | 4.31 → 4.31 | 278.58 → 278.58 | 0.113 → 0.113 | 0.044 → 0.066 | 3.012 → 3.012 | 0 → 0 / 3.74 → 3.74 | 0 → 0% / 0 → 0% | 28.26 → 28.26% |
| Rare | Leather Bow | 0/16 → 0/16 | 7.19 → 7.38 | 311.11 → 310.76 | 0.122 → 0.122 | 0.108 → 0.158 | 2.291 → 2.291 | 0 → 0 / 0.75 → 0.75 | 0 → 0% / 0 → 0% | 28.26 → 28.26% |
| Rare | Leather Two-Handed | 0/16 → 0/16 | 6.75 → 6.75 | 295.21 → 295.21 | 0.153 → 0.153 | 2.717 → 2.742 | 1.044 → 1.044 | 0 → 0 / 0 → 0 | 0.94 → 0.94% / 0.54 → 0.54% | 28.26 → 28.26% |
| Epic | Cloth Staff | 0/16 → 0/16 | 6.19 → 9 | 278.92 → 311.74 | 0.17 → 0.27 | 4.764 → 5.055 | 0.998 → 1.123 | 520 → 520 / 518.69 → 517.7 | 0 → 0.31% / 0 → 0% | 0 → 0% |
| Epic | Cloth Wand/Orb | 0/16 → 0/16 | 3.63 → 5.38 | 188.46 → 239.12 | 0.091 → 0.024 | 0.256 → 0.105 | 1.124 → 1.112 | 506 → 506 / 504.36 → 504.3 | 0 → 0% / 0 → 0% | 0 → 0% |
| Epic | Plate Mace/Shield | 0/16 → 0/16 | 8.56 → 10.38 | 166.47 → 190.5 | 3.511 → 5.024 | 0.726 → 1.393 | 0.63 → 0.685 | 0 → 0 / 16.09 → 11.26 | 29.56 → 29.31% / 30.84 → 33.55% | 0 → 0% |
| Epic | Plate Sword/Shield | 0/16 → 0/16 | 5.19 → 6.75 | 164.36 → 189.42 | 2.229 → 3.768 | 0.496 → 0.731 | 0.927 → 1.031 | 0 → 0 / 1.44 → 8.19 | 22 → 22% / 20.57 → 22.69% | 0 → 0% |
| Epic | Leather Dual Daggers | 0/16 → 0/16 | 11.31 → 10.75 | 372.03 → 361.31 | 0.542 → 0.542 | 0.216 → 0.267 | 3.115 → 3.017 | 0 → 0 / 6.33 → 6.33 | 1.19 → 1.19% / 0 → 0% | 30 → 30% |
| Epic | Leather Bow | 2/16 → 2/16 | 12.31 → 12.31 | 398.15 → 398.33 | 0.256 → 0.256 | 0.223 → 0.276 | 2.347 → 2.349 | 0 → 0 / 3.44 → 3.44 | 1.13 → 1.13% / 0 → 0% | 30 → 30% |
| Epic | Leather Two-Handed | 2/16 → 2/16 | 12.94 → 12.94 | 366.62 → 366.62 | 0.172 → 0.172 | 3.578 → 3.645 | 1.068 → 1.068 | 0 → 0 / 1.76 → 1.76 | 0.88 → 0.88% / 0.74 → 0.74% | 30 → 30% |

### E50

| Rarity | Configuração | Clears (pré → pós) | Realms (pré → pós) | DPS (pré → pós) | Heal/s (pré → pós) | Barrier/s (pré → pós) | Attacks/s (pré → pós) | Mana pool / final (pré → pós) | Block chance / real (pré → pós) | Evasion (pré → pós) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rare | Cloth Staff | 0/16 → 0/16 | 2.94 → 3.69 | 395.75 → 531.49 | 0.026 → 0.017 | 6.825 → 7.149 | 0.976 → 1.263 | 851 → 851 / 850.86 → 849.42 | 0 → 0% / 0 → 0% | 0 → 0% |
| Rare | Cloth Wand/Orb | 0/16 → 0/16 | 1.81 → 2.44 | 300.94 → 421.45 | 0 → 0 | 0 → 0 | 1.097 → 1.257 | 842 → 842 / 841.93 → 839.97 | 0 → 0.31% / 0 → 0% | 0 → 0% |
| Rare | Plate Mace/Shield | 0/16 → 0/16 | 2.25 → 3.56 | 224.82 → 288.6 | 2.317 → 3.547 | 0 → 0 | 0.589 → 0.692 | 0 → 0 / 1.86 → 5.04 | 37 → 37% / 41.59 → 34.47% | 0 → 0% |
| Rare | Plate Sword/Shield | 0/16 → 0/16 | 2.44 → 2.88 | 234.34 → 277.42 | 2.762 → 2.786 | 0 → 0.354 | 0.895 → 0.989 | 0 → 0 / 0.93 → 0.15 | 30 → 30% / 33.64 → 33.8% | 0 → 0% |
| Rare | Leather Dual Daggers | 0/16 → 0/16 | 5.13 → 4.44 | 527.44 → 490.87 | 0.158 → 0.158 | 0 → 0 | 3.266 → 3.016 | 0 → 0 / 6.44 → 6.35 | 0 → 0% / 0 → 0% | 28.3 → 28.3% |
| Rare | Leather Bow | 0/16 → 0/16 | 5.81 → 5.94 | 707.4 → 576.88 | 0.273 → 0.255 | 0 → 0.138 | 3.007 → 2.455 | 0 → 0 / 3.51 → 0.06 | 0.31 → 0.31% / 0 → 0% | 28.3 → 28.3% |
| Rare | Leather Two-Handed | 0/16 → 0/16 | 7.06 → 7.06 | 661.09 → 661.09 | 0.26 → 0.26 | 5.574 → 5.725 | 1.316 → 1.316 | 0 → 0 / 7.66 → 7.66 | 0 → 0% / 0 → 0% | 28.3 → 28.3% |
| Epic | Cloth Staff | 0/16 → 0/16 | 5.31 → 7.31 | 488.7 → 625.03 | 0.568 → 0.16 | 8.927 → 9.835 | 0.985 → 1.261 | 911 → 911 / 910.29 → 908.71 | 0.81 → 0.31% / 0 → 0% | 0 → 0% |
| Epic | Cloth Wand/Orb | 0/16 → 0/16 | 2.75 → 4.25 | 348.99 → 477.41 | 0 → 0 | 0 → 0.954 | 1.113 → 1.273 | 892 → 892 / 891.64 → 889.72 | 0 → 0.31% / 0 → 0.63% | 0 → 0% |
| Epic | Plate Mace/Shield | 0/16 → 0/16 | 7.5 → 9.44 | 286.75 → 365.41 | 7.526 → 8.138 | 1.043 → 1.925 | 0.624 → 0.741 | 0 → 0 / 12.33 → 20.67 | 37.31 → 37.56% / 35.35 → 32.28% | 0 → 0% |
| Epic | Plate Sword/Shield | 0/16 → 0/16 | 4.31 → 6.88 | 289.96 → 351.66 | 5.034 → 5.595 | 0.291 → 1.832 | 0.909 → 1.046 | 0 → 0 / 14.73 → 12.19 | 30 → 30% / 27.39 → 32.75% | 0 → 0% |
| Epic | Leather Dual Daggers | 4/16 → 0/16 | 13.25 → 11.69 | 767.47 → 663.22 | 1.001 → 0.935 | 0.541 → 0.818 | 3.557 → 3.017 | 0 → 0 / 17.68 → 17.53 | 0.31 → 0.31% / 0.43 → 0.38% | 30 → 30% |
| Epic | Leather Bow | 11/16 → 0/16 | 14.81 → 10.88 | 951.56 → 761.55 | 3.162 → 0.75 | 0.136 → 0.35 | 3.204 → 2.483 | 0 → 0 / 24.92 → 29.36 | 1.13 → 0.31% / 0 → 0% | 30 → 30% |
| Epic | Leather Two-Handed | 7/16 → 7/16 | 14.06 → 14.31 | 868.4 → 869.09 | 1.598 → 2.442 | 6.628 → 6.914 | 1.372 → 1.371 | 0 → 0 / 26.13 → 26.28 | 0.63 → 0.63% / 0 → 0.41% | 30 → 30% |

### E100

| Rarity | Configuração | Clears (pré → pós) | Realms (pré → pós) | DPS (pré → pós) | Heal/s (pré → pós) | Barrier/s (pré → pós) | Attacks/s (pré → pós) | Mana pool / final (pré → pós) | Block chance / real (pré → pós) | Evasion (pré → pós) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rare | Cloth Staff | 0/16 → 0/16 | 3.69 → 6.06 | 795.69 → 1270.13 | 0 → 0.06 | 12.365 → 12.875 | 0.987 → 1.538 | 1560 → 1560 / 1559.56 → 1557.59 | 0 → 0% / 0 → 0% | 0 → 0% |
| Rare | Cloth Wand/Orb | 0/16 → 0/16 | 1.13 → 2.25 | 540.33 → 897.75 | 0 → 0 | 0 → 0 | 1.088 → 1.482 | 1551 → 1551 / 1551 → 1549.14 | 0 → 0% / 0 → 0% | 0 → 0% |
| Rare | Plate Mace/Shield | 0/16 → 0/16 | 3.31 → 5.56 | 457.18 → 730.51 | 6.392 → 7.467 | 0 → 1.232 | 0.603 → 0.902 | 0 → 0 / 4.11 → 12.39 | 48 → 48.31% / 51.85 → 52.53% | 0 → 0% |
| Rare | Plate Sword/Shield | 0/16 → 0/16 | 2.63 → 4 | 452.18 → 607.5 | 3.665 → 5.505 | 0.147 → 0.794 | 0.902 → 1.135 | 0 → 0 / 3.63 → 10.54 | 46 → 46% / 47.53 → 51.6% | 0 → 0% |
| Rare | Leather Dual Daggers | 0/16 → 0/16 | 6.88 → 3.94 | 1360.15 → 911.51 | 1.142 → 0.554 | 0.254 → 0.733 | 4.524 → 3.015 | 0 → 0 / 30.63 → 5.26 | 0.31 → 0% / 0 → 0% | 28.19 → 28.19% |
| Rare | Leather Bow | 1/16 → 0/16 | 9.63 → 6.63 | 1549.85 → 1314.2 | 0.233 → 0 | 0.512 → 0.601 | 3.59 → 3.012 | 0 → 0 / 20.56 → 19.93 | 0.31 → 0% / 0 → 0% | 28.19 → 28.19% |
| Rare | Leather Two-Handed | 1/16 → 0/16 | 9.25 → 4.94 | 1772.6 → 1205.61 | 0.242 → 0 | 9.907 → 9.869 | 1.875 → 1.308 | 0 → 0 / 7.69 → 10.22 | 0 → 0% / 0 → 0% | 28.19 → 28.19% |
| Epic | Cloth Staff | 0/16 → 3/16 | 4.19 → 8.94 | 930.31 → 1448.22 | 0 → 0.448 | 15.825 → 17.566 | 0.992 → 1.545 | 1678 → 1678 / 1677.37 → 1675.28 | 0 → 0.88% / 0 → 0% | 0 → 0% |
| Epic | Cloth Wand/Orb | 0/16 → 0/16 | 2.13 → 5.63 | 670.92 → 1116.25 | 0 → 0.378 | 0.218 → 3.487 | 1.118 → 1.501 | 1649 → 1649 / 1649 → 1645.16 | 0 → 0.31% / 0 → 0% | 0 → 0% |
| Epic | Plate Mace/Shield | 0/16 → 2/16 | 7.5 → 11.44 | 553.58 → 910.27 | 10.175 → 18.866 | 2.185 → 4.181 | 0.619 → 0.954 | 0 → 0 / 17.31 → 77.25 | 48.31 → 48.31% / 49.65 → 49.62% | 0 → 0% |
| Epic | Plate Sword/Shield | 0/16 → 0/16 | 4.19 → 7.63 | 563.51 → 763.97 | 5.121 → 10.867 | 0.598 → 2.886 | 0.921 → 1.16 | 0 → 0 / 9.01 → 6.77 | 46 → 46.63% / 42.16 → 50.14% | 0 → 0% |
| Epic | Leather Dual Daggers | 3/16 → 0/16 | 14.44 → 8.63 | 1837.55 → 1259.74 | 2.669 → 0.694 | 1.101 → 0.166 | 4.539 → 3.014 | 0 → 0 / 19.92 → 13.29 | 0.31 → 0.31% / 0 → 0% | 30 → 30% |
| Epic | Leather Bow | 9/16 → 2/16 | 13.63 → 12.94 | 2116.37 → 1725.66 | 0.983 → 1.006 | 0.02 → 0.114 | 3.775 → 3.025 | 0 → 0 / 47.65 → 48.62 | 0 → 0.31% / 0 → 0% | 30 → 30% |
| Epic | Leather Two-Handed | 16/16 → 5/16 | 15 → 12.31 | 2323.02 → 1714.09 | 4.667 → 0.944 | 13.661 → 13.543 | 1.945 → 1.413 | 0 → 0 / 19.1 → 19.35 | 0 → 0.31% / 0 → 0% | 30 → 30% |

### E200

| Rarity | Configuração | Clears (pré → pós) | Realms (pré → pós) | DPS (pré → pós) | Heal/s (pré → pós) | Barrier/s (pré → pós) | Attacks/s (pré → pós) | Mana pool / final (pré → pós) | Block chance / real (pré → pós) | Evasion (pré → pós) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rare | Cloth Staff | 0/16 → 1/16 | 1.5 → 5.75 | 1523.91 → 2862.56 | 0 → 0.577 | 25.849 → 28.996 | 0.965 → 1.78 | 2968 → 2968 / 2968 → 2963.5 | 0 → 0% / 0 → 0% | 0 → 0% |
| Rare | Cloth Wand/Orb | 0/16 → 0/16 | 2 → 4 | 1158.02 → 2311.06 | 0 → 0 | 0.414 → 1.755 | 1.105 → 1.776 | 2957 → 2957 / 2957 → 2954 | 0 → 0% / 0 → 0% | 0 → 0% |
| Rare | Plate Mace/Shield | 0/16 → 0/16 | 3.94 → 9.94 | 862.48 → 1785.31 | 10.956 → 20.051 | 0.181 → 1.421 | 0.602 → 1.181 | 0 → 0 / 9.33 → 34.89 | 48.31 → 48.63% / 46.12 → 57.97% | 0 → 0% |
| Rare | Plate Sword/Shield | 0/16 → 0/16 | 1.5 → 5 | 854.81 → 1567.5 | 1.355 → 11.249 | 0 → 1.088 | 0.887 → 1.557 | 0 → 0 / 0 → 10.26 | 48 → 48% / 48.98 → 47.62% | 0 → 0% |
| Rare | Leather Dual Daggers | 0/16 → 0/16 | 6.69 → 4.63 | 2640.82 → 1786.15 | 1.056 → 0 | 0 → 0 | 4.526 → 3 | 0 → 0 / 13.96 → 5.63 | 0.31 → 0.31% / 0 → 0% | 28.2 → 28.2% |
| Rare | Leather Bow | 0/16 → 0/16 | 13.88 → 6.44 | 3693.33 → 2526.86 | 9.478 → 0.612 | 1.375 → 0.2 | 4.532 → 3.005 | 0 → 0 / 73.53 → 13.06 | 0.63 → 0% / 0 → 0% | 28.2 → 28.2% |
| Rare | Leather Two-Handed | 16/16 → 0/16 | 15 → 7.19 | 5453.03 → 2958.58 | 3.607 → 0.303 | 19.454 → 18.62 | 3.031 → 1.584 | 0 → 0 / 87.41 → 28.68 | 0.63 → 0.31% / 0 → 0% | 28.2 → 28.2% |
| Epic | Cloth Staff | 0/16 → 3/16 | 3.69 → 11.25 | 1755.3 → 3312.63 | 0.265 → 9.43 | 31.835 → 37.244 | 0.967 → 1.774 | 3200 → 3200 / 3200 → 3198.56 | 0 → 1.13% / 0 → 0% | 0 → 0% |
| Epic | Cloth Wand/Orb | 0/16 → 1/16 | 2.81 → 7.94 | 1313.04 → 2659.77 | 0 → 2.096 | 0 → 3.926 | 1.12 → 1.773 | 3151 → 3151 / 3151 → 3149.5 | 0 → 1.13% / 0 → 1.38% | 0 → 0% |
| Epic | Plate Mace/Shield | 0/16 → 6/16 | 7.19 → 14.25 | 1111.64 → 2219.57 | 20.209 → 44.6 | 1.156 → 9.501 | 0.63 → 1.21 | 0 → 0 / 65.45 → 126.6 | 48 → 48% / 50.63 → 46.79% | 0 → 0% |
| Epic | Plate Sword/Shield | 0/16 → 3/16 | 6.63 → 12.44 | 1157.63 → 1989.72 | 16.247 → 39.093 | 4.16 → 15.164 | 0.977 → 1.604 | 0 → 0 / 28.52 → 37.15 | 48 → 48.63% / 52.49 → 47.68% | 0 → 0% |
| Epic | Leather Dual Daggers | 0/16 → 0/16 | 13.69 → 9.06 | 3570.96 → 2441.44 | 2.283 → 2.025 | 1.803 → 1.544 | 4.536 → 3.017 | 0 → 0 / 77.85 → 31.37 | 2.44 → 0% / 2.08 → 0% | 30 → 30% |
| Epic | Leather Bow | 16/16 → 0/16 | 15 → 12.75 | 4929.87 → 3375.96 | 8.007 → 4.303 | 0.174 → 2.335 | 4.543 → 3.025 | 0 → 0 / 65.28 → 22.82 | 0 → 0.63% / 0 → 0% | 30 → 30% |
| Epic | Leather Two-Handed | 16/16 → 12/16 | 15 → 14.88 | 6593.28 → 3843.37 | 3.891 → 9.578 | 24.616 → 24.241 | 3.024 → 1.702 | 0 → 0 / 50.78 → 67.36 | 0 → 0.88% / 0 → 0.66% | 30 → 30% |

## Leitura de dano e sobrevivência

- **Dano:** Wand passou de 0,77× para 0,95× Spell Power. Agility decrescente e teto final reduziram a frequência em loadouts de Agility alta. O DPS agregado varia com a duração e Realm alcançada, logo não isola dano por cast; as tabelas mostram DPS sustentado ao longo da Expedition.
- **Sobrevivência:** Barrier Pulse sobe de 2% para 3% de Max HP por ativação; Retaliation sobe para 30% do dano-base com cooldown de 4 s; Shield adiciona contra-ataque limitado a 45% do hit-base e cooldown de 2,5 s. Healing/s e Barrier/s são ganhos observados, sem poções. A tabela de E/rarity é a comparação de outcomes de sobrevivência.
- **Mana:** pool calculada ficou constante, como esperado; Mana restante varia com cadence, duração e funding. Staff/Wand continuam sujeitos à disponibilidade de Mana.

## Auditoria de exploits e cooldowns

- **Velocidade:** fórmula base usa `effectiveAGI`, limita a base a 3,8, aplica diminishing returns existente, usa INT cast speed apenas em Staff/Wand e limita `attacksPerSec` e o multiplicador efetivo do tick a 4,2. Quick Hands e Adrenaline respeitam o mesmo teto. O maior APS observado no simulador é incluído abaixo; o cap de 4,2 é uma condição do runtime, não um equilíbrio observado.
- **Shield counter:** limitado a Sword/Mace + Shield, não dispara com Two-Handed, usa `setReady` com 2,5 s e `setDirectEnemyDamage`, sem críticos/on-hit/procs. O caminho não é recursivo. Oathwall ainda não existe no catálogo atual; o guard condicional de substituição não foi exercitado.
- **Retaliation:** cooldown de 4 s é debitado quando Barrier é absorvida; a carga usa hit direto e não ativa outro ataque. Cooldowns de buildcraft persistem na estrutura da build entre Realms.
- **Recursão/cooldowns:** ataque direto não chama `weaponAttack`, portanto counterattacks, Double Strike e procs não encadeiam. A matriz não encontrou erros/timeouts; isto não é uma prova formal de todos os caminhos raros de cooldown.
- Máximo agregado observado (ataques executados / combat seconds): 4.545/s pré e 3.03/s pós; maior stat de velocidade de primeiro combate: 4.2/s. O runtime mantém cap final 4,2/s durante buffs.

## Propostas de calibração (não aplicadas)

- **Propostas para a próxima bateria (não aplicadas):** comparar o multiplicador de Agility acima de 50 em **0,25 / 0,30 / 0,35**, mantendo base speed 3,8 e teto final 4,2. Leather Dual Daggers Epic em E200 ficou em 0/16 clears, média 9,1 Realms e 3,02 ataques/s; Leather Two-Handed Epic ficou em 12/16 e 14,9 Realms. A variável deve ser isolada por tipo de arma.
- Comparar Wand em **0,95 / 1,00 / 1,05 × Spell Power**, Staff fixo em 1,32. Em E200 Epic, Wand+Orb terminou com 1/16 clear e 7,9 Realms médios, vs Staff com 3/16 e 11,3 Realms. Registar casts funded, Mana gasto/restante e DPS por cast para separar dano de restrição de Mana.
- Manter por agora o counter do Shield em **45% / 2,5 s**, Retaliation em **30% / 4 s** e Barrier Pulse em **3% + 0,6% por rank adicional / 6 s**. Instrumentar cada counter por origem e cooldown antes de testar números alternativos; a sim atual não expõe contagem isolada do counter base.
- Para todas as variantes, usar pelo menos **30 seeds por célula** (em vez das atuais 16) e emparelhar as escolhas de affinities/picks. Repetir níveis com diferença superior a 3 Realms ou diferença de vitória acima de 20 pontos percentuais antes de selecionar uma alteração.

## Limitações e rastreabilidade

- Amostra de 16 execuções por combinação (8 seeds × 2 agentes), útil para comparação exploratória, não para estimativas estatísticas robustas de win rate. Full gear synthetic no nível avaliado, sem progresso de obtenção real.
- Métrica de DPS inclui dano direto e DoT, dividida pelo tempo de combate. Healing/s e Barrier/s contam ganhos efetivos observados; over-heal/Barrier cap pode limitar o total. Evasion é chance teórica derivada de rating, não contagem de ataques que poderiam escapar em todos os cenários.
- Hash base de `combat/v012-gear-stats.js`: `77915585c456c3a64f80f1972a76245571ff3222e6363fcf4155ab27f436af2c`; hash pós: `c32b638f214cc071e783a5335b763a4fc901a7cdae37f94ee1183b6653284a06`. Dados JSON completos preservados em `/tmp/wanderer-phase-a-before.json` e `/tmp/wanderer-phase-a-after.json` no ambiente de execução.
