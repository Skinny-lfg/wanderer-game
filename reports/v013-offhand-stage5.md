# Wanderer v0.13 — Off-Hand Fase 5: auditoria do simulador e campanha comparativa

**Estado:** implementação e campanha de diagnóstico concluídas; **balanceamento ainda não aprovado**.  
**Branch:** `audit/v013`; **sem merge para main nem deploy**.  
**Código validado:** [`0b3947e8576c6b3ab6306c2dda76592bdf8f4653`](https://github.com/Skinny-lfg/wanderer-game/commit/0b3947e8576c6b3ab6306c2dda76592bdf8f4653).  
**C7:** [run 44756443297](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44756443297), **4/4 jobs verdes**.  
**Campanha dedicada:** [run 44756442960](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44756442960), **2/2 jobs verdes**, com JSON e Markdown completos nos artefactos `v013-offhand-stage5-paired` e `v013-offhand-stage5-natural` (retenção de 30 dias).  
**Fingerprint do motor e dos ficheiros da campanha:** `9ccb8f137b7913384d0bcd1410a56a739664132dd2bf6c61e78e73046daf748d`.

## 1. O que foi alterado

- `scripts/simulate-progression.cjs`: o simulador aceita um **Off-Hand controlado** e um trait Epic opcional, mas continua a executar os mesmos combates nativos. Regista métricas reais de Orb Barrier, Tome Mana, Charm Healing, Barrier gerada/absorvida, duração, dano, HP, MP e resultado.
- As sementes de mapa/controlo/combate são sincronizadas **depois de rolar o Off-Hand**; um fingerprint de todos os restantes slots comprova que as quatro variantes recebem o mesmo equipamento não-Off-Hand. São também comparadas a Affinity, o Realm e a composição do encontro.
- `scripts/v013-natural-progression.cjs`: o agente avalia passivos dos quatro Off-Hand conforme a build, **não recompensa Mana/regen inutilizável** em perfis físicos sem acesso a Mana, e distingue Aegis/Orb. Trata-se de um critério transparente de decisão do simulador, **não de um bónus no jogo nem de uma previsão de DPS**.
- `scripts/v013-offhand-stage5.cjs`: três campanhas isoladas (combates pareados, Bosses preparados e contas naturais) e ensaios controlados dos três traits Epic. Gera JSON completo e sínteses Markdown.
- `tests/v013-offhand-stage5-simulation.test.cjs`: testes de paridade, validade dos cenários, dados nativos, atributos, traits Epic, regras de contas sem recursos fabricados e fonte de informação.
- Novo workflow dedicado `.github/workflows/v013-offhand-stage5.yml`, sem publicação, deploy nem mutação do balanceamento.

**Não alterei coeficientes de dano, defesa, Barrier, cura, Mana, probabilidades de loot, custos, receitas, talentos ou inimigos nesta fase.**

## 2. Metodologia: combate controlado

**864 combates**, 216 quartetos pareados: seis builds (Aegis Sword, Aegis Mace, Magic Wand, Blood Daggers, Hexblade Sword e Pure Blood Sword), quatro Off-Hand (Shield/Orb/Tome/Charm), quatro Expeditions (E1/E5/E10/E20), três encontros (Normal/Elite/Boss), três sementes (94101/94102/94103).

| E | Raridade controlada | Talentos fixos |
|---|---|---:|
| E1 | Common | 0 |
| E5 | Uncommon | 4 |
| E10 | Rare | 10 |
| E20 | Epic | 18 |

**Importante:** só E1 tem a regra real de zero pontos iniciais. Os orçamentos de E5/E10/E20 são *coortes sintéticas fixas*, **não XP legitimamente obtido** nem uma alegação de que um jogador normal já possui esse equipamento. Não se pode extrapolar uma taxa de vitória natural.

### Resultados dos 864 combates

| Off-Hand | Vitórias / 216 | Normais / 72 | Elites / 72 | Bosses / 72 |
|---|---:|---:|---:|---:|
| Shield | **110** | 65 | 44 | 1 |
| Orb | **106** | 66 | 40 | 0 |
| Tome | **93** | 61 | 32 | 0 |
| Charm | **109** | 65 | 44 | 0 |

**418 vitórias, 446 derrotas, 0 timeouts, 0 erros e 0 desvios de paridade**.

Comparação pareada versus Shield (a mesma build, E, seed e inimigos): Orb **−4** vitórias; Tome **−17**; Charm **−1**. Com apenas três sementes por caso e fortes diferenças entre builds, são sinais exploratórios, não intervalos de confiança suficientes para decidir um nerf ou buff final.

### Perfis importantes (36 casos por Off-Hand)

| Build | Shield | Orb | Tome | Charm |
|---|---:|---:|---:|---:|
| Aegis Sword | 16 | 15 | 13 | 16 |
| Aegis Mace | 13 | 12 | 11 | 12 |
| Magic Wand | 17 | **19** | 15 | 18 |
| Blood Daggers | **20** | 18 | 17 | **20** |
| Hexblade Sword | 20 | **22** | 18 | 21 |
| Pure Blood Sword | **24** | 20 | 19 | 22 |

- **Orb:** está operacional em armas físicas e mágicas, acumula Barrier com Aegis e mostra a sua melhor tendência nos híbridos Magic/Decay. Não existe prova de domínio universal: perde Block/Counterattack do Shield.
- **Charm:** a cura aparece realmente no combate e o desempenho geral é próximo do Shield. O maior dano recebido em algumas coortes não significa automaticamente que o Charm seja pior; cura e mitigação ocorrem em canais diferentes.
- **Tome:** há um sinal consistente de fraco impacto relativo. Em builds sem ações que gastam Mana, o proc fica corretamente inativo. Em Magic Wand, a recuperação média observada foi **8,42 Mana por combate**, face a **134,19 Mana gasta** (médias de toda a coorte Magic Wand): é necessário testar a frequência de esgotamento real antes de alterar os números.
- O valor estimado de Gear Power não foi usado para determinar os vencedores; contam vitórias, sobrevivência, recursos e efeitos reais.

## 3. Bosses: dificuldade dominante e ensaio preparado

No ensaio não preparado, só **1 em 288** encontros Boss terminou com vitória. Isto inviabiliza inferências fortes de equilíbrio entre Off-Hand nos Bosses.

Para não disfarçar esse problema, executei **216 Bosses preparados adicionais**, com Epic gear, 24 pontos sintéticos, três Runes e as duas preparações nativas de Boss (Marked Elite e Reliquary). É um **teste de sensibilidade controlado**, não uma progressão legítima.

| Off-Hand | Vitórias / 54 |
|---|---:|
| Shield | **14** |
| Charm | **11** |
| Orb | **7** |
| Tome | **2** |

Foram **34/216 vitórias**, sem erros/timeouts. Mesmo com investimento superior, a probabilidade de vitória continua baixa neste conjunto. Isto exige **uma auditoria própria da dificuldade dos Bosses e respetiva preparação antes do balanceamento global**.

## 4. Traits Epic: efeito isolado e confirmado

Mais **18 testes de Boss** compararam a mesma combinação com **trait Epic explicitamente ausente** versus trait garantido; nunca se assume que o item aleatório esteja sem trait.

- **Echoing Tome:** Mana recuperada por três sementes de **6 para 10** durante cada combate testado. Efeito ativo, mas sem vitórias adicionais.
- **Heartbloom Charm:** cura observada aumentou cerca de **33%** (por exemplo, 24,18 → 32,24 HP). Efeito ativo, mas sem vitórias adicionais nestes três Bosses.
- **Aether Orb / Arcane Ward:** Barrier total gerada aumentou, por exemplo, **18,20 → 43,52** num encontro. Efeito ativo, mas sem vitórias adicionais.

Três sementes e três Bosses por par de trait são insuficientes para rejeitar qualquer destes upgrades; comprovam **integração mecânica**, não equilíbrio.

## 5. Contas naturais: observações censuradas

**8 contas legítimas, 36 tentativas**, perfis Cautious, Magic Fire, Hexblade Hybrid e Leather Duelist; duas sementes (9101/9201), com máximo de quatro tentativas por E. Sem XP/equipamento/drops forçados, teleporte ou desbloqueios gratuitos.

- **0 erros**.
- **7 contas ficaram em E1**; uma venceu E1, chegou a E2 e não venceu E2.
- Observou-se **uma única substituição de Off-Hand**, para um **Common Shield**.
- Não há amostra natural válida para comparar as escolhas de Orb/Tome/Charm em E5/E10/E20. **Níveis não desbloqueados estão censurados, não são tratados como derrotas.**
- Não se deve transformar este piloto de baixa progressão numa alegação de que os jogadores preferem Shield: quase não houve oportunidades reais de obter ou trocar os outros Off-Hand.

## 6. Validação e veredito

- **C7:** 368/368 gameplay; 7/7 simulador; 79/79 Talent Graph; 94/94 combate/Elites/Bosses; 85/85 integração/economia.
- Segurança, navegador Chromium e paridade source/Pages: **aprovados**.
- Workflow Stage 5: testes e campanha pareada aprovados; simulações de contas naturais aprovadas.
- **Fases 1–5 do plano de implementação e análise Off-Hand: executadas.**
- **Balanceamento global: não aprovado nem iniciado.** Falta cobertura natural posterior a E2 e amostra de Bosses com taxa útil de vitória.

## 7. Próximas decisões recomendadas

1. **Diagnosticar E1/E2 e o bloqueio de progressão natural** antes de assumir que um Off-Hand resolve ou provoca esse problema: sobrevivência dos primeiros combates, XP ganho, drops, decisões de extração, disponibilidade real de equipamentos e oportunidades de obter Off-Hand.
2. **Separar a revisão de Bosses da revisão de equipamento.** Testar preparação real, guards/minions, duração, dano recebido, mecanismos anti-healing e proporção de vitórias por build. Não enfraquecer Orb/Charm como reação a derrotas de Boss generalizadas.
3. **Investigar o Tome em builds com Mana.** Medir momentos de falta de Mana e casts perdidos, não apenas Mana devolvida. Se continuar sub-relevante, preparar um pequeno ajuste comparativo só para Tome, sem alterar os restantes por arrasto.
4. **Só depois fazer balanceamento quantitativo com mais sementes e progressão natural representativa** (incluindo E5/E10/E20 quando de facto alcançados). Manter Shield, Orb e Charm como referências, sem buffs/nerfs especulativos.

**Dados completos:** GitHub Actions run 44756442960, artefactos `v013-offhand-stage5-paired` e `v013-offhand-stage5-natural`. Os dados JSON incluem 864 linhas de combate, 648 diferenças contra Shield, 216 Bosses preparados, 18 ensaios Epic e decisões reais das oito contas.
