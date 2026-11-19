# Wanderer v0.13 — Stage S2: decisões de build e economia do simulador

**Data:** 19/11/2026 · **Branch:** `audit/v013` · **Ponto de partida:** commit `1369ff9` do Codex com Oathbound Exarch, Briarspine Horror e novas imagens de Bosses/Minions. **Resultado:** código de decisão, harness e testes; **sem modificar as fórmulas de combate, drop, preços, balanceamento, `main`, publicação, Firebase ou os saves reais.**

## O que mudou de facto

| Área | Estado S2 | Limites preservados |
|---|---|---|
| Perfis e equipamentos | Dez políticas de contas: cautious, balanced, daring, Magic Fire/Frost/Lightning, Plate Warden, Leather Duelist, Cloth Battlemage e Hexblade Hybrid. Valorização diferenciada de Cloth + Spell/Int, Leather + Agility/Evasion, Plate + Defense/End, armas compatíveis, armas híbridas e Focus do Forge. | A pontuação `gearScore` é **heurística de decisão** e não altera as stats reais, a árvore de talentos ou a fórmula de dano. Equipar e comprar continuam a chamar ações nativas. |
| Focado vs misto | Perfis `style:'focused'/'mixed'`, diferentes prioridades de nós e preparaçāo de habilidades de árvore já adquiridas. Mantém o reset gratuito adaptativo da S1. | Nenhum ponto primário é distribuído fora da árvore real; pontos vêm exclusivamente do XP. |
| 8 famílias de Runas | `runeScore`, escolha de prémio conforme build, montagem dos três slots com IDs realmente possuídos, uma família por slot e reciclagem nativa de duplicados protegendo os melhores de cada família. | Respeita o inventário, a confirmação de reciclagem, a atribuição nativa de Fragments e os bloqueios durante a expedição. |
| 13 poções | `potionScore` para os 13 tipos do catálogo atual; seleção nativa até três slots, compra ao preço real e disponibilidade aleatória da Apothecary. Utilização de Health, Mana, Barrier, Ironhide, Might, Arcane, Haste, Purifying, Trail, Scout, Veilsight, Fate nas janelas legais. Fortune é consumida automaticamente pelo runtime ao começar a run quando selecionada. | Sem poções em combate, doses grátis, resultados de shop garantidos ou criação de itens. |
| Forge | Comparação de crafts comuns e com `spellweave`, `quickstep` ou `bulwark`, upgrades de tier da S1 e reforço Legendary +rank nativo, usando os custos reais e uma heurística de eficiência. | O reforço mantém +2% de stats originais positivas por rank até +10, tal como a regra existente. Os crafts continuam sujeitos à geração normal do item. |
| Reagentes | Refinamento nativo condicional apenas quando existe um Blueprint Epic desbloqueado com falta dos respetivos reagentes e 3 marcas dry mais Essence suficiente. | O refino consome 6 Essence e as 3 marcas, em troca de um core da mesma Affinity. Não garante drops. |
| Novo Elite | Reação de prioridades ao Thornbloom do Briarspine Horror: se a reflexão estiver ativa e existir outro inimigo vivo, o agente pode selecioná-lo. | Não interrompe o ataque automaticamente, não cria imunidades e não altera as fases, caps ou dano refletido do Horror. |
| Auditoria Elite/Tank | O teste que exigia artificialmente oito arquétipos numa amostra de apenas 24 combates foi separado num **rastreio independente de seeds nativas** que confirma os oito. A comparação emparelhada mantém os seus 24 pares sem inventar encontros em falta. | A amostra de 24 pares não finge cobrir os oito arquétipos quando só observou sete. |

## Verificação automática

- **Stage S2 CI:** <https://github.com/Skinny-lfg/wanderer-game/actions/runs/44636748321>, **93/93 testes aprovados**, zero falhas: 20 S1+S2, 31 testes Elite/Boss, 7 do simulador controlado, 33 de progressão/árvore/economia e 2 Chromium vs VM.
- **C7 gate:** <https://github.com/Skinny-lfg/wanderer-game/actions/runs/44636562418>, **4/4 jobs verdes**, incluindo browser-journey, segurança e progressão natural.
- **Piloto natural S2:** artefactos `v013-s2-native-pilot` do workflow <https://github.com/Skinny-lfg/wanderer-game/actions/runs/44636748321>. Usa `seed=22661`, 10 perfis, E1–E3, no máximo 3 tentativas por Expedition e 6 por conta. Não utiliza equipamento, XP, desbloqueios ou encontros fabricados.

## Piloto real: observações sem extrapolação

| Indicador | E1 | E2 | E3 |
|---|---:|---:|---:|
| Contas que chegaram | 10 | 1 | 0 |
| Tentativas | 30 | 3 | 0 |
| Vitórias | 1 | 0 | 0 |
| Mortes | 18 | 1 | 0 |
| Extrações | 11 | 2 | 0 |
| Erros do runner | 0 | 0 | 0 |
| Lutas Elite (vitórias Elite) | 10 (10) | 3 (3) | 0 |
| XP naturalmente ganho | 1042 | 217 | 0 |
| Upgrades de equipamento (contagem de decisões) | 25 | 3 | 0 |
| Crafts com Focus | 1 | 1 | 0 |
| Compras de poções | 20 | 1 | 0 |
| Poções efetivamente utilizadas | 5 | 2 | 0 |
| Tier upgrades, Legendary reinforcement, refino, Runas equipadas/recicladas | 0 | 0 | 0 |
| Escolhas elementais, prepare avançado, resets ou reconversões | 0 | 0 | 0 |

**Apenas `cautious` passou E1**, tendo falhado as três tentativas subsequentes em E2. Não foi atingido E3. A única seed por perfil não permite estimar uma taxa de vitória geral nem concluir que os Elites são sempre fáceis (embora os 13 Elites combatidos neste piloto tenham sido derrotados).

**Exposição técnica vs exposição natural:** os testes unitários verificam que Focus, refino, reforço, Runas, elementos, preparação e reset executam transações legais em *fixtures* com recursos e nós controlados. O piloto de contas novas **não provou** que todas essas opções são alcançáveis em quantidades representativas até E3. Os números zero não significam que as mecânicas estejam ausentes do jogo ou do harness; neste piloto os agentes não tiveram oportunidades ou condições suficientes.

## Leitura e próximos passos

1. A implementação **funcional** das decisões S2 está testada, mas não está provado que as políticas sejam otimizadas ou humanamente representativas. A função de score é uma primeira heurística e não tem uma validação estatística de melhora face ao agente anterior.
2. A dificuldade do início da progressão é um bloqueio para dados de E5/E10/E20: até E3 apenas uma conta sequer atingiu E2. Não reduzir automaticamente a dificuldade com base numa amostra de uma seed por perfil.
3. Próxima etapa S3 deve comparar várias seeds, durações, escolhas de salas/retirada, stress tests de elites e Bosses com controle de equipamento, e taxa de avanço real. Separar claramente falhas de IA/rotas de problemas do balanceamento do jogo.
4. Não fabricar E5/E10/E20 para contas naturais. Usar cenários controlados explicitamente identificados para medir mecânicas de nível alto que uma conta real ainda não alcançou. Obter oportunidades de ativação suficientes para Runas, advanced prepared, refino e upgrades antes de afirmar cobertura natural.

**Conclusão:** Stage S2 de integração de decisões e testes concluída no simulador, mas **validação comportamental e equilíbrio ainda em aberto**. O piloto é deliberadamente pequeno e foi guardado para auditoria.
