# Visão de arquitetura

Documento de trabalho. A visão completa está em `../ARCHITECTURE.md`; aqui
ficam as decisões abertas e o mapa de módulos.

## Módulos

- `partidas` — listagem, detalhe, estatísticas comparadas e eventos ao vivo.
- `palpites` — escolha, pontos apostados, orçamento diário e status.
- `ranking` — classificação global e posição do usuário.

## Pendências

- Persistência local dos palpites feitos offline (fila de sincronização).
- Fonte Inter embarcada via `expo-font` (hoje o sistema fornece a família).
- Autenticação real no lugar da navegação direta do Login.
