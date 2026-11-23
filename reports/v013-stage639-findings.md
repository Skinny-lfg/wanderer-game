# Stage 6.39 — Resultados verificados, 500 contas naturais + 30 percursos AoE/ST (23/11/2026)

## Estado e evidências

- **PR #143 em draft; SEM merge nem deploy.**
- [GitHub Actions 45217628500](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45217628500): `npm test` completo e preflight aprovado; 100/100 cohort jobs da matriz de **500 contas E1-born** aprovados; 30/30 contas do estudo E1–E12 AoE aprovadas e agregadas.
- O primeiro agregador das 500 contas falhou por uma função de importação não exportada (`V.rate`, após `V.summaryAccount` no smoke). Corrigido e testado: `R.rate` e `R.summaryAccount` de `scripts/v013-stage634-natural-rates.cjs`. **Nenhum combate foi falsificado nem reexecutado para corrigir os dados.**
- A primeira recuperação obteve só 79/100 ficheiros pela limitação de paginação em `actions/download-artifact`. [Recuperação verificada 45220296709](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45220296709) obteve por API paginada os 21 restantes, validou **100/100 ficheiros**, recusou duplicados/fontes misturadas e produziu [agregado final](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45220296709/artifacts/14840890341), JSON + Markdown (fingerprint nativo `a5d071d33767507f020e2c7080807b0f4391bad0456c3c70939ac965e87822fd`).
- [Estudo AoE controlado E1–E12](https://github.com/Skinny-lfg/wanderer-game/actions/runs/45217628500/artifacts/14838134130): 30 personagens E1-born, checkpoints E1 30, E3 17, E5 17, E8 16, E10 13, E12 13; 106 checkpoints legitimamente alcançados.

## 1. Taxas nativas antes (Stage6.38) vs depois (Stage6.39)

**Taxas são percentagens de vitória do jogador em encontros resolvidos, NÃO em Expeditions completas.** Ambas as experiências têm os mesmos perfis/seeds, mas progressão, equipamento obtido, decisões e salas mudam quando o combate muda. Comparação diagnóstica, não A/B emparelhado.

| E | Contas E6.38 → E6.39 | Normal solo antes → depois | Grupos 2–4 antes → depois | Grupos 5+ antes → depois | Elite antes → depois | Boss antes → depois |
|---|---|---|---|---|---|---|
| E1 | 500 → 500 | 96,1% → **85,4%** (3427/4012) | 43,1% → **32,7%** (334/1021) | 13,7% → **13,1%** (27/206) | 65,9% → **53,5%** (200/374) | 36,7% → **70,5%** (279/396) |
| E2 | 241 → 279 | 98,6% → **73,5%** (1448/1971) | 57,4% → **55,8%** (335/600) | 50,7% → **38,0%** (63/166) | 73,7% → **66,7%** (319/478) | 76,3% → **73,4%** (152/207) |
| E3 | 203 → 152 | 99,7% → **95,4%** (729/764) | 71,5% → **66,5%** (307/462) | 65,9% → **54,1%** (66/122) | 90,5% → **81,9%** (244/298) | 87,6% → **91,2%** (125/137) |
| E4 | 190 → 125 | 99,8% → **98,9%** (528/534) | 66,2% → **59,2%** (206/348) | 62,7% → **55,6%** (40/72) | 92,0% → **91,3%** (178/195) | 89,9% → **90,7%** (117/129) |
| E5 | 178 → 117 | 100% → **100%** (316/316) | 81,3% → **81,5%** (190/233) | 67,9% → **57,7%** (30/52) | 99,0% → **100%** (133/133) | 97,2% → **95,8%** (115/120) |

**Decisão:** é uma **regressão de balanceamento**, apesar de todos os testes técnicos passarem. Não fazer merge. O solo E1 aproximou-se dos 80–90%, mas E2 cai para 73,5%, 2–4 E1 e 5+ E1 permanecem difíceis. Os desbloqueios E2 **241→279**, mas E5 **178→117**, forte quebra E2–E4. E5 Elites 100%, Bosses 95,8% — demasiada facilidade nos sobreviventes.

## 2. AoE: hipótese de que a falta de builds adequadas explica grupos grandes

É apenas parte da resposta; **não é a causa única**.

### 30 contas controladas / mesmos itens e talentos legítimos

- E1: **0/30** personagens com AoE disponível, E3 **0/17**, E5 **0/17**; E8 **3/16**, E10 **2/13**, E12 **2/13**. Esta subamostra específica tinha Sword na E1; **não generalizar a zero AoE para todos os 500 perfis**.
- Com o mesmo personagem realmente ganho e Risk1 contra 1/3/5/8/12 inimigos, E1 **0/30** vitórias para qualquer grupo de 3 ou mais; E3 grupos 3 14/17, 5 8/17, 8 9/17, 12 15/17; E5 grupos 3 12/17, 5 9/17, 8 8/17, 12 8/17. O comportamento não é monotónico devido a composição dos mobs, ataques por posição, reforços, duração e capacidades.
- Uma build com **Chain Lightning (Overcharge)** na E8 causou 330/573/572 de dano direto a alvos secundários nas salas de 5/8/12 e venceu as três. Duas builds com `fire_spread` ganharam 5 mas perderam 8/12. Dano DoT espalhado não é totalmente capturado pela métrica de hits secundários; estes exemplos não provam que Lightning seja universalmente superior.

### 500 contas naturais: AoE potencial na E1 é frequente nas hordas

| E | Hordas 5+ com AoE potencial | Hordas 5+ sem AoE potencial |
|---|---|---|
| E1 | **16/128 (12,5%)** | **11/78 (14,1%)** |
| E2 | **30/99 (30,3%)** | **33/67 (49,3%)** |
| E3 | **13/39 (33,3%)** | **53/83 (63,9%)** |
| E4 | **11/20 (55%)** | **29/52 (55,8%)** |
| E5 | **3/3 (100%)** | **27/49 (55,1%)** |

Na E1, as hordas por arma equipada: **Bow 0/67**, Two-Handed **16/61 (26,2%)**, Sword **11/66 (16,7%)**, Staff **0/8**, Daggers **0/3**, Mace **0/1**. AoE não garante sobrevivência, e este recorte não controla atributos nem Risk. A comparação não deve converter-se num buff/nerf de talento sem controlar tipo de arma, armadura, grupo, Risk, alvo e dano.

## 3. Oito Elites, INDIVIDUALMENTE, no novo código

Taxas E1 naturais e E5 (E5 sofre seleção de sobreviventes):

| Elite | E1 vitórias | E5 vitórias | Decisão de calibração |
|---|---:|---:|---|
| Gravebound Bulwark | 4/7 (57,1%) | 21/21 (100%) | E1 amostra demasiado pequena para novo ajuste; E5 trivial |
| Bloodscar Ravager | 10/61 (16,4%) | 13/13 (100%) | **demasiado difícil E1**, reverter aumento excessivo; rever ataques rápidos |
| Sanguine Wraith | 22/45 (48,9%) | 12/12 (100%) | E1 difícil; rever sustain vs burst |
| Voidborne Hexer | 23/42 (54,8%) | 19/19 (100%) | aproximar 60–70% sem perder hex |
| Gravecaller | 10/33 (30,3%) | 16/16 (100%) | **demasiado difícil E1**, rever pressão das summons e DoT, não só HP |
| Oathbound Exarch | 11/37 (29,7%) | 23/23 (100%) | aumento E1 excessivo; rever Barrier e ataque |
| Briarspine Horror | 116/130 (89,2%) | 17/17 (100%) | **muito fácil E1**, rever quando Thornbloom dispara e counterplay |
| Ashen Executioner | 4/19 (21,1%) | 12/12 (100%) | difícil E1, pequena amostra; rever first heavy strike e cap |

As oito identidades foram efetivamente alteradas na base (Hexer preservado) sem alterar habilidades, e a mesma função E1–E200 continua. **Os resultados reprovam a primeira calibração**.

## 4. Seis Bosses, ID efetivamente encontrado (não Affinity de perfil)

| Boss | E1 vitórias | E5 vitórias | Diagnóstico |
|---|---:|---:|---|
| Rift Harbinger / leech | 7/7 (100%) | 18/18 (100%) | amostra E1 demasiado pequena |
| Carrion Matriarch / matriarch | 80/93 (86,0%) | 20/22 (90,9%) | fácil |
| Heartroot Devourer / devourer | 19/47 (40,4%) | 7/8 (87,5%) | **E1 dentro 35–45%**, E5 fácil |
| Abyssal Guardian / guardian | 16/18 (88,9%) | 29/29 (100%) | fácil |
| Ember Sovereign / berserker | 88/141 (62,4%) | 19/19 (100%) | fácil |
| Stormglass Conductor / conductor | 69/90 (76,7%) | 22/24 (91,7%) | fácil |

**Cuidado:** as decisões naturais sobre entrar no Boss mudaram muito. Encontros E1 Boss diminuíram **657 na Stage6.38 → 396 na Stage6.39**, e Elites **1.388 → 374**; portanto E1 Boss win rate global 36,7%→70,5% não é prova causal de que o Boss ficou mais fraco. Vence E1 Boss quem efetivamente chega e decide tentar; muitas personagens morrem/extraiem antes. Ainda assim, os resultados de identidade revelam disparidades grandes.

## 5. Próxima intervenção fundamentada

**Não aprovar Stage6.39 com estes números**. Fazer experiências A/B controladas, por personagem e encontro idênticos, uma variável de cada vez:

1. **Solo por papel e E:** comparar os coeficientes de Tank, Skirmisher e Caster em Risk0/E1/E2, sem esconder a diferença entre progressão real E1→E2. O aumento atual é excessivo em E2.
2. **Grupos 2–4 e 5+:** preservar Minions frágeis, estudar pressão de ataques simultâneos, composição e saúde total por tamanho; os 500 agentes mostram que AoE sozinho não explica derrotas.
3. **Elite:** comparar cada oito identidades nos mesmos checkpoints realmente ganhos, com e sem habilidades especiais por braço isolado (não eliminar mecânicas sem confirmação).
4. **Boss:** seis identidades reais, com mesmo equipamento/XP, Risk, preparação e summons; alvo E1 35–45%, mas **sem deixar a E5–E12 trivial** nem introduzir buffs por Expedition.
5. **Curva:** só depois da análise, calibrar os parâmetros da única função contínua para compatibilidade entre E1–E200. Sem mudar tiers de gear ou inventar E5/E10 rupturas.

### Engenharia / PR

Toda a fonte gameplay, simulador, Pages mirrors, fingerprints e testes de regressão estão no PR draft #143. Os testes técnicos verdes **não** equivalem a aprovação de balanceamento. A matriz diagnóstica está inteiramente arquivada; para novos valores de inimigos será necessário repetir os testes após cada alteração.

**No merge, no deploy.**
