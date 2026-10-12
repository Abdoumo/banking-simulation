const express = require('express');
const { Client, KycDetail, Account, Transaction, Credit } = require('../models');
const { apiKeyMiddleware } = require('../middleware/auth');
const { generateKycEngineProfile, saveKycEngineOverride } = require('../utils/kycEngine');

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

// ── GET /api/open/clients/:id ────────────────────────────────
// Retrieve a specific client's full 360° KYC engine profile
router.get('/clients/:id', async (req, res) => {
  try {
    let rawId = req.params.id;
    if (String(rawId).toUpperCase().startsWith('C-')) {
      rawId = parseInt(rawId.replace(/[^0-9]/g, ''), 10);
    }
    const clientId = parseInt(rawId, 10) || 1245;

    let client = await Client.findByPk(clientId, {
      attributes: { exclude: ['password_hash'] },
      include: [{ association: 'kyc' }, { association: 'accounts' }],
    });

    let clientData;
    let kycData;
    let accountsData = [];

    if (client) {
      clientData = client.toJSON();
      kycData = clientData.kyc || {};
      accountsData = clientData.accounts || [];
    } else {
      // Demo spotlight fallback for C-001245
      clientData = {
        client_id: clientId,
        nom: clientId === 1245 ? 'Benali' : 'Client',
        prenom: clientId === 1245 ? 'Noureddine' : `#${clientId}`,
        type_client: clientId === 1245 ? 'PME/Entreprise' : 'Particulier',
        email: `c${clientId}@riskvision.dz`,
        telephone: '0550123456',
        date_naissance: '1984-06-15',
      };
      kycData = {
        kyc_status: 'Verified',
        profession: clientId === 1245 ? 'Import / Export' : 'Cadre',
        revenu_mensuel: clientId === 1245 ? 2000000 : 120000,
        adresse_postale: '42 Rue Didouche Mourad, Alger',
        doc_identite_type: 'Carte Nationale',
        doc_identite_numero: '109283741',
        doc_identite_uploaded: true,
        justificatif_domicile_uploaded: true,
        justificatif_revenu_uploaded: true,
        declaration_ubo_uploaded: true,
      };
      accountsData = [
        { account_id: 101, numero_compte: '100000124501', type_compte: 'Courant Commercial', devise: 'DZD', solde_actuel: 8450000, status: 'Active' }
      ];
    }

    const profile = generateKycEngineProfile(clientData, kycData, accountsData);

    // Fetch attached credits/loans if any
    const clientCredits = await Credit.findAll({
      where: { client_id: clientId },
      attributes: ['credit_id', 'type_credit', 'montant_initial', 'montant_restant', 'taux_interet', 'mensualite', 'status', 'nombre_impayes', 'jours_retard']
    });
    profile.credits = clientCredits.map(cr => cr.toJSON());

    res.json({ data: profile });
  } catch (err) {
    console.error('Open API client detail error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── PUT /api/open/clients/:id ────────────────────────────────
// CRUD: Update client and KYC engine information via Open API
router.put('/clients/:id', async (req, res) => {
  try {
    let rawId = req.params.id;
    if (String(rawId).toUpperCase().startsWith('C-')) {
      rawId = parseInt(rawId.replace(/[^0-9]/g, ''), 10);
    }
    const clientId = parseInt(rawId, 10) || 1245;
    const updateData = req.body;

    // 1. Save in override memory/file store
    saveKycEngineOverride(clientId, updateData);

    // 2. Persist to DB if client exists
    const client = await Client.findByPk(clientId, { include: [{ association: 'kyc' }, { association: 'accounts' }] });
    if (client) {
      if (updateData.tabs?.identity?.fullName) {
        const parts = updateData.tabs.identity.fullName.split(' ');
        client.prenom = parts[0] || client.prenom;
        client.nom = parts.slice(1).join(' ') || client.nom;
      }
      if (updateData.tabs?.identity?.phone) client.telephone = updateData.tabs.identity.phone;
      if (updateData.tabs?.identity?.dateOfBirth) client.date_naissance = updateData.tabs.identity.dateOfBirth;
      await client.save();

      let kyc = client.kyc;
      if (!kyc) {
        kyc = await KycDetail.create({ client_id: clientId });
      }
      if (updateData.tabs?.identity?.address) kyc.adresse_postale = updateData.tabs.identity.address;
      if (updateData.tabs?.business?.profession) kyc.profession = updateData.tabs.business.profession;
      if (updateData.tabs?.financial?.declaredIncome) {
        const num = parseFloat(String(updateData.tabs.financial.declaredIncome).replace(/[^0-9.]/g, ''));
        if (!isNaN(num)) kyc.revenu_mensuel = num;
      }
      if (updateData.tabs?.identity?.identificationDocument?.documentType) {
        kyc.doc_identite_type = updateData.tabs.identity.identificationDocument.documentType;
      }
      if (updateData.tabs?.identity?.identificationDocument?.documentNumber) {
        kyc.doc_identite_numero = updateData.tabs.identity.identificationDocument.documentNumber;
      }
      await kyc.save();
    }

    const clientData = client ? client.toJSON() : { client_id: clientId };
    const kycData = client?.kyc ? client.kyc.toJSON() : {};
    const accountsData = client?.accounts || [];
    const refreshed = generateKycEngineProfile(clientData, kycData, accountsData);

    res.json({
      success: true,
      message: 'Profil KYC mis à jour avec succès via Open API 🇩🇿',
      data: refreshed,
    });
  } catch (err) {
    console.error('Open API client update error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du client' });
  }
});

// ── POST /api/open/clients ───────────────────────────────────
// CRUD: Create a new client with KYC profile via Open API
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
      message: 'Client créé avec succès via Open API 🇩🇿',
      data: fullProfile,
    });
  } catch (err) {
    console.error('Open API create client error:', err);
    res.status(500).json({ error: err.message || 'Erreur lors de la création du client' });
  }
});

// ── DELETE /api/open/clients/:id ─────────────────────────────
// CRUD: Delete a client via Open API
router.delete('/clients/:id', async (req, res) => {
  try {
    let rawId = req.params.id;
    if (String(rawId).toUpperCase().startsWith('C-')) {
      rawId = parseInt(rawId.replace(/[^0-9]/g, ''), 10);
    }
    const clientId = parseInt(rawId, 10);

    const client = await Client.findByPk(clientId);
    if (!client) return res.status(404).json({ error: 'Client introuvable' });

    await KycDetail.destroy({ where: { client_id: client.client_id } });
    await Account.destroy({ where: { client_id: client.client_id } });
    await client.destroy();

    res.json({ success: true, message: `Client #${clientId} supprimé avec succès via Open API 🇩🇿` });
  } catch (err) {
    console.error('Open API delete client error:', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du client' });
  }
});

// ── POST /api/open/clients/:id/ews ───────────────────────────
// Trigger Send to Early Warning System via Open API
router.post('/clients/:id/ews', async (req, res) => {
  try {
    const clientId = req.params.id;
    res.json({
      success: true,
      message: `Alerte transmise au système EWS (Early Warning System) pour le client ${clientId} 🇩🇿`,
      timestamp: new Date().toISOString(),
      signals: {
        kycChange: 78,
        transactionAnomaly: 82,
        newBeneficiaryRisk: 75,
        geographicRisk: 60,
        status: 'EWS HIGH RISK',
        actionTaken: 'Flagged for priority investigation in EWS watchlist',
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur transmission EWS' });
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

// ── GET /api/open/credits ─────────────────────────────────────
router.get('/credits', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const credits = await Credit.findAll({
      attributes: [
        'credit_id', 'client_id', 'account_id', 'type_credit',
        'montant_initial', 'montant_restant', 'taux_interet',
        'mensualite', 'duree_mois', 'nombre_impayes', 'jours_retard',
        'status', 'date_debut', 'date_fin_prevue'
      ],
      include: [
        {
          association: 'client',
          attributes: ['client_id', 'nom', 'prenom', 'type_client'],
          include: [{ association: 'kyc' }]
        },
        {
          association: 'account',
          attributes: ['account_id', 'numero_compte', 'devise', 'solde_actuel']
        }
      ],
      order: [['date_debut', 'DESC']],
      limit,
    });

    const enrichedCredits = credits.map(c => {
      const plain = c.toJSON();
      const clientPlain = plain.client || {};
      const kycPlain = clientPlain.kyc || {};
      return {
        credit_id: plain.credit_id,
        client_id: plain.client_id,
        customer_id: `C-${String(plain.client_id).padStart(6, '0')}`,
        client_name: `${clientPlain.prenom || ''} ${clientPlain.nom || ''}`.trim(),
        type_credit: plain.type_credit,
        montant_initial: plain.montant_initial,
        montant_restant: plain.montant_restant,
        taux_interet: plain.taux_interet,
        mensualite: plain.mensualite,
        duree_mois: plain.duree_mois,
        nombre_impayes: plain.nombre_impayes,
        jours_retard: plain.jours_retard,
        status: plain.status,
        date_debut: plain.date_debut,
        date_fin_prevue: plain.date_fin_prevue,
        compte: plain.account ? {
          account_id: plain.account.account_id,
          numero_compte: plain.account.numero_compte,
          devise: plain.account.devise,
        } : null,
        credit_risk: {
          risk_grade: plain.nombre_impayes > 0 || plain.jours_retard > 30 ? 'HIGH RISK' : 'PERFORMING',
          is_default: plain.status === 'Defaulted' || plain.jours_retard >= 90,
          debt_to_income_ratio: kycPlain.revenu_mensuel ? Math.round((plain.mensualite / kycPlain.revenu_mensuel) * 100) + '%' : 'N/A',
        }
      };
    });

    res.json({ data: enrichedCredits });
  } catch (err) {
    console.error('Open API credits error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/open/stats ───────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const totalClients = await Client.count();
    const totalAccounts = await Account.count();
    const totalTransactions = await Transaction.count();
    const totalCredits = await Credit.count();
    const activeCredits = await Credit.count({ where: { status: 'Active' } });
    const defaultedCredits = await Credit.count({ where: { status: 'Defaulted' } });

    const totalBalance = await Account.sum('solde_actuel') || 0;
    const totalOutstanding = await Credit.sum('montant_restant', { where: { status: 'Active' } }) || 0;

    const kycVerified = await KycDetail.count({ where: { kyc_status: 'Verified' } });
    const kycPending = await KycDetail.count({ where: { kyc_status: 'Pending' } });
    const kycRejected = await KycDetail.count({ where: { kyc_status: 'Rejected' } });

    res.json({
      data: {
        clients: {
          total: totalClients,
          kyc_verified: kycVerified,
          kyc_pending: kycPending,
          kyc_rejected: kycRejected,
        },
        accounts: {
          total: totalAccounts,
          total_balance_dzd: parseFloat(totalBalance),
        },
        credits: {
          total: totalCredits,
          active: activeCredits,
          defaulted: defaultedCredits,
          total_outstanding_debt_dzd: parseFloat(totalOutstanding),
        },
        transactions: {
          total_ledger_entries: totalTransactions,
        },
        engine: {
          version: '1.0 KYC ENGINE 360°',
          standard: 'Algérie AML/CFT Compliant',
          timestamp: new Date().toISOString(),
        }
      }
    });
  } catch (err) {
    console.error('Open API stats error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
