const pool = require('../config/db');

exports.getAllCharacters = async () => {
  const query = `
    SELECT 
      c.*,
      n.id AS nemesis_id,
      n.character_id AS nemesis_character_id,
      n.is_alive,
      n.years,
      s.id AS secret_id,
      s.nemesis_id AS secret_nemesis_id,
      s.secret_code
    FROM character c
    LEFT JOIN nemesis n ON n.character_id = c.id
    LEFT JOIN secret s ON s.nemesis_id = n.id
    ORDER BY c.id;
  `;

  const result = await pool.query(query);

  return buildTree(result.rows);
};


function buildTree(rows) {
  const charactersMap = {};

  for (const row of rows) {
    // 1️⃣ Create character if not exists
    if (!charactersMap[row.id]) {
      charactersMap[row.id] = {
        data: {
          id: row.id,
          name: row.name,
          gender: row.gender,
          ability: row.ability,
          weight: row.weight,
          born: row.born,
          beer_consumption: row.beer_consumption,
          knows_the_answer: row.knows_the_answer
        },
        children: {
          has_nemesis: {
            records: []
          }
        }
      };
    }

    // 2️⃣ Handle nemesis
    if (row.nemesis_id) {
      let nemesis = charactersMap[row.id].children.has_nemesis.records
        .find(n => n.data.id === row.nemesis_id);

      if (!nemesis) {
        nemesis = {
          data: {
            id: row.nemesis_id,
            character_id: row.nemesis_character_id,
            is_alive: row.is_alive,
            years: row.years
          },
          children: {
            has_secret: {
              records: []
            }
          }
        };

        charactersMap[row.id].children.has_nemesis.records.push(nemesis);
      }

      // 3️⃣ Handle secret
      if (row.secret_id) {
        nemesis.children.has_secret.records.push({
          data: {
            id: row.secret_id,
            nemesis_id: row.secret_nemesis_id,
            secret_code: row.secret_code
          }
        });
      }
    }
  }

  return Object.values(charactersMap);
}