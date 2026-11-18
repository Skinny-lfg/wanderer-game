# Wanderer v0.13 — Stage 4.5.4 · QA de browser e integração

**Data:** 2026-11-17. **Base:** Stage 4.5.3 PR #48. **PR:** #50 (draft). Sem merge na `main`, sem publicação e sem alterações nos saves de produção.

## Ambiente realmente testado

- Checkout **completo** do repositório num runner GitHub Actions Ubuntu 26.04, Node 22, npm ci, **Google Chrome 157** com Playwright 1.56.
- Preview local isolada gerada por `scripts/prepare-automatic-preview.mjs`, sem contas nem acesso Firebase. Os helpers de diagnóstico são injetados exclusivamente numa cópia temporária do HTML e **não alteram o jogo**.
- Resoluções: **1440×900** desktop e **390×844** mobile em emulação de viewport Chrome; isto **não equivale a testes reais em iPhone/Safari nem Android**.
- Ecrãs capturados: Camp, Talent Atlas, Realm Cards, mapa, combate, restauração, Forgotten Reliquary e respetivo checkpoint, em `reports/stage45-4-browser/` num artifact ZIP da GitHub Actions.

## Casos realizados com interações reais

1. Camp carrega em desktop e mobile, sem erros JavaScript não tratados; verificação de largura da página mobile.
2. Talent Tree v15 em iframe carrega **343 nós**; selecionar família Blood, inspecionar o nó `root_blood` (nome apresentado `Attack Power`), investir um ponto, recarregar e confirmar persistência.
3. São apresentadas **3 Realm Cards** e a primeira propriedade conhecida do boss.
4. Selecionar Dangerous, inspecionar uma sala, confirmar custo de passos e entrar com clique no diálogo.
5. Arena apresentada no mobile e desktop; o encontro inicial pode ser **solo**, sem `.arenaEnemy` de grupo. Saída do combate e regresso ao mapa.
6. Recarregar durante a Dungeon e confirmar o mesmo nó atual e passos.
7. Navegar pelo **mapa efetivamente gerado** até ao Forgotten Reliquary, usando botões e custos verdadeiros; percurso observado `1 → 5 → 9` no teste aprovado.
8. Selecionar `Disrupt the Seal` pelo interface; verificar perda de exatamente **15% HP máximo** (arredondado), modifier de boss efetivamente desativado e estado registado.
9. Recarregar checkpoint e verificar que o modifier continua desativado e o sacrifício **não é debitado novamente**.
10. Medição automática de todas as caixas dos botões do mapa mobile, com limiar de interseção de 30 px²; após a correção de layout, medição observada **0 pares sobrepostos**.

O combate é acelerado por teste ao zerar HP dos inimigos, mas preserva as transações reais de vitória/resultado. **Não** é um teste de equilíbrio, telemetria em combate de longa duração ou resistência à carga.

## Problemas encontrados e ações

| Diagnóstico | Classificação | Ação |
|---|---|---|
| Playwright `--with-deps` não reconhece o runner Ubuntu 26.04 | Infraestrutura CI | Reutilização do Chrome instalado no runner, verificada |
| Teste antigo esperava `root_blood` exibido como “Blood” | Teste desatualizado | Seleção verificada pelo nome acessível real do nó |
| Teste procurava sempre inimigos de grupo | Teste desatualizado | Aceita inimigo solo `#enemyPortrait` ou grupo `.arenaEnemy` |
| Talent Atlas calculava `viewBox` SVG infinito com iframe temporariamente a 0 px | **Bug real de UI** | Correção defensiva em `preview/talent-rebuild/prototype.js` |
| Duas salas do mapa sobrepunham-se em mobile, com **1817 px²** de interseção | **Bug real de usabilidade** | Novo CSS `online/v013-stage45-map-qa.css`: cartografia scrollável maior e botões de largura legível; teste passou com **0 sobreposições** |

Os ficheiros de gameplay que implementam combate, rota ou economia **não foram alterados**. O CSS só altera apresentação mobile, mantendo topologia, passos, posições relativas e interações.

## Evidência CI

- **Run 44171064826 — browser: SUCCESS**: Talent v15 343 nós, fluxo Camp→Realm→combate→mapa→checkpoint, percurso real Forgotten Reliquary, desativação, custo de HP, reload e ausência de erros JS; 11 screenshots e `result.json`.
- **Run 44170443273 — browser: SUCCESS**: medição dos botões do mapa com zero interseções, antes do refinamento final da largura.
- As regressões nativas de Stage 4.5.3 continuam com seu gate separado (229 testes v0.13 e 7 testes do simulador, já executados com sucesso na Stage 4.5.3). O gate GitHub Actions `v013-integration` também é acionado em PRs; confirmar o resultado final da revisão mais recente antes de aprovar merge.

### Limitações e tarefas pendentes

- Não houve QA nativo em Safari/iOS, Firefox ou equipamento Android físico, nem QA de acessibilidade com leitor de ecrã.
- **Oracle of Paths, Elite marcado e boss final não foram percorridos por cliques de browser nesta suite**; os testes Node Stage 4.5.3 cobrem estes percursos com mapas naturais. Não tratar cobertura Node como prova de interface mobile.
- `npm test` histórico continua com 106 falhas no snapshot da Stage 4.5.3; algumas resultam de assets locais em falta, outras de paridade antiga ainda por migrar.
- O runner registou `npm ci` com **41 avisos de vulnerabilidade de dependências** (19 moderate, 21 high, 1 critical). Esta contagem é do `npm audit` e necessita de triagem específica; não demonstra vulnerabilidade explorável do jogo.
- O botão/scroll horizontal do mapa mobile deve ser também verificado em dispositivo real; esta QA confirma apenas ausência de sobreposição no Chrome emulado.
- **Stage 4.5.5:** aprovação e checklist de release, incluindo resolução/aceitação formal das limitações. **Não publicar até lá.**

## Reprodução

```bash
npm ci
CHROMIUM_PATH=/usr/bin/google-chrome npm run test:v013:stage45-browser
npm run test:v013:gate
```

O workflow `.github/workflows/v013-stage45-4-browser.yml` executa o browser QA em PRs e arquiva screenshots e `result.json`, sem permissões de escrita no repositório, Firebase ou deploy.
