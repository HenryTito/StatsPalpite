# Guia de configuração do ambiente

Atende ao **RNF10**.

## Requisitos

- Node.js 22 ou superior (há um `.nvmrc` na raiz do projeto)
- PostgreSQL 14 ou superior

## Passo a passo

### 1. Subir o PostgreSQL

No WSL ou Linux com o pacote já instalado:

```bash
sudo service postgresql start
```

Criar o usuário e os bancos (desenvolvimento e teste):

```bash
sudo -u postgres psql <<'SQL'
CREATE USER statspalpite WITH PASSWORD 'statspalpite' CREATEDB;
CREATE DATABASE statspalpite OWNER statspalpite;
CREATE DATABASE statspalpite_test OWNER statspalpite;
SQL
```

O usuário precisa de `CREATEDB` porque a suíte de teste recria o banco a cada
execução. As extensões `pg_trgm` e `unaccent` são criadas pelas migrations;
em alguns sistemas isso exige superusuário — se a migration falhar nessa etapa,
rode uma vez:

```bash
sudo -u postgres psql -d statspalpite -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS unaccent;'
sudo -u postgres psql -d statspalpite_test -c 'CREATE EXTENSION IF NOT EXISTS pg_trgm; CREATE EXTENSION IF NOT EXISTS unaccent;'
```

### 2. Instalar e configurar

```bash
cd backend
npm install
cp .env.example .env
```

Em `.env`, o mínimo a revisar é `JWT_SECRET`. O resto funciona com os padrões.

### 3. Migrar e popular

```bash
npm run db:migrate
npm run db:seed
```

O seed popula o catálogo **pelo motor de ingestão**, o mesmo caminho que a API
externa usará, e cria oito usuários de demonstração com a senha `Palpite123`.
O usuário `henry@statspalpite.app` tem papel `admin`.

### 4. Rodar

```bash
npm run dev     # com --watch
npm start       # sem watch
npm test        # unitários + integração
```

A API sobe em `http://localhost:3333`. Verificação rápida:

```bash
curl http://localhost:3333/api/v1/health
```

## Variáveis de ambiente

| Variável | Padrão | Para que serve |
|---|---|---|
| `PORT` | 3333 | porta da API |
| `APP_URL` | http://localhost:3333 | base do link de recuperação de senha |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASS` | localhost:5432, statspalpite | conexão |
| `DB_NAME_TEST` | statspalpite_test | banco recriado pelos testes |
| `JWT_SECRET` | — | **troque em produção** |
| `JWT_EXPIRES_IN` | 15m | validade do access token |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | 30 | validade da sessão persistente |
| `PASSWORD_RESET_EXPIRES_IN_MINUTES` | 15 | janela exigida pelo RF02 |
| `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` | vazio | vazio = modo console, imprime o e-mail no log |
| `FOOTBALL_PRIMARY` | local | `local`, `api-football` ou `football-data` |
| `FOOTBALL_SECONDARY` | local | fonte de fallback do RNF11 |
| `API_FOOTBALL_KEY` | vazio | chave da API-Football |
| `FOOTBALL_DATA_KEY` | vazio | chave do Football-Data.org |
| `OPENWEATHERMAP_KEY` | vazio | vazio = previsão local determinística |
| `CACHE_TTL_*` | 300 a 86400 | TTL por tipo de recurso, em segundos |
| `SENTRY_DSN` | vazio | vazio desativa o Sentry |

## Ligando as fontes reais

Sem chave nenhuma, a fonte local responde e o sistema fica inteiramente
funcional. Para usar as APIs do documento de requisitos:

1. API-Football — conta gratuita em dashboard.api-football.com
2. Football-Data.org — conta gratuita em football-data.org/client/register
3. OpenWeatherMap — conta gratuita em openweathermap.org/api

No `.env`:

```
FOOTBALL_PRIMARY=api-football
FOOTBALL_SECONDARY=football-data
API_FOOTBALL_KEY=sua-chave
FOOTBALL_DATA_KEY=sua-chave
OPENWEATHERMAP_KEY=sua-chave
```

Nenhuma outra linha do código muda: quem fala com a fonte é o adapter, e quem
traduz é o tradutor.

## Problemas comuns

**`no response` do `pg_isready`** — o serviço não subiu. `sudo service postgresql start`.

**`permission denied to create extension`** — rode o comando de extensões da
seção 1 como `postgres`.

**`database "statspalpite_test" does not exist`** — a suíte cria o banco, mas o
usuário precisa de `CREATEDB`.

**`SASL: client password must be a string`** — `DB_PASS` está vazio no `.env`.
