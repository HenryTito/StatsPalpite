'use strict';

const env = require('./env');

/** Logger mínimo. Silencioso em teste para não poluir a saída do Jest. */
function emit(level, message, meta) {
  if (env.isTest) return;
  const line = { level, message, time: new Date().toISOString(), ...(meta ? { meta } : {}) };
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](JSON.stringify(line));
}

module.exports = {
  info: (message, meta) => emit('info', message, meta),
  warn: (message, meta) => emit('warn', message, meta),
  error: (message, meta) => emit('error', message, meta),
};
