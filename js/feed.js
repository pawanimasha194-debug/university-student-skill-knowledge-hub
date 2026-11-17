/* UniSkill Hub: real Supabase Campus Pulse, no localStorage demo posts */
let sb, me, myProfile, posts=[], likes=[], comments=[], bookmarks=[], notifications=[], profiles={}, filter='foryou', search='', threadId=null, pendingImage=null, editId=null, editImage=null, editRemoveImage=false;
const $=id=>document.getElementById(id);
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const avatar='https://api.dicebear.com/7.x/initials/svg?seed=Student';
const timeAgo=t=>new Date(t).toLocaleString();
function alertFeed(message){ const e=$('pulseFeed');if(e)e.innerHTML=`<div class="pulse-empty" style="padding:24px">${escapeHTML(message)}</div>`; }
function toast(message){let e=document.getElementById('feedStatus');if(!e){e=document.createElement('div');e.id='feedStatus';e.setAttribute('role','status');e.style.cssText='position:fixed;bottom:22px;right:22px;background:var(--card-bg,#fff);color:var(--text-main,#111);padding:12px 18px;border:1px solid var(--border-color,#ddd);border-radius:12px;z-index:99999;max-width:320px';document.body.appendChild(e);}e.textContent=message;}
async function load(){
 const [p,l,c,b]=await Promise.all([
  sb.from('feed_posts').select('id,user_id,content,image_path,created_at').order('created_at',{ascending:false}).limit(100),
  sb.from('feed_likes').select('post_id,user_id'),
  sb.from('feed_comments').select('id,post_id,user_id,content,created_at').order('created_at',{ascending:true}),
   sb.from('feed_bookmarks').select('post_id,user_id').eq('user_id',me.id)
 ]);
 if(p.error||l.error||c.error||b.error){alertFeed('Cannot load Feed: '+(p.error||l.error||c.error||b.error).message);return;}
 posts=p.data||[];likes=l.data||[];comments=c.data||[];bookmarks=b.data||[];
 const ids=[...new Set([...posts,...comments].map(x=>x.user_id).concat(me.id))];
 const pr=await sb.from('profiles').select('id,full_name,profile_image,faculty').in('id',ids);
 profiles={};if(!pr.error)(pr.data||[]).forEach(x=>profiles[x.id]=x);
 profiles[me.id]=profiles[me.id]||myProfile||{};
 render();
}
function person(id){const p=profiles[id]||{};return {name:p.full_name||'Student',image:p.profile_image||avatar,faculty:p.faculty||''};}
function render(){
 let list=posts.filter(p=>{
  if(filter==='bookmarked')return bookmarks.some(b=>b.post_id===p.id);
  if(!['foryou','following','bookmarked'].includes(filter))return false;
  if(filter==='following')return p.user_id===me.id;
  return true;
 }).filter(p=>!search||p.content.toLowerCase().includes(search)||person(p.user_id).name.toLowerCase().includes(search));
 const e=$('pulseFeed');if(!e)return;
 if(!list.length){e.innerHTML='<div class="pulse-empty" style="padding:35px;text-align:center">No posts here yet. Be the first to share!</div>';return;}
 e.innerHTML=list.map(postHTML).join('');
}
function imageUrl(path){if(!path)return '';return sb.storage.from('feed-images').getPublicUrl(path).data.publicUrl;}
function imageMarkup(path){return path?`<img src="${escapeHTML(imageUrl(path))}" alt="Post attachment" loading="lazy" style="display:block;width:100%;max-height:440px;object-fit:contain;border-radius:12px;margin:12px 0;background:var(--card-bg,#eee)">`:'';}
function postHTML(p){const a=person(p.user_id),mine=p.user_id===me.id,liked=likes.some(l=>l.post_id===p.id&&l.user_id===me.id),count=likes.filter(l=>l.post_id===p.id).length,n=comments.filter(c=>c.post_id===p.id).length,saved=bookmarks.some(b=>b.post_id===p.id);
 return `<article class="pulse-post" data-id="${p.id}"><div class="pulse-post-head"><img class="post-avatar" alt="" src="${escapeHTML(a.image)}"><div class="post-main"><div class="post-meta"><span class="post-author">${escapeHTML(a.name)}</span><span class="post-dot">·</span><span class="post-time">${escapeHTML(timeAgo(p.created_at))}</span></div><div style="font-size:12px;color:var(--text-muted)">${escapeHTML(a.faculty)}</div><div class="post-content" style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHTML(p.content)}</div>${imageMarkup(p.image_path)}<div class="post-actions"><button class="post-action-btn ${liked?'liked':''}" data-act="like" data-id="${p.id}">♥ ${count}</button><button class="post-action-btn" data-act="comments" data-id="${p.id}">💬 ${n}</button><button class="post-action-btn ${saved?'saved':''}" data-act="bookmark" data-id="${p.id}" aria-pressed="${saved}">${saved?'🔖 Saved':'🔖 Save'}</button>${mine?`<button class="post-action-btn" data-act="edit" data-id="${p.id}">✏️ Edit</button><button class="post-action-btn" data-act="delete" data-id="${p.id}">🗑 Delete</button>`:''}</div></div></div></article>`;
}
function validateImage(file){if(!file)return false;if(!['image/jpeg','image/png','image/webp'].includes(file.type)){toast('Choose JPG, PNG or WEBP');return false;}if(file.size>3*1024*1024){toast('Image must be 3 MB or smaller');return false;}return true;}
function previewFile(file,target){const e=$(target);if(!e)return;e.replaceChildren();if(!file){e.style.display='none';return;}const img=document.createElement('img');img.alt='Selected image';img.style.cssText='max-width:100%;max-height:280px;border-radius:12px;object-fit:contain';const url=URL.createObjectURL(file);img.src=url;img.onload=()=>URL.revokeObjectURL(url);e.appendChild(img);e.style.display='block';}
async function uploadImage(file){const ext=({ 'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type];const path=`${me.id}/${crypto.randomUUID()}.${ext}`;const {error}=await sb.storage.from('feed-images').upload(path,file,{contentType:file.type,upsert:false});if(error)throw error;return path;}
async function removeImage(path){if(path&&path.startsWith(me.id+'/')){const {error}=await sb.storage.from('feed-images').remove([path]);if(error)toast('Old photo cleanup failed: '+error.message);}}
async function submitPost(){if(!me){toast('Please log in');return;}const t=$('composerText'),content=t.value.trim();if((!content&&!pendingImage)||content.length>280){toast('Write up to 280 characters or add a photo');return;}const btn=$('composerPostBtn');btn.disabled=true;let path=null;
 try{if(pendingImage)path=await uploadImage(pendingImage);const {error}=await sb.from('feed_posts').insert({user_id:me.id,content,image_path:path});if(error)throw error;t.value='';pendingImage=null;$('feedImageInput').value='';previewFile(null,'composerAttachPreview');updateCharCount();toast('Post published');await load();}
 catch(err){if(path)await removeImage(path);toast('Post failed: '+err.message);}finally{btn.disabled=false;}}
function openEditPost(id){const p=posts.find(x=>x.id===id&&x.user_id===me.id);if(!p)return;editId=id;editImage=null;editRemoveImage=false;$('feedEditText').value=p.content;$('feedEditImageInput').value='';const e=$('feedEditImagePreview');e.innerHTML=p.image_path?imageMarkup(p.image_path):'';$('feedEditModal').style.display='flex';}
function closeEditPost(){editId=null;editImage=null;editRemoveImage=false;$('feedEditModal').style.display='none';}
async function saveEditPost(){const p=posts.find(x=>x.id===editId&&x.user_id===me.id);if(!p)return;const content=$('feedEditText').value.trim();if((!content&&!editImage&&(!p.image_path||editRemoveImage))||content.length>280){toast('Write up to 280 characters or keep a photo');return;}const btn=$('feedSaveEditBtn');btn.disabled=true;let newPath=null;
 try{if(editImage)newPath=await uploadImage(editImage);const image_path=newPath||(editRemoveImage?null:p.image_path);const {data,error}=await sb.from('feed_posts').update({content,image_path}).eq('id',p.id).eq('user_id',me.id).select('id').single();if(error)throw error;if(!data)throw new Error('Post update was not permitted');if(p.image_path&&p.image_path!==image_path)await removeImage(p.image_path);closeEditPost();toast('Post updated');await load();}
 catch(err){if(newPath)await removeImage(newPath);toast('Edit failed: '+err.message);}finally{btn.disabled=false;}}
function updateCharCount(){const t=$('composerText');if($('composerCharCount'))$('composerCharCount').textContent=(t?.value.length||0)+' / 280';}
function focusComposer(){$('composerText')?.focus();}
function filterFeedBySearch(value){search=(value||'').trim().toLowerCase();render();}
async function toggleLike(id){const existing=likes.find(l=>l.post_id===id&&l.user_id===me.id);
 const q=existing?sb.from('feed_likes').delete().eq('post_id',id).eq('user_id',me.id):sb.from('feed_likes').insert({post_id:id,user_id:me.id});
 const {error}=await q;if(error)toast(error.message);else {await load();await loadFeedNotifications();}}
async function toggleBookmark(id){
 const saved=bookmarks.some(b=>b.post_id===id);
 const q=saved?sb.from('feed_bookmarks').delete().eq('post_id',id).eq('user_id',me.id):sb.from('feed_bookmarks').insert({post_id:id,user_id:me.id});
 const {error}=await q;if(error){toast('Bookmark failed: '+error.message);return;}
 toast(saved?'Removed from saved posts':'Post saved');await load();
}
async function loadFeedNotifications(){
 const {data,error}=await sb.from('feed_notifications').select('id,actor_id,post_id,kind,is_read,created_at').eq('recipient_id',me.id).order('created_at',{ascending:false}).limit(100);
 if(error){toast('Notifications failed: '+error.message);return;}
 notifications=data||[];
 const count=notifications.filter(n=>!n.is_read).length,el=$('feedUnreadCount');
 if(el){el.textContent=count>99?'99+':String(count);el.style.display=count?'inline':'none';}
 const actorIds=[...new Set(notifications.map(n=>n.actor_id))].filter(id=>!profiles[id]);
 if(actorIds.length){const r=await sb.from('profiles').select('id,full_name,profile_image,faculty').in('id',actorIds);if(!r.error)(r.data||[]).forEach(p=>profiles[p.id]=p);}
 renderFeedNotifications();
}
function renderFeedNotifications(){
 const el=$('feedNotificationsList');if(!el)return;
 if(!notifications.length){el.innerHTML='<p style="padding:16px">No notifications yet.</p>';return;}
 el.innerHTML=notifications.map(n=>`<div style="padding:12px;border-bottom:1px solid var(--border-color,#ddd);${n.is_read?'opacity:.7;':'font-weight:600;'}"><div>${escapeHTML(person(n.actor_id).name)} ${n.kind==='like'?'liked':'commented on'} your post.</div><small>${escapeHTML(timeAgo(n.created_at))}</small> <button class="btn btn-outline btn-sm" data-notification-post="${n.post_id}" data-notification-id="${n.id}" style="margin-left:8px">View post</button>${n.is_read?'':` <button class="btn btn-outline btn-sm" data-notification-read="${n.id}">Mark read</button>`}</div>`).join('');
}
async function markNotificationRead(id){
 const {error}=await sb.from('feed_notifications').update({is_read:true}).eq('id',id).eq('recipient_id',me.id);
 if(error)toast(error.message);else await loadFeedNotifications();
}
async function markAllFeedRead(){
 const {error}=await sb.from('feed_notifications').update({is_read:true}).eq('recipient_id',me.id).eq('is_read',false);
 if(error)toast(error.message);else await loadFeedNotifications();
}
async function openFeedNotifications(){await loadFeedNotifications();$('feedNotificationsModal').style.display='flex';}
function closeFeedNotifications(){$('feedNotificationsModal').style.display='none';}
async function deletePost(id){if(!confirm('Delete your post and its comments?'))return;const {error}=await sb.from('feed_posts').delete().eq('id',id).eq('user_id',me.id);if(error)toast(error.message);else {const old=posts.find(p=>p.id===id);if(old?.image_path)await removeImage(old.image_path);toast('Post deleted');await load();}}
function openThread(id){threadId=id;const p=posts.find(x=>x.id===id);if(!p)return;
 const box=$('threadContent');box.innerHTML=postHTML(p)+`<div style="padding:16px;font-weight:700">Comments</div>`+comments.filter(c=>c.post_id===id).map(c=>{const a=person(c.user_id);return `<div class="pulse-post"><div class="post-meta"><strong>${escapeHTML(a.name)}</strong> · ${escapeHTML(timeAgo(c.created_at))}</div><div class="post-content">${escapeHTML(c.content)}</div>${c.user_id===me.id?`<button class="post-action-btn" data-act="delete-comment" data-id="${c.id}">Delete comment</button>`:''}</div>`;}).join('');
 $('threadModal').style.display='flex';}
function closeThread(){threadId=null;$('threadModal').style.display='none';}
async function submitReply(){if(!threadId)return;const t=$('threadReplyText'),content=t.value.trim();if(!content||content.length>280){toast('Write 1–280 characters');return;}
 const btn=$('threadReplyBtn');btn.disabled=true;const {error}=await sb.from('feed_comments').insert({post_id:threadId,user_id:me.id,content});btn.disabled=false;
 if(error){toast(error.message);return;}t.value='';const id=threadId;await load();openThread(id);}
async function deleteComment(id){const {error}=await sb.from('feed_comments').delete().eq('id',id).eq('user_id',me.id);if(error)toast(error.message);else {const post=threadId;await load();if(post)openThread(post);}}
async function init(){sb=window.supabaseClient;if(!sb){alertFeed('Supabase configuration not loaded');return;}
 const {data:{user},error}=await sb.auth.getUser();if(error||!user){alertFeed('Log in to view the student Feed.');return;}me=user;
 const {data:profile}=await sb.from('profiles').select('id,full_name,profile_image,faculty').eq('id',me.id).maybeSingle();myProfile=profile||{};
 const a=person(me.id);for(const id of ['pulseUserAvatar','composerAvatar','threadReplyAvatar'])if($(id))$(id).src=myProfile.profile_image||avatar;
 if($('pulseUserName'))$('pulseUserName').textContent=myProfile.full_name||'Student';
 if($('pulseUserHandle'))$('pulseUserHandle').textContent='@'+(myProfile.full_name||'student').toLowerCase().replace(/[^a-z0-9]/g,'');
 $('composerText')?.addEventListener('input',updateCharCount);
 $('feedImageInput')?.addEventListener('change',e=>{const file=e.target.files?.[0];pendingImage=file&&validateImage(file)?file:null;if(!pendingImage)e.target.value='';previewFile(pendingImage,'composerAttachPreview');});
 $('feedEditImageInput')?.addEventListener('change',e=>{const file=e.target.files?.[0];editImage=file&&validateImage(file)?file:null;if(!editImage)e.target.value='';if(editImage){editRemoveImage=false;previewFile(editImage,'feedEditImagePreview');}});
 $('feedRemoveImageBtn')?.addEventListener('click',()=>{editRemoveImage=true;editImage=null;$('feedEditImageInput').value='';$('feedEditImagePreview').innerHTML='';});
 $('feedSaveEditBtn')?.addEventListener('click',saveEditPost);
 $('pulseFeed')?.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const id=b.dataset.id;if(b.dataset.act==='like')await toggleLike(id);if(b.dataset.act==='bookmark')await toggleBookmark(id);if(b.dataset.act==='comments')openThread(id);if(b.dataset.act==='delete')await deletePost(id);if(b.dataset.act==='edit')openEditPost(id);});
 $('threadContent')?.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(b?.dataset.act==='bookmark')await toggleBookmark(b.dataset.id);if(b?.dataset.act==='delete-comment')await deleteComment(b.dataset.id);if(b?.dataset.act==='edit')openEditPost(b.dataset.id);});
 $('pulseFilterNav')?.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b)return;const f=b.dataset.filter;if(!['foryou','following','bookmarked'].includes(f)){toast('This filter will be available in the next Feed update');return;}filter=f;document.querySelectorAll('.pulse-filter-btn').forEach(x=>x.classList.toggle('active',x===b));render();});
 document.querySelectorAll('.composer-tool-btn').forEach(b=>b.addEventListener('click',()=>toast('Attachments and polls are planned for the next update')));
 if($('trendingList'))$('trendingList').innerHTML='<p style="padding:12px;color:var(--text-muted)">Trending topics coming soon</p>';
 if($('whoToFollowList'))$('whoToFollowList').innerHTML='<p style="padding:12px;color:var(--text-muted)">Student suggestions coming soon</p>';
  $('feedNotificationsToggle')?.addEventListener('click',openFeedNotifications);
  $('feedMarkAllRead')?.addEventListener('click',markAllFeedRead);
  $('feedNotificationsList')?.addEventListener('click',async e=>{
   const b=e.target.closest('button');if(!b)return;
   if(b.dataset.notificationRead){await markNotificationRead(b.dataset.notificationRead);return;}
   if(b.dataset.notificationPost){
    const id=b.dataset.notificationPost;
    await markNotificationRead(b.dataset.notificationId);
    closeFeedNotifications();
    if(!posts.some(p=>p.id===id)){toast('This post is no longer available');return;}
    openThread(id);
   }
  });
  await load();await loadFeedNotifications();}

document.addEventListener('DOMContentLoaded',init);
