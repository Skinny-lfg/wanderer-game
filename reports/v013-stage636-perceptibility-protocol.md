# Wanderer Stage 6.36 — tornar a evolução da personagem perceptível em combate

## Decisão confirmada antes do teste

**Não mexer nos intervalos do equipamento.** O objetivo do sistema é a longevidade de bons itens, não um upgrade automático a cada Expedition.

**Não assumir `1% UI Power = 1% DPS`, nem escalar inimigos a 1% por defeito.** O indicador Power não captura de forma comparável toda a sobrevivência, os procs, spells, barreiras, cura, rotação e cooldowns.

## Evidência real de 6.35

Fonte: GitHub Actions `45183124456`, agregado nativo `stage635-native-player-growth-e1-e200-100x5`, SHA do motor registado no JSON de origem. O arquivo não foi reprocessado para inventar trajetórias individuais.

- **500 contas E1**, 230 chegaram E2, 150 chegaram E5, 127 chegaram E20, 124 chegaram E70 e 91 chegaram E200.
- Crescimento mediano *do mesmo jogador* em **UI Power**: E1→E2 +51,351%; E4→E5 +9,910%; E8→E9 +4,010%; E9→E10 +1,632%; E19→E20 +0,765%; E34→E35 +1,558%; E69→E70 +1,426%; E99→E100 +0,701%; E149→E150 +0,416%; E199→E200 +0,401%.
- Entre E9→E20, a mediana das medianas de variação por Expedition é +0,848% de UI Power, mas +0,000% Attack e +0,000% Defense (não significa que todos tiveram 0%).
- Entre E151→E199, as medianas das medianas por nível são +0,437% UI Power, +0,550% HP, +0,319% Attack e +0,383% Attack×Attack/s.
- Os valores acima por *faixa* são medianas das medianas por transição, **não** uma mediana combinada ponderada por contas; são orientadores.
- E149→E150 só 3,252% das contas substituíram equipamento. O modelo de durabilidade não exige correção automática.

### Problema ainda por resolver

`Power` cresce devagar por E, mas essa é uma medida descritiva. Precisamos testar se ter uma peça valiosa realmente muda o desempenho do jogador. Uma pequena subida numérica pode causar **zero diferença** no número de golpes necessários, ou ultrapassar um limiar que muda a vitória/derrota.

## Instrumentação nativa da Stage 6.36

- 12 estratégias representativas e 2 sementes (24 contas), começadas *de verdade* em E1; até 400 tentativas legais por conta, máximo 12/Expedition; nunca forçar Boss, equipamento ou desbloqueio durante a **progressão**.
- Quando a conta **atinge mesmo** E2, E5, E10, E20, E35, E70, E100, E150 ou E200, guardar o primeiro estado válido de Camp da Expedition, **antes** de jogar a tentativa.
- Para esse mesmo estado, encenar num fixture nativo **Risk 1 / primeiro anel**, com habilidades normais do inimigo, os mesmos seeds e as mesmas condições, quatro combates:
  - um mob normal solo;
  - três mobs normais;
  - uma das 8 identidades reais de Elite, alternada entre seeds/builds/Expeditions;
  - Boss da Affinity primária da personagem.
- Repetir o **mesmo** combate mantendo XP, talentos, atributos, runas, outras peças e inimigos idênticos, mas retirando **uma peça não-arma já obtida e equipada** que tenha o maior orçamento de affixes observável no próprio jogo (na ausência de orçamento, uma starter real). Esta remoção é **um contrafactual de laboratório, não uma segunda personagem que jogou legitimamente sem a peça**.
- Exigir identidade exata do roster, tipo, HP/ATK, condição, Realm, seed e risco antes de aceitar um par.
- Medir: taxa de vitória com e sem a peça, mudança de vitória/derrota, tempo de combate **quando ambas vencem**, HP final relativo, dano recebido, mana e dano lançado, Power ofensivo e defensivo.
- As diferenças entre 5% e 10% de tempo são **limiares descritivos**, não uma prova de que os jogadores humanos percebem automaticamente essas percentagens.
- Contagem explícita de casos em que a remoção altera no máximo 1,5% de UI Power. Se não houver exemplos, **não alegar** que testámos causalmente upgrades de 1%.
- Registar separadamente Planner e perfis preexistentes; comparar é exploratório, não um ensaio aleatorizado de decisões ótimas.
- Se a personagem não chegou ao E, não colocar um combate inventado nesse E. O nível fica censurado.

## Ordem recomendada depois de obter os resultados

1. **Importância efetiva** do equipamento: as peças devem ajudar em combates semelhantes mesmo quando o tier do item é antigo.
2. **Visibilidade**: analisar saltos reais de combate, tempo, sobrevivência e viragem vitória/derrota, sem exigir uma diferença perceptível a cada Expedition.
3. **Comparação de build**: nas famílias cobertas, medir ganhos próprios vs build média, sem inferir causalidade de grupos selecionados nem exigir progressão vertical de gear.
4. **Escala comum** de inimigos: ajustar uma referência suave para os indicadores realmente relacionados com dano/sobrevivência, e verificar combates antes de publicar. Não usar unicamente o UI Power.
5. **Identidades individuais**: só depois calibrar HP, ATK, defesa e habilidades de mobs, Elites, Bosses e grupos para os objetivos desejados (normais 80–90%, elites 60–70%, bosses 35–45%), avaliados com builds naturais que os encontraram.

**Nenhum componente do jogo, loot, classe, Affinity, estatísticas dos inimigos, equipamento nem Pages foi alterado nesta Stage.**
