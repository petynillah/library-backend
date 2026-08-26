const sequelize = require("./authentication/database.js"); // Establishes your local connection to MySQL
const app = require("./app.js");

// 👇 PUT THE IMPORT HERE so Sequelize registers the model before syncing
require("./authentication/trusteddevicemodel.js"); 

const port = process.env.PORT || 8080;

// Connect to MySQL and then start the Express server
async function bootSystem() {
  try {
    await sequelize.authenticate();
    console.log("🚀 MySQL database connected successfully.");

    // Sync your authmodel, staffauthmodel, and trusteddevicemodel structures safely
    await sequelize.sync({ force: false }); // 👈 This will now physically build the trusted_devices table
    console.log("📦 All database tables are synchronized.");

    app.listen(port, () => {
      console.log(`⚡ Server running on port ${port}`);
    });

  } catch (error) {
    console.error("❌ Database synchronization failed. Server stopped:", error.message);
    process.exit(1);
  }
}

bootSystem();
