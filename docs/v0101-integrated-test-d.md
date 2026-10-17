# Wanderer v0.10.1 — Teste D: Forge Quality + Legendary +10 + Affinity Sigils

**Data:** 17/10/2026  
**Estado:** apenas investigação offline. Não alterar `main`, gameplay, Firebase, regras ou saves.  
**Fonte testada:** ZIP da antiga `main` fornecido pelo utilizador; SHA-256 de `index.html`: `a69bef5e2f1d0842f79b692839012ab9e621a6b07cda0ba4a2fedef858b36126`. Mudanças subsequentes à `main` não estão incluídas.

## Objetivo

Verificar como três sistemas propostos para a v0.10.1 competem pelos mesmos recursos, Gold e Fragments, e afetam o caminho D1–D200 e a repetição de crafts. Os agentes usam o combate e a economia originais no harness Node VM, com campanhas persistentes, morte/perda de equipamento, Forge, Merchant, runas, boss, equipamento legal e estratégias Casual/Experiente/Speedrun. A mecânica experimental é aplicada **apenas à cópia de teste**.

**Forge Quality:** investimento opcional de +100% Fragments por craft, quando há saldo; no exemplo tier100 com fronteira 101, probabilidade Epic aumenta aproximadamente de 6,8% para 12,8%, sem Legendary. Quando o suplemento não é possível, craft normal.

**Legendary +10:** cada melhoria aumenta +2% dos atributos positivos originais, progressão linear, no máximo +10, custo `round((25 + 4*tier) * 1.14^rankAtual)` Fragments. Sucesso garantido; no máximo duas melhorias por visita; tier, afinidade e habilidades da Legendary não mudam. Se a Legendary morrer desprotegida, perde-se o investimento.

**Sigils redesenhados:** o agente escolhe diretamente uma afinidade legal para o subtipo de um item Rare/Epic **não-Legendary**; custa em torno de 2.000 Gold + 1.010 Fragments no tier 100, tem **65%** de sucesso, e falhar consome recursos mas mantém a afinidade antiga. Tenta preferencialmente completar um tier de 3 ou 5 peças com ganho de utilidade de pelo menos 3,5%, a cada oito expedições no máximo. Sigils são comprados e consumidos na mesma visita *no protótipo*: inventário persistente e UX não foram testados.

## Amostras

**Seleção principal:** 8 combinações × 30 campanhas (10 seeds `931500–931509` × três políticas), até 600 expedições.  
**Validação independente:** 3 candidatos × 60 campanhas (20 seeds `931550–931569` × três políticas).  
**Total:** **420 campanhas, 237.433 expedições**. RNG inicial emparelhado, embora sequências subsequentes diverjam após decisões diferentes.

### Seleção principal (30 por cenário)

| Sistema | D200 | Profundidade mediana | Crafts medianos | Sigils usados (total) | Upgrades Legendary (total) |
|---|---:|---:|---:|---:|---:|
| Atual | 8/30 | D106 | 405 | 0 | 0 |
| Forge Quality | 10/30 | D154 | 310 | 0 | 0 |
| Legendary +10 | 13/30 | D166 | 383,5 | 0 | 857 |
| Sigils | 7/30 | D122,5 | 405 | 139 | 0 |
| **Forge + Legendary** | **14/30** | **D195,5** | **310,5** | 0 | 1.007 |
| Legendary + Sigils | 13/30 | D178,5 | 380,5 | 127 | 1.079 |
| As três | 14/30 | D189 | 310,5 | 26 | 1.050 |
| As três — Sigil antes de Legendary | 14/30 | D189 | 310,5 | 39 | 1.002 |

A ordem de investimento aumentou tentativas de Sigil, mas **não** aumentou conclusões D200 nessa amostra. Os Sigils isolados foram usados sobretudo por Casual (137/139 tentativas): a política de avaliação do agente é um viés importante, não um resultado de comportamento humano.

### Validação independente (60 por cenário)

| Sistema | Conclusões D200 | Casual / Experiente / Speedrun | Profundidade mediana | Crafts medianos | Farming mediano |
|---|---:|---|---:|---:|---:|
| Atual | **22/60** | 5 / 7 / 10 | D118 | 379 | 328,5 |
| **Forge + Legendary** | **27/60** | 11 / 9 / 7 | D178,5 | 319,5 | 294 |
| As três | **23/60** | 7 / 9 / 7 | D168 | 319,5 | 302 |

**Interpretar com cautela:** +5/60 conclusões de Forge+Legendary versus baseline são +8,3 p.p., intervalo de bootstrap emparelhado de 95% aproximado **[−10; +25] p.p.**; não confirma vantagem estatística em D200. Contudo, o número médio de crafts é **76,1 menor por agente** (IC95% aproximado **[−87,9; −63,1]**), um sinal mais consistente.

Adicionar Sigils ao Forge+Legendary deu **4 conclusões a menos em 60** (−6,7 p.p.; IC95% **[−15; +1,7]**), sem vantagem consistente na progressão. Nos 60 agentes com todos os sistemas, os Sigils somaram **61 tentativas e 45 sucessos**, com mediana **zero por jogador**. O investimento médio em Legendary baixou aproximadamente três upgrades por jogador no braço com Sigils. Sigils disputam os Fragments e o critério de uso demasiado específico limita bastante a função.

### Comparação de recursos — validação independente

| Métrica | Atual | Forge + Legendary | As três |
|---|---:|---:|---:|
| Gold restante, mediana | 5.817,5 | 7.860 | 7.539 |
| Fragments restantes, mediana | 2.458,5 | 1.397 | 1.248,5 |
| Crafts, total | 22.745 | 18.182 | 18.200 |
| Crafts Epic, total | 1.558 | 1.538 | 1.505 |
| Investimento extra Forge, mediana | 0 | 55.335 | 48.010 |
| Investimento Legendary, mediana | 0 | 17.314,5 | 15.649,5 |
| Legendary upgrades, mediana | 0 | 37,5 | 30,5 |
| Sigils, tentativas totais | 0 | 0 | 61 |

Contagens de Epic misturam números de crafts e tiers diferentes: **não** são uma comparação de chance Epic por craft ao mesmo tier. As taxas de vitória têm efeito da estratégia do agente e truncagem após 600 expedições; os resultados não garantem facilidade para jogadores reais.

## Segurança e verificações

- **0 erros** nas 420 campanhas; nenhum saldo Gold/Fragments negativo em qualquer expedição; **0 Legendary produzidas pela Forge**.
- Hash de `index.html` igual ao ZIP de origem no fim. Controlo `base` reproduz exatamente a política `baseline` na mesma seed.
- Testes do código da fonte: **Shatter/Double Strike PASS**, **affinity scaling PASS**, **22 Legendary/signaturas PASS**, **abilities/progression 6/6 PASS**; guardas do sistema experimental PASS.
- Sigils não mudam Legendary nem aplicam afinidades novas fora do pool permitido; falha conserva a afinidade.
- Dados Firebase, migração de save, UX móvel e persistência de Sigils **não foram testados**. Jogo original e publicações intocados.
- Os intervalos de confiança são bootstrap por grupo de seed, exploratórios, sem correção para as várias alternativas. Emparelhamento da seed não garante os mesmos eventos aleatórios após decisões diferentes.

## Decisão proposta para v0.10.1

1. **Prototipar Legendary +10:** atributos originais +2% por melhoria, custo crescente, máximo +10, sucesso garantido e **aviso visível** quando uma Legendary melhorada está desprotegida na dungeon. Nenhum aumento das habilidades especiais/tier.
2. **Prototipar Forge Quality opcional:** craft normal continua disponível, suplemento de +100% Fragments com chances Rare/Epic explícitas; nunca Legendary. Benefício observado mais sólido é **menos ações de crafting**, não maior eficiência de Fragments.
3. **Adiar Affinity Sigils** até novo teste de UX/buildcraft e regras de compra/uso. A variante redesenhada não demonstrou melhorar a progressão e foi pouco usada junto dos outros sistemas; o objetivo de mudar afinidade continua interessante, mas não justifica ainda implementação numérica.
4. Antes de qualquer merge: testar estes candidatos sobre o **commit mais recente da `main`**, fazer testes com jogadores, validar UI mobile, versões de save e Firebase rules, e medir perdas de Fragments após mortes com Legendary +10.

**Nenhuma alteração de gameplay está aprovada nem foi feita nesta investigação.**

Dados individuais, código da pesquisa e comparações bootstrap: artefacto `Wanderer_v0101_Teste_D_Dados_e_Scripts.zip` gerado na conversa original.