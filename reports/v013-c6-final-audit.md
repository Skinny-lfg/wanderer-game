# Wanderer v0.13 — Auditoria C6 final a código obsoleto e regressões

**Data:** 19 de novembro de 2026  
**Branch isolada:** `audit/v013`  
**Commit de código validado:** `422d26488ce45c01c6730d7e91e2e3612bf12901`  
**CI funcional:** [C4, execução 44615980255](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44615980255) — **4/4 jobs concluídos com sucesso**.  
**Verificação estática/sintaxe:** [C6, execução 44615299506](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44615299506) — **sucesso**. A mesma verificação C6 foi depois integrada no job nativo C4 e aprovada no commit validado.  
**Publicação/merge:** não efetuados.

## Inventário de código e referências

| Verificação | Resultado |
|---|---:|
| Ficheiros de origem ativos inspecionados | 93 |
| Scripts, CSS e documentos ligados pelos entrypoints HTML | 82 |
| Assets/entrypoints locais em falta | **0** |
| Imports relativos em falta, após normalização de URLs versionados e fixtures | **0** |
| Referências em código ativo aos módulos históricos de talentos eliminados | **0** |
| Estilos CSS órfãos do gerador de percursos antigos | **0** (após limpeza) |
| Construção v9–v14 / migrações de talento em código ativo | **0** |
| Módulos atuais de combat, economy e online verificados com `node --check` | 62, sem erros |
| Módulos JS identificados como órfãos pela heurística | 0 candidatos (não prova alcançabilidade total) |

O verificador usa `scripts/v013-c6-final-audit.cjs` e falha quando encontra caminhos de entrada ou imports relativos partidos, ou referências a scripts de talentos fisicamente apagados. O relatório também distingue referências dinâmicas, textos usados por testes e bibliotecas externas.

Os 10 imports inicialmente sinalizados foram inspecionados: oito eram URLs locais versionados ou literais usados em fixtures e dois eram referências textuais à importação Firebase que os testes substituem antes de executar. **Não eram dependências partidas.**

A busca por `TODO`/`FIXME`/`NOT IMPLEMENTED` identificou seis ocorrências na distribuição minificada de `online/vendor/firebase-sdk.mjs`. São implementações internas do SDK de terceiros, não funções por implementar no Wanderer. Não foi alterada esta dependência.

## Defeitos encontrados e corrigidos

1. **CSS morto do mapa linear (aprox. 4,5 KB).** Eliminados os seletores do antigo `expeditionRouteMap` e `routeBranchCanvas` de `online/v012-uiux-tuning.css`, preservando os estilos atuais de XP, Forge, itens e estatísticas. Atualizado `tests/v013-c3-ui-static.test.cjs`, que ainda *exigia* indevidamente seletores antigos.
2. **Nó do Boss tapado pelo painel de informação.** O painel `.realmMapSide` tinha `position:absolute` e sobrepunha-se a botões do mapa. O teste de navegação profunda chegou a falhar num clique ao Boss devido à interceção de eventos. Corrigido `online/v013-stage45-map-qa.css`: no desktop, o painel fica numa coluna independente; no mobile, aparece depois do mapa, preservando a placa de passos. Adicionado teste de não sobreposição em `tests/v013-stage45-5-browser.cjs`.
3. **Bounty Writ com texto baseado no percurso extinto.** A interface verificava `state.rooms` para anunciar se restava um Elite, apesar de o Dungeon atual usar `realmMap().objective` e `dungeon.cleared`. Alinhada a apresentação com o mesmo estado utilizado pela liquidação do evento e acrescentado teste de regressão real à função de apresentação.
4. **Oracle of Paths com ramos inacessíveis.** Eliminadas da interface e do runtime de eventos as ramificações clássicas que ainda invocavam `allowed()`/`influence()` após a remoção desses métodos do controlador.
5. **Paridade de `docs/`.** Corrigidos os ficheiros fonte, aguardada a sincronização automática da build e executado o gate C4 no commit já sincronizado. Confirmação final: `C4_SOURCE_DOCS_PARITY=true`.

## Testes executados após as correções

| Bateria | Resultado |
|---|---:|
| Gameplay v0.13 + regressões atuais | 272/272 |
| Simulação nativa | 7/7 |
| Árvore v15 (343 nós) | 79/79 |
| Bosses, Elites, builds, comportamento e equilíbrio | 89/89 |
| Integração, eventos, economia, checkpoints e estatísticas | 83/83 |
| Saves, autenticação e integridade | 51/51 |
| Regras Firebase com emuladores | 11/11 |
| Chromium desktop e mobile | PASS |
| Caminhos reais até Boss, preparação, reload e extração | PASS |
| Paridade da build Pages / source | PASS |

Não foram registados `pageerrors` nos testes responsivos relevantes. A regressão do painel sobre o Boss foi reproduzida antes da correção e a navegação completa passou depois dela.

## Resíduos identificados, não confundidos com regressões

Existem **três referências em funções do runtime antigo** que chamam métodos já apagados do controlador:

- `phase2ChooseInitial()` ainda contém uma chamada a `chooseInitial()`;
- `phase1Choose()` ainda contém uma chamada a `select()`;
- `phase3Reroll()` ainda contém uma chamada a `reroll()`.

Estes caminhos pertencem ao fluxo clássico de escolha/repetição de Realm. O Dungeon atual é inicializado exclusivamente em `version:2`/`freeBuild:true`; a UI corrente não expõe esses controlos, e os testes reais de mapa/combate não os alcançam. Por esse motivo, são **resíduos históricos sem falha atual observada**, mas não estão fisicamente eliminados. A remoção integral deve abranger também o antigo painel de escolha inicial, o fluxo de draft e os exports associados, num patch atómico próprio, para evitar apagar acidentalmente ações atuais.

O marcador `freeBuild` permanece em validação de checkpoints e criação de build como sinal do Dungeon em uso. Não deve ser removido só por conter o nome histórico.

**Conclusão:** a limpeza anterior não deixou regressões confirmadas no caminho atual do jogo após as correções C6. A revisão encontrou e resolveu um defeito de clique no mapa, uma discrepância de recompensa e CSS morto; a bateria C4 encontra-se integralmente verde. Isto é **evidência de cobertura testada**, não prova absoluta de ausência de falhas. A progressão natural E1–E20 e o equilíbrio continuam a ser temas de gameplay separados.

**Segurança operacional:** o branch `main`, as contas/saves dos jogadores, Firebase de produção e a publicação no GitHub Pages não foram modificados.
