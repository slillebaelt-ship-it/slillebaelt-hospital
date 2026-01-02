# Setup Guide - Installing on Another Machine

This guide will help you set up the hospital website on a friend's computer or any new machine.

## 📋 Prerequisites

Before starting, make sure the new machine has:
- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)

### Check if Node.js is installed:
```bash
node --version
npm --version
```

### How to Download and Install Node.js

**Node.js is NOT downloaded from Chrome or any browser extension. It's a software you install on your computer.**

#### Step-by-Step Installation:

1. **Open a web browser** (Chrome, Firefox, Edge, etc.)

2. **Go to the official Node.js website:**
   ```
   https://nodejs.org/
   ```

3. **You'll see two download buttons:**
   - **LTS** (Recommended) - Long Term Support version (most stable)
   - **Current** - Latest features (may have bugs)

   **Choose the LTS version** (it's the green button)

4. **Download the installer:**
   - **Windows:** Downloads a `.msi` file (e.g., `node-v20.x.x-x64.msi`)
   - **Mac:** Downloads a `.pkg` file
   - **Linux:** Downloads a `.tar.xz` file or you can use package manager

5. **Run the installer:**
   - **Windows:** Double-click the downloaded `.msi` file
   - **Mac:** Double-click the downloaded `.pkg` file
   - Follow the installation wizard (click "Next" through all steps)
   - **Important:** Make sure "Add to PATH" is checked (usually checked by default)

6. **Restart your computer** (recommended) or close and reopen your terminal

7. **Verify installation:**
   Open a new terminal/command prompt and type:
   ```bash
   node --version
   npm --version
   ```
   You should see version numbers (e.g., `v20.11.0` and `10.2.4`)

#### Alternative: Direct Download Links

- **Windows 64-bit:** https://nodejs.org/dist/latest-v20.x/node-v20.x.x-x64.msi
- **Mac Intel:** https://nodejs.org/dist/latest-v20.x/node-v20.x.x.pkg
- **Mac Apple Silicon (M1/M2):** https://nodejs.org/dist/latest-v20.x/node-v20.x.x-arm64.pkg

**Note:** Replace `v20.x.x` with the actual latest version number shown on the website.

---

## 🚀 Quick Setup Steps

### Step 1: Copy the Project Files

Copy the entire `hospital` folder to the new machine. You can:
- Use a USB drive
- Use cloud storage (OneDrive, Google Drive, Dropbox)
- Use a file sharing service
- Zip the folder and email it

**Important:** Copy the entire folder including:
- ✅ All files and folders
- ✅ The `node_modules` folder (optional - can reinstall)
- ✅ The `hospital.db` file (if you want to keep existing data)

### Step 2: Open Terminal/Command Prompt

**Windows:**
- Press `Win + R`
- Type `cmd` or `powershell`
- Press Enter
- Navigate to the project folder:
  ```bash
  cd path\to\hospital
  ```

**Mac/Linux:**
- Open Terminal
- Navigate to the project folder:
  ```bash
  cd /path/to/hospital
  ```

### Step 3: Install Dependencies

Install all required packages:

```bash
npm install
```

This will install:
- express
- sqlite3
- bcryptjs
- nodemailer
- imap-simple
- mailparser
- cookie-parser
- body-parser

Wait for installation to complete (may take 1-2 minutes).

### Step 4: Start the Server

Run the server:

```bash
node server.js
```

You should see:
```
✅ Connected to SQLite database
✅ Server running on http://localhost:3000
```

### Step 5: Open in Browser

Open your web browser and go to:
```
http://localhost:3000
```

---

## 📦 Alternative: Fresh Setup (Without node_modules)

If you don't copy `node_modules`, the setup is the same:

1. Copy project folder (without `node_modules`)
2. Open terminal in project folder
3. Run `npm install`
4. Run `node server.js`

---

## 🔧 Troubleshooting

### "node: command not found"
- **Solution:** Install Node.js from https://nodejs.org/

### "npm: command not found"
- **Solution:** Node.js installation includes npm. Reinstall Node.js if needed.

### "Error: Cannot find module"
- **Solution:** Run `npm install` again to install dependencies.

### "Port 3000 already in use"
- **Solution:** 
  - Close other applications using port 3000
  - Or change the port in `server.js` (line 13):
    ```javascript
    const PORT = process.env.PORT || 3001; // Change to 3001 or any other port
    ```

### "Error opening database"
- **Solution:** Make sure the `hospital.db` file is in the project root folder.

### Database is empty
- **Solution:** This is normal for a fresh setup. The database will create tables automatically.
- Doctors will be added automatically on first run.

---

## 🌐 Making it Accessible on Network

To access from other devices on the same network:

1. Find the machine's IP address:
   - **Windows:** Open Command Prompt, type `ipconfig`, look for "IPv4 Address"
   - **Mac/Linux:** Open Terminal, type `ifconfig`, look for "inet"

2. Update `server.js` (line 13):
   ```javascript
   const PORT = process.env.PORT || 3000;
   app.listen(PORT, '0.0.0.0', () => {  // Add '0.0.0.0' here
   ```

3. Access from other devices:
   ```
   http://YOUR_IP_ADDRESS:3000
   ```
   Example: `http://192.168.1.100:3000`

---

## 📝 Important Files to Keep

Make sure these files are copied:
- ✅ `server.js` - Main server file
- ✅ `package.json` - Dependencies
- ✅ `config.js` - Configuration (if exists)
- ✅ `public/` folder - All website files
- ✅ `hospital.db` - Database (optional, will create new if missing)

---

## 🔄 Updating the Site

If you make changes on your machine:

1. Copy updated files to the new machine
2. If you added new npm packages, run `npm install` again
3. Restart the server (stop with `Ctrl+C`, then run `node server.js` again)

---

## 💡 Tips

- **Keep server running:** Don't close the terminal while using the site
- **Stop server:** Press `Ctrl+C` in the terminal
- **Background mode:** On Mac/Linux, you can run in background with `node server.js &`
- **Auto-start:** You can create a startup script to run the server automatically

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Node.js and npm are installed
- [ ] All dependencies installed (`npm install` completed)
- [ ] Server starts without errors
- [ ] Website opens at `http://localhost:3000`
- [ ] Can navigate all pages
- [ ] Support Center works
- [ ] Admin panel accessible (⚕️ icon in footer)

---

## 🆘 Need Help?

If something doesn't work:
1. Check the error message in the terminal
2. Make sure all files were copied correctly
3. Verify Node.js version: `node --version` (should be 14+)
4. Try deleting `node_modules` and running `npm install` again

---

**That's it! The site should now be running on the new machine.** 🎉

