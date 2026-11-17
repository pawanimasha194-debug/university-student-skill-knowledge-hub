/* Profile picture upload: authenticated Supabase Storage + own profile row. */
(function(){
  const MAX_SIZE=3*1024*1024;
  document.addEventListener('DOMContentLoaded',()=>{
    const input=document.getElementById('profilePhotoFile');
    const status=document.getElementById('profilePhotoStatus');
    if(!input)return;
    input.addEventListener('change',async()=>{
      const file=input.files&&input.files[0];if(!file)return;
      const report=(msg)=>{if(status)status.textContent=msg;};
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)){report('Use JPG, PNG or WebP.');input.value='';return;}
      if(file.size>MAX_SIZE){report('Image must be smaller than 3 MB.');input.value='';return;}
      const client=window.supabaseClient||window.SUPABASE_CONFIG?.client;
      if(!client){report('Connect Supabase and sign in before uploading.');return;}
      input.disabled=true;report('Uploading photo…');
      try{
        const {data:auth,error:authError}=await client.auth.getUser();
        if(authError||!auth?.user)throw new Error('Please log in to change your picture.');
        const uid=auth.user.id;
        const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
        const path=`${uid}/avatar-${Date.now()}.${ext}`;
        const {error:uploadError}=await client.storage.from('profile-avatars').upload(path,file,{contentType:file.type,upsert:false});
        if(uploadError)throw uploadError;
        const {data:urlData}=client.storage.from('profile-avatars').getPublicUrl(path);
        const url=urlData?.publicUrl;
        if(!url)throw new Error('Could not create photo URL.');
        const {data:updated,error:updateError}=await client.from('profiles').update({profile_image:url}).eq('id',uid).select('id');
        if(updateError)throw updateError;
        if(!updated?.length)throw new Error('Profile record not found or update not permitted.');
        for(const id of ['myProfileAvatar','navUserAvatar']){const img=document.getElementById(id);if(img)img.src=url;}
        if(typeof myCurrentProfile!=='undefined'&&myCurrentProfile){myCurrentProfile.profile_image=url;if(typeof updateActiveProfileStorage==='function')updateActiveProfileStorage(myCurrentProfile);}
        report('Profile picture updated successfully.');
      }catch(e){console.error('Avatar upload:',e);report(e.message||'Could not upload photo.');}
      finally{input.disabled=false;input.value='';}
    });
  });
})();
