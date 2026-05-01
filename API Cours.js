const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// GET tous les cours (public)
router.get('/', (req, res) => {
    db.all('SELECT * FROM courses ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// GET cours par ID (public)
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM courses WHERE id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Cours non trouvé' });
        res.json(row);
    });
});

// CRUD Admin seulement
router.use(authenticateToken);

// POST nouveau cours
router.post('/', (req, res) => {
    const { title, description, price, duration, icon } = req.body;
    db.run(
        'INSERT INTO courses (title, description, price, duration, icon) VALUES (?, ?, ?, ?, ?)',
        [title, description, price, duration, icon],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                success: true, 
                id: this.lastID,
                message: 'Cours créé avec succès'
            });
        }
    );
});

// PUT modifier cours
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, price, duration, icon } = req.body;
    
    db.run(
        'UPDATE courses SET title=?, description=?, price=?, duration=?, icon=?, updated_at=CURRENT_TIMESTAMP WHERE id=?',
        [title, description, price, duration, icon, id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Cours non trouvé' });
            res.json({ success: true, message: 'Cours mis à jour' });
        }
    );
});

// DELETE cours
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM courses WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Cours non trouvé' });
        res.json({ success: true, message: 'Cours supprimé' });
    });
});

module.exports = router;