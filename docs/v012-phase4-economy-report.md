# Wanderer v0.12 — Fase 4: economia e sistemas permanentes

Data: 19/10/2026 · Branch: **development** · Base: `a4f1182` · Implementação: [`dc700b9`](https://github.com/Skinny-lfg/wanderer-game/commit/dc700b9)

**Resultado:** economia integrada e protegida no preview `?expeditionPhase1=1`. Pronta para revisão e trabalho da Fase 5 em ambiente isolado; **não pronta para lançamento ou migração de contas**. Não houve alterações a `main`, Firebase, regras, credenciais ou saves reais. Equipamento e recursos continuam em memória: sobrevivem à derrota, mas não ao refresh.

## 1. Validação das Fases 1–3 e sistemas preservados

Foram revistos os três relatórios anteriores e validados localmente os testes de buildcraft, controller, combate original e a travessia de 15 Planes em 390/1280 px. O motor continua a ser `index.html:weaponAttack/updateFight`; `online/v012-engine.mjs` não participa no balanceamento integrado.

Preservados: nove slots, duas rings, regras de duas mãos/offhand, stats e escalamento dos itens, raridades, imagens, efeitos permanentes, identidades Legendary, upgrades +0…+10, Forge, Merchant, comparação de equipamento, Runes/slots/salvamento, Gold e Fragments. Não foi importado o modelo simplificado de materiais/gear do protótipo nem criado um novo sistema de crafting. Arte, VFX, layouts e mecanismos de isolamento das fases anteriores permanecem ativos.

As seis famílias e passivos temporários continuam separados dos efeitos permanentes do equipamento. Um item Poison pertence à apresentação Decay; um item Storm à apresentação Magic. Isso não concede uma família temporária, não ocupa um dos três lugares da Expedition e não escolhe o elemento Magic.

## 2. Alterações concretas

### Forge, Merchant e moedas

- `economyTier()`/`merchantTier()` usam o maior tier de Expedition desbloqueado, limitado a 200, no preview. O antigo `state.maxDungeon` não é convertido nem alterado. Antes, Forge/Merchant permaneciam presos a tier 1 mesmo em E80.
- A Forge pode criar até ao tier desbloqueado; mantém o bónus de catch-up em tiers inferiores, seleção de slot/subtipo, investimento de qualidade e exclusão de Legendary dos crafts. O Merchant gera equipamento útil ao tier atual nas reposições/compras.
- Stocks existentes não são substituídos gratuitamente ao entrar, sair ou desbloquear um tier. Reposição de equipamento e reposição de Sigils continuam independentes e pagas. O custo de reposição acompanha a progressão no próximo desbloqueio.
- Sigils continuam a alterar **efeitos permanentes de gear**, com pools legais por subtipo, consumo em falha e proteção de Legendary. O Merchant apresenta a família correspondente e esclarece que não são rerolls dos Planes. Os 13 efeitos de gear não foram destruídos para os reduzir a seis IDs.
- Corrigida uma divergência preexistente: a função `qualityOdds` dentro da página tratava Masterwork como um booleano, cobrando 3× pelas probabilidades de High Quality. Agora corresponde a `economy/v0101.js`, já existente: maior investimento tem efetivamente melhores probabilidades. Não foi criada uma nova tabela.
- Mantidos custos: craft Standard `10 + 10 × tier`; High Quality 2×; Masterwork 3×; Sigil `100 + 9 × tier`; reposição `16 + 4 × tier`; reforço Legendary `(25 + 4 × tier) × 1,14^rank`, arredondado. Salvamento de crafts continua limitado a 25% do custo pago.

Gold mantém compras, Sigils, stocks e expansão do Stash; Fragments mantêm crafting, transferências e reforços. Nenhum aumento geral de rendimentos, preços, drops ou dificuldade foi aplicado.

### Loot, Runes e progressão

- Cada inimigo realmente derrotado gera uma oportunidade independente com as tabelas clássicas: Waves normais variam por posição; Elite usa a tabela superior; boss garante equipamento com a distribuição de raridade de boss. Mais Waves dão mais oportunidades, sem prémio por simples entrada ou escolha.
- Recompensas são atribuídas uma vez por checkpoint de Wave. Continuam retidas depois da derrota, juntamente com o equipamento vestido.
- Stash cheio: equipamento ganho fica numa reserva de loot assegurado em memória, sem apagar nem auto-salvar peças. Quando existe espaço, é transferido uma vez para o Stash. O Camp mostra a quantidade pendente; outra Expedition fica bloqueada até resolver a reserva/libertar espaço. Usa-se a interface de inventário e expansão existente.
- Mantida a política clássica de milestones: boss final de **E10/E20/…/E200** oferece uma escolha entre três Runes permanentes, com os IDs, valores, três slots e interfaces existentes. Elites e bosses intermédios não dão Runes. Repetir um milestone completo permite procurar outras Runes, como no original.
- Uma Rune pendente tem de ser escolhida antes de outra entrada; a escolha não pode ser repetida nem atualizar acidentalmente o progresso D1–D200. Só o boss da Plane 15 desbloqueia o próximo tier.
- E200 é o limite técnico atual, coerente com gear/Runes/validação existentes. E201 exigirá uma extensão aprovada; não se geram itens fora do formato suportado.
- Rações continuam limitadas a duas Health e duas Mana por Expedition, utilizáveis apenas entre Planes. Não foi inventada uma loja de consumíveis; preço/aquisição definitiva permanece decisão de design.

## 3. Simulações do motor integrado

Dados completos, seeds, escolhas, custos, hashes do HTML e resultados: [v012-phase4-economy-metrics.json](v012-phase4-economy-metrics.json).

Por versão: **324 cenários individuais + 12 campanhas de 24 tentativas = 612 Expeditions**; antes/depois totalizam 1.224. Sem timeouts. Node 22.23.3; RNG determinístico. O harness executa os ataques, defesas, DoTs, Elite/boss, drops, crafting e compras reais da página; apenas DOM, relógio e contas são isolados. Não são fórmulas do protótipo nem resultados de jogadores reais.

Matriz principal: E1/E20/E80/E200, gear a 25/75/100/150% do tier, Rare completo, seis seeds e três políticas que preferem sustain, ofensiva ou Magic/Decay. Os sete subtipos de arma são distribuídos ciclicamente; não há todas as combinações de arma em cada célula. E1 arredonda tiers baixos para 1; E200 limita 150% a 200, portanto algumas células repetem fixtures. Acrescentados 18 cenários com troca de loot entre Planes e 18 com arma Legendary +10 e três Runes. Os bots escolhem por prioridades e Gear Power, não constituem um jogador ótimo.

Resultados médios com gear Rare do **mesmo tier**, sem trocas durante a tentativa; cada linha tem 18 cenários:

| Expedition | Vitórias | Waves vencidas | Gold | Fragments | Peças | Crafts Standard potenciais* |
|---|---:|---:|---:|---:|---:|---:|
| E1 | 18/18 | 31,28 | 167,44 | 79,50 | 12,56 | 10,04 |
| E20 | 1/18 | 10,78 | 162,33 | 68,89 | 4,22 | 1,80 |
| E80 | 5/18 | 17,06 | 771,89 | 367,00 | 7,06 | 2,98 |
| E200 | 12/18 | 26,89 | 2.835,39 | 1.363,06 | 12,39 | 5,33 |

\* Limite superior: inclui vender todas as peças recebidas, até as úteis/Legendary. Não é recomendação nem número de crafts efetivamente executados. Nas campanhas, compras/crafts/salvamento são transações efetivas com recursos ganhos, sem saldo inicial artificial.

Os resultados de combate e os rendimentos da matriz sem trocas ficaram iguais antes/depois, como esperado: esta fase não alterou coeficientes de combate/drop. Mudou o acesso aos serviços económicos. Nas tentativas com gear a 25%, nenhuma venceu E20/E80/E200. Com gear a 150%, venceram 8/18 em E20 e 15/18 em E80. Com arma Legendary +10 e três Runes ao tier, foram 3/6, 6/6 e 6/6 em E20/E80/E200: sistemas permanentes mantêm impacto significativo.

Nas campanhas, começou-se com o equipamento inicial verdadeiro do preview, sem gerar um loadout Rare completo. As três seeds incluem políticas de sustain/Magic, equipamento automático por Gear Power, até quatro crafts ou compras por tentativa e uma reposição paga do Merchant. Tier mais alto desbloqueado após 24 tentativas:

| Política | Antes — seeds 1/2/3 | Depois — seeds 1/2/3 | Transações depois |
|---|---|---|---|
| Loot | E9 / E2 / E10 | E9 / E2 / E10 | Sem compras/crafts |
| Forge | E9 / E4 / E7 | E16 / E5 / E7 | 92 / 91 / 83 crafts |
| Merchant | E10 / E3 / E11 | E8 / E4 / E9 | 7 / 4 / 3 compras úteis |
| Ambos | E12 / E4 / E7 | E11 / E4 / E8 | 92 / 92 / 88 crafts; 6 / 6 / 7 compras |

Isto demonstra utilização real, **não superioridade garantida** de uma estratégia. Compras/crafts consomem RNG e alteram o percurso; o baseline vendia equipamento barato de tier 1 e não é uma economia funcional de referência. Algumas políticas gastam pior, e três seeds não aprovam o meta.

### Leitura do balanceamento

- Forge é relevante e permite preencher slots; Merchant oferece gear ao tier correto, mas o seu custo reduz compras frequentes. Valores em E200 continuam finitos: Standard 2.010 Fragments, Sigil 1.900 Gold e reposição 816 Gold; reforço +0 custa 825 Fragments. Acessibilidade não é garantida em toda tentativa falhada.
- Gear muito inferior é um bloqueio efetivo. Contudo, E20 é mais difícil que E200 nas fixtures equivalentes: o escalamento atual não produz uma curva relativa uniforme. Não foi mascarado com equipamento sintético superforte.
- O boss ainda mata, mas não é o principal obstáculo observado: com gear ao tier, chegaram ao boss 2/18 em E20, 6/18 em E80 e 13/18 em E200; venceram 1, 5 e 12. A atrição anterior merece mais atenção que um aumento isolado do boss.
- Ofensiva teve 0/6 vitórias em E20/E80; sustain foi melhor nesta amostra. Requer ensaios adicionais de armas, Legendary e combinações antes de nerfs/buffs.
- Cerca de 12,6 peças/E1 com loadout Rare completo é muito para nove slots. Forge/Merchant continuam usados nas campanhas, mas inflação a longo prazo e excesso de Fragments em políticas que não gastam continuam riscos. Mantiveram-se as tabelas até revisão dos resultados.

## 4. Exploits e proteções verificadas

1. Chamadas repetidas de vitória ou vitória sobre inimigo vivo não atribuem prémios; checkpoint e etapa têm de coincidir.
2. Entrar/reabrir não concede moedas, drops ou novas Runes. Reposição é paga e não mexe no outro stock.
3. Callbacks antigos de crafting/compras/reposição são bloqueados durante escolha de rota, draft e combate; confirmação de compra revalida o stock e o saldo.
4. Loot com Stash cheio não ultrapassa a capacidade nem desaparece; reivindicação não duplica IDs. Outra entrada não descarta a reserva.
5. Rune pendente não é sobrescrita; o claim é único e não desbloqueia dungeons clássicos.
6. Ganhos de HP/Mana por equipar/desequipar continuam bloqueados. O clamp passou a ser chamado também nas ações de equipamento/Rune, sem depender apenas do render da interface.
7. Corrigida a cobrança de Masterwork sem melhoria efetiva das probabilidades; verificação compara a função real com o helper original.

Estas proteções são locais. Ainda não existe ledger durável contra crash/múltiplos dispositivos; não se afirma proteção autoritativa contra clientes alterados.

## 5. Testes, commits e reprodução

Implementação: `dc700b9` — ligação da economia, proteções, simulador e testes. Este relatório e métricas ficam num segundo commit documental em `development`.

Passaram localmente:

- `npm test`: regressões clássicas, economia, save/model, buildcraft, controller e combate integrado; inclui sete testes novos de economia. O teste antigo de balanceamento do protótipo também passou, mas **não** fundamenta as conclusões acima.
- `npm run test:assets`: VFX e browser clássico/mobile; preview; Expedition integrada; travessia das 15 Planes em 390/1280 px; novo teste económico nas duas larguras.
- Teste de integração Fases 1–3 e testes económicos executados; o comando `test:v012:integration` foi atualizado para incluir também os novos testes económicos.
- `git diff --check`; snapshots/sentinelas de localStorage intactos e ausência de módulos de conta/Firebase no preview.

A CI remota ainda não foi verificada neste relatório. Não foram executadas operações Firebase ou deploys.

Reprodução a partir da raiz do checkout, com Node 22, dependências e Chromium instalados:

```sh
npm run test:v012:economy
npm run simulate:v012:economy -- /tmp/v012-after.json
git show a4f1182:index.html > /tmp/v012-before.html
node scripts/v012-economy-sim.cjs /tmp/v012-before.json /tmp/v012-before.html
```

O baseline substitui o HTML pela versão anterior; usa o mesmo buildcraft/controller do harness atual. A única diferença do controller é o limite a 200; não se compara conteúdo E201. Os hashes e versão Node ficam nas métricas.

## 6. Gate para a Fase 5

**Pode avançar no preview de development**, preservando os testes e o isolamento. Antes de produção: definir persistência versionada, checkpoints/ledger de prémios, conflito de tabs/cloud e migração sem reset; rever curva E20→E200, vantagem de sustain e frequência de loot; decidir economia final das poções, efeitos reais dos eventos ainda informativos e eventual conteúdo acima de E200. Não houve aprovação implícita desses sistemas nem migração dos antigos saves Magic+Poison.
