# Wanderer v0.12 — Fase B.4: integração final do balanceamento-base

Data: 2026-10-21 · Branch: `development` · Base: `952c048`

## Alterações de produção

| Arma | Integração | Compatibilidade e limites |
|:--|:--|:--|
| Wand + Orb | Novos Orbs guardam `spell = round(power × 1,12)`. | Orbs de saves anteriores mantêm o valor gravado e recebem os mesmos 12% apenas ao calcular as stats. Um marcador nos Orbs novos impede aplicação dupla após guardar/recarregar. Combate, comparação de itens e projeção PvP usam o módulo comum de stats. Staff, Wand e cadência de casting não foram alterados. |
| Sword + Shield | Contra-ataque base após Block: 65% do dano-base da Sword. | Mace + Shield permanece 45%; cooldown permanece 2,5 s. O dano usa `setDirectEnemyDamage`, sem críticos, procs de arma nem recursão. A guarda existente de `oathwall` desativa o contra-ataque base quando a assinatura Legendary estiver ativa. |
| Dual Daggers | Dodge físico por Evasion concede Barrier de 3% do HP máximo. | Exige Daggers nas duas mãos; aceita a designação legada `Off-Hand Dagger`. Cooldown de 6 s e cap global nativo de 30%. Ataques mágicos, DoTs, Block e Evasion falhada não ativam o efeito. |

Bow permanece `round(power × 1,18)+5`; Two-Handed permanece `round(power × 1,75)+7`. Os restantes coeficientes A.2, 4,2 ataques/s, stats dos inimigos, passivos, Runas, loot, Legendaries e progressão não foram alterados. O save não é reescrito para atualizar Orbs antigos.

## Método de validação

Foi usado um arquivo limpo de `952c048` com apenas os ficheiros B.4. O runner copia a versão **staged** do módulo de equipamento, excluindo as alterações UX não relacionadas do worktree. Foram repetidas as 64 seeds de cada combinação B.3 em E50, E100 e E200, com equipamento Epic, as mesmas três Runas equivalentes, perfis de affinities e políticas `triple`/`random`. O runtime B.4 foi comparado com a variante B.3 de Wand, Sword e Daggers; Staff, Mace, Bow e Two-Handed foram comparados com os respetivos controlos B.3. Cada caso compara vitória, Realm, DPS, HP restante, dano recebido, Barrier/s, ataques, tempo de combate, boss alcançado, rotas e passivos.

## Resultados

Foram repetidas **4.992 corridas** em 78 grupos de 64 seeds. Houve **0 divergências** nas métricas e escolhas comparadas, **0 erros** e **0 timeouts**. Para as três armas alteradas, o runtime B.4 reproduziu exatamente a variante isolada B.3; os quatro controlos reproduziram exatamente o controlo B.3. Os ganhos têm, portanto, o mesmo sentido e dimensão da experiência que fundamentou a seleção.

| Arma | n | Vitórias B.3 atual → B.4 | Realm média | DPS médio | Comparação com B.3 selecionado |
|:--|--:|:--|:--|:--|:--|
| Staff | 768 | 115 → 115 | 10,00 → 10,00 | 1.855,55 → 1.855,55 | Controlo idêntico |
| Wand + Orb | 768 | 41 → 51 | 8,45 → 8,82 | 1.680,09 → 1.720,96 | Variante Orb idêntica |
| Sword + Shield | 768 | 74 → 79 | 11,42 → 11,69 | 1.252,68 → 1.269,75 | Variante Sword idêntica |
| Mace + Shield | 384 | 67 → 67 | 11,64 → 11,64 | 1.254,67 → 1.254,67 | Controlo idêntico |
| Dual Daggers | 768 | 13 → 16 | 11,65 → 11,95 | 1.761,31 → 1.761,02 | Variante dodge idêntica |
| Bow | 768 | 420 → 420 | 14,21 → 14,21 | 2.297,22 → 2.297,22 | Controlo idêntico |
| Two-Handed | 768 | 258 → 258 | 13,79 → 13,79 | 2.081,45 → 2.081,45 | Controlo idêntico |

Resultados das três alterações por nível, somando os dois perfis de affinities e as duas políticas (n=256 por linha):

| E | Arma | Vitórias B.3 atual → B.4 | Realm média | DPS médio |
|--:|:--|:--|:--|:--|
| 50 | Wand + Orb | 0 → 0 | 6,43 → 6,76 | 560,57 → 578,83 |
| 50 | Sword + Shield | 1 → 2 | 8,97 → 9,41 | 438,88 → 448,67 |
| 50 | Dual Daggers | 8 → 9 | 11,99 → 12,30 | 750,98 → 750,74 |
| 100 | Wand + Orb | 1 → 1 | 8,03 → 8,42 | 1.341,28 → 1.374,62 |
| 100 | Sword + Shield | 18 → 21 | 11,52 → 11,75 | 960,32 → 972,88 |
| 100 | Dual Daggers | 3 → 4 | 11,52 → 11,90 | 1.509,84 → 1.510,08 |
| 200 | Wand + Orb | 40 → 50 | 10,88 → 11,27 | 3.138,41 → 3.209,43 |
| 200 | Sword + Shield | 55 → 56 | 13,78 → 13,92 | 2.358,84 → 2.387,70 |
| 200 | Dual Daggers | 2 → 3 | 11,44 → 11,66 | 3.023,11 → 3.022,23 |

A ausência de novas vitórias da Wand em E50 não invalida esta integração: a Realm média e o DPS melhoraram e o resultado coincide exatamente com a variante B.3. Daggers ganha sobrevivência com DPS praticamente constante, como esperado de um efeito defensivo. A diferença nos digests de alguns traces de Staff, Mace, Bow e Two-Handed deve-se a Orbs novos presentes no loot/checkpoint; o combate pareado dessas armas permaneceu igual.

## Testes e limites

No arquivo limpo, a suite sem o teste que abre uma porta local passou **23/23 ficheiros**, incluindo os novos testes B.4. Estes cobrem Orb novo e restaurado de save, ausência de aplicação dupla, paridade com projeção pública, Sword/Mace e cooldown do contra-ataque, requisito das duas Daggers, dodge físico, cap de Barrier e preservação dos coeficientes de Bow/Two-Handed/Staff e do limite de velocidade. `npm run build:pvp -- --check` passou. Os scripts `.cjs` passam `node --check`, o runner passa `bash -n` e o diff staged passa `git diff --check`.

`npm test` passou **22/23 ficheiros**; apenas `private-preview.test.mjs` falhou antes das asserções por `listen EPERM 127.0.0.1`, pois o sandbox local bloqueia loopback. A suite completa de 23 ficheiros sem esse teste passou; o teste de preview deve ser confirmado no GitHub Actions, onde existe acesso a loopback. O teste `v012-runtime-integration` passou após atualização de 10 digests da fixture que incluem Orbs em loot/checkpoints; a contagem de transições não mudou.

A simulação de balanceamento confirma a integração das variantes, mas mantém os limites B.3: equipamento sintético Epic, três Runas equivalentes, sem poções, Legendaries ou benefícios de eventos; 64 seeds por célula e vitórias raras em alguns perfis de E50. A fase fecha os valores-base escolhidos e não pretende resolver toda a curva de dificuldade.

## Encerramento

Os valores-base das Fases A–B ficam fixados como referência técnica para a fase dos 12 novos Legendaries. Nenhum Legendary foi implementado nesta integração. `main`, Firebase, Railway, deploys e saves reais não foram alterados.
