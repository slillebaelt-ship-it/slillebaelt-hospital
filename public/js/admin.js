// Admin Dashboard functionality

let currentTab = 'patients';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
  const isAuthenticated = await checkAuth();
  
  if (isAuthenticated) {
    showDashboard();
  } else {
    showLogin();
  }
  
  // Login form handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      try {
        await login(username, password);
        showDashboard();
      } catch (error) {
        console.error('Login error:', error);
      }
    });
  }
  
  // Visit form handler
  const visitForm = document.getElementById('visitForm');
  if (visitForm) {
    visitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = {
        patient_id: document.getElementById('visitPatientId').value,
        visit_date: document.getElementById('visitDate').value,
        department: document.getElementById('visitDepartment').value,
        doctor_name: document.getElementById('visitDoctor').value,
        notes: document.getElementById('visitNotes').value || ''
      };
      
      try {
        await recordVisit(formData);
        visitForm.reset();
        loadVisits();
      } catch (error) {
        console.error('Visit recording error:', error);
      }
    });
  }
  
  // Doctor form handler
  const doctorForm = document.getElementById('doctorForm');
  if (doctorForm) {
    doctorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const doctorId = document.getElementById('doctorId').value;
      const formData = {
        name: document.getElementById('doctorName').value,
        specialization: document.getElementById('doctorSpecialization').value,
        department: document.getElementById('doctorDepartment').value,
        phone: '',
        email: document.getElementById('doctorEmail').value || '',
        bio: document.getElementById('doctorBio').value || '',
        image_url: document.getElementById('doctorImageUrl').value || ''
      };
      
      try {
        if (doctorId) {
          // Update doctor
          const response = await fetch(`/api/doctors/${doctorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const data = await response.json();
          if (data.success) {
            showNotification('Doctor updated successfully!', 'success');
            closeDoctorModal();
            loadDoctors();
          }
        } else {
          // Add doctor
          const response = await fetch('/api/doctors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const data = await response.json();
          if (data.success) {
            showNotification('Doctor added successfully!', 'success');
            closeDoctorModal();
            loadDoctors();
          }
        }
      } catch (error) {
        showNotification('Error saving doctor', 'error');
        console.error('Doctor save error:', error);
      }
    });
  }
  
  // Search patients
  const searchPatients = document.getElementById('searchPatients');
  if (searchPatients) {
    searchPatients.addEventListener('input', (e) => {
      filterPatients(e.target.value);
    });
  }
});

function showLogin() {
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('dashboardSection').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
  document.getElementById('logoutBtn').style.display = 'block';
  
  loadStats();
  loadPatients();
  loadDoctors();
  loadAppointments();
  loadMessages();
  loadVisits();
}

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    const stats = await response.json();
    
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = `
      <div class="stat-card">
        <h3>${stats.totalPatients || 0}</h3>
        <p data-translate="totalPatients">Total Patients</p>
      </div>
      <div class="stat-card">
        <h3>${stats.totalVisits || 0}</h3>
        <p data-translate="totalVisits">Total Visits</p>
      </div>
      <div class="stat-card">
        <h3>${stats.pendingAppointments || 0}</h3>
        <p data-translate="pendingAppointments">Pending Appointments</p>
      </div>
      <div class="stat-card">
        <h3>${stats.totalDoctors || 0}</h3>
        <p data-translate="totalDoctors">Total Doctors</p>
      </div>
      <div class="stat-card">
        <h3>${stats.unreadMessages || 0}</h3>
        <p>Unread Messages</p>
      </div>
    `;
    
    // Re-translate after updating content
    if (window.langManager) {
      langManager.translatePage();
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadPatients() {
  try {
    const patients = await getPatients();
    const tbody = document.getElementById('patientsTableBody');
    
    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" data-translate="noRecords">No records found</td></tr>`;
      if (window.langManager) langManager.translatePage();
      return;
    }
    
    tbody.innerHTML = patients.map(patient => `
      <tr>
        <td>${patient.patient_id}</td>
        <td>${patient.name}</td>
        <td>${patient.age}</td>
        <td>${patient.gender}</td>
        <td>${patient.phone}</td>
        <td>${formatDate(patient.created_at)}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading patients:', error);
  }
}

let allPatients = [];
async function filterPatients(searchTerm) {
  if (!allPatients.length) {
    allPatients = await getPatients();
  }
  
  const filtered = allPatients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );
  
  const tbody = document.getElementById('patientsTableBody');
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" data-translate="noRecords">No records found</td></tr>`;
    if (window.langManager) langManager.translatePage();
    return;
  }
  
  tbody.innerHTML = filtered.map(patient => `
    <tr>
      <td>${patient.patient_id}</td>
      <td>${patient.name}</td>
      <td>${patient.age}</td>
      <td>${patient.gender}</td>
      <td>${patient.phone}</td>
      <td>${formatDate(patient.created_at)}</td>
    </tr>
  `).join('');
}

async function loadDoctors() {
  try {
    const doctors = await getDoctors();
    const tbody = document.getElementById('doctorsTableBody');
    
    if (doctors.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" data-translate="noRecords">No records found</td></tr>`;
      if (window.langManager) langManager.translatePage();
      return;
    }
    
    tbody.innerHTML = doctors.map(doctor => `
      <tr>
        <td>${doctor.name}</td>
        <td>${doctor.specialization}</td>
        <td>${doctor.department}</td>
        <td>${doctor.email || '-'}</td>
        <td>
          <button class="btn btn-primary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="editDoctor(${doctor.id})" data-translate="editDoctor">Edit</button>
          <button class="btn btn-danger" style="padding: 0.5rem 1rem;" onclick="deleteDoctor(${doctor.id})" data-translate="deleteDoctor">Delete</button>
        </td>
      </tr>
    `).join('');
    
    if (window.langManager) langManager.translatePage();
  } catch (error) {
    console.error('Error loading doctors:', error);
  }
}

async function loadAppointments() {
  try {
    const response = await fetch('/api/appointments');
    const appointments = await response.json();
    const tbody = document.getElementById('appointmentsTableBody');
    
    if (appointments.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" data-translate="noRecords">No records found</td></tr>`;
      if (window.langManager) langManager.translatePage();
      return;
    }
    
    tbody.innerHTML = appointments.map(apt => `
      <tr>
        <td>${apt.patient_name}</td>
        <td>${apt.phone}</td>
        <td>${apt.department}</td>
        <td>${apt.doctor_name || '-'}</td>
        <td>${formatDate(apt.appointment_date)}</td>
        <td>${apt.appointment_time}</td>
        <td>
          <select onchange="updateAppointmentStatus(${apt.id}, this.value)" style="padding: 0.25rem;">
            <option value="pending" ${apt.status === 'pending' ? 'selected' : ''} data-translate="pending">Pending</option>
            <option value="confirmed" ${apt.status === 'confirmed' ? 'selected' : ''} data-translate="confirmed">Confirmed</option>
            <option value="completed" ${apt.status === 'completed' ? 'selected' : ''} data-translate="completed">Completed</option>
            <option value="cancelled" ${apt.status === 'cancelled' ? 'selected' : ''} data-translate="cancelled">Cancelled</option>
          </select>
        </td>
        <td>${formatDate(apt.created_at)}</td>
      </tr>
    `).join('');
    
    if (window.langManager) langManager.translatePage();
  } catch (error) {
    console.error('Error loading appointments:', error);
  }
}

async function loadMessages() {
  try {
    const response = await fetch('/api/messages');
    const messages = await response.json();
    const tbody = document.getElementById('messagesTableBody');
    
    if (messages.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" data-translate="noRecords">No messages found</td></tr>`;
      if (window.langManager) window.langManager.translatePage();
      return;
    }
    
    tbody.innerHTML = messages.map(msg => {
      const statusBadge = msg.status === 'unread' 
        ? '<span style="background: var(--error); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">Unread</span>'
        : '<span style="background: var(--success); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.85rem;">Replied</span>';
      
      const messagePreview = msg.message.length > 100 
        ? msg.message.substring(0, 100) + '...' 
        : msg.message;
      
      // Escape for HTML and JavaScript
      const escapedName = msg.name.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
      const escapedEmail = msg.email.replace(/'/g, "&#39;").replace(/"/g, "&quot;");
      const escapedMessage = msg.message.replace(/'/g, "&#39;").replace(/"/g, "&quot;").replace(/\n/g, ' ');
      
      return `
      <tr style="${msg.status === 'unread' ? 'background: #fff3cd;' : ''}">
        <td><strong>${msg.name}</strong></td>
        <td><a href="mailto:${msg.email}" style="color: var(--primary-blue);">${msg.email}</a></td>
        <td style="max-width: 300px;">${messagePreview}</td>
        <td>${statusBadge}</td>
        <td>${formatDate(msg.created_at)}</td>
        <td>
          <button class="btn btn-primary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="openMessageReply(${msg.id}, '${escapedName}', '${escapedEmail}', '${escapedMessage}')">Reply</button>
          ${msg.status === 'unread' ? `<button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="markMessageRead(${msg.id})">Mark Read</button>` : ''}
        </td>
      </tr>
    `;
    }).join('');
    
    if (window.langManager) window.langManager.translatePage();
  } catch (error) {
    console.error('Error loading messages:', error);
  }
}

function openMessageReply(messageId, name, email, originalMessage) {
  // Decode HTML entities
  const decodedName = name.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  const decodedEmail = email.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  const decodedMessage = originalMessage.replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  
  document.getElementById('replyMessageId').value = messageId;
  document.getElementById('replyFromName').textContent = decodedName;
  document.getElementById('replyFromEmail').textContent = decodedEmail;
  document.getElementById('replyOriginalMessage').textContent = decodedMessage;
  document.getElementById('adminReply').value = '';
  document.getElementById('messageReplyModal').classList.add('active');
}

function closeMessageReplyModal() {
  document.getElementById('messageReplyModal').classList.remove('active');
  document.getElementById('messageReplyForm').reset();
}

async function markMessageRead(messageId) {
  try {
    const response = await fetch(`/api/messages/${messageId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'read' })
    });
    const data = await response.json();
    if (data.success) {
      showNotification('Message marked as read', 'success');
      loadMessages();
      loadStats();
    }
  } catch (error) {
    showNotification('Error updating message status', 'error');
    console.error('Error:', error);
  }
}

async function loadVisits() {
  try {
    const response = await fetch('/api/visits');
    const visits = await response.json();
    const tbody = document.getElementById('visitsTableBody');
    
    if (visits.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center" data-translate="noRecords">No records found</td></tr>`;
      if (window.langManager) langManager.translatePage();
      return;
    }
    
    tbody.innerHTML = visits.map(visit => `
      <tr>
        <td>${visit.patient_id}</td>
        <td>${formatDate(visit.visit_date)}</td>
        <td>${visit.department}</td>
        <td>${visit.doctor_name}</td>
        <td>${visit.notes || '-'}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading visits:', error);
  }
}

function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });
  
  // Remove active class from all buttons
  document.querySelectorAll('[id^="tab"]').forEach(btn => {
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  });
  
  // Show selected tab
  document.getElementById(`${tabName}Tab`).style.display = 'block';
  document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.remove('btn-secondary');
  document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('btn-primary');
  
  currentTab = tabName;
}

function showDoctorModal(doctorId = null) {
  const modal = document.getElementById('doctorModal');
  const form = document.getElementById('doctorForm');
  const title = document.getElementById('doctorModalTitle');
  
  if (doctorId) {
    // Edit mode - load doctor data
    getDoctors().then(doctors => {
      const doctor = doctors.find(d => d.id === doctorId);
      if (doctor) {
        document.getElementById('doctorId').value = doctor.id;
        document.getElementById('doctorName').value = doctor.name;
        document.getElementById('doctorSpecialization').value = doctor.specialization;
        document.getElementById('doctorDepartment').value = doctor.department;
        document.getElementById('doctorEmail').value = doctor.email || '';
        document.getElementById('doctorBio').value = doctor.bio || '';
        document.getElementById('doctorImageUrl').value = doctor.image_url || '';
        title.textContent = window.langManager ? window.langManager.getTranslation('editDoctor') : 'Edit Doctor';
      }
    });
  } else {
    // Add mode
    form.reset();
    document.getElementById('doctorId').value = '';
    title.textContent = window.langManager ? window.langManager.getTranslation('addDoctor') : 'Add Doctor';
  }
  
  modal.classList.add('active');
  if (window.langManager) langManager.translatePage();
}

function closeDoctorModal() {
  document.getElementById('doctorModal').classList.remove('active');
  document.getElementById('doctorForm').reset();
}

function editDoctor(doctorId) {
  showDoctorModal(doctorId);
}

async function deleteDoctor(doctorId) {
  if (!confirm('Are you sure you want to delete this doctor?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/doctors/${doctorId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (data.success) {
      showNotification('Doctor deleted successfully!', 'success');
      loadDoctors();
    }
  } catch (error) {
    showNotification('Error deleting doctor', 'error');
    console.error('Delete error:', error);
  }
}

async function updateAppointmentStatus(appointmentId, status) {
  try {
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (data.success) {
      showNotification('Appointment status updated!', 'success');
      loadAppointments();
    }
  } catch (error) {
    showNotification('Error updating appointment', 'error');
    console.error('Update error:', error);
  }
}

