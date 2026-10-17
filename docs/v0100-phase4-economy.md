# Wanderer v0.10.0 — Fase 4: Gold, Fragments, Forge e Merchant
**Data:** 17 de outubro de 2026  
**Estado:** simulações offline terminadas; nenhum gameplay, Firebase, save ou branch `main` alterado.  
**Origem:** ZIP da `main` fornecido pelo utilizador; SHA-256 `index.html`: `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`.

## Objetivo
Verificar a contribuição de cada economia para a progressão D1–D200, distinguir **recurso sem uso** de **mau comportamento do agente** e avaliar alternativas que reduzam repetição de refresh/craft sem trivializar o jogo.

## Método e controlo
- Motor de combate, drop, Merchant e Forge real da v0.10.0, isolado em Node VM. Mesmo modelo de decisão inteligente da Fase 3B **`combined`**, com prevenção de risco, recuperação e heurística de comparação de equipamento, em **todos** os braços.
- Controlo de **30 campanhas** herdado diretamente da Fase 3B (`combined`) para seeds `931000`–`931009`, 10 Casual, 10 Experienced e 10 Speed-oriented. **Cinco braços novos de 30 campanhas** cada, com as mesmas seeds, política, preferência de arma e máximo de **600 expedições**. Total novo: **150 campanhas, 86.290 expedições**; total incluindo controlo emparelhado: **180 campanhas, 103.381 expedições**.
- Resultados de **controlo reproduzidos exatamente em 9/9 campanhas** com o runner desta fase, incluindo vitórias, equipamento e balanços. Teste isolado da Forge -25% só altera `craftCost` **em memória**, não no código publicado. Sem dados reais de utilizadores.
- O Merchant conserva stock entre visitas, salvo compras (cada compra repõe a unidade) ou refresh pago. Os braços de 0/1/2 refreshes estudam esse comportamento; **não** criam automaticamente stock novo gratuito.
- As políticas automáticas são *hipóteses de jogador*, não telemetria real. O facto de comparar a mesma seed controla o início, mas diferenças de ações consomem RNG e produzem loot futuro divergente. Os IC seguintes fazem bootstrap de **10 seeds agrupadas** (cada seed com 3 estilos de política) e são exploratórios, sem correção para múltiplos testes.

## 1. Principais resultados

| Cenário | D200 /30 | Mediana de dungeon | Power final mediano | Farms medianos |
|---|---:|---:|---:|---:|
| Economia atual / agente otimizado | **10/30** | D155.5 | 5 458 | 336 |
| Sem Merchant | **4/30** | D59 | 2 046 | 399 |
| Sem Forge | **5/30** | D73 | 2 387 | 390 |
| Sem refresh do Merchant | **2/30** | D51.5 | 1 923 | 397 |
| Máx. 1 refresh por visita | **13/30** | D173.5 | 6 428 | 282 |
| Forge -25% custo | **14/30** | D186.5 | 6 239 | 290 |

**Importante:** “Economia atual” significa as **regras económicas atuais** controladas por um **agente de town otimizado**, não um jogador típico. A Fase 3B identificou diferenças enormes face à heurística baseline pouco ativa no Merchant.

## 2. Consumo e acumulação de moeda

| Cenário | Compras Merchant | Refreshes | Gold gasto na loja | Forge crafts | Fragments gastos na Forge | Gold final | Fragments finais |
|---|---:|---:|---:|---:|---:|---:|---:|
| Economia atual / agente otimizado | 37.5 | 208 | 63 459 | 389.5 | 161 770 | 5 688 | 2 759 |
| Sem Merchant | 0 | 0 | 0 | 337 | 90 390 | 51 744 | 1 855 |
| Sem Forge | 48.5 | 189.5 | 55 300 | 0 | 0 | 4 149 | 110 363.5 |
| Sem refresh do Merchant | 4 | 0 | 344.5 | 382.5 | 104 815 | 53 471.5 | 1 893.5 |
| Máx. 1 refresh por visita | 32.5 | 142 | 63 960.5 | 390.5 | 272 600 | 10 614.5 | 3 037.5 |
| Forge -25% custo | 32 | 222 | 69 828.5 | 509.5 | 205 733 | 8 490.5 | 18 998 |

**Interpretação:**
- **Sem Merchant:** Gold final mediano **51 744**, contra **5 688** com utilização otimizada da loja; desaparece uma opção importante de converter Gold em força.
- **Sem Forge:** Fragments finais medianos **110 364**, contra **2 759** no controlo; falta um sink que cria melhorias de equipamento e permite escolher o slot.
- **Sem refresh:** a oferta do Merchant fica desatualizada à medida que se desbloqueiam dungeons, exceto quando uma compra repõe um item. Isto é uma *dependência estrutural dos refreshes pagos*, não uma prova de que o jogador deve ser forçado a fazer mais cliques.
- **Até 1 refresh por visita:** medianas **142 versus 208 refreshes** (≈32% menos ações), **13/30 versus 10/30** conclusões; diferença insuficiente para demonstrar melhoria real da progressão. É a alternativa de **simplificação de comportamento** mais interessante desta fase.
- **Forge −25%:** **509,5 versus 389,5 crafts** medianos (~31% mais ações de crafting); sobe de 10 para 14 conclusões mas pode **aumentar o trabalho repetitivo** e produzir mais itens descartáveis. Redução de preço não reduz por si só a fricção da experiência.

## 3. Intervalos de incerteza A/B por seed

| Variante vs controlo | Mudança D200 | Bootstrap 95% Δ taxa de conclusão | Mudança média de nível máximo | Bootstrap 95% Δ nível |
|---|---:|---:|---:|---:|
| Sem Merchant | -6/30 (-20 p.p.) | [-36.67; -3.33] p.p. | -42 | [-62.63; -19.73] |
| Sem Forge | -5/30 (-16.7 p.p.) | [-40; 3.33] p.p. | -38.9 | [-62.67; -17.63] |
| Sem refresh do Merchant | -8/30 (-26.7 p.p.) | [-50; -10] p.p. | -46.1 | [-81.07; -14.8] |
| Máx. 1 refresh por visita | +3/30 (+10 p.p.) | [-10; 26.67] p.p. | +10 | [-5.73; 26.47] |
| Forge -25% custo | +4/30 (+13.3 p.p.) | [-6.67; 33.33] p.p. | +11.3 | [-13.77; 35.1] |

Amostra de apenas **10 seeds independentes**, agrupando os três perfis por seed. Os intervalos são descritivos e a multiplicidade de braços aumenta o risco de falsos positivos. As quedas sem Merchant e sem refresh são sugestivas; os dados **não** aprovam já um desconto de Forge nem estabelecem a superioridade de um refresh.

## 4. Diferenças por tipo de jogador

| Cenário | Casual | Experienced | Speed-oriented |
|---|---:|---:|---:|
| Economia atual / agente otimizado | 4/10 (D95) | 4/10 (D178) | 2/10 (D160.5) |
| Sem Merchant | 0/10 (D46.5) | 2/10 (D168.5) | 2/10 (D52) |
| Sem Forge | 2/10 (D118.5) | 0/10 (D67.5) | 3/10 (D60) |
| Sem refresh do Merchant | 0/10 (D37) | 1/10 (D76.5) | 1/10 (D79) |
| Máx. 1 refresh por visita | 2/10 (D64) | 6/10 (D200) | 5/10 (D197.5) |
| Forge -25% custo | 1/10 (D99) | 5/10 (D197) | 8/10 (D200) |

Estas categorias refletem **políticas de IA** de proteção, risco e equipamento, não clusters humanos. Por exemplo, Forge −25% melhora sobretudo Speed-oriented neste conjunto, mas regressa em Casual. Atribuir diferenças a um só número seria prematuro.

## 5. Economia real: preços e raridades

Regras confirmadas diretamente no `index.html` testado:

- **Forge:** `craftCost(tier) = 10 + 10 × tier` Fragments; no tier 20/100/200: **210 / 1 010 / 2 010** Fragments (a simulação tende a usar tier `maxDungeon−1`). O item tem slot alvo escolhido; subtype de arma escolhido; affinity sorteada de um pool legal; **não produz Legendary**.
- **Merchant:** stock de 4 itens, refresh manual `16 + 4 × (maxDungeon − 1)` Gold; no nível máximo desbloqueado 20/100/200: **92 / 412 / 812 Gold** por refresh. Preço do item `round((24 + 12 × tier) × multiplicador de raridade)`; **não vende Legendary**. Comprar repõe o item comprado; visitar novamente não renova automaticamente todos os 4.
- **Raridade na Forge:** com equipamento craftado um tier atrás da fronteira, a distribuição teórica é aproximadamente Common **47,8%**, Uncommon **30%**, Rare **15,4%**, Epic **6,8%**, Legendary **0%**. O avanço da fronteira e a diferença de tier afetam o resultado real. No conjunto das Forge das novas campanhas, a fração Epic observada foi ~6,8–7,0%, consistente com a regra.
- **Loot Legendary:** vem da exploração/dungeons, não do Merchant/Forge; por isso aumentar o volume de crafting não gera diretamente Legendary, mas pode facilitar a obtenção via progressão mais rápida e maior acesso a bosses.
- **Outras despesas:** o ledger de cada agente contabiliza Gold gasto em Merchant (compra+refresh) e Fragments gastos na Forge; **não** é uma contabilidade de todos os gastos possíveis no jogo (entradas em dungeon, rerolls de dungeon, etc.). Evitar chamar `saldo final + gasto em Forge` de “Fragments ganhos”.

## 6. Recomendação de design

1. **Não baixar já os preços.** A Forge −25% aumentou número de crafts e teve ganho de conclusão estatisticamente incerto. Se quisermos testar um desconto, fazê-lo condicionado à estagnação e com limite de crafts, não como buff global.
2. **Reduzir fricção, não necessariamente taxas:** na próxima fase medir um Merchant que renove a oferta por milestone de nível ou facilite visualizar upgrades/afinidades, sem refreshes grátis ilimitados. O teste 1-refresh indica potencial para menos ações mantendo progressão, mas é só um candidato de UX.
3. **Dar uso a Gold e Fragments que respeite buildcraft:** pesquisar alternativas de sink sobre escolha estratégica (reroll orientado de slot, investimento de qualidade com teto), evitando conversão direta em Legendary garantida. Essas alternativas ainda **não foram implementadas nem testadas**.
4. **Verificar equipar/comprar e salvaging em jogadores reais:** a IA converte centenas de crafts em power quase instantaneamente. Humanos podem sentir cliques demais. Medir satisfação, tempo por sessão e número de itens inspecionados antes de alterar drop rates.
5. **Não confundir stress com balance final:** revalidar com mais seeds e horizonte 900/1200 antes de publicar um ajuste económico. A percentagem de vitórias em D200 é muito sensível às decisões e ao limite de 600 runs.

## 7. Reproduzir e limites

Reproduzir a partir do ZIP local da `main` correspondente ao hash, copiando `index.html`, `combat/` e os scripts de simulação (necessários `simulate-v091.cjs`, `v010-balance-ab.cjs` e o agente research `phase4-agent.cjs`). Executar `node scripts/phase4-batch.cjs MODE 10 /caminho/resultado.json` para `noMerchant`, `noForge`, `noRefresh`, `oneRefresh` ou `discountForge`, dentro de uma cópia separada. O agente de controlo da Fase 3B é `combined`, seeds 931000–931009. **O teste de controlo coincidiu em todos os campos de gameplay e moeda nas nove campanhas de validação (9/9).**

Ficheiro JSON agregado: `docs/v0100-phase4-economy-metrics.json`; séries por campanha e scripts de reprodução foram gerados no ambiente isolado. As limitações principais são: n=10 seeds/política; diferenças na sequência de RNG depois das decisões; agente artificial; sensores de loot não equivalente a feedback humano; truncagem a 600 expedições; múltiplos braços exploratórios. Não se alterou a `main`, o código-fonte original, o Firebase ou os saves.