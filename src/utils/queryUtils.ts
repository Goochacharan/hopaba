
import { CategoryType } from '@/components/CategoryFilter';

export const processNaturalLanguageQuery = (
  lowercaseQuery: string,
  category: CategoryType
): { processedQuery: string; inferredCategory: CategoryType } => {
  let processedQuery = lowercaseQuery;
  let inferredCategory: CategoryType = category === 'all' ? 'all' : category;
  
  console.log('Original query:', `"${lowercaseQuery}"`);
  
  if (inferredCategory !== 'all') {
    console.log(`Using provided category: ${inferredCategory}`);
  } 
  else {
    // Normalize whitespace and line breaks
    const normalizedQuery = lowercaseQuery.replace(/\s+/g, ' ').trim();
    
    // Handle marketplace-specific categories and terms
    if (normalizedQuery.includes('car') || 
        normalizedQuery.includes('vehicle') || 
        normalizedQuery.includes('automobile') ||
        normalizedQuery.includes('suv') ||
        normalizedQuery.includes('hatchback') ||
        normalizedQuery.includes('sedan')) {
      inferredCategory = 'cars';
    } else if (normalizedQuery.includes('bike') || 
              normalizedQuery.includes('motorcycle') || 
              normalizedQuery.includes('scooter') ||
              normalizedQuery.includes('bullet') ||
              normalizedQuery.includes('ktm')) {
      inferredCategory = 'bikes';
    } else if (normalizedQuery.includes('mobile') || 
              normalizedQuery.includes('phone') || 
              normalizedQuery.includes('smartphone') ||
              normalizedQuery.includes('iphone') ||
              normalizedQuery.includes('android')) {
      inferredCategory = 'mobiles';
    } else if (normalizedQuery.includes('electronic') || 
              normalizedQuery.includes('laptop') || 
              normalizedQuery.includes('tv') ||
              normalizedQuery.includes('television') ||
              normalizedQuery.includes('computer')) {
      inferredCategory = 'electronics';
    } else if (normalizedQuery.includes('furniture') || 
              normalizedQuery.includes('sofa') || 
              normalizedQuery.includes('table') ||
              normalizedQuery.includes('chair') ||
              normalizedQuery.includes('bed')) {
      inferredCategory = 'furniture';
    } else if (normalizedQuery.includes('appliance') || 
              normalizedQuery.includes('refrigerator') || 
              normalizedQuery.includes('fridge') ||
              normalizedQuery.includes('washing machine') ||
              normalizedQuery.includes('microwave')) {
      inferredCategory = 'home_appliances';
    }
    
    // Regular categories
    if (normalizedQuery.includes('yoga')) {
      inferredCategory = 'fitness';
    } else if (normalizedQuery.includes('restaurant')) {
      inferredCategory = 'restaurants';
    } else if (normalizedQuery.includes('café') || normalizedQuery.includes('cafe') || normalizedQuery.includes('coffee')) {
      inferredCategory = 'cafes';
    } else if (normalizedQuery.includes('salon') || normalizedQuery.includes('haircut')) {
      inferredCategory = 'salons';
    } else if (normalizedQuery.includes('plumber')) {
      inferredCategory = 'services';
    } else if (normalizedQuery.includes('fitness') || normalizedQuery.includes('gym')) {
      inferredCategory = 'fitness';
    } else if (normalizedQuery.includes('biryani') || 
               normalizedQuery.includes('food') || 
               normalizedQuery.includes('dinner') || 
               normalizedQuery.includes('lunch') ||
               normalizedQuery.includes('breakfast')) {
      inferredCategory = 'restaurants';
    }
    
    // Check for car models or specific marketplace items
    const carModels = ['wrv', 'honda', 'maruti', 'suzuki', 'hyundai', 'toyota', 'bmw', 'audi', 'ford', 'tata', 'kia'];
    for (const model of carModels) {
      if (normalizedQuery.includes(model)) {
        inferredCategory = 'cars';
        break;
      }
    }
    
    // Extract year if present (for marketplace items with model years)
    const yearMatch = normalizedQuery.match(/\b(19|20)\d{2}\b/);
    if (yearMatch && yearMatch[0]) {
      console.log(`Detected year in query: ${yearMatch[0]}`);
      // Ensure year is included in processed query
      if (!processedQuery.includes(yearMatch[0])) {
        processedQuery = `${processedQuery} ${yearMatch[0]}`.trim();
      }
    }
  }
  
  console.log(`Processed query: "${processedQuery}", Inferred category: ${inferredCategory}`);
  return { processedQuery, inferredCategory };
};
