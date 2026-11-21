/* UniSkill Hub Chat — Supabase only; no demo contacts or fake messages. */
(() => {
  let client, me, peer = null, channel = null, contacts = [], messages = [], refreshTimer = null;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const avatar = p => p.profile_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.full_name || 'Student');
  const notice = text => { const el = $('chatStatus'); if (el) el.textContent = text; };
  async function init() {
    if ($('chatWidget')) return;
    document.body.insertAdjacentHTML('beforeend', `<div class="chat-widget-container" id="chatWidget"><button class="chat-toggle-btn" id="chatToggleBtn" aria-label="Open messages">💬</button><div class="chat-window" id="chatWindow"><div class="chat-header"><span id="chatHeaderTitle">Messages</span><button id="chatCloseBtn" aria-label="Close">×</button></div><div id="chatStatus" class="chat-status" role="status"></div><div class="chat-list-view" id="chatListView"><input id="chatSearch" class="chat-search" placeholder="Search students..." aria-label="Search students"><div id="chatContacts"></div></div><div class="chat-active-view" id="chatActiveView"><div class="chat-active-header"><button class="back-btn" id="chatBackBtn">←</button><img id="chatActiveAvatar" alt=""><div><div id="chatActiveName" style="font-weight:700"></div><small>Student conversation</small></div></div><div class="chat-messages-area" id="chatMessagesArea"></div><form class="chat-input-area" id="chatForm"><input type="text" id="chatInputBox" placeholder="Write a message..." maxlength="4000" required autocomplete="off"><button type="submit" class="chat-send-btn">➤</button></form></div></div></div>`);
    $('chatToggleBtn').onclick = () => $('chatWindow').classList.toggle('active');
    $('chatCloseBtn').onclick = () => $('chatWindow').classList.remove('active');
    $('chatBackBtn').onclick = () => { peer = null; $('chatActiveView').classList.remove('active'); $('chatListView').style.display='block'; $('chatHeaderTitle').textContent='Messages'; stopSubscription(); };
    $('chatSearch').oninput = renderContacts;
    $('chatForm').onsubmit = send;
    client = window.supabaseClient || window.SUPABASE_CONFIG?.client;
    if (!client) { notice('Chat unavailable: Supabase is not connected.'); return; }
    const { data: { user }, error } = await client.auth.getUser();
    if (error || !user) { notice('Please log in to use messages.'); return; }
    me = user.id;
    await loadContacts();
  }
  async function loadContacts() {
    notice('Loading students...');
    const [{data: people,error: pe},{data: msgs,error: meErr}] = await Promise.all([
      client.from('profiles').select('id,full_name,faculty,profile_image').neq('id',me).limit(200),
      client.from('messages').select('sender_id,receiver_id,content,created_at,is_read').or(`sender_id.eq.${me},receiver_id.eq.${me}`).order('created_at',{ascending:false}).limit(500)
    ]);
    if (pe || meErr) { notice('Unable to load chat: ' + (pe || meErr).message); return; }
    const latest = new Map(); const unread = new Map();
    for (const m of msgs || []) { const id = m.sender_id === me ? m.receiver_id : m.sender_id; if (!latest.has(id)) latest.set(id,m); if (m.receiver_id===me && !m.is_read) unread.set(id,(unread.get(id)||0)+1); }
    contacts = (people||[]).map(p=>({...p, last:latest.get(p.id), unread:unread.get(p.id)||0})).sort((a,b)=>new Date(b.last?.created_at||0)-new Date(a.last?.created_at||0));
    notice(''); renderContacts();
  }
  function renderContacts() {
    const term = ($('chatSearch')?.value || '').toLowerCase();
    const filtered = contacts.filter(p=>(p.full_name||'').toLowerCase().includes(term)||(p.faculty||'').toLowerCase().includes(term));
    $('chatContacts').innerHTML = filtered.length ? filtered.map(p=>`<button type="button" class="chat-contact-item" data-id="${esc(p.id)}"><img src="${esc(avatar(p))}" alt=""><span><span class="chat-contact-name">${esc(p.full_name||'Student')}</span><span class="chat-contact-status">${esc(p.last?.content || p.faculty || 'Start a conversation')}</span></span>${p.unread?`<strong class="chat-unread">${p.unread}</strong>`:''}</button>`).join('') : '<p class="chat-empty">No students found.</p>';
    $('chatContacts').querySelectorAll('[data-id]').forEach(el=>el.onclick=()=>openRoom(el.dataset.id));
  }
  async function openRoom(id) {
    peer=contacts.find(p=>p.id===id); if (!peer) return;
    $('chatListView').style.display='none'; $('chatActiveView').classList.add('active');
    $('chatHeaderTitle').textContent=peer.full_name||'Student'; $('chatActiveName').textContent=peer.full_name||'Student'; $('chatActiveAvatar').src=avatar(peer);
    await loadMessages(); subscribe();
  }
  async function loadMessages() {
    if (!peer) return; const id=peer.id;
    const {data,error}=await client.from('messages').select('id,sender_id,receiver_id,content,created_at,is_read').or(`and(sender_id.eq.${me},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${me})`).order('created_at',{ascending:true}).limit(500);
    if (id!==peer?.id) return;
    if(error){notice('Messages error: '+error.message);return;}
    messages=data||[]; renderMessages();
    const unreadIds=messages.filter(m=>m.receiver_id===me&&!m.is_read).map(m=>m.id);
    if(unreadIds.length){const {error:e}=await client.from('messages').update({is_read:true}).in('id',unreadIds).eq('receiver_id',me);if(e) console.warn('Read status:',e.message);}
  }
  function renderMessages() {
    const area=$('chatMessagesArea'); area.replaceChildren();
    if(!messages.length){area.textContent='No messages yet. Say hello!';return;}
    for(const m of messages){const bubble=document.createElement('div');bubble.className='chat-bubble '+(m.sender_id===me?'outgoing':'incoming');const content=document.createElement('div');content.textContent=m.content;const time=document.createElement('div');time.className='chat-time';time.textContent=new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});bubble.append(content,time);area.appendChild(bubble);}area.scrollTop=area.scrollHeight;
  }
  async function send(e) {
    e.preventDefault();if(!peer||!me)return;const input=$('chatInputBox'), value=input.value.trim();if(!value)return;
    const button=$('chatForm').querySelector('button');button.disabled=true;
    const {error}=await client.from('messages').insert({sender_id:me,receiver_id:peer.id,content:value});button.disabled=false;
    if(error){notice('Message not sent: '+error.message);return;}
    input.value='';notice('');await loadMessages();
  }
  function stopSubscription(){if(channel){client.removeChannel(channel);channel=null;}if(refreshTimer){clearInterval(refreshTimer);refreshTimer=null;}}
  function subscribe(){stopSubscription();channel=client.channel('uniskill-chat-'+me+'-'+peer.id).on('postgres_changes',{event:'*',schema:'public',table:'messages'},payload=>{if(!peer)return;const m=payload.new||payload.old;if(m&&(m.sender_id===me||m.receiver_id===me)){loadMessages();loadContactsSilently();}}).subscribe();refreshTimer=setInterval(()=>{if(peer)loadMessages();},15000);}
  async function loadContactsSilently(){const {data}=await client.from('messages').select('sender_id,receiver_id,content,created_at,is_read').or(`sender_id.eq.${me},receiver_id.eq.${me}`).order('created_at',{ascending:false}).limit(500);if(!data)return;const latest=new Map(),unread=new Map();for(const m of data){const id=m.sender_id===me?m.receiver_id:m.sender_id;if(!latest.has(id))latest.set(id,m);if(m.receiver_id===me&&!m.is_read)unread.set(id,(unread.get(id)||0)+1);}contacts=contacts.map(p=>({...p,last:latest.get(p.id),unread:unread.get(p.id)||0})).sort((a,b)=>new Date(b.last?.created_at||0)-new Date(a.last?.created_at||0));renderContacts();}
  document.addEventListener('DOMContentLoaded',init);
})();
