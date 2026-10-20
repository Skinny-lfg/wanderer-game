# FASE B — Draft de 3 passivos com Upgrade, Synergy e Discovery

**Fonte:** combat/v012-buildcraft.js (eligible/options/choose), online/v012-expedition-runtime.js (phase6PassiveOptions, phase2ChoosePassive e recompensa), online/v012-expedition-controller.js (families/offers), index.html (cartas), módulos de save/checkpoint.

## Problema concreto
Hoje options() dá prioridade **a passivos ainda não possuídos** se há pelo menos três elegíveis. Isso esconde o upgrade de habilidades importantes, incentiva acumular talentos sem relação e prejudica builds de 2 ou 3 affinities. Além disso, híbridos só podem sair em janelas rígidas da Realm 6/8/10, com risco de perder a oportunidade após desbloqueio tardio.

## B1. Política de draft
Após vencer cada Realm de 1 a 14 (combate ou evento), construir exatamente três opções **distintas, legais e úteis**, com RNG:
1. **Upgrade:** pick aleatório entre passivos próprios de Rank <max e upgrade efetivo mensurável; preferir affinity da Realm. Starters Rank1 são candidatos a R2..R5. Se não existir, fallback para passivos desbloqueados de outras affinities.
2. **Synergy:** pick aleatório que faça sentido com o que já existe (Bleed, Rot, Crit, Block, Barrier, Heal, Cast, Mana, Poison, Burn, Static). Se houver um híbrido legal, pode ocupar este slot sem garantir qual. Skills preparatórias só são apresentadas se tiverem função real desde já ou se houver uma evolução viável durante a Expedition. Se impossível, fallback legal.
3. **Discovery:** passivo NOVO aleatório e elegível da affinity da Realm; se indisponível, de outra affinity já desbloqueada. Não forçar nova affinity; o máximo de 3 e a seleção de Realms continuam separados.

A ordem das três cartas é embaralhada no ecrã para não ficar previsível. Etiquetas discretas “Upgrade”, “Synergy”, “Discovery” podem ajudar a compreender a oferta, sem revelar RNG nem ocupar muito espaço.

**Fallback e anti-exploit:** escolher sem reposição, sem ID duplicado, sem oferecer um ID em Rank máximo nem oferecer segundo híbrido do mesmo par; se determinada categoria estiver vazia, preencher a partir da união dos outros candidatos legais. Se restarem menos de 3 IDs legais, retornar erro controlado e conservar o checkpoint (não selecionar candidatos falsos). Em condições normais de 15 Realms não deve ocorrer.

## B2. Escopo da pool
- Preferir sempre candidatos da **affinity da Realm concluída**. Só recorrer a outras famílias já conquistadas se faltar variedade, ou se a carta Synergy beneficiar uma combinação real com a família da Realm.
- Candidato de uma affinity só existe depois de **ganhar a primeira Realm dessa family** (unlockedFamilies), nunca apenas por ter visto a opção na seleção.
- Magic: Fire/Frost/Lightning só oferece cartas do elemento que o jogador selecionou para toda a Expedition.
- É proibido oferecer talentos puramente sem efeito atual, com cooldown sem trigger ou benefício final 0 por caps. Talentos de preparação podem ter flag “Preparação” quando abrem caminho concreto a híbridos ainda na run e um componente útil de imediato.
- O primeiro sucesso numa nova affinity concede **starter Rank1 automático + draft normal de 3 opções NA MESMA Realm**. Não substituir o draft pelo starter nem oferecer starter antes da vitória. A partir da Realm seguinte pode voltar à mesma family sem novo starter.
- Preservar comportamento de duas ofertas da mesma affinity, repetições consecutivas e limite de 3 families por Expedition.
- O draft completo, seed/estado de RNG, categorias e elegibilidade gerada devem ser **persistidos atomicamente**, sem recriar cartas com refresh, double-click, troca de ecrã ou reconexão. O jogador ganha uma escolha por Realm, nunca várias.

## B3. Híbridos: retirar bloqueio rígido das janelas
- Híbridos Rank1 requerem **ambas** as famílias já desbloqueadas por vitória e requisitos reais de proc.
- Primeira oportunidade a partir da Realm **5**, sem depender exclusivamente de 6/8/10. Se a segunda família for desbloqueada na Realm 12–14, abrir oportunidade **nesse mesmo draft**.
- Respeitar a regra já acordada: **máx. 3 híbridos distintos por Expedition e 1 híbrido por par de famílias**. Dos 2 híbridos existentes para cada par, adquirir um bloqueia o outro até fim da Expedition. Repetir a mesma habilidade híbrida nunca é válido (Rank1).
- RNG inicial dentro da carta Synergy: quando existem híbridos elegíveis, escolher do pool com 35% de probabilidade (calibrar mais tarde); o restante vem de outros passivos que interajam com a build. Não garantir nenhum ID exato.
- **Pity contextual por par:** depois de **2 drafts elegíveis consecutivos** em que nenhum híbrido desse par apareceu em qualquer carta, o **3.º draft elegível** deve incluir um dos híbridos legais do par (qual escolhido por RNG). A contagem considera apenas drafts com famílias/trigger válidos e é consumida quando se apresenta a carta (não quando o jogador a escolhe). Guardar counters por chave canonical “aegis:magic”, “blood:decay”, etc., ordenada alfabeticamente.
- Limitar a **uma carta híbrida em cada draft** enquanto houver outros candidatos legais, para o draft não ser ocupado por opções de alto impacto do mesmo tipo.
- Se vários pares atingirem pity simultaneamente, selecionar o par por política RNG seeded e transportar os counters dos outros pares para próximo draft elegível. Não prometer híbrido que viole limite global/por par.
- O mínimo de Realm5 não pode bloquear uma segunda family obtida mais tarde: o seu primeiro draft elegível após desbloquear já é válido, inclusive Realm14. Realm15 (Boss) não dá draft normal.

## B4. Candidatos Synergy e prerequisites testáveis
Criar tags estáveis das habilidades no catálogo em vez de adivinhar apenas por família:
- PRODUCE_BLEED / CONSUMES_BLEED (Bleeding Edge, Sanguine Fury, Hex Bleed, Hemal Sigil, Blood Drinker, Plague Rupture).
- PRODUCE_ROT / CONSUMES_ROT (Toxic Touch, Toxic Precision, Rot, Venom Shatter, Blight, Hex Bolt).
- CRIT_SOURCE / CRIT_PAYOFF (Precision, Brutal Critical, Adrenaline, Crimson Rush, Reaper's Cadence).
- BARRIER_SOURCE / BARRIER_PAYOFF (Barrier Pulse, Rot Ward, Blood Ward, Runic Shield, Retaliation, Rot Husk, Prismatic Rebound).
- HEAL_SOURCE / HEAL_PAYOFF (Renewal, Life Bloom, Blood Drinker, Sanctuary, Life Conduit).
- FUNDED_CAST / MAGIC_PAYOFF (Magic element starter, Staff/Wand ou cast financiável, Elemental Force, Arcane Echo, Spell Surge).
Cada passivo pode pertencer a várias tags. O candidato Synergy é legal se o seu **trigger** for satisfazível agora; caso de preparação, mostrar essa condição de forma explícita.

**Exemplos:**
- Blood + Decay com Bleed/Rot disponíveis: Plague Rupture ou Carrion Detonation elegíveis; não oferecer antes de ambos os estados serem geráveis.
- Vitality + Aegis com Renewal: Sanctuary tem cura funcional, mesmo sem Barrier Pulse (gera Barrier).
- Aegis + Fury com Guarded Block: Counterstrike ou Iron Reversal, escolher no máximo um.
- Blood + Aegis sem Block nem Barrier: NÃO oferecer Sanguine Reprisal se nunca vai disparar.
- Magic + Fury sem casts funded: Spellblade / Spell Surge não devem aparecer como funcional.
- Uma skill em cap Rank5 não aparece em nenhuma das três cartas, mesmo se marcada Upgrade/Synergy.

## B5. UI e persistência
- Cada opção mostra Nome, affinity e rank (ex. 2 → 3 / 5 ou “UNIQUE”), ganho real do rank seguinte e trigger; híbridos identificam as duas affinities e a condição.
- Não repetir frase obsoleta “Ranks unlimited”; não apresentar dois modais, nem “Realm Cleared” adicional. **Conclusão → starter se necessário → draft → EXIT REALM**.
- Entre Realms: mostrar ranks atuais, os híbridos escolhidos e o progresso de 3 families (compacto, sem reestruturação extensa).
- Eventos que oferecem passivos alternativos usam o MESMO validador e caps do draft; previnem bypass por caminhos legacy.
- Compatibilidade com checkpoints de builds antigas >Rank5 ou híbridos repetidos: permitir terminar como legacy sem invalidar save, com effectiveRank capado, ou migração determinística com testes; nunca sobrescrever saves reais durante validação.

## B6. Testes exigidos
1. 1000+ seeds: 3 cartas distintas/legais; nunca overcap, nunca starter pré-combat, nunca mais de 3 famílias/3 híbridos/1 por par.
2. 1st Realm: starter Rank1 automático + 1 escolha normal imediatamente; refresh/duplicate click não gera segunda recompensa.
3. Upgrade aparece quando elegível; Synergy pode melhorar combos; Discovery abre escolhas alternativas; nenhuma categoria vazia quebra UI.
4. Híbrido elegível depois de segunda família na Realm12 aparece até Realm14 por pity condicional, sem dar escolha extra depois do Boss.
5. O draft restaurado byte-a-byte do checkpoint não muda após refresh; save validator aceita novo formato e checkpoint antigo preservado.
6. Comparação de distribuição do draft vs baseline atual: percentagem de upgrades relevantes, vezes que combo fica disponível até Realm10/14, picks sem trigger e diversidade de resultados. Reportar métricas, sem reajustes automáticos.
