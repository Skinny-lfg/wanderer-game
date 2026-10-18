# Wanderer

Wanderer é um RPG de exploração de dungeons para browser, com combate automático, equipamento, afinidades e Tier Bonuses, Forge, Merchant e leaderboard.

## Jogar online

Página pública: https://skinny-lfg.github.io/wanderer-game/

A **`development` v0.10.1** passa a usar login obrigatório com **Google ou email/password**, verificação de email e recuperação de password. A funcionalidade Guest foi removida do novo ecrã de login. Os jogadores escolhem um nickname público; o nome e email da conta Google não são mostrados publicamente. O sistema de saves online continua em Firebase, mas a branch `development` exige um **projeto Firebase de testes separado**, ainda por configurar. **A `main` pública mantém temporariamente o login antigo até uma publicação autorizada.**

O código do site está na branch `main`. Desenvolvimento e testes continuam na `development`.

Instruções completas para criar o Firebase de desenvolvimento, configurar login e email, testar as regras e planear o reset futuro: [Guia Firebase v0.10.1](docs/firebase/README.md). **Nenhum reset é feito ao atualizar o código.**

Roadmap de ideias adiadas e trabalhos ainda sem publicação: [Em desenvolvimento — futuras versões a avaliar](docs/roadmap-em-desenvolvimento.md).

## Como funcionam os saves

- Guarda-se o progresso localmente no browser; contas autenticadas podem sincronizá-lo para o Firestore.
- Uma expedição interrompida ao fechar a janela é terminada no regresso; equipamento e recompensas já extraídas são preservados, mas loot ainda não extraído não é atribuído.
- Existem cópias de recuperação locais e proteção contra conflitos entre saves. Se aparecer uma escolha entre **This device** e **Cloud**, confirma os dados antes de escolher.
- A publicação do código no GitHub **não altera diretamente os saves do Firebase**. Os jogadores devem continuar no mesmo endereço e navegador quando usam contas Guest.

## Executar localmente

É necessário Python 3:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abre http://127.0.0.1:8000/ no navegador. Para parar o servidor, usa `Ctrl+C`.

## Testes e configuração

- Instalar dependências: `npm ci`.
- Testes de lógica: `npm test`.
- Testes de browser: `npm run test:browser`, com Chromium/Playwright instalado.
- A configuração de autenticação e as regras de segurança do Firebase têm de ser ativadas/publicadas separadamente: [docs/firebase/README.md](docs/firebase/README.md).
- O formulário de playtest envia respostas para Firestore; a exportação privada para o Google Drive requer configuração administrativa: [docs/playtest-feedback.md](docs/playtest-feedback.md).

As leaderboards de teste não têm ainda validação de resultados autoritativa no servidor.
