const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('riskvision', 'postgres', 'lightking', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 10000,
  },
});

module.exports = sequelize;
