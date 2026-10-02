# Arquitetura do backend

Node.js com Express, padrão MVC e Sequelize, como exige o **RNF05**.

## Camadas

```
  HTTP
   │
   ▼
┌──────────────┐   valida entrada (zod), autentica (JWT), limita taxa,
│  middlewares │   audita a ação e traduz erro em resposta
└──────┬───────┘
       ▼
┌──────────────┐   uma função por endpoint: lê a requisição,
│ controllers  │   chama o serviço, devolve JSON. Sem regra de negócio.
└──────┬───────┘
       ▼
┌──────────────┐   toda a regra vive aqui: autenticação, probabilidade,
│  services    │   busca, ranking, resumos, ingestão
└──────┬───────┘
       ├──────────────────────────┐
       ▼                          ▼
┌──────────────┐          ┌───────────────────┐
│   models     │          │    providers      │
│ (Sequelize)  │          │ motor de ingestão │
└──────┬───────┘          └─────────┬─────────┘
       ▼                            ▼
  PostgreSQL                 fontes externas
```

A dependência aponta sempre para baixo. Um controller nunca fala com um model,
e um service nunca sabe o que é `req` ou `res`.

## Motor de ingestão (B008)

É a peça mais estruturante da Sprint 1. Quatro requisitos dependem dela —
`RF15` (clima), `RF36` (lesões), `RF62` (arbitragem) e `RNF11` (fallback).

```
  service pede dados
        │
        ▼
┌───────────────────┐
│  IngestionEngine  │  1. consulta o cache com TTL
│                   │  2. em falta, chama a fonte primária
│                   │  3. se ela falhar, chama a secundária  ← RNF11
│                   │  4. conta acertos, falhas e fallbacks
└─────────┬─────────┘
          ▼
┌───────────────────┐
│  FootballProvider │  contrato: fetchMatches, fetchTeams, ...
└─────────┬─────────┘
          │  implementações
     ┌────┴────┬──────────────┬──────────────┐
     ▼         ▼              ▼              ▼
   Local   ApiFootball   FootballData   (próximas)
     │         │              │
     ▼         ▼              ▼
┌────────────────────────────────┐
│    camada anticorrupção        │  traduz o formato da fonte
│    (src/providers/translators) │  para os DTOs de contracts.js
└────────────────────────────────┘
```

**Por que a camada anticorrupção importa.** A API-Football devolve estatística
como lista de pares `{type: "Ball Possession", value: "54%"}`, status como
sigla `FT`, e timestamp em segundos. O Football-Data devolve outra coisa
completamente. Sem tradução, esse vocabulário se espalharia pelos serviços e
pelo banco, e trocar de fonte viraria uma reescrita. Com ela, a troca é uma
variável de ambiente.

O teste `tests/unit/translator.test.js` fixa essa garantia: ele compara as
chaves produzidas por duas fontes diferentes e exige que sejam idênticas.

## Cache

`TtlCache` é um contrato de quatro métodos, com implementação em memória.
O **RNF02** (10.000 simultâneos), que é da Sprint 3, troca isso por Redis
escrevendo uma classe que honre os mesmos métodos. Nada mais muda.

## Banco

PostgreSQL. Duas extensões são carregadas por migration:

- `pg_trgm` — similaridade por trigrama, base do `RF27` e do `RF56`
- `unaccent` — encapsulada em `immutable_unaccent`, para que "sao paulo"
  encontre "São Paulo". A função é declarada `IMMUTABLE` porque o Postgres
  recusa índice de expressão sobre função volátil.

### Tabelas

| Tabela | Papel |
|---|---|
| `users` | contas, papel e pontuação acumulada |
| `refresh_tokens` | sessões persistentes; guarda só o hash |
| `password_resets` | links de recuperação, validade de 15 min |
| `leagues`, `teams`, `venues`, `players`, `referees` | catálogo vindo da ingestão |
| `matches`, `match_statistics`, `injuries` | partidas e seus dados |
| `predictions` | palpites (a regra completa é da Sprint 2) |
| `ranking_snapshots` | um retrato por usuário por dia, para o `RF71` |
| `audit_logs` | rastro de ações do `RF25` |

**Sobre o log de auditoria.** O documento de requisitos fala em "coleção
separada no banco", vocabulário de banco de documentos. Como o `RNF05` obriga
Sequelize, ele é uma tabela dedicada, sem relação obrigatória com as demais —
o que atende o requisito de rastreabilidade e separação.

## Segurança

- Senha com bcrypt, 10 rounds. O hash nunca sai em resposta: `User.toJSON()` o remove.
- Access token JWT de 15 minutos; refresh token opaco de 30 dias, guardado como hash SHA-256.
- Rotação de refresh: usar o token antigo depois da troca devolve 401.
- Trocar a senha revoga todas as sessões abertas.
- `helmet` para os cabeçalhos do **RNF07**; HSTS só sob HTTPS.
- Rate limit de 20 requisições por 15 min nas rotas de credencial.
- Login e recuperação de senha respondem igual exista ou não a conta, para não
  funcionarem como oráculo de e-mails cadastrados.
