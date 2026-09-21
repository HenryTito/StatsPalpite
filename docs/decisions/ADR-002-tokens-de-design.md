# ADR-002 — Tokens de design como fonte única

## Status

Aceita.

## Contexto

O protótipo define a paleta em CSS custom properties (`--acc`, `--sur`, `--bd`,
…). React Native não tem custom properties, e copiar hexadecimais para cada tela
faria o design divergir do Figma na primeira mudança.

## Decisão

Converter os tokens em objetos tipados (`src/core/theme`) e proibir
hexadecimais nas telas. Componentes recorrentes do design viram primitivas em
`src/core/ui`.

## Consequências

- Uma mudança de paleta no Figma é uma mudança de arquivo aqui.
- Um teste (`tests/core/theme.test.ts`) trava os valores contra edição acidental.
- Variações fora do sistema exigem um token novo, e não um valor solto.
