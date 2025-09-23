const Database = require("better-sqlite3");
const db = new Database("./database/permissions.sqlite");

// whitelist table
db.prepare(`CREATE TABLE IF NOT EXISTS whitelist (
  user_id TEXT PRIMARY KEY
)`).run();

module.exports = db;
