let isLogin = true;

const authForm = document.getElementById('auth-form');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const submitBtn = document.getElementById('submit-btn');
const toggleText = document.getElementById('toggle-text');
const toggleModeBtn = document.getElementById('toggle-mode');
const togglePasswordBtn = document.getElementById('toggle-password-btn');
const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password-btn');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const confirmPasswordGroup = document.getElementById('confirm-password-group');
const usernameInput = document.getElementById('username');
const usernameGroup = document.getElementById('username-group');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const statusContainer = document.getElementById('status-container');
const statusText = document.getElementById('status-text');
const statusIcon = document.getElementById('status-icon');


togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);

    // Update icon by replacing innerHTML to ensure Lucide detects the change
    const iconName = type === 'password' ? 'eye' : 'eye-off';
    togglePasswordBtn.innerHTML = `<i data-lucide="${iconName}"></i>`;
    lucide.createIcons();
});

toggleConfirmPasswordBtn.addEventListener('click', () => {
    const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    confirmPasswordInput.setAttribute('type', type);

    const iconName = type === 'password' ? 'eye' : 'eye-off';
    toggleConfirmPasswordBtn.innerHTML = `<i data-lucide="${iconName}"></i>`;
    lucide.createIcons();
});


if (localStorage.getItem('authToken')) {
    window.location.href = 'index.html';
}

// Check for verification status in URL
window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('verified')) {
        if (!isLogin) toggleMode(); // Ensure we are in login mode
        showMessage('success', 'Email verified! You can now log in.');
    } else if (urlParams.has('error')) {
        showMessage('error', urlParams.get('error'));
    } else if (urlParams.has('resetToken')) {
        setupResetPasswordMode(urlParams.get('resetToken'));
    }
});


function setupResetPasswordMode(token) {
    isLogin = false; // Treat as a form of non-login
    authTitle.textContent = 'Set New Password';
    authSubtitle.textContent = 'Please enter your new password below';
    submitBtn.textContent = 'Reset Password';

    // Hide unnecessary fields
    const emailInput = document.getElementById('email');
    emailInput.closest('.form-group').style.display = 'none';
    emailInput.required = false;

    usernameGroup.style.display = 'none';
    forgotPasswordLink.style.display = 'none';
    toggleText.closest('.toggle-section').style.display = 'none';

    // Show confirm password
    confirmPasswordGroup.style.display = 'block';
    confirmPasswordInput.required = true;

    // Update submit handler context
    authForm.dataset.resetToken = token;
}



function toggleMode() {
    isLogin = !isLogin;

    if (isLogin) {
        authTitle.textContent = 'Welcome Back';
        authSubtitle.textContent = 'Login to access your dashboard';
        submitBtn.textContent = 'Sign in';
        toggleText.textContent = "Don't have an account?";
        toggleModeBtn.textContent = 'Create Account';
        confirmPasswordGroup.style.display = 'none';
        confirmPasswordInput.required = false;
        usernameGroup.style.display = 'none';
        usernameInput.required = false;
        forgotPasswordLink.style.display = 'block';
    } else {
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Join the Idea Dashboard community';
        submitBtn.textContent = 'Sign up';
        toggleText.textContent = "Already have an account?";
        toggleModeBtn.textContent = 'Login instead';
        confirmPasswordGroup.style.display = 'block';
        confirmPasswordInput.required = true;
        usernameGroup.style.display = 'block';
        usernameInput.required = true;
        forgotPasswordLink.style.display = 'none';
    }


    // Clear status when switching modes
    hideStatus();
}

function showMessage(type, msg) {
    statusText.textContent = msg;
    statusContainer.className = `status-message show status-${type}`;

    // Update icon
    const iconName = type === 'success' ? 'check-circle' : (type === 'info' ? 'info' : 'alert-circle');
    statusIcon.innerHTML = `<i data-lucide="${iconName}"></i>`;
    lucide.createIcons();
}

function showError(msg) {
    showMessage('error', msg);
}

function hideStatus() {
    statusContainer.classList.remove('show');
}


authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('email');
    const email = emailInput ? emailInput.value : '';
    const password = document.getElementById('password').value;
    const confirmPassword = confirmPasswordInput.value;
    const username = usernameInput.value;

    hideStatus();

    // Check for Reset Password mode

    if (authForm.dataset.resetToken) {
        if (password !== confirmPassword) {
            showError("Passwords don't match!");
            return;
        }
        handleResetPassword(authForm.dataset.resetToken, password);
        return;
    }

    if (!isLogin && password !== confirmPassword) {
        showError("Passwords don't match!");
        return;
    }


    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    submitBtn.textContent = isLogin ? 'Signing in...' : 'Creating Account...';

    const BASE_URL = 'https://idea-backend-jwst.onrender.com';
    const endpoint = isLogin ? '/login' : '/signup';
    const payload = isLogin ? { email, password } : { email, password, username };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });


        const result = await response.json();

        if (response.ok) {
            if (isLogin) {
                // No toast as requested, direct redirect
                localStorage.setItem('authToken', result.token);
                localStorage.setItem('userEmail', result.user.email);
                window.location.href = 'index.html';
            } else {
                showVerificationReminder();
            }



        } else {
            showError(result.error || 'Something went wrong');
        }
    } catch (err) {
        console.error(err);
        showError('Connection failed. Is the server running?');
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        if (!isLogin && submitBtn.textContent === 'Creating Account...') {
            submitBtn.textContent = 'Sign up';
        } else if (isLogin && submitBtn.textContent === 'Signing in...') {
            submitBtn.textContent = 'Sign in';
        }
    }
});

async function handleResetPassword(token, password) {
    const BASE_URL = 'https://idea-backend-jwst.onrender.com';
    try {
        const response = await fetch(`${BASE_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });
        const result = await response.json();
        if (response.ok) {
            showMessage('success', 'Password reset successful! Please login.');
            setTimeout(() => { window.location.href = 'auth.html'; }, 2000);
        } else {
            showError(result.error);
        }

    } catch (err) {
        showError('Reset failed. Please try again.');
    }
}

function showForgotPassword() {
    document.getElementById('forgot-modal-overlay').style.display = 'flex';
}

function closeForgotPassword() {
    document.getElementById('forgot-modal-overlay').style.display = 'none';
}

document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    const submitBtn = document.getElementById('forgot-submit-btn');
    const BASE_URL = 'https://idea-backend-jwst.onrender.com';

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
        const response = await fetch(`${BASE_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const result = await response.json();
        if (response.ok) {
            showMessage('info', 'Reset link sent to your email!');
            closeForgotPassword();
        } else {
            showMessage('error', result.error);
        }

    } catch (err) {
        showToast('❌', 'Failed to send reset link.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Reset Link';
    }
});

function showVerificationReminder() {
    document.getElementById('auth-form').parentElement.style.display = 'none';
    document.getElementById('verify-reminder').style.display = 'block';
    lucide.createIcons();
}

function showLoginFromReminder() {
    document.getElementById('verify-reminder').style.display = 'none';
    document.getElementById('auth-form').parentElement.style.display = 'block';
    if (!isLogin) toggleMode(); // Switch back to login mode
    authForm.reset();
}

function showToast(icon, msg) {


    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMsg = document.getElementById('toast-msg');

    toastIcon.textContent = icon;
    toastMsg.textContent = msg;

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
