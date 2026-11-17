/* ============================================================
   Real-Time Chat System (X-Style Floating Widget)
   ============================================================ */

let chatActiveUser = null;
let chatCurrentReceiver = null;
let chatSubscription = null;

// Mock contacts සහ messages (Offline Demo එකට)
const MOCK_CONTACTS = [
  { id: 'u_samudi', name: 'Samudi Wijesinghe', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', faculty: 'Applied Sciences' },
  { id: 'u_kaveen', name: 'Kaveen Perera', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=200&q=80', faculty: 'Computing & IT' },
  { id: 'u_tharushi', name: 'Tharushi Fernando', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', faculty: 'Science' }
];

// Initializer
function initChatSystem() {
  // Create Widget HTML dynamically
  const widgetHTML = `
    <div class="chat-widget-container">
      <button class="chat-toggle-btn" id="chatToggleBtn">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
      </button>
      
      <div class="chat-window" id="chatWindow">
        <div class="chat-header">
          <span id="chatHeaderTitle">Messages</span>
          <button id="chatCloseBtn">✕</button>
        </div>
        
        <!-- Chat List View -->
        <div class="chat-list-view" id="chatListView">
          <!-- Rendered Dynamically -->
        </div>

        <!-- Active Chat View -->
        <div class="chat-active-view" id="chatActiveView">
          <div class="chat-active-header">
            <button class="back-btn" id="chatBackBtn">←</button>
            <img id="chatActiveAvatar" src="" alt="">
            <div>
              <div style="font-weight:700; font-size:14px;" id="chatActiveName">Name</div>
              <div style="font-size:11px; color:var(--success-color);">Online</div>
            </div>
          </div>
          <div class="chat-messages-area" id="chatMessagesArea">
            <!-- Messages -->
          </div>
          <form class="chat-input-area" onsubmit="event.preventDefault(); sendChatMessage();">
            <input type="text" id="chatInputBox" placeholder="Start a new message..." autocomplete="off">
            <button type="submit" class="chat-send-btn">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', widgetHTML);

  // Get Current User
  try {
    if (typeof getActiveStudent === 'function') {
      chatActiveUser = getActiveStudent();
    } else {
      const sess = JSON.parse(localStorage.getItem('uniskill_active_session'));
      chatActiveUser = sess?.profile || sess?.user || { id: 'demo_user', full_name: 'Student' };
    }
  } catch {
    chatActiveUser = { id: 'demo_user', full_name: 'Student' };
  }
  
  // Safety fallback if user object is malformed
  if (!chatActiveUser || !chatActiveUser.id) {
    chatActiveUser = { id: 'demo_user', full_name: 'Student' };
  }

  // Event Listeners
  document.getElementById('chatToggleBtn').addEventListener('click', toggleChatWindow);
  document.getElementById('chatCloseBtn').addEventListener('click', toggleChatWindow);
  document.getElementById('chatBackBtn').addEventListener('click', () => {
    document.getElementById('chatActiveView').classList.remove('active');
    document.getElementById('chatListView').style.display = 'block';
    document.getElementById('chatHeaderTitle').textContent = 'Messages';
    chatCurrentReceiver = null;
  });

  loadChatContacts();
}

function toggleChatWindow() {
  const win = document.getElementById('chatWindow');
  win.classList.toggle('active');
}

function loadChatContacts() {
  const list = document.getElementById('chatListView');
  
  list.innerHTML = MOCK_CONTACTS.map(c => `
    <div class="chat-contact-item" onclick="openChatRoom('${c.id}', '${c.name}', '${c.avatar}')">
      <img src="${c.avatar}" alt="">
      <div>
        <div class="chat-contact-name">${c.name}</div>
        <div class="chat-contact-status">${c.faculty}</div>
      </div>
    </div>
  `).join('');
}

function openChatRoom(receiverId, receiverName, receiverAvatar) {
  chatCurrentReceiver = { id: receiverId, name: receiverName };
  
  document.getElementById('chatListView').style.display = 'none';
  document.getElementById('chatActiveView').classList.add('active');
  document.getElementById('chatHeaderTitle').textContent = receiverName;
  document.getElementById('chatActiveName').textContent = receiverName;
  document.getElementById('chatActiveAvatar').src = receiverAvatar;

  loadChatMessages(receiverId);
}

function loadChatMessages(receiverId) {
  const area = document.getElementById('chatMessagesArea');
  area.innerHTML = ''; // Clear current

  // 1. Supabase එකෙන් Load කිරීම (Live)
  if (window.supabaseClient && window.SUPABASE_CONFIG?.isConfigured() && chatActiveUser.id !== 'demo_user') {
    // Live messages query
    window.supabaseClient
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${chatActiveUser.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${chatActiveUser.id})`)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading messages:", error);
          // Error එකක් ආවොත් Local Storage එකෙන් load කරමු
          loadMockMessages(receiverId);
        } else if (data) {
          renderMessages(data, receiverId);
        }
      });

    // Realtime Listener
    if (chatSubscription) window.supabaseClient.removeChannel(chatSubscription);
    
    chatSubscription = window.supabaseClient.channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const newMsg = payload.new;
        if ((newMsg.sender_id === chatActiveUser.id && newMsg.receiver_id === receiverId) ||
            (newMsg.sender_id === receiverId && newMsg.receiver_id === chatActiveUser.id)) {
           loadChatMessages(receiverId); // Refresh
        }
      })
      .subscribe();

  } else {
    // 2. LocalStorage Mock Messages (Offline Demo)
    loadMockMessages(receiverId);
  }
}

function loadMockMessages(receiverId) {
  const mockMsgs = JSON.parse(localStorage.getItem(`chat_${chatActiveUser.id}_${receiverId}`) || '[]');
  if (mockMsgs.length === 0) {
    const welcome = {
      id: 'm1',
      sender_id: receiverId,
      receiver_id: chatActiveUser.id,
      content: `Hi ${chatActiveUser.full_name?.split(' ')[0] || 'there'}! How can I help you with your studies today?`,
      created_at: new Date().toISOString()
    };
    mockMsgs.push(welcome);
    localStorage.setItem(`chat_${chatActiveUser.id}_${receiverId}`, JSON.stringify(mockMsgs));
  }
  renderMessages(mockMsgs, receiverId);
}

function renderMessages(msgs, receiverId) {
  const area = document.getElementById('chatMessagesArea');
  area.innerHTML = msgs.map(m => {
    const isOutgoing = m.sender_id === chatActiveUser.id;
    const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="chat-bubble ${isOutgoing ? 'outgoing' : 'incoming'}">
        ${m.content}
        <div class="chat-time">${time}</div>
      </div>
    `;
  }).join('');
  
  area.scrollTop = area.scrollHeight;
}

function sendChatMessage() {
  const input = document.getElementById('chatInputBox');
  const text = input.value.trim();
  if (!text || !chatCurrentReceiver) return;

  input.value = '';
  
  // Optimistic UI Update (මුලින්ම UI එකේ පෙන්නමු)
  const tempMsg = {
    sender_id: chatActiveUser.id,
    receiver_id: chatCurrentReceiver.id,
    content: text,
    created_at: new Date().toISOString()
  };
  appendSingleMessageToUI(tempMsg);

  // 1. Live Supabase Insert
  if (window.supabaseClient && window.SUPABASE_CONFIG?.isConfigured() && chatActiveUser.id !== 'demo_user') {
    window.supabaseClient.from('messages').insert([{
      sender_id: chatActiveUser.id,
      receiver_id: chatCurrentReceiver.id,
      content: text
    }]).then(({ error }) => {
       if (error) {
         console.error("Supabase Insert Error:", error);
         // Alert එකක් පෙන්නන්නේ නෑ. Error එකක් ආවොත් Local Storage එකට Save කරමු.
         saveToLocalStorageFallback(text, false); // false = don't append again to UI
       }
    });
  } else {
    // 2. Mock LocalStorage insert
    saveToLocalStorageFallback(text, false);
  }
}

// UI එකට එකපාරටම message එකක් එකතු කරන helper එකක්
function appendSingleMessageToUI(msg) {
  const area = document.getElementById('chatMessagesArea');
  if (!area) return;
  const isOutgoing = msg.sender_id === chatActiveUser.id;
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${isOutgoing ? 'outgoing' : 'incoming'}`;
  bubble.innerHTML = `${msg.content}<div class="chat-time">${time}</div>`;
  
  area.appendChild(bubble);
  area.scrollTop = area.scrollHeight;
}

// LocalStorage එකට Save කරන සහ Auto-reply දෙන function එක
function saveToLocalStorageFallback(text, appendToUIFirst = true) {
  if (!chatCurrentReceiver) return;
  const key = `chat_${chatActiveUser.id}_${chatCurrentReceiver.id}`;
  let mockMsgs = [];
  try {
    mockMsgs = JSON.parse(localStorage.getItem(key) || '[]');
  } catch (e) {}

  // දැනටමත් UI එකේ තියෙන නිසා appendToUIFirst එක false කරලා තියෙන්නේ
  if (appendToUIFirst) {
    const newMsg = {
      id: 'm_' + Date.now(),
      sender_id: chatActiveUser.id,
      receiver_id: chatCurrentReceiver.id,
      content: text,
      created_at: new Date().toISOString()
    };
    mockMsgs.push(newMsg);
    appendSingleMessageToUI(newMsg);
  } else {
    mockMsgs.push({
      id: 'm_' + Date.now(),
      sender_id: chatActiveUser.id,
      receiver_id: chatCurrentReceiver.id,
      content: text,
      created_at: new Date().toISOString()
    });
  }

  localStorage.setItem(key, JSON.stringify(mockMsgs));

  // Auto-reply (Demo එකට ලස්සන කරන්න)
  setTimeout(() => {
    // වෙනත් කෙනෙක්ට මාරු වෙලා නම් reply එක එවන්නේ නෑ
    if (!chatCurrentReceiver || chatCurrentReceiver.id !== key.split('_')[2]) return; 

    const replies = ["Sure, I can share those notes with you!", "Let's meet at the library at 4 PM?", "That sounds like a great plan for the project.", "I'll check and let you know soon."];
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    
    let currentMsgs = JSON.parse(localStorage.getItem(key) || '[]');
    const replyMsg = {
      id: 'm_' + Date.now() + '_r',
      sender_id: chatCurrentReceiver.id,
      receiver_id: chatActiveUser.id,
      content: randomReply,
      created_at: new Date().toISOString()
    };
    currentMsgs.push(replyMsg);
    localStorage.setItem(key, JSON.stringify(currentMsgs));
    
    // UI එක Update කරමු
    appendSingleMessageToUI(replyMsg);
  }, 1500); 
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', initChatSystem);