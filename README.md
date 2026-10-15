# wanderer

Wanderer é um jogo de aventura e exploração de masmorras no navegador. Gere o equipamento e o inventário, visita a forja e o mercador e enfrenta inimigos em combate automático.

O jogo está contido em `index.html`, com as imagens incorporadas. Não requer instalação de dependências nem compilação. O progresso é guardado no armazenamento local do navegador; recarregar a página encerra a expedição ativa.

## Executar localmente

É necessário ter Python 3 instalado.

1. Abre um terminal na pasta do repositório.
2. Inicia um servidor HTTP local:

   ```sh
   python3 -m http.server 8000 --bind 127.0.0.1
   ```

3. Abre `http://127.0.0.1:8000` no navegador.

Para parar o servidor, pressiona `Ctrl+C` no terminal.

## Online test development

Google Sign-In, cosmetic character profiles, explicit local/cloud save selection and
unverified test leaderboards are prepared on `development`. Guest play remains local.
See [Firebase setup and test status](docs/firebase/README.md) before enabling live services.
Private cloud saves require the reviewed Firestore Rules; the supplied Firebase config
alone does not grant access. No competitive ranking is treated as verified.

Developer checks: `npm ci`, `npm test`, and `npm run build:firebase` after SDK changes.
See the Firebase guide for browser tests and the isolated demo Firestore emulator tests.
