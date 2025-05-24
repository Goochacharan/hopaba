
import { useState, useEffect } from 'react';
import { CategoryType } from '@/components/CategoryFilter';
import { UseRecommendationsProps, FilterOptions, Event } from './types/recommendationTypes';
import { fetchServiceProviders, fetchEvents } from '@/services/recommendationService';
import { processNaturalLanguageQuery } from '@/utils/queryUtils';
import { Recommendation } from '@/lib/mockData';

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

  const filterRecommendations = (
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
  };

  const handleSearch = (searchQuery: string) => {
    // Normalize input query to handle multi-line input and extra whitespace
    const normalizedQuery = searchQuery.replace(/\s+/g, ' ').trim();
    setQuery(normalizedQuery);
    console.log("useRecommendations - handleSearch called with:", normalizedQuery);
  };

  const handleCategoryChange = (newCategory: CategoryType) => {
    setCategory(newCategory);
    setSubcategory(''); // Reset subcategory when category changes
    console.log("useRecommendations - handleCategoryChange called with:", newCategory);
  };

  const handleSubcategoryChange = (newSubcategory: string) => {
    setSubcategory(newSubcategory);
    console.log("useRecommendations - handleSubcategoryChange called with:", newSubcategory);
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (query) {
          console.log("useRecommendations - Fetching with query:", query, "category:", category, "subcategory:", subcategory);
          const { processedQuery, inferredCategory } = processNaturalLanguageQuery(query.toLowerCase(), category);
          const effectiveCategory = inferredCategory;
          const serviceProviders = await fetchServiceProviders(processedQuery, effectiveCategory, subcategory);
          setRecommendations(serviceProviders);
          const eventsData = await fetchEvents(processedQuery);
          setEvents(eventsData);
        } 
        else if (loadDefaultResults) {
          console.log("useRecommendations - Loading default results for category:", category, "subcategory:", subcategory);
          const serviceProviders = await fetchServiceProviders('', category, subcategory);
          setRecommendations(serviceProviders);
          const eventsData = await fetchEvents('');
          setEvents(eventsData);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch recommendations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [query, category, subcategory, loadDefaultResults]);

  return {
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
  };
};

export default useRecommendations;
