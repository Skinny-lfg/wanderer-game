# v0.13 — etapas 4 e 5: bónus coerentes e hierarquia visual

## Etapa 4 — uma regra para os stats

- Camp, atributos da árvore, preparação, comparação de equipamento e início de combate usam a mesma projeção de stats.
- Passivos permanentes como Strong Heart, Iron Skin, Quick Hands e Arcane Focus entram também nos valores do Camp. Deixou de ser necessário começar uma expedição para ver o seu efeito.
- Recursos de Magic em armas físicas são criados antes dos modificadores percentuais. Assim, os bónus de Spell Power e Mana prometidos pelos talentos têm efeito real.
- Equipamento temporariamente fortalecido, Runes fortalecidas e efeitos de eventos são aplicados uma vez no cálculo central. Dados temporários remanescentes de uma derrota não afetam os stats do Camp.
- Gear Power é recalculado depois dos modificadores, incluindo magia em armas físicas. Continua a ser uma estimativa, não uma medida completa de desempenho.
- O campo de velocidade respeita o limite de 4,2 ataques/s depois dos modificadores de preparação/eventos; procs condicionais continuam a ser apresentados como buffs.
- O total continua à esquerda e o bónus líquido a verde/vermelho ao lado. Atributos atribuídos diretamente por level integram a base; equipamento, Runes, pequenos nós, talentos e efeitos produzem os bónus.
- Bonus sources mostra contribuições em valores absolutos que somam ao total. São calculadas em sequência: equipamento, Runes, talentos, efeitos temporários; as interações e arredondamentos ficam incluídos.

## Etapa 5 — menos ruído e melhores decisões

- O projeto de equipamento está integrado no painel de entrada, antes de Start Expedition; o mobile mostra esse painel antes da personagem e dos detalhes de stats.
- Comparações e regras secundárias são expansíveis. Spell Power e Mana tornam-se stats principais quando a personagem os utiliza.
- O Forge mostra a imagem, stats exatos, efeito e comparação com o equipado antes da compra. Daggers e Rings permitem escolher o slot de comparação.
- A pré-visualização usa a mesma geração e transformação de perfil que o craft real, sem gastar materiais, criar IDs ou consumir RNG.
- Custos mostram Ready ou a quantidade em falta. É possível parar de acompanhar um projeto e abrir diretamente o projeto acompanhado a partir do Camp.
- As fontes existentes e as suas licenças passaram a ser incluídas na Pages. Os módulos de equipamento também recebem hash de conteúdo.
- Na arena, stats completos, Runes e log ficam acessíveis por expansão. As affinities usam uma linha compacta; secções vazias de buffs/Runes/abilities deixam de ocupar espaço.
- Mantidos personagem à esquerda, mobs à direita, sombras pequenas, animações, pequeno nodes de stats e bónus coloridos. Não foram alteradas animações 2D.

## Validação

- 96 testes da v0.13 passaram.
- Comparação Camp → preparação → combate em cinco combinações de armas/talentos, percentagens de Magic, buffs temporários, fontes somadas, penalizações e limite de velocidade.
- Todas as receitas comparadas com o craft real nas bandas E1, E6 e E201; teste de preservação do RNG e dos IDs ao navegar nos previews.
- Quatro percursos de Chrome: combate/crafting, limpeza/navegação, árvore/touch/teclado e novos stats/fontes/projetos/previews. Desktop e mobile sem overflow de página nos ecrãs verificados.
- Screenshots revistos de Camp, Forge e combate.
- Suite histórica: 394 testes; 312 passam e 82 falham, os mesmos resultados da etapa anterior. Sem novas falhas.

## Limites

Estas etapas verificam coerência dos números, transações e apresentação; não provam equilíbrio global nem diversão. Taxas de drop, custos de materiais e progressão das expedições não foram rebalanceados. Foram usados perfis sintéticos; não se alteraram contas, saves reais, Firebase ou regras de segurança.
