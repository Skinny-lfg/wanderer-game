# Wanderer — Em desenvolvimento · Futuras versões a avaliar

> **Estado:** roadmap e arquivo de decisões, não uma autorização para implementar. Atualizado em 17/10/2026.
>
> **Orientação do criador:** congelar a adição de novas funcionalidades, preparar um marco de versão e rever/substituir imagens existentes. Reavaliar as propostas abaixo em conjunto, com simulações, antes de qualquer implementação adicional.

## Situação do marco de versão

- A **`main`** pública permanece na **v0.9.2**; a branch **`development`** já contém trabalho identificado como **v0.9.3**, mas não está publicado na `main`.
- O criador mencionou **“v0.1”** como novo marco; como a sequência atual é v0.9.2 → v0.9.3, **“v1.0”** poderá ser a designação pretendida. **A numeração final está por confirmar**. Não renomear automaticamente a versão, changelog ou tags.
- **Prioridade antes do fecho:** alterações às **imagens já existentes**, a selecionar/validar pelo criador. Não substituir imagens por iniciativa própria.
- Nenhuma alteração de funcionalidades, balanceamento, economia, progressão, saves, reset, regras Firebase ou publicação na `main` está autorizada por este documento.

## Categoria 1 — Implementado em `development`, mas ainda não publicado: avaliar enquadramento numa futura versão

**Estado:** código ou UI já alterados em `development`; **não é uma lista de trabalho por implementar**. A inclusão no próximo marco, a manutenção ou o adiamento deverá ser validada com o criador, sem fazer merge automático.

- **Combat/Buildcraft v0.9.3:** Tier Bonuses cumulativos e efeitos contextuais Critical/Fire/Dark, Regen e Barrier, regras 2H e gear power, odds/procs de affinity e descrições; ver [v093-buildcraft.md](v093-buildcraft.md).
- **Legendary signatures:** 22 identidades Legendary, 19 habilidades específicas, afinidades fixas para especiais, interações com Winterheart, etc.; ver [v093-legendary-signatures.md](v093-legendary-signatures.md).
- **Shatter e Double Strike:** implementados, com tooltips e testes A/B isolados aprovados; ver [v093-shatter-double-strike.md](v093-shatter-double-strike.md). A validação de progressão realista D1–D200 e as interações de late game continuam por aprofundar.
- **Interface, equipamento e QoL:** indicadores NEW, filtros/ordenação de inventory, progressão e reinício de tentativa D200, retratos, avatar e ajustes de Merchant/Forge/combat UI; ver [v093-pre-simulation-qol.md](v093-pre-simulation-qol.md), [v093-visual-polish.md](v093-visual-polish.md), [v093-visual-affinity-update.md](v093-visual-affinity-update.md) e [v093-portrait-refresh-followup.md](v093-portrait-refresh-followup.md).
- **Dungeon offers e qualidade de vida:** reroll pago por escalão, rotação após extração elegível, preservação dos offers e estado NEW; ver relatório v0.9.3 de buildcraft.

**Nota:** não reverter, apagar nem fazer merge destes trabalhos sem uma decisão específica. “Em desenvolvimento” significa **ainda não aprovado para publicação**, não “inexistente”.

## Categoria 2 — Propostas e experiências **não implementadas**: futuras versões a avaliar

**Estado por omissão de cada ideia:** **Por avaliar / Não aprovada para implementação**. Sem versões, prioridades, probabilidades ou números finais atribuídos.

### Combate e balanceamento

- **Burn/Fire:** reavaliar Ignition, Combustion e Searing Pressure; não adicionar sem A/B comparável e validação dos Legendary de Fire.
- **Staff:** rever Arcane Channeling, Arcane Ward e Arcane Burst apenas se houver problema real de equilíbrio; evitar buff universal em Staff.
- **Bow:** eventual Critical Barrier e sinergias críticas, **não aprovado**. A combinação de buffs de Bow/2H/Frost previamente simulada facilitou demasiado a progressão e foi rejeitada.
- **Frost e Daggers:** não adicionar Frostbite/Glacial nem aumentar Double Strike sem avaliar Shatter/Double Strike atuais em equipamento adquirido, elites/bosses, Attack Speed e D1–D200.
- **Equilíbrio de builds:** aprofundar progressão persistente por estilo (casual/experienced/speed), Legendary reais, farming, mortes, gear legal, combinações de 3/2 e 5/5, comportamento de boss/elite e picos de poder. Formular ajustes, apresentar resultados e **pedir aprovação antes de codificar**.
- **Decisões em combate:** estudar uma escolha ativa pontual por build, sem microgestão nem obrigação de trocar equipamento a cada inimigo.
- **Inimigos/bosses:** variantes/telegraphs e resistências moderadas, sem counters absolutos ou complexidade excessiva.

Fontes: [v010-new-abilities-simulation.md](v010-new-abilities-simulation.md), [v010-final-balance-validation.md](v010-final-balance-validation.md), [v010-combat-balance-proposals.md](v010-combat-balance-proposals.md).

### Novas atividades e progressão

- **Eventos entre waves:** Cursed Chest, Elite Ambush, Ancient Shrine; escolhas de risco/recompensa raras, com proteção anti-reroll e sem geração descontrolada de loot.
- **Normal / Dangerous:** modo opcional mais exigente com recompensas contidas e sem tornar Normal irrelevante.
- **Objetivos opcionais:** Bounty, Deep Expedition, Boss Hunter; evitar dailies obrigatórias e FOMO.
- **Farming repetitivo:** explorar mecanismos limitados para diminuir cliques em dungeons dominadas, sem automatizar progressão competitiva.
- **Desafios longos:** temporadas, eventuais objetivos pós-D200, expansão futura (ex.: D1000) e diversidade de progressão; apenas ideias para discussão.

### Forge, afinidades e economia

- **Forge Catalyst:** consumível raro, acumulável, que aumenta a hipótese de Rare/Epic em novas crafts; fontes, probabilidades, limites, custo e impacto na progressão por validar.
- **Affinity Core:** ideia preservada, **explicitamente adiada / NÃO IMPLEMENTAR AINDA**; tentativa de alterar affinity de equipamento, com risco de falha/perda do Core e afinidade, requer auditoria de exploração/economia.
- **Gold / Fragments:** analisar utilidade e sinks no late game, sobretudo após D100/D200, sem criar gastos artificiais.
- **Affinity no Forge:** auditar probabilidades e pools legais por tipo de item; Merchant/loot/Forge devem ter papéis distintos.
- **Drop rates / loot:** analisar equipamento útil, drops efetivamente extraídos e mortalidade, em vez de aumentar percentagens sem validar.
- **Capacidade da stash (ex.: 102/100):** investigar se o excesso é temporário/intencional e ajustar a experiência sem perder automaticamente loot; tratar como **auditoria de bug/QoL**, não feature aprovada.

### Integridade, social e operação

- **Leaderboard e tentativas competitivas:** eventual validação de tempos/resultados no servidor e medidas anti-abuso, sobretudo para desafios futuros; exige projeto e validação prévios.
- **Guest/account recovery:** avaliar ligação de Guest a conta recuperável, com salvaguardas de saves; não migrar contas ou dados sem planeamento.
- **PvP / sistemas sociais e temporadas:** apenas ideias de longo prazo, sem aprovação.
- **Incidentes históricos (D10/extract, wave 6):** reabrir só se forem reproduzíveis em build atual; não assumir que continuam ativos.

### Arte e apresentação

- **Revisão das imagens existentes:** é uma tarefa **pendente do criador para o próximo marco visual**, separada da implementação de funcionalidades.
- **Novas artes de bosses, inimigos e equipamento:** organizar assets por cobertura e aprovação visual; não adicionar imagens ou substituir placeholders sem validação do criador.

## Fora do backlog: trabalho já resolvido / não reabrir sem motivo

- O ajuste anterior aos elites **Berserker** e **Tank/healing reduction** foi indicado como já feito. Não voltar a alterar por causa de propostas arquivadas.
- A simulação de distribuição de loot (10 mil dungeons normais + 10 mil boss, CHA 5/55) já foi executada e passou a validação RNG; uma futura análise da utilidade real do loot é uma pergunta **diferente**.
- A falha legada de teste `deathWave: null` foi corrigida em `development` e `npm test` passou. Não é uma funcionalidade pendente.

## Regras para retomar qualquer uma destas ideias

1. Rever a necessidade com o criador e formular um problema concreto, não apenas uma lista de funcionalidades.
2. Apresentar efeitos, riscos e alternativas; para balanceamento/economia, correr simulações A/B reprodutíveis e avaliar D1–D200, builds legais, sessões normais e extremos.
3. **Só implementar após aprovação explícita**, exclusivamente na `development`; manter `main` sem alterações até autorização de release.
4. Preservar saves reais e regras Firebase; não fazer resets, deployments ou alteração de dados sem pedido explícito.
5. Atualizar o estado da entrada deste documento para **Aprovado**, **Em teste**, **Implementado em development** ou **Rejeitado/Adiado** apenas com evidência e decisão.

**Referência:** o GDD de Wanderer no Google Drive e os relatórios de `docs/` são histórico de ideias e testes; não constituem, isoladamente, autorização de implementação.
