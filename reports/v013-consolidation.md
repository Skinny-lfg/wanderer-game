# WANDERER v0.13 — relatório de consolidação

## Base e inventário

Base browser `balance/groups-blood-consolidation`, commit `2597901e8f55243f8d50a08d8433e3e06e1f5c24`. O histórico contém `audit/v013-stage6`, `playtest/v013-complete`, a Stage 6.39 (`0728ceb9`) e a calibração E10 (`8b30ca86`). Os commits `f4be1e1c` e `d5f13078` já consolidavam, respetivamente, os grupos/hordas e Blood. A [validação dessa base](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45792153600) terminou com sucesso. A integração usa esta ancestralidade. As branches experimentais de comparação, incluindo `audit/e10-large-hordes`, e o protótipo Godot ficaram fora dos merges.

A base preserva progressão de inimigos, áreas e alvo único, oito Elites, seis Bosses, árvores elementais, Decay, armaduras, Mana, equipamento, Anchor Runes, sete Contracts, Boons e economia. Os centros E10 continuam em 85/70/50% para Normal/Elite/Boss, com tolerância de 12,5 pontos percentuais. São critérios herdados. Esta entrega não mediu novamente taxas de vitória.

## Alterações

- Chaves e caminhos das Affinities Radiance e Arcane migrados em jogo, UI e simulador. A propriedade de equipamento para efeitos mágicos continua a servir o combate. Paleta dourada/marfim na árvore e na apresentação de Radiance, azul de Aegis.
- [Inventário dos 420 nós](v013-playable-talents.md). A redução do catálogo auxiliar de 575 para 37 definições foi comparada por igualdade integral do grafo antes e depois. Removidos 14 híbridos inacessíveis do catálogo de picks e handlers obsoletos. Radiance liga-se apenas a Fury e Aegis.
- Cinco nomes de Realm aprovados apresentados com as respetivas áreas. Os 12 temas e distribuições de encontros mantêm-se. Os quatro papéis de cada Affinity têm nomes do bestiário. Atualizados nomes de Bosses, Elites, habilidades, talentos, receitas e locais, incluindo The Gilded, Solar Rebuke, Intercession, Echo Font e Severance Spire.
- Gullet conserva os dois gatilhos anteriores e a quantidade de fragmentos. O tempo de retorno inicial é 10 s em campo. Cada fragmento vivo reabsorvido recupera 5% do HP máximo do Boss, até 15% por combate e até ao HP em falta. Um fragmento reabsorvido liberta espaço sem efeitos de morte. Destruir um fragmento impede essa cura. Implementados indicador, log e seleção de alvo pelo simulador.
- Cantor usa Renew, com os anteriores 7% de HP máximo repartidos por três ticks em três segundos. Reliquary usa Radiant Shell por quatro segundos, reflete 5,5% do dano direto primário com limites de 0,55% do HP máximo do atacante por golpe e 2,2% por janela. The Unfinished reduz o dano direto em 3% quando acompanhado de outro Minion Radiance ativo. Sunscour usa Searing Strike com o reforço anterior de 13%. Estes parâmetros são referências iniciais de playtest.

## Verificação e limites

259 testes dirigidos v0.13 passaram, incluindo um combate comparado tick a tick entre Chrome e CLI, acessibilidade da árvore, habilidades, grupos, Contracts, Boons, crafting, Anchor Runes e integração de Expedition. A interface da árvore abriu em Chrome a 1440 e 390 px. A pré-visualização isolada em docs foi regenerada.

O teste histórico v0.12 de Legendary passou a iniciar um Dungeon atual. Na execução de diagnóstico passaram 17 e falharam 7 verificações sobre procs de equipamento, Barrier e limites de Bleed. A suite antiga de assets também procurou marcação de ícones e uma função de pré-visualização Forge já ausentes. Estes testes não integram o total v0.13 acima. Não se estabeleceu equivalência completa das expectativas v0.12.

Faltam os nomes definitivos do Realm e Anchor Realm de Radiance, da habilidade e fragmentos de Gullet e a aprovação artística dos sprites/VFX. Subsistem imagens vegetais e alguns IDs técnicos históricos de entidades e habilidades. A nomenclatura e a implementação de Anchorstones/fragmentos de portal são distintas das Anchor Runes de equipamento existentes. A cobertura editorial de todos os assets, IDs, runas e locais ainda é parcial. O playtest deve confirmar a leitura do cronómetro, dos efeitos de cura/reflexão e o impacto do novo encontro.

## Obter a branch

```sh
git fetch origin release/v013-consolidated
git switch release/v013-consolidated
git pull --ff-only origin release/v013-consolidated
```
