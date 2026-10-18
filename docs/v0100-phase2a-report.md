# Wanderer v0.10.0 — Fase 2A: Resistência e scaling

**Data:** 17-10-2026  
**Estado:** relatório de investigação; **código não alterado**.  
**Fonte:** ZIP da branch `main` fornecido pelo proprietário (não é um teste da branch `development`). SHA-256 `index.html`: `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`.

## Objetivo e método

Avaliar Regen, Shield e Sunder após a passagem de valores fixos a percentagens, mantendo Dark como controlo. O simulador de combate de produção (`scripts/simulate-v091.cjs`) correu o `index.html` em Node VM com `combat/legendary.js`; o braço A reverteu **só em memória** as três mudanças; B usou a v0.10.0 publicada. As duas variantes partiram do mesmo equipamento legal, seed, elite e dungeon. Os caminhos Temple, Ash, Frost, Drowned e os quatro elites rodaram entre casos.

Foram **3.184 pares A/B (6.368 combates)**:
- 2.048 pares com equipamentos gerados: 4 builds × 8 níveis (D39/40/99/100/159/160/199/200) × 2 perfis (misto e Epic) × 32 seeds.
- 1.136 pares com 71 inventários historicamente adquiridos (39 D40, 15 D100, 9 D160, 8 D200), com 16 seeds por inventário.
- O teste `tests/v0100-affinity-scaling.cjs` e os testes selecionados de habilidades/progressão passaram.

## Combate gerado: perfil misto, vitórias A → B (256 por build)

| Build | D39 | D40 boss | D99 | D100 boss | D159 | D160 boss | D199 | D200 boss | Total |
|---|---|---|---|---|---|---|---|---|---|
| Regen | 24→26 | 2→3 | 32→32 | 26→30 | 32→32 | 32→32 | 32→32 | 32→32 | **212→219** |
| Shield | 17→19 | 1→2 | 31→31 | 20→25 | 32→32 | 31→32 | 32→32 | 32→32 | **196→205** |
| Sunder | 9→8 | 0→0 | 26→27 | 6→8 | 31→32 | 26→29 | 32→32 | 29→30 | **159→166** |
| Dark (controlo) | 22→22 | 7→7 | 30→30 | 30→30 | 32→32 | 32→32 | 32→32 | 32→32 | **217→217** |

A alteração média de HP restante foi **+4,9 p.p. Regen**, **+13,2 p.p. Shield**, **+2,8 p.p. Sunder**, **0 Dark**. Shield gerou cerca de +590 Barrier por expedição comparado com o antigo comportamento, mas **Barrier gerada não é igual a dano bloqueado efetivo**.

**Teto estatístico:** todos os 256 combates Epic de cada build venceram nos dois braços, logo essas taxas não informam sobre late-game.

## Inventários historicamente adquiridos

| Milestone | Inventários | Pares | Vitórias antigas | Vitórias novas |
|---|---:|---:|---:|---:|
| D40 | 39 | 624 | 390 (62,5%) | 447 (71,6%) |
| D100 | 15 | 240 | 176 (73,3%) | 196 (81,7%) |
| D160 | 9 | 144 | 143 (99,3%) | 143 (99,3%) |
| D200 | 8 | 128 | 128 (100%) | 128 (100%) |
| **Total** | **71** | **1.136** | **837 (73,7%)** | **914 (80,5%)** |

Diferença **+6,8 pontos percentuais**, com intervalo aproximado de bootstrap agrupado por inventário/jogador **+4,1 a +10,3 p.p.** Os mesmos inventários podem ter múltiplas afinidades 2/3/5 ativas: a análise agrupada **não isola** causalmente cada set. Nas comparações em amostras de build dominante, Shield teve o maior incremento defensivo; Regen e Sunder também melhoraram.

## Decisão

- **Não modificar ainda nenhuma estatística em produção**.
- Prioridade: estudar a influência de Shield/Regen na viabilidade comparativa de armas, em especial fora da saturação de D160/D200.
- D200 requer equipamentos menos otimizados e uma campanha persistente nova; os inventários adquiridos aqui foram obtidos **antes** do scaling v0.10.0.
- Próxima etapa: Fase 2B, comparação de armas e afinidades, incluindo Shatter, Double Strike e Legendary.

## Limitações

O emparelhamento garante seed e equipamento iniciais, **não sequência idêntica de RNG** quando o fluxo de habilidades diverge. São expedições automáticas isoladas, não trajetórias humanas; nem todas as combinações de equipamento gerado representam inventários reais. Nenhum save, conta Firebase ou branch de jogo foi modificado.

Relatório detalhado e JSON de cada ensaio foram também gerados localmente no chat da investigação, mas **não** são adicionados automaticamente a este commit.
