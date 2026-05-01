const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/institut.db');
const db = new sqlite3.Database(dbPath);

// Initialisation des tables
db.serialize(() => {
    // Table Admin (optionnel)
    db.run(`CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Table Cours
    db.run(`CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        price INTEGER NOT NULL,
        duration TEXT,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Table Témoignages
    db.run(`CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        text TEXT NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        status TEXT DEFAULT 'published',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Table Élèves
    db.run(`CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        course_id INTEGER,
        enrollment_date DATE DEFAULT CURRENT_DATE,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (course_id) REFERENCES courses (id)
    )`);

    // Données de test
    db.get("SELECT COUNT(*) as count FROM courses", (err, row) => {
        if (row.count === 0) {
            const stmt = db.prepare(`
                INSERT INTO courses (title, description, price, duration, icon) 
                VALUES (?, ?, ?, ?, ?)
            `);
            
            stmt.run('Tajwid & Tafsir', 'Maîtrisez la récitation correcte du Quran...', 99, '3 mois', 'fas fa-book-open');
            stmt.run('Arabe Classique', 'De la lecture à la conversation fluide...', 79, '6 mois', 'fas fa-language');
            stmt.run('Mémoire du Quran', 'Hifz complet du Quran...', 69, '2 ans', 'fas fa-mosque');
            stmt.finalize();
        }
    });
});

module.exports = db;