
/* UniSkill Hub — secure authenticated profile editor */

(() => {
  const $ = id => document.getElementById(id);
  const modal = $('editProfileModal');

  if (!modal) return;

  let photoFile = null;
  let previousFocus = null;

  const status = (message, error = false) => {
    $('peStatus').textContent = message;
    $('peStatus').style.color = error ? '#e66d6d' : '';
  };

  const client = () =>
    window.supabaseClient || window.SUPABASE_CONFIG?.client;

  async function getUser() {
    const sb = client();

    if (!sb) {
      throw new Error(
        'Supabase connection unavailable. Check js/supabase-config.js.'
      );
    }

    const { data, error } = await sb.auth.getUser();

    if (error) throw error;

    if (!data?.user) {
      throw new Error(
        'Please log in with your Supabase account before editing.'
      );
    }

    return data.user;
  }

  async function openEditor() {
    previousFocus = document.activeElement;

    modal.hidden = false;
    photoFile = null;

    $('pePhoto').value = '';
    status('Loading profile...');

    try {
      const user = await getUser();

      const { data, error } = await client()
        .from('profiles')
        .select(
          'full_name,faculty,degree,academic_year,bio,skills,profile_image'
        )
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      const p = data || {};

      $('peName').value =
        p.full_name || user.user_metadata?.full_name || '';

      $('peFaculty').value = p.faculty || '';
      $('peDegree').value = p.degree || '';

      const year = p.academic_year || '';

      if (
        year &&
        !Array.from($('peYear').options).some(
          o => o.value === year
        )
      ) {
        $('peYear').add(new Option(year, year));
      }

      $('peYear').value = year;
      $('peBio').value = p.bio || '';

      $('peSkills').value = Array.isArray(p.skills)
        ? p.skills.join(', ')
        : (p.skills || '');

      $('pePreview').src =
        p.profile_image ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.id)}`;

      status('');
      $('peName').focus();

    } catch (err) {
      status(err.message, true);
    }
  }

  function closeEditor() {
    modal.hidden = true;
    photoFile = null;
    previousFocus?.focus?.();
  }

  // Open profile editor
  $('openProfileEditor')?.addEventListener(
    'click',
    openEditor
  );

  // Close buttons
  $('peClose').addEventListener(
    'click',
    closeEditor
  );

  $('peCancel').addEventListener(
    'click',
    closeEditor
  );

  // Close when clicking outside modal
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      closeEditor();
    }
  });

  // Escape key
  document.addEventListener('keydown', e => {
    if (!modal.hidden && e.key === 'Escape') {
      closeEditor();
    }
  });

  // Profile picture selection
  $('pePhoto').addEventListener('change', e => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size > 3 * 1024 * 1024
    ) {
      status(
        'Choose JPG, PNG or WebP under 3 MB.',
        true
      );

      e.target.value = '';
      return;
    }

    photoFile = file;

    const reader = new FileReader();

    reader.onload = () => {
      $('pePreview').src = reader.result;
    };

    reader.readAsDataURL(file);
    status('');
  });

  // Save profile to Supabase
  $('peForm').addEventListener('submit', async e => {
    e.preventDefault();

    const btn = $('peSave');

    btn.disabled = true;
    btn.textContent = 'Saving...';

    status('Saving your changes...');

    try {
      const sb = client();
      const user = await getUser();

      const payload = {
        id: user.id,

        full_name: $('peName').value.trim(),

        email: user.email,

        faculty: $('peFaculty').value.trim(),

        degree: $('peDegree').value.trim(),

        academic_year: $('peYear').value,

        bio: $('peBio').value.trim(),

        skills: $('peSkills')
          .value
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .join(', ')
      };

      if (!payload.full_name) {
        throw new Error('Full name is required.');
      }

      // Upload new profile picture
      if (photoFile) {
        const ext = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp'
        }[photoFile.type];

        const path =
          `${user.id}/avatar-${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await sb.storage
          .from('profile-avatars')
          .upload(path, photoFile, {
            contentType: photoFile.type,
            upsert: false
          });

        if (uploadError) {
          throw new Error(
            'Photo upload failed: ' + uploadError.message
          );
        }

        const { data: publicUrl } = sb.storage
          .from('profile-avatars')
          .getPublicUrl(path);

        payload.profile_image = publicUrl.publicUrl;
      }

      // Save profile data
      const { error } = await sb
        .from('profiles')
        .upsert(payload, {
          onConflict: 'id'
        });

      if (error) {
        throw new Error(
          'Profile save failed: ' + error.message
        );
      }

      // Update dashboard profile information
      if (typeof renderProfileToUI === 'function') {
        renderProfileToUI(payload);
      }

      if (typeof currentStudent !== 'undefined') {
        currentStudent = {
          ...(currentStudent || {}),
          ...payload
        };
      }

      status('Profile saved successfully!');

      setTimeout(closeEditor, 650);

    } catch (err) {
      console.error(err);

      status(
        err.message || 'Could not save profile.',
        true
      );

    } finally {
      btn.disabled = false;
      btn.textContent = 'Save Changes';
    }
  });

})();
