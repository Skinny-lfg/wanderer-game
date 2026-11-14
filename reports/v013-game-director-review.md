# Wanderer v0.13 — revisão aprofundada pelo diretor de jogo

Referência: gameplay publicado no commit d0e06e0; revisão de 13 de novembro de 2026. Análise realizada com o agente `diretor_jogo` e verificada contra os módulos ativos. As alterações estéticas desta tarefa não alteram as regras analisadas. Os tempos e metas abaixo são hipóteses de design, não resultados de playtest.

## Decisão de direção

Wanderer deve ser um RPG de preparação e observação: preparar uma personagem persistente, escolher uma missão desejada, observar a build resolver ameaças e regressar com progresso útil. As decisões importantes ficam no Camp, em poucas bifurcações e nos eventos. O combate continua automático; selecionar o foco é uma vantagem opcional.

Não recomendo voltar aos drafts de passivos depois dos combates. A solução para a falta de decisões é dar objetivos e ameaças diferentes às expedições. A árvore permanente define a personagem; a missão deve definir o que ela vai procurar e enfrentar.

## 1. Regras incorretas ou incoerentes — corrigir primeiro

### Cura por morte que pode nunca acontecer

Em `combat/v012-buildcraft.js`, `onKill` marca `lastKillWave` antes de verificar Bleed/Rot. Se a primeira morte não cumprir a condição, Hemovore e Rot Recovery perdem a oportunidade de ativar no resto do encontro. A descrição atual promete a primeira morte qualificada, não a primeira morte de qualquer inimigo.

**Solução:** dois registos independentes, um para Hemovore e outro para Rot Recovery. Marcar cada um apenas quando a morte qualifica. Preservar o limite de uma ativação de cada talento por encontro. Definir explicitamente se uma cura a HP cheio consome o efeito; recomendo que sim, pois evita guardar automaticamente uma morte já ocorrida para mais tarde. Testar morte sem efeito seguida de morte qualificada, mortes simultâneas, overheal e próximo encontro.

### Staff e Wand perdem a diferença de custo de Mana

Em `combat/v012-combat-runtime.js`, `weaponAttack` define custos base Staff=13 e Wand=9, mas substitui-os por `Buildcraft.nextCost`, que devolve `8-rank(efficient_cast)`. O modo livre tem um elemento por defeito. Assim, a regra ativa pode usar o mesmo custo para duas armas apresentadas como diferentes em eficiência.

**Solução:** um único cálculo de custo, partindo sempre da arma e aplicando modificadores percentuais. Mostrar o mesmo custo na ficha e no combate. Staff oferece mais impacto por cast e maior consumo; Wand oferece melhor sustentação. Medir casts financiados, Mana/minuto e tempo em ataque de recurso. Verificar também o relógio de magia secundário para não cobrar ou lançar duas vezes sem intenção.

### Quantidade não equivale a dificuldade

Os grupos de 3 têm aproximadamente 1,5 vezes o HP total do inimigo original; 12 têm 1,92 vezes; 18–22 aproximadamente 2 vezes. A pressão de ataque é limitada aos quatro ativos. Defesa, arredondamento, overkill, procs, cura e cadência tornam a dificuldade diferente para cada arma. Os bónus de recompensa de 10/20/30% ainda não demonstram correspondência com risco ou tempo.

**Solução:** criar um orçamento de encontro com HP total, dano efetivo esperado, defesa, composição e recompensa. A quantidade passa a descrever a experiência, não a determinar sozinha a ameaça. Comparar sete armas nos mesmos cenários antes de alterar novamente coeficientes.

## 2. Contratos: de prémio final a objetivo da missão

Os contratos atuais entregam equipamento Rare dirigido ou `20+3E` Fragments. Resolvem a ausência de uma recompensa anunciada, mas ainda não tornam as missões diferentes. Rare deixa rapidamente de interessar a quem já usa Epic/Legendary.

| Contrato | Conteúdo proposto | Recompensa útil |
|---|---|---|
| Weapon Hunt | Um encontro de armamento favorecido e elite apropriado | Escolha entre três armas da categoria procurada |
| Armor Hunt | Elite defensivo e oportunidade de melhoria de proteção | Escolha de slot defensivo, não apenas Armor |
| Supply Run | Mais oportunidades de recolha e risco controlado | Parte dos materiais por progresso, prémio extra ao boss |

Não criar outra moeda agora. Usar Fragments para transformar tentativas sem upgrade em progresso dirigido: melhorar uma peça, reforjar uma propriedade ou acumular o custo de uma escolha de categoria. Uma run sem drop raro deve aproximar o objetivo de forma visível.

Dar a cada contrato uma recompensa principal previsível e uma oportunidade de surpresa. Evitar garantir o melhor item ou tornar a escolha irrelevante por oferecer sempre recompensas iguais.

## 3. Rotas e decisões

O gerador atual mantém três lanes e permite mudança lateral em apenas três janelas. Grande parte dos nodes não oferece uma escolha real. Isso pode ser adequado para poucas interações, mas a apresentação não deve sugerir três alternativas disponíveis a cada passo.

**Solução:** organizar a expedição em segmentos com 3–4 bifurcações significativas: recuperação/segurança, elite/recompensa e horda/materiais. Convergir em marcos comuns e no boss. Mostrar composição e recompensa provável antes de escolher.

`Replace Realm` preserva a quantidade e a posição da lane. Trocar de Realm não permite necessariamente evitar uma horda. Renomear e explicar a ferramenta, ou mudar a composição e a recompensa do próximo node sem alterar conectividade. Não deixar o reroll eliminar repetidamente todo o risco.

## 4. Entrada na árvore e progressão

O custo inicial de identidade varia: Blood passa por Might e affinity; Magic passa por Haste, Flow, affinity e elemento antes dos caminhos de habilidade. Cada habilidade acrescenta normalmente dois nós pequenos. Com 100 XP por ponto e recompensas atuais, uma expedição rende aproximadamente 3–4 pontos, dependendo do percurso.

**Solução:** igualar o orçamento de entrada das seis famílias. Oferecer uma raiz inicial ou dois pontos iniciais; a primeira habilidade deve transformar visivelmente o combate durante uma sessão curta. Testar como hipótese 10–15 minutos até uma especialização reconhecível. Híbridos ficam como objetivos de médio prazo.

Os nós +1 continuam como custo de caminho, mas não devem representar toda a recompensa da primeira run. Projetar algumas builds completas com o orçamento de 100 pontos antes de acrescentar nós. Garantir que não conseguem comprar todas as vantagens relevantes.

A árvore deve oferecer compromissos entre área, alvo único e sobrevivência. Evitar caminhos onde os mesmos pontos entreguem simultaneamente melhor dano, maior cura e melhor defesa sem fraqueza.

## 5. Armas e magia: funções deliberadas

| Estilo | Vantagem desejada | Fraqueza desejada |
|---|---|---|
| Sword/Shield | Consistência, Block e contra-ataque | Limpeza lenta de hordas |
| Mace/Shield | Controlo de ataques perigosos | Cadência baixa |
| Two-Handed | Área e impacto por golpe | Recuperação e proteção limitadas |
| Daggers | Bosses e procs precisos | Grupos e dano mágico recebido |
| Bow | Foco e perfuração | Menor sustentação |
| Staff | Grande impacto elemental/área | Consumo elevado de Mana |
| Wand/Orb | Magia sustentada | Menor explosão |

Staff, Wand/Orb e Two-Handed recebem pequenas Barriers periódicas. Não as remover todas por princípio: medir primeiro a sobrevivência que depende delas. Depois concentrar proteção nas escolhas defensivas e conservar apenas efeitos que expressem a identidade da arma.

Lightning entrega cadeia nativa mais cedo que as opções de área de Fire/Frost. Conservar diferenças, mas tornar a promessa de cada elemento imediata: Fire causa dano persistente forte, Frost oferece controlo legível e Lightning distribui dano imediato. Os três não precisam de ser a mesma área com cores diferentes.

DoTs precisam de inimigos que sobrevivam tempo suficiente para lhes dar valor. Hordas extremamente frágeis não devem dominar toda a expedição. Alternar alvos resistentes com grupos frágeis permite que a build mostre forças e fraquezas.

## 6. Mobs e bosses na arena estática

Tank, Caster e Skirmisher já não se distinguem pela deslocação. Precisam de comportamentos visíveis:

- Tank: proteção limitada de um aliado ou absorção temporária claramente mostrada.
- Caster: cast preparado com aviso visual; ameaça de dano ou debuff reconhecível.
- Skirmisher: pressão rápida e baixa durabilidade.

O foco automático deve tomar decisões razoáveis. O manual permite antecipar uma ameaça, mas não deve ser necessário interromper casts continuamente para sobreviver.

Bosses individuais preservam o valor de single target. Cada boss deve testar algo claro: sustentação, burst, mitigação ou gestão de Mana. Avisar a ameaça antes de entrar. Só acrescentar minions quando fizerem parte de uma mecânica concebida para esse boss.

## 7. Stats, sobrevivência e economia

END aumenta HP, Defense e Block; HP aumenta também as curas e Barriers percentuais. Uma melhoria de END pode melhorar várias camadas de sobrevivência ao mesmo tempo. AGI aumenta cadência, que aumenta oportunidades de procs. Comparar apenas Attack ou Power esconde estes multiplicadores.

**Solução:** medir cura efetiva, overheal, Barrier absorvida e dano recebido. Ajustar custos de oportunidade na árvore antes de acrescentar caps dispersos. Mostrar ganhos relevantes de equipamento para a build, usando Power apenas como indicação aproximada.

CHA mistura Critical e rendimento de loot, criando pressão para uma build de farming. Durante a estabilização, reduzir a sua importância económica na recomendação de equipamento. Considerar posteriormente mover a sorte para exploração ou afixos, sem criar um atributo obrigatório para farm eficiente.

Com armas a representarem 15% da seleção de equipamento, a arma exata pode demorar muito a aparecer. Manter drops pouco frequentes, mas acrescentar preferência e recuperação de azar. Crafting deve permitir melhorar algo que o jogador quer usar, não apenas produzir mais items aleatórios.

Não expandir Endless enquanto o modelo base não estiver estável. As compensações específicas para certos loadouts acima de E200 devem ser reavaliadas depois de medir os mesmos cenários para todas as armas.

## 8. Plano de execução recomendado

1. Corrigir ativação das curas qualificadas e cálculo único de Mana.
2. Medir encontros e armas; estabelecer orçamento de ameaça/recompensa.
3. Dar comportamento reconhecível aos três papéis de mob.
4. Igualar o acesso inicial às affinities e à primeira habilidade.
5. Diferenciar contratos e segmentos de rota.
6. Acrescentar escolhas de recompensa e progresso contra azar usando Fragments.
7. Recalibrar economia, bosses e Endless.

Não expandir o catálogo de armas, famílias, moedas ou árvores nesta fase. Já existem peças suficientes; o trabalho é dar-lhes funções distintas.

## 9. Validação de gameplay

Usar alvos resistentes, grupos de 3/12, hordas, elites e três bosses, com equipamento e investimento equivalentes, várias seeds e sete armas. Comparar sucesso automático e com foco manual.

Registar duração, HP final, dano por fonte, overheal, Barrier absorvida, percentagem de casts financiados, XP/Fragments por minuto e tentativas até upgrade útil. Separar início, meio e Endless.

Nos playtests, perguntar o que a pessoa procura antes de entrar e se sente que se aproximou disso ao terminar. Observar se sabe porque perdeu e qual melhoria quer experimentar a seguir.

Hipóteses iniciais: expedições de aproximadamente 8–12 minutos, 3–5 decisões com consequências e foco manual com vantagem moderada. Estes números precisam de validação; os testes funcionais não demonstram diversão nem equilíbrio.

## 10. Revisão estética desta tarefa

A personagem de combate passou de avatar em busto para a imagem completa usada no protótipo. As sombras são elipses individuais ancoradas ao sprite, em vez de coordenadas dependentes das barras e dos textos. Os slots inferiores foram elevados para evitar cortar nomes e vidas. O foco mantém a seta e deixa de pintar um cartão atrás do mob.

Verificação em Chrome: arranque, contrato, mapa, quatro mobs, foco por clique e limites da arena em desktop/mobile. A revisão independente `animacao_2d` verifica a integração com os seletores dos ataques; screenshots não demonstram uma sequência completa de todos os GIFs e efeitos.
