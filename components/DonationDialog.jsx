"use client";

import { useState } from 'react';

export function DonationDialog({ isOpen, onClose, donationAmount, onConfirm, onDecline }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
      onClose();
    }
  };

  const handleDecline = () => {
    onDecline();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          🌱 Make a Green Impact!
        </h3>
        <p className="text-gray-700 mb-4">
          Your transaction has a carbon impact. Would you like to round up your transfer and donate{' '}
          <span className="font-semibold text-green-600">${donationAmount}</span> to environmental causes?
        </p>
        <p className="text-sm text-gray-500 mb-6">
          This donation will help offset carbon emissions and support green initiatives.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            No Thanks
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : `Donate $${donationAmount}`}
          </button>
        </div>
      </div>
    </div>
  );
}