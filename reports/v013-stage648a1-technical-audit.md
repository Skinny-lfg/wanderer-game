# Stage 6.48A.1 · auditoria técnica local

Branch `balance/stage-6.40-e1-calibration`, revisão auditada `96ee0314`. A cópia de trabalho desta auditoria foi isolada para preservar alterações locais anteriores da 6.46.

| Run | Diagnóstico pelos logs guardados no GitHub | Tratamento |
|---|---|---|
| [45423866999](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45423866999) | Dois testes de Magic falharam porque a fixture não fornecia o port legendaryRuntime usado no cast pago. | A revisão recebida já contém o runtime vazio e a consulta de assinaturas na fixture. O gate posterior passou. |
| [45424715554](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45424715554) | 35 coortes falharam ao procurar Blood, risco 1, em 48 sementes consecutivas. A agregação também falhou por matriz incompleta. Algumas contas nunca chegaram à E10. | A 6.48A já preserva as primeiras 48 sementes e estende a procura determinística até 256. O simulador mantém a carta nativa e regista a semente efetiva. A seleção por índice de risco corresponde ao contrato do controlador. A eficácia da extensão continua por medir. |
| [45427434875](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45427434875) | O teste rejeitava qualquer preparação posterior ao Anchor. Aos 8 s, o Conductor já pode preparar Arcane Convergence. O log não demonstra uma segunda invocação. | O teste exige o ID do cast periódico e um único uso do limiar. O runtime ignora uma notificação de conclusão já consumida, incluindo quando o mesmo evento é entregue duas vezes. A interrupção continua a admitir nova tentativa após o cooldown existente. |

## Integridade da campanha

O callback de captura corre no Camp antes da saída em E10. A procura de equipamento, os talentos e o desbloqueio continuam a cargo do motor. Um erro técnico na captura passa a guardar a semente e o diagnóstico da coorte antes de propagar a exceção. A agregação distingue ausência de E10 numa coorte concluída de ausência de dados numa coorte interrompida. As linhas parciais continuam disponíveis no detalhe, mas só coortes completas entram nas taxas globais.

Uma matriz com o comprimento certo podia conter células repetidas e omitir outras. O agregador verifica agora as cinco sementes de personagem, o conjunto dos 21 encontros, a identidade do ator de cada repetição, a unicidade de cada par repetição/encontro, o desfecho e a consistência do orçamento entre coortes. O carregador rejeita IDs desconhecidos em vez de usar por engano o perfil Decay de recurso. Os 42 IDs do workflow coincidem com a configuração e as 189 referências de objetivos de talento/preparação resolvem no catálogo corrente. Isto verifica a configuração, não a qualidade das decisões de cada agente em combate.

## Código obsoleto ou redundante observado

- O estado nodeCreated do Conductor é inicializado e escrito, sem leitor encontrado. A lista thresholds controla o consumo do limiar.
- A linha de telemetria em scripts/simulate-progression.cjs inclui duas propriedades targetPolicy idênticas.
- A comparação dos módulos JS correspondentes de combat, online e economy nos objetos Git encontrou uma diferença prévia em online/v012-save.js. Trata-se do prefixo de armazenamento isolado da preview. Preservado.
- A busca de Realm e a construção da personagem são partilhadas pelo simulador com o motor nativo. Os resultados de captura usam a curva experimental pré-existente em VM até E9. Não equivalem a progressão integral com a curva de produção.

## Ficheiros e validação

Alterados online/v013-boss-abilities.js e o espelho em docs/online, as referências de cache em index.html e docs/index.html, scripts/v013-stage647d9f-synergy.cjs, tests/v013-stage84-six-bosses.test.cjs e o novo tests/v013-stage648a1-audit.test.cjs.

Passaram cinco testes unitários selecionados da máquina de estados de casts e dois de configuração/agregação com dados artificiais. Passaram as verificações de sintaxe dos JS modificados e do simulador. Não se executaram campanhas, replays, progressão natural nem smoke E10. O gate técnico específico está corrigido localmente. A disponibilidade de todas as cartas e a cobertura real dos 42 perfis continuam sem validação integral.
