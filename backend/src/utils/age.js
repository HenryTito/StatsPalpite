'use strict';

/**
 * Idade em anos completos, calculada no servidor (RF31).
 *
 * A data de nascimento chega como 'YYYY-MM-DD' e é comparada em UTC. Fazer a
 * conta no cliente deixaria o bloqueio à mercê do relógio do aparelho; fazer
 * com `new Date(string)` em horário local erraria por um dia perto da meia-noite.
 */
function calculateAge(birthDate, reference = new Date()) {
  const birth = birthDate instanceof Date ? birthDate : new Date(`${birthDate}T00:00:00.000Z`);
  if (Number.isNaN(birth.getTime())) {
    throw new TypeError('Data de nascimento inválida');
  }

  let age = reference.getUTCFullYear() - birth.getUTCFullYear();

  const monthDelta = reference.getUTCMonth() - birth.getUTCMonth();
  const dayDelta = reference.getUTCDate() - birth.getUTCDate();
  // Ainda não fez aniversário neste ano.
  if (monthDelta < 0 || (monthDelta === 0 && dayDelta < 0)) {
    age -= 1;
  }

  return age;
}

function isAtLeast(birthDate, minimumAge, reference = new Date()) {
  return calculateAge(birthDate, reference) >= minimumAge;
}

module.exports = { calculateAge, isAtLeast };
