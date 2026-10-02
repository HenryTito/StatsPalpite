'use strict';

/**
 * Converte contagens em percentuais inteiros que somam exatamente 100.
 *
 * Arredondar cada fatia isoladamente não fecha a conta: três valores iguais
 * viram 33+33+33 = 99, e outras combinações passam de 100. Numa tela que
 * mostra "a comunidade palpitou" ao lado de uma barra, o erro é visível.
 *
 * O método é o do maior resto: distribui a parte inteira de cada fatia e
 * entrega as sobras a quem tem a maior parte fracionária.
 */
function toPercentages(counts) {
  const keys = Object.keys(counts);
  const total = keys.reduce((sum, key) => sum + counts[key], 0);

  if (total <= 0) {
    return keys.reduce((result, key) => ({ ...result, [key]: 0 }), {});
  }

  const exact = keys.map((key) => {
    const value = (counts[key] / total) * 100;
    return { key, floor: Math.floor(value), remainder: value - Math.floor(value) };
  });

  let distributed = exact.reduce((sum, item) => sum + item.floor, 0);
  // As unidades que faltam vão para as maiores frações, em ordem.
  const byRemainder = [...exact].sort((a, b) => b.remainder - a.remainder);

  const result = {};
  exact.forEach((item) => {
    result[item.key] = item.floor;
  });

  let index = 0;
  while (distributed < 100 && index < byRemainder.length) {
    result[byRemainder[index].key] += 1;
    distributed += 1;
    index += 1;
  }

  return result;
}

module.exports = { toPercentages };
