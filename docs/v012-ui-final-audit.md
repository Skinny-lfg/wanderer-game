# Wanderer v0.12 — UI.5: auditoria final (UI.0–UI.4)

**Data:** 22-10-2026  
**Branch auditada:** `development`  
**Commit-base auditado:** [`4f7b12d0bb8cf603517fe8f2c32d8b0530437cb3`](https://github.com/Skinny-lfg/wanderer-game/commit/4f7b12d0bb8cf603517fe8f2c32d8b0530437cb3)  
**Decisão:** **CONDITIONAL / NOT READY FOR `main`** — a auditoria técnica detetou falhas no CI e Safari permanece por validar.  
**Âmbito desta entrega:** relatório apenas; sem alterações de UI, motor, economia, Firebase, saves, deploy ou `main`.

## 1. Método e limites da evidência

Esta auditoria foi retomada a partir do repositório remoto e dos registos GitHub Actions, sem acesso ao worktree local onde o Codex tinha interrompido trabalho. Foram consultados os relatórios das fases UI.0–UI.4, o HTML/CSS e os testes relevantes, o histórico da branch `development`, o inventário de assets/capturas e os logs CI.

**Verificação independente efetuada:** hashes/remoto, comparação UI.3→UI.4 (12 ficheiros num só commit), scripts e CSS em `development`, workflow e falhas exatas em GitHub Actions.  
**Evidência histórica, sem reexecução aqui:** testes Chromium e capturas descritos nos relatórios UI.0–UI.4.  
**Não verificado nesta retoma:** renderização pixel-a-pixel das capturas atuais, execução de Chromium sobre o worktree completo, teclado/leitor de ecrã real, Safari/WebKit e teste manual no Mac. Os ficheiros PNG de screenshots constam do repositório, mas não foram inspecionados visualmente de novo nesta retoma. Não converter evidência de testes sintéticos em prova de gameplay/balanceamento.

## 2. Situação das fases

| Fase | Implementação/documentação em development | Evidência histórica | Observações |
|---|---|---|---|
| UI.0 — critical fixes | Publicada | UI.0 Chromium 6/6 e fluxos direcionados PASS | Corrige Apothecary, passivos, log, ações de Realm |
| UI.1 — Camp & Inventory | Publicada | UI.1 Chromium 6/6 e regressões direcionadas PASS | Rearranjo, poções, scroll, comparação |
| UI.2 — Combat & Between Realms | Publicada | UI.2 Chromium 5/5 e regressões direcionadas PASS | Arena 69%, Bag/log compacto, 3 escolhas |
| UI.3 — City, affinities & Extraction | Publicada | UI.3 Chromium 6/6 e regressões direcionadas PASS | Merchant 4×3, Apothecary 4 ofertas, resumo |
| UI.4 — visual kit | **Publicada; HEAD confirmado** | UI.4 Chromium 6/6 e regressões direcionadas PASS | Moldura SVG 9-slice, tokens e estados |
| UI.5 — auditoria | Este relatório | Inspeção remota e logs CI | **Gates de release ainda falham** |

Nota: relatórios de UI.1/UI.3/UI.4 mantêm texto histórico "publicação pendente"; são descrições feitas antes do push. O HEAD remoto verificado para UI.4 é `4f7b12d...`, com pai `c7b879e...`.

## 3. GitHub Actions — P0 de release

**Workflow:** [Development v0.12 checks, run 39713871330](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39713871330), disparado por `4f7b12d...`.  
**Resultado:** **FAIL: 275/278 testes passaram; 3 falharam.** O passo `npm test` terminou com exit code 1; o passo seguinte de verificação PvP foi ignorado. Os jobs condicionais de auditoria extensiva não foram executados.

As três falhas e os stacks recolhidos:

1. **Clear All NEW** — `window is not defined` em `renderStash()` (`tests/v012-complete-flow.test.cjs`; stack em `evalmachine.<anonymous>:3113:122`). O `index.html` atual acede diretamente a `window.scrollY` ao renderizar o Stash. O harness Node não define `window`.
2. **C.3 expedition reward / treasure** — `arena.before is not a function` em `phase1DecorateCombat()` (`tests/v012-phase-c3-treasures.test.cjs:87`; stack em `evalmachine.<anonymous>:3576:162`). O código chama `arena.before(buffs)`; o elemento sintético do harness não implementa esse método.
3. **Belt craft/equip/compare/unequip/drop/sell** — `window is not defined` no mesmo `renderStash()` (`tests/v0120-equipment.test.cjs:38`).

**Histórico comparativo:**

| Commit/etapa | Run CI | Resultado |
|---|---|---|
| UI.0 `b7a9e65` | [39689386096](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39689386096) | PASS |
| UI.2 `67b3d8d` | [39690300209](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39690300209) | FAIL — `arena.before` |
| UI.1 `7a53f1d` | [39710870192](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39710870192) | FAIL — as três falhas |
| UI.3 `c7b879e` | [39712334581](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39712334581) | FAIL — as três falhas |
| UI.4 `4f7b12d` | [39713871330](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39713871330) | FAIL — as três falhas |

**Interpretação:** as assinaturas são compatíveis com um harness Node de DOM incompleto perante chamadas válidas de browser. Não há, por estes logs, prova de corrupção de saves ou bug de gameplay. Contudo, o gate obrigatório `npm test` está vermelho: requer correção e reexecução antes de release. Não marcar testes como PASS com base apenas na hipótese de incompatibilidade do harness.

**Remediação recomendada, fora desta auditoria:** (a) tornar o acesso ao scroll do `renderStash()` seguro sem `window`, ou fornecer `window` no harness; (b) atualizar o DOM sintético para suportar `before()` ou utilizar uma operação DOM equivalente testável; (c) executar os 3 testes dirigidos e `npm test` completo; (d) repetir regressões Chromium UI.0–UI.4 e C.3; (e) obter CI verde. Não alterar gameplay como solução para falhas de DOM simulado.

## 4. Auditoria por ecrã: implementado, desvios e validação pendente

| Ecrã/fluxo | Evidência de implementação na branch | Verificação ainda necessária |
|---|---|---|
| Camp | UI.1 reorganiza 22/43/35; três poções; Start visível a 1280×720; UI.4 aplica moldura | Revisão humana de legibilidade e scroll em desktop baixo e mobile Safari |
| Inventory | Slots, Stash 78px, ações More, comparação contextual; UI.4 estados NEW/affinity/raridade | Teclado/foco, seleção em Stash grande, zoom 200%, Safari |
| City Center / Blacksmith | Craft/odds compactos, preview de Random subtype | Fluxo real de compra/craft sem estado sintético |
| City Center / Merchant | 4 ofertas por categoria (12 posições); Buy/Compare/Restock | Persistência de stock ao navegar, fallback de textos muito longos |
| City Center / Apothecary | 4 ofertas, sem reroll ao entrar na tab; informação de efeito e Buy | Imagem por item, overflow de preços/nomes, Safari |
| Shrine / Affinities | Shrine gere runas; draft inicial de affinities está no fluxo pós-Start; UI.3 acrescenta descrições e passivo inicial | Confirmar que a informação de Magic corresponde à escolha do elemento |
| Combat | Arena ~69%; buffs separados; velocidade no header; Bag/log compactos | Overlays reais com bosses, combates prolongados e Safari |
| Between Realms | Resumo da personagem, 3 cartões, rerolls, Enter/Extract após opções | Navegação teclado, nomes extensos; footer não-sticky deliberado para não tapar a terceira opção em mobile |
| Seleção de passivos/eventos | UI.0 normaliza título, categoria, descrição e rank; modal com scroll interno | Exaustividade do catálogo (todos os textos/passivos), foco e confirmação |
| Extraction Complete | Métricas, Gold, Fragments, equipamento/treasures, log expansível e Return to Camp | Resumos de saves antigos e dados incompletos; imagens de itens perdidos não persistidas |

### Diferenças relevantes face à especificação inicial

- **Shrine vs afinidades:** Shrine é a tab de Runas; a escolha inicial de affinity ocorre após Start Expedition. A UI.3 melhorou a decisão no local real, sem duplicar sistemas.
- **Between Realms:** footer fixo/sticky não aplicado porque encobria o terceiro cartão e o reroll em mobile; ações ficam junto às três opções. Desvio funcionalmente justificado.
- **NPC artwork:** continuam placeholders no City Center; os relatórios não identificam imagens finais de NPC confirmadas em `assets/`.
- **Set bonuses:** relatório UI.1 aponta "none active" por lista vazia devolvida pelo runtime observado; confirmar com personagem real que tenha set ativo.
- **Extraction items lost:** resumo persistido antigo não inclui imagens dos itens perdidos; apresenta ícone de slot. Não inventar imagens nem alterar saves só para UI.
- **Snapshots:** há capturas antes/depois para Camp, Inventory, Merchant e Extraction em 1280px e 390px. Não há cobertura visual final antes/depois equivalente para todos os ecrãs/estados em UI.4.

## 5. Riscos abertos e prioridades

| ID | Prioridade | Estado | Ação |
|---|---|---|---|
| UI5-01 | **P0 / release blocker** | **ABERTO** | Corrigir as 3 falhas de `npm test` e confirmar GitHub Actions verde |
| UI5-02 | **P1 / release blocker para Safari** | **PENDENTE** | Validar Safari macOS/iOS ou WebKit equivalente, interações e layout |
| UI5-03 | P1 | Pendente | Sessão manual fim-a-fim com dados sintéticos: Camp→Expedition→Realms→passivos→Extraction→Camp |
| UI5-04 | P1 | Pendente | Confirmar apresentação de set bonuses em build com 2/3/4/5 peças ativas |
| UI5-05 | P2 | Conhecido | Imagens finais dos NPCs no City Center não confirmadas |
| UI5-06 | P2 | Conhecido | Placeholder para imagens de itens perdidos em resumos antigos |
| UI5-07 | P2 | Pendente | Revisão visual manual de textos extremos, zoom, contraste e modais em todos os viewports |
| UI5-08 | P2 | Pendente | Considerar snapshots finais de Combat, Between Realms, Shrine e passivos no UI.4 |

Não foi identificado, através da análise remota, um novo defeito confirmado de mecânica, economia, Firebase ou save. Este facto não substitui um teste de runtime com dados reais (que **não devem** ser alterados).

## 6. Screenshots existentes

**UI.4 (depois):**
- Camp [1280](ui4-screenshots/camp-after-1280.png) · [390](ui4-screenshots/camp-after-390.png)
- Inventory [1280](ui4-screenshots/inventory-after-1280.png) · [390](ui4-screenshots/inventory-after-390.png)
- Merchant [1280](ui4-screenshots/merchant-after-1280.png) · [390](ui4-screenshots/merchant-after-390.png)
- Extraction [1280](ui4-screenshots/extraction-after-1280.png) · [390](ui4-screenshots/extraction-after-390.png)

**Outros fluxos:** [UI.0](v012-ui0-critical-fixes.md) · [UI.1](v012-ui1-camp-inventory.md) · [UI.2](v012-ui2-combat-between-realms.md) · [UI.3](v012-ui3-city-shrine-extraction.md) · [UI.4](v012-ui4-visual-kit.md).

As imagens acima foram geradas nas fases anteriores; **esta auditoria não gerou novas capturas nem afirma revalidação visual independente destas imagens**.

## 7. Checklist de release e decisão

- [x] `development` contém UI.0–UI.4; UI.4 verificada em `4f7b12d...` na abertura da auditoria.
- [x] Comparação UI.3→UI.4: 1 commit e 12 ficheiros (index, CSS, teste, relatório, oito PNG).
- [x] Histórico de regressões Chromium documentado nos relatórios das fases.
- [x] Causas e stacks de CI localizados e reproduzíveis a partir dos logs.
- [ ] `npm test` verde no HEAD.
- [ ] Workflows obrigatórios sem falhas.
- [ ] Safari/WebKit validado.
- [ ] Smoke test manual end-to-end com dados sintéticos em browser.
- [ ] Aprovação explícita para merge em `main`.

**Decisão final UI.5:** auditoria técnica concluída com **bloqueios abertos**. A interface pode continuar a ser trabalhada e inspecionada em `development`, mas **não está aprovada para integração em `main`**. Resolver UI5-01, validar UI5-02/UI5-03 e repetir a revisão de release. Qualquer reparação deve ir em commit separado, sem alterar o gameplay, e sem publicar para `main` ou fazer deploy sem autorização.
