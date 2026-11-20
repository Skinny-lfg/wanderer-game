# Wanderer v0.13 — Stage 2: Aegis + Spell Power

**Estado:** implementado e validado em 20-11-2026. **Branch:** `audit/v013`. **Commit de código validado:** [`5bb7a6079c`](https://github.com/Skinny-lfg/wanderer-game/commit/5bb7a6079c1805e88e4d6fd5197d29c01095bca4). **C7:** [4/4 jobs aprovados](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44730440325). **C6/Clean Sheet:** [3/3 jobs aprovados](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44730440361).

A alteração dá à proteção de Aegis duas fontes de escalamento — Max HP e Spell Power — sem mudar regras de classes sem Aegis, os escalamentos de Wand + Orb, custos de Mana, probabilidades de itens ou balanceamento dos inimigos.

## Regras implementadas

| Fonte | Fórmula após Stage 2 | Regras preservadas |
|---|---|---|
| Afinidade Aegis ao iniciar combate | 5% Max HP + 8% Spell Power | Apenas quem desbloqueou Aegis |
| Barrier Pulse rank 1 | 3% Max HP + 6% Spell Power | 6 s entre ativações; ranks seguintes +0,6% HP e +1,2% SP |
| Runic Shield | 2% Max HP + 8% Spell Power | Apenas casts financiados, incluindo Arcane; cooldown 3 s |
| Arcane Bastion | 3% Max HP + 6% Spell Power | Exige preparação e absorção prévia; cooldown 6 s |
| Prismatic Rebound (limite da carga) | 6% Max HP + 10% Spell Power | Acumula 45% do dano absorvido; consumido no cast; dano permanece limitado por 65% do poder do cast |
| Cap de Barrier com Aegis | Max(8, arredondar(30% Max HP + 25% Spell Power)) | Ward Strength aplicada uma única vez no setBarrier |
| Cap sem Aegis | Max(8, arredondar(30% Max HP)) | **Inalterado** |
| Wand + Orb | 2,5% Max HP | **Inalterado** |

O helper único `barrierAmount` e a regra `barrierCap` estão em `combat/v012-buildcraft.js`. O runtime `setBarrier` continua a ser a única via de aplicação do multiplicador Ward Strength. `online/v012-expedition-runtime.js` calcula a Barrier inicial através desse helper. Os tooltips foram atualizados em **ambas as fontes de Talent Tree atuais** (`combat/talent-catalog.js` e `combat/talent-graph-next.js`) e a descrição da poção foi corrigida em `index.html`. As cópias geradas em `docs/` passaram uma verificação exata de paridade. Não houve remoção de UI; logo, nenhum callback ou rota de interface foi deixado para trás por esta etapa.

## Comparação pareada com o Stage 1 congelado

O ficheiro `reports/v013-stage1-affinity-summary.json` mantém os resultados originais imutáveis. O novo `scripts/v013-stage2-barrier-compare.cjs` executa o motor nativo com as mesmas 12 builds, 24 talentos efetivamente gastos, duas seeds (9101, 9201), níveis E5/E35, equipamento Rare e combate controlado contra três inimigos normais de Aegis. O comando `npm run simulate:v013:affinities:compare` produz JSON e Markdown com todos os grupos e linhas individuais.

**48/48 cenários válidos; 0 erros; 0 timeouts.** A comparação exige que a build Aegis física (0 Spell Power) e as cinco builds puras sem Aegis não sofram alterações na Barrier observada.

| Build | E | Barrier inicial antes → depois | Barrier gerada antes → depois | Absorção antes → depois |
|---|---:|---:|---:|---:|
| Aegis + Magic | 5 | 42,00 → 49,52 (+7,52) | 129,33 → 154,48 (+25,15) | 110,50 → 110,50 |
| Aegis + Magic | 35 | 45,50 → 53,90 (+8,40) | 160,65 → 204,80 (+44,15) | 159,54 → 161,00 (+1,46) |
| Aegis puro (sem SP) | 5 e 35 | Δ = 0 | Δ = 0 | Variável contextual |
| Outras cinco builds puras (sem Aegis) | 5 e 35 | Δ = 0 | Δ = 0 | Variável contextual |

Dados completos: [artefacto Stage 2 — 48 seeds/casos, atributos e ativações](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44730440325/artifacts/14625987443). **Source fingerprint da execução final:** `fcb89647f4210753e3700fc36a90b22653073c89a8404ef08d0d60b02aa7b7fe`.

## Validação automática

- [C7 final, commit `5bb7a6079c`](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44730440325): **4/4 jobs SUCCESS**.
- Testes principais: **312/312 aprovados**, sem skips, incluindo Stage 2, regressões de Talent Tree, comparação com a baseline congelada e paridade exata entre scripts e `docs/`.
- Simulador `test:v013:sim`: 7/7; Talent Tree: 79/79; combate/Elite/Boss/balanceamento de regressão: 94/94; segurança de saves e Auth/Firestore em emulador, Chromium, feedback, extração e paridade de Pages: PASS.
- A auditoria Clean Sheet associada passou 3/3, incluindo sincronização de Pages. Falhas intermédias de testes de triggers de Arcane Bastion, mock sem `ports.state` e conteúdo gerado desatualizado foram corrigidas; as execuções que falharam mantêm-se no histórico.

## Limites importantes

1. **As 48 lutas são fáceis (48 vitórias)**. Medem geração, absorção, cura, DoTs e consumo de Mana em condições controladas. Não comprovam equilíbrio de Bosses, Elites ou progressão natural.
2. As medições incluem preparação/injeção de um combate controlado pelo harness, e as concessões de Barrier de início de wave podem ser observadas em mais de um estágio do fixture. **Não interpretar a coluna de Barrier inicial como uma única ativação isolada sem confirmar o fluxo natural de entrada**. A comparação antes/depois mantém idêntico o procedimento.
3. Aumentar a Barrier gerada não implica aumentar proporcionalmente dano absorvido: a quantidade consumida depende do dano adversário e do cap global.
4. Não foram feitas mudanças a `main`, deploy, dados de produção, saves antigos, probabilidade de loot, stats de itens ou valores das Affinities Vitality/Decay.

**Stage 2 fechado no âmbito testado.** O Stage 3 previsto pode rever regeneração Vitality e o escalamento de Toxic Precision em Decay, com um novo conjunto pareado de simulações.
