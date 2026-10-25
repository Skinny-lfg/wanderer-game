# Wanderer — v0.12 (development)

A branch `development` contém o **Wanderer v0.12 Expedition**, sem o protótipo isolado de v0.12 nem o carregador do jogo clássico v0.11. A branch `main` é uma publicação independente e não foi alterada.

## Fluxo atual
Camp → selecionar affinity → 15 Realms (combate/eventos, Elites e boss) → passivos e Between Realms → escolher 1 de 3 Runes em cada vitória final → relatório da Expedition.

- 12 temas de Realm, até 3 affinities e 30 opções híbridas.
- Static persiste entre Realms, bag de seis peças de loot e até três poções preparadas.
- Blacksmith, Apothecary e Forge; Runes E1–E200.
- O Railway privado usa um perfil de playtest isolado: **não sincroniza saves de contas reais**.

## Testes

```sh
npm ci
npm test
npm run test:preview
npm run simulate:v012
```

Para os testes browser, instalar Chromium/Playwright e usar o servidor local:

```sh
python3 -m http.server 8012 --bind 127.0.0.1
npm run test:browser
```

Abrir em `http://127.0.0.1:8012/?expeditionPhase1=1&expeditionSave=1&validationSlot=manual-clean`, com um `validationSlot` de teste, sem importar saves reais.

## Repositório e segurança

- Trabalhar exclusivamente em `development`, nunca alterar `main` por efeito de alterações nesta branch.
- Não fazer deploy automático no Railway/Firebase; mudanças de produção precisam de autorização separada.
- Não mudar as regras Firebase nem migrar saves reais durante a limpeza.
- Os relatórios e decisões atuais estão em `docs/v012-*`. O histórico completo das versões anteriores continua acessível em Git e nos backups externos do projeto.

> Nota técnica: o combate v0.12 ainda reutiliza funções da infraestrutura anterior dentro de `index.html`. O código morto restante só deve ser retirado depois de separar e testar as dependências usadas pelo combate atual. Esta limpeza inicial elimina o protótipo executável antigo, os calendários anteriores e suites de manutenção histórica; **não afirma que todo o motor inline já está desacoplado**.
