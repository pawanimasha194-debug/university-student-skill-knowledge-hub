// Live dashboard reputation summary, backed by the same RPC as leaderboard.
document.addEventListener('DOMContentLoaded', async () => {
  const scoreEl = document.getElementById('dashRepScore');
  const barEl = document.getElementById('dashRepBar');
  const widget = scoreEl && scoreEl.closest('.reputation-widget');
  const rankLink = widget && widget.querySelector('a[href="leaderboard.html"]');
  const badges = document.getElementById('dashBadgesWrap');
  if (!scoreEl) return;
  if (widget) {
    const title = widget.querySelector('.reputation-title span');
    if (title) title.textContent = 'Contribution Points';
  }
  const showError = () => {
    scoreEl.textContent = 'Unavailable';
    if (barEl) barEl.style.width = '0%';
    if (rankLink) rankLink.textContent = 'Leaderboard unavailable';
    if (badges) badges.textContent = 'Check Supabase connection and SQL setup';
  };
  try {
    const client = window.supabaseClient;
    if (!client) return showError();
    const {data: auth, error: authError} = await client.auth.getUser();
    if (authError || !auth?.user) return showError();
    const {data, error} = await client.rpc('campus_leaderboard');
    if (error) throw error;
    const entries = (data || []).sort((a,b) => Number(a.rank)-Number(b.rank));
    const me = entries.find(e => e.id === auth.user.id);
    if (!me) return showError();
    scoreEl.textContent = `${me.score} points`;
    if (barEl) barEl.style.width = '0%'; // no artificial 100-point maximum
    if (rankLink) rankLink.textContent = `#${me.rank} on Campus`;
    if (badges) badges.textContent = `${me.posts_created} posts · ${me.likes_received} likes · ${me.comments_received} comments · ${me.projects_added} projects · ${me.certificates_added} certificates`;
  } catch(err) { console.error('Dashboard metrics error:',err); showError(); }
});
