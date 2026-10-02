'use strict';

// Consumido pelo sequelize-cli (migrations e seeders) e pelo app.
const env = require('./env');

const base = {
  username: env.database.user,
  password: env.database.password,
  database: env.database.name,
  host: env.database.host,
  port: env.database.port,
  dialect: 'postgres',
  define: {
    underscored: true,
    freezeTableName: false,
  },
};

module.exports = {
  development: { ...base, logging: false },
  test: { ...base, database: process.env.DB_NAME_TEST || 'statspalpite_test', logging: false },
  production: {
    ...base,
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  },
};
