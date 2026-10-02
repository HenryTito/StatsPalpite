-- Executado uma única vez, na criação do volume.
--
-- As extensões precisam existir em cada banco que as usa: pg_trgm e unaccent
-- sustentam a busca por similaridade sem acento (RF27 e RF56). As migrations
-- também as criam, mas aqui o superusuário já está disponível.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Banco usado pela suíte de teste, recriado a cada execução.
CREATE DATABASE statspalpite_test OWNER statspalpite;
