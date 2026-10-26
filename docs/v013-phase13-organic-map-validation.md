# Wanderer v0.13 — Fase 1.3: validação do mapa orgânico

**Resultado: NOT READY para avançar**, devido a um bloqueador de interface de progressão identificado pela suite browser. A disposição visual foi implementada e validada sem alterar o grafo, o combate, o calendário, a economia ou os saves. O bloqueador fica fora do âmbito visual desta fase e precisa de correção antes de considerar a base pronta.

## Escopo e ponto de partida

- Branch: `development`.
- HEAD inicial: `2faa1236a304b92fec305626800e4937bf0e651b` (`docs: validate phase 1.2 route design`).
- Checkout limpo no início; 18 commits locais à frente de `origin/development`.
- Não houve push, alteração de `main`, deploy, publicação de Rules ou acesso a saves reais.
- Browser e saves usaram fixtures locais sintéticas, com pedidos externos bloqueados.

## Implementação

Foi criado `online/v013-expedition-map-layout.js`, um módulo de apresentação determinístico que deriva coordenadas e curvas do grafo existente e da seed persistida. O posicionamento mantém a ordem por lane, segue a média dos nós de entrada nas bifurcações e reencontros, aplica deriva horizontal limitada por Realm e respeita margens e espaçamento mínimo. As arestas SVG são geradas a partir dos IDs de origem e destino do grafo; resize apenas redimensiona o SVG e não recalcula nem altera o grafo persistido.

O mapa existente conserva os 15 Realms, 35 nós e 42 ligações. O grafo autoritativo tem Realms com uma posição ou três posições; não há linhas de dois nós. Não escondi nem criei nós para fabricar uma densidade que não existe no grafo. Os nós disponíveis continuam selecionáveis com um clique.

O painel de escolha foi compactado: os detalhes de cada opção ficam juntos acima do mapa, com tipo, afinidade, Realm, evento/waves, Elite garantido e prémios atuais. O botão de reroll continua ligado à opção correspondente e mostra o saldo partilhado. O percurso selecionado e as opções seguintes têm estilos próprios; futuros nós permanecem discretos. Os botões de nó, reroll e pausa mantêm pelo menos 44×44 px.

## Comparação visual

Altura do painel, medidas pelo Playwright:

| Viewport | Fase 1.2 | Fase 1.3 | Diferença |
|---:|---:|---:|---:|
| 320 px | 1.066 px | 1.063 px | −3 px |
| 390 px | 1.054 px | 1.047 px | −7 px |
| 768 px | 1.036 px | 926 px | −110 px |
| 1280 px | 1.049 px | 939 px | −110 px |
| 1920 px | 1.049 px | 939 px | −110 px |

O mapa renderiza 35 nós, 42 arestas, 15 níveis e três detalhes contextuais de rota, sem cartões de escolha duplicados. Nos cinco tamanhos: zero pares de nós sobrepostos, zero overflow horizontal, zero texto contextual cortado, erro máximo de alinhamento entre extremidades e nós inferior a 0,02 px, e todos os botões de rota/reroll com pelo menos 44×44 px. Nos testes geométricos de 100 seeds não houve cruzamentos entre segmentos que ligam o mesmo par de níveis adjacentes. A galeria inclui 20 seeds diferentes.

### Capturas

- [Mobile 320 px](v013-phase13-organic-map-validation/screenshots/organic-map-320.png)
- [Mobile 390 px](v013-phase13-organic-map-validation/screenshots/organic-map-390.png)
- [Tablet 768 px](v013-phase13-organic-map-validation/screenshots/organic-map-768.png)
- [Desktop 1280 px](v013-phase13-organic-map-validation/screenshots/organic-map-1280.png)
- [Desktop 1920 px](v013-phase13-organic-map-validation/screenshots/organic-map-1920.png)
- [Galeria de 20 seeds](v013-phase13-organic-map-validation/screenshots/organic-seed-gallery-20.png)
- [Métricas e auditoria visual](v013-phase13-organic-map-validation/screenshots/viewport-metrics.json)
- Baseline da Fase 1.2: [mobile 390 px](v013-phase12-route-design-validation/screenshots/route-fork-390.png), [desktop 1280 px](v013-phase12-route-design-validation/screenshots/route-fork-1280.png).

## Testes

| Verificação | Resultado |
|---|---|
| `npm test` | **PASS** — 383 testes, zero falhas na versão final. |
| `node --test tests/v013-map-layout.test.cjs` | **PASS** — 100 seeds; determinismo, limites, espaçamento, ausência de sobreposição, direção das arestas, ligações válidas e ausência de cruzamento entre segmentos adjacentes. A galeria visual cobre outras 20 seeds. |
| `node tests/v013-map-browser.cjs` | **PASS** — 320, 390, 768, 1280 e 1920 px; cinco screenshots, galeria de 20 seeds, pontos de ligação após resize, pausa, rerolls persistidos, acesso a equipamento/Bag e clique de rota. Sem erros de consola. |
| `npm run simulate:v013-map` | **PASS** — 10.000 mapas e 810.000 percursos; quatro bifurcações por seed, distribuição de 1/2/3 Elites e 3/4 Events igual à Fase 1.2. |
| `npm run simulate:v012` | **PASS** — 174 casos, zero timeouts, 61 vitórias. |
| `npm run test:preview` | **PASS** — 4 testes; preview local privado. |
| `npm run test:assets` | **PASS** — VFX/assets e encaminhamento. |
| Browser de evasão, equipamento, preview privado, tesouros, auditoria visual global, extração com Bag cheia e polimento mobile/desktop | **PASS** — executados individualmente depois de a suite agregada parar. |
| `npm run test:browser` | **FAIL** — para na Expedition browser em `tests/v012-complete-browser.cjs`. Primeiro, o rerender/scroll do mapa deixa o clique automático do Playwright com coordenadas desatualizadas. Ao recalcular o alvo, a execução expõe outro bloqueio: após um Event, o checkpoint fica com `rewardPending` e sem ofertas, mas a UI não apresenta a escolha de passivo obrigatória. Não alterei runtime ou decisões de gameplay nesta fase; o bloqueio permanece por corrigir. Os restantes browsers da suite foram executados individualmente conforme indicado acima. |
| Persistência local | **PASS, escopo visual** — a preferência de pausa e o gasto de reroll persistem em save sintético após reload; a escolha do nó inicia o Realm correto. |
| Firebase, Rules e saves reais | **NOT TESTED** — fora do escopo e não utilizados. |

### Bloqueador da suite browser

O teste completo encontrou um checkpoint de Event com Realm seguinte disponível, mas `rewardPending` ainda presente e `offers` vazias. A sequência browser não encontra controlos de passivo nesse estado. É um problema de fluxo obrigatório, não de layout; não foi contornado nem corrigido aqui porque a Fase 1.3 limita as alterações à apresentação e proíbe mudanças de gameplay. Por isso, o resultado geral é **NOT READY**, apesar dos testes do mapa e das regressões não relacionadas terem passado.

## Ficheiros alterados

- `index.html` — carrega o layout de apresentação e renderiza arestas, nós e detalhes de rota no mapa existente.
- `online/v013-expedition-map-layout.js` — layout orgânico determinístico derivado do grafo.
- `online/v013-expedition-map.css` — mapa compacto, curvas, estados visuais e alvos acessíveis.
- `package.json` — inclui o teste do layout na suite `npm test`.
- `tests/v013-map-layout.test.cjs` — invariantes de layout, espaçamento, colisões e cruzamentos.
- `tests/v013-map-browser.cjs` — validação responsiva, screenshots, 20 seeds e interação com save sintético.
- `docs/v013-phase13-organic-map-validation.md` e artefactos em `docs/v013-phase13-organic-map-validation/screenshots/`.

Não foram alterados o motor de combate, mapas/grafos persistidos, regras de rota, progressão, afinidades, rerolls, recompensas, economia, Firebase, Rules ou saves.

## Commits e estado final

Não foram criados commits nesta tarefa. As alterações permanecem locais em `development`; nenhum push foi feito. O bloqueador de escolha obrigatória após Event tem de ser resolvido e a suite browser agregada deve passar antes de avançar.
