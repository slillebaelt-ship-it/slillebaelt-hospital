# Vercel Deployment Guide

## ⚠️ Important Limitations

### SQLite Database Issue
**Vercel uses serverless functions with an ephemeral file system.** This means:

1. **SQLite won't persist data** - The database file will be reset on each deployment or function invocation
2. **No persistent storage** - Vercel's `/tmp` directory is cleared between function calls
3. **Database will be empty** - All data (patients, messages, appointments) will be lost

### Solutions

#### Option 1: Use a Cloud Database (Recommended)
Switch to a cloud database service:
- **PostgreSQL**: Use Vercel Postgres, Supabase, or Neon
- **MongoDB**: Use MongoDB Atlas
- **SQLite Cloud**: Use Turso or LiteFS

#### Option 2: Use Vercel KV (Key-Value Store)
For simple data storage, use Vercel KV (Redis-based)

#### Option 3: Use External API
Store data in an external service via API calls

## Current Setup

The code has been configured for Vercel, but **SQLite will not work properly** in production.

### What's Fixed
✅ Missing dependencies added (`imap-simple`, `mailparser`)
✅ Undefined variable fixed (`isInSentFolder`)
✅ Vercel configuration created (`vercel.json`)
✅ Serverless function handler created (`api/index.js`)
✅ Server exports app for Vercel

### What Needs Attention
⚠️ **SQLite database** - Will not persist on Vercel
⚠️ **Email configuration** - Move sensitive data to environment variables
⚠️ **File uploads** - Not supported on Vercel (use external storage)

## Deployment Steps

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Set Environment Variables** (in Vercel dashboard):
   - `HOSPITAL_EMAIL` - Your hospital email
   - `SMTP_HOST` - SMTP server (e.g., smtp.gmail.com)
   - `SMTP_PORT` - SMTP port (e.g., 587)
   - `SMTP_USER` - SMTP username
   - `SMTP_PASS` - SMTP password (Gmail App Password)

5. **For Production**:
   ```bash
   vercel --prod
   ```

## Alternative: Use Railway or Render

For a traditional Node.js server with persistent storage:

### Railway
- Supports SQLite with persistent volumes
- Easy deployment from GitHub
- Free tier available

### Render
- Supports SQLite
- Free tier available
- Easy setup

## Recommended: Switch to PostgreSQL

For production, consider switching to PostgreSQL:

1. Use Vercel Postgres (built-in)
2. Update database queries to use PostgreSQL syntax
3. Use `pg` package instead of `sqlite3`

## Testing Locally

The server still works locally:
```bash
npm start
```

Access at: `http://localhost:3000`

