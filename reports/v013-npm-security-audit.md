# Wanderer v0.13 — Auditoria de dependências npm (19/11/2026)

**Branch:** `audit/v013`  
**Execução verificável:** [GitHub Actions 44623676236](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44623676236), job `npm-security-audit` — **sucesso**.  
**Base:** `package-lock.json` da branch de auditoria; `npm audit --package-lock-only --json` e `npm audit --omit=dev --package-lock-only --json`; esbuild com `--metafile`.  
**Sem** alteração de `main`, publicação, balanceamento, runtime, saves ou dados de produção.

## Resultados reproduzíveis

| Escopo | Total | Critical | High | Moderate |
|---|---:|---:|---:|---:|
| Todas as dependências | 33 | 1 | 13 | 19 |
| Produção (`--omit=dev`) | 4 | 0 | 4 | 0 |
| Apenas ferramentas/CI (diferença) | 29 | 1 | 9 | 19 |

A classificação indica **33 registos de pacotes afetados na árvore**; não equivale a 33 falhas exploráveis independentemente na aplicação. `npm ci` no gate C7 também reportou 33. O projeto só declara `firebase@11.10.0` em `dependencies`; `firebase-tools@14.7.0`, `@firebase/rules-unit-testing@4.0.1`, `esbuild@0.25.5`, `playwright@1.56.1` e `axe-core@^4.14.0` estão em `devDependencies`.

## Prioridades técnicas

1. **Critical: `tar@6.2.1`, exclusivamente dev/CI**. Cadeia: `firebase-tools@14.7.0 → tar@6.2.1`. Entre os múltiplos alertas do pacote, o mais grave é [GHSA-23hp-3jrh-7fpw](https://github.com/advisories/GHSA-23hp-3jrh-7fpw), negação de serviço em extração de arquivos comprimidos. A árvore também tem `node-gyp/node_modules/tar@7.5.22`, **não afetado** pelas versões identificadas: não confundir com o `tar` de raiz.
2. **High: quatro entradas na cadeia Firebase/Firestore**, todas herdadas de `@grpc/grpc-js@1.9.16` (é o mesmo caminho de dependência): `firebase@11.10.0 → @firebase/firestore@4.8.0 → @grpc/grpc-js@1.9.16`, com propagação por `@firebase/firestore-compat`. Advisory principal: [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j); o cenário descrito envolve verificações de certificados em configuração de **servidor** gRPC, não autenticação normal de browsers.
3. **Verificação objetiva do browser:** esbuild do ficheiro `online/firebase-sdk-source.mjs` com formato ESM, plataforma browser padrão, e `--metafile`: **17 módulos analisados; 425549 bytes; 0 módulos de `@grpc/grpc-js`, `tar` ou `firebase-tools` no bundle gerado**. Assim, não há evidência de exposição dessas bibliotecas Node no bundle web produzido pelo build atual. Isto não substitui a validação final do artefacto exato de publicação, nem exclui usos futuros da dependência no servidor.
4. **29 registos dev/CI**: associados sobretudo ao Firebase CLI e à sua árvore transitiva (`glob`, `uuid`, `zod`, `body-parser`, `basic-ftp`, `hono`, `archiver`, etc.). Há impacto potencial nas ferramentas locais e na execução dos emuladores, embora não estejam no HTML/JS servido ao jogador.

## Estratégia de remediação segura

- **Não executar `npm audit fix --force`** nesta branch: o npm propõe, por exemplo, `firebase@9.14.0` e `@firebase/rules-unit-testing@2.0.7` como versões de resolução automática; seriam downgrades major face às APIs atuais e não são uma estratégia válida sem avaliação de compatibilidade.
- Primeiro experimentar `npm audit fix --package-lock-only` **numa branch temporária separada**, sem `--force`. O npm sinaliza `11` entradas com `fixAvailable: true`, mas essa indicação não garante resolução conjunta nem equivalência funcional. Comparar o lockfile e voltar a correr `npm ci`, os testes de save/regras e todo o gate C7.
- Tratar a atualização major de `firebase-tools@14.7.0` para uma versão corrigida num PR isolado (o npm indica `15.37.0` como candidato para diversos avisos), validando especialmente emuladores Firestore/Auth, regras e workflows de publicação. Não misturar com alterações de gameplay.
- Para o SDK web Firebase, fazer uma atualização controlada, ou documentar formalmente a não-alcançabilidade do advisory gRPC no bundle browser. O pacote `@firebase/firestore@4.8.0` requer `@grpc/grpc-js ~1.9.0`, pelo que uma substituição forçada por `1.13.6+` viola a restrição indicada pelo fornecedor e tem de ser testada; não introduzir override às cegas.
- Os workflows com `actions/checkout@v4`, `setup-node@v4` e `upload-artifact@v4` mostram aviso separado de runtime Node.js 20 depreciado no runner. Planear atualização independente para versões atuais das actions.

## Inventário completo das 33 entradas

| Pacote afetado | Severity | Escopo npm | Dependência direta? | Correção reportada |
|---|---|---|---|---|
| `@firebase/firestore` | high | Produção | Não | Mudança major sugerida: firebase@9.14.0 |
| `@firebase/firestore-compat` | high | Produção | Não | Mudança major sugerida: firebase@9.14.0 |
| `@firebase/rules-unit-testing` | high | Dev/CI | Sim | Mudança major sugerida: @firebase/rules-unit-testing@2.0.7 |
| `@google-cloud/pubsub` | moderate | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `@grpc/grpc-js` | high | Produção | Não | Mudança major sugerida: firebase@9.14.0 |
| `@hono/node-server` | moderate | Dev/CI | Não | Compatível segundo npm |
| `archiver` | moderate | Dev/CI | Não | Compatível segundo npm |
| `archiver-utils` | moderate | Dev/CI | Não | Compatível segundo npm |
| `basic-ftp` | high | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `body-parser` | high | Dev/CI | Não | Compatível segundo npm |
| `csv-parse` | moderate | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `exegesis` | moderate | Dev/CI | Não | Compatível segundo npm |
| `fast-uri` | moderate | Dev/CI | Não | Compatível segundo npm |
| `firebase` | high | Produção | Sim | Mudança major sugerida: firebase@9.14.0 |
| `firebase-tools` | high | Dev/CI | Sim | Mudança major sugerida: firebase-tools@15.37.0 |
| `gaxios` | moderate | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `gcp-metadata` | moderate | Dev/CI | Não | Compatível segundo npm |
| `get-uri` | high | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `glob` | moderate | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `google-gax` | moderate | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `hono` | moderate | Dev/CI | Não | Compatível segundo npm |
| `minimatch` | moderate | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `pac-proxy-agent` | high | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `proxy-agent` | high | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `retry-request` | moderate | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `rimraf` | moderate | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `stream-json` | moderate | Dev/CI | Não | Compatível segundo npm |
| `tar` | critical | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `teeny-request` | moderate | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `undici` | high | Dev/CI | Não | Compatível segundo npm |
| `uuid` | moderate | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |
| `zip-stream` | moderate | Dev/CI | Não | Compatível segundo npm |
| `zod` | high | Dev/CI | Não | Mudança major sugerida: firebase-tools@15.37.0 |

## Limites e estado

Esta auditoria **não alterou as dependências nem demonstrou que todos os avisos estão corrigidos**. O gate C7 anterior permanece a evidência de regressão de gameplay; o novo job confirma inventário e ausência das bibliotecas Node vulneráveis no bundle recém-compilado. Antes de publicar, verificar o bundle efetivamente incluído em `hosting-dist` e testar qualquer alteração de `package-lock.json` com o gate completo.

**Evidências:** [execução segura](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44623676236), [workflow de auditoria](https://github.com/Skinny-lfg/wanderer-game/blob/audit/v013/.github/workflows/v013-npm-security-audit.yml) e artefactos JSON disponíveis na execução durante o período de retenção configurado.
