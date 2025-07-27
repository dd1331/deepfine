const { Pool } = require("pg");
const CONFIG = require("./config.json");

console.log("Config:", CONFIG.db_server);

const pool = new Pool(CONFIG.db_server);

pool.query("SELECT current_user, current_database()", (err, result) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Database connection successful:", result.rows[0]);
  }
  pool.end();
});
