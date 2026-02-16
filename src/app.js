const express = require('express');
const charactersRoutes = require('./routes/characters.route');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

app.use('/api/characters', charactersRoutes);

module.exports = app;