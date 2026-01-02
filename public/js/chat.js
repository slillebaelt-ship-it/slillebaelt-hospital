let currentMessageId = null;
let allMessages = [];

document.addEventListener('DOMContentLoaded', () => {
  // Check if already logged in
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    showChatSection();
  }

  // Login form handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (data.success) {
          localStorage.setItem('authToken', data.token || 'authenticated');
          showChatSection();
        } else {
          showNotification('Invalid', 'error');
        }
      } catch (error) {
        showNotification('Failed', 'error');
        console.error('Login error:', error);
      }
    });
  }

  // Load messages on page load
  if (authToken) {
    loadMessages();
  }
});

function showChatSection() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('chatSection').style.display = 'block';
  document.getElementById('logoutBtn').style.display = 'block';
  loadMessages();
}

function logout() {
  localStorage.removeItem('authToken');
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('chatSection').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'none';
  document.getElementById('loginForm').reset();
}

async function loadMessages() {
  try {
    const response = await fetch('/api/messages');
    const allMessages = await response.json();
    const container = document.getElementById('messagesListContainer');

    if (allMessages.length === 0) {
      container.innerHTML = '<div class="text-center" style="padding: 2rem; color: var(--gray);">No messages yet</div>';
      return;
    }

    // Group messages by conversation_id
    const conversations = {};
    allMessages.forEach(msg => {
      const convId = msg.conversation_id || `single-${msg.id}`;
      if (!conversations[convId]) {
        conversations[convId] = {
          conversation_id: convId,
          messages: [],
          patientName: msg.name,
          patientEmail: msg.email,
          lastMessage: msg,
          hasUnread: false,
          hasReplied: false
        };
      }
      conversations[convId].messages.push(msg);
      if (msg.status === 'unread' && msg.sender_type === 'patient') {
        conversations[convId].hasUnread = true;
      }
      if (msg.sender_type === 'doctor' || msg.status === 'replied') {
        conversations[convId].hasReplied = true;
      }
      if (new Date(msg.created_at) > new Date(conversations[convId].lastMessage.created_at)) {
        conversations[convId].lastMessage = msg;
      }
    });

    // Convert to array and sort
    const convArray = Object.values(conversations);
    convArray.sort((a, b) => {
      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;
      return new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at);
    });

    container.innerHTML = convArray.map(conv => {
      const isActive = currentMessageId == conv.conversation_id;
      const messagePreview = conv.lastMessage.message.length > 60 
        ? conv.lastMessage.message.substring(0, 60) + '...' 
        : conv.lastMessage.message;
      
      const unreadCount = conv.messages.filter(m => m.status === 'unread' && m.sender_type === 'patient').length;
      
      return `
        <div class="message-item ${conv.hasUnread ? 'unread' : ''} ${isActive ? 'active' : ''}" 
             onclick="selectConversation('${conv.conversation_id}')">
          <div class="message-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span class="message-name" style="font-size: 1rem; font-weight: 600;">${escapeHtml(conv.patientName)}</span>
            <span style="font-size: 0.8rem; opacity: 0.7;">${formatDate(conv.lastMessage.created_at)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="message-preview" style="font-size: 0.9rem; color: ${isActive ? 'rgba(255,255,255,0.9)' : 'var(--gray)'}; flex: 1;">${escapeHtml(messagePreview)}</div>
            ${unreadCount > 0 ? `<span style="background: ${isActive ? 'rgba(255,255,255,0.3)' : 'var(--error)'}; color: white; border-radius: 12px; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: bold; margin-left: 0.5rem;">${unreadCount}</span>` : ''}
            ${conv.hasReplied && unreadCount === 0 ? `<span style="color: ${isActive ? 'rgba(255,255,255,0.8)' : 'var(--success)'}; font-size: 0.9rem; margin-left: 0.5rem;">✓</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // If no conversation selected, select the first one
    if (!currentMessageId && convArray.length > 0) {
      selectConversation(convArray[0].conversation_id);
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    document.getElementById('messagesListContainer').innerHTML = 
      '<div class="text-center" style="padding: 2rem; color: var(--error);">Error loading messages</div>';
  }
}

function selectConversation(conversationId) {
  currentMessageId = conversationId;
  loadConversationDetails(conversationId);
  loadMessages(); // Refresh to update active state
}

async function loadConversationDetails(conversationId) {
  try {
    const response = await fetch(`/api/conversation/${conversationId}`);
    const messages = await response.json();
    
    if (messages.length === 0) return;
    
    const patientMessage = messages.find(m => m.sender_type === 'patient') || messages[0];
    
    document.getElementById('noMessageSelected').style.display = 'none';
    const messageView = document.getElementById('messageView');
    if (messageView) {
      messageView.style.display = 'flex';
    }
    
    document.getElementById('messageViewName').textContent = patientMessage.name;
    
    // Only show email if it's not the default hospital email
    const emailElement = document.getElementById('messageViewEmail');
    const emailContainer = document.getElementById('messageViewEmailContainer');
    if (patientMessage.email && patientMessage.email !== 'slillebaelt@gmail.com') {
      emailElement.textContent = patientMessage.email;
      emailElement.href = `mailto:${patientMessage.email}`;
      if (emailContainer) emailContainer.style.display = 'inline';
    } else {
      if (emailContainer) emailContainer.style.display = 'none';
    }
    
    document.getElementById('messageViewDate').textContent = formatDate(patientMessage.created_at);
    
    // Show conversation thread
    const contentDiv = document.getElementById('messageViewContent');
    // Sort messages by date
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    // Sort messages by date
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    contentDiv.innerHTML = messages.map(msg => {
      const isDoctor = msg.sender_type === 'doctor';
      return `
        <div style="margin-bottom: 1rem; display: flex; ${isDoctor ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}">
          <div style="max-width: 70%; padding: 0.75rem 1rem; background: ${isDoctor ? 'var(--primary-blue)' : 'white'}; color: ${isDoctor ? 'white' : 'black'}; border-radius: ${isDoctor ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
            <div style="white-space: pre-wrap; line-height: 1.5; word-wrap: break-word; font-size: 0.95rem;">${escapeHtml(msg.message)}</div>
            <div style="font-size: 0.7rem; opacity: 0.7; margin-top: 0.5rem; text-align: ${isDoctor ? 'right' : 'left'};">${formatDate(msg.created_at)}</div>
          </div>
        </div>
      `;
    }).join('');
    
    // Auto-scroll to bottom to show latest message
    const chatMessageDiv = contentDiv.closest('.chat-message');
    if (chatMessageDiv) {
      setTimeout(() => {
        chatMessageDiv.scrollTop = chatMessageDiv.scrollHeight;
      }, 100);
    }

    // Check if conversation has been replied to
    const hasReplied = messages.some(m => m.sender_type === 'doctor') || 
                       messages.some(m => m.status === 'replied');
    
    // Show/hide reply instructions and buttons based on status
    const replyInstructions = document.getElementById('replyInstructions');
    const alreadyReplied = document.getElementById('alreadyReplied');
    const markRepliedBtn = document.getElementById('markRepliedBtn');
    const markReadBtn = document.getElementById('markReadBtn');
    const statusBadge = document.getElementById('statusBadge');
    const manualReplySection = document.getElementById('manualReplySection');
    const unreadPatientMessages = messages.filter(m => m.status === 'unread' && m.sender_type === 'patient');
    
    // Store current conversation ID for reply
    window.currentConversationIdForReply = conversationId;

    // Show/hide reply form
    const replyFormSection = document.getElementById('replyFormSection');
    if (replyFormSection) {
      replyFormSection.style.display = 'block';
    }
    
    // Clear reply textarea
    const directReplyText = document.getElementById('directReplyText');
    if (directReplyText) {
      directReplyText.value = '';
    }

    if (hasReplied) {
      if (alreadyReplied) {
        alreadyReplied.style.display = 'block';
        const repliedDateEl = document.getElementById('repliedDate');
        const lastReply = messages.find(m => m.sender_type === 'doctor');
        if (repliedDateEl && lastReply) {
          repliedDateEl.textContent = formatDate(lastReply.created_at);
        }
      }
      if (markRepliedBtn) markRepliedBtn.style.display = 'none';
    } else {
      if (alreadyReplied) alreadyReplied.style.display = 'none';
      if (markRepliedBtn) markRepliedBtn.style.display = 'none';
    }
    
    if (markReadBtn) {
      markReadBtn.style.display = unreadPatientMessages.length > 0 ? 'inline-block' : 'none';
    }
    
    if (statusBadge) {
      statusBadge.textContent = hasReplied ? '✓ Replied' : (unreadPatientMessages.length > 0 ? '● New' : '○ Read');
      statusBadge.style.background = hasReplied ? 'var(--success)' : (unreadPatientMessages.length > 0 ? 'var(--error)' : 'var(--gray)');
      statusBadge.style.color = 'white';
    }
  } catch (error) {
    console.error('Error loading conversation:', error);
  }
}

async function markMessageRead() {
  if (!currentMessageId) return;
  
  try {
    // Mark all unread patient messages in this conversation as read
    const response = await fetch(`/api/conversation/${currentMessageId}`);
    const messages = await response.json();
    const unreadMessages = messages.filter(m => m.status === 'unread' && m.sender_type === 'patient');
    
    for (const msg of unreadMessages) {
      await fetch(`/api/messages/${msg.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' })
      });
    }

    showNotification('Read', 'success');
    loadMessages();
    loadConversationDetails(currentMessageId);
  } catch (error) {
    showNotification('Error', 'error');
    console.error('Error:', error);
  }
}

async function markAsReplied() {
  if (!currentMessageId) return;
  
  if (!confirm('Have you replied to this conversation via email? Mark it as replied?')) {
    return;
  }
  
  try {
    // Mark all patient messages in this conversation as replied
    const response = await fetch(`/api/conversation/${currentMessageId}`);
    const messages = await response.json();
    const patientMessages = messages.filter(m => m.sender_type === 'patient');
    
    for (const msg of patientMessages) {
      await fetch(`/api/messages/${msg.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'replied' })
      });
    }

    showNotification('Replied', 'success');
    loadMessages();
    loadConversationDetails(currentMessageId);
  } catch (error) {
    showNotification('Error', 'error');
    console.error('Error:', error);
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
  // Simple notification - you can enhance this
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
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}


// Check for email replies
async function checkForReplies() {
  const btn = document.getElementById('checkRepliesBtn');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '🔄 Checking...';
  
  try {
    const response = await fetch('/api/check-email-replies');
    const data = await response.json();
    
    if (data.success) {
      showNotification('Done', 'success');
      // Reload messages to show new replies
      loadMessages();
      if (currentMessageId) {
        loadConversationDetails(currentMessageId);
      }
    } else {
      showNotification('Error', 'error');
    }
  } catch (error) {
    showNotification('Error', 'error');
    console.error('Error:', error);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Show manual reply section
// Send direct reply from chat interface
async function sendDirectReply(event) {
  event.preventDefault();
  
  const replyTextarea = document.getElementById('directReplyText');
  const replyText = replyTextarea ? replyTextarea.value.trim() : '';
  const conversationId = window.currentConversationIdForReply;
  
  if (!replyText) {
    showNotification('Please enter a reply message', 'error');
    return;
  }
  
  if (!conversationId) {
      showNotification('Select conversation', 'error');
    return;
  }
  
  try {
    showNotification('Sending...', 'success');
    
    const response = await fetch('/api/test-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: replyText
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error || data.details || 'Failed to send reply';
      console.error('Reply error:', errorMsg);
      showNotification(errorMsg, 'error');
      return;
    }
    
    if (data.success) {
      showNotification('Sent', 'success');
      if (replyTextarea) replyTextarea.value = '';
      // Refresh the conversation to show the new reply
      loadMessages();
      loadConversationDetails(conversationId);
    } else {
      const errorMsg = data.error || 'Failed to send reply';
      showNotification(errorMsg, 'error');
    }
  } catch (error) {
    console.error('Error sending reply:', error);
    showNotification('Network error', 'error');
  }
}

function showManualReply() {
  const manualReplySection = document.getElementById('manualReplySection');
  if (manualReplySection) {
    manualReplySection.style.display = manualReplySection.style.display === 'none' ? 'block' : 'none';
  }
}

// Add manual reply
async function addManualReply() {
  const replyTextarea = document.getElementById('manualReplyText');
  const replyText = replyTextarea ? replyTextarea.value.trim() : '';
  const conversationId = window.currentConversationIdForReply;
  
  if (!replyText) {
    showNotification('Please enter a reply message', 'error');
    return;
  }
  
  if (!conversationId) {
      showNotification('Select conversation', 'error');
    return;
  }
  
  try {
    const response = await fetch('/api/test-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: replyText
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMsg = data.error || data.details || 'Failed to save reply';
      console.error('Reply error:', errorMsg);
      showNotification(errorMsg, 'error');
      return;
    }
    
    if (data.success) {
      showNotification('Saved', 'success');
      if (replyTextarea) replyTextarea.value = '';
      const manualReplySection = document.getElementById('manualReplySection');
      if (manualReplySection) manualReplySection.style.display = 'none';
      loadMessages();
      loadConversationDetails(conversationId);
    } else {
      const errorMsg = data.error || 'Failed to save reply';
      showNotification(errorMsg, 'error');
    }
  } catch (error) {
    console.error('Error saving manual reply:', error);
    showNotification('Network error', 'error');
  }
}

// Clear all chat messages
async function clearAllChat() {
  if (!confirm('⚠️ Are you sure you want to delete ALL chat messages?\n\nThis cannot be undone!')) {
    return;
  }
  
  if (!confirm('⚠️⚠️⚠️ FINAL WARNING ⚠️⚠️⚠️\n\nThis will delete ALL messages from ALL patients.\n\nAre you absolutely sure?')) {
    return;
  }
  
  try {
    const response = await fetch('/api/messages/clear-all', {
      method: 'DELETE'
    });
    
    const data = await response.json();
    if (data.success) {
      showNotification('Cleared', 'success');
      currentMessageId = null;
      loadMessages();
      document.getElementById('noMessageSelected').style.display = 'block';
      document.getElementById('messageView').style.display = 'none';
    } else {
      showNotification('Failed', 'error');
    }
  } catch (error) {
    console.error('Error clearing messages:', error);
    showNotification('Error', 'error');
  }
}

// Auto-refresh messages every 30 seconds
setInterval(() => {
  const authToken = localStorage.getItem('authToken');
  if (authToken && document.getElementById('chatSection').style.display !== 'none') {
    loadMessages();
    if (currentMessageId) {
      loadConversationDetails(currentMessageId);
    }
  }
}, 30000);

