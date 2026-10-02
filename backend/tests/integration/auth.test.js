'use strict';

const request = require('supertest');

const { createApp } = require('../../src/app');
const { sequelize, User, RefreshToken, PasswordReset } = require('../../src/models');
const { resetDatabase } = require('../helpers/database');

const app = createApp();
const API = '/api/v1';

/** Payload de cadastro válido, com campos sobrescrevíveis por teste. */
function validRegistration(overrides = {}) {
  return {
    email: 'novo@statspalpite.app',
    username: 'novousuario',
    password: 'Palpite123',
    passwordConfirmation: 'Palpite123',
    birthDate: '1998-04-12',
    ...overrides,
  };
}

beforeAll(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await PasswordReset.destroy({ where: {} });
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {}, force: true });
});

describe('POST /auth/register (RF01)', () => {
  it('cria a conta e já devolve a sessão', async () => {
    const response = await request(app).post(`${API}/auth/register`).send(validRegistration());

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('novo@statspalpite.app');
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.refreshToken).toEqual(expect.any(String));
  });

  it('nunca devolve o hash da senha', async () => {
    const response = await request(app).post(`${API}/auth/register`).send(validRegistration());
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(response.body)).not.toContain('$2a$');
  });

  it('guarda a senha com hash bcrypt, nunca em texto', async () => {
    await request(app).post(`${API}/auth/register`).send(validRegistration());
    const user = await User.findOne({ where: { email: 'novo@statspalpite.app' } });

    expect(user.passwordHash).not.toBe('Palpite123');
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('recusa quando a confirmação de senha não confere', async () => {
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send(validRegistration({ passwordConfirmation: 'Outra123' }));

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('PASSWORD_MISMATCH');
  });

  it('recusa e-mail mal formado', async () => {
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send(validRegistration({ email: 'nao-e-email' }));

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('recusa senha fraca', async () => {
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send(validRegistration({ password: 'curta', passwordConfirmation: 'curta' }));

    expect(response.status).toBe(422);
  });

  it('bloqueia menores de 18 anos (RF31)', async () => {
    const minor = new Date();
    minor.setUTCFullYear(minor.getUTCFullYear() - 17);

    const response = await request(app)
      .post(`${API}/auth/register`)
      .send(validRegistration({ birthDate: minor.toISOString().slice(0, 10) }));

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('UNDERAGE');
    expect(await User.count()).toBe(0);
  });

  it('aceita quem acabou de completar 18 anos (RF31)', async () => {
    const adult = new Date();
    adult.setUTCFullYear(adult.getUTCFullYear() - 18);

    const response = await request(app)
      .post(`${API}/auth/register`)
      .send(validRegistration({ birthDate: adult.toISOString().slice(0, 10) }));

    expect(response.status).toBe(201);
  });

  it('recusa nome de usuário com termo bloqueado (RF34)', async () => {
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send(validRegistration({ username: 'admin123' }));

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('INVALID_USERNAME');
  });

  it('recusa e-mail já cadastrado', async () => {
    await request(app).post(`${API}/auth/register`).send(validRegistration());
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send(validRegistration({ username: 'outronome' }));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('ALREADY_TAKEN');
  });

  it('recusa nome de usuário já cadastrado', async () => {
    await request(app).post(`${API}/auth/register`).send(validRegistration());
    const response = await request(app)
      .post(`${API}/auth/register`)
      .send(validRegistration({ email: 'outro@statspalpite.app' }));

    expect(response.status).toBe(409);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${API}/auth/register`).send(validRegistration());
  });

  it('autentica com as credenciais corretas', async () => {
    const response = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'novo@statspalpite.app', password: 'Palpite123' });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
  });

  it('recusa senha errada', async () => {
    const response = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'novo@statspalpite.app', password: 'ErradaXXX1' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('não revela se o e-mail existe', async () => {
    const unknown = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'ninguem@statspalpite.app', password: 'Palpite123' });
    const wrongPassword = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'novo@statspalpite.app', password: 'ErradaXXX1' });

    expect(unknown.status).toBe(wrongPassword.status);
    expect(unknown.body.error.message).toBe(wrongPassword.body.error.message);
  });
});

describe('sessão persistente (RF76)', () => {
  let session;

  beforeEach(async () => {
    const response = await request(app).post(`${API}/auth/register`).send(validRegistration());
    session = response.body;
  });

  it('troca o refresh token por um par novo', async () => {
    const response = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: session.refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.refreshToken).not.toBe(session.refreshToken);
  });

  it('invalida o token antigo depois da rotação', async () => {
    await request(app).post(`${API}/auth/refresh`).send({ refreshToken: session.refreshToken });
    const reuse = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: session.refreshToken });

    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('INVALID_REFRESH');
  });

  it('guarda apenas o hash do refresh token', async () => {
    const stored = await RefreshToken.findOne();
    expect(stored.tokenHash).not.toBe(session.refreshToken);
    expect(stored.tokenHash).toHaveLength(64);
  });

  it('o logout revoga o token', async () => {
    await request(app).post(`${API}/auth/logout`).send({ refreshToken: session.refreshToken });
    const response = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: session.refreshToken });

    expect(response.status).toBe(401);
  });

  it('GET /auth/me exige token válido', async () => {
    const semToken = await request(app).get(`${API}/auth/me`);
    expect(semToken.status).toBe(401);

    const comToken = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${session.accessToken}`);
    expect(comToken.status).toBe(200);
    expect(comToken.body.user.username).toBe('novousuario');
  });

  it('recusa token adulterado', async () => {
    const response = await request(app)
      .get(`${API}/auth/me`)
      .set('Authorization', `Bearer ${session.accessToken}corrompido`);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('recuperação de senha (RF02)', () => {
  beforeEach(async () => {
    await request(app).post(`${API}/auth/register`).send(validRegistration());
  });

  it('cria um token com validade de 15 minutos', async () => {
    const response = await request(app)
      .post(`${API}/auth/forgot-password`)
      .send({ email: 'novo@statspalpite.app' });

    expect(response.status).toBe(200);

    const reset = await PasswordReset.findOne();
    const minutes = (new Date(reset.expiresAt) - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(14);
    expect(minutes).toBeLessThanOrEqual(15);
  });

  it('responde igual para e-mail inexistente, sem virar oráculo de cadastro', async () => {
    const known = await request(app)
      .post(`${API}/auth/forgot-password`)
      .send({ email: 'novo@statspalpite.app' });
    const unknown = await request(app)
      .post(`${API}/auth/forgot-password`)
      .send({ email: 'ninguem@statspalpite.app' });

    expect(unknown.status).toBe(known.status);
    expect(unknown.body.message).toBe(known.body.message);
  });

  it('redefine a senha e permite entrar com a nova', async () => {
    const forgot = await request(app)
      .post(`${API}/auth/forgot-password`)
      .send({ email: 'novo@statspalpite.app' });

    const reset = await request(app).post(`${API}/auth/reset-password`).send({
      token: forgot.body.token,
      password: 'NovaSenha123',
      passwordConfirmation: 'NovaSenha123',
    });
    expect(reset.status).toBe(200);

    const login = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'novo@statspalpite.app', password: 'NovaSenha123' });
    expect(login.status).toBe(200);
  });

  it('recusa o mesmo token duas vezes', async () => {
    const forgot = await request(app)
      .post(`${API}/auth/forgot-password`)
      .send({ email: 'novo@statspalpite.app' });

    const payload = {
      token: forgot.body.token,
      password: 'NovaSenha123',
      passwordConfirmation: 'NovaSenha123',
    };
    await request(app).post(`${API}/auth/reset-password`).send(payload);
    const reuse = await request(app).post(`${API}/auth/reset-password`).send(payload);

    expect(reuse.status).toBe(400);
    expect(reuse.body.error.code).toBe('INVALID_RESET_TOKEN');
  });

  it('recusa token expirado', async () => {
    const forgot = await request(app)
      .post(`${API}/auth/forgot-password`)
      .send({ email: 'novo@statspalpite.app' });

    await PasswordReset.update({ expiresAt: new Date(Date.now() - 1000) }, { where: {} });

    const response = await request(app).post(`${API}/auth/reset-password`).send({
      token: forgot.body.token,
      password: 'NovaSenha123',
      passwordConfirmation: 'NovaSenha123',
    });

    expect(response.status).toBe(400);
  });

  it('derruba as sessões abertas ao trocar a senha', async () => {
    const login = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'novo@statspalpite.app', password: 'Palpite123' });

    const forgot = await request(app)
      .post(`${API}/auth/forgot-password`)
      .send({ email: 'novo@statspalpite.app' });
    await request(app).post(`${API}/auth/reset-password`).send({
      token: forgot.body.token,
      password: 'NovaSenha123',
      passwordConfirmation: 'NovaSenha123',
    });

    const refresh = await request(app)
      .post(`${API}/auth/refresh`)
      .send({ refreshToken: login.body.refreshToken });

    expect(refresh.status).toBe(401);
  });
});

describe('GET /auth/username-available (RF34)', () => {
  it('informa disponível para nome válido e livre', async () => {
    const response = await request(app).get(`${API}/auth/username-available?username=livre123`);
    expect(response.body.available).toBe(true);
  });

  it('informa indisponível para nome já usado', async () => {
    await request(app).post(`${API}/auth/register`).send(validRegistration());
    const response = await request(app).get(`${API}/auth/username-available?username=novousuario`);
    expect(response.body.available).toBe(false);
  });

  it('informa indisponível com o motivo para nome inválido', async () => {
    const response = await request(app).get(`${API}/auth/username-available?username=ADMIN`);
    expect(response.body.available).toBe(false);
    expect(response.body.reason).toEqual(expect.any(String));
  });
});
