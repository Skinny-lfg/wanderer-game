# v0.13 — limpeza das regras antigas, etapa 1

- Expedições automáticas abrem o mapa sem escolher uma affinity inicial artificial.
- As affinities de combate e o elemento vêm das raízes da árvore permanente; entrar num Realm ou recarregar não os substitui.
- Comandos de escolha temporária de affinity, elemento e passivo ficam bloqueados no modo automático. Nenhum draft temporário é retomado nesse modo.
- O boss usa um único encontro; save e candidato local de ranking usam o token 15:1, mantendo a verificação do checkpoint e a prevenção de prémios duplicados. Ranking continua sem submissão ativa.
- Reforços, caminhos, pequenos nós, stats coloridos, equipamento e animações mantêm-se.

Validação: 78 testes da v0.13; Chrome desktop/mobile; percurso sintético com armazenamento validado: boss, Rune, Camp, reload e início de E2. O percurso sintético acelera mortes para testar persistência, não equilíbrio.

A suite histórica também foi executada numa cópia limpa de 31810e9: 394 testes, 82 falhas anteriores. Não é uma suite integral verde. A limpeza do código partilhado com os antigos testes de v0.12 fica separada da remoção de dependências no fluxo ativo de v0.13.
