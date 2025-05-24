import React, { useState } from 'react';
import { calculateAndLogDistance, testDistanceCalculation } from '../utils/distanceUtils';
import type { DistanceResult } from '../services/distanceService';

const DistanceCalculator: React.FC = () => {
  const [postalCode, setPostalCode] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [result, setResult] = useState<DistanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculateDistance = async () => {
    if (!postalCode.trim()) {
      setError('Please enter a postal code');
      return;
    }

    setIsCalculating(true);
    setError(null);
    setResult(null);

    try {
      const distanceResult = await calculateAndLogDistance(postalCode.trim());
      setResult(distanceResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleTestCalculation = async () => {
    setIsCalculating(true);
    setError(null);
    setResult(null);

    try {
      await testDistanceCalculation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during test');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        📍 Distance Calculator
      </h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
            Business Postal Code
          </label>
          <input
            id="postalCode"
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Enter postal code (e.g., 10001, M5V 3A8)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isCalculating}
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleCalculateDistance}
            disabled={isCalculating || !postalCode.trim()}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            {isCalculating ? '🔄 Calculating...' : '📏 Calculate Distance'}
          </button>
          
          <button
            onClick={handleTestCalculation}
            disabled={isCalculating}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            🧪 Test
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            <p className="text-sm">❌ {error}</p>
          </div>
        )}

        {result && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-800 rounded-md">
            <h3 className="font-semibold mb-2">✅ Distance Calculated!</h3>
            <div className="text-sm space-y-1">
              <p><strong>📏 Distance:</strong> {result.distance}</p>
              <p><strong>⏱️ Duration:</strong> {result.duration}</p>
              <p><strong>📊 Exact Distance:</strong> {(result.distanceValue / 1000).toFixed(2)} km</p>
              <p><strong>📊 Exact Duration:</strong> {(result.durationValue / 60).toFixed(1)} minutes</p>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>💡 <strong>Note:</strong> This will request your location permission and log detailed results to the browser console.</p>
          <p>🔍 Open Developer Tools (F12) → Console to see detailed logs.</p>
        </div>
      </div>
    </div>
  );
};

export default DistanceCalculator; 