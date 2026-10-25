# Wanderer v0.12.0 — Guia de passagem para Codex

> **Atualizado:** 20/10/2026  
> **Branch exclusiva:** `development`  
> **Backlog integral:** [v012-post-integration-backlog.md](./v012-post-integration-backlog.md)  
> **Origem editável no Drive:** [Wanderer — v0.12.0 | Backlog de melhorias pós-integração](https://docs.google.com/document/d/1UBoyYDtvi9x5VQbXR15jThR2aOQNzXUgkHr0oZlT8ss/edit)  
> **Objetivo:** permitir ao Codex executar um lote aprovado sem depender de acesso ao Google Drive. **Este guia é documentação, não uma ordem autónoma para alterar código.**

## 1. Ler antes de intervir

1. Este guia e o [backlog integral](./v012-post-integration-backlog.md), especialmente secções **27** e **28**, que contêm as últimas correções funcionais.
2. [Auditoria de integração](./v012-integration-audit.md), [validação final anterior](./v012-final-validation.md), [implementação Realms/Eventos/Bag](./v012-realms-events-bag-implementation.md) e [relatório fase 3](./v012-phase3-integration-report.md).
3. Código *efetivo* de `development`, distinguindo caminho integrado v0.12 e modo clássico. Os relatórios são snapshots históricos; validar o estado real do checkout antes de programar.
4. Testes `tests/`, `package.json`, `online/v012-expedition-controller.js`, `combat/v012-buildcraft.js`, `online/v012-save.js`, `index.html`, e integrações de combate e economia relevantes.

Os relatórios anteriores alertam para persistência/cloud v0.12 não pronta para produção e para suites clássicas com expectativas de set/gear affinity obsoletas. Não reativar funcionalidades removidas só para tornar testes legados verdes; distinguir erros reais de testes desatualizados.

## 2. Ordem de precedência e âmbito

- **Secção 28 prevalece sobre 27.08 e textos antigos de Rune:** **1 Rune permanente garantida por Expedition concluída com vitória no boss final**, incluindo E1, E2, E3, etc.; escolher 1 de 3 opções. Sem Rune por extração, abandono ou morte. Corrigir schema/validação de tier, sem mapear falsamente E1→E10; proteger contra dupla claim e refresh.
- **Secção 27.03 prevalece sobre UI-014:** **3 rerolls globais partilhados pela Expedition inteira**, não 3 por Realm, cartão ou Plane. O quarto é bloqueado; save versionado.
- **Secção 27 prevalece para fluxo de Realm:** conclusão → popup de escolha de passivo → regresso à vista de combate terminada (loot e logs visíveis) → botão manual «Sair Realm» → ecrã Between Realms (stats, bag, equipamentos, potions e buffs) → próximo Realm. **Relatório detalhado apenas no fim da Expedition**; boss final não cria passivo pós-Realm.
- **Secção 28 sobre procs:** entrar numa Realm/família não concede Bleed, Poison/Rot, regeneração nem Burn/Frost/Lightning ao jogador sem passivo/ability/equipment/evento específico. Cobrir Blood, Decay, Vitality, Magic e auditar Aegis/Fury; status aplicados pelos próprios inimigos continuam válidos.
- **Secção 28 sobre layout:** na **janela Character/Equipment e Between Realms**, 5 slots à esquerda + personagem completa ao centro + 5 slots à direita. **Isto NÃO substitui o mockup aprovado da homepage**: HP/Mana à esquerda, personagem ao centro, Expedition à direita. A distribuição de slots homepage original está em UI-002 e não deve ser sobrescrita inadvertidamente pelo layout 5+5.
- **Secção 22 substitui secção 21:** duas Realms temáticas por affinity, 12 temas na v0.12, sem interpretar como 12 novos temas extra. O catálogo de eventos e os seus números têm secções de proposta, não aprovar implicitamente todos.
- **Secções 16, 17, 19, 20, 24, 25, 26** misturam experiências, propostas, cálculos e hipóteses; **não assumir que estão todas aprovadas para implementar**. Classes/restrições por tipo de armadura são exploratórias. Novos 16 eventos, rework de Lightning/Static, economia e lojas especializadas requerem âmbito explícito.
- Priorizar decisões explícitas e mais recentes em caso de contradição, mantendo rastreabilidade. Não confundir `affinity` da Realm com gear affinity (removida na v0.12); não reintroduzir Tier Bonuses/Set Bonuses na interface de Expedition.

## 3. Trabalho prioritário a planear/validar

**P0 — Integridade da run, economia e anti-exploit.**
- Back reversível na seleção da affinity inicial, incluindo Magic element, **antes de entrar** na primeira Realm, sem consumir nem reverter decisões já comprometidas.
- Checkpoints claros: antes de entrada, combate/evento resolvido, passivo pendente, passivo escolhido, saída pendente e Between Realms. Refresh/tab duplicada não recriam RNG/loot/Gold/Fragments/passivos/Runes.
- 3 rerolls globais; máximo 3 famílias; primeiro Realm com opção da affinity inicial; boss final #15 **um único cartão**, sem reroll, com variante aleatória fixada na run entre **The Abyssal Guardian / Rift Harbinger / Ember Sovereign**.
- Rune em cada vitória final elegível, escolha de 1/3, tier real E#, validação e persistência sem regressões do modo clássico; testar capacidade/limites (até 300 Rune owned, quando aplicável).
- Eliminar procs gratuitos de família sem passive escolhido e garantir que fontes legítimas continuam a funcionar.

**P1 — Ciclo de gestão.**
- Bloquear Inventory global / Stash / Forge / Merchant / outras lojas durante Expedition; permitir gerir apenas loot da Expedition e gear de run em **Between Realms**, não em combate.
- Bag 6 itens, overflow resolvido por opção explícita; comparar loot com equipamento real no mesmo slot; regras 2H/off-hand e anéis; distinguir gear anterior à run de loot da run e aplicar Model A de morte/extração.
- Mostrar stats HP/Mana/Attack/Spell/Defense e buffs e debuffs ativos e fontes; potions entre Realms, dentro das regras aprovadas.
- «Clear All NEW» retira apenas flags `isNew` de stash, bag e equipados, sem mexer em stats/itens.

**P2 — Interface funcional, sem redesenho visual final.**
- 5 slots / personagem / 5 slots na janela Character/Equipment, mobile e desktop; não cortar personagem.
- Na vista de combate manter bag read-only junto do Expedition Log; logs e recursos após vitória; passivo num popup; sem relatório por Realm; remover Tier Bonuses v0.12.
- Mostrar buffs/debuffs reais em ambos os lados, duração/stacks sem duplicar título Elite; cartões Realm concisos, boss único, sem «3 possible loot rolls».
- Preservar a homepage aprovada e assets originais. Substituir placeholders só quando houver arte disponível e instruções.

**P3 — QA e balanço, sem deploy automático.**
- Fluxo completo E1–E20, eventos 3–4 numa run de 15 etapas, afinidades e híbridos, boss, vitória, morte, extração, Rune e resumo final.
- Testar refresh em cada transição, duplicação via tabs/double click, bag cheia, equip swap, rune inventory cheio, save antigo, precisão do `Clear All NEW`.
- Casos E1/E2/E9/E10/E11/E199/E200 para Rune e gear E#, preservando Rune antigas; 6 affinities sem passivo e com passivo adquirido; Magic primária/secundária em Fire/Frost/Lightning.
- Browser e Playwright nas larguras 390px e 1280px; suites focadas com fixtures sintéticas. Depois, simulações de loot/economia/dificuldade e impacto dos passivos antes de considerar publicação.

## 4. Identidade e assets de referência

- Página principal aprovada: o **primeiro mockup de 19/10/2026**, guardado como **imagem A** no [Google Doc de origem](https://docs.google.com/document/d/1UBoyYDtvi9x5VQbXR15jThR2aOQNzXUgkHr0oZlT8ss/edit). Esquema substituto textual para Codex sem Drive: **HP/Mana esquerda | personagem central com gear | cartão Prepare for the next Expedition direita**, estética dark fantasy premium. **Imagem B** (Belt) é um estudo, não substitui A. **Os dois ficheiros de imagem embebidos não foram importados para GitHub nesta transferência textual.**
- Assets e estilos já existentes no próprio repo: [assets/](../assets/), em especial `assets/bosses/abyssal-guardian.png`, `assets/bosses/rift-harbinger.png`, `assets/bosses/ember-sovereign.png`, equipamento, heróis e fundos; reutilizar antes de inventar assets.
- Drive (acesso só se a sessão Codex tiver permissões): [pasta principal](https://drive.google.com/drive/folders/1glhncSsAhQBM-pudj3gma86Dxd-wQjfr), [02 — Assets](https://drive.google.com/drive/folders/1bWz8n5aCyAXSXzlUmmr36CkyVpUYD4wq), [Packs](https://drive.google.com/drive/folders/1bp0cs1Sqt3c3QASAWkprluq2lPJkw8xY) e [03 — Game Design](https://drive.google.com/drive/folders/1ufprb2UMMJ2JcJfnrDedHHkEZH_3vWr-).
- [Game Design Document v0.1](https://docs.google.com/document/d/1XbFl8U39ILxdz88mbp_5A2ydImvUyPYUiYJNuNhqeiQ/edit) é histórico, não substitui especificações v0.12.

## 5. Restrições mandatórias

- **Nunca editar/merge/publicar `main` sem instrução explícita.** Só `development`.
- **Nunca deploy Firebase/Railway, mudar `firestore.rules` ou sobrescrever/migrar saves reais** sem autorização específica.
- Não apagar dados legados nem modificar conteúdo de jogadores reais; usar testes isolados, mocks e perfis sintéticos.
- Não adicionar features fora do âmbito de execução aprovado; separar **implementado**, **aprovado pendente**, **sugestão**, **teste** e **superseded**.
- Se a tarefa pedida ao Codex for apenas verificar/planear, não modificar código. Para implementação, executar o lote instruído explicitamente pelo utilizador e reportar commits, testes, falhas e itens por resolver sem declarar produção pronta por antecipação.

## 6. Sequência recomendada na tarefa Codex

1. Ler este guia, backlog integral e os relatórios correntes de `development`.
2. Fazer auditoria/diff entre requisito e estado atual, identificando duplicados, código já implementado e contradições.
3. Implementar **apenas o lote pedido explicitamente** pelo utilizador, com checkpoint seguro e testes dirigidos.
4. Publicar um relatório curto no repo com implementado, não implementado, testes/resultado e riscos reais.
5. Não fazer PR/merge para `main` ou deploy sem nova ordem.
