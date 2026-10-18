# Wanderer v0.10.1 — Teste B: Melhorar equipamento Legendary com Fragments

**Data:** 17 de outubro de 2026  
**Estado:** investigação concluída, **nenhuma alteração implementada**. Proposta para v0.10.1; não é autorização para publicar.  
**Código testado:** cópia da `main` v0.10.0 fornecida no chat; SHA-256 de `index.html`: `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`. Relatórios publicados apenas em `development`.

## Resumo executivo

- **Recomendação:** prototipar reforços Legendary **até +10**, com **+2% dos atributos base positivos por rank**, escalonamento linear, 100% de sucesso e custo progressivo em Fragments. O tier, a identidade, o nome, a afinidade e a fórmula das habilidades não mudam; os efeitos derivados podem crescer indiretamente com atributos.
- **Não permitir reforços ilimitados na primeira versão.** Não apresentaram ganho consistente sobre +10 e criam risco de acumulação de poder no pós-D200.
- **Não dispensar proteções:** foram observadas perdas expressivas de Fragments investidos quando as Legendary equipadas não estavam entre os dois itens protegidos.
- **Não decidir lançamento com este teste apenas:** o modelo exige mais verificação em sessão humana, saldo de Fragments no pós-D200 e teste isolado do futuro sistema de Affinity Sigils.

## 1. Desenho experimental

Simulámos o combate e a progressão efetivos da v0.10.0 via `scripts/simulate-v091.cjs` e um agente experimental baseado na política inteligente da Fase 3B: extração por risco, compras com avaliação de sinergia, Forge, perdas por morte, runas e progresso persistente D1–D200. As melhorias foram aplicadas **somente aos objetos em memória** e pagas ao saldo de Fragments da campanha.

- Coorte de exploração: **12 seeds por política**, com 12 Casual, 12 Experientes, 12 Speedrun por braço = **144 campanhas**.
- Validação independente: **10 novas seeds por política** = **120 campanhas adicionais**.
- Total controlado: **264 campanhas, 144,195 expedições**, até 600 expedições/campanha; quatro cenários × 66 jogadores. Sem erros.
- Stress separado: **66 campanhas adicionais (37,054 expedições)** com instrumentação de perdas de Fragments (não combinadas com a comparação A/B).
- Mesmo seed inicial e mesma estratégia base por braço. Como atributos diferentes alteram os combates e aquisições futuras, a sequência posterior de RNG pode divergir. As estratégias automatizadas não simulam jogadores humanos.

### Regras hipotéticas do upgrade

**Custo do próximo rank:** `round((25 + 4 × tier do item) × 1,14^rank atual)` Fragments. Sucesso garantido; apenas Legendary. O agente investe no máximo duas vezes por visita à vila, apenas em Legendary equipadas cujo tier seja pelo menos 68% do nível mais alto desbloqueado, e mantém uma reserva de Fragments. Isto é **uma política de teste**, não uma regra aprovada do jogo.

| Variante | Bónus por rank | Rank máximo | Efeito aos ranks 10 / 20 / 30 |
|---|---|---:|---|
| Controlo | Sem upgrades | 0 | — |
| Cap +10 | +2% da estatística base | 10 | +20% / — / — |
| Soft cap +20 | +2% até 10, depois +0,5% | 20 | +20% / +25% / — |
| Ilimitado | +2% do valor base a cada rank | Sem limite de jogo | +20% / +40% / +60% |

Aumentaram-se os campos originais positivos `atk`, `def`, `hp`, `spd`, `str`, `agi`, `int`, `end`, `cha`, `mana` e `spell`. Valores negativos (penalização de speed), tier, afinidade, rarity, nome, ID, skill e cooldown ficaram intactos. Como danos/healing de skills podem usar atributos do personagem, a eficácia prática de algumas skills pode aumentar indiretamente.

### Custos acumulados para reforçar o mesmo item

| Tier da Legendary | +10 | +20 | +30 |
|---|---:|---:|---:|
| D40 | 3.577 | 16.838 | 66.004 |
| D100 | 8.217 | 38.684 | 151.634 |
| D160 | 12.859 | 60.530 | 237.261 |
| D200 | 15.951 | 75.094 | 294.347 |

## 2. Resultados persistentes D1–D200

| Variante | Concluíram D200 | D200 Casual / Exp. / Speed | Farming mediano | Crafts medianos | Fragments em upgrades (mediana) |
|---|---:|---|---:|---:|---:|
| Sem upgrades | 28/66 | 6 / 9 / 13 | 292 | 392 | 0 |
| Cap +10 | 36/66 | 15 / 9 / 12 | 246,5 | 376,5 | 23.305 |
| Soft cap +20 | 37/66 | 16 / 9 / 12 | 246,5 | 376 | 27.128 |
| Ilimitado | 35/66 | 14 / 9 / 12 | 255,5 | 376,5 | 26.131 |

**Validação independente (30 por braço):** baseline **12/30**, +10 **15/30**, soft +20 **15/30**, ilimitado **15/30**. O +10 melhorou o número bruto de vitórias, mas os outros dois modos não demonstraram benefício adicional consistente.

### Comparações emparelhadas (66 jogadores por braço)

Bootstrap de **30.000 reamostragens por seed**, agrupando as três políticas do mesmo seed; intervalos exploratórios de 95%, sem correção por múltiplos testes.

| Comparação | Diferença na conclusão D200 | IC aproximado 95% | Variação média de farming |
|---|---:|---|---:|
| Cap +10 vs controlo | +12.12 p.p. | [-1.52, +25.76] p.p. | -41.7 runs |
| Soft +20 vs controlo | +13.64 p.p. | [+0.00, +27.27] p.p. | -44.8 runs |
| Ilimitado vs controlo | +10.61 p.p. | [-3.03, +22.73] p.p. | -41.3 runs |

**Interpretação:** a direção do efeito do +10 é promissora (sobretudo Casual), mas o intervalo inclui ausência de melhoria. Não há evidência de que remover o limite melhore o ritmo de D200. É perigoso ler “soft +20 teve uma vitória a mais” como prova a favor desse design.

## 3. Combates emparelhados com inventários adquiridos historicamente

Reproduzimos o combate atual usando **48 inventários** com pelo menos uma Legendary que tinham sido efetivamente obtidos na simulação histórica do jogo (D40/100/160/200), **12 seeds por inventário × 6 modalidades = 3.456 combates**. Variantes de uma só Legendary reforçada distinguem-se das variantes onde TODAS são reforçadas artificialmente; estas últimas são limites superiores hipotéticos, não upgrades gratuitos numa campanha real.

| Dungeon | N.º inventários | Vitórias sem upgrades | +10 numa Legendary | +10 em todas as Legendary |
|---|---:|---:|---:|---:|
| D40 | 25 | 85.0% | 93.3% | 95.7% |
| D100 | 10 | 92.5% | 96.7% | 96.7% |
| D160 | 8 | 99.0% | 99.0% | 99.0% |
| D200 | 5 | 100.0% | 100.0% | 100.0% |

**Efeito de teto:** as vitórias de D160–D200 já estavam quase ou totalmente nos 100%. Mesmo sem melhorar win rate, o +10 aumentou HP restante e reduziu ligeiramente a duração. Não concluir que é inofensivo para jogadores mais fortes; é necessário observar breakpoints, velocidade de boss e Legendary específicas.

## 4. Uma Legendary antiga substitui equipamento novo?

Comparámos **37 Legendary adquiridas em D40 (tier mediano 33)** com novos Epic do mesmo subtipo e afinidade gerados pelas fórmulas reais em D100, D160 e D200. Usámos a métrica ponderada de atributos do item (não damage real nem valor das habilidades únicas).

| Novo Epic comparado | Old Legendary sem reforço | Old Legendary +10 | Old Legendary +30 ilimitado | Casos +10 com atributos ≥ Epic |
|---|---:|---:|---:|---:|
| D100 | 43.4% | 52.1% | 69.6% | 0/37 |
| D160 | 27.5% | 33.0% | 44.1% | 0/37 |
| D200 | 22.2% | 26.6% | 35.5% | 0/37 |

**Conclusão:** com aumento fixo de atributos base, uma Legendary antiga não permanece competitiva por toda a campanha apenas por ter +10. As habilidades Legendary podem justificar o uso de algumas peças antigas; este teste de atributos não mede isso. Se o objetivo for elevar literalmente o **tier do item**, isso é um sistema diferente e requer simulação própria.

## 5. Risco de perda por morte

Nas **66 campanhas instrumentadas** adicionais com +10, 37 jogadores perderam pelo menos uma Legendary melhorada ao morrer desprotegida. Perderam-se **71 itens melhorados**, que continham **96.165 Fragments de investimento**, equivalentes a **8,1%** dos 1.194.156 Fragments gastos nesse grupo. A maior perda individual foi de **14.116 Fragments**.

O agente protegia automaticamente **Weapon + Armor**, conforme as políticas anteriores; outros slots melhorados (Helm, Rings, Amulet, Gloves, Boots, Off-Hand) podiam ser perdidos. Estes dados não significam que a Forge deva garantir os itens: significam que o jogador deve compreender claramente o risco **antes de gastar** e **antes de entrar na dungeon**.

## 6. Regras de protótipo sugeridas para v0.10.1

1. **Upgrades Legendary de +0 a +10**, sem falha aleatória; cada rank aumenta em 2% os atributos positivos **originais** (no +10 = +20%; soma linear). O processo nunca muda afinidade, identidade, tier, raridade, skill ou cooldown.
2. **Custo progressivo** pela fórmula experimental acima. Mostrar preço de cada rank, estatísticas antes/depois e saldo de Fragments; testar eventual arredondamento para UI. Não permitir gastar moeda insuficiente, rank além de +10 ou reforçar não-Legendary.
3. **Preservar progressão/loot.** O aumento não substitui tier mais alto nem altera odds Epic/Legendary. Uma Legendary obtida cedo pode ser útil por mais algum tempo, não eternamente.
4. **UI de proteção:** ao entrar na dungeon, destacar Legendary melhoradas fora dos dois slots protegidos e mostrar **Fragments investidos em risco**. Manter a escolha do jogador, sem proteção automática oculta.
5. **Persistência e compatibilidade:** gravar rank/base de forma estável, não multiplicar ao carregar o save novamente; testar regras Firebase e sincronização antes do lançamento. Nunca alterar saves reais em simulações.
6. **Interações:** testar especificamente Dark/Regen/Shield, Legendary com Spell Power/HP scaling, Shatter e Double Strike, equipamento duas-mãos, combate 4x, morte e recuperação. Teste C de Affinity Sigils separado; **Legendary continuam excluídas de reroll de afinidade**.

## 7. Validação técnica e limitações

- **264 campanhas controladas** sem erro e sem saldos negativos; **66 campanhas adicionais** instrumentadas sem erro. `index.html` permanece com SHA-256 idêntico ao ZIP original.
- Testes das Legendary **22 identidades / 19 efeitos**: PASS; Shatter/Double Strike em combate: PASS; scaling de afinidades v0.10.0: PASS; invariantes de identidade, stats, custo, exclusão de Epic/Rare e penalização SPD: PASS.
- Não testados em ambiente real: escrita/compatibilidade de saves, UI, Firestore Rules, condições de rede, jogadores humanos e meta de semanas após D200.
- Os inventários históricos usados no replay foram obtidos por políticas de versões anteriores, embora o combate replayado seja o da versão do ZIP; as distribuições podem diferir após a v0.10.1.
- Apenas simulação de **aumento dos atributos base** foi analisada; subir `tier` ou amplificar poderes Legendary é outra proposta com risco e resultados diferentes.

## Decisão

**Aprovar +10 como candidato a protótipo**, sem ainda aprovar implementação/push da v0.10.1. Os testes favorecem a simplicidade de um limite claro: gera utilidade e algum alívio de farming com risco controlável, enquanto crescimento ilimitado aumenta o custo e o teto de poder sem benefício consistente demonstrado. Para avançar, falta fechar o Teste C (Affinity Sigils compradas no Merchant, reroll não-Legendary na Forge) e validar a UX e compatibilidade de saves.

**Artefactos de reprodução:** `Wanderer_v0101_Legendary_TestB_Dados_e_Scripts.zip` e `Wanderer_v0101_Legendary_TestB_Metricas.json` na conversa; este documento pode ser guardado em `development/docs/`.