const pool = require('../config/db');

exports.getAllCharacters = async () => {
  const result = await pool.query('SELECT * FROM character LIMIT 10');
  return result.rows;
};