# StatsPalpite

App de estatísticas e palpites de futebol em React Native (Expo). O front foi
portado do protótipo Figma Make `Create-navigable-prototype`, preservando os
tokens de cor, as medidas e as 13 telas do design.

## Requisitos

- Node 22+ (veja `.nvmrc`)
- Expo Go ou um build de desenvolvimento

## Comandos

```bash
npm install
npm start            # Metro + Expo
npm run start:android
npm run type-check
npm run lint
npm test
```

## Estrutura

```
src/
├── app/                interface: App, navegação e telas
│   ├── navigation/     pilha raiz, abas e a TabBar do design
│   └── screens/        uma tela por arquivo; subpastas para peças locais
├── core/               base compartilhada
│   ├── theme/          cores, espaçamento e tipografia do Figma
│   └── ui/             componentes reutilizados pelas telas
├── modules/            domínios: partidas, palpites, ranking
└── infrastructure/     configuração, repositórios e fixtures
```

Regra de dependência: `app` → `core`/`modules` → `infrastructure`. Nenhum
módulo de domínio importa React Native.

## Telas

Login, Cadastro, Home, Filtros, Detalhe da partida, Registrar palpite, Meus
palpites, Ranking, Perfil, Comparar times, Partida ao vivo, Offline e Painel
admin.

## Dados

As telas leem de `src/infrastructure/fixtures`, que reproduz os dados do
protótipo. Substituir por chamadas de API não exige mudança na UI: basta
implementar repositórios que devolvam os mesmos tipos de `src/modules/*/domain`.
