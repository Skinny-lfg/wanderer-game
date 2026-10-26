# Wanderer v0.13 — MASTERPLAN DE IMPLEMENTAÇÃO, LIMPEZA E TESTES

Data: 2026-10-26
Estado: especificação de implementação. Os números são hipóteses a testar, não valores finais aprovados.
Destino: **development exclusivamente**. Não tocar main, produção, saves reais, regras Firebase, Railway deploy ou leaderboard real.
Referências: docs/v013-gameplay-fun-and-expedition-flow-backlog.md; docs/v012-current-only-cleanup.md; docs/v012-engine-unification.md; AGENTS.md.
Baseline conhecido no início desta proposta: development 62637c4f2104089a6e46a33fb2d31297bb987dfc; main 7cd2a91f03844fe6586f84f11fa45723dd9a6001. Branches divergentes. Revalidar sempre SHA antes de escrever.
Missão de produto: recuperar a sensação "Next → progresso → boss", introduzir mapa legível, construir passivos cedo e vê-los destruir hordas, com desafios estratégicos e equipamento permanente. Não construir outro jogo.

## PRÉ-REQUISITO ANTES DA FASE 0 — PARIDADE DE PRODUÇÃO

**Executar primeiro:** `docs/v013-main-parity-codex-handoff.md` — recuperar seletivamente da `main` o fluxo Account registrado, Feedback, leaderboard com perfis/equipamento/Runes e os hotfixes de 25/10. Não fazer merge global; preservar isolated saves/fixtures; não fazer deploy de Firestore Rules; reportar PASS/FAIL. Só depois de validar essa paridade começar a limpeza antiga e as alterações de mapa/combate.

## 0. LEIS DE IMPLEMENTAÇÃO

1. Um parâmetro de cada vez nos testes causais; não mexer simultaneamente em dificuldade, duração, odds de loot e passivos.
2. Preservar 15 Realms no primeiro protótipo; até três affinities, 63 passivos (33 normais+30 híbridos), dois elites e 3–4 eventos, boss final e escolha de Rune 1/3.
3. Preservar no baseline o loot total esperado, Gold e Fragments **por Realm/Expedition**, não multiplicar pagamentos por mob.
4. Nunca atualizar main ou deployar Firebase/Railway; só dados sintéticos sob perfis isolados.
5. Invariantes: non-duplication de recompensas; interrupção/reload durante spawns, entre mobs, ao selecionar passivo, eventos, bag cheia, extração, vitória, derrota; runes e consumíveis; pausa de background, double click, mobile, save leases.
6. Mecanismos novos feature-flagged e reversíveis. Nenhuma migração destrutiva de saves. Antes de protótipo integrado, criar baseline e checklist de testes reais.
7. A palavra "Legacy" num identificador não justifica remoção. Confirmar referências de código, serialização, tests e runtime.
8. Em cada fase entregar relatório PASS/FAIL, SHA, riscos, dados brutos. Não declarar READY sem critérios.
9. Não introduzir mais classes, passivos, equipamentos, moedas, lore, bosses ou sistemas econômicos até recuperação da diversão.
10. Priorizar ritmo, power payoff e legibilidade, não apenas aumento de dificuldade ou da duração.

## 1. FASE 0 — LIMPEZA CONTROLADA E BASELINE

### Achados específicos de development

A limpeza anterior (docs/v012-current-only-cleanup.md) já retirou 63 funções inline, 18 branches classic e módulos obsoletos. A unificação (docs/v012-engine-unification.md) colocou 147 funções de runtime num único módulo especializado. Repetir essas remoções seria redundante.

**Ainda existe compatibilidade/dead path**:
- index.html contém \`setCounts()\` com todos os valores zero e \`setBonuses()\` com \`list:[]\`/\`values:{}\` (linhas aproximadas 388–392). 
- combat/v012-gear-stats.js neutraliza \`effect\` e \`magic\` dos itens equipados para cálculo de combate e preenche \`s.counts\`, \`s.bonus\`, \`s.sets\`; os efeitos permanentes normais NÃO estão operacionais por estes caminhos.
- combat/v012-combat-runtime.js ainda tem numerosos \`s.bonus.*\` e \`s.counts.*\` da era dos sets: \`regenOverflow\`, \`deepFreeze\`, \`fireHeat\`, \`perfectStrike\`, \`sunderExpose\`, \`shieldBonus\`, \`bleedHaste\`, \`regenBonus\`, \`shieldRiposte\`, \`lastBastion\`, \`natureRenewal\`, \`tideSurge\`, \`secondWind\` etc. A maioria é provavelmente unreachable se stats bonus sempre vazio. Mas analisar todos os call paths/fixtures antes de remover.
- economy/v012-equipment-runtime.js ainda grava \`effect:null\` em itens novos; online/v012-save.js valida \`item.effect\` e campos de migração legada; **nunca retirar validação de saves sem separar leitura e escrita/compatibilidade**.
- \`enemy.effect\` (burn/sunder etc) e as 12 assinaturas de Legendary em \`combat/legendary.js\` são sistemas reais ATIVOS e não são o mesmo que o campo antigo \`item.effect\`.
- O combat-runtime assume \`state.run.enemy\` singular; é dependência ativa, não lixo.
- README/AGENTS.md indicam Bag de 6, mas \`index.html\` development atual define \`PHASE3_BAG_CAPACITY=12\`. Corrigir documentação depois de rever testes e branch, sem mudar a capacidade só para concordar com README.

### Operações seguras, nesta ordem
F0.1 Fixar SHA e correr baseline \`npm test\`, browser tests + simulações E1/E10/E50/E200 sintéticas, recolher hashes de resultados.
F0.2 Fazer relatório de referências de \`s.bonus\`, \`s.counts\`, \`item.effect\`, \`magic\`, \`legacy\`, set callbacks, \`setRuntime\`, \`secondWind\`. Classificar C1 ativo, C2 compatibilidade persistência, C3 morto comprovado, C4 incerto.
F0.3 Testes de caracterização: dano/cura/Barrier/poções e passivos nas armas, sem alterações; comparar RNG e reward ledger antes/depois.
F0.4 Retirar blocos C3 em pequenos commits, remover campos da projeção \`stats\` só depois dos últimos consumidores. Preservar formatos públicos de save ou migrar com version gating não destrutivo, sem reescrever saves reais.
F0.5 Provar \`npm test\`, Chromium desktop 1280/1440px + mobile 390/320px; gear Legendary, DOTs, Runes e Cloud Save sintético. Falha obriga rollback desse commit.
F0.6 Congelar a referência v0.12 limpa; não usar código clássico em desenvolvimento para recriar v0.13.

**Gate:** zero regressões e nenhuma alteração de balanceamento, loot, saves ou UX nesta fase.

## 2. FASE 1 — INSTRUMENTAR E FIXAR O RITMO DE TRANSIÇÃO

### Problema atual
Combate completo → popup passivo → regressa à arena concluída → Exit Realm → escolher próximo Realm → Enter Realm. A 4× a navegação pode dominar o combate.

### Mínimo imediato
- Após os últimos hits: contabilizar loot e métricas uma única vez; exibir passivo (se elegível) sobre a arena OU no novo Between sem ecrã resultado obrigatório.
- Após escolha, avançar diretamente para contexto de progressão e próximo caminho; resultado detalhado/log acessível em overlay opcional.
- Escolher caminho num único clique; não exigir Enter Realm depois da escolha se não há alteração pendente.
- Não saltar condições importantes de Bag overflow, poções pendentes, evento e pagamento/resultado de boss. Quando impossibilitado, explicar claramente a razão; nunca avançar com erro silencioso.
- Botão "Pausar entre Realms" / painel de Bag/gear/poções acessível, mas não imposto a cada intervalo.
- Cancelar double-click/reentrância, salvar estado de transição e fornecer opção de recovery.
- Ao terminar evento, manter seleção de recompensa única sem pedir mais Exit.
- Boss final permanece com resumo e Rune; nunca auto-iniciar nova Expedition.

Medições A/B: cliques de mera navegação por transição ~4→~0; decisões efetivas 1 passivo e 1 rota onde existirem; segundos entre último mob e próximo ataque; nº de sessões continuadas.

## 3. FASE 2 — NOVO MAPA, NÃO APENAS MAIS CARTÕES

### Modelo
- Mapa vertical scrollable, como grafo de nós e arestas, de R1 (base) a R15 (boss). Reutilizar as ilustrações e ícones existentes; nenhuma nova arte necessária.
- Nós ligados. Desde R1 o boss e a distância restante são visíveis. Encontros desconhecidos revelam ao avançar de acordo com regras explícitas.
- Bifurcações 2–3 opções apenas quando há decisão real. Segmentos lineares podem avançar automaticamente até à próxima bifurcação importante, preservando pausa manual/Bag/poções/extração.
- Nomes, affinity, ameaça e risco de cada nó sempre coerentes com os parâmetros reais; não apresentar recompensas não implementadas.
- A primeira versão da experiência mantém 15 níveis, 2 elites, 3–4 eventos, boss em R15, rerolls partilhados 3 e modelo max 3 affinities; mapa pode manter o calendário de tipos existente para não alterar loot e efeitos.
- Introduzir \`expeditionMapVersion\`/snapshot local e RNG determinístico derivado de seed, sem guardar estado gráfico calculável desnecessário; persistir rota, entradas e escolhas imutáveis. Uma volta a um Realm não deve rerolar ofertas.
- **Geração sem softlock:** mapear as seis affinities compatível com máximo de três desbloqueadas e os prerequisitos dos passivos, garantindo pelo menos uma rota elegível de cada fork; primeira affinity deve ser escolha livre, e as posteriores não podem ficar bloqueadas pelo layout.
- Quando influências de eventos e rerolls mudam as próximas ofertas, o mapa precisa atualizar somente os nós futuros permitidos, sem mudar recompensas/trechos já visitados. Registrar antes/depois no save com idempotência.
- Para Fase 2, não misturar novo mapa e novos packs; usar o combat engine atual inicialmente.

### Estados de UI
\`locked\`, \`revealed\`, \`eligible\`, \`selected\`, \`completed\`, \`failed\`, \`boss\`. Legenda de ameaças (normal/elite/event/boss), custo de reroll, affinities permitidas e indicador de Boss em X Realms.
- Desktop: mapa central, barra lateral leve com HP/Mana, buffs e Bag; mobile: mapa ocupa a largura e Bag/gear/poções no painel acessível. Tap targets ≥44px, acessibilidade teclado, foco/ARIA, sem jitter.
- Só usar a arte atual como textura/nós; não refazer identidade visual.

### Critérios
10.000–100.000 seeds de mapas sem nós isolados/softlock; 0 calendário inválido; save/reload reproduz grafo e escolhas; 0 mudanças a recompensas RNG no braço "apenas UI". Browser 320/390/768/1280/1920. Não misturar com power ou hordas.

## 4. FASE 3 — COMBATE MAIS LONGO SEM GRIND: TESTAR 2 MODELOS

### Porquê não mudar 2–3 para 20 Waves diretamente?
\`phase1StartWave\` cria um \`r.enemy\` singular; \`phase1WaveWon\` paga Gold/Fragments e rola loot em **todas** as Waves, atualiza ledger e tem atraso de 650ms. Aumento direto multiplicaria loot, moedas, kills, cura "on kill", saves, animações e tempo morto.

### Braço A: gauntlet sequencial, mudança mínima
- 1 alvo ativo; 8–12 micro-inimigos (não 12 payouts) por Realm normal em sequência sem qualquer botão ou render completo entre kills.
- 2–4 "packs de recompensa" ou 1 payout de Realm com orçamento equivalente ao baseline; loot e runes só nos checkpoints válidos.
- Morte de micro-inimigo não dá automaticamente uma heal/reward tradicional de final Wave; definir alcance de \`onKill\` e \`second_breath\`, sem exploit.
- Indicador "Kill X/12" + secção de progresso do Realm, sequência VFX de morte e spawn curta.
- Primeiro verificar se matar muitos inimigos com a mesma build já recupera diversão.

### Braço B: packs com vários inimigos simultâneos, mudança profunda
- 3–5 packs por Realm; 2–4 mobs simultâneos, máximo inicialmente 5 por limitações de visual/performance. 8–20 kills por Realm; não criar 10–20 ecrãs de Wave.
- Cada \`MobState\`: \`id,kind,role,hp,maxHp,atk,defense,barrier,attackCooldown,windup,statuses,position,lootEligible\`; pack: \`id,remaining,spawnBudget,spawnQueue,awardKey,spawned\`.
- Auto-target estável: inicial \`frontmost\` ou \`lowestHP\`; manter alvo até morrer/ficar inválido para não alternar freneticamente. Não pedir manual aim.
- MVP primeiro só single-target com vários mobs presentes e a atacar, depois AoE e spreads derivados de habilidades existentes. Orçamento A/B hipotético para 3 mobs: HP individual 25–40% de referência; DPS individual 20–30% de referência; ameaça agregada e TTK ajustados por simulações, nunca multiplicar ataque ×N sem compensação.
- Evitar ataques simultâneos invisíveis: espaçar windups iniciais, fila de hit impacts e VFX sincronizado por \`mobId\`.
- Bleed/Burn/Rot, slow e debuffs por mob; converter APIs \`damage(enemyId,...), dot(enemyId,...), onKill(enemyId,...)\` mantendo adaptadores de alvo único onde usados.
- Mudar \`phase2Context\`, \`updateFight\`, \`weaponAttack\`, Legendary procs e popups/HP para trabalhar com \`currentTargetId\` e \`enemies[]\`.
- \`onKill\` do Buildcraft atualmente usa \`waveKey\` para não repetir; separar \`mobId\` de \`rewardCheckpoint\`. Balizar \`hemovore\`/rot recovery, \`second_breath\` e Barrier per kill / per pack para evitar cura ilimitada.
- Não resetar cooldowns/passive runtime por cada kill; manter continuidade; não calcular artificialmente o pior mob alvo como se fosse boss.
- Elite: testar primeiro elite solo, depois elite+1 ou +2 adds só se EHP/dano seguro. Boss: manter solo durante MVP para legibilidade.
- Drops/Fragments/Gold: **payout por pack/checkpoint ou por Realm**, limitado ao orçamento v0.12 do nível; explicitamente 0 duplicações se refresh entre kill e payout.
- Checkpoint seguro ao fim de cada pack e opcionalmente por mob apenas se necessário; gravar seed, fila, IDs e awarding; sobreviver a refresh/crash e duas tabs sem reroll/loot duplicado.
- Cap de floating combat text / status icons e partículas por frame, animações GPU-friendly, detetar queda FPS em mobile.

### TTK, ritmo e espetáculo: alvos iniciais, não fatos
- Testar 25–40s reais por Realm em x4 na primeira build protótipo, monitorizando x1/x2/x4; 15×25–40s ~6–10min combate, sem eventos/menus.
- Início de build: matar mob típico em 2–4s reais de referência (calibrar por velocidade); após power spike, 30–50% menos tempo em packs comuns, mesmo que elites/boss continuem perigosos.
- O "poder" deve acelerar mortes e desencadear efeitos, sem auto-escalar HP inimigo para manter TTK igual em todos os builds.
- Simulações para Ranger/Bow, Staff/Cloth, Wand+Orb/Cloth, Sword+Shield/Plate, Daggers dual/Leather, 2H, Mace; gear comparável, Runes e passivos repetíveis.

## 5. FASE 4 — PASSIVOS E CURVA DE PODER

Problema: 63 passivos, 30 híbridos, mas uma build OP chega perto do boss e é usada pouco tempo.

- Preservar todas as 63 entradas. Auditar ranking de activações, tempo de estreia, utilidade em dano real, cura aproveitada, Barrier absorvida, em número de enemies/pack e por segundo.
- Testar enabling passive ativo logo no início vs adquirido no fim do primeiro Realm (código atual desbloqueia após a vitória inicial).
- Rever o gating de híbridos e pré-requisitos: poder escolher primeiro híbrido significativo aproximadamente até R4–R5 numa build que planeia as affinities e consegue ofertas elegíveis.
- **Meta temporal:** primeira grande interação até ~1/3 do tempo efetivo de combate, deixando ≥50% dos segundos de combate da Expedition para a usar; não exigir build "OP" em R1.
- Versão de draft atual: 14 interrupções/passivo, ~14 picks. Comparar:
  A) 14 picks por 14 janelas, com encontros mais longos;
  B) ~7 janelas em checkpoints com dois picks consecutivos em cada (mesmo orçamento, menos interrupções);
  C) ~7–9 escolhas significativas e crescimento secundário automático dos passivos já escolhidos para manter orçamento de poder, só depois de avaliar alternativas e não criar exploits.
- Preservar rank caps (Rank 5 numéricos, Rank1 únicos), limites 3 hybrids/pares e sistema Magic Element. Não adicionar 63 novas evoluções; híbridos existentes são "evoluções".
- Evento/híbrido/proc visual e resumo mostrando contributos para "momento poderoso" em vez de 20 popups de upgrade.
- Passivos dependentes de kill, cooldown e de DOT têm de ser reavaliados especificamente para multi-target antes de produção.
- Boss resiste sem neutralizar sistematicamente o pico de poder. Vitória é estratégia + preparação, não apenas DPM.

## 6. FASE 5 — ECONOMIA, MAPA E LONGITUDINAL

- Só rever odds/custos depois de estabilizar ritmos, mapa e orçamento de loot; não ajustar Forge, Merchant, Apothecary conjuntamente com hordas.
- Simular 30/100 runs por perfil, E1/E10/E20/E50/E100/E200 com loot realista, stash, bag, potions, deaths, extracts e gastos, não equipamento artificial sempre perfeito.
- Guardar loot total por Expedition e perdas equivalentes ao baseline de risco; ajustar receita por **pack** de modo que mais kills não produza inflação ×5–×10.
- Mapas: no primeiro braço Elite/eventos mantêm calendário; posteriormente testar risco por rota sem mudar taxa total de loot.
- Abordar caps e speedrun D200 apenas depois do fun loop estabilizado.

## 7. MATRIZ DE TESTES DE LONGA DURAÇÃO (EXCLUSIVAMENTE SINTÉTICOS)

### Escala e passes
A. Smoke determinístico: 100 seeds de mapa, 5 builds × 6 Expedition tiers, reload em cada transição → PASS sem duplicação.
B. Balance inicial: ≥10.000 Expedições por variante, divididas em 5 arquétipos e E1/E10/E20/E50/E100/E200, com RNG emparelhado onde possível. Medir win/loss, TTK/kill, DPS/EHP, passivos, overflows, loot, drops e performance.
C. Stress prolongado: cenários parametrizados de 60/120/180 minutos **executados apenas por comando/workflow explícito**, nunca contra produção. Usar seeds e budgets fixos, checkpoint a cada período para relatório parcial e timeout controlado.
D. Browser: 320,390,768,1280,1920 px, velocidades 1×/2×/4×; CPU throttle, reload durante spawn/elite/status/salvamento, double clicks, aba oculta, 2 tabs sintéticas.
E. UX qualitativo: 5 players novos e 3 habituais, sessões 20–30min sem coaching, comparar 3 braços aleatorizados em ordem; "quero outra Expedition?", "a build ficou OP?", "por quanto tempo a usei?", "sei porque morri?", tempo em menus vs combate.

### Métricas / gates
- Invariantes técnicos: 0 loot duplicado, 0 saves reais tocados, 0 softlocks de mapa, 0 crashes, 0 avaliações sem alvo válido, resultado idempotente.
- Mapas: 100% têm caminho válido até boss, todos os forks oferecem pelo menos um próximo nó válido, 2 elites + 3–4 eventos por percurso no braço baseline.
- Equilíbrio: tempo de jogo e winrate comparados à referência, não mudar >15 pontos percentuais de taxa de vitória entre perfis comparáveis sem explicação e aprovação.
- Diversão: ≥50% dos segundos de combate pós-primeira sinergia forte; menos cliques cerimoniais; jogo não interrompe durante uma sequência de mobs; ≥3 de 5 novos players querem outra tentativa espontaneamente (meta piloto, não estatística conclusiva).
- Técnica/performance: P95 frame time mobile, erros JS, duração efectiva, memória, VFX; escolher limites reais com profiling de dispositivos-alvo, evitar impor FPS 60 como prova se telefone de teste estiver throttled.

### Logs brutos propostos
\`runId, seed, scenario, build, gearTier, expeditionTier, mapVersion, stage, realm, pack, mobId, gameSeconds, realSeconds, killed, sourceOfDamage, dots, activations, earnedGold, earnedFragments, earnedGear, chosenPassive, chosenRoute, extracted, saveCheckpoint, duplicateAwardRejected, fpsEstimate\`.

### Exit gates por fase
F0: paridade comprovada após limpeza.
F1: flow rápido sem alterar resultados.
F2: mapa navegável, persistente, sem softlocks.
F3: gauntlet satisfatória; packs multi-mob estáveis e loot conservado.
F4: builds fortes cedo e impacto percebido.
F5: economia longitudinal sem inflação, UX testada, performance mobile.

## 8. SEQUÊNCIA DE FICHEIROS A ALTERAR APÓS OS GATES

- \`combat/v012-gear-stats.js\` + \`combat/v012-combat-runtime.js\` + \`index.html\`: F0 limpeza de hooks de sets comprovadamente inativos, com snapshot tests.
- \`online/v012-expedition-runtime.js\`, \`index.html\`, CSS da fase UI: F1 transição do fim do Realm para mapa sem dois botões redundantes.
- \`online/v013-expedition-map.js\` (NOVO), \`online/v012-expedition-controller.js\`, \`online/v012-persistence-runtime.js\`, render entre Realms: F2 grafo de rota em save isolado, sem regressão de calendário.
- \`combat/v013-encounter-model.js\` (NOVO), \`combat/v012-combat-runtime.js\`, \`online/v012-expedition-runtime.js\`: F3 gauntlet, depois múltiplos inimigos/packs e payout por checkpoint.
- \`combat/v012-buildcraft.js\`, \`combat/legendary.js\`: F4 suporte targets multi-mob, proc/kill cap, híbridos, tempo de aquisição; evitar mexer no catálogo antes de resultados.
- \`economy/v012-equipment-runtime.js\`, \`economy/v012-loot-rules.js\`, \`online/v012-save.js\`: somente se necessário para controlo de drop/reward e schema versionado; preservar compatibilidade.
- \`tests/v013-*.test.cjs\`, \`scripts/v013-*.cjs\`, .github/workflows/testes-explicitos: cada passo com fixtures de segurança e simulações.
- \`README.md\`, \`AGENTS.md\`, relatórios versionados: atualizar contratos de v0.13 APÓS produto aprovado. Não alterar AGENTS simplesmente para tornar testes de v0.12 inconsequentes.

## 9. RESULTADO ESPERADO PARA O JOGADOR

Camp → Escolher build/equipamento → Mapa de 15 Realms com boss visível → Clicar ramo quando bifurca → Combate automático em packs contínuos, mobs a morrer rapidamente e recompensas agrupadas → Evolução de passivos em momentos de checkpoint, com tempo real para desfrutar → Alguns eventos/elites interrompem porque a decisão importa → Boss conclui arco de 15 Realms → 1 de 3 Runes, resumo útil, recomeçar. O jogador continua com opção de gerir Bag/gear e extrair, mas não é obrigado a navegar em círculos.

## 10. REGISTO DE EXECUÇÃO

- Este ficheiro é especificação. Não representa implementação completa nem aprovação para produção.
- Em cada tarefa, apontar aqui commit, teste executado, resultado e problemas conhecidos. Evitar "PASS" baseado apenas em leitura de código.


## 11. EXECUÇÃO INICIAL — 26/10/2026

- Criado \`online/v013-map-prototype.js\`: modelo de grafo determinístico e isolado com 15 Realms, 41 nós, 78 ligações, 2 Elites e 3–4 eventos por percurso, boss em R15. Hints de affinity não são ofertas reais nem respeitam ainda o limite de 3 famílias; INTEGRAÇÃO PENDENTE.
- Criado \`experiments/v013-map-prototype.html\`: laboratório interativo de navegação sem saves, rewards, Firebase ou combate. **Não está integrado na UI de jogo.**
- Criados \`tests/v013-map-prototype.test.cjs\` e \`scripts/v013-map-stress.cjs\` para invariant/seed/reachability. Verificação JS local no conector: 2.000 seeds PASS. GitHub Actions de mapa (run 40289569594): PASS incluindo 10.000 seeds e check anti-live import.
- Criado \`docs/v013-legacy-cleanup-inventory.md\`: lista C1 ativo, C2 compatibilidade, C3 candidato morto, C4 incerto; nenhuma remoção de runtime realizada.
- Os testes nativos de v0.12 no GitHub Actions (run 40289569469) passaram na branch development após a criação destes ficheiros, demonstrando ausência de regressão no arranque do protótipo isolado.
- Início da bateria baseline extensa v0.12 por workflow existente \`development-tests.yml\`: browser, VFX, builds E10/E50, simulação v0.12 e auditorias coverage/armor/12 legendary via marcadores neste commit. **Não interpretar o trigger como resultado PASS; verificar execução e artefactos.**
- Nenhum combate multi-mob, novo sistema de passivos, novo mapa integrado ou limpeza de funções legadas foi introduzido no jogo. Main/saves/Firebase/Railway não foram modificados manualmente.
