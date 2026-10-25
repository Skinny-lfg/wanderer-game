# Wanderer v0.12 — E.3.6 Off-Hand Dagger progression validation

**PASS técnico — 1.200 combates sintéticos; 0 erros/timeouts.**
Workflow: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39681359553

## Objetivo
Validar o nerf aprovado 50%→35% da Off-Hand Dagger em E50, E100, E150 e E200 sem alterar o motor em execução. Comparar o valor antigo de 50%, o atual de 35% e Archer em seeds correspondentes. 100 seeds por combinação, 12 grupos, total 1.200 casos. O coeficiente antigo é simulado numa cópia de runtime em memória e não reposto em produção. Equipamento Epic sintético da tier relevante, runas, talentos planeados e motor real de combate. Independente por Expedition; **não** são 1.200 corridas de progressão persistente.

| Level | Dual 50% wins | Dual 35% wins | Archer wins | Dual 50% DPS | Dual 35% DPS | Archer DPS |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| E50 | 100/100 | 86/100 | 64/100 | 1073 | 973 | 962 |
| E100 | 98/100 | 81/100 | 69/100 | 2190 | 1994 | 1998 |
| E150 | 99/100 | 95/100 | 89/100 | 3454 | 3103 | 3132 |
| E200 | 98/100 | 91/100 | 84/100 | 4564 | 4102 | 4145 |

## Diagnóstico
- O fator 35% aproxima o DPS do Assassin ao Archer (diferença +11, -4, -29 e -43 DPS para E50, E100, E150, E200).
- O Assassin manteve taxas de vitória superiores às de Archer nos quatro escalões. Essa margem não pode ser atribuída a DPS isoladamente; pode envolver mais efeitos de Bleed, evasão, talentos e duração dos combates.
- E100 registou a maior redução de vitórias (98→81), de 17 pontos percentuais, e merece foco no próximo teste.
- A amostra é sintética, com equipamento por tier e seleção planeada; não mede jornadas completas nem escassez de equipamento, loot, Gold ou perdas de gear. 
- Não foi efetuada validação integral das outras armas/armaduras, dos talentos com afinidades diferentes ou de Rot.
- A E.3.6 **não incluiu a análise autónoma de Rot**, que permanece pendente.
- NÃO alterar novamente o fator 35% em função desta fase; aguardar teste de progressão persistente E75–E125 e outros arquétipos.

## Decisão
Manter Off-Hand Dagger a **35%** em development, sem promover para main automaticamente. Proposta E.3.7: persistência e curvas de E75–E125 para Dual Daggers e Bow; possível teste dos efeitos das sinergias e variantes com outras afinidades. Sem impacto Firebase ou saves reais.
