const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// GET témoignages publics (published only)
router.get('/', (req, res) => {
    db.all(
        'SELECT * FROM testimonials WHERE status = "published" ORDER BY created_at DESC LIMIT 6',
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// Admin routes
router.use(authenticateToken);

router.post('/', (req, res) => {
    const { name, text, rating, status } = req.body;
    db.run(
        'INSERT INTO testimonials (name, text, rating, status) VALUES (?, ?, ?, ?)',
        [name, text, rating, status || 'published'],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, text, rating, status } = req.body;
    db.run(
        'UPDATE testimonials SET name=?, text=?, rating=?, status=? WHERE id=?',
        [name, text, rating, status, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        }
    );
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM testimonials WHERE id=?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

module.exports = router;