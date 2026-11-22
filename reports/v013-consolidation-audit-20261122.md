# Wanderer v0.13 — Consolidação e auditoria de código (22-11-2026)

## Âmbito
O branch canónico é `audit/v013-stage6` e a versão de experimentação é `playtest/v013-complete`. O ponto de partida tinha SHA `f4fe3d83` e já incluía Stages 6.18–6.21 e PRs #119–#121. Não recuperar commits de branches antigos. Esta auditoria não altera `main`, produção, Firebase, saves reais, loot nem balanceamento.

## Código obsoleto
- C5–C9 removeram fisicamente o gerador antigo dos 15 Realms, `combat/automatic-talents.js`, `combat/automatic-talent-layout.js`, árvore v9–v14, draft de passivas e migrações antigas. Não voltaram aos diretórios de aplicação.
- O C6 (estado inicial desta auditoria) encontrou **91 ficheiros de código/preview**, **80 entradas**, **0 entradas em falta**, **0 imports relativos em falta**, **0 referências a módulos retirados**, **0 chamadas a métodos antigos**, **0 CSS morto confirmado** e **0 módulos órfãos comprovados**.
- O C9 analisou **64 ficheiros de runtime** e **373 scripts/testes**. Identificou 19 nomes com uma única referência textual, principalmente SDK Firebase e métodos de clientes consumidos por indirection; não se devem apagar com base apenas nesta heurística.
- `phase3Account` foi removido de `index.html`: só tinha a declaração, sem referências no código ou controlos ativos. Uma nova regressão impede reintrodução.
- Os ficheiros com prefixo `v012` que ainda alimentam combate, gear, save e contas **não são** código obsoleto. `freeBuild` continua a assinalar o Dungeon atual.

## Erros confirmados e corrigidos
1. `tests/v013-c8-ui-wiring.test.cjs` não reconhecia `data-contract-target` usado em Marked Chambers. Agora classifica o marcador e exige CSS consumidor.
2. `tests/v013-expedition-foundation.test.cjs` exigia 4 Contracts; o catálogo atual tem 7, incluindo Marked Chambers e Boon Collector.
3. **Persistência:** `online/v012-save.js` validava apenas quatro IDs antigos (incluindo `pathfinder`), progresso máximo 2 e Gold máximo 40. Isto podia rejeitar summaries atuais com Monster Hunt 10, Skirmish 3, os dois Contracts novos ou prémios Gold 45/70. Corrigido para os 7 IDs e limites atuais; testes cobrem cada ID, 10 mortes, 70 Gold e rejeição de dados antigos/forjados.
4. O teste histórico de comparação da Stage 6.19 recusava a Stage 6.21 porque o texto do runtime mudou para os Bosses iniciais. O estudo histórico fica preservado; o gate atual testa as oito curvas Elite e a integração no runtime atual, sem alterar números.
5. `docs/index.html`, `docs/online/v012-save.js` e `docs/preview/talent-rebuild/index.html` estavam desatualizados. Foi regenerada a build isolada com `npm run build:pages` no branch de auditoria (não é deploy).

## Testes e limites
`.github/workflows/v013-unified-code-audit.yml` executa C6/C9, Stages 6.18–6.21, Contracts, `npm run test:v013:gate`, gráficos de talentos, economia, combate, cloud/save, emuladores Firestore/Auth, browser Chromium e progressão natural, mais verificação de ausência de diferenças após regenerar `docs/`. Considerar **aprovado** apenas o SHA com todas as verificações necessárias concluídas.

Os relatórios e scripts de experiências antigas não são uma segunda versão do jogo; foram mantidos para preservar evidência de comparações. C9 é uma análise conservadora, não prova absoluta de ausência de caminhos dinâmicos. E3–E5/E4 continuam a ter dificuldades de balanceamento conhecidas da Stage 6.21, fora do âmbito desta limpeza. Não há alegação de testes com jogadores ou contas reais.

## Fecho
Somente após CI verde: integrar a auditoria em `audit/v013-stage6` e atualizar `playtest/v013-complete` por fast-forward para o mesmo SHA; `main` intocada.
