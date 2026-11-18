# Wanderer v0.13 — Stage 0 / Expedition Foundation

**Estado:** fundação e testes determinísticos, **não integrada no gameplay**.

**Base:** `feature/v013-native-combat-simulator-20261117` (PR #40, draft). Não foi feito merge nem publish. O mapa, passos, combate, loot, saves, Talent Tree e forja permanecem inalterados.

## Regras verificadas existentes

- Três Realm Cards: Guarded / Dangerous / Brutal (risco 0/1/2).
- 18/20/22 salas; 14/13/12 passos iniciais; 1/1/2 Elites; 0/1/2 guardas de boss.
- Bónus por risco na recompensa: 0%/12%/24%.
- Boss styles: `guardian`, `leech`, `berserker`. Affinities: Blood, Decay, Vitality, Aegis, Fury, Magic.

## Catálogo único (`combat/v013-expedition-foundation.js`)

| Grupo | Quantidade | Nomes apresentados |
|---|---:|---|
| Conditions | 6 | Relentless Hunt; Carrion Swarm; Unbroken Ward; Blighted Ground; Veiled Passages; Sanguine Rite |
| Encounter Traits | 6 | Armored; Frenzied; Ambush; Sigilbound; Unhallowed Regrowth; Death Throes |
| Boss Modifiers | 6 | Bone Ward; Graven Hide; Sanguine Frenzy; Soul Drain; Profane Pulse; Gravebound Retinue |
| Boons | 6 | Blood Tribute; Predator's Focus; Bastion Oath; Aetherbound Pact; Rotbound Echo; Wayfarer's Bargain |
| Contracts | 4 | Bounty Writ; Pathfinder; Purification; Oath of Defiance |
| Special Rooms | 1 | Forgotten Reliquary |

IDs estáveis, parâmetros numéricos iniciais, afinidades aplicáveis, incompatibilidades e nomes aprovados estão definidos e imutáveis. **Ainda não aplicam efeitos reais em combate.**

Bone Ward não se adiciona ao boss Guardian, que já tem Barrier; Sanguine Frenzy é excluída do boss Berserker, que já tem enrage. Unbroken Ward/Bone Ward e Sanguine Rite/Sanguine Frenzy não são combinadas. Integrações futuras também terão de impedir duplicações de efeitos do Guardian e do Rift Harbinger.

**Semântica importante:** afinidades das *conditions* indicam compatibilidade com o Realm. Afinidades dos *boons* indicam sinergia com a **build do jogador**, e não com a afinidade do Realm. A Stage 6 terá de verificar a build ao apresentar Boons.

## RNG e estado da expedição

- `deriveSeed(seed, channel)` suporta seed inteiro de 32 bits.
- `createStreams(seed)` cria cinco fluxos independentes: `map`, `choice`, `combat`, `loot`, `boss`. Consumir um não altera outro.
- `createManifest(cards, {seed, expeditionLevel, bossStyle})` atribui uma condition distinta a cada uma das três Realm Cards, compatível com a sua afinidade; atribui 1/2/3 modifiers de boss legais por dificuldade. Isto é planeamento determinístico, **não geração do mapa atualmente jogado**.
- `createExpeditionState(manifest, realmId)` cria um estado adicional serializável (não altera o save real).
- `applyDecision` e `replayDecisions` registam escolhas de scouting, passagens secretas, contrato, Boons e preparação do boss num diário reprodutível. **Não modificam HP, Mana, passos nem recompensas.**

### Teste

```bash
npm run test:v013:foundation
```

Validação local Node.js: **11/11 testes**. Inclui **10.000 manifests determinísticos** (não 10.000 mapas completos), tripletos de afinidades, conflitos, RNG independente, replay, JSON e compatibilidade com os IDs do controlador atual.

CI remota e QA de browser não foram executadas nesta stage.

## Limites e integração futura

1. Na Stage 1 ligar a seed por expedição às três Realm Cards reais, mantendo-a estável durante a tentativa. Integrar contagem de saídas e caminhos de menor **custo real de passos** no controlador atual sem redesenhar a topologia.
2. Stage 2 e 3: ativar Traits e Boss Modifiers no motor **nativo**, não num simulador paralelo.
3. Stage 4 e 7: integrar com eventos existentes (`Bounty Writ`, `Oracle of Paths`, `Forgotten Arsenal`) e garantir recompensas únicas.
4. Stage 6: oferecer Boons de acordo com a build e talentos, não a Realm Card.
5. Stage 8: usar estas regras no simulador, impedindo acesso a salas desconhecidas. PR #40 ainda não simula todas as estratégias nem todas as 15 Realms.

Antes de integrar/publicar, validar PR #40, resolver dependências entre branches e correr regressões e QA. **Nada desta stage foi publicado no jogo.**
