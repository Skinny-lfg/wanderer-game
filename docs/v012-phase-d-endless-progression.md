# Wanderer v0.12 — Fase D: Endless Progression

**Estado:** implementação em `development` a partir de C.3 `f9a7c70`. Sem deploy ou alteração de saves reais.

- Expeditions continuam de E200 para E201, E202 e seguintes, mantendo 15 Realms, eventos, boss, loot e Rune por vitória. E1000 é apenas um caso de teste.
- Até E200, fórmulas existentes. Acima de E200, HP/Attack/Defense e valores numéricos de ataques especiais dos inimigos partem da referência E200 e usam `1 + 0.005 × (E − 200)`. Atributos numéricos gerados de equipamento e Runas partem da referência E200 e usam `1 + 0.004 × (E − 200)`. Velocidade fixa do item, probabilidades, percentagens e efeitos especiais não recebem o multiplicador.
- Drops, Forge, Merchant, melhorias e custos conservam as regras existentes. Os custos que já dependiam do tier continuam a crescer segundo as mesmas fórmulas. O antigo cap E200 no custo de reforço foi removido.
- O draft existente já apresentava até três opções, incluindo 2/1/0, com continuação explícita quando a pool é vazia. Esta fase mantém essa implementação.
- O save local da Fase D usa schema `13` e chave `wanderer_v012_endless_v1_…`. Saves da chave anterior ficam intactos; nenhum reset nem migração de dados reais foi executado. O leaderboard local usa o `completed` do novo formato, aceita valores acima de E200 e mostra os oito marcos mais recentes. O leaderboard partilhado continua desativado.

## Validação dirigida

- E199, E200, E201, E500 e E1000: multiplicadores de inimigos/equipamento/Runas, custos e desbloqueio seguinte: **PASS**.
- Schema 13, níveis altos, rejeição do schema 12 na chave nova: **PASS**. Draft com 0/1/2 opções sem duplicação: **PASS**.
- `node tests/v012-phase-d-endless.test.cjs`: **7/7 PASS**.
- `node tests/v012-save.test.mjs`: **14/14 PASS**.
- `node tests/v012-buildcraft.test.cjs`: **9/9 PASS**.
- `node tests/v012-engine-core.test.cjs`: **5/5 PASS**.
- `node --check` nos módulos alterados e script inline da UI: **PASS**. Sem simulação de balanceamento, stress test ou suíte browser completa.

## Riscos para auditoria posterior

Balanceamento Endless, progressão real de equipamento, usabilidade em níveis muito altos e save/reload em navegador ainda requerem auditoria separada. A interface partilhada do leaderboard não publica resultados; registos existentes não foram apagados. O novo namespace local começa uma progressão separada, conforme o reset conceptual autorizado.
