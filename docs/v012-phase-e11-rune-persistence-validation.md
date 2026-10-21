# Wanderer v0.12 — E.1.1: persistência de Runas

**Estado: PARTIAL; harness corrigido, validação integral pendente.** Base `development` em `c6d728a` (D.6 `74f372b`). Não há alterações de produção.

## Causa e correção

O driver E.1 desativou `a.setup(E,weapon,rarity)` e `g.unlocked=E` no simulador `scripts/v012-affinity-combat-sim.cjs`, mas deixou ativa a instrução `if(runes){s.runes=...a.makeRune(f,E);s.runeSlots=...}`. Essa instrução substituía a coleção e os slots de Runas no início de **cada** tentativa. As Runas E190/E194/E198 iniciais tornavam-se E200 sem recompensa. O driver E.1 existia apenas em `/tmp`; não alterou o jogo.

O novo `scripts/v012-phase-e11-persistence-audit.cjs` remove os três pontos de preparação exclusivamente numa cópia em memória do simulador. Mantém uma instância do runtime integrado por personagem. Gear, Runas, moeda, Stash e desbloqueio permanecem nessa instância; combate, inimigos e eventos são criados pelo runtime a cada tentativa. Forge, salvage, equipar upgrades e reclamar Runas passam pelas operações reais do harness. O driver agora distribui no máximo dez tentativas por perfil. `tests/v012-phase-e11-persistence.test.cjs` verifica os registos e a paridade básica de stats. O runtime de produção não foi editado.

## Regras reais

Uma vitória de boss cria oferta de três Runas distintas do tier vencido; só `claimPendingRuneChoice` adiciona a escolhida ao inventário. Um slot vazio pode ser ocupado automaticamente, mas substituir uma Runa equipada requer `equipRune`; a Runa anterior fica no inventário. Equipar não cria nem aumenta tier. Reciclar explicitamente elimina Runas não equipadas em troca de Fragments. Derrota perde conteúdo da Bag, preservando Runas, gear equipado e moeda obtida. O cálculo de combate usa as Runas equipadas via `totalStats` e `runeValue`.

## Testes de persistência

| Requisito | Resultado | Evidência e limite |
| --- | --- | --- |
| 1. Iniciar sem mudar Runas | PASS | IDs, tiers, atributos e slots idênticos antes/depois das 30 tentativas. |
| 2. Vitória e recompensa legítima | PARTIAL | Nenhuma vitória ocorreu; código de claim inspecionado, sem validação dinâmica E.1.1. |
| 3. Derrota | PASS | 30/30 derrotas conservaram Runas e slots. |
| 4. Repetir Expedition inferior | PARTIAL | Nenhum perfil desbloqueou E201; sem repetição inferior observada. |
| 5. E200→E201 | PARTIAL | E201 não foi desbloqueada nesta amostra. |
| 6. Serializar e restaurar | PARTIAL | Round trip JSON e `safeRunes` preservam IDs/tiers/valores sem duplicação. Não houve restore completo de checkpoint ativo nesta amostra. |
| 7. Gear e recursos | PASS | Gear igual dentro de cada tentativa; Gold/Fragments não foram reinicializados pelo driver. Forge antes da tentativa foi contabilizado. |
| 8. Reprodutibilidade | PARTIAL | Criação sintética com mesma seed e relógio fixo reproduziu gear, Runas e stats; não houve corrida inteira pareada adicional devido ao limite de 30. |
| Paridade das Runas | PASS limitado | `totalStats` do runtime integrado somou exatamente o `runeValue` da Runa Vitality E190 aos HP planos. |

A versão inicial do teste reportava PASS vacuamente em caminhos sem observações; o teste final assinala esses caminhos como PARTIAL.

## Diagnóstico E200–E225

Estado inicial por seed: Bow/Leather sintético, nove peças de loot E190–E199 (7 Epic, 2 Rare), três Runas E190/E194/E198, 4000 Gold, 3000 Fragments, E200 desbloqueada. São hipóteses plausíveis pelas fórmulas, não saves reais nem uma história reproduzida E1–E199. A usa passivos aleatórios e Forge Standard ocasional; B planeia Affinities e usa High Quality; C reserva crafts para recuperação. Eventos são declinados. Nenhum perfil recebeu gear/Runas por estar em E200.

| Perfil | Tentativas | Vitórias | Realm média | Runas iniciais → finais | Gear médio inicial → final* | Gold inicial → final* | Fragments inicial → final* |
| --- | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| A — Normal | 12 | 0 | 5,7 | 190/194/198 → 190/194/198 | 194,2 → 194,0 | 4000 → 7575 | 3000 → 3112 |
| B — Otimizado | 9 | 0 | 9,2 | 190/194/198 → 190/194/198 | 194,2 → 194,0 | 4000 → 7251 | 3000 → 4563 |
| C — Recuperação | 9 | 0 | 9,3 | 190/194/198 → 190/194/198 | 194,2 → 194,0 | 4000 → 7573 | 3000 → 3109 |

\* A linha mostra a primeira seed de cada perfil. As três seeds por perfil começam com atributos de gear ligeiramente diferentes. Nenhuma peça foi auto substituída; crafts legítimos, loot e salvage podem alterar moeda e Stash. **30/30** corridas sem erro nem timeout, com máximo desbloqueado E200. A distribuição executada foi **12/9/9**, por erro de agendamento que excedeu em duas o teto individual do perfil A. O agendador do script foi corrigido para **10/10/10**, mas a matriz não foi repetida, respeitando o máximo global de 30 novas Expeditions nesta tarefa.

Os estados completos por tentativa (gear, Runas, slots, recursos, recompensas e ações) foram gravados em `/tmp/wanderer-e11-results.json`; este artefacto local não é publicado no repositório.

## Conclusão e limitações

A substituição artificial de Runas foi eliminada do driver e nenhuma progressão gratuita foi observada. Contudo, os oito testes obrigatórios não estão todos completos, e a distribuição da amostra ultrapassou o teto individual A. Portanto **E.1.1 não cumpre integralmente PASS**. O harness ainda precisa de validação dinâmica de vitória/claim, repetição inferior, avanço E201, restore de checkpoint ativo e reprodutibilidade de corrida inteira. Não usar esta amostra para inferir sustentabilidade E200–E300 ou recomendar balanceamento. Prosseguir com uma auditoria económica completa só depois desses testes dirigidos, com um orçamento de corridas separado e explícito.
