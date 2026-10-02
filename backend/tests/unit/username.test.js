'use strict';

const { validateUsername } = require('../../src/utils/username');

describe('política de nome de usuário (RF34)', () => {
  it('aceita nomes dentro da regra', () => {
    ['henrytito', 'ana_stats', 'gol.de.placa', 'zagueiro77'].forEach((username) => {
      expect(validateUsername(username).valid).toBe(true);
    });
  });

  it('recusa comprimento fora de 3 a 24', () => {
    expect(validateUsername('ab').valid).toBe(false);
    expect(validateUsername('a'.repeat(25)).valid).toBe(false);
  });

  it('recusa caracteres especiais e maiúsculas', () => {
    ['Henry', 'ana stats', 'jo@o', 'time#1', 'olá'].forEach((username) => {
      expect(validateUsername(username).valid).toBe(false);
    });
  });

  it('recusa separador na borda', () => {
    ['_henry', 'henry_', '.henry', 'henry.'].forEach((username) => {
      expect(validateUsername(username).valid).toBe(false);
    });
  });

  it('recusa termos bloqueados, inclusive disfarçados com separador ou acento', () => {
    expect(validateUsername('admin').valid).toBe(false);
    expect(validateUsername('a.d.m.i.n').valid).toBe(false);
    expect(validateUsername('suporte_oficial').valid).toBe(false);
  });

  it('exige uma string', () => {
    expect(validateUsername(undefined).valid).toBe(false);
    expect(validateUsername(42).valid).toBe(false);
  });
});
