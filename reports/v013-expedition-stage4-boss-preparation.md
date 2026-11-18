# Wanderer v0.13 — Stage 4: Objectives & Boss Preparation

**Estado:** implementação numa branch isolada de desenvolvimento, PR draft, **sem merge e sem publicação na GitHub Pages**. Base: Stage 3 PR #44 (dependente de #43, #42, #41 e simulador #40).

## Jogabilidade implementada

### Elite marcado (objetivo opcional já existente)

A Realm Card mantém o Elite marcado original e a sua recompensa de extração: **1 reagente da afinidade + 2/4/6 Essence** em Guarded/Dangerous/Brutal. **Não foi criada outra recompensa de loot.**

- **Guarded:** derrotar o Elite marcado reduz o **Attack real do boss em 10%**, calculado uma única vez depois da escala normal.
- **Dangerous / Brutal:** elimina **1 guarda do boss**, incluindo guardas extras de `Gravebound Retinue` e respeitando 0–3 guardas no total.
- O jogador pode ignorar o Elite e avançar diretamente para o boss.
- Vencer o Elite escreve apenas `prepare_boss:markedElite` no diário determinístico. O pagamento anterior continua dependente da conclusão/extração, sem duplicação.

### Forgotten Reliquary (sala nova, mas sem aumentar o mapa)

- Uma **sala por Realm Card** substitui um encontro normal nas posições 5–12.
- Usa um stream de RNG separado; **não muda a topologia, o orçamento de passos nem o RNG do combate/loot**.
- Nunca substitui o primeiro anel, o boss, o Elite marcado, a pista existente ou a horda especial Brutal de 18–22 inimigos.
- A sala tem as mesmas regras de deslocação, pode ser adiada e só paga/resolve uma vez.

| Escolha | Custo | Efeito |
|---|---|---|
| **Disrupt the Seal** | **15% HP máximo** do jogador, arredondado para cima; a personagem tem de sobreviver | Desativa **a primeira propriedade conhecida do boss** até terminar a expedição |
| **Recover Supplies** | Sem custo de HP | Recupera **15% do HP máximo e 25% da Mana máxima**, sem exceder os máximos |
| **Pass / Leave Untouched** | Sem custo adicional além da deslocação | Mantém todas as propriedades do boss |

A propriedade desativada é retirada **apenas da lista efetiva de propriedades ao iniciar o combate**. O `foundationManifest` original mantém-se inalterado. O estado e a escolha são guardados no checkpoint e recuperados sem pagar HP novamente.

A arte temporária do evento reutiliza o ficheiro existente `assets/events/forgotten_arsenal.png`, confirmado no repositório. **Não é arte final própria.**

### Oracle of Paths — conhecimento sobre o boss

A escolha de reconhecimento mantém a revelação de até duas salas próximas e um atalho oculto. Se existir propriedade de boss ainda desconhecida, revela **exatamente uma propriedade adicional**, mesmo que já não existam salas próximas por revelar. Não revela todas as propriedades automaticamente.

A interface mostra a propriedade conhecida, a marca **disabled** quando for desativada, as pistas adicionais encontradas pelo Oracle e a consequência do Elite marcado. Os modifiers não revelados continuam ocultos até ao combate final.

## Arquitetura / integração

- Novo `online/v013-boss-preparation.js`: sala opcional, seleção determinística, diário de decisões, propriedades efetivas, reduções de dano/guardas e estado mostrado ao jogador.
- Atualiza `combat/v013-expedition-foundation.js` com `reveal_boss` reproduzível e validação dos IDs revelados.
- Ligas os efeitos ao **motor de combate real**, através do atual `online/v012-expedition-runtime.js` e do controlador v0.13.
- Aproveita a transação de evento, o checkpoint e a persistência existentes; **não há um segundo motor de combate nem uma nova moeda**.
- As condições de expedição, Boons e contratos adicionais **não** são ativados nesta etapa; mantêm-se planeados para Stages 5–7.

## Testes e simulação

```bash
npm run test:v013:prep
node scripts/simulate-progression.cjs --mode=bossprep --levels=1,5,15,35,70,100,250,1000 --seeds=9101,9102,9103 --out=reports/v013-stage4-bossprep.json
```

- **82/82 testes direcionados** passaram (Stages 0–4 e simulador). Os testes Stage 4 incluem evento transacional real, HP/Mana, insuficiência de HP, pass, dupla ativação, Elite marcado, guardas, dano boss Guarded, preservação do pagamento anterior sem liquidação antecipada, boss real com uma propriedade removida, Oracle, checkpoint restaurado e regras de replay.
- **10.000 seeds × 3 Realm Cards = 30.000 mapas**: 1 Reliquary opcional por mapa, 18/20/22 salas e 14/13/12 passos preservados, acesso por ligações normais dentro do orçamento, 1/2/3 Encounter Traits, horda Brutal preservada.
- Diagnóstico `--mode=bossprep`: **384 combates** (8 níveis × 4 builds × 3 seeds × 4 estratégias). **372 vitórias, 12 mortes, 0 erros e 0 timeouts**. Compara boss completo, Elite marcado, Reliquary e ambos. Usa **boss injetado no anel inicial e preparação forçada para diagnóstico**; contabiliza o custo de 15% HP da Reliquary, mas **não simula a exploração para chegar ao Elite e à sala**.
- Modo natural `--mode=both`: **288 cenários**, **283 vitórias, 5 mortes, 0 erros ou timeouts**. **96/96** percursos Dungeon atingiram o boss, **91/96** venceram. **16 percursos** atravessaram a Reliquary, mas o agente atual escolhe **passar**, sem tentar otimizar desvios.
- `npm run test:v013` mantém **48 testes falhados, exatamente com os mesmos nomes da Stage 3**. A suíte geral não está verde; não se podem atribuir estes testes a esta etapa.
- Os principais ficheiros fonte e testes enviados foram lidos novamente do GitHub e verificados por SHA Git contra os snapshots usados nos testes.
- **Não executado:** CI GitHub com aprovação, QA browser real em desktop/mobile, balanceamento estatístico abrangente.

## Limites / próximas Stages

A Stage 4 prova que **as decisões opcionais alteram o boss real**, mantendo a gestão de passos. Ainda não existe um simulador de política de exploração que decida autonomamente se a viagem até ao Elite ou à Reliquary compensa — é uma capacidade planeada para a Stage 8.

**Stage 5:** Conditions de Expedição ativadas na geração e no combate, respeitando afinidades e combinações incompatíveis. **Não publicar** sem revisão manual, CI e decisão explícita.
