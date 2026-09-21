# ADR-001 — Arquitetura modular hexagonal

## Status

Aceita.

## Contexto

O front nasce de um protótipo Figma Make em React/Vite, com as telas escritas em
estilos inline e dados literais. Portar isso direto para React Native geraria
telas longas e acopladas aos dados de exemplo.

## Decisão

Separar em quatro camadas — `app`, `core`, `modules`, `infrastructure` — com a
dependência apontando para dentro, seguindo o formato já usado em PIXELMORPH.
Os dados do protótipo ficam em `infrastructure/fixtures`, tipados pelos
contratos do domínio.

## Consequências

- As telas descrevem layout; regra de negócio fica nos módulos.
- Trocar fixture por API não altera a UI.
- Há uma camada extra de indireção, que só se paga quando a API existir.
