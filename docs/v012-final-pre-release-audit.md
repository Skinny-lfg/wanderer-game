# Wanderer v0.12 — auditoria final pré-release

**Recomendação: NOT READY para lançamento.** Auditoria local em `development`, 25/10/2026. HEAD de referência: `79114ae0c29657592f6718f1df5a4769994ee850` (`style(v0.12): align square potion tiles and remove Camp set summary`). Nenhuma alteração foi feita em `main`; não houve merge, publicação, deploy Firebase, alteração de Rules nem acesso/escrita a saves reais.

## 1. Âmbito e resumo executivo

A revisão cobre o ponto atual do ramo `development`, a experiência integrada v0.12, saves, autenticação/feedback, PvP, Firestore Rules, workflows de publicação e as alterações locais desta auditoria. A experiência de preview documentada é local e isolada. Há melhorias visuais verificadas no resultado da Forja e nos estados de combate. A release continua bloqueada pela ausência de cloud save/auth v0.12, pela divergência da referência determinística de runtime e pela validação incompleta de Rules e browser/OAuth real.

## 2. Bugs e usabilidade encontrados

- **Resultado da Forja repetia uma comparação completa de equipamento**, acrescentando conteúdo e altura depois de o item já estar apresentado. Removi a comparação duplicada; a ação de equipar continua a usar o ID do item criado. O popup usa o estilo partilhado de inspeção de equipamento e imagem quadrada.
- **O popup podia abrir com scroll/foco deslocado** devido ao foco automático num botão dentro de conteúdo longo. O modal agora começa no topo e foca o botão sem provocar scroll.
- **A inspeção acionada pela Forja mostrava controlos/comparação de stash**, embora não fosse um popup do stash. A comparação ficou limitada a origens stash/bag.
- **Estados de combate**: ícones passaram a 26 px no desktop e 21 px no mobile; texto ficou em 13 px desktop e 12 px mobile. Mantém leitura e limites definidos pelo teste visual.
- Outros fluxos/menus foram inspecionados por testes existentes. Esta auditoria não afirma validação manual exaustiva de cada menu, dispositivo ou browser real.

Os screenshots do popup estão em [`docs/v012-release-audit/screenshots/`](v012-release-audit/screenshots/). `forge-result-before-compare-removal-*.png` regista o popup antes de remover a comparação repetida; `forge-result-after-*.png` regista o resultado atual. Há capturas em 360×800, 390×844, 430×932, 768×1024 e 1280×720. `forge-result-before-*.png` regista o ecrã Forge anterior à criação.

## 3. Testes e regressões

- `node tests/v012-item-popup.test.cjs`: passou, incluindo a nova verificação do popup da Forja.
- `node tests/v012-complete-boss-animations.test.cjs`: passou. As asserções estáticas foram alinhadas com a função de origem de animação já extraída; os controlos de duração/impacto continuam presentes.
- `node tests/v012-forge-result-popup-browser.cjs`: passou em 360×800, 390×844, 430×932, 768×1024 e 1280×720. Testa diálogo limitado, arte quadrada, conteúdo/ações visíveis, Escape, equipar e uma só cobrança/criação por clique, usando fixture sintética.
- `node tests/v012-status-icons-popup-browser.cjs`: passou em 390 e 1280 px; os 38 PNGs de estados carregam.
- `node tests/v012-combat-visual-clarity-browser.cjs`: passou a 390 e 1280 px. O limite do teste foi alinhado para aceitar 14 px no desktop, como exige o teste de legibilidade dos estados.
- `npm test`: terminou com falhas no grupo de paridade `tests/v012-runtime-integration.test.cjs`; os cenários reportam contagens de transições inferiores à fixture em 3–4 passos. A saída também inclui as demais suítes. As fixtures não foram regravadas automaticamente: é preciso identificar a causa e confirmar se é referência desatualizada ou alteração real de gameplay.
- `npm run test:browser`: falha no teste `tests/private-preview-browser.cjs` a 390 px, que deteta um pedido para `/online/app.mjs` ou `firebase-sdk`; o wrapper deveria remover/isolar esses recursos. Investigar a origem antes do release. As etapas anteriores (Forja, combate, ícones, animações, popups, Expedition completa, evasão e equipamento) passaram nas larguras registadas.
- `npm run test:rules`: **não executável neste ambiente**. O Firebase CLI/emulador não conseguiu obter/configurar o emulador Firestore (download/MOTD/cache da CLI falhou). Rules não foram editadas nem publicadas.
- `git diff --check`: sem erros de whitespace.

Não foram validados OAuth real, Firestore real, Safari/iOS, Android físico, deploy/hosting, ou CI remota do candidato. Os testes de browser locais usam Chromium e dados sintéticos.

## 4. Saves, autenticação e recuperação

O preview integrado atual usa armazenamento local de validação/memória e não oferece save cloud v0.12 ligado à conta. `online/v012-save.js` implementa o formato local `wanderer-expedition`, schema 12, mas `online/model.mjs` e o backend clássico continuam no namespace `v092`. A aplicação v0.12 não deve ser anunciada como cloud-sync/cross-device.

O caminho clássico tem Google e email/password; o fluxo integrado v0.12 não tem política operacional validada para convidado, login link ou conta migrada. Regras clássicas aceitam Google ou email verificado. Não se deve misturar payload v0.12 com `v092`: criar namespace novo, autenticar o UID no servidor/regras, validar envelope/revisão e testar concorrência/restore no emulador/staging antes de rollout.

Estratégia segura proposta: export/backup verificável por conta e revisão; contar e validar saves em dry-run; preservar documentos originais; criar destino versionado de forma idempotente; verificar restore e invariantes; rollback congelando escritas e reconciliando revisões. Não apagar nem resetar dados por rotina. O histórico contém uma proposta de saves novos começarem numa Expedition fresca; essa política precisa de validação com utilizadores e não foi aplicada.

## 5. Feedback e suporte

`online/v012-feedback.mjs` permite feedback categorizado com texto e contexto básico do browser. A regra permite apenas criação por jogador verificado com perfil e nega leitura/escrita posterior do cliente; exportação é via workflow privilegiado. O formulário não demonstra captura global de exceções JS/rejeições, stack trace, screenshot, viewport/dispositivo, build/commit ou estado da Expedition. Há cooldown apenas no cliente, portanto não é proteção server-side anti-spam. A recolha/exportação e política de dados devem ser completadas e testadas antes de depender deste canal como suporte de release.

## 6. PvP e funcionalidades online

Os módulos antigos `online/pvp.mjs`/`online/pvp-stats.mjs` não são carregados pelo HTML padrão integrado, e não foi encontrado fluxo PvP exposto na entrada v0.12. Portanto PvP não faz parte do preview v0.12 auditado; testes ou módulos isolados não equivalem a uma feature pronta. Rankings existentes são claims enviados pelo cliente e marcados `verified:false`, não resultados autoritativos. Não anunciar anti-cheat nem PvP validado por servidor.

## 7. Firestore Rules e segurança

As Rules são fechadas por omissão e restringem saves clássicos a utilizadores Google ou email verificado, owner UID e revisões crescentes. Perfil e feedback têm permissões limitadas; scores públicos são explicitamente não verificados. A regra atual autoriza `/players/{uid}/saves/v092`, `publicLoadoutsV092` e temporadas v092, mas não um namespace cloud v0.12. Um writer v0.12 novo seria negado até desenho, testes de emulador e deploy separado.

O cliente não pode ser autoridade para loot/ranking: payload opaco ou score submetido pelo browser é manipulável. Feedback não tem rate limit server-side. A revisão de código foi manual; o scanner da skill de segurança não estava disponível nesta sessão e o emulador Rules também falhou. Não se afirma certificação de segurança nem validação de acesso real. Nenhuma Rules foi alterada ou publicada.

## 8. Automação e publicação

`.github/workflows/publish-firebase-development.yml` não publica com push normal: exige `workflow_dispatch` ou marcador `[firebase-dev-deploy]`, restringe a `development` e prepara Hosting sem deploy de Firestore Rules. `.github/workflows/feedback-export.yml` tem execução agendada, condicionada a `WANDERER_FEEDBACK_EXPORT_ENABLED == 'true'`, e usa segredo privilegiado; rever acesso/retensão antes de ativar. Não foi identificado workflow de GitHub Pages nesta inspeção. Nenhum workflow foi executado nesta tarefa.

## 9. Compatibilidade e layout

A alteração interativa foi verificada nos cinco viewports listados, incluindo mobile estreito, tablet e landscape desktop 1280×720. Botões de equipar/fechar, Escape, proporção da imagem e resultado após uma única criação estão cobertos. Teste visual de estados passa nas duas larguras dedicadas. A cascata CSS de combate passou nos testes dedicados; a suite completa ainda falha no browser privado por deteção de pedido ao loader clássico/Firebase.

## 10. Alterações locais desta auditoria

Arquivos alterados: `index.html`, `online/v012-combat-passive-clarity.css`, `package.json`, `tests/v012-complete-boss-animations.test.cjs`, `tests/v012-item-popup.test.cjs`; adicionado `tests/v012-forge-result-popup-browser.cjs` e screenshots em `docs/v012-release-audit/screenshots/`. O relatório acompanha as alterações. Tudo continua local em `development`; não houve commit ou push.

## 11. Bloqueios de release

1. Cloud save/auth v0.12 e sincronização/recuperação entre dispositivos não estão implementados.
2. Teste `npm test` falha em paridade de runtime; causa precisa ser determinada sem rebaselining cego.
3. `npm run test:browser` falha no teste do preview privado, que deteta pedido a `/online/app.mjs` ou ao SDK Firebase; investigar apesar de a entrada padrão parecer não referenciar esses scripts diretamente.
4. Firestore Rules não foram testadas no emulador por falha de obtenção/configuração; Rules atuais não suportam namespace v0.12.
5. Feedback carece da telemetria diagnóstica e mitigação server-side de abuso esperadas para suporte amplo.
6. Falta validação de OAuth/Firestore reais em projeto isolado, browser/dispositivo suportado e plano de CI/rollback aprovado.
7. Balanceamento, dados legados e política de reset/migração requerem aprovação/playtest; sem apagar saves.

## 12. Checklist de lançamento — sequência proposta

1. **Backup**: exportar e verificar backups, contagens e revisões em staging; preservar origem.
2. **Reset de saves**: não fazer reset destrutivo. Definir e aprovar namespace/estado inicial v0.12 e compatibilidade; ensaiar apenas com cópias sintéticas.
3. **Firebase config**: integrar auth e save cloud v0.12 em namespace novo; provar regras e isolamento no emulador e projeto staging.
4. **Validação**: resolver paridade, completar testes automatizados/browser, save/reload, E1 boss + Rune, OAuth/Firestore staging e dispositivos alvo; rever feedback e segurança.
5. **Merge para main**: somente numa tarefa futura e com autorização específica, após gates verdes e revisão.
6. **Deploy**: confirmar projeto/alvo e aprovação; deploy controlado. Nenhum deploy faz parte desta auditoria.
7. **Smoke tests públicos**: testar login, saves novos/restauro, feedback e monitorização sem usar saves reais até aprovação e plano de rollback.

**Estado final: NOT READY.** Esta auditoria não executou nenhum passo de reset, merge, deploy, Rules ou migração real.
