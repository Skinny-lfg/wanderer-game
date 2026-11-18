# Wanderer v0.13 — Stage 4.5.2 · Correções de integridade e testes

**Data:** 2026-11-17. **Base:** Stage 4.5.1 PR #46, sobre Stage 4 PR #45. Esta stage não faz merge nem publica o jogo.

## Resultado reproduzido em Node.js 22.16.0

| Suíte | Antes (Stage 4) | Depois (4.5.2) | Observações |
|---|---:|---:|---|
| `npm run test:v013` | 147/195 passam, **48 falham** | **219/219 passam** | Adiciona 24 testes de integridade e gameplay v15; os 48 falhados deixam de falhar após migração da fixture legada e correção de expectativas |
| `npm test` (geral v0.12 e v0.13) | 279/387 passam, **108 falham** | 281/387 passam, **106 falham** | **Zero novos nomes de testes falhados**; duas falhas antigas desaparecem. As 106 restantes são pré-existentes e fora do gate específico 4.5.2. |

**Interpretação correta:** a suíte v0.13 está verde, mas isto não equivale a dizer que todo o Wanderer está validado. `npm test` permanece vermelho com 106 falhas, e ainda faltam os testes de browser em desktop/mobile e CI. A Stage 5 deve continuar bloqueada até ao checkpoint de QA, salvo decisão explícita.

## Correção funcional P0 — checkpoints da Dungeon

`online/v012-expedition-controller.js` passa a validar o ramo `restore(dungeon)` antes de modificar o estado ativo:

- `encounterVersion`, Expedition Level, stage, 3 Realm Cards, famílias, tamanhos 18/20/22, passos iniciais 14/13/12, objetivos e eventos da geração;
- topologia e conexões não duplicadas, índices válidos, salas visitadas/limpas e passos restantes dentro dos limites;
- **seed determinística**, condição e 1/2/3 modifiers por dificuldade, afinidades permitidas, incompatibilidades e boss style correto;
- `foundationManifest`, `foundationState` e **replay integral do diário**; o ledger não pode inventar scouts, secrets, boss reveals, Boons ou boss preparation;
- estado do Elite marcado, custo/efeito da Reliquary e propriedade efetivamente desativada coerentes;
- incoerências de seleção, offers, progressão e terminal states bloqueadas.

A validação é **fail-closed** e não modifica o estado de uma expedição se rejeitar o checkpoint. Não foram alterados dados de jogadores nem saves permanentes. Os testes com eventos colocados artificialmente no primeiro anel foram adaptados para usar uma Reliquary naturalmente gerada quando verificam restauração, sem relaxar a validação do jogo.

## Testes históricos e atuais — distinção explícita

Parte das 48 falhas era causada por testes do **antigo calendário de 15 Realms e da antiga Talent Tree** a usar diretamente o novo harness, que agora inicia uma Dungeon diferente e usa o grafo v15.

- Para não perder os asserts de combate legado (grupos, ataques, DoTs, histórico de Rune e projetos), esses testes utilizam uma **fixture histórica isolada**, `tests/v013-legacy-fixture.cjs`. A fixture injeta o antigo percurso e a árvore anterior **só dentro do processo de teste**; não altera gameplay, saves ou artefactos publicados. Estes testes **não** devem ser apresentados como prova de funcionalidade equivalente no novo mapa.
- A suite nativa mantém os testes de Stages 0–4 **mais seis novos testes** com a verdadeira Talent Tree v15 e Dungeon de três Realm Cards. Verificam `treeVersion:15`, requisitos da árvore, pontos ganhos, afinidades permanentes, custos de deslocação e chegada natural ao boss.
- O teste de checkpoint legado deixa de ser a única referência: os testes atuais de Dungeon incluem **18 cenários de integridade e transição** e **100 checkpoints válidos** em diferentes seeds, cobrindo Scout, deslocação, entrada em combate e vitória.
- Testes de equipamento passam a confirmar o plateau Veteran E5–14 (E6 dá `tier:5`) e Plate com Strength principal e Endurance secundária.
- Testes de Efficient Casting confirmam a regra atual de −1 Mana por rank com mínimo 3; ao passar num evento não é atribuída XP.
- Uma asserção antiga sobre os multiplicadores exatos de Spell Power foi substituída por verificações de aumento de recursos mágicos em armas físicas, mantendo a cobertura da capacidade em vez de forçar uma fórmula obsoleta.

**Limitação para Stage 4.5.3/4.5.4:** os antigos asserts ainda testam um motor histórico em contexto de regressão. Para eliminar esse contexto de vez, será necessário migrá-los individualmente para cenários nativos com as mecânicas equivalentes — ou aposentá-los com justificação e cobertura substituta. O gate atual não prova essa migração integral.

## Procedimentos locais

```bash
npm run test:v013
npm run test:v013:checkpoint
npm run test:v013:native
npm test
```

## QA ainda pendente

- Browser real desktop e mobile, com foco em seleção de Realm Cards, clique nos caminhos, eventos, Oracle, boss e extração.
- Ciclo cloud/Pages e Firestore rules, em ambiente isolado.
- Revisão dos restantes 106 testes da suíte geral e prioridade por gameplay versus expectativas obsoletas.
- Aprovação explícita para merge/publish. **Nada foi publicado nesta Stage.**
