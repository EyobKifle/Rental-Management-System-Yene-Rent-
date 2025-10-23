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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Basic validation
    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    // In a real app, you'd call Supabase to sign in.
    // supabase.auth.signInWithPassword({ email, password })
    console.log('Simulating login...');

    // Dummy authentication for demo
    if (email === 'demo@user.com' && password === 'password') {
        // For demonstration, create a dummy user object.
        // In a real app, this would come from your auth provider.
        const user = {
            id: 'user-1',
            name: 'Demo User',
            email: email,
            avatarUrl: null // Set to a URL string to test with an image
        };

        // For now, we'll just set a dummy session item and redirect.
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid credentials. Use demo@user.com / password');
    }
}

function checkSession() {
    const isLoggedIn = sessionStorage.getItem('userLoggedIn');
    const protectedPages = ['dashboard.html', 'properties.html', 'tenants.html', 'leases.html', 'payments.html', 'expenses.html', 'documents.html', 'analytics.html', 'settings.html', 'utilities.html', 'maintenance.html', 'units.html'];
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    if (!isLoggedIn && protectedPages.includes(currentPage)) {
        console.log('No active session, redirecting to login.');
        window.location.href = 'login.html';
    }
}
