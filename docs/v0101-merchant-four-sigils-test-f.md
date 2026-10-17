# Wanderer v0.10.1 — Teste F: Merchant com 4 Affinity Sigils + refresh da oferta

**Data:** 17 de outubro de 2026  
**Estado:** simulação *offline*, sem alterações de gameplay, `main`, Firebase, rules ou saves reais.  
**Base de código:** ZIP da `main` previamente fornecido, com SHA-256 de `index.html` = `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`. A `main` atual no GitHub tem commits posteriores; este estudo não a valida.

## 1. Regras EXATAS desta experiência

* O **Merchant mostra quatro slots de Affinity Sigils aleatórios**, sem repetições **dentro de cada oferta**. São **13 afinidades equiprováveis**. Não se altera nem se rerolla a afinidade de um Sigil já adquirido.
* Se a afinidade pretendida não está entre os quatro Sigils, o jogador pode usar **New Merchant stock**, pagando a tarifa de refresh do jogo (`16 + 4 × tier da fronteira` Gold), que renova os **quatro Sigils** e também os equipamentos do Merchant. As novas ofertas são aleatórias e podem repetir afinidades da oferta anterior, exceto na variante `marketNoRepeat`.
* Se o Sigil pretendido aparece e há Gold suficiente, o jogador compra-o (`100 + 9 × tier da fronteira` Gold). O Sigil comprado ocupa um dos quatro lugares até ao próximo refresh pago. O protótipo aplica-o **logo na mesma visita à Forge**; a persistência do Sigil no inventário real não foi implementada nem testada.
* Para usar o Sigil na Forge, escolhe-se um equipamento **não-Legendary** com afinidade permitida pelo seu slot/subtipo. Faz-se **uma** tentativa de transferência, pagando Fragments. Se falha, o Sigil e os Fragments são consumidos e **o item mantém a afinidade original**. Se resulta, a afinidade passa a ser a do Sigil; a afinidade anterior não se perde por uma mera tentativa falhada.
* Três custos de transferência, calculados a partir do crafting da fronteira (`10 + 10 × tier` Fragments): **35% sucesso, 0,5× custo**, **50% sucesso, 1× custo**, e **65% sucesso, 1,5× custo**. Não são preços finais aprovados. Os agentes usam a probabilidade correspondente a cada cenário, não escolhem dinamicamente o investimento.
* **Forge Quality +100% e Legendary +10 ficam ativos e idênticos em todos os braços**, incluindo o controlo. Só o Merchant/Sigil muda. O código do combate, a recolha de loot, a morte, proteção, crafting, Merchant de equipamento, runas e progressão são do simulador do jogo.

**Política dos agentes (não regras obrigatórias):** procuram a melhor troca de afinidade em equipamento Rare/Epic equipado, de tier ≥72% da fronteira, com pelo menos uma peça de set a beneficiar e ganho estimado >1,8% do score. Inspecionam o mercado a cada 12 expedições; usam no máximo 10 Sigils por campanha e reservam Gold/Fragments (aprox. 20% do Gold e 12% dos Fragments ganhos). A versão de utilização intensiva consulta a cada 4 expedições e não tem essa limitação. Teto de **3 refreshes pagos** por consulta no cenário padrão, até 10 no intensivo. Estes limites são **do agente**, não de gameplay.

## 2. Validação isolada da oferta (100.000 pesquisas por modalidade)

- Uma oferta de quatro Sigils distintos tem probabilidade teórica de conter uma afinidade escolhida: **4/13 = 30,77%**.
- Com oferta inicial + até três refreshes *independentes*, probabilidade teórica: `1 − (9/13)^4 = 77,03%`. Simulação com gerador corrigido e distribuição uniforme: **76.90%**.
- Se cada refresh garantir **não repetir nenhuma das quatro afinidades da oferta imediatamente anterior**, simulação: **88.23%**; aumenta o acesso sem garantir a afinidade em todas as pesquisas.
- Numa pesquisa sem limite de refreshes, o número esperado de refreshes pagos até encontrar uma afinidade específica é **2,25**. A preços de D100, isto significa em média **1.936 Gold** incluindo o Sigil (1.000 Gold + 2,25 × 416 Gold). Este cálculo ignora limites de saldo e não inclui o investimento de transferência nem compras repetidas se ela falhar.
- **Preços de exemplo no tier D100**: refresh de loja 416 Gold; Sigil 1.000 Gold; transferência 35% = 505 Fragments, 50% = 1.010 Fragments, 65% = 1.515 Fragments.

**Correção metodológica importante:** um shuffle preliminar com gerador linear e operação módulo mostrou um viés estatístico. Os primeiros ensaios com esse shuffle foram **excluídos**. Todas as campanhas e resultados da tabela principal usam o sorteio corrigido com PRNG Mulberry32 e Fisher–Yates.

## 3. Campanhas D1–D200 — comparação principal

**Coorte principal:** 12 seeds independentes `932100–932111` × 3 políticas, **36 agentes por braço**, 8 braços, 600 expedições máximas. Seeds partilhadas entre variantes para comparação emparelhada; estratégias Casual, Experiente e Speedrun.

| Cenário | Campanhas | Chegam D200 | D máxima mediana | Sigils comprados | Conversões bem-sucedidas | Refreshes de Sigils |
|---|---:|---:|---:|---:|---:|---:|
| Controlo (Forge Quality + Legendary +10) | 36 | **21/36** | D200 | 0 | 0 | 0 |
| Mercado 4 Sigils, 35% (0,5 × craft) | 36 | **14/36** | D161.5 | 295 | 103 | 520 |
| 4 Sigils, sem refresh específico | 36 | **18/36** | D195.5 | 17 | 6 | 0 |
| Mercado 4 Sigils, 50% (1 × craft) | 36 | **16/36** | D181 | 50 | 19 | 90 |
| 50%, refresh pela metade do Gold | 36 | **18/36** | D191.5 | 42 | 22 | 81 |
| Mercado 4 Sigils, 65% (1,5 × craft) | 36 | **18/36** | D199 | 34 | 18 | 76 |
| 50%, sem repetir Sigils no refresh seguinte | 36 | **17/36** | D188 | 54 | 22 | 62 |
| 50%, agente gasta livremente | 36 | **18/36** | D198.5 | 111 | 48 | 295 |

## 4. Validação independente

**Holdout:** 15 seeds novas `932300–932314` × 3 políticas, **45 agentes por braço**, cinco candidatos escolhidos de antemão para validação. Nenhuma destas seeds foi usada no piloto nem na seleção da curva.

| Cenário | Campanhas | Chegam D200 | D máxima mediana | Sigils comprados | Conversões bem-sucedidas | Refreshes de Sigils |
|---|---:|---:|---:|---:|---:|---:|
| Controlo (Forge Quality + Legendary +10) | 45 | **20/45** | D193 | 0 | 0 | 0 |
| Mercado 4 Sigils, 35% (0,5 × craft) | 45 | **21/45** | D165 | 368 | 125 | 741 |
| Mercado 4 Sigils, 50% (1 × craft) | 45 | **22/45** | D193 | 69 | 38 | 103 |
| Mercado 4 Sigils, 65% (1,5 × craft) | 45 | **20/45** | D191 | 43 | 21 | 63 |
| 50%, sem repetir Sigils no refresh seguinte | 45 | **19/45** | D190 | 88 | 50 | 103 |

### Coortes agregadas (36 + 45 = 81 por variante comum)

| Cenário | Campanhas | Chegam D200 | D máxima mediana | Sigils comprados | Conversões bem-sucedidas | Refreshes de Sigils |
|---|---:|---:|---:|---:|---:|---:|
| Controlo (Forge Quality + Legendary +10) | 81 | **41/81** | D200 | 0 | 0 | 0 |
| Mercado 4 Sigils, 35% (0,5 × craft) | 81 | **35/81** | D165 | 663 | 228 | 1261 |
| Mercado 4 Sigils, 50% (1 × craft) | 81 | **38/81** | D191 | 119 | 57 | 193 |
| Mercado 4 Sigils, 65% (1,5 × craft) | 81 | **38/81** | D193 | 77 | 39 | 139 |
| 50%, sem repetir Sigils no refresh seguinte | 81 | **36/81** | D190 | 142 | 72 | 165 |

**Diferenças face ao controlo, com intervalo de confiança de 95% via bootstrap emparelhado por grupo de seed (12.000 reamostragens; três políticas agrupadas):**

| Comparação emparelhada (coortes conjuntas) | Diferença em D200 | IC bootstrap 95% (p.p.) | Diferença média de crafts |
|---|---:|---:|---:|
| Mercado 4 Sigils, 35% (0,5 × craft) | -7.4 p.p. | [-24.7; +9.9] | -13.2 |
| Mercado 4 Sigils, 50% (1 × craft) | -3.7 p.p. | [-11.1; +3.7] | +0.9 |
| Mercado 4 Sigils, 65% (1,5 × craft) | -3.7 p.p. | [-9.9; +2.5] | +0.4 |
| 50%, sem repetir Sigils no refresh seguinte | -6.2 p.p. | [-13.6; +1.2] | +2.6 |

Os IC são *exploratórios*, sem correção para múltiplas alternativas, e não representam probabilidades de sucesso de jogadores reais. A mesma seed inicial não garante a mesma sequência de loot após as decisões divergirem.

## 5. Quão caro é conseguir uma afinidade útil?

| Cenário (todas as 81 campanhas) | Sigils comprados | Sucessos | Refreshes adicionais | Gold gasto no sistema | Fragments gastos em transferência | Gold / conversão | Fragments / conversão |
|---|---:|---:|---:|---:|---:|---:|---:|
| Mercado 4 Sigils, 35% (0,5 × craft) | 663 | 228 | 1,261 | 504,463 | 131,270 | 2,213 | 576 |
| Mercado 4 Sigils, 50% (1 × craft) | 119 | 57 | 193 | 141,796 | 87,150 | 2,488 | 1,529 |
| Mercado 4 Sigils, 65% (1,5 × craft) | 77 | 39 | 139 | 134,627 | 113,460 | 3,452 | 2,909 |
| 50%, sem repetir Sigils no refresh seguinte | 142 | 72 | 165 | 139,994 | 92,320 | 1,944 | 1,282 |

Estas são despesas **somadas** de todos os agentes, não custo por jogador. Em particular, `Gold / conversão` inclui **refreshes pagos + compra de Sigils** e `Fragments / conversão` inclui apenas **as tentativas de transferência**, tanto as bem-sucedidas como as falhadas.

Comparar `marketNoRefresh` e `marketFixed`: a primeira não compra refreshes *especificamente para Sigils*, mas a oferta dos Sigils também se renova quando o agente faz um refresh do Merchant de equipamentos (já pago). Não é um Merchant totalmente imutável.

## 6. Segurança e limitações

- **513 campanhas e 288,032 expedições**, 0 erros no runner e 0 saldos negativos de Gold/Fragments; o jogo não sofreu alterações.
- Os Sigils no experimento são quatro slots independentes dos quatro itens de equipamento que já existem no Merchant, mas partilham a mesma operação de **refresh paga**. Isto é uma **hipótese de UI**; o utilizador poderá preferir integrar Sigils nos próprios quatro slots de stock, em vez de adicionar quatro slots novos.
- As probabilidades e stock obedecem às 13 afinidades conhecidas e só transferem para afinidades legais do subtipo. Legendary e `legendaryId` são excluídas.
- Sigils são usados imediatamente após a compra nos ensaios; armazenamento no inventário, rollback de compra, sessões retomadas noutra visita, novas migrações de save e Firebase Rules **não foram testados**.
- Um refresh também renova o equipamento normal no Merchant, pelo que existe algum efeito indireto de mudança de stock no cenário de Sigils. Os restantes sistemas (Forge Quality e Legendary +10) são idênticos entre variantes.
- 600 expedições é um horizonte truncado e a decisão de procurar Sigils depende muito da política automatizada. Testar com jogadores reais continua obrigatório antes de adotar preços e UI.
- O código original `index.html` manteve o mesmo SHA-256; Shatter/Double Strike, scaling, Legendary signatures e testes do motor de progressão passaram (6/6 testes principais).

## 7. Decisão de design

Nenhuma variante superou o controlo nas coortes conjuntas. A mecânica é funcional como instrumento de *buildcraft*, mas a capacidade de concluir D200 não melhorou de forma demonstrável. Não aprovar ainda os custos numéricos para publicação.

**Direção recomendada para um protótipo:** mostrar quatro Sigils no Merchant, cada um com afinidade visível e preço de Gold; botão único que renova **todos os quatro** por Gold e pré-visualiza o custo. Na Forge, permitir usar o Sigil adquirido em equipamento não-Legendary com custo de transferência e probabilidades visíveis, opção de investir mais Fragments e **falha sem destruir a afinidade original**. Não aplicar limite artificial de rerolls ou de Sigils: o agente foi limitado só para evitar gasto automático descontrolado.

**Antes da v0.10.1:** confirmar se os Sigils ocupam quatro slots adicionais ou fazem parte dos quatro slots do Merchant, decidir se ficam guardados no inventário, verificar integridade dos saves e repetir os testes sobre o commit atual do jogo. Nenhuma modificação de gameplay, saves, Firebase, regras ou `main` foi efetuada.

### Reprodutibilidade

Código e dados individuais completos constam do ZIP `Wanderer_v0101_Teste_F_Merchant4Sigils_Dados_e_Scripts.zip` anexado na conversa. O GitHub recebe este relatório e o ficheiro agregado `docs/v0101-merchant-four-sigils-test-f-metrics.json` na branch `development`.