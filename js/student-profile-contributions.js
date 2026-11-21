/* UniSkill Hub: public student contributions from Supabase (no localStorage fallback). */
async function loadStudentContributions(studentId) {
  const resourcesBox = document.getElementById('studentResourcesContainer');
  const articlesBox = document.getElementById('studentArticlesContainer');
  if (!studentId) {
    for (const box of [resourcesBox, articlesBox]) if (box) box.textContent = 'Student profile not found.';
    return;
  }
  const db = window.supabaseClient;
  if (!db) {
    for (const box of [resourcesBox, articlesBox]) if (box) box.textContent = 'Database connection unavailable.';
    return;
  }
  async function fill(box, table, href, empty) {
    if (!box) return;
    box.textContent = 'Loading...';
    try {
      const { data, error } = await db.from(table).select('id,title,created_at').eq('user_id',studentId).order('created_at',{ascending:false}).limit(12);
      if (error) throw error;
      box.replaceChildren();
      if (!data?.length) { box.textContent = empty; return; }
      for (const item of data) {
        const row = document.createElement('div');
        row.style.cssText = 'padding:10px 0;border-bottom:1px solid var(--border-color,#e5e7eb)';
        const a = document.createElement('a');
        a.href = href + encodeURIComponent(item.id);
        a.textContent = item.title || 'Untitled';
        a.style.cssText = 'font-size:13.5px;font-weight:600';
        row.append(a);
        box.append(row);
      }
    } catch(err) {
      console.error('[Student profile] '+table,err);
      box.textContent = 'Could not load '+table+'. Please refresh or check access permissions.';
    }
  }
  await Promise.all([
    fill(resourcesBox,'resources','resources/resource-details.html?id=','No shared resources uploaded yet.'),
    fill(articlesBox,'articles','articles/article-details.html?id=','No knowledge articles published yet.')
  ]);
}
