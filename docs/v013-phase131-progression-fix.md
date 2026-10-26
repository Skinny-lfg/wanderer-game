# Wanderer v0.13 — Fase 1.3.1: bloqueio de progressão após Event

## Resultado

**READY para fechar este bloqueio de progressão.** A reprodução de uma Expedition por estados legítimos não encontrou um bloqueio no runtime. O relatório da Fase 1.3 identificou incorretamente como falha de gameplay um cenário produzido por uma adaptação temporária do teste browser que deixava de resolver o passivo obrigatório depois de um Event. A suite browser também tinha cliques frágeis no mapa após o scroll/re-render, o que dificultava chegar ao fluxo de forma consistente.

Não foram alterados o runtime, as regras de progressão, a geração do mapa, o balanceamento, os passivos, loot, economia, Firebase ou saves. A correção desta fase reforça a regressão browser e torna a interação do teste com os nós do mapa determinística e verificável.

## Estado preservado

- Branch: `development`.
- HEAD de entrada: `2faa1236a304b92fec305626800e4937bf0e651b`.
- Criado checkpoint recuperável antes da correção em `/tmp/wanderer-phase131-checkpoint/`:
  - `tracked.patch` — SHA-256 `bc7b113ee60571c340e1fffd381b26d50bdd54090733ab5a5142a180c9235628`.
  - `untracked.tar.gz` — SHA-256 `3798b8b2d7848f1cf4a1fcdc4db71c3519fdf23b08c7fef50cc04e5c18b21002`.
- Nenhum push foi feito. `main`, serviços Firebase, Rules e saves reais não foram acedidos ou alterados.

## Reprodução e causa raiz

A reprodução usou o jogo integrado, browser Chromium e um slot local sintético isolado. Todos os pedidos para fora do servidor local foram bloqueados. A sequência percorreu combate, Event, recompensa pendente, escolha de passivo, Between Realms/mapa, continuação automática e reload.

A sequência observada foi:

1. Resolver Event chama `phase6EventChoice`, limpa o Event ativo, regista o encontro uma vez e conclui o Realm pelo controller.
2. O controller cria `rewardPending`; o runtime cria `phase1Draft` (`kind: reward`, `step: passive`) e persiste ambos antes de renderizar.
3. A UI prioriza `phase1Draft` mesmo quando não há offers de mapa; apresenta cards de passivo ou o controlo explícito de pool esgotado.
4. O restore carrega draft e controller do mesmo checkpoint; valida a recompensa e volta a apresentar a escolha.
5. `phase2ChoosePassive` só reivindica a recompensa uma vez, limpa draft e pending, depois regressa ao mapa ou auto-avança se a rota for linear e não houver bloqueios de Bag/overflow.
6. O auto-advance recusa avançar quando `rewardPending` existe. A seleção obrigatória não pode ser ultrapassada.

Na execução determinística deste browser foram exercidos Events nos Realms **R5, R6, R12 e R13**: reentrada após bifurcação, segmento de bifurcação, reencontro e segmento posterior. Nos checkpoints Event→passivo, `offers` de mapa estavam vazias e a escolha obrigatória continuou visível. Cada checkpoint pendente foi recarregado antes de escolher; após escolher, outro reload confirmou ausência de recompensa/passivo duplicado. A Expedition concluiu 15 Realms com 14 recompensas de passivo resolvidas.

A afirmação de Fase 1.3 sobre “rewardPending sem UI” não foi reproduzida no runtime atual. A auditoria do harness identificou que uma alteração experimental à rotina browser tinha ignorado o passivo depois de Events e produzido o estado que mais tarde foi interpretado como falha do jogo. Separadamente, o teste browser antigo clicava em alvos de rota/reroll sem recalcular o centro depois do scroll e re-render. O teste agora calcula o centro após rolar, confirma que o centro recebe o pointer e só então clica. Isto corrige o método de teste sem contornar as regras do jogo.

## Alterações realizadas

- `tests/v013-event-progression-browser.cjs`: teste de regressão integrado com save sintético; valida Event decline, pending com zero map offers, UI de passivo, reload pendente, claim único, reload concluído, progressão e conclusão da Expedition.
- `tests/v012-complete-browser.cjs`: helper de interação que rola para o alvo, recalcula o centro, confirma o elemento atingido e clica; aplicado a rerolls e nós de rota que re-renderizam o mapa.
- `package.json`: inclui o teste Event progression na suite `test:browser`.
- Nenhuma alteração em gameplay ou persistência de produção.

## Validação

| Comando/verificação | Resultado |
|---|---|
| Reprodução Event com reload e continuação | **PASS** — 4 Events em R5/R6/R12/R13; 14 passivos; conclusão em R15. |
| `npm test` | **PASS** — 383 testes, zero falhas. A primeira execução no sandbox não tinha permissão para abrir sockets locais; repetida com acesso local autorizado e passou. |
| `npm run test:browser` | **PASS** — suite completa; inclui Expedition completa em 390/1280 px, regressão Event, mapa em 320/390/768/1280/1920 px, extração com Bag cheia e outros browsers. |
| `npm run test:preview` | **PASS** — 4 testes, usando apenas servidor local de preview. |
| `npm run test:assets` | **PASS** — VFX e assets. |
| `npm run simulate:v012` | **PASS** — 174 casos, 0 timeouts, 61 vitórias. |
| `npm run simulate:v013-map` | **PASS** — 10.000 mapas, 810.000 percursos; sem bloqueios de rota. |
| Firestore Rules / Firebase real | **NOT TESTED** — fora do âmbito, sem deploy ou dados reais. |

A suite browser gravou screenshots em diretórios históricos versionados durante a execução. Essas mudanças foram restauradas; as capturas sintéticas preexistentes da Fase 1.3 foram preservadas.

## Commits locais

A Fase 1.3 original foi guardada num commit separado antes do commit corretivo. Os identificadores estão registados na secção de commits deste relatório depois da criação do histórico local.

## Estado final

**READY para fechar o bloqueio de progressão após Event.** Uma escolha obrigatória legítima foi observada, persistida, restaurada, resolvida uma vez e seguida pelo fluxo normal. A suite completa passou. Não houve push; todas as alterações permanecem em `development`.
