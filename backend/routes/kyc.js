const express = require('express');
const { KycDetail } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/kyc ─────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    let kyc = await KycDetail.findOne({ where: { client_id: req.user.client_id } });
    if (!kyc) {
      kyc = await KycDetail.create({ client_id: req.user.client_id });
    }
    res.json(kyc);
  } catch (err) {
    console.error('KYC get error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
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
