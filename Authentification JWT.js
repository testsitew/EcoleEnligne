const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'votre-secret-super-securise-2024';

// Login Admin
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérifier les identifiants par défaut
        if (email === 'admin@institutquran.fr' && password === 'admin123') {
            const token = jwt.sign(
                { email, role: 'admin' },
                SECRET_KEY,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                user: { email, role: 'admin' }
            });
        } else {
            res.status(401).json({ error: 'Identifiants incorrects' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requis' });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ error: 'Token invalide' });
        req.user = user;
        next();
    });
};

module.exports = { router, authenticateToken };