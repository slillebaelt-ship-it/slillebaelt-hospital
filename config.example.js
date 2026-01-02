// Email Configuration Template
// ============================================
// TO ENABLE EMAIL NOTIFICATIONS:
// 1. Copy this file to config.js
// 2. Create a Gmail App Password at https://myaccount.google.com/apppasswords
// 3. Add your Gmail address and App Password below
// 4. Save this file
// 5. Restart the server (node server.js)
// ============================================

module.exports = {
  // Hospital contact email - messages will be sent to this address
  HOSPITAL_EMAIL: 'your-email@gmail.com',
  
  // SMTP Configuration for Gmail
  SMTP_CONFIG: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports (587 uses TLS)
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-app-password-here' // ⬅️ Gmail App Password (16 characters, no spaces)
    }
  }
};

// IMPORTANT: Gmail requires an App Password (not your regular password)
// Steps to get App Password:
// 1. Go to: https://myaccount.google.com/apppasswords
// 2. Sign in to your Gmail account
// 3. Select "Mail" and "Other (Custom name)"
// 4. Name it "Hospital Website"
// 5. Copy the 16-character password and paste it above

