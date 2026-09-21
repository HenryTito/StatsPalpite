# Arquitetura

Arquitetura modular hexagonal, no mesmo formato adotado em PIXELMORPH.

## Camadas

| Camada | Pasta | Responsabilidade | Pode importar |
| --- | --- | --- | --- |
| Interface | `src/app` | Telas, navegação, composição visual | `core`, `modules` |
| Base | `src/core` | Tokens de design, componentes de UI, portas | nada do app |
| Domínio | `src/modules` | Tipos e regras de negócio, sem React Native | nada |
| Infraestrutura | `src/infrastructure` | Fixtures, repositórios, configuração | `modules` |

A dependência aponta sempre para dentro. O domínio não conhece a UI, e a UI não
conhece a origem dos dados — só os tipos declarados em `src/modules/*/domain`.

## Design system

`src/core/theme` guarda os tokens extraídos do Figma (as CSS custom properties
do protótipo viraram objetos tipados). `src/core/ui` traduz os padrões visuais
recorrentes — `TopBar`, `Card`, `Chip`, `Badge`, `Field`, `SplitBar`, `Slider`,
`Switch`, `BottomBar` — para que nenhuma tela use valores hexadecimais soltos.

Os ícones ficam em `src/core/ui/Icon.tsx`, com os mesmos paths SVG do design
sobre viewBox 24×24.

## Navegação

`RootNavigator` combina uma pilha nativa com um navegador de abas:

- Pilha: Login, Cadastro, Tabs, Detalhe da partida, Comparar times, Partida ao
  vivo, Offline, Painel admin.
- Modais: Filtros e Registrar palpite.
- Abas (`TabBar` própria, 64pt): Home, Meus palpites, Ranking, Perfil.

## Troca das fixtures pela API

1. Declarar a porta em `src/core/ports` (ex.: `PartidasRepository`).
2. Implementar em `src/infrastructure/repositories`.
3. Injetar na tela por hook ou contexto, mantendo os tipos do domínio.

As fixtures atuais servem como implementação de referência e como base dos
testes em `tests/`.
