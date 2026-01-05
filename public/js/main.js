// Main JavaScript file for hospital website

// API Base URL
const API_BASE = '';

// Utility Functions
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

function formatDateTime(dateString, timeString) {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} ${timeString || ''}`;
}

// Check Authentication
async function checkAuth() {
  try {
    const response = await fetch('/api/check-auth');
    const data = await response.json();
    return data.authenticated;
  } catch (error) {
    return false;
  }
}

// Patient Registration
async function registerPatient(formData) {
  try {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification(data.message || 'Patient registered successfully!', 'success');
      return data;
    } else {
      throw new Error(data.error || 'Registration failed');
    }
  } catch (error) {
    showNotification(error.message || 'Error registering patient', 'error');
    throw error;
  }
}

// Get Patients
async function getPatients() {
  try {
    const response = await fetch('/api/patients');
    return await response.json();
  } catch (error) {
    console.error('Error fetching patients:', error);
    return [];
  }
}

// Get Patient by ID
async function getPatientById(patientId) {
  try {
    const response = await fetch(`/api/patients/${patientId}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching patient:', error);
    return null;
  }
}

// Record Patient Visit
async function recordVisit(visitData) {
  try {
    const response = await fetch('/api/visits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(visitData)
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification(data.message || 'Visit recorded successfully!', 'success');
      return data;
    } else {
      throw new Error(data.error || 'Failed to record visit');
    }
  } catch (error) {
    showNotification(error.message || 'Error recording visit', 'error');
    throw error;
  }
}

// Get Doctors
async function getDoctors() {
  try {
    const response = await fetch('/api/doctors');
    return await response.json();
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return [];
  }
}

// Book Appointment
async function bookAppointment(appointmentData) {
  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appointmentData)
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification(data.message || 'Appointment booked successfully!', 'success');
      return data;
    } else {
      throw new Error(data.error || 'Failed to book appointment');
    }
  } catch (error) {
    showNotification(error.message || 'Error booking appointment', 'error');
    throw error;
  }
}

// Login
async function login(username, password) {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Login successful!', 'success');
      setTimeout(() => {
        window.location.href = '/admin.html';
      }, 1000);
      return data;
    } else {
      throw new Error(data.error || 'Login failed');
    }
  } catch (error) {
    showNotification(error.message || 'Invalid credentials', 'error');
    throw error;
  }
}

// Logout
async function logout() {
  try {
    const response = await fetch('/api/logout', {
      method: 'POST'
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 1000);
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Mobile Menu Toggle
function initMobileMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  if (menuToggle && navLinks) {
    // Function to close menu
    function closeMenu() {
      navLinks.classList.remove('active');
      menuToggle.innerHTML = '☰';
    }
    
    // Toggle menu function
    function toggleMenu() {
      const isActive = navLinks.classList.contains('active');
      if (isActive) {
        closeMenu();
      } else {
        navLinks.classList.add('active');
        menuToggle.innerHTML = '✕';
      }
    }
    
    // Handle hamburger button click
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });
    
    // Close menu when clicking any link - use mousedown for faster response
    navLinks.querySelectorAll('a').forEach(link => {
      // Use mousedown to close before navigation
      link.addEventListener('mousedown', () => {
        closeMenu();
      });
      // Also handle click as backup
      link.addEventListener('click', () => {
        closeMenu();
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (navLinks.classList.contains('active')) {
        // Check if click is outside menu and toggle button
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
          closeMenu();
        }
      }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        closeMenu();
      }
    });
  } else {
    console.log('Menu toggle elements not found:', { menuToggle, navLinks });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Initialize mobile menu
  initMobileMenu();
  
  // Set copyright year in footer
  const yearElement = document.getElementById('currentYear');
  if (yearElement) {
    yearElement.textContent = '2020';
  }
  
  // Handle contact form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const data = Object.fromEntries(formData);
      
      // Validate input
      if (!data.name || !data.name.trim()) {
        showNotification('Please enter your name', 'error');
        return;
      }
      
      if (!data.message || !data.message.trim()) {
        showNotification('Please enter a message', 'error');
        return;
      }
      
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: data.name.trim(),
            message: data.message.trim()
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success) {
          showNotification('Thank you! Your message has been sent to slillebaelt@gmail.com. We will get back to you soon.', 'success');
          contactForm.reset();
        } else {
          throw new Error(result.error || 'Failed to send message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        showNotification(error.message || 'Error sending message. Please check your connection and try again.', 'error');
      }
    });
  }
});

