const sequelize = require('../config/database');
const Client = require('./Client');
const KycDetail = require('./KycDetail');
const Account = require('./Account');
const Transaction = require('./Transaction');
const Credit = require('./Credit');

// ── Associations ──────────────────────────────────────────────

// Client ↔ KYC (1:1)
Client.hasOne(KycDetail, { foreignKey: 'client_id', as: 'kyc' });
KycDetail.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Client ↔ Accounts (1:N)
Client.hasMany(Account, { foreignKey: 'client_id', as: 'accounts' });
Account.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Client ↔ Credits (1:N)
Client.hasMany(Credit, { foreignKey: 'client_id', as: 'credits' });
Credit.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

// Account ↔ Credits (1:N)
Account.hasMany(Credit, { foreignKey: 'account_id', as: 'credits' });
Credit.belongsTo(Account, { foreignKey: 'account_id', as: 'account' });

// Account ↔ Transactions (as sender or receiver)
Account.hasMany(Transaction, { foreignKey: 'compte_emetteur', as: 'sent_transactions' });
Account.hasMany(Transaction, { foreignKey: 'compte_beneficiaire', as: 'received_transactions' });
Transaction.belongsTo(Account, { foreignKey: 'compte_emetteur', as: 'emetteur' });
Transaction.belongsTo(Account, { foreignKey: 'compte_beneficiaire', as: 'beneficiaire' });

module.exports = {
  sequelize,
  Client,
  KycDetail,
  Account,
  Transaction,
  Credit,
};
