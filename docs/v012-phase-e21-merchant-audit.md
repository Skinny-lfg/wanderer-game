# Wanderer v0.12 — E.2.1 Merchant: auditoria económica com ações reais

**Resultado: PASS técnico; política de compra não validada (0 compras). Não concluir sustentabilidade.**

Execução isolada em `development`, sem mudanças de preços, drops, combate, saves ou Firebase.

GitHub Actions: https://github.com/Skinny-lfg/wanderer-game/actions/runs/39666890492

## Desenho
Mesmo gerador E.1.3: 9 agentes Bow/Leather, 30 tentativas cada. A controla (sem Merchant); B e C analisam 4 ofertas reais a cada 2 tentativas e fazem refresh a cada 4 tentativas quando não aparece item elegível. Apenas compram se for mesma slot/subtype/armorType e superar a melhoria relativa de power (B 0,5%, C 1,2%). A compra percorre `a.buy()` e a atualização usa `a.equip()`; nenhum item/Gold artificial é inserido.

**Limitação importante:** os critérios são demasiado restritivos para as ofertas observadas, e a política não compra nenhum item. Isto é um teste de utilização do refresh, não uma medida de custo de melhorias adquiridas no Merchant.

## Resultados (270 combates, nenhuma falha ou timeout)

| Métrica | A sem Merchant | B otimizado | C recuperação |
| --- | ---: | ---: | ---: |
| Tentativas | 90 | 90 | 90 |
| Vitórias | 39 | 53 | 46 |
| Derrotas | 51 | 37 | 44 |
| Maior desbloqueio | E218 | E222 | E218 |
| Compras Merchant | 0 | 0 | 0 |
| Refresh Merchant | 0 | 24 | 24 |
| Gold gasto Merchant | 0 | 20 388 | 20 220 |
| Gold final (3 personagens) | 246 826 | 195 236 | 197 668 |
| Melhorias equipadas de Merchant | 0 | 0 | 0 |
| Crafts | 24 | 42 | 10 |
| Upgrades (qualquer origem) | 5 | 15 | 5 |

**Total:** 138 vitórias, 132 derrotas. B alcançou E217/E222/E214; A E213/E208/E218; C E218/E210/E210. Diferenças na progressão não podem ser atribuídas a compras (nenhuma ocorreu); rerolls consomem Gold e alteram o estado aleatório, logo comparações entre trajetórias não são estritamente pareadas. Gold ganhos variam ligeiramente entre E.2 e E.2.1.

## Decisão

- **PASS** do driver de 270 execuções, persistência e custo de refresh; não foram observados erros de runtime.
- **FAIL metodológico** do objetivo de medir custo por melhoria adquirida no Merchant: não existem compras.
- Não ajustar Gold, preços, balanceamento ou chances com estes resultados.
- Próxima iteração: separar um teste dirigido de compra real com item elegível e acessível, garantindo compra, mudança de Stash e débito de Gold; depois executar matriz com política de compra que possa aceitar upgrades realisticamente, registar ofertas rejeitadas por razão (slot, subtype, ganho, preço) e estimar Gold por equipamento *efetivamente equipado*.
