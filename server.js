import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Paths to data files
const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const artFile = path.join(dataDir, 'art.json');

// Ensure data directory and files exist
const initializeFiles = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }

  // Initialize users file
  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
  }

  // Initialize art file with seed data
  if (!fs.existsSync(artFile)) {
    const seedArt = [
      { id: 1, title: "Cyber Punk City", artist: "Demo Artist", price: 2400, category: "Digital", img: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800" },
      { id: 2, title: "Abstract Blue", artist: "Demo Artist", price: 1200, category: "Painting", img: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800" }
    ];
    fs.writeFileSync(artFile, JSON.stringify(seedArt, null, 2));
  }
};

initializeFiles();

// Helper functions
const readUsers = () => {
  try {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  } catch (error) {
    return [];
  }
};

const writeUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

const readArt = () => {
  try {
    return JSON.parse(fs.readFileSync(artFile, 'utf8'));
  } catch (error) {
    return [];
  }
};

const writeArt = (art) => {
  fs.writeFileSync(artFile, JSON.stringify(art, null, 2));
};

// Routes - USERS
app.get('/api/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const users = readUsers();
  const newUser = { ...req.body, id: Date.now() };
  users.push(newUser);
  writeUsers(users);
  res.json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const users = readUsers();
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    writeUsers(users);
    res.json(users[index]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Routes - ARTWORK
app.get('/api/art', (req, res) => {
  const art = readArt();
  res.json(art);
});

app.post('/api/art', (req, res) => {
  const art = readArt();
  const newArt = { ...req.body, id: Date.now() };
  art.unshift(newArt);
  writeArt(art);
  res.json(newArt);
});

app.delete('/api/art/:id', (req, res) => {
  const art = readArt();
  const filteredArt = art.filter(a => a.id !== parseInt(req.params.id));
  writeArt(filteredArt);
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running', dataDir });
});

app.listen(PORT, () => {
  console.log(`✅ LUMA Server running on http://localhost:${PORT}`);
  console.log(`📁 Data stored in: ${dataDir}`);
});
