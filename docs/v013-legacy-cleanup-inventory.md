# Wanderer v0.13 — Inventário de código antigo antes de remover

Data: 2026-10-26 · Branch development · **Leitura estática, nenhuma remoção realizada neste documento.**

## O que já foi limpo
- \`docs/v012-current-only-cleanup.md\`: 63 funções inline e 18 branches antigas removidas, entre outros módulos e assets.
- \`docs/v012-engine-unification.md\`: 147 funções de runtime consolidadas nos módulos atuais.

## Matriz de decisão (verificada em development)

| Categoria | Código | Leitura atual | Ação |
|---|---|---|---|
| A — ativo | \`combat/legendary.js\`, \`legendary*()\` em \`combat/v012-combat-runtime.js\` | 12 assinaturas e procs continuam a executar no motor | PRESERVAR; novos packs exigem adaptação |
| A — ativo | \`enemy.effect\`, Burn/Bleed/Rot, Chill, Block/Barrier, \`phase2Context\` | combatentes e temas aplicam status legítimos | PRESERVAR |
| A — ativo | \`state.run.enemy\`, \`weaponAttack\`, \`updateFight\` | modelo mono-alvo central | REFATORAR só na fase de multi-mob |
| A — ativo | \`WandererEconomyV0101\` | quality odds e upgrade Legendary em uso | PRESERVAR, mesmo com nome antigo |
| B — compatibilidade | \`online/v012-save.js\`: \`item.effect\`, campos \`migration\`/\`legacyHistory\` | validados para ler dados históricos; não significa que produzam procs no runtime novo | PRESERVAR enquanto não houver migração segura e testes |
| B — compatibilidade | \`online/v012-persistence-runtime.js\`: \`legacySupplies\` | conversão de consumíveis de sessões antigas | ISOLAR/TESTAR antes de remover |
| C — candidato morto | \`index.html\`: \`setCounts\`, \`setBonuses\` | geram 0 counts e 0 bonus no corrente fluxo v0.12 | Caracterizar, remover somente depois de desacoplar consumidores |
| C — candidato morto | \`combat/v012-gear-stats.js\`: \`main.effect:null\`, \`off.effect:null\`, \`s.sets\`, \`s.counts\`, \`s.bonus\` | efeito/item normal é neutralizado; retorno mantém shape esperado por runtime/UI | Não remover shape antes de modificar todos os consumidores |
| C — candidato morto | \`combat/v012-combat-runtime.js\`: caminhos de \`s.bonus.regenOverflow\`, \`deepFreeze\`, \`fireHeat\`, \`perfectStrike\`, \`sunderExpose\`, \`shieldBonus\`, \`bleedHaste\`, \`regenBonus\`, \`shieldRiposte\`, \`lastBastion\`, \`natureRenewal\`, \`tideSurge\`, \`secondWind\` | sob \`setBonuses\` vazio estes caminhos parecem inatingíveis pela geração corrente de stats | Remover em lotes após teste de paridade com crit/DoT/status e saves |
| D — incerto | \`LEGACY_ICON_TYPES\`, fallback assets antigos | podem ainda ser usados no inventário | NÃO eliminar sem inspecionar referências em runtime/mobile e assets |
| D — incerto | \`statsWidget\` com \`s.counts.crit\`/\`s.bonus.critBonus\` | forma de apresentar crit pode depender de shape legado | Refatorar cálculo e UI em conjunto, sob teste |
| D — doc inconsistente | \`AGENTS.md\`, \`README.md\` 'Bag 6' vs \`index.html\` \`PHASE3_BAG_CAPACITY=12\` | documentação antiga com contrato de teste diferente da implementação | Congelar os testes reais e corrigir documentação, NÃO mexer Bag automaticamente |

## Estratégia de remoção

1. Criar testes de caracterização para \`totalStats\`, stat projection, crit, shield, caster, speed, DOT, cooldown, 1/2 legendaries e save/reload com synthetic saves.
2. Provar que qualquer caminho desativado mantém o mesmo resultado com 100–1.000 seeds, sem tocar RNG de loot ou timers.
3. Extrair as fórmulas ainda usadas do "native combat" antes de apagar estruturas neutras em \`index.html\`.
4. Remover apenas blocos C, em lotes pequenos, com \`npm test\`, browser, VFX, PVP extractor e simulação. Notar diferenças zero numa folha de parity.
5. Classes B e D só depois de testes de consumidores/saves e backup. Arquivar assets não usados sem eliminar assets ainda referenciados por CSS/HTML.
6. Não usar esta limpeza para acrescentar features ou modificar balanceamento: funções de stats e effects removidas têm de provar equivalência 1:1.

## Dependência específica do multi-enemy da v0.13

A v0.13 **não** poderá apenas mudar \`r.enemy\` para array: \`phase2Context\`, \`onKill\`, \`migrateEnemyDots\`, damage caps vs enemy Max HP, procs Legendary, VFX/target e payout terão de suportar IDs individuais e resets em nível pack/Realm. Fazer isto após estabelecer baseline de combate limpo.

## Estado
- [x] Inventário estático e classificação preliminar;
- [ ] Baseline \`npm test\` e Chromium documentados para o commit-alvo;
- [ ] Testes de paridade das referências herdadas;
- [ ] Remoções C por lotes;
- [ ] Relatório de equivalência e atualização de documentação.
