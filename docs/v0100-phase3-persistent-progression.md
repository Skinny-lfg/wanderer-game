# Wanderer v0.10.0 — Fase 3: Campanha persistente D1–D200

**Data:** 17 de outubro de 2026  
**Estado:** simulação offline concluída; nenhum código de gameplay, Firebase, save ou branch `main` alterado.  
**Fonte:** ZIP de `main` fornecido na conversa; SHA-256 de `index.html`: `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`.

## Objetivo

Medir a progressão com aquisição persistente de equipamento e runas, decisões de extração, mortes, recuperação, proteção de equipamento, merchant, forge e recursos. Distinguir um problema de dificuldade do combate de um problema nas estratégias artificiais dos jogadores simulados.

## Metodologia

Reutilizou-se `scripts/simulate-v091.cjs` + `scripts/v010-progression.cjs` do ZIP, executando as funções de combate e economia de produção em VM Node isolada (com Legendary ativas), sem consultar ou escrever dados Firebase. Cada jogador parte da seed `931000`…`931019`, com preferência cíclica por Mace, Sword, Bow, Two-Handed, Staff, Wand ou Daggers. A preferência **não impede** que equipe outra arma quando o modelo a considera melhor.

Foram **200 campanhas** e **118.375 expedições** em quatro cenários, até 600 expedições por campanha:

1. **Atual:** 20 Casual + 20 Experientes + 20 Speedrun (60 campanhas, 35.250 expedições). Políticas originais do runner: Casual protege 0 itens, extrai abaixo de 50% HP após wave; Experiente protege 2, extrai abaixo de 45%; Speedrun protege 2, extrai abaixo de 38%. Todos usam farming pós-morte e heurísticas fixas de craft, shop, runas e equipamento.
2. **Scaling anterior (isolado):** mesmas 60 políticas/seeds (35.321 expedições), revertendo **apenas no VM** o novo scaling de 2 peças de Regen, Shield e Sunder aos valores antigos, preservando as restantes mecânicas atuais, incluindo Shatter, Double Strike e Legendary.
3. **Política mais arriscada:** mesmas 60 estratégias e seeds (35.804 expedições), mas Casual 30% HP / 3 runs de recuperação / protege 2 / shop 5; Experiente 30% HP / 4 runs de recuperação; Speedrun 22% HP / 2 runs de recuperação. Em Casual também foi alterado o shop reserve. Este cenário altera **vários parâmetros em simultâneo**, pelo que não permite atribuir causalidade individual a cada mudança.
4. **Casual com proteção:** apenas 20 Casual originais com proteção de 2 itens, sem outros ajustes voluntários à política (12.000 expedições).

Combates automáticos simulados por ticks de 0,11 s; estratégias param para extrair apenas entre waves, selecionam entre caminhos, recuperam equipamento com farming, vendem tesouros, aproveitam stash, craft e merchant. São políticas heurísticas, **não estudos sobre decisões humanas**. O motor não executa Firebase, login, movimento real de UI, PvP nem latência de rede. O ``tempo de combate`` calculado não inclui decisões humanas ou espera entre runs.

O smoke test `node --test tests/v010-progression.test.cjs` passou (2/2). Nenhuma campanha reportou recursos negativos. O SHA-256 do `index.html` original corresponde à origem descrita acima; as mudanças experimentais ocorreram somente em scripts locais e VM.

## 1. Resultado de progressão

| Cenário | Casual D200 | Experiente D200 | Speedrun D200 | Total D200 | Profundidade mediana (C / E / S) |
| --- | ---: | ---: | ---: | ---: | --- |
| **v0.10.0 atual** | 0/20 | 6/20 | 5/20 | **11/60 = 18,3%** | **42,5 / 140 / 74** |
| **Scaling 2p antigo isolado** | 0/20 | 4/20 | 5/20 | **9/60 = 15,0%** | 44 / 105,5 / 107 |
| **Política arriscada** | 0/20 | 1/20 | 0/20 | **1/60 = 1,7%** | 22 / 28 / 15 |
| **Casual com proteção 2 itens** | 0/20 | — | — | **0/20** | 45 / — / — |

A taxa de D200 no baseline atual tem IC de Wilson de 95% aproximado **10,6%–29,9%** com 60 agentes, não sendo uma previsão quantitativa de jogadores reais. O aumento de 9→11 conclusões do scaling atual vs antigo tem um IC bootstrap emparelhado (por seed) para a diferença de **−6,7 a +13,3 pontos percentuais**; **insuficiente para afirmar que o novo scaling melhorou D200**. As campanhas têm o mesmo início, mas o RNG diverge quando a progressão toma caminhos diferentes.

**Tramos alcançados no cenário atual (de 60):** D20: 50, D40: 39, D60: 30, D80: 27, D100: 24, D120: 20, D160: 16, D200: 11. Em D200 o grupo de origem era 6 Experiente + 5 Speedrun; Casual não passou de D100. As 11 conclusões exigiram entre **407 e 598 expedições** (mediana **540**). Isto é o número de expedições da política automática, não horas humanas.

## 2. Porque é que os agentes falham?

| Indicador (mediana por jogador no cenário atual) | Casual | Experiente | Speedrun |
| --- | ---: | ---: | ---: |
| Maior dungeon ultrapassada | 42,5 | 140 | 74 |
| Mortes | 2,5 | 5 | 29 |
| Itens perdidos ao morrer (soma) | 22 | 30,5 | 179 |
| Runs em dungeons abaixo da progressão | 456,5 | 347 | 424,5 |
| Extrações antecipadas | 341 | 197 | 151,5 |
| Crafts | 75 | 372,5 | 354,5 |
| Gold final | 49.766 | 78.048 | 57.906 |
| Fragments finais | 65.400 | 71.279 | 2.024 |

A política Casual gasta perto de três quartos das expedições em farming e faz muitas extrações; quase não progride depois de D40. A preferência de Speedrun aceita mais risco, levando a muito mais mortes e perda de equipamento. **Não** inferir que estas são as taxas de mortes normais dos jogadores humanos.

### Sensibilidade das decisões de extração

No cenário de menor limiar HP, a mediana de mortes passou de **7,5 para 123** (juntando as três estratégias) e a mediana de profundidade caiu de **D58 para D18**. As vitórias D200 caíram de **11/60 para 1/60**. Na comparação de conclusões, a diferença emparelhada foi **−16,7 pontos percentuais** com bootstrap de 95% cerca de **−26,7 a −6,7 pp**.

**Conclusão:** o risco acumulado entre waves é mais importante do que sugeria a comparação de armas num combate isolado. Contudo, este cenário também reduziu períodos obrigatórios de recuperação e alterou o shop/proteção Casual; não foi uma experiência de *extraction threshold* isolado.

### Proteção dos dois itens

Os 20 Casual protegendo sempre Weapon + Armor continuaram em 0/20 D200. A mediana passou de D42,5 para D45, mas as trajetórias individuais divergiram em RNG; a diferença não prova que a proteção melhore ou piore a performance. Uma política Casual melhor teria de aprender a fazer upgrades, adaptar escolhas de extração e avançar de forma mais eficiente.

## 3. Armas e afinidades dos 11 vencedores D200

| Arma realmente equipada ao concluir | Vencedores |
| --- | ---: |
| Two-Handed | 5 |
| Mace | 2 |
| Sword | 2 |
| Daggers | 2 |
| Bow / Staff / Wand | **0** |

Nota: a **preferência inicial** do agente pode ser Bow, Staff ou Wand, mas ele pode ter trocado de arma antes de D200. Nestas 11 builds vencedoras havia 67 peças Epic, 17 Rare, 8 Legendary, 1 Uncommon e 1 Common no conjunto do equipamento final (94 slots equipados). As afinidades 2+ presentes em vencedores incluíam Dark/Drain (4), Regen (4), Tide (3), Bleed (2), Fire/Burn (2) e outras. A diversidade continua limitada; as amostras são pequenas e **não demonstram inviabilidade intrínseca de Bow/Staff/Wand**.

## 4. Economia e progressão

As reservas de Gold ficam elevadas enquanto as heurísticas quase não compram equipamento: mediana **2 compras no Merchant por jogador** e **140 Gold gasto** em todo o grupo atual, apesar de **53.040 Gold** de saldo mediano final. As políticas ignoram muitos itens de Merchant por causa de heurísticas simples e do stock. Não é evidência direta de que a economia live esteja equilibrada ou desequilibrada; é um **limite importante do agente**.

Fragments são utilizados muito mais: mediana de **323 crafts e 53.135 Fragments gastos** por jogador (a mediana conjunta mistura estilos e deve ser lida com cuidado). Casual acumula recursos e não gasta frequentemente; Speedrun consome mais e chega a stocks muito baixos. Recomenda-se estudar sinks de Gold/Fragments **após** melhorar o agente e separar os resultados por política.

## 5. Limitações que impedem um balance patch

- O modelo é determinístico por seed inicial, mas diferentes escolhas consomem RNG diferente em momentos posteriores: emparelhamento é por *início*, não por identidade futura de loot.
- 20 agentes por política é uma amostra pequena. Intervalos assumem que a variação de seed é representativa; não inclui variabilidade de humanos.
- Craft e Merchant seguem pontuação de equipamento heurística; não simulam buildcraft consciente, comparação de sets completa ou gestão otimizada de Gold.
- Extração é baseada quase exclusivamente em HP restante, não na previsão do elite, boss, dano máximo futuro ou nas habilidades ativadas.
- O horizonte de **600 expedições** censura campanhas que poderiam completar mais tarde. O modelo não mede tempo real no browser.
- O rollback em memória testa apenas Regen/Shield/Sunder 2p, **não** a versão histórica completa nem uma alteração proposta para live.
- A soma de itens perdidos conta a perda agregada em muitas mortes, não itens únicos de uma conta; os jogadores reais podem proteger dois slots distintos.
- A cópia enviada pode diferir de commits que tenham entrado depois na `main`; comparar pelo hash do código, não pelo nome da branch.

## Decisão e próxima fase recomendada

**Sem ajuste numérico para já.** A Fase 3 mostra que decisões de extração e recuperação podem dominar as diferenças entre builds. A variação do scaling Regen/Shield/Sunder teve efeito incerto na percentagem de D200, ainda que no teste de combate isolado de 2A o sustain tenha melhorado.

**Fase 3B recomendada:** simular agentes que antecipem risco do próximo elite/boss e valorizem sinergias reais (2/3/5 peças) sem terem conhecimento perfeito do futuro. Repetir com mais seeds e horizonte comparativo de 600 e 1.200 expedições. Recolher a distribuição de equipamento adquirido em D100–D200 para Bow, Staff, Wand, Daggers e Winterheart antes de sugerir alterações de dano/sustain.

**Fase 4:** economia de Merchant, Gold, Fragments, Forge e recuperação, baseada em agentes com decisões melhores.

## Artefactos

- `wanderer-v010-phase3-main.json` — 60 campanhas completas, estado final, checkpoints e snapshots de equipamento adquirido.
- `wanderer-v010-phase3-oldScaling.json` — 60 campanhas com rollback isolado de scaling.
- `wanderer-v010-phase3-policy.json` — 60 campanhas da política mais arriscada.
- `wanderer-v010-phase3-casualProtect.json` — 20 campanhas Casual com 2 itens protegidos.
- `wanderer-v010-phase3-analysis.json` — agregados, milestones, dados de equipamento e bootstrap emparelhado.

Os ficheiros de dados permanecem anexados à conversa; este relatório pode ser guardado na branch `development` sem tocar na versão publicada.