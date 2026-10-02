#!/usr/bin/env bash
#
# Sobe um PostgreSQL próprio, sem sudo e sem instalar nada no sistema.
#
# Esta máquina só tem o cliente do Postgres, e instalar o servidor exige
# privilégio de administrador. Em vez disso, extraímos o pacote num diretório
# do usuário e rodamos o cluster ali. Funciona porque o Postgres resolve os
# próprios caminhos a partir da localização do binário.
#
# Para um ambiente definitivo, prefira o pacote do sistema:
#   sudo apt install postgresql postgresql-contrib
#
# Uso: ./scripts/postgres-local.sh {start|stop|status|reset}
set -euo pipefail

PREFIX="${PGSQL_PREFIX:-$HOME/.local/pgsql}"
BIN="$PREFIX/root/usr/lib/postgresql/16/bin"
DATA="$PREFIX/data"
LOG="$PREFIX/postgres.log"
# O padrão do pacote é /var/run/postgresql, que não existe e não podemos criar.
SOCKET_DIR="$PREFIX/run"
PORT="${DB_PORT:-5432}"
USER_NAME="${DB_USER:-statspalpite}"
PASSWORD="${DB_PASS:-statspalpite}"

die() { echo "erro: $*" >&2; exit 1; }

install_server() {
  [ -x "$BIN/postgres" ] && return 0

  echo "Baixando o PostgreSQL 16 para $PREFIX ..."
  mkdir -p "$PREFIX"
  ( cd "$PREFIX" \
    && apt-get download postgresql-16 postgresql-common >/dev/null \
    && for pkg in *.deb; do dpkg-deb -x "$pkg" root; done \
    && rm -f ./*.deb )

  [ -x "$BIN/postgres" ] || die "não foi possível obter o servidor"
}

init_cluster() {
  [ -d "$DATA" ] && return 0

  echo "Inicializando o cluster em $DATA ..."
  # trust local: o cluster escuta apenas em 127.0.0.1 e pertence ao usuário.
  "$BIN/initdb" -D "$DATA" -U "$USER_NAME" --auth=trust --encoding=UTF8 --locale=C >/dev/null
}

create_databases() {
  export PGHOST=127.0.0.1 PGPORT="$PORT" PGUSER="$USER_NAME"

  psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='statspalpite'" | grep -q 1 \
    || psql -d postgres -qc "CREATE DATABASE statspalpite OWNER $USER_NAME;"

  psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='statspalpite_test'" | grep -q 1 \
    || psql -d postgres -qc "CREATE DATABASE statspalpite_test OWNER $USER_NAME;"

  # SUPERUSER é necessário para CREATE EXTENSION nas migrations; CREATEDB,
  # para a suíte de teste recriar o banco a cada execução.
  psql -d postgres -qc "ALTER USER $USER_NAME WITH PASSWORD '$PASSWORD' SUPERUSER CREATEDB;"
}

case "${1:-start}" in
  start)
    install_server
    init_cluster
    if "$BIN/pg_ctl" -D "$DATA" status >/dev/null 2>&1; then
      echo "PostgreSQL já está no ar na porta $PORT."
    else
      mkdir -p "$SOCKET_DIR"
      "$BIN/pg_ctl" -D "$DATA" -l "$LOG" -o "-p $PORT -h 127.0.0.1 -k $SOCKET_DIR" start
      sleep 2
    fi
    create_databases
    echo "Pronto: postgresql://$USER_NAME@127.0.0.1:$PORT/statspalpite"
    ;;

  stop)
    "$BIN/pg_ctl" -D "$DATA" stop
    ;;

  status)
    "$BIN/pg_ctl" -D "$DATA" status
    ;;

  reset)
    "$BIN/pg_ctl" -D "$DATA" stop 2>/dev/null || true
    rm -rf "$DATA"
    "$0" start
    ;;

  *)
    die "uso: $0 {start|stop|status|reset}"
    ;;
esac
