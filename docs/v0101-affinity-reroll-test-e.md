# Wanderer v0.10.1 — Teste E: Reroll repetível de Affinity Sigils

**Data:** 17 de outubro de 2026  
**Estado:** estudo offline concluído. Apenas proposta; **gameplay, `main`, Firebase, rules e saves inalterados**.  
**Código ensaiado:** ZIP da `main` fornecido no início da investigação, SHA-256 `index.html` = `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`. A `main` recebeu commits depois deste ZIP; **os resultados não validam automaticamente o HEAD atual**.

## Resumo executivo

O sistema de reroll de afinidade é tecnicamente viável, com restrições legais e exclusão de Legendary. **O perigo não é o acaso por tentativa, mas o orçamento e a frequência com que o jogador decide usá-lo.** Os agentes automáticos que compram Sigils frequentemente gastam recursos valiosos que poderiam usar na Forge Quality ou numa Legendary +10; não foi demonstrado aumento confiável de jogadores que terminam D200. Com uso moderado, os agentes fizeram alterações úteis de afinidade sem reduzir as conclusões D200 da coorte emparelhada, embora algumas métricas de profundidade e farming piorem marginalmente.

Recomendação: **candidato a protótipo**, não aprovação numérica para implementação. Se for implementado, permitir **um Sigil genérico por item/alvo, persistindo entre visitas à Forge, com custo fixo por tentativa, mantendo a afinidade original até aceitar a pretendida**, e com alertas/limites voluntários de orçamento. Não usar preço progressivo por tentativa. Pity após seis falhas foi eficiente na amostra, mas funciona como garantia e necessita de uma validação específica sobre acessibilidade dos sets.

## Especificação experimental

- Merchant vende um Sigil genérico, **Gold pago uma vez** por item/alvo, preço = `100 + 9 × tier da fronteira`; no tier 100 é ~1.000 Gold.
- Na Forge, o utilizador escolhe equipamento Rare/Epic e a afinidade pretendida. Tecnicamente a funcionalidade respeita o pool de afinidades da peça e exclui Legendary e itens com `legendaryId`. O agente limitou-se a investir em Rare/Epic próximos da fronteira — não testou o valor de Common/Uncommon.
- Cada reroll sorteia uma das **afinidades permitidas**, excluindo a afinidade atualmente conservada no equipamento. Se ainda não sair a desejada, a mudança não é aplicada. Só **aceitar a afinidade-alvo** altera `effect` / `magic` da peça.
- Cada tentativa base custa **20% do craft da fronteira** em Fragments (~202 para craft de 1.010). **Fixo:** mesma taxa; **Progressivo:** +22% por falha; **Premium:** dobro dos Fragments com peso dobrado para a afinidade escolhida; **Pity:** sétimo sorteio garantido após seis falhas pagas.
- No primeiro modelo descartável, a sessão terminava depois de 12 tentativas ou por falta de Fragments, destruindo o Sigil. Isso não correspondia bem à intenção do utilizador.
- No modelo **persistente** correto, o Sigil fica ligado ao item + afinidade desejada e pode continuar **noutra visita à Forge**, pagando Fragments por sorteio. Máximo de seis cliques por visita é limite do *agente*, não limite vitalício. Se o item se perde ou sai do inventário, a sessão termina e o investimento pode ser perdido.
- No modo de **orçamento controlado**, só se compra um novo Sigil a cada 12 expedições, no máximo dez por campanha, e o agente reserva dinheiro para Forge/Legendary, restringindo despesa com reroll a aproximadamente 12% dos Fragments e 20% do Gold contabilizados como obtidos. São decisões de um agente, **não regras propostas de jogo**.
- Todos os cenários de campanha têm **Forge Quality +100%** e **Legendary +10** já ativados e usam as mesmas regras reais de loot, combate, mortes, crafting, Merchant e save *offline*; apenas o comportamento Sigil difere. D1–D200, horizonte de 600 expedições e políticas Casual/Experiente/Speedrun.

## A. Chances: 600.000 sessões Monte Carlo independentes

**30.000 sessões por pool × variante**, máximo de 12 sorteios e orçamento simulado de 5.000 Fragments ao tier 100. Percentagens referem-se a encontrar a afinidade-alvo antes de terminar a sessão; incluem travão do orçamento. A permissão de voltar a tentar em dias seguintes não foi usada nesta secção.

| Affinities legais na peça | Custo fixo | Progressivo +22% | Pity após 6 falhas | Premium alvo ×2 |
|---|---:|---:|---:|---:|
| 4 | 99.2% | 97.3% | 100.0% | 100.0% |
| 5 | 96.7% | 92.6% | 100.0% | 99.8% |
| 6 | 93.2% | 86.2% | 100.0% | 99.2% |
| 7 | 88.9% | 80.5% | 100.0% | 98.3% |
| 13 | 64.8% | 54.1% | 100.0% | 86.5% |

A verdadeira probabilidade num sorteio é 1/(N−1): Mace 33,3%, Bow/Daggers 25%, Two-Handed 20%, Staff/Wand 16,7%, armadura/joias 8,3%. O pity torna a sessão 100% exitosa **desde que o orçamento permita chegar à 7.ª tentativa**; não é garantia de custo fixo.

Para 13 afinidades legais, a despesa média em Fragments no teste isolado foi: **1569 fixo**, **2968 progressivo**, **1103 pity**, **2265 premium**. Isto reforça a rejeição do preço progressivo como padrão.

## B. Sessões descartáveis — testar erro de design

**66 campanhas** por cenário (seeds `931600–931611` e `931680–931689`, três políticas). Um Sigil pago perde-se se os Fragments se esgotarem; até 12 sorteios por compra.

| Variante | D200 | Sigils comprados | Alvos obtidos | Sorteios cobrados |
|---|---:|---:|---:|---:|
| Controlo | 27/66 | 0 | 0 | 0 |
| Fixo · Sigil perde-se ao parar | 29/66 | 1815 | 438 | 4344 |
| Pity · Sigil perde-se ao parar | 21/66 | 1891 | 459 | 4438 |
| Premium · Sigil perde-se ao parar | 26/66 | 1901 | 365 | 1990 |

Nas variantes não-persistentes, os agentes compraram ~1.800–1.900 Sigils em 66 campanhas. A taxa de sucesso por sessão ficou muito abaixo da probabilidade teórica com orçamento completo, porque alguns agentes conseguiam pagar apenas uma ou duas tentativas. **Este modelo não deve ser lançado:** incentiva despesas repetidas sem preservar o direito de continuar a procurar a afinidade.

## C. Sigil persistente — controlo vs uso frequente ou moderado

**54 campanhas** por cenário, com seeds `931700–931707` e `931740–931749`, três políticas, até 600 expedições. São seeds novas para esta fase.

| Variante | D200 | Sigils comprados | Mudanças concluídas | Sorteios | Gold em Sigils | Fragments em rerolls |
|---|---:|---:|---:|---:|---:|---:|
| Sem Sigil | 26/54 | 0 | 0 | 0 | 0 | 0 |
| Persistente · custo fixo | 17/54 | 1066 | 743 | 8075 | 486.184 | 641.564 |
| Persistente · pity 7.ª | 23/54 | 1064 | 908 | 5041 | 512.597 | 435.216 |
| Persistente · premium | 18/54 | 1030 | 654 | 4025 | 455.152 | 600.688 |
| Orçamento · custo fixo | 26/54 | 56 | 43 | 461 | 52.175 | 77.708 |
| Orçamento · pity 7.ª | 26/54 | 44 | 41 | 230 | 38.798 | 41.448 |

Com uso frequente, a versão fixa consumiu **641,564 Fragments** e **486,184 Gold**, obtendo **743** mudanças, mas só **17/54** D200 contra **26/54** controlo. O impacto de completion emparelhada foi **-16.7 p.p.**, IC bootstrap 95% [-33.3; +1.9], ainda incerto. O Premium teve **18/54**; o Pity frequente **23/54**.

**Orçamento controlado** atingiu **26/54** conclusões, tal como o controlo, com **43 mudanças efetivas** no custo fixo e **41** no pity. O custo fixo consumiu **77,708 Fragments**; pity consumiu **41,448** e ativou a garantia **17 vezes**. Uma diferença negativa de profundidade média ainda existiu (−3,7 e −6,9 níveis, respetivamente), portanto **número de vitórias idêntico não significa ausência total de impacto**.

A política ultra-seletiva, que exigia completar tiers 3 ou 5 com ganho de score ≥4,5%, só comprou **um Sigil em 54 jogadores**. É praticamente equivalente a desligar a funcionalidade; não é prova de balanceamento.

As taxas por jogador dependem muito dos critérios artificiais de escolha. Os **intervalos por bootstrap emparelhado de 16.000 amostras** reagruparam as três políticas por seed; não corrigem múltiplos cenários. O sorteio de loot após decisões diferentes não mantém trajetórias aleatórias idênticas, mesmo partindo das mesmas seeds.

## D. Resultado e proposta para a v0.10.1

1. **Manter Sigil persistente** associado ao item e alvo; o próximo dia/visita permite continuar o reroll, sem pagar novamente Gold pelo Sigil. Não impor hard cap de tentativas; deixar o limite ser os Fragments disponíveis, com possibilidade de pausa.
2. **Custo fixo e probabilidades transparentes** como primeira opção de protótipo (Gold do Sigil + 20% do custo de craft por reroll). Os valores foram testados, não aprovados como preços finais.
3. **Original intocada até confirmação.** Mostrar a afinidade desejada, probabilidade por roll, custos totais já pagos, slots permitidos, tier bonus ganhos/perdidos e um aviso se o item ou Sigil se puder perder ao morrer.
4. **Budget guard na UX:** apresentar o impacto da próxima tentativa no saldo de Fragments; oferecer ao jogador um aviso ou opção de parar, sem limites obrigatórios de despesa. Nenhum motivo estatístico para tornar obrigatório o teto de 10 Sigils do agente.
5. **Adiar pity automático** até estudo do efeito na aquisição de 5-piece sets. Garantia ao 7.º roll torna a escolha bastante acessível para peças com 13 afinidades; precisa de estudo de late-game e progressão real.
6. **Não permitir Legendary**. Verificar ID, pool legal, item ownership, falha, morte, troca da peça, stash e serialização do Sigil pendente em save antes de implementar. Essas migrações e alterações a Firebase rules **não foram testadas**.

**Decisão:** o conceito **pode avançar para protótipo de UX na v0.10.1**, mas não há fundamento para aprovar preços, probabilidade ou implantação no jogo com estes testes. A Forge Quality e Legendary +10 continuam a ser prioridades mais bem fundamentadas, e o reroll deve continuar **opcional**, evitando uso automático em excesso.

## Verificações e artefactos

- Simulador de produção `index.html` carregado em Node VM com `combat/legendary.js`; nenhum acesso a Firebase.
- Total de **738 campanhas gravadas**, **416,974 expedições** nos dois conjuntos de experiência; **0 erros** nas campanhas e **0 saldos Gold/Fragments negativos**.
- Testes de regressão na cópia completa do jogo: `v0100-affinity-scaling` PASS; `v093-shatter-double-strike` PASS; `legendary-signatures` PASS; `v010 abilities/progression` 6/6 PASS.
- SHA-256 de `index.html` idêntico antes/depois; alterações experimentais apenas em scripts de pesquisa. 
- Os dados brutos, matriz de probabilidades, scripts de teste e análise bootstrap estão no arquivo `Wanderer_v0101_Teste_E_Reroll_Dados.zip` desta conversa. Os resultados são sobre o código da ZIP, **não** sobre o último HEAD do GitHub.