const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KycDetail = sequelize.define('KycDetail', {
  kyc_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  client_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'clients', key: 'client_id' },
  },
  kyc_status: {
    type: DataTypes.ENUM('Pending', 'Verified', 'Rejected'),
    defaultValue: 'Pending',
  },
  profession: {
    type: DataTypes.STRING(150),
    allowNull: true,
  },
  revenu_mensuel: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
  },
  adresse_postale: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Document tracking
  doc_identite_type: {
    type: DataTypes.ENUM('Passeport', 'Carte Nationale', 'Permis de Conduire'),
    allowNull: true,
  },
  doc_identite_uploaded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  doc_identite_numero: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  justificatif_domicile_uploaded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  justificatif_revenu_uploaded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  declaration_ubo_uploaded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  engine_data: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  date_verification: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  date_soumission: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'kyc_details',
  timestamps: false,
});

module.exports = KycDetail;
