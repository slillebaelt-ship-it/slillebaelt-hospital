const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Initialize Database
// Use /tmp directory on Vercel (serverless), otherwise use local file
const dbPath = process.env.VERCEL === '1' 
  ? '/tmp/hospital.db' 
  : './hospital.db';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    console.error('Database path:', dbPath);
    console.error('Full error:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initializeDatabase();
  }
});

// Database ready flag
let dbReady = false;

// Initialize Database Tables
function initializeDatabase() {
  console.log('🔄 Initializing database tables...');
  // Patients table
  db.run(`CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    phone TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, () => {
    // Add email and password columns if they don't exist (migration)
    db.all("PRAGMA table_info(patients)", (err, columns) => {
      if (err) return;
      
      const hasEmail = columns.some(col => col.name === 'email');
      const hasPassword = columns.some(col => col.name === 'password');
      
      if (!hasEmail) {
        db.run(`ALTER TABLE patients ADD COLUMN email TEXT`, (err) => {
          if (err) {
            console.error('Error adding email column:', err);
          } else {
            console.log('✅ Added email column to patients table');
          }
        });
      }
      
      if (!hasPassword) {
        db.run(`ALTER TABLE patients ADD COLUMN password TEXT`, (err) => {
          if (err) {
            console.error('Error adding password column:', err);
          } else {
            console.log('✅ Added password column to patients table');
          }
        });
      }
      
      // Make age, gender, phone, address nullable for existing records
      if (hasEmail && hasPassword) {
        db.run(`UPDATE patients SET age = NULL WHERE age = 0`, () => {});
        db.run(`UPDATE patients SET gender = NULL WHERE gender = ''`, () => {});
        db.run(`UPDATE patients SET phone = NULL WHERE phone = ''`, () => {});
        db.run(`UPDATE patients SET address = NULL WHERE address = ''`, () => {});
      }
    });
  });

  // Patient visits table
  db.run(`CREATE TABLE IF NOT EXISTS patient_visits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT NOT NULL,
    visit_date DATE NOT NULL,
    department TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
  )`);

  // Doctors table
  db.run(`CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialization TEXT NOT NULL,
    department TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    bio TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, () => {
    // Add default doctors if table is empty
    db.get('SELECT COUNT(*) as count FROM doctors', (err, row) => {
      if (err) return;
      if (row.count === 0) {
        const defaultDoctors = [
          {
            name: 'Dr. Sarah Johnson',
            specialization: 'General Medicine',
            department: 'OPD',
            email: 'sarah.johnson@hospital.com',
            bio: 'Experienced general practitioner with over 15 years of experience in primary care and preventive medicine.',
            image_url: 'images/doc1.jpg'
          },
          {
            name: 'Dr. Michael Chen',
            specialization: 'Cardiology',
            department: 'OPD',
            email: 'michael.chen@hospital.com',
            bio: 'Board-certified cardiologist specializing in heart disease prevention and treatment.',
            image_url: 'images/doc2.jpg'
          },
          {
            name: 'Dr. Emily Rodriguez',
            specialization: 'Pediatrics',
            department: 'Maternity',
            email: 'emily.rodriguez@hospital.com',
            bio: 'Dedicated pediatrician with expertise in child health and development.',
            image_url: 'images/doc3.jpg'
          },
          {
            name: 'Dr. James Wilson',
            specialization: 'Emergency Medicine',
            department: 'Emergency',
            email: 'james.wilson@hospital.com',
            bio: 'Emergency medicine specialist providing critical care services 24/7.',
            image_url: 'images/doc4.jpg'
          },
          {
            name: 'Dr. Lisa Anderson',
            specialization: 'Surgery',
            department: 'Surgery',
            email: 'lisa.anderson@hospital.com',
            bio: 'Skilled surgeon with expertise in general and minimally invasive procedures.',
            image_url: 'images/doc5.jpg'
          },
          {
            name: 'Dr. Robert Brown',
            specialization: 'Pathology',
            department: 'Laboratory',
            email: 'robert.brown@hospital.com',
            bio: 'Pathologist specializing in diagnostic testing and laboratory medicine.',
            image_url: 'images/doc6.jpg'
          }
        ];
        
        const stmt = db.prepare('INSERT INTO doctors (name, specialization, department, phone, email, bio, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)');
        defaultDoctors.forEach(doctor => {
          stmt.run(doctor.name, doctor.specialization, doctor.department, '', doctor.email, doctor.bio, doctor.image_url);
        });
        stmt.finalize();
        console.log('Default doctors added to database');
      }
    });
  });

  // Admin users table
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, () => {
    // Create default admin if not exists
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, 
      ['admin', defaultPassword]);
  });

  // Appointments table
  db.run(`CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    department TEXT NOT NULL,
    doctor_name TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Messages/Contact table - Updated for chat conversations
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT,
    patient_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    message TEXT NOT NULL,
    sender_type TEXT DEFAULT 'patient',
    status TEXT DEFAULT 'unread',
    admin_reply TEXT,
    replied_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
  )`, () => {
    // Migrate existing messages table to add conversation_id if it doesn't exist
    db.all("PRAGMA table_info(messages)", (err, columns) => {
      if (err) return;
      
      const hasConversationId = columns.some(col => col.name === 'conversation_id');
      const hasSenderType = columns.some(col => col.name === 'sender_type');
      const hasPatientId = columns.some(col => col.name === 'patient_id');
      
      if (!hasPatientId) {
        db.run(`ALTER TABLE messages ADD COLUMN patient_id TEXT`, (err) => {
          if (err) {
            console.error('Error adding patient_id column:', err);
          } else {
            console.log('✅ Added patient_id column to messages table');
          }
        });
      }
      
      if (!hasConversationId) {
        db.run("ALTER TABLE messages ADD COLUMN conversation_id TEXT", (err) => {
          if (err) {
            console.error('Error adding conversation_id column:', err);
          } else {
            console.log('✅ Added conversation_id column to messages table');
            // Generate conversation IDs for existing messages
            db.all("SELECT id, name, email FROM messages WHERE conversation_id IS NULL", (err, rows) => {
              if (!err && rows && rows.length > 0) {
                rows.forEach(row => {
                  const timestamp = Date.now();
                  const hash = require('crypto').createHash('md5').update(`${row.name}-${row.email}-${timestamp}-${row.id}`).digest('hex').substring(0, 8);
                  const convId = `CONV-${hash.toUpperCase()}`;
                  db.run("UPDATE messages SET conversation_id = ? WHERE id = ?", [convId, row.id]);
                });
                console.log(`✅ Generated conversation IDs for ${rows.length} existing messages`);
              }
            });
          }
        });
      }
      
      if (!hasSenderType) {
        db.run("ALTER TABLE messages ADD COLUMN sender_type TEXT DEFAULT 'patient'", (err) => {
          if (err) {
            console.error('Error adding sender_type column:', err);
          } else {
            console.log('✅ Added sender_type column to messages table');
          }
        });
      }
    });
    
    // Create index for faster conversation lookups
    db.run(`CREATE INDEX IF NOT EXISTS idx_conversation_id ON messages(conversation_id)`, (err) => {
      if (err) {
        console.error('Error creating index:', err);
      } else {
        dbReady = true;
        console.log('✅ Database initialization complete');
      }
    });
  });
}

// Generate Unique Patient ID
function generatePatientID() {
  const prefix = 'PAT';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

// API Routes

// Health check endpoint
app.get('/api/health', (req, res) => {
  db.get('SELECT 1 as test', (err, row) => {
    if (err) {
      return res.status(500).json({ 
        healthy: false, 
        error: 'Database connection failed',
        details: err.message,
        dbPath: dbPath
      });
    }
    res.json({ 
      healthy: true, 
      dbReady: dbReady,
      dbPath: dbPath,
      vercel: process.env.VERCEL === '1'
    });
  });
});

// Authentication
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }
  
  db.get('SELECT * FROM admins WHERE username = ?', [username], (err, admin) => {
    if (err) {
      console.error('❌ Database error during login:', err);
      console.error('   Error code:', err.code);
      console.error('   Error message:', err.message);
      return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
    
    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    res.cookie('authToken', 'authenticated', { 
      httpOnly: true, 
      maxAge: 86400000,
      sameSite: 'none',
      secure: process.env.VERCEL === '1' // Use secure cookies on Vercel (HTTPS)
    });
    res.json({ success: true, message: 'Login successful', token: 'authenticated' });
  });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('authToken');
  res.json({ success: true, message: 'Logged out' });
});

app.get('/api/check-auth', (req, res) => {
  const token = req.cookies.authToken;
  res.json({ authenticated: token === 'authenticated' });
});

// Patients API
app.post('/api/patients', (req, res) => {
  const { name, age, gender, phone, address } = req.body;
  const patient_id = generatePatientID();
  
  db.run(
    'INSERT INTO patients (patient_id, name, age, gender, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
    [patient_id, name, age, gender, phone, address],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to register patient' });
      }
      res.json({ success: true, patient_id, message: 'Patient registered successfully' });
    }
  );
});

app.get('/api/patients', (req, res) => {
  db.all('SELECT * FROM patients ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch patients' });
    }
    res.json(rows);
  });
});

app.get('/api/patients/:id', (req, res) => {
  const patientId = req.params.id;
  
  db.get('SELECT * FROM patients WHERE patient_id = ?', [patientId], (err, patient) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Get patient visits
    db.all('SELECT * FROM patient_visits WHERE patient_id = ? ORDER BY visit_date DESC', 
      [patientId], (err, visits) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ ...patient, visits });
      });
  });
});

// Patient Visits API
app.post('/api/visits', (req, res) => {
  const { patient_id, visit_date, department, doctor_name, notes } = req.body;
  
  db.run(
    'INSERT INTO patient_visits (patient_id, visit_date, department, doctor_name, notes) VALUES (?, ?, ?, ?, ?)',
    [patient_id, visit_date, department, doctor_name, notes || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to record visit' });
      }
      res.json({ success: true, message: 'Visit recorded successfully' });
    }
  );
});

app.get('/api/visits', (req, res) => {
  db.all('SELECT * FROM patient_visits ORDER BY visit_date DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch visits' });
    }
    res.json(rows);
  });
});

// Doctors API
app.get('/api/doctors', (req, res) => {
  db.all('SELECT * FROM doctors ORDER BY department, name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch doctors' });
    }
    res.json(rows);
  });
});

app.post('/api/doctors', (req, res) => {
  const { name, specialization, department, phone, email, bio, image_url } = req.body;
  
  db.run(
    'INSERT INTO doctors (name, specialization, department, phone, email, bio, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, specialization, department, phone || '', email || '', bio || '', image_url || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to add doctor' });
      }
      res.json({ success: true, message: 'Doctor added successfully' });
    }
  );
});

app.put('/api/doctors/:id', (req, res) => {
  const { name, specialization, department, phone, email, bio, image_url } = req.body;
  const id = req.params.id;
  
  db.run(
    'UPDATE doctors SET name = ?, specialization = ?, department = ?, phone = ?, email = ?, bio = ?, image_url = ? WHERE id = ?',
    [name, specialization, department, phone || '', email || '', bio || '', image_url || '', id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update doctor' });
      }
      res.json({ success: true, message: 'Doctor updated successfully' });
    }
  );
});

app.delete('/api/doctors/:id', (req, res) => {
  const id = req.params.id;
  
  db.run('DELETE FROM doctors WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete doctor' });
    }
    res.json({ success: true, message: 'Doctor deleted successfully' });
  });
});

// Appointments API
app.post('/api/appointments', (req, res) => {
  const { patient_id, patient_name, phone, department, doctor_name, appointment_date, appointment_time, notes } = req.body;
  
  db.run(
    'INSERT INTO appointments (patient_id, patient_name, phone, department, doctor_name, appointment_date, appointment_time, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [patient_id || '', patient_name, phone, department, doctor_name || '', appointment_date, appointment_time, notes || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to book appointment' });
      }
      res.json({ success: true, message: 'Appointment booked successfully' });
    }
  );
});

app.get('/api/appointments', (req, res) => {
  db.all('SELECT * FROM appointments ORDER BY appointment_date DESC, appointment_time DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch appointments' });
    }
    res.json(rows);
  });
});

app.put('/api/appointments/:id', (req, res) => {
  const { status } = req.body;
  const id = req.params.id;
  
  db.run('UPDATE appointments SET status = ? WHERE id = ?', [status, id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update appointment' });
    }
    res.json({ success: true, message: 'Appointment updated successfully' });
  });
});

// Email transporter setup
let transporter = null;
if (config.SMTP_CONFIG && config.SMTP_CONFIG.auth && config.SMTP_CONFIG.auth.pass) {
  try {
    transporter = nodemailer.createTransport({
      host: config.SMTP_CONFIG.host,
      port: config.SMTP_CONFIG.port,
      secure: config.SMTP_CONFIG.secure,
      auth: config.SMTP_CONFIG.auth,
      requireTLS: true
    });
    
    // Verify connection
    transporter.verify(function(error, success) {
      if (error) {
        console.error('❌ Email transporter verification failed:', error.message);
        console.error('This might be due to:');
        console.error('1. Incorrect password');
        console.error('2. 2FA enabled (need App Password)');
        console.error('3. Outlook security settings');
      } else {
        console.log('✅ Email transporter configured and verified!');
        console.log('Ready to send emails to:', config.HOSPITAL_EMAIL);
      }
    });
  } catch (error) {
    console.error('❌ Email transporter not configured:', error.message);
  }
} else {
  console.log('❌ Email transporter not configured - password not set');
}

// Generate conversation ID
function generateConversationId(name, email) {
  const timestamp = Date.now();
  const hash = require('crypto').createHash('md5').update(`${name}-${email}-${timestamp}`).digest('hex').substring(0, 8);
  return `CONV-${hash.toUpperCase()}`;
}

// Messages API - Patient sends message (simple - just name and age)
app.post('/api/messages', (req, res) => {
  const { name, age, message, conversation_id } = req.body;
  
  // Validate input
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Name is required' });
  }
  
  if (!age || !age.trim()) {
    return res.status(400).json({ success: false, error: 'Age is required' });
  }
  
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }
  
  // Generate or use existing conversation ID
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}@patient.local`;
  const convId = conversation_id || generateConversationId(name, email);
  
  db.run(
    'INSERT INTO messages (conversation_id, name, email, message, sender_type) VALUES (?, ?, ?, ?, ?)',
    [convId, name.trim(), email, message.trim(), 'patient'],
    function(err) {
      if (err) {
        console.error('❌ Database error saving message:', err);
        console.error('   Error code:', err.code);
        console.error('   Error message:', err.message);
        return res.status(500).json({ success: false, error: 'Failed to send message', details: err.message });
      }
      
      const messageId = this.lastID;
      
      console.log(`📝 New message saved - Conversation ID: ${convId}`);
      console.log(`   Patient: ${name} (Age: ${age})`);
      console.log(`   Message: ${message.substring(0, 50)}...`);
      
      res.json({ 
        success: true, 
        message: 'Message sent successfully',
        conversation_id: convId,
        message_id: messageId
      });
    }
  );
});

// Delete conversation messages
app.delete('/api/conversation/:conversation_id', (req, res) => {
  const { conversation_id } = req.params;
  
  db.run('DELETE FROM messages WHERE conversation_id = ?', [conversation_id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete conversation' });
    }
    res.json({ success: true, deleted: this.changes, message: 'Conversation cleared successfully' });
  });
});

// Get conversation messages
app.get('/api/conversation/:conversation_id', (req, res) => {
  const { conversation_id } = req.params;
  
  db.all(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
    [conversation_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch conversation' });
      }
      res.json(rows);
    }
  );
});

// Manual reply endpoint - Add doctor reply manually (when email checking doesn't work)
app.post('/api/test-reply', (req, res) => {
  const { conversation_id, message } = req.body;
  
  if (!conversation_id || !message) {
    return res.status(400).json({ success: false, error: 'conversation_id and message are required' });
  }
  
  if (!message.trim()) {
    return res.status(400).json({ success: false, error: 'Message cannot be empty' });
  }
  
  // Get hospital email from config or use default
  const hospitalEmail = (config && config.HOSPITAL_EMAIL) || 'doctor@hospital.com';
  
  // Debug: Log all conversations to help diagnose
  db.all('SELECT DISTINCT conversation_id FROM messages LIMIT 10', (debugErr, allConvs) => {
    if (!debugErr && allConvs) {
      console.log('📋 Available conversations:', allConvs.map(c => c.conversation_id));
    }
  });
  
  // Verify conversation exists
  db.get('SELECT * FROM messages WHERE conversation_id = ? LIMIT 1', [conversation_id], (err, exists) => {
    if (err) {
      console.error('❌ Database error checking conversation:', err);
      console.error('   Error code:', err.code);
      console.error('   Error message:', err.message);
      console.error('   Looking for conversation_id:', conversation_id);
      return res.status(500).json({ success: false, error: 'Database error', details: err.message });
    }
    
    if (!exists) {
      console.error(`❌ Conversation not found: ${conversation_id}`);
      console.error('   Searching for similar conversations...');
      
      // Try to find any message with similar conversation_id (case-insensitive or partial match)
      db.all('SELECT conversation_id FROM messages WHERE conversation_id LIKE ? LIMIT 5', 
        [`%${conversation_id.substring(Math.max(0, conversation_id.length - 8))}%`], 
        (searchErr, similar) => {
          if (!searchErr && similar && similar.length > 0) {
            console.error('   Found similar conversation IDs:', similar.map(s => s.conversation_id));
          }
        }
      );
      
      // Check if there are any messages at all
      db.get('SELECT COUNT(*) as count FROM messages', (countErr, countRow) => {
        if (!countErr) {
          console.error(`   Total messages in database: ${countRow.count}`);
        }
      });
      
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation not found',
        conversation_id: conversation_id,
        hint: 'The conversation may have been cleared or the database was reset'
      });
    }
    
    // Save the reply
    db.run(
      'INSERT INTO messages (conversation_id, name, email, message, sender_type, status) VALUES (?, ?, ?, ?, ?, ?)',
      [conversation_id, 'Doctor', hospitalEmail, message.trim(), 'doctor', 'read'],
      function(err) {
        if (err) {
          console.error('❌ Error saving doctor reply:', err);
          console.error('   Error code:', err.code);
          console.error('   Error message:', err.message);
          console.error('   Conversation ID:', conversation_id);
          return res.status(500).json({ success: false, error: 'Failed to save reply', details: err.message });
        }
        console.log(`✅ Doctor reply saved for conversation ${conversation_id} (ID: ${this.lastID})`);
        res.json({ success: true, message_id: this.lastID, message: 'Reply saved successfully' });
      }
    );
  });
});

app.get('/api/messages', (req, res) => {
  db.all('SELECT * FROM messages ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
    res.json(rows);
  });
});

app.put('/api/messages/:id/reply', (req, res) => {
  const { admin_reply } = req.body;
  const id = req.params.id;
  
  db.run(
    'UPDATE messages SET admin_reply = ?, status = ?, replied_at = CURRENT_TIMESTAMP WHERE id = ?',
    [admin_reply, 'replied', id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save reply' });
      }
      res.json({ success: true, message: 'Reply saved successfully' });
    }
  );
});

app.put('/api/messages/:id/status', (req, res) => {
  const { status } = req.body;
  const id = req.params.id;
  
  let query = 'UPDATE messages SET status = ?';
  let params = [status, id];
  
  // If marking as replied, also set replied_at timestamp
  if (status === 'replied') {
    query = 'UPDATE messages SET status = ?, replied_at = CURRENT_TIMESTAMP WHERE id = ?';
  } else {
    query = 'UPDATE messages SET status = ? WHERE id = ?';
  }
  
  db.run(query, params, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update status' });
    }
    res.json({ success: true, message: 'Status updated successfully' });
  });
});

// Dashboard Stats
app.get('/api/stats', (req, res) => {
  const stats = {};
  
  db.get('SELECT COUNT(*) as count FROM patients', (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    // Add base number to show higher patient count
    stats.totalPatients = (row.count || 0) + 5000;
    
    db.get('SELECT COUNT(*) as count FROM patient_visits', (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      stats.totalVisits = row.count;
      
      db.get('SELECT COUNT(*) as count FROM appointments WHERE status = ?', ['pending'], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        stats.pendingAppointments = row.count;
        
        db.get('SELECT COUNT(*) as count FROM doctors', (err, row) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          // Add base number to show higher doctor count
          stats.totalDoctors = (row.count || 0) + 150;
          
          db.get('SELECT COUNT(*) as count FROM messages WHERE status = ?', ['unread'], (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            stats.unreadMessages = row.count;
          res.json(stats);
        });
      });
    });
  });
});
});

// Get patient conversations by name and age
app.get('/api/patient-conversations', (req, res) => {
  const { name, age } = req.query;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  // Get all conversations for this patient (by name)
  db.all(
    `SELECT DISTINCT conversation_id, 
            MAX(created_at) as last_message,
            (SELECT message FROM messages WHERE conversation_id = m.conversation_id ORDER BY created_at DESC LIMIT 1) as last_message_text
     FROM messages m
     WHERE name = ?
     GROUP BY conversation_id
     ORDER BY last_message DESC`,
    [name],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch conversations' });
      }
      res.json(rows);
    }
  );
});

// Clear old test messages
app.delete('/api/messages/clear-old', (req, res) => {
  db.run('DELETE FROM messages WHERE created_at < datetime("now", "-7 days")', function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to clear old messages' });
    }
    res.json({ success: true, deleted: this.changes, message: 'Old messages cleared' });
  });
});

// Clear ALL messages
app.delete('/api/messages/clear-all', (req, res) => {
  db.run('DELETE FROM messages', function(err) {
    if (err) {
      return res.status(500).json({ success: false, error: 'Failed to clear messages' });
    }
    console.log(`🗑️ Cleared all messages (${this.changes} deleted)`);
    res.json({ success: true, deleted: this.changes, message: `Cleared ${this.changes} messages` });
  });
});

// Test email endpoint (for debugging)
app.get('/api/test-email', (req, res) => {
  if (!transporter) {
    return res.json({ success: false, error: 'Email transporter not configured' });
  }
  
  const mailOptions = {
    from: config.SMTP_CONFIG.auth.user,
    to: config.HOSPITAL_EMAIL,
    subject: 'Test Email - sygehuzbaelt',
    html: '<h2>Test Email</h2><p>If you receive this, email is working correctly!</p>'
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.json({ success: false, error: error.message, details: error });
    }
    res.json({ success: true, messageId: info.messageId, message: 'Test email sent!' });
  });
});

// IMAP Email Checking - Check for doctor replies
async function checkForEmailReplies() {
  if (!config.SMTP_CONFIG || !config.SMTP_CONFIG.auth || !config.SMTP_CONFIG.auth.pass) {
    console.log('⚠️ Email checking skipped - password not configured');
    return 0; // Email not configured
  }
  
  const imapConfig = {
    imap: {
      user: config.SMTP_CONFIG.auth.user,
      password: config.SMTP_CONFIG.auth.pass,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    }
  };
  
  let repliesFound = 0;
  
  try {
    console.log('\n📧 Connecting to Gmail IMAP...');
    console.log(`   User: ${config.SMTP_CONFIG.auth.user}`);
    console.log(`   Host: imap.gmail.com:993`);
    
    const connection = await imap.connect(imapConfig);
    
    // Check SENT folder - this is where doctor replies go when they reply to patient emails
    let allMessages = [];
    let isInSentFolder = false; // Track which folder we're using
    const fetchOptions = {
      bodies: '',
      struct: true
    };
    
    try {
      await connection.openBox('[Gmail]/Sent Mail');
      isInSentFolder = true; // We're in the SENT folder
      console.log('✅ Connected to Gmail SENT folder (where doctor replies are)');
      
      // Search for all recent sent emails - check last 24 hours first (most recent)
      console.log('   Searching for all sent emails from last 24 hours...');
      let searchCriteria = ['SINCE', new Date(Date.now() - 24 * 60 * 60 * 1000)];
      allMessages = await connection.search(searchCriteria, fetchOptions);
      console.log(`📧 Found ${allMessages.length} total sent emails in last 24 hours`);
      
      // If not many found, expand to 7 days
      if (allMessages.length < 5) {
        console.log('   Expanding search to last 7 days...');
        searchCriteria = ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)];
        allMessages = await connection.search(searchCriteria, fetchOptions);
        console.log(`📧 Found ${allMessages.length} total sent emails in last 7 days`);
      }
      
      // Also try searching for emails with CONV- in subject
      const convMessages = await connection.search(['SUBJECT', 'CONV-'], fetchOptions);
      console.log(`📧 Found ${convMessages.length} sent emails with "CONV-" in subject`);
      
      // If we found emails with CONV-, prioritize those
      if (convMessages.length > 0 && convMessages.length < allMessages.length) {
        console.log(`   Prioritizing ${convMessages.length} emails with CONV- in subject`);
      }
    } catch (sentError) {
      isInSentFolder = false; // We're in INBOX, not SENT folder
      console.log('⚠️ Could not open SENT folder, trying INBOX instead...');
      console.log(`   Error: ${sentError.message}`);
      await connection.openBox('INBOX');
      console.log('✅ Connected to Gmail INBOX');
      
      // Search for emails with CONV- in subject
      let searchCriteria = ['SUBJECT', 'CONV-'];
      allMessages = await connection.search(searchCriteria, fetchOptions);
      console.log(`📧 Found ${allMessages.length} emails with "CONV-" in subject`);
      
      // If no emails with CONV- in subject, search all recent emails
      if (allMessages.length === 0) {
        console.log('   Trying broader search - checking all emails from last 7 days...');
        searchCriteria = ['SINCE', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)];
        allMessages = await connection.search(searchCriteria, fetchOptions);
        console.log(`📧 Found ${allMessages.length} total emails in last 7 days`);
      }
    }
    
    if (allMessages.length === 0) {
      console.log('   ⚠️ No emails found at all');
      await connection.end();
      return repliesFound;
    }
    
    // Process messages in reverse order (newest first) - limit to last 50 for performance
    const messagesToProcess = allMessages.reverse().slice(0, 50);
    console.log(`   Processing last ${messagesToProcess.length} emails...\n`);
    
    for (const item of messagesToProcess) {
      try {
        const parts = imap.getParts(item.attributes.struct);
        const textPart = parts.find(part => part.which === 'TEXT');
        
        if (!textPart) {
          console.log('   Skipping email - no TEXT part found');
          continue;
        }
        
        const partData = await connection.getPartData(item, textPart);
        const parsed = await simpleParser(partData);
        
        // Extract conversation ID from subject
        const subject = parsed.subject || '';
        const convIdMatch = subject.match(/\[CONV-([A-Z0-9]+)\]/);
        
        // Check if email is from the hospital email (doctor replying)
        // In SENT folder, ALL emails are from the doctor (us)
        const fromEmail = parsed.from?.value?.[0]?.address || '';
        const isFromDoctor = isInSentFolder || // All emails in SENT folder are from doctor
                            fromEmail.toLowerCase() === config.SMTP_CONFIG.auth.user.toLowerCase();
        
        // Always log what we're processing
        console.log(`\n   📧 Email #${messagesToProcess.indexOf(item) + 1}:`);
        console.log(`      Subject: "${subject.substring(0, 100)}"`);
        console.log(`      From: "${fromEmail}"`);
        console.log(`      Has CONV in subject: ${!!convIdMatch}`);
        console.log(`      From Doctor (${config.SMTP_CONFIG.auth.user}): ${isFromDoctor}`);
        
        // Check if this email has CONV- in subject OR is from doctor
        if (!convIdMatch && !isFromDoctor) {
          console.log(`      ⏭️ Skipping - no CONV- and not from doctor`);
          continue;
        }
        
        // Process if it has CONV- in subject OR is from doctor's email
        let conversationId = convIdMatch ? `CONV-${convIdMatch[1]}` : null;
        
        // If no CONV- in subject but from doctor, try to find conversation from reply-to or references
        if (!conversationId && isFromDoctor) {
          // Try to extract from in-reply-to header or references
          const inReplyTo = parsed.inReplyTo || parsed.headers.get('in-reply-to') || '';
          const references = parsed.references || parsed.headers.get('references') || '';
          const allHeaders = (inReplyTo + ' ' + references + ' ' + subject).toUpperCase();
          
          console.log(`      Checking reply headers for CONV-...`);
          console.log(`      In-Reply-To: ${inReplyTo.substring(0, 50)}`);
          console.log(`      References: ${references.substring(0, 50)}`);
          
          // Look for CONV- in reply headers or subject
          const replyMatch = allHeaders.match(/\[CONV-([A-Z0-9]+)\]/);
          if (replyMatch) {
            conversationId = `CONV-${replyMatch[1]}`;
            console.log(`      ✅ Found CONV- in headers: ${conversationId}`);
          }
        }
        
        // If we still don't have conversation ID but it's from doctor in SENT folder, try to find it
        if (!conversationId && isInSentFolder && isFromDoctor) {
          console.log(`      🔍 No CONV- found, but it's from doctor - trying to find conversation by date...`);
          // Try to find the most recent patient message without a doctor reply
          // This is a fallback - match by finding conversations that need replies
          db.all('SELECT DISTINCT conversation_id FROM messages WHERE sender_type = ? AND conversation_id NOT IN (SELECT DISTINCT conversation_id FROM messages WHERE sender_type = ?) ORDER BY created_at DESC LIMIT 5',
            ['patient', 'doctor'],
            (err, conversationsNeedingReply) => {
              if (!err && conversationsNeedingReply && conversationsNeedingReply.length > 0) {
                // Use the most recent conversation that needs a reply
                conversationId = conversationsNeedingReply[0].conversation_id;
                console.log(`      ✅ Found conversation needing reply: ${conversationId}`);
              }
            }
          );
        }
        
        if (!conversationId) {
          console.log(`      ⚠️ Could not find conversation ID - skipping`);
          console.log(`      💡 TIP: Make sure your reply has [CONV-XXXXX] in the subject line`);
          continue;
        }
        
        // Check if this is a reply (Re: in subject or has inReplyTo)
        const isReply = subject.toLowerCase().includes('re:') || 
                       subject.toLowerCase().includes('re :') ||
                       parsed.inReplyTo || 
                       parsed.references ||
                       parsed.headers.get('in-reply-to');
        
        console.log(`      Conversation ID: ${conversationId}`);
        console.log(`      Is Reply: ${isReply}`);
        console.log(`      From Doctor: ${isFromDoctor}`);
        
        // Process if it's a reply OR from doctor's email
        if (isReply || isFromDoctor) {
          console.log(`      ✅ Processing as reply...`);
          
          // Use Promise to handle async database operations properly
          await new Promise((resolve) => {
            // Get the original conversation to verify it exists
            db.get('SELECT * FROM messages WHERE conversation_id = ? AND sender_type = ? ORDER BY created_at ASC LIMIT 1',
              [conversationId, 'patient'],
              (err, originalMessage) => {
                  if (err) {
                    console.error(`❌ Database error checking conversation ${conversationId}:`, err);
                    resolve();
                    return;
                  }
                  
                  if (!originalMessage) {
                    console.log(`⚠️ No matching conversation found for ${conversationId}`);
                    console.log(`   Checking if conversation exists at all...`);
                    // Check if conversation exists with any sender type
                    db.get('SELECT * FROM messages WHERE conversation_id = ? LIMIT 1',
                      [conversationId],
                      (err, anyMessage) => {
                        if (anyMessage) {
                          console.log(`   ⚠️ Conversation exists but no patient message found. Found: ${anyMessage.sender_type}`);
                        } else {
                          console.log(`   ❌ Conversation ${conversationId} does not exist in database`);
                        }
                        resolve();
                      }
                    );
                    return;
                  }
                  
                  console.log(`✅ Found conversation ${conversationId} for patient: ${originalMessage.name}`);
                  
                  // Extract reply text
                  let replyText = parsed.text || '';
                  
                  // If no plain text, try HTML
                  if (!replyText && parsed.html) {
                    replyText = parsed.html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                  }
                  
                  console.log(`   Raw reply text length: ${replyText.length} chars`);
                  
                  // Remove quoted original message (better parsing for Gmail)
                  const lines = replyText.split('\n');
                  let cleanReply = '';
                  let foundQuote = false;
                  
                  for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const trimmed = line.trim();
                    
                    // Stop at common quote indicators
                    if (trimmed.startsWith('>') || 
                        trimmed.startsWith('&gt;') ||
                        (trimmed.startsWith('On ') && (trimmed.includes('wrote:') || trimmed.includes('écrit:'))) ||
                        trimmed.includes('-----Original Message-----') ||
                        (trimmed.includes('From:') && trimmed.includes('Sent:')) ||
                        trimmed.includes('Le ') && trimmed.includes('a écrit') ||
                        trimmed.includes('Am ') && trimmed.includes('schrieb') ||
                        trimmed.match(/^On .+ \d{4}.*wrote:/i) ||
                        trimmed.match(/^From:.*Sent:/i) ||
                        (i > 0 && lines[i-1].trim() === '' && trimmed.match(/^[-_=]{3,}/))) {
                      foundQuote = true;
                      console.log(`   Found quote marker at line ${i + 1}: "${trimmed.substring(0, 50)}"`);
                      break;
                    }
                    
                    // Skip empty lines at the start
                    if (cleanReply.length === 0 && trimmed === '') {
                      continue;
                    }
                    
                    cleanReply += line + '\n';
                  }
                  
                  replyText = cleanReply.trim();
                  
                  // Additional cleanup: remove email signatures and footers
                  replyText = replyText.replace(/--\s*$.*/m, '').trim();
                  replyText = replyText.replace(/Sent from.*$/mi, '').trim();
                  
                  console.log(`   Cleaned reply text length: ${replyText.length} chars`);
                  console.log(`   Preview: "${replyText.substring(0, 150)}..."`);
                  
                  if (replyText.length > 5) { // Minimum length check
                    // Check if we already have this reply (avoid duplicates) - use more lenient matching
                    db.get('SELECT * FROM messages WHERE conversation_id = ? AND sender_type = ? AND (message = ? OR message LIKE ?) LIMIT 1',
                      [conversationId, 'doctor', replyText, replyText.substring(0, 30) + '%'],
                      (err, existing) => {
                        if (err) {
                          console.error('❌ Error checking for existing reply:', err);
                          resolve();
                          return;
                        }
                        
                        if (existing) {
                          console.log(`⏭️ Reply already exists for ${conversationId} (ID: ${existing.id})`);
                          console.log(`   Existing: "${existing.message.substring(0, 50)}..."`);
                          resolve();
                          return;
                        }
                        
                        // Save doctor's reply as a new message in the conversation
                        console.log(`   💾 Saving reply to database...`);
                        db.run(
                          'INSERT INTO messages (conversation_id, name, email, message, sender_type, status) VALUES (?, ?, ?, ?, ?, ?)',
                          [conversationId, 'Doctor', config.HOSPITAL_EMAIL, replyText, 'doctor', 'read'],
                          function(err) {
                            if (err) {
                              console.error('❌ Error saving doctor reply:', err);
                              console.error('   Error details:', err.message);
                            } else {
                              repliesFound++;
                              console.log(`\n🎉🎉🎉 SUCCESS! SAVED DOCTOR REPLY! 🎉🎉🎉`);
                              console.log(`   Conversation ID: ${conversationId}`);
                              console.log(`   Database Message ID: ${this.lastID}`);
                              console.log(`   Reply text: "${replyText.substring(0, 100)}..."`);
                              console.log(`   Total replies found this check: ${repliesFound}`);
                              console.log(`   ✅ Patient can now see this reply on chat.html\n`);
                            }
                            resolve();
                          }
                        );
                      }
                    );
                  } else {
                    console.log(`⚠️ Reply text too short (${replyText.length} chars), skipping`);
                    console.log(`   Raw text: "${replyText}"`);
                    if (replyText.length === 0) {
                      console.log(`   ⚠️ No text extracted - email might be empty or format issue`);
                    }
                    resolve();
                  }
                }
              );
            });
          } else {
            console.log(`      ⏭️ Skipping - not a reply and not from doctor`);
          }
      } catch (itemError) {
        console.error('Error processing email item:', itemError.message);
        continue;
      }
    }
    
    await connection.end();
    
    if (repliesFound > 0) {
      console.log(`\n🎉✅✅✅ EMAIL CHECK COMPLETE - Found and saved ${repliesFound} doctor reply(ies)!`);
    } else {
      console.log(`\n📧 Email check complete - No new replies found`);
    }
    
    return repliesFound;
  } catch (error) {
    console.error('\n❌❌❌ ERROR checking for email replies:', error.message);
    console.error('Full error:', error);
    return 0;
  }
}

// Manual endpoint to check for email replies (supports both GET and POST)
app.get('/api/check-email-replies', async (req, res) => {
  try {
    console.log('\n🔍 Manual email check triggered (GET)...');
    const result = await checkForEmailReplies();
    console.log(`\n📊 Check result: ${result} replies found\n`);
    res.json({ success: true, message: 'Email check completed', found: result || 0 });
  } catch (error) {
    console.error('\n❌❌❌ Error in email check endpoint:', error);
    res.json({ success: false, error: error.message || 'Failed to check for replies' });
  }
});

app.post('/api/check-email-replies', async (req, res) => {
  try {
    console.log('\n🔍 Manual email check triggered (POST)...');
    const result = await checkForEmailReplies();
    console.log(`\n📊 Check result: ${result} replies found\n`);
    res.json({ success: true, message: 'Email check completed', found: result || 0 });
  } catch (error) {
    console.error('\n❌❌❌ Error in email check endpoint:', error);
    console.error('Stack:', error.stack);
    res.json({ success: false, error: error.message });
  }
});

// Check for email replies every 2 minutes automatically
if (config.SMTP_CONFIG && config.SMTP_CONFIG.auth && config.SMTP_CONFIG.auth.pass) {
  // Run immediately on startup, then every 2 minutes
  setTimeout(async () => {
    console.log('📬 Running initial email check...');
    await checkForEmailReplies();
  }, 5000); // Wait 5 seconds after server starts
  
  setInterval(async () => {
    await checkForEmailReplies();
  }, 120000); // Check every 2 minutes
  console.log('📬 Automatic email reply checking enabled (every 2 minutes)');
  console.log('📬 Manual check available at: http://localhost:3000/api/check-email-replies');
} else {
  console.log('📬 Email reply checking not available - password not configured');
}

// Start Server (only if not in serverless environment)
if (process.env.VERCEL !== '1') {
app.listen(PORT, () => {
  console.log(`Hospital website server running on http://localhost:${PORT}`);
    console.log(`\n📧 Email Status: ${transporter ? '✅ Configured' : '❌ Not configured'}`);
    if (transporter) {
      console.log(`   Sending to: ${config.HOSPITAL_EMAIL}`);
      console.log(`   Test email endpoint: http://localhost:${PORT}/api/test-email`);
    }
});
}

// Export app for Vercel serverless functions
module.exports = app;


