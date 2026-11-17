/* Navigation only: no Supabase queries or changes to existing page behavior. */
(function(){
 function start(){
  const nav=document.querySelector('nav.nav-menu');if(!nav||nav.querySelector('.simple-nav-links'))return;
  const prefix=location.pathname.includes('/articles/')||location.pathname.includes('/resources/')?'../':'';
  const link=(href,label)=>`<a href="${prefix+href}" ${location.pathname.endsWith('/'+href)?'class="is-current"':''}>${label}</a>`;
  const drop=(label,items)=>`<div class="simple-drop"><button type="button" aria-expanded="false">${label}</button><div class="simple-drop-panel">${items.map(([href,text])=>link(href,text)).join('')}</div></div>`;
  const wrap=document.createElement('div');wrap.className='simple-nav-links';wrap.id='simpleNavLinks';
  wrap.innerHTML=link('index.html','⌂ Home')+link('dashboard.html','▦ Dashboard')+link('feed.html','◉ Campus Pulse')+drop('Learn',[['resources/resources.html','Study Resources'],['articles/articles.html','Articles'],['tutoring.html','Tutoring'],['academic-communities.html','Courses']])+drop('Connect',[['community.html','Community'],['assignments.html','Teams'],['skills.html','Skills & Network'],['connections.html','Connections']])+drop('More',[['leaderboard.html','Leaderboard'],['notifications.html','Alerts'],['profile.html','My Profile']]);
  const toggle=document.createElement('button');toggle.type='button';toggle.className='simple-mobile-toggle';toggle.textContent='☰ Menu';toggle.setAttribute('aria-controls','simpleNavLinks');toggle.setAttribute('aria-expanded','false');
  toggle.addEventListener('click',()=>{const opened=wrap.classList.toggle('mobile-open');toggle.setAttribute('aria-expanded',String(opened));});
  wrap.addEventListener('click',e=>{const b=e.target.closest('.simple-drop>button');if(!b)return;const d=b.parentElement;const opened=!d.classList.contains('open');wrap.querySelectorAll('.simple-drop').forEach(x=>{x.classList.remove('open');x.querySelector('button').setAttribute('aria-expanded','false')});d.classList.toggle('open',opened);b.setAttribute('aria-expanded',String(opened));});
  const auth=nav.querySelector('.nav-auth-buttons');if(auth){nav.insertBefore(toggle,auth);nav.insertBefore(wrap,auth)}else{nav.append(toggle,wrap)}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
