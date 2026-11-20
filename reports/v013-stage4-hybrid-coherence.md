# Wanderer v0.13 — Stage 4: coerência das seis ligações híbridas

**Data:** 20-11-2026 · **Branch:** `audit/v013` · **Código validado:** [`73486814b4`](https://github.com/Skinny-lfg/wanderer-game/commit/73486814b4520efa5cc5f7a6b4ac35f006b6b441).

**C7 final:** [run 44735206786 — 4/4 jobs SUCCESS](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44735206786). **Clean Sheet:** [run 44734838503 — 3/3 jobs SUCCESS](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44734838503) no commit anterior (`b5f989bc54`, antes de uma alteração apenas ao guard do simulador). **Artefacto:** [JSON completo e relatório de simulações](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44735206786/artifacts/14627823848).

## 1. Alteração aprovada — Fury + Vitality / Fervent Life

**Antes:** cura de 2% Max HP em acertos críticos, cooldown 4 s; overhealing cria Barrier igual a metade da cura desperdiçada.

**Depois:** **2% Max HP + 3% Attack Power**, mantendo os acertos críticos, cooldown de 4 s, modificadores de healing e conversão de overhealing para Barrier. A fórmula usa `c.player.stats.attack` no módulo de combate atual; a contribuição de Attack Power é limitada inferiormente a zero e valores não finitos não se propagam. Não há pontos gratuitos, nova Skill ou mudança na Talent Tree.

A descrição de `Fervent Life` no catálogo atual foi atualizada. `docs/combat/v012-buildcraft.js` coincide com a fonte; o C7 verificou paridade de Pages, incluindo a interface e tooltips. Não foi retirado nenhum componente da UI nem deixado um handler órfão.

### Comparação pareada com Stage 3 congelado

Os dados imutáveis do [Stage 3](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44732589453/artifacts/14627391073) foram preservados em `reports/v013-stage3-affinity-freeze.json` **antes** da alteração de Fervent Life. Foram mantidos os mesmos 12 perfis, E5/E35, duas seeds (9101/9201), 24 pontos legalmente gastos, gear Rare, combate nativo Aegis de três inimigos, sem Runes/Boons/Contracts, política `focus`.

| Build | Nível | Cura efetiva/s Stage 3 → Stage 4 | Δ | Barrier, DoT, Mana e Spell Power |
|---|---:|---:|---:|---|
| Fury + Vitality | E5 | 2,80 → 2,86 | +0,06 | Sem mudança nas médias |
| Fury + Vitality | E35 | 3,56 → 3,75 | +0,19 | Sem mudança nas médias |
| Restantes 11 builds | E5/E35 | **Sem diferenças nas métricas comparadas** | 0 | Sem mudança |

**48/48 encontros normais válidos; 0 erros, 0 timeouts.** O reforço é deliberadamente pequeno. Duração e dano recebido podem afetar cura efetiva e overhealing; não equivale a demonstrar que uma build está equilibrada.

## 2. Auditoria das seis ligações reais

Foram verificadas aquisições legais na árvore v15 (24 pontos) e a execução da habilidade de primeiro nível em cada ligação.

| Affinities | Primeiro talento híbrido | Observado no motor | Identidade |
|---|---|---:|---|
| Blood + Fury | `crimson_rush` | 2 ativações | Críticos contra inimigos com Bleed |
| Fury + Vitality | `fervent_life` | 6 ativações | Sustain crítico com Attack Power |
| Vitality + Aegis | `sanctuary` | 34 ativações | Cura converte-se em Barrier |
| Aegis + Magic | `runic_shield` | 17 ativações | Casts financiados protegem |
| Magic + Decay | `hex_bolt` | 10 ativações | Rot + Spell Power |
| Decay + Blood | `plague_spread` | 18 stacks transferidos | Bleed/Rot difundem-se quando o inimigo morre |

Os cinco primeiros números são contagens de `Buildcraft.activated()` observadas no stress. Os **18 de Plague Spread são transferências efetivas de stacks de Bleed/Rot**, observadas nos encontros normais e de stress; não são diretamente comparáveis a contagens de ativação.

**Plague Spread é uma função ativa do controlador de mortes**, não da API de Buildcraft. Foi acrescentada a métrica `plagueSpreadTransfers` no próprio caminho nativo, contabilizando apenas cópias realmente aplicadas; a interação visual de Bleed/Rot foi preservada. Uma stack transferida continua marcada `spread:true` e não pode propagar-se novamente. Não foi criado sistema alternativo ou mecânica duplicada.

O novo `scripts/v013-stage4-hybrid-review.cjs` exige evidência positiva das seis ligações; se alguma deixar de produzir o efeito nos cenários fixos, o CI falha.

## 3. Stress com Elites e Bosses

**96 cenários adicionais** (12 builds, E5/E35, seeds 9101/9201, encontros Elite ou Boss Aegis de risco Normal, gear Rare, decisões controladas de target com política `mechanics`). Não representam uma progressão de conta com loot adquirido.

| Grupo | Encontros | Vitórias | Mortes | Erros/timeouts |
|---|---:|---:|---:|---:|
| Builds puras — Elites | 24 | 24 | 0 | 0 |
| Builds híbridas — Elites | 24 | 24 | 0 | 0 |
| Builds puras — Bosses | 24 | 14 | 10 | 0 |
| Builds híbridas — Bosses | 24 | 15 | 9 | 0 |
| **Total** | **96** | **77** | **19** | **0** |

Nas seis combinações híbridas, os resultados contra Boss Aegis foram: Blood+Fury **2/4**, Fury+Vitality **2/4**, Vitality+Aegis **4/4**, Aegis+Magic **4/4**, Magic+Decay **2/4**, Decay+Blood **1/4**. Os Elites foram derrotados em 4/4 casos por cada uma das seis builds.

**Pistas para a fase de balanceamento, não decisões de nerf/buff:** as duas combinações com Aegis foram mais resistentes nesta pequena amostra, e Decay+Blood parece depender mais de múltiplos inimigos (Plague Spread não ganha alvos adicionais num Boss isolado). Blood+Fury teve poucas ativações de Crimson Rush. Estes resultados não permitem atribuir causalidade a um talento ou generalizar para outras seis Affinities de Boss.

## 4. Código, testes e validação

- `combat/v012-buildcraft.js` / `docs/combat/v012-buildcraft.js`: um único caminho Fervent Life atualizado e tooltip coerente.
- `online/v012-expedition-runtime.js` / `docs/online/v012-expedition-runtime.js`: transferências de Plague Spread medidas sem alterar os coeficientes nem criar nova interface.
- `scripts/simulate-progression.cjs` e `scripts/v013-affinity-baseline.cjs`: propagação da nova métrica real do Dungeon até aos resultados.
- `scripts/v013-stage4-hybrid-review.cjs`: comparação pareada imutável Stage 3, prova de todas as seis skills e stress de 96 encontros. Comando: `npm run simulate:v013:affinities:stage4`.
- `tests/v013-stage4-hybrid-links.test.cjs`: testes de aquisições legais, proc de seis ligações, cooldown, cura por Attack Power, overhealing, VFX de Plague e paridade das cópias geradas.

**C7 final: 330/330 testes principais; 7/7 simulador, 79/79 Talent Tree, 94/94 combate/Elite/Boss, 83/83 integração/economia**, além de Auth/Firestore emuladores, Chromium, fluxo de feedback, Boss e extração, e paridade exata `docs/`. Todos os 4 jobs foram aprovados. O scanner Clean Sheet teve 3/3 no commit anterior à última alteração de guard do simulador (sem alterações adicionais ao runtime).

Identificadores dos dados finais: `sourceSha256=71b0a9d16f6e7af0b7cced145b5bd694b428fd6200c76f3855e5e63c0859212f`; `replaySha256=7f8a8574a1b25d404ac9c06f17c46479a485029769279aa656e262c3ef8972a1`. O [artefacto do C7](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44735206786/artifacts/14627823848) contém as 48 linhas normais de comparação, 96 linhas de stress, fingerprints de itens, seeds, resultados e provas de ativação.

**Limites:** apenas duas seeds e dois níveis, um único tipo de Boss (Aegis) e só encontros controlados; não demonstra equilíbrio global, nem progressão natural E1–E20. Balanceamento do restante Fury/Vitality, efeitos em Bosses de outras Affinities e UI do indicador Power pertencem a etapas seguintes.

**Sem merge, deploy, mudanças a `main`, alteração de loot/gear, migrações de saves ou introdução de novas mecânicas alternativas.**
