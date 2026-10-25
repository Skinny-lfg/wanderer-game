# Wanderer v0.12 — Fase C.3: integração visual

**Data:** 2026-10-21 · **Branch:** `development` · **Estado: COMPLETE**.

## Conteúdo integrado

| Área | Estado |
| --- | --- |
| 12 novos Legendaries | Imagens WebP finais associadas aos 12 IDs estáveis. Os 22 itens antigos continuam reconhecidos nos saves; o limite de dois Legendaries mantém-se. |
| 9 ícones de affinity/Magic | Blood, Decay, Vitality, Aegis, Fury, Magic e Fire, Frost, Lightning. |
| 30 assets de armadura | Duas variantes para cada uma das cinco slots Cloth, Leather e Plate, com fallback para itens antigos. |
| 47 assets de armas, off-hands e joias | 23 armas, 12 off-hands e 12 joias, escolhidos de forma determinística por ID sem alterar os itens guardados. |
| 12 temas de dungeon / 24 backgrounds | Uma imagem desktop e uma mobile por tema. IDs e metadados de gameplay de `THEMES` preservados. |
| 6 treasures da expedition | WebP em `assets/loot/`, integrados no loot, Bag, resumo de Realm, resumo final/extração, Stash e Sell All. |

## Treasures

| ID do catálogo | Nome | Worth | Imagem |
| --- | --- | ---: | --- |
| `gem-pouch` | Gem Pouch | 8 | `assets/loot/treasure_gem_pouch.webp` |
| `jeweled-chalice` | Jeweled Chalice | 16 | `assets/loot/treasure_jeweled_chalice.webp` |
| `golden-lion-statuette` | Golden Lion Statuette | 24 | `assets/loot/treasure_golden_lion_statuette.webp` |
| `jeweled-gold-platter` | Jeweled Gold Platter | 32 | `assets/loot/treasure_jeweled_gold_platter.webp` |
| `royal-crown` | Royal Crown | 40 | `assets/loot/treasure_royal_crown.webp` |
| `ornate-chest` | Ornate Chest | 55 | `assets/loot/treasure_ornate_chest.webp` |

Cada drop mantém o seu ID único e guarda `id`, `name`, `worth` e `image`, além de `treasureType`. A chance de drop, o número de tentativas de drop e a capacidade da Bag permanecem iguais. O ID único do drop determina de forma reprodutível uma das seis variantes, sem uma nova rolagem aleatória. Os novos treasures têm os seis valores explícitos acima.

A leitura de saves antigos mapeia Antique Coins → Gem Pouch, Golden Chalice → Jeweled Chalice, Runic Gem → Gem Pouch, Ancient Idol → Golden Lion Statuette e Jeweled Crown → Royal Crown. Um nome desconhecido usa imagem/nome Gem Pouch. **O valor e o ID originais de cada valuable antigo são preservados**, incluindo os desconhecidos; a migração é feita numa cópia validada, sem escrever o payload original durante a leitura. Checkpoints antigos continuam aceites.

A auditoria do catálogo ativo não encontrou um tipo de equipamento gerado sem categoria visual: os tipos correntes de armas, off-hands, joias e armadura têm mapeamento ou fallback. Nenhum item legado foi apagado. Os restantes ícones de passivos continuam fora do âmbito C.3, conforme [o âmbito aprovado](v012-phase-c3-catalog-and-assets-scope.md).

## Validação

- `npm test`: **268/268 PASS**, incluindo os seis WebP, migração de saves antigos, recompensa, Bag, resumos, Sell All e 21 traces determinísticos com a nova representação dos treasures.
- `npm run test:browser`: **PASS** em 390px e 1280px; Expedition, save/reload, eventos, potions, equipment, Stash, Sell All, extraction summary e sem scroll horizontal nas vistas verificadas.
- `tests/v012-phase-c3-assets.test.cjs`: **PASS** para 12 Legendaries, 9 ícones, 30 armaduras, 47 equipamentos e 24 backgrounds.
- Runtime de combate, inimigos, chances de loot, progressão, Firebase, Railway e saves reais não foram alterados. Sem deploy e sem alteração de `main`.

**C.3 COMPLETE.**
