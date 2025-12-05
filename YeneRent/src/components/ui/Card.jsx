import React from 'react';
import './Card.css';

const Card = ({ children, className, ...props }) => {
    const cardClassName = `data-card ${className || ''}`;
    return (
        <div className={cardClassName} {...props}>
            {children}
        </div>
    );
};

export default Card;