# Wanderer v0.13 — Stage 6.24A: BASE E1–E5 antes de redesenhar escalamento global

**Data:** 22 de novembro de 2026
**PR:** https://github.com/Skinny-lfg/wanderer-game/pull/126
**CI aprovado (fonte nativa e dados):** https://github.com/Skinny-lfg/wanderer-game/actions/runs/45082940450
**Fingerprint do runtime de combate:** 3951f6e80b96515505c89ca159aad8aaa9a533235c4ab6735f81b3f0cb6ebcfb

## Conclusão

**Não corrigir os problemas de E1–E5 com um reforço que só aparece em E6.** O jogo já escala todas as criaturas desde E1, mas há três sistemas de correção sobrepostos: Elite E6–E35 e E36–E70, Bosses com redução de HP/ATK até E30, e a curva geral que muda de inclinação após E5. Em paralelo, jogador ganha XP/Talents gradualmente, equipas de gear com afixos reais e mudanças de tier em E5, E15, E35 e E70.

A Stage 6.24A **mede a base com o código de jogo atual e não altera o balanceamento**. Este é o primeiro passo de uma reformulação segura das curvas do jogo inteiro, NÃO a implementação das novas curvas. Só depois de definir os atributos e mecânicas iniciais corretos faz sentido testar uma curva contínua a partir de E1.

### Cobertura e provas

- 4 seeds nativas 9701–9704 × 3 comportamentos (Cautious, Balanced e Smart Blood/Fury/Vitality) = 12 contas persistentes iniciadas em E1, gear inicial fraco e XP zero.
- 52 checkpoints reais pós-Camp, apenas nos níveis legitimamente desbloqueados: E1 12, E2 12, E3 10, E4 9, E5 9.
- 676 combates nativos controlados: cada checkpoint replicado com o MESMO herói/gear/elemento/Talents, seed/Realm/Risk/Condition e HP/MP inicial em 13 combates: 1 Tank solo, 8 Elites individuais, 1 Boss sem preparação, 3 grupos normais de 3/6/12 mobs gerados pelo jogo.
- 0 erros de simulação, 4 seeds completas e todas as paridades de ambiente/jogador verificadas.
- 305 tentativas naturais adicionais na trajetória das 12 contas para E1–E5. São trajetórias correlacionadas dentro de cada conta; não são 305 jogadores independentes.
- Source, inventário das fórmulas E1–E200, gear e talentos estão descritos nos artefactos de GitHub Actions: stage624-earned-seed-9701, -9702, -9703, -9704 e stage624-e1-e5-all-combat-baseline.

### Quadro do jogador e dos encontros controlados

| E | Contas | HP jogador mediana | ATK mediana | Talentos gastos mediana | Tank solo | Elites / oito identidades | Boss SEM preparação | Grupo 3 | Grupo 6 | Grupo 12 |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 12 | 119 | 18 | 0 | 4/12 (33,3%) | 14/96 (14,6%) | 0/12 | 8/12 | 8/12 | 8/12 |
| 2 | 12 | 140,5 | 24 | 3,5 | 9/12 (75%) | 61/96 (63,5%) | 4/12 | 9/12 | 10/12 | 11/12 |
| 3 | 10 | 162 | 30,5 | 6,5 | 10/10 (100%) | 61/80 (76,3%) | 2/10 | 10/10 | 10/10 | 10/10 |
| 4 | 9 | 199 | 35 | 11 | 7/9 (77,8%) | 51/72 (70,8%) | 1/9 | 9/9 | 9/9 | 9/9 |
| 5 | 9 | 201 | 39 | 13 | 7/9 (77,8%) | 37/72 (51,4%) | 0/9 | 9/9 | 9/9 | 9/9 |

**Vitórias aqui = vitórias do jogador.** Não transformar vitórias contra um Boss não preparado numa estatística de vitórias no percurso real. Os grupos são nativos, incluindo o tamanho/role balance atualmente aplicado. Sem Boons, poções, fase de preparação Marked Elite ou Reliquary na arena.

As vitórias naturais dos Bosses, depois de percurso, Boons, gear e preparação disponível, foram E1 **12/18**, E2 **10/14**, E3 **9/10**, E4 **9/12**, E5 **9/17**. São vitórias *condicionadas a chegar ao Boss*, e os 305 total attempts também têm muitas extrações; não se pode confundir a boa taxa condicional em E1/E3 com progressão fácil.

### Todos os oito Elites por E (vitórias do jogador)

| Elite | E1 (12) | E2 (12) | E3 (10) | E4 (9) | E5 (9) |
|---|---:|---:|---:|---:|---:|
| Gravebound Bulwark | 0 | 8 | 8 | 6 | 6 |
| Bloodscar Ravager | 3 | 6 | 9 | 6 | 5 |
| Sanguine Wraith | 0 | 5 | 6 | 3 | 2 |
| Voidborne Hexer | 0 | 8 | 9 | 7 | 6 |
| Gravecaller | 0 | 7 | 3 | 5 | 0 |
| Oathbound Exarch | 0 | 9 | 9 | 8 | 6 |
| Briarspine Horror | 9 | 9 | 10 | 9 | 9 |
| Ashen Executioner | 2 | 9 | 7 | 7 | 3 |

Padrão consistente mas com amostra limitada:
- **E1:** seis Elites com 0 vitórias do jogador em doze, enquanto Briarspine tem 9/12. Com equipamento inicial, as mecânicas e bases dos Elites causam grandes disparidades antes de começar qualquer bónus extra E6.
- **E3:** todos os normais 3/6/12 foram vencidos nas dez observações; vitória geral contra Elites 76,3%. A pressão normal e distribuição de recursos precisam de análise, não simplesmente de um buff global.
- **E5:** Gravecaller 0/9, Sanguine Wraith 2/9, Briarspine 9/9. A diferença individual antecede o crescimento E6. A entrada de tier Veteran em E5 não significa um upgrade automático de equipamento: HP mediana quase não cresce E4→E5, de 199 para 201.
- **Grupos E1/E2:** grupo de 12 teve taxa de vitória semelhante ou superior a grupo de 3, indicando que o dimensionamento por tamanho da Stage 6.18 pode reduzir excessivamente a perigosidade por inimigo, pelo menos com estes agentes e no primeiro ring. Inspecionar duração, dano e composição de roles antes de concluir inversão definitiva.

### Como funciona o escalamento atual

1. **Todos os inimigos:** enemyReference(E) usa E diretamente de E1–E5; depois E5 aplica progressão logarítmica, mudando abruptamente a *inclinação da progressão*, não os stats num salto em E6. HP/ATK/DEF de todos os inimigos usam esta base.
2. **Mobs normais:** roles minion, tank, skirmisher e caster; múltiplos inimigos usam escalamento por tamanho e pressão/risco. Não devem ser ajustados como se grupos de 3 e de 12 fossem um inimigo único.
3. **Oito Elites:** multiplicador de arquétipo e habilidade específica desde E1; a camada *adicional* Stage 6.19 é 1,0× até E5, aumenta E6–E35 e volta a aumentar E36–E70. Os resultados desiguais E1–E5 NÃO provêm dessa camada.
4. **Bosses:** capacidade, summon, Barrier etc. diferentes por Affinity; o multiplicador *de redução* Stage 6.21 aproxima-se de 1,0 até E30. Uma futura curva coerente deverá absorver estes ajustes no perfil de base e progressão de cada Boss, não simplesmente apagar reduções que ajudam E1.
5. **Jogador:** stats derivam de gear real, afinidades e elementos, XP ganho e talentos comprados, runas legais, Poções e Boons durante a expedição. Gear tiers E5/15/35/70 não são melhorias garantidas imediatamente.

### Sequência obrigatória para implementar a nova arquitetura

**6.24B — Calibração da base E1–E5:**
- Prioridade à sobrevivência inicial E1, mas sem garantir loot, dar XP artificial ou descaracterizar Elite/Boss.
- Definir limites de win rate por classe e nível com os diferentes perfis/gear, e não um único valor global.
- Rever individualmente Gravecaller, Sanguine Wraith e Briarspine e as habilidades de summons, DoT e Thornbloom. Ajustar Bosses **apenas** após medir entradas preparadas e sem preparação, por identidade.
- Rever quantos mobs 3/6/12 deve o jogador conseguir combater; distinguir densidade de sala, stats individuais e suporte.
- Repetir combate controlado e campanha natural E1–E5 antes de aprovar bases.

**6.24C — Curva contínua desde E1 para TODOS os inimigos/jogadores:**
- Centralizar uma regra única de crescimento com parâmetros individuais por inimigo/classe e referência ao crescimento real do equipamento/XP.
- **Sem novo bónus que arranca em E6**; E1 é a âncora e as diferenças relativas são parâmetros, não camadas adicionais acumuladas.
- Eliminar o código antigo de E6/E36 dos Elites e compensações E30 dos Bosses apenas quando a nova curva tiver paridade/objetivos testados; eliminar migrações e funções obsoletas sem deixar implementações duplicadas.
- Testes nativos de E1–E5, E5→E6, E14→E15→E16, E34→E35→E36, E69→E70→E71, E100/E200 e beyond, guardando Boss > Elite > Tank > normal.
- A/B nativo com seeds/gear correspondentes; sem merge se causar novos bloqueios de progressão ou trivializar endgame.

**Nesta entrega a Stage 6.24A não modifica combate, progressão, economia, saves, UI, main, Firebase nem versão publicada.** Não seria responsável substituir curvas ou decidir buffs/nerfs sem concluir a calibração da base acabada de medir.
