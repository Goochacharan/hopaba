import { useState, useEffect, useCallback, useMemo } from 'react';
import { CategoryType } from '@/components/CategoryFilter';
import { UseRecommendationsProps, FilterOptions, Event } from './types/recommendationTypes';
import { fetchServiceProviders, fetchEvents } from '@/services/recommendationService';
import { processNaturalLanguageQuery } from '@/utils/queryUtils';
import { Recommendation } from '@/lib/mockData';

// Cache for recommendations to avoid repeated API calls
const recommendationsCache = new Map<string, { data: Recommendation[]; timestamp: number }>();
const eventsCache = new Map<string, { data: Event[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Debounce utility
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const useRecommendations = ({ 
  initialQuery = '', 
  initialCategory = 'all',
  initialSubcategory = '',
  loadDefaultResults = false
}: UseRecommendationsProps = {}) => {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryType>(initialCategory);
  const [subcategory, setSubcategory] = useState<string>(initialSubcategory || '');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  // Memoize cache key generation
  const getCacheKey = useCallback((searchQuery: string, cat: string, subcat: string) => {
    return `${searchQuery}-${cat}-${subcat}`;
  }, []);

  // Check if cached data is still valid
  const isCacheValid = useCallback((timestamp: number) => {
    return Date.now() - timestamp < CACHE_DURATION;
  }, []);

  const filterRecommendations = useCallback((
    recs: Recommendation[],
    filterOptions: FilterOptions
  ): Recommendation[] => {
    const { distanceUnit = 'mi' } = filterOptions;
    
    return recs.filter(rec => {
      if (rec.rating < filterOptions.minRating) return false;
      if (filterOptions.openNow && !rec.openNow) return false;
      if (filterOptions.hiddenGem && !rec.isHiddenGem) return false;
      if (filterOptions.mustVisit && !rec.isMustVisit) return false;

      if (rec.distance) {
        const distanceValue = parseFloat(rec.distance.split(' ')[0]);
        if (!isNaN(distanceValue)) {
          const adjustedDistance = distanceUnit === 'km' ? distanceValue : distanceValue * 1.60934;
          if (adjustedDistance > filterOptions.maxDistance) return false;
        }
      }

      if (rec.priceLevel) {
        const priceCount = rec.priceLevel.length;
        if (priceCount > filterOptions.priceLevel) return false;
      }

      return true;
    });
  }, []);

  const handleSearch = useCallback((searchQuery: string) => {
    // Normalize input query to handle multi-line input and extra whitespace
    const normalizedQuery = searchQuery.replace(/\s+/g, ' ').trim();
    setQuery(normalizedQuery);
    console.log("useRecommendations - handleSearch called with:", normalizedQuery);
  }, []);

  const handleCategoryChange = useCallback((newCategory: CategoryType) => {
    setCategory(newCategory);
    setSubcategory(''); // Reset subcategory when category changes
    console.log("useRecommendations - handleCategoryChange called with:", newCategory);
  }, []);

  const handleSubcategoryChange = useCallback((newSubcategory: string) => {
    setSubcategory(newSubcategory);
    console.log("useRecommendations - handleSubcategoryChange called with:", newSubcategory);
  }, []);

  // Optimized fetch function with caching and batching
  const fetchRecommendations = useCallback(async () => {
    const cacheKey = getCacheKey(debouncedQuery, category, subcategory);
    
    // Check cache first
    const cachedRecommendations = recommendationsCache.get(cacheKey);
    const cachedEvents = eventsCache.get(cacheKey);
    
    if (cachedRecommendations && isCacheValid(cachedRecommendations.timestamp)) {
      console.log("Using cached recommendations for:", cacheKey);
      setRecommendations(cachedRecommendations.data);
      if (cachedEvents && isCacheValid(cachedEvents.timestamp)) {
        setEvents(cachedEvents.data);
      }
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Batch API calls for better performance
      const promises: Promise<any>[] = [];
      
      if (debouncedQuery) {
        console.log("useRecommendations - Fetching with query:", debouncedQuery, "category:", category, "subcategory:", subcategory);
        const { processedQuery, inferredCategory } = processNaturalLanguageQuery(debouncedQuery.toLowerCase(), category);
        const effectiveCategory = inferredCategory;
        
        promises.push(fetchServiceProviders(processedQuery, effectiveCategory, subcategory));
        promises.push(fetchEvents(processedQuery));
      } 
      else if (loadDefaultResults) {
        console.log("useRecommendations - Loading default results for category:", category, "subcategory:", subcategory);
        promises.push(fetchServiceProviders('', category, subcategory));
        promises.push(fetchEvents(''));
      } else {
        // No query and no default results needed
        setRecommendations([]);
        setEvents([]);
        setLoading(false);
        return;
      }
      
      // Execute all promises in parallel
      const [serviceProviders, eventsData] = await Promise.all(promises);
      
      // Cache the results
      recommendationsCache.set(cacheKey, { data: serviceProviders, timestamp: Date.now() });
      eventsCache.set(cacheKey, { data: eventsData, timestamp: Date.now() });
      
      setRecommendations(serviceProviders);
      setEvents(eventsData);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, category, subcategory, loadDefaultResults, getCacheKey, isCacheValid]);

  // Use effect with optimized dependencies
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    query,
    setQuery,
    category,
    setCategory,
    subcategory,
    setSubcategory,
    recommendations,
    events,
    loading,
    error,
    filterRecommendations,
    handleSearch,
    handleCategoryChange,
    handleSubcategoryChange
  }), [
    query,
    category,
    subcategory,
    recommendations,
    events,
    loading,
    error,
    filterRecommendations,
    handleSearch,
    handleCategoryChange,
    handleSubcategoryChange
  ]);
};

export default useRecommendations;
