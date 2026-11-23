# Stage 6.35 — censo de progressão a partir de E1

O workflow está preparado para **100 perfis × 5 sementes = 500 contas E1-born**, com evolução nativa, até E200 apenas se a conta desbloquear legitimamente esse nível.

**Invariantes:**
- 12 tentativas nativas no máximo por Expedition por conta, teto de 400 tentativas totais.
- Uma medição por primeira entrada em Camp de cada Expedition; comparação aos pares E e E+1, não diferença de medianas populacionais.
- XP, talentos, itens, fontes de loot, condições de morte e contratos são os do jogo. Não há boosting nem gear/escalão artificial.
- 100 shards esperados; o relatório agregado só existe depois da verificação de **todos os 500 IDs/seeds**, sem duplicação nem fontes divergentes.
- Cobertura n=0 ou insuficiente é censurada; a ausência de E100/E200 não autoriza projeção arbitrária.
- Sucesso técnico do workflow não equivale a valores de crescimento ou win-rates corretos.

**Indicadores medidos:**
`power` de UI (apenas diagnóstico), HP, ATK, DEF, Spell Power, velocidade, Crit, Block, Evasion e ATK×Attack/s básico. Contagem de novos talentos e atributos, substituições reais de equipamento por slot, raridades e `v013Budget` do próprio item (com contagem explícita de orçamentos desconhecidos).

**Próximas decisões (após os dados):**
1. Determinar taxas medianas da personagem por Expedition e por família, distinguindo crescimento extraordinário inicial, patamares de gear e aproximação ao limite de talentos.
2. Ajustar a **curva de referência comum** dos inimigos sem segmentos desencontrados, usando apenas faixas com suporte medido. Não comprometer E200 com uma extrapolação apresentada como medição.
3. Com a referência estabilizada, corrigir bases/skills de mobs normais, Elites e Bosses **individualmente** para a hierarquia de dificuldade pretendida e avaliar separadamente grupos 1/2–4/5+.
4. Preservar a longevidade dos bons itens: sem aumentos obrigatórios de atributos a cada Expedition, nem transformar um Rare antigo automaticamente em lixo por causa do E.

Referência de validação inicial da instrumentação: https://github.com/Skinny-lfg/wanderer-game/actions/runs/45182852952

**Nenhuma alteração de gameplay, merge ou deploy nesta Stage.**
