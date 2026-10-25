# Wanderer v0.12 — C.2.1: resultados da calibração Legendary

Data: 2026-10-21. Destino: `development`. **Estado: PARTIAL** — Heartroot calibrado; coeficientes de Veil pendentes de teste direcionado.

## Proveniência e gates

- Fonte: commit `81809fcdcf2457fb922e38fd366724f55bc9cbc2`; [Actions C.2.1 #39590316980](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39590316980) **success**; artefacto `wanderer-c21-calibration-81809fcdcf2457fb922e38fd366724f55bc9cbc2`, ID `12343612098`, SHA-256 `086f19452eeb9b15dab7d1d5b760acc60fa93aebdcc37e2564a77c1247e050c8`. O JSON completo e o log de resumos foram analisados; nenhuma matriz local foi repetida.
- **24.192/24.192** corridas (`complete=true`), **0 erros**, **0 timeouts**, 189 células com **128 corridas cada** (64 seeds × 2 políticas). No máximo 2 Legendaries por perfil.
- Controlo negativo `Gravewake + Eye of Morrow`: **384/384** pares idênticos em todos os campos de resultado; 0 divergências. Baseline C.2 reproduzido: Sword `Oathwall + Veil` E200 **110/128**; `Verdant + Veil` E50 **76/128**, E200 **121/128**.
- O [Actions C.2.1 #39591039638](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39591039638) concluiu simulação, relatório e upload, mas terminou **failure** apenas porque o commit automático do relatório encontrou `development` avançada e o push foi rejeitado. O artefacto da execução anterior, concluída com sucesso, sustenta esta decisão.
- Commit de implementação Heartroot: `c94c3b5` (`development`). A variante Heartroot do VM equivale exatamente ao runtime desse commit; as outras fórmulas de combate ficam inalteradas.

## Desenho

E50/E100/E200; sete builds Epic equivalentes; três Runas equivalentes; `triple` e `random` com as mesmas seeds, streams de controlo e decisões pareadas; sem poções, Legendaries acima de dois, upgrades de loot ou benefícios de eventos. O equipamento Legendary sintético mantém atributos Epic, isolando os efeitos. Sobrevivência diferente pode levar a ofertas e passivos posteriores diferentes. Resultados não representam taxas de jogadores.

| Efeito | Antes | Variante testada | Decisão |
|---|---:|---:|---|
| Veil Barrier normal/Aegis por Realm | 4% / 6% Max HP | 2,5% / 4% | **Conservar antes** |
| Veil próximo ataque normal/Aegis | +30% / +45% dano-base | +20% / +30% | **Conservar antes** |
| Heartroot regen normal/Vitality | 0,30% / 0,45% Max HP/s | 0,20% / 0,30% | **Aplicar variante** |
| Heartroot cap por Realm | 15% Max HP | 10% | **Aplicar variante** |

## Resultado por build e nível: baseline → Heartroot aplicado

Clears têm denominador 128. Cada linha usa um par representativo da build. Quando o par não contém Heartroot, os números permanecem iguais; isso é um controlo de escopo. Realm é a média alcançada, DPS, cura/s e Barrier/s são médias de combate.

| E | Build; par | Vitórias | Realm | DPS | Cura/s | Barrier/s |
|---|---|---:|---:|---:|---:|---:|
| E50 | Cloth Staff; Heartroot + Veil | 8→8 | 12.84→12.57 | 681→678 | 4.4→3.2 | 28.5→28.5 |
| E50 | Cloth Wand + Orb; Heartroot + Veil | 3→2 | 11.78→11.47 | 615→613 | 4.2→2.9 | 25.9→25.8 |
| E50 | Plate Sword + Shield; Oathwall + Veil | 54→54 | 13.78→13.78 | 479→479 | 11.0→11.0 | 21.0→21.0 |
| E50 | Plate Mace + Shield; Oathwall + Heartroot | 25→22 | 12.49→11.83 | 420→417 | 17.3→14.2 | 2.8→2.6 |
| E50 | Leather Dual Daggers; Heartroot + Chalice | 83→79 | 14.97→14.95 | 941→941 | 6.3→5.6 | 2.5→2.4 |
| E50 | Leather Bow; Heartroot + Veil | 90→84 | 14.95→14.94 | 899→899 | 4.7→3.9 | 18.7→18.7 |
| E50 | Leather Two-Handed; Heartroot + Veil | 82→75 | 14.88→14.86 | 847→847 | 4.7→3.8 | 24.0→24.0 |
| E100 | Cloth Staff; Heartroot + Veil | 24→20 | 13.27→13.00 | 1535→1532 | 8.3→5.9 | 59.0→58.9 |
| E100 | Cloth Wand + Orb; Heartroot + Veil | 12→12 | 12.29→12.10 | 1438→1437 | 8.0→5.6 | 55.0→54.8 |
| E100 | Plate Sword + Shield; Oathwall + Veil | 85→85 | 14.75→14.75 | 1047→1047 | 21.4→21.4 | 44.2→44.2 |
| E100 | Plate Mace + Shield; Oathwall + Heartroot | 61→50 | 13.72→13.34 | 979→976 | 34.0→28.6 | 6.2→6.1 |
| E100 | Leather Dual Daggers; Heartroot + Chalice | 67→66 | 14.92→14.92 | 1854→1855 | 10.7→9.3 | 4.9→4.9 |
| E100 | Leather Bow; Heartroot + Veil | 72→69 | 14.75→14.71 | 1847→1847 | 8.0→6.5 | 37.9→38.0 |
| E100 | Leather Two-Handed; Heartroot + Veil | 80→75 | 14.78→14.73 | 1702→1701 | 8.0→6.4 | 47.0→47.1 |
| E200 | Cloth Staff; Heartroot + Veil | 84→80 | 14.40→14.34 | 3548→3545 | 13.2→10.1 | 123.2→123.3 |
| E200 | Cloth Wand + Orb; Heartroot + Veil | 55→54 | 13.41→13.16 | 3271→3260 | 14.0→10.0 | 114.5→114.2 |
| E200 | Plate Sword + Shield; Oathwall + Veil | 110→110 | 14.97→14.97 | 2511→2511 | 46.0→46.0 | 93.8→93.8 |
| E200 | Plate Mace + Shield; Oathwall + Heartroot | 90→82 | 14.80→14.73 | 2549→2545 | 71.2→62.0 | 9.1→9.1 |
| E200 | Leather Dual Daggers; Heartroot + Chalice | 72→71 | 15.00→15.00 | 3652→3652 | 18.8→16.6 | 9.1→9.1 |
| E200 | Leather Bow; Heartroot + Veil | 114→113 | 15.00→15.00 | 4021→4021 | 10.1→8.9 | 78.8→78.8 |
| E200 | Leather Two-Handed; Heartroot + Veil | 123→121 | 15.00→15.00 | 4059→4059 | 9.7→8.5 | 102.4→102.4 |

## Hipótese Veil: ganhos de equilíbrio e perdas colaterais

A tabela mostra a variante **não aplicada** de Veil, mantendo Heartroot original para isolar o efeito. `triple/random` separa os 64 seeds de cada política.

| E | Par | Vitórias base→Veil | Triple base→Veil | Random base→Veil | Realm base→Veil | Barrier/s base→Veil | DPS base→Veil |
|---|---|---:|---:|---:|---:|---:|---:|
| E50 | Staff: Veil + Heartroot | 8→7 | 1→1 | 7→6 | 12.84→11.76 | 28.5→22.2 | 681→670 |
| E50 | Wand: Voidglass + Veil | 13→4 | 7→3 | 6→1 | 12.77→11.74 | 28.5→21.8 | 713→703 |
| E50 | Sword: Oathwall + Veil | 54→31 | 46→28 | 8→3 | 13.78→12.91 | 21.0→14.8 | 479→474 |
| E50 | Sword: Verdant + Veil | 76→57 | 58→46 | 18→11 | 14.73→14.20 | 22.1→15.5 | 510→504 |
| E50 | Bow: Veil + Heartroot | 90→77 | 57→52 | 33→25 | 14.95→14.87 | 18.7→12.0 | 899→899 |
| E50 | Two-Handed: Veil + Heartroot | 82→67 | 51→46 | 31→21 | 14.88→14.76 | 24.0→17.7 | 847→845 |
| E100 | Staff: Veil + Heartroot | 24→14 | 7→4 | 17→10 | 13.27→11.95 | 59.0→44.9 | 1535→1518 |
| E100 | Wand: Voidglass + Veil | 41→22 | 18→8 | 23→14 | 14.18→13.20 | 60.7→46.0 | 1650→1623 |
| E100 | Sword: Oathwall + Veil | 85→64 | 59→48 | 26→16 | 14.75→14.23 | 44.2→31.4 | 1047→1039 |
| E100 | Sword: Verdant + Veil | 110→90 | 62→60 | 48→30 | 14.84→14.79 | 45.9→32.5 | 1100→1092 |
| E100 | Bow: Veil + Heartroot | 72→60 | 43→37 | 29→23 | 14.75→14.48 | 37.9→24.4 | 1847→1846 |
| E100 | Two-Handed: Veil + Heartroot | 80→65 | 48→43 | 32→22 | 14.78→14.48 | 47.0→34.5 | 1702→1692 |
| E200 | Staff: Veil + Heartroot | 84→70 | 40→30 | 44→40 | 14.40→14.00 | 123.2→95.1 | 3548→3529 |
| E200 | Wand: Voidglass + Veil | 85→76 | 39→35 | 46→41 | 14.62→14.27 | 124.1→94.8 | 3682→3666 |
| E200 | Sword: Oathwall + Veil | 110→95 | 61→61 | 49→34 | 14.97→14.90 | 93.8→64.7 | 2511→2495 |
| E200 | Sword: Verdant + Veil | 121→111 | 64→62 | 57→49 | 15.00→14.99 | 96.8→66.7 | 2608→2597 |
| E200 | Bow: Veil + Heartroot | 114→108 | 59→56 | 55→52 | 15.00→15.00 | 78.8→50.5 | 4021→4016 |
| E200 | Two-Handed: Veil + Heartroot | 123→119 | 63→62 | 60→57 | 15.00→15.00 | 102.4→73.9 | 4059→4055 |

## Outros pares e controlo

| E | Perfil | Base→Heartroot | Cura/s base→Heartroot | EHP observado base→Heartroot | Triple base→Heartroot | Random base→Heartroot |
|---|---|---:|---:|---:|---:|---:|
| E50 | Mace: Oathwall + Heartroot | 25→22 | 17.3→14.2 | 3645→3350 | 21→19 | 4→3 |
| E50 | Daggers: Heartroot + Chalice | 83→79 | 6.3→5.6 | 1812→1783 | 53→52 | 30→27 |
| E50 | Staff: Veil + Heartroot | 8→8 | 4.4→3.2 | 2769→2691 | 1→1 | 7→7 |
| E50 | Wand: Veil + Heartroot | 3→2 | 4.2→2.9 | 2702→2606 | 0→0 | 3→2 |
| E100 | Mace: Oathwall + Heartroot | 61→50 | 34.0→28.6 | 6833→6416 | 41→34 | 20→16 |
| E100 | Daggers: Heartroot + Chalice | 67→66 | 10.7→9.3 | 3353→3296 | 36→36 | 31→30 |
| E100 | Staff: Veil + Heartroot | 24→20 | 8.3→5.9 | 5042→4903 | 7→6 | 17→14 |
| E100 | Wand: Veil + Heartroot | 12→12 | 8.0→5.6 | 4945→4821 | 4→4 | 8→8 |
| E200 | Mace: Oathwall + Heartroot | 90→82 | 71.2→62.0 | 12756→12190 | 52→49 | 38→33 |
| E200 | Daggers: Heartroot + Chalice | 72→71 | 18.8→16.6 | 6401→6306 | 32→32 | 40→39 |
| E200 | Staff: Veil + Heartroot | 84→80 | 13.2→10.1 | 8726→8581 | 40→37 | 44→43 |
| E200 | Wand: Veil + Heartroot | 55→54 | 14.0→10.0 | 9063→8846 | 26→26 | 29→28 |

`Gravewake + Eye of Morrow` (Two-Handed) manteve E50 **53/128**, E100 **36/128** e E200 **100/128** em todas as variantes; DPS, cura, Barrier, Realm e procs também foram idênticos nos 384 pares.

## Interpretação

- **Heartroot:** reduz a cura/s de `Oathwall + Heartroot` em Mace de 17,3→14,2 (E50), 34,0→28,6 (E100), 71,2→62,0 (E200), com vitórias 25→22, 61→50 e 90→82. Daggers `Heartroot + Chalice` mantém 83→79, 67→66 e 72→71. Staff `Veil + Heartroot` mantém 8→8, 24→20 e 84→80; Wand `Veil + Heartroot` mantém 3→2, 12→12 e 55→54. A redução é mensurável nos tanques, sem colapso nas builds Cloth; foi aplicada.
- **Veil:** a hipótese reduz `Oathwall + Veil` em Sword de 54→31 (E50), 85→64 (E100), 110→95 (E200), mas `Verdant + Veil` continua 57/128 em E50 e 111/128 em E200. Em Wand `Voidglass + Veil`, reduz 13→4 (E50), 41→22 (E100), 85→76 (E200); em Staff `Veil + Heartroot`, 24→14 em E100. Assim, a variante atinge fortemente builds já fracas e não elimina a dominância Sword; não foi aplicada.
- **Ambos:** Bow `Veil + Heartroot` passa 90→70 em E50, 72→59 em E100, 114→105 em E200; Two-Handed 82→64, 80→61, 123→115. Staff 8→6, 24→13, 84→67; Wand 3→1, 12→7, 55→43. A combinação herda o problema de Veil e não foi aplicada.
- **Políticas:** triple vs random altera fortemente Sword E50 (`Oathwall + Veil` 46/64 vs 8/64 no baseline) e os resultados Cloth podem inverter a vantagem (Staff `Veil + Heartroot` E50 1/64 vs 7/64). Os resultados por política constam das tabelas. O planeamento de affinities não deve ser confundido com ganho do item.

## Alterações, limites e próximos testes

- Alterados apenas a taxa e o cap de Heartroot em `combat/v012-combat-runtime.js`, a descrição em `combat/legendary.js` e os testes numéricos. Veil, Oathwall, Verdant e os outros 10 poderes permanecem com os coeficientes anteriores. Odds, drops e limite de 2 não foram alterados.
- Para fechar Veil, testar em separado **só Barrier** e **só bónus ofensivo**, além da combinação, com seeds pareadas adicionais em E50/E100/E200 para `Voidglass + Veil`, `Oathwall + Veil`, `Verdant + Veil`, Staff `Veil + Heartroot`, Bow e Two-Handed. Relatar por política, afinities desbloqueadas, Realm, DPS, Barrier/s e EHP. Não há coeficiente intermédio aprovado por esta matriz.
- O script histórico `scripts/v012-phase-c21-legendary-calibration.cjs` reproduz esta matriz no commit fonte `81809fc`. Após o ajuste de Heartroot, os padrões literais de baseline antigos já não existem no runtime HEAD; para repetir exatamente a experiência histórica, usar esse commit e o artefacto versionado pelo Actions. Não executar a matriz novamente sem necessidade.
- Sem leitura/escrita de saves reais, Firebase, Railway ou deploy; `main` não foi alterada.

## Testes e estado

- `node --test tests/v012-phase-c1.test.cjs tests/v012-legendary-limit.test.cjs`: **PASS** (2 ficheiros; novo teste verifica 0,20%/0,30% e cap 10%).
- `npm test` local: **23/24 PASS**; falha apenas `tests/private-preview.test.mjs`, pois o sandbox bloqueia `listen` em `127.0.0.1` com `EPERM`. O mesmo teste falhava antes deste ajuste; a regressão remota passou.
- [GitHub Actions development #39595851552](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39595851552), commit `c94c3b5ab5b2b09d7d52a2dafc901341ec3b9095`: **PASS** na regressão remota.
- Paridade do runtime da variante Heartroot com a produção: **PASS**, comparação integral do fonte após as duas substituições da experiência.
- Estado final **PARTIAL**: Heartroot **PASS/aplicado**; Veil **pendente**; nenhuma alteração global aos 12 Legendaries.

