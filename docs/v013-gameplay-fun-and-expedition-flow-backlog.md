# Wanderer v0.13 — Auditoria de diversão e backlog de game design

**Estado:** planeamento; nenhuma proposta abaixo está autorizada para implementação automática.
**Data:** 2026-10-26.
**Fonte:** auditoria de design pedida pelo criador a 25-26/10/2026, inspeção dos módulos existentes, relatórios de simulação e feedback de jogo.
**Local de planeamento:** branch development, documentação apenas. NÃO alterar main, Firebase, Rules, saves reais ou fazer deploy.
**Referências de código inspecionadas:** main 822b9cd3a8a48e9b690ba2b542fc4db50e5296af; development d6ae18d779371d0adf95e3cd5e33f5d83b8fbfa4. Confirmar sempre HEAD e diferenças entre branches antes de implementar.
**Limite da evidência:** não houve novo playtest humano nem nova simulação para a auditoria de 25-26/10. Valores propostos não são balanceamento validado.

## Problema reportado pelo criador — prioridade máxima

> «Como os combates são tão rápidos, parece que estás sempre a clicar Exit Realm, Enter Realm, Choose Passive, Exit Realm, Enter Realm, Choose Passive... Esse é o maior problema neste momento.»

O maior obstáculo imediato é a **fricção entre combates**, NÃO a falta de conteúdo ou simplesmente a dificuldade.

### P0 — Eliminar cliques cerimoniais, preservando escolhas reais

**Fluxo observado:** combate termina → popup passivo obrigatório → regressa a combate concluído → botão Exit Realm → ecrã Between Realms → selecionar card Realm → botão Enter Realm → combate. A cada transição normal, até 4 ações manuais, repetidas até 14 vezes numa Expedition de 15 Realms. A sensação é de microgestão entre lutas demasiado rápidas.

**Correção mínima recomendada (candidata a hotfix de UX na v0.12, mediante aprovação separada):**
1. Ao terminar um Realm, mostrar imediatamente o draft de passivos; loot e resultado são persistidos uma vez pelo fluxo atual.
2. Ao selecionar um passivo, **transitar diretamente para Between Realms**, sem regressar à arena concluída nem pedir Exit Realm.
3. As três cartas de Realm continuam disponíveis. **Clicar uma carta inicia o Realm diretamente** quando elegível, substituindo dois cliques Select+Enter por uma escolha. Não selecionar automaticamente uma affinity/route sem vontade do jogador.
4. Entre Realms, manter painéis opcionais de Bag/equipment, stats/passivos, poções, reroll, extração. Estes são ações estratégicas disponíveis, não passos obrigatórios.
5. Resultado detalhado do Realm acessível por 'Ver resultados/log' sem bloquear a continuação.
6. Uniformizar o comportamento dos eventos; uma escolha de evento continua obrigatória e respetiva recompensa de passivo continua a ocorrer só uma vez. Após passivo, regressar diretamente ao Between Realms.
7. Realm boss/final deve continuar a usar resumo, Rune e settlement próprios; não auto-iniciar nova Expedition.
8. Quando a Bag estiver cheia, deixar extrair se não houver overflow; entrada de novos Realms mantém guardas existentes. Com itens fora da Bag, permitir resolver overflow antes da continuação e respeitar o comportamento validado de extração.
9. Preservar checks de save/reload, idempotência das recompensas e de consumíveis, state machine, recuperação de crash, indicadores de progresso, navegação e acessibilidade de teclado/mobile.
10. Evitar double clicks que iniciem duas vezes o mesmo Realm ou atribuam passivos/recompensas repetidos.

**Métrica antes/depois:** reduzir ações obrigatórias típicas por transição normal de 4 para 2, e até ~56 para ~28 nas 14 transições, sem eventos e exceções. Medir cliques reais, tempo nos menus, tempo efetivo de combate, percentagem de players que iniciam outra Expedition e confiança de escolha.

**Não resolver reduzindo artificialmente a velocidade do combate ou aumentando o HP global dos mobs.** Tornaria as lutas mais demoradas, mas sem nova profundidade.

### P0 — Experiência de ritmo para v0.13 (só depois da correção UX)

Se duas escolhas em cada transição ainda forem repetitivas, testar em protótipo isolado e A/B **menos paragens com decisões mais relevantes**, mantendo 15 Realms e a economia total de poder da Expedition. Exemplos de variantes a simular, não regras definitivas: bundles de passivos em marcos estratégicos; offers de Realm em checkpoints; sequência automática de combates apenas depois de uma direção previamente escolhida e com pausas por Elite/evento/bag/risco; 'continuar percurso' opt-in. Nunca permitir seleção automática de passivo, rota arriscada ou extração sem escolha explícita e mecanismos de recuperação.

**Hipótese:** o jogador deve pensar principalmente nas escolhas, não na navegação de ecrãs. Metas experimentais: primeira sinergia reconhecível até Realm 5, 4–6 dilemas relevantes por Expedition, 12–18 min de mediana em Expeditions completas como hipótese inicial, 15–30 min como intervalo aceitável; medir contra realidade antes de fixar.

## Visão v0.13 — preservar e aproveitar o já existente

Wanderer = RPG roguelite com combate automático e buildcraft de curta duração: **Preparar → Arriscar → Adaptar → Descobrir → Sobreviver**.

Preservar: 15 Realms, 6 affinities, 33 passivos normais, 30 híbridos, 3 affinities máximas por Expedition, 3 híbridos únicos por par no máximo, 16 eventos, 3–4 eventos por run, dois elites garantidos, 3 bosses, 7 armas, 12 legendaries, 8 runas, 8 poções, Forge, Merchant, Bag, equipamento e progressão permanente. Eventuais revisões da cadência exigem preservar o orçamento de poder, a importância do loot e os invariantes de save.

### Evidência do teste do criador
- Consegui fazer builds diferentes? **Sim**.
- Houve decisões em que tive realmente de pensar? **Não**.
- Aconteceu algo memorável? **Não**.
- Apeteceu-me fazer outra Expedition? **Não**.
Isto é sinal qualitativo de um jogador/produtor, não resultado representativo de todos os jogadores.

### Comparadores de design (inspiração, não copiar sistemas)
- Backpack Battles: preparação e sinergias em autobattler, resultado legível.
- Slay the Spire: escolhas de rota com custo e consequência, gestão de risco.
- Monster Train: sinergias e escolhas estratégicas de desenvolvimento.
- Balatro: picos de poder e combos fáceis de reconhecer.
- Loop Hero: combate automático + decisões de equipamento, progressão e extração.
- Slice & Dice: consequências concretas das decisões.
- The Bazaar: buildcraft de itens com combate automático.
**Não copiar:** turn-based, cartas, nova grelha espacial, dezenas de novos recursos ou microações durante cada ataque.

## P1 — Passivos e affinities: todas as entradas do catálogo

Objetivo: primeiro medir aquisição, activação efetiva, dano/cura/Barrier aproveitada, timing e oportunidade de sinergias. Não fazer buff generalizado. Passivos individuais abaixo são recomendações **provisórias** a comparar por seeds emparelhadas e condições de equipamento equivalentes.

### Blood
- Bleeding Edge (42% proc, Bleed 16% hit/tick, ICD 0,9s): manter; medir uptime útil.
- Deep Cuts (+15% Bleed/rank): manter; melhorar feedback.
- Executioner (burst 32% hit, cap 2,5% HP inimigo sob 30%, ICD 6s): só testar 6→5s se activações insuficientes.
- Blood Drinker (cura limitada 0,8% HP ou 10% hit no Rank1, ICD 4s): manter; medir cura aproveitada.
- Sanguine Fury (Bleed em críticos, burst 8%, ICD 2,5s): manter; avaliar armas rápidas.

### Decay
- Toxic Touch (42% proc Rot, 6,5% hit/tick, ICD 1,3s): teste isolado 4→5 ticks se necessário, cuidando boss balance.
- Virulent Rot (+15% dano Rot/rank): manter.
- Wasting Curse (−4% dano do inimigo rotted/rank): manter, mostrar mitigação.
- Withering Hex (−20% cura inimiga e −2% Attack Rank1): manter e diferenciar de Wasting Curse.
- Blight (burst 38% hit, cap 2,5% HP inimigo, ICD 7s): testar 7→6s apenas se baixa activação.

### Vitality
- Strong Heart (+10% Max HP Rank1), Renewal (+0,55% HP/s Rank1), Last Stand (uma vida salva/Expedition, 6% HP), Second Breath (+1,5% HP/Wave Rank1), Life Bloom (+0,25% HP/s + Mana): manter; mostrar HP realmente recuperado e momentos decisivos.

### Aegis
- Iron Skin (+12% DEF Rank1), Fortified (−4% dano/rank), Guarded Block (chance de Block por curva/caps), Barrier Pulse (3% Max HP/6s), Retaliation (próximo hit +30% após absorção Barrier, ICD 4s): manter; medir Barrier **absorvida** e contra-ataques, não só Barrier gerada.

### Fury
- Quick Hands (+8% attack speed/rank), Precision (crit por curva), Brutal Critical (+12% dano base em críticos Rank1), Double Strike (10% de 30% hit extra Rank1), Adrenaline (+10% velocidade/3s, ICD 3s): manter; testar 3→4s Adrenaline se activação não for legível; respeitar cap velocidade 4,2 APS.

### Magic
- Arcane Focus (+15% Spell Power Rank1), Mana Spring (+12% Mana regen Rank1), Efficient Casting (7 Mana no Rank1), Arcane Echo (25% Spell Power cada quarto hit financiado), Elemental Force (+12% potência/rank), Kindling (Burn em casts Fire), Deep Winter (Chill e burst de 18% Spell Power com caps), Overcharge (4 Static para burst de 32% Spell Power, cap 3,5% HP): manter; mostrar aplicação, duração, custos e Static 1/4→4/4.

### Os 30 híbridos, por par — catálogo e ação
- Blood+Decay: Plague Rupture — testar ICD 8→6s só se status overlap/crit levar a poucas ativações; Carrion Detonation — preservar conversão de dano DOT pendente e explicar consumo.
- Blood+Aegis: Blood Ward — manter, medir Barrier útil; Sanguine Reprisal — manter, visualizar proc.
- Blood+Vitality: Hemovore — manter; Crimson Pact — estudar subir condição HP de >20% para >40% para evitar auto-dano inesperado, respeitando trade-off.
- Blood+Fury: Crimson Rush — manter; Reaper's Cadence — testar ICD 7→5s se necessário; avaliar valor de Mana.
- Blood+Magic: Hex Bleed — manter; Hemal Sigil — manter, distinguir Fire/Frost/Lightning.
- Decay+Vitality: Rot Recovery e Rot Symbiosis — manter; diferenciar cura on-kill e durante combate.
- Decay+Aegis: Rot Ward — manter; Rot Husk — testar ICD 9→7s apenas se pouco ativado.
- Decay+Fury: Toxic Precision e Venom Shatter — manter; avaliar oportunidade/custo de consumir stacks.
- Decay+Magic: Hex Bolt e Elemental Blight — manter; destacar diferença de cada escola.
- Vitality+Aegis: Sanctuary e Guardian's Oath — manter, monitorizar sustain demasiado dominante.
- Vitality+Fury: Fervent Life — manter; Redline — testar burst 33→40% só se risco não compensar, mantendo +10% vulnerabilidade.
- Vitality+Magic: Life Conduit e Lifeweave — manter; mostrar custos/ganhos efetivos de Mana e HP.
- Aegis+Fury: Counterstrike e Iron Reversal — manter; medir benefício da vulnerabilidade temporária.
- Aegis+Magic: Runic Shield e Prismatic Rebound — manter; melhorar explicação da conversão Barrier→dano.
- Fury+Magic: Spellblade e Spell Surge — manter, conferir cadência e tornar 'charge' visível.

**Atenção:** métricas de 'nunca ativou' devem distinguir efeitos de salvamento raros de procs ofensivos frequentes. Revisar acesso aos híbridos antes de lhes aumentar dano.

## P1 — Armas, armaduras e itens

### 7 classes de armas
- Sword + Shield: defesa e contra-ataques, avaliar poder efetivo de Block.
- Mace: ataques lentos, pesados, contra-ataques; não penalizar apenas por baixo DPS.
- Bow: vigiar vantagem sistémica em algumas simulações históricas.
- Daggers dual wield: medir Main versus Off-Hand e procs; controlar stats equivalentes antes de nerf.
- Two-Handed: alto impacto por golpe sem Off-Hand.
- Staff: Spell Power/magia; verificar viabilidade.
- Wand + Orb/Tome/Charm: cadência e Mana, garantir identidade e viabilidade próprias.

### Cloth / Leather / Plate
Cloth: Intelligence/Magic; Leather: Agility + Dodge físico (não evita spells); Plate: Strength/defesa; não introduzir novos elementos de armadura. Medir taxa de vitória por arquétipo, com item budget comparável, evitando diferenças universais >~15 pontos percentuais de vitórias entre classes (meta exploratória, não objetivo absoluto rígido).

### Legendaries — manter os 12 e máximo de dois equipados
Blood: Crimson Fang, Chalice of the Hollow King.
Decay: Gravewake, Eye of Morrow.
Vitality: Verdant Oath, Heartroot Carapace.
Aegis: Oathwall, Veil of a Thousand Seals.
Fury: Kingsbreaker, Tempest Talon.
Magic: Astrafall, Voidglass.

Medições de risco: Veil em Sword+Shield + Verdant pode aumentar muito EHP; verificar versão atual antes de ajustes. Reforço +10 dá +2% de stats base por rank até +20%; manter. Os 12 efeitos existentes diferenciam legendaries, não acrescentar mais agora.

### Runes
Oito famílias: Might(STR), Swiftness(AGI), Wisdom(INT), Fortitude(END), Fortune(CHA), Fury(Attack), Warding(Defense), Vitality(HP). Três equipadas, famílias únicas. Manter. Melhorar preview de stats e caps, facilitar reciclar duplicados, sem criar novas habilidades.

### Equipamento normal e Gear Power
Slots atuais: Helm, Amulet, Armor, Gloves, Weapon, Offhand, Ring1, Ring2, Boots, Belt. Comparador não deve tratar Gear Power como único critério. Mostrar contexto: dano estimado, HP efetivo, interação da build quando calculável e perda de sinergias. Não inventar eficácia matemática de passivos não instrumentados. Antigos efeitos/sets permanentes estão desativados no cálculo da v0.12; não reintroduzir até balancear o buildcraft temporário.

## P1 — Loot, Bag, risco, morte e extração
- Rever capacidade efetiva por branch antes de mexer: documentação development menciona 6; em main inspecionada, PHASE3_BAG_CAPACITY=12. Nunca misturar valores.
- Manter loot em risco, equipamento equipado e moedas preservados após morte conforme runtime atual; não criar seguro, nova moeda ou recuperação artificial.
- Mostrar valor do item em risco e consequências de extrair/continuar; não obrigar popups de loot a interromper a Expedition.
- Resolver items irrelevantes em lote, sem auto-descartar valiosos.
- Se bag cheia, permitir Extract & Leave quando não há itens fora da Bag; bloquear apenas ação que realmente não pode prosseguir sem espaço.
- Diagnosticar drop, percentagens e qualidade em runtime atual antes de qualquer aumento de Legendary.

## P2 — Forge, Merchant, Apothecary, economia
### Forge
Atual High Quality = 2× custo, Masterwork = 3×; mesma tier base Epic ~6/12/15%. Hipótese A/B isolada: Standard Common/Uncommon/Rare/Epic=49/30/15/6; High=29/24/32/15; Masterwork=15/19/42/24, mantendo multiplicadores 1×/2×/3×. Custo por Epic esperado em E10: atual Standard ~1833 Fragments, High ~1833, Masterwork ~2200; hipótese Standard ~1833, High ~1467, Masterwork ~1375. **Não aplicar** sem campanha de economia, pois pode trivializar Epic e loot. Nunca Legendary na Forge.

### Merchant
Manter 3 categorias, stock visível, Gold vs Fragments, reroll por categoria. Mostrar porque compra é melhor, não esconder riscos de substituir itens.

### Apothecary — 8 poções
Health (+35% HP), Mana (+40% Mana), Might (+10% ATK/3 combates), Arcane (+10% Spell/3), Ironhide (+10% DEF/3), Haste (+8% velocidade/3), Fortune (+25% drop chance relativa/Expedition), Barrier (+15% Max HP sujeito a cap 30%). Manter 3 slots e utilização entre Realms; melhorar disponibilidade, feedback e recomendações contextuais, sem novas poções. Comparar estratégias por build e tier, controlando Gold gasto.

### Progressão e economia
Testar E1/E10/E20/E50/E100/E200 e longitudes de 30-100 tentativas com equipamento adquirido realisticamente e reforço de gear/runes; medições antigas mostram curvas irregulares e grande vantagem de certas classes; não generalizar diretamente a jogadores reais. Não aumentar rewards genericamente.

## P1 — 16 eventos atuais, decisões e problemas
- Traveling Merchant: contexto cura vs ataque e Gold.
- Smugglers Caravan: Mana vs defesa, fallback útil para não-mágicos.
- Relic Collector: custo real do item sacrificado.
- Cursed Artificer: valor efetivo da peça e dos buffs antes de sacrificar.
- Cursed Altar: mostrar custo de 20% HP e benefício de Attack/DEF durante a Expedition.
- Soul Mirror: preview de substituição de passivo e sinergias.
- Whispering Idol: mostrar custo/risco e janela real.
- Echo Shrine: mostrar impacto real da metade de rank temporária.
- Cursed Chest: conservar risco de 50% e -15% HP de alternativa desfavorável.
- Forgotten Arsenal: comparar gear vs Fragments; só testar 8+2E → 10+2E se escolha dos Fragments quase nunca for ótima.
- Runic Vault: preview de buff +20% Runes/3 combates.
- Bounty Writ: manter risco/recompensa de Elite seguinte, destacar no UI.
- Restless Spring: recuperação HP/Mana contextual e fallback.
- Fallen Wanderer: avaliar condição de +20% HP+Barrier pago versus +15% HP/Mana grátis; testar 20→25% apenas se escolha dominada.
- Oracle of Paths: mostrar qual affinity futura ajuda construir sinergia.
- Last Ember: mostrar trade-off do passivo com rank -0,5 vs recuperar recursos.
Métrica: analisar ~200 escolhas válidas por evento e condições; uma escolha >85% em todos os contextos é sinal de investigar, não regra de nerf automático.

## P1 — Mobs, elites, bosses, combate
Normais atuais: Tank (108% HP, 1,72s), Skirmisher (92% HP, 108% ATK, 1,42s), Caster (95% HP, ataques spell, 1,72s). Preservar papéis; fortalecer percepção de matchup sem counters obrigatórios.

Elites: Gravebound Bulwark (175% HP, 65% ATK, −40% healing debuff por hit HP); Bloodscar Ravager (72% HP, 120% ATK, cap de hit 35% HP jogador); Sanguine Wraith (cura ao ferir HP); Voidborne Hexer (−20% direct damage por 3s com cooldown). Preservar identidades.
Bosses: Abyssal Guardian regenera Barrier; Rift Harbinger cura 28% do dano em HP; Ember Sovereign Enrage abaixo de 50% HP (+35% attack). Destacar transições e causa de derrota.

Combate automático deve mostrar fontes de dano e impacto no mesmo instante do VFX; passivos decisivos e buffs/debuffs precisam de legibilidade e não spam visual. Não adicionar botões por ataque.

## Observabilidade, testes e aceitação
**Medições objetivas:** ações obrigatórias/transição, segundos de menus vs combate, decisões ponderadas, rerolls gastos, passivos adquiridos que nunca ativaram, status uptime, procs por 100 hits, dano periódico real, cura útil, Barrier absorvida, HP restante, causa fatal, perdas de loot, equip swaps, retorno voluntário.

**A/B técnico:** mesmas seeds, arma, gear orçamento equivalente, affinities disponíveis, nível e economia; bots aleatório, focado, 2-family, 3-family e agente racional que planeie prerequisitos. Testar versões de valores isoladamente. Alvo indicativo: estratégia deliberada ~8–20 pontos percentuais melhor que aleatória em cenários comparáveis, se houver espaço estratégico.

**Playtest:** 5 jogadores novos durante 20–30 min, sem coaching. Avaliar primeiras escolhas em ≤90s; primeira sinergia reconhecível até Realm5; 4–6 decisões difíceis por Expedition; ≥4/5 entendem por que morreram; ≥3/5 querem outra run espontaneamente; ≥3/5 regressam voluntariamente no dia seguinte. Estas são metas iniciais de produto, não estatísticas comprovadas.

**Não fazer agora:** novas affinities, centenas de passivos, novas moedas, novos mobs/bosses, reativar antigos sets, combate turn-based, novo inventário espacial, refazer toda a arte/UI, lentificar mobs só para aumentar duração, nerfar classes sem teste controlado.

## Sequência de trabalho recomendada
1. **P0 imediato** (eventualmente v0.12 UX): remover Exit Realm e Enter Realm cerimoniais; otimizar fluxo e segurança de save.
2. **P0 v0.13 diagnóstico:** telemetria e auditoria de activação de 63 passivos + 30 híbridos, decisões reais e resultados.
3. **P1 v0.13:** passivo inicial com impacto imediato (testar unlock antes 1.º combate, reequilibrar E1), sinergias reconhecíveis, matchups relevantes e eventos.
4. **P1:** Bag/admin e clareza de recompensas/derrota.
5. **P2:** Forge A/B, progressão/Economia, dificuldade após testes.
6. **Playtests cegos e release gates** antes de produção.

**Política de execução:** este ficheiro é um backlog, não uma autorização para alterações de gameplay. Trabalhar apenas em development, proteger saves e não fazer deploy sem pedido explícito. Guardar a possibilidade de reverter cada alteração.
