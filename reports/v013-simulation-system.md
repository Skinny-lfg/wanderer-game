# Wanderer v0.13 — Simulador de combate nativo

Foi atualizado o ficheiro existente `scripts/simulate-progression.cjs`. O simulador usa o motor HTML atual, a Talent Tree v15 e o controlador da Dungeon. Não altera regras de combate, valores de produção, Firebase ou saves.

## Execução

```sh
npm run test:v013:sim
npm run simulate:v013
node scripts/simulate-progression.cjs --mode=both --levels=1,5,15,35,70,100,250,1000 --seeds=9101,9102,9103
node scripts/simulate-progression.cjs --mode=dungeon --levels=70,100,250,1000 --seeds=9101,9102,9103,9104,9105 --gear=previous
```

Opções: `--mode=encounter|dungeon|both`, `--levels` e `--seeds` (números inteiros positivos separados por vírgulas), `--builds=blood-fury,aegis-vitality,magic-decay,blood-decay`, `--points=24` (23–100), `--gear=current|previous`, `--rarity=Common|Uncommon|Rare|Epic`, `--runes=true|false`, `--tick-limit=4500`, `--out=path`.

Por omissão gera `reports/v013-simulation-results.json`.

## Modos

- **Encounter:** compara uma onda real de três inimigos e um boss inserido artificialmente num encontro, ambos à Expedition Level pedida. Adequado a comparações controladas; não é um encontro de boss obtido por navegação.
- **Dungeon:** escolhe uma Realm Card real e percorre o caminho acessível mais curto até ao boss, resolvendo eventos e combates com o motor real. HP/Mana transitam entre combates sem reposição forçada. É um percurso completo de uma card, não todas as bifurcações ou quinze Realms consecutivas.

O equipamento é gerado pelo `makeItem` atual. Em E1000, a peça continua Exalted, sem crescimento adicional, e o inimigo usa a referência E1000. `--gear=previous` testa a categoria anterior.

Atribuem-se 24 pontos permanentes disponíveis por omissão; os perfis usam efetivamente cerca de 22–23. Este orçamento é sintético e igual para as simulações, não representa pontos obtidos por um jogador na E1. Sem poções, trocas de gear, contas ou saves reais.

## Resultados e limitações

O JSON contém SHA256 de index.html, configurações e suposições, linhas individuais e métricas agrupadas: vitórias, mortes, timeouts, erros, duração, HP/MP, dano, progresso do boss e recompensas. Mortes não contam como timeouts. Erros/timeouts dão exit code 1; mortes previstas de personagens não.

Os simuladores v0.12 continuam para comparação histórica, mas não servem para balancear a v0.13 porque usam limites e pressupostos antigos.

Verificação local: oito níveis × quatro builds × três sementes × três tipos de cenário = 288 casos; 284 vitórias, quatro mortes reais na E1000, zero erros e zero timeouts. **Não constitui prova de balanceamento.** Antes de ajustar curvas, aumentar sementes, testar outros talentos/equipamentos e medir economia/progressão entre expedições.
