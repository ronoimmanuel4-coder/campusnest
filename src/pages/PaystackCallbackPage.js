import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { paymentsAPI } from '../services/api';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const PaystackCallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const searchParams = new URLSearchParams(location.search);
        const reference = searchParams.get('reference') || searchParams.get('trxref');

        if (!reference) {
          setError('Missing payment reference in callback URL');
          setIsVerifying(false);
          return;
        }

        const response = await paymentsAPI.verifyPaystack(reference);
        const data = response.data?.data || response.data;
        const propertyId = data?.propertyId || data?.property || null;

        toast.success('Payment verified successfully. Premium details unlocked!');

        if (propertyId) {
          navigate(`/property/${propertyId}`);
        } else {
          navigate('/unlocked-properties');
        }
      } catch (err) {
        console.error('Paystack verify error:', err);
        const message = err.response?.data?.message || 'Failed to verify payment';
        setError(message);
        toast.error(message);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [location.search, navigate]);

  if (isVerifying) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-3">Payment Verification Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/listings"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
          >
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return null;
};

export default PaystackCallbackPage;
