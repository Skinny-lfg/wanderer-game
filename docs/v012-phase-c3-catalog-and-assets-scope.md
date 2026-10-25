# Wanderer v0.12 — Fase C.3: catálogo e integração visual

**Registo:** 2026-10-21 · **Branch autorizada:** `development` · **Estado:** âmbito aprovado para planeamento, implementação pendente até C.2.

## Objetivo e dependências
A C.3 inclui os 12 novos Legendaries **e** a revisão visual do catálogo completo, equipamento por Cloth/Leather/Plate, os 12 novos backgrounds de dungeons e os ícones de seis affinities + três escolhas elementais de Magic. Não incluir imagens definitivas dos restantes passivos: o utilizador ainda as está a construir.

Esta fase é integração de conteúdo/UX, **não** um rebalanceamento. Preservar o limite de **2 Legendaries equipados**. Não alterar `main`, Railway, Firebase rules, saves reais ou taxas de drop sem autorização posterior.

## Equipment / armor mapping
Origem Google Drive: `Wanderer - Game Development/02 - Assets/Packs/01 - Equipment`.
- `01 - Armor - Cloth`: `armor_cloth_astral_{helmet,chest,gloves,belt,boots}.png` e `armor_cloth_bloodweave_{helmet,chest,gloves,belt,boots}.png`.
- `02 - Armor - Leather`: `armor_leather_wayfarer_{helmet,chest,gloves,belt,boots}.png` e `armor_leather_nightstalker_{helmet,chest,gloves,belt,boots}.png`.
- `03 - Armor - Plate`: `armor_plate_dawnward_{helmet,chest,gloves,belt,boots}.png` e `armor_plate_ironbound_{helmet,chest,gloves,belt,boots}.png`.
- `08 - Placeholders`: manter todos os fallbacks para slots vazios e itens sem arte, incluindo stash, equip, blacksmith/forge, merchant e loot.
- Antes de retirar equipamento do catálogo de geração, comparar os IDs do runtime com o manifest de arte; não inventar IDs nem classes por existir um PNG. Remover itens/visuais obsoletos **apenas do catálogo ativo**, preservando saves existentes e as fontes na Drive. Registrar descontinuados para possível migração futura.
- 12 novos Legendary IDs da C.1 mapeados para imagens finais por ID; nunca restaurar os 22 Legendaries antigos nos novos drops.

## Dungeon backgrounds (12 PNGs verificados)
Origem: `02 - Assets/Packs/06 - Backgrounds & Dungeons/02 - Dungeon Backgrounds/Wanderer_Dungeon_Backgrounds_v0_9`.

| Affinity | Dungeon A | Dungeon B |
| --- | --- | --- |
| Blood | `blood_crimson_dominion.png` | `blood_bloodscar_wastes.png` |
| Decay | `decay_venomreach.png` | `decay_umbral_hollow.png` |
| Vitality | `vitality_verdant_wilds.png` | `vitality_everroot_vale.png` |
| Aegis | `aegis_warded_marches.png` | `aegis_drowned_bastion.png` |
| Fury | `fury_gravewind_barrens.png` | `fury_ironbound_frontier.png` |
| Magic | `magic_ashen_aether.png` | `magic_stormglass_beyond.png` |

Manter estes nomes e mapear corretamente ao identificador da dungeon; não trocar artes aleatoriamente. Preparar cópias web-ready no repo preservando o PNG original na Drive.

## Affinity icons
Origem: `02 - Assets/Packs/04 - Affinities & Runes/01 - Affinities`.
- Para `blood`, `decay`, `vitality`, `aegis`, `fury` e `magic`, existe uma pasta com `affinity_<family>.png` e `affinity_<family>_master.png`. Usar a versão legível em tamanho pequeno e preservar os masters.
- Magic: três escolhas elementais `fire`, `frost`, `lightning`, com assets existentes em `Magic/Passives/Elemental Spells`: `kindling_fire.png`, `deep_winter_frost.png`, `overcharge_lightning.png`; não tratar estas imagens como confirmação de que toda a série de passivos está finalizada.
- Restantes passivos: **pendente do utilizador**, manter placeholders e contrato `passive_id -> image` sem inventar conteúdos.

## Critérios de aceitação
1. Manifest estático e verificável `id -> image -> armorType/slot` (sem depender da ordem de diretórios e com fallback funcional).
2. Nenhum item inexistente aparece em novos drops ou UI de criação; itens legados nos saves não são apagados.
3. Ícones corretos de Blood/Decay/Vitality/Aegis/Fury/Magic e Fire/Frost/Lightning, legíveis em mobile.
4. As 12 dungeons mostram o background correspondente e textos legíveis; carregamento otimizado e sem quebrar mobile.
5. Sem regressões em equip, stash, forge, merchant, drops, renderização de Legendaries, passivos e navegação.
6. Testes automatizados e screenshot/QA desktop + mobile; apenas `development`. **D — Endless** só depois da C.3.

Registo paralelo no backlog permanente da Drive: [Wanderer — v0.12.0, melhorias pós-integração](https://docs.google.com/document/d/1UBoyYDtvi9x5VQbXR15jThR2aOQNzXUgkHr0oZlT8ss/edit).
