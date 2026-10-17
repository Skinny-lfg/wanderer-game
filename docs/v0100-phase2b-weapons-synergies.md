# Wanderer v0.10.0 — Fase 2B: Armas, afinidades, tier 5 e Legendary

**Data:** 17-10-2026  
**Fonte:** ZIP da `main` enviada pelo utilizador; SHA-256 de `index.html`: `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`.  
**Estado:** investigação offline; **sem alterações a gameplay, `main`, Firebase, saves ou dados reais de jogadores**. Documento guardado apenas na branch `development`. O código dessa branch pode divergir da `main` testada.

## Objetivo e método

Comparar as **7 armas** (Mace, Sword, Bow, Two-Handed, Staff, Wand e Daggers) e **15 combinações legais de afinidades**. Não confundir comparação *arma + build* com efeito causal isolado da arma.

O simulador `scripts/simulate-v091.cjs` executa o combate de produção de `index.html` num Node VM isolado com `combat/legendary.js` carregado. Ticks de 0,11 segundos, combate automático, quatro elites (Tank/Berserker/Vampire/Caster), quatro caminhos (Temple/Ash/Frost/Drowned), boss na quinta wave a cada 10 dungeons. Não há cheats de equipamento Epic completo nem alterações permanentes ao código.

**11.920 combates executados**:
- **5.760**: 15 builds × 8 níveis (D39/40/99/100/159/160/199/200) × 2 perfis de equipamento × 24 seeds (5 pontos de afinidade principal).
- **1.344**: equipamentos equivalentes com **3 pontos de afinidade** nas 7 builds principais, D40/100/160/200, comparáveis às amostras de 5 pontos acima; essa troca realoca as afinidades de alguns slots, não isola unicamente o tier 5.
- **1.136**: 71 inventários efetivamente adquiridos na simulação histórica (39 D40, 15 D100, 9 D160, 8 D200), com 16 seeds por inventário, repetidos no motor da v0.10.0. Não foram adquiridos em campanhas da v0.10.0.
- **2.688**: 1.344 pares A/B isolando **só o poder de tier 5**, desativado em memória e mantendo os mesmos itens, restantes bónus, seeds e stats.
- **512**: 256 pares desligando apenas **Shatter** ou apenas **Double Strike** em memória.
- **480**: 240 pares com seis identidades Legendary, comparando a habilidade ativa versus desligada em memória (D100).

Perfis gerados: `mixed` = tiers 75/85/95% de D e raridades Rare/Rare/Epic/Rare/Uncommon; `strong` = tiers 88/95/100% e raridades Rare/Epic/Epic/Rare/Epic. Ambos têm 5 pontos legais da afinidade principal, com equipamento off-hand ausente em armas de duas mãos. Os perfis são cenários de stress **deliberadamente construídos**, não distribuição real de drops. O elemento/afinidade interfere também nas estatísticas dos itens; não atribuir todas as diferenças exclusivamente ao tier bonus.

## Resultado principal: bosses D40 + D100 + D160 + D200

**Vitórias / 96** por combinação e por perfil; HP restante inclui mortes (=0).

| Arma + afinidade | Mixed | Strong |
|---|---:|---:|
| Mace + Shield | **62** | **93** |
| Mace + Regen | **66** | **95** |
| Sword + Poison | 27 | 74 |
| Sword + Critical | 21 | 76 |
| Bow + Critical | **0** | 60 |
| Bow + Nature | 15 | **90** |
| Two-Handed + Bleed | 7 | 75 |
| Two-Handed + Sunder | 4 | 70 |
| Staff + Frost | 3 | 75 |
| Staff + Fire | **0** | 52 |
| Staff + Storm | **0** | **37** |
| Wand + Dark | **60** | **96** |
| Wand + Fire | **0** | 56 |
| Daggers + Critical | 3 | 69 |
| Daggers + Poison | 7 | 80 |

### Interpretação

1. **Sustain domina a amostra mixed:** Wand+Dark (60/96), Mace+Shield (62/96) e Mace+Regen (66/96), comparados com a maioria das builds ofensivas quase a zero. Isto indica um desequilíbrio de *resistência ao dano recebido e/ou aquisição de poder*, **não demonstra um defeito exclusivo de uma arma**.
2. **A escolha da afinidade altera fortemente a mesma arma.** Bow+Nature 90/96 vs Bow+Critical 60/96 em `strong`; Staff+Frost 75/96 vs Fire 52/96 vs Storm 37/96; Wand+Dark 96/96 vs Fire 56/96. O Power médio quase não difere entre afinidades da mesma arma no mesmo perfil, pelo que o valor estratégico da afinidade é material.
3. **Duas mãos sem off-hand podem sofrer no equipamento misto:** Bow+Critical 0/96, Two-Handed+Bleed 7/96 e Staff+Frost 3/96; com equipamento `strong` sobem para 60/96, 75/96 e 75/96 respetivamente. Há uma zona de dificuldade muito sensível ao equipamento.
4. **Não existe um vencedor único absoluto:** o tier de equipamento altera as posições e várias builds atingem um teto de 100% de vitórias em D160/D200 com equipamento `strong`. Taxa de vitória no teto não é prova de equilíbrio nem de campanha D1–D200 fácil.

Diferenças ilustrativas com bootstrap de 10.000 reamostragens por índice de seed, preservando as quatro dungeons por seed (IC 95% aproximado e **descritivo**, não para jogadores reais):
- Bow+Nature vs Bow+Critical, `strong`: **+31,3 p.p.** [20,8; 41,7].
- Staff+Frost vs Staff+Fire, `strong`: **+24,0 p.p.** [11,5; 36,5].
- Daggers+Poison vs Daggers+Critical, `strong`: **+11,5 p.p.** [6,3; 16,7].
- Wand+Dark vs Wand+Fire, `mixed`: **+62,5 p.p.** [57,3; 68,8].

## Teste de tier 5 — duas experiências distintas

**A. Trocar 3 por 5 pontos de set:** altera afinidades de itens; n=24 por célula. O efeito pode incluir perda de outro set de 2/3 peças. Um caso exemplificativo: Daggers+Critical D100 strong fez 12/24 com 3 pontos mas 3/24 com 5 pontos. **Isto NÃO significa que a habilidade de tier 5 seja prejudicial.** São equipamentos com distribuições de afinidade diferentes.

**B. Isolar o poder tier 5 (equipamento exatamente igual):** 1.344 pares, vitória com habilidade tier 5 **704/1.344**, com habilidade desligada **695/1.344**; 10 reversões a favor e uma contra. Por arma (vitórias com→sem habilidade, 192 pares por arma):
- Mace: 155→155; Sword: 101→101; Bow: 60→58; Two-Handed: 82→81.
- Staff: 78→72; Wand: 156→156; Daggers: 72→72.

**Conclusão restrita:** os poderes de tier 5 mudam pouco o resultado *vitória/derrota* nestes perfis automáticos. Podem alterar duração, HP e experiência de jogo; e existem casos saturados onde essa diferença é invisível. Merecem medição individual de procs e de eficácia antes de buffs.

## Shatter / Double Strike isolados

256 pares no total: 128 de cada build. A implementação atual em `main` foi comparada com o mesmo motor mas só essa habilidade desligada:
- **Staff+Frost Shatter:** 51/128 com, 50/128 sem — impacto pequeno na taxa de vitória desta amostra.
- **Daggers+Critical Double Strike:** 48/128 com, 43/128 sem — +5 vitórias. Em D160/D200 `strong`, HP restante aumentou cerca de 14–16 pontos percentuais em 16 sementes/célula, mesmo com ambos os braços a vencerem tudo.

As duas habilidades funcionam; não recomendar reforço numérico com esta evidência apenas.

## Seis Legendary com habilidade ON/OFF (D100, 40 pares cada)

| Identidade | ON | OFF | Interpretação |
|---|---:|---:|---|
| Winterheart Spire (Staff Frost) | **25/40** | **4/40** | Grande impacto no equipamento construído para a identidade; prioridade de controlo de dominância |
| Tome of the Eternal Flame (off-hand) | 14/40 | 14/40 | Efeito pouco distinguível em vitórias |
| Pendant of the First Flame | 0/40 | 0/40 | Ambas fracassam; amostra no piso |
| Starweaver Relic (Wand) | 0/40 | 0/40 | Ambas fracassam; amostra no piso |
| Fang of the Sunbreaker (Daggers) | 40/40 | 40/40 | Ambas vencem; amostra no teto |
| Crescent of the Emberveil | 0/40 | 0/40 | Ambas fracassam; amostra no piso |

Procs foram observados para as identidades ativas; a amostra não mede viabilidade de todas as 22 identidades, nem da progressão completa. Em particular, **Winterheart precisa de teste com equipamento equivalente contra outras Legendary**, não de nerf imediato.

## Teste com inventários realmente adquiridos (históricos)

71 inventários, 1.136 combates com o **motor v0.10.0**, sem alterar equipamento:
- Two-Handed: **31 inventários, 396/496** vitórias.
- Staff: **18 inventários, 235/288**.
- Mace: **8 inventários, 111/128**.
- Sword: **4 inventários, 56/64** (no máximo D40).
- Bow: **5 inventários, 60/80** (no máximo D100).
- Daggers: **5 inventários, 56/80** (no máximo D100).
- Nenhum inventário Wand entre estes milestones. Os inventários não constituem populações equivalentes de poder, nível ou afinidade: **não comparar diretamente essas percentagens para ranquear armas**.

## Validação e limitações

Passaram: `tests/v093-shatter-double-strike.cjs`, `tests/legendary-signatures.cjs`, `node --test tests/v010-abilities.test.cjs tests/v010-progression.test.cjs` (6/6), `tests/v0100-affinity-scaling.cjs`. O SHA-256 de `index.html` ficou idêntico no fim. Equipamento testado obedece aos pools de afinidade, slots e restrições de duas mãos.

A seed inicial é emparelhada, mas diferentes decisões/procs consomem RNG em padrões distintos. As amostras são simulações de combate **automático** de uma expedição: não incluem escolha humana de extrair, troca de builds entre dungeons, recuperação de morte, Gold/Fragments, Forge ou Merchant. Há efeito de teto/piso e múltiplos cenários explorados; os intervalos acima não são garantias de performance em produção. Comparações entre armas são *builds completas*, não tratamento experimental de apenas um parâmetro.

## Decisão após Fase 2B

**Não alterar já dano, cura nem tier bonuses.** A evidência favorece investigar (1) uma afinidade de sustain (Dark/Regen/Shield) versus ofensiva com poder equivalente, (2) Bow Critical versus Bow Nature; (3) Fire e Storm no Staff; (4) se Winterheart introduz dominância; (5) o real valor dos efeitos tier 5 e as sinergias 2/3 perdidas quando se força 5 pontos.

**Fase seguinte: Fase 3 — Campanha persistente v0.10.0 D1–D200**, usando o motor atual e políticas de jogador alternativas. Medir aquisições, equip swaps, rates de morte, perda e recuperação, crafting, Gold/Fragments, tempo e dificuldade por tramo. Testar decisões de extração e mudança de build quando o loot o favorece. Sem isso, estas vitórias por combate não justificam uma atualização da `main`.

**Artefactos detalhados:** `wanderer-v010-phase2b-results.json` (5.760 screening, 1.344 três-pontos, 1.136 adquiridos) e `wanderer-v010-phase2b-ab.json` (3.680 combates comparativos) foram entregues localmente na conversa original e não incluídos no commit de documentação para evitar um grande JSON na branch.
