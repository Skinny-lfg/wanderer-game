# Wanderer v0.13 — Stage 4.5.4 · Browser QA

**Estado:** auditoria em Chromium executada num **checkout GitHub completo**, num runner GitHub Actions Ubuntu 24.04 / Node 22 / Playwright 1.56.1. Implementação no PR #49 (draft). **Sem merge ou deploy.**

## Evidência verificável

- [PR #49 — Stage 4.5.4](https://github.com/Skinny-lfg/wanderer-game/pull/49)
- [Run final de browser QA — 44171471985](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44171471985), commit `c0309eed6ab5a6e050ab2c85805a2162e2ed84e1`, **conclusão global failure**.
- [Run de integração v0.13 — 44171471889](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44171471889), **success** no mesmo commit.
- Artefacto do run de browser: `v013-browser-qa-a7a9b7ebcc0c9b54020e71932429427fd84e1481`, com cinco logs individuais, `stage45-native.json` e oito capturas do novo teste, mais capturas de testes anteriores.
- Nenhuma verificação manual através do browser local foi conseguida: o ambiente local bloqueou navegação Chromium para localhost/ficheiros. A interação no browser deste relatório ocorreu efetivamente **no runner GitHub Actions** via Playwright.

## Teste novo do estado atual — PASS (9/9)

`tests/v013-stage45-browser-qa.cjs` usa uma cópia temporária isolada do preview, com testes de interação em Chromium. O script **não modifica o save público nem injeta hooks no index.html publicado**.

| Cenário realmente executado | Resultado |
|---|---|
| Camp desktop 1440×900 renderizado | PASS |
| Talent Tree v15 abre como componente incorporado | PASS |
| Três Realm Cards exibem omen de boss | PASS |
| Mapa Dangerous mostra saídas de salas conhecidas | PASS |
| Caminho natural até ao Forgotten Reliquary; escolha real desativa Boss Modifier | PASS |
| Reload do browser mantém HP, passos e propriedade desativada | PASS |
| Botão central Entrada clicável no mapa mobile 390×844 | PASS |
| Camp/map mobile sem overflow horizontal do documento | PASS — medido `mobileOverflow: 0` |
| Sem exceções JavaScript não tratadas nas vistas observadas | PASS — `pageErrors: []` |

O relatório `stage45-native.json` contém `accessibility: []` e `limitations: []` para o teste axe do mapa mobile. **Isto não é uma auditoria de acessibilidade a todas as 23 vistas**; só cobre esse ecrã e as regras automáticas configuradas.

O teste acelera combates pondo HP inimigo a zero **apenas dentro do preview de teste**. Não demonstra balanceamento, qualidade de animação, boss inteiro sem facilitação, integração cloud ou um percurso completo do jogador em todos os cenários.

### Defeito real encontrado e corrigido

No mapa mobile 390 px, os botões das salas do anel central sobrepunham-se, fazendo com que texto de contagem de saídas interceptasse o clique no botão de entrada.

Correção no `index.html` de desenvolvimento:
- Canvas radial com `min-width:900px` e `height:600px` para permitir separação horizontal e scroll dentro do mapa.
- Rótulos abreviados `Swarm` e `Reliquary`, sem alterar identidade/efeitos dos encontros.
- Botões com dimensão máxima, quebra de linhas e z-index claros.

A regressão com clique no botão `data-dungeon-room="0"` **passou no run final**, e o screenshot `map-mobile.png` mostra os quatro botões de primeira coroa distintos. **Topologia, ligação, orçamento de passos, loot e saves permanecem inalterados.**

## Quatro testes antigos de browser — FAIL (mantidos e documentados)

O runner executou os cinco scripts independentemente, preservando todos os resultados apesar das falhas. Nenhum destes testes foi ocultado/desativado:

| Script | Erro registado no run final | Triagem |
|---|---|---|
| `v013-pages-browser.cjs` | Após ir a `/?reset=ranks-1`, não aparece `[data-phase1-expedition]:visible` no tempo esperado | **Por resolver**: distinguir fluxo de reset/login vs. expectativa obsoleta; o script já tinha percorrido o mapa e combate antes da falha |
| `v013-cleanup-ui-browser.cjs` | Espera por `[data-phase1-plane]` (fluxo de seleção anterior à Dungeon) | Seletor/fluxo histórico; migrar para Realm Cards e salas atuais |
| `v013-talent-tree-browser.cjs` | Espera `.talentGraphViewport` diretamente na página | Seletor histórico; a árvore v15 agora é um iframe |
| `v013-clarity-browser.cjs` | `TypeError: T.path is not a function` | API de talentos histórica; migrar para navegação de grafo v15 |

**O workflow completo de browser permanece vermelho** e não deve ser promovido a gate verde enquanto esses casos não forem migrados ou corrigidos. A execução bem-sucedida do novo smoke não os invalida.

## Correções apenas de infraestrutura QA

- Runner fixado em **Ubuntu 24.04**; o Ubuntu 26.04 usado inicialmente não suporta o Playwright 1.56.1 deste projeto. A primeira execução falhou **antes de abrir Chromium** por incompatibilidade de instalação.
- Script da workflow corrigido para executar todos os casos mesmo quando um falha, guardar os logs por script e carregar screenshots.
- Servidor HTTP do teste atual passa a mapear `/` para `index.html`.
- Teste atual aceita o markup de combates Solo e Group (não apenas `.arenaEnemy`).
- O gerador de preview de testes adapta uma verificação de namespace de reset v5→v6 **apenas no ficheiro copiado para o preview temporário**. O teste histórico de reset continua falhado; não se pode considerar o problema resolvido.

## Pendências obrigatórias antes de release / Stage 5

1. Migrar ou corrigir **quatro testes de browser históricos**, especialmente `/?reset=ranks-1` — verificar se é um bug verdadeiro de recuperação.
2. Inspecionar o mapa e menus em outras larguras (320, 768, 1920 px), com revisão visual das screenshots e do scroll.
3. Completar fluxos reais de Elite, Oracle, boss final sem HP artificial, derrota/abandonar, perfil e cloud save em browser.
4. Suíte geral `npm test` com **106 falhas históricas na execução local incompleta** ainda requer triagem com checkout completo; relatório Stage4.5.3.
5. QA de acessibilidade abrangente, performance e CI de release, incluindo revisão de avisos de dependências instaladas.

**Stage 4.5.4 encontrou e corrigiu um defeito real, validou os fluxos principais executados, mas não constitui release aprovado.** Não houve merge nem publicação.
