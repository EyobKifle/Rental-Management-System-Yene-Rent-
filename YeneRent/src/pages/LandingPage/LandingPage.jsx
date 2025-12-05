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
                    <video autoplay muted loop playsinline controls poster="preview.jpg">
                        <source src="assets/demo.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
            </section>

            <section id="features-overview" className="section features-overview">
                <h2>Core System Capabilities</h2>
                <div className="feature-cards">
                    <div className="feature-card reveal">
                        <i className="fas fa-building fa-3x"></i>
                        <h3>Property & Tenant Management</h3>
                        <p>Manage your entire portfolio from one comprehensive dashboard, including leases and tenant records.</p>
                    </div>
                    <div className="feature-card reveal">
                        <i className="fas fa-chart-line fa-3x"></i>
                        <h3>Financial Analytics</h3>
                        <p>Track income, expenses, and profitability in real-time with insightful visual reports.</p>
                    </div>
                    <div className="feature-card reveal">
                        <i className="fas fa-calculator fa-3x"></i>
                        <h3>Tax Automation</h3>
                        <p>Handle Ethiopian tax rules automatically, ensuring compliance and accurate reporting.</p>
                    </div>
                    <div className="feature-card reveal">
                        <i className="fas fa-file-export fa-3x"></i>
                        <h3>Smart Reporting</h3>
                        <p>Export financial summaries and operational reports with a single, quick click.</p>
                    </div>
                    <div className="feature-card reveal">
                        <i className="fas fa-folder-open fa-3x"></i>
                        <h3>Document Management</h3>
                        <p>Upload, organize, and securely access all your important property and tenant files in one place.</p>
                    </div>
                </div>
            </section>

            <section className="section detailed-features">
                <h2>Deep Dive into Our Modules</h2>

                <div className="detailed-feature-item feature-left reveal">
                    <div className="feature-illustration"><img src="placeholder-dashboard.jpg" alt="Comprehensive Dashboard Screenshot" /></div>
                    <div className="feature-text">
                        <h3>Comprehensive Dashboard & Core Management</h3>
                        <p>Get a bird's-eye view of your portfolio with actionable insights and quick links to core management functions. Effortlessly manage property details, unit assignments, and tenant lifecycle.</p>
                        <a href="#" className="learn-more">Learn More &rarr;</a>
                    </div>
                </div>

                <div className="detailed-feature-item feature-right reveal">
                    <div className="feature-illustration"><img src="placeholder-analytics.jpg" alt="Financial Analytics Screenshot" /></div>
                    <div className="feature-text">
                        <h3>Financial Analytics & Reporting</h3>
                        <p>Visualize your cash flow, identify profit drivers, and minimize losses with our advanced, integrated financial tools and customizable reporting suite.</p>
                        <a href="#" className="learn-more">Learn More &rarr;</a>
                    </div>
                </div>

                <div className="detailed-feature-item feature-left reveal">
                    <div className="feature-illustration"><img src="placeholder-tax.jpg" alt="Tax Automation Screenshot" /></div>
                    <div className="feature-text">
                        <h3>Automated Tax Calculation</h3>
                        <p>Stay compliant with Ethiopian revenue laws effortlessly. Our system automatically calculates necessary taxes and prepares accurate, submission-ready forms.</p>
                        <a href="#" className="learn-more">Learn More &rarr;</a>
                    </div>
                </div>
            </section>

            <section id="demo" className="section demo-section">
                <h2>See Our System in Action</h2>
                <div className="demo-player">
                    <img src="placeholder-gif-demo.gif" alt="System Demo Preview" className="demo-preview" />
                </div>
                <a href="demo-page.html" className="btn btn-primary btn-large">See how it works — Explore the Demo</a>
            </section>

            <section id="pricing" className="section pricing-section">
                <h2>Clear & Flexible Pricing</h2>
                <div className="pricing-tiers">
                    <div className="price-card reveal">
                        <h3>Basic</h3>
                        <p className="price">ETB X / month</p>
                        <ul>
                            <li><i className="fas fa-check"></i> Single Property Management</li>
                            <li><i className="fas fa-check"></i> Basic Financial Tracking</li>
                            <li><i className="fas fa-times"></i> Limited Support</li>
                        </ul>
                        <a href="signup.html" className="btn btn-secondary">Get Started</a>
                    </div>
                    <div className="price-card popular reveal">
                        <h3>Professional</h3>
                        <p className="price">ETB Y / month</p>
                        <ul>
                            <li><i className="fas fa-check"></i> Up to 20 Properties</li>
                            <li><i className="fas fa-check"></i> Advanced Analytics & Reporting</li>
                            <li><i className="fas fa-check"></i> Tax Automation</li>
                        </ul>
                        <a href="signup.html?plan=pro" className="btn btn-primary">Start Trial</a>
                    </div>
                    <div className="price-card reveal">
                        <h3>Enterprise</h3>
                        <p className="price">Contact Us</p>
                        <ul>
                            <li><i className="fas fa-check"></i> Unlimited Properties</li>
                            <li><i className="fas fa-check"></i> Custom Integrations</li>
                            <li><i className="fas fa-check"></i> Dedicated Account Manager</li>
                        </ul>
                        <a href="contact.html?plan=enterprise" className="btn btn-secondary">Contact Sales</a>
                    </div>
                </div>
                <a href="pricing.html" className="compare-link">Compare All Plans in Detail &rarr;</a>
            </section>

            <section className="section testimonials-section">
                <h2>Trusted by Property Owners Across Ethiopia</h2>
                <div className="testimonial-grid">
                    <blockquote className="testimonial-card reveal">
                        <p>"The tax automation feature is a lifesaver. It saves my team hours every month and ensures we're always compliant."</p>
                        <footer>
                            <img src="placeholder-avatar-1.jpg" alt="Testimonial photo" className="avatar" />
                            <cite>— Alemayehu T., Addis Ababa</cite>
                        </footer>
                    </blockquote>
                    <blockquote className="testimonial-card reveal">
                        <p>"Managing 15 properties used to be chaotic. Now everything is centralized and easily accessible. Highly recommend!"</p>
                        <footer>
                            <img src="placeholder-avatar-2.jpg" alt="Testimonial photo" className="avatar" />
                            <cite>— Sofia G., Property Manager</cite>
                        </footer>
                    </blockquote>
                </div>
            </section>

            <section className="section faq-section">
                <h2>Frequently Asked Questions</h2>
                <div className="faq-container">
                    <details className="faq-item reveal">
                        <summary>Can I use the system offline?</summary>
                        <p>No, the system is cloud-based for real-time data sync and security, requiring an internet connection to access. However, some reporting data can be exported and viewed offline.</p>
                    </details>
                    <details className="faq-item reveal">
                        <summary>Is it compatible with Ethiopian tax rules?</summary>
                        <p>Absolutely. Our system is specifically engineered to handle all relevant Ethiopian tax laws and reporting requirements automatically.</p>
                    </details>
                    <details className="faq-item reveal">
                        <summary>Do you offer multi-user access?</summary>
                        <p>Yes, multi-user access with role-based permissions is available on our Professional and Enterprise plans, perfect for teams and businesses.</p>
                    </details>
                </div>
            </section>

        </main>
    );
};

export default LandingPage;
