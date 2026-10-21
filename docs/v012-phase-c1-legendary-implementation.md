# Wanderer v0.12 — Fase C.1: implementação dos 12 novos Legendaries

Data: 2026-10-21 · Branch: `development` · Base: `0ab17e3`

## Integração

Os 12 IDs novos são `crimson-fang`, `chalice-hollow-king`, `gravewake`, `eye-of-morrow`, `verdant-oath`, `heartroot-carapace`, `oathwall`, `veil-thousand-seals`, `kingsbreaker`, `tempest-talon`, `astrafall` e `voidglass`. Os 22 IDs antigos, atributos gravados e efeitos permanecem reconhecidos. Nenhum item de save é convertido. A assinatura de cada item é validada por ID, slot e subtipo; duas cópias do mesmo Legendary têm apenas uma assinatura ativa. Daggers aceitam Main e Off-Hand, sem um ataque independente na segunda mão.

`WANDERER_NEW_LEGENDARY_DROPS_ENABLED` fica **false** por defeito. Quando ativado no harness, apenas os 12 novos IDs são escolhidos para drops Legendary, mesmo quando o slot inicial sorteado não é elegível. A probabilidade de **raridade** Legendary não foi alterada. O fallback antigo de +32% no primeiro ataque continua só para Legendaries sem assinatura, nunca para um dos 12 novos com ID/slot válidos. Não há mapeamento de asset confirmado para os novos IDs; cada item usa o placeholder existente do seu equipamento, sem alterar os assets ou o código UX local.

| Affinity | Legendary | Efeito base → affinity desbloqueada |
|:--|:--|:--|
| Blood | Crimson Fang | Bleed 12% → 16% do dano-base por tick, 4 ticks; cooldown 3,5 s |
| Blood | Chalice of the Hollow King | Hit em inimigo com Bleed cura 1% → 1,5% Max HP; 6 s |
| Decay | Gravewake | Rot 7% → 10% do dano-base por tick, 4 ticks, cap 6; 4 s |
| Decay | Eye of Morrow | Hit em inimigo com Rot +60% → +85% do dano-base; cap 2,5% HP normal/1,5% boss; 7 s |
| Vitality | Verdant Oath | Cura 0,8% → 1,2% Max HP e prepara o ataque seguinte com +60% → +90% do dano-base; 6 s |
| Vitality | Heartroot Carapace | Abaixo de 70% HP, 0,30% → 0,45% Max HP/s; máximo acumulado de 15% por Realm |
| Aegis | Oathwall | Block real causa contra-ataque de 75% → 110% do dano-base; substitui o contra-ataque Sword/Mace; 3 s |
| Aegis | Veil of a Thousand Seals | Barrier de 4% → 6% Max HP no início da Realm; absorção prepara +30% → +45% do dano-base; 8 s |
| Fury | Kingsbreaker | Hit +80% → +110% do dano-base; 4 s |
| Fury | Tempest Talon | Critical Hit +25% → +35% do dano-base; 6 s |
| Magic | Astrafall | Cada dois casts financiados: Echo 75% → 100% Spell Power; 4 s |
| Magic | Voidglass | Cada dois casts financiados: +90% → +120% Spell Power e reembolso de 25% → 30% do custo; 3 s |

Efeitos de ataque entram uma vez no hit principal ou são danos diretos sem novo roll. Oathwall usa o dano direto já existente, sem crítico, Double Strike ou procs recursivos. Bleed, Rot, cura, Mana e Barrier usam as funções e os caps existentes. O cooldown persiste entre waves; o orçamento do Heartroot e a Barrier inicial do Veil reiniciam em cada Realm. A affinity reforça o efeito apenas se constar de `unlockedFamilies` durante a Expedition.

## Validação

O harness `scripts/v012-phase-c1-legendary-sim.cjs` executa o runtime de produção com stats sintéticas equivalentes a Epic, três Runas equivalentes, sem poções, Legendaries antigos, gear swaps ou benefícios de eventos. O perfil de affinity é planeado pelas regras B.1 e usa as mesmas seeds de rota, draft, controlo e combate nos braços de 0, 1 e 3 efeitos novos; as políticas são `triple` e `random`. Cada combinação E10/E50/E100/E200 × 7 builds × 2 políticas × 3 contagens tem 64 seeds. A raridade sintética muda apenas para validar a assinatura Legendary; os atributos do item permanecem os de Epic. Uma verificação pareada em E100 confirmou igualdade integral das stats do primeiro combate nas sete builds entre 0 e 3 efeitos. Isto isola os efeitos e não estima a probabilidade de obter os itens em jogo.

**Resultados da matriz:** 10.752 corridas concluídas, 0 erros e 0 timeouts. Cada célula abaixo agrega 128 corridas (64 seeds × duas políticas). Em cada célula, os valores estão na ordem **0 / 1 / 3** efeitos novos. Vitória significa concluir as 15 Realms.

| E | Build | Wins 0/1/3 | Realm mean 0/1/3 | DPS mean 0/1/3 | Heal/s 0/1/3 | Barrier/s 0/1/3 |
|--:|:--|:--|:--|:--|:--|:--|
| 10 | Cloth Staff | 13 / 24 / 111 | 12.95 / 13.47 / 14.96 | 156.34 / 171.49 / 178.09 | 0.20 / 0.22 / 0.93 | 3.00 / 3.04 / 8.72 |
| 10 | Cloth Wand + Orb | 8 / 41 / 120 | 12.77 / 14.38 / 15.00 | 146.85 / 172.47 / 178.12 | 0.21 / 0.23 / 0.68 | 3.01 / 3.22 / 8.76 |
| 10 | Plate Sword + Shield | 42 / 73 / 123 | 13.79 / 14.60 / 14.96 | 114.08 / 125.28 / 130.27 | 2.96 / 4.19 / 4.09 | 0.79 / 0.86 / 6.62 |
| 10 | Plate Mace + Shield | 34 / 63 / 101 | 12.70 / 13.93 / 14.77 | 95.67 / 112.80 / 118.39 | 2.78 / 2.97 / 5.23 | 0.71 / 0.78 / 0.75 |
| 10 | Leather Dual Daggers | 81 / 91 / 105 | 14.78 / 14.77 / 14.91 | 207.55 / 210.60 / 210.68 | 0.50 / 0.50 / 1.85 | 1.05 / 1.03 / 1.03 |
| 10 | Leather Bow | 19 / 21 / 96 | 14.36 / 14.35 / 15.00 | 169.05 / 170.94 / 173.67 | 0.42 / 0.43 / 1.22 | 0.17 / 0.17 / 4.70 |
| 10 | Leather Two-Handed | 44 / 52 / 106 | 14.29 / 14.47 / 14.99 | 169.91 / 174.72 / 178.10 | 0.40 / 0.50 / 0.53 | 1.90 / 1.94 / 6.61 |
| 50 | Cloth Staff | 0 / 1 / 23 | 8.41 / 9.70 / 13.70 | 632.88 / 697.47 / 732.84 | 0.26 / 0.54 / 4.49 | 9.67 / 9.96 / 29.68 |
| 50 | Cloth Wand + Orb | 0 / 0 / 23 | 7.53 / 9.42 / 13.31 | 582.59 / 681.98 / 719.79 | 0.20 / 0.38 / 4.38 | 8.02 / 8.47 / 28.66 |
| 50 | Plate Sword + Shield | 2 / 9 / 81 | 10.80 / 12.62 / 14.66 | 455.34 / 493.49 / 514.79 | 8.43 / 13.27 / 15.31 | 2.58 / 3.11 / 22.35 |
| 50 | Plate Mace + Shield | 0 / 16 / 47 | 9.58 / 12.37 / 13.99 | 384.90 / 462.48 / 490.57 | 7.20 / 9.41 / 18.39 | 2.25 / 2.97 / 3.18 |
| 50 | Leather Dual Daggers | 72 / 69 / 86 | 14.93 / 14.95 / 15.00 | 942.26 / 952.11 / 951.01 | 2.24 / 2.48 / 6.91 | 2.48 / 2.41 / 2.41 |
| 50 | Leather Bow | 51 / 46 / 83 | 14.12 / 14.30 / 14.88 | 893.94 / 904.21 / 907.21 | 1.87 / 1.82 / 4.40 | 0.32 / 0.32 / 18.87 |
| 50 | Leather Two-Handed | 37 / 53 / 84 | 13.55 / 14.01 / 14.84 | 826.30 / 853.77 / 867.77 | 1.50 / 1.89 / 2.25 | 6.62 / 6.58 / 24.53 |
| 100 | Cloth Staff | 8 / 14 / 45 | 9.25 / 10.68 / 14.23 | 1485.17 / 1605.15 / 1658.01 | 0.85 / 0.89 / 8.02 | 18.49 / 19.19 / 61.90 |
| 100 | Cloth Wand + Orb | 4 / 9 / 52 | 8.44 / 11.12 / 14.50 | 1368.89 / 1591.21 / 1660.67 | 0.52 / 0.76 / 7.99 | 15.50 / 17.51 / 60.65 |
| 100 | Plate Sword + Shield | 18 / 37 / 106 | 12.27 / 13.77 / 14.84 | 988.80 / 1072.09 / 1117.18 | 17.23 / 26.75 / 28.76 | 6.28 / 6.89 / 46.64 |
| 100 | Plate Mace + Shield | 22 / 35 / 77 | 12.15 / 13.34 / 14.53 | 928.10 / 1065.97 / 1114.46 | 16.63 / 18.55 / 35.09 | 6.20 / 6.80 / 6.57 |
| 100 | Leather Dual Daggers | 54 / 60 / 74 | 14.77 / 14.77 / 14.95 | 1857.17 / 1866.17 / 1863.83 | 2.94 / 3.23 / 11.91 | 4.97 / 5.08 / 5.11 |
| 100 | Leather Bow | 34 / 40 / 77 | 13.34 / 13.62 / 14.77 | 1839.67 / 1857.82 / 1864.26 | 1.67 / 1.91 / 7.68 | 0.48 / 0.59 / 38.21 |
| 100 | Leather Two-Handed | 30 / 36 / 77 | 13.41 / 13.60 / 14.66 | 1677.51 / 1704.03 / 1731.27 | 2.20 / 2.43 / 3.32 | 12.51 / 12.76 / 47.73 |
| 200 | Cloth Staff | 45 / 61 / 99 | 12.35 / 13.56 / 14.80 | 3460.27 / 3704.58 / 3781.45 | 2.46 / 3.04 / 11.47 | 40.86 / 41.36 / 128.35 |
| 200 | Cloth Wand + Orb | 26 / 50 / 95 | 10.65 / 13.60 / 14.73 | 3161.93 / 3625.83 / 3691.32 | 2.26 / 3.16 / 12.23 | 35.15 / 38.92 / 123.84 |
| 200 | Plate Sword + Shield | 28 / 58 / 121 | 13.98 / 14.73 / 15.00 | 2428.46 / 2573.53 / 2641.28 | 41.22 / 58.67 / 58.82 | 9.52 / 10.55 / 97.78 |
| 200 | Plate Mace + Shield | 53 / 73 / 108 | 14.42 / 14.48 / 14.95 | 2467.85 / 2704.33 / 2794.18 | 42.30 / 42.78 / 71.80 | 10.03 / 10.17 / 8.86 |
| 200 | Leather Dual Daggers | 59 / 59 / 72 | 14.96 / 15.00 / 15.00 | 3655.89 / 3684.12 / 3680.42 | 5.92 / 6.28 / 21.60 | 9.21 / 9.02 / 8.97 |
| 200 | Leather Bow | 93 / 92 / 116 | 15.00 / 14.95 / 15.00 | 4014.15 / 4050.70 / 4057.50 | 6.13 / 6.00 / 9.17 | 2.04 / 1.93 / 79.40 |
| 200 | Leather Two-Handed | 99 / 96 / 118 | 14.88 / 14.87 / 15.00 | 4040.53 / 4070.10 / 4105.67 | 5.36 / 5.83 / 6.54 | 24.95 / 25.18 / 103.71 |

No agregado de sete builds, as vitórias foram **241 / 365 / 762 de 896** em E10, **162 / 194 / 427** em E50, **170 / 231 / 508** em E100 e **403 / 489 / 729** em E200. A progressão média e o DPS constam da tabela por build; os ganhos de sobrevivência com três efeitos são muito superiores aos ganhos de DPS. A taxa global de 3 efeitos excede os objetivos B.2 em E10, E100 e E200, e não é equilibrada por build em E50.

### Ativações reais dos 12 Legendaries

A contagem usa `phase6Proc` do runtime nativo; o denominador é o número de corridas que equipou o item. Heartroot conta ticks de regeneração efetiva, limitados a 15% Max HP por Realm. Veil conta a preparação ofensiva após absorção da sua própria Barrier; a concessão inicial é medida à parte.

| Legendary | Ativações | Corridas com ≥1 ativação / equipadas |
|:--|--:|--:|
| Astrafall | 8.875 | 1.024 / 1.024 |
| Chalice of the Hollow King | 3.128 | 512 / 512 |
| Crimson Fang | 11.358 | 1.024 / 1.024 |
| Eye of Morrow | 2.634 | 512 / 512 |
| Gravewake | 9.347 | 1.024 / 1.024 |
| Heartroot Carapace | 609.440 ticks | 2.496 / 2.560 |
| Kingsbreaker | 14.357 | 1.024 / 1.024 |
| Oathwall | 8.077 | 1.022 / 1.024 |
| Tempest Talon | 4.971 | 1.024 / 1.024 |
| Veil of a Thousand Seals | 10.971 preparações; 29.120 concessões por Realm | 2.558 / 2.560 |
| Verdant Oath | 10.449 | 1.024 / 1.024 |
| Voidglass | 12.256 | 1.024 / 1.024 |

Todos os 12 ativaram; os raros runs sem ativação de Heartroot, Oathwall ou Veil não satisfizeram a sua condição de HP, Block ou absorção. Não se observou recursão nem ataques extra nos testes. A contagem elevada de Heartroot é de ticks pequenos e não ultrapassou o cap por Realm nos testes de limite.

As seeds e políticas são iguais nos três braços, mas sobreviver mais Realms permite desbloquear mais affinities. No braço de três efeitos, a rota tripla pretendida foi realizada em 1.519/1.792 corridas com política `triple` e 297/1.792 com política `random`; este desvio limita a leitura causal dos números reforçados da affinity. O harness não lê nem grava saves reais.


**Testes:** no arquivo limpo, os 22 testes específicos C.1 passaram. Cobrem os 12 efeitos com e sem affinity, valores numéricos, cooldowns, dois casts financiados, caps, Oathwall exclusivo, Barrier própria do Veil, Off-Hand, drops gated, IDs antigos, fallback e restore. A paridade do runtime passou 25/25 cenários. A suite de 23 ficheiros sem o teste de preview passou 23/23; `npm test` local passou 23/24 ficheiros, falhando apenas em `private-preview.test.mjs` por `listen EPERM 127.0.0.1`. `npm run test:browser` também parou antes das asserções pelo mesmo bloqueio local. `node --check`, `git diff --check` e `npm run build:pvp -- --check` passaram. O GitHub Actions validará os testes de loopback.

## Decisão C.2

Os 12 efeitos estão implementados e passaram os testes de comportamento, mas **nenhum é aprovado para drops ativos** antes de C.2. Heartroot e Veil exigem primeiro uma experiência isolada de sobrevivência: com três efeitos, a Barrier/s de Cloth Staff em E100 sobe de 18,49 para 61,90 e a de Plate Sword de 6,28 para 46,64, enquanto o DPS aumenta bem menos. Oathwall e os pacotes com Heartroot/Veil também devem ser isolados para medir a contribuição própria. Os efeitos de arma de um só item ativam e não mostram recursão, mas continuam sujeitos à comparação de balanceamento C.2; taxas de vitória isoladas oscilam entre seeds e builds. Conservar os números C.1 até essa avaliação.

Os novos drops **não** são ativados nesta fase. O balanceamento-base B.4, as probabilidades de raridade, passivos, Runas, inimigos, Firebase, Railway, saves reais e `main` não foram alterados.
