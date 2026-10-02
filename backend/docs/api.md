# Endpoints da API

Base: `/api/v1`. Todas as respostas são JSON.

Erros seguem sempre o mesmo formato:

```json
{ "error": { "message": "...", "code": "CODIGO", "details": null } }
```

| Código HTTP | Quando |
|---|---|
| 400 | pedido malformado ou token de redefinição inválido |
| 401 | sem token, token inválido ou credencial errada |
| 403 | menor de 18 anos (`UNDERAGE`) ou papel insuficiente |
| 404 | recurso inexistente |
| 409 | e-mail ou nome de usuário já em uso |
| 422 | falha de validação |
| 429 | limite de requisições excedido |
| 503 | todas as fontes de dados indisponíveis |

---

## Autenticação

### `POST /auth/register` — RF01, RF31, RF34

```json
{
  "email": "henry@exemplo.com",
  "username": "henrytito",
  "password": "Palpite123",
  "passwordConfirmation": "Palpite123",
  "birthDate": "1998-04-12"
}
```

**201** devolve `{ user, accessToken, refreshToken, refreshTokenExpiresAt }`.

Regras: senha com 8+ caracteres contendo letra e número; confirmação igual;
idade mínima de 18 anos calculada no servidor em UTC; nome de usuário de 3 a 24
caracteres em minúsculas, números, ponto e sublinhado, sem começar ou terminar
com separador e sem termo bloqueado.

### `POST /auth/login`

`{ email, password }` → **200** com a mesma sessão do cadastro.

### `POST /auth/refresh` — RF76

`{ refreshToken }` → **200** com um par novo. O token usado é revogado na
mesma operação; reapresentá-lo devolve **401**.

### `POST /auth/logout`

`{ refreshToken }` → **200**. Revoga aquela sessão.

### `POST /auth/forgot-password` — RF02

`{ email }` → **200** com mensagem genérica. Fora de produção, a resposta inclui
`token` para facilitar o teste manual. O link vale 15 minutos e invalida pedidos
anteriores ainda abertos.

### `POST /auth/reset-password` — RF02

`{ token, password, passwordConfirmation }` → **200**. Revoga todas as sessões
do usuário.

### `GET /auth/username-available?username=` — RF34

**200** com `{ available, reason? }`. Serve ao indicador em tempo real da tela
de cadastro.

### `GET /auth/me`

Exige `Authorization: Bearer <accessToken>`. **200** com `{ user }`.

---

## Partidas

### `GET /matches` — RF03, RF17

Query: `date` (YYYY-MM-DD, padrão hoje), `leagueId`, `teamId`, `status`,
`limit` (≤100), `offset`.

```json
{
  "total": 7,
  "date": "2026-10-01",
  "matches": [{
    "id": "uuid",
    "league": { "id": "uuid", "name": "Brasileirão Série A", "country": "Brasil" },
    "homeTeam": { "id": "uuid", "name": "Palmeiras", "shortName": "PAL" },
    "awayTeam": { "id": "uuid", "name": "Santos", "shortName": "SAN" },
    "venue": { "id": "uuid", "name": "Allianz Parque", "city": "São Paulo" },
    "kickoffAt": "2026-10-01T19:00:00.000Z",
    "status": "scheduled",
    "score": { "home": null, "away": null },
    "probability": { "home": 58, "draw": 18, "away": 24, "confidence": 94 },
    "form": { "home": ["W","W","D","L","W"], "away": ["L","D","L","W","L"] },
    "stale": false
  }]
}
```

`probability` sempre soma exatamente 100. `stale` fica `true` quando a partida
não é sincronizada há mais de 48 horas (**RF72**).

### `GET /matches/:id` — RF04, RF15, RF36, RF62

Acrescenta ao resumo:

- `statistics` — posse, finalizações, finalizações no gol, faltas, escanteios,
  impedimentos e precisão de passes, um par por time
- `referee` — nome e médias de faltas, amarelos, vermelhos e pênaltis
- `injuries` — desfalques dos dois times
- `weather` — temperatura, sensação, condição, umidade, vento e precipitação

### `GET /compare?homeTeamId=&awayTeamId=&limit=` — RF06, RF37

Retrospecto do confronto direto contado nos dois sentidos de mando, saldo de
gols, forma recente dos dois times com nota de 0 a 100, probabilidade e a lista
de confrontos anteriores.

---

## Busca

### `GET /search?q=&limit=&types=` — RF27

`q` precisa de 2+ caracteres. `types` aceita `team,player,league,venue`
separados por vírgula. Devolve `results` ordenados por similaridade e
`suggestions` para o autocomplete. Busca sem acento e por correspondência
parcial.

### `GET /search/players?q=&limit=` — RF56

Jogadores com time, liga e estatísticas: jogos, gols, assistências, cartões.

### `GET /venues` — RF49

Estádios com nome, cidade, capacidade, ano e coordenadas para o mapa.

---

## Ranking

### `GET /ranking?limit=&offset=` — RF11

Posições numeradas a partir de 1, ordenadas por pontos. Empate é desfeito pela
data de criação da conta, o que mantém a ordem estável entre páginas.

### `GET /ranking/me` — RF86

Autenticado. Posição, pontos, `pointsToClimb` e `leaderPoints`.

### `GET /ranking/me/history?days=` — RF71

Autenticado. Série diária dos últimos 30 dias (configurável até 365), com
`best`, `worst` e `change`. Dias sem retrato ficam de fora da série em vez de
virarem zero.

---

## Resumos

### `GET /digest/daily?date=` — RF53

Autenticação opcional: com token, inclui a posição do usuário no ranking.
Traz totais do dia e os destaques, ordenados por volume de palpites da
comunidade e, no empate, pelo equilíbrio do jogo. Cada destaque carrega
`community` com a distribuição dos palpites (**RF26**).

### `GET /digest/previous-round?days=` — RF77

Resultados reais do período, os palpites que mais pontuaram e os maiores erros.

---

## Operação

### `GET /health`

Estado do banco e das fontes, com os contadores de cache e de fallback — a
evidência prática do **RNF11**. Devolve **503** quando banco ou fonte primária
estão fora.

### `POST /admin/sync?days=` — admin

Dispara a sincronização com a fonte externa.

### `POST /admin/ranking/snapshot` — admin

Grava o retrato diário do ranking que alimenta o `RF71`. Idempotente.
