# Wanderer v0.13 — relatório intermédio da auditoria
Branch audit/v013. Base 95a52425. Este checkpoint WIP reúne as alterações de implementação, testes, documentação e a versão gerada. Nenhum push ou deploy.

## O que foi observado no navegador
Os percursos usaram Chromium e contas ou saves de teste. Contando cada superfície uma vez, mesmo quando repetida noutra resolução, foram percorridas pelo menos 18 vistas, separadores ou diálogos. A contagem abaixo identifica o que teve evidência, sem presumir cobertura de cada combinação de estado.

| Superfícies | Ações e resultados observados |
|---|---|
| 1. Acesso, 2. Camp, 3. escolha de personagem | O bloqueio de autenticação impediu acesso ao jogo entre 360 e 1440 px. No Camp, escolher Ranger alterou o perfil persistido. |
| 4. Talents | A árvore apresentou 343 nós. Um percurso comprou um talento e confirmou a compra após recarregar. |
| 5. Forge, 6. resultado de crafting | Craft real, inserção na Stash e débito de materiais. Em estados controlados, os testes produziram luvas Uncommon, anel Rare e arma Epic. A receita Epic ficou bloqueada até obter o reagente. |
| 7. Merchant, 8. Apothecary | Compra confirmada, débito de Gold e entrada de equipamento. Comprar a poção mudou a quantidade e o saldo. Ambos persistiram após reload. |
| 9. Inventory/Equipment, 10. inspeção de item, 11. Shrine | Filtro, comparação, equipar e desequipar. Uma runa controlada foi atribuída ao primeiro slot, persistiu e pôde ser removida. |
| 12. seleção de Realm, 13. Contracts, 14. mapa, 15. inspeção de sala | Seleção entre três cartas, apresentação de dois contratos, recusa de contrato, zoom e custo de deslocação. O limite da névoa e as salas visíveis foram exercitados. |
| 16. arena, 17. resultado de combate, 18. resumo de Expedition | Percursos de Oracle, Reliquary, elite marcado, boss e extração, incluindo restauro do checkpoint. Alguns combates tiveram HP abreviado exclusivamente na fixture de navegação. |

C3 passou a 390 e 1280 px. Os percursos de Dungeon passaram a 390 e 1440 px. O teste de equipamento passou a 360, 390, 768, 1280 e 1440 px. O perfil público do leaderboard passou com backend simulado. O novo percurso de feedback confirmou o payload e a indicação de sucesso com backend simulado, mas falhou a verificação final de remoção do diálogo. Nenhuma mensagem foi enviada a um serviço real.

## Classificação e alterações

| Classe pedida | Evidência e tratamento |
|---|---|
| 1. Funcional | Craft, compras, equipamento, runas, talentos e decisões do mapa alteraram o estado nos percursos acima. |
| 2. UI incompleto | Até este ponto não foi comprovada uma mecânica válida inteiramente sem acesso na interface. Falta o inventário completo de callbacks e condições. |
| 3. Funcionalidade quebrada | A descrição do save local de sessão dizia que o progresso era guardado no Firebase. Corrigida em index.html e verificada no diálogo de personagem. O resultado do teste de fecho de feedback continua em investigação. |
| 4. Legitimamente bloqueada | Blueprints Rare/Epic requerem descoberta. Refinar um reagente requer projeto Epic aprendido, falta do reagente e condições de seca e Essence. A política do simulador já procurava esse projeto, mas o seu adaptador aceitava uma família isolada. Jogo e simulador passaram a usar refineRecipe com o ID da receita. |
| 5. Código obsoleto | Removidos craftEquipment, quatro variáveis/getters da Forge antiga, o módulo economy/v0101.js com qualityOdds e rarityFromOdds, opções High Quality/Masterwork, estilos exclusivos, projeção pública de upgradeRank e caminhos independentes da loja fora do City Center. Removida a rotina de reset exclusiva de um prefixo de preview antigo. |
| 6. Código técnico necessário | Preservados geração de equipamento, custo usado na reciclagem, proteção de checkpoints, validação de saves e serviços de conta. Os módulos v012 de combate, equipamento e persistência têm consumidores no jogo atual. |

O botão da Forge e o adaptador do simulador usam agora a mesma transação craftRecipe, que valida recursos e capacidade, insere o item e reverte a alteração se a persistência síncrona falhar. A comparação das definições de todas as receitas com a base devolveu igualdade. Removidos parâmetros de atributos predeterminados que já não participavam na geração.

A geração canónica de docs/ copiava por cima de diretórios existentes. Identificaram-se 33 ficheiros sem correspondente na origem, incluindo três ficheiros de upgrade de Tier, v0101.js, um módulo antigo de retratos e 28 imagens desse módulo. O gerador passou a limpar os diretórios que gere. Foram ainda retiradas duas páginas alternativas de protótipos independentes, arena-prototype e expedition-lab. Foi executado node scripts/update-pages-preview.mjs. Numa comparação intermédia, os 849 ficheiros gerados coincidiram byte a byte com um build isolado. A comparação integral deve ser repetida sobre o commit final.

## Testes e análise estática
- Antes da limpeza, 268 testes da lista test:v013 passaram. O percurso C3 original, a navegação da Forge e o smoke da árvore de talentos também passaram.
- Depois, uma execução combinada das listas test:v013, test:v013:sim, test:v013:c2 e test:v013:talent-graph passou 371/371. Outro lote passou 63/63, incluindo Forge no navegador, decisões do simulador, paridade com Chromium, elites, bosses e escalamento. Os lotes sobrepõem-se e não devem ser somados.
- Os 11 cenários determinísticos de escalamento tinham uma referência anterior à base remota. Antes de atualizar a referência, compararam-se as execuções na base 95a52425 e na árvore modificada. Coincidiram todos os hashes por combate, calculados sobre o estado de cada atualização, e os resultados finais.
- Uma verificação estática intermédia encontrou os 72 recursos de arranque e os 145 caminhos literais de imagens pesquisados. Não foram detetados caminhos de teste/script inexistentes nas 66 entradas do package.json nem nas referências literais pesquisadas nos workflows. Estes resultados não cobrem todos os caminhos construídos dinamicamente.

## Pendências e limites
- Três suites históricas de economia, equipamento e Endless apresentavam 22 falhas na base. Na última comparação tinham 20 falhas em 32 testes. Incluem chamadas à antiga seleção inicial de Affinity, equipamento com atributos fixos, progressão antiga, tabela de marcos e fixtures de saves antigas. Falta classificar individualmente e preservar a cobertura das regras ainda válidas antes de retirar qualquer teste.
- A tentativa de executar os emuladores isolados de Auth/Firestore terminou antes dos testes. java -version saiu com o código 3221225781. As regras não foram validadas nesse ambiente.
- Falta fechar o teste de feedback, rever callbacks e combinações de progressão restantes, e repetir todos os gates após a última limpeza de CSS. Autenticação e escrita em serviços reais não foram exercitadas.
- Não foi produzido um total fiável de todas as funcionalidades do jogo. As 18 superfícies são um mínimo observado. A auditoria permanece aberta.

## Checkpoint WIP de 20 de novembro de 2026

O último lote dirigido à Forge, à UI estática e à economia de Camp passou 10/10. Na comparação histórica passaram 12 de 32 testes. O teste de feedback falhou depois de acionar Fechar, quando ainda encontrou um diálogo no DOM. A causa permanece por determinar. Estes são resultados de execuções anteriores ao checkpoint.

A retoma deve começar pelas 20 falhas históricas, pelo fecho do feedback e pelo arranque dos emuladores, seguida da revisão dos callbacks e da repetição dos gates finais. Ficaram fora do commit 39 ficheiros de evidência gerados pelos testes de navegador nos diretórios reports/stage45-4-browser, reports/stage45-5-browser e reports/v013-c3-browser.
