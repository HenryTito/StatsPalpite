'use strict';

const { execFile } = require('child_process');
const path = require('path');
const util = require('util');

const execFileAsync = util.promisify(execFile);
const ROOT = path.resolve(__dirname, '..', '..');

/**
 * Prepara o banco de teste rodando as MIGRATIONS reais, não `sequelize.sync()`.
 *
 * Isso importa: sync() recria o esquema a partir dos models e passaria por
 * cima de qualquer migration quebrada, além de ignorar as extensões e os
 * índices de trigrama de que a busca depende. Testar sobre as migrations é o
 * que garante que o que roda em produção é o que foi testado.
 */
async function resetDatabase() {
  const env = { ...process.env, NODE_ENV: 'test' };
  const cli = path.join(ROOT, 'node_modules', '.bin', 'sequelize-cli');

  // db:drop falha quando o banco ainda não existe; é um caminho esperado.
  await execFileAsync(cli, ['db:drop'], { cwd: ROOT, env }).catch(() => {});
  await execFileAsync(cli, ['db:create'], { cwd: ROOT, env });
  await execFileAsync(cli, ['db:migrate'], { cwd: ROOT, env });
}

module.exports = { resetDatabase };
