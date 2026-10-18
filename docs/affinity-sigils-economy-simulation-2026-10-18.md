# Wanderer — Affinity Sigils: simulação de custos e impacto no RNG

**Data:** 18 de outubro de 2026  
**Origem:** `Skinny-lfg/wanderer-game`, branch `development`, `index.html` (leitura sem alteração do repositório).  
**Método:** Monte Carlo com seed `18102026`. Amostra económica: 7.000 cenários por combinação, com um conjunto de 100.000 rendimentos de dungeon amostrados por perfil. Amostra de loot natural: 5.000 percursos por perfil. Estes números são estimativas condicionais, não métricas observadas de jogadores.

## Resumo executivo

- **Conclusão:** +30% sobre o preço dos Affinity Sigils é um candidato equilibrado para teste, mas **o preço não aumenta o RNG**; aumenta a necessidade de farming. O Mercado já exige RNG: probabilidade de 4/13 de surgir uma affinity específica por stock aleatório, e a Forge tem sucesso de 35%, 50% ou 65%.
- O stock comprado é reposto imediatamente por uma affinity diferente e distinta das restantes ofertas. Portanto, para obter várias cópias da mesma affinity é preciso voltar a fazer refresh.
- **D50, três transferências Secure, 50% dos drops não-lendários salvaged e bosses vencidos:** mediana de **23** dungeons a preço atual; **26** (+30%); **28** (+50%). Percentil 80: **32**, **36**, **38** respetivamente.
- A D50, três transferências Secure custam em média **4,7 sigilos**, **14,3 refreshes**, **5.645 Gold** e **3.563 Fragments** ao preço atual. Cerca de **55% do Gold** já vai para refreshes; por isso +30% no preço de compra só aumenta o gasto total de Gold em ~14%.
- Sem salvage, a restrição dominante frequentemente passa a ser **Fragments**; por exemplo, D50 Secure três transferências fica nas **35 dungeons** independentemente de o preço ser atual, +30% ou +50%.

## Regras incorporadas

- 13 affinities, 4 ofertas sem repetição (`rollOffer`). A affinity específica aparece num stock novo com probabilidade 4/13.
- Comprar uma oferta substitui-a por outra affinity diferente da comprada e distinta das 3 restantes. O stock de sigilos tem refresh pago.
- Preço: `sigilPrice(tier) = 100 + 9*tier`. Refresh: `16 + 4*tier`. Multiplicadores de teste: `1.0`, `1.3`, `1.5` sobre o **preço do sigilo**, mantendo o refresh inalterado.
- Forge: Economy 35% e fator 0,5 em Fragments; Balanced 50% e fator 1,0; Secure 65% e fator 1,5. Base do custo `10 + 10*tier`, arredondamento normal como no JavaScript.
- Falha consome sigilo e Fragments, preserva a affinity original. Itens Legendary não são elegíveis para transferência.
- Gold e Fragments ganhos por wave reproduzem as fórmulas de `winEncounter`, incluindo miniboss e boss extra a cada 10 níveis. Valuables vendidos por Gold seguem as probabilidades e valores definidos no código.
- Drops e raridades seguem a `WAVE_TABLE`. No cenário com salvage, 50% dos drops **não Legendary** são salvaged segundo `saleFragments`; sem salvage, só contam os Fragments diretos dos combates.
- O cenário principal de farming usa dungeons D20, D50, D100 e D150 **de cinco waves, com boss**, ou seja, representa farming favorável. O cenário secundário usa D19, D49, D99 e D149, com quatro waves, para um farming alternativo mais conservador.

## Tempo económico estimado: 3 transferências Secure, 50% salvage e boss dungeon

| Dungeon | Preço atual | +30% | +50% |
|---|---:|---:|---:|
| D20 | 17 | 19 | 21 |
| D50 | 23 | 26 | 28 |
| D100 | 25 | 29 | 31 |
| D150 | 27 | 30 | 33 |

Medianas de dungeons necessárias para obter Gold **e** Fragments suficientes começando com saldo zero. Não contam o tempo para adquirir as peças, a deslocação entre níveis nem mudanças de build. A simulação assume que o jogador escolhe um só método de investimento na Forge.

## D50: opções de investimento na Forge (3 transferências)

| Forge | Preço atual | +30% | +50% | Sigilos médios | Refreshes médios |
|---|---:|---:|---:|---:|---:|
| Economy 35% | 41 | 47 | 50 | 8,6 | 26,9 |
| Balanced 50% | 29 | 33 | 35 | 6,0 | 18,6 |
| Secure 65% | 23 | 26 | 28 | 4,7 | 14,3 |

## D50: fechar 5 peças desde zero versus duas peças naturais

| Objetivo | Atual | +30% | +50% |
|---|---:|---:|---:|
| Partir de 2 peças com a affinity certa e converter 3 | 23 | 26 | 28 |
| Converter 5 peças sem nenhuma com a affinity certa | 38 | 43 | 47 |

Valores para método Secure, boss D50, 50% salvage. Supõe **que os itens desejados, não Legendary e compatíveis, já existem**; isto isola o custo de transferência, não o custo completo de montar o set.

## D50: sensibilidade ao farming

| Fonte de recursos | Atual | +30% | +50% |
|---|---:|---:|---:|
| Repetir boss D50, 50% salvage | 23 | 26 | 28 |
| Repetir boss D50, zero salvage | 35 | 35 | 35 |
| Repetir normal D49, 50% salvage (preços D50) | 33 | 37 | 40 |
| Repetir normal D49, zero salvage (preços D50) | 56 | 56 | 56 |

Uma sensibilidade adicional com 5% de dungeons sem extração deu, para D50 Secure / 50% salvage, cerca de 23, 27 e 29 dungeons (medianas). Esse teste **não** simula a destruição e subsequente recuperação do gear por morte. É apenas um limite inferior do impacto de mortes.

## Quanto RNG existe sem transferências?

Teste separado de loot natural (sem Forge ou compra de sigilos) em cinco **slots fixos elegíveis**: Helm, Amulet, Armor, Gloves e Boots. Loot de boss de 5 waves, sem Favored Gear boost, CHA base, sem mortes, e `makeItem` da dungeon com 70% de privilegiar a affinity da dungeon quando legal; a distribuição do restante 30% é aleatória. Modelou-se a regra de rotação das ofertas: três themes distintas a cada run elegível, sem repetição das três da oferta anterior (o que dá 3/13 de probabilidade inicial e 3/10 na rotação seguinte caso a affinity alvo estivesse ausente, e zero caso estivesse presente). “A partir de duas peças” significa duas peças pré-existentes, bem distribuídas pelos cinco slots.

| Qualidade de loot admitida | Dungeon da affinity sempre disponível: de 2 para 5 | 3 de 13 dungeons em rotação: de 2 para 5 |
|---|---:|---:|
| Rare ou Epic | 10 dungeons | 36 dungeons |
| Epic apenas | 35 dungeons | 136 dungeons |

A simulação de rotação fez 5.000 percursos por cenário. A condição Epic/rotação é aproximada em cauda longa: em ~1% dos percursos não foi completada no limite de 600 runs, pelo que a mediana continua informativa, mas a média não seria.

**Interpretação:** os sigilos diminuem fortemente a incerteza na **afinidade de uma peça específica valiosa**, mas **não criam a peça**, nem garantem transferência. Para loot Rare/Epic enquanto a dungeon desejada está acessível, o farming natural pode ser mais rápido que pagar três transferências. Se a dungeon desejada só aparece em rotação, sigilos ganham relevância.

## Limites importantes

1. **Não é uma simulação integral de progressão/combat D1–D200.** Não testa DPS, bosses, gear power, item rolls detalhados, equipamento com affinities incompatíveis, mudanças de builds nem os restantes usos de Gold e Fragments.
2. **Não deduz gear perdido por mortes,** porque isso exige um modelo de proteção, stash e procura de substitutos. O cenário de 5% de falhas só descarta a recompensa desse run.
3. Assume que o jogador começa sem Gold/Fragments acumulados e dedica **todos** os ganhos à função estudada. Jogadores com stock prévio obtêm as transferências mais cedo; jogadores que fazem outras compras mais tarde.
4. A exposição a 50% de salvage é uma hipótese; o comportamento real pode variar muito com inventário, qualidade e vontade de guardar items.
5. Fazer boss D20/D50/D100/D150 repetidamente representa um cenário favorável, não prova que essas dungeons sejam derrotáveis em sequência com a build estudada.
6. A simulação natural é só de cinco slots fixos sem slots duplicados e sem Favored Gear; não replica a estratégia ótima de equipar cinco de nove slots disponíveis ou armas com pools restritas.

## Recomendação para playtest

**Não reduzir odds da Forge de imediato.** Primeiro testar **+30% no preço de compra dos sigilos** isoladamente, mantendo chances e refresh inalterados, e medir com telemetria de progresso real: Gold/Fragments por D20/50/100/150, compras por jogador, número de refreshes, número de transferências e dias/dungeons até ativar os 3-piece e 5-piece bonuses. Se o problema observado for completar uma affinity excelente demasiado cedo, atuar sobre as taxas de aquisição de gear (elegível, bom e com a affinity certa) pode ser mais direcionado do que encarecer um sistema onde refreshes já custam mais de metade do Gold.

## Reprodutibilidade

Ficheiros acompanhantes: `wanderer_sigils_sim.py`, `wanderer_sigils_sim_results.csv`, `wanderer_sigils_income.csv`, `wanderer_natural_loot_sim_exact_rotation.py`, `wanderer_natural_loot_sim_results.csv`. O código do jogo não foi alterado.