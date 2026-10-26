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

## Atualização 26/10 — Hordas, packs e prazer de destruir mobs

**Ideia do criador:** aumentar 2–3 Waves por Realm para 10–20 Waves ou colocar vários mobs na mesma Wave; objetivo principal não é farm ou dificuldade, é observar mobs a morrer rapidamente quando a build OP entra em funcionamento. Pergunta: como fazer isso em auto-combat sem manual targeting?

### Diagnóstico técnico confirmado em development (26/10)
- \`combat/v012-combat-runtime.js\` gira em torno de um \`r.enemy\` singular; \`weaponAttack\`, \`updateFight\`, \`phase2Context\`, DoTs, Legendary procs e derrota assumem alvo único.
- \`online/v012-expedition-runtime.js\` \`phase1StartWave\` cria 1 enemy e \`phase1WaveWon\` recompensa cada Wave; transição de 650 ms antes da seguinte. Aumentar de 2–3 para 10–20 sem rever isto multiplica loot/Gold/Fragments, logs, risco, tempo morto, salvamentos, efeitos on-kill e possíveis exploits.
- Em \`combat/v012-buildcraft.js\`, os status Bleed/Burn/Rot, DeathRot, cooldowns e activações operam sobre um enemy; \`onKill\` usa waveKey para evitar trigger duplo. Num multi-mob real, precisarão de entityId por kill mais ICD/caps por pack para não tornar healing/rewards imparáveis.
- Arena/HP/animação usam \`enemyPortrait\`, \`enemyHpFill\`, \`enemyHpText\` singulares. Multi-target é uma re-arquitectura de runtime + UI, não só criar três sprites.
- Recompensas devem ser por *pack/encounter ou Realm*, não por cada mob visual. Uma onda de 5 mobs não deve multiplicar loot ×5.

### Proposta em duas etapas para isolar impacto e risco
**Protótipo A — Gauntlet single-target:** 8–12 **micro-encontros automáticos** dentro de um Realm; 1 alvo activo de cada vez, próximo aparece imediatamente sem 650ms nem render completo do Realm; sem botões entre kills; 1–3 checkpoints de loot por Realm (calibrar pelo baseline atual); escolha de passivo / caminho ocorre só quando termina Realm ou num marco estratégico. Permite testar se "vida a derreter" e tempo de combate são o verdadeiro missing piece, sem mexer em AoE nem em 63 passivos.

**Protótipo B — Horde packs multi-enemy (candidato final):** 3–5 packs num Realm normal; 2–4 mobs activos simultaneamente por pack, máximo experimental 5; Elite 1 Elite + até 2 minions (apenas se balanceado); boss primeiro testar solo para não comprometer legibilidade de telegraphs; 1–3 recompensas de equipamento por Realm, NÃO loot por kill. Na arena cada mob tem HP/DoT/debuffs/ataque próprio. Seleção automática de alvo por prioridade predefinida (inicial: menor HP relativo ou frontmost, mas testar para evitar target thrash; stickiness por vida do alvo). Sem manual aim nem movimentação obrigatória.

**Orçamentos experimentais, nunca valores de produção:**
- Packs de 3 mobs: HP individual inicial ~25–40% do HP de um mob atual, dano/seg individual ~20–30% do mob atual. Não somar HP e attack 1:1; gerir DPS total e atrição por wave.
- Priorizar espetáculo: ao começo o jogador mata 1 mob a cada 2–4s de tempo real de referência; depois de atingir híbrido importante, alguns packs normais morrem 30–50% mais depressa. NÃO forçar todos os encontros ao mesmo TTK por auto-scaling individual, que anularia evolução de poder.
- Em vez de 150–300 Waves com separadores, usar 3–5 **packs** por Realm, cada um com 2–4 mobs, até 6–20 kills por Realm; packs adicionais devem encadear sem janelas entre si.
- Medir duração em tempo de relógio real e a velocidades x1/x2/x4; alvo exploratório 25–40s reais por Realm em x4 para runs completas, sem declarar que já funciona; 15 Realms = 6,25–10 min de combate + decisões/mapa. Rever tempo de players casuais antes de fixar.
- O alvo final *não* é maximizar números ou prolongar mobs artificialmente; é sentir que upgrades aumentam kill rate, clears em cadeia, dano de área/status e sobrevivência.
- Visual: reutilizar os assets/ataques existentes, diminuir escala dos mobs secundários na arena, transição de spawn/death curta, HP individual e contadores pack/Realm, eventos de proc agrupados para evitar spam. Ao nível de frame impact sincronizar dano para cada mob; cap de números e VFX por segundo.
- Primeiro permitir auto-targeting com golpes singulares; AoE/splash só após medições, reutilizando afinidades atuais. Sugestões opcionais para A/B, não decisões: Lightning salta entre 2 alvos com dano secundário ~25–35%; Rot pode espalhar 1 stack on-kill via híbridos Decay existentes; Blood aproveita kills consecutivas sem multiplicar cure. Dar a cada build hipótese viável de ganhar a packs e boss.
- DPS inimigo multi-target: 3× ataque actual mataria jogadores; teto de dano agregado e cadência escalados por tamanho do grupo. Evitar 3 ataques sincronizados e ataques invisíveis; visual de windups legível. Salto de alvo preserva cooldowns.
- Cuidado com \`onKill\` por mob versus por pack; Last Stand, Second Breath, bleed kill-heal, regen e status duration. Não resetar HP/MP, cooldowns, passivos, DoT e buffs automaticamente em cada micro-kill como se fosse novo Realm.

### Hipóteses e validação
A/B 0: baseline v0.12; A: mais kills sequenciais na mesma arena; B: multi-target real; C: ajustes de curva de power/tempo de uso. Não alterar ao mesmo tempo duração, loot, ameaça e recompensas. 5 jogadores novos e mesmos jogadores habituais a comparar: tempo de combate, kill rate e densidade visual, tédio, performance 320/390 mobile e desktop, escolha de outra Expedition, reconhecimento dos passivos.

**Escolha recomendada:** primeiro A em preview isolado para provar que "derreter" é divertido; depois B com 2–4 mobs como evolução. NÃO implementar já sem autorização. Preservar calendar de 15 Realms, boss, três afinidades, passivos, ruínas da Bag, idempotência de loot e saves.

## Atualização 26/10 — Mapa tipo Slay the Spire + evolução de build tipo Soulstone Survivors / Vampire Survivors

**Feedback do criador:** "Expeditions demoram tão pouco tempo que não dá para sentir o prazer de ganhar passivos; quando a build está OP já está a acabar o jogo." Referências intencionais: (a) mapa de Slay the Spire para progressão entre Realms; (b) Soulstone Survivors e Vampire Survivors para acumulação/evolução de poderes. Esta referência substitui a hipótese simplista de "basta retirar Exit/Enter". **É uma proposta de v0.13, não implementação.**

### Diagnóstico e princípios

Três problemas distintos:
- **Time-to-power:** a primeira sinergia transformadora e o pico da build podem chegar tão tarde que resta pouco combate para os usufruir.
- **Power payoff:** os eventos importantes de poder são pouco destacados; uma stack de ranks numérico nem sempre gera um momento reconhecível.
- **Momentum vs microgestão:** múltiplas escolhas após lutas de segundos quebram flow; prolongar HP de mobs artificialmente é solução errada, e copiar sobrevivência estilo Vampire Survivors sem movimentação/manual dodge também não transferirá toda a diversão.

Princípio: "Construir cedo, usufruir durante um período prolongado, enfrentar desafios que testem a build já formada." A versão antiga tinha boss a cada 10 dungeons permanentes (D10/D20...) e progresso imediato com Next; distinguir claramente progressão **permanente** de dificuldade/boss e progressão **temporária** do mapa de 15 Realms.

### Proposta de mapa (não implementar como UI decorativa)

Inspirado no branching map do Slay the Spire:
- Gerar um grafo dirigido de caminhos conectados **por Expedition**, a partir de seed persistida; mostrar progressão, pontos de bifurcação/reencontro, Elite, evento, descanso/recompensa se a semântica existir e boss final. Não inventar lojas ou rests sem mecânica implementada; reutilizar os 16 eventos e dois elites atuais.
- Mostrar um destino distante (boss) desde o início; opcionalmente revelar por etapas detalhes de eventos sem estragar surpresa.
- Caminho escolhido altera exposição a encontros, affinities possíveis, risco/recompensas, sem tornar uma família indisponível por azar incontrolável.
- Seleção de rota **só nos forks relevantes**. Se o percurso seguinte não tem escolha, mostrar avanço/animar Next automático com opção para parar e gerir Bag/poções. Não pedir confirmação em cada nodo de combate.
- No caso de 15 Realms, testar marcos legíveis em torno de R5, R10 (elites/intermédios usando conteúdo atual), R15 (boss), sem acrescentar bosses nem forçar esquema antes de verificar calendário e curva de loot.
- Persistir seleção, RNG, mapa e escolhas com segurança de save/reload, evitando exploits de voltar atrás e reroll grátis. Não alterar Firestore nem saves reais até autorização.
- Não confundir mapa com uma lista visual de 3 cartões apresentada quinze vezes: se continuar a interromper a cada Realm, a nova UI não resolve o problema.

### Curva de poder proposta, não implementada

Hipótese para protótipo de 15 Realms:
- R1–5: identidade e duas famílias; **primeira sinergia transformadora até R4–5** nas runs planeadas com offers viáveis.
- R6–10: jogar vários combates **com a sinergia**, melhorar/evoluir efeitos existentes e enfrentar pelo menos um desafio apropriado.
- R11–15: build consolidada e variações táticas, elite/boss devem testar condições sem anular sistematicamente sinergias.
- Meta exploratória: primeiro híbrido ou interação significativa até ~30–35% do tempo de combate total; ainda **≥50% desse tempo** após a primeira grande interação. Primeiro pico de poder desejado por volta de 55–65% da Expedition, não só nos últimos 10%.
- Híbridos existentes cumprem papel das evoluções de Vampire Survivors: **não adicionar classes/passivos de evolução novos** sem demonstrar necessidade. Dar "momento de evolução" visual/sonoro e feedback de contribuição quando um híbrido combina habilidades já obtidas.
- Nem toda build deve ficar invencível; "OP" aqui significa perceptivelmente transformada e poderosa face a inimigos comuns, sem trivializar bosses e elites.
- Rever ranks e oferta de passivos para atingir essa curva: preferir ajuste ao timing/pré-requisitos antes de buff geral de 63 coeficientes.

### Ritmo e sessões — hipóteses a validar
- Não utilizar exclusivamente número de Realms como duração; medir tempo ativo de combate, velocidade x1/x2/x4, menus, eventos, gestão de Bag e tempo pós-sinergia.
- Ensaiar duração de 12–18 min como mediana de Expedition completa e 15–30 min como janela de sessão desejável *apenas como alvos exploratórios*; evitar alongar lutas sem interessante feedback.
- A/B1: UI simplificada (duas escolhas manuais mínimas).
- A/B2: mapa com forks e segmentos de combates encadeados sem prompts redundantes.
- A/B3: agrupamento/redistribuição dos momentos de passivo; objetivo experimental de ~6–9 janelas de escolha relevantes em vez de 14, **preservando orçamento de poder total**, recalculado e simulado antes de aplicar.
- A/B4: antecipar disponibilidade dos híbridos em relação ao baseline, sem alterar DPS/loot; medir tempo restante desde o spike.
- Repetir 5 playtests cegos com time-on-task e preferência de continuar espontaneamente.

### Critérios de aceitação adicionais
1. Jogador sabe sempre posição no mapa, quantos marcos faltam e o objetivo seguinte.
2. Avança por segmentos lineares sem carimbar repetidamente Exit/Enter/Next.
3. Escolhe caminho apenas quando é bifurcação significativa, sem perder escolha de equipamento/extração.
4. Pelo menos metade do tempo de combate pode ocorrer depois do primeiro momento forte de sinergia numa build bem-sucedida.
5. Jogador identifica passivo/híbrido que tornou build poderosa, no resultado e numa luta real.
6. Métricas de segurança: resultados, loot, rerolls, equip, potions, Rune, telemetria, reload e idempotência das rewards passam sem regressões.
7. Não mudar simultaneamente length + passivos + dificuldade em teste causal: comparar uma variável de cada vez, com saves sintéticos.

**Ordem agora:** (i) instrumentar distribuição real de duração/ação, (ii) protótipo navegável do mapa e avanço sem fricção, (iii) teste de antecipação do power spike, (iv) balancear efeitos específicos, (v) só então revisar profundidade da economia.

### NOVA HIPÓTESE PRINCIPAL — recuperar o loop "só mais um dungeon" (feedback do criador 26/10/2026)

**Observação do criador:** na primeira versão, os amigos pareciam divertir-se muito mais mesmo com gameplay simples de carregar repetidamente em "Next", com um objetivo concreto: chegar ao boss em cada 10 dungeons (D10, D20...). O criador não sabe se o motivo foi facilidade, metas curtas, simplicidade de progressão, novidade ou interação social. **Não declarar uma causa já provada.**

**Correção de enquadramento do backlog:** o problema pode ser mais profundo que retirar Exit/Enter. A versão antiga favorecia o impulso "ganhei → avancei 1 dungeon → estou mais perto do boss → Next"; a v0.12 interrompe o ritmo com escolha de passivos/realm, ecrãs e um longo ciclo de 15 Realms antes do objetivo final. O problema pode ser o *rácio entre progresso sentido e esforço de navegação/decisão*, não apenas o número de cliques. Nunca interpretar "mais decisões" como automaticamente "mais diversão". Mesmo sem Exit/Enter, escolher passivos a cada poucos segundos pode continuar a parecer um imposto cognitivo.

**Hipóteses concorrentes a testar separadamente:**
1. **Fricção:** ecrãs e confirmações obrigatórias quebram o flow.
2. **Objetivos claros e próximos:** um boss/milestone visível a cada 10 níveis criava antecipação e "mais uma".
3. **Cadência de recompensas:** o antigo Next convertia cada vitória em progresso imediatamente perceptível, enquanto a v0.12 dá mais operações do que sensação de movimento.
4. **Dificuldade/ritmo:** facilidade inicial, poucas derrotas ou tempo para atingir um boss podem ter ajudado.
5. **Novidade e experiência social:** amigos podiam estar mais motivados pela descoberta inicial ou pela competição entre si. Não atribuir causalidade à UX sem testar.

**Princípio de design:** "Poucas decisões com consequências; progressão frequente e compreensível; boss como objetivo próximo". A questão não é maximizar número de escolhas ou tornar lutas lentas.

**Proposta de experimentação sem destruir v0.12:**
- **Teste A — navegação:** manter 15 Realms, dificuldade, rewards e ofertas idênticas, remover apenas cliques Exit/Enter e ecrãs redundantes; comparar cliques/tempo/menu e replay voluntário.
- **Teste B — objetivo:** sobre A, tornar a distância ao boss e marcos intermediários explícitos, com progressão visual simples "faltam X" (sem novas moedas/loot), mantendo mesma dificuldade; medir até onde chegam e continuidade.
- **Teste C — cadência:** protótipo separado que condensa decisões em checkpoints em vez de após todo combate (por exemplo, algumas escolhas importantes a cada 2–3 Realms), sem remover o conteúdo existente e preservando orçamento total dos passivos; exigir novas simulações antes de alterar lógica live.
- **Teste D — nostalgia/controlado:** reproduzir em ambiente sintético o objetivo de boss a cada 10 dungeons e uma única ação Next, com gear e dificuldade alinhados tanto quanto possível para comparação, sem reintroduzir classic em production/development runtime ou substituir v0.12. Isto é um protótipo de UX comparativo, não autorização para regressar à v0.9.

**Instrumentação necessária:** segundos entre vitórias e próximo combate, número de interações para avançar, taxa de conclusão até milestone, tempo real para o primeiro boss, número de runs adicionais iniciadas espontaneamente, sessões voluntárias no dia seguinte, percentagem de tempo em menus vs combate e comentários dos jogadores. Em playtests, manter recompensa/dificuldade tanto quanto possível e aleatorizar ordem das variantes para reduzir efeitos de aprendizagem e novidade.

**Critério de produto:** cada ação obrigatória deve ou (a) avançar claramente até ao objetivo ou (b) representar escolha estratégica com consequência. Caso contrário deve desaparecer ou tornar-se opcional.

**Decisão atual:** dar prioridade à análise do *core loop / momentum* acima da auditoria de coeficientes; nenhuma mudança de gameplay aprovada ainda.

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
