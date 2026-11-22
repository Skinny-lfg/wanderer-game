# Wanderer v0.13 — Sincronização do motor de simulações (22-11-2026)

## Fonte de verdade
Base: `audit/v013-stage6` / `playtest/v013-complete` no commit `716b62f74b39490c60bd9e1e70b9c07999f2b6f3`.
As Stages 6.18 (mobs), 6.19 (curvas individuais de Elites), 6.20 (preparação nativa de Bosses), 6.21 (correção inicial dos seis Bosses) e as sete regras atuais de Contracts são carregadas a partir dos **mesmos módulos de runtime** do jogo; não existem fórmulas de combate simuladas em paralelo.

## Alterações realizadas
- `scripts/v013-natural-progression.cjs`: substituição do ranking obsoleto `pathfinder` / quatro Contracts por um ranking determinístico dos **dois Contracts efetivamente oferecidos**, limitado aos sete IDs ativos, usando a **recompensa única e fixa exibida**. A potencial Blueprint Rare/Epic é tratada como garantida **somente após objetivo concluído e extração/vitória**.
- O agente passa a considerar targets válidos para `boon_collector` (dois Shrines com seleção real), `marked_chambers` (duas salas), `monster_hunt` (mortes efetivas), `skirmish_clear` (três salas), `bounty_writ` (Elite), `purification` (Reliquary) e `oath_of_defiance` (Boss sem purificação). O custo de caminho, HP e risco dos encontros continuam a influenciar decisões; nunca se marcam salas como limpas nem se criam Boons artificialmente.
- `Oath of Defiance`: o agente evita deliberadamente sacrificar HP no Reliquary para desativar um Boss seal.
- `contractExitDecision`: quando um Contract está realmente pronto e o seu prémio é particularmente valioso, o agente pode optar por uma **extração nativa e legal** em vez de arriscar o prémio. Não força a extração, a recompensa ou a progressão.
- Registo por tentativa: opções e prémio apresentados, objetivo, progresso nativo, resultado, recibo pago, Boons selecionadas, estado de extração e eventual perda do prémio por morte. Resumo por E: Contracts selecionados, prontos, pagos, perdidos, Blueprints recebidas e distribuição de prémios reais.
- `scripts/simulate-progression.cjs`: carrega explicitamente o catálogo/ledger atual e devolve o estado nativo de cada Contract em cenários de Dungeon. Continua a usar caminho curto até ao Boss: **não se deve interpretar esse modo como estudo de completion rate dos objetivos laterais**. O motor de contas ganhas com decisões de percurso é o indicado para estudar essas tarefas.
- O fingerprint de módulos/replay permite identificar a revisão exata usada em cada resultado.

## Evidência de testes
A primeira bateria, `ee081c84`, executou com sucesso [CI 45057573943](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45057573943):
- 73/73: simulador, Contracts, checkpoint e contas naturais;
- 18/18: Stages 6.18–6.21;
- 380/380: gate de regressão v0.13;
- Cenário controlado com `--contracts=first --boons=first`, sem erros;
- Piloto natural E1–E2, 4 contas, 8 tentativas E1, **0 erros**, 6 extrações e 2 mortes, 8 Contracts escolhidos, **0 completados/pagos**, 8 Boons escolhidas. O piloto foi curto e não autoriza inferir taxas de cumprimento ou de equilíbrio do Boss.
- Auditoria C6 sem imports/entradas em falta e pré-visualização `docs/` sem diferenças.
A decisão adicional de proteger Blueprints com extração exige a segunda execução de regressão no commit final.

## Limitações e próximos estudos
- O combate do cenário controlado pode usar XP/gear sintéticos legais e seed; **não** equivale a equipamento ganho naturalmente.
- A progressão natural não fabrica XP, equipamento, unlocks, lutas ou prémios; o seu agente é heurístico, não um jogador humano.
- O cenário de Dungeon curto não procura intencionalmente todas as salas laterais e, por isso, não mede completion rates dos sete Contracts. Para obter métricas representativas são necessárias várias contas, seeds e progressão real E1→E5/E10/E20; distinguir E não alcançados de derrotas.
- Continuam por estudar as taxas concretas de obtenção e perda de Blueprints por Contract, a conclusão de dois Boon Shrines, e o trade-off da extração antes do Boss. Não se declara que esses resultados foram medidos pelo piloto curto.
- Sem `main`, Firebase, deploy ou modificações ao balanceamento.
