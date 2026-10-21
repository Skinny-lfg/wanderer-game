# Wanderer — Clean sheet e limite de 2 Legendaries

Data: 2026-10-21 · Branch: `development` · Decisão do utilizador

## Política de equipamento

- Máximo **2 itens Legendary equipados em simultâneo**, contabilizados em todos os slots.
- A tentativa de equipar o terceiro é rejeitada antes de modificar o inventário; um Legendary pode substituir outro já equipado sem gastar uma terceira posição.
- A mudança para uma arma de duas mãos desloca o item Off-Hand como anteriormente e conta apenas os Legendaries efetivamente equipados após a troca.
- Os Legendaries que não são equipados continuam na Stash; nada é automaticamente destruído pela regra de 2. A restrição aplica-se à escolha do gear, não à quantidade de itens encontrados.

## Clean sheet do catálogo

- Os **22 Legendaries antigos** foram retirados do catálogo e de `combat/legendary.js`; a geração de itens novos usa apenas os **12 Legendaries da Fase C.1**.
- A flag de novos drops é ativada **só em development**, para permitir testar o catálogo com o limite de 2; nenhum deploy de produção foi feito.
- O fallback genérico de dano +32% de antigos Legendaries sem assinatura foi removido.
- Não foram construídas migrações para saves antigos. A decisão de iniciar um novo ciclo de jogo não autoriza apagar automaticamente bases de dados ou perfis no Firebase.
- Os assets antigos podem permanecer nos diretórios como ficheiros não referenciados, até uma limpeza de assets separada.

## Balancing pendente (C.2)

A matriz C.1 tinha 0/1/3 Legendaries e os conjuntos de 3 demonstraram um efeito defensivo excessivo. **O limite 2 ainda precisa de validação em combinações realistas**, incluindo Heartroot + Veil, Oathwall + Veil e arma + defesa, em E50/E100/E200, sem alterar os valores da B.4. A ativação dos drops em `development` não equivale a aprovação do balanceamento final.

## Segurança

Implementação e testes apenas em `development`, sem merge para `main`, deploy de Railway, alterações de Firebase rules ou eliminação dos saves dos jogadores.
