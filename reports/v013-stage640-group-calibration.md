# Stage 6.40 · calibração de grupos da E1

O 6.39 registou 3427/4012 vitórias a solo (85,4%), 308/436 contra dois (70,6%), 12/329 contra três (3,6%), 14/256 contra quatro (5,5%) e 27/206 nas hordas (13,1%). A queda entre dois e três justificou testar intensidades diferentes. A geração do grupo, a ordem dos reforços e os atributos do inimigo a solo continuam a seguir a base 6.39.

## Seleção no motor nativo

Usámos o equipamento do primeiro acampamento E1 de cinco contas (cautious, balanced, plate-warden, hexblade-hybrid e smart-fury-bow, respetivamente com sementes 6401–6405). Cada ficha enfrentou três salas Risk 1 por tamanho, na primeira afinidade do perfil, através de `v013-stage628-postcap-difficulty.native`. As sementes dos combates foram 37 × semente da conta + 0, 1 ou 2. Os perfis de progressão começam com equipamento inicial e ainda não representam cinco builds desenvolvidas.

Em cada braço experimental, dividimos o ataque por 1 + (tamanho − 1) × intensidade. Para Minions, somámos metade do número total de Minions ao divisor e dividimos o HP pela raiz quadrada do divisor resultante. Arredondámos os atributos ao inteiro mais próximo, com mínimo de um. O tamanho inclui reservas.

| Intensidade experimental | 2 | 3 | 4 | 5 | 8 | 12 |
|---|---:|---:|---:|---:|---:|---:|
| 0,20 | 15/15 | 3/15 | 2/15 | 10/15 | 7/15 | 13/15 |
| 0,50 | 15/15 | 7/15 | 5/15 | 12/15 | 7/15 | 13/15 |
| 0,75 | 15/15 | 15/15 | 14/15 | 12/15 | 7/15 | 13/15 |
| 1,00 | 15/15 | 15/15 | 14/15 | 12/15 | 9/15 | 13/15 |

Escolhemos 0,20 para pares, a menor intervenção testada. Para três e quatro escolhemos 0,65 entre os dois braços que enquadram a referência. Para cinco ou mais escolhemos 1,00, que melhorou oito inimigos nessa amostra. As percentagens populacionais vêm das campanhas naturais descritas no relatório de resultados.

## Verificação com outras sementes

Repetimos a comparação com as sementes de conta 6441–6445 e cinco sementes de combate por personagem (desvios 0–4). Cada par reutiliza os mesmos dados de jogador e a mesma semente de combate.

| Tamanho | 6.39 | 6.40 |
|---|---:|---:|
| 1 | 14/25 | 14/25 |
| 2 | 25/25 | 25/25 |
| 3 | 0/25 | 25/25 |
| 4 | 0/25 | 25/25 |
| 5 | 0/25 | 25/25 |
| 8 | 0/25 | 25/25 |
| 12 | 0/25 | 20/25 |

São confrontos de primeira sala com equipamento inicial. A seleção de salas, o HP à entrada e a progressão durante campanhas alteram substancialmente a taxa de vitórias.

## Composição e âmbito

Os quatro papéis nativos são Minion, Tank, Skirmisher e Caster. O ajuste preserva HP e defesa dos três principais, reduz o seu ataque conforme o tamanho do grupo e diminui adicionalmente o HP e ataque dos Minions conforme a sua abundância. Os Minions em reserva recebem o mesmo tratamento dos iniciais. Os invocados pelos líderes têm uma regra própria dependente da vaga.

Num grupo fixo de oito na E1, os cinco Minions passaram de 57 HP e 3 ATK para 18 HP e 1 ATK. Caster, Skirmisher e Tank conservaram respetivamente 146, 154 e 213 HP. O mesmo teste na E2 reproduziu todos os valores da base, incluindo as reservas. A taxa de vitórias natural da E2 pode variar porque chegam lá personagens diferentes.
