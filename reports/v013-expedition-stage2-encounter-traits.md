# Wanderer v0.13 — Stage 2: Encounter Traits

**Estado:** implementado em branch/PR de desenvolvimento, **não publicado**. Base: Stage 1 (PR #42), que depende da Stage 0 (PR #41) e do simulador (PR #40).

## Âmbito e preservação

- Mantém a topologia radial das três Realm Cards (18/20/22 salas), 14/13/12 passos, segredos, orçamento de exploração, custos de viagem, 1/1/2 Elites, 0/1/2 guardas e progressão contínua.
- Não altera a Talent Tree, estatísticas base de equipamento, forja, builds, drops de raridade nem a frequência do loot.
- Reutiliza o catálogo da Stage 0 e o combate real. **Conditions, Boss Modifiers, Boons e Contracts continuam inativos** até às respetivas stages.

## Traits ativadas

| ID | Nome | Regra |
|---|---|---|
| `armored` | Armored | +20% Defense inimiga, −8% HP inimigo |
| `frenzied` | Frenzied | +15% Attack Speed inimiga, −10% HP |
| `ambush` | Ambush | Primeiro ataque de cada inimigo antecipado até 0,75 s; cadência normal depois |
| `sigilbound` | Sigilbound | Barrier inicial adicional de 12% HP, −10% Attack inimigo |
| `unhallowed_regrowth` | Unhallowed Regrowth | +2% HP cada 5 s por inimigo ativo, limitado a +10% HP total recuperado; reforços começam o relógio ao entrar |
| `death_throes` | Death Throes | Ao morrer, inimigo causa 2% do HP máximo do jogador; limite 4% por encontro. Barrier do jogador absorve antes de HP. Pode causar derrota no último inimigo |

Cada trait é aplicada **uma vez por encontro a todos os inimigos do grupo**, inclusive reforços. Não se aplica a bosses nem a Elites. Não existem combinações de duas traits no mesmo encontro nesta etapa.

### Seleção dos encontros

- Guarded 1; Dangerous 2; Brutal 3 — exatamente, com limite de 30% das salas normais.
- Salas de combate elegíveis têm índices >=5, excluindo o anel inicial (salas 1–4) para que **a primeira escolha de combate esteja livre de traits**.
- Traits são compatíveis com a afinidade da Realm Card e não repetem a mesma identidade dentro da mesma Realm.
- As posições e identidades são geradas a partir da seed Stage 0, num stream dedicado `encounter_traits_<realmId>`, sem consumir novas chamadas do RNG do mapa, combate ou loot.
- Os IDs são guardados nos nós atuais, sem criar salas adicionais.

### Comunicação ao jogador

- Nas salas que o mapa já mostra, a UI apresenta `⚔ <Trait Name>`.
- Antes de entrar na sala, o modal mostra o perigo concreto e o aviso de **+10% Fragments**.
- Não revela salas ocultas, não quebra segredos e não adiciona cliques.

### Economia

- +10% Fragments **apenas** a combates normais com trait, com arredondamento final (pequenas recompensas podem não aumentar em valor absoluto).
- **Gold, XP, Essence, frequência de loot, raridade, equip e contrato de Elite** mantêm as regras anteriores.
- O bónus soma-se multiplicativamente ao fator normal de dificuldade; é concedido uma vez ao finalizar a onda, sem duplicação por reforços.

## Simulador

O harness de `tests/v012-economy-harness.cjs` carrega `online/v013-encounter-traits.js` com o mesmo código real do jogo. `scripts/simulate-progression.cjs` regista `traitId`, `traitRegrowthHealing` e `traitDeathPulse` por combate.

Novo diagnóstico isolado:

```bash
npm run test:v013:traits
node scripts/simulate-progression.cjs --mode=traits --levels=15,35,70,100 --seeds=9101,9102,9103 --out=reports/v013-stage2-traits.json
```

`--mode=traits` compara, para cada E/build/seed, **um baseline e seis traits** injetadas num encontro normal idêntico do anel inicial. Esta exceção artificial às restrições do mapa e da afinidade existe **apenas para diagnóstico de combate**; não representa uma expedição natural nem altera gameplay. O modo `--mode=both` conserva as explorações normais com placement real das traits. A simulação de políticas e explorações completas fica para a Stage 8.

## Evidências do snapshot local

- **48/48 testes direcionados passaram** (Stages 0, 1, 2 + simulador anterior), incluindo o HTML do mapa e transações do motor.
- **10.000 seeds × 3 Realm Cards = 30.000 mapas** verificaram quantidades 1/2/3, compatibilidade de afinidade, unicidade, limite 30% e exclusão das salas iniciais.
- **336 combates de diagnóstico** (4 Expedition Levels × 4 builds × 3 seeds × 7 casos) — **336 vitórias, 0 mortes, 0 erros e 0 timeouts**. É uma amostra com equipamento sintético, **não uma afirmação de equilíbrio**. Houve cura real de Regrowth e ativações de Death Throes.
- Matriz natural anterior de 288 casos em `--mode=both`: **283 vitórias, 5 mortes, 0 erros, 0 timeouts**, incluindo **16 combates com traits dentro dos percursos Dungeon**. Estes encontros estão nos `rows[].rooms[]` e não no `traitId` de topo.
- Suíte `npm run test:v013`: as **mesmas 48 falhas preexistentes** na base da Stage 1; nenhuma falha adicional. A suíte completa **não está verde**.
- CI GitHub e validação visual end-to-end desktop/mobile **não executadas** nesta stage.

## Limitações e checkpoint seguinte

- O sistema ainda não permite ao jogador escolher traits; são geradas deterministicamente por mapa.
- Efeitos a ajustar no balanceamento posterior: número de salas perigosas, penalizações, reward premium, ritmo de Regrowth, burst de Death Throes.
- Não se pode concluir que todas as builds ou dificuldades estão equilibradas. A matriz de diagnóstico mede combate, não gestão de passos.
- **Stage 3:** Boss Modifiers utilizando o catálogo da Stage 0; reutilizar o motor e instrumentação do Stage 2, evitando duplicações de Guardian/Ember.
- Não fazer merge/publicação para `main` sem aprovação do utilizador, QA visual e validação de dependências entre PRs.
