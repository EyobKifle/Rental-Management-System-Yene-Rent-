import React from 'react';
import { Card } from './Card'; // Assuming Card is in the same ui directory
import './StatsCard.css';

const StatsCard = ({ title, value, iconClass }) => {
    return (
        <Card className="stat-card">
            {iconClass && <i className={`${iconClass} stat-icon`}></i>}
            <h3>{title}</h3>
            <h2>{value}</h2>
        </Card>
    );
};

export default StatsCard;