# Koala42 Backend Technical Assessment

## Overview

This project implements a REST API that connects to a PostgreSQL database and exposes character data in a nested tree structure along with aggregated statistics, as required by the technical assignment.


- Characters
- Their nemeses
- Their secret codes
- Aggregated statistics

---

## Tech Stack

- Node.js
- Express
- PostgreSQL
- pg (node-postgres)
- dotenv

---

## Architecture

The application follows a layered architecture:

```
Route → Controller → Service → Database
```

Business logic is isolated in the service layer, ensuring that controllers remain thin and focused purely on HTTP concerns.


### Layers

- **Routes** – Define HTTP endpoints
- **Controllers** – Handle HTTP request/response logic
- **Services** – Contain business logic and database interaction
- **DB Config** – Manages PostgreSQL connection pool

This structure keeps concerns separated and improves maintainability.

---

## Endpoint

### `GET /api/characters`

Returns: 

- Nested character → nemesis → secret structure
- Statistics:
  - `characters_count`
  - `average_age` (characters + nemeses)
  - `average_weight`
  - `genders` distribution

---

## Implementation Details

### Tree Structure

Data is fetched using `LEFT JOIN` to preserve characters without nemeses and nemeses without secrets.  
The relational result is transformed into a nested JSON tree in the service layer.

### Statistics

Statistics are calculated using SQL aggregation:

- `COUNT(*)` for total characters
- `AVG(weight)` for average weight
- `CASE + GROUP BY` for gender normalization
- `UNION ALL` to correctly calculate average age of characters and nemeses

Numeric casting (`::int`, `::float`) is used to ensure proper numeric types in the API response.

All statistical calculations are executed at the database level to leverage PostgreSQL's optimized aggregation capabilities and reduce unnecessary application-layer processing.



### Gender Normalization

Gender values are normalized both:
- In SQL (for aggregation)
- In JavaScript (for response consistency)

This ensures a stable API contract with:

```json 
{
"male": number,
"female": number,
"other": number
}
```

---

## Running the Project

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file from example:

```bash
cp .env.example .env
```

3. Add database connection string:

```
DATABASE_URL=postgres://<username>:<password>@<host>/<database>
```

4. Run development server:
```bash
npm run dev
```

Server runs on `http://localhost:3000` by default.

---

## Time Spent

Estimated time spent: approximately 3 hours, including:

- Architecture setup
- SQL implementation
- Tree transformation
- Debugging
- Refactoring

---

## Known Limitations / Possible Improvements

- No pagination implemented
- No automated tests
- No request validation middleware
- Aggregation queries executed sequentially (could be parallelized using `Promise.all`)
- No Docker configuration
- No caching layer

With more time, I would consider adding:
- Input validation middleware (e.g., Zod or Joi)
- Centralized error handling middleware
- Unit tests for service layer
- Docker support for easier local setup
- Parallelized statistics queries

---

## Final Notes

The focus of this implementation was:

- Clean architecture
- Proper separation of concerns
- Correct SQL usage
- Data consistency
- Readable and maintainable code