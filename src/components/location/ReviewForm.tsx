
import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Award, Gem, Star } from 'lucide-react';
import { Form, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { supabase } from '@/integrations/supabase/client';
import RatingCriteriaSlider from './RatingCriteriaSlider';
import { ReviewCriterion, CriteriaRatings } from '@/types/reviewTypes';

const baseReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  isMustVisit: z.boolean().default(false),
  isHiddenGem: z.boolean().default(false),
  criteriaRatings: z.record(z.number().min(1).max(10)).default({})
});

export type ReviewFormValues = z.infer<typeof baseReviewSchema> & {
  reviewId?: string;
};

interface ReviewFormProps {
  onSubmit: (values: ReviewFormValues) => void;
  onCancel: () => void;
  locationName?: string;
  category?: string;
  initialValues?: Partial<ReviewFormValues>;
  isEditMode?: boolean;
}

const ReviewForm = ({
  onSubmit,
  onCancel,
  locationName,
  category = '',
  initialValues,
  isEditMode = false
}: ReviewFormProps) => {
  const [selectedRating, setSelectedRating] = useState<number>(initialValues?.rating || 0);
  const [criteria, setCriteria] = useState<ReviewCriterion[]>([]);
  const [criteriaRatings, setCriteriaRatings] = useState<CriteriaRatings>(initialValues?.criteriaRatings || {});

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(baseReviewSchema),
    defaultValues: {
      rating: initialValues?.rating ?? 0,
      isMustVisit: initialValues?.isMustVisit ?? false,
      isHiddenGem: initialValues?.isHiddenGem ?? false,
      criteriaRatings: initialValues?.criteriaRatings ?? {}
    }
  });

  useEffect(() => {
    const fetchCriteria = async () => {
      if (!category) return;

      try {
        const { data, error } = await supabase
          .from('review_criteria')
          .select('*')
          .eq('category', category)
          .order('name');

        if (error) throw error;

        setCriteria(data);

        const initial = { ...criteriaRatings };
        data?.forEach(criterion => {
          if (!(criterion.id in initial)) {
            initial[criterion.id] = 5;
          }
        });

        setCriteriaRatings(initial);
        form.setValue('criteriaRatings', initial);
      } catch (err) {
        console.error('Error fetching review criteria:', err);
      }
    };

    fetchCriteria();
    // Only run when category changes!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    // Whenever initialValues changes (when entering edit mode), update form and state
    if (initialValues) {
      setSelectedRating(initialValues.rating || 0);
      setCriteriaRatings(initialValues.criteriaRatings || {});
      form.reset({
        rating: initialValues.rating ?? 0,
        isMustVisit: initialValues.isMustVisit ?? false,
        isHiddenGem: initialValues.isHiddenGem ?? false,
        criteriaRatings: initialValues.criteriaRatings ?? {}
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const handleRatingSelect = (rating: number) => {
    setSelectedRating(rating);
    form.setValue("rating", rating);
  };

  const handleCriterionRatingChange = (criterionId: string, value: number) => {
    const newRatings = { ...criteriaRatings, [criterionId]: value };
    setCriteriaRatings(newRatings);
    form.setValue('criteriaRatings', newRatings);
  };

  const handleFormSubmit = (values: ReviewFormValues) => {
    values.criteriaRatings = criteriaRatings;
    onSubmit(values);
  };

  return (
    <div className="mb-6 p-4 bg-secondary/30 rounded-lg px-[9px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {locationName && (
            <div className="text-sm font-medium text-muted-foreground mb-2">
              {isEditMode ? "Editing review for: " : "Reviewing: "} 
              {locationName} {category ? `(${category})` : ''}
            </div>
          )}

          <div className="space-y-2">
            <FormLabel>Overall rating</FormLabel>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(rating => (
                <button key={rating} type="button" onClick={() => handleRatingSelect(rating)} className="focus:outline-none">
                  <Star className={`w-6 h-6 ${rating <= selectedRating ? "text-amber-500 fill-amber-500" : "text-gray-300"}`} />
                </button>
              ))}
              {form.formState.errors.rating && (
                <p className="text-destructive text-xs ml-2">Please select a rating</p>
              )}
            </div>
          </div>

          {criteria.length > 0 && (
            <div className="py-4 border-t border-b">
              <h3 className="text-sm font-medium mb-4">Rate specific aspects:</h3>
              {criteria.map(criterion => (
                <RatingCriteriaSlider
                  key={criterion.id}
                  criterionName={criterion.name}
                  value={criteriaRatings[criterion.id] || 5}
                  onChange={(value) => handleCriterionRatingChange(criterion.id, value)}
                />
              ))}
            </div>
          )}

          <div className="flex gap-4 mt-4">
            <FormField control={form.control} name="isMustVisit" render={({ field }) => (
              <FormItem className="flex-1">
                <Toggle pressed={field.value} onPressedChange={field.onChange} className={`w-full h-12 gap-2 ${field.value ? 'bg-green-500 text-white border-green-600 shadow-[0_4px_0px_0px_rgba(22,163,74,0.5)]' : ''}`}>
                  <Award className={`h-5 w-5 ${field.value ? 'text-white' : ''}`} />
                  <span className="font-medium">Must Visit</span>
                </Toggle>
              </FormItem>
            )} />

            <FormField control={form.control} name="isHiddenGem" render={({ field }) => (
              <FormItem className="flex-1">
                <Toggle pressed={field.value} onPressedChange={field.onChange} className={`w-full h-12 gap-2 ${field.value ? 'bg-purple-500 text-white border-purple-600 shadow-[0_4px_0px_0px_rgba(147,51,234,0.5)]' : ''}`}>
                  <Gem className={`h-5 w-5 ${field.value ? 'text-white' : ''}`} />
                  <span className="font-medium">Hidden Gem</span>
                </Toggle>
              </FormItem>
            )} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditMode ? "Update review" : "Submit review"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ReviewForm;
