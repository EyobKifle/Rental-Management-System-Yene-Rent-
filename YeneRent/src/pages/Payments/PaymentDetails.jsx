import React from 'react';
import { useParams } from 'react-router-dom';

const PaymentDetails = () => {
  const { id } = useParams();
  return (
    <div>
      <h1>Payment Details Page</h1>
      <p>Details for Payment ID: {id}</p>
    </div>
  );
};

export default PaymentDetails;
