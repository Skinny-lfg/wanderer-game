# Wanderer: revisão de combate, talentos e progressão

Estado analisado: branch `experiment/automatic-rpg`, jogo automático e teste anterior `expedition-lab`. Este documento apresenta recomendações para discussão; os números são hipóteses iniciais de teste, não resultados de balanceamento.

## Direção

Manter os combates automáticos e fazer da preparação a decisão principal: equipamento, árvore de talentos e escolha da rota. Uma build de dano em área deve limpar grupos depressa; uma build de alvo único deve ser forte contra inimigos resistentes e bosses. Ambas devem conseguir terminar uma expedição, mas enfrentar consequências distintas ao escolher o caminho.

## O que existe

- O combate do jogo principal usa um único inimigo ativo (`run.enemy`), com vida, defesa, barreira, temporizador e efeitos próprios. As habilidades e os acertos assumem esse inimigo como alvo. Uma wave termina quando ele morre.
- O protótipo anterior já apresentava 3 ou 4 inimigos: a build de área atingia todos e a de alvo único atacava o primeiro. Era um ensaio independente e simplificado; não incluía a economia, os efeitos nem a persistência completos do jogo.
- Uma expedição tem 15 Realms, 3–4 eventos e um boss; o mapa já guarda o percurso e contém encruzilhadas. As escolhas atuais descrevem combate, Elite e Evento, mas não o tamanho do grupo.
- O jogador ganha XP por Realm concluído: 30 para combate normal, 40 para Elite, 60 para boss e 20 para evento; cada 100 XP dá um ponto de talento e um ponto de atributo. O XP considera o fim do Realm, não cada mob ou wave.
- A árvore reutiliza 63 habilidades de seis famílias, com nós pequenos de atributos e até cinco ranks em muitas habilidades. Dentro de cada família, os percursos seguem uma sequência longa: é necessário comprar habilidades anteriores para alcançar as seguintes. Isso pode obrigar um jogador de área a comprar talentos de alvo único, ou o inverso.
- As armas já têm ritmos e coeficientes próprios. Por exemplo, Two-Handed é lenta, dá 1,70× no ataque físico e tem uma barreira periódica; Daggers atacam mais depressa e podem usar off-hand; Staff e Wand usam Mana para ataques mágicos. Estes números não são ainda dano em área.
- STR contribui para ataque e defesa; AGI para ataque e velocidade; INT para Mana, regeneração e magia de Staff/Wand; END para vida, defesa e bloqueio com escudo; CHA para crítico e loot. A arma, os limites e os retornos decrescentes também afetam o resultado.
- O loot é atribuído por wave concluída, com probabilidades base diferentes para waves, elites e boss. As recompensas e o XP dependem ainda do inimigo único e do checkpoint.

## Encontros e mapa

Mostrar o tamanho do grupo no nó e no detalhe: **Solo (1)**, **Duo (2)**, **Pack (4)**, **Elite** e **Boss**. Ao longo das encruzilhadas, apresentar alternativas reais: por exemplo, um Solo resistente contra um Pack mais frágil. Não é necessário oferecer os três tamanhos em todos os passos. Eventos podem manter as regras atuais inicialmente.

Como hipótese inicial, comparar packs com a mesma referência de um Solo:

| Encontro | Vida por inimigo | Dano por ataque por inimigo | Papel |
| --- | ---: | ---: | --- |
| Solo | 100% | 100% | Alvo resistente; favorece dano concentrado |
| Duo | 65–75% | 60–70% | Pressão repartida |
| Pack de 4 | 35–45% | 30–40% | Vulnerável a área, perigoso enquanto muitos estiverem vivos |

Isto é apenas um ponto de partida. Quatro inimigos a 40% continuam a ter 160% do dano de um Solo quando todos atacam. Desfasar os temporizadores de ataque e testar picos de dano; não tornar os inimigos inofensivos apenas para compensar a contagem. Cada inimigo deve morrer separadamente e parar de atacar imediatamente.

## Regras de combate propostas

1. Cada mob tem identidade, HP, barreira, defesa, estado, cooldowns necessários e temporizador próprios. O encontro só termina quando todos morrem.
2. O personagem escolhe o alvo automaticamente: por defeito, primeiro inimigo vivo. Eventualmente, uma preferência opcional no camp poderá escolher menor vida ou inimigo mais perigoso; não exigir cliques durante o combate.
3. Two-Handed: golpe principal a 100% e, como ponto inicial, 35–45% do dano base em até dois outros inimigos. Contra um único inimigo não recebe o dano secundário. Indicar isto no equipamento.
4. Lightning: um alvo principal e até dois saltos para alvos distintos, com redução em cada salto; sem acertar repetidamente no mesmo inimigo quando não houver outros. Fire pode espalhar Burn mediante talento; Frost pode afetar vários inimigos com Chill mais curto. O custo de Mana é pago uma vez por cast.
5. Ataques secundários, saltos, DoTs e efeitos de morte devem indicar explicitamente se ativam outros efeitos. Proposta: efeitos em cadeia não geram novas cadeias nem ataques extra; um efeito por golpe/cast ativa uma vez por ação, enquanto estados como Bleed e Rot são guardados por alvo. Calcular dano e barreira individualmente.
6. Lifesteal, cura por morte, escudo, bloqueio, invulnerabilidade, cooldowns e DoTs precisam de regras para mortes simultâneas. Definir limites por ação e por segundo, sem multiplicar automaticamente cada efeito por quatro.

## Armas: papéis recomendados

| Arma | Papel principal proposto | Possível especialização |
| --- | --- | --- |
| Two-Handed | Golpe lento com cleave natural | Mais alvos ou golpe concentrado para boss |
| Daggers + off-hand | Alvo único rápido, crítico e DoTs | Propagar Rot com talento; sem cleave grátis |
| Sword + Shield | Equilíbrio e defesa | Contra-ataque ou varrimento pequeno |
| Mace + Shield | Sobrevivência contra alvo forte | Quebra de defesa; controlo curto em área |
| Bow | Alvo único à distância | Perfuração ou flechas adicionais via talento |
| Staff | Feitiços lentos e área | Área maior, Mana e controlo |
| Wand + Orb | Magia mais rápida e precisa | Foco em boss ou um salto adicional |

As identidades acima são propostas, não descrições das capacidades atuais. A mesma arma deve continuar a poder receber alguma especialização alternativa; os números têm de ser comparados com a velocidade e o equipamento reais.

## Talentos e habilidades

- **Blood:** preservar Bleeding Edge e Deep Cuts como base. Um ramo pode espalhar parte do Bleed ao matar; outro reforça Executioner contra um alvo sangrando. Limitar os espalhamentos.
- **Decay:** Toxic Touch e Virulent Rot devem funcionar por inimigo. Acrescentar propagação reduzida entre alvos e manter Blight/Venom Shatter como alternativas concentradas. Não copiar integralmente todas as stacks.
- **Fury:** manter Quick Hands e Double Strike para foco; adicionar uma escolha de varrimento ou perfuração com menor dano por alvo. Golpes extra não devem voltar a gerar golpes extra.
- **Magic:** Chain Lightning para grupos; Fire com Burn e eventual propagação; Frost com controlo limitado. Arcane Echo deve definir se repete apenas o alvo principal ou uma versão reduzida de área. Não criar Mana extra por cada alvo.
- **Aegis:** distinguir defesa contra vários ataques de defesa contra um golpe forte. Guarded Block e Barrier Pulse devem manter limites; um possível contra-ataque em área deve ter cooldown e um número máximo de alvos.
- **Vitality:** Renewal e Strong Heart ajudam em lutas prolongadas; cura por morte deve ser limitada para que quatro mobs fracos não tornem o jogador invencível. Manter Last Stand como proteção de emergência.
- **Híbridos:** Plague Rupture, Elemental Blight e Spellblade são bons candidatos para combinações, mas precisam de indicar alvo, propagação e limites. Evitar exigir uma série inteira de habilidades irrelevantes para chegar a uma opção de área: criar bifurcações entre nós pequenos e talentos de especialização, mantendo os saves existentes.

## Atributos e equipamento

Não introduzir já dez stats novos. Preservar os cinco atributos e acrescentar apenas propriedades que criem escolhas: **Area Damage**, **Area Targets**, **Single-Target Damage** e, se necessário, **Damage over Time**. Preferir poucas fontes legíveis em itens e talentos. Um item de alvo único deve ser desejável para boss mesmo quando o jogador já possui uma Two-Handed; uma arma de área deve ter benefícios visíveis também com apenas dois mobs.

Separar claramente dano por alvo, número máximo de alvos e efeitos secundários. Não apresentar “+20% damage” sem dizer se afeta ataques, spells, DoTs ou área. Evitar que velocidade, crítico, alcance e procs se multipliquem sem limites.

## XP, loot e economia

Continuar a atribuir XP e loot **uma vez por encontro ou wave concluída**, com orçamento baseado no risco; não multiplicar automaticamente por número de mobs. Exemplo: Solo 100%, Duo 115%, Pack 130%, sujeito a simulação e testes. O boss mantém o Rune garantido e a escolha existente.

Com 12% de hipótese de loot por mob, quatro tentativas independentes dariam aproximadamente 40% de obter pelo menos um item. Isso alteraria muito a economia e a frequência de bag cheia; por isso propor um roll por encontro, ajustado conforme o risco, e ouro/fragmentos com orçamento semelhante. Impedir que um reload duplique mortes, recompensas ou XP.

## Interface e testes

Mostrar cada mob com barra de vida e estados individuais, distinguir alvo atual e mortos, e indicar `1`, `2` ou `4` nos nós do mapa. O log deve resumir golpes de área, em vez de gerar quatro mensagens por ataque; a visualização deve caber em mobile. Ao escolher o Realm, indicar tipo, tamanho do grupo e risco antes de confirmar.

Validar em E1, E50, E200 e acima de E200: builds de área, alvo único e híbridas; 1/2/4 inimigos; boss; condições adversas; equipamento comparável. Medir tempo de combate, HP perdido, taxa de vitória, DPS efetivo, Mana, XP e loot por minuto, frequência de mortes e enchimento da bag. Comparar também jogabilidade real: as simulações atuais não demonstram que o combate seja legível ou divertido.

Testar ataques simultâneos, morte por DoT, multi-kill, cooldowns, barreiras, efeitos sem recursão, alvo morto, boss, extração e reload a meio de wave. O motor atual reinicia o Realm a partir de um checkpoint; manter essa promessa ou migrar os checkpoints com uma regra explícita.

## Ordem recomendada

1. Definir regras e atualizar o modelo de encontro para 1/2/4 mobs; manter o ataque normal focado e validar sobrevivência, recompensas e checkpoint.
2. Adicionar os nós Solo/Duo/Pack ao mapa e a apresentação dos mobs, com seleção automática e sem mudar as regras da árvore ainda.
3. Introduzir Two-Handed cleave e Chain Lightning, cada um com limites e testes; comparar com Daggers e Bow contra grupos e bosses.
4. Adaptar efeitos existentes de Bleed, Rot, Fire, Frost, cura e barreira; prevenir cadeias recursivas e ganhos excessivos por multi-kill.
5. Abrir ramos reais de área e alvo único, ajustar itens e só depois calibrar XP, probabilidades, dano e ritmo com dados de simulação e jogabilidade.

Não há aqui resultados de testes multi-inimigo do jogo principal: a revisão é baseada no código e no protótipo anterior. O equilíbrio final requer implementação e playtests.
