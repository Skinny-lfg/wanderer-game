# Wanderer v0.12 — Fase 3B: Acessibilidade e regressão global

## Resumo

Validação executada em `development`, a partir do commit `b089b94`. A correção dos landmarks, títulos, texto alternativo e navegação das tabs reduziu as violações Axe detetadas de 131 nós para zero nos estados e larguras auditados. Não foi feita alteração de gameplay, economia, progressão, saves, Firebase Rules, NPC placeholder ou botão sticky.

O resultado sustenta uma revisão pré-publicação, não uma declaração de conformidade WCAG 2.2 AA: faltam a inspeção manual dos contrastes sobre imagens/gradientes e a validação do zoom real a 200% num browser com interface gráfica. Permanecem também falhas de testes preexistentes documentadas abaixo.

## UI.3 — fluxo Magic → Affinity

A assertion antiga dizia que Close no diálogo Magic deveria voltar às opções de Affinity. O runtime atual define três comportamentos distintos: Back e Escape regressam às Affinities e devolvem o foco a Magic; Close fecha a sequência de escolha e devolve o foco ao botão que abriu o fluxo. A assertion foi corrigida para refletir esses comportamentos e continua a verificar o foco e o fecho dos diálogos.

A comparação no worktree isolado de `408c386` reproduziu a falha original: Close já fechava a seleção nessa revisão. Logo, era uma expectativa de teste desatualizada, não regressão da Fase 3A. O teste UI.3 atualizado passou em 1440×900, 1280×720, 1024×768, 768×1024, 390×844 e 360×800. Back, Escape, Close, retorno de foco e seleção Magic foram verificados.

## Acessibilidade e Axe

O teste `tests/v012-accessibility-audit-browser.cjs` percorre 12 estados (Camp, Inventory, City Center, Merchant, Apothecary, Forge, Shrine, Initial Affinity, Magic element, Combat, Account e Leaderboard) em quatro viewports: 390×844, 768×1024, 1440×900 e 1920×1080. São 48 combinações antes e 48 depois.

| Regra Axe | Antes (nós) | Depois |
|---|---:|---:|
| `aria-prohibited-attr` | 24 | 0 |
| `heading-order` | 4 | 0 |
| `image-redundant-alt` | 56 | 0 |
| `region` | 32 | 0 |
| `page-has-heading-one` | 12 | 0 |
| `label-content-name-mismatch` | 3 | 0 |
| **Total** | **131** | **0** |

A alteração da slot de poção para `role="group"` torna válido o seu nome acessível. Foram acrescentados títulos H1 visualmente ocultos em vistas sem título principal; corrigidos níveis de headings e landmarks; removidos alts redundantes; e aplicado roving focus com ArrowLeft/ArrowRight/Home/End nas tablists do City Center, operações Blacksmith e Between Realms. O controlo de velocidade do combate mantém agora o nome acessível coerente com o texto visível. Os estados de foco usam os estilos atuais do projeto.

A auditoria Axe deixou 1.724 ocorrências de contraste em `incomplete`, para avaliação manual, principalmente por fundos compostos. Não são violações automáticas confirmadas. Os ficheiros `accessibility/axe-before.json` e `accessibility/axe-after.json` guardam resultados completos. O teste também verificou ausência de overflow horizontal nos estados cobertos.

## Contraste e zoom

Medições de pares de cores CSS lisos, usando as cores dos tokens existentes:

| Texto / fundo | Rácio |
|---|---:|
| `#f0e5e5` / `#2c1a22` | 13.34:1 |
| `#c7afb7` / `#2c1a22` | 8.02:1 |
| `#dfb76f` / `#2c1a22` | 8.72:1 |
| `#dfb76f` / `#100a0e` | 10.39:1 |
| `#82b5eb` / `#1b0b13` | 8.84:1 |

Estes rácios não cobrem pixels de imagens, transparências, gradientes ou estados transitórios, portanto não demonstram AA para toda a UI. Axe não reportou violações determinadas de contraste, mas marcou casos compostos para revisão manual.

Foi tentado zoom real pelo Chromium headless via atalho de teclado; o browser manteve `devicePixelRatio=1` e `innerWidth=1440`. O ambiente não tem display/Xvfb/xdotool e bloqueia páginas `data:`/`file:` para a alternativa de harness. Assim, zoom real a 200% **não validado**. Testes complementares de reflow a 320 e 720 CSS px passaram em Camp, Inventory e City Center, sem overflow horizontal; estes testes não substituem zoom.

## Regressão visual e capturas

Capturas antes/depois, JPEG, estão em [`accessibility/before/`](accessibility/before/) e [`accessibility/after/`](accessibility/after/), com 12 estados × quatro larguras (390, 768, 1440 e 1920 px). Os JSON Axe estão no mesmo diretório. As imagens antes usam o HTML/CSS do HEAD inicial `b089b94`; as imagens depois usam as alterações desta fase.

A captura visual não identificou mudança inesperada de layout. O título auxiliar é visualmente oculto, os estilos de headings foram preservados localmente e não foram alterados PNGs ou proporções. A navegação das tabs foi verificada com teclado. A auditoria de axe não substitui validação manual de touch em dispositivos físicos.

## Testes e falhas conhecidas

- `npm run test:browser`: **PASS** para os testes executados (expedition completa, evasion, equipment, private hosting, C3 treasures, Shrine e UI polish). Os testes de desktop das tabs agora validam o estado dourado já definido pelo CSS aprovado, em vez de esperarem o estado vermelho antigo.
- `node tests/v012-accessibility-audit-browser.cjs`: **PASS**, 48 combinações depois, 0 violações Axe, sem overflow horizontal nos estados cobertos.
- `node /tmp/v012-ui3-browser-validation.cjs`: **PASS**, seis larguras; saída de screenshots redirecionada a `/tmp` para preservar as capturas existentes.
- Reflow 320/720 CSS px: **PASS**, Camp, Inventory e City Center.
- `npm test`: **273 passed, 22 failed**. As falhas são as 20 fixtures de SHA-256 de `c3-six-treasure-catalog-v012-realm-affinity-rewards`, o teste de geometria que espera cinco linhas com `78px` para as poções embora o CSS atual use `var(--gear-slot-width)`, e a suite agregadora que reporta falha. Hashes e mecânica não foram alterados. A documentação anterior do projeto classifica estas divergências como preexistentes no baseline `182508d`.
- `node tests/v0120-results.test.cjs`: **2 passed, 3 failed**, com `review: null` onde as fixtures esperam `realm` e arrays `lost`/`picks` vazios. São falhas já documentadas contra `d7a5dfd`; não foram alterados runtime nem testes dessa suite.
- `git diff --check`: **PASS**.

Nenhuma das falhas globais acima envolve os caminhos modificados nesta fase; as falhas preexistentes não foram mascaradas nem atualizadas em massa.

## Hunks locais antigos de `index.html`

- O texto do Shrine `When you fell the final boss of every tenth Expedition` → `When you fell the final boss of an Expedition` pertence à revisão de UX Writing da Fase 3A. Ficou fora dos commits desta Fase 3B e permanece local e não committed. Não o incluí automaticamente, conforme pedido.
- O wrapper da slot de poção passou a `role="group"` mantendo `aria-label`; esta alteração corrige a violação Axe `aria-prohibited-attr` reproduzida nas três slots. Foi incluída no commit de acessibilidade.

As restantes alterações locais preexistentes, incluindo screenshots e documentação de auditorias anteriores, foram preservadas e não staged.

## Ficheiros desta fase e commits

Commit de acessibilidade: `19eea11` — `Fix global accessibility semantics and keyboard tabs`.

Commit de testes e relatório: `ffaa00c` — `Correct stale global browser expectations`.

Código: `index.html`, `online/v012-ui5-camp.css`, dependências de desenvolvimento Axe e `tests/v012-accessibility-audit-browser.cjs`. Testes ajustados: UI.3 e expectativas de estado selecionado dourado do desktop. Capturas e resultados: `docs/ui-audit/accessibility/`.

## Pendências antes de publicação

1. Executar o teste de zoom real a 200% em browser com UI gráfica e revisar contraste em fundos compostos.
2. Resolver ou aceitar formalmente as falhas preexistentes em `npm test` e `v0120-results.test.cjs` antes da publicação.
3. Fazer inspeção manual de leitor de ecrã e touch real; a automação disponível cobre teclado e axe no Chromium.

Não foi feito push, merge ou deploy. A branch está adequada para **revisão pré-publicação**, com as limitações acima explícitas; não se declara prontidão final de publicação nem conformidade WCAG AA global.
