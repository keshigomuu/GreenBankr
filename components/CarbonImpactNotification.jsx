"use client";

import { useState, useEffect } from 'react';

export function CarbonImpactNotification({ show, orchestrationData, onClose }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show || !orchestrationData) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-sm shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">🌍</span>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-green-800 mb-1">
              Transaction Completed!
            </h3>
            <p className="text-sm text-green-700 mb-2">
              Carbon impact calculated and loyalty points updated.
            </p>
            {orchestrationData.TransactionId && (
              <p className="text-xs text-green-600">
                Transaction ID: {orchestrationData.TransactionId}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="flex-shrink-0 ml-2 text-green-400 hover:text-green-600"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}