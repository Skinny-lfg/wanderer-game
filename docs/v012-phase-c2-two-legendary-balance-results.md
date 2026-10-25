# Wanderer v0.12 — Fase C.2: balanço com limite de dois Legendaries

Data: 2026-10-21. Branch: `development`. Código base analisado: `705be5d459ab01abaff48450640bfabbe30e2561`.

**Resultado: simulação concluída; limite de 2 aprovado como regra de equipamento, mas valores dos poderes Legendary NÃO aprovados como balanceamento final.** Nenhum coeficiente foi alterado nesta auditoria.

## Fontes e execução

- [GitHub Actions C.2 #39582646956](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39582646956): **success**; teste de sintaxe, simulação e upload do artefacto aprovados.
- Artefacto: `wanderer-c2-two-legendary-results-705be5d459ab01abaff48450640bfabbe30e2561` (ID `12338054695`), contém `wanderer-phase-c2-results.json` completo.
- [Regressão development #39582646852](https://github.com/Skinny-lfg/wanderer-game/actions/runs/39582646852): **success**.
- Runner reproduzível: `scripts/v012-phase-c2-two-legendary-sim.cjs`.
- **16.128 / 16.128** corridas; `complete=true`, **zero erros, zero timeouts**.

## Método

3 níveis E50/E100/E200 × 7 builds × 2 políticas `triple/random` × 64 seeds × 6 perfis de equipamento. Seeds de rota, combate e controlo são pareadas entre perfis. Equipamento com atributos equivalentes a Epic, três Runas equivalentes, sem poções, upgrades de loot ou benefícios de eventos. Os itens com assinatura Legendary utilizam atributos Epic sintéticos para isolar *efeitos*, não os atributos reais/odds de drop de Legendary. As rotas/passivos podem divergir depois de uma run sobreviver mais tempo; os testes são pareados por seed, não caminhos idênticos completos. Nenhum save real foi lido/escrito.

Perfis: `none`; `weapon`; `def1`; `weapon+def1`; `weapon+def2`; `def1+def2`. A designação `def2` é um segundo item de utilidade/sustain *por build*, não necessariamente uma peça estritamente defensiva. Há **no máximo 2 assinaturas Legendary** em cada perfil.

| Build | Weapon | def1 | def2 |
|---|---|---|---|
| Cloth Staff | Astrafall | Veil | Heartroot |
| Cloth Wand + Orb | Voidglass | Veil | Heartroot |
| Plate Sword + Shield | Verdant Oath | Oathwall | Veil |
| Plate Mace + Shield | Kingsbreaker | Oathwall | Heartroot |
| Leather Dual Daggers | Crimson Fang | Heartroot | Chalice |
| Leather Bow | Tempest Talon | Veil | Heartroot |
| Leather Two-Handed | Gravewake | Veil | Heartroot |

**Limitação:** não é uma busca exaustiva dos 66 pares possíveis dos 12 itens; faltam alguns pares de dois efeitos ofensivos (por exemplo Gravewake + Eye of Morrow), itens/runs reais, poções, drops e outros perfis de affinity. O teste avalia pacotes relevantes e controlo, não a experiência real média do jogador.

## Resultado global: clears /896

Cada célula agrega as 7 builds, 64 seeds e as duas políticas.

| E | 0 itens | 1 arma | 1 utilidade (`def1`) | Arma + def1 | Arma + def2 | def1 + def2 |
|---|---:|---:|---:|---:|---:|---:|
| E50 | 160 (17,9%) | 194 (21,7%) | 245 (27,3%) | 300 (33,5%) | 311 (34,7%) | **345 (38,5%)** |
| E100 | 169 (18,9%) | 230 (25,7%) | 263 (29,4%) | 369 (41,2%) | 378 (42,2%) | **401 (44,8%)** |
| E200 | 403 (45,0%) | 491 (54,8%) | 512 (57,1%) | 616 (68,8%) | 629 (70,2%) | **648 (72,3%)** |

No braço `def1+def2`, o DPS médio em E200 sobe apenas **3318,4 → 3373,1** (+1,6%), mas a Barrier/s sobe **18,82 → 75,85** (+303%), e a cura/s **15,09 → 26,14** (+73%). A melhoria de vitórias é principalmente de **sobrevivência**, não DPS.

A C.1 tinha 0/1/3 efeitos em pacotes diferentes e atingiu 729/896 vitórias em E200 (81,4%) com três. **Comparar 72,3% com 81,4% é apenas indicativo**, pois os perfis de dois e três itens não são iguais e os seeds/rotas nem sempre coincidem. O limite de dois reduz espaço de stacking, mas não garante equilíbrio.

## Dispersão por build — `def1+def2` face a 0 efeitos (vitórias/128)

| Build | E50: 0 → 2 | E100: 0 → 2 | E200: 0 → 2 |
|---|---:|---:|---:|
| Cloth Staff (Veil + Heartroot) | 0 → 8 | 9 → 24 | 45 → 84 |
| Cloth Wand + Orb (Veil + Heartroot) | 0 → 3 | 4 → 12 | 25 → 55 |
| Plate Sword + Shield (Oathwall + Veil) | 2 → 54 | 18 → 85 | 29 → 110 |
| Plate Mace + Shield (Oathwall + Heartroot) | 0 → 25 | 22 → 61 | 54 → 90 |
| Leather Dual Daggers (Heartroot + Chalice) | 71 → 83 | 53 → 67 | 59 → 72 |
| Leather Bow (Veil + Heartroot) | 50 → 90 | 33 → 72 | 92 → 114 |
| Leather Two-Handed (Veil + Heartroot) | 37 → 82 | 30 → 80 | 99 → 123 |

Algumas configurações com *arma + defesa* são ainda mais fortes do que `def1+def2`:

- **Sword + Shield, Verdant Oath + Veil**: **76/128 em E50** e **121/128 em E200**.
- **Wand + Orb, Voidglass + Veil**: **13/128 em E50**, enquanto Voidglass sozinho tem 0/128.
- **Bow, Veil + Heartroot**: **90/128 em E50**; **Two-Handed, Veil + Heartroot**: **123/128 em E200**.

O problema não é só o par Heartroot+Veil. **Veil** aparece nas combinações mais fortes em múltiplos arquétipos, mas o relatório ainda não permite concluir que todo o seu poder isolado deva ser reduzido numa proporção específica. Sword/Verdant também merece atenção. Por outro lado, Wand e Staff mantêm resultados fracos em E50 com os pares de sustain, pelo que um nerf global prejudicaria builds já fracas.

## Conclusão e próximo passo

1. **Manter o máximo de 2 Legendaries equipados**: cria decisões relevantes de buildcraft, sem impor restrições de afinidade por arma.
2. **Não aprovar a C.2 como balanceamento de poderes**: sobretudo em E200, as melhores combinações excedem largamente a meta indicativa de 20–40% de clears Epic anteriormente usada; a baseline já marca 45% e também precisa de contexto antes de aplicar a meta rigidamente.
3. **C.2.1 — testar, sem publicar coeficientes:** Veil com Barrier inicial 4/6% → **2,5/4% Max HP** e bônus ofensivo 30/45% → **20/30%**; Heartroot regen 0,30/0,45%/s → **0,20/0,30%/s**, cap por Realm 15% → **10%**. Aplicar cada variante isoladamente e depois a combinação; manter Oathwall e Verdant como controlo inicialmente. Estes valores são **hipóteses de calibração**, não recomendações validadas.
4. Priorizar `Verdant+Veil`, `Oathwall+Veil`, `Veil+Heartroot`, `Voidglass+Veil` e `Gravewake+Eye of Morrow`; cruzar resultados por política e afinidades.
5. O jogo em `development` tem os novos drops ativos num clean sheet de 12 itens, **mas não foi feito merge/deploy para produção**. Não alterar `main`, regras/saves Firebase ou Railway. Não alterar odds/coeficientes em produção antes de uma decisão posterior.

**Estado formal:** **C.2 — medição com 2 itens concluída; equilíbrio de poderes pendente de C.2.1.**
