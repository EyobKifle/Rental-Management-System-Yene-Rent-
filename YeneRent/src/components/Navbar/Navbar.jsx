import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const location = useLocation();
    const [pageTitle, setPageTitle] = useState('Rental Management'); // Default title

    // Effect to update page title based on route
    useEffect(() => {
        const path = location.pathname;
        // This is a simplified mapping. In a real app, you might have a more robust routing config.
        if (path.includes('/dashboard')) setPageTitle('Dashboard');
        else if (path.includes('/properties')) setPageTitle('Properties');
        else if (path.includes('/analytics')) setPageTitle('Analytics');
        else if (path.includes('/tenants')) setPageTitle('Tenants');
        else if (path.includes('/units')) setPageTitle('Units');
        else if (path.includes('/documents')) setPageTitle('Documents');
        else if (path.includes('/payments')) setPageTitle('Payment Schedule');
        else setPageTitle('Rental Management'); // Fallback for other pages
    }, [location.pathname]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
        // You might want to dispatch a global event or use context to inform the main layout
        // For now, we'll assume the sidebar state is managed externally or by a parent.
    };

    const toggleLanguageMenu = () => {
        setIsLanguageMenuOpen(!isLanguageMenuOpen);
        setIsUserMenuOpen(false); // Close other menus
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
        setIsLanguageMenuOpen(false); // Close other menus
    };

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isLanguageMenuOpen && !event.target.closest('.language-menu')) {
                setIsLanguageMenuOpen(false);
            }
            if (isUserMenuOpen && !event.target.closest('.user-menu')) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isLanguageMenuOpen, isUserMenuOpen]);

    // Placeholder for user avatar logic
    const renderUserAvatar = () => {
        // In a real app, this would fetch user data
        const userName = "Admin"; // Example
        const userInitials = userName.charAt(0).toUpperCase();
        return (
            <div className="user-avatar">
                {userInitials}
            </div>
        );
    };

    return (
        <header className="header">
            <div className="header-left">
                <button id="sidebar-toggle" className="header-icon-btn" onClick={toggleSidebar}>
                    <i className="fa-solid fa-bars"></i>
                </button>
            </div>

            <div className="header-center">
                <h1 id="page-title">{pageTitle}</h1>
            </div>

            <div className="header-right">
                <div className="language-menu menu-container">
                    <button id="language-menu-button" className="header-icon-btn" onClick={toggleLanguageMenu}>
                        <i className="fa-solid fa-globe"></i>
                    </button>
                    <div id="language-menu-dropdown" className={`dropdown-menu ${isLanguageMenuOpen ? '' : 'hidden'}`}>
                        <a href="#" className="dropdown-item" data-lang="en">English</a>
                        <a href="#" className="dropdown-item" data-lang="am">Amharic</a>
                    </div>
                </div>

                <button className="header-icon-btn notification-btn">
                    <i className="fa-solid fa-bell"></i>
                    <span className="notification-badge hidden"></span>
                </button>

                <div className="user-menu menu-container">
                    <button id="user-menu-button" className="header-icon-btn" onClick={toggleUserMenu}>
                        {renderUserAvatar()}
                    </button>
                    <div id="user-menu-dropdown" className={`dropdown-menu ${isUserMenuOpen ? '' : 'hidden'}`}>
                        <Link to="/profile" className="dropdown-item">My Profile</Link>
                        <Link to="/settings" className="dropdown-item">Settings</Link>
                        <div className="dropdown-divider"></div>
                        <Link to="/logout" className="dropdown-item">Log Out</Link> {/* Placeholder for logout */}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
