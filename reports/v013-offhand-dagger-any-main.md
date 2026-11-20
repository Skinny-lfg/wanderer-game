# Wanderer v0.13 — Off-Hand Dagger com qualquer arma de uma mão

**Estado:** implementado na branch `audit/v013-stage6`, sem merge nem deploy. Alteração à regra de combate e respetivas descrições; nenhum buff de atributos base, loot ou XP.

## Regra atualizada

- Qualquer arma principal de **uma mão** permite agora que uma adaga equipada na off-hand execute um golpe independente **após dois ataques principais**: Sword + Dagger, Mace + Dagger, Wand + Dagger e Daggers + Dagger.
- O golpe da off-hand continua a usar a base física de Daggers (fator 0,80), seguido de **50% de dano**. Não é um segundo cast de Wand e não consome Mana como cast.
- A adaga secundária **não** pode atacar se a arma de duas mãos bloquear a off-hand, nem se o inimigo alvo tiver morrido antes do golpe.
- O contador de ataques secundários mantém-se separado de golpes diretos. A alteração à supressão de Double Strike impede a aplicação simultânea ao ataque principal que desencadeia o golpe secundário, independentemente do tipo de arma principal.
- Shield, Orb, Tome e Charm **não recebem ataques extra**.
- O motor de combate usado pelas simulações naturais e controladas utiliza a mesma regra, sem adaptação especial para agentes.

## Significado dos 50% de atributos ofensivos

A adaga secundária já contribuía com **metade do valor dos seus atributos ofensivos**: `atk`, `str`, `agi`, `int`, `cha`, `spd` e `spell`. Por exemplo: +10 Attack no item = +5 Attack; +6 Agility = +3; +8 Spell = +4. Atributos defensivos como `def`, `hp` e `end` contribuem integralmente.

**Isto é independente da redução de 50% no dano do ataque secundário.** O golpe usa a fórmula física de Daggers e, depois, um multiplicador de 0,50. Não há atribuição artificial de dano a partir do objeto off-hand nem ataques extra por impulso em cada frame.

## Ficheiros atualizados

- `combat/v012-combat-runtime.js` e espelho `docs/combat/v012-combat-runtime.js`
- `index.html` e espelho `docs/index.html`: descrição da identidade de Daggers atualizada
- `combat/v012-gear-stats.js` e espelho `docs/combat/v012-gear-stats.js`: distinção explícita entre meia contribuição de atributos e meio dano do golpe
- `tests/v013-offhand-dagger-any-main.test.cjs`: testes novos das quatro armas principais, cadência, dano, atributos, Shield, Orb, Tome e ficheiros sincronizados
- `tests/v013-expedition-dagger-forge.test.cjs`: corrigidas duas verificações históricas obsoletas (`a.initial` removida e `blue_offdagger` fora das receitas atuais)

## Verificação

[Execução GitHub Actions — 38 testes aprovados e zero falhas](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44799135503)

A primeira execução encontrou duas falhas de testes históricos desatualizados; foram corrigidas sem alterar a mecânica do jogo e a bateria completa foi repetida. As cinco verificações novas de combate já tinham passado na primeira execução. **Não há medição longitudinal de balanceamento depois da mudança** — é uma alteração deliberada à eficácia das combinações Sword/Wand/Mace + Dagger, que precisa de ser incluída no próximo ciclo de simulação.

Nenhum merge ou deploy para a versão publicada.
