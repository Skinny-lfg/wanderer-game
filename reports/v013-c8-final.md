# Wanderer v0.13 — C8 Final Clean Sheet & Coverage

**Data:** 20 de novembro de 2026. **Branch:** `audit/v013`. **Ponto de partida:** `52adcd86f9c570bdabecedc4226a4c5ef4fe1ac3`. **Código e workflow verificados:** `e9e590ba5ce62bca96e21e1001ca6088613106a7`.

**Resultado:** [C7 final](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44718433135) **4/4 jobs SUCCESS** e [clean-sheet scan](https://github.com/Skinny-lfg/wanderer-game/actions/runs/44718433114) **3/3 jobs SUCCESS**. Sem merge, deploy, alterações a `main` ou aos serviços de produção. A revisão final deste relatório é documental; a validação corresponde ao SHA de código acima.

## 1. Suites históricas limpas, com cobertura preservada

O TAP anterior continha **32 casos: 12 passavam, 20 falhavam** (7 expectativas obsoletas, 13 fixtures incompatíveis). A classificação individual permanece em [v013-ui-mechanics-audit.md](v013-ui-mechanics-audit.md).

- Removidas fisicamente as **20 verificações inválidas**; **nenhuma** foi marcada como skip/todo para fabricar um gate verde.
- Removido também o teste histórico ainda verde para ofertas de passivos esgotadas, pois examinava uma seleção de cartas que já não existe.
- Preservados **11 testes válidos** nas três suites de economia, equipamento e Endless. Foram incluídos em `test:v013`, pelo que as asserções continuam obrigatórias no C7.
- A cobertura corrente das invariantes relevantes é complementada pelos testes nativos de Dungeon, Forge, economia, runas, extração e combate. Não se reintroduziram `a.initial`, drafts, patches de saves ou atributos/tabelas de gear históricos.

Alterações nominalmente discriminadas em [v013-c8-historical-retirement.md](v013-c8-historical-retirement.md).

## 2. Testes nativos novos

O ficheiro `tests/v013-c8-clean-sheet.test.cjs` inclui **7 testes de regressão**, todos aprovados no C7:

| Área | Verificação e comportamento atual |
|---|---|
| Bag/derrota/equipamento | Gear adquirido e equipado durante a tentativa perde-se na derrota; o equipamento de entrada é reposto; Bag fica vazia |
| Overflow pós-vitória | Recompensas em overflow só passam à Stash quando existe espaço; claim idempotente |
| **Loot real do Boss com Stash cheia** | RNG controlado força uma jogada válida de loot (não é loot garantido em jogo); o drop nativo passa para overflow e é reclamado uma única vez |
| Boss Runes | Vitória real produz três opções distintas do tier correto; claim uma vez; desbloqueio de Expedition só uma vez |
| Dual Daggers | Um golpe de offhand a cada dois ataques principais; sem Double Strike recursivo |
| Wand + Orb | Barrier depende de cast financiado, cooldown de 6 segundos, cap de 30% HP e falta de Mana |
| Marcos de Camp | Renderização dos cinco ranks atuais, sem regressar aos marcos E225/E1025 da UI antiga |

## 3. Cobertura estática e navegação

O novo `tests/v013-c8-ui-wiring.test.cjs` adiciona **3 guards**, aprovados:

- 56 atributos `data-*` catalogados no `index.html`, dos quais 38 têm seletores de ligação e 18 são metadados de apresentação;
- 29 famílias de ações atuais com marcadores e seletores no entrypoint;
- Account, Leaderboard e Feedback com módulos externos associados.

O inventário por superfície e bloqueios legítimos encontra-se em [v013-c8-ui-inventory.md](v013-c8-ui-inventory.md).

O C7 repetiu navegação Chromium desktop/mobile, Talent Graph, Forge, inventário, Dungeon, Oracle, Elite, Boss, checkpoints e extração. O teste de **Feedback & Bugs passou a fazer parte obrigatória do job browser-journey**: 21 aberturas/fechos por clique, Escape, submissão simulada e rejeição de conta anónima/cooldown.

A varredura clean sheet voltou a passar. **Não houve eliminação especulativa de funções ou módulos de runtime** baseada apenas em nomes `v012` ou contagem de referências. Não foi demonstrado nenhum controlo corrente inteiramente sem handler no âmbito observado. A análise por seletores não demonstra executabilidade de todas as ramificações dinâmicas.

## 4. Gates observados no código final

| Job/suite | Resultado |
|---|---:|
| C7 obrigatório | **4/4 jobs SUCCESS** |
| `npm run test:v013` (inclui testes antigos retidos + 10 C8) | **295/295**, falhas 0, skipped 0 |
| Simulador v0.13 | **7/7** |
| Talent Graph v15 | **79/79** |
| Elite/Boss/combate/balanceamento/decisões | **94/94** |
| Economia, integração, eventos e checkpoint | **83/83** |
| Saves e conta | **51/51** |
| Auth/Firestore em emulador Java 21 | **11/11** |
| Chromium C3 / navegação profunda | **PASS** |
| Chromium feedback (agora obrigatório) | **PASS** |
| Progressão natural pilotos E1–E5 / E1–E20 | **executados com sucesso** (não é garantia de completar níveis) |
| `npm run build:pages` e `git status --porcelain -- docs` | **PASS — source/docs parity** |
| Clean-sheet scan | **3/3 jobs SUCCESS** |

As suites têm alguma sobreposição; os números não são somáveis como testes únicos.

## 5. Riscos fora da prova C8

1. Cobertura de todos os callbacks dinâmicos, todas as seeds/estados de UI e os estados de conta em produção **não é exaustivamente demonstrada**. A varredura estática é uma heurística.
2. Autenticação e escrita de feedback em Firebase **real** não foram exercitadas; usaram-se emuladores/stubs. Nenhum dado de jogador foi alterado.
3. As vulnerabilidades npm já reportadas requerem uma auditoria de dependências dedicada; um workflow security success **não** significa zero advisories.
4. O balanceamento e a progressão natural para E5/E10/E20 permanecem projetos próprios. C8 não modificou coeficientes ou probabilidades.

**Encerramento C8:** suites históricas ativas coerentes com clean sheet, sete regressões nativas novas, três guards de UI, feedback obrigatório no C7, código validado no SHA indicado e 4/4 jobs verdes. Restam apenas os limites explicitamente registados; não se confunde isto com prova absoluta de ausência de bugs.
