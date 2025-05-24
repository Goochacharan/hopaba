import React from 'react';
import DistanceCalculator from '../components/DistanceCalculator';
import { calculateAndLogDistance, testDistanceCalculation } from '../utils/distanceUtils';

const DistanceDemo: React.FC = () => {
  const handleQuickTest = async () => {
    console.log('🚀 Quick test initiated from demo page...');
    await testDistanceCalculation();
  };

  const handleCalculateToNYC = async () => {
    console.log('🗽 Calculating distance to New York City...');
    await calculateAndLogDistance('10001');
  };

  const handleCalculateToLA = async () => {
    console.log('🌴 Calculating distance to Los Angeles...');
    await calculateAndLogDistance('90210');
  };

  const handleCalculateToIndia = async () => {
    console.log('🇮🇳 Calculating distance to Bangalore, India...');
    await calculateAndLogDistance('560001');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📍 Distance Calculator Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This demo showcases the Google Maps API integration for calculating distances 
            between your current location and business postal codes. Includes fallback methods 
            when API restrictions occur.
          </p>
        </div>

        {/* New Location Filtering Features */}
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            🎉 New Location Filtering Features
          </h3>
          <p className="text-green-700 mb-3">
            The distance calculation logic has been integrated into the main application:
          </p>
          <ul className="text-green-700 text-sm space-y-1 list-disc list-inside">
            <li><strong>Shop Page:</strong> Filter businesses by distance from your location or postal code</li>
            <li><strong>Service Providers:</strong> Find nearby providers when viewing service requests</li>
            <li><strong>Smart Fallbacks:</strong> Uses OpenStreetMap when Google APIs are restricted</li>
            <li><strong>Distance Sorting:</strong> Sort results by proximity to your location</li>
            <li><strong>Visual Indicators:</strong> Distance badges show how far each business/provider is</li>
          </ul>
          <div className="mt-4 flex gap-2">
            <a 
              href="/shop" 
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Try Shop Location Filter
            </a>
            <a 
              href="/requests" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Provider Location Filter
            </a>
          </div>
        </div>

        {/* API Status Alert */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            🔧 API Status & Fallback Methods
          </h3>
          <p className="text-blue-700 mb-3">
            If Google APIs are restricted, the system will automatically use fallback methods:
          </p>
          <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
            <li><strong>Geocoding Fallback:</strong> OpenStreetMap Nominatim service</li>
            <li><strong>Distance Fallback:</strong> Straight-line calculation with time estimates</li>
            <li><strong>Error Handling:</strong> Detailed error messages and troubleshooting tips</li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Main Calculator Component */}
          <div>
            <DistanceCalculator />
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🚀 Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={handleQuickTest}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                >
                  🧪 Run Test Calculation
                </button>
                
                <button
                  onClick={handleCalculateToNYC}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                >
                  🗽 Distance to NYC (10001)
                </button>
                
                <button
                  onClick={handleCalculateToLA}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                >
                  🌴 Distance to LA (90210)
                </button>

                <button
                  onClick={handleCalculateToIndia}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                >
                  🇮🇳 Distance to Bangalore (560001)
                </button>
              </div>
            </div>

            {/* API Information */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🔧 API Information
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Google Maps API Key:</strong> Configured ✅</p>
                <p><strong>Geolocation API:</strong> Browser native</p>
                <p><strong>Primary:</strong> Google Distance Matrix & Geocoding</p>
                <p><strong>Fallback:</strong> OpenStreetMap + Straight-line calculation</p>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                🔧 Troubleshooting API Issues
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>REQUEST_DENIED Error:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Check API key permissions in Google Cloud Console</li>
                  <li>Enable Geocoding API and Distance Matrix API</li>
                  <li>Verify billing is set up</li>
                  <li>Check API restrictions (HTTP referrers, IP addresses)</li>
                </ul>
                <p className="mt-3"><strong>Fallback Methods:</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>System automatically tries OpenStreetMap for geocoding</li>
                  <li>Uses straight-line distance calculation as last resort</li>
                  <li>Provides estimated driving times</li>
                </ul>
              </div>
            </div>

            {/* Usage Instructions */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                📋 How to Use
              </h3>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Allow location access when prompted by your browser</li>
                <li>Enter a valid postal code (e.g., 10001, 560001, M5V 3A8)</li>
                <li>Click "Calculate Distance" to get results</li>
                <li>Check the browser console (F12) for detailed logs</li>
                <li>If APIs fail, fallback methods will be used automatically</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Console Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            🔍 Console Logging
          </h3>
          <p className="text-yellow-700 mb-3">
            All distance calculations are logged to the browser console with detailed information including:
          </p>
          <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
            <li>User's current coordinates</li>
            <li>Business location coordinates (with source: Google/Fallback)</li>
            <li>Calculated distance and duration (with method used)</li>
            <li>Exact values in meters and seconds</li>
            <li>API errors and fallback attempts</li>
            <li>Step-by-step process information</li>
          </ul>
          <p className="text-yellow-700 text-sm mt-3">
            <strong>To view logs:</strong> Press F12 → Console tab → Perform a calculation
          </p>
        </div>

        {/* Error Handling Info */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            ⚠️ Common Issues & Solutions
          </h3>
          <div className="text-red-700 text-sm space-y-3">
            <div>
              <p><strong>Error: "REQUEST_DENIED"</strong></p>
              <p>Solution: API key needs proper permissions. The system will use fallback methods automatically.</p>
            </div>
            <div>
              <p><strong>Error: "OVER_QUERY_LIMIT"</strong></p>
              <p>Solution: API quota exceeded. Fallback methods will be used.</p>
            </div>
            <div>
              <p><strong>Error: Location permission denied</strong></p>
              <p>Solution: Allow location access in your browser settings.</p>
            </div>
            <div>
              <p><strong>Error: Invalid postal code</strong></p>
              <p>Solution: Try a different postal code format or use a known valid code.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistanceDemo; 