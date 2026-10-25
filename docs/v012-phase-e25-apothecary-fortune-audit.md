# Wanderer v0.12 — E.2.5 Apothecary Strategy & Fortune

**PASS técnico; conclusões económicas provisórias.**

GitHub Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39669748030

## Regra confirmada
No runtime de produção, Fortune multiplica a **probabilidade de drop por 1,25** (cap 100%). Não altera diretamente as odds da raridade. Para avaliar benefício, usar loot efetivamente conservado e recursos líquidos, não apenas rolls gerados.

## Método
Oito estratégias com 30 seeds pareadas cada (240 combates E200), todos com Bow/Leather sintético, afinidades planeadas e três slots. Poções são preparadas em memória e usadas pelo runtime nos intervalos permitidos, não compradas no Apothecary durante estes combates; `selectedGold` é valor **teórico do kit**, não despesa líquida. A política ativa os buffs na primeira oportunidade, não necessariamente no momento ótimo.

| Cenário | Vitórias/30 | Uso de poções | Itens reportados por `results().earned` | Common | Uncommon | Rare | Epic | Legendary | Custo teórico do kit nas 30 tentativas |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Sem poções | 22 | 0 | 262 | 77 | 78 | 71 | 30 | 6 | 0 |
| Sobrevivência (Health, Ironhide, Barrier) | 30 | 75 | 270 | 77 | 78 | 77 | 32 | 6 | 49500 |
| Ofensiva (Might, Haste, Health) | 29 | 75 | 254 | 76 | 67 | 62 | 40 | 9 | 49500 |
| Fortune, Health, Haste | 29 | 45 | 297 | 96 | 72 | 86 | 34 | 9 | 64500 |
| Fortune, Might, Ironhide | 19 | 60 | 309 | 102 | 81 | 92 | 28 | 6 | 64500 |
| 3 Health | 30 | 21 | 270 | 77 | 78 | 77 | 32 | 6 | 31500 |
| Defensiva (Barrier, Ironhide, Health) | 30 | 75 | 270 | 77 | 78 | 77 | 32 | 6 | 49500 |
| Mágica (Arcane, Mana, Barrier) | 21 | 86 | 260 | 78 | 82 | 71 | 24 | 5 | 49500 |

Todos zero erros e timeouts.

## Riscos e limitações
- `results().earned` não equivale necessariamente a itens retidos após derrota; o teste recolhe `lootKept`/`lootLost` por seed no JSON de artefacto, mas ainda não os agregou nesta tabela. **Não chamar loot bruto de lucro líquido.**
- Fortune aumenta chances de item cair, não a raridade. O número Legendary isolado é demasiado pequeno para qualquer inferência de taxa.
- O kit Fortune + Might + Ironhide caiu para 19/30 vitórias nesta amostra, apesar dos 309 itens brutos. A diferença pode refletir ausência de cura e RNG; não isolar causalmente Fortune.
- `meanReached` em 15 para todos os cenários não é métrica fiável de progressão; não utilizar.
- A build é física Bow/Leather. A estratégia chamada `magic` não é testada com uma build de caster e não deve ser interpretada como eficácia da Arcane Potion numa build apropriada.
- Os custos são valores teóricos de seleção inicial. Não foram feitos purchases ou rerolls reais, nem liquidado o stock após cada run. A E.2.4 é teste separado de compras e settlement.

**Próximo teste:** integrar compras e consumos entre tentativas, segmentar `kept`/`lost` e preço observado por kit. Repetir para caster e outros estilos com efeitos temporizados. Não fazer alterações de balanceamento nesta fase.
