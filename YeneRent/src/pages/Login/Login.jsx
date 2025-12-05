import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('demo@user.com'); // Pre-filled for demo
    const [password, setPassword] = useState('password'); // Pre-filled for demo
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard'); // Redirect to dashboard on successful login
        } catch (error) {
            alert(error.message); // Display error message
        }
    };

    return (
        <body className="login-page">
            <main className="login-main">
                <div className="login-container">
                    <div className="login-card">
                        <div className="login-header">
                            <h1>Rental System</h1>
                            <p>Sign in to manage your properties</p>
                        </div>
                        <form id="login-form" className="login-form" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email" className="form-label">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    placeholder="Enter your email"
                                    required
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password" className="form-label">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-input"
                                    placeholder="Enter your password"
                                    required
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <p className="forgot-password">
                                <a href="#">Forgot your password?</a>
                            </p>

                            <button type="submit" className="btn-primary">Sign In</button>

                            <p className="signup-link">
                                <a href="/signup">Don't have an account? Sign up</a>
                            </p>

                        </form>
                    </div>
                </div>
            </main>
        </body>
    );
};

export default Login;
