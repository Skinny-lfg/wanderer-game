# Stage 02 — Wanderer v0.13: percurso natural E1–E20

**Estado: concluído, auditado, sem erros técnicos na execução final.**  
**Dados de origem:** commit `39f71feb9034df56c866a4fe484a5316f09c4b6a`, Node **v22.23.5**, 10 lotes do GitHub Actions com hashes idênticos dos cinco ficheiros principais do motor. [Execução final de verificação](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44779354941).

## Método

50 contas novas e persistentes **ao longo da simulação**, 5 sementes (9811–9815) × 10 perfis. Cada uma começou em E1 com equipamento inicial e zero XP. Só as vitórias nativas contra o Boss desbloquearam o nível seguinte. Limites: 18 tentativas por nível, 360 por conta e 12 000 ticks de combate por sala. Políticas de decisão adaptativas; sem equipamento, recompensas, talentos, XP ou vitórias inventadas. As contas sem acesso a determinado E são **censuradas**, nunca registadas como derrotas nesse E.

Foi preciso ajustar apenas o simulador: respeitar o bloqueio nativo do Forge quando o Stash está cheio e aumentar o limite de ticks para combates longos. Um lote foi repetido com a versão exata de Node usada pelos outros nove; o código original e as regras de combate não foram modificados para obter os resultados.

## Resultado global

- **1 752 tentativas, 50 contas, 0 erros técnicos.**
- **25/50** venceram E1; **18/50** chegaram a E5, **17/50** venceram E5; os **17/50** restantes chegaram a E20 **e todos venceram o Boss final**.
- **33** contas terminaram por atingir 18 tentativas num determinado E. Nenhuma esgotou as 360 tentativas totais.
- Entre os 17 vencedores, **mediana de 53 tentativas acumuladas até derrotar E20**, P90 de 73. Para chegar a E20, mediana de 52 tentativas, P90 de 72.
- **E18, E19 e E20: 17 vitórias em 17 primeiras tentativas de cada nível.** De E6 a E20, a mediana entre os vencedores foi sempre uma tentativa por E.

## Milestones

| Objetivo | Chegaram | Venceram | Mediana de tentativas acumuladas até chegar | P90 até chegar | Mediana acumulada até vencer |
|---|---:|---:|---:|---:|---:|
| E5 | 18 | 17 | 28 | 41 | 36 |
| E10 | 17 | 17 | 41 | 56 | 43 |
| E15 | 17 | 17 | 47 | 67 | 48 |
| E20 | 17 | 17 | 52 | 72 | 53 |

## Funil por E

| Expedition | Entraram | Venceram | Tentativas observadas | Mediana de tentativas para vencer entre os vencedores |
|---:|---:|---:|---:|---:|
| E1 | 50 | 25 | 750 | 12 |
| E2 | 25 | 23 | 195 | 6 |
| E3 | 23 | 20 | 182 | 5 |
| E4 | 20 | 18 | 138 | 5 |
| E5 | 18 | 17 | 150 | 6 |
| E6 | 17 | 17 | 44 | 1 |
| E7 | 17 | 17 | 30 | 1 |
| E8 | 17 | 17 | 19 | 1 |
| E9 | 17 | 17 | 22 | 1 |
| E10 | 17 | 17 | 20 | 1 |
| E11 | 17 | 17 | 23 | 1 |
| E12 | 17 | 17 | 24 | 1 |
| E13 | 17 | 17 | 25 | 1 |
| E14 | 17 | 17 | 19 | 1 |
| E15 | 17 | 17 | 18 | 1 |
| E16 | 17 | 17 | 18 | 1 |
| E17 | 17 | 17 | 24 | 1 |
| E18 | 17 | 17 | 17 | 1 |
| E19 | 17 | 17 | 17 | 1 |
| E20 | 17 | 17 | 17 | 1 |

## Resultados por perfil

Cada perfil teve cinco contas.

| Perfil | E1 vencido | E20 vencido | Tentativas totais das 5 contas |
|---|---:|---:|---:|
| Balanced | 5/5 | **5/5** | 254 |
| Plate Warden | 5/5 | **5/5** | 223 |
| Cautious | 5/5 | **4/5** | 290 |
| Daring | 3/5 | 1/5 | 193 |
| Cloth Battlemage | 1/5 | 1/5 | 136 |
| Magic Lightning | 2/5 | 1/5 | 196 |
| Magic Fire | 2/5 | 0/5 | 153 |
| Magic Frost | 2/5 | 0/5 | 127 |
| Leather Duelist | 0/5 | 0/5 | 90 |
| Hexblade Hybrid | 0/5 | 0/5 | 90 |

## Diagnóstico e próximos passos

**Problema potencialmente grave de progressão:** a dificuldade é muito elevada em E1–E5, sobretudo para casters, Daggers e híbridos, mas os agentes que ultrapassaram E5 avançaram praticamente sem resistência até E20.

A escala de referência dos inimigos em `combat/expedition-progression.js` é linear até E5 e logarítmica a partir de E6:

```js
function enemyReference(level) {
  return level <= 5 ? level : 5 * (1 + .2 * Math.log1p((level - 5) / 5));
}
```

Em combates vencedores observados, a mediana da vida inicial dos Bosses passou de aproximadamente **684 em E5** para **821 em E20**; entretanto, equipamento, XP e talentos dos jogadores continuam a crescer. Esta é uma **hipótese causal muito plausível**, não prova isolada. O facto de 17 de 17 vencerem E20 não permite concluir que um principiante o faça facilmente: só foram expostos a E20 os 17 sobreviventes de todo o funil.

**Antes de alterar o balanceamento**, a próxima auditoria deve: comparar a curva de atributos/gear dos vencedores com a dos inimigos em cada E, separar o impacto de IA e dos perfis, testar cenários controlados com equipamento e XP realmente observados, e só depois propor escalas/buffs/nerfs. Nenhuma alteração de balanceamento foi efetuada nesta Stage 02.

**Limitações:** amostra reduzida por perfil (n=5), resultados de heurísticas programadas e não de humanos, seleção de sobreviventes e censura administrativa de 18 tentativas. Não reportar estes valores como taxas reais de sucesso dos jogadores. Os relatórios JSON e Markdown completos com os 50 percursos e as 20 Expeditions estão guardados nos artefactos da execução verificada.

**Ambiente:** alterações apenas na branch `audit/v013-stage6`; sem merge para main, sem deploy.
