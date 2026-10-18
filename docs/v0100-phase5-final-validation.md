# Wanderer v0.10.0 — Fase 5: Validação final de progressão e economia

**Data:** 17-10-2026  
**Estado:** estudo concluído, apenas documentação. **Nenhuma alteração ao gameplay, `main`, Firebase ou saves.**  
**Versão testada:** ZIP da `main` enviado pelo proprietário, SHA-256 `index.html`: `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`. A branch atualmente online pode ter recebido mudanças depois deste snapshot; este relatório **não** afirma validar essas mudanças.

## Resumo executivo

**Decisão:** **não lançar nenhum buff/nerf numérico** com base nos dados atuais. Testar alterações de qualidade de vida no Merchant que reduzam cliques, **sem impor ainda** um limite no sistema real. **Não** reduzir globalmente o preço da Forge em 25%: o ganho em D200 é incerto e o custo em crafting repetitivo é claramente maior. O maior problema pendente é a experiência de dezenas/centenas de expedições e ações de town necessárias à progressão, não a impossibilidade matemática de chegar a D200.

## Método, independência e escala

A partir da mesma cópia isolada da v0.10.0, o simulador de produção `scripts/simulate-v091.cjs` e as políticas `phase3b-agent.cjs` / `phase4-agent.cjs` mantêm estado entre expedições: loot, runas, Forge, Merchant, afinidades, Legendary, morte, proteção de dois itens e farming pós-morte. Duração combatida em ticks de 0,11 s.

Amostra independente, **nova relativamente ao treino/exploração das Fases 3B e 4**:
- 20 novas seeds `931050–931069`, três políticas (Casual, Experienced, Speedrun): **60 campanhas por braço**, máximo 600 expedições, **180 campanhas / 101.944 expedições**.
- Três braços: economia atual com agente de town otimizado (controlo), **máx. 1 refresh do Merchant por visita** (comportamento do agente, sem bloquear a UI real) e **Forge 25% mais barata** (transformação da fórmula só em memória).
- Sensibilidade em **novas** seeds `931090–931094`, três políticas: **15 campanhas por braço**, até 1.200 expedições, **45 campanhas / 29.696 expedições**.
- **Total: 225 campanhas / 131.640 expedições.** Zero erros de campanha. As três condições têm seeds, preferências de arma, combat rules e heurísticas de decisão equivalentes no início; ações divergentes alteram o consumo de RNG mais tarde.
- IC de 95% por bootstrap com **25.000 reamostragens de 20 grupos de seed** (cada grupo inclui três políticas). Estimativas exploratórias **não ajustadas** para várias comparações e **não generalizáveis diretamente a jogadores humanos**.

## Resultado independente a 600 expedições

| Estratégia | D200 / 60 | Casual | Experiente | Speedrun | Profundidade mediana | Tentativas dos vencedores (mediana) |
|---|---:|---:|---:|---:|---:|---:|
| Atual | **21** | 4/20 | 8/20 | 9/20 | D126 | 531 |
| Máx. 1 refresh/visita | **19** | 3/20 | 9/20 | 7/20 | D163,5 | 503 |
| Forge −25% | **26** | 3/20 | 12/20 | 11/20 | D152,5 | 509 |

Paired wins com controlo: um refresh 9 ambos venceram, 12 só controlo, 10 só variante e 29 nenhum; Forge −25% 12 ambos, 9 só controlo, 14 só variante e 25 nenhum. Assim, não se deve dizer que a alteração melhora *cada* jogador. Há muita rotação entre vencedores quando o consumo de RNG diverge.

| Diferença vs controlo | Variação D200 | IC95% por seed | Delta médio de profundidade | IC95% |
|---|---:|---:|---:|---:|
| Máx. 1 refresh | −2/60 = **−3,3 p.p.** | **[−18,3; +11,7] p.p.** | +14,3 níveis | [−5,5; +34,4] |
| Forge −25% | +5/60 = **+8,3 p.p.** | **[−5,0; +21,7] p.p.** | +10,6 níveis | [−8,9; +31,1] |

**Conclusão estatística:** nenhuma variante prova ganho ou perda de conclusão D200 nesta dimensão de amostra. Não existe base para aprovar custo 25% menor como buff de progressão.

## Custo em ações e moeda

| Métrica (mediana de 60 agentes) | Atual | 1 refresh | Forge −25% |
|---|---:|---:|---:|
| Merchant refreshes | **211,5** | **161** | 207 |
| Crafts | **384** | 395 | **511,5** |
| Compras Merchant | 34,5 | 36 | 32 |
| Farming runs | 345,5 | 313,5 | 316,5 |
| Gold final | 5.803 | 9.579,5 | 5.593 |
| Fragments finais | 2.908,5 | 2.575 | 17.253 |
| Mortes | 15 | 13,5 | 10 |

Em A/B emparelhado por seed (delta da **média**, não da mediana):
- Máx. 1 refresh: **−49,6 refreshes/jogador** (IC95% **[−63,8; −37,5]**); menos refreshes em **20/20 grupos de seed**. **Não está demonstrada ausência de custo em progressão**.
- Forge −25%: **+102,7 crafts/jogador** (IC95% **[+90,3; +114,8]**); aumento nos **20/20 grupos de seed**. A frequência de crafting e descarte pode piorar a experiência humana. A distribuição de raridades de cada craft não mudou; mais crafts = mais oportunidades, não uma melhoria do drop unitário.

## Horizonte estendido: 1.200 expedições

**Nova** amostra de 15 agentes por cenário (cinco seeds distintas por política, não reutilizadas na seleção de candidatos).

| Cenário | D200 até 600 | D200 até 1.200 | Tentativas medianas | Refreshes medianos | Crafts medianos |
|---|---:|---:|---:|---:|---:|
| Atual | 5/15 | **15/15** | 657 | 257 | 464 |
| Um refresh | 5/15 | **15/15** | 613 | 196 | 471 |
| Forge −25% | 8/15 | **15/15** | 589 | 231 | 583 |

**Interpretação:** nesta amostra pequena, todos acabaram por chegar a D200; não significa que qualquer jogador humano chegue, nem que 1.200 expedições sejam uma boa experiência. A melhoria da Forge traduz-se sobretudo em *adiantar* conquistas dentro do limite de 600, mas continua associada a dezenas/centenas de crafts adicionais. A amostra não tem poder suficiente para decidir equilíbrio de D200 para a população real.

## Guardrails / validação de qualidade

- `node --test tests/v010-progression.test.cjs tests/v010-abilities.test.cjs`: **6 testes passaram**.
- `node tests/v0100-affinity-scaling.cjs`: PASS (Sunder/Shield/Regen em D10/D40/D100/D200).
- `node tests/v093-shatter-double-strike.cjs`: PASS (inclui testes 1×/4× e dois-handed).
- `node tests/legendary-signatures.cjs`: PASS (22 identidades, 19 assinaturas, cooldowns e comportamento de save/combate).
- **0 erros** de execução nos 225 agentes. **0 saldos finais negativos** de Gold/Fragments; o runner falha caso detete moeda negativa durante o percurso. SHA-256 do `index.html` permanece igual à origem.
- Restrições do jogo preservadas no simulador: duas mãos sem off-hand, proteção, loot e raridades. Nenhum teste usou contas reais, Firebase ou saves. **Não foi executado um stress test de browser/sync multiplayer**; os resultados são da mecânica offline.

## Decisão de lançamento

| Possível medida | Estado | Condição para reconsiderar |
|---|---|---|
| Limitar o Merchant em produção a um único refresh | **Não implementar** | O teste prova menos cliques, mas não autoriza tirar agência ao jogador; avaliar primeiro UX/stock e playtests |
| UX: comparar upgrades/afinidades e reduzir repetição de refresh | **Prototipar apenas** | Medir tempo real de sessão, cliques, uso voluntário de refresh e satisfação |
| Forge globalmente 25% mais barata | **Rejeitar por agora** | Melhorar valor da escolha do craft sem multiplicar clicks; validar qualidade por jogador |
| Alterar dano, Regen, Shield, Sunder ou Legendary | **Sem aprovação** | Precisa de teste isolado com progressão adquirida e builds mais diversas |
| Declarar v0.10.0 totalmente equilibrada | **Não** | Falta amostragem de jogadores reais, browser/saves/PvP, equilíbrio dos poderes de tier 5 e efeitos de raridade extrema |

**Prioridade após a Fase 5:** protótipo estritamente de **UX para escolhas de equipamento e Merchant**, não um buff disfarçado; telemetria consentida e/ou playtest manual para detetar fricção em Gold/Fragments e sessões de 15–30 minutos. O jogo continua a precisar de decisões interessantes entre waves e progressão com menos tarefas repetitivas.

## Reproduzir os resultados

Na cópia isolada do ZIP compatível com o hash acima:

- Controlo: `node scripts/phase3b-batch.cjs combined 20 600 /path/base.json 931050`
- Um refresh: `node scripts/phase4-batch.cjs oneRefresh 20 /path/one.json 931050`
- Desconto: `node scripts/phase4-batch.cjs discountForge 20 /path/forge.json 931050`
- Horizonte estendido: `node scripts/phase5-horizon.cjs control 5 931090 /path/control1200.json`, idem `oneRefresh` e `discountForge`.
- Calcular resumos e bootstrap: `python analyze_phase5.py`.

A análise, os resultados por campanha e os scripts research-only acompanham o arquivo `Wanderer_v010_Fase5_Dados_e_Scripts.zip` desta conversa. Os dados agregados também constam de `docs/v0100-phase5-final-metrics.json`. **Nenhum patch de gameplay foi proposto/aplicado neste estudo.**