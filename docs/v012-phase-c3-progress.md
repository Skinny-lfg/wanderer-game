# Wanderer v0.12 — C.3: implementação visual

**Data:** 2026-10-21 · **Branch:** `development` · **Estado:** PARTIAL — core assets integrados, auditoria de catálogo e QA final pendentes.

## Integrado
1. **12 Legendaries:** imagens otimizadas de `10 - Game Ready (WebP)/02 - Legendaries` em `assets/legendary/*.webp`, mapeadas aos 12 `legendaryId` ativos. Antigos PNGs de staging continuam no repositório como rollback.
2. **6 affinities + 3 escolhas Magic:** Blood, Decay, Vitality, Aegis, Fury e Magic; Fire, Frost e Lightning continuam mapeados com ícones PNG pequenos. Sprites de estado/debuff não alterados.
3. **30 equipamentos de armadura:** duas artes por tipo em `Cloth` (Astral/Bloodweave), `Leather` (Nightstalker/Wayfarer), `Plate` (Dawnward/Ironbound), nas cinco slots Helm/Chest/Gloves/Boots/Belt. `itemImg` usa `item.armorType` e `item.slot`, com escolha determinística por `item.id`; ausentes/legados continuam com fallback sem alteração ao save.
4. **12 dungeons / 24 imagens:** artes desktop + mobile em `assets/dungeons/c3/`, mapeadas por ID estável. `THEMES` (ID, background histórico, loot, enemy, affinity) mantém-se idêntico para preservar testes de paridade/saves; `dungeonImage` aplica a nova imagem **só ao render**, selecionando mobile até 650px.
5. **Testes de integridade:** `tests/v012-phase-c3-assets.test.cjs` agora cobre 12 Legendaries, 9 ícones, 30 armaduras, 12 pares de dungeon. Testes de C.1 atualizados para arte WebP.

## Falhas identificadas e resoluções
- O GitHub Actions de C.3.1 falhava porque o teste histórico exigia o placeholder de Verdant Oath. Corrigido: passa a esperar a imagem real.
- O primeiro commit de backgrounds alterou `THEMES.image` e fez falhar os testes de paridade do runtime. Corrigido em commits posteriores: `THEMES.image` voltou aos paths históricos, com arte nova separada no mapa `C3_DUNGEON_ART`.
- Não declarar QA completo antes de obter GitHub Actions com sucesso no HEAD final e verificar browser mobile/desktop.

## Ainda pendente
- Integrar/reconciliar **armas e acessórios WebP** da nova pasta (potencialmente 33 armas/offhands + 12 joias) sem reintroduzir imagens de categorias inexistentes. Auditar item IDs e subtypes contra o catálogo existente antes de substituir o pool visual.
- Retirar apenas entradas verdadeiramente obsoletas do **catálogo de novos drops** depois de identificação exata; preservar compatibilidade de saves antigos. Nenhum item foi apagado.
- Arte dos restantes passivos está a ser produzida; manter placeholders.
- QA e otimização: testar apresentação em 390/320/1280px, slots equip/stash/forge, seleção Magic, fundos em mobile, ausência de 404, `npm test` e `test:browser` quando suportado. Sem deploy.

## Localização das fontes
<https://drive.google.com/drive/folders/17p9S5DV3Vj-46y2DEnu3qBnIAktkynUg>

## Restrições
Somente `development`, sem alterar `main`, Railway, Firebase, regras, saves ou balanceamento C.2.
