# Wanderer v0.13 — Fase 1.2: validação do desenho de rotas

**Resultado: READY para avançar à próxima fase de progressão.** A geração, os percursos, a persistência e a interface passaram as verificações críticas descritas abaixo. Esta recomendação não valida as novas hordas, que continuam fora do âmbito.

## Segurança e ponto de partida

- Branch: `development`.
- HEAD inicial: `a4c45b6917c669ea0b8dfd72fdcef5c64b3a7ecf`.
- A branch local estava 15 commits à frente de `origin/development`, sem commits remotos exclusivos (`15 0`). Não foi necessário atualizar ou reconciliar branches.
- Antes de editar foi guardado um bundle verificável do HEAD e da branch: `/tmp/wanderer-development-phase12-start.bundle`, SHA-256 `2ad1a1f4b1e76b2759c9eebe32198011ec1f454a1df75f8d5628566cfda8096f`.
- Nenhum reset, merge, rebase, force-push, push, deploy ou acesso a saves reais foi feito. `main`, Firebase e Rules não foram alterados. Os browser tests usaram apenas slots sintéticos locais e bloquearam pedidos externos.

## Geração da rota

O mapa mantém 15 Realms, com um grafo de 35 nós e 4 bifurcações persistentes. Os caminhos se separam por 3, 3, 2 e 2 Realms e reencontram-se em R5, R9, R12 e no boss de R15. Há 81 percursos completos por mapa.

As decisões surgem em R2, R6, R10 e R13. Cada bifurcação tem três opções com sequências distintas de encontros e/ou eventos concretos. Rerolls alteram a oferta de afinidade/tema, mas ficam presos ao mesmo nó; não substituem o destino nem repõem o saldo partilhado. Nó escolhido, rota, estado concluído/disponível, seed e preferência de auto-advance são persistidos e validados. A validação do save também aceita checkpoints do formato de mapa v1.

O calendário preserva 3 ou 4 encontros Event por percurso e usa os 16 eventos atuais, sem repetir o mesmo Event ID no mesmo percurso. Os encontros Elite variam de 1 a 3 conforme a rota; a média permanece exatamente 2, como no sistema anterior. O boss continua em R15. Não foram criados inimigos, eventos, afinidades, moedas ou fórmulas de recompensa.

As rotas mais perigosas trocam encontros Combat por Elite e recebem as recompensas existentes para Elite: +4 Gold, +3 Fragments e 84% de probabilidade base de drop no último wave. As probabilidades e prémios de runtime não foram modificados. Esta escolha aumenta exposição a encontros de 2–3 waves e pode elevar os drops. A UI explicita estes valores nas opções, além da afinidade, tipo do encontro, waves e sequência até ao reencontro.

Os eventos têm diferenças reais de identidade e ordem ao longo das vias. As bifurcações centradas em eventos conservam a quantidade total de eventos; não são apresentadas como um caminho de Elite mais perigoso. O risco económico explícito provém das alternativas Combat/Elite. A escolha de evento continua a usar as decisões e efeitos existentes no próprio evento.

## Simulação e equilíbrio

`npm run simulate:v013-map` gerou 10.000 mapas, enumerou e verificou 810.000 percursos e terminou sem nós inacessíveis, dead ends ou bloqueios até R15. Para cada mapa, as três opções de cada uma das quatro bifurcações foram distintas.

| Medida nos 810.000 percursos | Resultado |
|---|---:|
| Percursos com 1 / 2 / 3 Elites garantidos | 180.000 / 450.000 / 180.000 |
| Média de Elites garantidos | 2,00 |
| Percursos com 3 / 4 Events | 405.972 / 404.028 |
| Eventos distintos cobertos | 16 de 16 |
| Waves esperados por Expedition | 25,0024 |
| Waves nos percursos amostrados | mínimo 14, máximo 36, média 25,0001 |
| Recompensa Elite esperada média, incluindo promoção aleatória de 20% em Combats | +14,801 Gold / +11,1007 Fragments |
| Equivalentes Elite esperados, incluindo a promoção aleatória | 3,7002 |
| Drops esperados em Combat, Elite e boss; escolhas de Event excluídas | 7,4741 |

Comparação de duas rotas da mesma seed e com 3 Events: rota de menor risco com 1 Elite garantido e 10 Combats: +12 Gold/+9 Fragments garantidos de prémio Elite, 25,5 waves esperados e 7,4047 drops esperados. Rota de maior risco com 3 Elites e 8 Combats: +18,4 Gold/+13,8 Fragments esperados incluindo as promoções aleatórias, 26,5 waves e 8,0931 drops esperados. A diferença esperada é +6,4 Gold, +4,8 Fragments, +1 wave e +0,6884 drops. O prémio garantido de Elite aumenta em +8 Gold/+6 Fragments; o valor esperado líquido é menor porque a rota tem menos Combats e, portanto, menos promoções Elite aleatórias.

As 81 combinações de quatro escolhas foram simuladas até completar 15 Realms. Os testes confirmaram limite de três afinidades, eventos, passive obrigatório, boss, persistência/restauro e ausência de mudança de rota ou softlocks. A simulação usa geração determinística; eventos continuam a oferecer as escolhas e efeitos já existentes.

## Fluxo de progressão e comparação com a Fase 1.1

O caminho de 13 seleções em R2–R14 foi reduzido para 4 decisões de rota: menos 9 seleções, ou 69,2%. O primeiro Realm entra diretamente e o nó selecionado continua a abrir o encontro com um único clique. O auto-advance só escolhe uma continuação linear de uma opção, depois de resolver qualquer passive obrigatório, quando a preferência está ligada e existe espaço na Bag. Não atravessa as bifurcações R2/R6/R10/R13. A pausa, gestão de equipamento, poções, Bag e Extract mantêm-se disponíveis.

| Viewport | Painel Fase 1.1 | Painel Fase 1.2 | Diferença | Nós no mapa |
|---:|---:|---:|---:|---:|
| 320 px | 1.106 px | 1.066 px | −40 px | 41 → 35 |
| 390 px | 1.114 px | 1.054 px | −60 px | 41 → 35 |
| 768 px | 1.191 px | 1.036 px | −155 px | 41 → 35 |
| 1280 px | 1.204 px | 1.049 px | −155 px | 41 → 35 |
| 1920 px | 1.204 px | 1.049 px | −155 px | 41 → 35 |

As medições da Fase 1.1 vêm de `docs/v013-phase11-map-ux-validation.md`; as medições atuais vêm do browser Playwright. Nas cinco larguras não houve overflow horizontal nem erros de página. Os nós, rerolls e controlo de pausa têm alvos de toque de pelo menos 44×44 px. As capturas são do preview sintético e mostram o boss e início do percurso na mesma orientação vertical.

## Screenshots

- [Mapa mobile — 390 px](v013-phase12-route-design-validation/screenshots/route-fork-390.png)
- [Mapa desktop — 1280 px](v013-phase12-route-design-validation/screenshots/route-fork-1280.png)
- [Métricas visuais nos cinco viewports](v013-phase12-route-design-validation/screenshots/viewport-metrics.json)

## Testes

| Verificação | Resultado |
|---|---|
| `npm test` | **PASS** — 382 testes, 0 falhas; inclui 10.000 seeds e 810.000 rotas |
| `npm run test:browser` | **PASS** — suite integral; Expedition completa em 390/1280 px, login UI, equipamento, extração com Bag cheia, VFX/inimigos e mapa nos cinco viewports |
| `npm run test:preview` | **PASS** — 4 testes; requer permissão local de rede para o servidor de preview. Todos os requests externos são bloqueados |
| `npm run test:assets` | **PASS** — 29 PNGs VFX, 7 mappings de affinity e encaminhamento de assets |
| Auth/Firestore Emulators | **PASS, com ressalva do runner** — os 10 testes passaram em `demo-wanderer` e o script de teste saiu com código 0; após o encerramento, Firebase Tools imprimiu erro no update-check/shutdown. Nenhuma Rules foi publicada |
| `npm run simulate:v012` | **PASS** — 174 casos, 0 timeouts, 61 vitórias; harness de regressão legado |
| `npm run simulate:v013-map` | **PASS** — 10.000 mapas, 810.000 percursos, distribuição, risco, waves, drops e eventos validados |
| Browser visual do mapa | **PASS** — 320, 390, 768, 1280, 1920 px; screenshots mobile/desktop, pausa, rerolls, save/reload, acesso a equipamento/Bag e seleção imediata |
| Percursos completos no controller | **PASS** — 81/81 combinações concluem e recuperam do save sem softlock |
| Duração real em minutos / tempo de menu por pessoa | **NOT TESTED** — as simulações verificam waves e decisões; não simulam tempo de leitura ou combate humano |

Durante a validação, a suite browser antiga esperava uma seleção de nó a cada Realm e não reconhecia um combate linear iniciado pelo auto-advance; também podia contar um card passive dentro de um diálogo fechado. O teste foi atualizado para verificar os quatro pontos de decisão, continuação linear permitida, passive visível obrigatório, retoma do save e conclusão real. Não foi removida nenhuma validação de recompensa ou progressão.

## Ficheiros modificados

- `online/v013-expedition-map.js` — grafo, calendário determinístico, bifurcações, validação e compatibilidade com mapas v1.
- `online/v012-expedition-controller.js` — ofertas derivadas do nó real e restauro/validação do progresso do mapa.
- `index.html` — seleção contextual nos próprios nós, sem cartões duplicados; resumo da rota e vantagens existentes.
- `online/v013-expedition-map.css` — mapa, caminho escolhido, estados e adaptação mobile.
- `scripts/v013-map-stress.cjs` — métricas e stress test de 10.000 seeds/810.000 rotas.
- `tests/v013-map-generation.test.cjs`, `tests/v013-map-controller.test.cjs`, `tests/v013-map-browser.cjs` — cobertura de geração, progressão e viewport.
- `tests/v012-complete-browser.cjs` — expectativa ajustada para mapa com quatro bifurcações e auto-advance linear.
- `docs/v013-phase12-route-design-validation.md` e três artefactos sob `docs/v013-phase12-route-design-validation/screenshots/`.

Não houve alterações ao balanceamento de dano/HP/defesa, combate, inimigos, loot tables, economia base, passivos, equipamentos, Firebase, Rules ou saves. Os screenshots regenerados incidentalmente por suites antigas foram restaurados; só permanecem as evidências desta fase.

## Commits locais

1. `d0173ed` — `feat(expedition): generate meaningful route forks`
2. `a75a99e` — `feat(expedition): show contextual map route choices`
3. O relatório e os screenshots serão registados no commit de documentação abaixo.

Não serão enviados para `origin` nesta tarefa.
