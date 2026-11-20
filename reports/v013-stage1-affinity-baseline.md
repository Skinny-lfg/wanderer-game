# Wanderer v0.13 — Stage 1: baseline das Affinities

**Data:** 20-11-2026. **Branch:** `audit/v013`. **Código testado:** [`579108d79c`](https://github.com/Skinny-lfg/wanderer-game/commit/579108d79c0d286650d251d1d20f22a889bd85cc). **C7:** [4/4 jobs SUCCESS](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44727280871).

Esta baseline foi registada **antes** das alterações propostas a Aegis/Barrier, Vitality e Decay. Não altera valores de combate, UI, equipamento, saves ou produção. O código das simulações foi atualizado com o modo nativo `--mode=affinities`.

## Cenário reproduzível

- **6 builds puras e 6 híbridas adjacentes**, com raízes de Affinity e talentos adquiridos via Talent Tree v15.
- E5 e E35; seeds 9101 e 9201; **24 pontos disponíveis e realmente gastos em cada build**.
- Raridade Rare, gear do tier atual gerado nativamente com RNG determinístico; sem Runas, Boons, Contracts ou poções; política de target fixo (focus).
- Um encontro controlado com três inimigos normais de Realm Aegis, risco Normal, encontrado numa carta real gerada pelo Dungeon; os perfis têm armas próprias.
- Resolução de seed: 9106 e 9211 respetivamente, igual para todas as 12 builds nos níveis comparados, com fluxos independentes fixos. **Os itens não são necessariamente idênticos entre tipos de armas**; cada equipamento tem fingerprint no JSON bruto.
- **48/48 lutas válidas**, 0 erros, 0 timeouts e 48 vitórias. Isto é cobertura funcional e baseline de recursos, **não uma prova de equilíbrio**: o encontro foi pouco discriminante.

Reproduzir com: `npm run simulate:v013:affinities` ou `node scripts/simulate-progression.cjs --mode=affinities --levels=5,35 --seeds=9101,9201`.

## Resultados agregados por build e nível

Os valores abaixo são médias de **2 seeds por célula**. Barrier inicial e gerado durante combate são apresentados separadamente. Cura e DoT são valores efetivos, não potência teórica.

| Build | E | N | Wins | Barrier inicial | Barrier gerado | Absorvido | Cura/seg | DoT/seg | Mana gasta | Spell Power |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| pure-blood | 5 | 2 | 2 | 0 | 0 | 0 | 0.51 | 12.59 | 0 | 0 |
| pure-blood | 35 | 2 | 2 | 0 | 0 | 0 | 0.54 | 17.36 | 0 | 0 |
| pure-fury | 5 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| pure-fury | 35 | 2 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| pure-vitality | 5 | 2 | 2 | 0 | 0 | 0 | 2.71 | 0 | 0 | 0 |
| pure-vitality | 35 | 2 | 2 | 0 | 0 | 0 | 3.36 | 0 | 0 | 0 |
| pure-aegis | 5 | 2 | 2 | 51.2 | 65.52 | 104.75 | 0 | 0 | 0 | 0 |
| pure-aegis | 35 | 2 | 2 | 55.9 | 80.01 | 113.86 | 0 | 0 | 0 | 0 |
| pure-magic | 5 | 2 | 2 | 0 | 25.2 | 18.9 | 0 | 0 | 128 | 64 |
| pure-magic | 35 | 2 | 2 | 0 | 28.7 | 26.77 | 0 | 0 | 152 | 70.5 |
| pure-decay | 5 | 2 | 2 | 0 | 0 | 0 | 0 | 2.88 | 22.5 | 22.5 |
| pure-decay | 35 | 2 | 2 | 0 | 0 | 0 | 0 | 3.55 | 25.5 | 25 |
| blood-fury | 5 | 2 | 2 | 0 | 0 | 0 | 0 | 6.59 | 0 | 0 |
| blood-fury | 35 | 2 | 2 | 0 | 0 | 0 | 0 | 5.09 | 0 | 0 |
| fury-vitality | 5 | 2 | 2 | 0 | 0 | 0 | 2.49 | 0 | 0 | 0 |
| fury-vitality | 35 | 2 | 2 | 0 | 0 | 0 | 3.16 | 0 | 0 | 0 |
| vitality-aegis | 5 | 2 | 2 | 35.95 | 81.12 | 110.28 | 0.38 | 0 | 0 | 0 |
| vitality-aegis | 35 | 2 | 2 | 41.15 | 105.52 | 133.11 | 0.8 | 0 | 0 | 0 |
| aegis-magic | 5 | 2 | 2 | 42 | 129.33 | 110.5 | 0 | 0 | 211.5 | 47 |
| aegis-magic | 35 | 2 | 2 | 45.5 | 160.65 | 159.54 | 0 | 0 | 238.5 | 52.5 |
| magic-decay | 5 | 2 | 2 | 0 | 25.2 | 21.4 | 0 | 4.19 | 155.5 | 57 |
| magic-decay | 35 | 2 | 2 | 0 | 28.7 | 24.85 | 0 | 7.43 | 166.5 | 62.5 |
| decay-blood | 5 | 2 | 2 | 0 | 0 | 0 | 0 | 10.28 | 7.5 | 22.5 |
| decay-blood | 35 | 2 | 2 | 0 | 0 | 0 | 0 | 11.89 | 9 | 25 |

## Observações antes de alterar coeficientes

- **Aegis puro** já gera Barrier de forma regular sem Spell Power. **Aegis + Magic** gera mais Barrier também através do `Runic Shield` e do `Wand + Orb`, mas a fórmula principal de `Barrier Pulse` continua dependente de Health. Os números absolutos não devem ser interpretados como eficácia superior porque builds, velocidades e equipamento diferem.
- **Magic puro** gera alguma Barrier mesmo sem Aegis, graças ao Wand + Orb. É um controlo importante para avaliar a futura sinergia Aegis + Magic.
- **Vitality puro** consegue curar sem Barrier; **Vitality + Aegis** combina cura e proteção. Isso dá uma referência para distinguir regen baseada em Health de proteção baseada em Spell Power.
- **Decay puro** aplica Rot com consumo de Mana; **Magic + Decay** tem Spell Power e mais dano periódico por segundo nos cenários observados. Não inferir ainda superioridade geral da build.
- As ativações de passivas existem no JSON de cada cenário. A instrumentação recolhe `Buildcraft.activated()`; **não conta todos os efeitos de stats ou todas as passivas automáticas**.
- A métrica `periodicDamage` contabiliza dano real limitado pela vida do inimigo e inclui Bleed/Burn/Rot. `setBarrier()` mede geração efetiva após entrada; Barrier no início é um campo separado. `setHeal()` mede cura efetiva.
- **Mana gasta** foi registada, mas Mana restaurada não está separadamente instrumentada. O JSON regista Mana no início e no fim para contexto, não como quantidade bruta regenerada.
- **Amostra pequena** e encontro normal fácil (todas as builds ganharam). Antes de aceitar alterações de equilíbrio, testar Bosses, Elites e seeds adicionais com a mesma ferramenta.

## Evidência e integridade

- [JSON e Markdown brutos (artefacto do C7)](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44727280871/artifacts/14624816553) — inclui 48 linhas, os fingerprints dos itens, talentos, métricas e ativações.
- [Execução C7 completa](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44727280871) — jogos, simulador, browser, segurança e paridade `docs/` aprovados.
- **Source fingerprint:** `6b3ad4ef52eae4e37d7bc08ba387be31c2577d4b494d3a1690868e22bf39bc30`
- **Replay fingerprint:** `3d947e9091684ee7781eaf1808e2656158608aed59959509a3d193350d1fe2b5`
- Snapshot agregado equivalente em `reports/v013-stage1-affinity-summary.json`.

Esta etapa **não altera a UI**; portanto, não introduziu controlos ocultos nem caminhos históricos a eliminar. A arquitetura do jogo e o balanceamento permanecem inalterados.
