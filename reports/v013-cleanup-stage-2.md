# v0.13 — limpeza de interface e textos, etapa 2

- Textos de waves substituídos por encontros/inimigos no fluxo ativo.
- Cursed Chest e Forgotten Arsenal mostram os ganhos reais de Essence; Bounty Writ deixou de prometer equipamento garantido ou Essence extra.
- Eventos explicam o ganho base de 1 Essence, inclusive ao sair sem aceitar uma opção. Efeitos temporários sobre habilidades distinguem effective rank de pontos permanentes; o indicador deixou de mostrar incorretamente 50%.
- Camp tem um único seletor de expedição. O atalho mobile remete para esse seletor; a ação contextual de começar mantém-se. Your Journey deixou de apresentar uma contagem não implementada.
- Entrada em Realm fica na janela do node, removendo o botão redundante fora do mapa.
- Between Realms voltou a reconhecer o modo automático sem affinity inicial. Equipamento, stats, habilidades e extração ficam acessíveis entre encontros; a faixa usa as affinities permanentes reais.
- Descrição de Daggers corrigida para explicar o ataque secundário existente, sem alterar dano.
- Pequenos nós, total dos stats e bónus coloridos mantidos. Sem alterações a animações, taxas de loot ou balanceamento.

Validação: 78 testes v0.13 passam. Testes Chrome cobrem craft/reload/arena/mobile e o novo percurso Camp → mapa → combate → separadores Between Realms → extração. Mortes aceleradas apenas no teste temporário para verificar navegação. Verificação visual dos screenshots mobile. Suite histórica: 394 testes, 312 passam e 82 falham, os mesmos resultados da etapa anterior.
