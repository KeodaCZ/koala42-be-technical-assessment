const charactersService = require('../services/characters.service');

exports.getAllCharacters = async (req, res) => {
  try {
    const data = await charactersService.getAllCharacters();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};