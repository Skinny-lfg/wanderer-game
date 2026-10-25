# Wanderer v0.12 — Fase UI.3: City Center, affinities e Extraction

Estado: **implementada e validada localmente em `development`; publicação pendente de nova autorização**. Base remota: UI.1 `7a53f1d`. As capturas desktop/mobile estão em `docs/ui3-screenshots/`.

## Alterações

- **City Center:** as três tabs e a área reservada a cada NPC continuam a usar os componentes existentes. O Blacksmith apresenta atalhos para Forge e Legendary Reinforcement; os seletores e o botão Craft ficam no bloco principal, com Crafting Odds num painel lateral compacto. O preview identifica explicitamente o subtipo aleatório. O Merchant mostra quatro ofertas por categoria e duas colunas no desktop; preço, Compare e Buy têm posições estáveis. Apothecary conserva quatro ofertas após geração ou Reroll, com imagem, nome, raridade, efeito, preço e Buy alinhados.
- **Affinities:** as seis escolhas iniciais mostram ícone, identidade curta e o passive inicial derivado do catálogo atual; os detalhes apresentam a descrição existente. Blood e Magic mantêm exatamente a seleção anterior, incluindo a escolha do elemento Magic. No código atual, a tab **Shrine** gere Runas; as escolhas de affinities ocorrem após Start Expedition. A melhoria foi aplicada nesse ponto real do fluxo, sem duplicar seleção na tab Shrine.
- **Extraction Complete:** o resultado usa os dados já calculados para destacar Realms, Gold, Fragments, Combat Time, Damage Dealt/Taken, equipamento e treasures mantidos/perdidos, passivos e o log expansível. Return to Camp aparece no primeiro ecrã. Estados vazios ocupam uma linha compacta. Os itens ainda existentes mostram a imagem real; itens perdidos usam o ícone do slot, pois o resumo persistido não guarda a imagem do item.

## Validação

| Verificação | Resultado |
|---|---|
| Sintaxe do script inline (`node --check`) e `git diff --check` | PASS |
| `tests/v012-ui3-browser.cjs`: 1440×900, 1280×720, 1024×768, 768×1024, 390×844, 360×800 | PASS (6/6) |
| Merchant: quatro posições em Weapons/Armor/Accessories, categoria estável, Compare, Buy e Restock com custo atual | PASS |
| Blacksmith Craft; Apothecary quatro ofertas, imagens válidas, tab estável, Buy e Reroll | PASS |
| Affinity Blood/Magic e elemento Magic; resumo sintético (incluindo perdas e estado vazio) e extração real com Return to Camp | PASS |
| Regressões `tests/v012-ui0-browser.cjs`, `tests/v012-ui1-browser.cjs`, `tests/v012-ui2-browser.cjs` | PASS (6/6, 6/6, 5/5) |
| Regressão `tests/v012-phase-c3-treasures-browser.cjs` | PASS (390px e 1280px) |
| Safari | **Pendente**: indisponível neste ambiente |

A primeira execução da regressão C.3 falhou por procurar a classe visual anterior no treasure do resumo. A nova carta preserva essa classe, e o teste voltou a passar. As verificações usam estado sintético e local; nenhuma conta ou save real é acedido.

**Limites conhecidos:** não existem assets de NPC confirmados neste repositório, pelo que os placeholders existentes permanecem. O resumo antigo não conserva a imagem dos itens perdidos. Métricas de dano ausentes em checkpoints antigos não são inventadas nem exibidas.

Ficheiros desta fase: `index.html`, `online/ux39.css`, `tests/v012-ui3-browser.cjs`, este relatório e oito capturas em `docs/ui3-screenshots/`. Não foram alterados gameplay, balanceamento, economia, Firebase, rules, saves reais, `main` ou deploys.
