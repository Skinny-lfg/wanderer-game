# Wanderer v0.12 — E.1.2: validação final do harness Endless

**Classificação técnica: PASS. Auditoria económica: ainda não pronta.** Base `development` `1112376`; motor e economia de produção inalterados.

## Correção técnica

A causa original E.1 foi a instrução do simulador que recriava `s.runes` e `s.runeSlots` no tier da tentativa. E.1.1 removeu essa preparação, bem como `a.setup` e a atribuição automática de `unlocked`, apenas numa cópia isolada do módulo. E.1.2 adiciona testes controlados para os caminhos que não ocorreram nas 30 derrotas e acrescenta telemetria ao driver, sem alterar a produção. Os testes de vitória reduzem **artificialmente o HP do inimigo a 1 antes de cada tick**; usam as transições, recompensas, loot e saves reais do runtime. Não representam balanceamento.

| Teste | Resultado | Evidência |
| --- | --- | --- |
| T1 Vitória e Runa | PASS | Vitória E190 cria três opções de famílias distintas no tier 190; escolha adiciona uma única Runa; equipar substitui o slot sem apagar a anterior. IDs/atributos antigos preservados. |
| T2 Repetição inferior | PASS | Com E200 desbloqueada, vitória controlada em E190 mantém `unlocked=200`; opções de Runa e gear recebido são E190. |
| T3 E200→E201 | PASS | Vitória controlada E200 desbloqueia E201; gear e Runas anteriores inalterados. Fórmulas D.6: inimigo 1000→1005 em E201; gear 1000→1005 em E201 e 1480 em E300; Sword/Shield +0,2% em E201. |
| T4 Save e restore | PASS | Perfil sintético após Expedition convertido para save v13, validado e recuperado após JSON. Gear, Stash, Runas, slots, valuables, Gold, Fragments e E máxima iguais; sem IDs de Runa duplicados. Metadados históricos de 199 vitórias/200 tentativas são sintéticos para validar o formato. |
| T5 Determinismo | PASS | Duas vitórias controladas com mesmo estado inicial, seed, relógio e escolhas produziram exatamente os mesmos resultados, escolhas de passivos, recompensa, resumo e estado persistente. |

Comandos: `node tests/v012-phase-e12-harness.test.cjs` (5/5 PASS) e `node --check scripts/v012-phase-e11-persistence-audit.cjs` (PASS). T1–T5 são testes dirigidos e não contam como amostra de balanceamento.

## Diagnóstico das 30 derrotas E.1.1

O ficheiro local `/tmp/wanderer-e11-results.json` tem a Realm de derrota, duração total de combate e estados antes/depois, mas **não** guarda inimigo fatal, dano, HP antes do combate fatal, rota de Affinities nem passivos. Distribuição observada: A 12 derrotas (Realm 4–9, média 5,7), B 9 (4–15, média 9,2), C 9 (4–15, média 9,3). B chegou ao boss três vezes e C duas; A nenhuma. Nenhum perfil venceu. Runas E190/E194/E198 preservadas. Não é possível atribuir inimigos ou dano às 30 corridas sem inventar dados.

Foram executadas **9 novas Expeditions diagnósticas** (uma por seed/perfil), com a mesma política e estado inicial das primeiras tentativas E.1.1. As nove reproduziram exatamente a Realm de derrota correspondente; zero erros e timeouts. Dano causado/recebido é acumulado por toda a tentativa, não somente pelo combate fatal. Tempo é de combate, não tempo de jogo.

| Perfil/seed | Realm | Inimigo fatal | Dano causado | Dano recebido | Combate (s) | DPS | Affinities desbloqueadas |
| --- | ---: | --- | ---: | ---: | ---: | ---: | --- |
| A/0 | 4 | Ember Imp | 50 647 | 5 592 | 20,35 | 2 489 | Fury, Aegis, Magic |
| A/1 | 7 | Sanguine Leech | 67 885 | 5 334 | 20,24 | 3 354 | Fury, Blood, Aegis |
| A/2 | 5 | Stonebreaker Colossus | 46 969 | 4 940 | 15,07 | 3 117 | Fury, Vitality, Magic |
| B/0 | 4 | Iron Vanguard | 44 901 | 5 031 | 17,82 | 2 520 | Fury, Magic |
| B/1 | 15 | Ember Sovereign (boss) | 101 526 | 6 378 | 28,38 | 3 577 | Fury, Magic, Vitality |
| B/2 | 4 | Tempest Hawk | 39 510 | 4 966 | 12,76 | 3 096 | Fury, Magic, Blood |
| C/0 | 6 | Sanguine Leech | 49 883 | 5 468 | 19,69 | 2 533 | Fury, Magic, Blood |
| C/1 | 15 | Ember Sovereign (boss) | 120 296 | 5 068 | 34,21 | 3 516 | Fury, Magic, Decay |
| C/2 | 8 | Sanguine Wraith (miniboss) | 71 624 | 5 021 | 19,80 | 3 617 | Fury, Magic, Blood |

O HP no início do **primeiro** combate foi 4911–4938; HP imediatamente antes do combate fatal não foi registado. As 9 corridas registaram 5–17 passivos escolhidos, conforme a Realm alcançada. Gold inicial 4000 em todas; Fragments imediatamente antes da tentativa: A 1393–1492 após Forge Standard, B/C 3000. Os perfis B e C diferem na política económica e na rota, mas ambos usam `triple`; A usa escolhas aleatórias. B não comprou gear antes da primeira tentativa. C reservou crafting para após derrotas.

## Validade dos estados E200

**TEST LIMITATION:** A descrição anterior “Bow/Leather” era incorreta. O gerador `a.setup(190,'Bow','Epic')` usou armadura aleatória. A seed 0 começou com **4 Cloth + 1 Plate**, sem Leather, Evasion 0; a seed 1 com 3 Cloth/1 Plate/1 Leather, Evasion Rating 371; a seed 2 com 2 Cloth/2 Plate/1 Leather, Evasion Rating 277. Todas usam Bow, sete peças Epic e duas Rare, gear E190–E199 (média ~E194), três Runas E190/E194/E198, sem Legendary ou poções. Este equipamento é legal e pode resultar de loot, mas não representa uma build Leather Bow intencional, nem foi derivado de trajetórias reais E1–E199. A primeira luta tinha Block 0 e Defense 1088–1125. As Runas são plausíveis por serem oferecidas após vitória no tier correspondente, mas não há histórico sintético que prove as três vitórias anteriores. Gold/Fragments iniciais são hipóteses plausíveis, não observações.

**TEST LIMITATION:** As auditorias D.4–D.6 utilizaram equipamento Epic ao nível da Expedition, três Runas equivalentes, builds/affinities pareadas e políticas específicas. Aqui o gear está em média seis níveis abaixo de E200, duas peças são Rare, as armaduras misturam tipos, a distribuição de Affinities depende das ofertas e não há Legendary, poções nem eventos favoráveis. D.6 não concede buff especial a Bow; em E200 nenhum buff Endless se aplica. Comparar diretamente as taxas de vitória entre as auditorias seria inadequado.

**BALANCE, por confirmar:** A telemetria mostra dano recebido total da mesma ordem ou superior ao HP inicial e derrotas em várias Realms, inclusive boss. Isto explica mecanicamente a morte, mas não separa de forma causal defesa insuficiente, dano insuficiente ou escolhas de passivos. As duas derrotas no boss entre as nove novas corridas demonstram que o perfil não estava sempre bloqueado nas primeiras Realms. Não há base para mudar coeficientes.

**DESIGN:** O perfil “Normal/Otimizado/Recuperação” precisa de estados iniciais representativos para uma auditoria económica: gear coerente com a arma e fonte explicitada, raridades e Runas obtidas por histórico ou amostragem sintética justificada, e políticas de compra/recuperação previamente fixadas. Não substituir automaticamente gear ou Runas durante as tentativas.

## Decisão

O harness corrigido processa vitória, derrota, repetição, progressão, recompensa e save sem oferecer progressão artificial. **PASS técnico para a instrumentação.** As 30 derrotas não demonstram inviabilidade de E200: os estados iniciais não correspondem ao perfil Bow/Leather anunciado e não são comparáveis às condições D.4–D.6. **Ainda não pronto para auditoria económica real** até definir e validar estados E200 representativos e registar telemetria pré combate fatal. Não iniciar E.2 nem aplicar alterações de balanceamento com estes dados.
