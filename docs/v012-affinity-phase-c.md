# FASE C — 30 híbridos completos, triggers, sinergias e testes

**Estado:** especificação para Codex, sem implementar nesta etapa. 15 pares de affinities × 2 habilidades alternativas = **30 híbridos Rank 1**. Preservar IDs e categorias; esta baseline numérica será testada depois. Não adicionar novas famílias, features de boss/evento nem Expeditions infinitas.

## Regras globais
- Até **3 híbridos distintos** por Expedition, no máximo **1 híbrido escolhido para cada par** (ex.: Blood+Decay tem Plague Rupture OU Carrion Detonation, não ambos).
- As duas affinities devem ter sido efetivamente desbloqueadas por vitória. Respeitar triggers e pré-requisitos funcionais, não apenas family tags. Utilizar o gating contextual/pity da Fase B.
- Todos são **Rank1/Unique**. A habilidade só pode ser adquirida uma vez e não aparece novamente para upgrade.
- DoT consumido: aplicar dano restante da stack uma só vez e removê-la; não manter ticks fantasmas, não double-count em refresh nem na morte.
- Todos os procs usam cooldowns e guardas antirrecursão. Hit extra não ativa novos hits/crits; funded casts só quando Mana foi efetivamente gasta. Caps do combate mantidos.
- A vantagem deve vir de uma **interação entre 2 sistemas** (Bleed+Rot, cura+Barrier, ataque+spell), não de dar +15% global apenas por possuir duas affinities.

## Catálogo de 30 habilidades

### Par 01 — Blood + Decay (alternativas)
- **plague_rupture — Plague Rupture:** critical contra inimigo com Bleed e Rot ativos: burst = min(55% do hit base, 3,2% do HP máximo inimigo), ICD8s, **sem consumir os stacks**. Só elegível se Bleed e Rot geráveis.
- **carrion_detonation — Carrion Detonation:** hit com Bleed e Rot: consome **1 stack de cada**, converte o dano restante desses stacks em burst imediato + min(25% base, 2% HP máx inimigo), ICD8s. Não dar a conversão e os ticks consumidos em simultâneo.

### Par 02 — Blood + Aegis
- **blood_ward — Blood Ward:** enquanto o alvo tem Bleed, gera Barrier de 2,2% MaxHP do jogador a cada 5s. Precisa de fonte real de Bleed.
- **sanguine_reprisal — Sanguine Reprisal:** Block real ou absorção real por Barrier prepara o próximo hit: Bleed=30% base mais dano direto extra de 18% base, uma carga máxima; exige Block ou fonte de Barrier funcional.

### Par 03 — Blood + Vitality
- **hemovore — Hemovore:** matar alvo ainda com Bleed ativo cura 4% MaxHP. Capturar o estado do inimigo ANTES da limpeza dos efeitos na morte.
- **crimson_pact — Crimson Pact:** com HP >20%, pagar 2% MaxHP do próprio jogador e aplicar Bleed de 32% base, ICD8s. Custo não pode matar; não ativa cura/barreira por pagar HP.

### Par 04 — Blood + Fury
- **crimson_rush — Crimson Rush:** Critical contra inimigo com Bleed dá hit suplementar de +15% base, sem ser ataque recursivo nem gerar outro Crit.
- **reapers_cadence — Reaper's Cadence:** Critical em alvo com Bleed e HP <=50% causa burst min(22% base, 2% HP máx inimigo) e repõe 2 Mana, ICD7s.

### Par 05 — Blood + Magic
- **hex_bleed — Hex Bleed:** cast elemental financiado aplica Bleed =11% Spell Power, ICD3s; não disparar em casts gratuitos nem em Arcane Echo.
- **hemal_sigil — Hemal Sigil:** cast financiado num alvo com Bleed consome **1 stack Bleed**, causando imediatamente o seu dano restante e um efeito: Fire aplica Burn=34% Spell Power, Frost aplica Chill=2,5s (limite boss preservado), Lightning burst min(56% Spell Power, 3% HP máx inimigo), ICD6s.

### Par 06 — Decay + Vitality
- **rot_recovery — Rot Recovery:** ao matar inimigo com Rot ainda ativo, cura 4% MaxHP; capturar estado antes de limpar Rot.
- **rot_symbiosis — Rot Symbiosis:** tick de Rot real no inimigo cura 1,8% MaxHP do jogador, ICD6s, sujeito a Healing Reduction.

### Par 07 — Decay + Aegis
- **rot_ward — Rot Ward:** Rot a dar ticks cria Barrier de 1,8% MaxHP a cada 5s, respeitando Barrier cap.
- **rot_husk — Rot Husk:** Barrier realmente quebrada por ataque, com Rot ativo no inimigo, gera uma nova Barrier de 3,5% MaxHP, ICD9s. Não dispara apenas quando Barrier estava em zero; requer gerador de Barrier.

### Par 08 — Decay + Fury
- **toxic_precision — Toxic Precision:** Critical real aplica Poison=11% base e uma stack Rot=6% base (com Virulent Rot), ICD2s; não desencadear novo critical.
- **venom_shatter — Venom Shatter:** Critical em inimigo com Rot consome 1 stack e causa o seu dano restante + burst min(20% base, 1,5% MaxHP do alvo), ICD5s. Sem dupla contagem.

### Par 09 — Decay + Magic
- **hex_bolt — Hex Bolt:** cast financiado contra alvo com Rot dá dano extra 25% Spell Power + dano de 1 tick atual Rot, ICD3s; Rot não é consumido. Não aplicar em Echo gratuito.
- **elemental_blight — Elemental Blight:** cast financiado em alvo com Rot, ICD7s: Fire consome 1 Rot e faz burst min(32% power + 3×dano do tick Rot, 3,2% MaxHP alvo); Frost prolonga um stack Rot por 2 ticks, limitado a 6 ticks totais; Lightning consome 1 Rot e causa burst min(68% power, 3,5% MaxHP alvo). Não contar o DoT consumido novamente.

### Par 10 — Vitality + Aegis
- **sanctuary — Sanctuary:** Healing REAL (não overhealing) gera Barrier equivalente a 20% do HP efetivamente restaurado, ICD1s; exige healing funcional e respeita Barrier cap.
- **guardians_oath — Guardian's Oath:** uma vez por WAVE quando Barrier é realmente quebrada por dano, cura 4,5% MaxHP. Reset por Wave único (não por refresh ou tick).

### Par 11 — Vitality + Fury
- **fervent_life — Fervent Life:** Critical real cura 2% MaxHP, excesso de cura cria Barrier=50% desse excesso; ICD4s; healing debuff respeitado.
- **redline — Redline:** estando com HP <=50%, hit extra 33% base, ICD8s, mas fica vulnerável e sofre +10% dano recebido durante 3s; cooldown/debuff sobrevivem a refresh.

### Par 12 — Vitality + Magic
- **life_conduit — Life Conduit:** Heal efetivo repõe 4 Mana e prepara próximo funded cast para +10% power, ICD3s, no máximo uma carga; overheal não ativa.
- **lifeweave — Lifeweave:** Mana <30% e HP >20%: sacrifica 3% MaxHP para recuperar 10 Mana, ICD8s; HP cost não ativa passivos de cura e nunca mata o jogador.

### Par 13 — Aegis + Fury
- **counterstrike — Counterstrike:** Block real prepara próximo hit para dano extra de 18% base, consumir uma vez. Exige probabilidade de Block realmente >0, via Guarded Block ou equipamento.
- **iron_reversal — Iron Reversal:** Block real prepara próximo hit para +35% base mas causa +10% dano recebido durante 3s após ativação, sem recursividade; exige fonte real de Block.

### Par 14 — Aegis + Magic
- **runic_shield — Runic Shield:** cast elemental funded gera Barrier =2% MaxHP, ICD3s, dentro do cap de Barrier.
- **prismatic_rebound — Prismatic Rebound:** absorção real de Barrier acumula uma carga até 6% MaxHP (45% do dano absorvido); próximo funded cast liberta min(65% Spell Power, carga) e zera carga. Sem proc recursivo.

### Par 15 — Fury + Magic
- **spellblade — Spellblade:** cast elemental funded prepara o próximo ataque de arma, incluindo Staff/Wand, com dano adicional de 15% do hit base; uma carga, sem free casts/procs.
- **spell_surge — Spell Surge:** Critical real arma o próximo cast elemental funded com dano adicional de 30% Spell Power. Não pode descarregar no mesmo instante/ataque que armou; apenas uma carga.

## Risco e correções cruzadas necessárias
1. Habilidades que produzem o seu próprio trigger (Blood Ward, Rot Ward, Life Conduit, Sanctuary) só são elegíveis se a fonte existir ou se o efeito for imediatamente útil com talento de outra family ativa.
2. Desfazer a dependência de janelas 6/8/10. A lógica de oferta e a ponderação/pity está na Fase B. Não dar 4.º híbrido, nem dois do mesmo par.
3. Vida do Boss não pode ser usada como multiplicador sem limites para bypass: todos os bursts percentuais têm teto e ICD.
4. Se os procs dependem de estado após morte, capturar snapshot de DoTs antes de cleanup; não afetar loot, pontuação nem xp.
5. Status negativos gerados por inimigos não contam como **status de jogador** para desbloquear sinergias; começar Realm não aplica grátis Rot/Bleed do jogador.
6. Os IDs do catálogo estão acima: nenhum híbrido deve ser removido, renomeado, duplicado ou convertido para Rank 2+ nesta fase.
7. Validar as skills elementais e procs de staff/wand, 2H/offhand e o caso de Mana insuficiente.

## Implementação e testes
- Migrar valores propostos para uma fonte única do catálogo/sistema de combate. Cada híbrido precisa de pelo menos um teste de trigger positivo e negativo, ICD, não recursão, resto de DoT e serialização. **30×(positivo/negativo) no mínimo**, mais casos compostos.
- Testar gates para todos os 15 pares com 2 alternativas, máximo de 3 híbridos distintos, 1 por par, compatibilidade com as regras de starter/draft pós-Realm e late unlock.
- Testar dano/healing/Barrier em ambientes normal/elite/boss, redução de cura, cooldown ao sair/entrar e saves após F5.
- Verificar que cada uma das 6 affinities pode criar builds mono e também alcançar combinações duplas/triplas válidas.
- Fazer CI integral sem ajustar outras features. Qualquer falha que já existia antes do rework deve ser documentada e distinguida da regressão.

## Simulações pós-implementação obrigatórias
1. **Primeiro validar E1/E10/E50/E100/E200**, sem ultrapassar o cap nem alterar progressão Endless. Usar motor real, não estimativa linear de dps. Não comparar builds com diferentes tiers de gear/runes.
2. Set de gear: 7 armas × Rare/Epic, equipamento homogéneo para a mesma comparação. Runas: 3 equipadas coerentes com arma e tier; repetir sem runas para ablação.
3. Estratégias: picks aleatórios, foco mono-affinity Rank5, híbridos intencionais 2 famílias, híbridos intencionais 3 famílias. Preparar inteligência de escolha que realmente procura os pré-requisitos, sem inventar passivos ilegais. Usar as **mesmas seeds iniciais** por par de cenários e registar divergência posterior do RNG por rotas distintas.
4. Registar win%, median/P90 das Realms alcançadas, boss clear, duração simulada e tempo real de sessão (se disponível), DPS/burst/DoTs, EHP/MaxHP, resto de HP/Mana, Block/Crit, cura por segundo, Barrier por segundo, triggers e utilidade dos híbridos.
5. Comparar R1…R5 dos 29 passivos com 0/1/2/3 outros talentos complementares; verificar que rank-ups realmente mudam combate sem criar combos infinitos.
6. Diferenciar build realmente sinérgica de build heurística falhada: quando builds duplas/triplas não têm vantagem, reportar **que pré-requisitos faltaram** e **quantas Realms demorou a aparecer o híbrido**, em vez de concluir automaticamente que o híbrido é fraco.
7. Propor correções de balanceamento com dados, **mas não implementá-las automaticamente** nem fazer deploy/merge.

## Entrega exigida do Codex
- Commits por fase A/B/C (branch development), lista dos módulos alterados e relatório CI.
- Matriz de **63 passivos**: ID, max rank, efeito, trigger, teste, PASS/FAIL; nenhum com TODO.
- Métricas de 3 cartas: % upgrades úteis, % synergy funcional, pity ativado, casos impossíveis, rerolls indevidos.
- Relatório de simulação de vitória, DPS, sobrevivência e progresso, separado por armas e families, incluindo exploits e outliers.
- **PROIBIDO:** main, Railway/deploy, Firebase rules, resets ou escrita em saves de utilizadores, novas mecânicas E∞, mudanças de UI não relacionadas com draft.
