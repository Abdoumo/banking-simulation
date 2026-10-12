const express = require('express');
const { Client, KycDetail, Account, Transaction, Credit } = require('../models');
const { apiKeyMiddleware } = require('../middleware/auth');
const { generateKycEngineProfile } = require('../utils/kycEngine');

const router = express.Router();

// Apply API Key protection to all routes in this file
router.use(apiKeyMiddleware);

// ── GET /api/open/clients ────────────────────────────────────
router.get('/clients', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const clients = await Client.findAll({
      attributes: ['client_id', 'nom', 'prenom', 'type_client', 'date_creation', 'telephone', 'date_naissance'],
      include: [
        { association: 'kyc' },
        { association: 'accounts', attributes: ['account_id', 'numero_compte', 'type_compte', 'solde_actuel', 'devise', 'status'] }
      ],
      limit,
    });

    const enrichedClients = clients.map(c => {
      const plain = c.toJSON();
      const profile = generateKycEngineProfile(plain, plain.kyc || {}, plain.accounts || []);
      return {
        client_id: plain.client_id,
        customer_id: profile.summary.customerId,
        nom: plain.nom,
        prenom: plain.prenom,
        type_client: plain.type_client,
        telephone: plain.telephone,
        date_creation: plain.date_creation,
        // Complete 1/ KYC ENGINE variables
        kyc_engine: {
          status: profile.summary.status,
          kyc_status: profile.summary.kycStatus,
          risk_level: profile.summary.riskLevel,
          kyc_score: profile.summary.kycScore,
          change_score: profile.summary.changeScore,
          last_review: profile.summary.lastKycReview,
          next_review: profile.summary.nextReview,
          ews_status: profile.summary.ewsAlert,
          identity: profile.tabs.identity,
          business: profile.tabs.business,
          financial: profile.tabs.financial,
          ubo: profile.tabs.ubo,
          risk_engine: profile.tabs.riskEngine,
          behavior: profile.tabs.behavior,
          changes: profile.tabs.changes,
          history: profile.tabs.history,
        },
        // Enriched Account variables
        accounts: profile.accounts,
      };
    });

    res.json({ data: enrichedClients });
  } catch (err) {
    console.error('Open API clients error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/open/accounts ───────────────────────────────────
router.get('/accounts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const accounts = await Account.findAll({
      attributes: ['account_id', 'numero_compte', 'type_compte', 'devise', 'solde_actuel', 'status'],
      include: [
        {
          association: 'client',
          attributes: ['client_id', 'nom', 'prenom', 'type_client'],
          include: [{ association: 'kyc' }]
        }
      ],
      limit,
    });

    const enrichedAccounts = accounts.map(acc => {
      const plain = acc.toJSON();
      const clientPlain = plain.client || {};
      const profile = generateKycEngineProfile(clientPlain, clientPlain.kyc || {}, [plain]);
      const accProfile = profile.accounts?.[0] || {};
      return {
        account_id: plain.account_id,
        numero_compte: plain.numero_compte,
        type_compte: plain.type_compte,
        devise: plain.devise,
        solde_actuel: plain.solde_actuel,
        status: plain.status,
        inflow_monthly: accProfile.inflowMonthly,
        outflow_monthly: accProfile.outflowMonthly,
        tx_count_30d: accProfile.txCount30d,
        average_tx_amount: accProfile.averageTxAmount,
        account_risk_score: accProfile.accountRiskScore,
        alert_level: accProfile.alertLevel,
        client: {
          client_id: clientPlain.client_id,
          customer_id: profile.summary.customerId,
          nom: clientPlain.nom,
          prenom: clientPlain.prenom,
          type_client: clientPlain.type_client,
          kyc_status: profile.summary.kycStatus,
          risk_level: profile.summary.riskLevel,
          kyc_score: profile.summary.kycScore,
        }
      };
    });

    res.json({ data: enrichedAccounts });
  } catch (err) {
    console.error('Open API accounts error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/open/transactions ───────────────────────────────
router.get('/transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const transactions = await Transaction.findAll({
      attributes: ['transaction_id', 'montant', 'devise', 'type_operation', 'status', 'date'],
      include: [
        { association: 'emetteur', attributes: ['numero_compte'] },
        { association: 'beneficiaire', attributes: ['numero_compte'] }
      ],
      order: [['date', 'DESC']],
      limit,
    });
    res.json({ data: transactions });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
