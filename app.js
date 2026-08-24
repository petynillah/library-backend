const express = require("express");
console.log('🔥🔥🔥 BUILD CHECK: app.js loaded at', new Date().toISOString(), '- VERSION 2');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser());
app.use(express.json());

// FIXED: origins now come from an env var instead of being hardcoded to localhost ports.
// Also fixes a real bug — port 5177 (student-dash, per nginx.conf) was missing from the
// original hardcoded list even for local dev.
const defaultDevOrigins = 'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultDevOrigins)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    console.log('Incoming request Origin:', origin);
    console.log('Allowed list:', JSON.stringify(allowedOrigins));
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ Origin REJECTED:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Link your separate student and staff endpoints
const authroute = require("./authentication/authroute.js");
app.use("/api", authroute);

const broute = require("./books/broute.js");
app.use("/api", broute);

const shelfroute = require('./shelving/shelfroute.js');
app.use('/api', shelfroute);

const categoryroute = require('./category/categoryRoute.js');
app.use('/api', categoryroute);

const userroute = require('./user/userroute.js');
app.use("/api", userroute);

module.exports = app;