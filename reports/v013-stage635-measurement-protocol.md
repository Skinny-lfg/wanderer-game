# Wanderer — Stage 6.35: medir primeiro o jogador, depois a referência inimiga

**Natureza:** diagnóstico nativo reproduzível. **Não altera gameplay nem faz merge/deploy.** A filosofia de manter bons itens úteis durante várias Expeditions é preservada.

## Objetivo e ordem do balanceamento

1. Observar a mesma personagem, desde a conta E1 real, à entrada da primeira tentativa de cada Expedition legitimamente desbloqueada.
2. Medir **a distribuição da variação percentual E→E+1 por personagem**, com n, p25, mediana, média, p75, incluindo variações negativas e zero.
3. Separar a variação total por famílias, preferências de armadura e cada atributo: HP, Attack, Defense, Spell Power, Attack/s, Crit, Block, Evasion, Power de UI (diagnóstico), e Attack×Attack/s básico (sem procs/magia).
4. Medir durabilidade do equipamento: troca real por ID em cada slot, raridades, total de itens, número de starters, orçamento real de affixes que o motor declara e diferenças de orçamento apenas quando todos os itens relevantes têm orçamento conhecido.
5. Relacionar tendências com talentos ganhos, características e número de jogadores que realmente alcançam a Expedition.
6. Só depois desenhar uma **curva comum suave e monotónica** para o valor base dos inimigos, baseada em intervalos observados e sem quebras por Expedition. **Não confundir essa curva com win-rates nem aplicar base tweaks sem combate.**
7. Finalmente usar ensaios nativos para calibrar cada classe/identidade Normal, Elite ou Boss, composição e tamanho de grupo; conservar hierarquia Boss > Elite > Tank > normal sem tratar um grupo de 5–22 como um só inimigo.

## Evidência anterior que motiva este desenho

Stage 6.32: 100 configurações × 5 seeds, **500 contas E1-born e 3156 checkpoints**, 398 chegaram E2, apenas 102 E20. O indicador `Power` de UI aumentou na mediana por conta **+54,955% E1→E2**, **+13,289% E5→E6**, **+2,111% E8→E9** e **+0,313% E19→E20**. O indicador **não é uma medida universal de dano ou sobrevivência**. Os HP/ATK individuais podem ficar constantes quando se aprende uma habilidade ou muda um item.

Stage 6.34: os 500 agentes E1-born com a nova exponencial chegam a E2 em 230 casos e a E5 em 150. Sucesso por combate resolvido:
- E1: normal 66,9%, Elite 76,9%, Boss 37,1%, grupo 5+ 0%.
- E5: normal 74,1%, Elite 100%, Boss 97,9%, grupo 5+ 8,3%.
- Solo em E5: 100%. Pequenos grupos 2–4 em E5: 68,3%.

Esses resultados são **condicionais à sobrevivência até à E observada**. Não são percentagens de vitória por Expedition, não garantem representar jogadores humanos, e combates da mesma conta não são estatisticamente independentes.

## Especificações verificáveis da Stage 6.35

- Branch própria empilhada sobre a Stage 6.34, sem modificar a versão publicada.
- `scripts/v013-stage635-native-player-envelope.cjs`: 100 perfis legais × 5 seeds, E1–E200, 12 tentativas legais por nível e até 400 tentativas por conta; nenhum desbloqueio artificial, XP/grind forçado, gear ou recursos inventados.
- Captura de estado com `D.checkpoint` e verificação da primeira tentativa da Expedition e da mesma conta.
- Em cada par E→E+1, apenas as contas com **ambos** os checkpoints entram na mediana. Membros do grupo variam com o nível; não multiplicar medianas consecutivas como se descrevessem uma única conta.
- Membros de uma classe mágica que começam com Spell Power 0 não recebem percentagem 0% fabricada: essa percentagem é `null` com n=0, e pode existir ganho absoluto efetivo de Spell.
- Um item trocado não é automaticamente um upgrade: o programa distingue **troca real** de melhoria real de `Power`, atributos e orçamento.
- Sem resultados para E100/E200? Reportar `null`/n=0 ou n insuficiente, **nunca extrapolar como medição**.
- Saídas: `reports/v013-stage635-aggregate.json` + Markdown em artefacto `stage635-native-player-growth-e1-e200-100x5`.
- O script gera apenas **referências provisórias por dimensão** quando pelo menos 50 pares existem, não um multiplicador oculto. Damage potential e sobrevivência real terão de ser medidos em teste de combate adicional.

## Critérios para a próxima fase

A Stage 6.36 deve propor uma curva de referência com intervalos de incerteza e suficiência amostral, mantendo a progressão de raridade e os patamares de itens. Se a amostra não alcançar E35/E70/E100/E200, a etapa seguinte será um estudo de progressão estendida/censura ou um limite explícito para a extrapolação, não uma afirmação de mediana observada em níveis não alcançados.

**Nenhum valor atual de `ENEMY_EXPONENTIAL_GROWTH`, `NORMAL_BASE`, `BOSS_BASE`, `ELITE_ARCHETYPES` nem itens foi alterado nesta etapa.**
