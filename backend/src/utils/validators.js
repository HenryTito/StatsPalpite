'use strict';

const { z } = require('zod');

/**
 * Validadores compartilhados pelos controllers.
 *
 * O ponto importante aqui é não confundir FORMATO com VALIDADE. Uma data
 * como "2026-13-45" passa em qualquer regex de `\d{4}-\d{2}-\d{2}`, vira
 * `Invalid Date` no construtor e explode lá na frente, dentro da consulta ao
 * banco, como erro 500. A validação precisa comparar a data reconstruída com
 * o texto original.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Verifica que o texto é uma data de calendário que realmente existe. */
function isRealDate(value) {
  if (!ISO_DATE.test(value)) return false;

  const [year, month, day] = value.split('-').map(Number);
  // O construtor normaliza o excedente: 2026-02-31 vira 3 de março. Comparar
  // os campos de volta é o que revela a data impossível.
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Data ISO (YYYY-MM-DD) que existe no calendário. */
const isoDate = z
  .string()
  .regex(ISO_DATE, 'Data deve estar no formato AAAA-MM-DD')
  .refine(isRealDate, 'Data inexistente no calendário');

/**
 * Deslocamento de paginação.
 *
 * O teto evita que um número acima do limite de BIGINT do Postgres vire erro
 * de banco; e, bem antes disso, um offset absurdo só desperdiça varredura.
 */
const MAX_OFFSET = 100000;
const offset = z.coerce.number().int().min(0).max(MAX_OFFSET);

/** Termo de busca: mínimo que justifica consultar, máximo que evita abuso. */
const MIN_SEARCH_LENGTH = 2;
const MAX_SEARCH_LENGTH = 100;
const searchTerm = z
  .string()
  .trim()
  .min(MIN_SEARCH_LENGTH, `A busca precisa de pelo menos ${MIN_SEARCH_LENGTH} caracteres`)
  .max(MAX_SEARCH_LENGTH, `A busca aceita no máximo ${MAX_SEARCH_LENGTH} caracteres`);

module.exports = {
  ISO_DATE,
  isRealDate,
  isoDate,
  offset,
  searchTerm,
  MAX_OFFSET,
  MIN_SEARCH_LENGTH,
  MAX_SEARCH_LENGTH,
};
