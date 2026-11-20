# Wanderer v0.13 — C9: auditoria profunda de funções, exportações e código morto

**Data:** 20 de novembro de 2026 · **Branch:** `audit/v013` · **Base:** `4fb7185d0e1b6dd04bf677496fa2d7edd34c00be` · **Código validado:** `d8476d73bcfcc31b34b00e15cc2a99ffd1608e65`.

**Resultado:** a [execução C7 44723190503](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44723190503) terminou **4/4 jobs SUCCESS** no código acima. Não houve alteração a `main`, merge, deploy, manipulação de contas ou saves reais, nem alteração deliberada a balanceamento/loot.

## 1. Método, inventário e âmbito

Foi criado `scripts/v013-c9-function-inventory.cjs` e integrado no job obrigatório `current-native` do C7. O script percorre `combat/`, `economy/`, `online/`, `preview/`, `index.html`, JavaScript inline e os testes/scripts auxiliares; enumera funções, exportações ESM/CommonJS/globais, membros de objetos globais, menções a identificadores por ficheiro, candidatos sem referência textual, nomes homónimos e tokens históricos. **O relatório completo, linha a linha e com referências por ficheiro, está no artefacto `v013-c9-function-inventory` da [execução C7](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44723190503)**, em JSON e Markdown. O inventário não está limitado aos casos enumerados nesta síntese.

| Medida após a limpeza | Contagem observada |
|---|---:|
| Ficheiros de aplicação/preview analisados (JS/HTML) | 63 |
| Testes/scripts auxiliares pesquisados | 281 |
| Blocos JavaScript inline catalogados | 1 |
| Entradas semelhantes a funções | 1 668 |
| Exportações identificadas | 174 |
| Grupos de exportações globais por objeto | 23 |
| Membros do objeto `WandererV012Buildcraft` | 30, antes 41 |
| Grupos de nomes repetidos em vários ficheiros | 77 |
| Identificadores com uma só menção textual (candidatos; não prova) | 19 |

**Interpretação:** estas contagens são heurísticas por análise textual, não uma árvore sintática completa nem um grafo exato de execução. Identificadores calculados, alias, módulos gerados, callbacks e reflexão podem criar consumidores que uma simples pesquisa não identifica. Cada remoção abaixo foi verificada separadamente com o C7, incluindo simulação e navegador.

## 2. Remoções comprovadas

| Lote | Commit de alteração | Alteração e evidência | C7 após resolução de dependências |
|---|---|---|---|
| 1 | [`1175ae4f`](https://github.com/Skinny-lfg/wanderer-game/commit/1175ae4ff0fa010277f5f9461574fc94d9cecb7b) | Retiradas 8 funções e exportações do draft antigo de passivos em `combat/v012-buildcraft.js`: `preview`, `canModify`, `capabilities`, `functional`, `eligible`, `synergy`, `options`, `choose` | [44721310387](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44721310387), 4/4 |
| 2 | [`051155b8`](https://github.com/Skinny-lfg/wanderer-game/commit/051155b81570115ac25f2e4803a8327973c1a61b) | Removidas `initial`, `element`, a constante `TAGS`, as tags de classificação de ofertas e respetivas exportações antigas; mantidos catálogo e descrições atuais | [44721808100](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44721808100), 4/4 |
| 3 | [`117da833`](https://github.com/Skinny-lfg/wanderer-game/commit/117da83304468975449a044cdec5f3e24e88104c) | Retirados `draftRng`/`passiveRandom` e alias legado `phase3UsePotion` do runtime; controlador, HTML e harness adaptados à API atual. Corrigida referência indireta no harness em [`f0c67595`](https://github.com/Skinny-lfg/wanderer-game/commit/f0c67595893a6cb75345b5f99a98014bb0d89993) | [44722550145](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44722550145), 4/4 |
| 4 | [`f851289a`](https://github.com/Skinny-lfg/wanderer-game/commit/f851289ace6ca38112f04085ddb9d0c9a729183d) | Removidos `initialId`, campos `initialFamily`/`initialPassive` do Buildcraft, recuperação de `unlockedFamilies`, compatibilidade de validação das versões antigas, `hybridPity` e preenchimento histórico de `staticCharges`; retirada etiqueta "Initial passive" do HTML | [44723190503](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44723190503), 4/4 |

O ficheiro `combat/v012-buildcraft.js` passou de **52 755** para **42 064 bytes** (menos 10 691 bytes, aproximadamente 20%). Os **41 membros exportados passaram a 30**. A limpeza retirou cerca de **13 funções históricas concretas**, para além de campos, constantes, tags, aliases e compatibilidade de estados antigos. Os testes `tests/v013-c9-dead-code.test.cjs`, incluídos no gate obrigatório, impedem a reintrodução acidental das APIs retiradas e confirmam a presença das interfaces que ainda alimentam o combate, os talentos e a sessão.

### Falhas intermédias efetivamente observadas

- **Fonte/`docs/` divergentes:** após alterações a JS, a comparação de Pages e um teste de paridade falharam. O gerador sincronizou os ficheiros derivados; em alterações ao catálogo surgiram também `docs/index.html` e `docs/preview/talent-rebuild/index.html`. Reexecutámos o C7 depois de cada sincronização.
- **Consumidor indireto real do alias de poções:** a remoção de `phase3UsePotion` provocou `ReferenceError` no piloto natural porque o harness ainda publicava `a.potion` a partir desse alias. O harness foi adaptado para invocar a função atual `phase6UsePotion`; os pilotos E1–E5/E1–E20 voltaram a executar sem erro. **Não foi restaurado o código morto no jogo.**
- **Regressões funcionais:** os gates finais não demonstraram regressão funcional nas suites executadas. As falhas acima foram tratadas como reais até serem corrigidas; não foram escondidas.

## 3. Duplicação, caminhos alternativos e código preservado

| Candidato | Investigação | Decisão |
|---|---|---|
| `freeBuild` | O marcador aparece na UI e em `validateDungeonCheckpoint`, apesar do nome histórico | **Preservado:** faz parte do estado do Dungeon atual; não representa modo alternativo utilizável |
| `shuffle(BOSSES.slice(...), routeRng)` | A chamada mantém a sequência de RNG usada na geração determinística dos percursos | **Preservada:** eliminá-la mudaria seeds/mapas sem validação específica de paridade |
| `ownedRank` no Buildcraft | Não tem referência direta externa ao runtime atual, mas é usado internamente por `rank` e validações; consta também em ferramentas históricas | **Função preservada;** exportação isolada é candidata a revisão futura, não remoção comprovada |
| 77 nomes partilhados (`create`, `tick`, `validate`, etc.) | Funções homónimas em escopos/módulos independentes | **Não são duplicações funcionais comprovadas** |
| 19 candidatos com uma menção textual | Incluem métodos públicos do cliente Firebase, helper `$` e símbolos do SDK Firebase minificado | **Não eliminados:** podem ter consumidores através de objetos, aliases ou acesso dinâmico |
| Módulos com prefixo `v012` | Combat runtime, equipamento, persistência, autenticação e estruturas de talentos ainda são invocados pelo jogo atual | **Preservados** quando necessários, independentemente do prefixo |

O scanner C6, na execução final, observou **89 ficheiros ativos/auxiliares sob o seu âmbito, 78 entrypoints, 0 imports em falta, 0 referências a módulos eliminados, 0 chamadas a controladores retirados, 0 candidatos a módulos órfãos** e nenhum CSS morto identificado pelo padrão de rotas. Os **4 matches de `oldPaths`** correspondem ao nome `freeBuild` efetivamente usado no Dungeon, não à existência de um gerador clássico ativo.

**Não foi comprovada uma segunda implementação jogável da mesma mecânica, nem um módulo atual totalmente sem consumidores nos percursos e scans verificados.** Isto não certifica todas as ramificações dinâmicas.

## 4. C7 final sobre o código `d8476d73`

Fonte: [GitHub Actions 44723190503](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44723190503), conclusão `success` em **4/4 jobs**.

| Gate executado | Resultado |
|---|---:|
| `npm run test:v013` — inclui os testes C9 | **301/301**, falhas 0, ignorados 0 |
| Simulador nativo | **7/7** |
| Talent Graph v15 | **79/79** |
| Combate, Boss, Elite e balanceamento de regressão | **94/94** |
| Integração, eventos, checkpoint e economia | **83/83** |
| Saves e conta | **51/51** |
| Firestore/Auth em emuladores Linux/Java 21 | **11/11** |
| Navegador Chromium (Camp, Dungeon, Boss, feedback, extração) | **PASS** |
| Pilotos de progressão natural E1–E5 e horizonte E1–E20 | **PASS de execução**, não garantia de atingir E5/E20 |
| `npm run build:pages` e paridade exata com `docs/` | **PASS** |
| Scanner C9 (JSON e Markdown no artefacto CI) e C6 | **PASS** |

As suites podem sobrepor testes: não somar estas contagens como total de casos únicos.

## 5. Conclusão e limites

**Concluído dentro do âmbito verificável:** inventário abrangente de funções e exportações, análise de consumidores indiretos, quatro lotes de remoção de código histórico efetivamente morto, inspeção de aparentes duplicações, guardas nativas e repetição C7 integral após cada lote corrigido. O código final testado é `d8476d73bcfcc31b34b00e15cc2a99ffd1608e65`.

**Não demonstrado:** que absolutamente todas as combinações de estados, seeds, eventos de UI, reflexões e acessos dinâmicos estão cobertas; que cada um dos 19 candidatos de referência única é morto; ou que Firebase de produção foi exercitado. O scanner é um filtro de investigação e não prova matemática de alcançabilidade total. A rejeição de saves e drafts antigos foi intencional para a clean sheet v0.13. Vulnerabilidades npm e balanceamento continuam temas separados.

**Decisão:** encerrar o C9 como limpeza **comprovada pelos testes aplicáveis**, sem atribuir a nenhuma função dinâmica o estatuto de morta sem evidência suficiente. O eventual commit de documentação deste relatório não modifica código nem substitui o C7 sobre o SHA indicado.
