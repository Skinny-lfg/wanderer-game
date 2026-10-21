# Wanderer v0.12 — E.1.3: estados iniciais E200 e HP fatal

**Estado: implementação do harness em `development`; validação de execução pendente.** Alterações limitadas a scripts de auditoria. Nenhuma regra de gameplay, dificuldade, economia, save ou Firebase foi alterada.

## Correções implementadas

- O gerador dos perfis A (Normal), B (Otimizado) e C (Recuperação) cria uma mesma base Bow/Leather coerente, para comparar **políticas** em vez de confundir política com equipamento.
- Bow no slot Weapon, Off-Hand vazio, cinco peças de armadura explicitamente Leather; os outros slots conservam os subtipos gerados. Validação explícita falha se aparecer Cloth/Plate.
- Equipamento sintético E196–E200, com Epic e algumas Rare; três Runas históricas E190/E195/E199 e recursos iniciais sintéticos 4000 Gold/3000 Fragments. Não se assume um histórico real de E1–E199, nem se atribuem Runas E200 antes de vencer.
- O driver regista `fatalFight`: HP e Barrier **antes do tick fatal**, HP e Barrier após esse tick, HP máximo, HP do inimigo, nome/tipo do inimigo, Realm e wave. A telemetria representa o tick anterior ao evento de morte, **não** necessariamente o início do combate fatal.
- O campo `fatalFight` foi incluído nas linhas do relatório JSON das simulações.

## Como validar

1. `node --check scripts/v012-affinity-combat-sim.cjs`
2. `node --check scripts/v012-phase-e11-persistence-audit.cjs`
3. `node tests/v012-phase-e12-harness.test.cjs` (regressão E.1.2, testes T1–T5)
4. `WANDERER_E11_RUNS=9 node scripts/v012-phase-e11-persistence-audit.cjs /tmp/wanderer-e13-results.json` — uma tentativa por seed/perfil.

Verificar no JSON as nove linhas iniciais: arma Bow, cinco armaduras Leather, tiers E196–E200, Runas E190/E195/E199; verificar `fatalFight` nas derrotas e erros/timeouts. Não inferir resultados de vitória nem progressão a partir deste documento: a amostra ainda **não foi executada** neste contexto.

## Interpretação / limites

A geração agora é coerente com um arquétipo Bow/Leather, mas continua **sintética**, sem saves históricos observados. A mesma preparação dos três perfis isola a política A/B/C; não testa a diversidade real de builds dos jogadores. Este ajuste não garante um conjunto de Affinities ideal, Legendaries ou potions. A auditoria E.2 permanece bloqueada até haver resultados reprodutíveis, telemetria conferida e critérios de representatividade aceites. D.7 deve ser validada com o seu próprio relatório; esta fase não modifica Dual Daggers.

**Sem alterações de balanceamento recomendadas nesta fase.**

## Execução efetiva: amostra E200 (21 de outubro de 2026)

GitHub Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39665276384
Commit testado: `23c85cf175c613105e72a2778c08375f9c18cc46`
Artefacto JSON com as nove trajetórias: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39665276384/artifacts/12375579442

O workflow passou: E.1.2 T1–T5 (5/5), simulação E.1.3 (9/9 tentativas concluídas), zero erros, zero timeouts e ambos os scripts com sintaxe válida.

| Perfil | Seed 0 | Seed 1 | Seed 2 | Vitórias |
| --- | --- | --- | --- | --- |
| A Normal | derrota E200 | vitória E200→201 | derrota E200 | 1/3 |
| B Otimizado | vitória E200→201 | vitória E200→201 | vitória E200→201 | 3/3 |
| C Recuperação | vitória E200→201 | vitória E200→201 | derrota E200 | 2/3 |

**Total: seis vitórias em nove tentativas (66,7%); três derrotas; E201 desbloqueada em seis estados.** Estes valores foram confirmados no resumo do log. O artefacto contém estados completos e `fatalFight` para análise subsequente, mas os respetivos campos granulares não foram ainda verificados individualmente neste relatório.

**Aviso metodológico:** há apenas uma tentativa por seed/perfil. As três políticas partem de uma mesma base Bow/Leather sintética, mas as sementes e os efeitos económicos diferem. As vitórias não estimam uma win rate global e a diferença para E.1.2 não permite concluir isoladamente que a composição de armadura foi a única causa. Não fazer ajustes de gameplay, dificuldade ou economia a partir desta pequena amostra. Antes de E.2, auditar o artefacto de telemetria fatal e a representatividade dos estados.

