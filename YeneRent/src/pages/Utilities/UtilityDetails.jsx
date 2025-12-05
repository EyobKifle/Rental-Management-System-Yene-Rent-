import React from 'react';
import { useParams } from 'react-router-dom';

const UtilityDetails = () => {
  const { id } = useParams();
  return (
    <div>
      <h1>Utility Details Page</h1>
      <p>Details for Utility ID: {id}</p>
    </div>
  );
};

export default UtilityDetails;
