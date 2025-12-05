import React from 'react';
import './LandingPage.css';

const LandingPage = () => {
    // In a real app, you would use React Router's Link component
    // For this conversion, we'll use standard anchor tags that point to the new routes.
    return (
        <main>
            <section id="home" className="hero-section">
                <div className="hero-content">
                    <h1>Simplify Rental Management — Track, Analyze, and Automate with Ease</h1>
                    <p>Manage your entire rental property portfolio effortlessly. Our system provides powerful tools for tenant management, financial tracking, and automated tax reporting compliant with Ethiopian rules.</p>
                    <div className="hero-ctas">
                        <a href="#demo" className="btn btn-primary btn-large">Try Demo</a>
                        <a href="/trial-request" className="btn btn-secondary btn-large">Request a Free Trial</a>
                    </div>
                </div>
                <div className="hero-video">
                    {/* Placeholder for video */}
                    <div style={{ aspectRatio: '16/9', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}>
                        <p>Video Placeholder</p>
                    </div>
                </div>
            </section>

            <section id="features-overview" className="section features-overview">
                <h2>Core System Capabilities</h2>
                <div className="feature-cards">
                    <div className="feature-card">
                        <i className="fas fa-building fa-3x"></i>
                        <h3>Property & Tenant Management</h3>
                        <p>Manage your entire portfolio from one comprehensive dashboard, including leases and tenant records.</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-chart-line fa-3x"></i>
                        <h3>Financial Analytics</h3>
                        <p>Track income, expenses, and profitability in real-time with insightful visual reports.</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-calculator fa-3x"></i>
                        <h3>Tax Automation</h3>
                        <p>Handle Ethiopian tax rules automatically, ensuring compliance and accurate reporting.</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-file-export fa-3x"></i>
                        <h3>Smart Reporting</h3>
                        <p>Export financial summaries and operational reports with a single, quick click.</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-folder-open fa-3x"></i>
                        <h3>Document Management</h3>
                        <p>Upload, organize, and securely access all your important property and tenant files in one place.</p>
                    </div>
                </div>
            </section>

            {/* Other sections can be added here following the same pattern */}

        </main>
    );
};

export default LandingPage;
