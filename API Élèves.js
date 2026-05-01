const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
    db.all(`
        SELECT s.*, c.title as course_name 
        FROM students s 
        LEFT JOIN courses c ON s.course_id = c.id 
        ORDER BY s.enrollment_date DESC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

router.post('/', (req, res) => {
    const { name, email, course_id } = req.body;
    db.run(
        'INSERT INTO students (name, email, course_id) VALUES (?, ?, ?)',
        [name, email, course_id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

module.exports = router;