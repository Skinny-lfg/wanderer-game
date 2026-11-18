# Wanderer v0.13 — Stage 4.5.3 · Integração nativa e regressões históricas

**Data:** 2026-11-17. **Base:** Stage 4.5.2, commit `283b8391573ab32d475a6605d74022d4a6ce320c` (PR #47).  
**Âmbito:** novos testes e CI, inventário de falhas; **nenhuma alteração ao código do jogo, saves, mapas ou recompensas**. PR empilhado na branch da Stage 4.5.2, sem merge nem deploy.

## Objetivo e resultado

Depois de corrigir os checkpoints na Stage 4.5.2, faltava testar as mecânicas das Stages 0–4 **durante o percurso real** e separar as falhas da suíte histórica dos problemas do modo Dungeon atual.

| Teste | Antes | Depois | Resultado local |
|---|---:|---:|---|
| `npm run test:v013` | 219/219 | **229/229** | 0 falhas |
| `npm run test:v013:sim` | 7/7 | **7/7** | 0 falhas |
| `npm test` (geral/histórico, checkout parcial) | 281/387, **106 falhas** | **281/387, 106 falhas** | **0 novos nomes de falhas, 0 resolvidos** |

**Não foi feita reescrita dos resultados esperados ou desativação de testes para forçar um estado verde.** A suíte histórica continua vermelha e está explicitamente fora do novo gate de v0.13, sem ser descartada. A cobertura histórica não foi toda migrada.

## Testes de integração sem atalhos artificiais no mapa

Novo `tests/v013-full-expedition-integration.test.cjs`, com **7 testes**, usa `tests/v012-economy-harness.cjs`, o controlador e o motor de combate reais, com mapas de seeds naturais e sem alterações à topologia. O trajeto usa BFS sobre as ligações normais geradas e, a cada passo, confirma o custo efetivo indicado pelo controlador. **O BFS de diagnóstico tem acesso ao grafo gerado**; não é ainda uma política de exploração com informação limitada (Stage 8).

1. **Guarded:** Elite marcado → Forgotten Reliquary (sacrifício) → boss. Verifica −10% Attack, remoção da única propriedade e uma única vitória.
2. **Dangerous:** Elite marcado → Reliquary → boss. Verifica −1 guarda, desativação da propriedade conhecida, custo exato de HP e diário de decisões único.
3. **Brutal:** o mesmo percurso, mantendo 12 passos iniciais e uma chegada possível ao boss sem passos negativos.
4. **Rush:** boss com o conjunto completo de propriedades quando os objetivos são ignorados.
5. **Recover Supplies:** cura de HP/Mana no Reliquary sem enfraquecimento do boss.
6. **Oracle of Paths natural:** reconhecimento de salas e uma única propriedade adicional, preservando os dois modifiers do boss durante o confronto.
7. **24 expedições diretas** (8 seeds × 3 dificuldades) por caminhos normais que contornam o Elite marcado; valida boss, orçamento, uma propriedade por nível de risco e ausência de benefícios opcionais não conquistados.

As escolhas e o checkpoint de sessão são restaurados em fases intermédias e verificados sem devolver passos ou repetir sacrifícios. A **vida dos inimigos é colocada a zero no teste** para abreviar encontros e isolar transações e navegação. Não utilizar estes testes como prova de equilíbrio de combate; o motor de combate real é também testado pelos cenários do simulador.

## Gate de integração em GitHub Actions

Novo `.github/workflows/v013-integration.yml`, com Node.js 22, `npm ci`, `npm run test:v013:gate` (suíte atual + simulador) em PRs e alterações a código/testes. Permissões restritas a leitura; **não publica nem modifica dados de jogadores**.

**Importante:** o novo workflow é um gate funcional de v0.13, **não um gate de lançamento**. `npm test`, testes de browser, assets, regras Firestore e validação de GitHub Actions devem continuar visíveis até corrigir os seus bloqueios. **A CI no GitHub não estava validada no momento de preparação deste relatório.**

## As 106 falhas da suíte geral — inventário, não perdão

Novo `reports/v013-stage45-3-general-suite-baseline.json` lista os **106 nomes exatos**, ficheiros, erros e uma classificação heurística. `scripts/v013-legacy-audit.cjs` compara um TAP posterior ao inventário e **assinala novos nomes de falhas**; não modifica o código de saída de `npm test` e não afirma que os erros conhecidos são seguros.

| Categoria preliminar | Falhas | Próxima ação |
|---|---:|---|
| Hashes do percurso v0.12 antigo | **21** | Não atualizar os hashes sem rever as diferenças de gameplay; migrar a cobertura útil para v0.13 |
| Checkout local incompleto (assets/config) | **9** | Executar no checkout completo com as dependências; verificar ficheiros de origem |
| Harness antigo com eventos/caminhos sintéticos | **11** | Migrar as transações para Realm Cards e boss atuais |
| Fixtures de saves/crafting desatualizadas | **7** | Rever estrutura válida de crafting e migrações reais |
| Mock DOM histórico (`onclick`) | **6** | Separar UI/DOM ou completar mocks; confirmar comportamento em browser real |
| Requerem revisão individual | **52** | Diferenciar regras antigas, efeitos reais e testes incorretos |
| **Total** | **106** | |

A cópia local do repositório usada para executar `npm test` **não contém** `assets/`, `.github/` ou `firestore.rules`. Confirmei através do conector GitHub que pelo menos `assets/status/icons/barrier.png`, `assets/bosses/animated/abyssal_guardian_idle.png`, `assets/loot/treasure_gem_pouch.webp`, `firestore.rules` e `.github/workflows/publish-firebase-development.yml` **existem na branch remota**. Portanto, falhas de ficheiros nesta cópia não provam problemas no repositório.

O ficheiro de testes `v012-runtime-integration.test.cjs` contém **23 falhas** na cópia local: 21 são hashes da antiga rota e 2 outros casos que precisam de verificação própria. Não foram eliminados nem tornados verdes artificialmente.

## Reprodução

```bash
npm run test:v013:integration
npm run test:v013
npm run test:v013:sim
# Requer checkout completo para auditoria histórica válida:
npm test > /tmp/wanderer-general.tap 2>&1
npm run audit:v013:legacy -- /tmp/wanderer-general.tap
```

O comparador devolve erro quando deteta nomes de falhas novos, mas **não substitui o exit code de `npm test`** e também não deteta uma piora num teste que já falhava com o mesmo nome. Não é suficiente como único gate.

## Limites / decisão sobre a Stage 5

- A **v0.13 funcional** tem cobertura integrada e gate reproduzível nesta branch.
- A **suíte geral mantém 106 falhas locais** e requer revisão no checkout completo, com prioridade para bugs reais, save/restore e combate, não apenas para atualizar expectativas.
- **Stages 4.5.4–4.5.5:** QA browser desktop/mobile e auditoria global de CI/saves/integração. Não iniciar Stage 5 nem publicar sem decidir como tratar os bloqueios restantes.
