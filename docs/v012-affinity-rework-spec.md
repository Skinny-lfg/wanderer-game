# Wanderer v0.12 — Affinity Rework: especificação para Codex

**Status:** Fases A, B e C aprovadas para especificação, ainda NÃO implementadas. **Branch:** development, apenas documentação. Não tocar na main, Railway, Firebase ou saves reais.

Este relatório está dividido em três documentos completos, que devem ser lidos em conjunto:

1. [Fase A — Catálogo de 33 passivos normais](v012-affinity-phase-a.md): limites de Rank 5/Rank 1, efeito exato de cada upgrade e regressões a cobrir.
2. [Fase B — Draft contextual de 3 cartas](v012-affinity-phase-b.md): upgrade/synergy/discovery, elegibilidade, pity híbrido, RNG, persistência, UI e testes.
3. [Fase C — Catálogo de 30 híbridos e validação](v012-affinity-phase-c.md): duas alternativas por cada par de affinities, Rank 1, condições/procs, segurança e protocolo de simulação.

## Ordem de implementação
A: efeitos/ranks + migração segura → B: draft contextual → C: híbridos/gating → CI/testes → simulações com o motor real. Manter 15 Realms, até 3 affinities, até 3 híbridos distintos e 1 híbrido por par. Primeira vitória na Realm da nova affinity concede starter Rank 1 **e** a escolha normal de uma carta na mesma Realm. **Não** implementar Expeditions infinitas nem mexer no jogo publicado neste ciclo.

## Prompt para Codex
Lê integralmente docs/v012-affinity-rework-spec.md e os três documentos associados na branch development. Implementa fases A, B e C, mantendo todos os 63 IDs e compatibilidade com checkpoints. Segue a sequência, faz commits separáveis e testes por fase. No fim executa simulações com gear+3 runes, 6 affinities, 7 armas, escolhas aleatórias vs especialização vs sinergias. Entrega relatório de resultados, alterações, SHA e CI. Não faças merge/deploy, não alteres Firebase nem saves reais, e não avances para E∞.
