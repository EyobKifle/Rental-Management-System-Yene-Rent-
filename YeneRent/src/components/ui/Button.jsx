import React from 'react';
import './Button.css';

const Button = ({ children, className, ...props }) => {
    // Combine a base 'btn' class with any additional classes passed in
    const buttonClassName = `btn ${className || ''}`;

    return (
        <button className={buttonClassName} {...props}>
            {children}
        </button>
    );
};

export default Button;