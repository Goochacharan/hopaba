
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface PaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

export function usePaginatedQuery<T>({ initialPage = 1, pageSize = 10 }: PaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const handleError = (err: any) => {
    console.error('Query error:', err);
    const errorMessage = err?.message || 'An error occurred while fetching data';
    setError(errorMessage);
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  return {
    page,
    setPage,
    isLoading,
    setIsLoading,
    error,
    setError,
    hasMore,
    setHasMore,
    handleError,
    pageSize
  };
}
