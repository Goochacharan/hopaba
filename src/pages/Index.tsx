
import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';
import AnimatedLogo from '@/components/AnimatedLogo';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import CategoryScrollBar from '@/components/business/CategoryScrollBar';

const queryCategoryMap = {
  "Find me a cozy café nearby": "cafes",
  "Looking for a Kannada-speaking actor": "entertainment",
  "Best electrician in Jayanagar": "services",
  "Where can I buy a pre-owned bike?": "shopping",
  "Recommend a good Italian restaurant": "restaurants",
  "Find a flower shop in Koramangala": "shopping",
  "Best dance classes for kids": "education",
  "Need a plumber for water leak": "services",
  "Bookstores with rare collections": "shopping",
  "Top rated hair salon near me": "salons",
  "Auto repair shops open on Sunday": "services",
  "Pet-friendly cafes in Indiranagar": "cafes",
  "Yoga classes for beginners": "fitness",
  "Wedding photographers with good reviews": "services",
  "Where to buy organic vegetables": "shopping",
  "Best dentists that accept insurance": "health",
  "Computer repair services near me": "services",
  "Piano teachers for adults": "education",
  "Tailors who can alter ethnic wear": "services",
  "Schools with good sports programs": "education"
};

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isEnhancing, setIsEnhancing] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");

  const exampleQueries = [
    {
      text: "Find me a cozy café nearby",
      icon: "☕"
    },
    {
      text: "Looking for a Kannada-speaking actor",
      icon: "🎭"
    },
    {
      text: "Best electrician in Jayanagar",
      icon: "⚡"
    },
    {
      text: "Where can I buy a pre-owned bike?",
      icon: "🏍️"
    },
    {
      text: "Recommend a good Italian restaurant",
      icon: "🍕"
    },
    {
      text: "Find a flower shop in Koramangala",
      icon: "🌸"
    },
    {
      text: "Best dance classes for kids",
      icon: "💃"
    },
    {
      text: "Need a plumber for water leak",
      icon: "🔧"
    },
    {
      text: "Bookstores with rare collections",
      icon: "📚"
    },
    {
      text: "Top rated hair salon near me",
      icon: "💇"
    },
    {
      text: "Auto repair shops open on Sunday",
      icon: "🔧"
    },
    {
      text: "Pet-friendly cafes in Indiranagar",
      icon: "🐶"
    },
    {
      text: "Yoga classes for beginners",
      icon: "🧘"
    },
    {
      text: "Wedding photographers with good reviews",
      icon: "📸"
    },
    {
      text: "Where to buy organic vegetables",
      icon: "🥦"
    },
    {
      text: "Best dentists that accept insurance",
      icon: "🦷"
    },
    {
      text: "Computer repair services near me",
      icon: "💻"
    },
    {
      text: "Piano teachers for adults",
      icon: "🎹"
    },
    {
      text: "Tailors who can alter ethnic wear",
      icon: "👔"
    },
    {
      text: "Schools with good sports programs",
      icon: "🏫"
    }
  ];

  const enhanceSearchQuery = async (rawQuery: string) => {
    if (!rawQuery.trim()) return rawQuery;
    setIsEnhancing(rawQuery);
    try {
      const categoryHint = queryCategoryMap[rawQuery] || "";
      const {
        data,
        error
      } = await supabase.functions.invoke('enhance-search', {
        body: {
          query: rawQuery,
          context: categoryHint ? `Category: ${categoryHint}` : undefined
        }
      });
      if (error) {
        console.error('Error enhancing search:', error);
        return rawQuery;
      }
      console.log('AI enhanced search:', data);
      if (data.enhanced && data.enhanced !== rawQuery) {
        toast({
          title: "Search enhanced with AI",
          description: `We improved your search to: "${data.enhanced}"`,
          duration: 5000
        });
        return data.enhanced;
      }
      return rawQuery;
    } catch (err) {
      console.error('Failed to enhance search:', err);
      return rawQuery;
    } finally {
      setIsEnhancing(null);
    }
  };

  const handleSearch = async (query: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (query.trim()) {
      try {
        const enhancedQuery = await enhanceSearchQuery(query);

        const categoryHint = queryCategoryMap[query] || selectedCategory !== "all" ? selectedCategory : "";

        setTimeout(() => {
          const searchParams = new URLSearchParams();
          searchParams.set('q', enhancedQuery);
          if (categoryHint) {
            searchParams.set('category', categoryHint);
          }
          if (selectedSubcategory) {
            searchParams.set('subcategory', selectedSubcategory);
          }
          navigate(`/search?${searchParams.toString()}`);
        }, 100);
      } catch (error) {
        console.error('Search error:', error);
        navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory(""); // Reset subcategory when category changes
  };

  const handleSubcategorySelect = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    
    if (subcategory) {
      // Navigate immediately when a subcategory is selected
      const searchParams = new URLSearchParams();
      searchParams.set('category', selectedCategory);
      searchParams.set('subcategory', subcategory);
      navigate(`/search?${searchParams.toString()}`);
    }
  };

  return (
    <MainLayout>
      <section className="flex flex-col items-center justify-center pt-0 pb-0 mx-[5px] px-0">
        <div className="text-center mb-1 animate-fade-in">
          <AnimatedLogo size="lg" className="mx-auto mb-1" />
          <h1 className="text-3xl sm:text-4xl font-medium tracking-tight">Hopaba</h1>
        </div>
        <div className="w-full max-w-2xl mx-auto">
          <ScrollArea className="h-[calc(100vh-180px)] w-full px-1 pb-0">
            <CategoryScrollBar
              selected={selectedCategory}
              onSelect={handleCategorySelect}
              className="mb-2"
              selectedSubcategory={selectedSubcategory}
              onSubcategorySelect={handleSubcategorySelect}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 pr-4">
              {exampleQueries.map((example, idx) => (
                <Button 
                  key={idx} 
                  variant="outline" 
                  onClick={() => handleSearch(example.text)} 
                  className="justify-start h-auto border-border/50 text-left px-[17px] py-1.5 rounded-md text-neutral-900 bg-pink-300 hover:bg-pink-200 overflow-hidden" 
                  disabled={isEnhancing === example.text}
                >
                  <div className="mr-3 text-base">{example.icon}</div>
                  <span className="font-normal text-sm sm:text-base truncate">{example.text}</span>
                  {isEnhancing === example.text && <Sparkles className="h-4 w-4 ml-2 animate-pulse" />}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
