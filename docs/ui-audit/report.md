# Wanderer v0.12 — Auditoria de UI/UX, acessibilidade e UX Writing

**Data:** 2026-10-24  
**Branch:** `development`  
**Âmbito desta entrega:** observação e documentação. Nenhum código, texto de produto, dados de jogo ou regras Firebase foi alterado.

## 1. Resumo executivo

A interface mantém uma identidade Gothic/Dark Fantasy reconhecível e consistente: painéis escuros, filetes dourados, botões ornamentados, molduras de raridade e arte dos personagens são usados de forma coerente entre Camp, Inventory, City Center, Shrine, Between Realms e combate. As 23 interfaces/estados foram renderizadas em Chromium nas dimensões **390 × 844**, **768 × 1024**, **1440 × 900** e **1920 × 1080**. Foram guardadas 92 capturas principais e 12 capturas adicionais de hover, focus, compra, erro, estado vazio e inspeção de item.

O teste de renderização não encontrou exceções JavaScript, respostas de recursos com erro, imagens em falta nem overflow horizontal nas 92 combinações capturadas. As imagens foram carregadas antes das capturas. Isso confirma o estado visual dos cenários testados, mas não prova que todos os fluxos de jogo funcionem.

O problema funcional de maior impacto encontrado na auditoria é textual: o Shrine diz que as runas só aparecem a cada décima Expedition, enquanto os testes de integração verificam a escolha de uma Rune em cada vitória contra o boss final. O modal de Magic também abre um segundo `<dialog>` sobre a escolha de affinity, deixando os dois modais na pilha.

O Axe encontrou seis regras com violações. A mais séria é `aria-prohibited-attr` nas três slots de poções (`div[aria-label]` sem role), em Camp e Inventory. As restantes são problemas repetidos de landmarks, nível dos headings, imagens com `alt` repetitivo e falta de um `<h1>` nas páginas de Inventory, Shrine, Combat e Event. A regra de contraste ficou **incompleta** pelo Axe em todas as capturas por causa dos gradientes, imagens e fundos compostos; não declaro conformidade WCAG 2.2 AA.

Não encontrei uma página separada de definições no ponto de entrada v0.12. A janela Account & Character e o Leaderboard local estão incluídos. Safari/WebKit não está instalado neste ambiente.

## 2. Âmbito e método

- Inspeção do ponto de entrada v0.12, dos estilos carregados e dos componentes partilhados em `index.html` e `online/`.
- Navegação com Playwright/Chromium em quatro viewports e captura em [screenshots](screenshots/).
- Axe-core 4.10.3, regras WCAG 2.0/2.1/2.2 A e AA e Best Practices, aplicado às 92 capturas principais.
- Verificação manual das composições representativas em mobile e desktop, incluindo alinhamento, densidade, legibilidade, estados de seleção, carregamento dos PNGs, foco e presença de clipping.
- Interações verificadas: tabs selecionadas, affinity/Magic, modal de item, compra de poção, escolha de evento sem Gold suficiente, confirmação, hover de tab e foco por teclado.
- A app foi servida localmente. Playwright bloqueou pedidos para fora do servidor local; o estado de teste usou contextos de browser isolados e conteúdo sintético. Não foi usada conta Firebase nem save real.

**Fidelidade dos estados:** Camp, Inventory, Shrine, City Center, Affinity e os diálogos foram apresentados pela UI atual. Combate, Between Realms, evento, passive reward e os resultados foram montados com fixtures sintéticas para chegar aos estados sem concluir uma Expedition real. As capturas desses estados servem para avaliar apresentação e semântica, não para validar recompensas ou persistência.

### Artefactos

- [Verificações de renderização e resultados Axe](screenshots/render-checks.json)
- [Camp mobile, 390 × 844](screenshots/main/camp/camp-mobile-390x844.jpg)
- [Inventory mobile, 390 × 844](screenshots/inventory/equipment/inventory-mobile-390x844.jpg)
- [Forge mobile, 390 × 844](screenshots/city-center/forge/forge-mobile-390x844.jpg)
- [Apothecary mobile, 390 × 844](screenshots/city-center/apothecary/apothecary-mobile-390x844.jpg)
- [Between Realms — Stats & Passives, 390 × 844](screenshots/between-realms/stats-passives/between-stats-passives-mobile-390x844.jpg)
- [Magic element sobre Initial Affinity, 390 × 844](screenshots/dialogs/magic-element/magic-element-mobile-390x844.jpg)
- [Escolha de passive, 390 × 844](screenshots/expedition/passive-choice/passive-choice-mobile-390x844.jpg)
- [Compra de poção, 390 × 844](screenshots/interaction-states/apothecary-purchase-success-mobile-390x844.jpg)
- [Aviso por falta de Gold, 390 × 844](screenshots/interaction-states/event-insufficient-gold-mobile-390x844.jpg)
- [Foco de teclado, 390 × 844](screenshots/interaction-states/keyboard-focus-mobile-390x844.jpg)

## 3. Matriz de cobertura

Cada interface abaixo tem capturas em 390 × 844, 768 × 1024, 1440 × 900 e 1920 × 1080. Os nomes de ficheiro incluem estado, dispositivo e dimensão.

| Interface/estado | Capturas |
|---|---|
| Camp / Home | [main/camp](screenshots/main/camp/) |
| Inventory / equipment e stash com itens | [inventory/equipment](screenshots/inventory/equipment/) |
| Shrine / runes vazias | [shrine/runes](screenshots/shrine/runes/) |
| City Center / Blacksmith | [city-center/blacksmith](screenshots/city-center/blacksmith/) |
| City Center / Forge | [city-center/forge](screenshots/city-center/forge/) |
| City Center / Legendary Reinforcement | [city-center/legendary-reinforcement](screenshots/city-center/legendary-reinforcement/) |
| City Center / Merchant | [city-center/merchant](screenshots/city-center/merchant/) |
| City Center / Apothecary | [city-center/apothecary](screenshots/city-center/apothecary/) |
| Between Realms / Realm | [between-realms/realm](screenshots/between-realms/realm/) |
| Between Realms / Equipment | [between-realms/equipment](screenshots/between-realms/equipment/) |
| Between Realms / Stats & Passives | [between-realms/stats-passives](screenshots/between-realms/stats-passives/) |
| Modal / initial affinity | [dialogs/initial-affinity](screenshots/dialogs/initial-affinity/) |
| Modal / Magic element | [dialogs/magic-element](screenshots/dialogs/magic-element/) |
| Combate | [expedition/combat](screenshots/expedition/combat/) |
| Decisão de evento | [expedition/event-decision](screenshots/expedition/event-decision/) |
| Escolha de passive | [expedition/passive-choice](screenshots/expedition/passive-choice/) |
| Resultado de Realm limpo | [results/realm-cleared](screenshots/results/realm-cleared/) |
| Morte | [results/death](screenshots/results/death/) |
| Extração | [results/extraction-summary](screenshots/results/extraction-summary/) |
| Expedition concluída | [results/expedition-completed](screenshots/results/expedition-completed/) |
| Account & Character | [dialogs/account](screenshots/dialogs/account/) |
| Leaderboard local | [dialogs/leaderboard](screenshots/dialogs/leaderboard/) |
| Confirmação de extração | [dialogs/confirmation](screenshots/dialogs/confirmation/) |

Estados adicionais: [inspection de item](screenshots/interaction-states/), [stash vazio](screenshots/interaction-states/), compra de poção, Gold insuficiente, hover e focus. A fixture não criou dados reais nem submeteu resultados.

## 4. Problemas globais do Design System

### O que está consistente

- O vocabulário visual aprovado mantém fundos escuros, títulos serifados, contornos dourados contínuos e ornamentos PNG nas páginas auditadas.
- As cores de raridade são aplicadas no Merchant, Apothecary e Inventory sem deformação visível dos ícones.
- Os controlos de navegação selecionados aparecem dourados em desktop e mobile nas capturas atuais.
- Os cartões e painéis adaptam-se às quatro larguras sem ultrapassar o viewport.
- A composição de personagem e equipamento mantém a personagem central. Não vi PNGs visivelmente esticados ou recortados nas capturas revistas.
- As barras de vida usam o mesmo tratamento carmesim e o CSS partilhado inclui brilho/partículas com respeito por `prefers-reduced-motion`; Mana usa uma família azul quando aplicável. A barra de vida da personagem e a do inimigo têm hoje a mesma cor vermelha, por isso a distinção visual depende dos nomes, lados e rótulos.

### O que aumenta o custo de manutenção

O ponto de entrada agrega os estilos base e vários ficheiros de camada, incluindo `online/v012-core.css`, `online/v012-ui4.css`, `online/v012-ui4f.css`, `online/v012-ui5-camp.css` e `online/v012-ui6-unified-inventory.css`. Existem regras repetidas para componentes e padrões de painéis. A UI parece coerente no browser, mas alterações futuras a barras, painéis e cartões devem ser verificadas contra a cascata completa para não reativar estilos antigos.

## 5. Auditoria visual por interface

| Interface | Observação e impacto | Recomendação concreta | Prioridade / esforço |
|---|---|---|---|
| Camp / Home | A composição de personagem, atributos e preparação é clara em desktop e mobile. Em mobile, a página é longa; o botão sticky mantém o acesso à ação principal. O sticky e o botão original aparecem em posições distintas na captura de página inteira, mas não se sobrepõem no viewport normal. | Manter a hierarquia atual; ao validar alterações futuras, inspecionar também capturas de viewport, não só full-page, para distinguir um CTA fixo de duplicação real. | Low / Small |
| Inventory | Equipment, atributos e stash são distinguíveis. A grelha mantém três colunas no cenário de 390 px, sem overflow. A inspeção de um item apresenta comparação e ações no mesmo diálogo. | Preservar a grelha; continuar a testar com stash vazio e cheio e com modal aberto em 390 px. | Low / Small |
| City Center / Blacksmith | As tabs de serviço e de operação têm hierarquia visual clara. | Corrigir a semântica/teclado das tabs indicadas na secção de acessibilidade. | Medium / Small |
| Forge | Os controlos passam a uma coluna em mobile e a pré-visualização continua legível. A página requer bastante scroll, mas não há clipping ou overflow. As notas de probabilidade e as instruções do crafting descem abaixo do preview. | Priorizar o custo e o resultado no topo do bloco; transformar a informação explicativa secundária em texto mais curto ou detalhes recolhíveis, preservando as probabilidades. | Medium / Medium |
| Legendary Reinforcement | O estado selecionado e a ação de investimento estão identificáveis. | Tornar custo, resultado esperado e risco de forma visível no mesmo bloco antes da confirmação. | Low / Small |
| Merchant | Os cartões comunicam raridade, nome, comparação, custo e compra. A descrição explica que Compare inspeciona o item, mas não explicita o equipamento usado como referência. | Usar o texto curto proposto no Top 20. | Low / Small |
| Apothecary | Mantém a linguagem visual e a estrutura dos cartões Merchant. Em 390 px, as quatro ofertas formam uma lista vertical alta; o botão de restock surge depois de todos os cartões. | Preservar a equivalência visual com Merchant; numa revisão futura, reduzir texto secundário por cartão sem encolher ícones ou botões. | Medium / Medium |
| Shrine | O estado sem Runes está visualmente claro. A instrução sobre “every tenth Expedition” contradiz a mecânica coberta pelos testes atuais. | Corrigir antes de aprovar novas alterações de copy. | High / Small |
| Between Realms | As tabs Realm, Equipment e Stats & Passives são distinguíveis; o conteúdo cabe nas capturas mobile e desktop. O passive aparece sob os Stats no estado capturado. | Preservar esta ordem. Corrigir a navegação semântica global sem alterar a organização aprovada. | Low / Small |
| Combate | Personagem, inimigo, vida, onda, velocidade, passives, runes e log são identificáveis. A captura mostra uma onda ativa; não representa um combate completo. | Manter HP/MP, valores e rótulos textuais juntos para que a interpretação não dependa apenas da cor. | Low / Small |
| Event decision | O custo aparece por opção; o requisito de Gold insuficiente surge junto às ações e impede confirmação. | Encurtar o texto das opções sem retirar custo, duração ou efeito. | Medium / Small |
| Passive reward | As três cartas do estado de teste cabem no diálogo mobile. As linhas de descrição e progressão são pequenas, mas não cortadas. | Rever frases específicas no Top 20; fazer uma leitura manual a 200% de zoom antes de aprovar futuras alterações de escala. | Medium / Medium |
| Resultados / Death / Extraction | Os ecrãs sintéticos distinguem Realm, derrota, extração e conclusão. Conteúdo é visualmente legível nas dimensões capturadas. | Confirmar com dados reais de jogo em validação futura; esta auditoria só verifica renderização de fixtures. | Medium / Medium |
| Account / Leaderboard | Os modais estão centrados e o conteúdo usa a interface local de playtest. O Leaderboard declara que a classificação partilhada ainda não está disponível. | Manter a ressalva visível; evitar sugerir que um resultado foi enviado. | Low / Small |

## 6. Auditoria de acessibilidade

O Axe foi aplicado às 92 combinações. Encontrou seis regras violadas; os padrões são repetidos nos viewports, não são 68 defeitos diferentes.

| Regra Axe / impacto | Evidência | Correção recomendada | Prioridade |
|---|---|---|---|
| `aria-prohibited-attr` / **serious** | `.phase3PotionSlot[data-potion-index]` usa `aria-label` em `div` sem role. Surge em Camp e Inventory nos quatro viewports. | Dar semântica explícita de grupo à coleção e nomear os botões de slots; evitar labels ARIA num `div` genérico. | High |
| `region` / moderate | `#wallet` fica fora de landmarks. Ocorre em 17 estados de página, nos quatro viewports. | Incluir a carteira numa região nomeada ou num landmark existente, sem criar landmarks repetidos. | Medium |
| `landmark-complementary-is-top-level` / moderate | `<aside>` para `.phase3CampStatus` e `.phase3ExpeditionPanel` está dentro do landmark do Camp. Também há aside aninhado no layout City Center/Forge. | Reservar `<aside>` para conteúdo complementar de nível superior ou trocar estes wrappers por elementos neutros/secções com nome. | Medium |
| `page-has-heading-one` / moderate | Falta um `<h1>` nas vistas Inventory, Shrine, Combat e Event. | Dar a cada vista um heading de primeiro nível e manter headings filhos na ordem. | Medium |
| `heading-order` / moderate | Há saltos de nível, por exemplo `h1` diretamente para `h3` em Camp e headings fora de sequência em Between Realms/Results. | Ajustar a hierarquia sem depender do tamanho visual do texto; usar CSS para o aspeto. | Medium |
| `image-redundant-alt` / minor | Imagens de slots como Amulet, Gloves, Ring I/II e Boots repetem o texto adjacente do slot. | Para arte decorativa dentro de um controlo já nomeado, usar `alt=""`; caso contrário, nomear o controlo uma vez com slot e item. | Low |

### Teclado, foco e estados

- Ao pressionar Tab, o foco chega ao logótipo/retorno à Camp e apresenta outline dourado de 2 px. Capturas: [mobile](screenshots/interaction-states/keyboard-focus-mobile-390x844.jpg) e [desktop](screenshots/interaction-states/keyboard-focus-desktop-1440x900.jpg).
- A seleção de tab é exposta como estado visual nas capturas. Between Realms implementa navegação por setas; os grupos City Center/Blacksmith usam `role="tab"` e `aria-selected`, mas não implementam a mesma navegação por setas/Home/End. Recomenda-se uniformizar o comportamento de teclado.
- O `<dialog>` nativo mantém o foco dentro do modal e o botão Close recebe foco inicial. Na escolha Magic, porém, abre-se outro diálogo sem fechar o modal anterior; há dois diálogos modais abertos e ambos usam `id="modalTitle"` no helper comum. Corrigir a pilha e os IDs/associações de título.
- A compra de poção atualiza stock e Gold no estado de playtest; a escolha sem fundos apresenta “Need 28 Gold; current balance is 0.” e deixa Confirm disabled.
- Não houve violações Axe de target-size. A regra `color-contrast` ficou incompleta em todas as páginas devido aos backgrounds com gradientes/imagens; não é um resultado PASS de contraste. Requer medições em elementos específicos e verificação com fundos compostos.
- Checks incompletos adicionais: `duplicate-id-aria` em quatro estados com diálogos e outros casos que o Axe não consegue classificar automaticamente.

## 7. Auditoria completa de UX Writing — Top 20

As propostas abaixo não foram aplicadas. “Correção necessária” identifica precisão ou erro; “Simplificação” reduz leitura sem retirar informação; “Opcional” é uma preferência de tom.

| # | Interface / texto atual | Problema | Texto sugerido | Justificação / tipo |
|---:|---|---|---|---|
| 1 | Shrine: “When you fell the final boss of every tenth Expedition, the Shrine unveils three ancient runes.” | **Contradiz a mecânica:** a descrição restringe a cada décima Expedition, mas os testes cobrem uma escolha de três Runes em cada vitória de boss final. O estado vazio repete “a tenth Expedition”. | “Defeat an Expedition’s final boss to claim one of three permanent Runes.” | Corrige a expectativa sobre quando a Rune é ganha. **Correção necessária.** Ver [runes](screenshots/shrine/runes/shrine-mobile-390x844.jpg) e `tests/v012-complete-runes.test.cjs`. |
| 2 | Initial affinity: “This choice uses the existing Expedition progression.” | Fala em termos de implementação e não ajuda a escolher. | Remover esta frase. | Informação técnica não orienta a ação. **Simplificação.** |
| 3 | Initial affinity: “Select one affinity to enter the first Realm. You can close the selection and return here without choosing.” | Duas instruções podem ser uma frase mais direta. | “Choose an affinity to enter the first Realm, or close this panel and choose later.” | A ação e a possibilidade de adiar ficam explícitas. **Simplificação.** |
| 4 | Camp: “Gear up. Choose your path. Survive.” | “Path” não corresponde ao termo usado no fluxo seguinte, “Realm”. | “Prepare your gear. Choose a Realm. Survive.” | Usa o nome do destino que aparece na própria UI. **Opcional.** |
| 5 | Magic modal: “Choose one of Fire, Frost or Lightning. Its element stays fixed for this Expedition.” | Inglês natural pode ficar mais conciso. | “Choose Fire, Frost, or Lightning. Your choice is fixed for this Expedition.” | Mantém consequência e escolha. **Simplificação.** |
| 6 | Fire: “Funded Fire casts apply Burn damage over time.” | “Funded” não é explicado no próprio cartão. | “Fire casts paid with Mana inflict Burn.” | Usa a condição de ativação em termos familiares; confirmar que “funded” significa custo de Mana no sistema atual. **Simplificação.** |
| 7 | Frost: “Funded Frost casts Chill foes. Chilled foes take a Spell Power burst every 4s.” | Duas frases compactas, mas “burst” não diz claramente se é dano. | “Mana-funded Frost casts Chill foes. Every 4s, Chill deals damage based on Spell Power.” | Explicita a sequência e o dano. **Simplificação.** |
| 8 | Lightning: “Funded Lightning casts add Static. Every 4 charges discharge bonus Spell Power damage.” | A segunda frase não nomeia claramente quem descarrega. | “Mana-funded Lightning casts add Static. At 4 charges, Static deals bonus Spell Power damage.” | Sujeito e gatilho ficam inequívocos. **Simplificação.** |
| 9 | Event: “Choose an outcome. Decline gives no reward.” | “Outcome” é abstrato para uma lista de ações. | “Choose an option, or leave without a reward.” | Descreve diretamente as opções. **Simplificação.** |
| 10 | Traveling Merchant: “Buy healing: 28 Gold for 35% HP.” | Construção pouco natural e abreviação ambígua. | “Restore 35% HP · Costs 28 Gold.” | Benefício vem primeiro e o custo é inequívoco. **Simplificação.** |
| 11 | Traveling Merchant: “Buy battle preparation: same Gold for +10% Attack for 3 combats.” | “same Gold” depende da opção anterior para fazer sentido. | “Gain +10% Attack for 3 combats · Costs 28 Gold.” | Repete o custo em cada escolha e permite comparação direta. **Simplificação.** |
| 12 | Realm passive: “Hits: Bleed chance: 16% base per tick, cooldown 0.9s.” | “per tick” pode ser interpretado como intervalo de dano, não chance de aplicação. | “Hits have a 16% base chance to inflict Bleed (0.9s cooldown).” | Distingue chance e cooldown. **Simplificação; confirmar com a implementação de Bleeding Edge.** |
| 13 | Executioner: “Bleeding foe at ≤30% HP: limited burst, cooldown 6s.” | “limited burst” não informa o resultado que interessa. | “Deal a burst of damage to bleeding foes at 30% HP or less (6s cooldown).” | Explicita alvo, condição e efeito. **Simplificação; validar o dano na mecânica.** |
| 14 | Deep Cuts: “All player Bleed +15% per rank, applied on creation.” | Gramática telegráfica; o jogador pode não perceber que aumenta dano. | “Bleed you inflict deals 15% more damage per rank.” | Benefício e escala aparecem primeiro. **Simplificação; confirmar o cálculo de criação.** |
| 15 | Merchant: “Buy equipment with Gold. Select Compare to inspect one item in detail.” | Não explica que a comparação é com o equipamento atual. | “Compare an item with your equipped gear, then buy it with Gold.” | Explicita a referência da comparação. **Simplificação.** |
| 16 | Apothecary: “Four randomized potion offers · Restock for a new selection.” | “Randomized” é mais longo e menos natural que “random”; “new selection” repete a ideia de restock. | “Four random offers. Restock to replace them.” | Reduz leitura sem alterar o comportamento descrito. **Simplificação.** |
| 17 | Forge: “Create equipment from Fragments. Crafting a lower Expedition tier increases Epic odds after you have progressed further.” | Longa; a condição de tier fica enterrada. | “Craft gear with Fragments. Crafting below your highest unlocked Expedition improves Epic odds.” | Mantém custo, ação e condição em duas partes claras. **Simplificação; confirmar expressão “highest unlocked”.** |
| 18 | Forge: “Random subtype: artwork shows the slot only. The exact subtype is rolled when you Craft.” | “when you Craft” capitaliza uma ação como nome próprio; a frase é longa. | “The preview shows the slot only; crafting selects a random subtype.” | Mais direto e natural. **Simplificação.** |
| 19 | Crafting Odds: “Exact chances for your selected tier and investment.” | “Investment” é abstrato e pode esconder que são Fragments. | “Exact odds for this tier and Fragment investment.” | Nomeia a moeda envolvida. **Simplificação.** |
| 20 | Leaderboard: “The shared leaderboard is pending server validation and publication. No result is submitted from this playtest.” | Explicação técnica extensa dentro de um modal. | “Shared rankings are unavailable in this playtest. Results are not submitted.” | Mantém disponibilidade e privacidade sem detalhes de implementação. **Simplificação.** |

## 8. Problemas específicos de mobile

- **Sem overflow horizontal:** 0/92 estados ultrapassaram a largura do viewport. Isso inclui as larguras 390 e 768 px.
- **Camp:** imagem e equipamentos mantêm a posição central, atributos cabem e o CTA sticky fica acessível. A página inteira exige scroll; o screenshot full-page não deve ser interpretado como se os dois CTAs estivessem simultaneamente no mesmo viewport.
- **Inventory:** cards de stash cabem na grelha e a personagem fica contida. Os textos menores nos slots podem exigir zoom; os rótulos devem permanecer associados aos controlos.
- **Forge:** os formulários passam a coluna e as odds ficam abaixo. É a página de serviço com maior leitura/scroll no mobile.
- **Apothecary:** os quatro cartões ocupam uma lista vertical. A compra permanece visível em cada cartão e o layout não corta os PNGs.
- **Affinity:** grelha 3 × 2 cabe nos 390 px. A expansão de descrição e seleção continuam visualmente distintas.
- **Magic:** o modal de escolha tem três colunas estreitas e o texto Lightning faz mais linhas; o painel contém o conteúdo, mas fica mais alto. Acima de tudo, o modal anterior continua aberto por trás.
- **Passive reward:** as três escolhas cabem no viewport de 390 px, com descrições pequenas, sem corte visível.
- **Between Realms:** tabs e stats cabem; a persona não é mostrada na pane Stats & Passives, que prioriza dados e passives conforme o layout pedido.
- **PNG:** não foi observado corte ou distorção evidente nos screenshots. Verificação limitada à apresentação dos assets nas interfaces capturadas.

## 9. Top 10 melhorias gerais com maior impacto

1. Corrigir a informação do Shrine sobre a frequência de Runes.
2. Evitar modais `<dialog>` empilhados para a escolha de Magic.
3. Corrigir o nome semântico das slots de poções (`aria-label`/role).
4. Uniformizar a navegação de teclado entre todos os grupos com `role="tablist"`.
5. Adicionar landmark nomeado à carteira e corrigir landmarks complementares aninhados.
6. Dar um `<h1>` a cada vista e corrigir a progressão de `h1`/`h2`/`h3`.
7. Remover `alt` repetitivo em arte que já tem nome textual associado.
8. Encurtar a copy das escolhas de affinities, passives, eventos e crafting com a tabela acima.
9. Rever a legibilidade dos textos de 10–12 px a 200% zoom, principalmente Forge e detalhes de passive.
10. Como preferência estética opcional, avaliar uma cor distinta para HP da personagem em relação ao inimigo. Atualmente ambos usam o mesmo carmesim; manter rótulos/valores mesmo que a cor mude.

## 10. Plano de implementação sugerido

### P0 — Precisão

Atualizar o texto do Shrine e o estado vazio para corresponder à recompensa real da vitória contra o boss final. Confirmar o copy contra os testes de runas antes de publicar.

### P1 — Acessibilidade global

Corrigir as slots de poção, landmarks e hierarquia de headings. Acrescentar a navegação de teclado de tabs consistente. Após essas alterações, repetir Axe em todas as vistas representativas e fazer testes manuais de teclado/zoom.

### P2 — Fluxo modal e decisão

Transformar a escolha de Magic numa transição dentro do modal atual, ou fechar/transferir a pilha de forma intencional. Garantir IDs únicos, rótulos acessíveis e foco previsível. Revalidar Escape/Close e seleção por teclado/touch.

### P3 — UX Writing

Implementar as correções necessárias e simplificações que preservem os detalhes das mecânicas. Fazer revisão de termos como `Realm`, `Expedition`, `Fragments`, `funded`, `Rune` e `permanent` num glossário único.

### P4 — Refinamento visual opcional

Rever densidade de Forge/Apothecary e a distinção visual das barras de vida. Manter proporções dos PNGs, cores semânticas, movimento reduzido e a hierarquia Gothic aprovada.

## 11. Limitações e testes não realizados

- **Safari/WebKit:** não disponível. `playwright.webkit.launch()` falhou por falta do executável `webkit-2336/pw_run.sh`. As capturas mobile são Chromium com viewport/touch emulado, não Safari real.
- Não foram executados `npm test` nem `npm run test:browser`; o pedido é de auditoria visual/semântica e esta entrega não altera implementação. O harness de auditoria foi o teste Playwright executado.
- Não se completou uma Expedition real até vitória, morte ou extração. Esses ecrãs foram montados com fixtures para avaliar a apresentação. Não foi validada persistência/reload.
- Não foi usado o Firebase, uma conta real, nem um save real. A auditoria local não verifica a leaderboard partilhada nem regras/serviços backend.
- O Axe marcou `color-contrast` como incompleto nas 92 capturas por causa de imagens/gradientes; é necessária medição adicional em elementos de texto sobre os fundos compostos.
- Estados de erro cobertos: insuficiência de Gold num evento e diálogo de confirmação. Não foram exercitados todos os erros possíveis de compra, Forge, autenticação ou conexão.
- Não houve alteração de código, textos, dados ou configuração. O diretório novo contém apenas o relatório, screenshots e o ficheiro JSON de verificações.

## 12. Deep Visual & UX Review

Esta segunda leitura compara as capturas mobile e desktop já existentes. A ordem visual foi avaliada pelo primeiro elemento percebido, pela proximidade da ação seguinte e pelo custo de leitura. As recomendações são propostas; nenhuma foi implementada. As capturas de combate e resultados continuam a representar fixtures sintéticas.

| Interface e elemento | Leitura crítica e problema concreto | Solução recomendada / impacto esperado | Prioridade | Evidência |
|---|---|---|---|---|
| Camp · personagem e preparação | A personagem e o cenário dominam corretamente a primeira leitura; porém, no mobile há seleção de Expedition e Start junto à personagem e novamente no painel Prepare. A repetição alonga a página e torna incerto qual bloco é o principal. | Manter uma ação primária sempre acessível e tornar a preparação inferior um resumo compacto de dificuldade, duração e recompensas. Preservar a arte. Reduz scroll e clarifica a próxima ação. | Necessária · P2 | [mobile](screenshots/main/camp/camp-mobile-390x844.jpg), [desktop](screenshots/main/camp/camp-desktop-1440x900.jpg) |
| Camp · atributos e equipamento | Atributos estão depois de uma personagem alta; o jogador vê primeiro equipamento, mas só descobre a consequência estatística ao descer. | Aproximar o resumo dos cinco atributos do limite inferior da composição, com detalhes de combate recolhíveis. Melhora a ligação equipamento → stats. | Opcional · P3 | [mobile](screenshots/main/camp/camp-mobile-390x844.jpg), [desktop](screenshots/main/camp/camp-desktop-1440x900.jpg) |
| Inventory · equipamento e stash | A personagem é a âncora visual; o inventário é uma tarefa de triagem. Raridade, nível, NEW e setas de comparação competem em slots pequenos. | Mostrar primeiro item, raridade e diferença principal; mover detalhes numéricos para inspeção. Manter filtros e ordenação junto à grelha. Torna a triagem mais rápida. | Necessária · P2 | [mobile](screenshots/inventory/equipment/inventory-mobile-390x844.jpg), [desktop](screenshots/inventory/equipment/inventory-desktop-1440x900.jpg) |
| City Center · serviços | A navegação Blacksmith/Merchant/Apothecary tem destaque suficiente, mas Forge e Legendary Reinforcement parecem uma segunda navegação do mesmo nível. | Indicar claramente serviço ativo e operação ativa por cabeçalho contextual, preservando tabs e cores. Reduz a dúvida sobre onde o jogador está. | Opcional · P3 | [Forge mobile](screenshots/city-center/forge/forge-mobile-390x844.jpg), [Merchant desktop](screenshots/city-center/merchant/merchant-desktop-1440x900.jpg) |
| Forge · custo e resultado | Arte e texto de preview atraem atenção antes de custo, investimento e probabilidades; em mobile a decisão exige scroll. | Manter no primeiro bloco compacto item previsto, custo total e chance relevante; deixar explicação detalhada de odds imediatamente abaixo. A decisão pode ser tomada sem percorrer todo o painel. | Necessária · P2 | [mobile](screenshots/city-center/forge/forge-mobile-390x844.jpg), [desktop](screenshots/city-center/forge/forge-desktop-1440x900.jpg) |
| Merchant e Apothecary · ofertas | O preço e Buy aparecem dentro de cada cartão, uma associação correta. No Apothecary, quatro cartões verticais tornam Reroll remoto no mobile. | Manter preço e Buy por oferta; mostrar o custo de Reroll num pequeno cabeçalho antes da lista, conservando o controlo no fim. A existência da alternativa fica visível cedo. | Opcional · P3 | [Apothecary mobile](screenshots/city-center/apothecary/apothecary-mobile-390x844.jpg), [Merchant desktop](screenshots/city-center/merchant/merchant-desktop-1440x900.jpg) |
| Shrine · runas vazias | Os três slots vazios são legíveis, mas a explicação ocupa atenção acima da condição de desbloqueio; a frase atual ainda informa a frequência errada. | Corrigir primeiro a condição; em seguida, colocar uma frase curta de desbloqueio junto aos slots e detalhes de permanência em texto secundário. Próximo passo e benefício tornam-se claros. | Necessária · P0 | [mobile](screenshots/shrine/runes/shrine-mobile-390x844.jpg), [desktop](screenshots/shrine/runes/shrine-desktop-1440x900.jpg) |
| Between Realms · Realm | A ação Enter Realm deve ser o destino da leitura, mas painel de estado, retrato e navegação dividem atenção. | Ordenar resumo de Realm, estado de HP/Mana e ação numa sequência curta; manter equipamento e passivos nas tabs próprias. A entrada fica evidente sem ocultar risco. | Opcional · P3 | [mobile](screenshots/between-realms/realm/between-realm-mobile-390x844.jpg), [desktop](screenshots/between-realms/realm/between-realm-desktop-1440x900.jpg) |
| Between Realms · Stats & Passives | O passive abaixo dos stats respeita a ordem esperada, mas buffs/descrições completas aumentam a altura e enfraquecem a leitura comparativa. | Mostrar nome, ícone e efeito resumido no cartão; descrição longa em details. Mantém associação e reduz scroll. | Opcional · P3 | [mobile](screenshots/between-realms/stats-passives/between-stats-passives-mobile-390x844.jpg), [desktop](screenshots/between-realms/stats-passives/between-stats-passives-desktop-1440x900.jpg) |
| Combat · HP, Mana e condições | A arte de ambos os combatentes chama primeiro a atenção, como convém; os números de HP, condições e velocidade aparecem muito pequenos. Barras vermelhas semelhantes exigem ler rótulos para distinguir lados. | Aumentar a proeminência do valor atual/máximo de HP e dos efeitos ativos, agrupando condições com o combatente afetado; manter Mana visível quando aplicável. Uma diferença semântica entre barras pode ajudar, mas nunca substituir nomes/valores. Melhora leitura instantânea. | Necessária · P2 | [mobile](screenshots/expedition/combat/combat-mobile-390x844.jpg), [desktop](screenshots/expedition/combat/combat-desktop-1440x900.jpg) |
| Event · decisão | As opções e os custos pertencem ao mesmo bloco, o que é adequado; instruções genéricas antes das opções acrescentam leitura sem ajudar a comparar. | Encurtar instrução e repetir custo/efeito em cada opção, incluindo opção indisponível. Reduz dependência de contexto. | Necessária · P2 | [mobile](screenshots/expedition/event-decision/event-decision-mobile-390x844.jpg), [desktop](screenshots/expedition/event-decision/event-decision-desktop-1440x900.jpg) |
| Escolha de passivos · três cartas | A iconografia e os nomes são o primeiro sinal correto, mas descrições, upgrade/discovery e números pequenos exigem leitura sequencial dos três cartões. | Normalizar cada cartão em ordem: nome, tipo, efeito, mudança numérica/limite. Manter a mesma altura visual sempre que possível. Facilita comparação sem reduzir fonte. | Necessária · P2 | [mobile](screenshots/expedition/passive-choice/passive-choice-mobile-390x844.jpg), [desktop](screenshots/expedition/passive-choice/passive-choice-desktop-1440x900.jpg) |
| Affinity e Magic · modais | Os seis símbolos orientam a seleção; Magic abre sobre o modal anterior, e o texto da terceira opção alonga a segunda janela. | Fazer a escolha do elemento como passo único do mesmo fluxo modal; usar descrições de extensão semelhante, conservando a mecânica completa em detalhes secundários. Reduz carga e corrige a pilha de foco. | Necessária · P1 | [affinity mobile](screenshots/dialogs/initial-affinity/initial-affinity-mobile-390x844.jpg), [Magic desktop](screenshots/dialogs/magic-element/magic-element-desktop-1440x900.jpg) |
| Pop-ups Account, Leaderboard, item e confirmação | A moldura dá identidade sem dominar o título. Close é encontrável; em item detalhado, várias ações finais podem competir. | Manter o título e a ação decisiva no primeiro plano; agrupar ações secundárias e destrutivas com rótulos específicos, sem aproximar Confirm de Cancel. Mantém foco na decisão. | Opcional · P3 | [item mobile](screenshots/interaction-states/inventory-item-details-mobile-390x844.jpg), [Account desktop](screenshots/dialogs/account/account-desktop-1440x900.jpg) |
| Resultados · Realm, morte, extração e vitória | Título e desfecho distinguem os estados. As listas longas de loot e métricas podem relegar a ação seguinte para baixo da dobra. | Ordenar por resultado, o que ficou/foi perdido, ação seguinte e depois métricas detalhadas. Melhora entendimento sem retirar dados. Validar com uma partida completa antes de alterar. | Opcional · P3 | [extraction mobile](screenshots/results/extraction-summary/extraction-summary-mobile-390x844.jpg), [victory desktop](screenshots/results/expedition-completed/expedition-completed-desktop-1440x900.jpg) |

### Inventário de UX Writing ampliado

O inventário abaixo complementa as 20 propostas da secção 7. Decisões **manter** preservam termos que já correspondem ao fluxo. Propostas de texto que descrevem regras foram confrontadas com `index.html` e com os testes citados; quando a mecânica não foi exercitada, a sugestão fica condicionada a uma validação funcional.

| Texto/elemento | Decisão | Razão e proposta |
|---|---|---|
| `Start Expedition`, `Enter Realm`, `Extract & Leave` | Manter | Verbos diretos e distintos; o código usa as ações para iniciar a run, entrar no próximo Realm e terminar a Expedition. |
| `No active Expedition` | Manter | Estado curto e verificável no Camp. |
| `15 Realms, 3–4 events and a final boss` | Manter após confirmação de geração | Informação de compromisso útil junto de Start; conferir limites na configuração de progressão antes de publicar tradução. |
| `Equipment, Gold and Fragments` | Reescrever | Frase nominal sem verbo: “Find equipment, Gold, and Fragments.” |
| `Defeat the boss to unlock the next Expedition` | Manter | Explica consequência da vitória e é coerente com o fluxo de progresso mostrado no código. |
| `Local playtest · saved in this tab` | Manter | Estado de persistência útil; conservar próximo da informação de save, sem o repetir no conteúdo principal. |
| `Set bonuses: none active` | Manter | Feedback curto; esconder apenas se o painel de set bonuses já mostrar exatamente o mesmo estado. |
| `Compare`, `Buy`, `Reroll`, `Owned` | Manter | Rótulos curtos; mostrar o custo junto à ação e manter `Owned` como contexto da quantidade. |
| `Random subtype: artwork shows the slot only` | Encurtar | A regra de subtype só interessa ao confirmar Craft; usar a proposta #18 da secção 7 junto ao preview, sem tooltip obrigatório. |
| `Currently equipped · actual upgrade is calculated after crafting` | Transferir para detalhe | Explicação importante para evitar falsa promessa; mostrar ao lado da estimativa, sem competir com custo e odds. |
| `Legendary items only drop from dungeon enemies` | Manter se regra confirmada | Afirmação de obtenção que deve permanecer visível nas odds, depois de cotejada com todos os caminhos de loot. |
| `Choose one of the six affinities to begin` | Manter com simplificação | Número ajuda a orientar a grelha; retirar apenas a frase técnica sobre progressão existente. |
| `View passive` / `Choose element` | Manter | Distinguem inspeção de passivo e segundo passo da Magic. Preservar estados aberto/fechado acessíveis. |
| `Funded` em Fire/Frost/Lightning | Reescrever após confirmação | O código apresenta os três textos em `openInitialElementModal`; verificar se o gatilho é Mana disponível antes de trocar por “Mana-funded”. |
| `Active Buffs None` | Encurtar | “No active buffs” quando vazio; quando há efeitos, listar cada um com duração/valor. |
| `Physical attacks · Mana not used · Barrier 0` | Transferir parcialmente | Em combate físico, “Mana not used” é esclarecimento de build; deixar Barrier visível e pôr a explicação de Mana em detalhe secundário. |
| `Automatic combat · one enemy at a time` | Encurtar | “Auto-combat · 1 enemy at a time”; manter visível perto de Speed até o jogador compreender o modo. |
| `Run Loot`, `Valuables`, `Expedition Log` | Manter | Termos distintos para itens, tesouros e histórico; manter depois do estado da batalha. |
| `No equipment found yet` / `No valuables found yet` | Manter | Estados vazios específicos, sem promessa de drop. |
| `Choose one Realm passive` | Manter | Comando claro; melhorar a comparação das opções antes de alterar o título. |
| `Passive upgrades exhausted` | Reescrever condicionalmente | Se nenhum passive elegível existir, dizer “No passive upgrades available”; verificar a fixture de elegibilidade antes de alterar. |
| `Need 28 Gold; current balance is 0` | Manter formato, valor dinâmico | O código calcula custo com a Expedition (`25 + 3 × expedition`), por isso nenhuma proposta deve fixar 28 Gold em copy estática. |
| `Gear and potions locked` | Manter | Aviso de restrição útil no encontro; pode ser abreviado apenas se o estado bloqueado for visível nos controlos. |
| `Shared rankings are unavailable in this playtest` | Reescrever | Usar a proposta #20; evita promessa técnica de publicação. |

### Legibilidade e contraste

As capturas mostram texto secundário de 10–12 px nos slots, na linha de stats do combate, nos preços/estados e em algumas descrições de passivos. Em resolução 390 px, os valores abaixo das barras são especialmente difíceis de localizar. A leitura manual permite identificar risco de tamanho e de fundo variável; **não permite atribuir uma razão de contraste WCAG confiável a pixels de screenshots JPEG**. O Axe devolveu `color-contrast` incompleto para os 92 estados. É necessário medir a cor computada do texto contra os pixels efetivos da camada composta, incluindo estados de hover/disabled e imagem de cenário, e verificar a 200% de zoom em browser. Essa medição e a prova de reflow a 200% não fazem parte desta segunda leitura; o contraste AA permanece **não demonstrado**. Uma prioridade concreta é garantir pelo menos 14 px de fonte para informação de decisão, sem alargar cartões até criar overflow.

### Plano único priorizado das duas leituras

1. **P0 · Correção necessária:** alinhar texto e estado vazio do Shrine com a regra real de recompensa de Rune; confirmar no código de runtime e testes antes de publicar.
2. **P1 · Correção necessária:** resolver a sequência Affinity → Magic num único fluxo modal, IDs únicos e foco previsível; corrigir slots de poções sem role e normalizar teclado nas tabs.
3. **P1 · Correção necessária:** corrigir headings/landmarks e `alt` redundante conforme a secção 6; verificar manualmente foco e zoom.
4. **P2 · Correção necessária:** tornar HP, Mana e condições legíveis imediatamente no combate; estruturar custo/efeito nos eventos, Forge e escolha de passivos; eliminar a ambiguidade do CTA duplicado no Camp mobile.
5. **P2 · Correção necessária:** aplicar apenas copy mecanicamente confirmada da secção 7 e deste inventário; usar o mesmo vocabulário para Expedition, Realm, Rune, Fragments e Mana.
6. **P3 · Melhoria opcional:** compactar explicações longas em Apothecary, Between Realms e resultados, preservar detalhes acessíveis; melhorar distinção dos níveis de City Center e hierarquia de ações nos pop-ups.
7. **Validação antes de declarar conformidade:** medir contraste nos fundos compostos e testar reflow a 200%; repetir capturas mobile/desktop e uma partida real para os resultados. Safari real continua pendente de ambiente compatível.
