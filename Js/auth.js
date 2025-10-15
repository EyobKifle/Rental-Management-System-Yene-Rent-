// auth.js - Authentication logic

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // On protected pages, check for a user session
    if (!window.location.pathname.endsWith('login.html')) {
        checkSession();
    }
});

function handleLogin(e) {
    e.preventDefault();
    // In a real app, you'd call Supabase to sign in.
    // supabase.auth.signInWithPassword({ email, password })
    console.log('Simulating login...');
    
    // For now, we'll just set a dummy session item and redirect.
    sessionStorage.setItem('userLoggedIn', 'true');
    window.location.href = 'index.html';
}

function checkSession() {
    const isLoggedIn = sessionStorage.getItem('userLoggedIn');
    if (!isLoggedIn) {
        console.log('No active session, redirecting to login.');
        window.location.href = 'login.html';
    }
}