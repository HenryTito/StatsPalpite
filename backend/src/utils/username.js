'use strict';

/**
 * Política de nome de usuário (RF34): 3 a 24 caracteres, letras minúsculas,
 * números, ponto e sublinhado; sem começar ou terminar com separador, e sem
 * termos bloqueados.
 */
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._]{1,22}[a-z0-9])$/;

/**
 * Lista de termos bloqueados. Cobre ofensas comuns em português e inglês e
 * nomes que se passariam por conta oficial. Em produção isto vem de uma
 * tabela editável pela administração (EP10, Sprint 3).
 */
const BLOCKED_TERMS = [
  'admin',
  'administrador',
  'moderador',
  'suporte',
  'statspalpite',
  'oficial',
  'root',
  'merda',
  'bosta',
  'caralho',
  'porra',
  'puta',
  'viado',
  'buceta',
  'fdp',
  'arrombado',
  'fuck',
  'shit',
  'bitch',
  'nazi',
];

/** Normaliza para comparação: minúsculas, sem acento e sem separadores. */
function normalize(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[._]/g, '');
}

/**
 * @returns {{valid: boolean, reason?: string}}
 */
function validateUsername(rawUsername) {
  if (typeof rawUsername !== 'string') {
    return { valid: false, reason: 'Nome de usuário é obrigatório' };
  }

  const username = rawUsername.trim();

  if (username.length < 3 || username.length > 24) {
    return { valid: false, reason: 'Nome de usuário deve ter entre 3 e 24 caracteres' };
  }

  if (!USERNAME_PATTERN.test(username)) {
    return {
      valid: false,
      reason:
        'Nome de usuário aceita apenas letras minúsculas, números, ponto e sublinhado, e não pode começar nem terminar com ponto ou sublinhado',
    };
  }

  const normalized = normalize(username);
  const blocked = BLOCKED_TERMS.find((term) => normalized.includes(term));
  if (blocked) {
    return { valid: false, reason: 'Nome de usuário contém um termo não permitido' };
  }

  return { valid: true };
}

module.exports = { USERNAME_PATTERN, BLOCKED_TERMS, normalize, validateUsername };
