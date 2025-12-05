import React from 'react';
import './PageHeader.css';

const PageHeader = ({ title, description, breadcrumbs, actions }) => {
  return (
    <div className="page-header">
      {breadcrumbs && (
        <nav className="page-breadcrumbs">
          <ol className="breadcrumb-list">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="breadcrumb-item">
                {index > 0 && <span className="breadcrumb-separator">/</span>}
                {crumb.link ? (
                  <a href={crumb.link} className="breadcrumb-link">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="breadcrumb-current">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="page-header-content">
        <div className="page-header-text">
          <h1 className="page-title">{title}</h1>
          {description && <p className="page-subtitle">{description}</p>}
        </div>
        {actions && (
          <div className="page-header-actions">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
