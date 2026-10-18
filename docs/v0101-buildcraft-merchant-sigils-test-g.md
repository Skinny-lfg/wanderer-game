# Wanderer v0.10.1 — Teste G: Quanto custa completar uma build?

**Data:** 17 de outubro de 2026  
**Tipo:** simulação offline de inventários e combates reais do motor Wanderer, mais Monte Carlo da compra e transferência de Sigils  
**Estado:** investigação concluída; **nenhum código do jogo, branch `main`, Firebase, rules ou saves foi alterado**  
**Código efetivamente ensaiado:** ZIP da `main` fornecido no início da investigação, `index.html` SHA-256 `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`. **Não equivale necessariamente à `main` mais recente.**

## 1. Pergunta e resultado principal

Objetivo: descobrir o **custo em Gold, Fragments e refreshes** e o **benefício em combate** de usar quatro Affinity Sigils aleatórios no Merchant para (A) completar 2→3 peças, (B) completar 4→5 peças e (C) corrigir a afinidade de um Epic forte.

**Resultado:** o sistema tem utilidade de *buildcraft*, mas **completar um set 5/5 não garantiu mais vitórias** nesta amostra, que é muito pequena para esse caso. Corrigir a afinidade de um Epic existente apresentou o ganho de combate mais claro (+4,1 pontos percentuais). Na componente económica, pagar mais Fragments pela transferência melhora a eficiência em Gold/refreshes; pagar menos Fragments aumenta as tentativas e o risco de um percurso longo no Merchant. Os preços e probabilidades **não estão aprovados para implementação**.

## 2. Origem dos equipamentos e abordagem

- **60 jogadores simulados**, com estratégias Casual/Experiente/Speedrun e sementes `931000–931019`, da Fase 3; **176 snapshots** da aquisição efetiva de equipamento em D20, D40, D60, D100, D160 e D200. Estes inventários foram obtidos através da campanha do jogo, **não foram inventados como sets Epic perfeitos**; não representam pessoas reais.
- **334 casos de alteração de afinidade**: 146 para **2→3** adquiridos, 9 para **4→5** adquiridos, 133 de Epic equipado com possibilidade de afinidade melhor, e 46 cenários legais **derivados** de inventários adquiridos para estudar 4→5 em D100–D200. Os 46 foram construídos mudando previamente um ou dois itens para atingir 4 peças e **não representam sets efetivamente obtidos**.
- Em cada snapshot, selecionou-se a melhor mudança **legal** segundo o indicador de `power` do motor. Este é um **agente idealizado que conhece o resultado da troca**, não o comportamento de todos os jogadores. Excluídas Legendary e `legendaryId`; mantidos subtipo, slot, rarity, tier, atributos, runas e restante equipamento. Muda-se apenas `effect` e `magic` quando aplicável. As afinidades são sempre verificadas contra `elementPool(slot, subtype)`.
- **2.004 pares de combates** (equivalentes a **4.008 combates individuais**) com 6 seeds por caso, mesmo encontro e condição inicial em ambos os braços. Motivos e elites rodados; boss da milestone D20/D40/D60/D100/D160/D200. Os resultados de combate variam após a mudança de set e consumo de RNG — emparelhamento não é identidade perfeita de todos os proc events.
- **200.400 transações simuladas de pesquisa/transferência de Sigils**: 6 modos × 334 casos × 100 seeds Monte Carlo. Cada caso começa com o **Gold e os Fragments realmente registados no snapshot**; receitas futuras não são consideradas. Neste ensaio o agente tenta até conseguir a afinidade, ficar sem recursos ou atingir um limite técnico de 40 tentativas/250 refreshes (os limites técnicos nunca são regras propostas para o jogo).

## 3. Resultado dos combates

| Caso | Inventários/casos | Pares de combate | Vitórias antes | Vitórias depois | Diferença vitória | IC95% bootstrap por grupo de jogador/seed | Bónus mediano `power` |
|---|---:|---:|---:|---:|---:|---:|---:|
| **2→3 peças (adquirido)** | 146 | 876 | 652 | 662 | **+1,14 p.p.** | [−0,36; +2,55] | +18 |
| **4→5 peças (adquirido)** | **9** | 54 | 44 | 44 | **0,00 p.p.** | [−8,33; +10,42] | +24 |
| **Epic corrigido (adquirido)** | 133 | 798 | 632 | 665 | **+4,14 p.p.** | [+1,63; +7,09] | +12 |
| 4→5 peças (**derivado**, não adquirido) | 46 | 276 | 251 | 251 | 0,00 p.p. | não conclusivo; efeito de teto | +24 |

**Interpretação:** uma melhoria de `power` não implica automaticamente vitória. A diferença mais sólida, nos casos explorados, foi na mudança vantajosa de afinidade em um Epic. A amostra de 5/5 **não permite decidir se o tier 5 está mal equilibrado**: 9 casos naturais, apenas D20–D100, e muitos combates já estão saturados em vitórias. O objetivo é avaliar valor marginal de *uma* troca de afinidade, e não afirmar que todo o set 5/5 é fraco.

### Exemplos concretos de inventários adquiridos

- **D40, Experiente:** Amulet Sunder → Critical completando 2→3 Critical; poder 1295→1316 (+21); carteira original **27.071 Gold / 8.289 Fragments**.
- **D100, Experiente:** Ring2 Shield → Fire/Burn completando 2→3 Burn; poder 3751→3769 (+18); **53.876 Gold / 32.679 Fragments**.
- **D60, Experiente:** Ring1 Regen → Bleed completando 4→5 Bleed; poder 2263→2275 (+12); **50.508 Gold / 33.882 Fragments**.
- **D100, Experiente:** Weapon Epic Storm/Shock → Critical; poder 3249→3271 (+22); **49.314 Gold / 35.366 Fragments**.

Estes exemplos ilustram *oportunidades*, não são necessariamente os jogadores médios. Os nomes Fire/Burn e Storm/Shock referem-se à convenção UI e à chave técnica da afinidade.

## 4. Economia do Merchant → Forge

### Regras do ensaio

- **4 Sigils de afinidades diferentes dentro de uma oferta**, amostrados uniformemente entre 13 afinidades. **Pressupostos de UI:** estes quatro lugares são adicionais ao stock tradicional de equipamento do Merchant; o mesmo refresh pago também renova o equipamento. Se se pretender **substituir** os quatro lugares normais por Sigils, é outro experimento.
- Se o Sigil desejado não aparece, o agente paga o refresh do Merchant em **Gold**; quando aparece, compra o Sigil por **Gold**; na Forge, paga **Fragments** para uma única transferência. A falha consome o Sigil e os Fragments, mantém a afinidade original do item e exige adquirir outro Sigil para nova tentativa.
- Preços retirados das curvas propostas no Teste F: Gold do Sigil `100 + 9 × tier`, refresh `16 + 4 × tier` e custo base Forge `10 + 10 × tier` com `tier=max(1, maxDungeon−1)`. A probabilidade de transferência e a fração do custo de craft variam consoante a modalidade. A oferta atual mantém-se até refresh pago; uma compra remove aquele Sigil até refresh.
- A modalidade **não repetir quatro anteriores** exclui **todos os quatro Sigils da página anterior**, mesmo que um tenha sido comprado. Foi corrigido um erro de protótipo que esquecia o Sigil comprado ao criar a página seguinte.
- Simulação isolada: não se pode contar como nova campanha D1–D200, nem prova quanto o jogador iria efetivamente gastar. Ela responde: *dado este equipamento e esta carteira real, quanto custa/qual a chance de concluir uma conversão?*

### Resultado: total gasto **por conversão bem-sucedida**

Esta métrica soma Gold/Fragments gastos **em todas as tentativas**, incluindo as que acabam sem converter, e divide pelo número total de conversões. Cada opção tem **33.400 sessões de compra/transferência**, 100 por situação de equipamento.

| Modalidade | Probabilidade transferência / custo Forge | Sessões concluídas dentro da carteira | Gold / conversão | Fragments / conversão | Refreshes / conversão |
|---|---|---:|---:|---:|---:|
| **35%** | 35% / 0,5× | **95,3%** | 5.257 | **1.189** | 8,3 |
| **50%** | 50% / 1× | 92,9% | 3.620 | 1.687 | 5,5 |
| **65%** | 65% / 1,5× | 90,3% | **2.709** | 1.956 | **4,0** |
| **50% sem repetição de página** | 50% / 1× | 92,9% | 3.376 | 1.687 | 4,8 |
| **50% refresh a metade do preço** | 50% / 1× | 92,9% | **2.661** | 1.687 | 5,5 |
| **Adaptativo** | 35% para 2→3; 65% para 4→5; 50% para Epic | 93,9% | 3.984 | 1.558 | 6,4 |

A taxa de sessão concluída **não é** a chance de uma única tentativa: é a probabilidade de acabar por conseguir a afinidade após várias compras e tentativas *antes de gastar a carteira histórica*. A opção 35% completou mais sessões porque os Fragments eram mais baratos, mas a contrapartida foi um grande número de refreshes e muito mais Gold.

**Risco de cauda (90.º percentil de custo entre sessões concluídas):** com 50% de transferência, até **8.329 Gold** e **4.000 Fragments**; com 35%, até **12.417 Gold** e **3.000 Fragments**. O acesso ao item certo pode exigir uma sequência longa de refreshes, mesmo com a oferta de quatro slots.

### Sensibilidade: Gold e Fragments não são só para Sigils

Na tabela acima, foi permitido gastar **toda a carteira** do snapshot. Numa análise posterior, foram assinaladas apenas conversões que **caberiam em 25% do Gold e 20% dos Fragments** registados, reservando o restante para Forge Quality, Legendary +10 e Merchant tradicional. A percentagem de conversões viáveis caiu para:

| Variante | 100% da carteira disponível | Dentro de 25% Gold / 20% Fragments |
|---|---:|---:|
| 35% | 95,3% | **71,3%** |
| 50% | 92,9% | **69,0%** |
| 65% | 90,3% | **66,3%** |
| 50% sem repetição | 92,9% | **69,4%** |
| 50% refresh mais barato | 92,9% | **69,9%** |

Esta sensibilidade é um **filtro das despesas das simulações completas**; não são novas campanhas em que os agentes replaneiam gastos. Não permite inferir diretamente a economia global D1–D200.

## 5. O que recomendo para o design

1. **Manter os quatro Sigils em oferta e o refresh pago**; evitar impor custo progressivo por refresh neste estágio. Usar a oferta sem repetição imediata como candidato de UX: no protótipo poupou cerca de **244 Gold e 0,7 refreshes por conversão** face ao modo 50% normal, mas deve ser novamente testada com persistência verdadeira do Merchant.
2. **Permitir investimento na Forge à escolha do jogador**: *Económico* = 35% e 0,5× custo, *Equilibrado* = 50% e 1×, *Seguro* = 65% e 1,5×. Estes são **coeficientes experimentais**, não aprovados. O custo esperado varia entre poupar Gold e poupar Fragments. Mostrar preços e chances reais.
3. **Não implementar limites artificiais de refrescos ou Sigils**. A economia já limita as tentativas. Permitir comparação de buffs de 2/3/5 peças **ganhos e perdidos** antes de gastar o Sigil, especialmente porque 5 peças não garantiu uma vitória adicional nesta amostra.
4. Priorizar uma interação que permite **corrigir a afinidade de um Epic bom**. Essa situação apresentou um benefício observável nos inventários históricos, com o mesmo item/atributos.
5. **Não concluir que o sistema resolve ou estraga a progressão D200.** O Teste F fez as campanhas completas com esta mecânica. O G é um teste mais localizado do **valor/custo da alteração**; precisa de validação integrada de preservação de Sigils, save migration, UI mobile e novas campanhas após valores finalizados.

## 6. Limitações e garantia de integridade

- Há **apenas 9 sets 4/5 efetivamente adquiridos** que permitem uma transferência legal de não-Legendary. Os 46 cenários adicionais são derivados, não novas aquisições do jogo. Em D160/D200, quase todos já vencem, pelo que o impacto em vitórias é pouco informativo.
- Foi escolhida a **melhor mudança por `power`** por snapshot; esta seleção informada favorece resultados positivos e não mede alterações aleatórias nem satisfação subjetiva dos jogadores.
- O Merchant experimental tem quatro espaços de Sigils *adicionais* aos espaços atuais de equipamentos. A mecânica não foi integrada nos saves reais; a compra e transferência acontecem na mesma simulação isolada.
- 100 Monte Carlos por situação de equipamento e 6 combates por situação **não são independentes** no sentido de 33.400 jogadores diferentes. Os intervalos de combate foram estimados por bootstrap agrupando as seeds originais dos jogadores simulados; múltiplos cenários exploratórios e não há correção para múltiplas comparações.
- **Testes:** 6/6 de abilities/progression; scaling v0.10.0, Shatter/Double Strike e 22 identidades Legendary passaram. Validação específica de 20.000 ofertas com quatro Sigils legais/distintos e sem repetir as quatro anteriores passou; nenhum saldo ficou negativo nas transações; 0 erros no runner; `index.html` manteve SHA-256 original.
- Nenhum item Legendary foi alterado por Sigil. Nenhuma escrita em GitHub com gameplay, saves, Firebase, Rules ou `main` foi feita. Apenas **documentação na branch `development`**.

## 7. Reprodutibilidade

Ficheiros da pesquisa: `run_test_g.cjs`, `analyze_g.py`, `test-g-validation.cjs`, as 176 snapshots adquiridas (Fase 3), inventários e comparações com o motor `scripts/simulate-v091.cjs`, resultados individuais `test-g-combat.json`, `test-g-market.json` e o agregado `test-g-analysis.json`. Os scripts usam `index.html` da ZIP da `main`, nunca o atual GitHub como fonte sem atualizar explicitamente o ZIP.

Comandos a partir do diretório de investigação com Node.js instalado: `COMBAT_SEEDS=6 MARKET_REPS=100 node run_test_g.cjs`, `python analyze_g.py`, `node test-g-validation.cjs`.

**Próximo passo sugerido:** protótipo visual e teste de persistência do stock de Sigils, de Sigils comprados e de alterações de afinidade no save; testes reais de UX e reexecução contra o commit de gameplay mais recente antes de planear o merge v0.10.1.