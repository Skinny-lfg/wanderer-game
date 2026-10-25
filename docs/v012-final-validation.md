# Wanderer v0.12 — Fase 5: validação final

**Recomendação: NOT READY para publicação.**

19/10/2026 · Apenas `development` · Base: `a272437` · Implementação: [`0932a14`](https://github.com/Skinny-lfg/wanderer-game/commit/0932a144a48a842448c08bb54d2acda651dc55a7).

A integração passou as regressões técnicas descritas abaixo, mas ainda não dispõe de persistência v0.12 ligada a contas/Firebase e a curva de dificuldade não está aprovada. Nenhuma migração real, reset, merge para `main`, publicação do jogo ou deploy de regras foi realizado. Só foram usados perfis sintéticos, backend simulado e browsers de teste locais.

## 1. Funcionalidades e limites atuais

| Sistema | Estado verificado |
|---|---|
| Expeditions | 15 Planes; três ofertas; Waves sequenciais; Elite/boss; unlock apenas após boss final. |
| Buildcraft | Seis famílias, máximo três; bloqueio inicial/repetições; Fire/Frost/Lightning; Blood/Decay distintos; passivos e híbridos implementados. |
| Equipamento | Slots, raridades, stats, duas mãos/offhand, Legendary, comparações e assets originais preservados. |
| Economia | Forge, Merchant, Sigils permanentes, reposições independentes, Gold/Fragments, Runes e loot assegurado mantidos. |
| Ciclo da aventura | Vitória, derrota, abandono, conservação de prémios gravados, limpeza de passivos e recuperação integral ao terminar. |
| Contas clássicas | Login, nicknames e proteções de restore continuam no caminho original; regressões com Firebase **simulado** passaram. |
| Saves v0.12 | Schema e migração em cópia implementados; persistência local de validação testada; cloud autenticado v0.12 **não implementado**. |
| Conteúdo pendente | Eventos/chests/altars integrados continuam informativos; poções continuam rações limitadas, sem aquisição definitiva aprovada. |

O modo padrão continua clássico. O integrado mantém o flag `expeditionPhase1=1`; o protótipo separado `playtest=v012` não é o motor integrado.

## 2. Saves e migração versionada

Código: [`online/v012-save.js`](../online/v012-save.js), funções `create`, `validate`, `migrateLegacy`, `recover` e `createStore`; bridge `phase5Init/phase5Capture/phase5Persist` em [`index.html`](../index.html).

O novo payload usa `format: "wanderer-expedition"`, `schemaVersion: 12`, revisão, binding, identidade, perfil permanente, `legacyHistory` e progresso de Expedition separado. A cópia antiga preserva equipamento/IDs, inventário, valores Legendary/upgradeBase, moedas, Runes, Sigils, stock e campos JSON adicionais, incluindo materiais. UID/projeto/nickname são preservados como metadados fornecidos pela fixture; isso **não substitui autenticação real**.

**D200 não se transforma em Expedition 200:** a migração começa com zero Expeditions concluídas e E1 desbloqueada. Dungeons, tempos e milestones antigos ficam como histórico, imutáveis durante o novo combate. Gear antigo não é destruído nem reduzido para forçar dificuldade; personagens migradas com gear avançado terão naturalmente vantagem em E1, política que precisa de aprovação antes da migração real.

Compatibilidade testada:

- Payload clássico não versionado e envelope cloud legado `schemaVersion:1`, com revisão de origem esperada.
- Alias `shards`, ring antigo, raridades traduzidas, stats numéricos em strings e IDs ausentes gerados deterministicamente numa cópia. Offhand incompatível com duas mãos é conservado no inventário.
- Merchant antigo sem ofertas de Sigils ganha apenas os campos de oferta em falta, sem substituir o stock de equipamento existente.
- A origem textual exata é devolvida como arquivo. Repetir uma conversão já v0.12 não volta a aplicar a migração.
- Formatos desconhecidos, corrupção, duplicados e ambiguidades são bloqueados; não são “corrigidos” apagando gear ou criando um perfil vazio por cima.

Limites: 700.000 caracteres no payload validado, até 5.000 itens legados, 300 Runes e 100 Sigils; o Stash jogável continua a respeitar a capacidade existente. Dados perto dos limites podem exigir revisão antes de acrescentar metadados. Um formato desconhecido requer conversor explícito. **O save partilhado do protótipo v0.12, incluindo Magic+Poison, não é importado para contas**: fica intacto e exige uma política de conversão aprovada.

A flag `migration.requiresApproval` documenta a necessidade de aprovação; **não é uma autorização de produção**. Não existe writer de migração para contas reais nesta implementação.

### Persistência estritamente isolada

Para QA, acrescentar `expeditionSave=1` e um `validationSlot` ao modo integrado. Apenas esta opção ativa as chaves `wanderer_v012_validation_v1_<slot>`. Sem ela, o preview continua em memória. Não existe leitura automática de slots clássicos, contas ou protótipo.

- Web Lock mantém um único escritor por slot. Outra tab fica bloqueada; browser sem Web Locks não cai silenciosamente num modo sem proteção.
- Revisões, binding/identidade, histórico imutável, ledger de Waves e progressão são verificados antes da escrita.
- Cada commit conserva um backup do checkpoint anterior; uma cópia migrada mantém também o arquivo original imutável. Não há retenção ilimitada de todos os checkpoints.
- Falhas de quota/conflito/corrupção bloqueiam alterações e oferecem exportação da cópia recuperável. Não há overwrite automático de dados corrompidos nem limpeza de backups de contas.
- APIs antigas de switch de conta, sync-cache e backups ficam bloqueadas no preview; não conseguem escrever em chaves `v092` a partir do modo de validação.

**Ao reabrir uma aventura interrompida, ela termina:** mantêm-se os prémios já gravados, termina a build temporária e HP/Mana regressam ao máximo do equipamento. Não se restaura o mesmo inimigo, oferta ou RNG para repetir loot. Refresh não desbloqueia dificuldade. A última Wave não gravada numa falha de armazenamento não é prometida como durável; a interface bloqueia e permite exportar o estado pendente.

## 3. Bugs corrigidos e proteção contra exploits

1. O cronómetro clássico D200 ainda recebia tempo de combate integrado. Agora o histórico/ranking antigo não muda; o writer também rejeita alterações ao histórico.
2. Mudar de Plane reiniciava cooldowns clássicos/Legendary, contadores de ataques/casts e Second Wind. Uma regressão nova falhou antes da correção. Agora o runtime dura a Expedition inteira; estados do inimigo continuam a mudar por Wave. Debuffs de Elite usam a mesma base temporal dos restantes efeitos.
3. Abandono passou a fechar explicitamente a tentativa, conservar recursos/gear assegurados e limpar efeitos temporários, sem desbloquear conteúdo.
4. Restauração/replay: IDs duplicados, repetição/rollback do ledger, revisões antigas, troca de identidade e unlock sem checkpoint do boss final são rejeitados.
5. Stats não finitos, slots/Rune slots ilegais, stock inválido, schema desconhecido e counters esgotados falham antes de substituir o checkpoint válido.
6. Confirmado que trocar Staff↔Sword ou equipamento não restaura Mana/HP; os limites de inventário e a reserva de loot da Fase 4 continuam testados.
7. Dois testes antigos fora da suíte tinham expectativas desatualizadas: afinidade de duas mãos conta duas vezes, e a comparação mostra antes/depois. A fixture Legendary também não equipava realmente o item. Foram corrigidos os testes, mantendo verificações de comportamento e o combate original.

Os controlos locais evitam falhas do cliente normal; não são autoridade anticheat contra JavaScript adulterado nem substituem transações/ownership no servidor.

## 4. Resultados dos testes técnicos

| Verificação | Resultado |
|---|---|
| `npm test` | PASS — suíte clássica, saves/model, economia, buildcraft, controller, combate e regressões acrescentadas. |
| Saves versionados | 11 testes PASS: conversão/idempotência, origem intacta, versões/ownership, interrupção, corrupção, quota, conflitos e counters. |
| Lifecycle | 3 testes PASS: HP/Mana por gear swap, continuidade de Second Wind/cooldowns/counters, duração de debuffs Elite. |
| Afinidades clássicas | 3 testes PASS, incluindo 54 builds/afinidades em 1×/2×/4× e preservação Legendary. |
| `npm run test:assets` | PASS — assets/VFX e regressões UI, economia e saves integrados. |
| Aventura completa | PASS em 390/1280 px, incluindo boss/unlock. A fixture usa gear legítimo gerado ao tier antigo para acelerar a travessia; não demonstra dificuldade justa. |
| Persistência/browser | PASS nas duas larguras: segunda tab bloqueada, encerramento e novo processo Chromium, interrupção, refresh repetido, abandono, golpe letal, corrupção, quota e ausência de Web Locks. |
| `npm run test:browser` | PASS em 1440/390/320 px — novas contas/login/email verificado, nickname, sign-out/return, sync e conflitos, com backend simulado. |
| `npm run test:recovery` | PASS — 16 cenários: local/cloud/both/conflict × 320/390/768/1440 px; backups e estado clássico preservados. |
| `npm run test:pvp` | PASS nas três larguras, com backend simulado. |
| Bundle Firebase | PASS com esbuild para `/tmp`; bundle versionado e configuração Firebase não foram alterados. |
| Regras em emulador | **NÃO EXECUTADO** nesta fase: JAR indisponível e download de `storage.googleapis.com` respondeu HTTP 403 pela política de rede. Sem deploy ou alteração de regras. |

Saves-sentinela clássicos/de contas ficaram intactos. O preview não carregou os módulos de autenticação/Firebase. CI remota ainda não verificada neste relatório. Não houve teste com contas reais, provider OAuth real, hardware móvel ou Safari/iOS; viewports Chromium não equivalem a esses testes.

## 5. Balanceamento final: evidência e reprovação do gate

[Dados completos, seeds e hash do HTML](v012-final-validation-metrics.json). Execução: `npm run simulate:v012:final -- /tmp/v012-final.json`, Node 22.23.3.

**504 cenários individuais + 288 tentativas de campanhas = 792 Expeditions; zero timeouts.** Executam `updateFight`, gear, efeitos, drops e transações Forge/Merchant reais. Não usam `online/v012-engine.mjs`. Os ensaios foram repetidos depois da correção de continuidade; um resultado de vitória individual mudou e as campanhas foram recalculadas. Nenhum coeficiente ou tabela foi retunado nesta fase.

Matriz: nove políticas de foco/híbridos, E1/E20/E80/E200, gear a 50/100/150% do tier e quatro seeds; mais Common/Rare/Epic com Sword/Staff. “Foco” ainda respeita a regra de obter outra família antes de repetir; não significa burlar o limite/regra inicial. Os híbridos distribuem escolhas e priorizam passivos de duas famílias; foram efetivamente escolhidos, não apenas descritos.

Vitórias com loadout Rare completo; 36 tentativas por célula:

| Expedition | Gear 50% | Gear ao tier | Gear 150% | Boss alcançado ao tier |
|---|---:|---:|---:|---:|
| E1 | 36/36 | 36/36 | 36/36 | 36/36 |
| E20 | 0/36 | 0/36 | 19/36 | 0/36 |
| E80 | 0/36 | 9/36 | 33/36 | 17/36 |
| E200 | 0/36 | 28/36 | 28/36 | 29/36 |

E1 usa Rare completo, **não** o equipamento inicial verdadeiro. 50% de E1 arredonda para tier 1; 150% de E200 fica limitado a 200, repetindo fixtures. E20 é um muro muito maior que E200 em gear equivalente. Nas últimas Planes (12–15), a média de Waves vencidas ao tier foi 0 em E20, 4,19 em E80 e 7,42 em E200: a dificuldade relativa não cresce de forma consistente.

Em E80/gear ao tier, cada foco teve quatro tentativas: Blood 1 vitória, Decay 0, Aegis 2, Fury 0, Fire 2, Frost 2 e Lightning 1; híbrido sustain 0 e híbrido spell 1. São células pequenas, não um ranking aprovado. Em E200/Sword+Staff, Common venceu 0/8, Rare 5/8 e Epic 8/8: equipamento permanente e raridade mantêm peso significativo.

Campanhas de 24 tentativas a partir do starter real, com upgrades de loot e recursos ganhos, em três seeds:

| Política | Maior Expedition desbloqueada — seeds 1/2/3 |
|---|---|
| Apenas loot | E9 / E2 / E10 |
| Forge | E10 / E5 / E7 |
| Merchant | E11 / E4 / E9 |
| Ambos | E11 / E4 / E8 |

Forge realizou 83–92 crafts/campanha; políticas com Merchant fizeram 3–7 compras úteis. Há utilização dos sistemas originais, mas não superioridade estável de uma estratégia. Compras e duração das lutas alteram os sorteios seguintes; os bots não são jogadores ótimos. Bots sem gastos acumulam recursos, o que não prova por si só inflação, mas exige avaliação de longo prazo.

Gear fraco não ultrapassou facilmente conteúdo avançado. Contudo, curva intermédia, dependência de sustain, atrição vs boss e volume de loot inicial — cerca de 12,5 peças numa E1 com Rare completo — ainda precisam de revisão e playtest humano. Passar testes técnicos não aprova estes valores.

## 6. Firebase: alterações necessárias, ainda não aplicadas

`online/app.mjs`, `online/model.mjs`, `online/firebase-client.mjs`, configuração e `firestore.rules` continuam no caminho clássico. As proteções `sessionGuard`, conflitos de revisão, backups e isolamento de conta não foram substituídas.

Antes de cloud v0.12:

- Criar namespace separado, proposto `players/{uid}/saves/v012`, com envelope novo e payload versão 12; não escrever o novo formato sobre `v092`. O modelo clássico não o consegue ler.
- Integrar UID/projeto/nickname derivados da sessão/perfil autenticado, nunca confiando no binding fornecido por URL/JSON. Acrescentar cache/sync v0.12 separado e testar as mesmas proteções de restore.
- Autorizar apenas owner autenticado/verificado, validar envelope/tamanho/revisões e usar transações para sourceRevision + criação única do destino. Regras atuais não autorizam o novo namespace; payload JSON opaco não fornece validação autoritativa de loot.
- Manter rankings D200 separados; definir a política de clientes antigos após migração para impedir divergência/reimportação de recursos.
- Aprovar e testar essas alterações no emulador e num projeto de testes antes de qualquer deploy. **Nenhum destes passos cloud foi executado.**

## 7. Estado da migração e protocolo seguro

**Implementada e testada apenas como cópia reversível em laboratório. Migração real: NÃO EXECUTADA, NÃO AUTORIZADA nesta fase.**

Protocolo proposto: backup verificável da origem → validar conta/projeto e revisão → gerar/validar cópia preservando histórico e itens → apresentar impacto e obter aprovação expressa → criar destino uma única vez numa transação → verificar invariantes/contagens e teste de restore → ativar o cliente v0.12 para esse utilizador. Não apagar a origem, não repetir importações e não converter D200 em dificuldade nova.

Interrupções clássicas não atribuem loot antigo ainda não extraído: o run original fica no arquivo para revisão. Dados ambíguos ou formatos desconhecidos bloqueiam o processo. Rollback não pode copiar cegamente v0.12 para v092 nem voltar a importar uma origem antiga depois de novos ganhos; deve primeiro congelar writes e reconciliar versões, com aprovação quando houver risco irreversível.

## 8. Checklist de publicação

- [x] Rever Fases 1–4 e validar gameplay integrado, contas clássicas simuladas, recuperação e economia.
- [x] Testar migração em cópias, interrupção, corrupção, duplicação, limites e concorrência local.
- [x] Corrigir lifecycle/cooldowns e repetir simulações/regressões afetadas.
- [ ] Aprovar curva de dificuldade, raridades/ritmo económico e política para gear legado avançado; realizar playtest humano.
- [ ] Resolver eventos/poções pendentes ou aprovar explicitamente um âmbito reduzido de lançamento.
- [ ] Implementar cloud v0.12 e política de clientes antigos, preservando autenticação e backups existentes.
- [ ] Passar emulador, integração autenticada isolada, CI completa do candidato e testes em browsers/dispositivos suportados.
- [ ] Ensaiar backup/restore e rollback em staging; confirmar limites de payload e plano de rollout gradual.
- [ ] Obter aprovação expressa para publicação e para qualquer migração real irreversível.
- [ ] Só numa tarefa posteriormente autorizada: rever release/`main`, aplicar as alterações Firebase aprovadas e publicar o candidato.

**NOT READY.** Esta fase entrega validação e um caminho de migração seguro para continuar o trabalho; não autoriza nem realiza a publicação.
