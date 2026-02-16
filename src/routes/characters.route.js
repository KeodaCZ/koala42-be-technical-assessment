const express = require('express');
const router = express.Router();
const charactersController = require('../controllers/characters.controller');

// GET /api/characters
router.get('/', charactersController.getAllCharacters);

module.exports = router;