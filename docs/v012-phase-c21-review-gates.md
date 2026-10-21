# Wanderer v0.12 — C.2.1: critérios de aceitação e decisão

Data: 2026-10-21. Escopo: **auditoria de balanceamento**, exclusivamente `development`. Não alterar coeficientes reais antes de analisar medições.

## Estado
- C.2 concluiu 16.128 simulações; o limite global de 2 Legendaries foi implementado e aprovado como regra de equipamento.
- C.2.1 tem script e GitHub Actions no repositório. O relatório final só é válido se `docs/v012-phase-c21-legendary-calibration-results.md` for gerado a partir do artefacto completo, com execução **success**.
- Nada autoriza alterar `combat/v012-combat-runtime.js`, `main`, Railway, Firebase, odds ou saves durante a auditoria.

## Experiência — dados a comparar
- Veil: Barrier por Realm 4/6% -> hipótese 2,5/4% MaxHP e dano pós-absorção 30/45% -> 20/30% base.
- Heartroot: cura 0,30/0,45%/s -> 0,20/0,30%/s; cap por Realm 15% -> 10% MaxHP.
- Variações isoladas e combinadas, perfil até 2 Legendary, **sete builds**, tiers E50/E100/E200, duas políticas de affinity (`triple` / `random`), **64 seeds por política**; comparar clears, profundidade, Barrier/s, Heal/s, DPS, EHP observado, procs.
- Combinações centrais: `Oathwall + Veil`, `Verdant Oath + Veil`, `Voidglass + Veil`, `Veil + Heartroot`, `Oathwall + Heartroot`, `Gravewake + Eye of Morrow`.

## Gates técnicos não negociáveis
1. Matriz de **24.192/24.192** corridas com `complete=true`, sem timeouts/exceções.
2. **384/384** pares `Gravewake + Eye of Morrow` idênticos sob controlo sem os dois poderes alterados: 0 divergências.
3. Para cada E/build/perfil, **128** corridas por variante relevante; as mesmas seeds/stream e equipamento sintético Epic equivalente.
4. Conservar baseline compatível com a matriz C.2. Exemplos para comparação de perfil/seed equivalentes: `Oathwall + Veil` com Sword+Shield em E200 **110/128** e `Verdant Oath + Veil` em E200 **121/128**, E50 **76/128**. Divergência de baseline implica depurar o simulador antes de interpretar a calibração.
5. Valores `Veil`/ `Heartroot` mudam **só no module override em VM** durante o teste; nenhuma alteração ao runtime efetivo.
6. Report com resultados de **cada build**, por nível, perfil e política, em vez de aprovar pelos agregados globais.

## Critérios de decisão de gameplay (a avaliar, não aprovação numérica prévia)
- Nerf deve reduzir sobrevivência excessiva, não colapsar Cloth Staff/Wand já frágeis em E50.
- Inspecionar `Oathwall + Veil` e `Verdant Oath + Veil` separadamente; um nerf global de Veil sem reduzir supremacia defensiva não resolve C.2.
- Heartroot deve preservar utilidade em Dual Daggers e Mace+Shield, sem dominar todo o orçamento de cura.
- Estimar variabilidade entre políticas `triple` e `random`; não aplicar meta rígida de win-rate onde até o baseline Epic E200 está em **45%**.
- Se C.2.1 mostrar desequilíbrios residuais, fazer **C.2.2** focada e pareada nos pares problemáticos, em vez de alterar os 12 Legendaries indiscriminadamente.

Fonte inicial: [C.2 — resultados do limite de dois](v012-phase-c2-two-legendary-balance-results.md).

A Fase C.3 de catálogo/assets já foi especificada em [v012-phase-c3-catalog-and-assets-scope.md](v012-phase-c3-catalog-and-assets-scope.md), **mas não faz parte deste rebalanceamento**.
