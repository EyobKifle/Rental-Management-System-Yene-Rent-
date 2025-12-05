import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer>
            <div className="footer-main">
                <div className="footer-column footer-about">
                    <h4>Yene Rent</h4>
                    <p>Simplifying rental management with powerful, intuitive software designed for property owners in Ethiopia.</p>
                    <div className="social-links">
                        <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
                        <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
                        <a href="#" aria-label="Facebook"><i className="fab fa-facebook"></i></a>
                        <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
                    </div>
                </div>
                <div className="footer-column footer-contact">
                    <h4>Contact Us</h4>
                    <form action="#" method="POST">
                        <div className="form-group">
                            <label htmlFor="footer-name" className="sr-only">Full Name</label>
                            <input type="text" id="footer-name" placeholder="Full Name" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="footer-email" className="sr-only">Email</label>
                            <input type="email" id="footer-email" placeholder="Email Address" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="footer-message" className="sr-only">Message</label>
                            <textarea id="footer-message" placeholder="Your Message" rows="4" required></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary">Send Message</button>
                    </form>
                </div>
                <div className="footer-column footer-quick-links">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="/#home">Home</a></li>
                        <li><a href="/#features-overview">Features</a></li>
                        <li><a href="/#demo">Demo</a></li>
                        <li><a href="/#pricing">Pricing</a></li>
                        <li><a href="/privacy">Privacy Policy</a></li>
                        <li><a href="/terms">Terms of Service</a></li>
                    </ul>
                </div>
            </div>
            <div className="copyright">
                &copy; 2026 YourCompanyName. All Rights Reserved.
            </div>
        </footer>
    );
};

export default Footer;
