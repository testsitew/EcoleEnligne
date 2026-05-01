const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const SECRET = 'votre_secret_super_secure';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Config multer pour upload images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads/')),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// SQLite DB
const db = new sqlite3.Database(':memory:'); // ou fichier .db

db.serialize(() => {
  // Tables majeures
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT, -- admin/teacher/student
    name TEXT
  )`);

  db.run(`CREATE TABLE courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    price INTEGER,
    duration TEXT,
    icon TEXT,
    image TEXT
  )`);

  db.run(`CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    course_id INTEGER,
    FOREIGN KEY(course_id) REFERENCES courses(id)
  )`);

  db.run(`CREATE TABLE teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE
  )`);

  db.run(`CREATE TABLE testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    text TEXT,
    rating INTEGER,
    status TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  )`);

  // Insérer Admin demo
  const hashed = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT INTO users (email,password,role,name) VALUES (?, ?, 'admin', ?)`, ['admin@institutquran.fr', hashed, 'Administrateur']);
});

// Middleware Auth JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(!token) return res.sendStatus(401);
  jwt.verify(token, SECRET, (err, user) => {
    if(err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Routes exemples

// Login
app.post('/api/auth/login', (req, res) => {
  const {email, password} = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if(err || !user) return res.status(401).json({error:'Utilisateur non trouvé'});
    if(!bcrypt.compareSync(password, user.password)) return res.status(401).json({error:'Mot de passe incorrect'});
    
    const token = jwt.sign({id: user.id, email: user.email, role: user.role}, SECRET, {expiresIn:'24h'});
    res.json({token, user:{id:user.id, email:user.email, role:user.role, name:user.name}});
  });
});

// Ajouter un cours (admin seulement)
app.post('/api/courses', authenticateToken, upload.single('image'), (req,res) => {
  if(req.user.role !== 'admin') return res.sendStatus(403);
  const {title, description, price, duration, icon} = req.body;
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  db.run(`INSERT INTO courses (title,description,price,duration,icon,image) VALUES (?, ?, ?, ?, ?, ?)`,
    [title, description, price, duration, icon, imagePath], function(err){
        if(err) return res.status(500).json({error: err.message});
        res.json({id:this.lastID});
  });
});

// Autres routes CRUD sur Users, Students, Teachers, Testimonials, Chat, etc...

// Chat WebSocket serveur (exemple ultra simple)
const wss = new WebSocket.Server({port: 8080});
wss.on('connection', ws => {
  ws.on('message', message => {
    // Ici vous pouvez gérer broadcast / ciblage
    wss.clients.forEach(client => {
      if(client.readyState === WebSocket.OPEN) client.send(message);
    });
  });
});

app.listen(3001, () => {
  console.log("API démarrée sur http://localhost:3001");
  console.log("WebSocket chat sur ws://localhost:8080");
});
