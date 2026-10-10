const express = require('express');
const { Client, KycDetail, Account, Transaction, Credit } = require('../models');
const { apiKeyMiddleware } = require('../middleware/auth');

const router = express.Router();

// Apply API Key protection to all routes in this file
router.use(apiKeyMiddleware);

// ── GET /api/open/clients ────────────────────────────────────
router.get('/clients', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const clients = await Client.findAll({
      attributes: ['client_id', 'nom', 'prenom', 'type_client', 'date_creation'],
      include: [
        { association: 'kyc', attributes: ['kyc_status'] },
        { association: 'accounts', attributes: ['account_id', 'numero_compte', 'solde_actuel', 'devise', 'status'] }
      ],
      limit,
    });
    res.json({ data: clients });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/open/accounts ───────────────────────────────────
router.get('/accounts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const accounts = await Account.findAll({
      attributes: ['account_id', 'numero_compte', 'type_compte', 'devise', 'solde_actuel', 'status'],
      include: [{ association: 'client', attributes: ['client_id', 'nom', 'prenom'] }],
      limit,
    });
    res.json({ data: accounts });
  } catch (err) {
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
