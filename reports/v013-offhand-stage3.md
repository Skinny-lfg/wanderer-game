# Wanderer v0.13 — Off-Hand Fase 3: Epic Tome e Charm

**Branch:** `audit/v013` only. **Produção:** sem merge ou deploy.
**Commit de implementação:** `77d23094931f9ab8ae4f0c17003b8b2a3460f05a`.
**C7 validado:** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44749657500 — **4/4 jobs success**.

## Epic Off-Hands

| Receita | ID | Affinity do Blueprint | Trait garantido | Efeito em combate |
|---|---|---|---|---|
| Aether Orb (existente, inalterada) | `epic_aether_orb` | Magic | `ward` — Arcane Ward | Casts financiados geram 2% Max HP Barrier, cooldown 6s |
| Echoing Tome (novo) | `epic_echoing_tome` | Magic | `echoing_recall` — Echoing Recall | Recall a cada terceira ação paga restaura até 5 Mana em vez dos 3 normais; cooldown global 6s |
| Heartbloom Charm (novo) | `epic_heartbloom_charm` | Vitality | `heartbloom` — Heartbloom Renewal | Main-hand HP hit cura 2% Max HP em vez de 1,5%, uma vez a cada 8s; healing debuffs continuam a aplicar-se |

- Os dois novos traits **modificam o proc existente**, não criam um segundo proc nem aplicam um efeito sobreposto sem cooldown.
- O upgrade depende de `r.stats.off.v013Trait`, isto é, apenas do Off-Hand realmente equipado. Um trait homónimo noutro slot não o ativa.
- Tome sem ações financiadas e Charm a HP cheio/sem dano real continuam sem ativar o seu efeito. A recuperação de Mana nunca ultrapassa `maxmp`.
- Itens Epic naturais mantêm o rolamento de traits normal, diferente da garantia de trait da receita da Forge.
- Os perfis de afixos da Fase 2 (Orb: Spell Power; Tome: Mana; Charm: HP) mantêm-se. A receita não força outros atributos nem introduz slots novos.

## Blueprint e economia

- Descoberta **não garantida** via optional Dungeon Contract: `online/v013-expedition-contracts.js` filtra dinamicamente `C.RECIPES` por Affinity e raridade, logo os dois IDs novos passam a ser elegíveis para ofertas Epic de Magic/Vitality.
- Apenas recursos não desbloqueiam a receita; é preciso descobrir primeiro o Blueprint. Repetir a descoberta não cria duplicados nem converte receitas num prémio extra.
- Ambos usam o **preço Epic existente**: 55 Essence, 4 reagentes da Affinity correspondente e `100 + 8 × gear tier band` Fragments.
- Não se alteraram odds de loot, recompensas garantidas, custos globais, slots ou limites de raridade.
- Preview, `prepareCraft` e criação real partilham subtipo, preço, trait e orçamento Epic, sem efeitos colaterais no inventário até à compra efetiva.

## Alterações técnicas

- `economy/v013-crafting.js`: dois traits nativos e duas receitas Epic.
- `combat/v012-combat-runtime.js`: integração no Tome Recall e Charm Renewal, usando os cooldowns e métricas já existentes.
- `tests/v013-offhand-stage2-gear.test.cjs`: atualização da expectativa de catálogo para incluir as três receitas Epic.
- `tests/v013-offhand-stage3-recipes.test.cjs`: **8 novos testes integrados**.
- `package.json`: a nova bateria entra no gate `npm run test:v013`.
- `docs/economy/v013-crafting.js`, `docs/combat/v012-combat-runtime.js`, `docs/index.html`: fontes e preview Pages sincronizadas, cache busting por SHA-256.

## Evidências

GitHub Actions C7 #44749657500:

| Verificação | Resultado |
|---|---|
| Gameplay e economia nativa | 356/356, 0 failures |
| Simulador | 7/7 |
| Talent Graph | 79/79 |
| Combat/Elite/Boss | 94/94 |
| Integração e economia | 85/85 |
| Segurança/account | success |
| Navegador Chromium | success |
| Progressão natural E1–E5 e paridade de Pages | success |

- Comparadores Affinity Stages 2–4: **48/48** casos controlados em cada fase; 0 erros/timeouts.
- Stress Elite/Boss do Stage 4: **96 casos, 77 vitórias, 19 derrotas, 0 erros/timeouts**. É uma campanha exploratória e **não valida o balanceamento das novas receitas de forma isolada**.
- Fase 4 pendente: comparação de procs e traits nos tooltips, estimativa de Power e remoção comprovada de referências obsoletas.
- Fase 5 pendente: confrontos controlados Orb vs Tome vs Charm entre armas e Affinities com o motor de simulações, incluindo E1/E5/E10/E20, Elites e Bosses.

**Conclusão:** Fase 3 implementada/validada na branch de auditoria. Sem merge nem deploy e sem rebalanceamento global.
