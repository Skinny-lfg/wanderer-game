# Wanderer v0.13 — Stage 03: auditoria principal de 200 contas

**Estado: concluída e validada. Nenhum balanceamento alterado; sem merge nem deploy.**

## Proveniência e integridade

- Repositório: `Skinny-lfg/wanderer-game`; branch isolada: `audit/v013-stage6`.
- Código exato da simulação: commit `f6713674f96758f86e74800b6f445bde33df2542`, Node `v22.23.5`; 20 lotes, dez perfis por semente.
- [Execução nativa das 200 contas](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44783769318) — todos os lotes e a primeira consolidação aprovados.
- [Análise revista com Boss HP corretamente atribuído](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44785096405) — sem repetir combates; mesmo material original, mesmas verificações SHA.
- Sementes: `9901–9920`; uma conta nova por par semente/perfil, zero XP e equipamento inicial; cada conta mantém estado nativo entre tentativas dentro do mesmo processo de simulação.
- E1–E20, 18 tentativas máximas por Expedition, 360 por conta, 12 000 ticks por luta. Política adaptativa constante.
- Desbloqueio apenas por vitória real do Boss. XP, Gold, Fragments, crafting, talentos, reset, loot e mortes são processados pelo runtime nativo; nenhum valor ou vitória fabricados.
- A persistência é **do estado da conta simulada ao longo das tentativas**, não escrita num save de utilizador nem numa base de dados de produção. Os resultados são serializados nos ficheiros JSON dos lotes.
- Um problema de Stash que ignorava slots ocupados por poções foi corrigido no agente de simulação e testado antes de reiniciar os 200 percursos; as mecânicas de combate do jogo não foram alteradas.

## Resultado global

- **200 contas, 7545 tentativas, zero erros técnicos.**
- **71/200** derrotaram E20 (**35,5%**); as restantes **129** pararam por atingir o limite de 18 tentativas num E.
- **131** venceram E1; **74** entraram E5 e **71** venceram E5; todos os 71 que entraram E6 avançaram até derrotar E20.
- **6074 tentativas (80,5%)** ocorreram em E1–E5. Por E: 69 contas bloquearam em E1, 36 em E2, 16 em E3, cinco em E4 e três em E5.
- Para as 71 contas que venceram E20: mediana **53 tentativas acumuladas**, percentil 90 **78**. E20 especificamente: 71 vitórias em 85 tentativas, mediana **1** e P90 **2**.
- De E6 a E20, não houve mais contas bloqueadas pelo limite de tentativas; isto é um resultado condicionado a já terem sobrevivido aos primeiros níveis, não uma estimativa para jogadores novos.
- Foram observados 2748 finais de tentativa por morte e 3282 extrações, além de 3033 combates contra Bosses, 3181 contra Elites, 4018 crafts e 3164 poções usadas. Estas são contagens de eventos, não de contas distintas.

## Tentativas acumuladas por objetivo

| Marco | Contas que chegaram | Boss derrotado | Mediana até chegar | P90 até chegar | Mediana até derrotar | P90 até derrotar |
|---|---:|---:|---:|---:|---:|---:|
| E1 | 200 | 131 | 0 | 0 | 11 | 17 |
| E5 | 74 | 71 | 29 | 46 | 35 | 53 |
| E10 | 71 | 71 | 41 | 63 | 42 | 64 |
| E15 | 71 | 71 | 47 | 72 | 48 | 73 |
| E20 | 71 | 71 | 52 | 77 | 53 | 78 |

## Funil completo E1–E20

| E | Entraram | Derrotaram o Boss | Tentativas | Mediana de tentativas para vencer E | Erros |
|---:|---:|---:|---:|---:|---:|
| 1 | 200 | 131 | 2790 | 11 | 0 |
| 2 | 131 | 95 | 1317 | 6 | 0 |
| 3 | 95 | 79 | 839 | 6 | 0 |
| 4 | 79 | 74 | 615 | 7 | 0 |
| 5 | 74 | 71 | 513 | 6 | 0 |
| 6 | 71 | 71 | 176 | 1 | 0 |
| 7 | 71 | 71 | 132 | 1 | 0 |
| 8 | 71 | 71 | 107 | 1 | 0 |
| 9 | 71 | 71 | 109 | 1 | 0 |
| 10 | 71 | 71 | 91 | 1 | 0 |
| 11 | 71 | 71 | 99 | 1 | 0 |
| 12 | 71 | 71 | 92 | 1 | 0 |
| 13 | 71 | 71 | 86 | 1 | 0 |
| 14 | 71 | 71 | 80 | 1 | 0 |
| 15 | 71 | 71 | 78 | 1 | 0 |
| 16 | 71 | 71 | 93 | 1 | 0 |
| 17 | 71 | 71 | 82 | 1 | 0 |
| 18 | 71 | 71 | 75 | 1 | 0 |
| 19 | 71 | 71 | 86 | 1 | 0 |
| 20 | 71 | 71 | 85 | 1 | 0 |

## Resultados dos dez perfis (20 contas cada)

| Perfil | Venceram E1 | Chegaram E5 | Venceram E5 | Chegaram E20 | Venceram E20 | Tentativas de todas as contas |
|---|---:|---:|---:|---:|---:|---:|
| Balanced | 20/20 | 20/20 | 20/20 | 20/20 | 20/20 | 993 |
| Plate Warden | 20/20 | 20/20 | 20/20 | 20/20 | 20/20 | 924 |
| Cautious | 20/20 | 18/20 | 16/20 | 16/20 | 16/20 | 1155 |
| Cloth Battlemage | 11/20 | 6/20 | 6/20 | 6/20 | 6/20 | 722 |
| Magic Lightning | 10/20 | 4/20 | 4/20 | 4/20 | 4/20 | 804 |
| Daring | 15/20 | 3/20 | 3/20 | 3/20 | 3/20 | 753 |
| Magic Fire | 11/20 | 1/20 | 1/20 | 1/20 | 1/20 | 636 |
| Magic Frost | 13/20 | 2/20 | 1/20 | 1/20 | 1/20 | 700 |
| Leather Duelist | 7/20 | 0/20 | 0/20 | 0/20 | 0/20 | 449 |
| Hexblade Hybrid | 4/20 | 0/20 | 0/20 | 0/20 | 0/20 | 409 |

## Evidência de possível problema de balanceamento

1. **O funil elimina perfis cedo.** Balanced e Plate Warden concluíram E20 em 20/20 contas cada. Cautious concluiu 16/20. Leather Duelist e Hexblade Hybrid concluíram 0/20, embora tenham vencido E1 em 7/20 e 4/20, respetivamente. No entanto, os perfis têm diferenças de risco, armas, prioridades e retirada; isto não prova uma desvantagem exclusivamente dos números do equipamento.
2. **Dificuldade quase desaparece após E5 para os sobreviventes.** E5 exigiu 513 tentativas para 71 Boss victories; E20 apenas 85 tentativas para as mesmas 71 vitórias. A mediana por E passa de seis em E5 para uma em E6–E20.
3. **Bosses escalam muito menos do que a progressão dos agentes.** A mediana do **HP inicial real dos Bosses** foi 684 em E5 e 821 em E20; a mediana do HP máximo do jogador ao entrar no Boss passou de 265 para 367. A comparação mede grupos selecionados diferentes, e HP sozinho não explica dificuldade, mas é compatível com a curva `enemyReference` logarítmica após E5.
4. **Houve builds efetivamente evoluídas**, não apenas intenções de híbrido: o relatório contou 1598 observações de combates com capacidade simultânea AoE+single-target e 4038 com uma habilidade mista efetivamente preparada. São observações de combates correlacionadas por conta, não jogadores únicos.
5. **A política de IA também precisa de auditoria.** Um reset de talentos conta como `pivot` mesmo para alguns perfis sem mudança real de plano; opções de risco também diferem entre perfis. Devemos separar estas limitações de um problema real de stats antes de aplicar buffs ou nerfs.

## Limitações e ação recomendada

- Os 200 agentes seguem dez políticas heurísticas fixas, não comportamento de jogadores humanos.
- Contas que nunca desbloquearam determinado E são **censuradas**, não derrotadas nesse nível. Taxas condicionais aos sobreviventes não são taxas gerais.
- O limite de 18 tentativas constitui uma paragem administrativa, não prova que a build é impossível.
- Sementes iguais partilhadas por perfis distintos não implicam combates e drops emparelhados depois de as decisões divergirem.
- A Stage 03 não altera os coeficientes de combate, equipamento, drop nem a curva de dificuldade do jogo.
- **Recomendação:** estudar a escala E1–E5 vs E6–E20 com estatísticas de personagem, dano efetivo e preparação dos Bosses; separar erros de política dos agentes de problemas de balanceamento.

## Artefactos

- As **20 origens JSON independentes** com cada percurso completo estão nos artefactos da [execução original](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44783769318), com retenção GitHub Actions de 30 dias.
- O **JSON consolidado (200 contas, detalhe por E, perfis, recursos e combate)** e o relatório Markdown estão na [revisão verificada](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44785096405).
- As tabelas resumidas deste ficheiro ficam permanentemente no repositório; os artefactos ZIP de Actions são temporários.

**Sem merge, deploy ou alterações ao balanceamento.**
