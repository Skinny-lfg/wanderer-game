# Wanderer v0.13 — Remediação de dependências npm

Data: 19 de novembro de 2026. Branch `audit/v013`. Escopo: alterações exclusivamente de dependências, **sem ligar a qualquer projeto Firebase real**, sem publicar, sem alterar gameplay, sem tocar em `main` ou em saves.

## Evidência

- Auditoria inicial: [33 avisos](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44623676236) (1 crítico, 13 altos, 19 moderados). Auditoria com `--omit=dev`: 4 altos; 0 críticos.
- Provas de compatibilidade isoladas, com Firebase CLI, Firebase SDK 12 e 13: [primeira matriz](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44625615698) e [última versão](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44625839995). As três variantes de upgrade com Firebase CLI novo ficam em **19 avisos** (0 críticos, 5 altos, 14 moderados); as versões 12 e 13 do SDK não trouxeram redução. Manter SDK de produção 11.10.0 é a mudança mínima.
- Aplicação validada: [execução](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44626168044), [commit de dependências 444a57a](https://github.com/Skinny-lfg/wanderer-game/commit/444a57a1d64860f7dabdb77057e6d4320245b974). `npm audit` depois da correção: **19 avisos**, sendo **0 critical**, **5 high** e **14 moderate**. `npm audit --omit=dev`: 4 high, 0 critical.
- Alterações no commit de remediação limitadas a `package.json` e `package-lock.json`: `firebase-tools` para `^15.37.0` e patches transitivos compatíveis; `firebase` permanece `11.10.0`, `@firebase/rules-unit-testing` permanece `4.0.1`.
- Verificações antes do commit: `npm ci --ignore-scripts`, `npm run build:firebase`, `scripts/v013-c6-final-audit.cjs`, `npm run test:v013:gate` (276 gameplay + 7 simulação), `npm run test:v013:talent-graph` (79), `npm run test:rules` com emuladores Firestore/Auth (11). Todos aprovados. **Nenhuma conexão ou deploy de produção**.
- A auditoria de esbuild da branch demonstrou que `@grpc/grpc-js`, `tar` e `firebase-tools` não integram o bundle browser gerado (17 inputs, 425549 bytes): [job](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44623676236).

## Pendências e risco residual

Os 19 avisos restantes são 5 high e 14 moderate na árvore npm. Entre os 5 high, quatro entradas são propagadas pela cadeia Firebase → Firestore → `@grpc/grpc-js` — o advisory principal [GHSA-m9gg-hp2v-232j](https://github.com/advisories/GHSA-m9gg-hp2v-232j) afeta configurações específicas de servidor gRPC; a aplicação é uma SPA browser e a biblioteca não aparece no bundle. Este resultado reduz a superfície de exposição, mas não autoriza concluir que todos os cenários futuros estão isentos de risco. O quinto high pertence à ferramenta de testes `@firebase/rules-unit-testing` e herda a cadeia do SDK. Os 14 moderate restantes dependem sobretudo da árvore do Firebase CLI.

**Não** usar `npm audit fix --force` nem forçar `@grpc/grpc-js` incompatível com a dependência `@firebase/firestore`: o npm sugere um downgrade major para Firebase 9.14.0, não adequado à arquitetura atual. Não há zero avisos nesta remediação; 14 de 33 entradas deixaram de ser reportadas, incluindo a crítica TAR.

Manter a atualização isolada até ao gate C7 completo; não fazer merge nem deploy sem revisão dos riscos residuais.
