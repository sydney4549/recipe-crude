const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// ---- Database (SQLite, DB file path from environment variable) ----
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'recipes.db');
const db = new Database(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  ingredients TEXT,
  instructions TEXT,
  prep_time_minutes INTEGER,
  servings INTEGER,
  category TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

const FIELDS = ['title', 'description', 'ingredients', 'instructions', 'prep_time_minutes', 'servings', 'category'];

// Seed 10 sample records if the table is empty
if (db.prepare('SELECT COUNT(*) AS n FROM recipes').get().n === 0) {
  const seed = [
    ['Nshima with Kapenta', 'Zambian staple with dried fish', 'Maize meal, kapenta, tomato, onion, oil', 'Boil water, stir in maize meal until thick. Fry kapenta with onion and tomato.', 40, 4, 'Main'],
    ['Chicken Stew', 'Hearty tomato chicken stew', 'Chicken, tomato, onion, garlic, salt', 'Brown chicken, add vegetables, simmer 40 minutes.', 60, 4, 'Main'],
    ['Pancakes', 'Fluffy breakfast pancakes', 'Flour, eggs, milk, sugar, baking powder', 'Mix batter, fry spoonfuls until golden on both sides.', 20, 3, 'Breakfast'],
    ['Vegetable Rice', 'Rice cooked with mixed veggies', 'Rice, carrot, peas, onion, oil', 'Saute veggies, add rice and water, cook 20 minutes.', 30, 4, 'Main'],
    ['Fruit Salad', 'Fresh mixed fruit bowl', 'Banana, apple, orange, mango', 'Chop all fruit and mix in a bowl. Chill.', 10, 2, 'Dessert'],
    ['Beef Samosas', 'Crispy fried pastry parcels', 'Flour, minced beef, onion, spices, oil', 'Make filling, wrap in dough, deep fry until golden.', 50, 6, 'Snack'],
    ['Egg Sandwich', 'Quick boiled egg sandwich', 'Bread, eggs, mayonnaise, salt', 'Boil eggs, mash with mayo, spread on bread.', 15, 2, 'Breakfast'],
    ['Vitumbuwa', 'Sweet Zambian fritters', 'Flour, sugar, yeast, water, oil', 'Mix dough, rest 30 minutes, fry spoonfuls in oil.', 45, 5, 'Snack'],
    ['Lentil Soup', 'Warm spiced lentil soup', 'Lentils, onion, garlic, cumin, water', 'Simmer all ingredients for 30 minutes, blend lightly.', 40, 4, 'Soup'],
    ['Banana Bread', 'Moist baked banana loaf', 'Ripe bananas, flour, sugar, eggs, butter', 'Mash bananas, mix with other ingredients, bake at 180C for 50 minutes.', 70, 8, 'Dessert']
  ];
  const ins = db.prepare(`INSERT INTO recipes (${FIELDS.join(',')}) VALUES (?,?,?,?,?,?,?)`);
  db.transaction(rows => rows.forEach(r => ins.run(...r)))(seed);
}

// ---- Frontend (served from same server) ----
const FRONTEND = [path.join(__dirname, 'frontend'), path.join(__dirname, '..', 'frontend')]
  .find(p => fs.existsSync(p));
if (FRONTEND) app.use(express.static(FRONTEND));

const getOne = id => db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);

// GET all
app.get('/api/recipes', (req, res) => {
  try { res.json(db.prepare('SELECT * FROM recipes ORDER BY id').all()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// GET one
app.get('/api/recipes/:id', (req, res) => {
  try {
    const row = getOne(req.params.id);
    if (!row) return res.status(404).json({ error: 'Recipe not found' });
    res.json(row);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create
app.post('/api/recipes', (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: 'title is required' });
    const values = FIELDS.map(f => req.body[f] ?? null);
    const info = db.prepare(`INSERT INTO recipes (${FIELDS.join(',')}) VALUES (?,?,?,?,?,?,?)`).run(...values);
    res.status(201).json(getOne(info.lastInsertRowid));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update
app.put('/api/recipes/:id', (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: 'title is required' });
    const values = FIELDS.map(f => req.body[f] ?? null);
    const info = db.prepare(
      `UPDATE recipes SET ${FIELDS.map(f => f + '=?').join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).run(...values, req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Recipe not found' });
    res.json(getOne(req.params.id));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE
app.delete('/api/recipes/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
    if (!info.changes) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ message: 'Recipe deleted', id: Number(req.params.id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
