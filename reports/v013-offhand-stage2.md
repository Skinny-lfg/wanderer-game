# Wanderer v0.13 — Off-Hand Fase 2: Atributos e probabilidades

**Estado:** implementada e validada na `audit/v013`; sem merge nem deploy.
**Código final validado:** `433f80fac6ca7d0125e8f19235280279d0de5b43`.
**CI C7 (4/4 success):** https://github.com/Skinny-lfg/wanderer-game/actions/runs/44745846795

## Perfis

| Off-Hand | Atributo principal garantido desde Common | Atributos primários ponderados | Secundários característicos (pesos na pool de extras) |
|---|---|---|---|
| Orb | Spell Power | INT 52, CHA 30, END 18 | Ward Bonus 50, HP 16, Mana 10, Mana Regen 8 |
| Tome | Mana | INT 52, CHA 28, END 20 | Mana Regen 55, Spell Power 34, HP 12 |
| Charm | Max HP | END 40, INT 23, CHA 22, STR 15 | Defense 42, Spell Power 30, Ward Bonus 14, Mana 8 |

Estes pesos servem para **a seleção dos afixos**, não são percentagens finais absolutas. O total continua a competir com os afixos primários remanescentes, e afixos repetidos são excluídos. Perfis de armas e restante equipamento mantêm o peso histórico de extras 1.6.

- Common continua a gerar só um atributo principal e nenhum STR/AGI/INT/END/CHA extra.
- Uncommon continua com dois atributos; Rare com 2–4, Epic com 3–4 e Legendary com 4–5.
- O orçamento multiplicado pela raridade e os caps absolutos de Ward, Mana Regen e outros secundários **não foram aumentados**.
- Loot, Merchant e Forge partilham o mesmo gerador; não há drops garantidos nem mecanismos novos de rotação/foco.

## Interação com builds

- **Orb + qualquer 1H físico:** Spell Power é calculado porque a Barrier ofensiva da Orb utiliza esse atributo; não exige Magic ou Decay.
- **Aegis + qualquer arma:** Spell Power também fica ativo para Barrier inicial/talentos com escalonamento de SP, mesmo sem Magic; uma Orb pode reforçar essa mesma variável.
- Aegis/Orb por si só **não concedem Mana nem feitiços**; Magic/Decay continuam a determinar acesso a esses recursos no equipamento físico.
- **Tome** melhora o pool de Mana desde Common, relevante para builds que realmente gastam Mana.
- **Charm** aumenta a vida desde Common, incluindo builds físicas sem qualquer Affinity mágica.
- O Power diagnóstico agora reconhece Spell Power ativo quando existe Orb ou Aegis, mantendo-o distinto de uma previsão de DPS/sobrevivência.

## Ficheiros principais

- `economy/v013-gear-rolls.js` + `docs/economy/v013-gear-rolls.js`
- `combat/v012-gear-stats.js` + `docs/combat/v012-gear-stats.js`
- `docs/index.html` com hashes atualizados
- `tests/v013-offhand-stage2-gear.test.cjs` inscrito no gate obrigatório em `package.json`
- Os comparadores históricos `scripts/v013-stage{2,3,4}*` agora distinguem alterações planeadas dos atributos Off-Hand de regressões. O modo histórico estrito continua disponível e é testado.

## Evidência de validação

C7 run 44745846795: `current-native`, `security-account`, `natural-and-source-parity` e `browser-journey` terminaram **success**.

- Gameplay: **348/348** (0 failures), incluindo 7 testes específicos da Fase 2.
- Simulador: **7/7**.
- Talent Graph: **79/79**.
- Combate, Elites e Bosses: **94/94**.
- Integração/economia: **85/85**.
- Comparações controladas Stages 2, 3 e 4: 48/48 cenários normais válidos; 0 erros/timeouts.
- Stage 4 stress: **96** cenários Elite/Boss, **77 vitórias**, **19 derrotas**, 0 erros/timeouts. Estes números não são ainda um parecer de balanceamento.
- O teste de distribuição avalia **2.400 Epic por subtipo** e exige presença significativa dos seus secundários característicos (pelo menos 30% para o afixo-identidade e 58% para algum extra distintivo).
- Os testes de orçamento e caps abrangem Common–Legendary, quatro escalas de poder e 150 rolls por combinação. Os testes nativos confirmam os atributos Common, Forge/Merchant/Loot e o comportamento de Spell Power em físico/Aegis sem Mana grátis.

## Próximas fases

**Fase 3:** receitas Epic para Tome e Charm (ainda não criadas); preservar Aether Orb.

**Fase 4:** comparar efeitos passivos no UI/Power, atualizar tooltips de Off-Hand e auditar código sem consumidores.

**Fase 5:** campanhas pareadas reais com Sword/Mace/Daggers/Wand e as três opções Off-Hand, por build e nível, contra mobs, Elites e Bosses antes do equilíbrio dos coeficientes.

**Sem aprovação de balanceamento global nesta fase.**
