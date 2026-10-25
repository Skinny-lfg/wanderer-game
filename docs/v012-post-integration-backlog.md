<!-- Snapshot of the Google Docs backlog. The Google Doc remains the upstream working source. -->

> **Fonte original:** [Wanderer — v0.12.0 | Backlog de melhorias pós-integração](https://docs.google.com/document/d/1UBoyYDtvi9x5VQbXR15jThR2aOQNzXUgkHr0oZlT8ss/edit)  
> **Cópia para Codex:** 20/10/2026. Documento integral em texto (828 parágrafos).  
> **Referências visuais:** duas imagens A e B estão embebidas no Google Docs e **não** são transferidas por esta cópia Markdown; ver documento original. A imagem **A (primeiro mockup)** é a referência aprovada para a homepage; B é exploratória.  
> **Precedência:** decisões posteriores e explicitamente definitivas substituem propostas anteriores: secção **28** corrige 27 (Runes); secção **27** corrige 014 (rerolls); secção **22** substitui 21 (Realms). Distinguir decisões aprovadas de propostas/hipóteses.  
> **Segurança:** copiar este backlog não autoriza por si só implementar, alterar saves, fazer deploy ou tocar na `main`. Ler [guia Codex](./v012-codex-handoff.md) antes de agir.

---

# WANDERER — v0.12.0 | Backlog de melhorias pós-integração

*Documento vivo • Iniciado a 19/10/2026 • Estado: a recolher alterações*

## OBJETIVO E FLUXO

Concentrar todas as melhorias propostas após as alterações da v0.12. Vamos acrescentar pedidos a este documento e implementar o lote numa única fase, só depois de aprovação expressa.

Por agora: NÃO alterar código, gameplay, deploy, Firebase nem saves.

## REFERÊNCIA VISUAL APROVADA

A imagem de referência é o primeiro mockup de Expedition Camp reenviado pelo utilizador em 19/10/2026: HP/Mana numa coluna à esquerda, personagem com equipamento ao centro, e cartão “Prepare for the next Expedition” à direita. Manter o branding Wanderer e a composição geral dessa imagem. As variações geradas posteriormente são apenas exploratórias e não substituem esta referência.

Direção: dark fantasy premium; ambiente de camp/fogueiras, molduras discretas em bronze/dourado, fundo atmosférico, boa legibilidade, sem excesso de blocos de texto.

## BACKLOG — 01 | HOMEPAGE / EXPEDITION CAMP

UI-001 — Reorganização global [PENDENTE]

• Header com logótipo Wanderer, tabs Camp / Inventory / Forge / Merchant / Runes; Leaderboard e Account; Gold e Fragments visíveis.

• Coluna esquerda: título “Expedition Camp”, estado de HP/Mana e breve nota sobre poções. Personagem continua em destaque no centro; painel de Expedition na direita.

• Remover da homepage o bloco inferior “Choose your character” e as cinco cartas de seleção. Não remover a funcionalidade de escolher personagem; verificar onde a colocar na UI de conta/personagem.

• Reduzir avisos técnicos da preview no ecrã principal, sem perder informação importante de segurança/estado de saves.

UI-002 — Equipamento e Belt [PENDENTE]

• Esquerda da personagem (2 slots): Weapon; Off-Hand.

• Direita da personagem (8 slots): Helm; Amulet; Armor; Gloves; Belt; Ring I; Ring II; Boots.

• Acrescentar um slot Belt com imagem/placeholder ao estilo do equipamento atual; verificar se existe suporte real no inventário, drops, forge, saves e tier bonuses antes de tornar o slot funcional.

• Manter rarity borders, tooltips e regras de duas mãos; remover indicadores de affinity no gear, segundo UI-006 (nova decisão prevalece sobre mockups anteriores).

UI-003 — Expedition atual e ação principal [PENDENTE]

• O painel da direita deve dizer explicitamente “Expedition N” com o número REAL atualmente selecionado/desbloqueado (por exemplo, Expedition 1).

• Mostrar informação útil e verdadeira da Expedition: dificuldade/modo, Planes e progresso real, de acordo com as mecânicas implementadas na v0.12.

• Botão principal grande “Start Expedition” / “Continue Expedition”, conforme o estado verdadeiro do jogo.

• A imagem da dungeon/portal e uma descrição curta de objetivos/recompensas são elementos visuais da referência.

• ATENÇÃO: “Stage 1/10” no desenho é meramente ilustrativo. Não assumir 10 stages nem acrescentar progressão nova sem confirmação da lógica v0.12.

UI-004 — HP, Mana e poções [PENDENTE]

• Barras HP e Mana legíveis, com valores atuais/máximos, visíveis no Camp.

• Manter a regra v0.12: poções apenas após completar um Plane; nunca na Camp ou durante o combate. Apresentar o texto de forma discreta.

UI-005 — Responsividade e acabamento [PENDENTE]

• Adaptar desktop e mobile, mantendo o botão de Expedition acessível e sem sobreposição de slots.

• Reutilizar assets originais, estilos e componentes sempre que possível; evitar reconstrução desnecessária.

• Garantir imagens/efeitos otimizados para web, acessibilidade dos botões e consistência com outras páginas.

## CONDIÇÕES DE IMPLEMENTAÇÃO

• Só implementar quando o utilizador disser para avançar com o lote completo.

• Trabalhar exclusivamente na branch development; não fazer merge/publish na main sem instrução.

• Não alterar Firebase rules, não fazer deploy, não sobrescrever saves de jogadores e não introduzir mudanças de gameplay fora do âmbito aprovado.

• Auditar componentes existentes, verificar a integração v0.12, testar desktop/mobile e documentar regressões antes de publicar.

## PONTOS A CONFIRMAR ANTES DE PROGRAMAR

1. O Belt é apenas um novo espaço visual ou requer expansão da estrutura de equipamento, itens e persistência? Verificar implementação real da v0.12.

2. Como se representa o progresso das novas Expeditions/Planes? Usar dados reais, não os placeholders do mockup.

3. Onde fica a escolha de personagem depois de sair do rodapé do Camp? Preferência inicial: Account & Character.

## REGISTO DE DECISÕES

19/10/2026 — Escolhido como referência o PRIMEIRO mockup enviado pelo utilizador (HP/Mana à esquerda, Expedition à direita).

19/10/2026 — Pedido Belt à direita; Weapon/Off-Hand à esquerda e Gloves à direita.

19/10/2026 — Remover seletor de personagens na parte inferior.

19/10/2026 — Mostrar o número da Expedition atual e tornar a Expedition a principal ação.

19/10/2026 — Reunir todos os ajustes num único documento de Drive, a atualizar antes de qualquer implementação.

## NOVAS MELHORIAS A ACRESCENTAR

Próximas decisões entram aqui com ID, descrição, prioridade, estado e data. Este documento é a fonte de verdade para o pacote pós-v0.12.

## REFERÊNCIAS VISUAIS (a inserir abaixo)

A. Mockup ORIGINAL aprovado pelo utilizador (anexo enviado nesta conversa).

B. Estudo visual com Belt e novos alinhamentos (conceito; conferir sempre com o original).

A — Referência original aprovada (imagem acima).

B — Estudo de composição com Belt (imagem abaixo; manter como base definitiva a referência A).

## BACKLOG — 02 | INVENTÁRIO E EQUIPAMENTO

### UI-006 — Remover affinities do gear [PENDENTE]

• O equipamento deixa de ter affinity própria; retirar ícones, filtros, indicadores e referências a affinity nos itens do Inventory, Camp, Forge, Merchant e apresentações de loot onde deixaram de fazer sentido.

• Não remover as seis affinities do sistema de Expedition: passam a ter função de percurso e passivos, não de gear.

• Rever item generation e compatibilidade com itens/saves existentes antes da implementação, sem apagar equipamento ou saves.

### UI-007 — Introduzir categorias Cloth / Leather / Plate [PENDENTE]

• Cloth: identidade principal Intelligence e alguma Mana Regeneration.

• Leather: identidade principal Agility e Evasion.

• Plate: identidade principal Strength e maior Armor.

• Estas categorias definem a identidade dos itens, não buffs cumulativos de affinity. Itens híbridos podem ser investigados futuramente, após testes; não implementar nesta fase.

• Não definir ainda números de stats, odds, distribuição por slots ou restrições de classe: requerem simulações e validação posterior.

### UI-008 — Remover Set Bonuses [PENDENTE]

• Retirar a mecânica e respetivas indicações de set bonus do equipamento, inventário e interfaces associadas.

• Confirmar como migrar itens/bonuses antigos sem criar perdas de equipamento ou regressões.

## BACKLOG — 03 | RUNES, FORGE E MERCHANT

### UI-009 — Manter Runes [PENDENTE]

• Preservar o sistema atual de Runes e respetivos elementos de UI, salvo adaptações estritamente necessárias.

• O boss final de cada Expedition concede uma Rune após a vitória e conclusão da Expedition. Confirmar regra de atribuição e persistência para impedir duplicações.

### UI-010 — Forge [PENDENTE]

• Remover Affinity Transfer e todos os controlos/ícones/custos específicos dessa função, já incompatível com gear sem affinities.

• Manter as restantes funções da Forge, sujeito a validação de compatibilidade com os novos tipos de gear.

### UI-011 — Merchant [PENDENTE]

• Remover Affinity Sigils, incluindo as respetivas ofertas e custos.

• Manter as restantes funções do Merchant.

• Forge e Merchant só podem ser usados fora de uma Expedition ativa.

## BACKLOG — 04 | FLUXO DAS EXPEDITIONS E REALMS

### UI-012 — Escolha inicial entre seis affinities [PENDENTE]

• Ao clicar Start Expedition, escolher uma das seis affinities (ícones simplificados) e receber imediatamente um passivo inicial dessa affinity.

• A primeira seleção de Realms deve ter obrigatoriamente um Realm da affinity inicial entre as opções (100%). A entrada automática fica por confirmar.

• Registar a affinity e atribuir imediatamente um passivo inicial. Guardar ambos para evitar duplicação por refresh. Passivos adicionais só após conclusão dos Realms.

### UI-013 — Confirmação de entrada no Realm [PENDENTE]

• Após selecionar um Realm, mostrar o botão «Enter Realm». A seleção de um cartão não inicia combate automaticamente.

• Fluxo proposto: Start Expedition → affinity e passivo inicial → seleção de Realms (um garantido da affinity escolhida) → «Enter Realm» para entrar.

• Confirmar se o primeiro Realm é iniciado automaticamente ao selecionar a affinity; os seguintes continuam a exigir «Enter Realm».

### UI-014 — Rerolls individuais [PENDENTE]

• Cada Realm dispõe de até TRÊS rerolls próprios, por Expedition. Não são partilhados entre Realms nem reiniciados por refresh.

• Mostrar rerolls restantes por Plane; definir/salvaguardar consumo com persistência e sem exploits.

### UI-015 — Passivo inicial e recompensas dos Realms [PENDENTE]

• Exceção: a escolha inicial da affinity concede um passivo imediato. Os passivos seguintes só aparecem ao concluir cada Realm.

• Cada passivo deve mostrar o ícone SIMPLIFICADO da affinity correspondente; aplicar também na seleção inicial e nos cartões dos Realms.

• Os passivos híbridos devem mostrar os ícones das DUAS affinities que os originam.

• Garantir que o passivo só é concedido uma vez por conclusão elegível e permanece na Expedition após refresh.

## BACKLOG — 05 | UI E RESTRIÇÕES DENTRO DA EXPEDITION

### UI-016 — Equipar apenas loot da Expedition [PENDENTE]

• Durante a Expedition, não é permitido equipar itens da Stash global.

• A troca de equipamento durante a Expedition só pode usar itens ganhos nessa mesma Expedition. O equipamento que o personagem levou ao entrar continua equipado até ser trocado segundo as regras existentes.

• Introduzir uma bag separada e mais pequena para o loot obtido durante a Expedition. Capacidade exata a definir após análise de UI/loop.

• Desabilitar acesso a Forge e Merchant enquanto a Expedition está ativa, tanto na UI como nas regras de jogo.

### UI-017 — Novo layout de Expedition [PENDENTE]

• Mostrar personagem visível com equipamento realmente equipado, reutilizando o visual/componente do Inventory/Camp, evitando redesenhar assets existentes.

• Apresentar uma bag compacta por baixo da personagem com os itens ganhos exclusivamente nessa Expedition.

• Dar destaque à affinity do Plane, progresso, botão «Entrar no Plane», rerolls restantes, passivos já conquistados e estado atual, sem sobrecarregar mobile.

## BACKLOG — 06 | PERSISTÊNCIA, REFRESH E ANTI-EXPLOIT

### UI-018 — Persistência de Expedition [PENDENTE]

• Fazer refresh/reabrir a página mantém a Expedition ativa, escolhas, recursos, buffs/passivos ganhos, loot obtido, bag, equipamento, rerolls e progresso confirmado.

• Se o refresh acontecer DENTRO de um Plane, restaurar o jogador ao estado imediatamente anterior à entrada nesse Plane, sem destruir a Expedition completa.

• A restauração NÃO pode servir para repetir o mesmo Plane à procura de loot melhor, novos rolls ou resultados favoráveis.

• Proposta a validar tecnicamente: checkpoint persistido antes de entrar + identidade/seed/resultado do Plane fixos ou outro mecanismo equivalente; assegurar consistência da transação de entrada, conclusão e atribuição de loot. Não reembolsar rerolls consumidos com refresh.

• Testar múltiplas abas, navegação atrás, reconexão e refresh durante animações, loot ou escolha de passivo, prevenindo duplicação de Runes/recompensas.

• Não alterar saves reais em testes; avaliar migração segura dos dados de affinity gear e set bonuses.

## BACKLOG — 07 | VERSÃO E PLANO DE ENTREGA

### UI-019 — Identificador da versão [PENDENTE]

• Apresentar a versão do jogo como «v0.12.0» no topo, interfaces e histórico de versões pertinentes, em vez de «v0.12» ou valores antigos. Esta é a versão-alvo do pacote.

• Atualizar changelog apenas quando o conjunto for realmente implementado e aprovado.

### UI-020 — Estratégia de testes e balanceamento [POR PLANEAR]

• PRIMEIRO: integrar interface e regras descritas, preservar o conteúdo v0.12 já válido, garantir funcionamento e segurança dos saves.

• DEPOIS: correr simulações de Cloth/Leather/Plate, estatísticas, distribuição de loot, potencial de Runas e de passivos, rerolls e progressão. Não fixar números agora.

• Implementação em lote apenas mediante ordem expressa; branch development; sem main, deploy, Firebase rules ou alteração de saves reais.

## PENDÊNCIAS PARA CONFIRMAR

1. Confirmar se a primeira affinity inicia combate de imediato num Realm correspondente ou apenas garante um Realm da mesma affinity nas primeiras opções, com botão Enter Realm.

2. Quais as seis affinities exatas do build atual e quais pares formam passivos híbridos? Confirmar contra a v0.12 antes de alterar código.

3. Qual a capacidade desejada da expedition bag e o destino do loot não equipado no fim? Definir após desenho e teste.

4. Qual o tratamento de equipamentos antigos com affinity e set bonus no processo de migração? Exigir estratégia de segurança.

5. O boss final deve conceder exatamente uma Rune por Expedition terminada; validar regras existentes para elegibilidade e duplicação.

## REGISTO DE DECISÕES — 19/10/2026

Novos pedidos para Inventory, categorias Cloth/Leather/Plate, retirada de set bonuses/affinity transfer/sigils, Runes no boss, primeira affinity, botão do Plane, rerolls individuais, passivos pós-Plane, bag da Expedition, bloqueio de Stash/Forge/Merchant, persistência/anti-exploit e nome v0.12.0. Todos: APENAS REGISTADOS, sem implementação.

ATUALIZAÇÃO — 19/10/2026 | NOME REALMS E AFFINITY INICIAL

Nome recomendado para as dimensões de combate: Realms (em vez de Planes; Plains significa planícies). Nome de trabalho.

Ao clicar Start Expedition: mostrar 6 affinities com ícones simplificados. Escolher uma concede logo um passivo da affinity escolhida e garante pelo menos um Realm dessa affinity entre as primeiras opções (100%).

Ao completar Realms adicionais, o jogador pode receber/escolher outros passivos. Cada passivo mostra o ícone simplificado da affinity correspondente; híbridos mostram os dois ícones.

Manter a ação Enter Realm para iniciar um Realm selecionado. Pendente apenas esclarecer se o primeiro Realm começa automaticamente após escolher a affinity ou aparece garantido entre as escolhas iniciais antes do botão Enter Realm.

Esta nova decisão substitui as notas anteriores que adiavam TODOS os passivos até ao final do primeiro Realm. Não implementar código ainda.

## BACKLOG — 08 | RESULTADO E SAÍDA DE CADA REALM

### UI-021 — Ecrã de resultado persistente [PENDENTE]

• Ao concluir um Realm, seja por vitória ou derrota, NÃO sair automaticamente do ecrã de combate.

• Mostrar resultado inequívoco: «REALM CLEARED» na vitória; «YOU DIED» / «DEFEAT» destacado na derrota, com indicação clara da morte da personagem.

• Acrescentar botão visível «EXIT REALM» para sair manualmente depois de consultar o resultado, tanto na vitória como na derrota. Evitar que um clique acidental fora da área oculte o resultado.

• Mostrar resumo sucinto no topo do resultado: Realm e affinity, resultado, inimigo que matou a personagem (se aplicável), total de dano causado e recebido, duração/turnos (apenas se essa métrica existir) e recompensas efetivamente atribuídas.

• Garantir que ao perder o Realm o ecrã explica o que aconteceu, e que as consequências concretas da morte respeitam as regras atuais da v0.12.0; não inventar penalizações novas nesta fase.

### UI-022 — Combat Log e análise da derrota [PENDENTE]

• Permitir consultar o log COMPLETO do Realm terminado antes de carregar «EXIT REALM», incluindo ações, dano causado/recebido, heals, Mana e buffs/debuffs relevantes, se a engine disponibilizar esses eventos.

• Resumo opcional expandível: dano total por fonte/arma/ability, dano recebido por inimigo e últimos ataques antes da morte; não assumir informação que a engine não grava.

• Deixar log em bloco expansível/scroll próprio, com boa legibilidade mobile; ecrã de combate não deve crescer ou saltar abruptamente ao abrir/fechar o log.

• Não recalcular o combate nem fazer novamente o roll do loot quando o jogador abre/fecha o log ou carrega refresh. Resultado e recompensas devem ficar consolidados de modo a impedir exploits.

• Decidir na implementação se o histórico de logs fica disponível apenas até à saída ou durante a Expedition para rever depois; preferência inicial: manter pelo menos o último Realm concluído, sujeito a memória/performance.

## BACKLOG — 09 | INFORMAÇÃO DE PROGRESSÃO NO CAMP

### UI-023 — Dashboard inicial de Expeditions [PENDENTE]

• No Camp, mostrar de forma compacta: «Current Expedition» (identificador/progressão real), «Expeditions Completed» (total histórico concluído) e «Expeditions Attempted/Started» quando houver dados distintos; não confundir o número da Expedition atual com a contagem de tentativas.

• Se existir Expedition ativa, indicar qual, Realm atual/próximo e affinity inicial com ícone simplificado. Se não houver, mostrar «No active Expedition» e a próxima disponível.

• Informação secundária útil: melhor Expedition/progresso alcançado (Personal Best), Runs concluídas vs falhadas (se registadas corretamente) e Runes obtidas. Preferir numa secção «Your Journey» compacta, não dez contadores espalhados.

• Identificar claramente informação local/de teste para não confundir com progresso cloud real.

### UI-024 — Visibilidade e legibilidade da progressão [PENDENTE]

• Prioridade de leitura: 1) qual Expedition podes iniciar/continuar, 2) progresso atual, 3) botão Start/Continue, 4) pequenos indicadores de histórico; em mobile, botão principal sempre fácil de encontrar.

• Aproveitar o layout original aprovado: painel da Expedition à DIREITA, personagem ao centro, HP/Mana à esquerda; contadores de histórico como linha compacta ou dropdown «Journey / Stats», sem criar outra secção enorme por baixo.

• Os contadores só avançam no evento certo e uma única vez; distinguir «iniciada», «concluída», «falhada» e «ativa». Refresh, múltiplas abas, saída e relogin não podem duplicar tentativas/completions/Runes.

• Ausência de dados antigos deve aparecer como «—» / «Not tracked» quando necessário, sem inventar número zero nem converter automaticamente saves antigos em novas estatísticas.

## NOTAS DE ACEITAÇÃO / QA — RESULTADOS E PROGRESSO

• Vitória: Realm termina, prémios são gravados, aparece «REALM CLEARED», jogador lê log à vontade e só sai com «EXIT REALM».

• Morte: Realm termina, aparece «YOU DIED» com causa possível da morte e último dano do log; jogador continua a poder ler o log e sair manualmente.

• Refresh do ecrã de resultado/entre Realms: não cria loot, passivos, Runes nem stats duplicados, nem permite refazer RNG por conveniência.

• Camp: número da Expedition e totais históricos não são confundidos; testar conta nova, progressão normal, jogador com save antigo e Expedition interrompida.

• Implementar depois de reunir backlog completo: apenas development; sem deploy, main, Firebase rules ou alterações em saves de jogadores.

## BACKLOG — 10 | CAMP ENTRE REALMS — PASSIVOS E POÇÕES

### UI-025 — Passivos ativos em formato compacto [PENDENTE]

• Durante a Expedition, no Camp ENTRE Realms, substituir a apresentação extensa de passivos por uma área compacta: pequenos ícones simplificados das affinities, em grelha/linha, com indicador de quantidade/stack quando aplicável.

• Mostrar detalhes do passivo, efeitos e valores num tooltip ao passar o rato e num toque/clique em mobile, sem ocupar permanentemente espaço de leitura.

• Passivos híbridos: apresentar lado a lado os dois ícones simplificados das affinities responsáveis (ou ambos claramente identificados no mesmo slot).

• Distinguir o passivo inicial dos passivos conquistados nos Realms, quando útil, sem texto repetitivo. Os efeitos e respetivos valores mantêm-se iguais; mudança sobretudo visual.

• Posicionar o painel de passivos perto das barras HP/Mana e da pequena bag, sem competir com o botão «Enter Realm». Layout responsivo sem sobreposição.

### UI-026 — Slots clicáveis de Health e Mana Potion [PENDENTE]

• No Camp entre Realms, colocar DOIS slots de consumíveis de leitura imediata: Health Potion (frasco vermelho) e Mana Potion (frasco azul), cada um com arte PLACEHOLDER temporária. Os ícones definitivos poderão ser criados posteriormente.

• Clicar/tocar diretamente no ícone da poção consome uma dose e aplica a recuperação de HP ou Mana segundo as regras e quantidades já existentes. Deixar de exigir botão «Heal»/«Restore Mana» separado.

• Mostrar quantidade disponível (se o sistema tiver doses), tooltip de recuperação e feedback visual após utilização; mostrar o HP/Mana atualizado de imediato.

• Slots desativados se não houver dose disponível, se o recurso estiver no máximo ou em contexto onde a poção é proibida. Evitar consumo acidental por duplo clique e operações repetidas após refresh.

• A utilização de poções continua PERMITIDA apenas no Camp de intervalo após terminar um Realm, NÃO durante combate, NÃO na Camp principal fora da Expedition e NÃO antes de terminar o primeiro Realm; preservar as regras v0.12.0 já estabelecidas.

• Se a arquitetura atual não usar itens/doses reais, reaproveitar o mecanismo atual de heal/mana, substituindo só o acionador da UI. A existência de stacks/capacidade de poções deve ser verificada antes da implementação; não introduzir nova economia sem pedido.

• Testar acessibilidade mobile/desktop, tooltip, ausência de doses, HP/Mana cheio, persistência do consumo e bloqueio durante transição entre Realms.

## NOTA DE IMPLEMENTAÇÃO

• Esta é uma alteração para o Camp interno de uma Expedition entre Realms, distinta da homepage Expedition Camp (fora da Expedition). Não acrescentar os botões de poção à homepage.

• Estas decisões entram no mesmo lote de v0.12.0. Não alterar código, branch main, Firebase nem saves nesta fase.

## BACKLOG — 11 | EXTRACTION, FIM DE EXPEDITION E COMPARAÇÃO DE GEAR

### UI-027 — Expedition Summary [APROVADO / PENDENTE]

• Ao terminar uma Expedition (boss final, extração antecipada ou morte), mostrar um ecrã de resumo apropriado ao resultado.

• Incluir Realms concluídos, affinities/passivos utilizados, equipamento recolhido vs perdido, duração/turnos e dano causado/recebido quando o motor fornecer dados fiáveis. Mostrar Rune obtida apenas na vitória elegível contra o boss final.

• Permitir rever o resultado e o último Combat Log antes de fechar, sem duplicação de rewards.

### UI-028 — Loot em risco e Early Extraction [APROVADO / PENDENTE]

• Regra escolhida: MODELO A. Ao morrer durante a Expedition, o jogador perde TODO o loot adquirido nessa Expedition, incluindo qualquer item desse loot entretanto equipado; mantém intacto o equipamento que já possuía ao entrar.

• Se o jogador decidir SAIR CEDO e com segurança, pode EXTRAIR o loot recolhido e levá-lo para a Stash/inventário permanente.

• Local sugerido para extração: Camp de intervalo ENTRE Realms, após resolver o Realm anterior e antes de iniciar o próximo; nunca interromper um combate para guardar loot. Mostrar confirmação com informação de que a Expedition termina.

• Regras de progressão propostas: extração antecipada não conta como Expedition concluída, não desbloqueia a Expedition seguinte e não atribui a Rune do boss final; guardar apenas loot obtido legitimamente. Validar com utilizador antes de implementar.

• Preservar tracking de origem dos itens (gear levado de casa vs loot novo) mesmo quando são equipados ou trocados durante a Expedition. Sem formas de copiar itens por refresh, múltiplas abas, morte ou extração.

• Definir o que acontece quando a Stash está cheia (avisar e permitir resolução segura); não destruir loot silenciosamente.

### UI-029 — Comparação rápida de gear na bag [APROVADO / PENDENTE]

• Ao clicar/tocar num item da bag da Expedition, mostrar comparação com o item equipado no mesmo slot: Strength / Intelligence / Agility / Armor / Evasion / Mana Regeneration e demais stats reais.

• Mostrar diferenças positivas/negativas, tipo Cloth/Leather/Plate, rarity e requisitos. Permitir Equip quando elegível e manter a restrição de não equipar nada da Stash durante a Expedition.

• Se for arma de duas mãos, refletir corretamente implicações no Off-Hand. Evitar mudanças de layout ou janelas grandes no mobile.

### UI-030 — Sair/Abandonar Expedition [APROVADO / PENDENTE]

• Mostrar opção clara de terminar a Expedition no Camp entre Realms, com confirmação e consequências explícitas.

• Design sugerido: «Extract & Leave» para sair antecipadamente levando o loot; «Abandon» só deve existir em separado caso tenha uma consequência diferente e intencional. Evitar botões ambíguos que façam perder gear por engano.

• Dentro de um Realm em combate, não permitir extração livre para fugir ao risco. Fechar/recarregar a página segue checkpoint e regras anti-exploit previamente documentadas.

• Testar morte, extração, tentativa de sair no combate, navegação atrás, refresh, múltiplas abas e último Realm do boss.

## BACKLOG — 12 | EXPEDITIONS SEM LIMITE E LEADERBOARD

### EXP-031 — Progressão ilimitada [PROPOSTA A VALIDAR; IMPLEMENTAÇÃO CONDICIONAL]

• Objetivo: não existir limite fixo de número de Expedition (não parar na 200). Após completar a Expedition N e o respetivo boss final, desbloquear a Expedition N+1, indefinidamente enquanto a escala técnica suportar.

• Cada Expedition continua a ter o seu ciclo finito de Realms e boss final, para preservar atribuição de Rune após o boss; «ilimitadas» refere-se ao NÚMERO de Expeditions, não a um único run interminável.

• O leaderboard principal recomendado passa a ordenar pela «Highest Expedition Cleared», e não apenas «Highest Entered/Reached», para não premiar entradas sem vitória. Mostrar melhor marca pessoal e, se útil, data de primeira conclusão como desempate.

• Não codificar manualmente uma lista de 200 níveis/expeditions. Preferir geração parametrizada para N crescente, respeitando encontros, affinities, loot e progressão atuais.

• PRINCIPAL COMPLEXIDADE: escalamento da dificuldade, economia/gear, valores numéricos, save/persistência e segurança do leaderboard, não a contagem em si. Evitar overflow, stats impossíveis, geração de adversários triviais/invencíveis, recompensas infinitamente inflacionadas e payloads de save crescentes.

• NOTA DE SEGURANÇA: se records e rankings dependerem apenas do browser, não são competitivos/verificados. Para leaderboard fiável será necessário validar resultados no servidor/infraestrutura adequada; não afirmar proteção até auditoria.

• Proposta de execução: desenhar já a arquitetura extensível na v0.12.0, implementar após estabilizar o novo loop e verificar código. Testar Expeditions 1, 10, 50, 100, 200, 500, 1000 e extremos com simulações antes de remover de facto quaisquer travões artificiais.

• Se existir um limite técnico atual, deixar documentado como limite provisório de segurança (não como objetivo do jogo) até validação. Não publicar como ilimitado sem testes.

• Confirmar critério de pontuação, desempates e se o leaderboard é local ou partilhado. Não alterar main, Firebase nem registos de jogadores nesta fase.

## REGISTO — 19/10/2026

• Aprovados: Expedition Summary; Modelo A (morte perde só loot desta Expedition, gear prévio protegido); extração antecipada permite guardar loot; comparação rápida; botão de saída com confirmação.

• Solicitação de design: progressão sem cap de Expeditions e leaderboard de maior progressão. A viabilidade real requer leitura do código e simulações — nenhuma mudança implementada nesta conversa.

## BACKLOG — 13 | GEAR TIER E SIMULAÇÕES OBRIGATÓRIAS

### UI-032 — Nível do equipamento identificado por Expedition [APROVADO / PENDENTE]

• A nomenclatura do nível do Gear passa a ser «E1», «E5», «E20», «E100», etc., em vez de «Level 1», «Lv. 5» ou níveis do sistema antigo. «E» significa Expedition.

• Exemplos na interface: «E1» para equipamento de nível de Expedition 1; «E5» para nível da Expedition 5. Não separar «E» do número dentro do badge; em texto corrido pode aparecer «Expedition 5».

• Aplicar de forma consistente nos itens equipados, Inventory/Stash, bag da Expedition, detalhes/tooltips, loot, Merchant, Forge, comparação de equipamento, recap e restantes ecrãs pertinentes.

• O rótulo E# descreve o patamar do equipamento, NÃO o número de tentativas do jogador. O número mostrado deve vir do atributo de progressão do item, sem mudar sozinho quando o jogador avança de Expedition.

• Investigar e definir a proveniência do patamar E# para loot, Forge e Merchant, bem como migração compatível de equipamento antigo. Idealmente equipamento proveniente da Expedition N tem patamar E N, sujeito às regras existentes de geração e balanceamento.

• Não confundir E# (patamar do item) com Cloth/Leather/Plate (tipo de armor), rarity ou a affinity inicial da Expedition. Todos estes conceitos têm funções diferentes.

• Garantir leitura de itens antigos sem perder dados nem destruir saves. Testar E1, E5, E200, E1000 e valores elevados se a progressão ilimitada for adotada.

### QA-033 — Simulações APÓS implementar o pacote v0.12.0 [OBRIGATÓRIO / PENDENTE]

• Ordem de trabalho confirmada: implementar todas as melhorias aprovadas em development → testes funcionais e regressões → simulações de gameplay/economia/combate → corrigir problemas de balanceamento encontrados → validação final → só publicar mediante ordem explícita.

• Simular progressão de Expeditions/Realms em patamares crescentes, incluindo curva infinita (E1/E5/E10/E50/E100/E200/E500/E1000 e patamares mais altos), usando várias builds reais, distribuição de gear e decisões de passivos.

• Comparar identidades e viabilidade de Cloth (Intelligence/Mana Regen), Leather (Agility/Evasion) e Plate (Strength/Armor), assim como gear de patamar E#, drops, power creep e escalamento de inimigos.

• Simular seis affinities iniciais, passivo de início, passivos híbridos, rerolls por Realm, ritmo de evolução, disponibilidade de Health/Mana Potion e probabilidade de conclusão de cada Expedition.

• Simular economia e decisões de risco: sair cedo levando loot versus continuar e arriscar perder loot novo, morte protegendo equipamento inicial, capacidade da bag, prémios do boss final e taxa de obtenção de Runes.

• Testes anti-exploit obrigatórios: refresh dentro de Realm e após vitória/morte, novo loot após reload, reroll repetido, extrações duplicadas, contagens de completed/attempted, itens e Runes duplicados, duas abas abertas, tentativa de equipar Stash durante Expedition.

• Não aceitar que o código está equilibrado apenas por compilar ou passar unit tests: registar no relatório dados de simulação, variância/odds observadas, outliers, builds dominantes, pontos onde progressão bloqueia ou fica trivial e recomendações de ajuste.

• Gerar relatório de simulação e comparação antes/depois das correções, mas não escolher de antemão números finais de stats, odds, scaling ou economia.

• Preparar testes com perfis sintéticos isolados; NUNCA modificar saves de jogadores reais nem atualizar a main/deploy/Firebase rules sem ordem explícita.

## DECISÃO — 19/10/2026

• Gear level passa para formato E# (Expedition): E1, E5, etc.

• Depois de toda a implementação, as simulações de balanceamento são OBRIGATÓRIAS e precedem a publicação.

DECISÕES PARA DESBLOQUEAR CODEX — FASE 1 (19/10/2026)

Estado: proposta concreta de implementação para resolver três bloqueios comunicados pelo Codex; confirmar com o utilizador caso haja contradição técnica.

BLOQUEIO A — AFFINITIES / SETS / LEGENDARIES

• Remover affinities do gear e todos os Set Bonuses. As affinities continuam nas Expeditions/Realms e respetivos passivos.

• Preservar ataques nativos das armas (Slash, Smash, etc.) e comportamento de combate não dependente de Set Bonuses, incluindo habilidades únicas de Legendaries que não dependam diretamente de affinities.

• Não inventar novas habilidades nem mapear automaticamente efeitos de affinity removida para Legendaries. Se algum efeito lendário exigir exclusivamente uma affinity antiga, reportar o caso específico antes de o alterar.

• Manter leitura tolerante dos campos antigos dos saves (affinity, set e outros), mas deixar de os usar no cálculo da nova jogabilidade; nunca apagar dados antigos nem sobrescrever saves de jogadores.

BLOQUEIO B — CLOTH / LEATHER / PLATE

• Aplicar estas 3 categorias aos slots de ARMADURA: Helm, Armor, Gloves, Belt e Boots; armas, Off-Hand e acessórios mantêm o seu tipo funcional existente.

• Cloth: Intelligence, alguma Mana Regeneration; Leather: Agility, Evasion; Plate: Strength, maior Armor.

• Para já, conservar budgets e escala de raridade/E# já existentes e atribuir prioridade/pool de stats de acordo com o tipo. Não fazer simulações e não criar nova curva de balanceamento. Se faltar na engine algum atributo ou for obrigatório inventar coeficientes novos, sinalizar esse ponto preciso e deixar o restante da Fase 1 prosseguir de forma segura.

• Sem itens híbridos nesta versão.

BLOQUEIO C — BELT

• Belt é o DÉCIMO slot, funcional, não só decorativo. Tem tipos Cloth/Leather/Plate como os outros itens de armadura.

• Integrar em equipamento, loot, Stash, Merchant, Forge, UI, validações e serialização. Reutilizar um placeholder existente; não gerar imagens novas.

• Saves legados sem Belt são válidos e abrem com slot vazio; não alterar os dados históricos dos jogadores.

RESTRIÇÕES DE EXECUÇÃO

• Autorização limitada à Fase 1, exclusivamente development. Não tocar em main, deploy ou Firebase rules. Não fazer simulações nem stress tests, nem alterar saves reais.

• Fazer apenas testes direcionados necessários para garantir que o novo slot e os itens não quebram a aplicação/saves. Usar resumo final máximo 10 linhas, sem relatórios extensos. Não começar Fase 2 automaticamente.

## FASE 1 — HOTFIX APÓS COMMIT b44a684 (LOCAL)

### COMBAT-034 — Introduzir EVASION no motor de combate [APROVADO / PENDENTE]

• O commit local b44a684 da branch development implementou Cloth/Leather/Plate, Belt e rótulos E#. Existem 27 testes passados e verificações browser reportadas pelo Codex. Fase 2 ainda não começou.

• Falta EVASION: Leather deve fornecer Evasion Rating como atributo próprio, além de Agility. Não confundir Evasion com Agility e não alterar os efeitos que Agility já tem.

• Evasion Rating deve converter-se numa probabilidade de esquiva com retornos decrescentes e limite provisório de 30%. Examinar a escala real E# dos atributos do jogo antes de escolher a fórmula. Não inventar percentagens lineares por nível nem prometer balanceamento sem simulações.

• Ao esquivar um golpe físico direto (ataque básico ou habilidade física evitável): dano 0; efeitos on-hit associados àquele golpe não são aplicados (incluindo crit, Bleed/Poison/Burn associados ao contacto); mostrar feedback legível «DODGE» e registar no Combat Log.

• Ataques mágicos diretos, dano periódico independente (DoT) e efeitos/ataques marcados como inevitáveis não são evitáveis com Evasion. Não interromper DoTs já aplicados por esquivas posteriores.

• Um só sorteio por golpe elegível; processar a esquiva antes de dano, crítico e efeitos on-hit. Evitar double roll, double damage e inconsistências em speed 4×/UI.

• Incluir Evasion Rating e chance efetiva de esquiva na UI de atributos/equipamento e comparação de itens. Garantir que gear Leather de diferentes patamares E# atribui Evasion segundo budgets existentes; normalização e fórmulas finais ficam para simulações após todas as fases.

• Respeitar saves antigos: Evasion ausente implica 0; não tocar em saves reais, não alterar main ou Firebase. Testes direcionados: 0 Evasion, cap máximo, físico atingido/esquivado, spell não esquivável, DoT não esquivável, on-hit bloqueado, logs e serialização. Sem simulações ou stress tests nesta correção.

• Implementar como correção isolada da Fase 1 na development. Preservar habilidades de Legendary independentes; dependências ainda identificadas (Soul Reaver–Drain, Hammer of the Sunforge–Sunder, Sunpiercer–Nature, Fang of the Sunbreaker–Poison, Signet–procs de affinity) devem continuar rastreadas e não ser silenciosamente removidas.

• Depois da correção, commit de hotfix local, resumo curto de arquivos/tarefas/testes e aguardar Fase 2.

ESTADO PÓS-Fases 1–5 — 19/10/2026

• O utilizador informa que as cinco fases de implementação do pacote v0.12.0 ficaram concluídas no Codex. Esta informação NÃO equivale a revisão/verificação independente de código ou testes.

• Antes de simulações: auditoria de integração focada e de baixo custo com testes dirigidos. Verificar se as cinco fases estão integradas corretamente, incluindo Evasion, tipos de gear Cloth/Leather/Plate, Belt, nomenclatura E#, remoção das affinities/sets do gear, habilidades Legendary, fluxo inicial de affinity/passivo, Realms/rerolls, UI, Camp entre Realms, poções, morte, extração, Stash isolada, Forge/Merchant bloqueados, logs, leaderboard e saves.

• Verificar especialmente atomicidade de atribuição de loot/passivos/Runes e contadores; recarregar durante o Realm deve manter Expedition com as regras anti-exploit. Confirmar migração segura de saves antigos sem qualquer teste sobre perfis reais.

• Solicitar ao Codex apenas auditoria: identificar PASS/FAIL, severidade e correções indispensáveis; não executar simulações de balanceamento nesta etapa. Reparar falhas confirmadas com testes locais pertinentes antes de avançar.

• Após auditoria funcional e bugs críticos resolvidos: simulações de balanceamento em perfis sintéticos isolados, com benchmarks dos patamares E1 a E1000+, builds Cloth/Leather/Plate, escolhas de affinities e passivos, loot, poções, sobrevivência, extração e distribuição de Runes.

• Permanecer em development; sem main, deploy, Firebase rules nem alteração de saves reais até autorização expressa. Guardar número do commit final das cinco fases e resultados da auditoria quando o Codex os devolver.

AUDITORIA DE INTEGRAÇÃO — COMMIT 508a938 | 19/10/2026

Fonte: ficheiro v0120-integration-audit.md enviado pelo utilizador. Audit apenas; não executou alterações.

Veredicto: FAIL para afirmação de que as cinco fases estão completas / NÃO PRONTO para produção. 73/73 testes unitários direcionados passaram; testes browser existentes de equipment (2), camp (3), Realms (2), persistence/results (2) passaram; Evasion browser fixture falha por RNG antigo, mas diagnóstico isolado confirmou Evasion em dois viewports.

F1 — ALTA: checkpoint após refresh permite Rune unequip e reciclagem sem guard. Corrigir bloqueio para todas as mutações de Rune durante Realm retomado, com teste de regressão refresh → Runes.

F2 — ALTA para validação: fixture de testes de Evasion usa Math.random enquanto dodge usa gameRandom seeded. Corrigir FIXTURE (não fórmula de Evasion) e rerun browser desktop/mobile.

F3 — Legendárias: dependências não ativas para Soul Reaver (Drain), Hammer of the Sunforge (Sunder), Sunpiercer Longbow (Nature healing), Signet of the Dawnforged (procs antiga affinity). Rever triggers; preservar efeitos independentes. Validar Fang/Decay-Poison, Crescent/Blood Bleed, Pendant/Tome/Magic Burn, Winterheart/Magic Chill. Aprovação de política de habilidades necessária antes de simular builds.

F4 — A Rune continua a cair só em E10/E20/.../E200. Decisão de design anterior pede UMA Rune pelo boss final de CADA Expedition concluída. Alterar de forma coordenada atribuição, validação e schema/economia, não só condição do drop; testar duplicações.

F5 — Expeditions ainda limitadas a E200; schema e item validation também limitam. Endless E500/E1000 não funciona. Manter E200 como limite técnico provisório até desenho/teste de scaling e saves, sem afirmar que o jogo já é ilimitado.

F6 — Leaderboard global só tem contrato desativado e ranking local; não existe ranking partilhado validado em servidor. Persistência v0.12 em contas reais e escritor de migração Firebase ainda não implementados. Impeditivos de publicação, não de simulações isoladas E1–E200.

Riscos saves: migração legacy em cópia existe, sem writer cloud; Magic+Poison protótipo não convertido; log + payload máximo 700k caracteres precisa validação. Nunca experimentar migração sobre saves reais.

ORDEM DE EXECUÇÃO: hotfix F1 + F2 com testes dirigidos → fechar decisão F3 e implementar triggers preservados → resolver F4 Rune/boss e testes anti-duplicação → auditar resultado de novo → simulações isoladas E1–E200 → planeamento de endless/cloud/leaderboard → release somente mediante autorização.

Regras: development apenas; sem main, deploy, Firebase rules, saves reais ou simulações nesta fase de correções.

## BACKLOG — 14 | LEGIBILIDADE DO TIPO DE ARMADURA

### UI-035 — Mostrar Cloth / Leather / Plate no equipamento [APROVADO / PENDENTE]

• Em todos os itens de ARMADURA (Helm, Armor, Gloves, Belt, Boots), apresentar a categoria «Cloth», «Leather» ou «Plate» de forma explícita, diretamente no cartão/linha do item, sem exigir abrir detalhes.

• Mostrar o mesmo tipo no tooltip, painel de detalhes e comparação com item equipado; aplicar em Inventory, Stash, bag da Expedition, equipamento usado, loot, Merchant e Forge, quando existirem cartões de item.

• Exemplo: «E5 · Leather · Rare» ou «E5 Leather Gloves». Preservar nome do item, nível E#, raridade e legibilidade mobile.

• Preferir badge textual discreto, com contraste suficiente; não depender apenas de cores/ícones, nem confundir com affinity (que foi removida do gear).

• Armas, Off-Hand e acessórios não recebem rótulos Cloth/Leather/Plate, a menos que sejam de facto do tipo armadura suportado.

• Ler o tipo já presente nos dados do item, sem recalcular categorias ou modificar balanceamento, loot, saves ou gameplay. Para gear antigo sem categoria, não inventar um tipo; mostrar um estado neutro seguro se necessário.

• Fazer esta alteração como pequena tarefa UI na development, com testes dirigidos de renderização em desktop/mobile; sem simulações, deploy, main ou Firebase.

IMPLEMENTAÇÃO UI-035 + UI-036 — development, commit 89e568e (20/10/2026)

• UI-035 implementado: os slots de armadura ocupados no equipamento principal apresentam agora Cloth, Leather ou Plate a partir de item.armorType, com estilos desktop/mobile e título acessível; não acrescenta classificação a armas e acessórios.

• UI-036 implementado: botão «Clear All NEW» condicional nas secções Inventory (Stash+equipado), Runes (apenas runes), e Expedition Bag (apenas loot em bolsa quando é permitido preparar/resolver overflow). Reutiliza o campo isNew, com save/refresh existentes; não vende, apaga, move, nem altera filtros. Botões ocultos se não houver NEW no respetivo âmbito.

• Expedition Bag mostra agora o badge NEW em loot recém-obtido.

• Commit confirmado no GitHub development: https://github.com/Skinny-lfg/wanderer-game/commit/89e568e88499174872426ee1e279711df529a55e

• Verificações estáticas de implementação passaram no commit. Testes automatizados/browser não foram executados neste ambiente; CI/statuses de GitHub não reportaram resultados. Requer validação visual e funcional local após pull. Sem alterações a main, deploy, Firebase ou saves reais.

## BACKLOG — 15 | TESTE DE DIVERSÃO, BUILDCRAFT E REALMS (20/10/2026)

### QA-001 — Auditoria de variedade da v0.12.0 [PLANEADO; NÃO IMPLEMENTAR MECÂNICAS]

Objetivo: descobrir se os jogadores escolhem equipamento, armas, Cloth/Leather/Plate, passivos e Realms por sinergia, em vez de simplesmente selecionarem o maior número. Separar FUN (playtest humano) de BALANCE (simulador com motor real).

Estado atual confirmado em development: catálogo com 48 passivos, dos quais 15 híbridos (um por cada par de 6 famílias). Como a Expedition permite no máximo 3 famílias e cada híbrido tem rank máximo 1, cada run pode aceder a no máximo 3 híbridos diferentes, apesar dos 15 no catálogo. Passivo inicial é fixo por família/elemento. Há 3 opções por Realm, mas o tipo de encontro da etapa é igual nas 3 cartas; variam famílias, tema e parte do risco. Affinities e sets do gear foram removidos deliberadamente: NÃO reintroduzir sem nova decisão.

Teste estrutural exploratório de ofertas (não é simulação de combate, nem teste humano): 20.000 percursos aleatórios completos e 20.000 percursos com prioridade a híbridos, assumindo vitória nos 15 Realms. Reimplementação simples das regras de catálogo/draft: aleatório ≈1,89 híbridos escolhidos, ≈12,78 passivos distintos e terceira família adquirida até Realm 5 em 98% dos percursos; política híbrida ≈2,59 híbridos, ≈12,00 passivos distintos e terceira família até Realm 5 em 96%. Estes valores são indicadores de estrutura, não previsões de retenção ou vitória; confirmar nos scripts do jogo antes de aprovar ajustes.

### QA-002 — Ensaios comparativos reais [PENDENTE]

Executar, apenas com perfis sintéticos e motor integrado, as 7 armas × Cloth/Leather/Plate × famílias/builds representativas em E1/E20/E80/E200, com seeds replicadas; incluir off-hand, Legendary independentes, raridades iguais, progressão starter e Evasion físico vs mágico. Registar win rate, Realms/ondas alcançadas, dano, cura, mana, esquiva, tempo, trocas de equipamento, escolhas de loot e escolha da arma vencedora. Corrigir/decidir previamente dependências de Legendary F3 e curva irregular E20; não interpretar bots de Gear Power como jogadores reais.

### QA-003 — Repetição das escolhas [PENDENTE]

Recolher por Realm: trio de opções, oferta/seleção de passivos, híbridos elegíveis e apresentados, upgrades repetidos, frequência de reroll, mudança de família, diferença de risco/recompensa das três cartas e se jogador consegue explicar o motivo da sua escolha. Separar early/mid/late Expedition. Rever especialmente os Realms finais, após fechar 3 famílias.

### QA-004 — Playtest humano cego A/B [PENDENTE]

8–12 pessoas; 2–3 Expeditions/sessões de 15–30 minutos; perguntar após Realms 5/10/15 se existiu decisão interessante, se quer repetir, que item/arma/passivo escolheu e porquê, quantas opções parecem indiferentes e o momento exato em que sentiu repetição. Controlar experiência com jogos e familiaridade com Wanderer. Não confundir dificuldade E20 com aborrecimento de passivos.

### IDEIAS CANDIDATAS — SEM APROVAÇÃO / SEM IMPLEMENTAÇÃO

A) Antes de acrescentar dezenas de passivos, testar versões alternativas dos existentes com triggers visíveis e trade-offs (consumir Bleed/Rot para burst, converter Mana em Barrier, etc.).

B) Se híbridos forem raros ou pouco expressivos, testar um SEGUNDO híbrido mecanicamente distinto por par de famílias; manter limite de 3 famílias e evitar loops recursivos.

C) Manter 3 cartas por Realm para mobile; testar diferenças reais de risco/recompensa por carta (Safe / Hunt / Corrupted, bónus e inimigos/ameaças distintos) antes de adicionar uma quarta carta.

D) Comparar builds equilibradas vs especializadas sem tornar Plate, Leather, Cloth ou uma arma universalmente dominante.

Segurança: somente leitura e simulações locais isoladas até autorização; development apenas; sem main, regras Firebase, deploy, cloud, saves reais ou alterações de gameplay. Relatório e métricas exigidos antes de implementar novas opções.

## BACKLOG — 16 | REWORK DOS HÍBRIDOS E PROPOSTAS DE VARIEDADE (20/10/2026)

### DECISÃO DE DESIGN EM EXPLORAÇÃO — Até 3 híbridos perto do final, sem aumentar o limite de 3 affinities

Proposta: manter 6 famílias e máximo 3 famílias por Expedition. Cada par entre as famílias escolhidas pode contribuir no máximo 1 passivo híbrido; com 3 famílias A/B/C, os pares A+B, A+C e B+C permitem até 3 híbridos. Um jogador com só 2 famílias tem apenas 1 par (e pode especializar-se mais em passivos regulares). Um híbrido é um passivo temporário, não uma nova affinity; não existem novos slots de equipamento, nem Gear Affinities/Set Bonuses.

Apoiar 2 alternativas híbridas para cada par de famílias (15 atuais + 15 novas propostas = 30 opções no catálogo), mas permitir escolher APENAS UMA dessas alternativas para esse par em cada Expedition. Isto mantém escolhas mutuamente exclusivas e evita acumular seis híbridos com três famílias.

Ritmo A/B proposto: primeira oportunidade a partir da conclusão do Realm 6, segunda a partir do Realm 9, terceira a partir do Realm 12, condicionado à existência dos pares. Não conceder passivos adicionais: substituir ofertas existentes no draft normal, com pelo menos um híbrido elegível visível nas janelas de milestone, se houver; nunca garantir híbridos sem famílias correspondentes. O jogador pode optar por passivo não híbrido. Não obrigar 3 híbridos por run. Ajustar timings após testes.

### AUDITORIA QUALITATIVA — 15 HÍBRIDOS EXISTENTES (código combat/v012-buildcraft.js, development 82e70684)

Blood + Decay — Plague Rupture [MANTER, TESTAR]: crítico contra inimigo com Bleed e Rot gera burst limitado, cooldown 8s. Boa interação das duas mecânicas; depende de taxa de crítico e aplicação simultânea de estados.

Blood + Aegis — Blood Ward [REFINAR]: inimigo com Bleed gera Barrier em intervalo de 5s; demasiado próximo de Rot Ward na sensação de jogo.

Blood + Vitality — Hemovore [REFORMULAR]: matar inimigo com Bleed cura 4% max HP; praticamente espelho de Rot Recovery e menos expressivo que recompensas automáticas por Wave.

Blood + Fury — Crimson Rush [REFINAR]: crítico em alvo com Bleed dá 15% dano extra; funciona, mas é sobretudo bónus automático de dano.

Blood + Magic — Hex Bleed [MANTER]: cast elemental financiado aplica Bleed (cooldown 3s). Boa ponte entre ataque mágico e Blood; verificar eficácia com todas as 7 armas.

Decay + Vitality — Rot Recovery [REFORMULAR]: matar alvo com Rot cura 4% max HP; redundante com Hemovore. Diferenciar gatilho (expiração de Rot, não kill) ou outra decisão.

Decay + Aegis — Rot Ward [REFINAR]: ticks de Rot geram Barrier a cada 5s; muito parecido com Blood Ward.

Decay + Fury — Toxic Precision [MANTER]: crítico aplica Poison e Rot a cada 2s; bom apoio a build de críticos, mas medir se apenas replica Toxic Touch.

Decay + Magic — Hex Bolt [REFINAR]: cast elemental sobre alvo com Rot dá 18% do poder como dano, cooldown 3s. Útil mas pouco distintivo; testar efeito específico por escola.

Vitality + Aegis — Sanctuary [MANTER]: cura efetiva gera Barrier de 20% da cura, rate limit 1s. Boa identidade, observar excesso de sustain/loop.

Vitality + Fury — Fervent Life [REFINAR]: crítico cura 1% HP, cooldown 4s. Pode ser pouco percetível, comparar impacto e feedback visual.

Vitality + Magic — Life Conduit [REFORMULAR]: cura via helper do buildcraft devolve 2 Mana a cada 3s. Valor pequeno e nem toda a cura clássica passa por esse helper; avaliar uptime e fonte.

Aegis + Fury — Counterstrike [MANTER]: Block prepara um contra-ataque não-recursivo de 18% da base. Possui identidade, mas exige Block efetivo (Shield/Guarded Block); testar armaduras e armas.

Aegis + Magic — Runic Shield [REFINAR]: cast elemental gera Barrier num cooldown de 3s. Mistura bem classes, mas sobrepõe-se a outros geradores de Barrier; aumentar distintividade.

Fury + Magic — Spellblade [CORRIGIR ANTES DO BALANCEAMENTO]: cast prepara +15% no próximo ataque NÃO mágico. Armas físicas com Magic usam ambos canais; Staff/Wand passam longos períodos a atacar como casts e podem deixar o bónus por utilizar até faltar Mana. Tornar o próximo ataque elegível para todas as armas, sem disparar no mesmo ataque que carrega o efeito e sem proc recursivo. Não confundir teste unitário de existência com sucesso em todas as armas.

Os estatutos acima são avaliação por leitura de código, não prova de performance nem resultados de playtest humano.

### PROPOSTAS — 15 NOVAS ALTERNATIVAS (UMA POR PAR; NÃO IMPLEMENTADAS)

Blood + Decay — Carrion Detonation: quando Bleed e Rot coexistem, consumir parte de ambas as cargas para uma explosão limitada; trocar DPS contínuo por burst, cooldown e teto por boss.

Blood + Vitality — Crimson Pact: com HP suficiente, sacrificar pequena parcela de vida para amplificar os próximos ticks de Bleed, com segurança contra autodestruição; trade-off ofensivo.

Blood + Aegis — Sanguine Reprisal: absorver dano com Block/Barrier prepara o próximo golpe para causar Bleed reforçado; não se autoalimenta de Barrier.

Blood + Fury — Reaper's Cadence: crítico em inimigo sangrando abaixo de um limiar prepara uma curta janela de golpes acelerados; cooldown, sem hits recursivos.

Blood + Magic — Hemal Sigil: um cast elemental consome quantidade limitada de Bleed e converte-a num efeito específico (Fire mais Burn, Frost mais controlo, Lightning mais charge/burst), com cooldown.

Decay + Vitality — Rot Symbiosis: Rot expira naturalmente e concede pequena recuperação limitada de HP; não depende de kills e não acumula heal indefinidamente.

Decay + Aegis — Rot Husk: quando Barrier quebra, consumir cargas de Rot do inimigo para amortecer o próximo golpe; uma ativação por janela limitada.

Decay + Fury — Venom Shatter: crítico num inimigo com várias cargas de Rot consome parte delas e causa burst; alternativa ao proc adicional passivo de Toxic Precision.

Decay + Magic — Elemental Blight: conversão controlada de Rot segundo Fire (acelera ticks), Frost (estende duração) ou Lightning (consome Rot para burst); sem procs em cascata.

Vitality + Aegis — Guardian's Oath: quando Barrier rompe, converte parte da defesa guardada em cura limitada uma vez por Wave; evitar regeneração circular com Sanctuary.

Vitality + Fury — Redline: estando acima de um patamar de HP, gasta uma parcela pequena de vida para potenciar uma sequência curta de ataques; janela clara de risco e recompensa.

Vitality + Magic — Lifeweave: com Mana baixa, converte HP em Mana de modo limitado e com cooldown, sem poder deixar o jogador a 0 HP; viável também para arma física com Magic.

Aegis + Fury — Iron Reversal: após Block, consome uma carga defensiva para potenciar o golpe seguinte, mas reduz temporariamente a probabilidade de Block; trade-off tático.

Aegis + Magic — Prismatic Rebound: dano absorvido por Barrier carrega o próximo cast elemental com um rebote finito; sem conversão infinita de dano e defesa.

Fury + Magic — Spell Surge: críticos carregam gradualmente o próximo cast elemental, sem exigir uma arma específica; o cast consome cargas e não ativa novas cargas por si.

PRIORIDADE DE PROTÓTIPO: Carrion Detonation, Hemal Sigil, Elemental Blight, Lifeweave, Iron Reversal, Prismatic Rebound. São seis mecânicas bastante diferentes para A/B comparativo; as outras nove ficam como backlog candidato. Antes de as ativar, decidir os reworks dos cinco híbridos problemáticos (Hemovore, Rot Recovery, Blood Ward/Rot Ward, Life Conduit e Spellblade).

### CRITÉRIOS DE ACEITAÇÃO E TESTES

- Duas famílias necessárias; até 3 famílias totais e máximo um híbrido POR PAR; até 3 híbridos numa Expedition com 3 famílias; seleção protegida contra reroll, refresh, save e exploits.

- Um híbrido deve ter trigger percetível, feedback visual/Combat Log e impacto mensurável. Pelo menos uma desvantagem/trade-off ou transformação, não apenas +X% de stat.

- Validar sete armas, três tipos de armadura, Fire/Frost/Lightning, HP/Mana, cooldowns contínuos por Expedition, bosses e Elites, e inexistência de damage/heal/mana recursivos.

- Instrumentar oportunidades, oferta/seleção por par, posição do Realm, frequência real do trigger, dano/cura/Barrier/Mana atribuídos, vitória, duração e replays com seeds iguais.

- A/B: atual 15 híbridos vs 6 novos prioritários + reworks; avaliar original 3-of-N drafts contra modelo de oportunidades tardias; nenhuma decisão por win rate isolado — recolher feedback humano sobre preferência/replay.

### SUGESTÕES COMPLEMENTARES — ADIADAS ATÉ FECHAR OS HÍBRIDOS

Passivos base: Blood precisa de interação que gaste Bleed; Decay de opção útil contra inimigos sem cura (Withering Hex é situacional); Vitality exige vigiar sustain sobreposto; Aegis necessita converter Block/Barrier em oportunidade ofensiva; Fury deve trocar parte de velocidade/crítico por janelas táticas; Magic pode receber um passivo adicional por escola, não uma sétima affinity.

Armas/armaduras: testar diferenças reais entre Staff/Wand e armas físicas com Magic; assegurar que Cloth/Leather/Plate alteram escolhas de build, incluindo Evasion Leather vs ataques mágicos que não podem ser esquivados.

Realms: manter 3 cartões; experiência A/B Safe/Hunt/Corrupted com risco/recompensa real e sem acrescentar automaticamente mais opções no mobile.

ESTADO: propostas adicionadas ao mesmo backlog, NÃO IMPLEMENTADAS. Não alterar código, main, cloud/Firebase, deploy ou saves reais até uma tarefa de execução aprovada.

## BACKLOG — 17 | RARIDADES, SINERGIAS DE ITENS E EVENTOS DE EXPEDITION (20/10/2026)

ESTADO: HIPÓTESES PARA PROTÓTIPO E TESTES, NÃO APROVADAS PARA IMPLEMENTAÇÃO.

INTENÇÃO: preservar a simplicidade do equipamento sem regressar a affinities fixas ou set bonuses do gear; deixar o buildcraft complexo principalmente nos passivos temporários. Concluir primeiro a revisão dos passivos/híbridos já em curso.

### EQ-001 — Épicos e lendários com identidade funcional [IDEIA A TESTAR]

• Common/Uncommon/Rare: base de stats e progressão legível, sem obrigar à leitura de habilidades adicionais.

• Epic: testar um modificador simples e específico de uma mecânica (ex.: maior duração de DoT, interação discreta com Block/Barrier, Mana ou críticos), com valor mesmo fora da affinity ideal.

• Legendary: testar habilidade única/transformadora com trigger, cooldown/limite e visualização clara; sinergia opcional com passivos de Expedition, nunca dependência obrigatória de uma só affinity.

• Evitar multiplicadores cumulativos sem limite, loops de dano/cura, benefícios ativados pelo próprio proc e dominância universal de uma arma. Validar os efeitos Legendary antigos antes de mapear habilidades para novos passivos.

• Não voltar a atribuir affinity fixa, set bonus ou categoria 'item híbrido' nesta proposta. Manter raridade, patamar E#, subtipos de arma e Cloth/Leather/Plate independentes.

### EQ-002 — Matriz de testes [IDEIA A TESTAR]

• Comparar Epic sem efeito vs Epic com modificador; Legendary antigo vs efeito modernizado; sinergia ideal vs sem a affinity correspondente. Testar diferentes armas/armaduras, E1/E20/E80/E200, com seeds comuns.

• Medir taxa de vitória, tempo, variedade de escolhas de gear e builds, frequência de trigger e concentração de equipamento vencedor. Os itens não devem ficar inúteis sem os passivos ideais nem obrigatórios com eles.

### EXP-001 — Variar ritmo dos 15 Realms sem alongar a sessão [IDEIA A TESTAR]

• Manter 15 Realms provisoriamente. Não adicionar eventos como Realms adicionais: substituir uma parte dos encontros comuns por eventos mais curtos e decisões de risco/recompensa.

• Traveling Merchant: evento excepcional de Expedition, separado do Merchant permanente (que continua bloqueado durante a run); disponibilizar consumíveis, trocas de loot recolhido nesta Expedition ou ofertas temporárias, sem acesso à Stash, Forge nem contas externas.

• Outros candidatos: Shrine (sacrificar HP/loot por uma melhoria), Rest Site (recuperar recursos à custa de outra recompensa), Cursed Altar (mais risco por loot/passivo) e Treasure/Choice Room (troca de uma recompensa por outra). Não assegurar cura grátis.

• Os eventos devem usar regras de persistência/derrota da bag: morrer perde todo o loot novo, mas nunca o equipamento pré-Expedition. Evitar duplication/extraction exploits; custos e prémios carecem de simulação.

### EXP-002 — Híbridos e duração [ALINHADO COM BACKLOG 16]

• O limite de até 3 híbridos por Expedition (um por cada par das 3 famílias) já está previsto. Não adicionar automaticamente mais passivos/híbridos além do plano de teste do Backlog 16; validar primeiro se a frequência e a força das escolhas melhora os últimos Realms.

• A/B após estabilizar passivos: A) 15 Realms só combates; B) 15 Realms com 2–3 eventos a substituir combates; C) eventualmente 12 Realms mantendo milestones reescalados. Mesma progressão, recompensa e build target para comparação.

• Medir tempo efetivo da run (alvo exploratório 15–30 min), minuto/Realm onde surge repetição, qualidade percebida das decisões, boss completion, loot conservado e vontade de repetir.

ESTADO FINAL: apenas backlog/documentação. Sem alterações de código, gameplay em produção, branches, Firestore, deploy ou saves reais.

## BACKLOG — 18 | RESULTADOS DOS TESTES DE HÍBRIDOS E PROGRESSÃO DAS REALMS (20/10/2026)

ESTADO: testes isolados executados; propostas de gameplay NÃO IMPLEMENTADAS nem aprovadas para deploy. Código existente lido na branch development: combat/v012-buildcraft.js (blob 449877900ae56385542552baa06d6f20fc02d272) e online/v012-expedition-controller.js. Não alterado repositório, main, Firebase, Railway, produção ou saves.

### A. TESTES DIRETOS SOBRE O MÓDULO REAL

Confirmação funcional de Spellblade: onCast prepara o bónus, dez ataques mágicos consecutivos não consomem a carga; um ataque físico consome-a. No combate integrado, Staff/Wand fazem casts financiados com Mana, portanto o efeito perde utilidade nessas armas enquanto continuam a lançar feitiços. PRIORIDADE ALTA de correção futura e testes por subtipo antes de balancear Spell Surge.

Life Conduit: onSecond consegue ativar +2 Mana quando ocorre cura real pelo helper, sujeito a cooldown 3s; precisa de medir se o valor altera número de casts em combates e utilização de poções.

Os 15 híbridos atuais foram inspecionados diretamente e executados através do módulo; os seis conceitos novos são HOOKS DE SIMULAÇÃO, não código de gameplay.

### B. ENSAIO FIXO DE COMBATE — 15 ATUAIS VS BASE E 6 PROTÓTIPOS VS BASE

Método: executar funções reais do catálogo/onAttack/onCast/onSecond/onDefend/onKill com um modelo sintético de ataques, impactos, DOT, Block, Barrier, Mana e cura; 36s de confronto com alvo de HP muito alto; aplicar onKill artificial após o confronto nos participantes sobreviventes. 7 subtipos de arma × 3 armor types × 3 elementos de Magic × 32 seeds = 2016 observações por variante. Mesmo equipamento/cenário/seed no baseline e no híbrido; builds contêm dois passivos base por família. Os protótipos usam valores apenas exploratórios. DPS, taxa de sobrevivência e penalizações são propriedades deste harness, NÃO taxas de vitória reais, E20/E80, nem prova de diversão. O controlo Frost está subavaliado porque o harness não inclui por completo o efeito da lentidão na temporização dos ataques inimigos.

HÍBRIDOS ATUAIS, variação relativa ao baseline:

Plague Rupture +1,21% dano; Blood Ward +22,54 HP restantes e +2,62% dano indireto por sobrevivência; Hemovore +4,68 HP (kill artificial);

Crimson Rush +1,55% dano; Hex Bleed +5,59% dano; Rot Recovery +5,42 HP (kill artificial);

Rot Ward +20,85 HP e +2,41% dano indireto por sobrevivência; Toxic Precision +8,02% dano; Hex Bolt +2,34% dano;

Sanctuary +17,99 HP; Fervent Life +14,34 HP; Life Conduit +2,07% dano por Mana adicional;

Counterstrike +0,75% dano; Runic Shield +41,76 HP e +3,84% dano indireto por sobreviver; Spellblade +3,61% dano agregado (mas possui limitação Staff/Wand confirmada).

Interpretação: manter Toxic Precision, Hex Bleed, Sanctuary e Runic Shield; não retirar Blood Ward/Rot Ward sem substituir utilidade defensiva. Diferenciar Hemovore/Rot Recovery (demasiado parecidos). Corrigir Spellblade. Rever triggers e impacto de Plague Rupture, Crimson Rush, Counterstrike e Hex Bolt.

SEIS PROTÓTIPOS exploratórios vs baseline:

Carrion Detonation: −0,72% dano; ~2,97 ativações por confronto. Valores iniciais consomem mais Bleed/Rot do que o burst compensa. REAJUSTAR, NÃO APROVAR.

Hemal Sigil: −0,15% dano; ~3,79 ativações. Fire/Frost/Lightning têm componentes distintos; DPS insuficiente e controlo Frost não totalmente medido. REAJUSTAR, NÃO APROVAR.

Elemental Blight: +1,04% dano; ~3,78 ativações, contra Hex Bolt atual +2,34%. REFINAR, especialmente Frost e trade-off de consumir Rot.

Lifeweave: +2,25% dano, −6,18 HP final e ~0,75 ativações médias (gasto de 7,84 HP) contra Life Conduit +2,07% dano. PROMISSOR PELO TRADE-OFF; verificar Mana baixa por subtipo e limite anti-morte.

Iron Reversal: +1,23% dano, −0,26 HP, ~1,45 ativações contra Counterstrike +0,75% dano. PROMISSOR; testar chance de Block real com Shield/Plate/Leather, penalização de Block e interface.

Prismatic Rebound: +0,55% dano, ~5,84 ativações, contra Runic Shield atual +41,76 HP. NÃO SUBSTITUIR DIRETAMENTE: só dá conversão ofensiva e perde uma defesa muito valiosa; reformular ou disponibilizar como alternativa claramente orientada para DPS.

Stress preliminar de 3 Waves (1512 observações por variante) produziu pouquíssimas vitórias na maioria das famílias: condições sintéticas demasiado punitivas para concluir balanceamento. Não utilizar win rates desse stress como decisão de design.

A interpretação de diferenças de dano em híbridos defensivos deve considerar sobrevivência adicional: NÃO são multiplicadores de DPS próprios.

### C. TESTE DE ESCOLHAS DAS REALMS — CONTROLADOR REAL E DRAFT REIMPLEMENTADO

Modelo usa controller real para 15 Realms e seleção de famílias. Reimplementa a seleção de 3 passivos com o algoritmo atual, mas acrescenta conceptualmente 15 alternativas (total 30 híbridos/63 passivos) e bloqueio de alternativas após escolher 1 híbrido do mesmo par. Todos os percursos são ASSUMIDOS VITORIOSOS (não simulam combate). Duas políticas: escolhas totalmente aleatórias e preferência por obter 3 famílias/selecionar híbridos. N=10 000 Expeditions completas por modelo/política.

15 híbridos atuais: random média 1,841 híbridos e 20,7% das runs com 3; prioridade híbrida média 2,839, 85,3% com 3.

30 híbridos, 1 por par, sem atrasar slots: random média 2,402 e 50,3% com 3; prioridade híbrida média 2,924 e 93,0% com 3.

30 híbridos, 1 por par, desbloqueios após Realms 6/9/12: random média 2,054, 26,7% com 3; prioridade híbrida média 2,587, 63,3% com 3. A oportunidade do terceiro híbrido fica demasiado tardia.

Teste adicional com 7 000 runs completas por ritmo e política:

6/9/12 (normal): 26,6% random e 62,6% prioridade híbrida com 3; média 2,05/2,59 híbridos.

6/8/10 (normal): 33,9% random e 75,7% prioridade com 3; média 2,14/2,73.

5/8/10 (normal): 35,9% random e 76,3% prioridade com 3; média 2,18/2,74.

6/9/12 (forçar pelo menos 1 híbrido apresentado QUANDO elegível no draft): 28,5% random e 66,6% prioridade com 3.

6/8/10 (forçar 1 opção híbrida QUANDO elegível no draft): 36,7% random e 80,6% prioridade com 3; média 2,19/2,78; terceiro híbrido escolhido em média após Realm 11,6 entre quem consegue 3.

RECOMENDAÇÃO: testar em ambiente real o ritmo 6/8/10, com opção híbrida garantida no trio apenas se elegível (não obrigar o jogador a escolhê-la). O cap de 3 affinities mantém-se, máximo 1 híbrido por PAR, máximo 3 híbridos no total. Permitir permanecer com 0, 1 ou 2 híbridos sem penalidade; nunca dar perks extra gratuitamente. A referência '6/8/10' diz respeito ao passivo atribuído após completar essas Realms. Na Realm 15 não existe draft pós-boss.

A modelação de ofertas das 30 opções é hipotética e precisa de testes reais do selector e save validator para não gerar escolhas inválidas, erros no refresh ou exploits. Mais opções podem deslocar passivos normais do trio.

### D. DECISÕES PROVISÓRIAS E PRÓXIMA FASE DE QA

MANTER sem mexer inicialmente: Toxic Precision, Hex Bleed, Sanctuary e Runic Shield.

CORRIGIR antes de comparar builds: Spellblade Staff/Wand (carga deve ser consumível sem proc imediato/recursivo); medir Life Conduit e diferença entre Blood Ward/Rot Ward e Hemovore/Rot Recovery.

REAJUSTAR em sandbox isolada: Carrion Detonation, Hemal Sigil, Elemental Blight e Prismatic Rebound. Protótipos promissores: Lifeweave e Iron Reversal, ambos condicionados a testes de risco.

Realizar simulações no motor integrado index.html e regressões por 7 armas × Cloth/Leather/Plate × Fire/Frost/Lightning com equipamento sintético, 3 níveis E1/E20/E80 (ou progressão aplicável), seeds fixas e testes de preservação de saves; validar scores de dano vs cura/Barrier/Mana, procs e fun com jogadores humanos.

Não usar este relatório para publicar alterações, ajustar números definitivos ou afirmar que a v0.12 está equilibrada. Fazer uma decisão de prototipagem e testes de integração antes de implementar no gameplay.

## BACKLOG — 19 | CLASSES E RESTRIÇÕES DE EQUIPAMENTO (20/10/2026)

ESTADO: HIPÓTESE EXPLORATÓRIA; NÃO IMPLEMENTAR SEM PROTÓTIPOS E TESTES.

Questão de design: restringir equipamento conforme classe escolhida, com acesso a apenas um tipo de armadura (Cloth/Leather/Plate) e a uma ou poucas categorias de armas. Investigar duas variantes: A) hard lock de exatamente 1 tipo de arma + 1 tipo de armadura; B) 2–3 armas permitidas + 1 armadura.

Benefícios potenciais: identidade visível de cada classe, funções mais distintas de armas/armaduras, identidade clara para épicos/lendários, facilidade de encontrar sinergias reconhecíveis e incentivo a outras personagens.

Riscos potenciais: menos variedade de buildcraft por run, passivos e híbridos dominantes por classe, drops inutilizáveis (sobretudo se não puderem passar para outra personagem), desigualdade de opções de armas, mais esforço para equilibrar várias classes e impacto na progressão/perfis existentes.

Exemplos APENAS exploratórios: Warrior = Plate + Sword/Mace/Two-Handed; Rogue = Leather + Daggers/Bow; Mage = Cloth + Staff/Wand. Nomes/classes finais não definidos; não criar classe nova automaticamente nem pressupor que essas combinações são legais no motor atual.

Os passivos de 6 famílias devem continuar acessíveis e capazes de transformar a build; classe não pode automaticamente fixar afinidade nem bloquear híbridos, salvo uma decisão posterior baseada em testes.

Testes A/B: livre (atual) vs classe com 1 arma vs classe com 2–3 armas, 1 armor type em ambas as variantes restritas. Comparar 7 armas × 3 categorias de armadura onde elegíveis, Epic/Legendary com/sem sinergia, 6 famílias e híbridos, E1/E20/E80/E200 quando viável.

Métricas: número de builds competitivas por classe, escolhas de gear e passivos, proporção de loot imediatamente útil, repetição de builds ao fim de 5 runs, duração, risco, vitória, diversão percebida, atratividade de classes alternativas e complexidade de onboarding.

Decisões antes de avançar: como escolher/mudar classe, número de personagens por conta, partilha/armazenamento de loot, tratamento dos itens já existentes e compatibilidade de saves. Não quebrar saves nem converter equipamentos sem aprovação.

RECOMENDAÇÃO PROVISÓRIA: preservar protótipo sem classes como controlo e começar pelo modelo flexível (1 tipo de armadura + 2–3 categorias de arma), em vez de impor só uma arma. Testar com perfis sintéticos e playtests antes de adicionar sistema permanente de classes.

Sem alterações ao código, gameplay, development/main, Firestore, deploy ou saves reais.

## BACKLOG — 20 | TESTE COMPARATIVO DE RITMO DAS EXPEDITIONS — A/B/C (20/10/2026)

### OBJETIVO

Comparar três variantes do Wanderer v0.12 sob equipamento, patamar, dificuldade, progressão de passivos e valores esperados de recompensa equivalentes. A: 15 Realms, todas com combates. B: 15 Realms, mas 2 ou 3 encontros comuns convertidos em eventos verdadeiros. C: 12 Realms, sem combates extra, com distribuição reajustada de passivos e híbridos. Medir duração REAL de sessão, diversão percebida, decisões que fizeram diferença e vontade de começar outra Expedition. A estrutura é hipótese de protótipo, NÃO IMPLEMENTADA.

### FACTOS DE PARTIDA

O controlador integrado v0.12 cria 15 Realms e garante boss na Realm 15; oferece 3 escolhas por Realm; cada encontro, mesmo se rotulado como event/chest/altar, ainda usa combate. Existem duas rooms 'event', duas 'chest' e uma 'altar' no baralho de rooms, mas as suas funções especiais permanecem informativas. O boss final não dá um draft de passivo. Assim, A/B têm 14 drafts pós-Realm + 1 passivo inicial; C com apenas 12 Realms teria 11 drafts + 1 inicial, exigindo mais 3 drafts para comparar a mesma build final.

### MONTE CARLO ESTRUTURAL — 20 000 EXPEDITIONS COMPLETAS

Foi executado o controlador REAL online/v012-expedition-controller.js com seeds e rotas aleatórias consistentes para gerar rooms, waves e elites. Nenhum combate foi jogado: todos os encontros foram assumidos vencidos. Para B, foram convertidas duas rooms 'event' e, na opção com 3, também uma 'altar', sempre preservando encontros que haviam recebido elite=true (substituindo, nesses casos, outro encontro comum). Para C, foram omitidas 3 Realms comuns, próximas das posições 4, 9 e 12, preservando todas as elites e o boss final. Esse comprimido de 12 Realms NÃO é suportado diretamente pelo controlador atual; é uma transformação simulada da sequência de 15.

A: 15 Realms, 15 encontros de combate, 32,037 Waves médias, 15 seleções de rota, 14 drafts normais e zero eventos.

B2: 15 Realms, 13 encontros de combate + 2 eventos, 28,025 Waves médias, 15 seleções de rota, 14 drafts normais e 2 decisões adicionais de evento.

B3: 15 Realms, 12 encontros de combate + 3 eventos, 26,011 Waves médias, 15 seleções de rota, 14 drafts normais e 3 decisões adicionais de evento.

C: 12 Realms, 12 encontros de combate, 26,048 Waves médias, 12 seleções de rota, 11 drafts normais + 3 drafts extras e nenhum evento.

Todos os modelos preservam em média ~5,402 encontros elite flagged e boss; B3 exige desviar em média 0,601 substituições de evento originais que tinham sorteado Elite, para não baixar o risco sem contabilizar.

CONCLUSÃO ESTRUTURAL: B3 e C têm virtualmente o mesmo número médio de Waves, mas B3 acrescenta três decisões de evento enquanto C tem três transições entre Realms a menos. B testa VARIEDADE; C testa COMPRESSÃO; A é controlo. 'Número de painéis de escolha' NÃO prova que houve decisões interessantes.

### RECOMPENSAS E DIFICULDADE COMPARÁVEIS

- Mesmo equipamento por subtipo/raridade/tier, mesma política de loot, boss/runa, 3 affinities máximas, até 3 híbridos, 2 potions de cada tipo quando aplicável e mesma regra de perda de loot novo ao morrer.

- Mesmo orçamento ESPERADO total de Gold, Fragments, raridade e número de itens e 15 passivos adquiridos (incluindo inicial), não garantias de igual resultado individual.

- B2 tem menos ~4,012 Waves; os 2 eventos devem substituir o orçamento esperado de recompensas de aproximadamente 12,5% das Waves originais. B3 perde ~6,026 Waves e os 3 eventos devem repor, em conjunto, aproximadamente 18,8% da recompensa esperada. Evitar converter a recompensa em bônus gratuitos sem risco, opção/custo e invariantes de save.

- C perde ~5,989 Waves, preservando o boss de 3 Waves. Se a compensação fosse feita APENAS nas Waves não-boss, corresponderia em média a cerca de +26% de recompensa por Wave regular comparada com A, mas é mais seguro distribuir uma parte por milestones/cache sem disparar risco de inflação, duplicação ou item grind. Preservar a distribuição de raridades e a garantia do boss.

- Eventos retiram atrição de HP/Mana; C também tira três encontros de desgaste. Igualar prémios não iguala desafio; testar sobrevivência/HP restante, potions, taxa de vitória, tempo no boss e perda de loot no motor integrado antes de decidir. Preservar Elites é necessário mas não suficiente.

### PROGRESSÃO TEMPORÁRIA COMPARÁVEL

A/B: 14 drafts após Realms 1–14, 1 passivo inicial; slots híbridos experimentais desbloqueados após Realms 6/8/10, máximo 1 híbrido por par de affinities, 3 no total.

C: 11 drafts após Realms 1–11 e 3 escolhas extra (após Realms 4, 8 e 10); total de 14 drafts + 1 passivo inicial; slots híbridos a partir das Realms 5/6/8; manter sempre três ofertas, com pelo menos uma híbrida se elegível, nunca obrigar a escolher híbrido. A Realm 12 termina com boss e sem novo draft posterior.

### TESTE DE DISTRIBUIÇÃO DE HÍBRIDOS (MODELO DE DRAFT, 10 000 RUNS POR CONDIÇÃO, 15 HÍBRIDOS EXISTENTES)

Modelo reimplementa oferta/eligibilidade de passivos a partir do catálogo real e seleção de 3 famílias do controlador, com teto de 1 híbrido por par e oferta híbrida garantida quando disponível; todos os percursos são completos.

A/B 15 Realms: escolha aleatória média 1,78 híbridos, 18,5% com 3; prioridade a híbridos média 2,78, 80,8% com 3.

C 12 Realms, três drafts compensatórios: escolha aleatória média 1,78 híbridos, 20,1% com 3; prioridade a híbridos média 2,73, 77,3% com 3.

Logo a compensação mantém aproximadamente o acesso e o total de passivos, mas NÃO demonstra paridade de poder/efeito temporal: passivos adquiridos antes podem multiplicar força e facilitar os bosses. Necessário testar no motor real e rever ritmo dos drafts extras.

### DURAÇÃO: DADOS HISTÓRICOS E SENSIBILIDADE (NÃO TEMPOS REAIS DE JOGADORES)

No relatório existente de validação das 792 Expeditions, 249 vitórias individuais da matriz de 504 casos registaram 66,3 segundos de 'combat seconds' em média para 32,55 Waves, ~2,04s por Wave. Isto é TEMPO SIMULADO PELO ENGINE, não tempo cronológico do utilizador nem inclui ler opções, inventário, transições, telefones, pausas.

Modelo meramente ilustrativo de tempo ativo, sem pausas nem gestão de equipamento adicional, com 2,04s/Wave do histórico:

perfil rápido (10s decidir rota, 12s passivo, 20s evento): A 6,4min; B2 6,9; B3 7,2; C 5,7.

perfil moderado (25s rota, 30s passivo, 40s evento): A 14,3min; B2 15,5; B3 16,1; C 12,9.

perfil reflexivo (45s rota, 50s passivo, 60s evento): A 24,0min; B2 25,9; B3 26,8; C 21,6.

Conclusão: B pode ser MAIS LONGO apesar de conter menos combates; o valor está em interromper monotonia. C tende a encurtar a Expedition por eliminar três transições. Nenhum valor é uma previsão fiável antes de cronometrar a UI real.

### DESENHO DOS TRÊS EVENTOS PARA O PROTÓTIPO B3

1) Traveling Merchant temporário: pagar Gold para consumível/efeito transitório OU trocar loot de Expedition OU sair sem custo; sem Stash/Forge/Merchant permanente.

2) Cursed Altar: escolha de custo de HP ou recurso vs buff transitório potencialmente ofensivo/defensivo; não matar involuntariamente nem criar cura/mana sem limite.

3) Ruined Cache/Cursed Chest: escolher estabilidade/Gold versus item de maior risco/raridade no orçamento previsto, sem duplicação de loot nem garantir Legendary.

Exigir ao menos duas opções com trade-off real por evento, feedback de consequência e possibilidade de recusar. Nada adicionado ao jogo ainda.

### PLANO DE PLAYTEST HUMANO A/B/C (PENDENTE; NECESSÁRIO PARA CONCLUIR)

N inicial 12 jogadores voluntários, 3 Expeditions cada, variante A/B3/C em ordem contrabalançada. Usar as 6 ordens possíveis (ABC/ACB/BAC/BCA/CAB/CBA), 2 pessoas por ordem, manter instruções iguais; seeds parecidas, equipamento por raridade/tier idêntico, velocidade de combate igual, mesma condição de vitória/dificuldade e recompensas esperadas. Permitir alguns minutos de descanso e registar familiarity; controlar aprendizagem/ordem.

Cronometrar tempo total real (e tempo ativo), tempo por Realm, tempo a escolher passivos/equipamento, duração de combate, tempo no evento, interrupções, derrota/abandono/chegada ao boss; registar Gold/Fragments/loot, HP/Mana/potions, híbridos oferecidos e escolhidos.

Perguntas rápidas após cada Expedition (escala 1–5): 'Quanto te divertiste?', 'Quantas escolhas te fizeram alterar o teu plano?', 'Quanta repetição sentiste?', 'Qual foi a escolha mais importante e porquê?', 'Queres começar outra Expedition agora?' (1–5 e sim/não). Não contar prompts iguais como decisões relevantes sem um motivo concreto dado pelo jogador; registar decisões de fato condicionais. Comparar medianas por pessoa e comentários, segmentar concluiu/perdeu e não inferir significância forte a partir de 12 pessoas.

Critérios de escolha: preferir B apenas se eventos elevarem diversão e escolhas memoráveis sem alongar excessivamente ou trivializar dificuldade; preferir C se encurtar substancialmente sem reduzir expressão do buildcraft/replay; manter A se nem variedade nem compressão melhorarem vontade de repetir. Considerar resultado híbrido 12 Realms + 1–2 eventos apenas NUMA SEGUNDA RONDA, não confundir a comparação inicial.

### SEGURANÇA E ESTADO

Todos os números desta secção são testes de estrutura e tempo sintético, não testes humanos nem resultados de motor modificado. Código, main/development, Firebase, Railway, deploy e saves reais permanecem intocados. Validar protótipos isolados no motor index.html antes de publicar ou alterar dificuldade/recompensas.

## BACKLOG — 21 | PROPOSTA SUBSTITUÍDA — INTERPRETAÇÃO INCORRETA; VER BACKLOG 22 (20/10/2026)

### DECISÃO DE DESIGN DO UTILIZADOR

Escolhida a variante B para prototipagem da v0.12: 15 Realms por Expedition, com 12 encontros de combate e 3 encontros não-combate de evento. NÃO acrescentar etapas: os eventos SUBSTITUEM encontros comuns. Manter boss final na Realm 15, Elites em posições preservadas, 3 cartões de seleção por Realm, 3 affinities no máximo por Expedition, passivos temporários, híbridos e recompensas esperadas equivalentes aos combates substituídos. Implementação/deploy ainda NÃO AUTORIZADOS neste chat: documentar, prototipar e testar isoladamente primeiro.

A seguir, adicionar DUAS NOVAS LOCALIZAÇÕES/TEMÁTICAS DE REALM PARA CADA AFFINITY, ou seja, 12 novas variantes de cenário ao catálogo de Realms, NÃO 12 novas etapas jogáveis, nem duas garantidas em cada Expedition. Cada Realm tem affinity fixa, nome, imagem de fundo, inimigos e identidade de combate; mantém o mesmo sistema de seleções e os limites da Expedition.

### MAPA ATUAL VERIFICADO NO CÓDIGO development

Blood: 1 tema — Blood Forge (forge).

Decay: 2 — Venomous Temple (temple), Umbral Reliquary (void).

Vitality: 2 — Serpent Grove (grove), Lost Sanctuary (shrine).

Aegis: 3 — Warded Catacombs (ward), Drowned Vault (drowned), Obsidian Quarry (quarry).

Fury: 2 — Echo Crypt (crypt), Iron Bastion (bastion).

Magic: 3 — Frostbound Catacombs (frost), Ashen Sanctum (ash), Stormglass Spire (storm).

Total de 13 temas atuais; +2 em cada família cria 25 (Blood 3, Decay 4, Vitality 4, Aegis 5, Fury 4, Magic 5). O controlador sorteia PRIMEIRO a família/affinity e só depois um tema dentro dela; portanto, famílias com 5 cenários não têm de aparecer mais vezes que famílias com 3. Verificar isto nos testes após a integração.

### 12 NOVOS TEMAS — PROPOSTA DE DIREÇÃO CRIATIVA, NOMES PROVISÓRIOS

Blood A — Sanguine Chapel: capela de pedra negra, vitrais rubros e rituais de sangue; Blood Cantor; identidade de combate proposta: inimigos ganham uma janela limitada de lifesteal apenas após aplicar Bleed (teto e telegraph, nunca cura infinita).

Blood B — Butcher's Hollow: matadouro subterrâneo, correntes, aço manchado e braseiros; Crimson Butcher; identidade proposta: inimigos aumentam ligeiramente a velocidade abaixo de 35% HP; burst final com aviso visual.

Decay A — Pestilent Marsh: pântano verde-negro, névoa pútrida, ossadas e fungos; Mire Plaguebearer; identidade proposta: Poison/Rot moderado de desgaste com cooldown, contrajogo de proteção e limites de stacks.

Decay B — Funeral Gardens: jardim funerário tomado por raízes necrosadas e estátuas partidas; Grave Tender; identidade proposta: inimigo tenta curar-se em janelas telegráficas, oferecendo utilidade a Withering Hex sem o tornar obrigatório.

Vitality A — Thornbound Conservatory: estufa colossal em ruínas, árvores que envolvem pedra e vida selvagem; Thornkeeper; identidade proposta: regeneração limitada do adversário que para após receber dano significativo, incentivando decisões de burst.

Vitality B — Heartwood Depths: coração de uma floresta antiga, raízes luminosas e santuários ocultos; Heartroot Guardian; identidade proposta: escudo/recuperação de emergência única em limiar de HP, com aviso e cooldown.

Aegis A — Hall of Mirrors: cidadela subterrânea de cristal rachado e escudos refletivos; Mirror Sentinel; identidade proposta: Barrier forte de duração limitada; quebrá-la gera uma abertura ao dano, sem reflexão recursiva infinita.

Aegis B — Sunken Bastille: prisão-fortaleza alagada, portões corroídos e correntes; Bastille Warden; identidade proposta: inimigos usam Block em intervalos visíveis, mas ficam vulneráveis depois de um Block bem-sucedido.

Fury A — Berserker's Crucible: arena de ferro, chamas e estandartes rasgados; Ash Berserker; identidade proposta: janelas de dano elevado em troca de vulnerabilidade, telegraphed para evitar one-shots injustos.

Fury B — Ravager's Gauntlet: passagens de combate, estátuas quebradas e estacas; Rift Ravager; identidade proposta: a sequência de ataques acelera até limite baixo, reinicia depois de uma pausa, sem escalada permanente.

Magic A — Aether Observatory: observatório astral com geometria arcana e cometas, sem reutilizar a identidade visual da Stormglass Spire; Aether Astrologer; identidade proposta: alternar ciclos de Fire/Frost/Lightning apenas como ataque inimigo, sem criar uma affinity de jogador.

Magic B — Spellscar Archive: biblioteca proibida de pergaminhos flutuantes, runas quebradas e fissuras mágicas; Spellscar Archivist; identidade proposta: perturbação temporária e limitada de Mana/tempo de cast com contrajogo e sem bloquear builds físicas com Magic.

### REGRAS DE DESENHO PARA OS NOVOS TEMAS

- O tema é conteúdo/variedade, não uma nova affinity nem um passivo ganho automaticamente. Evitar set bonuses e item affinities antigos deliberadamente desativados na v0.12.

- Priorizar 12 fundos diferentes, dois inimigos por pool apenas como objetivo futuro; para teste estrutural reutilizar assets temporários sem publicar placeholders como arte final. Não exigir novos sistemas de combate exclusivos para todas as 12 temáticas de uma vez: as identidades descritas são propostas a testar.

- Respeitar três opções de Realm e rerolls, raridades, Elite/boss, funções THEMES em index.html, MOB_POOLS, THEME_FAMILIES do controlador, geração de loot, nomes/imagens, render responsivo e validação restore/save. IDs imutáveis e únicos; nenhuma alteração que corrompa histórico ou saves legados.

- É possível repetir a MESMA affinity na mesma Expedition, mas controlar repetição consecutiva da MESMA localização e inimigo sempre que existirem alternativas. Dar variedade sem alterar enviesamento de chance das famílias oferecidas ou perder afinidade esperada da rota.

- Proteger balance de Elites e bosses: evitar dano súbito injusto, multiplicadores infinitos de DOT/regeneração/Barrier, e qualquer vantagem universal obrigatória para uma única arma/armor type.

### VARIANTE B — EVENTOS DEFINIDOS PARA PROTÓTIPO

1. Traveling Merchant itinerante (recompensas temporárias, trocas/custos usando apenas loot da Expedition e recursos permitidos), nunca acesso ao Merchant/Forge/Stash permanentes no meio da run.

2. Cursed Altar (troca de HP/recurso por vantagem temporária limitada; opção de recusar, sem morte involuntária).

3. Ruined Cache / Cursed Chest (decisão entre recompensa segura e opção arriscada, orçamento igualado ao encontro de combate substituído).

Um evento deve ocorrer em janela relativamente inicial/intermédia, outro a meio e outro perto do final (antes do boss), sem alterar a Realm 1 nem a Realm 15 e sem substituir Elite. Posicionamentos propostos ~4–6 / 8–10 / 11–13; não fixar rigidamente antes do teste. Todos os eventos devem oferecer decisões relevantes com consequências claras, tempo medido, e respeitar perda do novo loot em caso de derrota.

### NOTA TÉCNICA IMPORTANTE

O controlador atual marca rooms event/chest/altar mas ainda executa combates; a lista de rooms tem 2 event + 2 chest + 1 altar. Para B verdadeira, NÃO basta renomear os cartões: é preciso garantir que há exatamente 3 eventos não-combate substitutivos por Expedition, com boss/Elites preservados, adaptando o scheduler e o motor integrado; as outras rooms marcadas mas não escolhidas como evento seguem combate normal até existir definição explícita. É necessário garantir recompensas Gold/Fragments/loot equivalentes e medir HP/Mana, sobrevida e duração real.

### VALIDAÇÃO PEDIDA ANTES DE IMPLEMENTAÇÃO

- Repetir simulação no motor index.html com 25 themes elegíveis, 15 etapas por run, 3 eventos e 12 combates, boss no fim, 3 famílias máximas e nenhum tema/ID inválido.

- Distribuição estatística: 6 famílias sem bias devido à quantidade diferente de temas; repetir nomes o mínimo razoável sem alterar escolha de affinity; testar performance mobile e imagens.

- Recompensas equivalentes e risco comparável A vs B: vitória, HP/Mana, duração de evento, número de ondas, Gold/Fragments, raridade, loot e passivos/híbridos com seeds idênticas.

- Playtest humano da B escolhida: diversão 1–5, monotonia, escolhas com impacto demonstrável, duração ativa, vontade de repetir 1–5. A é controlo interno, C fica arquivada como hipótese de compressão se B se revelar longa demais.

ESTADO: decisão de design registada no documento permanente; 12 novos cenários e B com 3 eventos não foram implementados no código, main/development, Firebase, Railway, cloud, assets ou saves.

## BACKLOG — 22 | CORREÇÃO: 2 REALMS POR AFFINITY E EVENTOS MAIS VARIADOS — 20/10/2026

### DECISÃO DO UTILIZADOR (ESTA SECÇÃO SUBSTITUI O BACKLOG 21)

São exatamente 2 Realms temáticos por affinity, NÃO adicionar 2 a cada uma. Resultado: 6 affinities × 2 = 12 cenários temáticos no catálogo. A Expedition continua com 15 etapas, 3–4 das quais são eventos não-combate escolhidos de uma biblioteca maior. Não confundir 12 cenários de fundo com 12 etapas por Expedition. Manter versão B: boss na etapa 15, as restantes 11–12 etapas com combate, elites preservados, 3 opções por Realm, máximo 3 affinities e buildcraft temporário.

### NOMES PROPOSTOS, DOIS TEMAS POR AFFINITY

Blood: Crimson Dominion (renomear Blood Forge, id forge), Bloodscar Wastes (novo cenário Blood, id bloodscar, novo ambiente a preparar).

Decay: Venomreach (renomear Venomous Temple, id temple), Umbral Hollow (renomear Umbral Reliquary, id void).

Vitality: Verdant Wilds (renomear Serpent Grove, id grove), Everroot Vale (renomear Lost Sanctuary, id shrine).

Aegis: Warded Marches (renomear Warded Catacombs, id ward), Drowned Bastion (renomear Drowned Vault, id drowned).

Fury: Gravewind Barrens (renomear Echo Crypt, id crypt), Ironbound Frontier (renomear Iron Bastion, id bastion).

Magic: Ashen Aether (renomear Ashen Sanctum, id ash), Stormglass Beyond (renomear Stormglass Spire, id storm).

Dois dos 13 temas anteriores deixam de estar no catálogo jogável: Obsidian Quarry (id quarry, Aegis) e Frostbound Catacombs (id frost, Magic). Preservar assets, IDs, referências legadas e histórico; reutilizar fundos/mobs para eventos. Novo Bloodscar Wastes requer arte própria no final (possível placeholder visual temporário em testes). Magic mantém Fire, Frost e Lightning como elementos, sem obrigação de um Realm exclusivo por elemento. Mantêm-se os IDs dos outros 11 temas para segurança dos saves.

### DIVERSIDADE DOS REALMS

Sortear primeiro uma das affinities elegíveis, depois 1 dos 2 cenários dela, sem favorecer famílias com mais imagens. Evitar repetir o mesmo cenário em duas seleções consecutivas da mesma affinity; uma seleção totalmente aleatória entre dois fundos repete-se ~50% das vezes nessa situação. Não impedir o jogador de regressar à affinity escolhida. Verificar textos, loot, cenários, monstros, save/restore e render em mobile.

### BIBLIOTECA DE 12 EVENTOS — SÓ 3 OU 4 APARECEM POR EXPEDITION

#### Comércio (3):

E01 Traveling Merchant — gastar Gold em provisão/buff temporário ou recusar; nunca entrar no Merchant permanente.

E02 Smuggler's Caravan — trocar Fragments por consumíveis limitados ou guardar os recursos.

E03 Relic Collector — trocar uma peça de loot da bag por materiais ou uma oferta alternativa com raridade justa.

#### Sacrifício/maldição (3):

E04 Cursed Altar — pagar HP por vantagem limitada, podendo recusar sem penalidade.

E05 Soul Mirror — trocar sobrevivência por poder ofensivo temporário ou vice-versa, sem ciclos de benefícios.

E06 Whispering Idol — escolher bênção temporária com penalização visível ou alternativa mais segura.

#### Tesouro/recompensa (3):

E07 Cursed Chest — recompensa garantida modesta OU aposta com prémio melhor e risco indicado.

E08 Forgotten Arsenal — escolher entre tipos de equipamento ou materiais, usando o orçamento de loot esperado.

E09 Runic Vault — infusão de Rune TEMPORÁRIA, sem criar runas permanentes fora do boss, ou recolher materiais.

#### Recuperação/estratégia (3):

E10 Restless Spring — escolher regenerar HP, Mana ou levar recursos; sem cura ilimitada.

E11 Fallen Wanderer — ajudar por custo limitado e receber proteção ou obter provisões menos arriscadas.

E12 Oracle of Paths — conhecer o perigo de futuros encontros e ponderar mudar próximo risco/recompensa com custo; não alterar save/progressão de forma insegura.

### SORTEIO/REPETIÇÃO

Tirar 3 ou 4 eventos diferentes da biblioteca por Expedition, idealmente um de cada categoria sorteada: com 3, sortear 3 das 4 categorias; com 4, usar as 4. Dentro de cada categoria sortear 1 dos 3 eventos, sem repetir no mesmo percurso. Assim a presença de Merchant, altar ou chest específicos não é garantida, mesmo que as categorias sejam conhecidas. Eventos com identidades e trade-offs realmente distintos, não apenas três skins para o mesmo prémio.

### AGENDA DE 15 ETAPAS

Reservar primeiro 3 ou 4 slots de evento entre as etapas 2–14, distribuídos pelo início/meio/fim (alvos indicativos: 3–5, 6–8, 9–11, 12–14). Depois agendar Elites obrigatórios e sorteios de Elite adicional exclusivamente nos slots de combate; nunca substituir Elite/boss por evento. O controlador v0.12 atual tem etiquetas event/chest/altar mas continua a executar combate nessas rooms, pelo que exige trabalho explícito futuro para implementar eventos reais.

Um ensaio estrutural externo de 25.000 sequências, se mantivermos o sorteio de Elite antes de reservar eventos, encontrou 4 sequências com menos de 4 slots comuns elegíveis; justifica reservar eventos antes de Elite. Garantir 11–12 Realms de combate, boss na 15 e 14 escolhas de passivos + o passivo inicial; eventos não dão drafts adicionais automaticamente.

### RECOMPENSAS, DURABILIDADE E TESTES

Conservar valor esperado de Gold/Fragments/itens/raridades da Expedition apesar dos combates substituídos. Ajustar attrition de HP/Mana; menos combate facilita progressão e não basta atribuir Gold igual. Opções significativas e rápidas em mobile, com possibilidade de recusar quando apropriado. Manter perda de loot novo por derrota, respeitar bag, não duplicar recompensas por refresh, não mexer em Rune permanente, Stash, Forge ou Merchant permanente dentro de eventos.

Testar 12 nomes únicos, 2 por família, 3–4 eventos únicos, boss final e elites, algoritmos de rota/reroll, recompensas e saves em development com perfis artificiais. Instrumentar tipo de evento e escolha, tempo ativo, decisões relevantes, diversidade e vontade de repetir; comparar com 15 combates de controlo.

ESTADO: SECÇÃO 22 DEFINITIVA PARA DESIGN; ainda NÃO implementar código, assets, main/development, Firebase, Railway, deploy ou saves reais sem autorização específica. A versão incorreta de 25 temas da secção 21 ficou marcada como substituída.

BACKLOG — 23 | INTEGRAÇÃO AUTORIZADA: AFFINITIES, 12 REALMS, EVENTOS E BAG 6/6 (20/10/2026)

STATUS: IMPLEMENTAÇÃO DE PRIMEIRA PASSAGEM EM development — QA EM CURSO, NÃO APROVADA PARA PUBLICAÇÃO.

O utilizador autorizou implementar gameplay na branch development: melhorar affinities, criar 2 Realms por affinity e reduzir a Bag da Expedition a 6 itens. Continua proibido modificar/mergear main, efetuar deploy/regras Firebase, sobrescrever saves de jogadores reais ou reintroduzir affinities/set bonuses permanentes removidos da v0.12.

O código de development já contém: 63 passivos temporários (30 híbridos, incluindo 15 novos), limite 3 híbridos e 1 por par, desbloqueio experimental após as Realms 6/8/10, correção Spellblade para Staff/Wand, custos e buffs limitados; 12 Realms ativos nomeados no Backlog 22, IDs antigos preservados, conteúdo Frost/Quarry arquivado para compatibilidade mas disponível no jogo clássico; novo Bloodscar com arte temporária reaproveitada; 15 etapas por Expedition, 3–4 eventos não-combate sorteados entre 12 propostas em 4 categorias com seleção distribuída por início/meio/fim; interface com opções e consequências; Bag de Expedition 9→6 sem descarte automático, overflow a resolver.

Ver implementação: https://github.com/Skinny-lfg/wanderer-game/blob/development/docs/v012-realms-events-bag-implementation.md

Ver branch: https://github.com/Skinny-lfg/wanderer-game/tree/development

Verificação estrutural: 2000 Expeditions completas no controlador real, 995 com 3 eventos e 1005 com 4; transições, boss, duas Elites garantidas e unlock verificados. Testes unitários focados de buildcraft/eventos/controller passaram na CI após correções de fixtures obsoletas.

NÃO CONCLUIR QUE ESTÁ TUDO PRONTO: npm test geral ainda falha em testes antigos de efeitos de sets/affinities de gear (desativados na v0.12), e a regressão histórica de Shatter possui falha anterior à presente implementação. Não modificar gameplay para restabelecer sets só para satisfazer expectativas desatualizadas. O audit de browser, progressão e economia foi pedido na CI com commit [audit] e os resultados ainda devem ser conferidos.

PONTOS PENDENTES: fundo definitivo Bloodscar e arte de eventos, equilíbrio real dos 15 híbridos novos, paridade das recompensas (eventos reduzem atrição), escolhas dos eventos mais elaboradas (Oracle, Relic Collector), browser mobile, exploração de save/refesh/duplicação, simulador do motor integrado e validação da experiência do jogador. A implementação deve ficar em development até ficar validada.

ATUALIZAÇÃO DE QA À SECÇÃO 23 — TESTE DE BROWSER (20/10/2026)

Foi adicionado e executado um teste Playwright isolado da Expedition real v0.12, passando em 390px e 1280px: 15 transições de Realm, eventos non-combat escolhidos e concluídos, até 14 passivos depois dos Realms, boss final e unlock, Bag 6/6 e sentinelas imutáveis dos saves clássicos/conta. Usa equipamento sintético de tier alto para abreviar combates — não demonstra justiça da progressão ou balanceamento de loot. Código: tests/v012-events-browser.cjs; CI de desenvolvimento commit c66bf7c2bdf58cd34166e678bd13b7af2c458fb0.

A auditoria geral continua bloqueada por regressões de suites antigas (por exemplo, testes de affinities e sets permanentes desativados na v0.12 e antigos browser checks). Não publicar em main; fazer calibração de itens/híbridos, testes reais do fluxo de eventos com saves isolados e playtest humano antes de declarar ready.

## BACKLOG — 24 | REDESENHO DOS EVENTOS: 16 CANDIDATOS, 3–4 POR EXPEDITION (20/10/2026)

ESTADO: PROPOSTAS DE GAME DESIGN — NÃO AUTORIZADAS PARA IMPLEMENTAÇÃO. A UI FICA PARA DEPOIS.

### OBJETIVO

No Wanderer v0.12, eventos devem criar decisões memoráveis ligadas ao buildcraft (seis affinities, máximo três, trinta híbridos), gestão da bag de 6 itens, saúde/mana e riscos futuros. Continuam somente 3–4 eventos por Expedition de 15 etapas, em substituição de combates comuns; boss na Realm 15 e Elites garantidos preservados. Os 12 eventos atuais em online/v012-events.js são uma primeira versão funcional, NÃO o design final. Proposta: melhorar os 12 e acrescentar até 4 eventos opcionais, fazendo catálogo máximo de 16, quatro categorias com quatro opções cada.

### CATÁLOGO PROPOSTO — COMÉRCIO E EQUIPAMENTO (4)

E01 Traveling Merchant (existente, melhorar): escolher comprar consumível de sobrevivência, comprar bónus temporário limitado ou guardar Gold. Custos visíveis. Não dar acesso à Forge/Merchant permanentes durante a Expedition.

E02 Smuggler's Caravan (existente, melhorar): trocar Fragments por preparação para o próximo combate (revelar risco, resistência limitada, consumível) ou preservar Fragments. Diferenciar de uma segunda loja de poções.

E03 Relic Collector (existente, melhorar substancialmente): jogador SELECIONA um item de loot da bag; trocar por tentativa de outro slot desejado com orçamento de raridade apropriado, ou desmontar por materiais. Resolver substituição atómica: item entregue sai realmente da bag; nunca duplica; se bag vazia, oferecer alternativa sem trade.

E13 Cursed Artificer (novo, opcional): consumir um item de loot recolhido nesta run para dar um pequeno reforço apenas até ao final da Expedition a OUTRO item equipado, sem alterar atributos permanentes no save de equipamento. Alternativa: desmontar o item por Fragments. Não restaurar affinities/set bonuses permanentes.

### CATÁLOGO PROPOSTO — SACRIFÍCIO E PASSIVOS (4)

E04 Cursed Altar (existente, melhorar): sacrificar cerca de 10–15% de HP máximo (valores APENAS PARA TESTE) para obter reforço ofensivo/defensivo por dois próximos combates; opção recusar. HP nunca pode ficar abaixo de 1, e não permitir converter HP em recurso infinito.

E05 Soul Mirror (existente, redesenhar): trocar UM passivo já selecionado por outro da MESMA affinity através de um draft de 2 opções elegíveis, pagando um custo. Não remover passivo inicial, não criar híbrido sem as famílias exigidas, não exceder limites e não alterar um passivo sem validação/save atómico.

E06 Whispering Idol (existente, redesenhar): aceitar maldição por DOIS combates futuros (+dano recebido limitado ou redução de defesa) em troca de prémio condicionando a vitória; ou rejeitar e receber pouco/nada. Não acumular a maldição sem teto.

E14 Echo Shrine (novo, opcional): aumentar o efeito de UM passivo temporário durante dois próximos combates, à custa de HP/recursos, sem mudar permanentemente o ranking guardado; respeitar máximos e não aplicar a passivos cuja duplicação gere loops infinitos. Mostrar claramente qual passivo será reforçado.

### CATÁLOGO PROPOSTO — TESOURO E RISCO (4)

E07 Cursed Chest (existente, melhorar): prêmio seguro modesto OU aposta com risco de perda de HP/penalidade temporária e probabilidade de equipamento melhor, com odds visíveis. RNG resolvido uma única vez e salvo atomicamente para bloquear refresh farming.

E08 Forgotten Arsenal (existente, melhorar): mostrar dois itens distintos (slots/estilos) e só permitir recolher um, OU preferir materiais; se bag 6/6, exigir que o jogador indique exatamente o que descartar ou equipar ANTES de finalizar. Nenhum drop extra inadvertido.

E09 Runic Vault (existente, melhorar): reforçar o efeito de uma Rune equipada durante dois combates sem tocar na Rune permanente, OU levar Fragments; oferecer substituto caso não tenha Rune. Nunca dar runa permanente fora do boss.

E15 Bounty Writ (novo, opcional): contrato opcional que fortalece o PRÓXIMO Elite ainda agendado (+15% dano como placeholder de teste) e aumenta o orçamento de recompensa só SE derrotado; caso não exista Elite futuro, não sortear ou transformar em escolha alternativa segura. Não gerar Elite extra nem saltar encontro.

### CATÁLOGO PROPOSTO — SOBREVIVÊNCIA E ROTA (4)

E10 Restless Spring (existente, melhorar): escolher recuperar HP, recuperar Mana ou obter recursos; nunca todas as três coisas. Se Mana não existir ou HP já estiver cheio, dar alternativa útil. Ajustar como oportunidade de evitar consumo de poção, sem se tornar cura gratuita universal.

E11 Fallen Wanderer (existente, melhorar): gastar uma provisão/recurso para ajudar um viajante e receber proteção durante os próximos combates, ou recolher provisões modestamente; efeito de escolha que se prolonga e pode influenciar sobrevivência.

E12 Oracle of Paths (existente, melhorar substancialmente): pré-visualizar os riscos da próxima oferta e poder influenciar UM dos três cartões seguintes dentro das affinities permitidas, com custo. NÃO alterar número de etapas, boss, eventos, Elites, rerolls normais ou teto de 3 famílias. Atualmente só revela a próxima room; precisa de mudança real de gameplay.

E16 Last Ember (novo, opcional): restaurar grande parte de HP/Mana em troca de um enfraquecimento de um passivo existente pelos próximos dois combates; alternativa recuperar menos por custo menor. Se não houver passivo elegível, não apresentar opção impossível. Nunca curar além do máximo.

### REGRAS DE FREQUÊNCIA E EQUILÍBRIO

- Sorteio máximo um evento de cada categoria por Expedition. Com 3 eventos usar 3 categorias distintas; com 4 usar todas. Escolher 1 dos 4 possíveis em cada categoria. Sem repetições dentro da mesma Expedition.

- No máximo um evento que reescreve passivos por run; evitar que dois eventos se somem e desmontem regras de híbridos. Benefícios temporários desaparecem na extração, abandono, morte e boss.

- Eventos nunca devem garantir recompensas de boss/Runes permanentes nem enfraquecer as escolhas de equipamento substituindo a bag por inventário infinito.

- Custos e consequências apresentados ANTES da decisão, indicar duração do buff/debuff como «próximos 2 combates», e descrever explicitamente odds RNG. Os valores propostos são referências de teste, NÃO configuração definitiva.

- «Recusar» um evento NÃO deveria render automaticamente o mesmo valor de Gold/Fragments que concluir um combate de duas Waves, como ocorre na primeira implementação: estudar uma pequena recompensa de passagem sem anular trade-offs, sempre considerando orçamento económico, HP/Mana e loot esperados.

- Garantir persistência atómica das escolhas (sem recurso duplicado ao atualizar separador), sem forçar a utilização de contas/saves reais nos testes. Testar com Magia sem Mana, bag cheia, sem loot e sem Elites futuros para evitar opções mortas.

### PRIORIDADES DE EXPERIMENTAÇÃO

P0: segurança e paridade de recompensas dos atuais 12; corrigir base gratuita por recusar e exploração por refresh, checar bag 6/6 e persistência.

P1: redesenhar primeiro Relic Collector, Soul Mirror, Cursed Altar, Cursed Chest e Oracle of Paths (maior valor estratégico).

P2: prototipar Echo Shrine e Bounty Writ antes de aumentar o catálogo a 16; só incluir Artificer e Last Ember caso sejam distintos no teste.

P3: testar 3–4 eventos por Expedition com 12 jogadores, tempo por evento, escolhas que alteraram o plano, monotonia, valor de recurso líquido, diversão e vontade de jogar outra run. UI/arte final depois.

ESTADO FINAL: propostas registadas neste documento, nenhum código/branch/Railway/Firebase/save alterado nesta conversa.

## BACKLOG — 25 | AUDITORIA DOS 63 PASSIVOS, HÍBRIDOS E REFORMULAÇÃO LIGHTNING/STATIC (20/10/2026)

ESTADO: ANÁLISE DE DESIGN E CÓDIGO, SEM IMPLEMENTAÇÃO. NÃO ALTERAR GAMEPLAY ANTES DE APROVAÇÃO.

### FONTE E MÉTODO

Código real de development: combat/v012-buildcraft.js (63 passivos: 33 normais, sendo 3 elementais, e 30 híbridos) + integração efetiva em index.html (weaponAttack, phase2WeaponAttack, phase2MagicTick, phase2Context, phase1StartWave, phase1WaveWon, updateFight). A suíte de testes isolados exercita cada passivo em condições preparadas para o ativar, mas isso NÃO demonstra frequência em gameplay ou diversão. Avaliação de diversão é subjetiva de design, escala 1 a 5 (1 = quase só números, 5 = decisão memorável); NÃO são votos de jogadores. Estados: OK (funciona), EXCELENTE (mecânica promissora), FRACO (valor/visibilidade baixos), CONDICIONAL (fácil não ativar), REPETIDO (duplica outra), NICHO (não é relevante na maioria dos combates), RISCO (precisa de prova matemática), TEXTO (tooltip incoerente), CRÍTICO (efeito tão raro que invalida o investimento).

### RAIZ DO PROBLEMA LIGHTNING — CONFIRMADO NO MOTOR

No onCast, Lightning soma e.v012Shock no INIMIGO até 4, dispara Burst ao quarto hit (com cooldown de 2s), reduz a 0; resetWave() elimina v012Shock antes de toda a Wave. Spellcasters Staff/Wand só contam casts financiados por Mana; outras armas com Magic usam phase2MagicTick a cada 2,5s se houver Mana. Waves curtas terminam antes dos 4 casts. Overcharge inicia com +20% dano só para este burst de baixa frequência. Ao contrário de Lightning, Arcane Echo usa runtime.magicHits do JOGADOR, que já persiste entre Waves.

### TESTE SINTÉTICO REPRODUZÍVEL DA FREQUÊNCIA (NÃO BALANCEAMENTO INTEGRADO)

12 000 Expeditions fictícias de 15 Waves, todas vencidas, 1–4 casts financiados por Wave, amostrados independentemente com 30% de 1, 42% de 2, 23% de 3, 5% de 4; média 2,03 casts/Wave. Chamadas reais onCast()/resetWave() para o Lightning presente; variantes hipotéticas com contador do JOGADOR persistente e limiar de descarga 3/4/5.

Shock atual: média 0,75 bursts/Expedition, 54,2% das Expeditions com pelo menos um burst, 9000 bursts no total das 12k runs.

Static de 3 cargas com persistência: 9,82 bursts/Expedition (117 800 no total); seria demasiado aumento se o dano por burst fosse mantido.

Static de 4 cargas: 7,24 bursts/Expedition; Static de 5 cargas: 5,69. Os números são frequência teórica em Waves sintéticas, não dano real, vitórias ou player retention.

### RECOMENDAÇÃO LIGHTNING (A TESTAR ISOLADAMENTE)

Criar buff 'Static' do jogador, não debuff do inimigo. Cada cast Lightning financiado por Mana concede 1 carga; não acumular sem custo a partir de ataques físicos, props de eventos ou procs extra. As cargas persistem entre Waves, Realms e eventos na MESMA Expedition, não persistem após morte/extração/vitória e não passam para outras runs. Prototipar limiar 4, sem expiração, descarga automática no alvo atual ao atingir 4 e consumo das 4 cargas. Reduzir dano base do burst de 65% Spell Power atual para intervalo experimental ~25–40% Spell Power para compensar maior frequência, preservando caps contra HP de boss e sinergia com Overcharge. Testar também 3 cargas com descarga ainda mais fraca; 5 caso seja demasiado forte. Se adicionar bónus passivo enquanto carrega (ex. 2% Spell Power por carga), moderar ainda mais a descarga e cap global; não dar Mana gratuita. O icon deve passar da linha de debuffs do INIMIGO para buffs do JOGADOR, mas redesign visual fica para a fase de UI.

### BASES POR FAMÍLIA — 33 PASSIVOS

#### BLOOD (5)

Bleeding Edge — OK, diversão 2/5. Passivo inicial, aplica Bleed mas pouco impactante em Waves curtas.

Deep Cuts — FRACO, 1/5. Multiplicador numérico de Bleed; quase nenhuma decisão.

Executioner — CONDICIONAL, 3/5. Bonus hit contra alvo com Bleed abaixo de 30% HP, cooldown 6s.

Blood Drinker — OK, 3/5. Cura por atacar Bleeding, cooldown 4s, sustento útil em combate longo.

Sanguine Fury — REPETIDO, 3/5. Aplica Bleed no crítico e +10% speed; mesma speed do Adrenaline/Reaper, não empilha.

#### DECAY (5)

Toxic Touch — OK, 2/5. Poison+Rot, precisa de tempo para gerar valor.

Virulent Rot — FRACO, 1/5. +18% tick de Rot, só números.

Wasting Curse — OK, 2/5. Rot no alvo mitiga até 8% dano por rank.

Withering Hex — NICHO, 1/5. Reduz cura do Vampire Elite e Leech boss; é geralmente inútil fora destes.

Blight — OK, 3/5. Dano burst adicional contra Rot, cooldown 7s.

#### VITALITY (5)

Strong Heart — OK, 1/5. +10% HP/rank, funcional e sem decisões.

Renewal — OK, 1/5. Regen 0,55% HP/s/rank; pode ultrapassar atrição em fights longas.

Last Stand — EXCELENTE, 5/5. Sobrevive um golpe letal por Expedition, decisão dramática.

Second Breath — OK, 3/5. 2,5% heal/rank ao eliminar o inimigo (praticamente fim da Wave).

Life Bloom — NICHO, 2/5. Recupera menos HP que Renewal e dá +1,5 Mana/s/rank; esta segunda componente não é útil sem Magic.

#### AEGIS (5)

Iron Skin — OK, 1/5. +12% DEF/rank, básico.

Fortified — OK, 1/5. -6% dano/rank, básico.

Guarded Block — OK, 3/5. Block +6 pp/rank, permite Counterstrike/Iron Reversal.

Barrier Pulse — CONDICIONAL, 2/5. Barrier +2% HP/cada 6s, combates curtos podem ocultar efeito.

Retaliation — OK, 3/5. Barrier absorvida prepara +15% próximo ataque.

#### FURY (5)

Quick Hands — OK, 1/5. +8% velocidade/rank, básico.

Precision — OK, 2/5. +6 pontos percentuais crítico/rank, suporte às builds.

Brutal Critical — OK, 2/5. +12% base hit/rank quando crítico.

Double Strike — OK, 3/5. 10% proc/rank de 30% extra hit não-recursivo.

Adrenaline — REPETIDO, 2/5. +10% speed por crit, mesma speed não empilhável com outros dois buffs.

#### MAGIC (8, cinco comuns + três elementais)

Arcane Focus — OK, 1/5. +15% Spell Power/rank, básico.

Mana Spring — CONDICIONAL, 2/5. +18% mana regen/rank, valor variável por arma, mana atual e duração.

Efficient Casting — OK, 2/5. -12% custo/rank, implementado em Staff/Wand e casts mágicos de arma física.

Arcane Echo — EXCELENTE, 4/5. A cada quarto cast, dano eco; contador no jogador PERSISTE entre Waves.

Elemental Force — OK, 2/5. +15% status potency/rank; para Frost melhora duração, para Lightning só burst raro.

Kindling (Fire) — CONDICIONAL, 2/5. Burn +20%/rank; DOT de 3s pode nem dar tick antes da morte.

Deep Winter (Frost) — FRACO, 1/5. Apenas +0,45s Chill/rank; frequentes casts já renovam Chill antes de expirar.

Overcharge (Lightning) — CRÍTICO, 1/5. +20% em burst que exige 4 aplicações no mesmo inimigo e reseta.

### 15 COMBINAÇÕES HÍBRIDAS, CADA UMA COM 2 OPÇÕES (30)

Blood+Decay: Plague Rupture — CONDICIONAL 3/5, exige Bleed+Rot no mesmo alvo e crítico; Carrion Detonation — RISCO 4/5, consome DOT de ambos os tipos, confirmar que burst paga o dano futuro perdido.

Blood+Aegis: Blood Ward — OK 3/5, Bleed gera Barrier; Sanguine Reprisal — OK 4/5, Block/Barrier gera Bleed e burst, exige fonte de proteção.

Blood+Vitality: Hemovore — REPETIDO 3/5, mata alvo com Bleed e cura 4%; Crimson Pact — TEXTO 4/5, cobra 2% HP para aplicar Bleed no mesmo hit, não no próximo como diz tooltip.

Blood+Fury: Crimson Rush — OK 3/5, crítico em alvo com Bleed +15% hit; Reaper's Cadence — REPETIDO 2/5, condicional abaixo 50% HP e speed 10% não empilhável.

Blood+Magic: Hex Bleed — EXCELENTE 4/5, Magic aplica Bleed; Hemal Sigil — RISCO 4/5, consome Bleed e aplica efeitos diferentes por elemento, por vezes perde damage over time.

Decay+Vitality: Rot Recovery — REPETIDO 3/5, cura 4% em kill com Rot, quase clone de Hemovore; Rot Symbiosis — OK 3/5, Rot tick cura até 1,8% HP/6s.

Decay+Aegis: Rot Ward — OK 3/5, Rot tick dá Barrier; Rot Husk — CONDICIONAL 3/5, só reforça quando Barrier quebra diante de alvo com Rot.

Decay+Fury: Toxic Precision — EXCELENTE 4/5, críticos aplicam Poison+Rot; Venom Shatter — RISCO 4/5, crítico consome Rot para burst, calcular custo de DOT.

Decay+Magic: Hex Bolt — FRACO 2/5, +18% Spell Power/3s contra alvo com Rot, pouca identidade; Elemental Blight — EXCELENTE 4/5, transforma Rot de forma diferente com Fire/Frost/Lightning.

Vitality+Aegis: Sanctuary — EXCELENTE 4/5, 20% de heal vira Barrier; Guardian's Oath — CONDICIONAL 4/5, cura quando Barrier quebra, 1 vez/Wave.

Vitality+Fury: Fervent Life — FRACO 2/5, cura 1% HP por crítico/4s, pequeno efeito; Redline — RISCO 4/5, sob 50% HP dá burst e recebe +10% dano/3s, trade-off visível.

Vitality+Magic: Life Conduit — FRACO 2/5, cura real dá apenas 2 Mana/3s; Lifeweave — EXCELENTE 4/5, gasta 3% HP por 10 Mana quando abaixo 30% Mana, 8s CD.

Aegis+Fury: Counterstrike — OK 3/5, Block prepara 18% hit extra; Iron Reversal — EXCELENTE 4/5, Block prepara 35% hit mas deixa +10% dano recebido/3s.

Aegis+Magic: Runic Shield — EXCELENTE 4/5, cast dá Barrier 2% HP/3s; Prismatic Rebound — CONDICIONAL 4/5, Barrier absorvida armazena dano para próximo feitiço, pode não ativar em fights curtas.

Fury+Magic: Spellblade — EXCELENTE 4/5, cast prepara próximo hit inclusive Staff/Wand, corrigido; Spell Surge — EXCELENTE 4/5, crítico prepara burst elemental num cast POSTERIOR, não no mesmo hit.

### CONCLUSÃO

Nenhum dos 63 passivos parece completamente sem implementação no módulo: o teste unitário constrói artificialmente condições de ativação e verifica diferença observável. Isto NÃO comprova ausência de bugs em runtime, frequências úteis ou qualidade do design. Contagem desta inspeção qualitativa: 11 excelentes, 25 OK, 8 condicionais, 6 fracos, 5 repetidos, 2 muito de nicho, 4 de risco a balancear, 1 com tooltip enganosa e 1 criticamente ineficaz (Overcharge); pontuação média subjetiva 2,71/5 (não estatística dos jogadores).

### OUTROS PROBLEMAS PRIORITÁRIOS

1. speed() devolve apenas multiplicador 1,10 se QUALQUER frenzy está ativo; Sanguine Fury, Adrenaline e Reaper's Cadence não acumulam e geram setups redundantes. Criar funções diferentes entre si ou regras limitadas de stack, não três versões do mesmo haste.

2. Deep Winter quase não acrescenta controlo se Frost lança a cada 2–2,5s. Trocar rank por efeito distinguível: primeira aplicação interrompe/atrasa um ataque após cooldown, ou bônus em alvos Chilled, com limite contra bosses. Evitar hard CC permanente.

3. Withering Hex é um draft morto fora de inimigos com cura. Acrescentar redução de regeneração/Barrier dos alvos em Rot ou pequena fraqueza defensiva universal limitada, mantendo anti-heal como especialidade.

4. Hemovore vs Rot Recovery, Blood Ward vs Rot Ward e três habilidades de speed são repetitivos; dar contrapartidas diferentes por tipo de inimigo, não somente labels.

5. Corrigir tooltip Crimson Pact para dano imediato ou alterar o código para preparar PRÓXIMO Bleed. Testar DOT consumido por Carrion, Venom e Hemal contra Wave de 2/4/8 segundos.

6. Dar maior identidade aos passivos planos, mas não eliminar todos: alguns atributos básicos são úteis para permitir builds estáveis. Escolha deve ser interessante nas recompensas raras.

7. Testar 7 armas físicas/mágicas e vários tiers com runs completas, registrar nº de procs por passivo, DPS/HP/Mana, duração, vitória, boss, odds e picks; pré-definir limiar ex. <1 ativação significativa por run indica candidato a redesign. Não utilizar contagem de hooks em testes preparados como proxy de eficácia.

### PRIORIDADE DE APROVAÇÃO PROPOSTA

P0: nova Static carry-over e Overcharge, junto com testes de compatibilidade, save e não duplicar descargas por refresh. P1: Deep Winter e haste não cumulativa; Withering Hex. P2: efeitos de híbridos condicionais e custos reais de DOT; descrições e alternativas. Apenas depois reajustar numeric balance dos normais. Design sujeito a aprovação, nenhuma alteração ao código/main/Railway/Firebase/saves nesta análise.

## BACKLOG — 26 | ECONOMIA DE POÇÕES, BLACKSMITH/APOTHECARY E LOADOUT 3/3 — 20/10/2026

ESTADO: DESIGN PROPOSTO A PARTIR DA DECISÃO DO UTILIZADOR. NÃO IMPLEMENTADO NO CÓDIGO OU RAILWAY. UI REDESIGN ADIADO.

### DECISÃO DO UTILIZADOR

Poções passam a ser ITENS CONSUMÍVEIS comprados num vendedor, e não ofertas gratuitas no começo de cada Expedition. Separar o Merchant atual numa função BLACKSMITH (vende equipamentos) e APOTHECARY (vende poções), mantendo a Forge como serviço de crafting distinto, pelo menos na lógica; tabs/visual exatos a decidir quando for redesenhada a UI. Apothecary com ofertas aleatórias e reroll pago em Gold ao estilo do equipamento, mas STOCK e reroll INDEPENDENTES do Blacksmith. O jogador prepara no máximo 3 SLOTS de poções antes de entrar numa Expedition; a bag de 6 equipamentos encontrada durante a run mantém-se INDEPENDENTE das poções. Para já, mostrar equipamento e poções na mesma Stash/inventário, sem exigir divisão visual em ecrãs separados. Pedida poção RARE para aumentar probabilidade de drop durante UMA Expedition; outras poções para Attack, Spell Damage e Defense.

### SITUAÇÃO DO CÓDIGO ATUAL VERIFICADA

index.html: rollShop() gera 4 equipamentos; refreshMerchantStock('gear') custa Gold e tem stock separado de geração aleatória; Merchant vende só equipamento. phase1Begin() cria phase3Supplies={health:2,mana:2}, fornecendo gratuitamente 4 doses por Expedition; phase3UsePotion() só permite Health e Mana ENTRE Realms, recuperando 35% max HP e 40% max Mana; cooldown 350ms; não são itens em stash. A bag PHASE3_BAG_CAPACITY=6 guarda apenas loot recolhido, distinto de material pré-preparado. online/v012-save.js aceita s.supplies.health/mana apenas 0..2 e valida itens da stash através do modelo de gear; logo é OBRIGATÓRIA migração/versionamento de saves e checkpoint para permitir itens consumíveis. Nunca inserir um objeto potion cru no array gear existente e presumir que a validação aceita.

### DESENHO DE LOJAS

BLACKSMITH: o Merchant atual passa a vender 4 ofertas de equipamento, com o reroll pago já existente. Manter Forge/crafting funcionalmente separado até decisão explícita sobre a UI.

APOTHECARY: 4 ofertas no expositor e botão de reroll APENAS das poções, usando Gold. Recomendação de acessibilidade: 1 oferta Health e 1 Mana disponíveis em cada ciclo, e 2 ofertas aleatórias ponderadas pela raridade; alternativa a testar é quatro ofertas ponderadas, mas só se não deixar o jogador sem acesso a cura. Rerolls com preço base escalado ao patamar da Expedition e crescimento moderado por refresh realizado na mesma ronda, com limite/anti-inflation; preços e odds só finais após simulação Gold sink/economia. Nenhuma poção deve ter garantia Rare. Compras, rerolls e stock guardados atomicamente, sem duplicar através de refresh/múltiplos separadores.

### CATÁLOGO INICIAL (8 TIPOS, NÚMEROS PROVISÓRIOS)

P01 Health Potion — Common — recuperar 35% máximo de HP, apenas entre combates/Realms.

P02 Mana Potion — Common — recuperar 40% Mana máximo, apenas entre combates/Realms.

P03 Potion of Might — Uncommon — +10% Attack nos PRÓXIMOS 3 ENCONTROS DE COMBATE (uma Realm de 1–3 Waves conta como 1 encontro; eventos não consomem duração).

P04 Arcane Elixir — Uncommon — +10% Spell Damage nos próximos 3 encontros de combate (não confundir com regeneração Mana).

P05 Ironhide Tonic — Uncommon — +10% Defense nos próximos 3 encontros de combate.

P06 Haste Draught — Rare — +8% Attack Speed nos próximos 3 encontros de combate, com teto seguro contra builds Fury e buffs de velocidade existentes.

P07 Potion of Fortune — Rare — +25% RELATIVO à PROBABILIDADE DE DROP DE EQUIPAMENTO (p' = min(1, 1.25×p)) desde o início até ao FINAL da Expedition; só 1 ativa por Expedition. Exemplo: 10% base = 12,5% final, NÃO 35%; não altera tabelas de raridade, nº garantido de Boss Runes, odds de Legendary, drops de Fragments/Gold nem resultado de recompensas concedidas diretamente por eventos. Não garante qualquer item, nem ressorteia drops anteriores; implementada como modificador no roll de drop após Wave. Interação com CHARISMA/lootQuality e limites explícitos a testar.

P08 Barrier Flask — Rare — conceder Barrier equivalente a 15% HP máximo, usar em intervalo seguro entre Realms, limitado pelo cap atual de Barrier.

### DURABILIDADE / TIMING

Potion of Fortune deve ser escolhida no loadout em Camp e CONSUMIDA automaticamente ao começar a Expedition, para garantir a duração integral. Conta como UM dos 3 slots equipados (mesmo consumida, NÃO liberta uma quarta poção durante a run). Health/Mana podem ser usados nas pausas entre Realms, como atualmente; buffs Attack/Spell/Defense/Haste e Barrier Flask também são ativados conscientemente entre Realms, duração contada em ENCONTROS DE COMBATE futuros, não em segundos cronológicos ou eventos não-combate. Não permitir usar poções enquanto inimigos atacam, nem abastecer a loadout durante a Expedition. Uma potion adquirida num EVENTO dentro da Expedition (ex. Merchant) precisa de ser tratada como escolha temporária de substituição com teto de 3, nunca como quarto slot gratuito.

### 3 SLOTS DE LOADOUT — PROPOSTA CONCRETA

Exatamente TRÊS POSIÇÕES no loadout; cada posição contém 0 ou 1 unidade/bottle de uma poção escolhida da Stash. O jogador pode levar 0–3 (incluindo repetição de tipo, EXCETO limite uma Fortune). Assim não significa 3 stacks de 20 doses cada. Poções compradas continuam na Stash fora da Expedition; 3 selecionadas ficam RESERVADAS e fora da disponibilidade de venda/reroll. Ao começar, são debitadas/consumidas do stock em transação guardada. Doses não usadas devem idealmente voltar à Stash após vitória ou extração; testar o efeito deste retorno nos Gold sinks e proteger contra ganhos duplicados em mortes/abandono/refresh. As consumidas deixam de existir; nenhuma reposição automática 2+2.

### BAG VS STASH

A BAG durante a Expedition continua a guardar no máximo 6 peças de EQUIPAMENTO encontradas. Não contar poções levadas nesses 6 espaços; o limite tático é 6 loot + 3 poções independentes. Fora da Expedition, inventário visual único para tudo, com tipo/raridade/quantidade e filtros simples mais tarde; para evitar dezenas de slots consumidos por poções idênticas, empilhar por mesmo tipo/tier/raridade com quantidade limitada (ex. até 20). IMPLEMENTAÇÃO INTERNA SEGURA: armazenar potions numa coleção própria versionada (profile.potions) e mostrar tudo no mesmo ecrã que state.stash; OU generalizar explicitamente o modelo de items e validadores. Não inserir poções como gear sem alterar schema, limites, comparação, equip, salvage e regras anti-dup. Definir a contabilidade de capacidade global da Stash depois do teste de empilhamento; não reduzir a bag nem mexer nos slots de equipamento.

### BALANCEAMENTO E EXPLOITS A TESTAR

Sem poções grátis, jogadores E1 podem ficar sem Gold suficiente para sobreviver; testar custo de 3 doses em E1/E10/E30/E80, farm e economia de refresh e compras. Para não criar paywall de Gold, permitir opção de cura acessível e controlar mínimo de ofertas básicas; não oferecer poções gratuitas em cada run por defeito.

Fortune: teste 10k+ runs e comparar itens/Expedition, raridades condicionais, Gold gasto, vitória/abandono e tempo de recuperaçao após derrota; aplicar apenas a drops probabilísticos, sem aumentar raridade nem boss guaranteed; não criar cadeia por reroll/farm infinito com alts. Se a potion apenas aumenta +25% relativo e ocupa 1 dos 3 slots, pode ser uma armadilha económica para a maioria das runs curtas; estimar diferença REAL de drops por 11–12 combat Realms antes de fixar preço.

Buffs: evitar empilhamento ilimitado de mesmo efeito e sinergia explosiva entre Spellblade/Static/Fury/Legendary; comparar 3 poções ofensivas vs 2 de sustain + Fortune para não tornar uma opção obrigatória. Expiração por encontros e persistência em saves mesmo através de eventos/reloads.

A integração de poções e eventos tem de respeitar checkpoints atómicos, recompensas já entregues, equipamento inicial, locks contra edição de stash durante combate, save/restore em slot isolado, perfil legado e não alterar conta real, Firebase, main ou produção até aprovação explícita.

### TESTES MÍNIMOS PARA IMPLEMENTAÇÃO FUTURA

- compra, reroll e recusa com Gold insuficiente; lojas independentes.

- 0/1/2/3 slots válidos, duplicado de tipo permitido excepto Fortune, quarto slot recusado; bag 6 loot continua separada.

- poções stacked na Stash com quantidades consistentes; compra, consumo, retorno e venda sem criar/destruir unidades de forma incorreta; migração de perfil anterior sem consumíveis.

- Fortune não modifica rarity, Rune boss nem loot garantido, aplica chance relativa só a drops de equipamento.

- eventos não gastam durabilidade de poções buff, 3 Combats Realm completos gastam exatamente 3 cargas de duração mesmo com 1–3 Waves cada.

- morrer, extrair, fechar tab/reabrir, restore parcial, clique duplo, dois separadores; Gold e potions sem duplicação.

- avaliação humana: preferências de loadout, diversão da preparação, pressão de stock e qual melhor utilização de slot.

ESTADO: nova especificação no backlog; código, Railway, deployment, main e saves ficam inalterados neste turno. Implementação só se explicitamente pedida.

## BACKLOG — 27 | EXPEDITION FLOW, BETWEEN REALMS, BOSS FINAIS E COMBATE — 20/10/2026

STATUS — APENAS ESPECIFICAÇÃO PARA FUTURO LOTE CODEX; NÃO ALTERAR CÓDIGO AGORA

O utilizador está a testar mecânicas e dará mais alterações. Preservar as propostas no MESMO backlog antes de instruir Codex a integrar tudo de uma vez na branch development. Não fazer commits, PR/merge em main, deploy Railway/Firebase nem alterações de saves reais nesta ronda. O design visual final será fornecido mais tarde pelo utilizador. Nesta fase focar fluxos funcionais e placeholders sem criar interfaces finais.

### 01 — VOLTAR NA ESCOLHA DE AFFINITY INICIAL

Quando a Expedition é iniciada e abre a página «Choose your initial affinity», acrescentar botão Back para regressar à Camp/preparação SEM entrar na Realm 1, SEM gastar rerolls, poções, Gold ou consumir tentativa/salvar progressão como abandonada. O botão Back deve estar disponível também em «Choose your Magic element» antes de entrar no primeiro Realm (voltar para escolha anterior de affinity; permitir cancelar e regressar a Camp). Nunca permitir Back de forma a reverter combate, decisão de evento, draft já reclamado ou loot e permitir exploit. Atualmente phase1Begin() começa controller.start() antes de escolher inicial; redefinir pre-entry como estado reversível transacional/rollback controlado. Se já houver checkpoint válido, voltar sem duplicar/corromper saves.

### 02 — FIM DE CADA REALM: POPUP DE PASSIVO E BOTÃO SAIR REALM

Depois de concluir TODAS as Waves de uma Realm (ou o evento não-combate que a substitui), apresentar popup/modal de escolha entre os 3 passivos oferecidos; guardar a escolha uma vez com a identidade da recompensa. NÃO criar relatório detalhado intermédio. Após escolher passivo, fechar apenas esse popup e voltar à própria vista de COMBAT/Realm concluída, conservando logs de combate daquela Realm, Gold, Fragments e equipamento ganhos (se evento: log da escolha e recompensa). Na Realm concluída existe botão «Sair Realm» / «Leave Realm → Between Realms», que entra na nova área Between Realms. NÃO iniciar a Realm seguinte automaticamente.

O ecrã Between Realms é a única área de gestão/preparação entre Realms: estado HP/Mana e outras stats, equipamentos e bag da run, comparação/equipamento, potions e buffs; seleção da próxima rota. Separar estados persistíveis: realm combat resolved, passive reward pending, passive picked/exit pending, between realms. Um refresh em qualquer transição tem de restaurar popup ou ecrã correto sem repetir drop ou conceder outro passivo. Não usar a mesma variável de conclusão para oferecer duas vezes recompensas.

Se o jogador morrer, extrair ou concluir boss final, ir para respetivo fluxo de fim da Expedition; não oferecer passivo ao terminar a Realm 15. O relatório completo (resultados, loot, recursos, passivos, duração, mortes/sobrevivência, boss e runa) aparece apenas no fim da Expedition, sem relatórios repetidos após cada Realm.

### 03 — EXATAMENTE 3 REROLLS PARTILHADOS POR EXPEDITION

Substituir atual array rerollsByRealm[15][3], que dá 3 rerolls a cada cartão em cada Realm, por contador único restante=3 que começa ao iniciar a Expedition. Rerollar QUALQUER um dos 3 cartões custa exatamente 1 ao contador global; TODOS os outros cartões do mesmo e dos futuros ecrãs mostram o novo valor (3 → 2 → 1 → 0). Preservar os outros dois cartões; impedir repetição inválida e troca de família que viole máximo 3 affinities; garantir a affinity inicial antes da primeira Realm; nenhuma reroll de boss final. Estado persistido/restaurado/validado em saves do protótipo. Rerolls não transitam para outra Expedition; não são compras por Gold. Atenção a conversão de checkpoints anteriores: migration controlada, sem deixar 45×3 rerolls fantasma no carregamento.

### 04 — DURANTE EXPEDITION DESATIVAR NAVEGAÇÃO INVENTORY SEPARADA

Enquanto a Expedition está ativa, não permitir abrir aba/modal de inventário global, stash, merchant, blacksmith, apothecary ou forge. O equipamento do jogador continua visível/gerível APENAS em Between Realms; ao clicar numa peça de loot da bag de 6, abrir detalhes, comparar com o item EQUIPADO no mesmo slot, permitir equipar/substituir ou descartar explicitamente. Substituição 2H/offhand e anéis I/II com validação; impedir duplicação e descarte automático, manter home gear safe rules e loot perdido em death. Não mudar equipamentos ou poções DURANTE Waves em combate, nem introduzir modal de inventário que permita exploit. Se bag tiver overflow (>6), resolver explicitamente entre Realms antes de prosseguir.

### 05 — BETWEEN REALMS: PAINEL DE ESTATÍSTICAS, EQUIPAMENTO E BUFFS

Unificar num ecrã Between Realms: HP/MaxHP, Mana/MaxMana, Attack, Spell Power/Damage, Defense, speed, crit, block e stats relevantes; loadout equipado; bag 6 itens (sem ocupar espaços com 3 potions selecionadas); comparação de gear e botões equipar/descartar; preparação/uso de potions entre Realms; contador de rerolls; 3 escolhas seguintes de rota, exceto boss final.

Adicionar zona independente «Expedition Buffs & Effects» listando TODOS os efeitos temporários ativos e com impacto, identificados pela fonte: passivos/híbridos, Static persistente (quando for aprovado), poções e respetiva duração, eventos aleatórios, Rune buffs temporários, shields, maldições e efeitos da run. Mostrar valor/stack, duração por próximo combate/segundos/Waves, cooldown se aplicável, sem esconder buffs com poucas cargas. Distinguir «passivos escolhidos» (lista permanente DURANTE a run) de «efeitos ativos» (temporários). Sem ativar efeitos novos: apenas tornar visíveis os já implementados e futuros; sem reintroduzir Tier Bonuses ou gear affinities permanentes da v0.12.

### 06 — CLEAR ALL NEW TAMBÉM NOS ITENS EQUIPADOS

«Clear All NEW» remove SOMENTE badge/propriedade isNew de TODOS os itens relevantes, incluindo BAG, STASH e itens EQUIPADOS que passaram a ser NEW. NÃO desequipar, destruir, descartar, vender, remover proteção ou modificar stats de equipamento. A operação é segura, idempotente, guardada no save e atualiza todos os badges sem inconsistência.

### 07 — REALM 15: UM ÚNICO CARTÃO DE BOSS, 3 VARIANTES ALEATÓRIAS

Nas Realms 1–14 manter até 3 cartões (com reroll global onde permitido). Na etapa 15, mostrar APENAS 1 cartão de boss, sem escolher affinity nem rerollar. Sortear uma das TRÊS variantes EXISTENTES quando gerar a Expedition (não por render/refresh/reroll); guardar ID fixo da variante no controller e session restore até terminar. Nomes reais do código verificados:

- The Abyssal Guardian — Guardian/Barrier — placeholder asset assets/bosses/abyssal-guardian.png.

- Rift Harbinger — Leech/Drain — placeholder asset assets/bosses/rift-harbinger.png.

- Ember Sovereign — Berserker/Enrage — placeholder asset assets/bosses/ember-sovereign.png.

Dar a cada boss Realm o seu nome próprio, relacionado com a criatura, sugestões provisórias «Abyssal Guardian's Citadel», «Harbinger's Rift» e «Ember Sovereign's Throne». Placeholders: reutilizar as TRÊS imagens existentes do boss com espaço seguro; arte final virá com redesign. O boss sorteado determina efetivamente a criatura, stats, estilo, habilidades, nome e risco, não apenas foto/label. Não escolher uma affinity adicional na Realm 15, não aumentar o teto de 3 families ou dar nova escolha de passivo no fim. Preservar 15 etapas, 3–4 eventos, elites e progresso unlock.

Atualmente bossForTier() alterna boss DETERMINISTICAMENTE com tier (Math.floor(tier/10)-1)%3; remover essa dependência APENAS para Boss final v0.12. Não alterar regras do modo clássico e não perder compatibilidade de checkpoints antigas.

### 08 — RUNAS NO BOSS FINAL

Fazer a recompensa de Runas surgir ao DERROTAR o boss final (Realm 15), com apresentação na sequência final adequada e sem duplicar. Usar o sistema de três escolhas de Rune já existente quando aplicável e decidir valor/tier/escala para TODOS os níveis de Expedition — atualmente offerBossRunes(r.tier) só acontece a cada 10 Expeditions (r.tier%10===0), e o validador Rune usa tiers múltiplos de 10. A intenção do utilizador é associar explicitamente Runas ao boss final, não a uma Wave normal, Elite ou evento. Para Codex: verificar se deve passar a 1 Rune por boss em CADA Expedition (e então versionar modelos/rune tier/economia/odds) ou conservar o prémio permanente só a cada milestone com aviso claro; não prometer runa garantida em todas sem rever economia e limites. Caso o design aprove 1 cada, evitar inflação de Rune power e duplicação via replay/refresh. Não mostrar relatório intermédio antes de reclamar o prémio final.

### 09 — BUFFS E DEBUFFS EM FALTA NO COMBATE

Auditar todos os estados REAIS aplicados pelo engine e expor no combate, ao lado correto (player buffs/debuffs e enemy buffs/debuffs). Mostrar duração, stacks, nomes/ícones consistentes e atualizações em tempo real para Bleed, Rot, Poison, Burn, Chill/Frost, Barrier, Weaken, Healing Reduction, Fury/haste, lifesteal, buffs dos eventos, poções, Rune temporária, Static (se implementado), híbridos com procs relevantes e debuffs de elites/boss. Sem inventar status visual para efeito que não funciona. Limitar altura/layout e indicar stacks corretamente; não expor nome do Elite como status duplicado.

### 10 — CARTÕES DE REALM: INFORMAÇÃO MAIS LIMPA

Mover ícone da affinity/cenário para o INÍCIO DO NOME da Realm. Remover símbolo/ícone repetido da zona inferior dos metadados. Reduzir textos repetidos: não mostrar «No Elite» e «Normal» em sítios separados; representar risco num ÚNICO campo de dificuldade com 2–4 estados e cores semanticamente distintas (Normal neutro, Elite amarelo/laranja, Boss vermelho/único, Evento ícone distinto sem dificuldade de combate). Mostrar nome, affinity, dificuldade, Waves se relevante e um pequeno texto de identidade; pormenor expandido apenas se necessário. ELIMINAR «3 possible loot rolls» e frases equivalentes; não prometer itens antes de cair e não mostrar odds obsoletas. A Realm 15 tem um cartão só com imagem/nome boss.

### 11 — COMPARAÇÃO DE EQUIPAMENTO BETWEEN REALMS

Ao selecionar um item encontrado, indicar ▲ Upgrade, ▼ Downgrade ou ≈ Sidegrade baseado em comparação real contra o item que o jogador TEM equipado no respetivo slot. Comparar stats e poder relevante com cores/ícones coerentes; mostrar diferenças de Attack, Spell Power, Defense, HP etc., não apenas Gear Power total. Separar potência de combate de sinergia de passivos, que é difícil de converter num número único. Se slot vazio sinalizar «Empty slot» em vez de declarar automaticamente melhor; regras 2H/offhand, rings, armor types respeitadas. Gear final nunca é eliminado só por ser «downgrade» matemático.

### 12 — BAG E EXPEDITION LOG JUNTOS DURANTE COMBATE; REMOVER TIER BONUS

Na UI COMBAT da v0.12, mover painel «Expedition Bag 6/6» (somente leitura durante Waves) para junto do «Expedition Log»/loot obtido, numa área lateral ou no rodapé adaptada ao mobile. Os drops entram na bag ali visível; detalhes e ações de equipar/descartar só em Between Realms. Remover a secção «Tier Bonuses» e «combatSetList» do combate da v0.12, porque sets/gear affinity estão desativados. Não apagar os antigos componentes do modo clássico se este ainda os usar; condicionar ao modo. Respeitar visibilidade de inimigo, bars, buff/debuff e controls em mobile sem aumentar a altura do combat frame.

### 13 — PONTOS DE TESTE E REGRAS DE SEGURANÇA DO LOTE CODEX

- Fluxo end-to-end completo E1–E20: Camp → escolha affinity / Back → início → Waves → vitória → modal de passivo → ecrã de combate concluído (logs/recompensas) → Sair Realm → Between Realms → próxima Realm → 1 boss único na #15 → Rune quando elegível → só relatório final. Incluir eventos em qualquer etapa e derrota/extrair.

- Guardar estado e controlar dupla reclamação do draft, botões de saída, rerolls globais, equip/salvage, Gold/Fragments e Rune, incluindo refresh/tab duplicado e checkpoint de event. Todos os novos campos de controller/phase4Session/online v012 save são versionados/migrados; não escrever saves de jogadores reais.

- Testar 3 rerolls globais gastos em cartões/Realms diferentes, 4.º impedido e contador visual sincronizado; boss sempre 1 único cartão sem reroll; tipos boss com distribuição aproximadamente uniforme quando seeds variam, fixos após refresh.

- Testar comparador, bag cheia/overflow, gear 2H/offhand e anéis, Clear All NEW incluindo equipado, Buffs persistentes de potion/evento/Static, curso da Rune e relatório final único.

- Verificar acessibilidade de diálogos e botões Back, foco, atalhos mobile, portrait placeholders, sem labels de Tier Bonus na v0.12; não publicar como layout visual final.

- Não confundir 3 rerolls de CARTÕES DA EXPEDITION com rerolls de lojas (Gold) descritos no Backlog 26. São economias distintas.

### PRIORIDADES PARA CODEX

P0: controladores de fluxo, 3 rerolls globais, boss aleatório/carta única, entrega Rune sem exploit, save/restore; P1: Between Realms integrado (stats, gear, bag, buffs, comparison); P2: limpeza de UI e log, badges, status e placeholders; P3: testes Playwright 390/1280px, balance e report técnico. Um único lote após autorização do utilizador, development apenas, nunca main.

## BACKLOG — 28 | RUNA GARANTIDA EM TODA EXPEDITION + FIX AFFINITY PROCS SEM PASSIVO + 5/5 EQUIPAMENTO (20/10/2026)

ESTADO: CORREÇÃO DE REQUISITOS DO UTILIZADOR E BUG CONFIRMADO; PARA IMPLEMENTAÇÃO FUTURA PELO CODEX EM LOTE. NÃO ALTERAR CÓDIGO AGORA.

### CORREÇÃO DEFINITIVA DE RUNAS (SUBSTITUI AMBIGUIDADE NA SECÇÃO 27, PONTO 08)

Em CADA Expedition COMPLETADA com vitória sobre o boss da Realm 15, o jogador recebe GARANTIDAMENTE 1 Rune permanente. Não apenas E10/E20/E30, mas também E1, E2, E3 ... E200. Manter apresentação de 3 opções de Rune e escolher 1, reaproveitando sistema existente e seus 8 tipos de Rune. A runa surge após boss derrotado na sequência do relatório FINAL da Expedition (sem relatórios após cada Realm). Não conceder runa se morrer, abandonar ou extrair cedo; replay da mesma Expedition bem-sucedida também é uma nova run válida para loot, a menos que futuras regras de farm limitem. Cada run recompensa uma única vez, com award-key de boss e claim transacional, persistente após refresh sem reroll gratuito de opções, clonagem ou dupla entrega.

### BLOQUEIO DO CÓDIGO CONFIRMADO — PRECISA DE ALTERAÇÃO REAL DO SCHEMA

Hoje index.html só chama offerBossRunes(tier) se tier%10===0; validRune(), safePendingRune(), safeRunes() e online/v012-save.js exigem tier entre 10–200 E múltiplo de 10; runeValue() usa base=1+floor(tier/10), tendo E1–9 potencialmente menor do que E10 (base1 vs2). Portanto não resolver por mapeamento artificial E1→Rune E10: seria power-creep. Na v0.12 guardar tier real E1–E200 na Rune da Expedition, manter tipos/3 slots permanentes/equipáveis e ajustar validadores, migração e cálculo de valores. Não alterar validação do modo clássico sem testes; distinguir Rune de Expedition e Rune de milestones clássicos no tipo/validador/compatibilidade, preservando Runas já guardadas.

Segurança: confirmar Runes já equipadas, uma Rune por família, limite de 3 runes equipadas, storage de até 300 runes owned e o que fazer ao chegar ao teto sem conceder ou apagar inadvertidamente; boss e opções fixos por checkpoint; testes em E1/E2/E9/E10/E11/E199/E200, vitórias repetidas, double click, refresh, restore, finalização com inventário cheio, derrota e extração.

### BUG DE AFFINITIES CONFIRMADO E REPRODUZIDO — A FAMÍLIA APLICA STATUS GRATUITOS

User test: entrar numa Realm de Decay quando ainda não escolheu um passivo Decay gerou Poison e Rot. Confirmado em combat/v012-buildcraft.js: onAttack usa hasFamily(b,'decay') para Poison+Rot independentemente de rank('toxic_touch'); e tem padrão equivalente hasFamily(b,'blood') para Bleed sem rank('bleeding_edge'). onSecond usa hasFamily(b,'vitality') para heal de base mesmo sem passivo Renewal. onCast permite Fire/Burn, Frost/Chill e Lightning/Shock sempre que família Magic e element definidos, independentemente de escolher passivo Magic (quando Magic é affinity secundária).

### PROVA RÁPIDA EM MÓDULO ATUAL

Se criar build b.families=['fury',X] e b.picks=['quick_hands'] (nenhum passivo de X), com chance de RNG forçada para ativar:

X=Blood => Bleed aplicado

X=Decay => Poison + Rot aplicado

X=Vitality => cura base de 0,2% HP por segundo

X=Magic e b.element='fire' => Burn no onCast

X=Aegis => nenhuma Barrier gratuita observada

X=Fury => nenhum proc extra gratuito observado.

Isto prova problema na lógica de ativação dos hooks, não demonstra frequência sem RNG manipulado em playtest. Effects/procs dos inimigos associados à família da Realm devem continuar a existir normalmente quando pertencem ao inimigo, não ao jogador. Não confundir imagem/affinity da Realm com passivos de player.

### REGRA CORRETA DE GAME DESIGN

Escolher ou entrar numa Realm da família X só oferece acesso e uma oportunidade de draft da família X após essa Realm; NÃO deve aplicar ao jogador os efeitos passivos de X antes da escolha. Um status ofensivo (Bleed, Poison, Rot, Burn, Chill, Shock), buff defensivo (healing, Barrier, haste) ou modificador tem de ter uma origem concreta: passivo possuído, passivo inicial EXPLICITAMENTE oferecido ao escolher a primeira affinity, arma/habilidade/poção/evento que realmente o conceda. A imagem/nome/família da Realm não causa automaticamente status no INIMIGO gerado pelos ataques do jogador.

### CORREÇÃO EM HOOKS

- Blood onAttack: substituir condição hasFamily('blood') de Bleed base por rank('bleeding_edge') > 0 e respeitar rank/cooldown/chance. Sanguine Fury continua a criar Bleed APENAS quando adquirida.

- Decay onAttack: substituir hasFamily('decay') de Poison+Rot base por rank('toxic_touch') > 0; Toxic Precision mantém proc apenas se escolhido; outros hybrids só seus próprios efeitos.

- Vitality onSecond: substituir hasFamily('vitality') para regen de 0,2% HP/s por passivo específico. Recomendação: remover regen universal e fazer Renewal a única fonte de regen desse ramo, sem parte grátis. Strong Heart inicial só dá HP se possuído.

- Magic: quando família secundária é desbloqueada durante uma Realm e elemento é escolhido mas ainda nenhum passive Magic foi reclamado, impedir que a especialização crie ataques/status mágicos gratuitos. Primeira affinity Magic continua funcional porque concede o passivo elemental inicial (Kindling/Deep Winter/Overcharge) explicitamente. Rever o contrato de onCast() e phase2MagicTick() com Mage Staff/Wand vs armas físicas para que o ataque base de uma arma funcione mas element/status extra requeira Magic passivo habilitador. Escolher elemento por si só não é receber um passive adicional.

- Aegis/Fury: auditar para assegurar que stat mods e bloqueio/críticos extras dependem de rank/gear e não de família apenas; testes observados sem efeitos gratuitos nos hooks atuais.

- Família da Realm só define opções, arte, inimigos e identidade dos mobs. O inimigo Decay PODE envenenar o jogador como mecânica própria: o bug é o jogador aplicar Poison/Rot ao inimigo sem ter aprendido Toxic Touch ou alternativa habilitadora.

### TESTES EXIGIDOS PELO CODEX

Fixtures da nova family secundaria sem nenhum passive dela: zero procs/regen/status de player atribuíveis à família para todos os 6. Repetir com passivo inicial correto (ativação válida), com passivo normal correto, com híbridos que adicionam efeitos específicos, com Magic como primeira e segunda affinity e com Fire/Frost/Lightning. Testar 10k ataques aleatórios por cenário depois de testes determinísticos e medir procs/segundo com e sem passivo; adversários podem infligir seus próprios status corretamente. Testes de persistência de build entre Realm changes, magic element, stat mods e efeitos de eventos/poções não devem ativar perks gratuitos.

### LAYOUT DEFINITIVO DA JANELA DE PERSONAGEM — 5 À ESQUERDA / CENTRO / 5 À DIREITA

Janela/painel de CHARACTER/EQUIPMENT com PERSONAGEM INTEGRAL NO CENTRO e exatos CINCO slots de item numa coluna à esquerda e CINCO numa coluna à direita, altura/spacing equilibrados, ocupando todos os 10 slots definidos em index.html SLOTS: helm, amulet, armor, gloves, weapon, offhand, ring1, ring2, boots, belt. Distribuição operacional sugerida para futuro mockup:

Esquerda, de cima para baixo: Weapon, Off-Hand, Helm, Armor, Gloves.

Direita, de cima para baixo: Amulet, Belt, Ring I, Ring II, Boots.

Preservar nomes, icons, imagem de item, rarity tint, slots vazios, placeholders, states (offhand bloqueado por 2H), click/tap e acessibilidade; manter o hero centered sem cortar topo/efeitos. No mobile, duas colunas estreitas de slots com personagem central responsiva, evitar scroll horizontal, scale down sem perder legibilidade. Quando o usuário der a referência visual definitiva, respeitar a distribuição exata e adaptações pedidas. Esta regra aplica-se à janela da personagem / Between Realms; NÃO sobrepor automaticamente a homepage definitiva sem autorização (referência homepage tinha equipamento distribuído de outra forma).

### PRIORIDADE PARA LOTE CODEX

P0: corrigir efeitos de família gratuitos, Runas garantidas E1..E200 e save versioning/anti-dup sem tocar main/Firebase; P1: coluna 5+centro+5, testes mobile. Confirmar CI dedicated e testes Playwright em dev para Rune final e affinity no passivo.

STATUS: IMPLEMENTAÇÃO AINDA NÃO AUTORIZADA NESTA CONVERSA; texto guardado para futura integração Codex. Corrige a incerteza registada na Secção 27, ponto 08.
