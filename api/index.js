// Vercel serverless function entry point
// This file exports the Express app for Vercel's serverless environment

// Set Vercel environment flag before requiring server
process.env.VERCEL = '1';

const app = require('../server');

// Export the app for Vercel
module.exports = app;

