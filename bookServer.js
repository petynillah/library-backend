const express = require("express");
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser'); // ADD THIS


const sequelize = require("./authentication/database.js"); // Establishes your local connection to MySQL

const app = express();
app.use(cookieParser()); // ADD THIS — must come before routes

// Global Request Middlewares
app.use(express.json());
app.use(cors({ 
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175', 
    'http://localhost:5176',
    'http://localhost:5177'   

  ] ,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'], // 🔒 CRITICAL: Instructs the browser that Authorization is safe to pass through
    credentials: true
}));


// Link your separate student and staff endpoints
const authroute = require("./authentication/authroute.js");
app.use("/api", authroute);


const broute = require("./books/broute.js");
app.use("/api",broute);

const shelfroute = require('./shelving/shelfroute.js');
app.use('/api', shelfroute);

const categoryroute = require('./category/categoryRoute.js');
app.use('/api',categoryroute);


const port = 8080;

// Connect to MySQL and then start the Express server
async function bootSystem() {
  try {
    // Authenticate with your local database engine
    await sequelize.authenticate();
    console.log("🚀 MySQL database connected successfully.");

    // Sync your authmodel and staffauthmodel structures safely
    await sequelize.sync({ force: false });
    console.log("📦 All database tables are synchronized.");

    // Start looking for traffic on port 8080
    app.listen(port, () => {
      console.log(`⚡ Server running on port ${port}`);
    });

  } catch (error) {
    console.error("❌ Database synchronization failed. Server stopped:", error.message);
    process.exit(1); // Shuts down gracefully if MySQL is closed or disconnected
  }
}

bootSystem();
