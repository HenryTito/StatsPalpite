'use strict';

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

const env = require('../config/env');
const config =
  require('../config/sequelize')[env.nodeEnv] || require('../config/sequelize').development;

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = { sequelize, Sequelize };

fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

Object.values(db)
  .filter((model) => typeof model.associate === 'function')
  .forEach((model) => model.associate(db));

module.exports = db;
