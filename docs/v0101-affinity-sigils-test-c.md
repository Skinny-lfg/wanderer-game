# Wanderer v0.10.1 — Teste C: Affinity Sigils (Merchant → Forge)

**Data:** 17 de outubro de 2026  
**Estado:** investigação offline concluída; nenhum código de gameplay, branch `main`, Firebase ou save real alterado.  
**Fonte:** ZIP da `main` fornecido pelo utilizador; SHA-256 de `index.html`: `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`. O código da `main` pode entretanto ter sido atualizado.

## 1. Objetivo e premissas

Avaliar Sigils comprados no Merchant por Gold para alterar uma afinidade de equipamento **não-Legendary** na Forge, gastando Fragments. Medimos probabilidade de sucesso, preservação/destruição da afinidade na falha, disponibilidade no Merchant e valor de completar tier 3/5. As sete armas e todas as afinidades continuam sujeitas aos pools de tipos de item da produção. Itens Legendary e habilidades únicas não podem ser alterados.

A implementação é apenas **simulada em código de pesquisa**. O jogo atual não guarda Sigils; nesta experiência o agente compra um Sigil e usa-o na mesma visita à cidade, sem armazenamento persistente, UI, save migration ou Firebase. O Merchant gera uma oferta de três Sigils únicos entre as 13 afinidades existentes, estável até mudar o stock de equipamento/refresh; esta oferta é uma **hipótese de design**, não uma funcionalidade existente. O agente só investe em equipamento Rare/Epic atualmente equipado e com tier >=65% da fronteira, quando o score da build melhora pelo menos 1,2% ou 5 pontos. A regra da mecânica permitiria qualquer raridade abaixo de Legendary.

## 2. Economia e probabilidades (exemplo de tier 100)

| Variante | Sigil (Gold) | Forge (Fragments) | Sucesso | Em falha |
|---|---:|---:|---:|---|
| Base 35% | 1.000 | 505 | 35% | conserva afinidade |
| +50% investimento | 1.000 | 1.010 | 50% | conserva afinidade |
| +100% investimento | 1.000 | 1.515 | 65% | conserva afinidade |
| Variante destrutiva | 1.000 | 1.515 | 65% | **retira afinidade** |
| Compra à escolha | 2.000 | 1.010 | 50% | conserva afinidade |

Custo de compra do Sigil: `100 + 9 × tier` Gold; custo da Forge: `round((10 + 10 × tier) × (0.5 + investimento))` Fragments. `investimento`=0 / 0.5 / 1.0. Como no Teste B, isto são **coeficientes experimentais**, não preços aprovados. Em falha, o Sigil e Fragments são sempre consumidos. Não existem rerolls de Legendary.

Valor médio por mudança bem-sucedida, sem contar a espera pelo Sigil, usando tentativas geométricas em tier 100:

| Variante | Gold esperado por sucesso | Fragments esperados por sucesso |
|---|---:|---:|
| 35% | 2.857 | 1.443 |
| 50% | 2.000 | 2.020 |
| 65% | 1.538 | 2.331 |

Estes custos esperados são **condicionais ao jogador repetir até ter sucesso** e não incluem itens perdidos/compra de gear ou oportunidade de gastar recursos noutras coisas.

## 3. Campanhas D1–D200

**252 campanhas no grupo exploratório**, 36 por configuração (12 seeds `931400–931411` × Casual, Experiente e Speedrun), até 600 expedições, com combate, Merchant, Forge, crafting, proteção de dois itens, mortes e recuperação de produção.

| Configuração | D200/36 | Casual / Experiente / Speed | D mediano | Farming mediano | Sigils medianos |
|---|---:|---|---:|---:|---:|
| Sem Sigils | 17/36 | 6 / 5 / 6 | 183.5 | 276 | 0 |
| 35%, falha preserva | 8/36 | 1 / 4 / 3 | 135 | 324.5 | 38.5 |
| 50%, +50% Fragments | 14/36 | 2 / 7 / 5 | 166.5 | 302.5 | 3 |
| 65%, +100% Fragments | 13/36 | 4 / 5 / 4 | 168 | 289 | 1.5 |
| 65%, falha destrói afinidade | 15/36 | 5 / 5 / 5 | 181 | 284.5 | 2 |
| 50%, só completar tier 3/5 | 14/36 | 4 / 6 / 4 | 170 | 298.5 | 3 |
| 50%, afinidade à escolha (Gold ×2) | 14/36 | 4 / 4 / 6 | 156 | 310.5 | 7.5 |

**Nenhuma variante demonstrou melhorar D200** na amostra. A variante barata de 35% regrediu de 17/36 para 8/36. A diferença emparelhada foi de −25,0 pontos percentuais (IC bootstrap 95% agrupado por seed, de −41,7 a −11,1 p.p.). São agentes automáticos, não jogadores; 12 clusters de seed e várias variantes testadas limitam a generalização.

Diferenças das outras variantes em D200 vs o controlo (IC bootstrap 95% por cluster de seed, não corrigido para múltiplas experiências):

| Configuração | Δ D200 | Intervalo 95% (p.p.) |
|---|---:|---|
| 35%, falha preserva | -25.0 p.p. | [-41.7, -11.1] |
| 50%, +50% Fragments | -8.3 p.p. | [-25.0, +5.6] |
| 65%, +100% Fragments | -11.1 p.p. | [-22.2, +0.0] |
| 65%, falha destrói afinidade | -5.6 p.p. | [-19.4, +8.3] |
| 50%, só completar tier 3/5 | -8.3 p.p. | [-25.0, +8.3] |
| 50%, afinidade à escolha (Gold ×2) | -8.3 p.p. | [-27.8, +11.1] |

## 4. Gold, Fragments e fricção

| Configuração | Tentativas totais | Sucessos totais | Gold mediano em Sigils | Fragments medianos em Sigils | Visitas medianas sem opção útil |
|---|---:|---:|---:|---:|---:|
| 35%, falha preserva | 1463 | 509 | 16512.5 | 7217.5 | 201.5 |
| 50%, +50% Fragments | 334 | 174 | 3719.5 | 3555 | 177 |
| 65%, +100% Fragments | 222 | 157 | 1297.5 | 1905 | 170.5 |
| 65%, falha destrói afinidade | 247 | 173 | 1325 | 1950 | 170.5 |
| 50%, só completar tier 3/5 | 226 | 119 | 1992.5 | 1825 | 205.5 |
| 50%, afinidade à escolha (Gold ×2) | 499 | 257 | 12234 | 6190 | 104 |

A versão 35% foi ativada demasiadas vezes: mediana de 38,5 tentativas por jogador, com mediana de 16.512,5 Gold e 7.217,5 Fragments consumidos. Com o sistema atual, estas moedas disputam recursos com gear, Forge e Merchant. Em contraste, os boosts maiores ficaram frequentemente inacessíveis, com poucos Sigils utilizados; subir probabilidade isoladamente não garante que o jogador consiga comprar mais poder.

Mesmo na versão moderada, o Merchant não oferecia uma opção útil em cerca de 177 visitas medianas de cidade. Os Sigils foram modelados como apenas três opções por stock, sem rotação gratuita. Isto sinaliza risco de **mais refreshes e trabalho repetitivo**. A versão com afinidade escolhida diretamente, mas Gold a dobrar, também não melhorou a progressão (14/36).

## 5. Validação com seeds independentes

Foram ainda **72 campanhas independentes** com 8 novas seeds `931440–931447` para o controlo, a variante de 50% e a variante seletiva (3/5).

| Variante | D200 /24 | Profundidade mediana |
|---|---:|---:|
| Sem Sigils | 10/24 | 179 |
| 50%, +50% Fragments | 7/24 | 115.5 |
| 50%, só completar tier 3/5 | 8/24 | 145 |

As duas variantes com Sigils voltaram a ficar abaixo do controlo. O resultado é **direcional**: a amostra é pequena e as mudanças de consumo de RNG entre trajetórias impedem contrafactuais perfeitos.

## 6. Valor de completar um tier de set — A/B isolado

Para separar valor mecânico do custo económico, fizemos **2.688 combates emparelhados** com exatamente o mesmo equipamento Rare/Epic e seeds, alterando a afinidade de **um único item não-Legendary** para completar 2→3 ou 4→5 peças de set. Sete armas, níveis D40, D100, D160 e D200, quatro elites e caminhos.

| Alteração | Pares | Vitórias antes | Depois | Δ HP médio restante |
|---|---:|---:|---:|---:|
| 2->3 peças | 672 | 304 | 309 | +0.68 p.p. |
| 4->5 peças | 672 | 332 | 330 | -0.05 p.p. |

**Interpretação:** completar um set não melhorou universalmente a vitória. Em certos casos o item perdeu outra afinidade que já contribuía para uma segunda sinergia, e o efeito líquido foi neutro ou negativo. O sistema deve calcular **antes/depois da build**, incluindo tiers de ambos os sets, e informar o jogador sobre o que ganha *e perde*. Os combates isolados não incluem decisões humanas nem contam o benefício de trocar de build no futuro.

## 7. Variante destrutiva: segurança e valor

Na variante de 65% com falha destrutiva, ocorreram **74 afinidades removidas** nas 36 campanhas. D200 ficou em 15/36 contra 13/36 na alternativa não destrutiva; esta diferença é pequena, incerta e não justifica impor uma penalização permanente. Não há vantagem comprovada que compense a frustração possível de perder um item-chave após ter pago Gold, Fragments e um Sigil.

## 8. Segurança técnica e reprodutibilidade

- Guardas de item e 13 afinidades passaram: Legendary não é elegível; pool legal do subtype/slot respeitado; Gold/Fragments não negativos; oferta Merchant estável enquanto não muda o stock; chance via PRNG determinístico separado do RNG de combate.
- Na pesquisa surgiram inicialmente dois falsos positivos na verificação de afinidade Crystal antiga fora do pool regular. A validação foi corrigida para confirmar a legalidade **apenas quando houve sucesso de reroll**. Os dois casos foram repetidos, ficando **324 campanhas sem erros**. O código original não mudou.
- Passaram os testes do motor v0.10.0 de afinidades/Sunder/Shield/Regen, Shatter/Double Strike, 19 habilidades Legendary e 6 testes de habilidades/progressão.
- Totais: **324 campanhas**, **183.461 expedições**, **2.688 combates A/B adicionais**; estudo offline, sem browser de produção, Firebase, jogadores reais ou deploy.
- A habilidade de compras/Forge e o uso dos Sigils ocorreram na mesma visita: não existe inventário persistente de Sigils validado. Os Sigils não aparecem no catálogo real do Merchant; os 3 espaços e preços são hipóteses.
- Vários cenários e apenas 12/8 seeds por política; intervalos exploratórios e sem correção de comparações múltiplas. A melhoria da pontuação pelo agente também não equivale necessariamente a maior probabilidade de vencer; muitas sinergias alteram o controlo ou a duração sem alterar win rate.

## 9. Decisão para v0.10.1

**NÃO IMPLEMENTAR OS PREÇOS E PROBABILIDADES ATUAIS COMO ESTÃO.** A ideia é compatível com o foco em buildcraft, mas os agentes gastam demais ou raramente encontram uma opção útil, e os resultados não mostram benefício de progressão.

Se avançarmos para um protótipo UX, testar primeiro:

1. **Falha preserva a afinidade original** e destrói apenas o Sigil + Fragments. Não retirar afinidades existentes como penalização.
2. **Legendary fora do sistema**, também excluir Sigils de efeitos que o subtype não suporta.
3. Mostrar **mudanças efetivas de set 2/3/5, sinergias que desaparecem, custos e probabilidades** antes da confirmação.
4. **Sigil escolhido pelo jogador ou catálogo direcionado**, em vez de depender exclusivamente de rerolls cegos do Merchant; preço e raridade ainda precisam de um teste separado.
5. Não gastar automaticamente: o jogador escolhe o item e a afinidade, e o simulador deve modelar uma política com julgamento de utilidade esperado e limites de orçamento.
6. Simular **em conjunto** Forge Quality e Legendary +10 do possível update v0.10.1, incluindo economia e perda por morte, antes de aprovar qualquer alteração da main.

**Nada foi implementado no jogo**. Documentação e métricas poderão ser publicadas apenas em `development`.