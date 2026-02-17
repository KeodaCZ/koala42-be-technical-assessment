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

  const charactersTree = buildTree(result.rows);
  const statistics = await getStatistics();

  return {
    ...statistics,
    characters: charactersTree
  };
};

function normalizeGender(gender) {
  if (!gender) return 'other';

  const value = gender.toString().toLowerCase();

  if (value === 'm' || value === 'male') return 'male';
  if (value === 'f' || value === 'female') return 'female';

  return 'other';
}

function buildTree(rows) {
  const charactersMap = {};

  for (const row of rows) {
    // 1️⃣ Create character if not exists
    if (!charactersMap[row.id]) {
      charactersMap[row.id] = {
        data: {
          id: row.id,
          name: row.name,
          gender: normalizeGender(row.gender),
          ability: row.ability,
          weight: row.weight !== null ? Number(row.weight) : null,
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

async function getStatistics() {
  // 1️⃣ Count characters
  const countResult = await pool.query(`
    SELECT COUNT(*)::int AS count FROM character;
  `);

  // 2️⃣ Average weight
  const weightResult = await pool.query(`
    SELECT AVG(weight)::float AS average_weight FROM character;
  `);

  // 3️⃣ Gender distribution (normalized in SQL)
  const genderResult = await pool.query(`
    SELECT 
      CASE
        WHEN LOWER(gender) IN ('m', 'male') THEN 'male'
        WHEN LOWER(gender) IN ('f', 'female') THEN 'female'
        ELSE 'other'
      END AS gender,
      COUNT(*)::int AS count
    FROM character
    GROUP BY 
      CASE
        WHEN LOWER(gender) IN ('m', 'male') THEN 'male'
        WHEN LOWER(gender) IN ('f', 'female') THEN 'female'
        ELSE 'other'
      END;
  `);

  // 4️⃣ Average age (characters + nemeses)
  const ageResult = await pool.query(`
    SELECT AVG(age)::float AS average_age
    FROM (
      SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, born)) AS age
      FROM character
      UNION ALL
      SELECT years AS age
      FROM nemesis
    ) combined;
  `);

  return {
    characters_count: countResult.rows[0].count,
    average_age: Number(ageResult.rows[0].average_age?.toFixed(2)),
    average_weight: Number(weightResult.rows[0].average_weight?.toFixed(2)),
    genders: genderResult.rows.reduce((acc, row) => {
      acc[row.gender] = row.count;
      return acc;
    }, {
      male: 0,
      female: 0,
      other: 0
    })
  };
}