const express = require('express');
const { Credit, Account, Transaction, Client, sequelize } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/credits ─────────────────────────────────────────
// List all credits for the current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const credits = await Credit.findAll({
      where: { client_id: req.user.client_id },
      include: [{ association: 'account', attributes: ['account_id', 'numero_compte', 'type_compte', 'devise'] }],
      order: [['date_debut', 'DESC']],
    });
    res.json(credits);
  } catch (err) {
    console.error('Credits list error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/credits/:id ─────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const credit = await Credit.findOne({
      where: { credit_id: req.params.id, client_id: req.user.client_id },
      include: [{ association: 'account', attributes: ['account_id', 'numero_compte', 'type_compte', 'devise', 'solde_actuel'] }],
    });
    if (!credit) return res.status(404).json({ error: 'Crédit introuvable' });
    res.json(credit);
  } catch (err) {
    console.error('Credit detail error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/credits ────────────────────────────────────────
// Create a new credit/loan (bank grants a loan)
router.post('/', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      account_id,
      type_credit,
      montant_initial,
      taux_interet,
      duree_mois,
      date_debut,
    } = req.body;

    if (!account_id || !type_credit || !montant_initial || !taux_interet || !duree_mois) {
      await t.rollback();
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    // Verify the account belongs to the user
    const account = await Account.findOne({
      where: { account_id, client_id: req.user.client_id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!account) {
      await t.rollback();
      return res.status(404).json({ error: 'Compte introuvable' });
    }

    const amount = parseFloat(montant_initial);
    const rate = parseFloat(taux_interet) / 100 / 12; // Monthly rate
    const months = parseInt(duree_mois);

    // Calculate monthly payment (mensualité) using annuity formula
    const mensualite = rate > 0
      ? (amount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
      : amount / months;

    const startDate = date_debut ? new Date(date_debut) : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    const credit = await Credit.create({
      client_id: req.user.client_id,
      account_id,
      type_credit,
      montant_initial: amount,
      montant_restant: amount,
      taux_interet: parseFloat(taux_interet),
      mensualite: Math.round(mensualite * 100) / 100,
      duree_mois: months,
      nombre_impayes: 0,
      jours_retard: 0,
      status: 'Active',
      date_debut: startDate,
      date_fin_prevue: endDate,
    }, { transaction: t });

    // Disburse the loan amount into the linked account
    account.solde_actuel = parseFloat(account.solde_actuel) + amount;
    await account.save({ transaction: t });

    // Record the disbursement as a transaction in the ledger
    await Transaction.create({
      compte_emetteur: null,
      compte_beneficiaire: account.account_id,
      montant: amount,
      devise: account.devise,
      type_operation: 'Depot',
      canal: 'Agence',
      description: `Déblocage ${type_credit} #${credit.credit_id}`,
      device_ip: req.ip,
      status: 'Completed',
    }, { transaction: t });

    await t.commit();
    res.status(201).json({ message: 'Crédit accordé avec succès', credit });
  } catch (err) {
    await t.rollback();
    console.error('Credit create error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du crédit' });
  }
});

// ── PUT /api/credits/:id ─────────────────────────────────────
// Update credit details (admin/bank data control)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const credit = await Credit.findOne({
      where: { credit_id: req.params.id, client_id: req.user.client_id },
    });

    if (!credit) return res.status(404).json({ error: 'Crédit introuvable' });

    const {
      taux_interet,
      mensualite,
      nombre_impayes,
      jours_retard,
      status,
      montant_restant,
      date_fin_prevue,
    } = req.body;

    if (taux_interet !== undefined) credit.taux_interet = taux_interet;
    if (mensualite !== undefined) credit.mensualite = mensualite;
    if (nombre_impayes !== undefined) credit.nombre_impayes = nombre_impayes;
    if (jours_retard !== undefined) credit.jours_retard = jours_retard;
    if (status !== undefined) credit.status = status;
    if (montant_restant !== undefined) credit.montant_restant = montant_restant;
    if (date_fin_prevue !== undefined) credit.date_fin_prevue = date_fin_prevue;

    await credit.save();
    res.json({ message: 'Crédit mis à jour', credit });
  } catch (err) {
    console.error('Credit update error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/credits/:id ──────────────────────────────────
// Soft-close a credit (mark as Paid/Closed)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const credit = await Credit.findOne({
      where: { credit_id: req.params.id, client_id: req.user.client_id },
    });
    if (!credit) return res.status(404).json({ error: 'Crédit introuvable' });

    credit.status = 'Paid';
    credit.montant_restant = 0;
    await credit.save();

    res.json({ message: 'Crédit clôturé avec succès' });
  } catch (err) {
    console.error('Credit delete error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/credits/:id/payment ────────────────────────────
// Record a payment against a credit (client pays an installment)
router.post('/:id/payment', authMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { montant, from_account_id } = req.body;
    const amount = parseFloat(montant);

    if (!from_account_id || isNaN(amount) || amount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Compte source et montant valide requis' });
    }

    const credit = await Credit.findOne({
      where: { credit_id: req.params.id, client_id: req.user.client_id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!credit) {
      await t.rollback();
      return res.status(404).json({ error: 'Crédit introuvable' });
    }

    if (credit.status !== 'Active') {
      await t.rollback();
      return res.status(400).json({ error: 'Ce crédit n\'est plus actif' });
    }

    // Lock the source account
    const account = await Account.findOne({
      where: { account_id: from_account_id, client_id: req.user.client_id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!account) {
      await t.rollback();
      return res.status(404).json({ error: 'Compte source introuvable' });
    }

    if (parseFloat(account.solde_actuel) < amount) {
      await t.rollback();
      return res.status(400).json({ error: 'Solde insuffisant pour le paiement' });
    }

    // Debit the account
    account.solde_actuel = parseFloat(account.solde_actuel) - amount;
    await account.save({ transaction: t });

    // Reduce the outstanding loan balance
    const remaining = parseFloat(credit.montant_restant) - amount;
    credit.montant_restant = Math.max(0, remaining);

    // Auto-close if fully paid
    if (credit.montant_restant <= 0) {
      credit.montant_restant = 0;
      credit.status = 'Paid';
    }

    await credit.save({ transaction: t });

    // Record in the immutable ledger
    await Transaction.create({
      compte_emetteur: account.account_id,
      compte_beneficiaire: null,
      montant: amount,
      devise: account.devise,
      type_operation: 'Prelevement',
      canal: 'Web',
      description: `Paiement échéance ${credit.type_credit} #${credit.credit_id}`,
      device_ip: req.ip,
      status: 'Completed',
    }, { transaction: t });

    await t.commit();

    res.json({
      message: 'Paiement enregistré avec succès',
      credit: {
        credit_id: credit.credit_id,
        montant_restant: credit.montant_restant,
        status: credit.status,
      },
      nouveau_solde: account.solde_actuel,
    });
  } catch (err) {
    await t.rollback();
    console.error('Credit payment error:', err);
    res.status(500).json({ error: 'Erreur serveur lors du paiement' });
  }
});

// ── POST /api/credits/:id/missed-payment ─────────────────────
// Record a missed payment (bank marks an impayé)
router.post('/:id/missed-payment', authMiddleware, async (req, res) => {
  try {
    const { jours_retard_ajoutes } = req.body;

    const credit = await Credit.findOne({
      where: { credit_id: req.params.id, client_id: req.user.client_id },
    });

    if (!credit) return res.status(404).json({ error: 'Crédit introuvable' });

    credit.nombre_impayes += 1;
    credit.jours_retard += parseInt(jours_retard_ajoutes) || 30;

    if (credit.nombre_impayes >= 6) {
      credit.status = 'Defaulted';
    }

    await credit.save();

    res.json({
      message: 'Impayé enregistré',
      credit: {
        credit_id: credit.credit_id,
        nombre_impayes: credit.nombre_impayes,
        jours_retard: credit.jours_retard,
        status: credit.status,
      },
    });
  } catch (err) {
    console.error('Missed payment error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
