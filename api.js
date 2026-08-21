const serverless = require('serverless-http');
const sequelize = require('../authentication/database.js');
const app = require('../app.js');

// Verify the DB connection is reachable, but do NOT run sequelize.sync() here.
// Running sync() on every cold start is slow and risky against a production DB —
// schema changes should be applied deliberately (migration / one-off script),
// not implicitly on whichever serverless instance happens to cold-start first.
let dbCheckPromise = null;
function ensureDbConnection() {
  if (!dbCheckPromise) {
    dbCheckPromise = sequelize.authenticate()
      .then(() => console.log("🚀 MySQL database connected successfully."))
      .catch((error) => {
        console.error("❌ Database connection failed:", error.message);
        dbCheckPromise = null; // allow a retry on the next invocation instead of caching a failure forever
        throw error;
      });
  }
  return dbCheckPromise;
}

const handler = serverless(app);

module.exports = async (req, res) => {
  try {
    await ensureDbConnection();
  } catch (error) {
    res.status(500).json({ message: 'Database unavailable', error: error.message });
    return;
  }
  return handler(req, res);
};