
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// CONFIGURAÇÃO DO BANCO DE DADOS (AlwaysData)
const db = mysql.createPool({
  host: 'mysql-albertocossa.alwaysdata.net',
  user: '430726',
  password: 'Acossa@824018',
  database: 'albertocossa_nexus_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ENDPOINTS
app.get('/api/clients', (req, res) => {
  db.query('SELECT * FROM clients ORDER BY createdAt DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post('/api/clients', (req, res) => {
  const { id, name, email, phone, company, status, notes, createdAt } = req.body;
  const sql = 'INSERT INTO clients (id, name, email, phone, company, status, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [id, name, email, phone, company, status, notes, createdAt], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cliente criado com sucesso!' });
  });
});

app.put('/api/clients/:id', (req, res) => {
  const { name, email, phone, company, status, notes } = req.body;
  const sql = 'UPDATE clients SET name=?, email=?, phone=?, company=?, status=?, notes=? WHERE id=?';
  db.query(sql, [name, email, phone, company, status, notes, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cliente atualizado!' });
  });
});

app.delete('/api/clients/:id', (req, res) => {
  db.query('DELETE FROM clients WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Cliente removido!' });
  });
});

// Exporta o app para a Vercel
module.exports = app;
