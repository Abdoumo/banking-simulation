const express = require('express');
const { Op } = require('sequelize');
const { Transaction, Account, sequelize } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/transactions ────────────────────────────────────
// Returns paginated transaction history for the current user's accounts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    // Get all of user's account IDs
    const accounts = await Account.findAll({
      where: { client_id: req.user.client_id },
      attributes: ['account_id'],
    });
    const accountIds = accounts.map(a => a.account_id);

    if (accountIds.length === 0) {
      return res.json({ transactions: [], total: 0, page, totalPages: 0 });
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: {
        [Op.or]: [
          { compte_emetteur: { [Op.in]: accountIds } },
          { compte_beneficiaire: { [Op.in]: accountIds } },
        ],
      },
      include: [
        { association: 'emetteur', attributes: ['account_id', 'numero_compte', 'type_compte'] },
        { association: 'beneficiaire', attributes: ['account_id', 'numero_compte', 'type_compte'] },
      ],
      order: [['date', 'DESC']],
      limit,
      offset,
    });

    res.json({
      transactions: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Transactions list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/transfers ──────────────────────────────────────
// Atomic transfer between accounts
router.post('/transfer', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { from_account_id, to_account_number, montant, description, type_operation } = req.body;

    if (!from_account_id || !to_account_number || !montant) {
      await t.rollback();
      return res.status(400).json({ error: 'Compte émetteur, compte bénéficiaire et montant requis' });
    }

    const amount = parseFloat(montant);
    if (isNaN(amount) || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Montant invalide' });
    }

    // Lock sender account
    const senderAccount = await Account.findOne({
      where: { account_id: from_account_id, client_id: req.user.client_id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!senderAccount) {
      await t.rollback();
      return res.status(404).json({ error: 'Compte émetteur introuvable' });
    }

    if (senderAccount.status !== 'Active') {
      await t.rollback();
      return res.status(400).json({ error: 'Le compte émetteur est suspendu ou fermé' });
    }

    if (parseFloat(senderAccount.solde_actuel) < amount) {
      await t.rollback();
      return res.status(400).json({ error: 'Solde insuffisant' });
    }

    // Find receiver account
    const receiverAccount = await Account.findOne({
      where: { numero_compte: to_account_number },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!receiverAccount) {
      await t.rollback();
      return res.status(404).json({ error: 'Compte bénéficiaire introuvable' });
    }

    if (receiverAccount.status !== 'Active') {
      await t.rollback();
      return res.status(400).json({ error: 'Le compte bénéficiaire est suspendu ou fermé' });
    }

    // Atomic balance update
    senderAccount.solde_actuel = parseFloat(senderAccount.solde_actuel) - amount;
    receiverAccount.solde_actuel = parseFloat(receiverAccount.solde_actuel) + amount;

    await senderAccount.save({ transaction: t });
    await receiverAccount.save({ transaction: t });

    // Create immutable ledger entry
    const transaction = await Transaction.create({
      compte_emetteur: senderAccount.account_id,
      compte_beneficiaire: receiverAccount.account_id,
      montant: amount,
      devise: senderAccount.devise,
      type_operation: type_operation || 'Virement',
      canal: 'Web',
      description: description || `Virement vers ${to_account_number}`,
      device_ip: req.ip,
      status: 'Completed',
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      message: 'Virement effectué avec succès',
      transaction,
      nouveau_solde: senderAccount.solde_actuel,
    });
  } catch (err) {
    await t.rollback();
    console.error('Transfer error:', err);
    res.status(500).json({ error: 'Erreur serveur lors du virement' });
  }
});

// ── POST /api/transactions/deposit ───────────────────────────
router.post('/deposit', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { account_id, montant, description } = req.body;
    const amount = parseFloat(montant);

    if (!account_id || isNaN(amount) || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Compte et montant valide requis' });
    }

    const account = await Account.findOne({
      where: { account_id, client_id: req.user.client_id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!account) {
      await t.rollback();
      return res.status(404).json({ error: 'Compte introuvable' });
    }

    account.solde_actuel = parseFloat(account.solde_actuel) + amount;
    await account.save({ transaction: t });

    await Transaction.create({
      compte_emetteur: null,
      compte_beneficiaire: account.account_id,
      montant: amount,
      devise: account.devise,
      type_operation: 'Depot',
      canal: 'Web',
      description: description || 'Dépôt',
      device_ip: req.ip,
      status: 'Completed',
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ message: 'Dépôt effectué', nouveau_solde: account.solde_actuel });
  } catch (err) {
    await t.rollback();
    console.error('Deposit error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
