# Wanderer v0.10.1 — Teste H: Stress integrado da economia e progressão

**Data:** 18 de outubro de 2026  
**Estado:** simulação offline concluída. **NÃO foram alterados gameplay, \`main\`, Firebase, rules ou saves reais.** Apenas documentação na \`development\`.

## Resumo

**498 campanhas, 277.341 expedições, 0 erros** sobre a cópia de \`main\` fornecida pelo utilizador (SHA-256 de \`index.html\`: \`a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126\`). A \`main\` do GitHub recebeu commits posteriores: estes resultados **não validam o código publicado mais recente**.

O sistema completo **Forge Quality + Legendary +10 + 4 Sigils aleatórios no Merchant** não criou uma rota generalizada e trivial até D200 nestes agentes. A configuração moderada de Sigils teve uma pequena melhoria exploratória em conclusões, mas a utilização intensiva **gastou mais recursos sem mais progressão**. O maior risco observado é o desperdício de Gold/Fragments e de ações repetitivas, não equipamento gratuito ou dominância automática.

## Experiências

- **Amostra principal:** 18 seeds \`938000–938017\` × Casual, Experiente e Speedrun = **54 campanhas por cenário**, sete cenários (**378 campanhas**).
- **Validação nova:** 8 seeds \`938200–938207\` × 3 políticas = **24 campanhas por cenário**, cinco cenários (**120 campanhas**).
- Cada agente faz no máximo **600 expedições**, com combate, loot, crafting, Merchant, mortes, proteção, recuperação e runas através do motor real do ZIP.
- **Forge Quality:** investimento opcional de +100% Fragments num craft para aumentar Rare/Epic; 0% Legendary. **Legendary +10:** +2% dos atributos base positivos por upgrade, custos em Fragments progressivos, sucesso garantido, máximo +10, habilidades e afinidades especiais intactas.
- **Sigils:** quatro afinidades distintas por oferta no Merchant, **em quatro espaços adicionais** aos itens habituais. Refresh do Merchant pago em Gold atualiza ambas as ofertas. Comprar o Sigil custa Gold; tentar transferir a afinidade na Forge custa Fragments; falha consome ambos e preserva a afinidade original. Legendary excluídas. Só se oferecem afinidades legais para o subtipo do item.
- **Normal 50%:** checks de interesse a cada 12 expedições, teto de 10 compras e limites voluntários de despesa do agente (não do jogo). **Sem repetição:** a próxima oferta não repete nenhuma das quatro afinidades anteriores, incluindo Sigils já comprados. **Seguro 65%:** custo de transferência 1,5× em Fragments. **Intensivo 50%:** checks a cada 4 expedições, até 10 refreshes/visita, sem limites voluntários. **Agressivo 65%:** checks a cada 2 expedições, procura também ganhos menores, custo 1,5× e sem limites voluntários. Estes agentes de stress **não são otimizadores perfeitos** de todas as builds possíveis.

## Resultados primários — 54 agentes por configuração

| Sistema | D200 | Casual / Exp. / Speed | Profundidade mediana | Crafts medianos | Sigils comprados | Transferências | Refreshes Sigil |
|---|---:|---|---:|---:|---:|---:|---:|
| v0.10.0 sem novas mecânicas | **21/54** | 6 / 7 / 8 | D166 | 382 | 0 | 0 | 0 |
| Forge Quality + Legendary +10 | **27/54** | 7 / 12 / 8 | D198,5 | 297,5 | 0 | 0 | 0 |
| + Sigils moderados 50% | **30/54** | 10 / 12 / 8 | D200 | 297,5 | 55 | 26 | 111 |
| + Sigils 50%, sem repetir oferta | **27/54** | 7 / 12 / 8 | D196,5 | 297,5 | 69 | 34 | 117 |
| + Sigils 65% / 1,5× Fragments | **26/54** | 6 / 12 / 8 | D194,5 | 297,5 | 36 | 24 | 67 |
| + Sigils intensivos 50% | **23/54** | 3 / 12 / 8 | D166 | 297,5 | 161 | 66 | 434 |
| + Sigils agressivos 65% | **26/54** | 6 / 12 / 8 | D177,5 | 297,5 | 81 | 54 | 226 |

Comparado com Forge+Legendary sem Sigils, o modo moderado registou +5,56 pontos percentuais de conclusões, **IC95% bootstrap emparelhado [−1,85; +12,96] p.p.**; intensivo −7,41 p.p., IC **[−16,67; +1,85]**. Os intervalos são exploratórios e não corrigidos por comparações múltiplas.

## Validação independente e conjunto agregado

| Sistema | Holdout D200 /24 | Total D200 /78 | Transferências /78 | Refreshes /78 |
|---|---:|---:|---:|---:|
| Forge+Legendary sem Sigils | 13 | **40** | 0 | 0 |
| Sigils 50% moderados | 15 | **45** | 46 | 159 |
| Sigils 50% sem repetição | 13 | **40** | 58 | 176 |
| Sigils 50% intensivos | 13 | **36** | 98 | 540 |
| Sigils 65% agressivos | 14 | **40** | 78 | 333 |

Diferença de conclusões moderado vs controlo agrupado **+6,41 p.p.**, intervalo bootstrap agrupado por seed **[0; +12,82] p.p.**; intensivo **−5,13 p.p.**, intervalo **[−12,82; +2,56]**. O limite inferior exatamente zero deve ser interpretado com cautela: há apenas 26 grupos de seeds e vários cenários foram explorados. **Não usar isto como demonstração de melhoria garantida.**

## Stress de progressão demasiado rápida

| Cenário primário | D200 antes de 400 expedições | D200 antes de 500 | Power mediano após 250 expedições |
|---|---:|---:|---:|
| Atual v0.10.0 | **0** | 6 | 1.142,5 |
| Forge+Legendary | **2** | 11 | 1.214,5 |
| Sigils 50% moderados | **3** | 10 | 1.204,5 |
| Sigils 50% sem repetição | **4** | 10 | 1.176 |
| Sigils 50% intensivos | **3** | 8 | 1.091 |
| Sigils 65% agressivos | **2** | 9 | 1.211,5 |

**Conquista mais rápida de D200 em todos os ensaios: 326 expedições.** Nenhum agente concluiu antes de 300 expedições. Isto afasta a hipótese de um atalho generalizado **para estas políticas**, mas não substitui uma procura exaustiva de exploits ou testes humanos de min-max.

No primário, o agente intensivo gastou **233.543 Gold e 104.720 Fragments** em Sigils/refreshes/transferências para 66 mudanças de afinidade. O moderado gastou **63.100 Gold e 31.870 Fragments** para 26 mudanças. Pagamentos mais agressivos não aceleraram D200 de maneira consistente.

## Verificações e limites

- Nos **498 agentes**, zero erros de execução, **0 crafting Legendary**, máximo **+10** melhorias em Legendary, 0 saldo negativo de Gold ou Fragments. Mínimo saldo final observado: 238 Gold / 72 Fragments. O runner verifica recursos após cada expedição.
- **50.000 ofertas** verificadas, cada uma com 4 Sigils legais distintos e, na variante sem repetição, nenhum dos 4 da página anterior. Regressão específica para o caso de comprar antes de atualizar a página: PASS.
- **Testes oficiais do ZIP**: 6/6 abilities/progression; v0.10 scaling PASS; Shatter/Double Strike PASS; 22 Legendary signatures PASS. Teste de upgrade em tier100 confirma +20% aos atributos base positivos após +10, custo acumulado 8.217 Fragments e habilidades/afinidades intactas.
- Os agentes seguem heurísticas fixas de loja, equipamento, combate e extração. Resultados emparelhados partilham sementes iniciais, **não trajetórias futuras idênticas de RNG**. 600 expedições são um horizonte arbitrário. As estimativas são de um simulador, **não de jogadores humanos**.
- A compra e uso de Sigil são protótipos na memória, **sem persistência de inventário no Firebase**, migração de schema, reconexões, contenciosidade multi-dispositivo ou testes de UI. Estes resultados **não validam segurança contra fraude online**.

## Decisão para v0.10.1

1. **Candidatos a protótipo, não a merge imediato:** Forge Quality opcional; Legendary +10 com aviso de risco se desprotegida; 4 Sigils aleatórios com refresh pago no Merchant, **50%** base de transferência e custo normal em Fragments. Falha mantém a afinidade anterior; Legendary não elegíveis.
2. A opção **sem repetição imediata** pode melhorar a perceção da loja, embora não tenha mostrado progresso adicional. Não impor limites de refresh de gameplay com base nas regras voluntárias do agente. Preferir mostrar Gold/Fragments gastos e sinergias de 2/3/5 peças ganhas/perdidas.
3. **Não reforçar já as chances de transferência**, nem tornar os upgrades ilimitados. Mais consumo de recursos nos agentes intensivos não trouxe mais vitórias.
4. Antes de uma versão pública: atualizar base ao commit atual da \`main\`; validar persistência de stock e Sigils, migração de save, morte/proteção de itens +10, regras Firebase e UX móvel; fazer teste real de jogadores.

**Artefactos de reprodução:** \`Wanderer_v0101_Teste_H_Dados_e_Scripts.zip\` (12 lotes de campanhas, scripts e harness de investigação), relatório português e \`docs/v0101-stress-test-h-metrics.json\`. Não houve publicação de código de gameplay.
