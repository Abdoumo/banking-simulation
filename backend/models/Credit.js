const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Credit = sequelize.define('Credit', {
  credit_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'clients', key: 'client_id' },
  },
  account_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'accounts', key: 'account_id' },
  },
  type_credit: {
    type: DataTypes.ENUM('Credit Immobilier', 'Credit Consommation', 'Credit Auto', 'Credit Professionnel'),
    allowNull: false,
  },
  montant_initial: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  montant_restant: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  taux_interet: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  },
  mensualite: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
  },
  duree_mois: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nombre_impayes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  jours_retard: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('Active', 'Paid', 'Defaulted', 'Restructured'),
    defaultValue: 'Active',
  },
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  date_fin_prevue: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
}, {
  tableName: 'credits',
  timestamps: false,
});

module.exports = Credit;
