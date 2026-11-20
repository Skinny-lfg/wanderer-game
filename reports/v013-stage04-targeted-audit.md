# Wanderer v0.13 — Stage 04: auditoria direcionada (AoE, single-target, Affinities mistas, Elites e Bosses)

**Estado: concluída, verificada, sem alterações ao balanceamento.** Branch `audit/v013-stage6`; sem merge nem deploy.

## Execução e garantias

- [Bateria original: 36 lotes, 360 contas](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44787333743), commit `07975adb79f8d703c2da2eac0a91955b717028fd`.
- [Reanálise verificada de targeting e builds distintas](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44789134453), 10 testes aprovados, sem repetir os combates.
- 12 sementes `11001–11012`, dez perfis, três políticas: `adaptive`, `adaptive-no-targets`, `adaptive-no-rooms`. **120 contas independentes por política**, estado persistente dentro de cada conta, iniciadas em E1 com zero XP e equipamento starter.
- Node `v22.23.5`, commit e hashes dos seis ficheiros-chave verificados nos 36 lotes. Identidade inicial de equipamento por semente e perfil também verificada entre políticas.
- Limites idênticos: 18 tentativas por E, 360 por conta, 12 000 ticks por luta. O Boss seguinte só é desbloqueado após vitória nativa.
- **Sem injeção de atributos, equipamento, talentos, XP, loot, inimigos, vitórias ou alterações aos coeficientes do combate.**

## Resultado global

| Política | Contas | Tentativas | Venceram E1 | Venceram E5 | Venceram E10 | Venceram E20 |
|---|---:|---:|---:|---:|---:|---:|
| Adaptive completo | 120 | 4948 | 94 | 44 | 44 | **44** |
| Sem target adaptativo adicional | 120 | 4563 | 88 | 43 | 43 | **43** |
| Sem escolha adaptativa de salas | 120 | 4934 | 94 | 46 | 44 | **44** |

**Total: 360 contas, 14 445 tentativas, 0 erros técnicos e 0 timeouts de combate.** Foram observados 37 565 combates, dos quais 12 001 contra grupos multi-inimigo, 6251 contra Elites e 5887 contra Bosses.

**Ablation emparelhada por semente e perfil:** retirar o target adaptativo produziu 6 contas que passaram a vencer E20 mas 7 que deixaram de vencer (saldo –1). Retirar a escolha adaptativa de salas produziu 1 vitória E20 nova e 1 perdida (saldo 0). **Não há evidência de vantagem global grande de nenhuma destas políticas na conclusão de E20.**

A política `adaptive-no-targets` **não elimina todo o targeting**: mantém a lógica mecânica básica (`S.selectTarget`) e respostas a Thornbloom; remove apenas a camada adicional de prioridade dinâmica do agente. A política `adaptive-no-rooms` mantém os restantes componentes do agente. Após a primeira decisão diferente, rotas e RNG podem divergir: **não são replays emparelhados de um mesmo combate**.

## Zonas problemáticas: mais sementes sem alterar a força dos agentes

Combinando as 20 sementes da Stage 03 e as 12 novas sementes da política Adaptive da Stage 04, obtêm-se 32 contas por perfil (320 contas originais/adicionais, sem duplicação de sementes):

| Perfil | Derrotaram E20 em 32 sementes |
|---|---:|
| Balanced | **32/32** |
| Plate Warden | **32/32** |
| Cautious | 27/32 |
| Cloth Battlemage | 10/32 |
| Magic Lightning | 6/32 |
| Daring | 5/32 |
| Magic Fire | 2/32 |
| Magic Frost | 1/32 |
| Leather Duelist | **0/32** |
| Hexblade Hybrid | **0/32** |

Os perfis incluem diferenças de armas, risco, retirada, afinidades e prioridades. Estes resultados identificam problemas a investigar, **não demonstram que os números das armas sejam a causa isolada**.

## AoE, single-target e híbridos de dano

Dos 120 perfis Adaptive, **12 contas distintas** chegaram a ter uma capacidade classificada como AoE, **42** como single-target e **18** como híbrido de dano (AoE e single-target). A mesma conta pode atravessar mais de um estado, logo as categorias não são exclusivas.

Em combates **naturais com grupos multi-inimigo em E1–E5**, o Adaptive venceu:

| Capacidade observada na altura do combate | Vitórias / combates |
|---|---:|
| AoE | 95/102 (**93,1%**) |
| Single-target | 263/309 (**85,1%**) |
| Híbrido de dano | 332/337 (**98,5%**) |

Estes rácios diferem em equipamento, nível, perfil e sobrevivência; **não constituem uma medição causal da vantagem AoE**. O dano não focado observado é uma diferença líquida de HP por tick e **não equivale a DPS AoE atribuível à fonte**.

## Affinities mistas — talentos comprados, não intenções

No Adaptive, **64 contas distintas** tiveram pelo menos uma observação com duas Affinities aprendidas mas ainda sem habilidade mista; **50** chegaram a ter uma habilidade mista aprendida; e **47** tiveram uma habilidade mista verdadeiramente preparada. São estados atingidos em momentos diferentes e **não são grupos exclusivos**.

Comportamento tardio de builds com habilidade mista preparada é muito forte, mas só aparece nas contas que já sobreviveram aos primeiros níveis; não é prova independente de que a habilidade torna a build dominante.

## Elites e Bosses: hierarquia por etapa

Na política Adaptive, sem corrigir diferenças de risco/perfil entre encontros:

| Faixa | Bosses vencidos / encontros | Elites vencidos / encontros |
|---|---:|---:|
| E1–E5 | 309/1256 (**24,6%**) | 1287/1635 (**78,7%**) |
| E6–E10 | 220/282 (**78,0%**) | 206/206 (**100%**) |
| E11–E20 | 440/465 (**94,6%**) | 290/290 (**100%**) |

**A hierarquia Boss acima de Elite está presente**, mas a resistência efetiva de ambos decresce drasticamente ao longo das Expeditions. De E6 em diante, nenhum Elite encontrado pelos agentes Adaptive os derrotou nesta amostra; a taxa de vitória contra Bosses sobe para 94,6% em E11–E20.

### Arquétipos observados na política Adaptive

| Elite | Vitórias | Taxa |
|---|---:|---:|
| Gravecaller | 174/261 | 66,7% |
| Vampire | 161/233 | 69,1% |
| Ashen Executioner | 222/276 | 80,4% |
| Berserker Elite | 223/260 | 85,8% |
| Caster Elite | 247/280 | 88,2% |
| Briarspine Horror | 228/252 | 90,5% |
| Tank Elite | 221/242 | 91,3% |
| Oathbound Exarch | 307/327 | 93,9% |

| Boss | Vitórias | Taxa |
|---|---:|---:|
| Leech (Blood) | 128/332 | 38,6% |
| Berserker (Fury) | 156/343 | 45,5% |
| Matriarch (Decay) | 181/371 | 48,8% |
| Conductor (Magic) | 151/307 | 49,2% |
| Devourer (Vitality) | 185/349 | 53,0% |
| Guardian (Aegis) | 168/301 | 55,8% |

Estas comparações de tipos são **observacionais**, não enfrentamentos controlados com equipamento idêntico; variam também por Expedition.

## Verificação de targeting real

Agora contamos o número de mudanças de alvo em vez de usar apenas a mediana (frequentemente zero devido a salas solo):

| Política | Mudanças em Bosses | Mudanças em Elites |
|---|---:|---:|
| Adaptive | **1548** | **638** |
| Sem target adaptativo | **1436** | **20** |
| Sem escolha adaptativa de salas | **1552** | **634** |

No Adaptive, 624 mudanças ocorreram em combates contra **Gravecaller**, em 191 dos 261 encontros. A ablation sem targeting adaptativo praticamente elimina esta escolha especial. Isto confirma que a mecânica está realmente a ser aplicada, embora **não prove por si só que ajuda a vencer**.

Contra Bosses com minions, verificaram-se 469 mudanças contra Leech, 844 contra Matriarch e 235 contra Conductor no Adaptive; os restantes Bosses normalmente não exigiram retargeting. As políticas sem target adaptativo continuam a usar targeting mecânico básico.

## Diagnóstico e recomendações antes de balancear

1. **E1–E5:** investigar a progressão natural de Leather Duelist, Hexblade, Magic Frost e Magic Fire. Separar a ausência de poder no início, a escolha de riscos e a qualidade do investimento de talentos/gear.
2. **E6–E20:** a facilidade relativa dos encontros confirma o padrão da Stage 03. Estudar escalas inimigo/jogador, incluindo HP, dano, defesa, Barrier, sustain, XP e gear. Não alterar apenas o HP dos Bosses com base nestes números.
3. **Gravecaller/Leech:** testar a priorização de summons/adds contra foco no Boss no **mesmo estado nativo pré-combate**, com equipamento ganho realmente. O estudo observacional atual sugere diferenças mas não isola a causa.
4. **AoE e sinergias mistas:** medir no motor dano por fonte e por alvo, com builds naturais prontas, antes de concluir que determinada habilidade está demasiado forte.
5. **Escolha de salas:** retirar a camada adaptativa teve saldo zero em E20 nesta amostra. Não há justificação quantitativa para remover ou redesenhar essa IA nesta fase.

## Dados e limitações

- **36 artefactos nativos originais** com sequências integrais de Camp, equipamento, talents, XP, recursos, decisões e combates na [execução original](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44787333743). Artefactos de Actions retidos por 30 dias.
- JSON consolidado e Markdown completo, incluindo resultados por grupo/tamanho, Affinity, Boss e Elite, na [reanálise final](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44789134453).
- Estes agentes são **heurísticas fixas**, não jogadores humanos, e os combates de uma mesma conta não são observações independentes.
- Níveis não desbloqueados não contam como derrotas nesse nível. Paragem às 18 tentativas não prova impossibilidade.

**Sem mudanças em stats, loot ou balanceamento, sem merge e sem deploy.**
