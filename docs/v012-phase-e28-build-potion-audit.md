# Wanderer v0.12 — E.2.8 Build diversity / Apothecary audit

**PASS técnico / risco de assimetria entre builds; conclusões de balanceamento ainda provisórias.**

Run: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39674050958

## Método

450 Expeditions E200+: cinco builds x três políticas x 30 tentativas por combinação, distribuídas por **3 personagens por combinação com 10 tentativas consecutivas por personagem**. Gold inicial 4000, Fragments 3000, equipamento E196–200 com runas E190/195/199. Persistência entre as 10 tentativas por personagem. Comparar com E.2.7 (30 por personagem) requer cautela.

Builds: Archer Bow/Leather, Mage Staff/Cloth, Battlemage Wand+Orb/Cloth, Tank Sword+Shield/Plate, Assassin Daggers+Off-Hand Dagger/Leather. Políticas: sem poções; adaptadas (Mage/Battlemage Arcane+Mana+Barrier; Tank Barrier+Ironhide+Health; Assassin Might+Haste+Health; Archer Health+Ironhide+Barrier); Fortune + Health + Arcane nas mágicas, Fortune + Health + Haste nas restantes. Sem balanceamento de produção alterado.

| Build | Vitórias base/30 | Vitórias adaptadas/30 | Vitórias Fortune/30 | Máximos desbloqueados base / adaptadas / Fortune |
| --- | ---: | ---: | ---: | --- |
| Archer | 20 | 23 | 24 | E208/E208/E208 |
| Mage | 17 | 18 | 23 | E207/E207/E209 |
| Battlemage | 13 | 14 | 17 | E205/E205/E206 |
| Tank | 11 | 16 | 17 | E205/E206/E206 |
| Assassin | 27 | 28 | 29 | E209/E210/E210 |

### Gold final por jogador

| Build | Base (3 seeds) | Adaptadas (3 seeds) | Fortune (3 seeds) |
| --- | --- | --- | --- |
| Archer | 26957,25295,26522 | 19771,19013,19147 | 19613,19322,17792 |
| Mage | 23908,23408,25042 | 19673,18421,20641 | 18542,17949,17042 |
| Battlemage | 21225,22367,21516 | 16551,18493,17809 | 16335,17557,16422 |
| Tank | 24073,25302,24162 | 20230,21612,20817 | 18785,17645,19540 |
| Assassin | 27117,26408,26625 | 25119,22657,23862 | 23124,20289,20689 |

### Loot conservado / perdido nas 30 tentativas

- Archer: base 181/85, adaptadas 211/61, Fortune 233/51.
- Mage: base 149/79, adaptadas 157/67, Fortune 214/51.
- Battlemage: base 116/97, adaptadas 122/93, Fortune 144/107.
- Tank: base 90/143, adaptadas 131/114, Fortune 145/111.
- Assassin: base 258/21, adaptadas 262/13, Fortune 280/5.

## Limitações e decisão

O perfil Assassin teve 27–29 vitórias por 30 e Tank apenas 11–17 por 30. Isto **não** justifica já nerf de Daggers ou buff de Tank: as builds partem de poderes/equipamentos diferentes, afinidades planeadas variam, e o mecanismo do simulador de loot/recompensas também pode alterar RNG. As poções são selecionadas segundo stock e Gold real, podendo entrar com menos do que 3 poções. A estratégia mágica adaptada só regista 10 usos em Mage e 8 em Battlemage em 30 tentativas, sugerindo fraca ativação do kit e/ou baixa disponibilidade; precisa de auditoria do uso real.

Os 45 jogadores sintéticos acabaram com Gold positivo individualmente, nesta janela de 10 tentativas, mas isto não constitui prova de sustentabilidade a longo prazo. O *total de poções usadas* não inclui o consumo automático de Fortune à entrada.

**Recomendo E.2.9 dirigido ao balanceamento inicial:** verificar stats efetivas e sinergias por build, equipamento e seleção de runas, e o motivo da baixa utilização Arcane/Mana/Barrier, antes de tocar no combate. Depois repetir 30 tentativas por personagem (1350 runs) se necessário.

Sem alterações a `main`, Firebase, saves reais ou balanceamento.
