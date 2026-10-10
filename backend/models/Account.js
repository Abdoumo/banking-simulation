const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Account = sequelize.define('Account', {
  account_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'clients', key: 'client_id' },
  },
  numero_compte: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  type_compte: {
    type: DataTypes.ENUM('Courant', 'Epargne'),
    allowNull: false,
    defaultValue: 'Courant',
  },
  devise: {
    type: DataTypes.ENUM('DZD', 'EUR', 'USD'),
    defaultValue: 'DZD',
  },
  solde_actuel: {
    type: DataTypes.DECIMAL(18, 2),
    defaultValue: 0.00,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Suspended', 'Closed'),
    defaultValue: 'Active',
  },
  date_ouverture: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'accounts',
  timestamps: false,
});

module.exports = Account;
