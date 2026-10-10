const express = require('express');
const { Account } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/accounts ────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const accounts = await Account.findAll({
      where: { client_id: req.user.client_id },
      order: [['date_ouverture', 'DESC']],
    });
    res.json(accounts);
  } catch (err) {
    console.error('Accounts list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/accounts/:id ────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const account = await Account.findOne({
      where: { account_id: req.params.id, client_id: req.user.client_id },
    });
    if (!account) return res.status(404).json({ error: 'Compte introuvable' });
    res.json(account);
  } catch (err) {
    console.error('Account detail error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/accounts ───────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { type_compte, devise } = req.body;

    // Generate a unique account number
    const prefix = devise === 'EUR' ? '200' : devise === 'USD' ? '300' : '100';
    const suffix = String(Date.now()).slice(-10);
    const numero_compte = `${prefix}${suffix}`;

    const account = await Account.create({
      client_id: req.user.client_id,
      numero_compte,
      type_compte: type_compte || 'Courant',
      devise: devise || 'DZD',
      solde_actuel: 0.00,
      status: 'Active',
    });

    res.status(201).json({ message: 'Compte créé avec succès', account });
  } catch (err) {
    console.error('Account create error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du compte' });
  }
});

module.exports = router;
