import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

async function run() {
  try {
    await pool.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMP;`);
    console.log("Migration complete: added last_reminded_at");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}
run();
