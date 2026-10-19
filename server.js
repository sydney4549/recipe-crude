require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend from the same server (one link for page + API)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const FIELDS = ['title', 'description', 'ingredients', 'instructions', 'prep_time_minutes', 'servings', 'category'];

// GET all
app.get('/api/recipes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM recipes ORDER BY id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET one
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Recipe not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST create
app.post('/api/recipes', async (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: 'title is required' });
    const values = FIELDS.map(f => req.body[f] ?? null);
    const [result] = await pool.query(
      `INSERT INTO recipes (${FIELDS.join(',')}) VALUES (?,?,?,?,?,?,?)`, values);
    const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT update
app.put('/api/recipes/:id', async (req, res) => {
  try {
    if (!req.body.title) return res.status(400).json({ error: 'title is required' });
    const values = FIELDS.map(f => req.body[f] ?? null);
    const [result] = await pool.query(
      `UPDATE recipes SET ${FIELDS.map(f => f + '=?').join(',')} WHERE id = ?`,
      [...values, req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Recipe not found' });
    const [rows] = await pool.query('SELECT * FROM recipes WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE
app.delete('/api/recipes/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM recipes WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ message: 'Recipe deleted', id: Number(req.params.id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
