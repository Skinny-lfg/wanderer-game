# Wanderer v0.12 — E.3.1 Mechanics Audit

**PASS técnico: 10/10 checks estáticos de implementação, 240 simulações de regressão nativas concluídas.**

Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39677209280

## Inspeção
A auditoria leu as implementações de `combat/v012-combat-runtime.js`, `combat/v012-gear-stats.js` e `economy/v012-equipment-runtime.js` e verificou âncoras de código, sem o modificar:
1. Dual Daggers invoca `weaponAttack(r,true)` como segundo ataque com redução `damage*.5`; apenas depois de ataque principal válido e inimigo vivo.
2. Wand+Orb com elemento correspondente recebe multiplicador 1.30 e tem capacidade de gerar Barrier com cooldown de 6 segundos, quando verificadas as condições de cast.
3. Equipamento Orb tem tratamento `orbSpellB4` de compatibilidade de Spell Power 1.12 para Orbs antigos, enquanto os Orbs novos já vêm com roll ajustado. NÃO afirmar que todo Orb recebe 12% extra em tempo de execução.
4. Sword+Shield permite contra-ataque base de fator 0.65, com cooldown 2.5s, e Block Chance base limitada a 48% antes de outras fontes; o contra-ataque é condicional a bloqueio e aos restantes requisitos do runtime.
5. Two-Handed elimina Off-Hand no cálculo de estatísticas; Daggers podem ser equipadas em ambos os slots.

Todos os dez checks passaram. Estes checks são principalmente `regex` de presença de código, **não provas de ativação em todos os combates**.

## Regressão de combate
Repetidas 8 variantes x 30 seeds da E.3 (240 casos) com o motor nativo; zero falhas de execução:
- Assassin Dual: 30/30 vitórias, DPS médio 4573.58, ataques médios 122.77.
- Assassin sem Off-Hand: 2/30, DPS médio 2997.60, ataques médios 132.9.
- Wand+Orb: 15/30, DPS 3551.63; Wand sem Orb: 0/30, DPS 2217.53.
- Staff: 23/30, DPS 3905.64.
- Sword+Shield: 15/30, DPS 2545.20; Sword sem Shield: 0/30, DPS 1336.28.
- Archer: 24/30, DPS 4131.94.

**Nota:** a contagem agregada `weaponAttacks` e as vitórias **não isolam a quantidade de ataques especificamente feitos pela Off-Hand**. O valor de ataques acumulados também depende de quanto tempo dura cada Expedition. Não inferir que um segundo ataque é contabilizado separadamente neste contador. Para aferir a contribuição causal da Off-Hand: adicionar telemetria exclusiva para main/offhand strikes, dano e procs, e comparar a build com o mesmo conjunto de stats base (controlo de outros fatores).

## Decisão
Nenhum valor de balanceamento alterado. E.3.2 proposta: auditoria de eventos por golpe com instrumentação estritamente no harness, normalização de stats e comparação de contribuições de Off-Hand, Orb e Shield antes de qualquer nerf/buff. Não modificar `main`, Firebase nem saves reais.
