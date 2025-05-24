import { distanceService, type DistanceResult } from '../services/distanceService';

/**
 * Calculate and log the distance between user location and a business postal code
 * @param businessPostalCode - The postal code of the business
 * @returns Promise<DistanceResult> - The distance calculation result
 */
export async function calculateAndLogDistance(businessPostalCode: string): Promise<DistanceResult | null> {
  try {
    console.log('🚀 Starting distance calculation...');
    console.log(`🏢 Business postal code: ${businessPostalCode}`);
    
    const result = await distanceService.calculateDistanceToPostalCode(businessPostalCode);
    
    // Additional detailed logging
    console.log('📋 DISTANCE CALCULATION SUMMARY:');
    console.log('================================');
    console.log(`🎯 Business Postal Code: ${businessPostalCode}`);
    console.log(`📏 Distance: ${result.distance}`);
    console.log(`⏱️ Estimated Travel Time: ${result.duration}`);
    console.log(`📊 Exact Distance: ${result.distanceValue} meters (${(result.distanceValue / 1000).toFixed(2)} km)`);
    console.log(`📊 Exact Duration: ${result.durationValue} seconds (${(result.durationValue / 60).toFixed(1)} minutes)`);
    console.log('================================');
    
    return result;
  } catch (error) {
    console.error('❌ Failed to calculate distance:', error);
    
    // Provide specific troubleshooting based on error type
    if (error instanceof Error) {
      if (error.message.includes('API Key Error')) {
        console.error('🔧 API KEY ISSUE DETECTED:');
        console.error('   1. Check Google Cloud Console API permissions');
        console.error('   2. Enable Geocoding API and Distance Matrix API');
        console.error('   3. Verify billing is set up');
        console.error('   4. Check API restrictions (domains, IPs)');
        console.error('   5. The system will try fallback methods automatically');
      } else if (error.message.includes('Geolocation error')) {
        console.error('📍 LOCATION ACCESS ISSUE:');
        console.error('   1. Allow location access in your browser');
        console.error('   2. Check browser location settings');
        console.error('   3. Ensure you\'re on HTTPS (required for geolocation)');
      } else if (error.message.includes('Unable to geocode')) {
        console.error('🗺️ POSTAL CODE ISSUE:');
        console.error('   1. Verify the postal code format is correct');
        console.error('   2. Try a different postal code');
        console.error('   3. Check if the postal code exists');
      } else {
        console.error('💡 GENERAL TROUBLESHOOTING:');
        console.error('   1. Check your internet connection');
        console.error('   2. Try refreshing the page');
        console.error('   3. Check browser console for more details');
      }
    }
    
    console.error('💡 FALLBACK METHODS AVAILABLE:');
    console.error('   - OpenStreetMap geocoding (free alternative)');
    console.error('   - Straight-line distance calculation');
    console.error('   - Estimated driving times');
    
    return null;
  }
}

/**
 * Example function to demonstrate multiple distance calculations
 * @param postalCodes - Array of postal codes to calculate distances to
 */
export async function calculateMultipleDistances(postalCodes: string[]): Promise<void> {
  console.log('🔄 Calculating distances to multiple locations...');
  console.log(`📊 Total locations: ${postalCodes.length}`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < postalCodes.length; i++) {
    const postalCode = postalCodes[i];
    console.log(`\n📍 Calculating distance ${i + 1}/${postalCodes.length} to ${postalCode}...`);
    
    const result = await calculateAndLogDistance(postalCode);
    
    if (result) {
      successCount++;
      console.log(`✅ Success for ${postalCode}`);
    } else {
      failureCount++;
      console.log(`❌ Failed for ${postalCode}`);
    }
    
    // Add a small delay between requests to be respectful to the API
    if (i < postalCodes.length - 1) {
      console.log('⏳ Waiting 1 second before next calculation...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n📊 BATCH CALCULATION SUMMARY:');
  console.log('============================');
  console.log(`✅ Successful: ${successCount}/${postalCodes.length}`);
  console.log(`❌ Failed: ${failureCount}/${postalCodes.length}`);
  console.log(`📈 Success Rate: ${((successCount / postalCodes.length) * 100).toFixed(1)}%`);
  console.log('============================');
}

/**
 * Quick test function to demonstrate the distance calculation
 * You can call this function from anywhere in your app to test
 */
export async function testDistanceCalculation(): Promise<void> {
  console.log('🧪 Testing distance calculation...');
  console.log('🔬 This will test both Google APIs and fallback methods');
  
  // Example postal codes from different countries
  const testPostalCodes = [
    '10001',   // New York, NY, USA
    '90210',   // Beverly Hills, CA, USA
    '560001',  // Bangalore, India
    'M5V 3A8', // Toronto, ON, Canada
    'SW1A 1AA' // London, UK
  ];
  
  console.log(`📋 Test postal codes: ${testPostalCodes.join(', ')}`);
  
  // Test with a single postal code first
  console.log('\n🔬 Single distance test:');
  const result = await calculateAndLogDistance(testPostalCodes[0]);
  
  if (result) {
    console.log('✅ Single test completed successfully!');
    console.log('🎯 You can now try other postal codes or run batch tests');
  } else {
    console.log('⚠️ Single test failed, but fallback methods were attempted');
    console.log('🔧 Check the error messages above for troubleshooting');
  }
  
  // Uncomment the line below to test multiple distances
  // console.log('\n🔄 Running batch test...');
  // await calculateMultipleDistances(testPostalCodes.slice(0, 3)); // Test first 3 only
}

/**
 * Test function specifically for API troubleshooting
 */
export async function testAPIConnectivity(): Promise<void> {
  console.log('🔧 Testing API connectivity...');
  
  try {
    // Test user location first
    console.log('1️⃣ Testing geolocation...');
    const userLocation = await distanceService.getUserLocation();
    console.log('✅ Geolocation working:', userLocation);
    
    // Test Google Geocoding API
    console.log('2️⃣ Testing Google Geocoding API...');
    try {
      const location = await distanceService.getCoordinatesFromPostalCode('10001');
      console.log('✅ Google Geocoding working:', location);
    } catch (error) {
      console.log('❌ Google Geocoding failed:', error);
      
      // Test fallback geocoding
      console.log('3️⃣ Testing fallback geocoding...');
      try {
        const fallbackLocation = await distanceService.getCoordinatesFromPostalCodeFallback('10001');
        console.log('✅ Fallback geocoding working:', fallbackLocation);
      } catch (fallbackError) {
        console.log('❌ Fallback geocoding failed:', fallbackError);
      }
    }
    
    console.log('🏁 API connectivity test completed');
    
  } catch (error) {
    console.error('❌ API connectivity test failed:', error);
  }
}

// Export the distance service for direct use if needed
export { distanceService }; 