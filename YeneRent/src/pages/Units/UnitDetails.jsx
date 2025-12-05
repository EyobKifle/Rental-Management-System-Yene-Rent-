import React from 'react';
import { useParams } from 'react-router-dom';

const UnitDetails = () => {
  const { id } = useParams();
  return (
    <div>
      <h1>Unit Details Page</h1>
      <p>Details for Unit ID: {id}</p>
    </div>
  );
};

export default UnitDetails;
