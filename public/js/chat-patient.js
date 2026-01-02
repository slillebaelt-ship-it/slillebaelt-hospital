let currentConversationId = null;
let patientName = '';
let patientAge = '';

document.addEventListener('DOMContentLoaded', async () => {
  // Check if patient info is stored
  const storedName = localStorage.getItem('patientName');
  const storedAge = localStorage.getItem('patientAge');
  const storedConvId = localStorage.getItem('currentConversationId');
  
  if (storedName && storedAge) {
    patientName = storedName;
    patientAge = storedAge;
    currentConversationId = storedConvId || null;
    showChatSection();
    loadConversations();
  } else {
    showPatientInfoSection();
  }
  
  // Setup form handler
  setupPatientInfoForm();
  
  // Send message form
  const sendMessageForm = document.getElementById('sendMessageForm');
  if (sendMessageForm) {
    sendMessageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const messageInput = document.getElementById('messageInput');
      const message = messageInput.value.trim();
      
      if (!message) {
        showNotification('Enter message', 'error');
        return;
      }
      
      if (!patientName) {
        showNotification('Enter name & age', 'error');
        showPatientInfoSection();
        return;
      }
      
      await sendMessage(message);
      messageInput.value = '';
    });
  }
});

function showPatientInfoSection() {
  const patientInfoSection = document.getElementById('patientInfoSection');
  const chatSection = document.getElementById('chatSection');
  if (patientInfoSection) patientInfoSection.style.display = 'block';
  if (chatSection) chatSection.style.display = 'none';
}

function showChatSection() {
  const patientInfoSection = document.getElementById('patientInfoSection');
  const chatSection = document.getElementById('chatSection');
  if (patientInfoSection) patientInfoSection.style.display = 'none';
  if (chatSection) {
    chatSection.style.display = 'block';
    chatSection.style.visibility = 'visible';
  }
}

function setupPatientInfoForm() {
  const patientInfoForm = document.getElementById('patientInfoForm');
  if (patientInfoForm) {
    patientInfoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const errorDiv = document.getElementById('errorMessage');
      errorDiv.style.display = 'none';
      
      const name = document.getElementById('patientName').value.trim();
      const age = document.getElementById('patientAge').value.trim();
      
      if (!name || !age) {
        errorDiv.textContent = '❌ Please enter both name and age';
        errorDiv.style.display = 'block';
        return;
      }
      
      // Store patient info
      patientName = name;
      patientAge = age;
      localStorage.setItem('patientName', patientName);
      localStorage.setItem('patientAge', patientAge);
      
      // Show chat section
      showChatSection();
      loadConversations();
      showNotification('Connected', 'success');
    });
  }
}

async function loadConversations() {
  if (!patientName) return;
  
  try {
    const response = await fetch(`/api/patient-conversations?name=${encodeURIComponent(patientName)}&age=${encodeURIComponent(patientAge)}`);
    if (!response.ok) {
      throw new Error('Failed to load conversations');
    }
    const conversations = await response.json();
    
    const container = document.getElementById('conversationsList');
    
    if (conversations.length === 0) {
      container.innerHTML = '<p style="color: var(--gray); padding: 1rem;">No requests yet. Start by sending a message!</p>';
      return;
    }
    
    container.innerHTML = conversations.map(conv => {
      const isActive = conv.conversation_id === currentConversationId;
      return `
        <div class="conversation-item ${isActive ? 'active' : ''}" 
             onclick="selectConversation('${conv.conversation_id}')">
          <div style="font-weight: bold;">Conversation</div>
          <div class="conversation-preview">${formatDate(conv.last_message)}</div>
        </div>
      `;
    }).join('');
    
    // If no conversation selected, select the first one
    if (!currentConversationId && conversations.length > 0) {
      selectConversation(conversations[0].conversation_id);
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
}

async function selectConversation(conversationId) {
  currentConversationId = conversationId;
  localStorage.setItem('currentConversationId', conversationId);
  loadConversation();
  loadConversations(); // Refresh to update active state
}

async function loadConversation() {
  const messagesContainer = document.getElementById('chatMessages');
  
  if (!currentConversationId) {
    // Show welcome message when no conversation
    messagesContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--gray);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">💬</div>
        <p>Send a message to get support</p>
      </div>
    `;
    document.getElementById('noConversation').style.display = 'none';
    document.getElementById('conversationView').style.display = 'block';
    return;
  }
  
  try {
    const response = await fetch(`/api/conversation/${currentConversationId}`);
    const messages = await response.json();
    
    document.getElementById('noConversation').style.display = 'none';
    document.getElementById('conversationView').style.display = 'block';
    
    if (messages.length === 0) {
      messagesContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--gray);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">💬</div>
          <p>Send a message to get support</p>
        </div>
      `;
      return;
    }
    
    // Sort messages by date
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    messagesContainer.innerHTML = messages.map(msg => {
      const isPatient = msg.sender_type === 'patient';
      return `
        <div class="message-bubble ${isPatient ? 'patient' : 'doctor'}" style="margin-bottom: 1rem; animation: fadeIn 0.3s ease-in;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <div style="font-weight: bold; font-size: 0.95rem;">
              ${isPatient ? '👤 You' : '👨‍⚕️ Doctor'}
            </div>
            <div class="message-time" style="font-size: 0.8rem; opacity: 0.7;">${formatDate(msg.created_at)}</div>
          </div>
          <div style="white-space: pre-wrap; line-height: 1.5;">${escapeHtml(msg.message)}</div>
        </div>
      `;
    }).join('');
    
    // Show/hide clear button
    const clearBtn = document.getElementById('clearChatBtn');
    if (clearBtn) {
      clearBtn.style.display = messages.length > 0 ? 'inline-block' : 'none';
    }
    
    // Scroll to bottom
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  } catch (error) {
    console.error('Error loading conversation:', error);
  }
}

async function sendMessage(message) {
  if (!patientName) {
    showNotification('Enter name & age', 'error');
    showPatientInfoSection();
    return;
  }
  
  try {
    if (!message || message.trim() === '') {
      showNotification('Enter message', 'error');
      return;
    }
    
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: patientName,
        age: patientAge,
        message: message.trim(),
        conversation_id: currentConversationId || undefined
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `Server error: ${response.status}` }));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success) {
      if (!currentConversationId) {
        // New conversation created
        currentConversationId = data.conversation_id;
        localStorage.setItem('currentConversationId', currentConversationId);
        showNotification('Sent', 'success');
        loadConversations();
      } else {
        showNotification('Sent', 'success');
      }
      loadConversation();
    } else {
      showNotification('Failed', 'error');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    showNotification('Error', 'error');
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 2rem;
    background: ${type === 'success' ? 'var(--success)' : 'var(--error)'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Refresh function (can be called manually)
function refreshChat() {
  if (patientName) {
    loadConversations();
    if (currentConversationId) {
      loadConversation();
    }
    showNotification('Refreshed', 'success');
  }
}

async function clearCurrentConversation() {
  if (!currentConversationId) return;
  
  if (!confirm('Are you sure you want to clear this conversation? This will delete all messages in this chat.')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/conversation/${currentConversationId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      showNotification('Cleared', 'success');
      currentConversationId = null;
      localStorage.removeItem('currentConversationId');
      loadConversations();
      loadConversation(); // Reset to welcome screen
    } else {
      showNotification('Failed', 'error');
    }
  } catch (error) {
    console.error('Error clearing conversation:', error);
    showNotification('Error', 'error');
  }
}

function logout() {
  localStorage.clear();
  patientName = '';
  patientAge = '';
  currentConversationId = null;
  showPatientInfoSection();
  showNotification('Cleared', 'success');
}

// Auto-refresh conversation every 15 seconds
setInterval(() => {
  if (patientName && currentConversationId) {
    loadConversation();
  }
}, 15000);
