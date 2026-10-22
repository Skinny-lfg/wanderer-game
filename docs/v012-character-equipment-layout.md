# Character & Equipment Layout

**Branch:** `development`  
**Escopo:** apenas geometria e apresentação do Camp; sem alterações de gameplay, equipamento ou poções.

## Diagnóstico e alterações

O painel central usava cinco linhas de equipamento com altura fixa de 82px. A altura do retrato acompanhava a grelha, mas a arte era limitada pela largura da coluna; por isso, o espaço adicional abaixo e entre linhas não era bem aproveitado. No desktop, `Your Journey` ocupava apenas as colunas de Stats e Character, deixando a coluna Expedition fora da secção inferior.

Em `online/v012-ui5-camp.css`, as linhas desktop agora variam com a altura do viewport, com limites para ecrãs baixos e altos. A coluna de personagem cresce proporcionalmente dentro do espaço disponível; as molduras também podem aumentar ligeiramente em ecrãs altos. `Your Journey` ocupa uma linha própria abaixo das três áreas. A disposição tablet coloca Expedition antes de Journey; mobile mantém a ordem existente. Background, botão ilustrado, funcionamento e geometria mobile da personagem foram preservados.

## Medidas Chromium

| Viewport | Área Character antes → depois | Arte antes → depois |
|---|---:|---:|
| 768×1024 | 389×521 → 389×548 px | 253×267 → 275×290 px |
| 1440×900 | 476×521 → 476×561 px | 333×352 → 356×376 px |
| 1920×1080 | 476×521 → 476×655 px | 333×352 → 356×376 px |

Em 375×812, a área Character manteve 329×461 px. O harness verificou overflow horizontal, imagens, alvos clicáveis, alinhamento e que Journey fica abaixo de Character, Stats e Expedition e ocupa a largura disponível.

## Capturas

Capturas completas antes/depois e recortes de Character foram produzidos por Playwright/Chromium com a mesma fixture sintética determinística:

- [Camp desktop 1440 antes](v012-character-equipment-layout/screenshots/before/camp-1440.png) · [depois](v012-character-equipment-layout/screenshots/after/camp-1440.png)
- [Camp desktop 1920 antes](v012-character-equipment-layout/screenshots/before/camp-1920.png) · [depois](v012-character-equipment-layout/screenshots/after/camp-1920.png)
- [Camp mobile 375 antes](v012-character-equipment-layout/screenshots/before/camp-375.png) · [depois](v012-character-equipment-layout/screenshots/after/camp-375.png)
- Recortes de Character para 360, 375, 390, 430, 768, 1024, 1440 e 1920 estão nas mesmas pastas `before/` e `after/`.

## Validação

- `node tests/v012-ui8b-camp-browser.cjs` — **PASS** em 360×780, 375×812, 390×844, 430×932, 768×1024, 1024×768, 1440×900 e 1920×1080.
- `node tests/v012-ui8-camp-browser.cjs` — **PASS** em 360×780, 390×844, 768×1024, 1024×768 e 1440×900.
- `git diff --check` — **PASS**.

A validação foi feita em Chromium; Safari não foi testado nesta alteração. Os testes usam fixtures sintéticas e não escrevem saves reais. O trabalho permanece local em `development`, sem commit ou push.
