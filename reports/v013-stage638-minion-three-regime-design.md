# Stage 6.38 — Minions normais frágeis e UMA curva contínua de três ritmos

## Alterações implementadas (candidatas, sem merge/deploy)

A Stage6.35 analisou 500 contas E1-born (91 chegaram E200). Medianas de Power do mesmo jogador: E1→2 +51,351%; E3→4 +11,062%; E5→6 +7,792%; E8→9 +4,010%; E9→10 +1,632%; E11→12 +0,924%. Estes valores são evidência da mudança de ritmo, **não** uma calibração de DPS efetivo nem uma prova matemática das novas taxas.

### Minions de salas normais

A base comum de Minion continua inalterada para **não enfraquecer invocações especiais de Bosses/Elites**. Só os Minions de salas normais recebem uma mudança única, depois de Risk e antes dos Traits:

- HP × 0,38
- Attack × 0,60
- Defense × 0,55
- Attack interval × 1,18 (menos ataques por segundo)

Exemplo E1 Risk 0: minion anterior ~150 HP e 5 ATK, agora ~57 HP e 3 ATK, ataques a cada ~2,58 s em vez de ~2,19 s. Uma personagem inicial mediana tem 119 HP e 18 Attack, embora o dano efetivo varie com a defesa.

Os Minions são enfraquecidos nos grupos normais de 2, 3, 4 e 5+ (incluindo reservas); os principais mantêm os seus atributos intrínsecos. Em grupos normais 5+ mistos, continua a aplicar-se a regra da Stage6.37 **somente aos principais**, dependente do número total inicial de Minions. Não há dupla penalização nos Minions nem recálculo após mortes.

Invocações especiais de Bosses/Elites não são afetadas, nem talentos, equipamento, loot, risco ou habilidades.

### Uma única função C-infinito para todos os inimigos

Se x = E − 1 e softplus(z) = ln(1+exp(z)), definir:

I(x,c,w) = w [softplus(c/w) − softplus((c−x)/w)]

R(E) = 0,775 × exp(0,0125x + 0,0775 I(x,8,1,4) + 0,25 I(x,3,1,0))

Este modelo tem inclinação logarítmica **inicial 0,34**, intermédia **0,09** e tardia **0,0125**, com duas transições suaves centradas em E4 e E9. **Não existem condições especiais nesses níveis, nem patches por Expedition**. O declive continua estritamente positivo, aproximando-se de 0,0125 a longo prazo. Todos os mobs, Elites e Bosses usam a mesma referência antes dos respetivos coeficientes de identidade.

| E | R anterior Stage6.37 | R candidata Stage6.38 | Diferença |
|---:|---:|---:|---:|
| 1 | 0,775 | 0,775 | 0% |
| 2 | 1,091 | 1,067 | −2% |
| 3 | 1,390 | 1,430 | +3% |
| 4 | 1,650 | 1,825 | +10% |
| 5 | 1,871 | 2,189 | +17% |
| 8 | 2,311 | 2,974 | +29% |
| 9 | 2,400 | 3,160 | +32% |
| 10 | 2,483 | 3,308 | +33% |
| 12 | 2,598 | 3,501 | +34% |
| 20 | 2,968 | 3,916 | +32% |
| 70 | 5,977 | 7,316 | +22% |
| 100 | 9,112 | 10,645 | +17% |
| 200 | 36,925 | 37,156 | +1% |

Estes percentuais são da **referência matemática**, não de HP/ATK efetivo, que inclui termos constantes, coeficientes e arredondamentos.

Os parâmetros são uma **proposta experimental**, não foram ajustados a percentagens de vitória. É necessário validar porque Elites e Bosses, ao contrário de Minions, tornam-se mais fortes em E4–E12 e podem passar a difíceis demais.

### Testes e aceitação

1. Provar subida contínua em E1–E1000, ausência de saltos em E4/E9, E1 exatamente preservada e E200 praticamente igual.
2. Verificar que só os Minions de salas normais recebem o perfil novo; testes nativos com grupos 2/4/6/12 e E1/E5/E10/E70 e sem alteração de Bosses/Elites especiais.
3. Regressão completa do jogo, artefactos Pages e SHA256.
4. Nova matriz **100 perfis × 5 seeds = 500 contas E1-born**, todas a desbloquear E2–E5 naturalmente, sem gear/XP sintéticos. Separar Solo, 2–4, 5+, Elites por identidade, Bosses e alcançe E2/E5.
5. Comparar com o censo Stage6.37: GitHub run 45199904168, E1 grupos 2–4 **540/2077 (26%)**, E1 grupos 5+ **0/581**, E1 Elite **808/1328 (60,8%)**; E5 grupos 2–4 **257/346 (74,3%)**, grupos 5+ **15/71 (21,1%)**, Elite **169/172 (98,3%)**.
6. Os resultados serão uma comparação **conjunta** de duas alterações entre amostras naturais: não provam causalidade de cada efeito isolado. Se houver regressão, fazer experiência A/B por variável antes do merge.

**Sem merge, deploy ou mudança nas regras de loot/talentos/equipamento.**

Branch Stage6.38 baseada na Stage6.37, PR #141.
