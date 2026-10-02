'use strict';

const { z } = require('zod');

const authService = require('../services/authService');

/** Senha: mínimo 8 caracteres, com letra e número. */
const passwordSchema = z
  .string()
  .min(8, 'A senha precisa de pelo menos 8 caracteres')
  .regex(/[A-Za-z]/, 'A senha precisa conter ao menos uma letra')
  .regex(/[0-9]/, 'A senha precisa conter ao menos um número');

const schemas = {
  register: z.object({
    email: z.string().email('E-mail inválido'),
    username: z.string().min(3).max(24),
    password: passwordSchema,
    passwordConfirmation: z.string(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento deve ser YYYY-MM-DD'),
  }),

  login: z.object({
    email: z.string().email('E-mail inválido'),
    password: z.string().min(1, 'Senha obrigatória'),
  }),

  refresh: z.object({ refreshToken: z.string().min(1, 'Refresh token obrigatório') }),

  forgotPassword: z.object({ email: z.string().email('E-mail inválido') }),

  resetPassword: z.object({
    token: z.string().min(1, 'Token obrigatório'),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  }),

  usernameQuery: z.object({ username: z.string().min(1, 'Informe um nome de usuário') }),
};

async function register(req, res, next) {
  try {
    res.status(201).json(await authService.register(req.body));
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    res.json(await authService.login(req.body));
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    res.json(await authService.refresh(req.body));
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    res.json(await authService.logout(req.body));
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    res.json(await authService.requestPasswordReset(req.body));
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    res.json(await authService.resetPassword(req.body));
  } catch (error) {
    next(error);
  }
}

async function checkUsername(req, res, next) {
  try {
    res.json(await authService.checkUsernameAvailability(req.validatedQuery.username));
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json({ user: req.user.toJSON() });
}

module.exports = {
  schemas,
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  checkUsername,
  me,
};
