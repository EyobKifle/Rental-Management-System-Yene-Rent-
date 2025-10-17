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

    // For demonstration, create a dummy user object.
    // In a real app, this would come from your auth provider.
    const user = {
        name: 'Abebe Bekele',
        avatarUrl: null // Set to a URL string to test with an image
    };

    // For now, we'll just set a dummy session item and redirect.
    sessionStorage.setItem('userLoggedIn', 'true');
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    window.location.href = 'index.html';
}

function checkSession() {
    const isLoggedIn = sessionStorage.getItem('userLoggedIn');
    if (!isLoggedIn) {
        console.log('No active session, redirecting to login.');
        window.location.href = 'login.html';
    }
}