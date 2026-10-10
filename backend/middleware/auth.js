const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'riskvision_jwt_secret_2024_secure';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token expiré ou invalide' });
  }
}

function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
}

function apiKeyMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const VALID_API_KEY = process.env.API_KEY || 'riskvision_external_share_key_999';
  
  if (!apiKey || apiKey !== VALID_API_KEY) {
    return res.status(401).json({ error: 'Clé API (x-api-key) manquante ou invalide' });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware, apiKeyMiddleware, JWT_SECRET };
