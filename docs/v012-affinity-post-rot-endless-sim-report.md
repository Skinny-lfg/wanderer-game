# Wanderer v0.12 — Experimento E∞ após Fases A/B/C + Decay Rot-only
**Data:** 20/10/2026 | **Fonte imutável de gameplay:** `development` commit `8fe012ab0cd6b38d9f0efeb72fee209336eb28f7`  
**Estado:** experimento **in-memory**, NÃO implementado/publicado. Base: 3.360 combat sims E1–E200 descritas em [relatório pós-Rot](v012-affinity-post-rot-native-sim-report.md).

## Sumário executivo
- **4.032** experiências hipotéticas E300/E500/E1000 para 4 modelos (linear, gear cap200, softcap desafiante, softcap suave) × 2 relações de tier gear × 4 estratégias × 7 armas × 6 affinities; 0 erros nestas 4.032.
- **1.512** experiências adicionais com softcap desafiante, equipamento Rare vs Epic e Rune ablation; **1 erro real do draft** reproduzido com seed, 1.511 completos. Total E∞: 5.544 tentativas, **1 falha**. Total das duas baterias incluindo E1–E200: **8.904 tentativas**, **1 falha**.
- As estratégias orientadas para sinergias ainda não vencem de forma claramente mais consistente que escolhas aleatórias; a raridade do gear muda mais o resultado do que a estratégia, e progressões lineares/suaves ficam fáceis demais com gear Epic.
- **BUG A CORRIGIR ANTES DE PUBLICAR A/B/C:** no draft da Realm 8, ao haver só 2 passivos úteis/elegíveis, `options()` lança “No three legal useful passives available; checkpoint retained” em vez de deixar escolher. Descrito e reproduzido no fim.

## Protocolo E∞
Código real de combate e de Realm/passivos, com alterações **só em memória** aos limites do controller/inline (`>200`) e à fórmula `estimateEnemy`; nada editado no repositório. O script e o harness do repo foram executados com módulos fetchados na revisão citada e injecção do parâmetro opcional gearTier para `makeItem`/`makeRune`. Gear homogéneo Rare ou Epic (conforme cenário), **sete armas × seis affinities iniciais**, três Runas reais (Vitality, Warding, Might/Wisdom), ou sem Rune; mesmo seed inicial para combinações de estratégias/condições, mas consumo de RNG diverge com escolhas diferentes. Sem poções, eventos recusados, sem swaps/loot upgrades. 15 Realms por run. Um seed por arma/family/combinação fina (n=42 por estratégia/modelo/tier/ratio). Estratégias random, mono, dual e triple são heurísticas do script canónico; **não são builds óptimas nem farm longitudinal real**.

**Curvas para E>200 (T=E, L=200 e log natural):**
- `linear`: inimigo tier T; gear tier T.
- `capped`: inimigo tier T; gear tier L.
- `challenge`: inimigo tier `L+180 ln(1+(T-L)/180)`; gear tier `L+130 ln(1+(T-L)/130)`.
- `gentle`: inimigo tier `L+130 ln(1+(T-L)/130)`; gear tier `L+160 ln(1+(T-L)/160)`.
- `100%` = gear tier de referência da curva; `125%` = gear tier de referência ×1,25, **não +25% final de estatísticas**. Inimigos mantêm o tier da curva. Itens **Epic** em todas as 4.032 experiências comparativas.

## I. Comparação dos 4 modelos: vitórias em 42 runs, gear Epic, três Runas, tier gear 100%
Ordem de cada célula: **random / mono / dual / triple**.

| Modelo | E300 | E500 | E1000 |
| --- | --- | --- | --- |
| Linear | **23 / 26 / 25 / 27** | **28 / 30 / 29 / 30** | **32 / 33 / 33 / 33** |
| Capped gear E200 | **0 / 0 / 0 / 0** | **0 / 0 / 0 / 0** | **0 / 0 / 0 / 0** |
| Softcap desafiante | **24 / 22 / 24 / 26** | **21 / 19 / 20 / 21** | **23 / 20 / 21 / 22** |
| Softcap suave | **24 / 28 / 25 / 28** | **28 / 31 / 31 / 31** | **28 / 31 / 30 / 30** |

**Interpretação:** (1) deixar gear parado em E200 inviabiliza E300 em diante; (2) gear/inimigo lineares acabam com vitórias excessivas (E1000 76–79% com Epic), sem progressão de dificuldade sustentada; (3) softcap suave igualmente permissivo; (4) softcap desafiante fica em ~45–62% no E300/E500/E1000 de Epic+3 Runas, mas **sem demonstrar mérito suficiente da build intencional**. Cuidado: isto não prevê quanto tempo demora a obter gear Epic no tier da simulação.

## II. Epic + Runas e gear a 125% do tier referência (42 runs/estratégia)
| Modelo | E300 random/mono/dual/triple | E500 random/mono/dual/triple | E1000 random/mono/dual/triple |
| --- | --- | --- | --- |
| Linear | 31 / 32 / 33 / 33 | 33 / 33 / 33 / 33 | 33 / 33 / 33 / 33 |
| Capped gear 200 ×1,25 | 6 / 7 / 8 / 7 | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |
| Challenge | 31 / 31 / 32 / 33 | 33 / 31 / 31 / 33 | 32 / 30 / 30 / 32 |
| Gentle | 32 / 31 / 32 / 33 | 33 / 32 / 33 / 33 | 33 / 33 / 34 / 33 |

**Interpretação:** +25% no tier do gear torna a vitória extremamente comum nas builds Epic sob qualquer modelo escalável, sinal da sensibilidade excessiva à progressão de equipamento. O valor 33/42 frequente é um teto observado desta matriz, **não uma garantia matemática de teto**. Investigar carga do gear, armas, crit/block e inimigos.

## III. Ablação do gear e das Runas no softcap desafiante, tier referência (42 por estratégia)
Cada célula contém vitórias de **random / mono / dual / triple**.

| Equipamento | E300 | E500 | E1000 |
| --- | --- | --- | --- |
| Epic + 3 Runas | **24 / 22 / 24 / 26** | **21 / 19 / 20 / 21** | **23 / 20 / 21 / 22** |
| Epic SEM Runas | 20 / 20 / 21 / 24 | 16 / 15 / 20 / 18 | 18 / 15 / 17 / 20 |
| Rare + 3 Runas | **2 / 3 / 3 / 5** | **4 / 3 / 3 / 4** | **7 / 9 / 6 / 7** |
| Rare SEM Runas | 2 / 3 / 3 / 3 | 2 / 3 / 3 / 3 | 7 / **7 em 41 casos** / 7 / 7 |

**Aviso E1000 Rare sem Runas, mono:** 41/42 casos completos; 1 crash de draft, caso não contado como derrota nem vitória. Não ocultar este erro numa percentagem.

**Diferença mais importante:** E300 no softcap challenge com 3 Runas, Triple Epic **26/42 = 61,9%**, Triple Rare **5/42 = 11,9%**. +50 pontos percentuais apenas pela raridade do set, com o **mesmo tier e mesma estratégia**. A variante sem Runas mostra ganho bem menor do que a troca Rare→Epic. A conclusão depende da estrutura de equipamento completo: não extrapolar para builds com mix Rare/Epic, legendaries, itens protegidos e crafting normal.

## IV. Falha reproduzida (PRIORIDADE ALTA)
Cenário do experimento E∞, softcap challenge, E1000, `gearTier=456`, `rarity=Rare`, `runes=false`, `weapon=Bow`, `initial family=fury`, `strategy=mono`, `seed=20292293`. No draft **Realm 8**, código de `combat/v012-buildcraft.js::options` lança:
```
Error: No three legal useful passives available; checkpoint retained
```
Snapshot obtido com instrumentação **exclusivamente in-memory** antes da exceção: `families=["fury"]`, `unlockedFamilies=["fury"]`, `picks=["quick_hands","quick_hands","quick_hands","precision","precision","precision","precision","precision"]`; Quick Hands R3 e Precision R5, com **apenas `brutal_crit` e `double_strike` na pool legal**. As outras Skills Fury já não cumprem requisitos de ganho útil/funcional. Ao exigir `pool.length>=3`, o draft quebra **sem que os picks ou o save sejam inválidos**.

**Fix recomendado para Codex:** 3 cartas sempre que existem ≥3 legais. Se existirem só 1–2 candidatos legais, oferecer o número **real** de escolhas (UI já itera sobre `draft.options`) e permitir continuar a Expedition, com indicação discreta “Restam 2 melhorias elegíveis”. Se existirem 0, criar mecanismo determinístico e seguro de conclusão da recompensa (sem repetir pick, sem desperdiçar escolha e sem auto-reroll, preservar flow/checkpoint) ou alternativa com benefício real de baixo risco, após aprovação de design. Cobrir 1/2/0 com testes. Não relaxar caps nem inventar um terceiro passivo impossível só para preencher o ecrã. Este bug está no algoritmo de 3 cartas e pode também manifestar-se em levels normais com build semelhante; **não foi demonstrado que seja exclusivo de E∞**. Não alterar save real durante testes.

## V. Diagnóstico e recomendações
**P0:** corrigir caso de `pool<3` antes de considerar A/B/C estável e publicar. O teste atual do Codex das 1.200 seeds não cobre este extremo de mono-affinity e caps/functional.
**P1:** comparar gear Rare/Epic e estatísticas finais a níveis reais, especialmente E10/E50, onde o [relatório de progressão](v012-affinity-post-rot-native-sim-report.md) mostra 0–8% win com set Rare/Epic do tier. Não escolher E∞ softcap sem validar a curva desde E1.
**P2:** auditoria Wand/Staff e equip/arma/armor/offhand, especialmente tipos que não sobrevivem até Realm 5 para poderem iniciar híbridos. Simular estatísticas relativas do gear Rare/Epic e acesso a Mana/sustain.
**P3:** recuperar buildcraft: Triple tem híbrido alvo em cerca de 70–80% das simulações Challenge Epic endgame, mas as vitórias continuam próximas das aleatórias; comparar **mesma rota, mesmas armas/gear/Runas** e builds optimizadas concretas Blood+Decay, Fury+Magic e Vitality+Aegis, pois heurísticas do script não são ótima construção de decks.
**P4:** experimentar curvas de softcap desafiante só depois de corrigir P0/P1/P2; com gear Epic no tier padrão, E300/E500/E1000 ainda ficam relativamente acessíveis e a diferença gear 100%→125% torna-os quase automáticos.
**P5:** repetir seeds independentes por célula, comparar tempo real de sessão, explorar upgrades/recovery/economia, efeitos de eventos/poções, legendaries, e RNG real de drop antes de declarar balanceamento de release.

## Limitações
Uma seed por célula (n=42 por estratégia no E∞, sete armas × seis affinities). Comparações entre estratégias usam seed inicial emparelhada mas divergência de RNG ao longo do caminho. Nenhuma estratégia foi otimizada ao nível de humano experiente. Os modelos E∞ são **alterações in-memory hipotéticas**, não jogo existente. Runas em todas as comparações principais; ablação apenas no softcap desafiante. Os rótulos “Epic” e “Rare” implicam um set homogéneo completo, fornecido artificialmente, sem validar exequibilidade da progressão normal. Estes resultados não devem ser apresentados como % de vitória de jogadores reais.

**Estado final:** nenhum código/gameplay alterado, nenhum save tocado, nenhum deploy ou merge efetuado durante os testes. Este ficheiro é somente o relatório da investigação.
