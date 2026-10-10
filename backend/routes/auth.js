const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client, KycDetail } = require('../models');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/auth/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, password, type_client, telephone } = req.body;

    if (!nom || !prenom || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
    }

    const existing = await Client.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Un compte avec cet email existe déjà' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const client = await Client.create({
      nom,
      prenom,
      email,
      password_hash,
      type_client: type_client || 'Particulier',
      telephone: telephone || null,
    });

    // Auto-create a pending KYC record
    await KycDetail.create({ client_id: client.client_id });

    const token = jwt.sign(
      { client_id: client.client_id, email: client.email, is_admin: client.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: {
        client_id: client.client_id,
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        type_client: client.type_client,
        is_admin: client.is_admin,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const client = await Client.findOne({ where: { email } });
    if (!client) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const valid = await bcrypt.compare(password, client.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { client_id: client.client_id, email: client.email, is_admin: client.is_admin },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        client_id: client.client_id,
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        type_client: client.type_client,
        is_admin: client.is_admin,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const client = await Client.findByPk(req.user.client_id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ association: 'kyc' }],
    });
    if (!client) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(client);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
