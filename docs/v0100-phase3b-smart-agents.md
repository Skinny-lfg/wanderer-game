# Wanderer v0.10.0 — Fase 3B: Inteligência de decisão e progressão D1–D200

**Data:** 17/10/2026  
**Estado:** experimentação offline concluída; relatório da cópia de `main` submetida pelo utilizador. **Nenhuma alteração ao gameplay, Firestore, contas, saves ou branch `main`.**  
**SHA-256 de `index.html` utilizado:** `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`.

## Resumo executivo

- Foram executadas **390 campanhas simuladas em estado de jogo**, somando **230.126 expedições**. Os 300 agentes dos cinco braços principais (baseline + quatro alternativas) usaram seeds `931000`–`931019` por política. A validação adicional usa seeds `931020`–`931029`, e a análise de horizonte de 1200 expedições usa seeds `931040`–`931044`.
- **Previsão de risco isolada**: conclusões D200 em 600 expedições subiram **11/60 → 21/60**, com IC bootstrap emparelhado aproximado para a diferença **+6,7 a +26,7 pontos percentuais**, exploratório e sem correção por múltiplas comparações. Dos 60 pares, 12 novos concluíram e 2 deixaram de concluir. A previsão não é perfeita nem domina em todos os casos.
- **Holdout com novas seeds:** baseline **5/30**, previsão de risco **9/30**. A direção repetiu-se, mas a amostra é pequena; IC bootstrap emparelhado para a diferença **−3,3 a +30 p.p.**, pelo que não confirma efeito populacional com elevada confiança.
- **Gestão de equipamentos e Merchant:** 11/60 → 18/60 conclusões, mas aumento grande no gasto de Gold e no número de refreshes. Melhor aquisição é plausível, mas este braço modifica várias heurísticas em conjunto.
- **Recuperação simplificada:** 11/60 → 12/60 conclusões, sem melhoria robusta.
- **Combinação completa:** 11/60 → 19/60; profundidade mediana melhora bastante, mas o número de conclusões é inferior ao braço de risco isolado. Os braços não são aditivos.
- **1200 expedições:** numa nova pequena amostra de 15 jogadores por variante, **ambas chegaram a 15/15 D200**; mediana de expedições até D200: baseline **780**, risco **740**. Isto revela **censura severa aos 600 runs**; não significa que todos os humanos chegariam a D200 nem que 1200 seja um limite universal.

**Decisão:** não modificar valores de dano, Legendary, afinidades ou loot com base nestes testes. O dado mais promissor é a importância das decisões e da duração disponível para progredir. Requer testes humanos para calibrar UX das decisões e perceção de grind.

## Motor e políticas testadas

O runner foi derivado de `scripts/v010-progression.cjs`, com o VM `scripts/simulate-v091.cjs` executando o combate de produção (`index.html` + `combat/legendary.js`). Conservou IA adversária, fórmulas de equipamento, drops, rune reward, proteção, crafting, Merchant, custo de refresh, Gold, Fragments, morte, perdas de gear e progressão persistente.

A extração é sempre decidida **entre waves**, nunca a meio do combate. Todos os agentes podem trocar de arma ao equipar uma melhoria; a preferência inicial não é uma restrição permanente. Os três perfis são **Casual**, **Experiente** e **Speedrun**, não jogadores reais.

1. **Baseline:** políticas originais da Fase 3: extrair abaixo de 50% / 45% / 38% HP, respetivamente, proteger 0 / 2 / 2 itens, scoring de equipamento padrão, Merchant pouco explorado, farming após morte.
2. **Risk forecast:** só altera a decisão entre waves. Usa dungeon e número da próxima wave, aviso público de elite/boss, HP/Barrier, stats equipadas e a fórmula determinística de escalonamento de inimigos como *estimativa* de dano, duração e risco. Não lê próximo inimigo gerado nem simula futuro com conhecimento de RNG. Pode extrair antes perante elite/boss perigoso e continuar com HP menor caso a estimativa sugira segurança. **Conhecer a fórmula exata faz o agente mais informado que um jogador típico.**
3. **Recovery:** mantém combate e equipamento baseline, mas reduz de 2 para 1 a run de farming pós-extração e protege Weapon+Armor para Casual. Regra de recuperação após morte mantém-se. Não é uma alteração isolada de uma única constante nos Casual.
4. **Town:** melhora scoring de sets 2/3/5, dá peso a sustain, aumenta visitas e tentativas de Forge, permite até 2 refreshes pagos do Merchant em visitas com Gold suficiente. Mantém decisões de combate e regras de morte originais; Casual mantém a sua política original de proteção neste braço. Este é um pacote de políticas de town, **não um A/B causal de merchant isolado**.
5. **Combined:** junta previsão, Recovery e Town. O efeito de cada componente pode interagir com os outros.

Todos os resultados seguem 20 seeds por perfil (n=60/arm) e máximo de 600 expedições, **exceto os dois exercícios exploratórios explicitamente marcados**. As alternativas não ajustam dificuldade do jogo e não foram adicionadas ao código de produção.

## 1. Comparação principal — 60 agentes por braço

| Política | Casual D200 | Experiente D200 | Speed D200 | Total D200 | D máxima mediana | Mediana de farming | Mediana de compras Merchant |
|---|---:|---:|---:|---:|---:|---:|---:|
| Baseline | 0/20 | 6/20 | 5/20 | **11/60** | D58 | 430 | 2 |
| Previsão de risco | 6/20 | 7/20 | 8/20 | **21/60** | D113.5 | 391 | 2 |
| Recuperação | 0/20 | 7/20 | 5/20 | **12/60** | D85 | 367 | 2 |
| Buildcraft + Merchant | 2/20 | 7/20 | 9/20 | **18/60** | D114.5 | 380.5 | 28.5 |
| Tudo combinado | 7/20 | 6/20 | 6/20 | **19/60** | D149.5 | 317 | 35.5 |

**Interpretação da previsão de risco:** mediana D58 → D113,5; conclusão 18,3% → 35%. O efeito é desigual: Casual 0→6, Experiente 6→7, Speedrun 5→8. Embora a nova estratégia tenha aumentado o total, 19 pares terminaram a nível inferior, 30 melhoraram e 11 ficaram iguais.

### Comparação emparelhada por seed (60 pares)

| Alternativa | D200 vs baseline | Novas conclusões | Conclusões perdidas | Δ total | IC 95% bootstrap do Δ em p.p. | Alteração média de dungeon |
|---|---:|---:|---:|---:|---:|---:|
| Previsão de risco | 21/60 vs 11/60 | 12 | 2 | +10 | +6.667 a +26.667 | +20.2 |
| Recuperação | 12/60 vs 11/60 | 5 | 4 | +1 | -8.333 a +13.333 | +8.2 |
| Buildcraft + Merchant | 18/60 vs 11/60 | 12 | 5 | +7 | -5 a +28.333 | +24.8 |
| Tudo combinado | 19/60 vs 11/60 | 16 | 8 | +8 | +0 a +25 | +40.7 |

**Estimativa estatística:** bootstrap estratificado por seed, mantendo juntos Casual/Experiente/Speedrun da mesma seed (20.000 reamostragens). Intervalos são aproximados e exploratórios, sem correção por comparar várias políticas; seeds emparelhadas na partida **não garantem loot nem escolhas idênticos após a primeira divergência**. Não interpretar como probabilidades para jogadores humanos.

## 2. Custo de progressão e economia

| Cenário | Gold final mediano | Gold gasto mediano | Compras Merchant medianas | Refreshes medianos | Crafts medianos |
|---|---:|---:|---:|---:|---:|
| Baseline | 53.040 | 140 | 2 | 0 | 323 |
| Previsão de risco | 64.967 | 185 | 2 | 0 | 325 |
| Recuperação | 60.772 | 140 | 2 | 0 | 307.5 |
| Buildcraft + Merchant | 7.122 | 63.515 | 28.5 | 247 | 388 |
| Tudo combinado | 6.664 | 65.278 | 35.5 | 205.5 | 374 |

Nos braços Town e Combined, a procura de itens consome grande parte do Gold que antes se acumulava. **A elevada contagem de refreshes é consequência direta da regra de visita criada para o agente**; não é evidência de que os jogadores reais façam centenas de refreshes nem aprovação para introduzir um novo Gold sink. O Merchant já permite refresh pago, a simulação não cria Gold nem stock gratuito. Requer futura otimização custo/benefício na Fase 4.

## 3. Equipamentos adquiridos e armas no fim

| Arma equipada ao terminar D200 | Baseline | Risk forecast | Town | Combined |
|---|---:|---:|---:|---:|
| Mace | 2 | 4 | 4 | 4 |
| Sword | 2 | 2 | 1 | 0 |
| Bow | 0 | 0 | 0 | 2 |
| Two-Handed | 5 | 8 | 5 | 8 |
| Staff | 0 | 3 | 5 | 3 |
| Wand | 0 | 1 | 2 | 1 |
| Daggers | 2 | 3 | 1 | 1 |

O conjunto `risk` permitiu observar **3 Staff e 1 Wand** entre os vencedores D200 (o baseline não tinha nenhum). Isto enfraquece a leitura prematura de que essas armas seriam impossíveis no late game. **Bow continua ausente entre os vencedores de Risk**; apareceu 2 vezes em Combined. O número de utilizadores por arma é pequeno e pode haver troca de arma durante a campanha.

## 4. Validação independente fora das seeds de desenvolvimento

Os 30 agentes de cada cenário usam seeds `931020` a `931029` por política, **não incluídas no piloto usado para ajustar a decisão de risco**:

| Braço | Casual | Experiente | Speedrun | Total D200 | Profundidade mediana |
|---|---:|---:|---:|---:|---:|
| Baseline | 0/10 | 3/10 | 2/10 | **5/30** | D60.5 |
| Risk forecast | 2/10 | 4/10 | 3/10 | **9/30** | D65 |

O intervalo bootstrap emparelhado do holdout para a diferença de conclusões é **−3,3 a +30 pontos percentuais**. Confirma **direção favorável nesta amostra**, mas a evidência isolada do holdout ainda é insuficiente para garantir superioridade em todos os perfis.

## 5. Horizonte 600 vs 1200: demonstração de censura

Nova coorte independente de seeds `931040` a `931044` para cada política (15 agentes/braço) com horizonte alargado:

| Braço | D200 até 600 runs | D200 até 1200 runs | Mediana de expedições até D200 | Intervalo de expedições dos vencedores |
|---|---:|---:|---:|---:|
| Baseline | 2/15 | **15/15** | 780 | 474–1163 |
| Risk forecast | 4/15 | **15/15** | 740 | 488–900 |

Esta pequena amostra não explica o resultado das 60 seeds principais, mas demonstra que uma campanha não concluída a 600 pode estar **censurada**, não impossibilitada por um bloqueio matemático. No horizonte 1200 todas concluíram, pelo que não há diferença de taxa de conclusão nesse grupo; há apenas diferença no número necessário de expedições. **Não concluir que o jogo tem 100% de completion rate entre humanos** ou que qualquer jogador conclui em 1200 runs.

## 6. Limitações, controlo de qualidade e segurança

- Testes derivados do código real, incluindo Legendary, com políticas artificiais: **não medem motivação, tempo humano, fadiga, latência, decisões manuais nem PvP**.
- Modelo de risco aproxima DPS, dano esperado, Block, Barrier, Regen e duração do combate; conhece os coeficientes determinísticos do código. A previsão é falível e não observa o próximo inimigo gerado nem valores RNG futuros. Não é uma sugestão para exibir win% exata na UI.
- O resultado de uma alteração de política muda sequências futuras de RNG; comparar seeds iniciais é útil, mas não são contrafactuais perfeitos de equipamento idêntico.
- Os resultados `town` e `combined` alteram várias decisões em conjunto. Não é possível atribuir um ganho apenas ao Merchant, aos sets ou ao aumento de craft sem experiências de ablação.
- A estratégia Risk foi ajustada exploratoriamente com pilotos de seis seeds iniciais; só a validação com seeds novas é independente desses ajustes.
- Horizontes de 600 e 1200 representam números de *expedições simuladas*, não duração de sessões humanas (15–30 minutos).
- O runner original guarda o estado `state` em memória; nenhum endpoint Firebase é acedido e não se escrevem saves de jogadores.
- Testes `node --test tests/v010-progression.test.cjs`: **2/2 PASS**. `node --check` de ambos os scripts de pesquisa: **PASS**. SHA-256 de `index.html` depois de executar coincide com a origem. Zero erros reportados em todas as 390 campanhas.

## Reproduzir

Os scripts de pesquisa são **forks locais** de `scripts/v010-progression.cjs` e ficam incluídos no ZIP de dados:

```bash
# Na pasta raiz da cópia do jogo, sem Firebase:
node scripts/phase3b-batch.cjs risk 20 600 /tmp/risk.json 931000
node scripts/phase3b-batch.cjs recovery 20 600 /tmp/recovery.json 931000
node scripts/phase3b-batch.cjs town 20 600 /tmp/town.json 931000
node scripts/phase3b-batch.cjs combined 20 600 /tmp/combined.json 931000
node scripts/phase3b-batch.cjs base 10 600 /tmp/holdout-base.json 931020
node scripts/phase3b-batch.cjs risk 10 600 /tmp/holdout-risk.json 931020
node scripts/phase3b-batch.cjs base 5 1200 /tmp/long-base.json 931040
node scripts/phase3b-batch.cjs risk 5 1200 /tmp/long-risk.json 931040
```

O **baseline de 60 agentes** foi validado contra três seeds de "/mnt/data/wanderer-v010-phase3-main.json", com valores exatos (depth, mortes, farm, recursos, power). O resultado do baseline de 60 foi reaproveitado da Fase 3, e não executado uma segunda vez como se fosse evidência independente.

## Decisão e próximo teste

1. **Não ajustar os stats das armas por agora.** No teste atual, melhorar decisões sem alterar stats conduziu a mais conclusões D200.
2. Estudar a UI entre waves: avisar risco e valor da extração de forma compreensível, **sem previsão determinística de morte**.
3. Prioridade Fase 4: executar ablações de Merchant vs Forge vs scoring de set, apurar custo marginal de cada refresh, Gold excedentário e Fragments insuficientes. Também testar um plano de aquisição mais deliberado, com equipamento real, por afinidade, especialmente Bow/Critical, Staff/Fire e Wand.
4. Validar dificuldade percebida com jogadores reais: 600–1200 expedições automáticas podem corresponder a repetição excessiva, mesmo se D200 for eventualmente atingível.