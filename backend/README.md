# StatsPalpite — backend

API em Node.js, Express, Sequelize e PostgreSQL. Implementa os itens de
backend da **Sprint 1** do backlog.

## Começar

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

O guia completo, com a criação do banco e a solução de problemas, está em
[`docs/ambiente.md`](docs/ambiente.md).

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/arquitetura.md`](docs/arquitetura.md) | camadas, motor de ingestão, banco, segurança |
| [`docs/api.md`](docs/api.md) | todos os endpoints, com exemplos |
| [`docs/ambiente.md`](docs/ambiente.md) | configuração do ambiente de desenvolvimento |

## Requisitos da Sprint 1 cobertos

| Item | Requisito | Onde |
|---|---|---|
| B001 | RNF05 — MVC com Sequelize e migrations | estrutura de `src/` |
| B002 | RF01 — cadastro com bcrypt e JWT | `services/authService.js` |
| B003 | RF76 — sessão persistente com refresh token | `services/tokenService.js` |
| B004 | RF31 — bloqueio de menores de 18 | `utils/age.js` |
| B005 | RF34 — nome de usuário único e validado | `utils/username.js` |
| B006 | RF02 — recuperação de senha em 15 min | `services/authService.js`, `mailService.js` |
| B008 | motor de ingestão, anticorrupção e cache TTL | `providers/` |
| B009 | RNF03 — cache e compressão | `app.js`, `providers/cache/` |
| B010 | RF03 — partidas do dia com probabilidade | `services/matchService.js`, `probabilityService.js` |
| B011 | RF04 — detalhe com estatísticas avançadas | `services/matchService.js` |
| B012 | RF15 — clima da partida | `providers/weather/` |
| B013 | RF36 — desfalques | `providers/` + `models/injury.js` |
| B014 | RF62 — estatísticas de arbitragem | `models/referee.js` |
| B015 | RNF11 — fallback de fonte | `providers/IngestionEngine.js` |
| B018 | RF06 — confronto histórico | `services/matchService.js` |
| B021 | RF27 — busca textual global | `services/searchService.js` |
| B022 | RF56 — busca por jogador | `services/searchService.js` |
| B030 | RF53 — resumo diário | `services/digestService.js` |
| B031 | RF77 — boletim da rodada | `services/digestService.js` |
| B032 | RF71 — evolução no ranking em 30 dias | `services/rankingService.js` |

Endpoints de apoio ao app também já existem: `GET /venues` para o mapa do
`RF49` e `GET /matches` para a sincronização do `RF48`.

## Estrutura

```
src/
├── config/         ambiente, Sequelize, log
├── models/         13 models Sequelize
├── database/
│   ├── migrations/ esquema versionado
│   └── seed.js     dados de desenvolvimento
├── controllers/    uma função por endpoint
├── services/       toda a regra de negócio
├── providers/      motor de ingestão e adapters
│   ├── cache/      contrato de cache com TTL
│   ├── football/   fontes de dados de futebol
│   ├── weather/    fontes de clima
│   └── translators/ camada anticorrupção
├── middlewares/    auth, validação, auditoria, erro
├── routes/         mapa de rotas
└── utils/          idade, nome de usuário, erro de aplicação
```

## Testes

```bash
npm test
```

Os testes de integração rodam contra o banco real, aplicando as **migrations**
em vez de `sequelize.sync()` — é o que garante que o esquema testado é o mesmo
que vai para produção.

## Fora do escopo da Sprint 1

O registro de palpite e o cálculo de pontuação (`RF09`, `RF10`) são da
Sprint 2. A tabela `predictions` já existe porque o resumo diário e o ranking
agregam sobre ela, e o seed a popula para que esses números sejam reais.
