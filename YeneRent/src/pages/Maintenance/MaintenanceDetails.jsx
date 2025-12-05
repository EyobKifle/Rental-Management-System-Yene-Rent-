import React from 'react';
import { useParams } from 'react-router-dom';

const MaintenanceDetails = () => {
  const { id } = useParams();
  return (
    <div>
      <h1>Maintenance Details Page</h1>
      <p>Details for Maintenance ID: {id}</p>
    </div>
  );
};

export default MaintenanceDetails;