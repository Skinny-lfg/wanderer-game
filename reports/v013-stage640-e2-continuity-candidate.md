# Stage 6.40 — candidato de continuidade E1 → E2 e ajustes individuais de Elites

Estado: **candidato não validado pelo motor nativo após estas alterações**. Sem merge/deploy.

## Evidência de entrada

Ficheiro fornecido: `e1-e2.json`, 500 contas (100 estratégias × 5 sementes), fonte SHA-256 `852acc49bb2210382533e927850868cc00a5f005ab4251eaec108cfbfb77bd2b`. Apenas 190/500 contas chegaram à E2 durante o horizonte simulado: comparar percentagens E1/E2 diretamente não isola a dificuldade porque existe seleção de sobreviventes.

| Encontro | E1 (vitórias / resolvidos) | E2 (vitórias / resolvidos) |
|---|---:|---:|
| Normal solo | 3830/4729 (81.0%) | 807/841 (96.0%) |
| Normal com 2 | 546/640 (85.3%) | 180/186 (96.8%) |
| Normal com 3 | 299/424 (70.5%) | 73/148 (49.3%) |
| Normal com 4 | 354/418 (84.7%) | 45/144 (31.3%) |
| Normal com 5+ | 231/318 (72.6%) | 89/182 (48.9%) |
| Todos os Elites | 499/658 (75.8%) | 256/306 (83.7%) |
| Todos os Bosses | 190/484 (39.3%) | 154/181 (85.1%) |

A discrepância E2 dos grupos 3/4 aparece também quando há AoE presente, por exemplo grupos de três: 68/70 E1 e 5/23 E2. **Não atribuir toda a queda à falta de AoE.** Não interpretar os percentuais dos Bosses E2 sem controlar a força das personagens que chegam lá.

## Correção candidata: continuidade dos grupos

A versão anterior aplicava o alívio adicional dos grupos normais apenas quando `tier === 1`. A nova versão usa a mesma fórmula de E1, mas multiplica a sua intensidade por `exp(-0.5 × (Expedition − 1))`. Pesos aproximados:

| Expedition | Peso da proteção inicial |
|---|---:|
| E1 | 1.000 |
| E2 | 0.607 |
| E3 | 0.368 |
| E4 | 0.223 |
| E5 | 0.135 |

Assim, E1 permanece **inalterada**; E2+ perde a proteção continuamente, sem um corte no início da E2. O ajuste afeta **apenas grupos normais com mais de um inimigo**, não Elites, Bosses, nem encontros solo; mantém os perfis de papéis, as reservas e a regra própria das invocações. Não altera a curva exponencial `enemyReference`.

## Elites — diagnóstico individual antes do candidato

| Elite | E1 | E2 | Decisão candidata |
|---|---:|---:|---|
| Gravebound Bulwark (tank) | 23/28 (82.1%) | 38/39 (97.4%) | Subir vida e ataque base, reforçar E1 |
| Bloodscar Ravager (berserker) | 48/72 (66.7%) | 28/39 (71.8%) | Preservar |
| Sanguine Wraith (vampire) | 69/101 (68.3%) | 21/32 (65.6%) | Preservar |
| Voidborne Hexer (caster) | 82/109 (75.2%) | 41/44 (93.2%) | Subir HP e ataque base, pequeno reforço E1 |
| Gravecaller | 111/145 (76.6%) | 37/53 (69.8%) | Aumentar só HP E1 |
| Oathbound Exarch | 21/34 (61.8%) | 32/35 (91.4%) | Subir base E2+, preservar orçamento E1 |
| Briarspine Horror | 119/124 (96.0%) | 28/30 (93.3%) | Reforçar HP, ATK e frequência de ataques |
| Ashen Executioner | 26/45 (57.8%) | 31/34 (91.2%) | Reforçar base E2+, preservar orçamento E1 |

Todos estes parâmetros devem ser avaliados com **simulações emparelhadas**, usando os mesmos estados de jogador, equipamento, talentos, HP, sementes e encontros. As percentagens acima são observações **anteriores** ao candidato e não são resultados dos novos valores.

## Especialização e metas

Testar separadamente Single Target puro, AoE puro e híbridos com progressão legal de gear/talentos. Não perseguir uma taxa agregada uniforme por grupo: ST deve dominar solo e perder vantagem com a quantidade; AoE deve seguir a tendência inversa; híbridos devem ser menos extremos. Avaliar sobreposição dos intervalos de confiança, exposição desigual às famílias e origem das mortes.

## Validação obrigatória antes de aceitar

```powershell
cd "C:\Users\AI-dev\Documents\GitHub\wanderer-stage-640"
git pull --ff-only
node --test tests/v013-stage640-e1-groups.test.cjs tests/v013-stage640-elite-identity.test.cjs
node scripts/v013-stage640-calibration.cjs results/stage640/e1-e2-candidate.json . full
```

Comparar `e1-e2-candidate.json` com o `e1-e2.json` original (mesmo conjunto de 100 perfis/5 sementes); executar também o matched replay do Stage 6.40 e regressões relevantes antes do merge. Se houver aumento excessivo da taxa de vitória dos grupos E2 ou regressões em E1, rever os coeficientes em vez de aceitar automaticamente.

**Por fazer:** ajustes individuais dos seis Bosses, inspeção de habilidades, summons e duração das lutas; novas medições E1/E2 e comparação AoE/ST sob snapshots controlados.
