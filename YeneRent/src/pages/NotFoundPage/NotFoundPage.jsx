import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1>404</h1>
                <h2>Page Not Found</h2>
                <p>Sorry, the page you are looking for does not exist.</p>
                <Link to="/dashboard" className="btn btn-primary">
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default NotFoundPage;
