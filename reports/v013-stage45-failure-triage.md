# Wanderer v0.13 — Stage 4.5.1 · Diagnóstico das falhas

**Data:** 2026-11-17. **Base:** Stage 4, PR #45, commit `2431116cfda183292f10105e321f07597411a0db`.  
**Scope:** diagnóstico apenas. Nenhuma regra de gameplay, teste, save ou UI alterados. Sem merge nem publicação.

## Reprodução correta

`npm run test:v013` — Node.js 22.16, snapshot local com `package.json` verificado contra o blob GitHub `f1e2d44719d1ae6432dd246c7febcc0ab9b86286`.

| Indicador | Resultado |
|---|---:|
| Testes totais | **195** |
| Passaram | **147** |
| Falharam | **48** |
| Cancelados/omitidos | **0** |
| Nomes das falhas em comparação com relatórios Stages 2/3/4 | **48 idênticos** |

Uma execução preliminar sem os dois ficheiros de testes de mapa de Stage 1 teve 185 testes (137/48). Após sincronização do script com GitHub, passaram os dez testes adicionais. **O número de falhas não mudou.**

## Triagem 48/48

| Origem provável | N.º | Evidência / ação recomendada |
|---|---:|---|
| Fluxo antigo de 15 Realms e Realm offers | **23** | Os testes ainda procuram `g.offers`, `g.routeMap` e `bossFamily` antes de escolher uma Realm Card. O atual `a.start(1,true)` inicia o Dungeon com três cards e `offers=[]`. Reescrever fixtures e percursos para `chooseRealm`/`visitRoom`. Preservar asserts de combate, recompensas, save/load e progressão. |
| Talent Tree anterior | **20** | `Invalid talent progress`. Os testes injetam progressos sem `treeVersion:15`, ou criados pelo `automatic-talents.js` legado (treeVersion 8). Construir progressos válidos usando o grafo v15 real; **não** reduzir requisitos/validação da Talent Tree. |
| Equipamento e patamares | **2** | Teste espera Plate apenas `end`, mas o gerador atual atribui `str` primário e `end` secundário. Espera E6 como `tier:6`, mas o sistema atual usa cinco patamares (E1/E5/E15/E35/E70) e representa E6 por E5. Confirmar intenção de design antes de atualizar expectativas. |
| Custo de Mana | **1** | `Efficient Cast` com 5 ranks reduz Staff 13 → 8 (e Wand 9 → 4), enquanto o teste espera Staff 13 → 6. Comparar com os valores aprovados. |
| XP ao ignorar eventos | **1** | O teste ainda espera +15 XP ao escolher `Pass`, mas a transação ativa usa `awardXp: choice!==2`. Confirmar o contrato de design, não trocar valores cegamente. |
| Checkpoint legado | **1** | O teste exige erro por ausência de `encounterVersion`, regra da rota antiga; o Dungeon usa outro estado. **Também foi detetada uma falha real de validação no ramo `restore(dungeon)`.** |
| **Total** | **48** | |

## Achado funcional adicional — prioridade P0

No controlador `online/v012-expedition-controller.js`, o ramo de `restore(input)` para `g.dungeon` faz validações mínimas e retorna antes das verificações da rota antiga.

Um teste read-only no harness demonstrou que foram aceites, sem exceção, estados com:

1. `foundationManifest.cards[0].bossModifierIds=['INVALID']`.
2. `dungeon.steps=-99`.
3. `foundationState` inconsistente, com ID de Boss Modifier inválido e ledger fictício.
4. Um checkpoint sem `encounterVersion` (este último campo pode ser legítimo não existir na Dungeon, mas precisa de contrato explícito).

**Impacto confirmado:** o controlador aceita checkpoints internamente incoerentes; existe risco de incoerência de gameplay, falhas de carregamento e efeitos indevidos ao consumir esses dados. **Não foi testado se a camada pública de saves consegue impedir que estes estados cheguem ao controlador.** Não afirmar vulnerabilidade explorável sem verificar essa camada.

### Plano concreto para Stage 4.5.2

**P0 — Integridade da Dungeon:** definir/validar formalmente seed, passos, topologia, IDs, compatibilidade dos modifiers, estado da preparação do boss e ledger, com testes de round-trip válido e rejeição de estado corrupto.

**P1 — Testes de gameplay atuais:** migrar os 23 casos de navegação/recompensas e os 20 de talentos para fixtures verdadeiras da v0.13, preservando as invariantes que testavam. Não apagar testes nem enfraquecer restrições para obter verde.

**P2 — Quatro divergências funcionais:** Plate/tier (2), Efficient Casting (1) e XP ao passar evento (1) exigem confirmação das regras pretendidas. Corrigir o teste ou a mecânica conforme essa decisão.

**Gate para avançar:** zero falhas novas na suíte atual, 48 casos resolvidos e relatados, regressões Stages 0–4, simulação nativa e QA browser de fluxos relevantes. **Esta auditoria não executou CI GitHub nem QA browser.**

## Ficheiros de testes afetados

`tests/automatic-rpg-groups.test.cjs`, `tests/automatic-rpg-talents.test.cjs`, `tests/v013-unified-lifecycle.test.cjs`, `tests/v013-craft-preview.test.cjs`, `tests/v013-loot.test.cjs`, `tests/v013-specializations.test.cjs`, `tests/v013-stat-consistency.test.cjs`.

O relatório local completo da auditoria inclui **o inventário nominal de todos os 48 casos**, com ficheiro e categoria. A presença de 48 falhas preexistentes não prova que o gameplay atual esteja totalmente correto; apenas que essas falhas não aumentaram nas Stages 2–4.
