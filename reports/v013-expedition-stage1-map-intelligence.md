# Wanderer v0.13 — Stage 1: Map Intelligence & Navigation

**Estado:** implementação em branch de desenvolvimento, PR de revisão; **não publicada**. Base: `feature/v013-expedition-stage0-foundation-20261117` (PR #41), que por sua vez depende do PR #40 do simulador.

## Regras preservadas

- Mapa radial original, 18/20/22 salas e 14/13/12 passos para Guarded/Dangerous/Brutal.
- Um Elite evitável em Guarded/Dangerous e dois em Brutal; boss e recompensas inalterados.
- Cada entrada em sala não limpa consome passos de acordo com a regra original. Atravessar um conjunto contínuo de salas já limpas custa no máximo dois passos. Não há teleportes gratuitos.
- Não altera a Talent Tree, Forge, combate, curva de inimigos ou dados de personagens.
- As conditions e boss modifiers da Stage 0 continuam **inativos**; apenas se regista um manifest determinístico para as Realm Cards.

## Funcionalidades

1. **Saídas:** todos os botões visíveis de salas não limpas mostram `1 exit`, `2 exits`, etc. Contam-se ligações normais distintas, incluindo a ligação de regresso. Atalhos secretos não contam até serem descobertos.
2. **Segredos:** ligações secretas desconhecidas deixam de aparecer desenhadas no SVG; a sua contagem e a possibilidade de atravessar só se atualizam quando descobertas ou alcançadas pelo lado oposto, tal como exigia o sistema anterior.
3. **Viagens:** o controlador passa a escolher o percurso de menor **custo real de passos**, em vez de escolher apenas o menor número de arestas. Mantém o cálculo original dos custos e a validação de orçamento antes de confirmar a viagem. A interface existente já mostrava o custo e os passos restantes no modal; passa a mostrar o custo do percurso otimizado.
4. **Scouting:** `Oracle of Paths`, quando encontrado no novo modo Dungeon, permite revelar até 2 salas próximas ainda não visitadas e uma ligação secreta próxima, se existir. Revelar não visita nem limpa salas, não concede recursos, não desconta passos. A outra escolha continua a dar `5 + E` Fragments; passar mantém-se possível.
5. **Disponibilidade do Oracle:** para preservar a sequência de RNG e as seeds anteriores, uma parte das ocorrências de `Cursed Altar` nas dificuldades Dangerous/Brutal é convertida em `Oracle of Paths`, **sem aumentar a quantidade de salas/eventos**. Não aparece ainda em Guarded por esta regra. Cursed Altar continua no jogo.
6. **Fundação:** a geração das três Realm Cards recebe um manifest da Stage 0, com seed de 32 bits, condições distintas e boss modifiers compatíveis. Este manifest fica no estado da Dungeon para as fases seguintes, mas não aplica os efeitos até às Stages 2–5. O ledger imutável regista os eventos de scouting.

## Ficheiros

- NOVO: `online/v013-map-intelligence.js` — rotas de custo mínimo, contagem de ligações, scouting e segredos.
- Alterados: `online/v012-expedition-controller.js`, `online/v012-expedition-runtime.js`, `online/v012-expedition-events.js`, `index.html`, `package.json`, `tests/v012-economy-harness.cjs` (agora carrega Stage 0/1 no simulador).
- NOVOS testes: `tests/v013-map-intelligence.test.cjs`, `tests/v013-map-ui.test.cjs`.

## Validação efetuada

Com os módulos de jogo equivalentes aos blobs do GitHub verificados por SHA:

```bash
npm run test:v013:map
node --test tests/v013-map-intelligence.test.cjs tests/v013-map-ui.test.cjs tests/v013-expedition-foundation.test.cjs tests/v013-simulation.test.cjs
```

- **28/28** testes direcionados passaram no snapshot local (incluindo o evento Oracle real com colocação de sala controlada).
- **10.000 seeds geradas**, produzindo 30.000 Realm Cards com 18/20/22 salas, condições e contagem de saídas válidas.
- Verificação independente em 30.000 Realm Cards: 0 mapas cujo boss estivesse inicialmente inacessível dentro do orçamento de passos, considerando ligações normais.
- Testes de caminhos com custo mínimo, corredores limpos, atalhos fechados/abertos, scouting e diário de decisões.
- Teste isolado de renderização HTML do mapa, incluindo uma ligação secreta oculta e a sua revelação.
- O harness do PR #40 agora injeta os novos módulos na sandbox, garantindo que a simulação testa as novas rotas. Os 7 testes direcionados do simulador continuam a passar.

**Não foi verificado:** browser completo, ações reais de clique em dispositivos desktop/mobile, integração no site público, CI GitHub e suíte completa v0.13 (com falhas antigas conhecidas). Não declarar RELEASE/QA concluído.

## Próximos passos

- Rever PR e efetuar QA visual (desktop e mobile) em ambiente isolado, antes de publicar.
- A Stage 2 ativa Encounter Traits no motor de combate e apresenta sinais de risco nas salas já reconhecidas.
- Nas Stages 3–4, o Oracle poderá revelar propriedades reais dos bosses quando estas estiverem implementadas. Nesta Stage 1 revela somente salas e passagens.
