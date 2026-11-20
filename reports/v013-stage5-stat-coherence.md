# Wanderer v0.13 — Stage 5: coerência dos stats, Gear Power e tooltips

**Data:** 20-11-2026 · **Branch isolada:** `audit/v013` · **Código validado:** [`4c231ddadc`](https://github.com/Skinny-lfg/wanderer-game/commit/4c231ddadcce9b7f591ca7f7b4119fd004018cd1)

**Gate C7 obrigatório:** [run 44736849631](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44736849631) — **4/4 jobs SUCCESS**. [Clean Sheet](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44736849590) e [Forge UI Chromium](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44736849551) também terminaram com **SUCCESS**. O job de sincronização determinística de Pages passou, sem deploy.

## Âmbito e alterações

1. **Um único Gear Power derivado:** `combat/v012-gear-stats.js` deixa de calcular o score duas vezes. A fórmula definitiva é apenas `power(result)`, após atributos, equipamento, Runes, talentos e efeitos temporários. Eliminados o placeholder `synergyPower=0` e o comentário de set tiers que já não correspondiam ao jogo.
2. **Spell Power físico de Decay:** o índice de Gear Power passa a contabilizar o Spell Power **já ativo** por `phase2Decay` quando se usa uma arma não mágica. Antes, o motor calculava o Spell Power e os efeitos de Rot podiam usá-lo, mas o score ignorava-o. **Nenhum coeficiente de combate mudou.** O índice permanece apenas uma heurística de comparação de equipamento dentro da mesma build, não uma classificação entre Affinities.
3. **Stats visíveis:** a grelha do Inventory passa a mostrar Mana, Mana regeneration e Spell Power com qualquer tipo de arma sempre que esses recursos existem, em vez de os esconder por não ser Staff/Wand.
4. **Tooltips e acessibilidade:** 16 definições para os stats atuais, com `title` e foco de teclado nos valores, e um `Stat guide` recolhível dentro de `Bonus sources` para acesso em dispositivos táteis. Attack Power menciona Fervent Life; Health menciona Vitality/Aegis; Spell Power menciona Magic/Decay e Aegis Barrier. Gear Power declara explicitamente os fatores incluídos e as sinergias que não mede.
5. **Texto histórico removido:** `Base includes allocated attributes` foi substituído pelo fluxo real de stats do Talent Tree v15: atributos iniciais, equipamento, Runes, talentos e efeitos temporários, **sem distribuição manual de atributos**. `Upgrade/Downgrade` na comparação resumida passam a `Higher/Lower estimate`.
6. **Pages e proteção:** `docs/combat/v012-gear-stats.js` espelha a fonte; `docs/index.html` mantém as diferenças deliberadas do builder isolado e atualiza o hash SHA-256 de cache do módulo Gear Stats. Acrescentados testes nativos em `tests/v013-stat-consistency.test.cjs` para Decay físico, score, valores apresentados, mensagens acessíveis e paridade de Pages.

## Evidência final executada no GitHub Actions

| Suite | Resultado |
|---|---:|
| v0.13 principal, incluindo dois testes novos Stage 5 | **332/332 PASS** |
| Simulador nativo e paridade | **7/7 PASS** |
| Talent Tree v15, 343 nós | **79/79 PASS** |
| Combate, Elites, Bosses, progressão e builds | **94/94 PASS** |
| Integração, economia, checkpoints e stats | **85/85 PASS** |
| Stage 2 — comparação Aegis/Barrier | **48 cenários válidos; 0 erros/timeouts** |
| Stage 3 — Vitality/Decay | **48 cenários válidos; 0 erros/timeouts** |
| Stage 4 — seis ligações híbridas | **48/48 encontros normais válidos; 96 stress (77 vitórias, 19 mortes; 0 erros/timeouts)** |
| C7 segurança/Auth/Firestore, browser, paridade Pages | **4/4 jobs SUCCESS** |
| Clean Sheet (scanner + browser) | **2/2 jobs SUCCESS** |
| Forge Chromium | **1/1 job SUCCESS** |
| Pages source/generated parity | **`C4_SOURCE_DOCS_PARITY=true`** |

A aprovação do scanner Clean Sheet não equivale a dizer que todos os diagnósticos exploratórios históricos desaparecem: o job inclui diagnósticos cujo histórico ainda tem falhas classificadas. A suite obrigatória C7 passou integralmente no commit indicado.

## Limitações e passagem ao balanceamento

- **Gear Power não é DPS nem um índice total de força.** Não incorpora diretamente Evasion, Barrier gerada/absorvida, Ward Strength, cura, regeneração, Mana regen, DoTs, bosses/minions ou estratégias de decisão. Continua impróprio para comparar builds de famílias diferentes como se fosse um ranking de vitória.
- **Aegis puro com arma física pode continuar com 0 Spell Power na derivação atual.** O Stage 2 preservou deliberadamente esse caso na baseline; Spell Power surge em build física quando Magic ou Decay é desbloqueado. Fazer o Aegis puro ganhar Spell Power a partir de equipamento/Intellect sem essa Affinity mudaria o combate, exigiria testes e nova baseline; não foi disfarçado como alteração de interface.
- As simulações Stage 2–4 verificam regressões controladas, não equilíbrio global E1–E20, representatividade de políticas humanas ou gameplay em navegadores/dispositivos reais específicos.
- A suite Chromium validou percursos de gameplay e apresentação geral; não constitui revisão visual manual e exaustiva de cada novo tooltip em todos os tamanhos de ecrã.

**Decisão de encerramento:** Stage 5 implementado e aprovado no âmbito técnico acima. Não foram alterados coeficientes de inimigos, loot, raridades, stats de equipamento, progressão de talentos, efeitos de combate, saves, `main` ou versão publicada. Balanceamento global permanece etapa separada.
