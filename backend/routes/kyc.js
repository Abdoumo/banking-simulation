const express = require('express');
const { KycDetail, Client, Account } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { generateKycEngineProfile, saveKycEngineOverride } = require('../utils/kycEngine');

const router = express.Router();

// ── GET /api/kyc ─────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    let kyc = await KycDetail.findOne({ where: { client_id: req.user.client_id } });
    if (!kyc) {
      kyc = await KycDetail.create({ client_id: req.user.client_id });
    }
    const client = await Client.findByPk(req.user.client_id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ association: 'accounts' }]
    });
    const engineProfile = generateKycEngineProfile(
      client ? client.toJSON() : { client_id: req.user.client_id },
      kyc.toJSON(),
      client ? client.accounts : []
    );
    res.json({ ...kyc.toJSON(), engineProfile });
  } catch (err) {
    console.error('KYC get error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/kyc/engine/:clientId ────────────────────────────
// Fetch 360° 9-tab KYC Engine profile for any client ID or C-001245
router.get('/engine/:clientId', authMiddleware, async (req, res) => {
  try {
    let rawId = req.params.clientId;
    if (String(rawId).toUpperCase().startsWith('C-')) {
      rawId = parseInt(rawId.replace(/[^0-9]/g, ''), 10);
    }
    const clientId = parseInt(rawId, 10) || 1245;

    let client = await Client.findByPk(clientId, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { association: 'kyc' },
        { association: 'accounts' },
      ],
    });

    let clientData;
    let kycData;
    let accountsData = [];

    if (client) {
      clientData = client.toJSON();
      kycData = clientData.kyc || {};
      accountsData = clientData.accounts || [];
    } else {
      // Fallback for demo sample client (e.g. C-001245)
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
        profession: clientId === 1245 ? 'Import / Export' : 'Cadre Banque',
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
        { account_id: 101, numero_compte: '100000124501', type_compte: 'Courant Commercial', devise: 'DZD', solde_actuel: 8450000, status: 'Active' },
        { account_id: 102, numero_compte: '200000124502', type_compte: 'Devise EUR', devise: 'EUR', solde_actuel: 45000, status: 'Active' },
      ];
    }

    const engineProfile = generateKycEngineProfile(clientData, kycData, accountsData);
    res.json(engineProfile);
  } catch (err) {
    console.error('KYC engine error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/kyc/engine/:clientId/ews ───────────────────────
// Action "Send to EWS" from PDF specs
router.post('/engine/:clientId/ews', authMiddleware, async (req, res) => {
  try {
    const clientId = req.params.clientId;
    res.json({
      success: true,
      message: `Alerte transmise au système EWS (Early Warning System) pour le client ${clientId}`,
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

// ── PUT /api/kyc/engine/:clientId ────────────────────────────
// CRUD: Update/Save full KYC engine profile
router.put('/engine/:clientId', authMiddleware, async (req, res) => {
  try {
    let rawId = req.params.clientId;
    if (String(rawId).toUpperCase().startsWith('C-')) {
      rawId = parseInt(rawId.replace(/[^0-9]/g, ''), 10);
    }
    const clientId = parseInt(rawId, 10) || 1245;
    const updateData = req.body;

    // 1. Save in override memory store
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
      message: 'Profil KYC mis à jour avec succès 🇩🇿',
      profile: refreshed,
    });
  } catch (err) {
    console.error('Error updating KYC engine:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil KYC' });
  }
});

// ── PUT /api/kyc ─────────────────────────────────────────────
router.put('/', authMiddleware, async (req, res) => {
  try {
    const {
      profession,
      revenu_mensuel,
      adresse_postale,
      doc_identite_type,
      doc_identite_numero,
      doc_identite_uploaded,
      justificatif_domicile_uploaded,
      justificatif_revenu_uploaded,
      declaration_ubo_uploaded,
    } = req.body;

    let kyc = await KycDetail.findOne({ where: { client_id: req.user.client_id } });
    if (!kyc) {
      kyc = await KycDetail.create({ client_id: req.user.client_id });
    }

    // Update fields
    if (profession !== undefined) kyc.profession = profession;
    if (revenu_mensuel !== undefined) kyc.revenu_mensuel = revenu_mensuel;
    if (adresse_postale !== undefined) kyc.adresse_postale = adresse_postale;
    if (doc_identite_type !== undefined) kyc.doc_identite_type = doc_identite_type;
    if (doc_identite_numero !== undefined) kyc.doc_identite_numero = doc_identite_numero;
    if (doc_identite_uploaded !== undefined) kyc.doc_identite_uploaded = doc_identite_uploaded;
    if (justificatif_domicile_uploaded !== undefined) kyc.justificatif_domicile_uploaded = justificatif_domicile_uploaded;
    if (justificatif_revenu_uploaded !== undefined) kyc.justificatif_revenu_uploaded = justificatif_revenu_uploaded;
    if (declaration_ubo_uploaded !== undefined) kyc.declaration_ubo_uploaded = declaration_ubo_uploaded;

    // Auto-determine KYC status based on required documents
    const allDocsUploaded = kyc.doc_identite_uploaded &&
      kyc.justificatif_domicile_uploaded &&
      kyc.justificatif_revenu_uploaded &&
      kyc.profession &&
      kyc.adresse_postale;

    if (allDocsUploaded && kyc.kyc_status === 'Pending') {
      kyc.kyc_status = 'Verified';
      kyc.date_verification = new Date();
    }

    kyc.date_soumission = new Date();
    await kyc.save();

    res.json({ message: 'KYC mis à jour avec succès', kyc });
  } catch (err) {
    console.error('KYC update error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
