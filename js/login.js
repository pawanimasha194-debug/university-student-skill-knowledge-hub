
/*
 * UniSkill Hub
 * Secure Login & Password Reset
 * File: js/login.js
 *
 * Live Mode: Supabase Authentication
 * Demo Mode: Local demonstration only
 */

document.addEventListener('DOMContentLoaded', () => {

    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', loginUser);
    }

    // Password visibility toggle
    const togglePassBtn =
        document.getElementById('toggleLoginPassword');

    if (togglePassBtn) {
        togglePassBtn.addEventListener('click', () => {

            const passInput =
                document.getElementById('loginPassword');

            if (!passInput) return;

            if (passInput.type === 'password') {
                passInput.type = 'text';
                togglePassBtn.textContent = 'Hide';
            } else {
                passInput.type = 'password';
                togglePassBtn.textContent = 'Show';
            }
        });
    }

    // Forgot password modal
    const forgotPassLink =
        document.getElementById('forgotPasswordLink');

    const forgotModal =
        document.getElementById('forgotPasswordModal');

    const closeForgotModal =
        document.getElementById('closeForgotModal');

    const cancelForgotModal =
        document.getElementById('cancelForgotModal');

    const forgotForm =
        document.getElementById('forgotPasswordForm');

    if (forgotPassLink && forgotModal) {
        forgotPassLink.addEventListener('click', e => {
            e.preventDefault();
            forgotModal.classList.add('active');
        });
    }

    if (closeForgotModal && forgotModal) {
        closeForgotModal.addEventListener('click', () => {
            forgotModal.classList.remove('active');
        });
    }

    if (cancelForgotModal && forgotModal) {
        cancelForgotModal.addEventListener('click', () => {
            forgotModal.classList.remove('active');
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener(
            'submit',
            handleForgotPassword
        );
    }
});


/*
 * MAIN LOGIN FUNCTION
 */

async function loginUser(event) {

    event.preventDefault();

    const alertBox =
        document.getElementById('loginAlertBox');

    const submitBtn =
        document.getElementById('loginSubmitBtn');

    const btnText =
        document.getElementById('loginBtnText');

    const btnSpinner =
        document.getElementById('loginBtnSpinner');

    const email =
        document.getElementById('loginEmail')
            .value.trim();

    const password =
        document.getElementById('loginPassword')
            .value;

    function showAlert(message, type) {

        if (!alertBox) return;

        if (type === 'clear') {
            alertBox.style.display = 'none';
            alertBox.textContent = '';
            alertBox.className = 'alert';
            return;
        }

        alertBox.style.display = 'flex';
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = message;
    }

    function setLoading(loading) {

        if (submitBtn) {
            submitBtn.disabled = loading;
        }

        if (btnSpinner) {
            btnSpinner.style.display =
                loading ? 'inline-block' : 'none';
        }

        if (btnText) {
            btnText.textContent =
                loading ? 'Signing In...' : 'Login';
        }
    }

    showAlert('', 'clear');

    if (!email || !password) {
        showAlert(
            'Please enter your email and password.',
            'error'
        );
        return;
    }

    setLoading(true);

    try {

        const config = window.SUPABASE_CONFIG;
        const sb = window.supabaseClient;

        /*
         * LIVE SUPABASE LOGIN
         */

        if (config?.isConfigured() && sb) {

            const { data, error } =
                await sb.auth.signInWithPassword({
                    email: email,
                    password: password
                });

            if (error) {
                throw new Error(error.message);
            }

            if (!data?.user || !data?.session) {
                throw new Error(
                    'Authentication failed. No valid session.'
                );
            }

            const authUser = data.user;

            /*
             * Verify authenticated session
             */

            const {
                data: verifiedData,
                error: verifyError
            } = await sb.auth.getUser();

            if (verifyError || !verifiedData?.user) {
                throw new Error(
                    'Unable to verify login session.'
                );
            }

            if (verifiedData.user.id !== authUser.id) {
                throw new Error(
                    'Authentication user mismatch.'
                );
            }

            /*
             * Load student profile
             */

            const {
                data: studentProfile,
                error: profileError
            } = await sb
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .maybeSingle();

            if (profileError) {
                console.warn(
                    'Profile loading warning:',
                    profileError.message
                );
            }

            const profile = studentProfile || {
                id: authUser.id,
                email: authUser.email,
                full_name:
                    authUser.user_metadata?.full_name ||
                    'Student',
                faculty:
                    authUser.user_metadata?.faculty || '',
                degree:
                    authUser.user_metadata?.degree || '',
                academic_year:
                    authUser.user_metadata?.academic_year || '',
                skills:
                    authUser.user_metadata?.skills || '',
                bio: ''
            };

            /*
             * Save UI session
             * Supabase SDK manages real Auth session.
             */

            const activeSessionData = {
                user: authUser,
                profile: profile
            };

            localStorage.setItem(
                'uniskill_active_session',
                JSON.stringify(activeSessionData)
            );

            // Clear stale demo session
            localStorage.removeItem(
                'uniskill_current_session'
            );

            showAlert(
                'Login successful! Redirecting...',
                'success'
            );

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);

            return;
        }

        /*
         * OFFLINE DEMO MODE
         * Does not create Supabase Auth session.
         */

        if (!config?.mock) {
            throw new Error(
                'Supabase is unavailable. Check configuration.'
            );
        }

        const mockUsers = config.mock.getUsers();

        const foundUser = mockUsers.find(
            user =>
                user.email?.toLowerCase() ===
                email.toLowerCase()
        );

        if (!foundUser) {
            throw new Error(
                'Demo account not found. Please register.'
            );
        }

        if (
            !foundUser.password ||
            foundUser.password !== password
        ) {
            throw new Error('Incorrect demo password.');
        }

        const demoSessionData = {
            user: {
                id: foundUser.id,
                email: foundUser.email,
                user_metadata: {
                    full_name: foundUser.full_name
                }
            },
            profile: foundUser,
            demo: true
        };

        localStorage.setItem(
            'uniskill_active_session',
            JSON.stringify(demoSessionData)
        );

        config.mock.setCurrentSession(
            demoSessionData
        );

        showAlert(
            'Demo login successful. Supabase saving is disabled.',
            'success'
        );

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 800);

    } catch (error) {

        console.error('Login error:', error);

        showAlert(
            error.message || 'Login failed.',
            'error'
        );

    } finally {

        setLoading(false);
    }
}


/*
 * FORGOT PASSWORD
 */

async function handleForgotPassword(event) {

    event.preventDefault();

    const resetEmail =
        document.getElementById('resetEmail')
            ?.value.trim();

    const resetAlert =
        document.getElementById('resetModalAlert');

    function showResetAlert(message, type) {

        if (!resetAlert) return;

        resetAlert.style.display = 'block';
        resetAlert.className =
            `alert alert-${type}`;

        resetAlert.textContent = message;
    }

    if (!resetEmail) {
        showResetAlert(
            'Please enter your email address.',
            'error'
        );
        return;
    }

    try {

        const sb = window.supabaseClient;

        if (
            !window.SUPABASE_CONFIG?.isConfigured() ||
            !sb
        ) {
            throw new Error(
                'Password reset requires live Supabase.'
            );
        }

        const { error } =
            await sb.auth.resetPasswordForEmail(
                resetEmail,
                {
                    redirectTo:
                        new URL(
                            'login.html',
                            window.location.href
                        ).href
                }
            );

        if (error) {
            throw error;
        }

        showResetAlert(
            'Password reset request submitted. Check your email.',
            'success'
        );

        setTimeout(() => {

            const modal =
                document.getElementById(
                    'forgotPasswordModal'
                );

            if (modal) {
                modal.classList.remove('active');
            }

        }, 2500);

    } catch (error) {

        showResetAlert(
            error.message ||
            'Password reset failed.',
            'error'
        );
    }
}
