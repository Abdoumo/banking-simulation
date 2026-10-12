const express = require('express');
const { Op } = require('sequelize');
const { Client, KycDetail, Account, Transaction, Credit, sequelize } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { generateKycEngineProfile } = require('../utils/kycEngine');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authMiddleware);

// ── GET /api/admin/stats ─────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalClients, totalAccounts, totalTransactions, totalCredits] = await Promise.all([
      Client.count(),
      Account.count(),
      Transaction.count(),
      Credit.count(),
    ]);

    const [verifiedKyc, pendingKyc, rejectedKyc] = await Promise.all([
      KycDetail.count({ where: { kyc_status: 'Verified' } }),
      KycDetail.count({ where: { kyc_status: 'Pending' } }),
      KycDetail.count({ where: { kyc_status: 'Rejected' } }),
    ]);

    const [activeCredits, defaultedCredits] = await Promise.all([
      Credit.count({ where: { status: 'Active' } }),
      Credit.count({ where: { status: 'Defaulted' } }),
    ]);

    // Total balance across all accounts
    const totalBalance = await Account.sum('solde_actuel') || 0;

    // Total credit outstanding
    const totalCreditOutstanding = await Credit.sum('montant_restant', { where: { status: 'Active' } }) || 0;

    res.json({
      clients: { total: totalClients },
      kyc: { verified: verifiedKyc, pending: pendingKyc, rejected: rejectedKyc },
      accounts: { total: totalAccounts, totalBalance: parseFloat(totalBalance) },
      transactions: { total: totalTransactions },
      credits: {
        total: totalCredits,
        active: activeCredits,
        defaulted: defaultedCredits,
        totalOutstanding: parseFloat(totalCreditOutstanding),
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/admin/clients ───────────────────────────────────
// Paginated client list with search & filters
router.get('/clients', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const kycFilter = req.query.kyc_status || '';
    const typeFilter = req.query.type_client || '';

    const clientWhere = {};
    if (search) {
      clientWhere[Op.or] = [
        { nom: { [Op.iLike]: `%${search}%` } },
        { prenom: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (typeFilter) {
      clientWhere.type_client = typeFilter;
    }

    const kycWhere = {};
    if (kycFilter) {
      kycWhere.kyc_status = kycFilter;
    }

    const { count, rows } = await Client.findAndCountAll({
      where: clientWhere,
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          association: 'kyc',
          where: Object.keys(kycWhere).length > 0 ? kycWhere : undefined,
          required: Object.keys(kycWhere).length > 0,
        },
        { association: 'accounts', attributes: ['account_id', 'numero_compte', 'type_compte', 'devise', 'solde_actuel', 'status'] },
        { association: 'credits', attributes: ['credit_id', 'type_credit', 'montant_initial', 'montant_restant', 'nombre_impayes', 'status'] },
      ],
      order: [['client_id', 'ASC']],
      limit,
      offset,
      distinct: true,
    });

    const enrichedRows = rows.map(c => {
      const plain = c.toJSON();
      const profile = generateKycEngineProfile(plain, plain.kyc || {}, plain.accounts || []);
      return {
        ...plain,
        customer_id: profile.summary.customerId,
        kyc_score: profile.summary.kycScore,
        risk_level: profile.summary.riskLevel,
        change_score: profile.summary.changeScore,
        ews_alert: profile.summary.ewsAlert,
      };
    });

    res.json({
      clients: enrichedRows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    console.error('Admin clients error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/admin/clients/:id ───────────────────────────────
router.get('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { association: 'kyc' },
        { association: 'accounts' },
        { association: 'credits', include: [{ association: 'account', attributes: ['numero_compte'] }] },
      ],
    });
    if (!client) return res.status(404).json({ error: 'Client introuvable' });
    const plain = client.toJSON();
    const engineProfile = generateKycEngineProfile(plain, plain.kyc || {}, plain.accounts || []);
    res.json({ ...plain, engineProfile });
  } catch (err) {
    console.error('Admin client detail error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/admin/clients/:id/kyc ───────────────────────────
// Admin can approve/reject KYC
router.put('/clients/:id/kyc', async (req, res) => {
  try {
    const { kyc_status, rejection_reason } = req.body;
    const kyc = await KycDetail.findOne({ where: { client_id: req.params.id } });
    if (!kyc) return res.status(404).json({ error: 'KYC introuvable' });

    kyc.kyc_status = kyc_status;
    if (kyc_status === 'Rejected' && rejection_reason) {
      kyc.rejection_reason = rejection_reason;
    }
    if (kyc_status === 'Verified') {
      kyc.date_verification = new Date();
    }

    await kyc.save();
    res.json({ message: 'Statut KYC mis à jour', kyc });
  } catch (err) {
    console.error('Admin KYC update error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/admin/accounts/:id ──────────────────────────────
// Admin can suspend/activate accounts or adjust balances
router.put('/accounts/:id', async (req, res) => {
  try {
    const account = await Account.findByPk(req.params.id);
    if (!account) return res.status(404).json({ error: 'Compte introuvable' });

    const { status, solde_actuel } = req.body;
    if (status !== undefined) account.status = status;
    if (solde_actuel !== undefined) account.solde_actuel = solde_actuel;

    await account.save();
    res.json({ message: 'Compte mis à jour', account });
  } catch (err) {
    console.error('Admin account update error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── Full CRUD for credits (Admin) ────────────────────────────

// Admin: create credit for any client
router.post('/credits', async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      client_id, account_id, type_credit, montant_initial,
      taux_interet, duree_mois, date_debut, nombre_impayes,
      jours_retard, status,
    } = req.body;

    const amount = parseFloat(montant_initial);
    const rate = parseFloat(taux_interet) / 100 / 12;
    const months = parseInt(duree_mois);
    const mensualite = rate > 0
      ? (amount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1)
      : amount / months;

    const startDate = date_debut ? new Date(date_debut) : new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    const credit = await Credit.create({
      client_id, account_id, type_credit,
      montant_initial: amount,
      montant_restant: amount,
      taux_interet: parseFloat(taux_interet),
      mensualite: Math.round(mensualite * 100) / 100,
      duree_mois: months,
      nombre_impayes: nombre_impayes || 0,
      jours_retard: jours_retard || 0,
      status: status || 'Active',
      date_debut: startDate,
      date_fin_prevue: endDate,
    }, { transaction: t });

    // Disburse into account
    const account = await Account.findByPk(account_id, { lock: t.LOCK.UPDATE, transaction: t });
    if (account) {
      account.solde_actuel = parseFloat(account.solde_actuel) + amount;
      await account.save({ transaction: t });

      await Transaction.create({
        compte_emetteur: null,
        compte_beneficiaire: account.account_id,
        montant: amount,
        devise: account.devise,
        type_operation: 'Depot',
        canal: 'Agence',
        description: `[Admin] Déblocage ${type_credit} #${credit.credit_id}`,
        device_ip: req.ip,
        status: 'Completed',
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Crédit créé par admin', credit });
  } catch (err) {
    await t.rollback();
    console.error('Admin credit create error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: update any credit
router.put('/credits/:id', async (req, res) => {
  try {
    const credit = await Credit.findByPk(req.params.id);
    if (!credit) return res.status(404).json({ error: 'Crédit introuvable' });

    const fields = ['type_credit', 'montant_restant', 'taux_interet', 'mensualite',
      'duree_mois', 'nombre_impayes', 'jours_retard', 'status', 'date_fin_prevue'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) credit[f] = req.body[f];
    });

    await credit.save();
    res.json({ message: 'Crédit mis à jour par admin', credit });
  } catch (err) {
    console.error('Admin credit update error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Admin: delete (hard delete) a credit
router.delete('/credits/:id', async (req, res) => {
  try {
    const credit = await Credit.findByPk(req.params.id);
    if (!credit) return res.status(404).json({ error: 'Crédit introuvable' });
    await credit.destroy();
    res.json({ message: 'Crédit supprimé' });
  } catch (err) {
    console.error('Admin credit delete error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/admin/transactions ──────────────────────────────
// View all transactions across all accounts (paginated)
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Transaction.findAndCountAll({
      include: [
        { association: 'emetteur', attributes: ['account_id', 'numero_compte'], include: [{ association: 'client', attributes: ['nom', 'prenom'] }] },
        { association: 'beneficiaire', attributes: ['account_id', 'numero_compte'], include: [{ association: 'client', attributes: ['nom', 'prenom'] }] },
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
    console.error('Admin transactions error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/admin/clients ──────────────────────────────────
// CRUD: Create a new client with KYC and default account
router.post('/clients', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { nom, prenom, email, telephone, type_client, date_naissance, profession, revenu_mensuel, adresse_postale } = req.body;
    
    if (!nom || !prenom || !email) {
      return res.status(400).json({ error: 'Nom, prénom et email requis' });
    }

    const defaultPassword = await bcrypt.hash('password123', 10);
    const newClient = await Client.create({
      nom,
      prenom,
      email,
      password_hash: defaultPassword,
      type_client: type_client || 'Particulier',
      telephone: telephone || '0550123456',
      date_naissance: date_naissance || '1990-01-01',
    });

    const newKyc = await KycDetail.create({
      client_id: newClient.client_id,
      profession: profession || 'Commerçant',
      revenu_mensuel: revenu_mensuel || 80000,
      adresse_postale: adresse_postale || 'Alger Centre',
      kyc_status: 'Verified',
      doc_identite_type: 'Carte Nationale',
      doc_identite_numero: `109${newClient.client_id}88`,
      doc_identite_uploaded: true,
      justificatif_domicile_uploaded: true,
      justificatif_revenu_uploaded: true,
      declaration_ubo_uploaded: true,
    });

    // Create a primary account
    const newAccount = await Account.create({
      client_id: newClient.client_id,
      numero_compte: `100${String(newClient.client_id).padStart(9, '0')}`,
      type_compte: 'Courant Commercial',
      devise: 'DZD',
      solde_actuel: 250000,
      status: 'Active',
    });

    const fullProfile = generateKycEngineProfile(newClient.toJSON(), newKyc.toJSON(), [newAccount.toJSON()]);
    res.status(201).json({
      message: 'Client créé avec succès 🇩🇿',
      client: { ...newClient.toJSON(), kyc: newKyc, accounts: [newAccount] },
      engineProfile: fullProfile,
    });
  } catch (err) {
    console.error('Error creating client:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de la création du client' });
  }
});

// ── DELETE /api/admin/clients/:id ────────────────────────────
// CRUD: Delete a client
router.delete('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client introuvable' });

    await KycDetail.destroy({ where: { client_id: client.client_id } });
    await Account.destroy({ where: { client_id: client.client_id } });
    await client.destroy();

    res.json({ success: true, message: `Client #${req.params.id} supprimé avec succès 🇩🇿` });
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du client' });
  }
});

module.exports = router;
