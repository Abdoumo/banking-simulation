const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  transaction_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  compte_emetteur: {
    type: DataTypes.INTEGER,
    allowNull: true, // null for deposits from external
    references: { model: 'accounts', key: 'account_id' },
  },
  compte_beneficiaire: {
    type: DataTypes.INTEGER,
    allowNull: true, // null for withdrawals to external
    references: { model: 'accounts', key: 'account_id' },
  },
  montant: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  devise: {
    type: DataTypes.ENUM('DZD', 'EUR', 'USD'),
    defaultValue: 'DZD',
  },
  type_operation: {
    type: DataTypes.ENUM('Virement', 'Depot', 'Retrait', 'Paiement', 'Paiement TPE', 'Prelevement'),
    allowNull: false,
  },
  canal: {
    type: DataTypes.ENUM('Web', 'Mobile', 'ATM', 'Agence'),
    defaultValue: 'Web',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  device_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('Completed', 'Pending', 'Rejected'),
    defaultValue: 'Completed',
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'transactions',
  timestamps: false,
});

module.exports = Transaction;
