// Email Configuration
// ============================================
// TO ENABLE EMAIL NOTIFICATIONS:
// 1. Create a Gmail App Password at https://myaccount.google.com/apppasswords
// 2. Add your Gmail address and App Password below
// 3. Save this file
// 4. Restart the server (node server.js)
// ============================================

module.exports = {
  // Hospital contact email - messages will be sent to this address
  HOSPITAL_EMAIL: 'slillebaelt@gmail.com',
  
  // SMTP Configuration for Gmail
  SMTP_CONFIG: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports (587 uses TLS)
    auth: {
      user: 'slillebaelt@gmail.com',
      pass: 'wgjnexsyerjucijt' // ⬅️ Gmail App Password (spaces removed)
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

