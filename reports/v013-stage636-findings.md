# Wanderer — Stage 6.36: impacto do equipamento em combate nativo

**Estado:** matriz completa no GitHub, 23 de novembro de 2026. **Run bem-sucedido:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/45189808714

**Artefacto auditável:** `stage636-native-gear-perceptibility-e2-e200`, ID `14826186366`, contendo `v013-stage636-aggregate.json` e `.md`.

**Scope:** esta Stage NÃO altera gameplay, stats, equipamento, talentos, inimigos, escala exponencial ou Pages.

## Resultado verificado

- **12 perfis naturais × 2 sementes = 24 contas E1-born**. Todas as 24 shards validaram. 9 contas chegaram legalmente à E200.
- **376 pares de combates** (752 execuções nativas), todos com identidade de inimigos, roster, seed, Risk e condições iguais nas duas variantes; **0 comparações com roster divergente**.
- Base: personagem com os seus próprios talentos, XP, atributos, runas e itens, num combate nativo controlado em Risk 1 no primeiro anel.
- Contrafactual: a **mesma** personagem com apenas **uma** das suas peças não-arma já obtidas desequipada. Se houver orçamentos nativos `v013Budget`, é retirada a peça de maior orçamento; isso NÃO é necessariamente a peça de maior eficácia. As variantes usam poderes reais; **não existe aumento sintético de 1%**.
- Combates por nível: normal solo, três normais, uma das 8 identidades reais de Elite, e Boss relacionado com a Affinity primária do jogador.
- Estes combates de laboratório não são percursos efetivamente jogados; o **checkpoint** da personagem é que é efetivamente ganho no jogo.

| Expedition | Contas reais | Combates comparados | Vitória com item* | Vitória sem item* | Vantagem mediana no UI Power | Redução mediana de duração** | Vitórias perdidas ao retirar item |
|---|---:|---:|---:|---:|---:|---:|---:|
| E2 | 16 | 64 | 67,2% | 54,7% | +9,03% | 0,00% | 8 |
| E5 | 12 | 48 | 89,6% | 81,3% | +7,09% | 1,79% | 4 |
| E10 | 10 | 40 | 100% | 100% | +4,73% | 1,83% | 0 |
| E20 | 10 | 40 | 100% | 100% | +5,63% | 3,29% | 0 |
| E35 | 10 | 40 | 100% | 100% | +5,17% | 2,59% | 0 |
| E70 | 9 | 36 | 100% | 100% | +5,49% | 9,50% | 0 |
| E100 | 9 | 36 | 100% | 100% | +5,15% | 0,00% | 0 |
| E150 | 9 | 36 | 100% | 100% | +3,85% | 0,00% | 0 |
| E200 | 9 | 36 | 94,4% | 94,4% | +2,90% | 3,64% | 0 |

\* Vitória dividida por combates resolvidos (neste agregado, sem alterar censura de timeouts).

\** Diferença de tempo entre as duas variantes apenas **quando ambas ganham**; derrotas não são falsamente transformadas em um TTK.

## Detalhe por tipo de inimigo

- **E2:** Solo normal 16/16 vitórias; trio 5/16 com item e 0/16 sem; Elite 15/16 com item e 14/16 sem; Boss 7/16 com item e 5/16 sem.
- **E5:** Solo 12/12; trio 9/12 com item e 7/12 sem; Elite 12/12; Boss 10/12 com item e 8/12 sem.
- **E10–E150:** todos os quatro tipos de encontro, em todas as contas que atingiram esses checkpoints, terminaram em vitória nos dois braços. **Não há informação útil para ajustar uma taxa de vitória desejada através de remoção de uma só peça em tais níveis**, pois a dificuldade está saturada nestas builds.
- **E200:** solo, trio e Elite 9/9; Boss 7/9, com e sem peça. Duas derrotas no Boss são de Blood e Vitality, com equipas distintas.
- Agregado completo por identidade: o número de amostras é pequeno e desigual (ex.: Boss Fury 2, Aegis 36); não usar esta matriz isolada para impor nerfs individuais.

## O que isto demonstra — e o que não demonstra

1. **Power de UI não é igual a impacto em combate.** Em E100, a peça retirada dava na mediana +5,15% Power, mas a redução mediana do tempo entre as 36 vitórias emparelhadas foi **0%**; em E70, +5,49% Power correspondeu a mediana de **9,50%** menos tempo. A relevância varia com o contexto, duração, barreiras, habilidades e limiares de ataque.
2. **Os itens importam quando há risco de derrota.** Em E2, retirar uma peça custou 8 vitórias em 64 pares; em E5, 4 em 48. Em E10–E150, as builds sobreviventes são demasiado fortes para que esta comparação consiga provocar diferenças de vitória.
3. **Não provar que +1% é visível.** A experiência REMOVE uma peça real e o aumento mediano por peça em E100 ainda é 5,15%; o subgrupo com ganho de Power <=1,5% é pequeno ou inexistente em quase todos os níveis. Não há evidência para uma percentagem universal mínima de perceptibilidade.
4. **Não inferir dificuldade para todas as contas.** Nove contas E200 em 24 perfis propositadamente escolhidos, não as mesmas proporções da Stage6.35 (91 em 500); efeito de sobreviventes e seleção de estratégias muito significativo.
5. **Não redefinir a progressão de gear.** O sistema de patamares continua deliberadamente a preservar itens úteis. A atualização tem de tratar inimigos/base skills/objetivos de builds, sem obrigar upgrades por Expedition.
6. **O próximo passo de balanceamento tem uma ordem:** a Stage6.37 deverá usar a mediana da Stage6.35 (500 perfis) e comparar builds por sobrevivência/dano efetivo em enfrentamentos semelhantes; construir uma **curva de referência inimiga suave** suportada por dados, e ajustar individualmente Normal/Elite/Boss e composição de grupos para os objetivos de sucesso, sempre distinguindo o combate controlado da vitória da Expedition.

## Testes e integridade

- Preflight (unit tests, regressão total v0.13, smoke de combate emparelhado E1-born) passou: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45189511262
- Execução completa com 24 shards + agregador autenticando pares: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45189808714
- PR draft: https://github.com/Skinny-lfg/wanderer-game/pull/140
- Sem merge/deploy, nenhum coeficiente de inimigos ou atributos de item alterado.
