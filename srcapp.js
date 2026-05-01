const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database(path.join(__dirname, 'data', 'institut.db'));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    price INTEGER,
    duration TEXT,
    icon TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    text TEXT,
    rating INTEGER,
    status TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT,
    course_id INTEGER,
    enrollment_date TEXT,
    status TEXT,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  )`);

  // Insert quelques données pour test si tables vides
  db.get("SELECT COUNT(*) as count FROM courses", (err, row) => {
    if(row.count === 0){
      const stmt = db.prepare("INSERT INTO courses (title, description, price, duration, icon) VALUES (?, ?, ?, ?, ?)");
      stmt.run("Tajwid & Tafsir", "Apprenez le Tajwid...", 99, "3 mois", "fas fa-book-open");
      stmt.run("Arabe Classique", "Cours complet d'arabe...", 79, "6 mois", "fas fa-language");
      stmt.run("Mémoire du Quran", "Mémoire complète...", 69, "2 ans", "fas fa-mosque");
      stmt.finalize();
    }
  });
});

// Routes Courses
app.get('/api/courses', (req, res) => {
  db.all("SELECT * FROM courses", (err, rows) => {
    if(err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// Ajouter un cours
app.post('/api/courses', (req, res) => {
  const {title, description, price, duration, icon} = req.body;
  const stmt = db.prepare("INSERT INTO courses (title, description, price, duration, icon) VALUES (?,?,?,?,?)");
  stmt.run(title, description, price, duration, icon, function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({id: this.lastID});
  });
});

// Modifier cours
app.put('/api/courses/:id', (req, res) => {
  const {id} = req.params;
  const {title, description, price, duration, icon} = req.body;
  const stmt = db.prepare("UPDATE courses SET title=?, description=?, price=?, duration=?, icon=? WHERE id=?");
  stmt.run(title, description, price, duration, icon, id, function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({changes: this.changes});
  });
});

// Supprimer un cours
app.delete('/api/courses/:id', (req, res) => {
  const {id} = req.params;
  db.run("DELETE FROM courses WHERE id=?", id, function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({changes: this.changes});
  });
});


// Routes Testimonials similaires
app.get('/api/testimonials', (req,res) => {
  db.all("SELECT * FROM testimonials WHERE status='published'", (err,rows) => {
    if(err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.post('/api/testimonials', (req,res) => {
  const {name, text, rating, status} = req.body;
  const stmt = db.prepare("INSERT INTO testimonials (name, text, rating, status) VALUES (?,?,?,?)");
  stmt.run(name,text,rating,status, function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({id: this.lastID});
  });
});

app.put('/api/testimonials/:id', (req,res) => {
  const {id} = req.params;
  const {name, text, rating, status} = req.body;
  const stmt = db.prepare("UPDATE testimonials SET name=?, text=?, rating=?, status=? WHERE id=?");
  stmt.run(name,text,rating,status,id, function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({changes: this.changes});
  });
});

app.delete('/api/testimonials/:id', (req,res) => {
  const {id} = req.params;
  db.run("DELETE FROM testimonials WHERE id=?", id, function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({changes: this.changes});
  });
});


// Routes Students (exemple liste simple)
app.get('/api/students', (req,res) => {
  db.all(`SELECT s.id, s.name, s.email, s.enrollment_date, s.status, c.title as course_title 
          FROM students s LEFT JOIN courses c ON s.course_id = c.id`, (err, rows) => {
    if(err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// Serveur démarré
app.listen(3001, () => {
  console.log("Serveur backend démarré sur http://localhost:3001");
});
