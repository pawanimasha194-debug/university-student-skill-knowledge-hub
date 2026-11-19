/* UI access indicator only. Database RLS must also protect all write operations. */
(async function(){
 const db=window.supabaseClient;if(!db)return;
 const {data:{user}}=await db.auth.getUser();
 let approved=false;
 if(user){const {data}=await db.from('profiles').select('approval_status').eq('id',user.id).maybeSingle();approved=data?.approval_status==='approved';}
 if(approved)return;
 const bar=document.createElement('div');bar.style.cssText='padding:12px;text-align:center;background:#fff3cd;color:#664d03;position:sticky;top:0;z-index:9999';
 bar.textContent=user?'Your profile is awaiting faculty approval. Public feed is read-only.':'Guest view: public feed is read-only.';
 document.body.prepend(bar);
 document.querySelectorAll('[data-requires-approval]').forEach(el=>{el.hidden=true;});
})();