# Wanderer v0.12 — E.2.10 Controlled Full Potion Kits

**PASS técnico: 450 simulações, sem erros nem timeouts.**
Run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39675896934

## Método
5 builds × 3 cenários (sem poções, kit adaptado, Fortune) × 30 seeds; arranque sintético E200 Bow/Leather, Staff/Cloth, Wand+Orb/Cloth, Sword+Shield/Plate e Daggers+Off-Hand Dagger/Leather com equipamento E196–200 e três runas E190/195/199. Cada Expedition independente recebe o kit pretendido no inventário em memória, usando a seleção e uso reais do runtime, não a compra ao Apothecary. Consumo manual apenas entre Realms, segundo política do harness (Health se <82% HP máximo; Mana se <60% MP; os buffs na primeira ocasião). Fortune é consumida automaticamente no início, não integra o contador de uso manual.

| Build | Sem poções | Adaptadas | Fortune | Loot bruto sem/adaptadas/Fortune |
|---|---:|---:|---:|---|
| Archer | 22/30 | 30/30 | 29/30 | 262 / 270 / 297 |
| Mage | 19/30 | 27/30 | 26/30 | 247 / 262 / 317 |
| Battlemage | 12/30 | 17/30 | 20/30 | 232 / 243 / 316 |
| Tank | 14/30 | 25/30 | 23/30 | 244 / 258 / 304 |
| Assassin | 29/30 | 30/30 | 30/30 | 270 / 275 / 340 |

Utilizações manuais aceites (sem incluir Fortune automático):
- Archer adaptadas: 75, Fortune: 45
- Mage adaptadas: 60, Fortune: 53
- Battlemage adaptadas: 60, Fortune: 56
- Tank adaptadas: 90, Fortune: 60
- Assassin adaptadas: 61, Fortune: 32

Na Mage e Battlemage os 60 usos do kit adaptado com 30 seeds e três poções cada são compatíveis com dois buffs utilizados por run, e nenhuma Mana Potion, face à política da auditoria e dos resultados anteriores. Para confirmar falta absoluta de ativação Mana, adicionar contadores específicos por tipo e snapshots MP antes dos intervalos; não atribuir o benefício do kit a Mana.

## Conclusões e limites
- Kits completos aumentam sobrevivência na maioria das builds. O Tank melhora 14→25 vitórias, Mage 19→27; Battlemage mantém-se a pior build (12→17 e 20/30 com Fortune).
- Assassin tem teto elevado mesmo sem poções (29/30), exigindo investigação causal das capacidades Dual Daggers/bleed e estabilidade noutras seeds, sem nerf automático.
- As 450 runs não são trajetórias económicas persistentes: as poções foram pré-carregadas, sem compra real. `selectedGold` é custo teórico bruto se compradas todas as vezes, não Gold debitado, custo líquido ou rentabilidade. Esta fase isola eficácia, complementando E.2.7–E.2.9.
- Os eventos e loot podem depender do RNG e pequenas mudanças de sequência; as mesmas seeds foram usadas por cenário, mas nem todos os draws são garantidamente idênticos após as ações de poções.
- Loot reportado é bruto e não se deve confundir com itens mantidos; Fortune aumenta drop chance relativa em 25%, não odds de raridade.
- Os kits mágicos são Arcane+Mana+Barrier; kits Fortune mágico Fortune+Health+Arcane; Tank Barrier+Ironhide+Health; Assassin Might+Haste+Health; Archer Health+Ironhide+Barrier. As armaduras e Off-Hands respeitam as combinações testadas.
- A métrica de progresso em 15 nas derrotas não deve ser usada como progressão.

**Recomendação:** E.3 iniciar com diagnóstico de Battlemage e Assassin (danos efetivos, offhand, proc, afinidades, inimigos); instrumentar condições de Mana e a mitigação Tank antes de qualquer ajuste. Nenhuma mudança de balanceamento em E.2.10.
